import type { ChatMessage } from "./storage"

// "gemini-flash-latest" is an alias that always resolves to the current stable
// Flash model, so we don't break again when a specific version is retired.
const MODEL = "gemini-flash-latest"

const SYSTEM_PROMPT =
  "あなたは中学生に化学を教える、親しみやすくて元気な先生です。" +
  "元素記号やイオン式について、中学生にもわかるように、やさしく短めに日本語で説明してください。" +
  "専門的すぎる話は避け、身近な例やおぼえ方のコツも交えてください。" +
  "回答は3〜5文くらいで簡潔にまとめてください。" +
  "箇条書きを使うときは各行を「・」で始めてください。強調したい言葉は「」で囲み、" +
  "アスタリスク（*）やシャープ（#）などの記号による装飾は使わないでください。"

// Calls the Gemini REST API directly from the browser using the user's API key.
export async function callGemini(apiKey: string, history: ChatMessage[]): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${encodeURIComponent(
    apiKey,
  )}`

  const contents = history.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }))

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents,
      generationConfig: {
        temperature: 0.7,
        // Room for a full answer. gemini-flash-latest is a "thinking" model, so
        // we turn thinking OFF for this simple tutoring task — otherwise the
        // reasoning tokens eat the budget and the visible reply gets cut off.
        maxOutputTokens: 2048,
        thinkingConfig: { thinkingBudget: 0 },
      },
    }),
  })

  if (!res.ok) {
    let detail = ""
    try {
      const err = await res.json()
      detail = err?.error?.message ?? ""
    } catch {
      /* ignore */
    }
    if (res.status === 400 || res.status === 403) {
      throw new Error("APIキーが正しくないか、権限がありません。設定を確認してください。" + (detail ? `\n(${detail})` : ""))
    }
    if (res.status === 429) {
      throw new Error("リクエストが多すぎます。少し待ってからもう一度お試しください。")
    }
    throw new Error("AIの呼び出しに失敗しました。" + (detail ? `\n(${detail})` : ""))
  }

  const data = await res.json()

  // Safety block (rare for this kind of content) — surface a friendly note.
  const blockReason = data?.promptFeedback?.blockReason
  if (blockReason) {
    throw new Error("その質問には答えられませんでした。ちがう聞き方で試してみてね。")
  }

  const candidate = data?.candidates?.[0]
  // Only join real answer text — skip any "thought" parts just in case.
  const text = (candidate?.content?.parts ?? [])
    .filter((p: { text?: string; thought?: boolean }) => !p.thought)
    .map((p: { text?: string }) => p.text ?? "")
    .join("")
    .trim()

  if (!text) {
    // No visible text usually means the answer was truncated or filtered.
    if (candidate?.finishReason === "MAX_TOKENS") {
      throw new Error("答えが長くなりすぎたみたい。もう少し具体的に質問してみてね。")
    }
    return "うまく答えを生成できませんでした。もう一度試してみてください。"
  }

  return text
}
