# AutoDoc Adapter — TODO-Liste

Diese Datei ist die **Arbeitsliste**: was **offen** ist steht oben; **erledigte** Meilensteine sind im **Anhang** vollständig als Referenz erhalten (nichts streichen — nur sortiert).

| Dokument | Rolle |
| -------- | ----- |
| **TODO.md** (hier) | Checkboxen, Offenes, Anhang „Erledigt“ |
| **[PLAN.md](PLAN.md)** | Vision, Begründungen, Architektur, Festlegungen (u. a. Visitenkarte, KI+Skript), Brainstorming |
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

## Übersicht — Umsetzung vs. Rest (Stand: `package.json` / README, Branch **`main`**, 2026-04)

| Thema | Status | Kurz |
| ----- | ------ | ---- |
| Phasen **1–4** (Basis … Profile-Redesign) | ✅ | Modular, drei Profile, Discovery, Renderer, i18n EN/DE/FR, … |
| **0.9.x** RC-Features (Aliase, Diagnose, QR/Copy, `exportPath`, …) | ✅ | Siehe README-Changelog |
| **Multihost** (Host-Karten, Slave-Warnung, Export) | ✅ | |
| **KI** (Provider, Tab `hidden`, Timeouts, Temperaturen, **AI context hints**, `guestHelpNote` / `homeRoutinesNote`) | ✅ | Sprachqualität kleiner Modelle bleibt iterativ |
| **Custom Templates** (Kapitel ausblenden, Custom-Sections, Theme-Teile) | 🟡 | [PLAN.md — Custom Templates](PLAN.md#custom-templates-detail); **0.9.17:** Admin-Reihenfolge + **Farb-Presets** (ohne Roh-CSS); offen: **PDF**, ggf. Reihenfolge User/Onboarding, DnD |
| **Admin-HTML Lesbarkeit** (lange Listen eingeklappt; Score ohne „Strafe“ für bewusst deaktivierte Instanzen) | ✅ | In **0.9.17** README-Changelog (block „Also on `dev`…“) + Feature-Bullets oben drunter |
| **States entlasten** (`documentationStatesMode`, Platzhalter, Downloads aus `/files`, **`documentation.exportHashes`**) | ✅ | Default weiterhin `full`; News bei Default-Wechsel → offen |
| **Phase 5** (PDF, Backup-Adapter, Rest Custom Templates) | ⬜ | |
| **Phase 5.x.1** Notfall/Troubleshooting „Hybrid“ | ✅ | Kurzzeilen, Doku-Links (0.9.18), **Auto-Checklisten** bei Node-Befund + Disclaimer (0.9.19) |
| **Phase 5.x.2** Quick Start / Raumguides | ⬜ | Strukturierte Blöcke im Modell |
| **Phase 5.x.3** Mermaid | ⬜ | Gestaffelt: kuratiert → klein automatisch |
| **System-Visitenkarte** / Forum-Copy | ✅ | `textSendTo` **getForumCard** + State `info.forumCardPlain`; Diagnose-HTML nutzt `forumCard.js` |
| **KI + Skript-Quellcode** | 🟡 | **A** umgesetzt (`aiAnalyzeScriptSources`); **B** weiterhin Phase 5 Backup |
| **npm + ioBroker.repositories** | ⬜ | Nach Adapter-Checker |

---

<a id="offene-arbeit"></a>

## 1. Offene & nächste Arbeit (priorisiert)

Reihenfolge bewusst knapp; Details und Begründungen: [PLAN.md — Phase 5.x](PLAN.md#phase-5x-plan). **Architektur** (jsonl/Redis, States, Medien): festgelegt — [PLAN — Nächste Schritte](PLAN.md#architektur-naechste-schritte).

### Abgestimmte Umsetzungsreihenfolge (Konzept Stand 2026-04)

> Reihenfolge **Projekt / Features** — **npm** und **ioBroker.repositories** bewusst **danach** (siehe § 1.1).

| # | Thema | Verweis |
| - | ----- | ------- |
| 1 | **Custom Templates — Rest (0.9.17 / `main`)** | Erledigt: `adminChapterOrderJson`, `htmlThemePreset` — weiter: **Phase 5** (PDF, User/Onboarding, DnD) — [PLAN](PLAN.md#custom-templates-detail), [§ 1.2](#phase-5-features) |
| 2 | **Phase 5.x.1** Hybrid (Notfall-Block + Diagnose-Snapshot) | ✅ 0.9.18 / 0.9.19 — [§ 1.3 — 5.x.1](#phase-5x) |
| 3 | **Phase 5.x.2** Quick Start / Raumguides | [§ 1.3 — 5.x.2](#phase-5x) |
| 4 | **Phase 5.x.3** Mermaid (gestaffelt) | [§ 1.3 — 5.x.3](#phase-5x) |
| 5 | **Phase 5:** Backup-Anbindung, PDF, Rest Custom Templates | [§ 1.2](#phase-5-features), [Backup/Backitup](#backup-backitup-festlegung) |
| 6 | **npm** + **Adapter Checker** + **ioBroker.repositories** | [§ 1.1](#release-veroeffentlichung) |

<a id="backup-backitup-festlegung"></a>

### Backup / ioBroker.backitup — Festlegung für die spätere Umsetzung

> **Noch nicht implementiert** — Inhalt aus Abstimmung (Backitup-Repo, typische Nutzer-Setups). Dient als einheitliche Referenz, damit PLAN/KI-B nicht nur „ZIP“ sagen.

- **Typische Archive:** [ioBroker.backitup](https://github.com/simatec/ioBroker.backitup) erzeugt u. a. **`*.tar.gz`** (z. B. `iobroker_…_backupiobroker.tar.gz`, `javascripts_…` — vgl. `lib/list.js` im Backitup-Repo). **Nicht nur ZIP** — AutoDoc-Parser/Doku müssen **tar.gz** abbilden, sobald Backup verarbeitet wird.
- **Zugriff (ohne Cloud-Zugänge in AutoDoc zu duplizieren):**
  - **Empfohlen:** für ioBroker **lesbarer Pfad** (NAS per **SMB/NFS/Mount**, Docker-Volume) — Zugangsdaten bleiben auf Host/Backitup.
  - **Optional:** lose Kopplung per **`sendTo`** an eine Backitup-Instanz (`list`, `getSystemInfo` u. a., siehe Backitup `main.js`) — **keine** feste API-Garantie durch Dritte, bei Umsetzung gegen aktuelle Backitup-Version prüfen.
- **Kurz nur lokal zwischengespeichert:** keine zuverlässige Quelle ohne **Mount**, **Kopie an stabilem Ort** oder **Trigger** direkt nach dem Backup-Lauf.
- **KI + Skript Variante B:** gleiche KI-Pipeline wie A, Daten aus Backup-Archiv — bleibt an **Phase-5-Backup-Umsetzung** gekoppelt ([PLAN — KI + Skript](PLAN.md#ki-skript-festlegung)).

<a id="release-veroeffentlichung"></a>

### 1.1 Release / Veröffentlichung

> Solange **kein npm** und **kein** Eintrag in **ioBroker.repositories**: URL-Installation nutzt u. a. `main`; Tags/Releases ändern für viele Nutzer nichts.

- [ ] [Adapter Checker](https://adapter-check.iobroker.in/) vollständig grün
- [ ] npm-Account / Paketname `iobroker.autodoc` klären
- [ ] Erstes **npm**-Release: `package.json` + `io-package.json` **Version** und **news** synchron (Nummer nach ioBroker-Übung, nicht „1.0.0 vortäuschen“)
- [ ] `npm publish`
- [ ] GitHub Release (Tag) sinnvoll erst danach
- [ ] PR [ioBroker.repositories](https://github.com/ioBroker/ioBroker.repositories) (`sources-dist.json`)

- [x] **`dev` → `main`** (Fast-forward, **0.9.17** inkl. Presets, Kapitelreihenfolge, i18n-Id-Listen)
- [x] **Foren-Ankündigung** 0.9.17 (Kurztext wahlweise im Chat/Notiz, nicht im README)
- [x] README-Changelog + diese TODO-Zeilen als Quelle für Tester (Git-URL-Installation)

<a id="phase-5-features"></a>

### 1.2 Phase 5 — Features (Nice-to-Have)

- [ ] PDF-Export
- [ ] Backup-Anbindung (siehe [Backup / ioBroker.backitup](#backup-backitup-festlegung) — **tar.gz**, Pfad und/oder `sendTo` Backitup)
- [ ] Custom Templates — **Rest** (nach 0.9.17): ggf. **PDF**, Reihenfolge **User/Onboarding**, Drag-and-Drop — [PLAN.md — Custom Templates](PLAN.md#custom-templates-detail)

<a id="phase-5x"></a>

### 1.3 Phase 5.x — Reihenfolge 1 → 2 → 3

#### 5.x.1 Notfall & Troubleshooting (Hybrid)

**Bereits da (abgrenzen):** manuelle Felder **„Help & emergencies“** / **„Routines in your own words“** (`guestHelpNote`, `homeRoutinesNote`, u. a. 0.9.9) — Freitext in Onboarding/User, keine erfundene Diagnose.

Noch offen (größere Ausbaustufe als reiner Freitext):

- [x] Strukturierter Block **über** reine Notizfelder hinaus: **Kurzzeilen** (WLAN/Strom/Wasser/Sonstiges) + **automatische Doku-Links** (User/Onboarding/Admin, gleiche Logik wie QR — **0.9.18**)
- [x] Kurze **Auto-Checklisten** nur bei **konkreten** Diagnose-Befunden (aktuell: **Node.js** wie Admin-Diagnose) + **Momentaufnahme-Hinweis** — **0.9.19** (`lib/diagnosisSnapshot.js`)

#### 5.x.2 Quick Start & Raumguides

- [x] `documentModel`: feste Blöcke (`docModel.quickStart` / `lib/quickStartGuide.js`)
- [x] Renderer Onboarding + User: strukturierte Listen + Raumkacheln (HTML) / übersichtliche Abschnitte (MD)
- [x] KI nur Formulierung, nicht alleinige Struktur (unverändert: keine KI-Strukturierung)
- [ ] Später: Sortierung/Relevanz; Länge Onboarding vs. User

**Hinweis (Abschnittsreihenfolge):** **User-HTML** und **User-Markdown** nutzen dieselben Inhalte, aber **nicht** dieselbe Kapitelreihenfolge (z. B. manuelles Kapitel und Hilfe im HTML oben, im Markdown-Export erst nach System/Adaptern/Räumen/Skripten) — beabsichtigt, kein Fehler.

**Hinweis (Admin-UI-Sprache):** Ausführliche Hilfetexte (u. a. versteckte Kapitel-Ids inkl. `atAGlance`) stehen in **EN / DE / FR**; die übrigen Admin-Sprachdateien sind minimal und fallen auf **Englisch** zurück.

#### 5.x.3 Mermaid / kleine Graphen

- [ ] Stufe 1: Mermaid aus **kuratiertem** Inhalt (Config / `manualContext`)
- [ ] Ausgabe Markdown + HTML-Variante festlegen
- [ ] Stufe 2: optional kleiner **Auto-Graph** mit **hartem Knotenlimit** (z. B. Multihost)
- [ ] Nicht Ziel: ungefilterter Gesamtgraph

<a id="nachzuege"></a>

### 1.4 Kleine Nachzüge / Trigger

- [ ] **`io-package` news**, wenn **Default** `documentationStatesMode` auf **`metadata`** geändert wird (sinnvoll beim npm-Release; bei reiner Git-Installation optional)
- [x] **README-Changelog** + Version **0.9.11** um States/Hashes/Changelog-i18n ergänzt

<a id="todo-festlegt-umsetzung"></a>

### 1.5 Festgelegt — Umsetzung (Referenz)

Details: [PLAN — System-Visitenkarte](PLAN.md#system-visitenkarte-festlegung), [PLAN — KI + Skript](PLAN.md#ki-skript-festlegung).

- [x] **System-Visitenkarte:** **jsonConfig** `textSendTo` `getForumCard` (+ Copy); State `info.forumCardPlain`; gemeinsame Logik `lib/forumCard.js`
- [x] **KI + Skriptquellcode:** **Variante A** — `aiAnalyzeScriptSources`, Zeilen-Redaktion, User/Onboarding HTML + Markdown; **Variante B** → Phase 5 Backup / [Backup-Backitup](#backup-backitup-festlegung) (offen)

---

## 2. Teilweise umgesetzt — kurz erklärt

| Bereich | Was schon da ist | Was „Phase 5.x“ / PLAN noch meint |
| ------- | ---------------- | ---------------------------------- |
| Notfall / Gäste | wie oben + Diagnose-Snapshot (Node) | Weitere Befund-Typen nur bei tragfähigen Daten |
| Customization | `*HiddenChaptersJson`, `customDocSectionsJson`, `htmlThemePreset`, `adminChapterOrderJson` (Admin), Theme-Felder, Markdown-Export | Drag-Sort, PDF, ggf. Presets/Order für **User/Onboarding** |
| Forum-Hilfe | Diagnose-Block + **`getForumCard`** / State `info.forumCardPlain` (`lib/forumCard.js`) | Optional: spätere Template-„nur System“-HTML ([PLAN](PLAN.md#system-visitenkarte-festlegung)) |
| Doku in States | `full` / `metadata`, Platzhalter, Dateizugriff, **exportHashes** | Nur **Kommunikation** (news), wenn Default wechselt |

---

## 3. Zur Klärung (ohne feste Roadmap)

Ausführlich: [PLAN.md — Zukunftsvision](PLAN.md#zukunftsvision). **Medien, Redis/jsonl, States:** Arbeitsweise und Leitplanken sind festgelegt — [PLAN — Medien-MVP](PLAN.md#architektur-medien-mvp), [Architektur](PLAN.md#architektur-grenzen).

---

<a id="anhang-a-erledigt"></a>

## Anhang A — Vollständige Checklisten: Erledigt (Referenz)

Der folgende Stand ist **historisch vollständig** (✅). Bei Abweichungsfragen immer **Git / README-Changelog** prüfen.

### Release 0.9.17 — Custom Templates (Rest, Teil) ✅

- [x] **Admin**-Kapitelreihenfolge: `adminChapterOrderJson` → `documentModel.adminChapterOrder`; **HTML**-Seitenleiste + Kapitel; **Markdown** (Profil Admin) TOC + Inhalt in gleicher Reihenfolge
- [x] **HTML**-Farb-**Presets** ohne Roh-CSS: `htmlThemePreset`, `lib/htmlThemePresets.js` (CSS-Variablen, Hell/Dunkel)
- [x] `io-package` native, `jsonConfig`, **i18n** EN/DE/FR; **News**; `RENDERER_VERSION` angehoben

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
- [x] 2.3 Wartungs-Score / Checkliste (nur echte Warnungen; deaktivierte Instanzen = Inventar), Diagnose; Admin-HTML: lange Tabellen-Abschnitte optional eingeklappt
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
