"use client"

import { useEffect, useState, type ReactNode } from "react"

// -------------------------------------------------------------------------
// yui540-inspired screen transition.
// When `transitionKey` changes, staggered colored panels sweep down and
// cover the screen, the content swaps while hidden, then the panels
// retract upward to reveal the new screen. Also plays once on first load
// as an "opening curtain".
// -------------------------------------------------------------------------

const PANEL_COLORS = ["var(--pop-pink)", "var(--pop-yellow)", "var(--pop-teal)", "var(--primary)"]
const STAGGER_MS = 70
const PANEL_MS = 380
// Time until the last panel finishes covering the screen.
const COVER_TOTAL = PANEL_MS + STAGGER_MS * (PANEL_COLORS.length - 1)

type Phase = "idle" | "cover" | "reveal"

export function CurtainTransition({
  transitionKey,
  children,
}: {
  transitionKey: string
  children: ReactNode
}) {
  const [shown, setShown] = useState(() => ({ key: transitionKey, node: children }))
  // Start in "reveal" so the first paint opens like a stage curtain.
  const [phase, setPhase] = useState<Phase>("reveal")

  useEffect(() => {
    // Same screen: just keep the rendered children fresh (state updates etc).
    if (transitionKey === shown.key) {
      setShown((s) => (s.node === children ? s : { ...s, node: children }))
      return
    }

    // New screen: cover, swap while hidden, then reveal.
    setPhase("cover")
    const swap = setTimeout(() => {
      window.scrollTo(0, 0)
      setShown({ key: transitionKey, node: children })
      setPhase("reveal")
    }, COVER_TOTAL)
    const done = setTimeout(() => setPhase("idle"), COVER_TOTAL * 2 + 80)
    return () => {
      clearTimeout(swap)
      clearTimeout(done)
    }
  }, [transitionKey, children, shown.key])

  // Clear the initial reveal once it finishes.
  useEffect(() => {
    if (phase !== "reveal") return
    const t = setTimeout(() => setPhase("idle"), COVER_TOTAL + 80)
    return () => clearTimeout(t)
  }, [phase])

  return (
    <>
      {/* Block clicks mid-transition so nobody double-navigates. */}
      <div className={phase === "cover" ? "pointer-events-none" : undefined}>{shown.node}</div>

      {phase !== "idle" && (
        <div aria-hidden className="pointer-events-none fixed inset-0 z-[70] flex">
          {PANEL_COLORS.map((color, i) => (
            <div
              key={`${phase}-${i}`}
              className={`h-full flex-1 ${phase === "cover" ? "curtain-panel-in" : "curtain-panel-out"}`}
              style={{ backgroundColor: color, animationDelay: `${i * STAGGER_MS}ms` }}
            />
          ))}
        </div>
      )}
    </>
  )
}
