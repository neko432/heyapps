import type { ChatMessage } from "./storage"

// "gemini-flash-latest" is an alias that always resolves to the current stable
// Flash model, so we don't break again when a specific version is retired.
const MODEL = "gemini-flash-latest"

const SYSTEM_PROMPT =
  "あなたは化学が得意な、少しフレンドリーなAIアシスタントです。" +
  "元素記号やイオン式について、中学生にもわかるやさしい日本語で説明してください。" +
  "書き方のルール：" +
  "「みなさんこんにちは！」のような挨拶や長い前置きは書かず、いきなり本題から簡潔に答えること。" +
  "質問に対する答えを最初に述べ、そのあとに補足やおぼえ方のコツを短く添えること。" +
  "先生キャラのような大げさな口調は使わず、自然で少しフレンドリーな話し方にすること。" +
  "記号での装飾（**、##、---など）や、意味のない空白・空行を入れないこと。" +
  "箇条書きが必要なときだけ、行頭に「・」を使うこと。"

// Calls the Gemini REST API directly from the browser using the user's API key.
export async function callGemini(apiKey: string, history: ChatMessage[]): Promise<string> {
  // The key is sent via header instead of the URL so it doesn't end up in
  // browser history or network logs.
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`

  const contents = history.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }))

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents,
      // No maxOutputTokens: the model thinks internally before answering, and
      // that thinking also consumed the old 1024-token cap, cutting replies
      // off mid-sentence. Leaving it unset lets the model finish naturally.
      generationConfig: { temperature: 0.7 },
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
