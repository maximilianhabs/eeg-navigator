# Fallstricke & technische Fallen

Sammlung wiederkehrender Fehlerquellen in diesem Projekt — analog zum `bugtracker.md`-Muster
der Schwesterprojekte. **Jeder Fund kommt hier rein**, auch kosmetische oder solche, die
"eigentlich klar" wirken. Ziel: dass derselbe Fehler nicht zweimal passiert und dass
Nachfolgende (Mensch wie KI) die nicht-offensichtlichen Stellen kennen, bevor sie sie anfassen.

---

## F-01 — Canvas: `ctx.scale()` akkumuliert, `setTransform()` nicht

**Gefunden:** 2026-08-24, beim HiDPI-Umbau (Chunk 1 des UI-Plans).

Beide EDF-Renderer rufen `draw()` bei **jedem State-Wechsel** auf (Montage, Sensitivität,
Zeitfenster, Filter, Theme) — nicht nur beim Resize. `ctx.scale(dpr, dpr)` ist kumulativ:
beim zweiten Zeichnen stünde der Faktor bei 4, beim dritten bei 8, und das Bild wäre nach
wenigen Klicks unbrauchbar zerrissen.

Deshalb gilt hier **immer** `ctx.setTransform(dpr, 0, 0, dpr, 0, 0)` (absolut, idempotent),
nie `ctx.scale()`.

Ausnahme, die leicht in die Irre führt: `components/EegThumbnail.tsx` nutzt `ctx.scale()` —
das ist dort korrekt, weil der Canvas unmittelbar davor über `canvas.width = …` neu
dimensioniert wird, was den Kontext-Transform ohnehin zurücksetzt. **Nicht als Vorlage für
die großen Viewer übernehmen.**

**Prüfbar im Browser:**
```js
document.querySelector('canvas').getContext('2d').getTransform().a
// muss exakt devicePixelRatio sein — 4/8/16 = Akkumulationsfehler
```

## F-02 — Canvas: Backing-Store vs. CSS-Größe

Ein Canvas hat zwei unabhängige Größen: `canvas.width/height` (Rasterpixel) und die
CSS-Darstellungsgröße. Sind sie identisch, rastert der Browser auf Retina/4K in halber
Auflösung und skaliert hoch → unscharfe Kurven.

Zwei Fälle im Projekt, die unterschiedlich behandelt werden **müssen**:

- **Fluider Canvas** (`EdfViewer/index.tsx`, `EdfViewerDirect.tsx`, CSS `w-full h-full`):
  Backing-Store aus `offsetWidth/Height × dpr` ableiten, CSS-Größe **nicht** setzen (macht
  Tailwind). Die Zeichenkoordinaten `W`/`H` sind die CSS-Pixel, nicht `canvas.width`.
- **Intrinsisch dimensionierter Canvas** (`EEGViewer/EEGCanvas.tsx`, Breite ergibt sich aus
  Kanalzahl × Pixel/Sekunde, horizontal scrollbar): hier **muss** `canvas.style.width/height`
  explizit gesetzt werden. Sonst stellt der Browser den vergrößerten Backing-Store 1:1 dar
  und der Canvas wird physisch doppelt so groß statt doppelt so fein.

**Prüfbar:** `c.width / c.offsetWidth` muss `devicePixelRatio` ergeben.

## F-03 — `imageRendering: 'crisp-edges'` als Unschärfe-Kompensation

`EEGCanvas.tsx` trug `imageRendering: 'crisp-edges'` — ein Symptom-Workaround gegen F-02.
Nach dem HiDPI-Fix ist es nicht nur wirkungslos, sondern **schädlich**: es unterdrückt das
Kanten-Antialiasing der Kurvenzeichnung und lässt Signale treppig wirken. Entfernt.

Merksatz: Wenn `crisp-edges`/`pixelated` auf einem Canvas auftaucht, der Kurven zeichnet
(keine Pixelgrafik), ist meist die Auflösung das eigentliche Problem.

## F-04 — JSX erlaubt keine Kommentare zwischen Attributen

`{/* … */}` funktioniert nur in **Children**-Position, nicht zwischen Attributen eines Tags.
Dort wird es als Spread-Expression geparst → `TS1005: '...' expected`. Kommentar über das
Element setzen.

## F-05 — `components/EEGViewer/` ist aktuell toter Code

**Gefunden:** 2026-08-24.

`EEGViewer/index.tsx`, `EEGMiniViewer.tsx` und `EEGCanvas.tsx` (synthetischer Signal-
generator inkl. Quellenmodell/Feldphysik, ~650 LOC Rendering) werden von **keiner** App-Seite
importiert und tauchen nicht im Client-Bundle auf. Einzige verbleibende Verbindung:
`lib/eegStates.ts` importiert aus `signals.ts` nur einen **Typ** (`EEGState`), also nichts
zur Laufzeit.

Konsequenz: Änderungen dort haben keine sichtbare Wirkung in der App. Vor Arbeiten an diesen
Dateien klären, ob sie eingebunden oder entfernt werden sollen — sonst investiert man Zeit in
Code, den niemand sieht. (Der Name kollidiert zusätzlich mit der Funktion `EEGViewerPage` in
`app/eeg-viewer/page.tsx`, die den **EdfViewer** rendert, nicht diesen Zweig — leicht zu
verwechseln.)

## F-06 — Datenänderungen erfordern Docker-Rebuild, kein Volume-Sync

`lib/data.ts` lädt `data/*.json` per `import`, nicht per `fs.readFileSync` — die Daten werden
also **ins Build gebacken**. Eine geänderte JSON-Datei auf dem Server ins Volume zu kopieren
bleibt wirkungslos; es braucht `docker compose build`. Verifikation immer am gerenderten
Output, nie am Dateisystem des Containers.

## F-07 — Tailwind-Utilities lassen sich nicht per `className`-Prop überschreiben

**Gefunden:** 2026-08-24, beim Bau der UI-Primitiven (Chunk 2).

`<Card className="rounded-2xl">` blieb bei 12px statt 16px. Grund: Die Basis-Klasse der
Komponente (`rounded-xl`) und die übergebene (`rounded-2xl`) sind beides Tailwind-Utilities
mit **identischer Spezifität**. Welche gewinnt, entscheidet die Reihenfolge im erzeugten
Stylesheet — nicht die Reihenfolge im `className`-String. Das Ergebnis ist damit weder
vorhersagbar noch stabil über Builds hinweg.

Konsequenz für die Primitiven in `components/ui/`: Eigenschaften, die ein Aufrufer variieren
können soll (Radius, Padding, Fläche), sind **Props mit Inline-Style-Auflösung**, keine
per `className` überschreibbaren Klassen. `className` bleibt für additive Dinge (Abstände
nach außen, Grid-Platzierung) reserviert.

Prüfbar: `getComputedStyle(el).borderRadius` gegen den erwarteten Wert.

## F-08 — Docker umgeht ufw: `ports:` ohne Adresse ist weltweit offen

**Gefunden:** 2026-08-29, beim Sicherheits-Audit des Servers — durch einen Portscan **von
außen**. Von innen sah alles korrekt aus.

Die Firewall des Servers erlaubte ausdrücklich nur 22, 80 und 443 (`Default: deny
incoming`). Trotzdem war der EEG Navigator unter `http://178.105.255.72:3020` aus dem
Internet erreichbar — unverschlüsselt, an Caddy vorbei, ohne TLS und ohne die
Security-Header, die für `eeg.neuro-vibe.de` gesetzt sind. Anmeldedaten gingen auf diesem
Weg im Klartext über die Leitung.

Ursache ist kein Konfigurationsfehler in ufw, sondern die Arbeitsweise von Docker: **Docker
trägt Port-Weiterleitungen direkt in die `nat`-Tabelle von iptables ein — vor den Ketten,
die ufw verwaltet.** Ein Mapping auf `0.0.0.0` ist damit weltweit erreichbar, egal was
`ufw status` anzeigt. Die Firewall sieht diesen Verkehr nie.

**Eine ufw-Regel behebt das nicht.** Nur das Mapping selbst wirkt:

```yaml
ports:
  - "3020:3000"              # FALSCH — bindet auf 0.0.0.0, weltweit offen
  - "127.0.0.1:3020:3000"    # richtig — nur lokal
```

Hier wurde die Loopback-Variante gewählt und nicht ersatzlos gestrichen, weil
`docs/kollaboration-guide.md` zur lokalen Entwicklung an `localhost:3020` verweist — das
funktioniert mit der Bindung an `127.0.0.1` unverändert weiter. In Produktion braucht Caddy
den Port ohnehin nicht: Es spricht den Container über den Namen im Netz `nz-dienstplan_app`
an.

**Prüfbar — und zwar nur von einem anderen Rechner aus:**
```bash
nc -z -w3 178.105.255.72 3020     # Erfolg = offen, das wäre der Fehlerfall
```

Auf dem Host selbst sieht ein offener Port genauso aus wie ein zugebundener. `ss -tlnH |
grep 3020` zeigt lediglich, **welche** Adresse gebunden ist — `0.0.0.0` ist der Alarm,
`127.0.0.1` ist korrekt.

Für alle Container eines Hosts auf einmal:
`homeserver/services/hetzner-ops/docker-ports-pruefen.sh`

---

## F-09 — EDF-Cropper: Exportmodus entscheidet, ob Montagen ableitbar sind

**Gefunden:** 2026-09-21, beim Hinzufügen von EEG_0040 (Breach-Rhythmus).

**Symptom:** Navigator zeigt „vormontiert — Referenzmontagen nicht ableitbar" und sperrt
Montage-Wechsel. Montage-Buttons (Doppelbanane, CZ-Ref, Avg-Ref) fehlen.

**Ursache:** Der EDF-Cropper hat zwei Exportmodi:

| Modus | `exp-signal-source` | Was in die EDF kommt | Navigator-Verhalten |
|---|---|---|---|
| **Raw** | `raw` | Original-Elektrodenkanäle (`EEG Fp1-Ref` etc.) | Alle Montagen ableitbar ✅ |
| **Gefilterte Ansicht** | `filtered` | Bereits berechnete Montage-Signale (`Fp1-F7`, `F7-T3` etc.) | `isPreMontaged()` sperrt Montage-Wechsel ❌ |

Nach Einführung des SignalResurrect-Workflows war „EDF+PDF / gefilterte Ansicht" als Cropper-Standard
aktiv (damit EDF und PDF exakt übereinstimmen). Für den Navigator ist das falsch.

**Diagnose:** `python3 -c` auf die EDF: wenn Kanallabels `Fp1-F7`, `F7-T3` etc. zeigen →
bipolarer Export. Wenn `EEG Fp1-Ref`, `EEG F7-Ref` etc. → Raw-Export.

**Fix:** Im EDF-Cropper beim Export für den Navigator immer **„Originalkanäle (roh)"** wählen
(`exp-signal-source = raw`), kein PDF-Kombimodus. Danach Datei ersetzen und testen.

**Hintergrund `isPreMontaged()`:** Die Funktion in `components/EdfViewer/montages.ts` prüft,
ob >60 % der EEG-Kanäle das Muster `Elektrode-Elektrode` (z. B. `Fp1-F7`) tragen. Das ist
korrekt für aus PDF-Abbildungen rekonstruierte Signale (SignalResurrect) — dort sind nur
Differenz-Signale vorhanden und Remontage wäre physikalisch falsch. Für Klinik-Rohexporte
darf die Funktion nie auslösen, weil diese immer referentiell exportiert werden.

---

## F-10 — `.dockerignore`-Eintrag ohne korrespondierenden Bind-Mount in `docker-compose.prod.yml`

**Gefunden:** 2026-09-21, nach Etappe-B-Deploy (Thumbnails und Viewer vollständig ausgefallen).

**Symptom:** Atlas zeigt „0 EDF-Snippets", Thumbnails bleiben leer, EDF-Viewer lädt keine
Kurven. `/api/edf/*` gibt `[]` zurück — kein Fehler, kein Log-Eintrag.

**Ursache:** Eine Dateiausschluss in `.dockerignore` und der kompensierende Bind-Mount in
`docker-compose.prod.yml` sind **zwei Seiten derselben Entscheidung** und müssen atomar
geändert werden:

| Datei | Rolle |
|---|---|
| `.dockerignore` | `public/edf/*.edf` — EDF aus Image-Build ausschließen (korrekt: ~100 MB Binärdaten) |
| `docker-compose.prod.yml` | `./public/edf:/app/public/edf:ro` — Dateien zur Laufzeit einmounten |

In Etappe B wurde `.dockerignore` neu angelegt (vorher gab es keins — EDF-Dateien landeten
im Image). Der Bind-Mount wurde dabei vergessen. Das Image war von da an leer; ein einfaches
`docker compose up -d` kann das nicht reparieren, weil kein Datei-Diff auf Fehlendes hinweist.

**Entstehung rekonstruiert:**
- 14.06.2026: `docker-compose.prod.yml` angelegt — kein `.dockerignore`, EDF im Image ✅
- 21.09.2026 (Etappe B): `.dockerignore` mit `public/edf/*.edf` eingeführt — Bind-Mount
  vergessen → Container hat ab diesem Moment 0 EDF-Dateien ❌

**Diagnose im laufenden Container:**
```bash
docker exec eeg-navigator ls /app/public/edf/ 2>&1 | wc -l   # 0 = Mount fehlt
docker inspect eeg-navigator --format '{{json .Mounts}}'      # Bind-Mount prüfen
```

**Fix:** Bind-Mount in `docker-compose.prod.yml` ergänzen, dann `docker compose up -d`
(kein Rebuild nötig — nur Mount-Konfiguration).

**Regel für die Zukunft:** Wenn in `.dockerignore` ein Pfad ergänzt wird, der zur Laufzeit
gebraucht wird, **sofort** in `docker-compose.prod.yml` den Bind-Mount anlegen — im selben
Commit. Änderungen an `.dockerignore` immer gegen `docker-compose.prod.yml` querlesen.

**Healthcheck:** Der bisherige Check testete nur die Login-Seite. Ein ausgefallener EDF-Mount
wäre damit unsichtbar. Aktueller Check prüft zusätzlich mindestens eine EDF-Datei:
```yaml
test: ["CMD", "sh", "-c", "wget -qO- http://127.0.0.1:3000/login > /dev/null && ls /app/public/edf/*.edf 2>/dev/null | head -1 | grep -q ."]
```
