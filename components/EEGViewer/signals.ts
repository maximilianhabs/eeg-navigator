// EEG Signal Synthesis — Source model + bioelectric field physics
// Architecture is scalable: add new EEGState configs for sleep, spikes, etc.

import { ELECTRODE_POS, dist, type ElectrodePos } from './electrodes'

export const SAMPLE_RATE = 256   // Hz
export const EPOCH_DURATION = 10 // seconds
export const N_SAMPLES = SAMPLE_RATE * EPOCH_DURATION

// ── Types ─────────────────────────────────────────────────────────────────────

export type WaveformType = 'alpha' | 'beta' | 'theta' | 'delta' | 'spindle' | 'k_complex' | 'sawtooth_rem'

export interface SpindleEvent {
  onset: number    // seconds from epoch start
  duration: number // seconds (AASM: ≥0.5 s)
}

export interface SpindleParams {
  type: 'spindle'
  freq: number       // carrier frequency Hz (fast: 12–16, slow: 9–12)
  phase: number      // starting phase radians
  events: SpindleEvent[]
}

export interface DeltaParams {
  type: 'delta'
  freq: number
  phase: number
}

export interface KComplexParams {
  type: 'k_complex'
  onset: number     // seconds from epoch start
  // Negative sharp component: brief, high-amplitude
  negWidth: number  // Gaussian σ in seconds (~0.07–0.10 s)
  negAmp: number    // relative amplitude of negative phase (1.0 = full source amplitude)
  // Positive slow component: broad, lower amplitude
  posDelay: number  // seconds after onset center for positive peak (~0.25–0.40 s)
  posWidth: number  // Gaussian σ (~0.20–0.30 s)
  posAmp: number    // relative amplitude of positive phase (~0.6–0.75)
}

export interface SawtoothRemParams {
  type: 'sawtooth_rem'
  freq: number      // carrier Hz (2–3 Hz, frontocentral)
  phase: number
  // Burst events — sawtooth waves come in short runs
  events: SpindleEvent[]
}

export interface EEGSource {
  id: string
  position: ElectrodePos
  peakAmplitude: number
  waveformType: WaveformType
  waveformParams: AlphaParams | BetaParams | ThetaParams | SpindleParams | DeltaParams | KComplexParams | SawtoothRemParams
  fieldDecay: number
}

export interface AlphaParams {
  type: 'alpha'
  freqs: number[]       // Hz — multiple to create beating/waxing
  freqAmps: number[]    // relative amplitude per freq component
  phases: number[]      // radians
  envelopeRate: number  // Hz of slow amplitude modulation
  envelopeDepth: number // 0–1, how much amplitude modulates
}

export interface BetaParams {
  type: 'beta'
  freq: number
  phase: number
}

export interface ThetaParams {
  type: 'theta'
  freq: number
  phase: number
}

// ── Signal rendering per source ───────────────────────────────────────────────

function renderAlpha(p: AlphaParams, n: number, sr: number): Float32Array {
  const out = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    const t = i / sr
    let v = 0
    for (let k = 0; k < p.freqs.length; k++) {
      v += p.freqAmps[k] * Math.sin(2 * Math.PI * p.freqs[k] * t + p.phases[k])
    }
    // slow amplitude envelope: waxing & waning
    const env = 1 - p.envelopeDepth * 0.5 * (1 - Math.sin(2 * Math.PI * p.envelopeRate * t))
    out[i] = v * env
  }
  // normalize to [-1, 1]
  let mx = 0
  for (let i = 0; i < n; i++) if (Math.abs(out[i]) > mx) mx = Math.abs(out[i])
  if (mx > 0) for (let i = 0; i < n; i++) out[i] /= mx
  return out
}

function renderBeta(p: BetaParams, n: number, sr: number): Float32Array {
  const out = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    const t = i / sr
    out[i] = Math.sin(2 * Math.PI * p.freq * t + p.phase)
    // slight amplitude jitter
    out[i] *= 0.7 + 0.3 * Math.sin(2 * Math.PI * 0.7 * t)
  }
  return out
}

function renderTheta(p: ThetaParams, n: number, sr: number): Float32Array {
  const out = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    const t = i / sr
    out[i] = Math.sin(2 * Math.PI * p.freq * t + p.phase)
    out[i] *= 0.5 + 0.5 * Math.abs(Math.sin(2 * Math.PI * 0.2 * t))
  }
  return out
}

function renderDelta(p: DeltaParams, n: number, sr: number): Float32Array {
  const out = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    const t = i / sr
    // Irregular slow wave: primary freq + slight harmonic distortion for non-sinusoidal shape
    out[i] = Math.sin(2 * Math.PI * p.freq * t + p.phase)
           + 0.2 * Math.sin(2 * Math.PI * p.freq * 2 * t + p.phase + 0.5)
    // Slow amplitude variation — isolated delta waves appear and fade
    out[i] *= 0.3 + 0.7 * Math.abs(Math.sin(2 * Math.PI * 0.12 * t))
  }
  return out
}

function renderKComplex(p: KComplexParams, n: number, sr: number): Float32Array {
  // K-Komplex: biphasische Transiente mit scharfer Negativität + langsamer Positivität
  // Negativ-up-Konvention (DGKN): negative Spannung → Aufwärtsauslenkung im Canvas
  // Hier: negative Komponente = positiver Wert im Signal (wird als Aufwärtsbewegung gerendert)
  const out = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    const t = i / sr
    // Scharfe negative Initialkomponente (kurze Gaußglocke, negativ)
    const dtNeg = t - p.onset
    const neg = -p.negAmp * Math.exp(-(dtNeg * dtNeg) / (2 * p.negWidth * p.negWidth))
    // Langsame positive Nachkomponente (breite Gaußglocke, positiv)
    const dtPos = t - (p.onset + p.posDelay)
    const pos = p.posAmp * Math.exp(-(dtPos * dtPos) / (2 * p.posWidth * p.posWidth))
    out[i] = neg + pos
  }
  // normalize
  let mx = 0
  for (let i = 0; i < n; i++) if (Math.abs(out[i]) > mx) mx = Math.abs(out[i])
  if (mx > 0) for (let i = 0; i < n; i++) out[i] /= mx
  return out
}

function renderSpindle(p: SpindleParams, n: number, sr: number): Float32Array {
  // Schlafspindeln: diskrete Ereignisse mit Gaußförmiger Amplitude (waxing-and-waning)
  // Jedes Ereignis: A(t) = exp(-(t - center)² / (2σ²))  × sin(2π·f·t + φ)
  const out = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    const t = i / sr
    let v = 0
    for (const ev of p.events) {
      const center = ev.onset + ev.duration * 0.5
      // σ so that envelope reaches ~5% at edges of the spindle
      const sigma = ev.duration / 4.5
      const dt = t - center
      const envelope = Math.exp(-(dt * dt) / (2 * sigma * sigma))
      if (envelope > 0.02) {
        // Slight frequency chirp at spindle onset (physiologically common)
        const fmod = p.freq + 0.3 * (1 - envelope)
        v += envelope * Math.sin(2 * Math.PI * fmod * t + p.phase)
      }
    }
    out[i] = v
  }
  // normalize to [-1, 1]
  let mx = 0
  for (let i = 0; i < n; i++) if (Math.abs(out[i]) > mx) mx = Math.abs(out[i])
  if (mx > 0) for (let i = 0; i < n; i++) out[i] /= mx
  return out
}

// Sägezahnwellen (REM): steiler Anstieg, langsamer Abfall — charakteristische Asymmetrie
// Treten in kurzen Bursts (1–3 s) frontozentral auf, oft kurz vor REM-Augenbewegungen
function renderSawtoothRem(p: SawtoothRemParams, n: number, sr: number): Float32Array {
  const out = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    const t = i / sr
    let v = 0
    for (const ev of p.events) {
      const center = ev.onset + ev.duration * 0.5
      const sigma = ev.duration / 4.0
      const dt = t - center
      const envelope = Math.exp(-(dt * dt) / (2 * sigma * sigma))
      if (envelope > 0.02) {
        // Sawtooth: schneller Anstieg (cosine-like leading edge), langsamer Abfall
        const phase = (2 * Math.PI * p.freq * t + p.phase) % (2 * Math.PI)
        // Asymmetric waveform: sum of harmonics weighted to create fast-rise, slow-fall
        const saw = Math.sin(phase) + 0.5 * Math.sin(2 * phase) + 0.25 * Math.sin(3 * phase)
        v += envelope * saw
      }
    }
    out[i] = v
  }
  let mx = 0
  for (let i = 0; i < n; i++) if (Math.abs(out[i]) > mx) mx = Math.abs(out[i])
  if (mx > 0) for (let i = 0; i < n; i++) out[i] /= mx
  return out
}

function renderSource(src: EEGSource): Float32Array {
  const p = src.waveformParams
  if (p.type === 'alpha')         return renderAlpha(p, N_SAMPLES, SAMPLE_RATE)
  if (p.type === 'beta')          return renderBeta(p, N_SAMPLES, SAMPLE_RATE)
  if (p.type === 'theta')         return renderTheta(p, N_SAMPLES, SAMPLE_RATE)
  if (p.type === 'delta')         return renderDelta(p, N_SAMPLES, SAMPLE_RATE)
  if (p.type === 'spindle')       return renderSpindle(p, N_SAMPLES, SAMPLE_RATE)
  if (p.type === 'k_complex')     return renderKComplex(p, N_SAMPLES, SAMPLE_RATE)
  if (p.type === 'sawtooth_rem')  return renderSawtoothRem(p, N_SAMPLES, SAMPLE_RATE)
  return new Float32Array(N_SAMPLES)
}

// ── Pink noise approximation (1/f, Voss-McCartney simplified) ────────────────

function pinkNoise(n: number): Float32Array {
  // Sum of 5 white noise generators updated at different rates
  const out = new Float32Array(n)
  const b = [0, 0, 0, 0, 0]
  for (let i = 0; i < n; i++) {
    const white = Math.random() * 2 - 1
    if (i % 1  === 0) b[0] = 0.99886 * b[0] + white * 0.0555179
    if (i % 2  === 0) b[1] = 0.99332 * b[1] + white * 0.0750759
    if (i % 4  === 0) b[2] = 0.96900 * b[2] + white * 0.1538520
    if (i % 8  === 0) b[3] = 0.86650 * b[3] + white * 0.3104856
    if (i % 16 === 0) b[4] = 0.55000 * b[4] + white * 0.5329522
    out[i] = (b[0] + b[1] + b[2] + b[3] + b[4] + white * 0.5362) / 5
  }
  // normalize
  let mx = 0
  for (let i = 0; i < n; i++) if (Math.abs(out[i]) > mx) mx = Math.abs(out[i])
  if (mx > 0) for (let i = 0; i < n; i++) out[i] /= mx
  return out
}

// ── Field physics ─────────────────────────────────────────────────────────────

function fieldWeight(source: EEGSource, electrode: string): number {
  const ePos = ELECTRODE_POS[electrode]
  if (!ePos) return 0
  const d = dist(source.position, ePos)
  return 1 / (1 + source.fieldDecay * d * d)
}

// ── Main: compute all electrode potentials ────────────────────────────────────

export type ElectrodeSignals = Record<string, Float32Array>

export function computeElectrodeSignals(
  sources: EEGSource[],
  noiseLevel = 0.06   // fraction of max signal amplitude
): ElectrodeSignals {
  const electrodeNames = Object.keys(ELECTRODE_POS)
  const renderedSources = sources.map(src => ({
    src,
    signal: renderSource(src),
  }))

  const noise = pinkNoise(N_SAMPLES)
  const signals: ElectrodeSignals = {}

  // Find max possible amplitude for noise scaling
  const maxAmp = Math.max(...sources.map(s => s.peakAmplitude))

  for (const elec of electrodeNames) {
    const sig = new Float32Array(N_SAMPLES)
    for (const { src, signal } of renderedSources) {
      const w = fieldWeight(src, elec)
      const amp = src.peakAmplitude * w
      for (let i = 0; i < N_SAMPLES; i++) {
        sig[i] += signal[i] * amp
      }
    }
    // Add pink noise
    for (let i = 0; i < N_SAMPLES; i++) {
      sig[i] += noise[i] * maxAmp * noiseLevel
    }
    signals[elec] = sig
  }
  return signals
}

// ── EEG States ────────────────────────────────────────────────────────────────
// Scalable: add 'sleep_n2', 'spike_temporal', etc. here

export type EEGState = 'normal_alpha' | 'sleep_n2' | 'sleep_n3' | 'sleep_rem'

export function buildSources(state: EEGState): EEGSource[] {
  if (state === 'normal_alpha') {
    return [
      // Posterior alpha — bilateral, near-symmetric
      // Left: slightly different freq for natural inter-hemispheric phase difference
      {
        id: 'alpha_L',
        position: ELECTRODE_POS['O1'],
        peakAmplitude: 75,
        waveformType: 'alpha',
        fieldDecay: 2.8,
        waveformParams: {
          type: 'alpha',
          freqs: [8.5, 9.5, 10.5, 11.2],
          freqAmps: [0.45, 1.0, 0.75, 0.30],
          phases: [0.0, 0.4, 1.1, 2.3],
          envelopeRate: 0.28,
          envelopeDepth: 0.28,  // subtil — kein ausgeprägtes Spindelmuster
        },
      },
      {
        id: 'alpha_R',
        position: ELECTRODE_POS['O2'],
        peakAmplitude: 72,
        waveformType: 'alpha',
        fieldDecay: 2.8,
        waveformParams: {
          type: 'alpha',
          freqs: [8.7, 9.7, 10.3, 11.0],
          freqAmps: [0.40, 1.0, 0.70, 0.28],
          phases: [0.6, 1.1, 0.3, 1.8],
          envelopeRate: 0.31,
          envelopeDepth: 0.25,
        },
      },
      // Frontal beta — diffus frontal, niedrige Amplitude
      // fieldDecay niedrig → breite Verteilung → Fp1-F7 bipolar zeigt wenig Differenz
      {
        id: 'beta_L',
        position: { x: -0.18, y: 0.62 },  // F3-Region, nicht zu nah an Fp1
        peakAmplitude: 9,
        waveformType: 'beta',
        fieldDecay: 1.6,
        waveformParams: { type: 'beta', freq: 19.5, phase: 0.0 },
      },
      {
        id: 'beta_R',
        position: { x:  0.18, y: 0.62 },
        peakAmplitude: 8,
        waveformType: 'beta',
        fieldDecay: 1.6,
        waveformParams: { type: 'beta', freq: 20.5, phase: 1.2 },
      },
      // Diffuse slow background (theta/delta mix — very low)
      {
        id: 'theta_bg',
        position: { x: 0, y: 0 },  // central/diffuse
        peakAmplitude: 10,
        waveformType: 'theta',
        fieldDecay: 0.4,  // very diffuse
        waveformParams: { type: 'theta', freq: 5.5, phase: 0.0 },
      },
    ]
  }

  if (state === 'sleep_n2') {
    // ── N2-Hintergrund: kein Alpha, stattdessen diffuse Theta + gelegentliche Delta ──
    //
    // Schlafspindeln: thalamokortikale Quelle → breites, diffuses Feld (fieldDecay niedrig)
    // Zwei Typen: schnelle Spindeln (12–14 Hz, zentroparietal) + langsame (10–11 Hz, frontal)
    // Waxing-and-waning durch Gaußhüllkurve über 3 Ereignisse in der 10s-Epoche.
    // Hemisphärische Unabhängigkeit: leicht unterschiedliche Phase und Timing L vs. R.
    //
    // Erwartetes bipolares Bild:
    //   - Parasag. C4-P4, C3-P3: prominente Spindeln
    //   - Mittellinie Cz-Pz: starke Spindeln
    //   - Temporal: kaum Spindeln (weit vom zentroparietalen Generator)
    //   - Kein Phasenumkehr (Feld zu breit für klare Phasenumkehr im Scalp-EEG)

    return [
      // ── Schnelle Spindeln (13.5 Hz) — zentroparietal bilateral ──
      {
        id: 'spindle_fast_L',
        position: { x: -0.33, y: 0.0 },   // C3-Region
        peakAmplitude: 55,
        waveformType: 'spindle',
        fieldDecay: 0.65,   // breit/diffus — thalamische Quelle strahlt weit
        waveformParams: {
          type: 'spindle',
          freq: 13.5,
          phase: 0.0,
          events: [
            { onset: 1.2, duration: 1.1 },
            { onset: 4.8, duration: 1.4 },
            { onset: 7.9, duration: 0.9 },
          ],
        },
      },
      {
        id: 'spindle_fast_R',
        position: { x:  0.33, y: 0.0 },   // C4-Region
        peakAmplitude: 52,
        waveformType: 'spindle',
        fieldDecay: 0.65,
        waveformParams: {
          type: 'spindle',
          freq: 13.5,
          // Leicht andere Phase → natürliche interhemisphärische Verschiebung
          phase: 0.35,
          events: [
            { onset: 1.3, duration: 1.0 },   // minimal zeitversetzt
            { onset: 4.9, duration: 1.3 },
            { onset: 8.0, duration: 1.0 },
          ],
        },
      },
      // ── Langsame Spindeln (10.8 Hz) — frontal, deutlich schwächer ──
      {
        id: 'spindle_slow_F',
        position: { x: 0.0, y: 0.42 },   // Fz-Region
        peakAmplitude: 28,
        waveformType: 'spindle',
        fieldDecay: 0.5,    // noch breiter — frontale Dominanz langsamer Spindeln
        waveformParams: {
          type: 'spindle',
          freq: 10.8,
          phase: 1.1,
          // Etwas früher als schnelle Spindeln (langsame Spindeln N2-Beginn)
          events: [
            { onset: 1.0, duration: 0.9 },
            { onset: 4.6, duration: 1.0 },
            { onset: 7.7, duration: 0.8 },
          ],
        },
      },
      // ── N2-Hintergrund: Theta — kein okzipitaler Alpha ──
      {
        id: 'theta_n2',
        position: { x: 0.0, y: 0.0 },    // zentral/diffus
        peakAmplitude: 22,
        waveformType: 'theta',
        fieldDecay: 0.22,   // sehr diffus → alle Elektroden ähnlich betroffen
        waveformParams: { type: 'theta', freq: 6.0, phase: 0.5 },
      },
      // ── Gelegentliche Delta-Wellen (N2-typisch, niedrig) ──
      {
        id: 'delta_n2',
        position: { x: 0.0, y: 0.0 },
        peakAmplitude: 18,
        waveformType: 'delta',
        fieldDecay: 0.15,
        waveformParams: { type: 'delta', freq: 1.2, phase: 0.0 },
      },
      // ── K-Komplex bei ~3.2 s — frontales Maximum, unmittelbar vor zweiter Spindel ──
      // Klassische K-Komplex-Spindel-Sequenz: K bei 3.2s, Spindel bei 4.8s
      // Frontales Maximum (Fz/F3/F4); Amplitude frontal ~8x > Spindeln.
      // Feldabfall steil (decay=2.8): Pz/Oz nur noch ~35–25% der Frontalamplitude.
      // Scharfe negative Phase (~80ms) + langsame positive Nachphase (~280ms).
      // Hinweis: In Cz-Referenz ist der K-Komplex verfälscht, weil Cz selbst im
      // K-Komplex-Feld liegt → bipolare Montage zeigt das frontale Maximum besser.
      {
        id: 'k_complex',
        position: { x: 0.0, y: 0.42 },  // Fz-Region — frontales Maximum
        peakAmplitude: 420,              // K-Komplexe >> Spindeln; ~8x Spindelamplitude
        waveformType: 'k_complex',
        fieldDecay: 2.8,                 // steiler Abfall: Oz ~25% von Fz — klinisch korrekt
        waveformParams: {
          type: 'k_complex',
          onset: 3.2,
          negWidth: 0.08,   // scharfe Negativität σ = 80 ms
          negAmp: 1.0,
          posDelay: 0.28,   // positive Komponente ~280 ms nach Onset-Zentrum
          posWidth: 0.22,   // langsame Positivität σ = 220 ms
          posAmp: 0.65,     // positive Phase schwächer als negative
        },
      },
    ]
  }

  // ── N3: Hochamplitudige synchrone Delta-Wellen (Slow Wave Sleep) ─────────────
  // 0.5–2 Hz, Amplitude >>75 µV, frontale Dominanz, bilateral synchron.
  // Residuale Spindeln möglich (aber leiser). Kein Alpha, kein Theta-Vordergrund.
  if (state === 'sleep_n3') {
    return [
      // Primäre SWS-Delta-Quelle: frontozentral, sehr hohes Feld, breite Verteilung
      {
        id: 'sws_delta_ant',
        position: { x: 0.0, y: 0.50 },   // Fz-Cz-Region
        peakAmplitude: 180,
        waveformType: 'delta',
        fieldDecay: 0.10,   // extrem breites Feld → alle Elektroden synchron betroffen
        waveformParams: { type: 'delta', freq: 0.9, phase: 0.0 },
      },
      // Sekundäre SWS-Quelle: leicht versetzt, andere Phase → natürliche Variabilität
      {
        id: 'sws_delta_post',
        position: { x: 0.0, y: -0.15 },  // Cz-Pz
        peakAmplitude: 140,
        waveformType: 'delta',
        fieldDecay: 0.12,
        waveformParams: { type: 'delta', freq: 1.3, phase: 1.2 },
      },
      // Hemisphärisch leicht asymmetrische Komponenten (physiologisch bis 30%)
      {
        id: 'sws_delta_L',
        position: { x: -0.3, y: 0.2 },
        peakAmplitude: 90,
        waveformType: 'delta',
        fieldDecay: 0.18,
        waveformParams: { type: 'delta', freq: 0.7, phase: 0.5 },
      },
      {
        id: 'sws_delta_R',
        position: { x:  0.3, y: 0.2 },
        peakAmplitude: 85,
        waveformType: 'delta',
        fieldDecay: 0.18,
        waveformParams: { type: 'delta', freq: 0.7, phase: 0.7 },
      },
      // Residuale leise Theta-Aktivität (N3-Hintergrund)
      {
        id: 'theta_n3_bg',
        position: { x: 0.0, y: 0.0 },
        peakAmplitude: 15,
        waveformType: 'theta',
        fieldDecay: 0.2,
        waveformParams: { type: 'theta', freq: 5.5, phase: 0.3 },
      },
    ]
  }

  // ── REM: Low-Voltage Mixed Frequency + Sägezahnwellen ────────────────────────
  // Ähnlich N1/Wach: niedrige Amplitude, gemischte Frequenzen, kein Alpha.
  // Charakteristisch: Sägezahnwellen (2–3 Hz) frontozentral in kurzen Bursts,
  // oft kurz vor oder während der schnellen Augenbewegungen.
  // Theta-Hintergrund prominenter als im Wachzustand.
  if (state === 'sleep_rem') {
    return [
      // Theta-Grundaktivität (REM-Hintergrund — prominenter als N1)
      {
        id: 'rem_theta',
        position: { x: 0.0, y: 0.0 },
        peakAmplitude: 28,
        waveformType: 'theta',
        fieldDecay: 0.20,
        waveformParams: { type: 'theta', freq: 5.5, phase: 0.0 },
      },
      {
        id: 'rem_theta2',
        position: { x: 0.0, y: 0.0 },
        peakAmplitude: 18,
        waveformType: 'theta',
        fieldDecay: 0.18,
        waveformParams: { type: 'theta', freq: 6.5, phase: 2.1 },
      },
      // Flache Delta-Einschüsse (REM — niedriger als N3, niedrigere als N2)
      {
        id: 'rem_delta_bg',
        position: { x: 0.0, y: 0.0 },
        peakAmplitude: 20,
        waveformType: 'delta',
        fieldDecay: 0.15,
        waveformParams: { type: 'delta', freq: 1.8, phase: 1.5 },
      },
      // Sägezahnwellen: 2.5 Hz, frontozentral, 3 Bursts à 1.5–2 s
      // Typisch unmittelbar vor Phasen mit schnellen Augenbewegungen
      {
        id: 'sawtooth_FC',
        position: { x: 0.0, y: 0.42 },   // Fz-Region, frontozentral
        peakAmplitude: 60,
        waveformType: 'sawtooth_rem',
        fieldDecay: 0.55,                 // mittelbreites Feld — frontozentral betont
        waveformParams: {
          type: 'sawtooth_rem',
          freq: 2.5,
          phase: 0.0,
          events: [
            { onset: 1.5, duration: 1.8 },  // erster Burst
            { onset: 5.2, duration: 2.0 },  // zweiter Burst (längerer)
            { onset: 8.4, duration: 1.5 },  // dritter Burst
          ],
        },
      },
      // Leichte Beta-Beimischung (REM — Gehirn "fast wach")
      {
        id: 'rem_beta',
        position: { x: 0.0, y: 0.42 },
        peakAmplitude: 8,
        waveformType: 'beta',
        fieldDecay: 1.5,
        waveformParams: { type: 'beta', freq: 18.0, phase: 0.8 },
      },
    ]
  }

  return []
}
