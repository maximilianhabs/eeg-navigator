# Mitarbeit am EEG Navigator

Beiträge sind willkommen — fachliche Korrekturen, neue EEG-Entitäten, Bugfixes und
Verbesserungsvorschläge. Dieses Dokument erklärt, wie Beiträge am besten eingereicht werden.

## Sprache

Deutsch — für Code-Kommentare, Commit-Messages, Issues und Pull Requests. Englisch ist
nur für Dateinamen und etablierte technische Bezeichner (z. B. `useState`, `className`)
vorgesehen.

## Einstieg

1. Repository forken, lokal klonen.
2. Abhängigkeiten installieren: `npm install`
3. Umgebungsdatei anlegen: `cp .env.example .env.local` und `APP_SECRET` setzen.
4. Ersten Admin-Nutzer einrichten: `node scripts/setup-admin.mjs`
5. Entwicklungsserver starten: `npm run dev`

## Kleine PRs bevorzugt

Thematisch fokussierte, kleine Pull Requests werden deutlich schneller geprüft.
Größere Änderungen — neue Module, strukturelle Umbauten, neue Kategorien — bitte
**vorher als Issue besprechen**, bevor Implementierungsarbeit beginnt.

## Fachliche Änderungen

Jede inhaltliche Änderung (Frequenzbereiche, Amplitudenwerte, Klassifikation,
Differenzialdiagnosen, Beschreibungstexte) erfordert einen Literaturbeleg:

- DOI eines Zeitschriftenartikels oder Buchkapitels, oder
- vollständige Quellenangabe (Autor, Titel, Verlag, Jahr, Seite).

Ohne Beleg wird ein fachlicher PR nicht aufgenommen.

## Patientendaten

**Keine Patientendaten** — auch nicht anonymisiert oder in vermeintlich kleinen Ausschnitten —
in Issues, PRs, Screenshots oder Anhängen. EDF-Beispieldateien nur nach vollständiger
Anonymisierung und mit dokumentierter Berechtigung zur Weitergabe (siehe README).

## Vor dem PR: Prüfungen ausführen

```bash
npm run validate   # Datenvalidierung muss ohne Fehler durchlaufen
npm run build      # oder: npx tsc --noEmit  (TypeScript-Fehlerfreiheit)
```

Beide Prüfungen müssen grün sein. CI führt sie automatisch aus; ein PR mit roter CI
wird nicht gemergt.

## Review und Merge

Jeder Pull Request wird vom Maintainer geprüft. Es gibt keinen automatischen Merge.
Rückmeldungen kommen so bald wie möglich; bei einem Ein-Personen-Projekt kann das
einige Tage dauern.

## Fragen

Fragen zur Mitarbeit gerne per Issue oder per E-Mail an
[maximilian.habs@googlemail.com](mailto:maximilian.habs@googlemail.com).
