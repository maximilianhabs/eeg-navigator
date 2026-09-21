#!/usr/bin/env bash
#
# deploy.sh — sicheres Deployment des EEG-Navigators auf neuro-vibe.de
#
# Verhindert strukturell die Fehlerklasse vom 2026-06-28/29:
#   1. Uncommittete/ungepushte Arbeit, die nie deployed wird
#   2. Daten-Änderungen ohne Rebuild (data/*.json wird via `import` ins Image
#      GEBACKEN — lib/data.ts: `import wellenRaw from '@/data/wellen.json'`.
#      docker cp ins Volume bringt NICHTS; nur `docker compose build` wirkt!)
#   3. Divergenz lokal <-> Server bei EDF-Dateien
#
# WICHTIG: Jede Änderung an data/wellen.json oder data/artefakte.json braucht
# einen REBUILD (Modus full). Nur reine EDF-Datei-Ergänzungen (Binärdatei, ohne
# JSON-Änderung) kommen über --edf live, weil public/edf ein Bind-Mount ist und
# die API das Verzeichnis zur Laufzeit liest.
#
# Aufruf:
#   ./deploy.sh            # full: Rebuild — für Code- ODER Daten-Änderungen
#   ./deploy.sh --edf      # nur neue EDF-Binärdateien (kein JSON) — git pull + restart
#
set -euo pipefail

SERVER="deploy@<server-ip>"
CONTAINER="eeg-navigator"
REMOTE_DIR="~/eeg-navigator"
BRANCH="main"
MODE="${1:-full}"

red()   { printf '\033[31m%s\033[0m\n' "$*"; }
green() { printf '\033[32m%s\033[0m\n' "$*"; }
blue()  { printf '\033[34m%s\033[0m\n' "$*"; }

cd "$(dirname "$0")"

# ─── 0. Modus prüfen ────────────────────────────────────────────────────────────
if [ "$MODE" != "full" ] && [ "$MODE" != "--edf" ]; then
  if [ "$MODE" = "--data" ]; then
    red "✗ --data gibt es nicht mehr: data/*.json wird ins Image gebacken."
    red "→ Bei JSON-Änderungen IMMER vollen Rebuild: ./deploy.sh (ohne Argument)."
  else
    red "✗ Unbekannter Modus '$MODE'. Erlaubt: (ohne Argument) | --edf"
  fi
  exit 1
fi

# Sicherung: --edf nur wenn der zu deployende Stand KEINE data/*.json-Änderung enthält
if [ "$MODE" = "--edf" ]; then
  if git diff --name-only "origin/$BRANCH@{1}" "origin/$BRANCH" 2>/dev/null | grep -q '^data/.*\.json$' \
     || git show --name-only --pretty=format: HEAD | grep -q '^data/.*\.json$'; then
    red "✗ --edf, aber der letzte Commit ändert data/*.json — das braucht einen Rebuild."
    red "→ Nutze ./deploy.sh (full)."
    exit 1
  fi
fi

# ─── 1. Pre-Flight: lokaler Zustand MUSS sauber sein ────────────────────────────
blue "▶ Pre-Flight-Checks (lokal)"

if [ -n "$(git status --porcelain)" ]; then
  red "✗ Working Tree ist NICHT sauber. Uncommittete Änderungen:"
  git status --short
  red "→ Erst committen + pushen, dann deployen. Abbruch."
  exit 1
fi
green "  ✓ Working Tree sauber"

git fetch origin "$BRANCH" --quiet
LOCAL=$(git rev-parse @)
REMOTE=$(git rev-parse "@{u}")
if [ "$LOCAL" != "$REMOTE" ]; then
  red "✗ Lokaler Branch weicht von origin/$BRANCH ab (ungepushte Commits?)."
  red "→ 'git push origin $BRANCH' ausführen. Abbruch."
  exit 1
fi
green "  ✓ Lokal = origin/$BRANCH (alles gepusht)"

# Datenintegrität: kaputte Querverweise, doppelte IDs, verwaiste EDF etc.
if ! node scripts/validate-data.mjs; then
  red "✗ Datenvalidierung fehlgeschlagen (siehe oben). Abbruch."
  exit 1
fi
green "  ✓ Datenvalidierung bestanden"

# ─── 2. Server: git pull (bringt Code + EDF via Bind-Mount) ─────────────────────
blue "▶ Server: git pull"
ssh "$SERVER" "cd $REMOTE_DIR && git pull origin $BRANCH"

# ─── 3. Rebuild (full) ODER Restart (--edf) ─────────────────────────────────────
# data/*.json wird ins Image gebacken → full MUSS rebuilden, damit JSON-Änderungen
# (Entitäten, Marker, Cross-Refs) live gehen. --edf braucht nur einen Restart, weil
# public/edf ein Bind-Mount ist und git pull die Binärdateien schon gebracht hat.
if [ "$MODE" = "full" ]; then
  blue "▶ Server: docker compose build + up (bäckt data/*.json neu ins Image)"
  ssh "$SERVER" "cd $REMOTE_DIR && docker compose build && docker compose up -d"
else
  blue "▶ Server: docker restart (EDF-Verzeichnis wird zur Laufzeit neu gelesen)"
  ssh "$SERVER" "docker restart $CONTAINER"
fi
sleep 12

# ─── 6. Verifikation: EDF-Liste lokal == Server ─────────────────────────────────
blue "▶ Verifikation: EDF-Dateien lokal == Server"
if diff \
   <(ls public/edf/ | grep '\.edf$' | sort) \
   <(ssh "$SERVER" "docker exec $CONTAINER ls /app/public/edf/" | grep '\.edf$' | sort) >/dev/null; then
  green "  ✓ EDF-Liste identisch"
else
  red "  ✗ EDF-Liste weicht ab:"
  diff <(ls public/edf/ | grep '\.edf$' | sort) \
       <(ssh "$SERVER" "docker exec $CONTAINER ls /app/public/edf/" | grep '\.edf$' | sort) || true
fi

# ─── 7. HTTP-Check ──────────────────────────────────────────────────────────────
CODE=$(curl -s -o /dev/null -w '%{http_code}' https://eeg.neuro-vibe.de || echo "000")
if [ "$CODE" = "200" ] || [ "$CODE" = "307" ]; then
  green "  ✓ Site erreichbar (HTTP $CODE)"
else
  red "  ✗ Site antwortet mit HTTP $CODE — prüfen!"
fi

green "▶ Deploy abgeschlossen ($MODE)"
