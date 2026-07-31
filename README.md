# EEG Navigator

[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16-black.svg)](https://nextjs.org)
[![Status](https://img.shields.io/badge/status-aktive%20Entwicklung-yellow.svg)](#)

> ⚠️ **Kein Medizinprodukt.** Alle dargestellten Werte, Klassifikationen und
> Differenzialdiagnosen dienen ausschließlich der ärztlichen Weiterbildung/Lehre und sind
> **keine Grundlage für Diagnosestellung, Therapieentscheidung oder klinisches Handeln**.

## Was ist das?

Ein regelbasiertes EEG-Lehr- und Entscheidungssystem: eine strukturierte Wissensdatenbank
von EEG-Mustern und Artefakten (Frequenz, Amplitude, Morphologie, Montage-Verhalten,
Differenzialdiagnosen) kombiniert mit einem interaktiven Web-Viewer für echte EDF-Aufnahmen
und einem geführten Diagnose-Wizard. Kein Machine-Learning-Klassifikator — die Logik ist
deterministisch und nachvollziehbar, jede Einschätzung ist auf dokumentierte Kriterien
zurückführbar.

## Warum

EEG-Befundung wird traditionell an wenigen, oft schwer zugänglichen Lehrbeispielen gelernt.
EEG Navigator bündelt strukturiertes Fachwissen (97 Wellenmuster, 26 Artefakte) mit
tatsächlich abspielbaren EDF-Beispielaufnahmen in einem einzigen, durchsuchbaren System —
inklusive der Fallstricke, die in der Praxis zu Fehlinterpretationen führen (Referenz-
kontamination, Band-Überlauf, Montage-abhängige Sichtbarkeit).

## Schnellstart

```bash
git clone https://github.com/maximilianhabs/eeg-navigator.git
cd eeg-navigator
npm install
cp .env.example .env.local   # APP_SECRET setzen, siehe Kommentar in der Datei
npm run dev
```

Läuft dann unter `http://localhost:3000`.

## Funktionen

- **Atlas**: durchsuchbare Übersicht aller EEG-Muster/Artefakte mit Topografie-Ansicht
- **EEG-Viewer**: Canvas-basierter EDF-Player mit umschaltbaren Montagen (bipolare
  Doppelbanane, Cz-Referenz, Average-Referenz)
- **Wizard**: schrittweiser Differenzialdiagnose-Dialog mit Live-Wellensimulator
- **Schlaf-/Intensiv-/Teaching-Module**: spezialisierte Lehreinheiten (Schlafstadien,
  Status-epilepticus-Kriterien, Entwicklungs-EEG)
- **Admin-Editor**: strukturierte Pflege der Entitätsdatenbank

## Wissenschaftliche Ehrlichkeit

- **Validiert**: die zugrunde liegenden Kriterien (Frequenz-/Amplitudenbereiche,
  Montage-Verhalten, Differenzialdiagnosen) folgen etablierter Fachliteratur (siehe
  Quellenangaben je Entität in der Datenbank).
- **Vereinfacht**: die Wizard-Scoring-Logik ist eine didaktische Annäherung, kein
  validiertes klinisches Scoring-System. Montage-/Vigilanz-Gewichtung ist heuristisch.
- **Nicht validiert**: es liegt keine formale klinische Validierungsstudie (Sensitivität/
  Spezifität gegen Facharzt-Konsens) für das Gesamtsystem vor.

## Limitationen

- Datenbank ist kuratiert, aber nicht vollständig (Abdeckung seltener Varianten wächst
  laufend, einige Einträge sind noch als "partial" markiert).
- EDF-Beispieldateien stammen überwiegend aus anonymisierten realen klinischen Aufnahmen
  eines einzelnen Klinikstandorts (Nihon-Kohden-Gerät) sowie einigen rekonstruierten
  Abbildungen aus Fachliteratur — keine multizentrische, repräsentative Stichprobe.
- Kein Ersatz für strukturierte Facharzt-Ausbildung oder Peer-Review.

## Datenschutz

Alle EDF-Beispielaufnahmen sind patientenseitig anonymisiert (kein Name, keine
Patienten-ID im Dateiheader). Es liegt keine Verarbeitung personenbezogener Nutzerdaten
über das für den Login notwendige Maß hinaus vor.

## Maintainer

Maximilian Habs — [maximilian.habs@googlemail.com](mailto:maximilian.habs@googlemail.com)

Dieses Projekt wurde unter Einsatz von KI-Unterstützung (Claude) entwickelt. Verantwortung
für Korrektheit, Testung und fachliche Freigabe der Inhalte liegt beim Autor, nicht bei
der eingesetzten KI.

## Lizenz

[Apache License 2.0](LICENSE) — siehe [CITATION.cff](CITATION.cff) für Zitierhinweise.
