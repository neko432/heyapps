import { readingChars } from "./romaji"

export type Category = "element" | "ion"
export type Direction = "toName" | "toSymbol"

export interface ElementItem {
  number: number
  symbol: string
  name: string // display name (kanji or katakana)
  reading: string // hiragana reading, used for typing & hints
}

export interface IonItem {
  formula: string // pretty display with superscripts, e.g. Mg²⁺
  ascii: string // typeable form, e.g. mg2+
  name: string // display name
  reading: string // hiragana reading
}

export const ELEMENTS: ElementItem[] = [
  { number: 1, symbol: "H", name: "水素", reading: "すいそ" },
  { number: 2, symbol: "He", name: "ヘリウム", reading: "へりうむ" },
  { number: 3, symbol: "Li", name: "リチウム", reading: "りちうむ" },
  { number: 4, symbol: "Be", name: "ベリリウム", reading: "べりりうむ" },
  { number: 5, symbol: "B", name: "ホウ素", reading: "ほうそ" },
  { number: 6, symbol: "C", name: "炭素", reading: "たんそ" },
  { number: 7, symbol: "N", name: "窒素", reading: "ちっそ" },
  { number: 8, symbol: "O", name: "酸素", reading: "さんそ" },
  { number: 9, symbol: "F", name: "フッ素", reading: "ふっそ" },
  { number: 10, symbol: "Ne", name: "ネオン", reading: "ねおん" },
  { number: 11, symbol: "Na", name: "ナトリウム", reading: "なとりうむ" },
  { number: 12, symbol: "Mg", name: "マグネシウム", reading: "まぐねしうむ" },
  { number: 13, symbol: "Al", name: "アルミニウム", reading: "あるみにうむ" },
  { number: 14, symbol: "Si", name: "ケイ素", reading: "けいそ" },
  { number: 15, symbol: "P", name: "リン", reading: "りん" },
  { number: 16, symbol: "S", name: "硫黄", reading: "いおう" },
  { number: 17, symbol: "Cl", name: "塩素", reading: "えんそ" },
  { number: 18, symbol: "Ar", name: "アルゴン", reading: "あるごん" },
  { number: 19, symbol: "K", name: "カリウム", reading: "かりうむ" },
  { number: 20, symbol: "Ca", name: "カルシウム", reading: "かるしうむ" },
  { number: 21, symbol: "Sc", name: "スカンジウム", reading: "すかんじうむ" },
  { number: 22, symbol: "Ti", name: "チタン", reading: "ちたん" },
  { number: 23, symbol: "V", name: "バナジウム", reading: "ばなじうむ" },
  { number: 24, symbol: "Cr", name: "クロム", reading: "くろむ" },
  { number: 25, symbol: "Mn", name: "マンガン", reading: "まんがん" },
  { number: 26, symbol: "Fe", name: "鉄", reading: "てつ" },
  { number: 27, symbol: "Co", name: "コバルト", reading: "こばると" },
  { number: 28, symbol: "Ni", name: "ニッケル", reading: "にっける" },
  { number: 29, symbol: "Cu", name: "銅", reading: "どう" },
  { number: 30, symbol: "Zn", name: "亜鉛", reading: "あえん" },
  { number: 31, symbol: "Ga", name: "ガリウム", reading: "がりうむ" },
  { number: 32, symbol: "Ge", name: "ゲルマニウム", reading: "げるまにうむ" },
  { number: 33, symbol: "As", name: "ヒ素", reading: "ひそ" },
  { number: 34, symbol: "Se", name: "セレン", reading: "せれん" },
  { number: 35, symbol: "Br", name: "臭素", reading: "しゅうそ" },
  { number: 36, symbol: "Kr", name: "クリプトン", reading: "くりぷとん" },
  { number: 37, symbol: "Rb", name: "ルビジウム", reading: "るびじうむ" },
  { number: 38, symbol: "Sr", name: "ストロンチウム", reading: "すとろんちうむ" },
  { number: 39, symbol: "Y", name: "イットリウム", reading: "いっとりうむ" },
  { number: 40, symbol: "Zr", name: "ジルコニウム", reading: "じるこにうむ" },
  { number: 41, symbol: "Nb", name: "ニオブ", reading: "におぶ" },
  { number: 42, symbol: "Mo", name: "モリブデン", reading: "もりぶでん" },
  { number: 43, symbol: "Tc", name: "テクネチウム", reading: "てくねちうむ" },
  { number: 44, symbol: "Ru", name: "ルテニウム", reading: "るてにうむ" },
  { number: 45, symbol: "Rh", name: "ロジウム", reading: "ろじうむ" },
  { number: 46, symbol: "Pd", name: "パラジウム", reading: "ぱらじうむ" },
  { number: 47, symbol: "Ag", name: "銀", reading: "ぎん" },
  { number: 48, symbol: "Cd", name: "カドミウム", reading: "かどみうむ" },
  { number: 49, symbol: "In", name: "インジウム", reading: "いんじうむ" },
  { number: 50, symbol: "Sn", name: "スズ", reading: "すず" },
  { number: 51, symbol: "Sb", name: "アンチモン", reading: "あんちもん" },
  { number: 52, symbol: "Te", name: "テルル", reading: "てるる" },
  { number: 53, symbol: "I", name: "ヨウ素", reading: "ようそ" },
  { number: 54, symbol: "Xe", name: "キセノン", reading: "きせのん" },
  { number: 55, symbol: "Cs", name: "セシウム", reading: "せしうむ" },
  { number: 56, symbol: "Ba", name: "バリウム", reading: "ばりうむ" },
  { number: 57, symbol: "La", name: "ランタン", reading: "らんたん" },
  { number: 58, symbol: "Ce", name: "セリウム", reading: "せりうむ" },
  { number: 59, symbol: "Pr", name: "プラセオジム", reading: "ぷらせおじむ" },
  { number: 60, symbol: "Nd", name: "ネオジム", reading: "ねおじむ" },
  { number: 61, symbol: "Pm", name: "プロメチウム", reading: "ぷろめちうむ" },
  { number: 62, symbol: "Sm", name: "サマリウム", reading: "さまりうむ" },
  { number: 63, symbol: "Eu", name: "ユウロピウム", reading: "ゆうろぴうむ" },
  { number: 64, symbol: "Gd", name: "ガドリニウム", reading: "がどりにうむ" },
  { number: 65, symbol: "Tb", name: "テルビウム", reading: "てるびうむ" },
  { number: 66, symbol: "Dy", name: "ジスプロシウム", reading: "じすぷろしうむ" },
  { number: 67, symbol: "Ho", name: "ホルミウム", reading: "ほるみうむ" },
  { number: 68, symbol: "Er", name: "エルビウム", reading: "えるびうむ" },
  { number: 69, symbol: "Tm", name: "ツリウム", reading: "つりうむ" },
  { number: 70, symbol: "Yb", name: "イッテルビウム", reading: "いってるびうむ" },
  { number: 71, symbol: "Lu", name: "ルテチウム", reading: "るてちうむ" },
  { number: 72, symbol: "Hf", name: "ハフニウム", reading: "はふにうむ" },
  { number: 73, symbol: "Ta", name: "タンタル", reading: "たんたる" },
  { number: 74, symbol: "W", name: "タングステン", reading: "たんぐすてん" },
  { number: 75, symbol: "Re", name: "レニウム", reading: "れにうむ" },
  { number: 76, symbol: "Os", name: "オスミウム", reading: "おすみうむ" },
  { number: 77, symbol: "Ir", name: "イリジウム", reading: "いりじうむ" },
  { number: 78, symbol: "Pt", name: "白金", reading: "はっきん" },
  { number: 79, symbol: "Au", name: "金", reading: "きん" },
  { number: 80, symbol: "Hg", name: "水銀", reading: "すいぎん" },
  { number: 81, symbol: "Tl", name: "タリウム", reading: "たりうむ" },
  { number: 82, symbol: "Pb", name: "鉛", reading: "なまり" },
  { number: 83, symbol: "Bi", name: "ビスマス", reading: "びすます" },
  { number: 84, symbol: "Po", name: "ポロニウム", reading: "ぽろにうむ" },
  { number: 85, symbol: "At", name: "アスタチン", reading: "あすたちん" },
  { number: 86, symbol: "Rn", name: "ラドン", reading: "らどん" },
  { number: 87, symbol: "Fr", name: "フランシウム", reading: "ふらんしうむ" },
  { number: 88, symbol: "Ra", name: "ラジウム", reading: "らじうむ" },
  { number: 89, symbol: "Ac", name: "アクチニウム", reading: "あくちにうむ" },
  { number: 90, symbol: "Th", name: "トリウム", reading: "とりうむ" },
  { number: 91, symbol: "Pa", name: "プロトアクチニウム", reading: "ぷろとあくちにうむ" },
  { number: 92, symbol: "U", name: "ウラン", reading: "うらん" },
  { number: 93, symbol: "Np", name: "ネプツニウム", reading: "ねぷつにうむ" },
  { number: 94, symbol: "Pu", name: "プルトニウム", reading: "ぷるとにうむ" },
  { number: 95, symbol: "Am", name: "アメリシウム", reading: "あめりしうむ" },
  { number: 96, symbol: "Cm", name: "キュリウム", reading: "きゅりうむ" },
  { number: 97, symbol: "Bk", name: "バークリウム", reading: "ばーくりうむ" },
  { number: 98, symbol: "Cf", name: "カリホルニウム", reading: "かりほるにうむ" },
  { number: 99, symbol: "Es", name: "アインスタイニウム", reading: "あいんすたいにうむ" },
  { number: 100, symbol: "Fm", name: "フェルミウム", reading: "ふぇるみうむ" },
  { number: 101, symbol: "Md", name: "メンデレビウム", reading: "めんでれびうむ" },
  { number: 102, symbol: "No", name: "ノーベリウム", reading: "のーべりうむ" },
  { number: 103, symbol: "Lr", name: "ローレンシウム", reading: "ろーれんしうむ" },
  { number: 104, symbol: "Rf", name: "ラザホージウム", reading: "らざほーじうむ" },
  { number: 105, symbol: "Db", name: "ドブニウム", reading: "どぶにうむ" },
  { number: 106, symbol: "Sg", name: "シーボーギウム", reading: "しーぼーぎうむ" },
  { number: 107, symbol: "Bh", name: "ボーリウム", reading: "ぼーりうむ" },
  { number: 108, symbol: "Hs", name: "ハッシウム", reading: "はっしうむ" },
  { number: 109, symbol: "Mt", name: "マイトネリウム", reading: "まいとねりうむ" },
  { number: 110, symbol: "Ds", name: "ダームスタチウム", reading: "だーむすたちうむ" },
  { number: 111, symbol: "Rg", name: "レントゲニウム", reading: "れんとげにうむ" },
  { number: 112, symbol: "Cn", name: "コペルニシウム", reading: "こぺるにしうむ" },
  { number: 113, symbol: "Nh", name: "ニホニウム", reading: "にほにうむ" },
  { number: 114, symbol: "Fl", name: "フレロビウム", reading: "ふれろびうむ" },
  { number: 115, symbol: "Mc", name: "モスコビウム", reading: "もすこびうむ" },
  { number: 116, symbol: "Lv", name: "リバモリウム", reading: "りばもりうむ" },
  { number: 117, symbol: "Ts", name: "テネシン", reading: "てねしん" },
  { number: 118, symbol: "Og", name: "オガネソン", reading: "おがねそん" },
]

// Middle-school level ions.
export const IONS: IonItem[] = [
  { formula: "H⁺", ascii: "h+", name: "水素イオン", reading: "すいそいおん" },
  { formula: "Na⁺", ascii: "na+", name: "ナトリウムイオン", reading: "なとりうむいおん" },
  { formula: "K⁺", ascii: "k+", name: "カリウムイオン", reading: "かりうむいおん" },
  { formula: "Ag⁺", ascii: "ag+", name: "銀イオン", reading: "ぎんいおん" },
  { formula: "Cu²⁺", ascii: "cu2+", name: "銅イオン", reading: "どういおん" },
  { formula: "Mg²⁺", ascii: "mg2+", name: "マグネシウムイオン", reading: "まぐねしうむいおん" },
  { formula: "Ca²⁺", ascii: "ca2+", name: "カルシウムイオン", reading: "かるしうむいおん" },
  { formula: "Zn²⁺", ascii: "zn2+", name: "亜鉛イオン", reading: "あえんいおん" },
  { formula: "Ba²⁺", ascii: "ba2+", name: "バリウムイオン", reading: "ばりうむいおん" },
  { formula: "Fe²⁺", ascii: "fe2+", name: "鉄(II)イオン", reading: "てついおん" },
  { formula: "Fe³⁺", ascii: "fe3+", name: "鉄(III)イオン", reading: "てついおん" },
  { formula: "Al³⁺", ascii: "al3+", name: "アルミニウムイオン", reading: "あるみにうむいおん" },
  { formula: "NH₄⁺", ascii: "nh4+", name: "アンモニウムイオン", reading: "あんもにうむいおん" },
  { formula: "Cl⁻", ascii: "cl-", name: "塩化物イオン", reading: "えんかぶついおん" },
  { formula: "OH⁻", ascii: "oh-", name: "水酸化物イオン", reading: "すいさんかぶついおん" },
  { formula: "NO₃⁻", ascii: "no3-", name: "硝酸イオン", reading: "しょうさんいおん" },
  { formula: "O²⁻", ascii: "o2-", name: "酸化物イオン", reading: "さんかぶついおん" },
  { formula: "S²⁻", ascii: "s2-", name: "硫化物イオン", reading: "りゅうかぶついおん" },
  { formula: "SO₄²⁻", ascii: "so42-", name: "硫酸イオン", reading: "りゅうさんいおん" },
  { formula: "CO₃²⁻", ascii: "co32-", name: "炭酸イオン", reading: "たんさんいおん" },
]

export interface Question {
  id: string
  prompt: string // large display text
  promptLabel: string // small description under the prompt
  mode: "romaji" | "ascii"
  reading?: string // hiragana target for romaji mode
  ascii?: string // typeable target for ascii mode
  answerDisplay: string // human-friendly answer (for hints & results)
  answerChars: string[] // per-character answer for progressive hint reveal
}

export function buildQuestions(category: Category, direction: Direction): Question[] {
  if (category === "element") {
    return ELEMENTS.map((el) => {
      if (direction === "toName") {
        return {
          id: "el-" + el.symbol,
          prompt: el.symbol,
          promptLabel: "この元素記号の名前は？",
          mode: "romaji" as const,
          reading: el.reading,
          answerDisplay: el.name,
          answerChars: readingChars(el.reading),
        }
      }
      return {
        id: "el-" + el.symbol,
        prompt: el.name,
        promptLabel: "この元素の記号は？",
        mode: "ascii" as const,
        ascii: el.symbol.toLowerCase(),
        answerDisplay: el.symbol,
        answerChars: Array.from(el.symbol),
      }
    })
  }

  return IONS.map((ion, i) => {
    if (direction === "toName") {
      return {
        id: "ion-" + i,
        prompt: ion.formula,
        promptLabel: "このイオンの名前は？",
        mode: "romaji" as const,
        reading: ion.reading,
        answerDisplay: ion.name,
        answerChars: readingChars(ion.reading),
      }
    }
    return {
      id: "ion-" + i,
      prompt: ion.name,
      promptLabel: "このイオンの化学式は？",
      mode: "ascii" as const,
      ascii: ion.ascii,
      answerDisplay: ion.formula,
      answerChars: Array.from(ion.ascii),
    }
  })
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
