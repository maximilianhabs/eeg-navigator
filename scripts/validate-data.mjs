#!/usr/bin/env node
//
// validate-data.mjs — Integritätsprüfung der EEG-Navigator-Datenbasis
//
// Fängt strukturell die Fehlerklasse ab, die am 2026-06-28 real auftrat:
// kaputte Querverweise (EEG_0006→0081-Umnummerierung), ID-Divergenz, verwaiste EDF.
//
// Aufruf:  node scripts/validate-data.mjs        (Exit 1 bei ERRORs)
//          npm run validate
//
// Eingebunden in deploy.sh Pre-Flight und (optional) GitHub Actions CI.

import { readFileSync, readdirSync, existsSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dir = dirname(fileURLToPath(import.meta.url))
const root = join(__dir, '..')
const DATA = join(root, 'data')
const EDFDIR = join(root, 'public', 'edf')

const errors = []
const warnings = []
const err  = (m) => errors.push(m)
const warn = (m) => warnings.push(m)

// ─── Entitäten aus verschachtelter JSON-Struktur einsammeln ─────────────────────
function collect(node, prefix, acc) {
  if (Array.isArray(node)) { for (const n of node) collect(n, prefix, acc); return }
  if (node && typeof node === 'object') {
    if (typeof node.id === 'string' && node.id.startsWith(prefix)) { acc.push(node); return }
    for (const v of Object.values(node)) collect(v, prefix, acc)
  }
}

const wellen = []
const arts = []
collect(JSON.parse(readFileSync(join(DATA, 'wellen.json'), 'utf8')), 'EEG_', wellen)
collect(JSON.parse(readFileSync(join(DATA, 'artefakte.json'), 'utf8')), 'ART', arts)
const allIds = new Set([...wellen, ...arts].map(e => e.id))

// ─── Referenzfeld zu ID-Liste normalisieren (str | str[] | {id}[]) ──────────────
function refIds(v) {
  const out = []
  if (typeof v === 'string') out.push(v)
  else if (Array.isArray(v)) for (const i of v) {
    if (typeof i === 'string') out.push(i)
    else if (i && typeof i === 'object') for (const k of ['id', 'ref', 'target']) if (i[k]) out.push(i[k])
  }
  return out.filter(r => typeof r === 'string' && (r.startsWith('EEG_') || r.startsWith('ART')))
}

// ─── 1. Doppelte IDs ────────────────────────────────────────────────────────────
const seen = new Map()
for (const e of [...wellen, ...arts]) seen.set(e.id, (seen.get(e.id) || 0) + 1)
for (const [id, c] of seen) if (c > 1) err(`Doppelte ID: ${id} (${c}×)`)

// ─── 2. Kaputte Querverweise (ERROR) ────────────────────────────────────────────
for (const e of [...wellen, ...arts]) {
  const checks = [
    ['differential_diagnoses', e.differential_diagnoses],
    ['mimics', e.mimics],
  ]
  const dl = e.dialog_logic
  if (dl && typeof dl === 'object') {
    checks.push(['dialog_logic.mimics', dl.mimics])
    checks.push(['dialog_logic.differential_diagnoses', dl.differential_diagnoses])
  }
  const cr = e.cross_references
  if (cr && typeof cr === 'object') {
    checks.push(['cross_references.artifact_mimics', cr.artifact_mimics])
    checks.push(['cross_references.related', cr.related])
  }
  for (const [field, val] of checks)
    for (const r of refIds(val))
      if (!allIds.has(r)) err(`Kaputter Querverweis: ${e.id}.${field} → ${r} (existiert nicht)`)
}

// ─── 3. Frequenz-Sanity (ERROR) ─────────────────────────────────────────────────
for (const e of wellen) {
  const f = e.frequency || {}
  const { min_hz: mn, typical_hz: tp, max_hz: mx } = f
  if ([mn, tp, mx].every(x => typeof x === 'number') && !(mn <= tp && tp <= mx))
    err(`Frequenz-Inkonsistenz: ${e.id} min=${mn} typ=${tp} max=${mx}`)
}

// ─── 4. EDF-Dateien & Aliases (ERROR/WARN) ──────────────────────────────────────
const edfs = existsSync(EDFDIR) ? readdirSync(EDFDIR).filter(f => f.endsWith('.edf')) : []
let aliases = {}
try { aliases = JSON.parse(readFileSync(join(EDFDIR, 'aliases.json'), 'utf8')) } catch {}

const referenced = new Set()
for (const f of edfs) if (allIds.has(f.split('__')[0])) referenced.add(f)
for (const list of Object.values(aliases)) for (const f of list) referenced.add(f)
for (const f of edfs) if (!referenced.has(f)) warn(`Verwaiste EDF-Datei (keiner Entität zugeordnet): ${f}`)

for (const [id, list] of Object.entries(aliases)) {
  if (!allIds.has(id)) err(`aliases.json: Schlüssel ${id} ist keine existierende Entität`)
  for (const f of list) if (!edfs.includes(f)) err(`aliases.json: ${id} → ${f} (Datei fehlt)`)
}

// ─── 5. Pflichtfelder (ERROR) ───────────────────────────────────────────────────
const REQUIRED = ['id', 'name', 'frequency', 'amplitude', 'morphology', 'localization', 'classification']
for (const e of wellen)
  for (const field of REQUIRED)
    if (e[field] === undefined || e[field] === null || e[field] === '')
      err(`Pflichtfeld fehlt: ${e.id}.${field}`)

// ─── 5b. Array-Felder (ERROR) ───────────────────────────────────────────────────
// Felder, die die UI mit .map() rendert → müssen Arrays sein (sonst Render-Crash).
// Gefangen am 2026-06-29: triggering_situation als String → "x.map is not a function".
const ARRAY_FIELDS_WELLEN = ['aliases', 'localization', 'occurrence_context', 'differential_diagnoses', 'common_misinterpretations', 'source_notes']
const ARRAY_FIELDS_ARTS = ['aliases', 'localization', 'triggering_situation', 'patient_context', 'vigilance_context', 'common_misinterpretations', 'source_notes']
for (const e of wellen)
  for (const field of ARRAY_FIELDS_WELLEN)
    if (e[field] !== undefined && e[field] !== null && !Array.isArray(e[field]))
      err(`Feld muss Array sein (UI rendert mit .map()): ${e.id}.${field} ist ${typeof e[field]}`)
for (const e of arts)
  for (const field of ARRAY_FIELDS_ARTS)
    if (e[field] !== undefined && e[field] !== null && !Array.isArray(e[field]))
      err(`Feld muss Array sein (UI rendert mit .map()): ${e.id}.${field} ist ${typeof e[field]}`)

// ─── 5c. Topografie-Vokabular (ERROR) ───────────────────────────────────────────
// Jeder localization-Wert MUSS in LOC_TO_REGIONS (data/topography.ts) gemappt sein,
// sonst fehlt die Entität stillschweigend in der Topografie-Karte.
try {
  const topoSrc = readFileSync(join(root, 'data', 'topography.ts'), 'utf8')
  const block = topoSrc.slice(topoSrc.indexOf('LOC_TO_REGIONS'), topoSrc.indexOf('export interface RegionEntities'))
  const mapped = new Set([...block.matchAll(/'([^']+)':\s*\[/g)].map(m => m[1]))
  const seen = new Set()
  for (const e of wellen)
    for (const loc of e.localization ?? [])
      if (!mapped.has(loc) && !seen.has(loc)) {
        seen.add(loc)
        err(`localization '${loc}' ist nicht in LOC_TO_REGIONS gemappt (data/topography.ts) → fehlt in der Topografie-Karte`)
      }
} catch (e) {
  warn(`Topografie-Vokabular nicht prüfbar: ${e.message}`)
}

// ─── 6. ID-Lücken & partielle Entitäten (WARN) ──────────────────────────────────
const nums = wellen.map(e => parseInt(e.id.split('_')[1])).filter(n => !isNaN(n)).sort((a, b) => a - b)
const gaps = []
for (let n = nums[0]; n <= nums[nums.length - 1]; n++) if (!nums.includes(n)) gaps.push(n)
if (gaps.length) warn(`EEG-ID-Lücken: ${gaps.join(', ')} (Range ${nums[0]}–${nums[nums.length - 1]})`)

const partial = wellen.filter(e => e.data_status === 'partial').map(e => e.id)
if (partial.length) warn(`Partielle Entitäten (Review offen): ${partial.length} → ${partial.join(', ')}`)

const noSrc = wellen.filter(e => !e.source_notes || e.source_notes.length === 0).map(e => e.id)
if (noSrc.length) warn(`Wellen ohne source_notes: ${noSrc.join(', ')}`)

// ─── Bericht ────────────────────────────────────────────────────────────────────
console.log(`\n📊 EEG-Navigator Datenvalidierung`)
console.log(`   ${wellen.length} Wellen + ${arts.length} Artefakte = ${allIds.size} IDs · ${edfs.length} EDF-Dateien\n`)

if (warnings.length) {
  console.log(`🟡 WARNUNGEN (${warnings.length}):`)
  for (const w of warnings) console.log(`   · ${w}`)
  console.log()
}
if (errors.length) {
  console.log(`🔴 FEHLER (${errors.length}):`)
  for (const e of errors) console.log(`   ✗ ${e}`)
  console.log(`\n❌ Validierung fehlgeschlagen — ${errors.length} Fehler beheben.\n`)
  process.exit(1)
} else {
  console.log(`✅ Keine Fehler. ${warnings.length} Warnung(en).\n`)
  process.exit(0)
}
