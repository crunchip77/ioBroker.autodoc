# AutoDoc Adapter — Projektplan

## Vision

AutoDoc ist ein ioBroker-Adapter, der aus einer Installation automatisch eine lesbare,
strukturierte und ständig neu erzeugbare Dokumentation macht. Der Mehrwert liegt darin,
dass man endlich einen aktuellen Überblick über ein oft sehr komplexes System bekommt,
ohne alles manuell pflegen zu müssen — auch nach Monaten noch erklärbar, für sich selbst,
für Familie, Mitbewohner oder bei Migrationen.

Drei echte Zielgruppen mit komplett unterschiedlicher Sprache:
- **Admin**: "Warum macht das System X wenn Y passiert?" — volle technische Tiefe
- **User / Familie**: "Wie funktioniert unser Zuhause?" — verständlich, kein JSON
- **Onboarding / Gäste**: "Wie benutze ich dieses Haus?" — null Technik, reine Alltagssprache

## Technische Grundlagen

- **Sprache**: JavaScript (ioBroker Creator Standard)
- **Admin UI**: JSON/jsonConfig
- **Framework**: @iobroker/create-adapter v3.1.2
- **Node.js**: Version 22
- **Repository**: [crunchip77/ioBroker.autodoc](https://github.com/crunchip77/ioBroker.autodoc)

## Entwicklungs-Umgebung

- **IDE**: Visual Studio Code auf Windows
- **Testsystem**: ioBroker auf Unraid-Server (separat vom Produktivsystem)
- **Deployment**: `dev`-Branch → GitHub Push → manuelle Installation auf Testserver via URL
- **Release-Strategie**: `dev` → Test → Merge nach `main` → Tag

## Branch-Strategie

- `main` = stabiler Stand, aktuell getaggt als v0.1.0
- `dev` = aktive Entwicklung; Commits immer auf `dev`
- Kein direkter Push auf `main` außer für Releases

## Wichtige Referenzen

- [ioBroker AI Developer Guide](https://github.com/Jey-Cee/iobroker-ai-developer-guide)
- [Adapter Creator](https://github.com/ioBroker/create-adapter)
- [Adapter Checker](https://adapter-check.iobroker.in/)

---

## Phase 1 — Basis ✅ ABGESCHLOSSEN (v0.1.0)

- Modularisierung: `lib/discovery.js`, `lib/documentModel.js`, `lib/markdownRenderer.js`, `lib/htmlRenderer.js`, `lib/versionTracker.js`, `lib/i18n.js`
- Dateibasierter Export: Markdown, HTML, JSON nach `/files/autodoc.0/`
- Admin UI: `jsonConfig.json5` + i18n (EN, DE, FR)
- Drei Zielgruppenprofile: Admin, User, Onboarding
- Adapter-Beschreibungen aus ioBroker-Metadaten (`common.desc`, `common.titleLang`)
- Versionsverfolgung mit Diff und Changelog
- Automatische Generierung: Startup, Timer, Event-basiert (30s Debounce)
- HTML-Renderer mit Sidebar-Navigation, Stat-Cards, profil-bewusstem Layout

---

## Phase 2 — Inhalt ✅ ABGESCHLOSSEN

Der Sprung von "Adapter-Inventar" zu echter "System-Dokumentation".

### 2.1 Räume und Geräte ✅
- `enum.rooms` und `enum.functions` auslesen
- Räume-Kapitel in HTML + Markdown

### 2.2 Skript-Dokumentation ✅
- Alle Skripte aus `script.js.*` mit Name, Status, Beschreibung, Trigger-Typ

### 2.3 Wartungs- und Diagnosehilfe ✅
- Instanzen ohne Raum, Skripte ohne Beschreibung, deaktivierte Instanzen
- Score + Checkliste (Admin-Profil)

### 2.4 Such-/Filterfunktion im HTML ✅
- Clientseitiges JS, kein Server, filtert Tabellen + Karten
- Suchbox im Nav-Sidebar, Ergebnis-Zähler, Escape-Reset

---

## Phase 3 — Tiefe ✅ ABGESCHLOSSEN

### 3.1 Notifications ✅
- `sendTo` nach Generierung: Telegram, Email, Pushover, Signal, WhatsApp, generisch
- Konfigurierbar: Instanz, Empfänger, optionales Nachrichten-Template

### 3.2 Dependency-Analyse ✅
- `lib/dependencyAnalyzer.js`: Regex-Extraktion von State-Referenzen aus Script-Quellcode
- `stateRefs` pro Script + Cross-Reference-Tabelle (Shared States)
- HTML: Unterabschnitt "State References" + "Shared States" (Admin-only)

### 3.3 AI-Enhanced Documentation ✅
- `lib/aiEnhancer.js`: Anthropic Messages API, opt-in
- Modelle: claude-haiku-4-5 (Standard) + claude-sonnet-4-6
- Narrative Zusammenfassung + Maintenance-Empfehlungen
- HTML: hervorgehobene AI-Box; Markdown: Blockquote
- Fehler → stille Warnung, Doku wird trotzdem generiert

### 3.x i18n-Vollständigkeit ✅
- Alle hardcodierten englischen Strings in htmlRenderer.js durch i18n-Schlüssel ersetzt
- EN, DE, FR vollständig

---

## Phase 4 — Profile-Redesign ← AKTUELL

Echte Zielgruppen-Dokus statt "mehr oder weniger Detail vom selben Template".

### Architektur-Entscheidungen
- **Dispatcher-Muster** in `htmlRenderer.js`: `renderHtml()` → `renderAdminHtml()` / `renderUserHtml()` / `renderOnboardingHtml()`
- Bestehende Kapitel-Methoden bleiben für Admin/User nutzbar
- Onboarding bekommt eigene Methoden ohne technische Kapitel

### Bekannte Probleme & Lösungen
- **Raum-Mitglieder auflösen**: Unique Device-IDs bündeln, einmalig `getForeignObjectsAsync` statt N Einzelaufrufe
- **Rollen-Inkonsistenz**: `lib/roleMapper.js` normalisiert alle Adapter-Rollen auf Kategorien + Icons
- **Live-States**: Opt-in (`config.readLiveStates`), nur sinnvolle Rollen (Thermostat, Tür/Fenster, Alarm), fault-tolerant
- **Dünner Onboarding-Inhalt**: Hinweis wenn kein `manualContext` + kein AI → Nutzer zur Konfiguration auffordern
- **`system.config`**: Graceful fallback wenn Stadt/Land nicht gepflegt

### 4.1 Discovery-Erweiterungen
- `system.config` auslesen (Stadt, Land, Systemsprache)
- Geräte-Namen-Auflösung: Raum-Mitglieder → Device-Objekte → `common.name`
- Geräte nach Device gruppieren (nicht jede State einzeln)
- Live-States für Schlüssel-Rollen (opt-in)

### 4.2 `lib/roleMapper.js`
- ioBroker-Rollen → Kategorien + Icons + Labels (EN/DE/FR)
- Abdeckung: Licht, Dimmer, Rolllade, Thermostat, Feuchtigkeit, Bewegung, Tür/Fenster, Medien, Schloss, Alarm, Steckdose, Kamera

### 4.3 DocumentModel-Erweiterungen
- `docModel.systemConfig`: Stadt, Land, Sprache
- `docModel.rooms.rooms[].devices[]`: aufgelöste Geräte mit Name, Kategorie, Icon, ggf. currentValue + unit
- Abwärtskompatibel: nur neue Felder hinzu

### 4.4 Renderer-Architektur: Dispatcher
- `renderHtml()` als Dispatcher
- `renderAdminHtml()` = aktuelles Rendering (leicht bereinigt)
- `renderUserHtml()` = neue User-Methode
- `renderOnboardingHtml()` = komplett neu

### 4.5 Onboarding-Profil: Neues Template
- Sprache: "Du", kurze Sätze, kein Passiv, kein Fachjargon
- Inhalt: Willkommenstext, Räume mit Geräte-Namen, "Was läuft automatisch?", manualContext, AI-Summary prominent
- Kein: Adapter-Inventar, OIDs, State-Counts, Trigger-Typen
- Live-Values wenn aktiviert: Thermostat-Temperatur, Tür/Fenster-Status

### 4.6 User/Familie-Profil: Überarbeitung
- Räume mit aufgelösten Gerätenamen + Funktion
- Skripte: nur Name + Beschreibung, kein Trigger-Typ
- Wartungshinweise in Alltagssprache (keine OIDs)
- Adapter: nur Titel, keine Version/ID

### 4.7 Admin-Profil: Ergänzungen
- Device-Hierarchie in Räumen (mit OIDs für Vollständigkeit)
- Rest bleibt wie bisher

---

## Phase 5 — Erweiterungen (Nice-to-Have)

- PDF-Export
- Backup-Adapter Integration (Doku mit Backup speichern)
- Custom Templates
- QR-Code für Onboarding-Profil (externe Lib nötig)

---

## Bewusst weggelassen

| Feature | Grund |
|---|---|
| Mermaid-Diagramme / Graphen | Zu komplex, andere Tools besser geeignet |
| Vollständiges Code-Parsing für Abhängigkeiten | Fehleranfällig, unverhältnismäßiger Aufwand |
| REST-API / Webhooks | Wer JSON hat, kann selbst damit arbeiten |
| Alexa/Google Home Integration | Kein Bezug zur Dokumentation |
| Analytics/Adapter-Popularität | Kein Dokumentations-Feature |
| Mobile App | Außerhalb des Scope |
| Kollaborative Features | Außerhalb des Scope |

---

## Ausbaustufen Zusammenfassung

| Version | Inhalt | Status |
|---|---|---|
| **v0.x** | Basis: Adapter-Inventar, Export, Profile, Versionierung | ✅ |
| **v1.0** | Phase 2: Räume, Skripte, Wartungshinweise, Suche im HTML | ✅ dev |
| **v1.x** | Phase 3: Notifications, Dependency-Analyse, AI, i18n-Fix | ✅ dev |
| **v1.5** | Phase 4: Profile-Redesign (echte Zielgruppen-Dokus) | ⬜ in Arbeit |
| **v2.x** | Phase 5: PDF, Backup-Integration, Custom Templates | ⬜ geplant |
