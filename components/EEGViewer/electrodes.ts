// 10-20 System: 2D scalp coordinates (normalized, head radius ≈ 1.0)
// Origin = Cz (center). Y-axis: positive = frontal, negative = occipital.
// X-axis: negative = left, positive = right.

export interface ElectrodePos {
  x: number
  y: number
}

export const ELECTRODE_POS: Record<string, ElectrodePos> = {
  // Frontopolar
  Fp1: { x: -0.30, y:  0.87 },
  Fp2: { x:  0.30, y:  0.87 },
  // Frontal
  F7:  { x: -0.72, y:  0.52 },
  F3:  { x: -0.38, y:  0.48 },
  Fz:  { x:  0.00, y:  0.50 },
  F4:  { x:  0.38, y:  0.48 },
  F8:  { x:  0.72, y:  0.52 },
  // Temporal / Central
  T3:  { x: -0.92, y:  0.00 },
  C3:  { x: -0.50, y:  0.00 },
  Cz:  { x:  0.00, y:  0.00 },
  C4:  { x:  0.50, y:  0.00 },
  T4:  { x:  0.92, y:  0.00 },
  // Posterior temporal / Parietal
  T5:  { x: -0.72, y: -0.52 },
  P3:  { x: -0.38, y: -0.48 },
  Pz:  { x:  0.00, y: -0.50 },
  P4:  { x:  0.38, y: -0.48 },
  T6:  { x:  0.72, y: -0.52 },
  // Occipital
  O1:  { x: -0.30, y: -0.87 },
  Oz:  { x:  0.00, y: -0.90 },
  O2:  { x:  0.30, y: -0.87 },
}

export function dist(a: ElectrodePos, b: ElectrodePos): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2)
}
