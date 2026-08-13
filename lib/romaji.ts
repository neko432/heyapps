// Incremental romaji matching engine.
// Given a target reading in hiragana and the romaji the user has typed so far,
// determine whether the typed string is a valid (partial) romanization.
// Alternative romanizations are all accepted (e.g. shi/si, ji/zi, chi/ti, fu/hu...).

type Token = { options: string[]; len: number }

// Base single-kana romaji table (hiragana). Each kana maps to every accepted spelling.
const BASE: Record<string, string[]> = {
  あ: ["a"], い: ["i"], う: ["u"], え: ["e"], お: ["o"],
  か: ["ka", "ca"], き: ["ki"], く: ["ku", "cu"], け: ["ke"], こ: ["ko", "co"],
  が: ["ga"], ぎ: ["gi"], ぐ: ["gu"], げ: ["ge"], ご: ["go"],
  さ: ["sa"], し: ["shi", "si"], す: ["su"], せ: ["se"], そ: ["so"],
  ざ: ["za"], じ: ["ji", "zi"], ず: ["zu"], ぜ: ["ze"], ぞ: ["zo"],
  た: ["ta"], ち: ["chi", "ti"], つ: ["tsu", "tu"], て: ["te"], と: ["to"],
  だ: ["da"], ぢ: ["di"], づ: ["du"], で: ["de"], ど: ["do"],
  な: ["na"], に: ["ni"], ぬ: ["nu"], ね: ["ne"], の: ["no"],
  は: ["ha"], ひ: ["hi"], ふ: ["fu", "hu"], へ: ["he"], ほ: ["ho"],
  ば: ["ba"], び: ["bi"], ぶ: ["bu"], べ: ["be"], ぼ: ["bo"],
  ぱ: ["pa"], ぴ: ["pi"], ぷ: ["pu"], ぺ: ["pe"], ぽ: ["po"],
  ま: ["ma"], み: ["mi"], む: ["mu"], め: ["me"], も: ["mo"],
  や: ["ya"], ゆ: ["yu"], よ: ["yo"],
  ら: ["ra"], り: ["ri"], る: ["ru"], れ: ["re"], ろ: ["ro"],
  わ: ["wa"], を: ["wo", "o"],
  ゔ: ["vu"],
  ぁ: ["xa", "la"], ぃ: ["xi", "li"], ぅ: ["xu", "lu"], ぇ: ["xe", "le"], ぉ: ["xo", "lo"],
}

// Two-kana combinations (youon and foreign sounds).
const COMBO: Record<string, string[]> = {
  きゃ: ["kya"], きゅ: ["kyu"], きょ: ["kyo"],
  ぎゃ: ["gya"], ぎゅ: ["gyu"], ぎょ: ["gyo"],
  しゃ: ["sha", "sya"], しゅ: ["shu", "syu"], しょ: ["sho", "syo"],
  じゃ: ["ja", "jya", "zya"], じゅ: ["ju", "jyu", "zyu"], じょ: ["jo", "jyo", "zyo"],
  ちゃ: ["cha", "tya"], ちゅ: ["chu", "tyu"], ちょ: ["cho", "tyo"],
  にゃ: ["nya"], にゅ: ["nyu"], にょ: ["nyo"],
  ひゃ: ["hya"], ひゅ: ["hyu"], ひょ: ["hyo"],
  びゃ: ["bya"], びゅ: ["byu"], びょ: ["byo"],
  ぴゃ: ["pya"], ぴゅ: ["pyu"], ぴょ: ["pyo"],
  みゃ: ["mya"], みゅ: ["myu"], みょ: ["myo"],
  りゃ: ["rya"], りゅ: ["ryu"], りょ: ["ryo"],
  ふぁ: ["fa"], ふぃ: ["fi"], ふぇ: ["fe"], ふぉ: ["fo"],
  てぃ: ["ti", "texi"], でぃ: ["di", "dexi"],
  うぃ: ["wi"], うぇ: ["we"],
}

const VOWEL_OF: Record<string, string> = {
  a: "a", i: "i", u: "u", e: "e", o: "o",
}

// Determine the trailing vowel letter for a kana (used for the long vowel mark "ー").
function vowelFor(kana: string): string {
  const opts = BASE[kana] ?? COMBO[kana]
  if (!opts) return "-"
  const first = opts[0]
  const last = first[first.length - 1]
  return VOWEL_OF[last] ?? "-"
}

// Produce candidate tokens starting at index `i` of the kana string.
function tokensAt(kana: string, i: number): Token[] {
  const ch = kana[i]
  const tokens: Token[] = []

  // Long vowel mark: type the trailing vowel of the previous kana, or a dash.
  if (ch === "ー" || ch === "－" || ch === "-") {
    const prev = i > 0 ? kana[i - 1] : ""
    const v = vowelFor(prev)
    tokens.push({ options: [v, "-"], len: 1 })
    return tokens
  }

  // Sokuon: double the first consonant of the following sound.
  if (ch === "っ" || ch === "ッ") {
    const nextTokens = tokensAt(kana, i + 1)
    const letters = new Set<string>()
    for (const t of nextTokens) {
      for (const o of t.options) {
        if (o.length > 0 && !"aeiou".includes(o[0])) letters.add(o[0])
      }
    }
    // Also allow explicit small-tsu spellings.
    tokens.push({ options: [...letters, "xtu", "ltu"], len: 1 })
    return tokens
  }

  // Syllabic n.
  if (ch === "ん" || ch === "ン") {
    tokens.push({ options: ["nn", "n'", "n", "xn"], len: 1 })
    return tokens
  }

  // Two-kana combos.
  const two = kana.slice(i, i + 2)
  if (COMBO[two]) tokens.push({ options: COMBO[two], len: 2 })

  // Single kana.
  if (BASE[ch]) tokens.push({ options: BASE[ch], len: 1 })

  return tokens
}

export type RomajiResult = "match" | "prefix" | "no"

// Normalise a reading to hiragana so both hiragana and katakana readings work.
export function toHiragana(input: string): string {
  let out = ""
  for (const c of input) {
    const code = c.charCodeAt(0)
    // Katakana block -> hiragana (keep ー as is).
    if (code >= 0x30a1 && code <= 0x30f6) out += String.fromCharCode(code - 0x60)
    else out += c
  }
  return out
}

/**
 * Analyse the typed romaji against the target hiragana reading.
 * Returns "match" when fully typed, "prefix" when a valid partial, "no" otherwise.
 */
export function checkRomaji(reading: string, typedRaw: string): RomajiResult {
  const kana = toHiragana(reading)
  const typed = typedRaw.toLowerCase()
  const R = typed.length
  const K = kana.length

  const visited = new Set<string>()
  const stack: Array<[number, number]> = [[0, 0]]
  let canMatch = false
  let canPrefix = false

  while (stack.length) {
    const [ri, ki] = stack.pop()!
    const key = ri + "," + ki
    if (visited.has(key)) continue
    visited.add(key)

    if (ri === R) {
      canPrefix = true
      if (ki === K) canMatch = true
      continue
    }
    if (ki === K) continue // still romaji left but no kana -> dead end

    const rest = typed.slice(ri)
    for (const token of tokensAt(kana, ki)) {
      for (const opt of token.options) {
        if (rest.startsWith(opt)) {
          // Consumed a whole token.
          stack.push([ri + opt.length, ki + token.len])
        } else if (opt.startsWith(rest)) {
          // Remaining romaji is a partial spelling of this token -> valid ongoing.
          canPrefix = true
        }
      }
    }
  }

  if (canMatch) return "match"
  if (canPrefix) return "prefix"
  return "no"
}

// Split a reading into display characters (for progressive hint reveal).
export function readingChars(reading: string): string[] {
  const chars: string[] = []
  const arr = Array.from(reading)
  for (let i = 0; i < arr.length; i++) {
    const c = arr[i]
    const next = arr[i + 1]
    // Keep youon (small ya/yu/yo) attached to the preceding kana.
    if (next && "ゃゅょャュョ".includes(next)) {
      chars.push(c + next)
      i++
    } else {
      chars.push(c)
    }
  }
  return chars
}
