"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Atom, Zap, Settings, Trophy, Clock, Trash2, Sparkles } from "lucide-react"
import { PopButton } from "./pop-button"
import { ApiKeyDialog } from "./api-key-dialog"
import { Mascot } from "./mascot"
import { getRange, getStats, clearStats, type PlayStat } from "@/lib/storage"
import { formatTime } from "@/lib/types"
import { sound } from "@/lib/sound"
import type { Category } from "@/lib/quiz-data"

const DIR_LABEL: Record<string, string> = { toName: "名前を答える", toSymbol: "記号・式を答える" }
const CAT_LABEL: Record<Category, string> = { element: "元素記号", ion: "イオン式" }
const RANGE_LABEL = { all: "全問", "10": "10問", "50": "50問", weak: "苦手10問" } as const
const TROPHY_CHEERS = [
  "ここまで来た回数は、ぜんぶ君の力になってるよ！",
  "昨日の自分より一問多く。それだけで大成功！",
  "記録は数字だけじゃない。挑戦した証拠だよ！",
  "その調子！元素たちも君を応援してるよ！",
  "焦らなくて大丈夫。覚えた分だけ確実に前進！",
  "継続は最強の化学反応。今日もよく頑張ったね！",
  "間違いは発見の入口。次はきっと答えられる！",
  "君のタイピング、どんどん輝いてるよ！",
]
const SECRET_CHEERS = ["秘密の反応、大成功！君の好奇心は満点！", "発見おめでとう！挑戦する君はかっこいい！"]
const FLOATING = [
  { t: "H", top: "10%", side: "left", offset: "6%", size: "text-6xl", delay: "0s", cheer: "Hを発見！小さな一歩が大きな自信になるよ！" },
  { t: "O²⁻", top: "16%", side: "right", offset: "7%", size: "text-4xl", delay: "0.7s", cheer: "O²⁻を発見！今日の集中力、いい調子！" },
  { t: "Na⁺", top: "66%", side: "left", offset: "7%", size: "text-5xl", delay: "1.3s", cheer: "Na⁺を発見！ひとつずつ覚えれば大丈夫！" },
  { t: "Fe", top: "80%", side: "right", offset: "8%", size: "text-6xl", delay: "0.4s", cheer: "Feを発見！鉄のように粘り強くいこう！" },
  { t: "Cl⁻", top: "40%", side: "right", offset: "3%", size: "text-3xl", delay: "1s", cheer: "Cl⁻を発見！その好奇心が学ぶ力だよ！" },
  { t: "Mg²⁺", top: "52%", side: "left", offset: "2%", size: "text-3xl", delay: "1.7s", cheer: "Mg²⁺を発見！君なら次の一問もできる！" },
  { t: "He", top: "88%", side: "left", offset: "12%", size: "text-4xl", delay: "0.5s", cheer: "Heを発見！軽やかに楽しく続けよう！" },
  { t: "Ca²⁺", top: "30%", side: "right", offset: "12%", size: "text-3xl", delay: "1.1s", cheer: "Ca²⁺を発見！積み重ねが君を強くするよ！" },
]

function chooseDifferent(pool: string[], previous: string) {
  const choices = pool.filter((line) => line !== previous)
  return choices[Math.floor(Math.random() * choices.length)] ?? pool[0]
}

function Confetti({ seed }: { seed: number }) {
  return <span key={seed} aria-hidden className="secret-confetti">{Array.from({ length: 12 }, (_, i) => <i key={i} style={{ "--i": i } as React.CSSProperties} />)}</span>
}

function FloatingSymbols({ onDiscover }: { onDiscover: (message: string) => void }) {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 hidden overflow-hidden 2xl:block">
      {FLOATING.map((f, i) => (
        <motion.button
          key={f.t}
          type="button"
          tabIndex={0}
          aria-label={`${f.t}の隠し元素を見つける`}
          onClick={() => onDiscover(f.cheer)}
          whileHover={{ opacity: 0.28, scale: 1.15 }}
          whileTap={{ scale: 1.5, rotate: 18 }}
          className={`secret-element pointer-events-auto absolute cursor-pointer font-black ${f.size} ${i % 2 === 0 ? "text-primary" : "text-pop-teal"}`}
          style={{ top: f.top, [f.side]: f.offset, animationDelay: f.delay }}
        >
          {f.t}
        </motion.button>
      ))}
    </div>
  )
}

export function HomeScreen({ onSelectCategory }: { onSelectCategory: (c: Category) => void }) {
  const [stats, setStats] = useState<PlayStat[]>([])
  const [showKey, setShowKey] = useState(false)
  const [message, setMessage] = useState("")
  const [effectSeed, setEffectSeed] = useState(0)
  const [titlePokes, setTitlePokes] = useState(0)
  const [titleSecret, setTitleSecret] = useState(false)
  const keySequence = useRef("")
  const messageTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const reveal = useCallback((next: string) => {
    setMessage(next)
    setEffectSeed((seed) => seed + 1)
    sound.correct()
    if (messageTimer.current) clearTimeout(messageTimer.current)
    messageTimer.current = setTimeout(() => setMessage(""), 4600)
  }, [])

  useEffect(() => {
    setStats(getStats())
    return () => { if (messageTimer.current) clearTimeout(messageTimer.current) }
  }, [])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement
      if (target.matches("input, textarea, select") || target.isContentEditable || showKey) return
      keySequence.current = (keySequence.current + event.key.toLowerCase()).slice(-4)
      if (keySequence.current === "atom") {
        keySequence.current = ""
        reveal("ATOM発見！見えないところまで探せる君はすごい！")
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [reveal, showKey])

  function pokeTitle() {
    const next = titlePokes + 1
    setTitlePokes(next)
    if (next >= 5) {
      setTitlePokes(0)
      setTitleSecret(true)
      reveal(chooseDifferent(SECRET_CHEERS, message))
      window.setTimeout(() => setTitleSecret(false), 2600)
    }
  }

  const cards = [
    { cat: "element" as Category, icon: Atom, desc: "全118種類の元素記号と名前をおぼえよう", ring: "bg-primary" },
    { cat: "ion" as Category, icon: Zap, desc: "中学レベルのイオン式と名前をおぼえよう", ring: "bg-pop-teal" },
  ]

  return (
    <div className="relative z-10 mx-auto flex min-h-svh w-full max-w-6xl flex-col px-5 py-8 md:px-8 xl:px-10">
      <FloatingSymbols onDiscover={reveal} />
      <header className="mb-8 flex items-start justify-between gap-4">
        <div>
          <motion.button type="button" onClick={pokeTitle} aria-label="元素タイピング。5回押すと何かが起こります" className={`relative cursor-pointer text-left text-4xl font-black tracking-tight sm:text-5xl ${titleSecret ? "text-rainbow" : ""}`} whileTap={{ scale: 0.97 }}>
            {titleSecret && <Confetti seed={effectSeed} />}
            {["元", "素", "タ", "イ", "ピ", "ン", "グ"].map((ch, i) => (
              <motion.span key={i} initial={{ opacity: 0, y: 26, rotate: -10, scale: 0.6 }} animate={{ opacity: 1, y: 0, rotate: 0, scale: 1 }} transition={{ delay: 0.08 + i * 0.06, type: "spring", stiffness: 420, damping: 15 }} whileHover={{ y: -8, rotate: i % 2 === 0 ? 8 : -8, scale: 1.15, transition: { duration: 0.08, ease: "easeOut" } }} className={`inline-block will-change-transform ${!titleSecret && i < 2 ? "text-primary" : ""}`}>{ch}</motion.span>
            ))}
          </motion.button>
          <p className="mt-2 font-bold text-muted-foreground">元素記号・イオン式をタイピングでおぼえよう！</p>
        </div>
        <PopButton variant="outline" size="sm" onClick={() => setShowKey(true)} aria-label="設定"><Settings className="size-4" /><span className="hidden sm:inline">AI設定</span></PopButton>
      </header>

      <AnimatePresence mode="wait">
        {message && (
          <motion.div key={message} role="status" initial={{ opacity: 0, y: -10, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -4, scale: 0.98 }} transition={{ type: "spring", stiffness: 420, damping: 28 }} className="secret-message relative mb-5 flex items-start gap-3 rounded-2xl border-2 border-primary/25 bg-card px-5 py-4 font-sans text-base font-bold leading-relaxed text-foreground shadow-pop-sm sm:text-lg">
            <Sparkles className="mt-0.5 size-5 shrink-0 text-pop-orange" /> <span className="min-w-0 text-pretty">{message}</span><Confetti seed={effectSeed} />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mb-4 font-black text-foreground/80">モードをえらぶ</div>
      <div className="grid gap-4 sm:grid-cols-2">
        {cards.map((c, i) => { const Icon = c.icon; return (
          <motion.button key={c.cat} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * i, type: "spring", stiffness: 260, damping: 20 }} whileHover={{ y: -6, rotate: i === 0 ? -1 : 1 }} whileTap={{ scale: 0.97 }} onClick={() => onSelectCategory(c.cat)} className="group flex flex-col items-start gap-3 rounded-3xl bg-card p-6 text-left shadow-pop">
            <span className={`grid size-16 place-items-center rounded-2xl ${c.ring} text-primary-foreground`}><Icon className="size-9" /></span>
            <span className="text-2xl font-black">{CAT_LABEL[c.cat]}</span><span className="text-sm font-medium leading-relaxed text-muted-foreground">{c.desc}</span>
          </motion.button>
        )})}
      </div>

      <section className="mt-10">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-black text-foreground/80">
            <motion.button type="button" aria-label="トロフィーの隠し応援メッセージを見る" onClick={() => reveal(chooseDifferent(TROPHY_CHEERS, message))} whileHover={{ scale: 1.16, rotate: -8 }} whileTap={{ scale: 0.82, rotate: 12 }} className="relative grid size-8 cursor-pointer place-items-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
              <Trophy className="size-5 text-pop-orange" />
            </motion.button>
            これまでの記録
          </h2>
          {stats.length > 0 && <button onClick={() => { clearStats(); setStats([]) }} className="flex items-center gap-1 text-xs font-bold text-muted-foreground hover:text-destructive"><Trash2 className="size-3.5" /> 記録を消す</button>}
        </div>
        {stats.length === 0 ? <div className="rounded-3xl border-2 border-dashed border-border bg-card/50 p-8 text-center font-bold text-muted-foreground">まだ記録がありません。プレイしてみよう！</div> : (
          <ul className="flex flex-col gap-2"><AnimatePresence initial={false}>{stats.map((s, i) => <motion.li key={s.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: Math.min(i * 0.03, 0.3) }} className="flex items-center justify-between gap-3 rounded-2xl bg-card p-3 pl-4 shadow-pop-sm"><div className="min-w-0"><div className="truncate font-black">{CAT_LABEL[s.category]}<span className="ml-2 rounded-full bg-secondary px-2 py-0.5 text-xs font-bold text-secondary-foreground">{DIR_LABEL[s.direction]}</span></div><div className="text-xs font-medium text-muted-foreground">{new Date(s.date).toLocaleString("ja-JP", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}{" ・ "}{RANGE_LABEL[getRange(s)]} ・ {s.count}問</div></div><div className="flex items-center gap-1 font-mono text-lg font-black tabular-nums text-primary"><Clock className="size-4 text-muted-foreground" />{formatTime(s.totalMs)}</div></motion.li>)}</AnimatePresence></ul>
        )}
      </section>
      <Mascot />
      <AnimatePresence>{showKey && <ApiKeyDialog onClose={() => setShowKey(false)} />}</AnimatePresence>
    </div>
  )
}
