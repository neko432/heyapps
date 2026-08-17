"use client"

import { useMemo } from "react"
import { motion } from "framer-motion"

// Shared pop palette (CSS custom properties) reused across every effect.
const POP = [
  "var(--pop-pink)",
  "var(--pop-yellow)",
  "var(--pop-teal)",
  "var(--pop-blue)",
  "var(--pop-orange)",
  "var(--primary)",
]

// -------------------------------------------------------------------------
// Confetti burst — a quick radial pop of colored squares over the card.
// -------------------------------------------------------------------------
export function Burst() {
  const count = 14
  return (
    <>
      {Array.from({ length: count }).map((_, i) => {
        const angle = (i / count) * Math.PI * 2 + Math.random() * 0.4
        const dist = 80 + Math.random() * 70
        const size = 8 + Math.random() * 8
        return (
          <motion.span
            key={i}
            initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
            animate={{
              x: Math.cos(angle) * dist,
              y: Math.sin(angle) * dist,
              scale: [0, 1, 0.5],
              opacity: [1, 1, 0],
              rotate: Math.random() * 180,
            }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="absolute rounded-[3px]"
            style={{ width: size, height: size, backgroundColor: POP[i % POP.length] }}
          />
        )
      })}
    </>
  )
}

// -------------------------------------------------------------------------
// Praise pop — a bubbly sticker word that springs in and floats away.
// -------------------------------------------------------------------------
export function PraisePop({ text, tone }: { text: string; tone: string }) {
  return (
    <motion.div
      initial={{ scale: 0, y: 0, rotate: -10, opacity: 0 }}
      animate={{
        scale: [0, 1.3, 1, 1],
        y: [0, -10, -20, -52],
        rotate: [-10, 5, -3, -3],
        opacity: [0, 1, 1, 0],
      }}
      transition={{ duration: 0.95, times: [0, 0.22, 0.55, 1], ease: "easeOut" }}
      className="font-pop pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-[8.5rem] whitespace-nowrap text-4xl sm:text-5xl"
      style={{
        color: tone,
        WebkitTextStroke: "3px var(--card)",
        paintOrder: "stroke",
        filter: "drop-shadow(0 4px 0 color-mix(in oklch, var(--foreground) 22%, transparent))",
      }}
    >
      {text}
    </motion.div>
  )
}

// -------------------------------------------------------------------------
// Combo badge — pinned counter that re-pulses each time it increments.
// -------------------------------------------------------------------------
export function ComboBadge({ combo }: { combo: number }) {
  return (
    <motion.div
      key={combo}
      initial={{ scale: 1.6, rotate: -8 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: "spring", stiffness: 500, damping: 14 }}
      className="font-pop pointer-events-none absolute right-0 top-0 z-10 flex items-center gap-1 rounded-full border-2 border-border bg-pop-yellow px-3 py-1 text-foreground shadow-pop"
    >
      <motion.span
        animate={{ scale: [1, 1.35, 1] }}
        transition={{ duration: 0.5, repeat: Number.POSITIVE_INFINITY }}
        className="text-lg leading-none"
      >
        🔥
      </motion.span>
      <span className="text-xl tabular-nums leading-none">{combo}</span>
      <span className="text-xs leading-none">コンボ</span>
    </motion.div>
  )
}

// -------------------------------------------------------------------------
// Confetti rain — colored ribbons falling from the top of the screen.
// Used on the result screen when the player sets a new personal best.
// -------------------------------------------------------------------------
export function ConfettiRain({ seed = 1 }: { seed?: number }) {
  const pieces = useMemo(() => {
    const rand = mulberry32(seed)
    return Array.from({ length: 36 }).map(() => ({
      left: rand() * 100,
      delay: rand() * 0.9,
      dur: 1.6 + rand() * 1.4,
      w: 8 + rand() * 6,
      h: 12 + rand() * 10,
      color: POP[Math.floor(rand() * POP.length)],
      drift: (rand() - 0.5) * 120,
      spin: (rand() - 0.5) * 900,
    }))
  }, [seed])

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-40 overflow-hidden">
      {pieces.map((p, i) => (
        <motion.span
          key={i}
          initial={{ y: "-8vh", x: 0, rotate: 0, opacity: 1 }}
          animate={{ y: "110vh", x: p.drift, rotate: p.spin, opacity: [1, 1, 0.9] }}
          transition={{ duration: p.dur, delay: p.delay, ease: "easeIn" }}
          className="absolute top-0 rounded-[2px]"
          style={{ left: `${p.left}%`, width: p.w, height: p.h, backgroundColor: p.color }}
        />
      ))}
    </div>
  )
}

// -------------------------------------------------------------------------
// Special celebration — the rare, full-screen "wow" moment.
// -------------------------------------------------------------------------
const SPECIAL_WORDS = ["パーフェクト!", "ミラクル!", "スーパー!", "でんせつ!", "かんぺき!", "ゴッド!"]
const RAIN_GLYPHS = ["⭐", "✨", "🌟", "💫", "🎉", "🎊", "💜", "🩵", "🧪", "⚛️"]

export function SpecialCelebration({ seed }: { seed: number }) {
  // Everything derives from the seed so a fresh fire re-randomizes cleanly.
  const { word, drops } = useMemo(() => {
    const rand = mulberry32(seed)
    const word = SPECIAL_WORDS[Math.floor(rand() * SPECIAL_WORDS.length)]
    const drops = Array.from({ length: 28 }).map(() => ({
      left: rand() * 100,
      delay: rand() * 0.5,
      dur: 1.1 + rand() * 0.9,
      size: 18 + rand() * 26,
      glyph: RAIN_GLYPHS[Math.floor(rand() * RAIN_GLYPHS.length)],
      drift: (rand() - 0.5) * 80,
      spin: (rand() - 0.5) * 720,
    }))
    return { word, drops }
  }, [seed])

  return (
    <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden">
      {/* Quick screen flash. */}
      <motion.div
        initial={{ opacity: 0.55 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="absolute inset-0 bg-card"
      />

      {/* Expanding rainbow shockwave rings. */}
      {[0, 0.12].map((delay, i) => (
        <motion.div
          key={i}
          initial={{ scale: 0, opacity: 0.9 }}
          animate={{ scale: 3.4, opacity: 0 }}
          transition={{ duration: 1, delay, ease: "easeOut" }}
          className="absolute left-1/2 top-1/2 size-56 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            border: "10px solid transparent",
            borderImage: "linear-gradient(120deg, var(--pop-pink), var(--pop-yellow), var(--pop-teal), var(--pop-blue)) 1",
          }}
        />
      ))}

      {/* Emoji rain. */}
      {drops.map((d, i) => (
        <motion.span
          key={i}
          initial={{ y: "-12vh", x: 0, opacity: 0, rotate: 0 }}
          animate={{ y: "112vh", x: d.drift, opacity: [0, 1, 1, 0.9], rotate: d.spin }}
          transition={{ duration: d.dur, delay: d.delay, ease: "easeIn" }}
          className="absolute top-0"
          style={{ left: `${d.left}%`, fontSize: d.size }}
        >
          {d.glyph}
        </motion.span>
      ))}

      {/* Headline in the 3D Rampart face with an animated rainbow fill. */}
      <motion.div
        initial={{ scale: 0.2, rotate: -12, opacity: 0 }}
        animate={{ scale: [0.2, 1.2, 1, 1, 0.9], rotate: [-12, 6, -2, -2, -2], opacity: [0, 1, 1, 1, 0] }}
        transition={{ duration: 1.7, times: [0, 0.25, 0.4, 0.85, 1], ease: "easeOut" }}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
      >
        <span className="text-rainbow font-rampart block text-center text-6xl sm:text-8xl">{word}</span>
      </motion.div>
    </div>
  )
}

// Tiny deterministic PRNG so a given seed always renders the same layout.
function mulberry32(a: number) {
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
