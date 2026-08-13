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
    master.gain.value = 0.85
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

// Short burst of filtered white noise — the "clack" body of a mechanical key.
// This is what makes the typing sound カタカタ instead of a musical beep.
interface ClackOpts {
  startAt: number
  dur: number
  peak: number
  freq: number
  q?: number
  filter?: BiquadFilterType
}

function noiseClack(c: AudioContext, dest: AudioNode, o: ClackOpts) {
  const { startAt, dur, peak, freq, q = 1, filter = "bandpass" } = o
  const frames = Math.max(1, Math.floor(c.sampleRate * dur))
  const buffer = c.createBuffer(1, frames, c.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < frames; i++) data[i] = Math.random() * 2 - 1
  const src = c.createBufferSource()
  src.buffer = buffer
  const bp = c.createBiquadFilter()
  bp.type = filter
  bp.frequency.value = freq
  bp.Q.value = q
  const g = c.createGain()
  g.gain.setValueAtTime(peak, startAt)
  g.gain.exponentialRampToValueAtTime(0.0001, startAt + dur)
  src.connect(bp).connect(g).connect(dest)
  src.start(startAt)
  src.stop(startAt + dur + 0.02)
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

  // Crisp mechanical keyboard clack for each accepted keystroke.
  // Layered: a bright noise "click" + a short low "thock" body, both slightly
  // randomised so rapid typing reads as カタカタカタカタ rather than one tone.
  key() {
    if (!enabled) return
    const c = getCtx()
    if (!c || !master) return
    const t = c.currentTime
    // Bright top click.
    noiseClack(c, master, { startAt: t, dur: 0.028, peak: 0.55, freq: 2600 + Math.random() * 1600, q: 0.7 })
    // Body of the keypress landing.
    noiseClack(c, master, { startAt: t, dur: 0.045, peak: 0.35, freq: 700 + Math.random() * 200, q: 1.4 })
    // Low thock for weight.
    note(c, master, { freq: 180 + Math.random() * 40, startAt: t, dur: 0.04, type: "square", peak: 0.16, slideTo: 90 })
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

  // Sparkly rising fanfare for the rare special-clear celebration.
  special() {
    if (!enabled) return
    const c = getCtx()
    if (!c || !master) return
    const t = c.currentTime
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5] // C5 E5 G5 C6 E6
    notes.forEach((f, i) =>
      note(c, master!, { freq: f, startAt: t + i * 0.07, dur: 0.22, type: "triangle", peak: 0.17 }),
    )
    // Shimmer on top.
    for (let i = 0; i < 6; i++) {
      note(c, master, {
        freq: 1600 + Math.random() * 1400,
        startAt: t + 0.1 + i * 0.05,
        dur: 0.1,
        type: "sine",
        peak: 0.07,
      })
    }
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
