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
- [x] 3.x Adapter-Metadaten: `connectionType`, `dataSource`, `tier` aus ioBroker-Metadaten; gefilterter `native`-Config im Admin-Profil (sensitive Keys automatisch entfernt)
- [x] 3.x Strukturierter `manualContext`: `adapters{}` + `rooms{}` — per-Adapter/Raum-Notizen, in allen Profilen angezeigt

---

## Phase 4 — Profile-Redesign ✅ ABGESCHLOSSEN

### 4.1 Discovery-Erweiterungen ✅
- [x] `system.config` auslesen: Stadt, Land, Systemsprache → `rawData.systemConfig`
- [x] Geräte-Namen-Auflösung: Raum-Mitglieder → Device-Objekte via `getForeignObjectAsync`
- [x] Opt-in Live-States: Schlüssel-Rollen (`level.temperature`, `sensor.door`, `sensor.window`, `alarm`) lesen
- [x] Neue Config-Option `readLiveStates` in `jsonConfig.json5` + i18n

### 4.2 Role Mapper ✅
- [x] `lib/roleMapper.js` — 29 Patterns → 14 Kategorien + Icons
- [x] i18n-Keys für Kategorie-Labels (EN/DE/FR)

### 4.3 DocumentModel-Erweiterungen ✅
- [x] `buildSystemConfig(rawData)` → `docModel.systemConfig`
- [x] `buildRooms()`: `rooms[].devices[]` mit `{ id, deviceName, category, icon, currentValue, unit }`

### 4.4 Renderer-Architektur: Dispatcher ✅
- [x] `renderHtml()` als Dispatcher → `renderAdminHtml()` / `renderUserHtml()` / `renderOnboardingHtml()`

### 4.5 Onboarding-Profil ✅
- [x] Stadt-bewusster Willkommenstext, Räume mit Device-Grid + Icons + Live-Values
- [x] "Was läuft automatisch?" als plain sentences, Adapter-Cards (freundlich)
- [x] AI-Box prominent, Hint wenn kein manualContext

### 4.6 User/Familie-Profil ✅
- [x] Räume mit Device-Cards, Skripte name+desc only, Adapter title-only

### 4.7 Admin-Profil ✅
- [x] Device-Hierarchie-Tabelle pro Raum mit OIDs

### 4.x Bugfixes ✅
- [x] `room.members` → `room.devices` (DocumentModel ↔ Renderer Alignment)
- [x] Onboarding: Adapter-Abschnitt fehlte (renderAdaptersChapter nicht aufgerufen)

### 4.x Abschluss ✅
- [x] i18n: 16 neue Keys (EN/DE/FR)
- [x] Lint sauber (0 Errors)
- [x] CHANGELOG.md aktualisiert
- [ ] `dev` → nach Test → Merge nach `main`

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
