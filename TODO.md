# AutoDoc Adapter — TODO-Liste

## Wichtige Referenzen
- [ioBroker AI Developer Guide](https://github.com/Jey-Cee/iobroker-ai-developer-guide)
- [Adapter Creator](https://github.com/ioBroker/create-adapter)
- [Adapter Checker](https://adapter-check.iobroker.in/)

---

## Phase 1 — Basis ✅ ABGESCHLOSSEN (v0.1.0)

- [x] Modularisierung: `lib/discovery.js`, `lib/documentModel.js`, `lib/markdownRenderer.js`, `lib/htmlRenderer.js`, `lib/versionTracker.js`, `lib/i18n.js`
- [x] Dateibasierter Export: Markdown, HTML, JSON nach `/files/autodoc.0/`
- [x] Admin UI: `jsonConfig.json5` + i18n EN + DE + FR
- [x] Drei Profile: Admin, User, Onboarding
- [x] Adapter-Beschreibungen aus ioBroker-Metadaten
- [x] Versionsverfolgung mit Diff und Changelog
- [x] Automatische Generierung: Startup, Timer, Event-basiert (30s Debounce)
- [x] HTML-Renderer mit Sidebar, Stat-Cards, Adapter-Cards je Profil

---

## Phase 2 — Inhalt ✅ ABGESCHLOSSEN

- [x] 2.1 `enum.rooms` + `enum.functions` auslesen und als Kapitel rendern
- [x] 2.2 Skripte aus `script.js.*`: Name, Status, Beschreibung, Trigger-Typ
- [x] 2.3 Wartungs-Score, Checkliste, Instanzen/Skripte ohne Beschreibung
- [x] 2.4 Clientseitige Such-/Filterfunktion im HTML (Nav-Suchbox, Escape-Reset)

---

## Phase 3 — Tiefe ✅ ABGESCHLOSSEN

- [x] 3.1 Notifications: `sendTo` nach Generierung (Telegram, Email, Pushover, generic)
- [x] 3.2 Dependency-Analyse: `lib/dependencyAnalyzer.js`, stateRefs + Cross-Reference
- [x] 3.3 AI-Enhanced Docs: `lib/aiEnhancer.js`, pluggable Providers (Anthropic/Groq/Ollama), opt-in, Admin-Profil wird übersprungen
- [x] 3.x i18n-Fix: alle hardcodierten englischen Strings ersetzt (EN/DE/FR vollständig)

---

## Phase 4 — Profile-Redesign ← AKTUELL

### 4.1 Discovery-Erweiterungen
- [ ] `system.config` auslesen: Stadt, Land, Systemsprache → `rawData.systemConfig`
- [ ] Geräte-Namen-Auflösung: Raum-Mitglieder → parent Device-Objekte gebündelt laden
- [ ] Geräte nach Device-ID gruppieren (nicht jede State einzeln)
- [ ] Opt-in Live-States: Schlüssel-Rollen (`level.temperature`, `sensor.door`, `sensor.window`, `alarm`) lesen
- [ ] Neue Config-Option `readLiveStates` in `jsonConfig.json5` + i18n

### 4.2 Role Mapper
- [ ] `lib/roleMapper.js` erstellen
- [ ] Mapping: ioBroker-Rolle → `{ category, icon, labelKey }`
- [ ] Abdeckung: Licht, Dimmer, Rolllade, Thermostat, Feuchtigkeit, Bewegung, Tür/Fenster, Medien, Schloss, Alarm, Steckdose, Kamera
- [ ] i18n-Keys für Kategorie-Labels (EN/DE/FR)

### 4.3 DocumentModel-Erweiterungen
- [ ] `buildSystemConfig(rawData)` → `docModel.systemConfig`
- [ ] `buildRooms()` erweitern: `rooms[].devices[]` mit `{ id, name, category, icon, currentValue, unit }`
- [ ] Abwärtskompatibel: nur neue Felder ergänzen

### 4.4 Renderer-Architektur: Dispatcher
- [ ] `renderHtml()` in `htmlRenderer.js` als Dispatcher umbauen
- [ ] `renderAdminHtml(docModel)` — aktuelles Rendering (umbenennen + bereinigen)
- [ ] `renderUserHtml(docModel)` — neue separate Methode
- [ ] `renderOnboardingHtml(docModel)` — neues Template

### 4.5 Onboarding-Profil: neues Template
- [ ] Willkommenstext (aus `systemConfig.city` + `manualContext.description` + AI-Summary)
- [ ] Räume-Abschnitt: Geräte-Namen mit Icons, keine OIDs
- [ ] "Was läuft automatisch?": nur Skripte mit `desc`, plain language
- [ ] Live-Values wenn `readLiveStates` aktiv: Thermostat-Temp, Tür/Fenster-Status
- [ ] `manualContext` prominent (WLAN, Kontakt, Hinweise)
- [ ] Hinweis wenn kein `manualContext` konfiguriert
- [ ] Kein: Adapter-Inventar, State-Counts, Trigger-Typen, technische IDs

### 4.6 User/Familie-Profil: Überarbeitung
- [ ] Räume mit aufgelösten Gerätenamen + Kategorie-Icons
- [ ] Skripte: nur Name + Beschreibung (kein Trigger-Typ, kein Ordner-Pfad)
- [ ] Wartungshinweise in Alltagssprache (keine OIDs in der Anzeige)
- [ ] Adapter: nur Titel, keine Version/Instanz-ID

### 4.7 Admin-Profil: Ergänzungen
- [ ] Räume: Device-Hierarchie mit OIDs (aufgelöste Gerätenamen + technische Details)
- [ ] Rest bleibt wie bisher

### 4.x Abschluss
- [ ] i18n: neue Keys für Onboarding-Phrasen + Kategorie-Labels (EN/DE/FR)
- [ ] Tests anpassen falls nötig
- [ ] Lint sauber
- [ ] CHANGELOG.md aktualisieren
- [ ] `dev` → nach Test → Merge nach `main` (kein Tag, kein Versionssprung bis zum echten Release)

---

## Phase 5 — Erweiterungen (Nice-to-Have)

- [ ] PDF-Export
- [ ] Backup-Adapter Integration
- [ ] Custom Templates
- [ ] QR-Code für Onboarding (externe Lib)

---

## Release-Prozess (wenn bereit für echte Veröffentlichung)

> Solange der Adapter nicht auf npm und nicht in `ioBroker.repositories` eingetragen ist, haben Tags und GitHub Releases **keine Wirkung** auf Update-Erkennung oder Installation im ioBroker Admin.

### Voraussetzungen
- [ ] [Adapter Checker](https://adapter-check.iobroker.in/) vollständig grün
- [ ] npm-Account vorhanden, `iobroker.autodoc` als Paketname verfügbar

### Schritte
1. [ ] Versionsnummer in `package.json` + `io-package.json` synchron bumpen
2. [ ] News-Eintrag in `io-package.json` (EN + DE minimum)
3. [ ] Changelog in `README.md` ergänzen
4. [ ] `dev` → Merge nach `main`
5. [ ] `npm publish` (veröffentlicht auf npmjs.com)
6. [ ] GitHub Release aus Tag erstellen (dann erst sinnvoll)
7. [ ] PR zu [ioBroker/ioBroker.repositories](https://github.com/ioBroker/ioBroker.repositories) für Eintrag in Beta-Liste (`sources-dist.json`)

---

## Bewusst weggelassen

- ❌ Mermaid-Diagramme / Graphen
- ❌ Vollständiges Code-Parsing für Abhängigkeiten
- ❌ REST-API / Webhooks
- ❌ Alexa/Google Home Integration
- ❌ Analytics/Adapter-Popularität
- ❌ Mobile App
- ❌ Kollaborative Features
