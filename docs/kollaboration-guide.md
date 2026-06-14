# EEG Navigator — Kollaborations-Guide

**Für:** Maximilian Habs & Kollege  
**Ziel:** Gemeinsam am EEG Navigator arbeiten — ohne Programmierkenntnisse, mit Claude Code als KI-Assistenten  
**Stand:** Juni 2026

---

## Das Prinzip in einem Satz

Der Kollege arbeitet lokal auf seinem Mac mit Claude Code, schlägt Änderungen über GitHub vor — Maximilian prüft, genehmigt und deployed auf den Server.

```
Kollege + Claude Code  →  GitHub (Pull Request)  →  Maximilian prüft  →  Live auf eeg.neuro-vibe.de
```

Kein Kollege hat Zugang zum Server. Kein Kollege muss programmieren.

---

## Teil 1: Einmalig — Maximilian richtet ein

### 1.1 Kollegen ins GitHub-Repo einladen

1. GitHub aufrufen: github.com/maximilianhabs/eeg-navigator
2. **Settings** → **Collaborators** → **Add people**
3. GitHub-Username des Kollegen eingeben
4. Rolle wählen: **Write** (kann Änderungen vorschlagen, aber nicht direkt auf `main` pushen)
5. Kollege bekommt eine E-Mail-Einladung → muss diese bestätigen

### 1.2 Branch Protection aktivieren (Sicherheitsnetz)

Verhindert, dass jemand — auch versehentlich — direkt auf `main` schreibt:

1. GitHub → **Settings** → **Branches**
2. **Add branch ruleset**
3. Branch: `main`
4. Haken setzen bei: **Require a pull request before merging**
5. Speichern

Ab jetzt muss jede Änderung über einen Pull Request — du siehst alles bevor es live geht.

---

## Teil 2: Einmalig — Kollege richtet ein

### 2.1 GitHub Account erstellen

1. github.com aufrufen → **Sign up**
2. Kostenlosen Account anlegen
3. Username Maximilian mitteilen (für die Einladung)
4. Einladungs-E-Mail von GitHub bestätigen

### 2.2 GitHub Desktop installieren

Grafische Oberfläche für Git — kein Terminal nötig.

1. desktop.github.com aufrufen → herunterladen
2. Installieren und starten
3. Mit GitHub-Account einloggen

### 2.3 Repo clonen (lokale Kopie anlegen)

1. GitHub Desktop → **File** → **Clone repository**
2. `maximilianhabs/eeg-navigator` auswählen
3. Lokalen Ordner wählen, z.B. `Dokumente/eeg-navigator`
4. **Clone** klicken — der gesamte Projektcode ist jetzt lokal vorhanden

### 2.4 Claude Code installieren

Claude Code ist der KI-Assistent der direkt im Projektordner arbeitet.

1. **Node.js installieren:** nodejs.org → LTS-Version herunterladen und installieren
2. **Terminal öffnen** (Spotlight: „Terminal")
3. Claude Code installieren:
   ```bash
   npm install -g @anthropic-ai/claude-code
   ```
4. In den Projektordner wechseln:
   ```bash
   cd ~/Dokumente/eeg-navigator
   ```
5. Claude Code starten:
   ```bash
   claude
   ```
6. Beim ersten Start: mit Anthropic-Account einloggen (anthropic.com → Account anlegen)

> **Hinweis:** Claude Code arbeitet direkt im Projektordner. Es sieht alle Dateien und kann Änderungen vorschlagen — genau wie Maximilian es in dieser Zusammenarbeit tut.

### 2.5 GitHub-Connector in Claude Code einrichten (optional, aber empfohlen)

Mit dem GitHub-Connector kann Claude Code Pull Requests direkt lesen und kommentieren:

1. In Claude Code tippen: `/config`
2. **MCP Servers** → **Add**
3. GitHub MCP Server auswählen
4. GitHub Personal Access Token eingeben:
   - GitHub → **Settings** → **Developer Settings** → **Personal Access Tokens** → **Tokens (classic)**
   - **Generate new token** → Scope: `repo` ankreuzen → Token kopieren
5. Token in Claude Code einfügen → Verbindung testen

> **Was bringt das?** Claude Code kann dann direkt sehen was auf GitHub passiert — Pull Request-Kommentare lesen, Issues nachschlagen — ohne den Browser öffnen zu müssen.

### 2.6 App lokal starten (zum Testen)

**Option A: Mit Docker** (empfohlen — identisch mit dem Server)

1. Docker Desktop installieren: docker.com/products/docker-desktop
2. Docker Desktop starten (muss im Hintergrund laufen)
3. Im Terminal:
   ```bash
   cd ~/Dokumente/eeg-navigator
   cp .env.example .env
   ```
4. Die `.env`-Datei öffnen (z.B. mit TextEdit) → `APP_SECRET` durch einen beliebigen langen Text ersetzen
5. App starten:
   ```bash
   docker compose up --build
   ```
6. Browser öffnen: **localhost:3020** → App läuft lokal

**Option B: Ohne Docker** (schneller für reine Textänderungen)

1. Im Terminal:
   ```bash
   cd ~/Dokumente/eeg-navigator
   npm install
   cp .env.example .env
   npm run dev
   ```
2. Browser: **localhost:5100**

---

## Teil 3: Täglicher Workflow

### 3.1 Vor jeder Arbeitssitzung: aktuellen Stand holen

**Wichtig:** Immer zuerst den neuesten Stand vom Server holen, bevor man anfängt.

1. GitHub Desktop öffnen
2. **Fetch origin** klicken (prüft ob es Neuigkeiten gibt)
3. Falls Änderungen vorhanden: **Pull** klicken (lädt sie herunter)

### 3.2 Neuen Branch erstellen

Ein Branch ist wie eine eigene Arbeitskopie — Änderungen dort beeinflussen nicht das laufende System.

1. GitHub Desktop → **Current Branch** (oben in der Mitte)
2. **New Branch**
3. Sinnvollen Namen vergeben, z.B.:
   - `feature/entitaet-sreda-ergaenzen`
   - `fix/dipol-logik-korrektur`
   - `content/pädiatrische-wellen`
4. **Create Branch**

### 3.3 Mit Claude Code arbeiten

Claude Code im Projektordner starten:

```bash
cd ~/Dokumente/eeg-navigator
claude
```

Typische Aufgaben die Claude Code übernimmt:

- **Neue EEG-Entität hinzufügen:** „Füge eine neue Entität für SREDA in wellen.json ein mit folgenden Daten: ..."
- **Bestehende Entität ergänzen:** „In EEG_0067 fehlt noch das Feld etiology — ergänze folgende Ätiologien: ..."
- **Fachliche Texte überarbeiten:** „Überarbeite die clinical_significance von EEG_0060 — hier ist der korrigierte Text: ..."
- **Fehler korrigieren:** „Die Dipol-Logik in der Feldanalyse ist falsch — bei temporaler Negativität sollten diese Elektroden positiv sein: ..."

Claude Code zeigt alle Änderungen zur Kontrolle bevor sie gespeichert werden.

### 3.4 Änderungen committen

Ein Commit ist ein gespeicherter „Schnappschuss" der Änderungen mit einer Erklärung was gemacht wurde.

1. GitHub Desktop öffnen — zeigt alle geänderten Dateien
2. Unten links: kurze Beschreibung eingeben, z.B. `SREDA-Entität ergänzt` oder `Dipol-Logik korrigiert`
3. **Commit to feature/...** klicken

Mehrere Commits pro Sitzung sind völlig normal — nach jeder abgeschlossenen Teilaufgabe einen Commit machen.

### 3.5 Pull Request erstellen

Ein Pull Request ist die formelle Anfrage: „Ich möchte meine Änderungen in das Hauptprojekt einbringen."

1. GitHub Desktop → **Publish Branch** (erscheint oben)
2. **Create Pull Request** → öffnet GitHub im Browser
3. Titel eingeben: was wurde geändert?
4. Beschreibung: kurz erklären was und warum — hilft Maximilian bei der Prüfung
5. **Create Pull Request** klicken

Maximilian bekommt eine E-Mail-Benachrichtigung.

---

## Teil 4: Maximilian prüft und deployed

### 4.1 Pull Request prüfen

1. GitHub → **Pull Requests** → den neuen PR öffnen
2. **Files changed** anzeigen — alle Änderungen sind farblich markiert (grün = neu, rot = entfernt)
3. Kommentare hinterlassen wenn etwas unklar ist oder geändert werden soll
4. Wenn alles passt: **Approve** → **Merge pull request**

### 4.2 Auf den Server deployen

Nach dem Merge auf dem Server:

```bash
ssh deploy@178.105.255.72
cd ~/eeg-navigator
git pull
docker compose -f docker-compose.prod.yml up -d --build
```

Die Änderungen sind dann live auf **eeg.neuro-vibe.de**.

---

## Übersicht: Wer braucht was?

| | Maximilian | Kollege |
|---|---|---|
| GitHub Account | ✅ vorhanden | ✅ neu anlegen |
| GitHub Desktop | optional | ✅ installieren |
| Claude Code | ✅ vorhanden | ✅ installieren |
| GitHub-Connector (MCP) | optional | empfohlen |
| Docker Desktop | lokal optional | empfohlen |
| Server-Zugang (SSH) | ✅ | ❌ nicht nötig |
| Zugang zu eeg.neuro-vibe.de | ✅ Admin | auf Anfrage User-Account |

---

## Häufige Situationen

**„Ich habe eine Änderung gemacht aber sie sieht lokal komisch aus"**  
→ GitHub Desktop → rechtsklick auf die Datei → **Discard changes** — setzt auf den letzten Commit zurück

**„Maximilian hat etwas geändert und ich habe Konflikte"**  
→ GitHub Desktop zeigt Konflikte an → Claude Code fragen: „Ich habe einen Merge-Konflikt in wellen.json — kannst du helfen das aufzulösen?"

**„Ich möchte eine Änderung rückgängig machen die schon gemergt ist"**  
→ Maximilian informieren → GitHub → PR öffnen → **Revert** — erstellt automatisch einen neuen PR der die Änderung rückgängig macht

**„Wie sehe ich was gerade auf dem Server live ist?"**  
→ eeg.neuro-vibe.de aufrufen — das ist immer der Stand des `main`-Branches nach dem letzten Deployment

---

## Kommunikation & Koordination

Für die Zusammenarbeit empfiehlt sich ein einfacher Kanal:

- **GitHub Issues** für Aufgaben und Fehler: github.com/maximilianhabs/eeg-navigator/issues
- **Pull Request-Kommentare** für konkretes Feedback zu Änderungen
- **WhatsApp/Signal** für schnelle Abstimmung wer gerade an was arbeitet (verhindert Doppelarbeit)

Faustregel: **Nie gleichzeitig an derselben Datei arbeiten.** Kurz absprechen wer welchen Bereich bearbeitet.
