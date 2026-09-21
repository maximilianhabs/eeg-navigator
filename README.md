# EEG Navigator

[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16-black.svg)](https://nextjs.org)
[![Status](https://img.shields.io/badge/status-aktive%20Entwicklung-yellow.svg)](#)

> ⚠️ **Kein Medizinprodukt.** Alle dargestellten Werte, Klassifikationen und
> Differenzialdiagnosen dienen ausschließlich der ärztlichen Weiterbildung/Lehre und sind
> **keine Grundlage für Diagnosestellung, Therapieentscheidung oder klinisches Handeln**.

## Was ist das?

Ein EEG-Lehr- und Nachschlagewerk: eine strukturierte Wissensdatenbank
von EEG-Mustern und Artefakten (Frequenz, Amplitude, Morphologie, Montage-Verhalten,
Differenzialdiagnosen) kombiniert mit einem interaktiven Web-Viewer für echte EDF-Aufnahmen.

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

## Was bekomme ich beim Clone?

Das Repository ist mit allen enthaltenen EDF-Beispielaufnahmen nur **~11 MB** groß —
`git clone` lädt alle Teaching-Snippets direkt mit, es gibt keinen separaten Datei-Download,
kein CDN und keine externe Datenbank. `npm install` lädt danach die Next.js-Toolchain
(~350 MB `node_modules`, einmalig) — das ist der eigentliche Zeitfaktor beim ersten Setup,
nicht der Clone selbst.

## System-Anforderungen / Plattformen

- **Node.js** ≥ 20.9.0 (von Next.js 16 vorausgesetzt), npm.
- **Getestet auf macOS.** Linux/Windows sollten funktionieren (reines Next.js/React/
  TypeScript, keine bekannten OS-spezifischen Codepfade), sind aber von mir noch nicht
  selbst verifiziert — Rückmeldungen/Issues willkommen.
- Auth (`bcryptjs`) ist reines JavaScript ohne native Kompilierung — kein Build-Toolchain-
  Risiko (Python/gcc/etc.) auf irgendeiner Plattform.
- Tailwind v4 nutzt `lightningcss`, das ein plattformspezifisches natives Binary über npm
  `optionalDependencies` nachlädt (macOS/Linux/Windows, x64/ARM64) — npm löst das
  automatisch auf, es ist kein manueller Schritt nötig.
- Deployment (siehe unten) ist über Docker vorgesehen und damit grundsätzlich
  plattformunabhängig, unabhängig vom Host-OS.

## Funktionen

- **Atlas**: durchsuchbare Übersicht aller EEG-Muster/Artefakte mit Topografie-Ansicht
- **EEG-Viewer**: Canvas-basierter EDF-Player mit umschaltbaren Montagen (bipolare
  Doppelbanane, Cz-Referenz, Average-Referenz)
- **Schlaf und Teaching**: Schlafstadien, Entwicklungs-EEG und Montage-Lehre
- **Admin-Editor**: strukturierte Pflege der Entitätsdatenbank

Die erste Veröffentlichung konzentriert sich auf Atlas, Suche, Entitätsseiten und
EDF-Viewer sowie Schlaf und Teaching. Wizard/Klassifikation und Intensiv-/NCSE-Seiten
sind ausgeblendet und auch über direkte URLs nicht zugänglich. Ihr Quellcode bleibt
für die Weiterentwicklung erhalten. Die fachlichen Kategorien und Filter im Atlas
sowie die interne Administration bleiben verfügbar.

## Wissenschaftliche Ehrlichkeit

- **Validiert**: die zugrunde liegenden Kriterien (Frequenz-/Amplitudenbereiche,
  Montage-Verhalten, Differenzialdiagnosen) folgen etablierter Fachliteratur (siehe
  Quellenangaben je Entität in der Datenbank).
- **Experimentell und deaktiviert**: Der Klassifikations-Wizard ist nicht über die Website
  erreichbar. Sein Entwicklungsstand liegt unter `components/wizard/WizardPage.tsx`.
  Die Scoring-Logik ist eine didaktische Annäherung und kein validiertes klinisches System.
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

## Feedback und EDF-Beiträge

Hinweise auf Fehler, fachliche Ergänzungen und Verbesserungsvorschläge sind willkommen:
[maximilian.habs@googlemail.com](mailto:maximilian.habs@googlemail.com?subject=Feedback%20zum%20EEG%20Navigator).
Bitte die betroffene Seite oder Entitäts-ID angeben und keine personenbezogenen
Patientendaten mitsenden, auch nicht in Screenshots.

Eigene EDF-Beispiele können per E-Mail vorgeschlagen werden. Voraussetzung sind
vollständige Anonymisierung und die Berechtigung zur Weitergabe und Veröffentlichung.
Insbesondere Dateinamen, Patienten-/Aufzeichnungsfelder, Datumsangaben und Annotationen
prüfen; bloßes Umbenennen reicht nicht. Bei Unsicherheit zunächst ohne Anhang anfragen.
Bitte eine kurze fachliche Beschreibung und Herkunft ohne Personenbezug ergänzen.
Maximilian Habs prüft jeden Beitrag. Aufnahme in die Website, Veröffentlichungsumfang,
Namensnennung und Lizenz werden vorab abgestimmt; es erfolgt keine automatische Veröffentlichung.

## Maintainer

Maximilian Habs — [maximilian.habs@googlemail.com](mailto:maximilian.habs@googlemail.com)

Dieses Projekt wurde unter Einsatz von KI-Unterstützung (Claude) entwickelt. Verantwortung
für Korrektheit, Testung und fachliche Freigabe der Inhalte liegt beim Autor, nicht bei
der eingesetzten KI.

## Lizenz

[Apache License 2.0](LICENSE) — siehe [CITATION.cff](CITATION.cff) für Zitierhinweise.

## Weiterführende Dokumentation

- [Road to Public](docs/ROAD_TO_PUBLIC.md) — Fahrplan zur deutschsprachigen Veröffentlichung
- [docs/BETRIEB.md](docs/BETRIEB.md) — Server, Domains, DNS, Deployment, Persistenz
- [docs/FALLSTRICKE.md](docs/FALLSTRICKE.md) — bekannte technische Fallen mit Prüfbefehlen

## Betrieb auf neuro-vibe.de

Der Reverse Proxy dieses Servers gehört zum Dienstwerk-Stack und liest
ausschliesslich `~/nz-dienstplan/Caddyfile`. Änderungen an einem Caddyfile in
diesem Projekt wirken auf dem Server **nicht**.

Vor jeder Änderung am Routing — und bevor eine neue Subdomain eingerichtet
wird — gilt: **nz-dienstplan/docs/RUNBOOK-caddy.md** lesen.

Kurzfassung der wichtigsten Falle: Das Caddyfile ist als *einzelne Datei*
eingehängt. Docker bindet dabei die Inode, nicht den Pfad — ein `git pull`
ersetzt die Datei, und der Container arbeitet mit der alten weiter.
`caddy reload` meldet dann Erfolg und lädt trotzdem den alten Stand. So war
das Caddyfile vom 22.06. bis 01.08.2026 unbemerkt eingefroren.

Deshalb nach jeder Änderung **neu starten**, nicht neu laden:

```bash
cd ~/nz-dienstplan && docker compose -f docker-compose.prod.yml restart caddy
bash ~/nz-dienstplan/scripts/caddy-pruefen.sh      # Erfolgskontrolle
```
