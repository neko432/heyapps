"use client"

import { useEffect, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Atom, Zap, Settings, Trophy, Clock, Trash2 } from "lucide-react"
import { PopButton } from "./pop-button"
import { ApiKeyDialog } from "./api-key-dialog"
import { getStats, clearStats, type PlayStat } from "@/lib/storage"
import { formatTime } from "@/lib/types"
import type { Category } from "@/lib/quiz-data"

const DIR_LABEL: Record<string, string> = {
  toName: "名前を答える",
  toSymbol: "記号・式を答える",
}
const CAT_LABEL: Record<Category, string> = {
  element: "元素記号",
  ion: "イオン式",
}

export function HomeScreen({ onSelectCategory }: { onSelectCategory: (c: Category) => void }) {
  const [stats, setStats] = useState<PlayStat[]>([])
  const [showKey, setShowKey] = useState(false)

  useEffect(() => {
    setStats(getStats())
  }, [])

  const cards: { cat: Category; icon: typeof Atom; desc: string; variant: "primary" | "teal"; ring: string }[] = [
    { cat: "element", icon: Atom, desc: "全118種類の元素記号と名前をおぼえよう", variant: "primary", ring: "bg-primary" },
    { cat: "ion", icon: Zap, desc: "中学レベルのイオン式と名前をおぼえよう", variant: "teal", ring: "bg-pop-teal" },
  ]

  return (
    <div className="relative mx-auto flex min-h-svh w-full max-w-3xl flex-col px-5 py-8">
      <header className="mb-8 flex items-start justify-between">
        <div>
          <motion.h1
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-black tracking-tight sm:text-5xl"
          >
            <span className="text-primary">元素</span>タイピング
          </motion.h1>
          <p className="mt-2 font-bold text-muted-foreground">元素記号・イオン式をタイピングでおぼえよう！</p>
        </div>
        <PopButton variant="outline" size="sm" onClick={() => setShowKey(true)} aria-label="設定">
          <Settings className="size-4" />
          <span className="hidden sm:inline">AI設定</span>
        </PopButton>
      </header>

      <div className="mb-4 font-black text-foreground/80">モードをえらぶ</div>
      <div className="grid gap-4 sm:grid-cols-2">
        {cards.map((c, i) => {
          const Icon = c.icon
          return (
            <motion.button
              key={c.cat}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i, type: "spring", stiffness: 260, damping: 20 }}
              whileHover={{ y: -6, rotate: i === 0 ? -1 : 1 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onSelectCategory(c.cat)}
              className="group flex flex-col items-start gap-3 rounded-3xl bg-card p-6 text-left shadow-pop"
            >
              <span className={`grid size-16 place-items-center rounded-2xl ${c.ring} text-white`}>
                <Icon className="size-9" />
              </span>
              <span className="text-2xl font-black">{CAT_LABEL[c.cat]}</span>
              <span className="text-sm font-medium leading-relaxed text-muted-foreground">{c.desc}</span>
            </motion.button>
          )
        })}
      </div>

      <section className="mt-10">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-black text-foreground/80">
            <Trophy className="size-5 text-pop-orange" />
            これまでの記録
          </h2>
          {stats.length > 0 && (
            <button
              onClick={() => {
                clearStats()
                setStats([])
              }}
              className="flex items-center gap-1 text-xs font-bold text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="size-3.5" /> 記録を消す
            </button>
          )}
        </div>

        {stats.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-border bg-card/50 p-8 text-center font-bold text-muted-foreground">
            まだ記録がありません。プレイしてみよう！
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            <AnimatePresence initial={false}>
              {stats.map((s, i) => (
                <motion.li
                  key={s.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: Math.min(i * 0.03, 0.3) }}
                  className="flex items-center justify-between gap-3 rounded-2xl bg-card p-3 pl-4 shadow-pop-sm"
                >
                  <div className="min-w-0">
                    <div className="truncate font-black">
                      {CAT_LABEL[s.category]}
                      <span className="ml-2 rounded-full bg-secondary px-2 py-0.5 text-xs font-bold text-secondary-foreground">
                        {DIR_LABEL[s.direction]}
                      </span>
                    </div>
                    <div className="text-xs font-medium text-muted-foreground">
                      {new Date(s.date).toLocaleString("ja-JP", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      {" ・ "}
                      {s.count}問
                    </div>
                  </div>
                  <div className="flex items-center gap-1 font-mono text-lg font-black tabular-nums text-primary">
                    <Clock className="size-4 text-muted-foreground" />
                    {formatTime(s.totalMs)}
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </section>

      <AnimatePresence>{showKey && <ApiKeyDialog onClose={() => setShowKey(false)} />}</AnimatePresence>
    </div>
  )
}
