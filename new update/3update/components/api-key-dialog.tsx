"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { KeyRound, X } from "lucide-react"
import { PopButton } from "./pop-button"
import { getApiKey, setApiKey } from "@/lib/storage"

export function ApiKeyDialog({ onClose }: { onClose: () => void }) {
  const [value, setValue] = useState(() => getApiKey())
  const [saved, setSaved] = useState(false)

  function save() {
    setApiKey(value.trim())
    setSaved(true)
    setTimeout(onClose, 500)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-foreground/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="w-full max-w-md rounded-3xl bg-card p-6 shadow-pop"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-xl font-extrabold">
            <span className="grid size-9 place-items-center rounded-xl bg-pop-yellow text-foreground">
              <KeyRound className="size-5" />
            </span>
            Gemini APIキー設定
          </h2>
          <button onClick={onClose} aria-label="閉じる" className="rounded-full p-1 hover:bg-muted">
            <X className="size-5" />
          </button>
        </div>
        <p className="mb-3 text-sm leading-relaxed text-muted-foreground">
          AI先生に質問するには、Google AI Studio で取得した Gemini の APIキーが必要です。キーはこのブラウザにのみ保存されます。
        </p>
        <a
          href="https://aistudio.google.com/app/apikey"
          target="_blank"
          rel="noreferrer"
          className="mb-4 inline-block text-sm font-bold text-primary underline underline-offset-2"
        >
          APIキーを取得する
        </a>
        <input
          type="password"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="AIza..."
          className="mb-4 w-full rounded-2xl border-2 border-border bg-background px-4 py-3 font-mono text-sm outline-none focus:border-primary"
        />
        <div className="flex justify-end gap-2">
          <PopButton variant="outline" onClick={onClose}>
            キャンセル
          </PopButton>
          <PopButton variant="primary" onClick={save} disabled={!value.trim()}>
            {saved ? "保存しました" : "保存する"}
          </PopButton>
        </div>
      </motion.div>
    </motion.div>
  )
}
