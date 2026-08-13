"use client"

import { useMemo } from "react"
import { motion } from "framer-motion"
import { formatTime } from "@/lib/types"
import type { GameResult } from "@/lib/types"
import { getStats } from "@/lib/storage"
import { PopButton } from "./pop-button"

interface Props {
  result: GameResult
  onRetry: () => void
  onHome: () => void
}

const catLabel: Record<string, string> = { element: "元素記号", ion: "イオン" }
const dirLabel: Record<string, string> = { toName: "→ 名前", toSymbol: "→ 記号・化学式" }

export function ResultScreen({ result, onRetry, onHome }: Props) {
  // Compare against previous best for the same mode.
  const { best, isNewBest, rank } = useMemo(() => {
    const same = getStats().filter(
      (s) => s.category === result.category && s.direction === result.direction,
    )
    const times = same.map((s) => s.totalMs).sort((a, b) => a - b)
    const best = times.length ? times[0] : result.totalMs
    const isNewBest = result.totalMs <= best
    const rank = times.filter((t) => t < result.totalMs).length + 1
    return { best, isNewBest, rank }
  }, [result])

  const hinted = result.results.filter((r) => r.usedHint)
  const avgMs = result.totalMs / result.results.length

  return (
    <div className="mx-auto flex min-h-dvh max-w-2xl flex-col items-center px-5 py-8">
      <motion.div
        initial={{ scale: 0.6, opacity: 0, rotate: -6 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 240, damping: 16 }}
        className="text-center"
      >
        <div className="text-6xl">{isNewBest ? "🏆" : "✨"}</div>
        <h1 className="mt-2 text-3xl font-black text-balance">
          {isNewBest ? "自己ベスト更新！" : "クリア！"}
        </h1>
        <p className="mt-1 text-sm font-bold text-muted-foreground">
          {catLabel[result.category]} {dirLabel[result.direction]}
        </p>
      </motion.div>

      {/* Big time */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.15, type: "spring", stiffness: 220, damping: 18 }}
        className="mt-6 w-full rounded-3xl border-4 border-border bg-card px-6 py-8 text-center shadow-popLg"
      >
        <p className="text-xs font-bold text-muted-foreground">クリアタイム</p>
        <p className="mt-1 font-mono text-6xl font-black tabular-nums text-primary">
          {formatTime(result.totalMs)}
        </p>
        {!isNewBest && (
          <p className="mt-2 text-xs font-bold text-muted-foreground">
            ベスト {formatTime(best)}・全{rank}位相当
          </p>
        )}
      </motion.div>

      {/* Stat chips */}
      <div className="mt-4 grid w-full grid-cols-3 gap-3">
        {[
          { label: "問題数", value: `${result.results.length}` },
          { label: "平均/問", value: formatTime(avgMs) },
          { label: "ヒント使用", value: `${hinted.length}` },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.25 + i * 0.06 }}
            className="rounded-2xl border-2 border-border bg-secondary px-2 py-3 text-center shadow-pop"
          >
            <p className="text-[0.7rem] font-bold text-secondary-foreground/70">{s.label}</p>
            <p className="mt-0.5 font-mono text-lg font-black tabular-nums text-secondary-foreground">
              {s.value}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Slowest item callout */}
      <div className="mt-4 flex w-full items-center gap-3 rounded-2xl border-2 border-border bg-accent px-4 py-3 text-accent-foreground shadow-pop">
        <span className="text-2xl">🐢</span>
        <div className="min-w-0">
          <p className="text-[0.7rem] font-bold opacity-80">いちばん時間がかかった問題</p>
          <p className="truncate text-base font-black">
            {result.slowestPrompt}
            <span className="ml-2 font-mono text-sm">{formatTime(result.slowestMs)}</span>
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-6 flex w-full gap-3">
        <PopButton className="flex-1" onClick={onRetry}>
          もう一度
        </PopButton>
        <PopButton className="flex-1" variant="outline" onClick={onHome}>
          ホームへ
        </PopButton>
      </div>

      {/* Per-question breakdown */}
      <div className="mt-6 w-full">
        <p className="mb-2 text-sm font-black text-muted-foreground">回答の記録</p>
        <div className="flex flex-col gap-1.5">
          {result.results.map((r, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-xl border-2 border-border bg-card px-3 py-2 shadow-pop-sm"
            >
              <span className="w-6 text-center text-xs font-bold text-muted-foreground">{i + 1}</span>
              <span className="w-16 shrink-0 text-lg font-black">{r.prompt}</span>
              <span className="min-w-0 flex-1 truncate text-sm font-bold text-muted-foreground">
                {r.answerDisplay}
              </span>
              {r.usedHint && (
                <span className="shrink-0 rounded-full bg-accent px-2 py-0.5 text-[0.65rem] font-bold text-accent-foreground">
                  ヒント
                </span>
              )}
              <span className="shrink-0 font-mono text-sm font-bold tabular-nums">{formatTime(r.ms)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
