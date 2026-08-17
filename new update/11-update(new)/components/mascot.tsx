"use client"

import { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Burst } from "./game-fx"
import { sound } from "@/lib/sound"

const INVITE = "ぼくをクリックしてみて！"
const REACTIONS = [
  "わっ！電子が飛び出すかと思った！",
  "くすぐったい！そこは最外殻だよ",
  "いまのクリック、反応速度はやい！",
  "もういっかい！次は何が起きるかな",
  "ぼくはアトムちゃん。原子だけど元気！",
  "その調子、指も頭もウォーミングアップ！",
  "押されるたびに励起状態になっちゃう",
  "いま一瞬だけ希ガスみたいに落ち着いたよ",
]
const TRIVIA = [
  "「水兵リーベぼくの船」でH He Li Be…と覚えられるよ",
  "Auは金。ラテン語のaurum（輝くもの）が由来だよ",
  "ダイヤモンドも鉛筆のしんも、おなじ炭素Cなんだ",
  "バナナにはカリウムKがたっぷり入ってるよ",
  "ヘリウムHeで声が高く聞こえるのは音速が速いから",
  "Naはラテン語のnatriumから来ているよ",
  "水素Hは宇宙でいちばん多い元素だよ",
  "臭素Brは常温で液体のめずらしい非金属だよ",
  "水銀Hgは常温で液体の金属。触るのは危険だよ",
  "Feは鉄。ラテン語のferrumが名前のもとだよ",
  "陽イオンは電子を失ってプラスになるよ",
  "陰イオンは電子を受け取ってマイナスになるよ",
  "Cl⁻とNa⁺が出会うと、おなじみの食塩NaClになるよ",
  "元素番号は原子核の陽子の数と同じなんだ",
]
const CHEERS = [
  "間違えた問題ほど、次に強くなれる問題だよ",
  "速さより正確さ。正確さのあとに速さがついてくる！",
  "10問モードで毎日ちょっとずつもおすすめ",
  "苦手10問は、君だけの特訓メニューだよ",
  "指が止まったら、声に出してから打ってみよう",
  "覚えるコツは短く何度も。化学反応みたいに積み重なるよ",
]
const RARE_LINES = [
  "ラッキー！周期表の7番は窒素Nだよ",
  "ネオンみたいに輝いてる！",
  "第18族の希ガスが全員集合した気分！",
  "鉄Feみたいに粘り強い君はすごい！",
  "君の挑戦がクリプトンKrみたいに輝いてる！",
  "続ける力は君の才能だよ！",
  "君の指先、フェルミウムFm並のエネルギーだ！",
  "オガネソンOg！これですべての元素を制覇した気分！",
]

function chooseDifferent(pool: string[], previous: string) {
  const choices = pool.filter((line) => line !== previous)
  return choices[Math.floor(Math.random() * choices.length)] ?? pool[0]
}

export function Mascot() {
  const [pokes, setPokes] = useState(0)
  const [bubble, setBubble] = useState(INVITE)
  const [burstSeed, setBurstSeed] = useState(0)
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => { if (resetTimer.current) clearTimeout(resetTimer.current) }, [])

  function poke() {
    const next = pokes + 1
    setPokes(next)
    sound.mascot()

    // 10% chance to be RARE
    const isRare = Math.random() < 0.1
    let newBubble = ""
    
    if (isRare) newBubble = chooseDifferent(RARE_LINES, bubble)
    else if (next % 5 === 0) newBubble = chooseDifferent(CHEERS, bubble)
    else if (next % 3 === 0) newBubble = chooseDifferent(TRIVIA, bubble)
    else newBubble = chooseDifferent(REACTIONS, bubble)

    setBubble(newBubble)

    if (isRare) {
      setBurstSeed(next)
    }
    
    if (resetTimer.current) clearTimeout(resetTimer.current)
    resetTimer.current = setTimeout(() => setBubble(INVITE), 5200)
  }

  const excited = bubble !== INVITE && RARE_LINES.includes(bubble)

  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-30 flex flex-col items-end gap-2">
      <AnimatePresence mode="popLayout">
        <motion.div key={bubble} role="status" initial={{ opacity: 0, y: 6, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.08 } }} transition={{ type: "spring", stiffness: 480, damping: 24 }} className="pointer-events-none relative max-w-60 rounded-2xl border-2 border-border bg-card px-3 py-2 text-xs font-bold leading-relaxed text-foreground shadow-pop-sm">
          {bubble}
          <span className="absolute -bottom-[7px] right-6 size-3 rotate-45 border-b-2 border-r-2 border-border bg-card" />
        </motion.div>
      </AnimatePresence>

      <motion.button key={pokes} type="button" onClick={poke} aria-label={`マスコットのアトムちゃんをつつく。現在${pokes}回`} initial={pokes === 0 ? false : { y: 0, rotate: 0, scale: 1 }} animate={pokes === 0 ? undefined : { y: [0, -16, 0], rotate: [0, pokes % 2 === 0 ? 14 : -14, 0], scale: excited ? [1, 1.3, 1] : [1, 1.12, 1] }} transition={{ duration: excited ? 0.7 : 0.45, ease: "easeOut" }} whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }} className="pointer-events-auto relative grid size-16 cursor-pointer place-items-center">
        {burstSeed > 0 && <span key={burstSeed} className="absolute left-1/2 top-1/2"><Burst /></span>}
        {excited && <motion.span initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: -58 }} className="absolute font-pop text-lg font-black text-primary">RARE!</motion.span>}
        <span aria-hidden className={`animate-mascot-orbit absolute -inset-1.5 rounded-full border-2 border-dashed ${excited ? "border-pop-yellow" : "border-pop-teal/60"}`}>
          <span className="absolute -top-1 left-1/2 size-2.5 -translate-x-1/2 rounded-full bg-pop-pink" />
        </span>
        <span className={`pointer-events-auto animate-mascot-idle relative grid size-13 place-items-center rounded-full shadow-pop-sm ${excited ? "bg-pop-yellow" : "bg-pop-teal"}`}>
          <span className="flex items-center gap-2"><span className="mascot-eye" /><span className="mascot-eye" /></span>
          <span className="absolute bottom-3 left-1/2 h-1.5 w-2.5 -translate-x-1/2 rounded-b-full bg-foreground/70" />
          <span className="absolute bottom-4 left-1.5 size-1.5 rounded-full bg-pop-pink/70" />
          <span className="absolute bottom-4 right-1.5 size-1.5 rounded-full bg-pop-pink/70" />
        </span>
      </motion.button>
    </div>
  )
}
