import type { Category, Direction } from "./quiz-data"
import type { PlayRange, QuestionResult } from "./types"

const STATS_KEY = "chemtype_stats_v1"
const MISTAKES_KEY = "chemtype_mistakes_v1"
const APIKEY_KEY = "chemtype_gemini_key_v1"
const CHATS_KEY = "chemtype_chats_v1"
const SOUND_KEY = "chemtype_sound_v1"

export interface PlayStat {
  id: string
  category: Category
  direction: Direction
  totalMs: number
  count: number
  date: number
  slowestPrompt: string
  slowestMs: number
  range?: PlayRange
}

export type MistakeScores = Record<string, number>

export function getRange(stat: PlayStat): PlayRange {
  if (stat.range) return stat.range
  // Records created before range selection existed were always full-set plays.
  return "all"
}

export function mistakeKey(category: Category, direction: Direction, questionId: string) {
  return `${category}:${direction}:${questionId}`
}

export interface ChatMessage {
  role: "user" | "assistant"
  content: string
}

export interface ChatSession {
  id: string
  title: string
  createdAt: number
  messages: ChatMessage[]
}

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function write(key: string, value: unknown) {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* ignore quota errors */
  }
}

// ---- Stats ----
export function getStats(): PlayStat[] {
  return read<PlayStat[]>(STATS_KEY, []).sort((a, b) => b.date - a.date)
}

export function addStat(stat: PlayStat) {
  const stats = read<PlayStat[]>(STATS_KEY, [])
  stats.push(stat)
  write(STATS_KEY, stats.slice(-100))
}

export function getMistakeScores(): MistakeScores {
  return read<MistakeScores>(MISTAKES_KEY, {})
}

export function addMistakes(category: Category, direction: Direction, results: QuestionResult[]) {
  const scores = getMistakeScores()
  for (const result of results) {
    if (result.mistakes > 0) {
      const key = mistakeKey(category, direction, result.id)
      scores[key] = (scores[key] ?? 0) + result.mistakes
    }
  }
  write(MISTAKES_KEY, scores)
}

export function clearStats() {
  write(STATS_KEY, [])
  write(MISTAKES_KEY, {})
}

// ---- API key ----
export function getApiKey(): string {
  return read<string>(APIKEY_KEY, "")
}

export function setApiKey(key: string) {
  write(APIKEY_KEY, key)
}

// ---- Sound ----
export function getSoundEnabled(): boolean {
  return read<boolean>(SOUND_KEY, true)
}

export function setSoundEnabled(v: boolean) {
  write(SOUND_KEY, v)
}

// ---- Chats ----
export function getChats(): ChatSession[] {
  return read<ChatSession[]>(CHATS_KEY, []).sort((a, b) => b.createdAt - a.createdAt)
}

export function saveChats(chats: ChatSession[]) {
  write(CHATS_KEY, chats)
}
