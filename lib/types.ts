// ─── Shared ──────────────────────────────────────────────────────────────────

export interface FrequencyInfo {
  label: string
  min_hz: number | null
  max_hz: number | null
  typical_hz: number | null
  note?: string
}

export interface AmplitudeInfo {
  label: string
  min_uv: number | null
  max_uv: number | null
  typical_uv: number | null
  note?: string
}

export interface DurationInfo {
  label: string
  min_ms: number | null
  max_ms: number | null
  typical_ms: number | null
  note?: string
}

export interface FieldDistribution {
  description: string
  phase_reversal: string
  field_plausibility: string
  reference_contamination_risk: string
}

export interface MontageBehavior {
  bipolar_longitudinal: string
  bipolar_transverse: string
  referential_cz: string
  referential_average: string
  referential_mastoid: string
  best_montage: string
  typical_montage: string
  pitfalls: string
}

export interface DialogLogic {
  key_features: string[]
  criteria_for: string[]
  criteria_against: string[]
  mimics: string[]
  discriminating_questions: string[]
}

export interface ImageEntry {
  file: string
  montage: string
  context: string
  caption: string
  status: 'placeholder' | 'vorhanden' | 'lizenziert'
}

export type DataStatus = 'skeleton' | 'partial' | 'complete' | 'verified'
export type Priority = 'hoch' | 'mittel' | 'niedrig'

// ─── EEG Wellen-Entität ───────────────────────────────────────────────────────

export interface WaveEntity {
  id: string
  name: string
  aliases: string[]
  main_category: string
  subcategory: string
  frequency: FrequencyInfo
  amplitude: AmplitudeInfo
  duration: DurationInfo
  polarity: string
  localization: string[]
  laterality: string
  field_distribution: FieldDistribution
  morphology: string
  potential_course: string
  rhythmicity: string
  periodicity: string
  montage_behavior: MontageBehavior
  classification: string
  disease_value: string
  occurrence_frequency: string
  occurrence_context: string[]
  sleep_stage: string
  age_group: string
  pediatric_only: boolean
  dialog_logic: DialogLogic
  differential_diagnoses: string[]
  common_misinterpretations: string[]
  images: ImageEntry[]
  teaching_pearl: string
  warning: string | null
  notes: string
  data_status: DataStatus
  priority_for_mvp: Priority
  source_notes: string[]
  cross_references: {
    artifact_mimics: string[]
  }
}

// ─── Artefakt-Entität ─────────────────────────────────────────────────────────

export interface TimeLocking {
  ecg_synchronous: boolean
  pulse_synchronous: boolean
  respiration_synchronous: boolean
  movement_synchronous: boolean
  photic_synchronous: boolean
  stimulation_synchronous: boolean
  device_synchronous: boolean
}

export interface ArtifactDialogLogic {
  key_features: string[]
  criteria_for: string[]
  criteria_against: string[]
  discriminating_questions: string[]
}

export interface ArtifactEntity {
  id: string
  name: string
  aliases: string[]
  artifact_class: string
  subcategory: string
  scope: string
  source: string
  frequency: FrequencyInfo
  amplitude: AmplitudeInfo
  duration: DurationInfo
  localization: string[]
  laterality: string
  morphology: string
  rhythmicity: string
  montage_behavior: MontageBehavior
  cortical_field_plausible: boolean
  time_locking: TimeLocking
  patient_context: string[]
  triggering_situation: string[]
  vigilance_context: string[]
  auxiliary_channels: string[]
  cross_references: {
    eeg_mimics: string[]
  }
  dialog_logic: ArtifactDialogLogic
  provocation_or_check: string[]
  correction_intervention: string[]
  common_misinterpretations: string[]
  images: ImageEntry[]
  teaching_pearl: string
  warning: string | null
  clinical_relevance: string
  notes: string
  data_status: DataStatus
  priority_for_mvp: Priority
  source_notes: string[]
}

// ─── Datenbank-Typen ──────────────────────────────────────────────────────────

export interface WellenDB {
  database_name: string
  version: string
  entities: WaveEntity[]
}

export interface ArtefakteDB {
  database_name: string
  version: string
  artifacts: ArtifactEntity[]
}

// ─── Gemeinsamer Such-Typ ─────────────────────────────────────────────────────

export type AnyEntity = WaveEntity | ArtifactEntity

export function isWaveEntity(e: AnyEntity): e is WaveEntity {
  return !('artifact_class' in e)
}

export function isArtifactEntity(e: AnyEntity): e is ArtifactEntity {
  return 'artifact_class' in e
}
