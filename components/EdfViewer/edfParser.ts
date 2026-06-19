export interface EdfSignal {
  label: string
  transducer: string
  physDim: string
  physMin: number
  physMax: number
  digMin: number
  digMax: number
  prefilter: string
  numSamplesPerRecord: number
  sampleRate: number
}

export interface EdfHeader {
  patient: string
  recording: string
  startDate: string
  startTime: string
  numRecords: number
  recordDuration: number
  numSignals: number
  signals: EdfSignal[]
}

export class EDFParser {
  private bytes: Uint8Array
  private buffer: ArrayBuffer
  header: EdfHeader | null = null

  constructor(buffer: ArrayBuffer) {
    this.buffer = buffer
    this.bytes = new Uint8Array(buffer)
  }

  private readAscii(offset: number, len: number): string {
    return String.fromCharCode(...this.bytes.slice(offset, offset + len)).trim()
  }

  parse(): EdfHeader {
    const n = parseInt(this.readAscii(252, 4))
    const recDur = parseFloat(this.readAscii(244, 8))
    const sBase = 256

    const labels      = Array.from({ length: n }, (_, i) => this.readAscii(sBase + i * 16, 16))
    const transducers = Array.from({ length: n }, (_, i) => this.readAscii(sBase + n*16 + i*80, 80))
    const physDims    = Array.from({ length: n }, (_, i) => this.readAscii(sBase + n*96 + i*8, 8))
    const physMins    = Array.from({ length: n }, (_, i) => parseFloat(this.readAscii(sBase + n*104 + i*8, 8)))
    const physMaxs    = Array.from({ length: n }, (_, i) => parseFloat(this.readAscii(sBase + n*112 + i*8, 8)))
    const digMins     = Array.from({ length: n }, (_, i) => parseInt(this.readAscii(sBase + n*120 + i*8, 8)))
    const digMaxs     = Array.from({ length: n }, (_, i) => parseInt(this.readAscii(sBase + n*128 + i*8, 8)))
    const prefilters  = Array.from({ length: n }, (_, i) => this.readAscii(sBase + n*136 + i*80, 80))
    const numSamples  = Array.from({ length: n }, (_, i) => parseInt(this.readAscii(sBase + n*216 + i*8, 8)))

    this.header = {
      patient:        this.readAscii(8, 80),
      recording:      this.readAscii(88, 80),
      startDate:      this.readAscii(168, 8),
      startTime:      this.readAscii(176, 8),
      numRecords:     parseInt(this.readAscii(236, 8)),
      recordDuration: recDur,
      numSignals:     n,
      signals: labels.map((lbl, i) => ({
        label:                lbl,
        transducer:           transducers[i],
        physDim:              physDims[i],
        physMin:              physMins[i],
        physMax:              physMaxs[i],
        digMin:               digMins[i],
        digMax:               digMaxs[i],
        prefilter:            prefilters[i],
        numSamplesPerRecord:  numSamples[i],
        sampleRate:           numSamples[i] / recDur,
      })),
    }
    return this.header
  }

  readSignal(sigIndex: number): Float32Array {
    if (!this.header) throw new Error('parse() first')
    const h = this.header
    const sig = h.signals[sigIndex]
    const out = new Float32Array(sig.numSamplesPerRecord * h.numRecords)
    const bytesPerRecord = h.signals.reduce((a, s) => a + s.numSamplesPerRecord * 2, 0)
    const bytesBeforeSig = h.signals.slice(0, sigIndex).reduce((a, s) => a + s.numSamplesPerRecord * 2, 0)
    const headerBytes = parseInt(String.fromCharCode(...this.bytes.slice(184, 192)).trim())
    const scale  = (sig.physMax - sig.physMin) / (sig.digMax - sig.digMin)
    const offset = sig.physMax / scale - sig.digMax
    const view   = new DataView(this.buffer)
    let outIdx   = 0
    for (let rec = 0; rec < h.numRecords; rec++) {
      const recStart = headerBytes + rec * bytesPerRecord + bytesBeforeSig
      for (let s = 0; s < sig.numSamplesPerRecord; s++) {
        const dig = view.getInt16(recStart + s * 2, true)
        out[outIdx++] = (dig + offset) * scale
      }
    }
    return out
  }
}
