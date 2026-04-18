# AutoDoc Adapter — TODO-Liste

## Wichtige Referenzen

- [ioBroker AI Developer Guide](https://github.com/Jey-Cee/iobroker-ai-developer-guide)
- [Adapter Creator](https://github.com/ioBroker/create-adapter)
- [Adapter Checker](https://adapter-check.iobroker.in/)
- Mitwirkung, lokale Checks, Release-Hinweise: [CONTRIBUTING.md](CONTRIBUTING.md)
- Zukunftsvision / Brainstorming (Zusammenhänge, Kontext, Forum-Feedback): [PLAN.md](PLAN.md) → Abschnitt **„Zukunftsvision — Zusammenhänge & Kontext (Brainstorming)“**

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

### 4.x Bugfixes & UI-Verbesserungen ✅

- [x] `room.members` → `room.devices` (DocumentModel ↔ Renderer Alignment)
- [x] Onboarding: Adapter-Abschnitt fehlte (renderAdaptersChapter nicht aufgerufen)
- [x] markdownRenderer: gleicher room.devices Bug → UNCAUGHT_EXCEPTION im Admin-Profil
- [x] Adapter-Badges: "none"/"assumption" ausblenden, Tier mit Qualitätsbezeichnung
- [x] "Instanzen ohne Raumzuweisung" entfernt (konzeptionell falsch)
- [x] Hosts-Tabelle: leere adapterCount-Spalte entfernt
- [x] Diagnose-Sektion neu aufgebaut: Erfassungsstatus, Wo nachschauen (alive/connected), Befunde

### 4.x UI-Verbesserungen Session 2 ✅

- [x] Adapter-Tabelle: deaktivierte Instanzen eingeklappt (`<details>`), lokaler Filter-Input mit Hinweistext
- [x] Node.js-Version aus `host.native` (via `getForeignObjectAsync`) + Badge grün/rot (LTS ≥ v20)
- [x] OS-Info (Kernel, Architektur) im System-Kapitel und Hosts-Tabelle
- [x] Node.js-Warnung + OS-Update-Hinweis in Diagnose-Befunde
- [x] Script-Ordner-Labels: `null` → Root-Verzeichnis, `common` → Allgemeine Skripte, `global` → Globale Skripte

### 4.x Abschluss

- [x] i18n: alle neuen Keys (EN/DE/FR)
- [x] Lint sauber (0 Errors)
- [x] README.md (inkl. Changelog) + TODO.md + PLAN.md aktualisiert (Abschluss RC 0.9.x)
- [x] `dev` → Merge nach `main` (RC-Stand für Forum; weiteres Testing + Adapter-Checker vor npm)

---

### 4.y Release-Kandidat (0.9.x) — umgesetzt

- [x] Aliase (`alias.0.*`), eigene Variablen mit Filter; Repository in Diagnose; RAM-Summe Adapter
- [x] Manuelle Hinweise oben (Admin/User); Doku-Score erklärt; visuelle Akzente (Gold/Orange/Blau)
- [x] Onboarding: Capabilities, Tipps immer sichtbar, ⏱ bei Cron-Skripten, QR + Copy
- [x] `RENDERER_VERSION` / `info.templateVersion` für Template-Updates ohne Versions-Chaos

---

### Admin-UI: Bedingte Sichtbarkeit im KI-Tab (Forum-Feedback)

> Forum-Feedback (arteck) — umgesetzt mit `jsonConfig`-Eigenschaft **`hidden`** (kein `showCondition`; Admin-Schema). Anbieter „Deaktiviert“ blendet KI-Felder aus.

- [x] Anbieter = `none` / deaktiviert → KI-Felder ausgeblendet
- [x] Anbieter = `ollama` → API-Schlüssel ausgeblendet, Basis-URL sichtbar
- [x] Anbieter = `anthropic` / `groq` / `mistral` → API-Schlüssel sichtbar, Basis-URL je nach Feld
- [x] Temperaturen + Timeout nur sichtbar wenn Anbieter aktiv

---

## KI-Zusammenfassung (Stand 0.9.8)

Viele Punkte aus der Testrunde sind umgesetzt (Grounding, Parser-Bereinigung, Timeout/Temperaturen optional im Admin, DE-Prompts, Lektor-Pass, Fallbacks). **Sprachqualität** mit kleinen lokalen Modellen (z. B. Ollama 8B) bleibt iterativ — Feedback im Forum oder als Issues willkommen.

- [x] Optionale **Temperaturen** User vs. Onboarding (`jsonConfig`); leer = Anbieter-Default
- [x] **HTTP-Timeout** pro Request konfigurierbar (Default für langsame lokale Modelle)

### KI — Backlog

- [x] **Bewohner-Stichpunkte für die KI** — Optionales Admin-Feld (oder gezielte Anbindung bestehender Texte wie Projektbeschreibung / Zusatznotizen **nur für den LLM-Prompt**): stichpunktartige „Wahrheit“ zum Zuhause (Was läuft automatisch? Worauf achten Gäste?). Das Modell soll daraus **sinnvolle Gästesätze** formulieren statt aus dünnen Objektdaten zu raten. Datenschutz: Text wandert nur zum gewählten KI-Anbieter.

---

## Multihost-Unterstützung (Architektur-Entscheidungen umsetzen)

> Analyse und Entscheidungen: [PLAN.md → „Multihost — Analyse & Entscheidungen"](PLAN.md)

### Renderer: Adapter-Gruppierung nach Host

- [x] Admin-Profil: Host-Distribution-Sektion (Karten pro Host mit Instanz-Badges) über der Adapter-Tabelle, nur wenn > 1 Host erkannt
- [x] Bei Single-Host: bisheriges Layout unverändert (kein Overhead)

### Laufzeit-Warnung bei Slave-Installation

- [x] Beim Start: wenn mehrere Hosts erkannt und AutoDoc nicht auf dem primären Host läuft → `adapter.log.warn(...)` mit Hinweis und Host-Liste
- [x] Kein hartes Blockieren — nur informativer Log-Eintrag

### Optionaler Filesystem-Export (ioBroker-unabhängiger Zugriff)

> Löst gleichzeitig: ioBroker-Abhängigkeit, Multihost-Zugriff, kein Webserver nötig

- [x] Neues optionales Config-Feld `exportPath` (Textfeld, leer = deaktiviert)
- [x] Nach Generierung: `fs.promises.writeFile(exportPath, ...)` zusätzlich zu `writeFileAsync` (Methode `exportToFilesystem`)
- [x] Alle drei Profile exportieren (autodoc-admin.html, autodoc-user.html, autodoc-onboarding.html)
- [x] Fehler beim Schreiben → `log.warn`, kein Abbruch der normalen Generierung
- [x] i18n-Label + Hinweistext: EN + DE vollständig, andere Sprachen englischer Fallback

### Self-contained HTML (Voraussetzung für portablen Export)

- [x] `qrcodejs`-Bibliothek vollständig inline einbetten → server-seitige SVG-Generierung via `qrcode` npm-Paket; kein CDN, kein Client-JS für QR-Code mehr

---

## Phase 5 — Erweiterungen (Nice-to-Have)

> **Hinweis:** QR-Code und teilbarer Link im Onboarding-Profil sind **bereits umgesetzt** (serverseitiges SVG via npm-Paket `qrcode`, kein CDN; „Link kopieren“ = gleiche URL wie der QR-Code). Die frühere Checkbox „qrcodejs CDN“ war veraltet und wurde entfernt.

- [ ] PDF-Export
- [ ] Backup-Adapter Integration
- [ ] Custom Templates — **teilweise:** [PLAN.md → „Custom Templates" / Umsetzungsstand](PLAN.md) (Admin/User/Onboarding Kapitel per JSON; eigene Markdown-Sektionen; HTML Theme/Logo/Schrift/Extra-CSS; Admin `custom` ausblendbar). Offen: Reihenfolge, Presets ohne Roh-CSS

### Phase 5.x — Onboarding / User / Visualisierung (priorisiert)

> **Reihenfolge:** 1 → 2 → 3 (schneller Nutzen zuerst; Mermaid gestaffelt). Detail: [PLAN.md — Phase 5.x](PLAN.md#phase-5x--onboarding--troubleshooting--mermaid-gestaffelt)

#### 5.x.1 Notfall & Troubleshooting für Laien (Hybrid)

**MVP**

- [ ] Eigener Abschnitt in **Onboarding** (optional **User**): Alltagssprache, keine Technik-IDs
- [ ] Inhalt **primär manuell**: Kontakt / wer hilft / wo Sicherungen / was bei Totalausfall — neue Felder oder Erweiterung `manualContext` (keine erfundenen Diagnosen)
- [ ] **Sichere Auto-Anteile** (optional): nur aus bereits bekannten Fakten (z. B. konfigurierte ioBroker-Basis-URL, Projektname), klar von „euren Notizen“ getrennt

**Später**

- [ ] Kurze Checklisten nur, wenn die Diagnose **konkrete** Befunde liefert (z. B. Instanz offline — mit Hinweis „nur Momentaufnahme“)

#### 5.x.2 Quick Start & Raumguides (strukturierter)

**MVP**

- [ ] `documentModel`: feste Blöcke z. B. **Top 3–5 Aktionen** (systemweit) + pro Raum **2–3 Highlights** (Gerät/Funktion in Kurzform)
- [ ] Renderer (**Onboarding**, optional **User**): Kacheln/Listen aus diesen Blöcken — weniger „eine Wand aus Text“
- [ ] KI nur zur **Formulierung** der Sätze, nicht als einzige Quelle der Struktur (Grounding bleibt)

**Später**

- [ ] Relevanz/Sortierung (z. B. nach Kategorie aus `roleMapper` / `enum.functions`)
- [ ] Unterschiedliche Länge Onboarding (kürzer) vs. User (etwas mehr)

#### 5.x.3 Mermaid / kleine Graphen (gestaffelt)

**Stufe 1 — MVP (kuratiert, wenig Risiko)**

- [ ] Mermaid aus **manuell gepflegtem** Inhalt (z. B. eigenes Config- oder `manualContext`-Feld „Diagramm / Zusammenhänge“ mit Mermaid-Code)
- [ ] Ausgabe mindestens im **Markdown**-Export; **HTML**: technische Variante festlegen (z. B. Codeblock + Hinweis, oder später Client-Render — Abwägung Bundle/Offline)

**Stufe 2 — Später (klein & automatisch)**

- [ ] Optional: **begrenzter** Auto-Graph aus vorhandenen Daten (z. B. Multihost: Host → Instanzen, **hartes Knotenlimit**)
- [ ] Nicht Ziel: vollständiger Skript-/State-Graph für große Installationen ohne Filter

### Zukunftsvision / spätere Themen (noch offen)

> Siehe [PLAN.md](PLAN.md) → „Zukunftsvision — Zusammenhänge & Kontext“. Kein aktueller Umsetzungsauftrag; dient Abstimmung (z. B. externe Doku-Links, ggf. Diagramme, tieferer Kontext).

### System-Visitenkarte / „Für Forum kopieren" (Brainstorming / ungeklärt)

> Forum-Wunsch (sigi234) — noch nicht entschieden. Details und Abwägung: [PLAN.md → „System-Visitenkarte"](PLAN.md)

> **Stand 0.9.8:** Im generierten **Admin-HTML** (Diagnose) gibt es „Für Forum kopieren“ mit kompakten Systemdaten — Teilmenge dieser Idee; separater Admin-Adapter-Button o. Ä. weiterhin offen.

Kompakte, teilbare Kurzübersicht der wichtigsten Systemdaten — damit helfende Forum-Nutzer nicht immer nachfragen müssen.

- [ ] **Option A — Button im Admin-UI (Adapter-Instanz):** „Für Forum kopieren" in der ioBroker-Admin-Maske (nicht nur in der HTML-Doku)
- [ ] **Option B — System-Card als separates Export-Format:** Mini-HTML oder Plaintext, eigenständig teilbar
- [ ] Zusammenhang zu Custom Templates (Ebene 1) prüfen — könnte dort aufgehen

### KI-gestützte Smarthome-Beschreibung aus Skript-Quellcode (Brainstorming / ungeklärt)

> Noch unentschieden — Form und Tiefe offen. Details und Abwägung: [PLAN.md → „Skript-Quellcode-Analyse & Smarthome-Beschreibung durch KI"](PLAN.md)

Grundgedanke: Skript-Quellcode (`common.source`) durch KI analysieren, um automatisch zu beschreiben, was das Smarthome **tatsächlich tut** — Inhaltsverzeichnis der Automatisierungen, „was steuert was", „wie reagiert das System auf X".

- [ ] **Variante A — Deep Script Analysis (live):** `common.source` per opt-in einlesen, KI-Pass pro Skript/Batch, globaler Automations-Überblick (Erweiterung `aiEnhancer.js` + `discovery.js`)
- [ ] **Variante B — Backup-basiert (offline):** ioBroker-Backup (`backitup`) parsen → Doku ohne live System, ggf. kombiniert mit Variante A (Erweiterung Phase-5 Backup-Integration)

---

## Release-Prozess (wenn bereit für echte Veröffentlichung)

> Solange der Adapter nicht auf npm und nicht in `ioBroker.repositories` eingetragen ist, haben Tags und GitHub Releases **keine Wirkung** auf Update-Erkennung oder Installation im ioBroker Admin.

### Voraussetzungen

- [ ] [Adapter Checker](https://adapter-check.iobroker.in/) vollständig grün
- [ ] npm-Account vorhanden, `iobroker.autodoc` als Paketname verfügbar

### Schritte

1. [ ] Für **erstes npm-/Repository-Release**: `package.json` + `io-package.json` **Version** und **news** synchron setzen (Nummer nach ioBroker-Übung — **nicht** vorher als 1.0.0 „vortäuschen“; aktuell absichtlich **0.9.x** RC)
2. [ ] News-Eintrag in `io-package.json` (EN + DE minimum)
3. [x] README inkl. Abschnitt **Changelog** gepflegt (`CHANGELOG.md` entfernt — eine Quelle)
4. [x] `dev` → Merge nach `main` (RC-Forum-Stand)
5. [ ] `npm publish` (veröffentlicht auf npmjs.com)
6. [ ] GitHub Release aus Tag erstellen (dann erst sinnvoll)
7. [ ] PR zu [ioBroker/ioBroker.repositories](https://github.com/ioBroker/ioBroker.repositories) für Eintrag in Beta-Liste (`sources-dist.json`)

---

## Bewusst weggelassen

- ❌ Ungefilterte „Komplett-Graphen“ (z. B. Skript-/State für große Installationen ohne Knotenlimit) — **gestaffelte Mermaid-Umsetzung:** Phase 5.x
- ❌ Vollständiges Code-Parsing für Abhängigkeiten
- ❌ REST-API / Webhooks
- ❌ Alexa/Google Home Integration
- ❌ Analytics/Adapter-Popularität
- ❌ Mobile App
- ❌ Kollaborative Features
