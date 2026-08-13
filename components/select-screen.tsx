"use client"

import { useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { ArrowLeft, Play, RotateCcw, Target } from "lucide-react"
import { PopButton } from "./pop-button"
import type { PlayRange } from "@/lib/types"
import type { Category, Direction } from "@/lib/quiz-data"

interface Option {
  dir: Direction
  big: string
  bigClass: string
  label: string
  desc: string
  chip: string
  chipClass: string
}

const RANGE_OPTIONS: { range: PlayRange; label: string; detail: string }[] = [
  { range: "10", label: "10問", detail: "サクッと" },
  { range: "50", label: "50問", detail: "しっかり" },
  { range: "all", label: "全118問", detail: "ぜんぶ" },
  { range: "weak", label: "苦手10問", detail: "復習する" },
]

export function SelectScreen({
  category,
  onBack,
  onStart,
}: {
  category: Category
  onBack: () => void
  onStart: (d: Direction, range: PlayRange) => void
}) {
  const [direction, setDirection] = useState<Direction | null>(null)
  const [range, setRange] = useState<PlayRange>(category === "element" ? "10" : "all")
  const isElement = category === "element"
  const catLabel = isElement ? "元素記号" : "イオン式"

  const options: Option[] = isElement
    ? [
        { dir: "toName", big: "Mg", bigClass: "text-primary", label: "名前を答える", desc: "元素記号を見て、その名前をタイピング", chip: "Mg → マグネシウム", chipClass: "bg-primary/10 text-primary" },
        { dir: "toSymbol", big: "マグネシウム", bigClass: "text-pop-blue", label: "記号を答える", desc: "元素の名前を見て、その記号をタイピング", chip: "マグネシウム → Mg", chipClass: "bg-pop-blue/10 text-pop-blue" },
      ]
    : [
        { dir: "toName", big: "Mg²⁺", bigClass: "text-pop-teal", label: "名前を答える", desc: "イオン式を見て、その名前をタイピング", chip: "Mg²⁺ → マグネシウムイオン", chipClass: "bg-pop-teal/10 text-pop-teal" },
        { dir: "toSymbol", big: "マグネシウムイオン", bigClass: "text-pop-orange", label: "化学式を答える", desc: "イオンの名前を見て、その化学式をタイピング", chip: "マグネシウムイオン → Mg²⁺", chipClass: "bg-pop-orange/10 text-pop-orange" },
      ]

  return (
    <div className="mx-auto flex min-h-svh w-full max-w-3xl flex-col px-5 py-8">
      <header className="mb-8 flex items-center gap-3">
        <PopButton variant="outline" size="sm" onClick={direction ? () => setDirection(null) : onBack} aria-label="もどる">
          <ArrowLeft className="size-4" />
        </PopButton>
        <div>
          <div className="text-sm font-bold text-muted-foreground">{catLabel}モード</div>
          <h1 className="text-balance text-2xl font-black sm:text-3xl">{direction && isElement ? "何問チャレンジする？" : "どっちで練習する？"}</h1>
        </div>
      </header>

      <AnimatePresence mode="wait">
        {!direction ? (
          <motion.div key="directions" exit={{ opacity: 0, x: -30 }} className="grid flex-1 content-start gap-5 sm:grid-cols-2">
            {options.map((o, i) => (
              <motion.button key={o.dir} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 * i, type: "spring", stiffness: 240, damping: 20 }} whileHover={{ y: -6 }} whileTap={{ scale: 0.96, y: 4 }} onClick={() => isElement ? setDirection(o.dir) : onStart(o.dir, "all")} className="group flex flex-col items-center gap-4 rounded-3xl bg-card p-8 text-center shadow-pop focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/40">
                <span className={`rounded-full ${o.chipClass} px-3 py-1 text-xs font-black`}>{o.chip}</span>
                <span className={`flex min-h-24 items-center justify-center text-balance text-4xl font-black leading-tight sm:text-5xl ${o.bigClass}`}>{o.big}</span>
                <div><div className="text-xl font-black">{o.label}</div><p className="mt-1 text-sm font-medium leading-relaxed text-muted-foreground">{o.desc}</p></div>
                <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-foreground px-4 py-2 text-sm font-black text-background transition-transform group-hover:scale-105"><Play className="size-4" />つぎへ</span>
              </motion.button>
            ))}
          </motion.div>
        ) : (
          <motion.div key="ranges" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} className="flex flex-1 flex-col">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4" role="radiogroup" aria-label="問題数">
              {RANGE_OPTIONS.map((option, i) => {
                const selected = range === option.range
                return (
                  <motion.button key={option.range} initial={{ opacity: 0, y: 20, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: i * 0.06, type: "spring" }} whileTap={{ scale: 0.92, y: 5 }} onClick={() => setRange(option.range)} role="radio" aria-checked={selected} className={`relative flex min-h-28 flex-col items-center justify-center overflow-hidden rounded-3xl border-2 p-4 text-center shadow-pop-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/40 ${selected ? "border-primary text-primary-foreground" : "border-border bg-card"}`}>
                    {selected && <motion.span layoutId="range-choice" className="absolute inset-0 bg-primary" transition={{ type: "spring", stiffness: 430, damping: 28 }} />}
                    <span className="relative text-xl font-black">{option.label}</span>
                    <span className={`relative mt-1 text-xs font-bold ${selected ? "text-primary-foreground/80" : "text-muted-foreground"}`}>{option.detail}</span>
                    {option.range === "weak" && <Target className="relative mt-2 size-5" />}
                  </motion.button>
                )
              })}
            </div>
            <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.25, type: "spring", stiffness: 300, damping: 18 }} className="mt-6 rounded-3xl border-2 border-border bg-secondary p-5 text-center shadow-pop">
              <p className="font-black">{range === "weak" ? "よく間違える問題を優先して出題します" : "問題は毎回ランダムに選ばれます"}</p>
              {range === "weak" && <p className="mt-1 text-sm font-bold text-muted-foreground">記録が少ないときは、ほかの問題から補います</p>}
            </motion.div>
            <div className="mt-6 flex justify-center">
              <PopButton size="lg" onClick={() => onStart(direction, range)} className="min-w-56"><Play className="size-5" />スタート</PopButton>
            </div>
            <button onClick={() => setDirection(null)} className="mx-auto mt-4 inline-flex items-center gap-1 text-sm font-bold text-muted-foreground hover:text-foreground"><RotateCcw className="size-4" />答え方を選び直す</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
