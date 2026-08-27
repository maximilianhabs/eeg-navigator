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
