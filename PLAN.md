# AutoDoc Adapter - Projektplan

## Vision

AutoDoc ist ein ioBroker-Adapter, der aus einer Installation automatisch eine lesbare,
strukturierte und ständig neu erzeugbare Dokumentation macht. Der Mehrwert liegt darin,
dass man endlich einen aktuellen Überblick über ein oft sehr komplexes System bekommt,
ohne alles manuell pflegen zu müssen — auch nach Monaten noch erklärbar, für sich selbst,
für Familie, Mitbewohner oder bei Migrationen.

## Technische Grundlagen

- **Sprache**: JavaScript (ioBroker Creator Standard)
- **Admin UI**: JSON/jsonConfig
- **Framework**: @iobroker/create-adapter v3.1.2
- **Node.js**: Version 22
- **Repository**: [crunchip77/ioBroker.autodoc](https://github.com/crunchip77/ioBroker.autodoc)

## Entwicklungs-Umgebung

- **IDE**: Visual Studio Code auf Windows
- **Testsystem**: ioBroker auf Unraid-Server (separat vom Produktivsystem)
- **Deployment**: Entwicklung → GitHub Push → Installation auf Testserver

## Wichtige Referenzen

- [ioBroker AI Developer Guide](https://github.com/Jey-Cee/iobroker-ai-developer-guide)
- [Adapter Creator](https://github.com/ioBroker/create-adapter)
- [Adapter Checker](https://adapter-check.iobroker.in/)

---

## Phase 1 — Basis ✅ ABGESCHLOSSEN

- Modularisierung: `lib/discovery.js`, `lib/documentModel.js`, `lib/markdownRenderer.js`
- Dateibasierter Export: Markdown, HTML, JSON nach `/files/autodoc.0/`
- Admin UI: `jsonConfig.json5` + i18n (EN, DE)
- Drei Zielgruppenprofile: Admin, User, Onboarding
- Adapter-Beschreibungen aus ioBroker-Metadaten (`common.desc`, `common.titleLang`)
- Versionsverfolgung mit Diff und Changelog
- Automatische Generierung: Startup, Timer, Event-basiert (30s Debounce)
- HTML-Renderer mit Sidebar-Navigation, Stat-Cards, profil-bewusstem Layout

---

## Phase 2 — Inhalt ← WIR SIND HIER

Der Sprung von "Adapter-Inventar" zu echter "System-Dokumentation".
Alles was den Nutzer befähigt zu verstehen **wie sein System aufgebaut ist**.

### 2.1 Räume und Geräte
- `enum.rooms` und `enum.functions` aus ioBroker auslesen
- Welche Geräte/Datenpunkte sind welchem Raum zugeordnet
- Welche Funktionen (Licht, Heizung, Sicherheit...) sind definiert
- Räume mit ihren Geräten als eigenes Kapitel in der Dokumentation
- Objekte ohne Raum-Zuordnung als Wartungshinweis markieren

### 2.2 Skript-Dokumentation
- Alle Skripte aus `script.js.*` auslesen (JavaScript + Blockly)
- Name, Status (aktiv/inaktiv), Beschreibung (falls vorhanden)
- Trigger-Typ soweit erkennbar (subscribe, schedule, on-start)
- Skripte ohne Beschreibung als Wartungshinweis markieren

### 2.3 Wartungs- und Diagnosehilfe
- Instanzen ohne zugewiesenen Raum
- Skripte ohne Beschreibung
- Deaktivierte Instanzen die schon länger inaktiv sind
- Objekte mit unklaren oder generischen Namen
- Einfache Checkliste: "Was fehlt in deiner Dokumentation?"

### 2.4 Such- und Filterfunktion im HTML
- Clientseitiges JavaScript im generierten HTML
- Suchfeld das Adapter, Räume, Skripte durchsucht
- Kein Server nötig, funktioniert in der heruntergeladenen Datei

---

## Phase 3 — Tiefe (aufwändig, aber machbar)

### 3.1 Einfache Abhängigkeitsanalyse
- Welche Skripte referenzieren welche States (Regex-basiert, kein vollständiges Parsing)
- Welche Adapter schreiben in welche Datenpunkt-Namespaces
- Darstellung als lesbarer Text, keine Graphen

### 3.2 Menschenlesbare Dokumentation (KI-optional)
- **Weg A (Standard)**: Beschreibungstext aus Metadaten + strukturierte Kapitel mit Kontext
- **Weg B (optional)**: Claude API — wenn API-Key konfiguriert, wird Fließtext generiert
  - Opt-in per Checkbox im Admin-UI + API-Key-Feld
  - Klare Kennzeichnung als "KI-unterstützt"
  - Kosten: ca. 1–3 Cent pro Generierung (Haiku-Modell)

### 3.3 Notifications
- `sendTo` an Telegram, Email, Pushover wenn neue Doku generiert
- Konfigurierbar: welcher Adapter, welche Instanz, welche Nachricht

---

## Phase 4 — Erweiterungen (Nice-to-Have)

- PDF-Export
- Backup-Adapter Integration (Doku mit Backup speichern)
- Mehrsprachige Templates (Kapitelüberschriften, Statusmeldungen)
- Automatische Spracherkennung aus `system.config`
- Customizable Templates

---

## Bewusst weggelassen

| Feature | Grund |
|---|---|
| Mermaid-Diagramme / Graphen | Zu komplex, andere Tools besser geeignet |
| Vollständiges Code-Parsing für Abhängigkeiten | Fehleranfällig, unverhältnismäßiger Aufwand |
| REST-API / Webhooks | Wer JSON hat, kann selbst damit arbeiten — kein Kernnutzen |
| Alexa/Google Home Integration | Kein Bezug zur Dokumentation |
| Analytics/Adapter-Popularität | Kein Dokumentations-Feature |
| Mobile App | Außerhalb des Scope |
| Kollaborative Features | Außerhalb des Scope |

---

## Ausbaustufen Zusammenfassung

| Version | Inhalt |
|---|---|
| **v0.x** ✅ | Basis: Adapter-Inventar, Export, Profile, Versionierung |
| **v1.0** | Phase 2: Räume, Skripte, Wartungshinweise, Suche im HTML |
| **v1.x** | Phase 3: Abhängigkeitsanalyse, KI-Option, Notifications |
| **v2.x** | Phase 4: PDF, Backup-Integration, erweiterte Templates |
