// Lesbare Bezeichnungen für alle Enum-Werte der DB

export const labels: Record<string, string> = {
  // Frequenz
  Delta: 'Delta',
  Theta: 'Theta',
  Alpha: 'Alpha',
  Beta: 'Beta',
  Gamma: 'Gamma',
  variabel: 'Variabel',
  gemischt: 'Gemischt',
  hochfrequent: 'Hochfrequent',

  // Amplitude / Dauer
  'sehr klein': 'Sehr klein',
  klein: 'Klein',
  mittel: 'Mittel',
  gross: 'Groß',
  groß: 'Groß',
  'sehr groß': 'Sehr groß',
  'sehr_kurz': 'Sehr kurz',
  kurz: 'Kurz',
  lang: 'Lang',
  'sehr lang': 'Sehr lang',
  kontinuierlich: 'Kontinuierlich',
  ereignisabhaengig: 'Ereignisabhängig',

  // Polarität
  negativ: 'Negativ',
  positiv: 'Positiv',
  biphasisch: 'Biphasisch',
  triphasisch: 'Triphasisch',
  alternierend: 'Alternierend',

  // Lateralität
  bilateral_symmetrisch: 'Bilateral symmetrisch',
  bilateral_asymmetrisch: 'Bilateral asymmetrisch',
  links: 'Links',
  rechts: 'Rechts',
  wechselnd: 'Wechselnd',
  generalisiert: 'Generalisiert',
  nicht_anwendbar: '–',

  // Feldplausibilität
  streng_fokal: 'Streng fokal',
  fokal_mit_Ausbreitung: 'Fokal mit Ausbreitung',
  regional: 'Regional',
  hemisphärisch: 'Hemisphärisch',
  kein_plausibles_Feld: 'Kein plausibles Feld',

  // Referenz-Kontaminationsrisiko
  hoch: 'Hoch',
  niedrig: 'Niedrig',

  // Phasenumkehr
  ja: 'Ja',
  nein: 'Nein',
  möglich: 'Möglich',

  // Rhythmizität
  rhythmisch: 'Rhythmisch',
  arrhythmisch: 'Arrhythmisch',
  semirhythmisch: 'Semirhythmisch',
  paroxysmal: 'Paroxysmal',
  seriell: 'Seriell',
  ereignisbezogen: 'Ereignisbezogen',
  bewegungsabhaengig: 'Bewegungsabhängig',
  stimulusgekoppelt: 'Stimulusgekoppelt',
  sprachrhythmisch: 'Sprachrhythmisch',
  regelmaessig: 'Regelmäßig',
  irregulaer: 'Irregulär',

  // Periodizität
  periodisch: 'Periodisch',
  nicht_periodisch: 'Nicht periodisch',
  quasi_periodisch: 'Quasi-periodisch',

  // Klassifikation
  physiologisch: 'Physiologisch',
  benigne_variante: 'Benigne Variante',
  epileptiform: 'Epileptiform',
  pathologisch_nicht_epileptiform: 'Pathologisch',
  kontextabhaengig: 'Kontextabhängig',
  paediatrisch_altersabhaengig: 'Pädiatrisch',

  // Krankheitswert
  kein: 'Kein Krankheitswert',
  gering: 'Gering',
  hochpathologisch: 'Hochpathologisch',

  // Schlafstadium
  N1: 'N1',
  N2: 'N2',
  N3: 'N3',
  REM: 'REM',
  alle: 'Alle',

  // Altersgruppe
  neonatal: 'Neonatal',
  saeugling: 'Säugling',
  kleinkind: 'Kleinkind',
  schulkind: 'Schulkind',
  jugendlich: 'Jugendlich',
  erwachsen: 'Erwachsen',
  aelter: 'Älter',

  // Häufigkeit
  sehr_haeufig: 'Sehr häufig',
  haeufig: 'Häufig',
  gelegentlich: 'Gelegentlich',
  selten: 'Selten',
  sehr_selten: 'Sehr selten',

  // Kontext
  wach_entspannt: 'Wach entspannt',
  wach_angespannt: 'Wach angespannt',
  augen_offen: 'Augen offen',
  augen_geschlossen: 'Augen geschlossen',
  hyperventilation: 'Hyperventilation',
  fotostimulation: 'Fotostimulation',
  schlaefrig: 'Schläfrig',
  koma: 'Koma',
  aktivierung: 'Aktivierung',
  metabolisch: 'Metabolisch',
  medikament: 'Medikament',
}

export function label(value: string | null | undefined): string {
  if (value == null) return '–'
  return labels[value] ?? value.replace(/_/g, ' ')
}
