# Changelog

Alle nennenswerten Änderungen werden hier dokumentiert.
Format: [Keep a Changelog](https://keepachangelog.com/de/1.1.0/), [Semantic Versioning](https://semver.org/lang/de/).

## [Unveröffentlicht]

### Hinzugefügt
- EEG_0040 Breach-Rhythmus mit EDF-Beispiel (Raw-Export, umschaltbare Montagen)
- CI: Docker-Build-Check und Smoke-Test (.github/workflows/docker-build.yml)
- Entwicklungs-EEG-Modul (/teaching/entwicklung)

### Geändert
- EEG_0040: Fachliche Überarbeitung auf Basis von Brigo 2011, Cobb 1979, PMC6104203
- Dark-Mode: Atlas-Kacheln und Teaching-Header auf hex-basierte Inline-Styles
- next 16.3.2 → 16.3.5 (behebt CVE in postcss/sharp)

### Sicherheit
- data/users.json aus Git-Historie entfernt (git filter-repo)
- Server-IP aus öffentlichen Docs entfernt

## [0.1.0] — noch nicht veröffentlicht

Erster öffentlicher Release-Kandidat. Umfasst:
- Atlas mit 97 Wellenmustern und 26 Artefakten
- Interaktiver EDF-Viewer mit Montage-Switching
- Schlaf- und Teaching-Module
- Authentifizierung (Login-geschützt)
