"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"

const TILES = [
  { symbol: "H", name: "水素", className: "reaction-tile-h" },
  { symbol: "O", name: "酸素", className: "reaction-tile-o" },
  { symbol: "Na", name: "ナトリウム", className: "reaction-tile-na" },
  { symbol: "Cl", name: "塩素", className: "reaction-tile-cl" },
  { symbol: "C", name: "炭素", className: "reaction-tile-c" },
  { symbol: "Fe", name: "鉄", className: "reaction-tile-fe" },
]

const COVER_MS = 520
const REVEAL_MS = 620

type Phase = "idle" | "cover" | "reveal"

export function CurtainTransition({ transitionKey, children }: { transitionKey: string; children: ReactNode }) {
  const [shown, setShown] = useState(() => ({ key: transitionKey, node: children }))
  const [phase, setPhase] = useState<Phase>("idle")
  const running = useRef(false)

  useEffect(() => {
    if (transitionKey === shown.key) return
    if (running.current) return

    running.current = true
    setPhase("cover")
    const swap = window.setTimeout(() => {
      window.scrollTo(0, 0)
      setShown({ key: transitionKey, node: children })
      setPhase("reveal")
    }, COVER_MS)
    const done = window.setTimeout(() => {
      setPhase("idle")
      running.current = false
    }, COVER_MS + REVEAL_MS)

    return () => {
      window.clearTimeout(swap)
      window.clearTimeout(done)
      running.current = false
    }
  }, [transitionKey, children, shown.key])

  return (
    <>
      <div className={phase === "idle" ? undefined : "pointer-events-none"}>{shown.node}</div>
      {phase !== "idle" && (
        <div aria-hidden className={`reaction-transition reaction-${phase}`}>
          <div className="reaction-backdrop" />
          <div className="reaction-ring">
            <span />
            <span />
          </div>
          <div className="reaction-spark reaction-spark-one" />
          <div className="reaction-spark reaction-spark-two" />
          <div className="reaction-spark reaction-spark-three" />
          <p className="reaction-label">CHEMICAL REACTION</p>
          {TILES.map((tile) => (
            <div key={tile.symbol} className={`reaction-tile ${tile.className}`}>
              <strong>{tile.symbol}</strong>
              <small>{tile.name}</small>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
