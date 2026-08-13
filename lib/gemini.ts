import type { ChatMessage } from "./storage"

// "gemini-flash-latest" is an alias that always resolves to the current stable
// Flash model, so we don't break again when a specific version is retired.
const MODEL = "gemini-flash-latest"

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
      generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
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
  const text = data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("") ?? ""
  return text.trim() || "うまく答えを生成できませんでした。もう一度試してみてください。"
}
