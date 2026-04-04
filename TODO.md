# AutoDoc Adapter - TODO-Liste

## Wichtige Referenzen
- [ioBroker AI Developer Guide](https://github.com/Jey-Cee/iobroker-ai-developer-guide)
- [Adapter Creator](https://github.com/ioBroker/create-adapter)
- [Adapter Checker](https://adapter-check.iobroker.in/)

---

## Phase 1 — Basis ✅ ABGESCHLOSSEN

- [x] Modularisierung: `lib/discovery.js`, `lib/documentModel.js`, `lib/markdownRenderer.js`
- [x] Dateibasierter Export: Markdown, HTML, JSON nach `/files/autodoc.0/`
- [x] Admin UI: `jsonConfig.json5` + i18n EN + DE
- [x] Drei Profile: Admin, User, Onboarding — profil-bewusstes Rendering
- [x] Adapter-Beschreibungen aus ioBroker-Metadaten (`common.desc`, `common.titleLang`)
- [x] Versionsverfolgung mit Diff und Changelog (`lib/versionTracker.js`)
- [x] Automatische Generierung: Startup, Timer, Event-basiert (30s Debounce)
- [x] HTML-Renderer mit Sidebar, Stat-Cards, Adapter-Cards je Profil
- [x] `lib/i18n.js` mit EN, DE, FR
- [x] Lokale Zeitstempel für Dateinamen
- [x] Lint-sauber (prettier + eslint)

---

## Phase 2 — Inhalt ← NÄCHSTER SCHRITT

### 2.1 Räume und Geräte
- [ ] `enum.rooms` aus ioBroker auslesen (Discovery erweitern)
- [ ] `enum.functions` aus ioBroker auslesen
- [ ] Räume mit zugeordneten Geräten/Datenpunkten im DocumentModel abbilden
- [ ] Räume-Kapitel in Markdown- und HTML-Renderer einbauen
- [ ] Objekte ohne Raum-Zuordnung erfassen → Basis für Wartungshinweise

### 2.2 Skript-Dokumentation
- [ ] Skripte aus `script.js.*` auslesen (Discovery erweitern)
- [ ] Name, Status (aktiv/inaktiv), Beschreibung, Trigger-Typ erfassen
- [ ] Skript-Kapitel in Markdown- und HTML-Renderer einbauen
- [ ] Admin-Profil: vollständige Skriptliste mit Details
- [ ] User/Onboarding-Profil: nur aktive Skripte, vereinfacht

### 2.3 Wartungs- und Diagnosehilfe
- [ ] Instanzen ohne Raum-Zuordnung markieren
- [ ] Skripte ohne Beschreibung markieren
- [ ] Deaktivierte Instanzen gesondert hervorheben
- [ ] Wartungs-Kapitel in Dokumentation einbauen (nur Admin-Profil)
- [ ] Einfache Checkliste: "Was fehlt in deiner Dokumentation?"

### 2.4 Such-/Filterfunktion im HTML
- [ ] Suchfeld in HTML-Output einbauen (clientseitiges JS)
- [ ] Adapter, Räume, Skripte durchsuchbar machen
- [ ] Funktioniert ohne Server in der heruntergeladenen Datei

### 2.5 UX-Verbesserungen (parallel umsetzbar)
- [ ] Direktlink auf letzte HTML-Datei im Admin-UI
- [ ] Automatische Spracherkennung aus `system.config` als Fallback

---

## Phase 3 — Tiefe

### 3.1 Einfache Abhängigkeitsanalyse
- [ ] Skripte nach State-Referenzen durchsuchen (Regex-basiert)
- [ ] Welche Adapter schreiben in welche Namespaces
- [ ] Als lesbarer Abschnitt in der Dokumentation (kein Graph)

### 3.2 Menschenlesbare Dokumentation
- [ ] Weg A: Strukturierte Einleitungstexte auf Basis der gesammelten Daten
- [ ] Weg B (opt-in): Claude API Integration
  - [ ] Checkbox + API-Key-Feld in Admin-UI
  - [ ] `lib/aiEnhancer.js` mit Anthropic SDK
  - [ ] Fließtext-Generierung für Systemeinleitung + Adapter-Zusammenfassung
  - [ ] Klare Kennzeichnung als "KI-unterstützt" in der Ausgabe

### 3.3 Notifications
- [ ] `sendTo` an Telegram/Email/Pushover nach Generierung
- [ ] Konfigurierbar: Adapter-Instanz + Nachrichtentext in Admin-UI

---

## Phase 4 — Erweiterungen (Nice-to-Have)

- [ ] PDF-Export
- [ ] Backup-Adapter Integration (Doku mit Backup speichern)
- [ ] Mehrsprachige Templates (Kapitelüberschriften, Statusmeldungen)
- [ ] Customizable Templates

---

## Bewusst weggelassen

- ❌ Mermaid-Diagramme / Graphen
- ❌ Vollständiges Code-Parsing für Abhängigkeiten
- ❌ REST-API / Webhooks
- ❌ Alexa/Google Home Integration
- ❌ Analytics/Adapter-Popularität
- ❌ Mobile App
- ❌ Kollaborative Features
