"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { checkRomaji } from "@/lib/romaji"
import { formatTime } from "@/lib/types"
import type { AnsweredItem, GameConfig, GameResult, QuestionResult } from "@/lib/types"
import { buildQuestions, shuffle, type Question } from "@/lib/quiz-data"
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
  const [now, setNow] = useState(0)
  const [answered, setAnswered] = useState<AnsweredItem[]>([])

  const results = useRef<QuestionResult[]>([])
  const startRef = useRef<number>(performance.now())
  const qStartRef = useRef<number>(performance.now())
  const pausedAccRef = useRef<number>(0)
  const pauseStartRef = useRef<number>(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const current = questions[index]
  const overlayOpen = paused || showChat || showQuitConfirm

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
    clearTimeout(wrongTimer.current)
    wrongTimer.current = setTimeout(() => setWrong(false), 300)
  }, [])

  const evaluate = useCallback(
    (value: string) => {
      if (!current) return
      if (current.mode === "romaji" && current.reading) {
        const res = checkRomaji(current.reading, value)
        if (res === "match") return advance(current, usedHint)
        if (res === "no") return triggerWrong()
        setTyped(value)
      } else {
        const target = (current.ascii ?? "").toLowerCase()
        const v = value.toLowerCase()
        if (v === target) return advance(current, usedHint)
        if (!target.startsWith(v)) return triggerWrong()
        setTyped(value)
      }
    },
    [current, advance, triggerWrong, usedHint],
  )

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (overlayOpen) return
    evaluate(e.target.value)
  }

  // Enter reveals the next answer character as a hint.
  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      if (e.nativeEvent.isComposing || e.keyCode === 229) return
      e.preventDefault()
      if (overlayOpen) return
      setUsedHint(true)
      setHintLevel((l) => Math.min(l + 1, current.answerChars.length))
    }
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
        <button
          onClick={pause}
          className="pop-tap rounded-full border-2 border-border bg-card px-4 py-2 text-sm font-bold shadow-pop"
          aria-label="一時停止 (ESC)"
        >
          ⏸ ESC
        </button>
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
      <div className="flex flex-1 flex-col items-center justify-center">
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
            className={`font-mono text-2xl font-bold tracking-wide ${wrong ? "text-destructive" : "text-muted-foreground"}`}
          >
            {typed || <span className="opacity-50">ここに入力…</span>}
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
              {current.answerChars.map((c, i) => (
                <span
                  key={i}
                  className={`flex h-10 min-w-9 items-center justify-center rounded-lg border-2 border-border px-1 text-lg font-bold ${
                    i < hintLevel ? "bg-accent text-accent-foreground" : "bg-muted text-transparent"
                  }`}
                >
                  {i < hintLevel ? c : "?"}
                </span>
              ))}
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
        value={typed}
        onChange={handleChange}
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
