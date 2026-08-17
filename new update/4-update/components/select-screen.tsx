"use client"

import { motion } from "framer-motion"
import { ArrowLeft, Play } from "lucide-react"
import { PopButton } from "./pop-button"
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

export function SelectScreen({
  category,
  onBack,
  onStart,
}: {
  category: Category
  onBack: () => void
  onStart: (d: Direction) => void
}) {
  const isElement = category === "element"
  const catLabel = isElement ? "元素記号" : "イオン式"

  const options: Option[] = isElement
    ? [
        {
          dir: "toName",
          big: "Mg",
          bigClass: "text-primary",
          label: "名前を答える",
          desc: "元素記号を見て、その名前をタイピング",
          chip: "Mg → マグネシウム",
          chipClass: "bg-primary/10 text-primary",
        },
        {
          dir: "toSymbol",
          big: "マグネシウム",
          bigClass: "text-pop-blue",
          label: "記号を答える",
          desc: "元素の名前を見て、その記号をタイピング",
          chip: "マグネシウム → Mg",
          chipClass: "bg-pop-blue/10 text-pop-blue",
        },
      ]
    : [
        {
          dir: "toName",
          big: "Mg²⁺",
          bigClass: "text-pop-teal",
          label: "名前を答える",
          desc: "イオン式を見て、その名前をタイピング",
          chip: "Mg²⁺ → マグネシウムイオン",
          chipClass: "bg-pop-teal/10 text-pop-teal",
        },
        {
          dir: "toSymbol",
          big: "マグネシウムイオン",
          bigClass: "text-pop-orange",
          label: "化学式を答える",
          desc: "イオンの名前を見て、その化学式をタイピング",
          chip: "マグネシウムイオン → Mg²⁺",
          chipClass: "bg-pop-orange/10 text-pop-orange",
        },
      ]

  return (
    <div className="mx-auto flex min-h-svh w-full max-w-3xl flex-col px-5 py-8">
      <header className="mb-8 flex items-center gap-3">
        <PopButton variant="outline" size="sm" onClick={onBack} aria-label="もどる">
          <ArrowLeft className="size-4" />
        </PopButton>
        <div>
          <div className="text-sm font-bold text-muted-foreground">{catLabel}モード</div>
          <h1 className="text-2xl font-black sm:text-3xl">どっちで練習する？</h1>
        </div>
      </header>

      <div className="grid flex-1 content-start gap-5 sm:grid-cols-2">
        {options.map((o, i) => (
          <motion.button
            key={o.dir}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 * i, type: "spring", stiffness: 240, damping: 20 }}
            whileHover={{ y: -6 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onStart(o.dir)}
            className="group flex flex-col items-center gap-4 rounded-3xl bg-card p-8 text-center shadow-pop"
          >
            <span className={`rounded-full ${o.chipClass} px-3 py-1 text-xs font-black`}>{o.chip}</span>
            <span className={`flex min-h-24 items-center justify-center text-balance text-4xl font-black leading-tight sm:text-5xl ${o.bigClass}`}>
              {o.big}
            </span>
            <div>
              <div className="text-xl font-black">{o.label}</div>
              <p className="mt-1 text-sm font-medium leading-relaxed text-muted-foreground">{o.desc}</p>
            </div>
            <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-foreground px-4 py-2 text-sm font-black text-background transition-transform group-hover:scale-105">
              <Play className="size-4" />
              スタート
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  )
}
