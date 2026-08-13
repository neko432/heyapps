"use client"

import { useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { callGemini } from "@/lib/gemini"
import {
  getApiKey,
  getChats,
  saveChats,
  type ChatMessage,
  type ChatSession,
} from "@/lib/storage"
import type { AnsweredItem } from "@/lib/types"
import { ApiKeyDialog } from "./api-key-dialog"

interface Props {
  answered: AnsweredItem[]
  onClose: () => void
}

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

function newSession(): ChatSession {
  return { id: uid(), title: "新しいチャット", createdAt: Date.now(), messages: [] }
}

export function AiChat({ answered, onClose }: Props) {
  const [chats, setChats] = useState<ChatSession[]>([])
  const [activeId, setActiveId] = useState<string>("")
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [visibleCount, setVisibleCount] = useState(10)
  const [showKeyDialog, setShowKeyDialog] = useState(false)
  const [showSessions, setShowSessions] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Load or initialise chat sessions on mount.
  useEffect(() => {
    const existing = getChats()
    if (existing.length) {
      setChats(existing)
      setActiveId(existing[0].id)
    } else {
      const s = newSession()
      setChats([s])
      setActiveId(s.id)
      saveChats([s])
    }
  }, [])

  const active = chats.find((c) => c.id === activeId)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
  }, [active?.messages.length, loading])

  function persist(next: ChatSession[]) {
    setChats(next)
    saveChats(next)
  }

  function updateActive(fn: (s: ChatSession) => ChatSession) {
    persist(chats.map((c) => (c.id === activeId ? fn(c) : c)))
  }

  async function send(text: string) {
    const content = text.trim()
    if (!content || loading || !active) return

    const key = getApiKey()
    if (!key) {
      setShowKeyDialog(true)
      return
    }

    const userMsg: ChatMessage = { role: "user", content }
    const title = active.messages.length === 0 ? content.slice(0, 18) : active.title
    const withUser: ChatMessage[] = [...active.messages, userMsg]
    updateActive((s) => ({ ...s, title, messages: withUser }))
    setInput("")
    setLoading(true)

    try {
      const reply = await callGemini(key, withUser)
      updateActive((s) => ({ ...s, messages: [...withUser, { role: "assistant", content: reply }] }))
    } catch (e) {
      const msg = e instanceof Error ? e.message : "エラーが発生しました。"
      updateActive((s) => ({ ...s, messages: [...withUser, { role: "assistant", content: "⚠️ " + msg }] }))
    } finally {
      setLoading(false)
    }
  }

  function askAbout(item: AnsweredItem) {
    const label = item.category === "element" ? "元素" : "イオン"
    send(`${item.answerDisplay}（${item.prompt}）という${label}について、中学生にもわかるように説明して！`)
  }

  function createNewChat() {
    const s = newSession()
    persist([s, ...chats])
    setActiveId(s.id)
    setShowSessions(false)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      if (e.nativeEvent.isComposing || e.keyCode === 229) return
      e.preventDefault()
      send(input)
    }
  }

  // Recent answered items (most recent first), highlight ones cleared with hint.
  const recent = [...answered].reverse().slice(0, visibleCount)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-30 flex items-center justify-center bg-background/85 p-3 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.85, y: 24 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.85, y: 24 }}
        transition={{ type: "spring", stiffness: 240, damping: 22 }}
        className="flex h-[90dvh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border-4 border-border bg-card shadow-popLg sm:flex-row"
      >
        {/* Chat side */}
        <div className="flex min-h-0 flex-1 flex-col border-border sm:border-r-4">
          {/* Header */}
          <div className="flex items-center justify-between gap-2 border-b-4 border-border bg-secondary px-4 py-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSessions((v) => !v)}
                className="pop-tap rounded-full border-2 border-border bg-card px-3 py-1.5 text-xs font-bold shadow-pop"
              >
                ☰ 履歴
              </button>
              <span className="max-w-[9rem] truncate text-sm font-black text-secondary-foreground">
                {active?.title ?? "AI先生"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={createNewChat}
                className="pop-tap rounded-full border-2 border-border bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground shadow-pop"
              >
                ＋ 新規
              </button>
              <button
                onClick={() => setShowKeyDialog(true)}
                className="pop-tap rounded-full border-2 border-border bg-card px-3 py-1.5 text-xs font-bold shadow-pop"
              >
                🔑 API
              </button>
              <button
                onClick={onClose}
                aria-label="閉じる"
                className="pop-tap rounded-full border-2 border-border bg-card px-3 py-1.5 text-xs font-bold shadow-pop"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Session list dropdown */}
          <AnimatePresence>
            {showSessions && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden border-b-4 border-border bg-muted"
              >
                <div className="max-h-40 space-y-1 overflow-y-auto p-2">
                  {chats.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        setActiveId(c.id)
                        setShowSessions(false)
                      }}
                      className={`flex w-full items-center justify-between rounded-xl border-2 border-border px-3 py-2 text-left text-xs font-bold ${
                        c.id === activeId ? "bg-accent text-accent-foreground" : "bg-card"
                      }`}
                    >
                      <span className="truncate">{c.title}</span>
                      <span className="ml-2 shrink-0 text-[10px] opacity-60">
                        {new Date(c.createdAt).toLocaleDateString("ja-JP", { month: "numeric", day: "numeric" })}
                      </span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Messages */}
          <div ref={scrollRef} className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4">
            {active && active.messages.length === 0 && (
              <div className="m-auto max-w-xs text-center text-sm font-bold text-muted-foreground">
                AI先生になんでも質問してみよう！
                <br />
                右の一覧から元素をタップすると解説してくれるよ。
              </div>
            )}
            {active?.messages.map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`max-w-[85%] rounded-2xl border-2 border-border px-4 py-2.5 text-sm font-medium leading-relaxed shadow-pop ${
                  m.role === "user"
                    ? "self-end whitespace-pre-wrap bg-primary text-primary-foreground"
                    : "self-start bg-card text-card-foreground"
                }`}
              >
                {m.role === "user" ? (
                  m.content
                ) : (
                  <div className="markdown-body">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                  </div>
                )}
              </motion.div>
            ))}
            {loading && (
              <div className="self-start rounded-2xl border-2 border-border bg-card px-4 py-3 shadow-pop">
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="flex items-end gap-2 border-t-4 border-border bg-card p-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              placeholder="メッセージを入力…"
              className="max-h-28 flex-1 resize-none rounded-2xl border-2 border-border bg-input px-4 py-2.5 text-sm font-medium outline-none focus:border-primary"
            />
            <button
              onClick={() => send(input)}
              disabled={loading || !input.trim()}
              className="pop-tap shrink-0 rounded-2xl border-2 border-border bg-primary px-4 py-2.5 text-sm font-black text-primary-foreground shadow-pop disabled:opacity-40"
            >
              送信
            </button>
          </div>
        </div>

        {/* History side */}
        <div className="flex min-h-0 flex-col bg-muted sm:w-64">
          <div className="border-b-4 border-border bg-secondary px-4 py-3 text-sm font-black text-secondary-foreground">
            さっきの問題
          </div>
          <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
            {recent.length === 0 && (
              <p className="p-2 text-center text-xs font-bold text-muted-foreground">まだ記録がないよ</p>
            )}
            {recent.map((item, i) => (
              <button
                key={i}
                onClick={() => askAbout(item)}
                className={`pop-tap flex w-full flex-col items-start rounded-xl border-2 px-3 py-2 text-left shadow-pop ${
                  item.usedHint
                    ? "border-accent bg-accent/40"
                    : "border-border bg-card"
                }`}
              >
                <span className="text-lg font-black leading-tight">{item.prompt}</span>
                <span className="text-[11px] font-bold text-muted-foreground">{item.answerDisplay}</span>
                {item.usedHint && (
                  <span className="mt-0.5 rounded-full bg-accent px-1.5 text-[10px] font-black text-accent-foreground">
                    ヒント使用
                  </span>
                )}
              </button>
            ))}
            {answered.length > visibleCount && (
              <button
                onClick={() => setVisibleCount((c) => c + 10)}
                className="pop-tap w-full rounded-xl border-2 border-border bg-card py-2 text-xs font-black shadow-pop"
              >
                more（あと{answered.length - visibleCount}件）
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {showKeyDialog && <ApiKeyDialog onClose={() => setShowKeyDialog(false)} />}
    </motion.div>
  )
}
