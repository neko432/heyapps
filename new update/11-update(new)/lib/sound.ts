// Hybrid sound engine: Uses real audio files if available,
// falling back to synthesized sounds (Web Audio API oscillators) if missing.
// Supports variants (e.g. key.mp3, key2.mp3) with an 80% chance of using the main sound.

let ctx: AudioContext | null = null
let master: GainNode | null = null
let enabled = true

const buffers: Record<string, AudioBuffer[]> = {
  key: [],
  correct: [],
  wrong: [],
  hint: [],
  clear: [],
  combo: [],
  special: [],
  pop: [],
  hover: [],
  transition: [],
  countdown: [],
  mascot: [],
}

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AC) return null
    ctx = new AC()
    master = ctx.createGain()
    master.gain.value = 1
    master.connect(ctx.destination)
  }
  if (ctx.state === "suspended") ctx.resume().catch(() => {})
  return ctx
}

// Play a loaded audio file buffer
function playBuffer(c: AudioContext, buffer: AudioBuffer) {
  if (!master) return
  const src = c.createBufferSource()
  src.buffer = buffer
  src.connect(master)
  src.start(0)
}

// Pick a variant: 80% chance for index 0 (main), 20% randomly among the rest.
// If forcedIdx is provided, use it (for per-question consistency).
function pickVariant(arr: AudioBuffer[], forcedIdx?: number): AudioBuffer | null {
  if (arr.length === 0) return null
  if (arr.length === 1) return arr[0]

  let idx = 0
  if (forcedIdx !== undefined) {
    idx = forcedIdx
  } else {
    if (Math.random() > 0.8) {
      idx = 1 + Math.floor(Math.random() * (arr.length - 1))
    }
  }
  return arr[idx] || arr[0]
}

let questionKeyVariant = 0
let questionWrongVariant = 0

// --------------------------------------------------------
// Fallback Synthesized Sounds
// --------------------------------------------------------
interface NoteOpts { freq: number; startAt: number; dur: number; type?: OscillatorType; peak?: number; slideTo?: number }
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

function noiseClack(c: AudioContext, dest: AudioNode, o: { startAt: number; dur: number; peak: number; freq: number; q?: number; filter?: BiquadFilterType }) {
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
// --------------------------------------------------------

export const sound = {
  setEnabled(v: boolean) {
    enabled = v
  },
  isEnabled() {
    return enabled
  },
  // Preload audio files so they are ready before the user interacts
  preload() {
    const c = getCtx()
    if (!c) return

    const load = async (baseName: string) => {
      if (buffers[baseName].length > 0) return
      for (let i = 1; i <= 10; i++) {
        const suffix = i === 1 ? "" : i.toString()
        const name = `${baseName}${suffix}`
        try {
          const res = await fetch(`/sounds/${name}.mp3`)
          if (!res.ok) break
          const buf = await res.arrayBuffer()
          buffers[baseName].push(await c.decodeAudioData(buf))
        } catch (e) {
          break
        }
      }
    }

    Object.keys(buffers).forEach(load)
  },

  // Unlock audio playback (must be called after user interaction)
  resume() {
    const c = getCtx()
    if (!c) return
    if (c.state === "suspended") c.resume().catch(() => {})
  },

  // Called when a new question starts to lock in variants
  setQuestionSeed() {
    const kLen = buffers.key.length
    questionKeyVariant = kLen > 1 && Math.random() > 0.8 ? 1 + Math.floor(Math.random() * (kLen - 1)) : 0

    const wLen = buffers.wrong.length
    questionWrongVariant = wLen > 1 && Math.random() > 0.8 ? 1 + Math.floor(Math.random() * (wLen - 1)) : 0
  },

  key() {
    if (!enabled) return
    const c = getCtx(); if (!c || !master) return
    // Some mobile browsers resolve resume asynchronously. Retry the key sound
    // after the context is running instead of silently dropping the first tap.
    if (c.state !== "running") {
      c.resume().then(() => {
        if (c.state === "running") sound.key()
      }).catch(() => {})
      return
    }
    const buf = pickVariant(buffers.key, questionKeyVariant)
    if (buf) return playBuffer(c, buf)
    const t = c.currentTime
    noiseClack(c, master, { startAt: t, dur: 0.04, peak: 0.55, freq: 2600 + Math.random() * 1600, q: 0.7 })
    noiseClack(c, master, { startAt: t, dur: 0.045, peak: 0.35, freq: 700 + Math.random() * 200, q: 1.4 })
    note(c, master, { freq: 180 + Math.random() * 40, startAt: t, dur: 0.04, type: "square", peak: 0.16, slideTo: 90 })
  },

  correct() {
    if (!enabled) return
    const c = getCtx(); if (!c || !master) return
    const buf = pickVariant(buffers.correct)
    if (buf) return playBuffer(c, buf)
    const t = c.currentTime
    const notes = [523.25, 659.25, 783.99]
    notes.forEach((f, i) => note(c, master!, { freq: f, startAt: t + i * 0.06, dur: 0.14, type: "sine", peak: 0.16 }))
  },

  wrong() {
    if (!enabled) return
    const c = getCtx(); if (!c || !master) return
    const buf = pickVariant(buffers.wrong, questionWrongVariant)
    if (buf) return playBuffer(c, buf)
    const t = c.currentTime
    note(c, master, { freq: 170, startAt: t, dur: 0.18, type: "sawtooth", peak: 0.12, slideTo: 90 })
    note(c, master, { freq: 164, startAt: t, dur: 0.18, type: "square", peak: 0.05, slideTo: 86 })
  },

  hint() {
    if (!enabled) return
    const c = getCtx(); if (!c || !master) return
    const buf = pickVariant(buffers.hint)
    if (buf) return playBuffer(c, buf)
    const t = c.currentTime
    note(c, master, { freq: 740, startAt: t, dur: 0.12, type: "sine", peak: 0.13, slideTo: 980 })
  },

  clear() {
    if (!enabled) return
    const c = getCtx(); if (!c || !master) return
    const buf = pickVariant(buffers.clear)
    if (buf) return playBuffer(c, buf)
    const t = c.currentTime
    const notes = [523.25, 659.25, 783.99, 1046.5]
    notes.forEach((f, i) => note(c, master!, { freq: f, startAt: t + i * 0.11, dur: 0.28, type: "triangle", peak: 0.18 }))
  },

  combo(step: number) {
    if (!enabled) return
    const c = getCtx(); if (!c || !master) return
    const buf = pickVariant(buffers.combo)
    if (buf) return playBuffer(c, buf)
    const t = c.currentTime
    const freq = 660 * Math.pow(2, Math.min(step, 12) / 12)
    note(c, master, { freq, startAt: t, dur: 0.12, type: "triangle", peak: 0.16, slideTo: freq * 1.5 })
  },

  special() {
    if (!enabled) return
    const c = getCtx(); if (!c || !master) return
    const buf = pickVariant(buffers.special)
    if (buf) return playBuffer(c, buf)
    const t = c.currentTime
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5]
    notes.forEach((f, i) => {
      note(c, master!, { freq: f, startAt: t + i * 0.07, dur: 0.4, type: "triangle", peak: 0.2 })
      note(c, master!, { freq: f * 2, startAt: t + i * 0.07, dur: 0.4, type: "sine", peak: 0.08 })
    })
    for (let i = 0; i < 6; i++) {
      note(c, master, { freq: 1600 + Math.random() * 1200, startAt: t + 0.4 + i * 0.05, dur: 0.16, type: "sine", peak: 0.08 })
    }
  },

  pop() {
    if (!enabled) return
    const c = getCtx(); if (!c || !master) return
    const buf = pickVariant(buffers.pop)
    if (buf) return playBuffer(c, buf)
    const t = c.currentTime
    note(c, master, { freq: 600, startAt: t, dur: 0.08, type: "sine", peak: 0.12, slideTo: 800 })
  },

  hover() {
    if (!enabled) return
    const c = getCtx(); if (!c || !master) return
    const buf = pickVariant(buffers.hover)
    if (buf) return playBuffer(c, buf)
    const t = c.currentTime
    note(c, master, { freq: 800, startAt: t, dur: 0.05, type: "sine", peak: 0.03 })
  },

  transition() {
    if (!enabled) return
    const c = getCtx(); if (!c || !master) return
    const buf = pickVariant(buffers.transition)
    if (buf) return playBuffer(c, buf)
    const t = c.currentTime
    noiseClack(c, master, { startAt: t, dur: 0.3, peak: 0.15, freq: 400, q: 0.5, filter: "lowpass" })
    note(c, master, { freq: 120, startAt: t, dur: 0.3, type: "triangle", peak: 0.1, slideTo: 60 })
  },

  countdown(num: number) {
    if (!enabled) return
    const c = getCtx(); if (!c || !master) return
    const buf = pickVariant(buffers.countdown)
    if (buf) {
      if (num === 3) playBuffer(c, buf)
      return
    }
    const t = c.currentTime
    const freq = num === 0 ? 880 : 440
    note(c, master, { freq, startAt: t, dur: 0.15, type: "square", peak: 0.08 })
  },

  mascot() {
    if (!enabled) return
    const c = getCtx(); if (!c || !master) return
    const buf = pickVariant(buffers.mascot)
    if (buf) return playBuffer(c, buf)
    const t = c.currentTime
    note(c, master, { freq: 1200 + Math.random() * 400, startAt: t, dur: 0.12, type: "sine", peak: 0.1, slideTo: 1800 })
  },
}
