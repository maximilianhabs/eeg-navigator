#!/usr/bin/env bash
#
# deploy.sh — sicheres Deployment des EEG-Navigators auf neuro-vibe.de
#
# Verhindert strukturell die Fehlerklasse vom 2026-06-28:
#   1. Uncommittete/ungepushte Arbeit, die nie deployed wird
#   2. Stale data/-Volume (named volume wird von git pull NICHT aktualisiert)
#   3. Divergenz lokal <-> Server bei EDF-Dateien
#
# Aufruf:
#   ./deploy.sh            # Code + Daten + EDF
#   ./deploy.sh --data     # nur data/*.json neu syncen (kein Rebuild)
#   ./deploy.sh --edf      # nur EDF-Dateien (git pull + restart, kein Rebuild)
#
set -euo pipefail

SERVER="deploy@178.105.255.72"
CONTAINER="eeg-navigator"
REMOTE_DIR="~/eeg-navigator"
BRANCH="main"
MODE="${1:-full}"

red()   { printf '\033[31m%s\033[0m\n' "$*"; }
green() { printf '\033[32m%s\033[0m\n' "$*"; }
blue()  { printf '\033[34m%s\033[0m\n' "$*"; }

cd "$(dirname "$0")"

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

# ─── 2. Server: git pull (bringt Code + EDF via Bind-Mount) ─────────────────────
blue "▶ Server: git pull"
ssh "$SERVER" "cd $REMOTE_DIR && git pull origin $BRANCH"

# ─── 3. Rebuild (nur bei full) ──────────────────────────────────────────────────
if [ "$MODE" = "full" ]; then
  blue "▶ Server: docker compose build + up"
  ssh "$SERVER" "cd $REMOTE_DIR && docker compose build && docker compose up -d"
fi

# ─── 4. data/-Volume syncen (full + --data) MIT Backup ──────────────────────────
if [ "$MODE" = "full" ] || [ "$MODE" = "--data" ]; then
  blue "▶ Server: data/-Volume syncen (mit Backup)"
  ssh "$SERVER" "
    set -e
    TS=\$(date +%Y%m%d_%H%M%S)
    docker exec $CONTAINER sh -c 'mkdir -p /app/data/backups && cp /app/data/wellen.json /app/data/backups/wellen_\$TS.json && cp /app/data/artefakte.json /app/data/backups/artefakte_\$TS.json'
    echo \"  Backup: wellen_\$TS.json + artefakte_\$TS.json\"
    docker cp $REMOTE_DIR/data/wellen.json    $CONTAINER:/app/data/wellen.json
    docker cp $REMOTE_DIR/data/artefakte.json $CONTAINER:/app/data/artefakte.json
    echo '  data/*.json kopiert'
  "
fi

# ─── 5. Restart (data/edf-Modi brauchen Re-Read; full hat schon up -d) ──────────
if [ "$MODE" != "full" ]; then
  blue "▶ Server: docker restart (JSON wird beim Start in Speicher geladen)"
  ssh "$SERVER" "docker restart $CONTAINER"
fi
sleep 10

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
