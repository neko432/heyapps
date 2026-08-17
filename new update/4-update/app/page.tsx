"use client"

import { useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { HomeScreen } from "@/components/home-screen"
import { SelectScreen } from "@/components/select-screen"
import { GameScreen } from "@/components/game-screen"
import { ResultScreen } from "@/components/result-screen"
import { addStat } from "@/lib/storage"
import type { GameConfig, GameResult } from "@/lib/types"
import type { Category, Direction } from "@/lib/quiz-data"

type Screen = "home" | "select" | "game" | "result"

export default function Page() {
  const [screen, setScreen] = useState<Screen>("home")
  const [category, setCategory] = useState<Category | null>(null)
  const [config, setConfig] = useState<GameConfig | null>(null)
  const [result, setResult] = useState<GameResult | null>(null)

  function selectCategory(c: Category) {
    setCategory(c)
    setScreen("select")
  }

  function start(direction: Direction) {
    if (!category) return
    setConfig({ category, direction })
    setScreen("game")
  }

  function finish(r: GameResult) {
    addStat({
      id: crypto.randomUUID(),
      category: r.category,
      direction: r.direction,
      totalMs: r.totalMs,
      count: r.results.length,
      date: Date.now(),
      slowestPrompt: r.slowestPrompt,
      slowestMs: r.slowestMs,
    })
    setResult(r)
    setScreen("result")
  }

  return (
    <main className="min-h-dvh">
      <AnimatePresence mode="wait">
        <motion.div
          key={screen + (category ?? "")}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {screen === "home" && <HomeScreen onSelectCategory={selectCategory} />}

          {screen === "select" && category && (
            <SelectScreen category={category} onBack={() => setScreen("home")} onStart={start} />
          )}

          {screen === "game" && config && (
            <GameScreen config={config} onFinish={finish} onQuit={() => setScreen("home")} />
          )}

          {screen === "result" && result && (
            <ResultScreen
              result={result}
              onRetry={() => {
                setConfig({ category: result.category, direction: result.direction })
                setScreen("game")
              }}
              onHome={() => setScreen("home")}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </main>
  )
}
