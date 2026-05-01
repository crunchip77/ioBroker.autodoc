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
| *optional* | Bewusster **Backlog** / Nice-to-have — nicht priorisiert, bei Bedarf nachziehen |

---

<a id="stand-uebersicht"></a>

## Übersicht — Umsetzung vs. Rest (Stand: `package.json` / README, 2026-04-28; Branch je nach Arbeitskopie, z. B. `main` / `dev`)

| Thema | Status | Kurz |
| ----- | ------ | ---- |
| Phasen **1–4** (Basis … Profile-Redesign) | ✅ | Modular, drei Profile, Discovery, Renderer, i18n EN/DE/FR, … |
| **0.9.x** RC-Features (Aliase, Diagnose, QR/Copy, `exportPath`, …) | ✅ | Siehe README-Changelog |
| **Multihost** (Host-Karten, Slave-Warnung, Export) | ✅ | |
| **KI** (Provider, Tab `hidden`, Timeouts, Temperaturen, **AI context hints**, `guestHelpNote` / `homeRoutinesNote` / `ownerPlaybookNote`) | ✅ | Sprachqualität kleiner Modelle bleibt iterativ |
| **Custom Templates** (Kapitel ausblenden, Custom-Sections, Theme-Teile) | 🟡 | [PLAN.md — Custom Templates](PLAN.md#custom-templates-detail); **0.9.17:** Admin-Reihenfolge + **Farb-Presets** (ohne Roh-CSS); offen: **PDF**, ggf. Reihenfolge User/Onboarding, DnD |
| **Admin-HTML Lesbarkeit** (lange Listen eingeklappt; Score ohne „Strafe“ für bewusst deaktivierte Instanzen) | ✅ | In **0.9.17** README-Changelog (block „Also on `dev`…“) + Feature-Bullets oben drunter |
| **States entlasten** (`documentationStatesMode`, Platzhalter, Downloads aus `/files`, **`documentation.exportHashes`**) | ✅ | Default weiterhin `full`; News bei Default-Wechsel → offen |
| **Phase 5** (PDF, Backup-Adapter, Rest Custom Templates) | ⬜ | PDF‑Merker: [§ 1.2a](#phase-5-pdf-offline-mermaid) (Offline/Druck/Mermaid vs. CDN) |
| **Phase 5.x.1** Notfall/Troubleshooting „Hybrid“ | ✅ | Kurzzeilen, Doku-Links (0.9.18), **Auto-Checklisten** bei Node-Befund + Disclaimer (0.9.19) |
| **Phase 5.x.2** Quick Start / Raumguides | 🟡 | Kern in **0.9.20**; **0.9.26:** Gäste-Schnellstart kürzer (`sliceQuickStartForOnboarding`), User-Kurzüberblick mit Raum-Kapitel-Link; Fein: weitere Sortierung/Übersetzung, siehe [§ 1.3 — 5.x.2](#phase-5x) |
| **Phase 5.x.3** Mermaid | ✅ | **0.9.27:** Stufe 1 — `manualMermaidDiagram`; **0.9.28:** Stufe 2 — `autoMermaidHostGraph` (Host→Instanzen, Knotenlimit) |
| **System-Visitenkarte** / Forum-Copy | ✅ | `textSendTo` **getForumCard** + State `info.forumCardPlain`; Diagnose-HTML nutzt `forumCard.js` |
| **KI + Skript-Quellcode** | 🟡 | **A** umgesetzt (`aiAnalyzeScriptSources`); **B** weiterhin Phase 5 Backup |
| **npm + ioBroker.repositories** | ⬜ | Nach Adapter-Checker |
| **Dokumentations-Score** (Wartung — Checkliste mit echten Kriterien) | 🟡 | **0.9.22–0.9.23:** Setup-Checks + Konfig. **0.9.24:** einheitliche Benennung **Doku-Setup / documentation setup score**, Kapitel **Wartung & Dokumentations-Setup** vs. technische **Diagnose**; Hinweis wenn alle Checks aus; Quick-Start-Sortierung stabil. Skripte ohne `desc` nur Hinweis — [§ 1.6](#dokumentations-score-checkliste) |
| **Admin-Markdown: Diagnose-Kapitel** (inhaltliche Parität zu Admin-HTML) | *optional* | Heute kein Kapitel im `.md`-Export (`lib/markdownRenderer.js` → `case 'diagnosis': return ''`). **Optional** nachziehen: gleiche Befunde wie `lib/htmlRenderer.js` `renderDiagnosis` (z. B. Node, **Skripte ohne `desc`**, OS-Hinweis …), inkl. TOC wenn nicht versteckt — Details [§ 1.6](#admin-markdown-diagnose-optional) |
| **Admin-Konfig — Hilfen / Mini-Beispiele** (`manualMermaidDiagram`, JSON-Felder …) | *optional* | Entscheidung offen — [§ 1.7](#admin-config-hilfen-beispiele) |

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
| 3 | **Phase 5.x.2** Quick Start / Raumguides | 🟡 Kern in **0.9.20**; **0.9.26** Feintuning Gäste kürzer + User-Link zum Räume-Kapitel; optional mehr: [§ 1.3 — 5.x.2](#phase-5x) |
| 4 | **Phase 5.x.3** Mermaid (gestaffelt) | ✅ **Stufe 1** **0.9.27**; **Stufe 2** **0.9.28** (`autoMermaidHostGraph`): [§ 1.3 — 5.x.3](#phase-5x) |
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

- [ ] PDF-Export — Merker bei Umsetzung: [§ 1.2a](#phase-5-pdf-offline-mermaid)
- [ ] Backup-Anbindung (siehe [Backup / ioBroker.backitup](#backup-backitup-festlegung) — **tar.gz**, Pfad und/oder `sendTo` Backitup)
- [ ] Custom Templates — **Rest** (nach 0.9.17): ggf. **PDF**, Reihenfolge **User/Onboarding**, Drag-and-Drop — [PLAN.md — Custom Templates](PLAN.md#custom-templates-detail)

<a id="phase-5-pdf-offline-mermaid"></a>

#### 1.2a Merker: PDF, Druck, Offline & Mermaid *(Phase 5 — Festlegung getroffen, Umsetzung offen)*

> **Kontext:** Heute lädt **HTML** Mermaid **10.9.1** von **jsDelivr**, wenn ein Diagramm im Export liegt — **PDF**, **Druck** und **Offline-Kopien** ohne Netz zeigen dann **kein** gerendertes Diagramm, solange nur der Quelltext bzw. Client-Skript fehlt.

**Festlegung (abgestimmt mit [PLAN.md — Verbindliche Leitplanken (Schicht 2)](PLAN.md#verbindliche-leitplanken-schicht-2--beschlossen), Tabelle *Graphen / Mermaid*):**

- [x] **Einheitliche Pipeline für „fertige“ HTML-Artefakte:** Mermaid-Blöcke (kuratiert + Auto-Topologie) werden **bei der Generierung serverseitig in SVG** überführt und **ins HTML eingebettet** — **ohne** zwingende **externe** Mermaid-JS-Laufzeit für die Darstellung (vergleichbar QR: eingebettetes SVG). Damit sind **Druck**, **PDF aus demselben HTML** und **`file://`/NAS**-Kopien konsistent abbildbar.
- [x] **PDF:** Primär **aus dem generierten HTML** (nach SVG-Einbettung), z. B. **Headless-Browser** `page.pdf()` (Puppeteer/Playwright) oder dokumentierter **Browser-Workflow** „Drucken → PDF“. **Keine** separate, nur-PDF-eigene Mermaid-Render-Kette nötig.
- [x] **Markdown-Export:** vorerst **unverändert** **Mermaid-Quelltext** in Fences; optional später angleichen — wie in den Leitplanken beschrieben.

**Umsetzung (noch offen):**

- [x] **SVG-Rendering** bei Generierung über **`@mermaid-js/mermaid-cli`** (`lib/mermaidServerSvg.js`, optionalDependency) — pro `<pre class="mermaid">` in den drei HTML-Profilen; **light/dark** aus `htmlColorScheme` (**auto** → Default-Theme); ohne Paket bleibt **jsDelivr**-Mermaid wie bisher.

**Festgehalten (Installation / Laufzeit — 2026-05):**

- **`iobroker url …/tarball/dev`:** Erfolgreicher Lauf **Exit 0**; **`@mermaid-js/mermaid-cli`** zieht **transitives Puppeteer** nach — im npm-Log ggf. **Deprecation-Warnungen** (`puppeteer`, `uuid`): **normal**, kommt von der CLI, nicht von eigenen Adapter-`dependencies`. Aufräumen erst sinnvoll bei **Upgrade/Fork** der CLI oder gemeinsamer PDF-Puppeteer-Linie.
- **Chromium-Download** (z. B. unter **`…/.cache/puppeteer`**) beim ersten Install oder ersten mmdc-Lauf: **erwartet**; bestätigt, dass Headless für **SVG-Einbettung** verfügbar ist.
- **Node `package.exports`:** `require.resolve('@mermaid-js/mermaid-cli/package.json')` **scheitert** an den Exporten der CLI — der Adapter löst **`src/cli.js`** per **`node_modules`**-Pfad ab Adapter-Root (und Elternverzeichnissen bei Hoisting), siehe `resolveMmdcCliJs` in `lib/mermaidServerSvg.js`.

**Manuell testen (nach dev-Installation, mit installierter optionaler CLI):**

1. **Admin:** unter „Meine Dokumentation“ **`manualMermaidDiagram`** z. B. `flowchart LR\n  A-->B` eintragen; optional **`autoMermaidHostGraph`** aktivieren.
2. **Doku generieren** wie gewohnt (Button / Trigger im Adapter).
3. **Export-HTML** (Admin/User/Onboarding nach Bedarf) öffnen — **Quelltext:** bei funktionierendem mmdc **`<div class="mermaid-wrap mermaid-svg-embedded">`** mit eingebettetem **`<svg` …**; das ursprüngliche **`<pre class="mermaid">`** für diesen Inhalt **entfällt** (bleibt nur bei leerem Block, mmdc-Fehler oder wenn die CLI fehlt → jsDelivr-Fallback).
4. **Offline / `file://`:** gespeicherte HTML-Datei **ohne Internet** öffnen — Diagramm sollte **sichtbar** bleiben (statisches SVG), sobald es eingebettet wurde.
5. **`htmlColorScheme`:** **dark** vs. **light**/**auto** — Darstellung des Diagramms an **mmdc-Theme** **dark** vs. **default** prüfen.

- [ ] Bestehendes **Client-Mermaid** (jsDelivr) **entfernen oder nur noch Fallback**, wenn überall eingebettetes SVG genügt.
- [ ] **PDF:** Admin-Aktion und/oder Dateiausgabe `*.pdf` unter `/files/` bzw. `exportPath` — nach Festlegung oben.
- [ ] README + ggf. **io-package**-Hilfe: Abhängigkeit (Chromium?), RAM, Hinweis **Offline/PDF** gemäß dieser Festlegung.

<a id="phase-5x"></a>

### 1.3 Phase 5.x — Reihenfolge 1 → 2 → 3

#### 5.x.1 Notfall & Troubleshooting (Hybrid)

**Bereits da (abgrenzen):** manuelle Felder **„Help & emergencies“** / **„Routines in your own words“** / **„Playbook“** (`guestHelpNote`, `homeRoutinesNote`, `ownerPlaybookNote`, u. a. 0.9.9 / 0.9.25) — Freitext in Onboarding/User, keine erfundene Diagnose.

Noch offen (größere Ausbaustufe als reiner Freitext):

- [x] Strukturierter Block **über** reine Notizfelder hinaus: **Kurzzeilen** (WLAN/Strom/Wasser/Sonstiges) + **automatische Doku-Links** (User/Onboarding/Admin, gleiche Logik wie QR — **0.9.18**)
- [x] Kurze **Auto-Checklisten** nur bei **konkreten** Diagnose-Befunden (aktuell: **Node.js** wie Admin-Diagnose) + **Momentaufnahme-Hinweis** — **0.9.19** (`lib/diagnosisSnapshot.js`)

#### 5.x.2 Quick Start & Raumguides

- [x] `documentModel`: feste Blöcke (`docModel.quickStart` / `lib/quickStartGuide.js`)
- [x] Renderer Onboarding + User: strukturierte Listen + Raumkacheln (HTML) / übersichtliche Abschnitte (MD)
- [x] KI nur Formulierung, nicht alleinige Struktur (unverändert: keine KI-Strukturierung)
- [x] **0.9.26 (Feintuning):** „Gäste“ Onboarding: kürzerer Quick-Start-Schnitt (`sliceQuickStartForOnboarding`); User: Text + Link zum Räume-Kapitel (HTML + MD); weiteres optional laut Tabelle

**5.x.2 — Später (noch offen, kein Muss):**

| Thema | Mögliche Arbeit |
| ----- | --------------- |
| **Sortierung / Relevanz** | **0.9.23:** Schnellstart-Raumkarten nach **absteigender Gerätezahl**; Funktionsbereiche weiter nach Mitgliederzahl. **Optional später:** andere Gewichtung, Top-Skript-Kriterien, Admin-Caps. |
| **Länge Onboarding vs. User** | **0.9.26:** Gäste kürzer (Schnitt im Renderer); User volle Tiefe. Optional: weitere Caps oder Layout pro Profil. |
| **Konsistenz** | **0.9.26:** Link vom Kurzüberblick zum Räume-Kapitel (User). Optional: weitere doppelte Infos reduzieren. |

**Hinweis (Abschnittsreihenfolge):** **User-HTML** und **User-Markdown** nutzen dieselben Inhalte, aber **nicht** dieselbe Kapitelreihenfolge (z. B. manuelles Kapitel und Hilfe im HTML oben, im Markdown-Export erst nach System/Adaptern/Räumen/Skripten) — beabsichtigt, kein Fehler.

**Hinweis (Admin-UI-Sprache):** **Voll geprüft** (inhaltlich): **EN / DE / FR**. Für **es, it, nl, pl, pt, ru, uk, zh-cn** sind **alle** `jsonConfig`-Keys mit Text aus **`en.json`** hinterlegt, bis Muttersprachler nachziehen; falsche „Übersetzungen“ so vermeidbar. Beiträge: [`CONTRIBUTING.md` — Admin UI i18n](CONTRIBUTING.md#admin-ui-translations-i18n).

#### 5.x.3 Mermaid / kleine Graphen

- [x] Stufe 1: Mermaid aus **kuratiertem** Inhalt (`manualMermaidDiagram` → `manualContext.mermaidDiagram`, **0.9.27**)
- [x] Ausgabe **Markdown** (`mermaid` fence) + **HTML:** bei installierter CLI **eingebettetes SVG** (`mermaid-svg-embedded`); sonst **pre.mermaid** + Mermaid **10.9.1** von jsDelivr wenn Diagramm vorhanden
- [x] Stufe 2: optional kleiner **Auto-Graph** mit **hartem Knotenlimit** (Multihost Host → Instanzen, **0.9.28** `autoMermaidHostGraph` / `lib/autoHostTopologyMermaid.js`)
- [ ] Nicht Ziel: ungefilterter Gesamtgraph

<a id="nachzuege"></a>

### 1.4 Kleine Nachzüge / Trigger

- [x] **README-Changelog** + **io-package `news`:** Gäste-Onboarding **Skript-Datenschutz** (`onboardingGuestShowScriptNames`, `lib/guestScriptPrivacy.js`) und Schnellstart-Logik (**kein** Ersatz aus `common.desc`, wenn Skriptnamen in der Gäste-Ansicht verborgen sind) + **RENDERER_VERSION** — in **0.9.21** nachgezogen.
- [ ] **`io-package` news**, wenn **Default** `documentationStatesMode` auf **`metadata`** geändert wird (sinnvoll beim npm-Release; bei reiner Git-Installation optional)
- [x] **README-Changelog** + Version **0.9.11** um States/Hashes/Changelog-i18n ergänzt

<a id="todo-festlegt-umsetzung"></a>

### 1.5 Festgelegt — Umsetzung (Referenz)

Details: [PLAN — System-Visitenkarte](PLAN.md#system-visitenkarte-festlegung), [PLAN — KI + Skript](PLAN.md#ki-skript-festlegung).

- [x] **System-Visitenkarte:** **jsonConfig** `textSendTo` `getForumCard` (+ Copy); State `info.forumCardPlain`; gemeinsame Logik `lib/forumCard.js`
- [x] **KI + Skriptquellcode:** **Variante A** — `aiAnalyzeScriptSources`, Zeilen-Redaktion, User/Onboarding HTML + Markdown; **Variante B** → Phase 5 Backup / [Backup-Backitup](#backup-backitup-festlegung) (offen)

<a id="dokumentations-score-checkliste"></a>

### 1.6 Dokumentations-Score (Wartung) — Checkliste ausbauen

> **Stand 0.9.24:** Benennung und Erläuterungen auf **Doku-Setup (Meta)** ausgerichtet (Export + Admin); separates Kapitel **Diagnose** unverändert.

- [ ] **Zielbild festlegen (Feinarbeit):** Produkt-/Admin-Bezeichnung ggf. „Doku-Setup-Score“ o. ä., sobald der Fokus **Meta** für alle klar ist — fachlich vorerst durch **`scoreDesc`** (EN/DE/FR) und Checklisten-Logik abgedeckt.
- [x] **Umgesetzt (0.9.22) — Score-Kriterien:** Projektbeschreibung (Manual) **≥ 40** Zeichen; **Basis-URL** (Advanced) nicht leer; **Instanzen ohne Raum** mit Schwelle **&lt; 10** (`rooms.unassignedCount`). Renderer HTML + Markdown; i18n EN/DE/FR.
- [x] **Erweiterung 0.9.23:** Pro Check **`maintenanceScoreCheck*`** (Default an), **`maintenanceScoreMinDescriptionChars`**, **`maintenanceScoreUnassignedWarnAt`**; Prozent nur über **aktive** Zeilen.
- [x] **Klarstellung 0.9.24:** Kapitel-/Label-Texte **Wartung & Dokumentations-Setup** vs. **Diagnose**; **`maintenanceChecklistDisabled`** wenn alle Checks aus; Quick-Start **Raum-Sortierung** bei Gleichstand; KI-Owner-Kontext **`Documentation setup score`**.
- [x] **Umgesetzt — ohne Score:** Liste **`scriptsWithoutDescription`** (nur Info); **Admin-Diagnose** HTML erwähnt die Anzahl.
- [x] **Explizit nicht** im Score: **deaktivierte Instanzen** (weiter Inventar-only). **`common.desc`** / fehlende Skript-Beschreibung nie score-wirksam.
- [x] **UI/Logik (Kern):** jsonConfig + `native` für Abschalten/Schwellen — siehe **Erweitert** im Admin.

<a id="admin-markdown-diagnose-optional"></a>

- [ ] *(optional — Backlog, nicht priorisiert)* **Admin-Markdown: Diagnose-Kapitel** analog zu **Admin-HTML** ausgeben. Aktuell: **`case 'diagnosis': return ''`** in `lib/markdownRenderer.js` — das Kapitel erscheint **nicht** in der `.md`. **Wenn** gewünscht: z. B. `renderDiagnosisMarkdown(docModel)` mit inhaltlicher **Parität** zu `lib/htmlRenderer.js` `renderDiagnosis` (Scan-Status, Node-Befund, Hinweis **aktive Skripte ohne `common.desc`**, OS-Hinweis, Forum-Karte o. ä.) und **TOC**-Zeile ergänzen, solange das Kapitel nicht per Admin versteckt ist.

<a id="admin-config-hilfen-beispiele"></a>

### 1.7 Admin-Konfig — Hilfen / Mini-Beispiele *(optional)*

> **Merker:** Bessere Orientierung bei komplexeren Feldern, **ohne** Demo-Inhalt in Exporten durch `native`-**`default`** (der wäre echter gespeicherter Text).

- [ ] Abwägen und ggf. umsetzen:
  - **Mermaid** (`manualMermaidDiagram`): ergänzend zu `help` ggf. **UI-`placeholder`** (falls jsonConfig/Textfeld in Admin unterstützt) oder gekürzte **Beispielzeilen** nur in Hilfe-/Panel-Text (**EN/DE/FR**),
  - **JSON-Konfig** (`customDocSectionsJson`, versteckte Kapitel, Kapitelreihenfolge, …): Mini-Schema oder Link auf README-/Doku-Stelle — **nicht** ein großes Array als **`default`** in `io-package` `native`, das ungeprüft exportiert wirkt.

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
