import type { Category, Direction } from "./quiz-data"

export interface QuestionResult {
  id: string
  prompt: string
  answerDisplay: string
  ms: number
  usedHint: boolean
}

export interface GameConfig {
  category: Category
  direction: Direction
}

export interface GameResult extends GameConfig {
  totalMs: number
  results: QuestionResult[]
  slowestPrompt: string
  slowestMs: number
}

// A record of an answered item, surfaced in the AI chat history panel.
export interface AnsweredItem {
  prompt: string
  answerDisplay: string
  usedHint: boolean
  category: Category
}

export function formatTime(ms: number): string {
  const totalSec = Math.floor(ms / 1000)
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  const cs = Math.floor((ms % 1000) / 10)
  const mm = String(m).padStart(2, "0")
  const ss = String(s).padStart(2, "0")
  const ccs = String(cs).padStart(2, "0")
  return `${mm}:${ss}.${ccs}`
}
