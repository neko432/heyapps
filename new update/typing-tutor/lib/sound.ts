// Lightweight sound engine built entirely on the Web Audio API.
// No audio files needed — every effect is synthesized on the fly, so it works
// offline and stays tiny. Sounds are intentionally short and "poppy".

let ctx: AudioContext | null = null
let master: GainNode | null = null
let enabled = true

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AC) return null
    ctx = new AC()
    master = ctx.createGain()
    master.gain.value = 0.5
    master.connect(ctx.destination)
  }
  // Browsers start the context suspended until a user gesture.
  if (ctx.state === "suspended") ctx.resume().catch(() => {})
  return ctx
}

interface NoteOpts {
  freq: number
  startAt: number
  dur: number
  type?: OscillatorType
  peak?: number
  slideTo?: number
}

function note(c: AudioContext, dest: AudioNode, o: NoteOpts) {
  const { freq, startAt, dur, type = "sine", peak = 0.2, slideTo } = o
  const osc = c.createOscillator()
  const g = c.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, startAt)
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(slideTo, 1), startAt + dur)
  g.gain.setValueAtTime(0.0001, startAt)
  g.gain.exponentialRampToValueAtTime(peak, startAt + 0.008)
  g.gain.exponentialRampToValueAtTime(0.0001, startAt + dur)
  osc.connect(g).connect(dest)
  osc.start(startAt)
  osc.stop(startAt + dur + 0.03)
}

export const sound = {
  setEnabled(v: boolean) {
    enabled = v
  },
  isEnabled() {
    return enabled
  },
  // Call from a user gesture (e.g. starting a game) to unlock audio.
  resume() {
    getCtx()
  },

  // Soft mechanical click for each accepted keystroke.
  key() {
    if (!enabled) return
    const c = getCtx()
    if (!c || !master) return
    const t = c.currentTime
    note(c, master, { freq: 420 + Math.random() * 120, startAt: t, dur: 0.05, type: "triangle", peak: 0.09, slideTo: 240 })
  },

  // Happy little arpeggio when a question is cleared.
  correct() {
    if (!enabled) return
    const c = getCtx()
    if (!c || !master) return
    const t = c.currentTime
    const notes = [523.25, 659.25, 783.99] // C5 E5 G5
    notes.forEach((f, i) => note(c, master!, { freq: f, startAt: t + i * 0.06, dur: 0.14, type: "sine", peak: 0.16 }))
  },

  // Low buzzer for a wrong keystroke.
  wrong() {
    if (!enabled) return
    const c = getCtx()
    if (!c || !master) return
    const t = c.currentTime
    note(c, master, { freq: 170, startAt: t, dur: 0.18, type: "sawtooth", peak: 0.12, slideTo: 90 })
    note(c, master, { freq: 164, startAt: t, dur: 0.18, type: "square", peak: 0.05, slideTo: 86 })
  },

  // Gentle blip when revealing a hint.
  hint() {
    if (!enabled) return
    const c = getCtx()
    if (!c || !master) return
    const t = c.currentTime
    note(c, master, { freq: 740, startAt: t, dur: 0.12, type: "sine", peak: 0.13, slideTo: 980 })
  },

  // Fanfare on the result screen.
  clear() {
    if (!enabled) return
    const c = getCtx()
    if (!c || !master) return
    const t = c.currentTime
    const notes = [523.25, 659.25, 783.99, 1046.5] // C5 E5 G5 C6
    notes.forEach((f, i) => note(c, master!, { freq: f, startAt: t + i * 0.11, dur: 0.28, type: "triangle", peak: 0.18 }))
  },
}
