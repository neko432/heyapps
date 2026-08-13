import type { ChatMessage } from "./storage"

// Pinned to a specific stable model instead of a "latest" alias on purpose:
// the alias can resolve to a thinking model whose reasoning tokens eat into the
// output budget and whose "thought" parts leak into the reply, producing
// garbled / truncated messages. gemini-2.5-flash is stable and lets us disable
// thinking explicitly below.
const MODEL = "gemini-2.5-flash"

const SYSTEM_PROMPT =
  "あなたは中学生に化学を教える、親しみやすくて元気な先生です。" +
  "元素記号やイオン式について、中学生にもわかるように、やさしく短めに日本語で説明してください。" +
  "専門的すぎる話は避け、身近な例やおぼえ方のコツも交えてください。"

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
        maxOutputTokens: 2048,
        // Turn off "thinking" so the whole token budget goes to the actual
        // answer (no truncation) and no reasoning parts leak into the reply.
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
  const candidate = data?.candidates?.[0]

  // Only keep real answer parts — drop any "thought" parts so internal
  // reasoning can never leak into the visible reply.
  const parts: { text?: string; thought?: boolean }[] = candidate?.content?.parts ?? []
  const text = parts
    .filter((p) => !p.thought)
    .map((p) => p.text ?? "")
    .join("")
    .trim()

  if (text) return text

  // No usable text: give a reason-specific hint instead of a silent blank.
  if (candidate?.finishReason === "MAX_TOKENS") {
    return "答えが長くなりすぎたみたい。もう少し具体的に質問してみてね。"
  }
  if (candidate?.finishReason === "SAFETY") {
    return "その内容にはうまく答えられませんでした。別の聞き方で試してみてね。"
  }
  return "うまく答えを生成できませんでした。もう一度試してみてください。"
}
