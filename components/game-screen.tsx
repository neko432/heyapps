"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Volume2, VolumeX } from "lucide-react"
import { checkRomaji, completedReadingCount } from "@/lib/romaji"
import { formatTime } from "@/lib/types"
import type { AnsweredItem, GameConfig, GameResult, QuestionResult } from "@/lib/types"
import { buildQuestions, shuffle, type Question } from "@/lib/quiz-data"
import { sound } from "@/lib/sound"
import { getSoundEnabled, setSoundEnabled } from "@/lib/storage"
import { PopButton } from "./pop-button"
import { AiChat } from "./ai-chat"

interface Props {
  config: GameConfig
  onFinish: (result: GameResult) => void
  onQuit: () => void
}

export function GameScreen({ config, onFinish, onQuit }: Props) {
  const questions = useMemo<Question[]>(
    () => shuffle(buildQuestions(config.category, config.direction)),
    [config],
  )

  const [index, setIndex] = useState(0)
  const [typed, setTyped] = useState("")
  const [hintLevel, setHintLevel] = useState(0)
  const [usedHint, setUsedHint] = useState(false)
  const [paused, setPaused] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [showQuitConfirm, setShowQuitConfirm] = useState(false)
  const [wrong, setWrong] = useState(false)
  const [now, setNow] = useState(() => (typeof performance !== "undefined" ? performance.now() : 0))
  const [answered, setAnswered] = useState<AnsweredItem[]>([])
  const [muted, setMuted] = useState(false)
  // Confetti-style bursts fired when a question is cleared.
  const [bursts, setBursts] = useState<number[]>([])

  // Source of truth for typed input. Updated synchronously on every keystroke so
  // rapid typing can't drop characters to a stale React state value.
  const typedRef = useRef("")

  const results = useRef<QuestionResult[]>([])
  const startRef = useRef<number>(performance.now())
  const qStartRef = useRef<number>(performance.now())
  const pausedAccRef = useRef<number>(0)
  const pauseStartRef = useRef<number>(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const current = questions[index]
  const overlayOpen = paused || showChat || showQuitConfirm

  // How many answer characters the player has ALREADY typed correctly.
  // Used to tint those hint tiles a different color so progress is obvious.
  const completed = useMemo(() => {
    if (!current) return 0
    if (current.mode === "romaji" && current.reading) {
      return completedReadingCount(current.reading, typed)
    }
    return typed.length
  }, [current, typed])

  // Load the saved sound preference and unlock the audio context.
  useEffect(() => {
    const on = getSoundEnabled()
    setMuted(!on)
    sound.setEnabled(on)
    sound.resume()
  }, [])

  const toggleMute = useCallback(() => {
    setMuted((m) => {
      const next = !m
      sound.setEnabled(!next)
      setSoundEnabled(!next)
      if (!next) {
        sound.resume()
        sound.hint()
      }
      return next
    })
  }, [])

  // Ticking timer for the total elapsed display.
  useEffect(() => {
    if (paused) return
    let raf: number
    const tick = () => {
      setNow(performance.now())
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [paused])

  // Keep focus on the hidden input while playing.
  useEffect(() => {
    if (!overlayOpen) inputRef.current?.focus()
  }, [overlayOpen, index])

  const elapsed = now - startRef.current - pausedAccRef.current

  const pause = useCallback(() => {
    setPaused((p) => {
      if (p) return p
      pauseStartRef.current = performance.now()
      return true
    })
  }, [])

  const resume = useCallback(() => {
    setPaused((p) => {
      if (!p) return p
      const delta = performance.now() - pauseStartRef.current
      pausedAccRef.current += delta
      qStartRef.current += delta
      return false
    })
    setShowChat(false)
    setShowQuitConfirm(false)
  }, [])

  // ESC toggles pause / returns to pause screen from sub-panels.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Escape") return
      e.preventDefault()
      if (showChat || showQuitConfirm) {
        setShowChat(false)
        setShowQuitConfirm(false)
        return
      }
      if (paused) resume()
      else pause()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [paused, showChat, showQuitConfirm, pause, resume])

  const advance = useCallback(
    (q: Question, hinted: boolean) => {
      results.current.push({
        id: q.id,
        prompt: q.prompt,
        answerDisplay: q.answerDisplay,
        ms: performance.now() - qStartRef.current,
        usedHint: hinted,
      })
      setAnswered((prev) => [
        ...prev,
        { prompt: q.prompt, answerDisplay: q.answerDisplay, usedHint: hinted, category: config.category },
      ])
      if (index + 1 >= questions.length) {
        const rs = results.current
        let slowest = rs[0]
        for (const r of rs) if (r.ms > slowest.ms) slowest = r
        onFinish({
          ...config,
          totalMs: performance.now() - startRef.current - pausedAccRef.current,
          results: rs,
          slowestPrompt: slowest.prompt,
          slowestMs: slowest.ms,
        })
        return
      }
      setIndex((i) => i + 1)
      typedRef.current = ""
      setTyped("")
      setHintLevel(0)
      setUsedHint(false)
      qStartRef.current = performance.now()
    },
    [index, questions.length, config, onFinish],
  )

  const wrongTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const triggerWrong = useCallback(() => {
    setWrong(true)
    sound.wrong()
    clearTimeout(wrongTimer.current)
    wrongTimer.current = setTimeout(() => setWrong(false), 300)
  }, [])

  // Play the clear sound and fire a short confetti burst over the card.
  const celebrate = useCallback(() => {
    sound.correct()
    const id = performance.now()
    setBursts((b) => [...b, id])
    setTimeout(() => setBursts((b) => b.filter((x) => x !== id)), 800)
  }, [])

  // Commit a new typed value: update the ref (synchronous truth) + state (render).
  const commit = useCallback((value: string) => {
    typedRef.current = value
    setTyped(value)
  }, [])

  // Evaluate a candidate value produced by appending one character.
  const evaluate = useCallback(
    (value: string) => {
      if (!current) return
      if (current.mode === "romaji" && current.reading) {
        const res = checkRomaji(current.reading, value)
        if (res === "match") {
          celebrate()
          return advance(current, usedHint)
        }
        if (res === "no") return triggerWrong()
        sound.key()
        commit(value)
      } else {
        const target = (current.ascii ?? "").toLowerCase()
        const v = value.toLowerCase()
        if (v === target) {
          celebrate()
          return advance(current, usedHint)
        }
        if (!target.startsWith(v)) return triggerWrong()
        sound.key()
        commit(value)
      }
    },
    [current, advance, triggerWrong, usedHint, commit, celebrate],
  )

  // Resolve the intended Latin character for a key event. Uses e.key normally
  // (respects the keyboard layout), but falls back to the physical e.code when a
  // Japanese IME is composing (keyCode 229) so kana-mode input can't corrupt it.
  function charFromEvent(e: React.KeyboardEvent<HTMLInputElement>): string | null {
    const composing = e.nativeEvent.isComposing || e.keyCode === 229
    if (!composing && e.key && e.key.length === 1) {
      return e.key
    }
    const code = e.code
    if (/^Key[A-Z]$/.test(code)) return code.slice(3).toLowerCase()
    if (/^Digit[0-9]$/.test(code)) return code.slice(5)
    if (/^Numpad[0-9]$/.test(code)) return code.slice(6)
    if (code === "Minus" || code === "NumpadSubtract") return "-"
    if (code === "NumpadAdd") return "+"
    if (code === "Equal" && e.shiftKey) return "+"
    return null
  }

  // All typing is handled here (not via input onChange) so it is immune to IME
  // composition and controlled-input lag under fast typing.
  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (overlayOpen) return
    // Let browser/OS shortcuts through untouched.
    if (e.metaKey || e.ctrlKey || e.altKey) return

    if (e.key === "Enter") {
      e.preventDefault()
      // Reveal the character AFTER what the player has already typed correctly.
      const completed =
        current.mode === "romaji" && current.reading
          ? completedReadingCount(current.reading, typedRef.current)
          : typedRef.current.length
      setUsedHint(true)
      setHintLevel((l) => Math.min(Math.max(l + 1, completed + 1), current.answerChars.length))
      sound.hint()
      return
    }

    if (e.key === "Backspace") {
      e.preventDefault()
      commit(typedRef.current.slice(0, -1))
      return
    }

    const ch = charFromEvent(e)
    if (ch == null) return
    e.preventDefault()
    evaluate(typedRef.current + ch)
  }

  if (!current) return null

  const progress = (index / questions.length) * 100

  return (
    <div className="relative mx-auto flex min-h-dvh max-w-2xl flex-col px-5 py-6">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-3">
        <div className="rounded-full border-2 border-border bg-secondary px-4 py-2 font-mono text-base font-bold tabular-nums text-secondary-foreground shadow-pop">
          {formatTime(elapsed)}
        </div>
        <div className="rounded-full border-2 border-border bg-card px-4 py-2 text-sm font-bold shadow-pop">
          {index + 1}/{questions.length}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleMute}
            className="pop-tap grid size-10 place-items-center rounded-full border-2 border-border bg-card shadow-pop"
            aria-label={muted ? "音を鳴らす" : "音を消す"}
            aria-pressed={muted}
          >
            {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
          </button>
          <button
            onClick={pause}
            className="pop-tap rounded-full border-2 border-border bg-card px-4 py-2 text-sm font-bold shadow-pop"
            aria-label="一時停止 (ESC)"
          >
            ⏸ ESC
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-4 h-3 overflow-hidden rounded-full border-2 border-border bg-muted">
        <motion.div
          className="h-full rounded-full bg-primary"
          animate={{ width: `${progress}%` }}
          transition={{ type: "spring", stiffness: 120, damping: 20 }}
        />
      </div>

      {/* Prompt */}
      <div className="relative flex flex-1 flex-col items-center justify-center">
        {/* Celebration confetti burst layer, centered on the card. */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
          {bursts.map((id) => (
            <Burst key={id} />
          ))}
        </div>
        <p className="mb-4 text-center text-base font-bold text-muted-foreground">{current.promptLabel}</p>
        <AnimatePresence mode="popLayout">
          <motion.div
            key={current.id}
            initial={{ scale: 0.6, opacity: 0, y: 24 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.6, opacity: 0, y: -24 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className={`flex min-h-[9rem] items-center justify-center rounded-3xl border-4 border-border bg-card px-8 py-6 shadow-popLg ${
              wrong ? "animate-shake border-destructive" : ""
            }`}
          >
            <span className="text-balance text-center text-6xl font-black leading-tight text-card-foreground sm:text-7xl">
              {current.prompt}
            </span>
          </motion.div>
        </AnimatePresence>

        {/* Typed echo */}
        <div className="mt-6 flex min-h-[2.5rem] items-center justify-center">
          <span
            className={`font-mono text-2xl font-bold tracking-wide ${wrong ? "text-destructive" : typed ? "text-primary" : "text-muted-foreground"}`}
          >
            {typed || <span className="text-muted-foreground opacity-50">ここに入力…</span>}
            <span className="ml-0.5 inline-block h-6 w-[3px] animate-blink bg-primary align-middle" />
          </span>
        </div>

        {/* Hint */}
        <AnimatePresence>
          {hintLevel > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-4 flex flex-wrap items-center justify-center gap-1"
            >
              {current.answerChars.map((c, i) => {
                const isTyped = i < completed
                const isRevealed = isTyped || i < hintLevel
                const style = isTyped
                  ? "border-primary/50 bg-primary/15 text-primary" // already typed → tinted
                  : isRevealed
                    ? "border-border bg-accent text-accent-foreground" // hint reveal
                    : "border-border bg-muted text-transparent" // still hidden
                return (
                  <motion.span
                    key={i}
                    initial={isTyped ? { scale: 0.6 } : false}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 18 }}
                    className={`flex h-10 min-w-9 items-center justify-center rounded-lg border-2 px-1 text-lg font-bold ${style}`}
                  >
                    {isRevealed ? c : "?"}
                  </motion.span>
                )
              })}
            </motion.div>
          )}
        </AnimatePresence>

        <p className="mt-5 text-center text-xs font-bold text-muted-foreground">
          Enterキーで答えを1文字ずつヒント表示
        </p>
      </div>

      {/* Hidden input captures keystrokes */}
      <input
        ref={inputRef}
        value=""
        readOnly
        onKeyDown={handleKeyDown}
        onBlur={() => {
          if (!overlayOpen) setTimeout(() => inputRef.current?.focus(), 0)
        }}
        className="pointer-events-none absolute h-0 w-0 opacity-0"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        aria-hidden
      />

      {/* Pause overlay */}
      <AnimatePresence>
        {paused && !showChat && !showQuitConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-20 flex items-center justify-center bg-background/85 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.7, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.7, y: 20 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              className="flex w-72 flex-col gap-3 rounded-3xl border-4 border-border bg-card p-6 shadow-popLg"
            >
              <h2 className="text-center text-2xl font-black">ポーズ中</h2>
              <p className="text-center text-xs font-bold text-muted-foreground">タイマーは止まっています</p>
              <PopButton onClick={resume}>▶ 再開する</PopButton>
              <PopButton variant="teal" onClick={() => setShowChat(true)}>
                🤖 AIに質問する
              </PopButton>
              <PopButton variant="outline" onClick={() => setShowQuitConfirm(true)}>
                🏠 ホームに戻る
              </PopButton>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quit confirm */}
      <AnimatePresence>
        {showQuitConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-40 flex items-center justify-center bg-background/85 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.7, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.7, y: 20 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              className="flex w-72 flex-col gap-3 rounded-3xl border-4 border-border bg-card p-6 shadow-popLg"
            >
              <h2 className="text-center text-xl font-black text-balance">ホームに戻りますか？</h2>
              <p className="text-center text-xs font-bold text-muted-foreground">今の記録は保存されません</p>
              <PopButton variant="pink" onClick={onQuit}>
                戻る
              </PopButton>
              <PopButton variant="outline" onClick={() => setShowQuitConfirm(false)}>
                つづける
              </PopButton>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI chat */}
      <AnimatePresence>{showChat && <AiChat answered={answered} onClose={() => setShowChat(false)} />}</AnimatePresence>
    </div>
  )
}

// A quick radial confetti pop of colored dots for a cleared question.
const BURST_COLORS = [
  "var(--pop-pink)",
  "var(--pop-yellow)",
  "var(--pop-teal)",
  "var(--pop-blue)",
  "var(--pop-orange)",
  "var(--primary)",
]

function Burst() {
  const count = 12
  return (
    <>
      {Array.from({ length: count }).map((_, i) => {
        const angle = (i / count) * Math.PI * 2 + Math.random() * 0.4
        const dist = 80 + Math.random() * 70
        const size = 8 + Math.random() * 8
        return (
          <motion.span
            key={i}
            initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
            animate={{
              x: Math.cos(angle) * dist,
              y: Math.sin(angle) * dist,
              scale: [0, 1, 0.5],
              opacity: [1, 1, 0],
              rotate: Math.random() * 180,
            }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="absolute rounded-[3px]"
            style={{ width: size, height: size, backgroundColor: BURST_COLORS[i % BURST_COLORS.length] }}
          />
        )
      })}
    </>
  )
}
