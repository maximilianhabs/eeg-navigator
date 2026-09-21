# Road to Public — EEG Navigator

Stand: 21.09.2026 · Status: Konzept, noch keine Freigabe zur Veröffentlichung.

## 1. Ziel und Positionierung

> EEG Navigator ist ein deutschsprachiges Lehr- und Nachschlagewerk für EEG-Muster
> und Artefakte mit interaktivem EDF-Viewer sowie Lehrmodulen zu Schlaf und Montagen.
> Es richtet sich an deutschsprachiges medizinisches Fachpersonal und dient der
> Weiterbildung und Lehre.

Die Oberfläche, fachlichen Inhalte, README, Mitarbeitshinweise und Release Notes
bleiben deutsch. Eine englische Website, Übersetzung oder internationale fachliche
Abdeckung ist nicht Teil dieser Veröffentlichung. Technische Dateinamen wie
`README.md`, `CONTRIBUTING.md` und `SECURITY.md` bleiben für GitHub erkennbar;
ihr Inhalt darf deutsch sein. Den vorhandenen Apache-Lizenztext unverändert lassen.

GitHub-Beschreibung: „Deutschsprachiges EEG-Lehr- und Nachschlagewerk mit EDF-Viewer,
Schlaf- und Teaching-Modulen. Für medizinisches Fachpersonal; keine klinische Entscheidungshilfe.“

Öffentlicher Quellcode, eine öffentlich zugängliche Website und ein Live-Deployment
sind drei getrennte Entscheidungen. Der bisherige Login wird durch die
Veröffentlichung des Repositorys nicht automatisch aufgehoben. Das Projekt benötigt
für diesen Schritt weder GitHub Pages noch eine internationale Website.

## 2. Was bereits existiert

Geprüft wurden Arbeitsverzeichnis, lokal verfügbare Git-Historie aller Referenzen,
GitHub-Issues und Repository-Metadaten. Keine separate Roadmap gefunden; GitHub
lieferte keine Issues, das Wiki ist deaktiviert. Externe private Notizsammlungen
und eventuell vorhandene GitHub Projects wurden nicht durchsucht.

- Commit `e437939` vom 31.07.2026 heißt „Public-Release-Vorbereitung: README,
  LICENSE, CITATION.cff“. Er ergänzt diese drei Dateien, enthält aber keinen
  vollständigen Veröffentlichungsfahrplan.
- `README.md`: Vorstellung, Einstieg, Funktionsumfang, Einschränkungen, Lizenz.
- `LICENSE`: Apache License 2.0; `CITATION.cff`: Zitiermetadaten vorhanden.
- `docs/BETRIEB.md`: interne Betriebsdokumentation mit offenem Veröffentlichungspunkt.
- `docs/FALLSTRICKE.md`: technische Erfahrungen; teilweise serverbezogene Details.
- `docs/kollaboration-guide.md`: älterer, auf einen einzelnen Kollegen und Claude
  Code zugeschnittener Ablauf; keine allgemeine Beitragsrichtlinie.
- `.github/workflows/ci.yml`: TypeScript-Prüfung, Datenvalidierung, Build.
- GitHub-Repository weiterhin privat. Beschreibung nennt noch „Entscheidungssystem“.

Bereits lokal umgesetzt, noch nicht veröffentlicht/deployed:

- Atlas, Suche, Detailseiten, EDF-Viewer, Schlaf und Teaching bleiben verfügbar.
- Wizard/Klassifikation und Intensiv einschließlich NCSE sind aus der Navigation
  entfernt und über direkte Seitenaufrufe gesperrt.
- Entwicklungscode bleibt erhalten; README beschreibt die deaktivierten Module.
- Build, TypeScript und HTTP-Seitenprüfungen erfolgreich. Datenvalidierung ohne
  Fehler, mit bekannten Warnungen zu ID-Lücken und fünf partiellen Einträgen.

## 3. Leitlinie für das Verzeichnis

Die vorhandene Next.js-Struktur beibehalten; kein großflächiger Umbau allein für
Optik. Projektwurzel übersichtlich halten und öffentliche Anleitung von privaten
Betriebsunterlagen trennen. Vorgeschlagenes Zielbild, nicht bereits umgesetzt:

```text
README.md                 Einstieg, deutschsprachiger Fokus, Bilder, Schnellstart
LICENSE                   bestehende Apache-2.0-Lizenz
CITATION.cff              Zitierhinweise, deutsche Begleitnachricht
CONTRIBUTING.md            Beiträge, fachliche Quellen, Prüfungen, Review
SECURITY.md                vertrauliche Meldung von Sicherheitsproblemen
CODE_OF_CONDUCT.md        kurze, angemessene Regeln zur Zusammenarbeit
CHANGELOG.md               nachvollziehbare Änderungen je Veröffentlichung
.github/
  ISSUE_TEMPLATE/          Fehler, fachliche Korrektur, Funktionswunsch
  pull_request_template.md
  workflows/ci.yml
  dependabot.yml
app/ components/ lib/ hooks/  vorhandener Anwendungscode
components/experimental/  optional: klar abgegrenzte experimentelle Oberflächen
                         (Umzug nur mit Anpassung und Prüfung aller Importe)
data/                      freigegebene Wissensdaten, keine Benutzerkonten
public/edf/                ausschließlich zur Weitergabe freigegebene Beispieldaten
scripts/                   Setup und Validierung mit verständlicher Anleitung
docs/
  ROAD_TO_PUBLIC.md         dieser Fahrplan
  ENTWICKLUNG.md            Struktur und lokales Arbeiten
  BETRIEB.md                generisches Self-Hosting, keine privaten Runbooks
  DATEN_UND_QUELLEN.md      Herkunft, Lizenzumfang und Review-Verfahren
  FALLSTRICKE.md            übertragbare technische Hinweise
  images/                  geprüfte Screenshots ohne personenbezogene Daten
```

Private Runbooks außerhalb dieses Repositorys aufbewahren. Ein Ordner „privat“
innerhalb eines öffentlichen Git-Repositorys schützt keine Informationen.
Unbenutzte Startergrafiken und toten Code erst nach Referenzprüfung entfernen.
Experimenteller Code darf klar bezeichnet im öffentlichen Repo bleiben; er ist
kein angebotener Funktionsumfang und durch das Ausblenden nicht geheim.

## 4. Etappen und Abnahmekriterien

Die folgenden Punkte sind geplante Arbeit. Ein Häkchen setzt eine dokumentierte
Prüfung voraus; diese Bestandsaufnahme ist kein vollständiges Sicherheitsaudit.

### Etappe A — Umfang und öffentliche Darstellung

- [x] Funktionsumfang mit dem Maintainer festgelegt; Beta-Seiten lokal deaktiviert.
- [ ] „Deutschsprachig“ direkt am Anfang der README und in GitHub About nennen.
- [x] Deutsche Dokumentation und Beitragskommunikation ausdrücklich festlegen.
- [x] README ordnen: Zweck/Zielgruppe → Screenshot → Funktionen → Installation
  inklusive Login → Grenzen → Mitarbeit → Sicherheit → Lizenz/Zitieren.
- [ ] „Entscheidungssystem“ und „Diagnose-Wizard“ als Produktversprechen entfernen.
- [ ] „Validiert“ nicht mit Literaturbezug gleichsetzen; fachliche Quellen,
  redaktionellen Review und formale klinische Validierung getrennt darstellen.
- [ ] Aussagen wie „alle Aufnahmen anonymisiert“ und „Repo ~11 MB“ erst nach
  entsprechender Prüfung verwenden; Dateisumme ist nicht Größe der Git-Historie.
- [ ] Screenshots für Atlas, Viewer und ein Lehrmodul prüfen und ergänzen.

**Abnahme:** Neue Besucher verstehen Sprache, Zielgruppe, verfügbare Funktionen,
Grenzen und Installationsweg, ohne interne Dokumente lesen zu müssen.

### Etappe B — Daten, Rechte und Historie (vor Public zwingend)

- [x] Alle zur Veröffentlichung bestimmten Branches, Tags und erreichbaren
  historischen Dateien auf Zugangsdaten, Tokens, Passwort-Hashes, personenbezogene
  Informationen und private Unterlagen prüfen. Ergebnisse ohne Geheimniswerte
  protokollieren; auch alte Namen/Pfade und gelöschte Dateien berücksichtigen.
- [x] GitHub-Inhalte wie PR-Diskussionen, Anhänge, Releases und Artefakte prüfen,
  soweit vorhanden; lokale Git-Prüfung allein deckt diese nicht ab.
- [x] EDF-Bestand dateiweise prüfen: Patienten-/Aufzeichnungsfelder, Daten,
  Freitext, Annotationen, Kanalnamen und Dateinamen; historische Versionen einbeziehen.
- [x] Herkunft und Befugnis zur öffentlichen Weitergabe für jede Aufnahme und
  aus Literatur rekonstruierte Abbildung nachvollziehbar dokumentieren.
- [x] Lizenzumfang für Code, Fachtexte, Abbildungen und EDF-Dateien klären.
  Eine vorhandene Softwarelizenz belegt keine Rechte an sämtlichen Fremdinhalten.
  Ungeklärte Materialien vor Veröffentlichung ausschließen oder ersetzen.
- [x] Interne Serverinventare, fremde Projekte, Zugangsdaten-Ablageorte und private
  Betriebsnotizen aus öffentlicher Doku herauslösen. Öffentliche IPs sind nicht
  automatisch Geheimnisse, aber für einen allgemeinen Einstieg meist unnötig.
- [ ] Bei tatsächlichem Geheimnisfund betroffene Zugänge zuerst widerrufen/rotieren;
  notwendige Historienbereinigung gesondert planen und koordinieren. Bloßes Löschen
  im letzten Commit oder `.gitignore` bereinigt frühere Commits nicht.

**Abnahme:** Keine ungeklärten sensiblen Daten oder Weitergaberechte im vorgesehenen
Veröffentlichungsumfang; dokumentierte Freigabe durch den Maintainer. Bei Bedarf
fachkundige Klärung offener Rechtsfragen, keine pauschale Rechtsfreigabe aus diesem Plan.

**Stand 21.09.2026:** Etappe B abgeschlossen. EDF-Dateien anonymisiert (X X X X), erhoben am
Bezirksklinikum Mainkofen, zur öffentlichen Weitergabe freigegeben. Fachtexte urheberrechtlich
beim Autor. data/users.json aus Git-Historie entfernt (filter-repo). Server-IP bereinigt.

### Etappe C — Sicher und nachvollziehbar selbst betreiben

Konkrete Befunde aus der Bestandsaufnahme:

- `lib/auth.ts` und `lib/auth-edge.ts` verwenden bei fehlendem `APP_SECRET` einen
  bekannten Ersatzwert. Produktionsbetrieb muss bei fehlendem, schwachem oder
  unverändertem Beispielwert abbrechen; Verhalten beider Implementierungen abstimmen. → ✅ bereits implementiert
- README-Schnellstart legt keinen ersten Benutzer an. Das vorhandene Skript
  `scripts/setup-admin.mjs` einbinden und sicher dokumentieren; keine Standardkonten.
- Docker kopiert mit `COPY . .` den Build-Kontext; eine `.dockerignore` fehlt.
  Lokale Umgebungsdateien, Benutzerdateien, Backups, Git-Daten und Entwicklungsreste
  ausschließen und erzeugtes Image/Build-Kontext prüfen. → ✅ bereits erledigt (Commit fdf4895)
- Compose-Dateien setzen ein externes, betreiberspezifisches Netzwerk voraus und
  unterscheiden sich bei Mounts und Healthcheck. Ein frischer Clone braucht eine
  eindeutige lokale Anleitung und eine getrennte, generische Serverkonfiguration.
- Kollaborationsanleitung nennt Port 5100 und einen anderen Deploy-Ablauf als
  `deploy.sh`; Angaben konsolidieren. `npm run dev` ist hier regulär Port 3000.
- Admin-Editor schreibt JSON-Dateien, während Lesezugriffe gebaute Imports verwenden.
  Persistenz und Sichtbarkeit von Bearbeitungen nach Neustart/Rebuild gezielt prüfen.

Aufgaben:

- [ ] Obige Befunde beheben oder betreffende Funktion bis zur Klärung begrenzen.
- [ ] Authentifizierung, Admin-Berechtigungen, API-Zugriff, Sitzungen und Rate-Limits
  gezielt prüfen. Auch direkten Zugriff auf Dateien unter `/edf/` berücksichtigen.
- [ ] Abhängigkeiten auf bekannte Sicherheitsprobleme prüfen und relevante Funde beheben.
- [ ] Frischen Clone ohne bestehende `.env.local`, Benutzerdatei oder Build-Verzeichnis
  installieren; Admin einrichten; Login, Atlas, Viewer, Schlaf und Teaching testen.
- [ ] Produktionsbuild und dokumentierten Containerweg prüfen; keine privaten
  Servernetze oder Dienste als Voraussetzung für den lokalen Start.

**Abnahme:** Eine außenstehende Person kann die Anwendung nach Anleitung starten,
ohne private Infrastruktur, geheime Vorkenntnisse oder unsichere Standardwerte.

### Etappe D — Einladendes, wartbares GitHub-Projekt

GitHub empfiehlt Community-Dateien und Sicherheitsfunktionen. Nicht jede Datei ist
zwingende Plattformpflicht; wir wählen einen angemessenen Umfang für dieses Projekt.

- [ ] `CONTRIBUTING.md`: deutsche Beiträge, kleine PRs, Quellen für fachliche
  Änderungen, keine Patientendaten, erforderliche Prüfungen und Maintainer-Review.
- [ ] `SECURITY.md`: tatsächlich eingerichteter privater Meldeweg, unterstützter
  Versionsstand, keine Sicherheitsdetails in öffentlichen Issues; keine unrealistische SLA.
- [ ] Kurzer Verhaltenskodex mit geklärtem Kontakt und realistischem Moderationsumfang.
- [ ] Deutsche Issue- und PR-Vorlagen mit Reproduktionsschritten bzw. Literaturbelegen;
  ausdrücklich keine klinischen Originaldateien oder Patienteninformationen anhängen.
- [ ] CI als erforderliche Prüfung auf `main`; PR-Regeln passend zur kleinen
  Maintainer-Struktur einrichten. Schreibrechte allein verhindern direkte Pushes nicht.
- [ ] Dependabot, Secret Scanning, Push Protection, Code Scanning und private
  Sicherheitsmeldungen auf Verfügbarkeit prüfen und passend aktivieren.
- [ ] GitHub About, Topics, Website-Link und `CITATION.cff` konsistent gestalten.
- [ ] Changelog und deutsche Release Notes mit Funktionsumfang und Einschränkungen.

**Abnahme:** Nutzung, Mitarbeit, fachliche Korrekturen und vertrauliche Meldungen
haben jeweils einen verständlichen Weg; CI und Repo-Einstellungen sind überprüft.

### Etappe E — Veröffentlichung

- [ ] Release-Kandidat auf konkreten Commit festlegen; offene Blocker geschlossen.
- [ ] Letzte Prüfung des tatsächlich sichtbaren Repositorys einschließlich Historie,
  Dokumentation, Bilder und Dateien; fachliche und technische Freigabe protokollieren.
- [ ] Veröffentlichungsversion wählen: beispielsweise `v0.1.0` für den begrenzten
  ersten Umfang; Versionsnummer und Release Notes müssen zusammenpassen.
- [ ] Maintainer gibt den konkret geprüften Stand zur öffentlichen Sichtbarkeit frei.
- [ ] Repository auf Public stellen, Sicherheitsfunktionen nachprüfen, Release anlegen.
- [ ] Von außerhalb ohne GitHub-Anmeldung Sichtbarkeit, Clone, README-Links und
  Dateien kontrollieren. Veröffentlichung ist nach Kopien/Forks nicht rückholbar.
- [ ] Live-Deployment separat entscheiden und ausführen; produktive Zugänge und
  Login-Pflicht werden durch den Public-Schritt nicht verändert.

**Abnahme:** Öffentlicher Stand entspricht dem geprüften Release-Kandidaten;
Installationsweg funktioniert und dokumentierter Funktionsumfang stimmt.

## 5. Reihenfolge und Zuständigkeit

1. **Zuerst B:** Daten, Rechte und Historie prüfen, bevor eine Veröffentlichung
   vorbereitet wird, deren Materialien eventuell wieder entfernt werden müssten.
2. **Danach C:** reproduzierbares Setup und bekannte Sicherheitsmängel beheben.
3. **A und D vervollständigen:** Darstellung, Dokumentation und Zusammenarbeit.
4. **Zuletzt E:** konkreten Release-Kandidaten prüfen und veröffentlichen.

Technische Prüfung, Dokumentation und Vorlagen können vorbereitet werden.
Fachliche Freigabe, Herkunfts-/Rechtenachweise, Kontakt- und Wartungszusagen sowie
Public-Umschaltung liegen beim Maintainer. Dieser Plan autorisiert keine Änderung
der Repository-Sichtbarkeit und keinen Eingriff in die Git-Historie.

## 6. Quellen und Grundlagen

- [Projekt-README](../README.md), [Betriebsdokumentation](BETRIEB.md),
  [Fallstricke](FALLSTRICKE.md), [Kollaborations-Guide](kollaboration-guide.md).
- [GitHub: Best practices for repositories](https://docs.github.com/en/repositories/creating-and-managing-repositories/best-practices-for-repositories)
  — Dokumentation, Sicherheitsfunktionen und geschützte Branches.
- [GitHub: About READMEs](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-readmes)
  — Einstieg und Orientierung für Besucher.
- [GitHub: Removing sensitive data](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)
  — Grenzen des Löschens und Vorgehen bei tatsächlich exponierten Geheimnissen.

GitHub-Dokumentation abgerufen am 21.09.2026. Verfügbare Einstellungen vor der
Umsetzung erneut am konkreten Repository prüfen.

## Ergänzung: Impressum und Kontakt (21.09.2026)

Feedback-/EDF-Hinweis lokal ergänzt, im Footer und in der README verlinkt.
Name, Kontaktadresse und Mainkofener Anschrift waren bereits vorhanden; Aktualität
und Nutzbarkeit der Anschrift wurden nicht unabhängig bestätigt. TMG-Verweis auf
DDG aktualisiert und die unbelegte Aussage einer verschlüsselten Benutzerdatei
an die tatsächliche Speicherung mit bcrypt-Passwort-Hashes angepasst.

Vor Veröffentlichung verbleiben insbesondere:

- Pauschales Nutzungsverbot im Impressum mit Apache-2.0-Lizenz und dem noch zu
  klärenden Lizenzumfang für Inhalte/EDF in Einklang bringen.
- Rechtsgrundlagen sauber zuordnen: Art. 6 Abs. 1 lit. b bezeichnet nicht zugleich
  „berechtigtes Interesse“. Kontaktbearbeitung und Zugang gesondert prüfen.
- Tatsächliche E-Mail-/Hosting-Dienstleister, Empfänger, Speicherfristen und Logs
  erfassen; pauschale Aussage „keine Weitergabe an Dritte“ überprüfen.
- Zuständige Datenschutzaufsicht passend zum tatsächlich privaten Betreiber prüfen;
  im bestehenden Text steht BayLfD. Berufsbezogene Pflichtangaben und Anschrift klären.
- Aussage „keine externen Links“ und Beschreibung als nichtöffentliches Testsystem
  vor Public/Deployment mit dem tatsächlichen Angebot abgleichen.

Dies ist eine offene Prüfliste, keine abgeschlossene rechtliche Prüfung.
