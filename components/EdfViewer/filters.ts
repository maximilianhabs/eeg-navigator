/**
 * 2nd-order Butterworth biquad filters for EEG signal processing.
 * DGKN-Standard: HP 0.53 Hz (TC 0.3s), TP 70 Hz, Notch 50 Hz optional.
 */

interface BiquadCoeffs {
  b0: number; b1: number; b2: number
  a1: number; a2: number
}

function highpassCoeffs(fc: number, fs: number): BiquadCoeffs {
  const k = Math.tan(Math.PI * fc / fs)
  const norm = 1 / (1 + Math.SQRT2 * k + k * k)
  return {
    b0:  norm,
    b1: -2 * norm,
    b2:  norm,
    a1:  2 * (k * k - 1) * norm,
    a2:  (1 - Math.SQRT2 * k + k * k) * norm,
  }
}

function lowpassCoeffs(fc: number, fs: number): BiquadCoeffs {
  const k = Math.tan(Math.PI * fc / fs)
  const norm = 1 / (1 + Math.SQRT2 * k + k * k)
  const b0 = k * k * norm
  return {
    b0, b1: 2 * b0, b2: b0,
    a1: 2 * (k * k - 1) * norm,
    a2: (1 - Math.SQRT2 * k + k * k) * norm,
  }
}

function notchCoeffs(f0: number, fs: number, Q = 10): BiquadCoeffs {
  const w0 = 2 * Math.PI * f0 / fs
  const alpha = Math.sin(w0) / (2 * Q)
  const cosw0 = Math.cos(w0)
  const a0 = 1 + alpha
  return {
    b0:  1 / a0,
    b1: -2 * cosw0 / a0,
    b2:  1 / a0,
    a1: -2 * cosw0 / a0,
    a2:  (1 - alpha) / a0,
  }
}

function applyBiquad(input: Float32Array, c: BiquadCoeffs): Float32Array {
  const out = new Float32Array(input.length)
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0
  for (let i = 0; i < input.length; i++) {
    const x0 = input[i]
    const y0 = c.b0 * x0 + c.b1 * x1 + c.b2 * x2 - c.a1 * y1 - c.a2 * y2
    out[i] = y0
    x2 = x1; x1 = x0; y2 = y1; y1 = y0
  }
  return out
}

export function filterSignal(
  input: Float32Array,
  fs: number,
  hp: number | null,
  lp: number | null,
  notch: boolean,
): Float32Array {
  let sig = input
  if (hp !== null && hp > 0 && hp < fs / 2) sig = applyBiquad(sig, highpassCoeffs(hp, fs))
  if (lp !== null && lp > 0 && lp < fs / 2) sig = applyBiquad(sig, lowpassCoeffs(lp, fs))
  if (notch && 50 < fs / 2)                  sig = applyBiquad(sig, notchCoeffs(50, fs))
  return sig
}

// DGKN-Standardwerte
export const HP_OPTIONS: Array<{ label: string; value: number | null }> = [
  { label: 'Aus', value: null },
  { label: '0.1 Hz', value: 0.1 },
  { label: '0.3 Hz', value: 0.3 },
  { label: '0.53 Hz', value: 0.53 },
  { label: '1 Hz', value: 1 },
  { label: '5 Hz', value: 5 },
]

export const LP_OPTIONS: Array<{ label: string; value: number | null; warn?: boolean }> = [
  { label: 'Aus', value: null },
  { label: '35 Hz ⚠', value: 35, warn: true },
  { label: '70 Hz', value: 70 },
  { label: '150 Hz', value: 150 },
]

export const DEFAULT_HP: number | null = 0.53
export const DEFAULT_LP: number | null = 70
