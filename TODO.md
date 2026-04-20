# AutoDoc Adapter — TODO-Liste

Diese Datei ist die **Arbeitsliste**: was **offen** ist steht oben; **erledigte** Meilensteine sind im **Anhang** vollständig als Referenz erhalten (nichts streichen — nur sortiert).

| Dokument | Rolle |
| -------- | ----- |
| **TODO.md** (hier) | Checkboxen, Offenes, Anhang „Erledigt“ |
| **[PLAN.md](PLAN.md)** | Vision, Begründungen, Architektur, Brainstorming, offene Entscheidungen |
| **[README.md](README.md)** | Nutzer-README + **Changelog** (Release-Notizen) |

## Wichtige Referenzen

- [ioBroker AI Developer Guide](https://github.com/Jey-Cee/iobroker-ai-developer-guide)
- [Adapter Creator](https://github.com/ioBroker/create-adapter)
- [Adapter Checker](https://adapter-check.iobroker.in/)
- Mitwirkung: [CONTRIBUTING.md](CONTRIBUTING.md)

---

## Legende

| Symbol | Bedeutung |
| ------ | ----------- |
| ✅ | Umgesetzt (im Repo nachvollziehbar) |
| 🟡 | Teilweise / später ausbaufähig |
| ⬜ | Noch nicht umgesetzt |
| ❓ | Konzept offen — Details in [PLAN.md](PLAN.md) |

---

<a id="stand-uebersicht"></a>

## Übersicht — Umsetzung vs. Rest (Stand: siehe `package.json` / README Version)

| Thema | Status | Kurz |
| ----- | ------ | ---- |
| Phasen **1–4** (Basis … Profile-Redesign) | ✅ | Modular, drei Profile, Discovery, Renderer, i18n EN/DE/FR, … |
| **0.9.x** RC-Features (Aliase, Diagnose, QR/Copy, `exportPath`, …) | ✅ | Siehe README-Changelog |
| **Multihost** (Host-Karten, Slave-Warnung, Export) | ✅ | |
| **KI** (Provider, Tab `hidden`, Timeouts, Temperaturen, **AI context hints**, `guestHelpNote` / `homeRoutinesNote`) | ✅ | Sprachqualität kleiner Modelle bleibt iterativ |
| **Custom Templates** (Kapitel ausblenden, Custom-Sections, Theme-Teile) | 🟡 | [PLAN.md — Custom Templates](PLAN.md#custom-templates-detail); offen: Reihenfolge, Presets ohne Roh-CSS, PDF |
| **States entlasten** (`documentationStatesMode`, Platzhalter, Downloads aus `/files`, **`documentation.exportHashes`**) | ✅ | Default weiterhin `full`; News bei Default-Wechsel → offen |
| **Phase 5** (PDF, Backup-Adapter, Rest Custom Templates) | ⬜ | |
| **Phase 5.x.1** Notfall/Troubleshooting „Hybrid“ | 🟡 | **Hilfe & Notfälle** als Freitext (`guestHelpNote`, u. a. seit 0.9.9) ✓ — offen: eigene Kapitelstruktur, Auto-Checklisten aus Diagnose |
| **Phase 5.x.2** Quick Start / Raumguides | ⬜ | Strukturierte Blöcke im Modell |
| **Phase 5.x.3** Mermaid | ⬜ | Gestaffelt: kuratiert → klein automatisch |
| **System-Visitenkarte** / Forum-Copy aus Admin-UI | 🟡 | „Für Forum kopieren“ in **Admin-HTML** ✓; Button in Adapter-Maske ❓ |
| **KI + Skript-Quellcode** | ❓ | Varianten in PLAN |
| **npm + ioBroker.repositories** | ⬜ | Nach Adapter-Checker |

---

<a id="offene-arbeit"></a>

## 1. Offene & nächste Arbeit (priorisiert)

Reihenfolge bewusst knapp; Details und Begründungen: [PLAN.md — Phase 5.x](PLAN.md#phase-5x-plan).

### 1.1 Release / Veröffentlichung

> Solange **kein npm** und **kein** Eintrag in **ioBroker.repositories**: URL-Installation nutzt u. a. `main`; Tags/Releases ändern für viele Nutzer nichts.

- [ ] [Adapter Checker](https://adapter-check.iobroker.in/) vollständig grün
- [ ] npm-Account / Paketname `iobroker.autodoc` klären
- [ ] Erstes **npm**-Release: `package.json` + `io-package.json` **Version** und **news** synchron (Nummer nach ioBroker-Übung, nicht „1.0.0 vortäuschen“)
- [ ] `npm publish`
- [ ] GitHub Release (Tag) sinnvoll erst danach
- [ ] PR [ioBroker.repositories](https://github.com/ioBroker/ioBroker.repositories) (`sources-dist.json`)

Bereits erledigt in der Liste unten: README-Changelog als eine Quelle, `dev`→`main` für RC-Forum.

### 1.2 Phase 5 — Features (Nice-to-Have)

- [ ] PDF-Export
- [ ] Backup-Adapter-Integration
- [ ] Custom Templates — Rest siehe [PLAN.md — Custom Templates](PLAN.md#custom-templates-detail) (Reihenfolge, Presets ohne Roh-CSS, …)

<a id="phase-5x"></a>

### 1.3 Phase 5.x — Reihenfolge 1 → 2 → 3

#### 5.x.1 Notfall & Troubleshooting (Hybrid)

**Bereits da (abgrenzen):** manuelle Felder **„Help & emergencies“** / **„Routines in your own words“** (`guestHelpNote`, `homeRoutinesNote`, u. a. 0.9.9) — Freitext in Onboarding/User, keine erfundene Diagnose.

Noch offen (größere Ausbaustufe als reiner Freitext):

- [ ] Eigener, ggf. geführter Abschnitt / Struktur (optional User) — über reine Notizfelder hinaus
- [ ] Kurze **Auto-Checklisten** nur bei **konkreten** Diagnose-Befunden (später; mit Hinweis Momentaufnahme)

#### 5.x.2 Quick Start & Raumguides

- [ ] `documentModel`: feste Blöcke (z. B. Top 3–5 Aktionen systemweit, 2–3 Highlights pro Raum)
- [ ] Renderer Onboarding (optional User): Kacheln/Listen
- [ ] KI nur Formulierung, nicht alleinige Struktur
- [ ] Später: Sortierung/Relevanz; Länge Onboarding vs. User

#### 5.x.3 Mermaid / kleine Graphen

- [ ] Stufe 1: Mermaid aus **kuratiertem** Inhalt (Config / `manualContext`)
- [ ] Ausgabe Markdown + HTML-Variante festlegen
- [ ] Stufe 2: optional kleiner **Auto-Graph** mit **hartem Knotenlimit** (z. B. Multihost)
- [ ] Nicht Ziel: ungefilterter Gesamtgraph

<a id="nachzuege"></a>

### 1.4 Kleine Nachzüge / Trigger

- [ ] **`io-package` news**, wenn **Default** `documentationStatesMode` auf **`metadata`** geändert wird (sinnvoll beim npm-Release; bei reiner Git-Installation optional)
- [x] **README-Changelog** + Version **0.9.11** um States/Hashes/Changelog-i18n ergänzt

### 1.5 Brainstorming — umgesetzt in Teilen, Entscheid offen

- [ ] **System-Visitenkarte:** Button in **Admin-Adapter-UI** oder separates Mini-Exportformat? (HTML-Doku hat bereits Snippet — siehe PLAN)
- [ ] **KI + Skript-Quellcode:** Variante A/B — siehe [PLAN.md](PLAN.md)

---

## 2. Teilweise umgesetzt — kurz erklärt

| Bereich | Was schon da ist | Was „Phase 5.x“ / PLAN noch meint |
| ------- | ---------------- | ---------------------------------- |
| Notfall / Gäste | `guestHelpNote`, `homeRoutinesNote`, KI-Owner-Context | Strukturiertes Kapitel, Diagnose-gekoppelte Checklisten |
| Customization | `*HiddenChaptersJson`, `customDocSectionsJson`, Theme-Felder, Markdown-Export | Drag-Sort, Presets, PDF, volle Theme-Presets ohne CSS |
| Forum-Hilfe | Diagnose-Block „für Forum kopieren“ in generierter Admin-HTML | Ein-Klick in **ioBroker-Admin-Instanz**-Maske o. ä. |
| Doku in States | `full` / `metadata`, Platzhalter, Dateizugriff, **exportHashes** | Nur **Kommunikation** (news), wenn Default wechselt |

---

## 3. Zur Klärung (ohne feste Roadmap)

Ausführlich: [PLAN.md — Zukunftsvision](PLAN.md#zukunftsvision), [Architektur-Grenzen](PLAN.md#architektur-grenzen), offene Fragen **User-Assets** / Bilder in Redis.

---

<a id="anhang-a-erledigt"></a>

## Anhang A — Vollständige Checklisten: Erledigt (Referenz)

Der folgende Stand ist **historisch vollständig** (✅). Bei Abweichungsfragen immer **Git / README-Changelog** prüfen.

### Phase 1 — Basis ✅ (v0.1.0)

- [x] Modularisierung: `lib/discovery.js`, `lib/documentModel.js`, `lib/markdownRenderer.js`, `lib/htmlRenderer.js`, `lib/versionTracker.js`, `lib/i18n.js`
- [x] Dateibasierter Export: Markdown, HTML, JSON nach `/files/autodoc.0/`
- [x] Admin UI: `jsonConfig.json5` + i18n EN + DE + FR
- [x] Drei Profile: Admin, User, Onboarding
- [x] Adapter-Beschreibungen aus ioBroker-Metadaten
- [x] Versionsverfolgung mit Diff und Changelog
- [x] Automatische Generierung: Startup, Timer, Event-basiert (30s Debounce)
- [x] HTML-Renderer mit Sidebar, Stat-Cards, Adapter-Cards je Profil

### Phase 2 — Inhalt ✅

- [x] 2.1 `enum.rooms` + `enum.functions` auslesen und als Kapitel rendern
- [x] 2.2 Skripte aus `script.js.*`: Name, Status, Beschreibung, Trigger-Typ
- [x] 2.3 Wartungs-Score, Checkliste, Instanzen/Skripte ohne Beschreibung
- [x] 2.4 Clientseitige Such-/Filterfunktion im HTML (Nav-Suchbox, Escape-Reset)

### Phase 3 — Tiefe ✅

- [x] 3.1 Notifications: `sendTo` nach Generierung (Telegram, Email, Pushover, generic)
- [x] 3.2 Dependency-Analyse: `lib/dependencyAnalyzer.js`, stateRefs + Cross-Reference
- [x] 3.3 AI-Enhanced Docs: `lib/aiEnhancer.js`, pluggable Providers (Anthropic/Groq/Ollama), opt-in, Admin-Profil wird übersprungen
- [x] 3.x i18n-Fix: alle hardcodierten englischen Strings ersetzt (EN/DE/FR vollständig)
- [x] 3.x Adapter-Metadaten: `connectionType`, `dataSource`, `tier` aus ioBroker-Metadaten; gefilterter `native`-Config im Admin-Profil (sensitive Keys automatisch entfernt)
- [x] 3.x Strukturierter `manualContext`: `adapters{}` + `rooms{}` — per-Adapter/Raum-Notizen, in allen Profilen angezeigt

### Phase 4 — Profile-Redesign ✅

#### 4.1 Discovery-Erweiterungen ✅

- [x] `system.config` auslesen: Stadt, Land, Systemsprache → `rawData.systemConfig`
- [x] Geräte-Namen-Auflösung: Raum-Mitglieder → Device-Objekte via `getForeignObjectAsync`
- [x] Opt-in Live-States: Schlüssel-Rollen (`level.temperature`, `sensor.door`, `sensor.window`, `alarm`) lesen
- [x] Neue Config-Option `readLiveStates` in `jsonConfig.json5` + i18n

#### 4.2 Role Mapper ✅

- [x] `lib/roleMapper.js` — 29 Patterns → 14 Kategorien + Icons
- [x] i18n-Keys für Kategorie-Labels (EN/DE/FR)

#### 4.3 DocumentModel-Erweiterungen ✅

- [x] `buildSystemConfig(rawData)` → `docModel.systemConfig`
- [x] `buildRooms()`: `rooms[].devices[]` mit `{ id, deviceName, category, icon, currentValue, unit }`

#### 4.4 Renderer-Architektur: Dispatcher ✅

- [x] `renderHtml()` als Dispatcher → `renderAdminHtml()` / `renderUserHtml()` / `renderOnboardingHtml()`

#### 4.5 Onboarding-Profil ✅

- [x] Stadt-bewusster Willkommenstext, Räume mit Device-Grid + Icons + Live-Values
- [x] "Was läuft automatisch?" als plain sentences, Adapter-Cards (freundlich)
- [x] AI-Box prominent, Hint wenn kein manualContext

#### 4.6 User/Familie-Profil ✅

- [x] Räume mit Device-Cards, Skripte name+desc only, Adapter title-only

#### 4.7 Admin-Profil ✅

- [x] Device-Hierarchie-Tabelle pro Raum mit OIDs

#### 4.x Bugfixes & UI-Verbesserungen ✅

- [x] `room.members` → `room.devices` (DocumentModel ↔ Renderer Alignment)
- [x] Onboarding: Adapter-Abschnitt fehlte (renderAdaptersChapter nicht aufgerufen)
- [x] markdownRenderer: gleicher room.devices Bug → UNCAUGHT_EXCEPTION im Admin-Profil
- [x] Adapter-Badges: "none"/"assumption" ausblenden, Tier mit Qualitätsbezeichnung
- [x] "Instanzen ohne Raumzuweisung" entfernt (konzeptionell falsch)
- [x] Hosts-Tabelle: leere adapterCount-Spalte entfernt
- [x] Diagnose-Sektion neu aufgebaut: Erfassungsstatus, Wo nachschauen (alive/connected), Befunde

#### 4.x UI-Verbesserungen Session 2 ✅

- [x] Adapter-Tabelle: deaktivierte Instanzen eingeklappt (`<details>`), lokaler Filter-Input mit Hinweistext
- [x] Node.js-Version aus `host.native` (via `getForeignObjectAsync`) + Badge grün/rot (LTS ≥ v20)
- [x] OS-Info (Kernel, Architektur) im System-Kapitel und Hosts-Tabelle
- [x] Node.js-Warnung + OS-Update-Hinweis in Diagnose-Befunde
- [x] Script-Ordner-Labels: `null` → Root-Verzeichnis, `common` → Allgemeine Skripte, `global` → Globale Skripte

#### 4.x Abschluss

- [x] i18n: alle neuen Keys (EN/DE/FR)
- [x] Lint sauber (0 Errors)
- [x] README.md (inkl. Changelog) + TODO.md + PLAN.md aktualisiert (Abschluss RC 0.9.x)
- [x] `dev` → Merge nach `main` (RC-Stand für Forum; weiteres Testing + Adapter-Checker vor npm)

#### 4.y Release-Kandidat (0.9.x) — umgesetzt

- [x] Aliase (`alias.0.*`), eigene Variablen mit Filter; Repository in Diagnose; RAM-Summe Adapter
- [x] Manuelle Hinweise oben (Admin/User); Doku-Score erklärt; visuelle Akzente (Gold/Orange/Blau)
- [x] Onboarding: Capabilities, Tipps immer sichtbar, ⏱ bei Cron-Skripten, QR + Copy
- [x] `RENDERER_VERSION` / `info.templateVersion` für Template-Updates ohne Versions-Chaos

#### Admin-UI: Bedingte Sichtbarkeit im KI-Tab (Forum-Feedback) ✅

> Umgesetzt mit `jsonConfig`-Eigenschaft **`hidden`**. Anbieter „Deaktiviert“ blendet KI-Felder aus.

- [x] Anbieter = `none` / deaktiviert → KI-Felder ausgeblendet
- [x] Anbieter = `ollama` → API-Schlüssel ausgeblendet, Basis-URL sichtbar
- [x] Anbieter = `anthropic` / `groq` / `mistral` → API-Schlüssel sichtbar, Basis-URL je nach Feld
- [x] Temperaturen + Timeout nur sichtbar wenn Anbieter aktiv

### KI — Zusammenfassung & Backlog ✅

- [x] Optionale **Temperaturen** User vs. Onboarding (`jsonConfig`); leer = Anbieter-Default
- [x] **HTTP-Timeout** pro Request konfigurierbar
- [x] **Bewohner-Stichpunkte / AI context hints** (nur LLM-Prompt)

<a id="multihost-done"></a>

### Multihost-Unterstützung ✅

> Hintergrund: [PLAN.md — Multihost](PLAN.md#multihost-plan)

- [x] Admin: Host-Distribution (nur wenn > 1 Host); Single-Host unverändert
- [x] Warnung wenn AutoDoc nicht auf primärem Host
- [x] Optional `exportPath`, drei HTML-Profile, Fehler nur warnen
- [x] QR: serverseitig `qrcode`, kein CDN

### Architektur — States entlasten ✅ (Umsetzung)

**Problem / Ziel** wörtlich: große Inhalte kanonisch unter **`/files/`**; States nicht unnötig mit Megabyte-Strings belasten — siehe [PLAN.md — Doppelte Ablage](PLAN.md#doppelte-ablage-states).

- [x] **`documentationStatesMode`**: `full` \| `metadata`, Default `full` — io-package, `jsonConfig`, EN/DE/FR
- [x] **`persistDocumentation`**: bei `metadata` Platzhalter in `documentation.markdown` / `.html` / `.json`; `documentation.stateSummary` unverändert
- [x] Download-Aktionen: Quelle `autodoc-latest.*` / `autodoc-admin.html`, Fallback Legacy-State
- [x] **`documentation.exportHashes`**: SHA-256 (hex) der drei Latest-Exporte — beide Modi
- [x] README-Kurztext zu Modus + Hashes

---

## Anhang B — Release-Prozess (Detail)

> Oberste Priorität: **Abschnitt 1.1** oben. Diese Zeilen sind die gleiche Liste, kompakt.

- [ ] Adapter Checker grün
- [ ] npm-Konto / Paketname
- [ ] Version + news (`package.json`, `io-package.json`)
- [ ] `npm publish`
- [ ] GitHub Release
- [ ] PR ioBroker.repositories

Bereits erledigt:

- [x] README inkl. **Changelog** (`CHANGELOG.md` entfernt — eine Quelle)
- [x] `dev` → `main` (RC-Forum-Stand)

---

## Bewusst weggelassen

- ❌ Ungefilterte „Komplett-Graphen“ (Skript-/State ohne Knotenlimit) — gestaffelte Mermaid: Phase 5.x
- ❌ Vollständiges Code-Parsing für Abhängigkeiten
- ❌ REST-API / Webhooks
- ❌ Alexa/Google Home Integration
- ❌ Analytics/Adapter-Popularität
- ❌ Mobile App
- ❌ Kollaborative Features
