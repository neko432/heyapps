"use client"

import { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Burst } from "./game-fx"
import { sound } from "@/lib/sound"

// -------------------------------------------------------------------------
// Atom-chan — a yui540.com-style clickable mascot ("僕をクリックしてみて").
// Pokes cycle through reactions, every few pokes it shares a chemistry
// tidbit, and a burst of confetti fires on milestone pokes.
// -------------------------------------------------------------------------

const INVITE = "ぼくをクリックしてみて！"

const REACTIONS = ["わっ！", "くすぐったい！", "えへへ", "ひゃっ！", "もういっかい！", "ぐるぐる〜"]

const TRIVIA = [
  "「水兵リーベぼくの船」でH He Li Be…と覚えられるよ",
  "Auは金。ラテン語のaurum（輝くもの）が由来だよ",
  "ダイヤモンドも鉛筆のしんも、おなじ炭素Cなんだ",
  "バナナにはカリウムKがたっぷり入ってるよ",
  "人のからだの約6割は水H₂Oでできてるんだ",
  "ヘリウムHeを吸うと声が高くなるのは音速が速いから！",
  "Naの元素記号はラテン語のnatriumから来てるよ",
  "水素Hは宇宙でいちばん多い元素だよ",
]

export function Mascot() {
  const [pokes, setPokes] = useState(0)
  const [bubble, setBubble] = useState(INVITE)
  const [burstSeed, setBurstSeed] = useState(0)
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (resetTimer.current) clearTimeout(resetTimer.current)
    }
  }, [])

  function poke() {
    const next = pokes + 1
    setPokes(next)
    sound.combo(next % 10)

    // Every 3rd poke shares a chemistry tidbit, otherwise a quick reaction.
    if (next % 3 === 0) {
      setBubble(TRIVIA[Math.floor(Math.random() * TRIVIA.length)])
    } else {
      setBubble(REACTIONS[Math.floor(Math.random() * REACTIONS.length)])
    }

    // Milestone pokes get a confetti burst.
    if (next % 5 === 0) {
      setBurstSeed(next)
      sound.correct()
    }

    // Fall back to the invite message after a pause.
    if (resetTimer.current) clearTimeout(resetTimer.current)
    resetTimer.current = setTimeout(() => setBubble(INVITE), 4500)
  }

  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-30 flex flex-col items-end gap-2">
      {/* Speech bubble */}
      <AnimatePresence mode="wait">
        <motion.div
          key={bubble}
          initial={{ opacity: 0, y: 6, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -4, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 480, damping: 24 }}
          className="pointer-events-none relative max-w-52 rounded-2xl border-2 border-border bg-card px-3 py-2 text-xs font-bold leading-relaxed text-foreground shadow-pop-sm"
        >
          {bubble}
          {/* Bubble tail */}
          <span className="absolute -bottom-[7px] right-6 size-3 rotate-45 border-b-2 border-r-2 border-border bg-card" />
        </motion.div>
      </AnimatePresence>

      {/* Atom-chan body — re-keyed per poke so the hop replays every click. */}
      <motion.button
        key={pokes}
        type="button"
        onClick={poke}
        aria-label="マスコットのアトムちゃんをつつく"
        initial={pokes === 0 ? false : { y: 0, rotate: 0, scale: 1 }}
        animate={
          pokes === 0
            ? undefined
            : {
                y: [0, -16, 0],
                rotate: [0, pokes % 2 === 0 ? 14 : -14, 0],
                scale: [1, 1.12, 1],
              }
        }
        transition={{ duration: 0.45, ease: "easeOut" }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        className="pointer-events-auto relative grid size-16 cursor-pointer place-items-center"
      >
        {/* Confetti on milestone pokes */}
        {burstSeed > 0 && (
          <span key={burstSeed} className="absolute left-1/2 top-1/2">
            <Burst />
          </span>
        )}

        {/* Orbiting electron ring */}
        <span aria-hidden className="animate-mascot-orbit absolute -inset-1.5 rounded-full border-2 border-dashed border-pop-teal/60">
          <span className="absolute -top-1 left-1/2 size-2.5 -translate-x-1/2 rounded-full bg-pop-pink" />
        </span>

        {/* Face */}
        <span className="relative grid size-13 place-items-center rounded-full bg-pop-teal shadow-pop-sm">
          <span className="flex items-center gap-2">
            <span className="mascot-eye" />
            <span className="mascot-eye" />
          </span>
          {/* Mouth */}
          <span className="absolute bottom-3 left-1/2 h-1.5 w-2.5 -translate-x-1/2 rounded-b-full bg-foreground/70" />
          {/* Cheeks */}
          <span className="absolute bottom-4 left-1.5 size-1.5 rounded-full bg-pop-pink/70" />
          <span className="absolute bottom-4 right-1.5 size-1.5 rounded-full bg-pop-pink/70" />
        </span>
      </motion.button>
    </div>
  )
}
