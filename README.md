![Logo](admin/autodoc.png)

# ioBroker.autodoc

Automatically generates structured documentation (HTML, Markdown, JSON) for your ioBroker installation — on demand, on a schedule, or when the system changes.

**Version:** 0.9.39

**Installation**

1. Open **[ioBroker Admin](https://www.iobroker.net/#en/documentation)** and install **`iobroker.autodoc`** (see the [npm package](https://www.npmjs.com/package/iobroker.autodoc); current **0.9.39**).
2. Optional: clone or install from **[GitHub](https://github.com/crunchip77/ioBroker.autodoc)**.
3. Official adapter index: **[ioBroker.repositories](https://github.com/ioBroker/ioBroker.repositories)** (**latest**). Maintainer workflow / PR: **[TODO — § 1.1 Release](TODO.md#release-veroeffentlichung)**.

| | |
| --- | --- |
| **Repository** | [github.com/crunchip77/ioBroker.autodoc](https://github.com/crunchip77/ioBroker.autodoc) |
| **Issues** | [GitHub Issues](https://github.com/crunchip77/ioBroker.autodoc/issues) |

**CI:** ![Test and Release](https://github.com/crunchip77/ioBroker.autodoc/workflows/Test%20and%20Release/badge.svg)

## Description

The adapter scans adapters, hosts, rooms, functions, scripts, aliases, userdata, and related metadata, then writes **three profiles** in one run:

| Profile | Audience | Focus |
| --- | --- | --- |
| **Admin** | Operators | Instances, hosts, resources, scripts, maintenance hints, diagnosis |
| **User** | Household | Rooms, devices, automations in plain language |
| **Onboarding** | Guests | Welcome, capabilities, QR / link to the latest HTML |

Exports are written under `/files/autodoc.<instance>/` (latest HTML + rotated timestamped `.md` / `.html` / `.json`). Optional notifications and **opt-in AI** text (separate providers) can enrich the docs.

## Requirements

- **Node.js** ≥ 22 (see `package.json` → `engines`)
- **ioBroker.js-controller** ≥ 6.0.11 (declared in `io-package.json` → `common.dependencies`)
- **ioBroker Admin** ≥ 7.6.20 (declared in `io-package.json` → `common.globalDependencies`) — needed for the **json** configuration UI and `jsonConfig` features (e.g. `textSendTo`, collapsible panels)

No other adapters are **required** for AutoDoc itself. Optional: a **web server** adapter if you want to open generated files from outside the Admin file browser; exports are always available under `/files/autodoc.<instance>/`. **PDF** profiles need the optional npm package **`puppeteer`** (bundled Chromium) installed in the adapter directory — see **Optional PDF export** below.

## Configuration

### Documentation instance overview

Configure the instance in **ioBroker Admin** (tabs for basics, manual notes, advanced options, notifications, AI). Generation can be triggered manually, on startup, on a timer, and after adapter changes (debounced).

**Documentation language** (Basic settings) drives headings and fixed wording in **all HTML profiles** and in Markdown. It also controls the **short summary lines** for inventory comparison (“changes since last run”) and for **changelog** cards when you regenerate — older stored changelog rows are shown in the **current** export language, not the language they had when saved.

In **Advanced → What to include & limits**, **Hide “changes since last run” in Admin exports** removes only the yellow delta box at the top of the **Admin** HTML system chapter and the matching subsection in **Admin** Markdown. The **Changelog** chapter, **User**, and **Onboarding** exports are not affected.

The **User / Family** profile adds a brief everyday sentence after the title block when AutoDoc found **at least one** inventory change since the previous snapshot (skipped on the first run and when nothing changed). **Onboarding** does not include that extra notice.

Short **orientation** for operators (install paths, tabs, exports, hashes, checker): **[`docs/user-guide/README.md`](docs/user-guide/README.md)** · **German** config wiki (tabs, screenshots, demo scenario): **[`docs/user-guide/README.de.md`](docs/user-guide/README.de.md)**.

Useful **states** (selection): `action.generate`; **`action.exportPdf`** (writes **PDF** profiles from the latest HTML under `/files` when optional **`puppeteer`** is installed in the adapter directory — no full regeneration); `info.lastGeneration` / `info.nextGeneration`; `info.htmlUrlAdmin` / `info.htmlUrlUser` / `info.htmlUrlOnboarding`; `info.templateVersion` (HTML template / renderer alignment); `info.forumCardPlain` (plaintext “system card” for forums, updated when documentation is generated).

**Exports & storage:** after each successful run, **`documentation.exportHashes`** holds **SHA-256 (hex)** for the latest MD / JSON / Admin HTML served from `/files`, and **merges digests for `autodoc-{admin,user,onboarding}.pdf`** whenever a PDF export step wrote those files. Canonical full Markdown, JSON model, and Admin HTML live **only** under **`/files/`** (`autodoc-latest.*`, profile HTML). The states **`documentation.markdown`**, **`documentation.html`**, and **`documentation.json`** hold **short placeholders** only — use **`info.htmlUrl*`**, **`/files/`**, or download actions for full text.

### Media, Redis, and state storage (short)

- **Canonical exports** always live under **`/files/autodoc.<instance>/`** and are **overwritten** each run (no accumulation of old HTML versions there).
- **`documentation.*` body states** are **placeholders only** (large payloads are not duplicated in the object database). Scripts and integrations that need **full text** read **`/files/`** or use **`info.htmlUrl*`** / download actions.
- **Photos and large binaries:** do **not** store big images or blobs as **large state values** in ioBroker’s **object database** — **especially with Redis** (binary payloads inflate RAM). Use **external URLs** (your NAS, HTTP server) or small **inline SVG** diagrams; the same guideline keeps **jsonl** setups predictable. AutoDoc keeps **full** Markdown/HTML/JSON under **`/files/`**; **`documentation.markdown`**, **`documentation.html`**, and **`documentation.json`** are **short placeholders** only — not a media store.
- Rationale, options, and future media work: [`PLAN.md` — Media (MVP) & limits](PLAN.md#architektur-medien-mvp) and [Architecture boundaries](PLAN.md#architektur-grenzen).

### Public base URL

The **Onboarding** HTML includes a QR code and a **Copy link** control. Both use the same target: the onboarding file under `/files/autodoc.<instance>/autodoc-onboarding.html`, prefixed with the **ioBroker base URL** from the adapter settings (**Advanced** tab: *ioBroker base URL (optional)*).

- Set the base URL to what you use in the browser to reach ioBroker (scheme, host, port if needed), **without** a trailing slash. Examples: `https://home.example.com:8081`, `http://192.168.1.10:8081`.
- If it is **empty or wrong**, guests scanning the QR code or using the copied link from another device may get a broken or internal-only URL. After changing it, run documentation generation again so the HTML is rebuilt.

### Optional filesystem export (Docker / NAS)

**Filesystem export path** writes the three HTML profiles to a real directory (in addition to ioBroker’s `/files/…` storage). In **Docker**, map a host folder into the container and set **export path** to the **container-side** path (not the Unraid/host path). See the field help in Admin for a short reminder.

### Optional PDF export (Puppeteer)

**Best effort:** after a successful documentation run, you can create **`autodoc-admin.pdf`**, **`autodoc-user.pdf`**, and **`autodoc-onboarding.pdf`** from the same HTML that is stored under `/files/` (headless Chromium via **`puppeteer`**, declared as an **optional** npm dependency — same major line as **`@mermaid-js/mermaid-cli`**). Enable **Generate PDF after each documentation run** in **Advanced** next to the filesystem export, or trigger **`action.exportPdf`** manually. PDFs are written under **`/files/autodoc.<instance>/`** and mirrored to **Filesystem export path** when that path is set. **Embedded Mermaid SVG** (when mmdc ran during generation) prints without extra network; **jsDelivr** client Mermaid still needs internet during the PDF step. Without a working Chromium stack, PDF creation is skipped with a clear log line — HTML/Markdown generation is unaffected.

### AI context hints (guest vs resident)

**AI context hints** are injected only into the LLM prompt; they are **not** printed in the documentation. For **guest onboarding**, prefer everyday facts. Heavy IT or project wording (adapters, repos, …) can cause the model to leak jargon into guest text; a **safety step** then replaces that AI block with neutral guest wording. That is intentional. The **resident / family** profile does not use the same guest-only restriction. Configure them in Admin under **KI documentation / AI documentation** (after enabling a provider); full wording appears in the hint above the field.

Copy-paste **examples** (field IDs, syntax): [**Mermaid**](#mermaid-cookbook-examples) · [**JSON arrays**](#json-cookbook-snippets) · [**Custom CSS**](#html-custom-css-examples). **Stable URLs** for bookmarks / Admin `staticLink`: **`blob/dev/README.md#L…`** (line highlights). GitHub’s Markdown **blob** view often ignores or rewrites heading fragments (`#mermaid-cookbook-examples`, …). The **repository landing page** with a fragment — e.g. `https://github.com/crunchip77/ioBroker.autodoc#json-cookbook-snippets` — **does not** reliably jump to a README heading; open **`blob/dev/README.md#L131`** (JSON cookbook) instead. Line numbers refer to **this README on branch `dev`** (same branch as those URLs until docs are merged to **`main`**) — refresh `#L…` in `admin/jsonConfig.json` / wiki after large edits above those headings; **switch URLs back to `blob/main`** once **`main`** matches.

`https://github.com/crunchip77/ioBroker.autodoc/blob/dev/README.md#L44`

`https://github.com/crunchip77/ioBroker.autodoc/blob/dev/README.md#L67`

`https://github.com/crunchip77/ioBroker.autodoc/blob/dev/README.md#L78`

`https://github.com/crunchip77/ioBroker.autodoc/blob/dev/README.md#L100`

`https://github.com/crunchip77/ioBroker.autodoc/blob/dev/README.md#L131`

`https://github.com/crunchip77/ioBroker.autodoc/blob/dev/README.md#L186`

### Mermaid cookbook examples

Paste into **My documentation → Mermaid diagram** (`manualMermaidDiagram`). Use **plain line breaks** inside the field (no HTML). Prefer **`flowchart LR`** so wide diagrams fit the HTML page; very large graphs are hard to read — split concepts across separate diagrams if needed.

**Embedded SVG:** when **`@mermaid-js/mermaid-cli`** is installed in the adapter directory and generation succeeds, diagrams become inline SVG in HTML (good for offline / PDF). If embedding fails or the CLI is missing, the export keeps a `<pre class="mermaid">` block and the browser may load Mermaid from jsDelivr — see **Optional PDF export** and **`docs/user-guide`** (“Optional Mermaid CLI”).

Minimal left-to-right overview:

```text
flowchart LR
  Internet([Internet]) --> Router[Router]
  Router --> ioB(ioBroker host)
  ioB --> Heating[Heating adapters]
  ioB --> Lights[Lights / rooms]
```

Small **subgraph** (group related nodes):

```text
flowchart LR
  subgraph LAN["Home LAN"]
    A[js-controller] --> B[javascript.0]
    A --> C[other instances]
  end
```

**Tips**

- Stick to **supported Mermaid** constructs you have seen working elsewhere; exotic directives may break `mmdc`.
- **Auto host topology** is separate (`autoMermaidHostGraph`); hide it with chapter id **`mermaidAuto`** in the Admin hide list, **`mermaid`** for this manual diagram only (`lib/docTemplateConfig.js`).

### JSON cookbook snippets

Admin stores these fields as **strings**; content must be **valid JSON** (`"` keys/strings, no trailing commas). Empty roster means defaults: use **`[]`** where you do not want to override order or hide anything.

**Allowed chapter ids** come from the adapter (`lib/docTemplateConfig.js`):

| Profile | Order fields | Hidden fields | Notes |
| --- | --- | --- | --- |
| Admin | `adminChapterOrderJson` | `adminHiddenChaptersJson` | Order default: `manual`, `system`, `adapters`, `rooms`, `scripts`, `schedule`, `userdata`, `aliases`, `maintenance`, `diagnosis`, `troubleshooting`, `custom`, `changelog`, `appendices`. Extra hide-only ids: **`mermaid`**, **`mermaidAuto`**. |
| User | `userChapterOrderJson` | `userHiddenChaptersJson` | Keys include `manual`, `ai`, `guestHelp`, `atAGlance`, `rooms`, `scripts`, `routines`, `ownerPlaybook`, `mermaid`, `adapters`, `custom`, `system`, `troubleshooting`. |
| Onboarding | `onboardingChapterOrderJson` | `onboardingHiddenChaptersJson` | Keys include `welcome`, `quickstart`, `tips`, `guestHelp`, `stats`, `ai`, `capabilities`, `mermaid`, `rooms`, `routines`, `ownerPlaybook`, `automations`, `adapters`, `custom`, `hint`, `system`, `manual`. |

**Reorder Admin** — put system overview directly after manual context:

```json
["manual", "system", "adapters", "rooms", "scripts", "schedule", "userdata", "aliases", "maintenance", "diagnosis", "troubleshooting", "custom", "changelog", "appendices"]
```

**Hide** Admin changelog and appendices:

```json
["changelog", "appendices"]
```

**Hide User scripts chapter:**

```json
["scripts"]
```

**Reorder User** — bring **`system`** up after rooms (full key list, same ids as default order otherwise):

```json
["manual", "guestHelp", "ai", "atAGlance", "rooms", "system", "scripts", "routines", "ownerPlaybook", "mermaid", "adapters", "custom", "troubleshooting"]
```

**Custom Markdown chapters** (`customDocSectionsJson`) — array of objects with **`title`**, **`body`** (or **`bodyMarkdown`**), optional **`profiles`** (`"admin"` | `"user"` | `"onboarding"`). Omit **`profiles`** to show in **all** profiles.

```json
[
  {
    "title": "Emergency contacts",
    "body": "## Numbers\n- **Repair:** …\n- **Utility:** …",
    "profiles": ["user", "onboarding"]
  },
  {
    "title": "Operator notes",
    "body": "## Rack layout\nShort **Markdown** only; keep secrets out.",
    "profiles": ["admin"]
  }
]
```

Max **12** sections; very long bodies are truncated at generation time.

### HTML custom CSS examples

Under **Admin → HTML export & extra sections**, **Font stack** (`htmlFontStack`) and **Extra CSS** (`htmlExtraCss`) tweak only the **exported HTML** (not Markdown). The renderer wraps pages in `lib/htmlRenderer.js` (`wrapPage`): sidebar links live under **`nav ul li a`**, layout uses **`#layout`**, **`nav`**, and **`main`** — inspect generated HTML if you need a selector.

**Font stack:** one CSS `font-family` list (risky characters `< > { }` are stripped). Example paste:

```css
"Source Serif 4", Georgia, serif
```

**Extra CSS:** append short rules after the built-in stylesheet. Prefer **existing palette tokens** (`var(--link)`, `var(--nav-bg)`, `var(--border)`, `var(--surface)`, … from the `:root` / `body.dark` blocks); **`htmlThemePreset`** swaps those via `html.autodoc-preset-*` classes — there is no separate `--accent` token on `:root` (some components use `var(--accent, #0066cc)` as a **local** fallback only).

Starter snippet you can paste into **Extra CSS**:

```css
nav { width: 260px; }
nav ul li a:hover { opacity: 0.92; }
h2 { border-bottom-color: var(--link); }
```

## Features (overview)

- Discovery across instances, hosts, enums, scripts, aliases, userdata, system config
- Standalone HTML per profile with search, dark mode, responsive layout
- Markdown + JSON export and version history (rotation configurable)
- Maintenance-oriented hints (documentation score for open checklist items; disabled instances listed as inventory, not penalized)
- Multilingual Admin UI strings (EN / DE / FR full; more locales with English copy until translated — [CONTRIBUTING](CONTRIBUTING.md#admin-ui-translations-i18n)); generated documentation text follows **Documentation language**, including changelog/compare summary lines and optional inventory-change notices in User exports
- Optional AI providers (e.g. Ollama, Groq, Anthropic) with strict opt-in

For **roadmap and planning**: [`TODO.md`](TODO.md) (open work at the top, full completed checklists in the appendix) and [`PLAN.md`](PLAN.md) (vision, rationale, architecture brainstorming).

**Contributing / releases:** see [`CONTRIBUTING.md`](CONTRIBUTING.md).

## Changelog

**Admin `common.news`** in `io-package.json` lists only versions **published on npm** (Adapter Checker **E2004**). The detailed sections below are the **user-facing** changelog (Git-era releases plus npm); older entries are in [`CHANGELOG_OLD.md`](CHANGELOG_OLD.md).

### **WORK IN PROGRESS** (`dev` — vor Merge/`npm run release` ggf. einkürzen)

- **Inventar-Delta & Sprache:** **Documentation language** (Basic) steuert auch die **einzeiligen** Texte für **gespeicherte Changelog-Einträge** und für den Hinweis **„changes since last run“** beim Export. **`hideAdminDeltaSinceLastRun`** (Advanced → *What to include & limits*) blendet die gelbe **Admin**-Delta-Box und den gleichen Unterabschnitt im **Admin-Markdown** aus — **Changelog chapter**, User, and Onboarding are unchanged.
- **User / Family:** When AutoDoc detects **real inventory changes** since the last snapshot (not the first run), exports add a short **plain-language** notice (HTML + Markdown). **Onboarding** does not show this block.
- **Docs — cookbook:** README sections [**Mermaid cookbook examples**](#mermaid-cookbook-examples), [**JSON cookbook snippets**](#json-cookbook-snippets), and [**HTML custom CSS**](#html-custom-css-examples); user-guide cross-links in **`docs/user-guide/README(.de).md`**.
- **Docs — DE user-guide:** `README.de.md` auf **Wiki-Fokus** (Tabs, Screenshots, Exporte, Übungsszenario) umgebaut; Installations-/Maintainer-Abschnitte entfernt; Verweise im Haupt-README und bei **Custom sections**-Hilfe (Admin-i18n) angepasst.

- **Export-Copy / Klarheit (Admin-HTML + Admin-Markdown):** Kapitel **Betrieb – Referenz** (ehem. Troubleshooting-Konnotation) mit Top-Disclaimer; **Diagnose** mit Schnappschuss-Einleitung, **Automatische Prüfungen** (Node-Heuristik) und separatem Block **Allgemeine Erinnerungen** (OS).
- **Nutzbarkeit (dev):** **Erweitert** zeigt vor der **ioBroker-Basis-URL** einen kurzen Hinweis (Gäste/QR, Docker/Proxy). **Onboarding-Kapitelreihenfolge:** Hilfe erklärt **`quickstart`** (immer Zähler + nächste Schritte) vs. **Discovery-Snapshot** (nur mit Daten); vgl. **`PLAN.md`** „Adapter sinnvoll einsetzen“.
- **Phase 5.x.2 (dev):** Quick-Start-Skripte — Länge `desc`, Tie-Break `triggerType`.
- **Admin §1.7:** User-Kapitelreihenfolge, Onboarding-Kapitelreihenfolge, Base-URL-Callout (Hilfen).
- **Release prep:** Vor **`npm run release`** WIP hier aufräumen (`CONTRIBUTING.md`). **ioBroker.repositories** nach neuen npm-Versionen — **[`TODO.md` § 1.1](TODO.md#release-veroeffentlichung)** · **`PLAN.md`**.

- **Storage (breaking):** Removed the Admin option **Documentation in States** / **`documentationStatesMode`**. Large exports **always** live under **`/files/`**; **`documentation.markdown`**, **`documentation.html`**, and **`documentation.json`** are **always** placeholders. **`documentation.exportHashes`** unchanged. Integrations that read full text from those states must use **`/files/`**, **`info.htmlUrl*`**, or download actions (`common.news`).

### 0.9.38 (2026-05-12)

- **Advanced — storage default:** **`documentationStatesMode`** default for **new** instances is now **`metadata`** (full HTML/Markdown/JSON in **`/files/`** only; `documentation.*` states are placeholders). Lowers object-database load for typical installs (e.g. Redis). **Existing** instances keep their saved value until you change **Dokumentation in States** in Admin. Scripts that relied on full text in states should use **`/files/`** paths or download actions (`common.news` + Admin help).
- **Rationale:** Sobald **autodoc** in **ioBroker.repositories** **latest** steht (nach Merge des Listeneintrags), sollen neue Installationen nicht still **full**-States für alle erzwingen — der Default **`metadata`** ist darauf ausgerichtet.
- **Superseded by 0.9.39:** the **`documentationStatesMode`** setting and **`full`** duplication in **`documentation.*`** states are **removed** — see **0.9.39**.

### 0.9.37 (2026-05-10)

- **Tooling:** `runPdfExport` initializes the PDF digest map with a typed empty collection so **`npm run check`** (TypeScript) passes; no change to PDF export behavior.
- **Docs:** Adapter-neutral **[`docs/iobroker-adapter-references.md`](docs/iobroker-adapter-references.md)** linked from **`TODO.md`**, **`CONTRIBUTING.md`**, and the Cursor project rule; **`PLAN.md`** phase **5.x.1** aligned with **`TODO.md`** (MVP complete).
- **Distribution (follow-up):** **ioBroker.repositories** — PR **`autodoc` → latest** eingereicht (**Merge ausstehend**); danach Eintrag in der **Standard-Adapterliste** neben **npm** und Git‑URL (siehe [TODO § 1.1](TODO.md#release-veroeffentlichung)).

### 0.9.36 (2026-05-09)

- **npm / Checker:** tarball **0.9.36** matches **`main`**: **`common.news`** lists only npm-published versions (fixes **E2004** stale metadata from first **0.9.35** publish). README **Version:** line synced; no adapter runtime/UI changes.

### 0.9.35 (2026-05-08)

- **npm:** publish **`iobroker.autodoc`** on the public registry so hosts can `npm install` the adapter tarball without cloning.
- **README:** install table reflects **npm** plus Git; default-list installs still depended on **ioBroker.repositories** (unchanged at that release).

### 0.9.34 (2026-05-08)

- **`documentation.exportHashes`:** after a successful PDF step, **SHA-256** entries for **`autodoc-admin.pdf`**, **`autodoc-user.pdf`**, **`autodoc-onboarding.pdf`** are merged into the same state (generation with **`pdfExportAfterGeneration`** or manual **`action.exportPdf`**).
- **Mermaid / HTML:** jsDelivr **`mermaid.min.js`** is injected **only** when the page still contains **`<pre class="mermaid">`** (fully SVG-embedded exports skip the CDN). `RENDERER_VERSION` **2026.05.08.1**.
- **Admin:** **`Doc layout pdf hint`** on tab **HTML export & extra sections**; **export-hashes** help text mentions PDF digests; **`manualMermaidDiagram`** help clarified.
- **Quick Start:** scripts-with-description lines are ordered **by name** for stable output.
- **`docs/user-guide`:** tab overview, **exportHashes**/Mermaid wording; **SCREENSHOTS.md** + eingebettete **PNG-Screenshots** für alle sechs Konfig-Tabs (neben den SVG-Wireframes), Hinweise Lesbarkeit/GitHub-Vorschau.

## License

MIT License

<!-- Maintainer: passage URLs use README.md lines L44 · L67 · L78 · L100 · L131 · L186 ; README.de.md L189 · L193 — sync admin/jsonConfig staticLink hrefs if headings move. Doc blob branch: **dev** in jsonConfig until README/wiki merged to **main** (then set DOC_BRANCH in scripts/apply-readme-line-anchors.js and replace blob/dev → blob/main). -->

Copyright (c) 2026 crunchip77 <41550245+crunchip77@users.noreply.github.com>
