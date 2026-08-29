# Betrieb: Server, Domains, Deployment

Alles, was man zum Ausrollen und Betreiben dieser App wissen muss. Stand **2026-08-24**,
alle Angaben an diesem Tag live gegen den Server geprüft (nicht aus dem Gedächtnis).

> **Keine Zugangsdaten in dieser Datei.** Passwörter, `APP_SECRET` und SSH-Schlüssel stehen
> bewusst nicht hier — siehe Abschnitt „Was hier nicht steht".

---

## Infrastruktur

| | |
|---|---|
| Anbieter | Hetzner Cloud |
| Öffentliche IP | `178.105.255.72` |
| SSH | `ssh deploy@178.105.255.72` (Key-basiert), Benutzer `deploy` |
| DNS | **über das Hetzner-Dashboard**, nicht über INWX |
| Reverse Proxy | Caddy — **gehört zum Dienstwerk-Stack**, nicht zu diesem Projekt |

### Maschine (gemessen 2026-08-24)

| | |
|---|---|
| Betriebssystem | Ubuntu 26.04 LTS, Kernel 7.0.0-22-generic |
| CPU | 2 vCPU, Intel Xeon (Skylake) |
| RAM | 3,7 GB gesamt · 1,6 GB belegt · 2,1 GB verfügbar |
| Festplatte | 38 GB gesamt · 6,3 GB belegt · **30 GB frei (18 %)** |
| Uptime | 81 Tage |

Das entspricht der Größenordnung eines Hetzner-Einstiegstarifs (2 vCPU / 4 GB / 40 GB).

### Speicher-Aufräumung 2026-08-24: von 96 % auf 18 %

Die Platte stand bei **96 %** (nur 1,7 GB frei) — in dem Bereich können Docker-Builds
fehlschlagen. Drei Maßnahmen, in dieser Reihenfolge:

| Maßnahme | Gewinn |
|---|---|
| Anonymisator zurückgebaut (Container + Image + Ordner) | 1,2 GB |
| Verwaiste Volumes + `python:3.9-slim` entfernt | 0,2 GB |
| **Docker-Build-Cache komplett geleert** (`docker builder prune -af`) | **23,7 GB** |

Die entscheidende Erkenntnis: Hauptverbraucher war **nicht** die Image-Sammlung (real nur
~2,6 GB), sondern der Build-Cache. Und `docker builder prune` **ohne** `-a` half nicht — von
23,7 GB galten nur 36 MB als „ungenutzt", der Rest war formal noch referenziert. Nur `-a`
räumt hier auf.

Regelmäßig prüfen, besonders vor größeren Deployments:

```bash
df -h /                  # Füllstand
docker system df         # Wohin der Platz geht — Build Cache separat beachten!
docker builder prune     # nur ungenutzter Cache (bringt oft wenig, s.o.)
docker builder prune -a  # kompletter Cache: viel Platz, dafür ein langsamer Folge-Build
docker image prune       # verwaiste Images
```

Kein Datenverlust bei all dem — der Cache baut sich beim nächsten Build wieder auf, der dann
einmalig länger dauert.

**Noch nicht ausgeschöpft** (braucht `sudo` mit Passwort, daher vom Betreiber selbst
auszuführen): APT-Cache ~104 MB (`sudo apt clean`), Journal-Logs ~26 MB
(`sudo journalctl --vacuum-size=50M`), ggf. alte Kernel (`sudo apt autoremove --purge`).
Bei 30 GB frei aktuell nicht nötig.

### Ressourcen im Blick behalten

Bei 2 vCPU und 3,7 GB RAM teilen sich vier Anwendungen die Maschine. Ein Next.js-Rebuild ist
der speicherhungrigste Vorgang — deshalb Deployments nicht parallel für mehrere Projekte
anstoßen.

Alle vier Domains lösen auf dieselbe IP auf (geprüft per `dig`):

```
neuro-vibe.de       → 178.105.255.72
eeg.neuro-vibe.de   → 178.105.255.72
edf.neuro-vibe.de   → 178.105.255.72
ano.neuro-vibe.de   → 178.105.255.72
```

## Was sonst noch auf diesem Server läuft

Der EEG Navigator teilt sich die Maschine mit drei weiteren Anwendungen. Alle Container
müssen im gemeinsamen Docker-Netz `nz-dienstplan_app` liegen, sonst findet Caddy sie nicht.

| Anwendung | Domain | Container | Port intern | Status (2026-08-24) |
|---|---|---|---|---|
| Dienstwerk | `neuro-vibe.de` | `nz-dienstplan-{frontend,backend,postgres,caddy}-1` | 3000 / 8000 / 5432 | läuft |
| **EEG Navigator** | `eeg.neuro-vibe.de` | `eeg-navigator` | 3000 (nur `127.0.0.1:3020`) | läuft, healthy |
| EDF Analyzer | `edf.neuro-vibe.de` | `edf-analyzer` | 8501 | läuft, healthy |
| ~~Anonymisator~~ | ~~`ano.neuro-vibe.de`~~ | — | — | **am 2026-08-24 vom Server entfernt** |

**Anonymisator zurückgebaut (2026-08-24):** Der Dienst wird lokal betrieben, ein
Server-Deployment ist derzeit nicht gewünscht. Container, Image (2,3 GB) und Projektordner
wurden entfernt; der Code liegt unverändert auf `github.com/maximilianhabs/anonymisator`.
Vor dem Löschen geprüft: keine Volumes am Container, keine uncommitteten oder ungepushten
Änderungen, keine lokale `.env` — es ging nichts verloren.

Noch offen: Der Caddy-Block für `ano.neuro-vibe.de` existiert weiter (die Domain antwortet
deshalb mit `401` aus Caddys Basic-Auth, dahinter läge jetzt ein `502`). Zum Entfernen müsste
der Block aus `~/nz-dienstplan/Caddyfile` raus — das erfordert einen Caddy-**Neustart**, der
kurzzeitig *alle* Domains betrifft, und ist deshalb bewusst nicht nebenbei erledigt worden.

## Deployment dieser App

**Immer über das mitgelieferte Skript**, nicht von Hand:

```bash
./deploy.sh          # Standard: voller Rebuild (Code- ODER Datenänderungen)
./deploy.sh --edf    # nur neue EDF-Binärdateien ohne JSON-Änderung
```

Das Skript führt Pre-Flight-Prüfungen aus (alles committet? gepusht? Validator grün?), bevor
es auf dem Server `git pull` + Rebuild anstößt.

**Warum ein Rebuild fast immer nötig ist:** `lib/data.ts` lädt `data/*.json` per `import` —
die Daten werden ins Image *gebacken*. Eine geänderte JSON-Datei in den Container zu kopieren
bewirkt nichts. Nur reine EDF-Binärdateien kommen ohne Rebuild live, weil `public/edf` ein
Bind-Mount ist und zur Laufzeit gelesen wird. Details in [FALLSTRICKE.md](FALLSTRICKE.md) F-06.

Verifikation gehört dazu: am gerenderten Output prüfen (HTTP-Status, Seite aufrufen), nicht am
Dateisystem des Containers.

## Caddy / Routing — Vorsicht

Der Reverse Proxy liest **ausschließlich** `~/nz-dienstplan/Caddyfile`. Ein Caddyfile in
*diesem* Repo hat auf dem Server **keine Wirkung**. Vor Routing-Änderungen oder neuen
Subdomains: `nz-dienstplan/docs/RUNBOOK-caddy.md` lesen.

Die wichtigste Falle: Das Caddyfile ist als *einzelne Datei* gemountet. Docker bindet dabei die
Inode, nicht den Pfad — ein `git pull` ersetzt die Datei, und der Container arbeitet mit der
alten weiter. `caddy reload` meldet dann Erfolg und lädt trotzdem den alten Stand. So war das
Caddyfile vom 22.06. bis 01.08.2026 unbemerkt eingefroren.

Deshalb nach Änderungen **neu starten, nicht neu laden**:

```bash
cd ~/nz-dienstplan && docker compose -f docker-compose.prod.yml restart caddy
bash ~/nz-dienstplan/scripts/caddy-pruefen.sh      # Erfolgskontrolle
```

## Wo die Daten liegen

### Verzeichnisse auf dem Server (`/home/deploy/`)

| Ordner | Größe | Inhalt |
|---|---|---|
| `eeg-navigator/` | 553 MB | dieses Projekt (inkl. `public/edf` als Bind-Mount) |
| `edf-analyzer/` | 49 MB | EDF-Analyzer |
| `backups/` | 26 MB | Sicherungen |
| `nz-dienstplan/` | 3 MB | Dienstwerk **inkl. des zentralen `Caddyfile`** |
| `anonymisator/` | 1,2 MB | Anonymisator (Container derzeit gestoppt) |

### Docker-Volumes

| Volume | Bedeutung |
|---|---|
| `eeg-navigator_eeg_data` | **Wichtigstes Volume dieses Projekts**: `users.json`, Entity-Bearbeitungen, Backups |
| `nz-dienstplan_postgres_data` | Datenbank des Dienstwerks |
| `nz-dienstplan_caddy_data` / `_config` | TLS-Zertifikate und Caddy-Zustand |
| `eeg-navigator_caddy_data` / `_config` / `_eeg_edf` | mutmaßliche Altlasten aus einer früheren Compose-Konfiguration (heute läuft Caddy zentral, `public/edf` ist Bind-Mount) — vor dem Löschen prüfen |

### Persistenz dieses Projekts

| Pfad im Container | Typ | Bedeutung |
|---|---|---|
| `/app/data` | Named Volume | `users.json`, Entity-Edits, Backups — überlebt Rebuilds, **muss gesichert werden** |
| `/app/public/edf` | Bind-Mount auf `~/eeg-navigator/public/edf` | EDF-Beispieldateien, kommen per `git pull` |

Der Unterschied ist wichtig: Das Volume ist die einzige Stelle, an der Serverzustand liegt, der
nicht im Git steht. Ein `docker volume rm` löscht Benutzerkonten und Bearbeitungen.

## Zugangsdaten — wo sie liegen (nicht was sie sind)

Bewusst **keine** Werte in dieser Datei, weil das Repository perspektivisch öffentlich wird.
Wer die Daten braucht, findet sie an folgenden Stellen:

| Was | Wo hinterlegt |
|---|---|
| Login der Live-Instanz (`eeg.neuro-vibe.de`) | private Notizsammlung des Betreibers, Eintrag „EEG Navigator Login" |
| Login der lokalen Entwicklungsinstanz | `data/users.json` im Repo — bcrypt-Hashes, **getrennt** von der Server-Instanz |
| `APP_SECRET` | `.env` auf dem Server, nie im Git (`.env.example` zeigt nur die Struktur) |
| Zugänge der Nachbar-Apps (EDF-Analyzer, Anonymisator) | jeweils eigene Notiz-Einträge pro Projekt |
| GitHub-Token / 2FA-Wiederherstellungscodes | ausschließlich lokal beim Betreiber, nie in einem Repo |
| SSH-Zugang | Key-basiert, privater Schlüssel nur auf dem Arbeitsrechner |
| **sudo-Passwort des Users `deploy`** | macOS-Schlüsselbund, Eintrag „Hetzner neuro-vibe-server sudo" |
| **root-Passwort des Servers** | macOS-Schlüsselbund, Eintrag „Hetzner neuro-vibe-server root"; jederzeit über die Hetzner Cloud Console neu setzbar |

**Warum die beiden Passwort-Zeilen dazugekommen sind (29.08.2026):** Sie fehlten, und
genau deshalb war das sudo-Passwort nicht auffindbar — es war beim `adduser deploy` am
09.06.2026 vergeben und nirgends hinterlegt worden. Wiederherstellung ging nur über das
Zurücksetzen des root-Passworts in der Hetzner Cloud Console. Beachte: `sudo` verlangt das
Passwort des Users `deploy`, nicht das von root. Über SSH ist gar keine Passwort-Anmeldung
möglich (`PermitRootLogin`/`PasswordAuthentication` aus, nur Schlüssel) — der einzige Weg
zum Setzen führt über die Web-Konsole.

**Wichtig und leicht zu verwechseln:** Lokale und Server-Instanz haben **getrennte,
unabhängige** `users.json` mit unterschiedlichen Passwörtern. Ein lokal funktionierender Login
schlägt auf dem Server fehl und umgekehrt — das ist kein Fehler, sondern Absicht.

Offener Punkt vor einer Veröffentlichung: `deploy.sh` enthält die Server-IP im Klartext. Über
DNS ist sie ohnehin trivial auflösbar, sie ist also kein Geheimnis — ob sie trotzdem in ein
öffentliches Repo soll, ist eine bewusste Entscheidung und noch nicht getroffen.
