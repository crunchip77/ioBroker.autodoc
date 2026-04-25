![Logo](admin/autodoc.png)

# ioBroker.autodoc

Automatically generates structured documentation (HTML, Markdown, JSON) for your ioBroker installation — on demand, on a schedule, or when the system changes.

**Version:** 0.9.17

| | |
| --- | --- |
| **Install** | [ioBroker Admin](https://www.iobroker.net/#en/documentation) — from this **Git** repository (URL / clone) while there is **no** [npm](https://www.npmjs.com/package/iobroker.autodoc) release yet; a default list install follows **npm** + [ioBroker.repositories](https://github.com/ioBroker/ioBroker.repositories) (see [TODO — release](TODO.md#release-veroeffentlichung)). |
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

No other adapters are **required** for AutoDoc itself. Optional: a **web server** adapter if you want to open generated files from outside the Admin file browser; exports are always available under `/files/autodoc.<instance>/`.

## Configuration

Configure the instance in **ioBroker Admin** (tabs for basics, manual notes, advanced options, notifications, AI). Generation can be triggered manually, on startup, on a timer, and after adapter changes (debounced).

Useful **states** (selection): `action.generate`; `info.lastGeneration` / `info.nextGeneration`; `info.htmlUrlAdmin` / `info.htmlUrlUser` / `info.htmlUrlOnboarding`; `info.templateVersion` (HTML template / renderer alignment); `info.forumCardPlain` (plaintext “system card” for forums, updated when documentation is generated).

**Exports & storage:** after each successful run, **`documentation.exportHashes`** holds **SHA-256 (hex)** for the latest MD / JSON / Admin HTML served from `/files`. In Admin **Advanced**, **Documentation states storage** is **`full`** (defaults; last bodies in `documentation.*`) or **`metadata`** (lightweight states; canonical files remain under `/files`).

### Media, Redis, and state storage (short)

- **Canonical exports** always live under **`/files/autodoc.<instance>/`** and are **overwritten** each run (no accumulation of old HTML versions there).
- If the **object / Redis** database should stay small, prefer **`metadata`** for documentation states (see **Exports & storage** above): scripts and integrations that need **full text** should read **`/files/`** or use **`info.htmlUrl*`** / download actions.
- **Photos and large binaries:** do **not** rely on storing big images in ioBroker’s virtual file storage — **especially with Redis** (binary blobs inflate RAM). Use **external URLs** (your NAS, HTTP server) or small **inline SVG** diagrams; the same guideline keeps **jsonl** setups predictable.
- Rationale, options, and future media work: [`PLAN.md` — Media (MVP) & limits](PLAN.md#architektur-medien-mvp) and [Architecture boundaries](PLAN.md#architektur-grenzen).

### Public base URL (QR code and “Copy link”)

The **Onboarding** HTML includes a QR code and a **Copy link** control. Both use the same target: the onboarding file under `/files/autodoc.<instance>/autodoc-onboarding.html`, prefixed with the **ioBroker base URL** from the adapter settings (**Advanced** tab: *ioBroker base URL (optional)*).

- Set the base URL to what you use in the browser to reach ioBroker (scheme, host, port if needed), **without** a trailing slash. Examples: `https://home.example.com:8081`, `http://192.168.1.10:8081`.
- If it is **empty or wrong**, guests scanning the QR code or using the copied link from another device may get a broken or internal-only URL. After changing it, run documentation generation again so the HTML is rebuilt.

### Optional filesystem export (Docker / NAS)

**Filesystem export path** writes the three HTML profiles to a real directory (in addition to ioBroker’s `/files/…` storage). In **Docker**, map a host folder into the container and set **export path** to the **container-side** path (not the Unraid/host path). See the field help in Admin for a short reminder.

### AI context hints (guest vs resident)

**AI context hints** are injected only into the LLM prompt; they are **not** printed in the documentation. For **guest onboarding**, prefer everyday facts. Heavy IT or project wording (adapters, repos, …) can cause the model to leak jargon into guest text; a **safety step** then replaces that AI block with neutral guest wording. That is intentional. The **resident / family** profile does not use the same guest-only restriction. Full wording appears in the Admin UI hint next to the field.

## Features (overview)

- Discovery across instances, hosts, enums, scripts, aliases, userdata, system config
- Standalone HTML per profile with search, dark mode, responsive layout
- Markdown + JSON export and version history (rotation configurable)
- Maintenance-oriented hints (documentation score for open checklist items; disabled instances listed as inventory, not penalized)
- Multilingual Admin UI strings (e.g. EN / DE / FR); generated copy follows your configured project language where applicable
- Optional AI providers (e.g. Ollama, Groq, Anthropic) with strict opt-in

For **roadmap and planning**: [`TODO.md`](TODO.md) (open work at the top, full completed checklists in the appendix) and [`PLAN.md`](PLAN.md) (vision, rationale, architecture brainstorming).

**Contributing / releases:** see [`CONTRIBUTING.md`](CONTRIBUTING.md).

## Changelog

### 0.9.17 (2026-04-25)

- **HTML export:** **Color presets** (`htmlThemePreset`: default, high contrast, warm, slate) — built-in **CSS variable** palettes for light/dark without writing base CSS; optional **font** / **extra CSS** unchanged.
- **Admin — chapter order:** optional JSON `adminChapterOrderJson` (merged with the default id list) — **Admin** HTML **sidebar and chapter body** follow the order; **Admin profile Markdown** **table of contents and body** match. **Hiding** chapters unchanged (`adminHiddenChaptersJson`).
- **io-package** / **jsonConfig** / **i18n** (EN, DE, FR) for the new fields; `RENDERER_VERSION` updated.
- **Admin i18n:** **Full list of valid admin chapter ids** in the help for chapter order and hide fields (EN/DE/FR); **DE** preset label for slate is **Slate** (technical id: `slate`).

**Also on `dev` before this release (documented here in one place):**

- **Admin HTML:** Long sections are **collapsed by default** (script folders, state references, shared states, userdata, aliases) with short summary lines; page scroll is shorter until you expand.
- **Admin HTML:** Sidebar **table of contents** lists **State references** and **Shared states** as sub-items under **Scripts** when those sections exist (jump targets `#state-references`, `#shared-states`).
- **Markdown export (Admin profile):** **`<details>`** blocks for script folders, state-reference table, shared-state table, **userdata**, and **aliases**; TOC sub-links under Scripts; **userdata** / **aliases** chapters; stable anchors. Viewers that support HTML in Markdown (e.g. GitHub) show collapsible sections.
- **Maintenance:** Documentation **score** no longer drops because of **disabled adapter instances**; disabled instances stay listed; diagnosis no longer flags them as findings.

### 0.9.13 (2026-04-21)

- **Admin:** `common.messagebox: true` in `io-package.json` — required so **js-controller** delivers **jsonConfig** `textSendTo` messages (`getStatus`, `getForumCard`). Without it, the **Basic** tab fields “Last generated” / “Forum system card” may not appear or work; check the log for *messagebox not enabled*.

### 0.9.12 (2026-04-21)

- **Admin — Forum system card:** **Basic** tab: readonly field + copy — loads plaintext via `sendTo` command `getForumCard` (same text as the diagnosis “Copy for Forum” block, language-aware). State **`info.forumCardPlain`** stores the last generated card.
- **AI — script source (opt-in):** **`aiAnalyzeScriptSources`** sends **sanitized** JavaScript (lines matching common secret patterns redacted) to the configured provider; **User** and **Onboarding** HTML/Markdown show short per-script explanations and an optional **automation overview** paragraph when several scripts are summarized.

### 0.9.11 (2026-04-20)

- **Advanced — Documentation states storage:** **`full`** (default: last MD / Admin HTML / JSON also in `documentation.*` states, as before) or **`metadata`** (full exports only under `/files` as `autodoc-latest.*` / profile HTML; large `documentation.*` states hold short placeholders — less load on object DB / **Redis**). Scripts that read `documentation.*` as full text must use **`/files/`** or **`info.htmlUrl*`** when using metadata mode.
- **State `documentation.exportHashes`:** JSON with **SHA-256 (hex)** for `autodoc-latest.md`, `autodoc-latest.json`, `autodoc-admin.html` (change detection without loading large payloads).
- **Download actions** (`autodoc.md` / `.json` / `.html`): content is read preferentially from the latest adapter files; legacy full-state fallback only if needed.
- **HTML changelog:** lines for **adapter instance version** changes; **i18n** strings for changelog types (including EN / DE / FR).
- **Docs:** `README` / `TODO.md` / `PLAN.md` reorganized for open vs. completed work (no functional change).

### 0.9.10 (2026-04-19)

- **Admin — HTML export & extra sections:** optional **color scheme** (auto / light / dark), **logo URL**, **font stack** and **extra CSS** in a **collapsible “advanced” block** (jsonConfig schema-safe for ioBroker.admin).
- **Chapter visibility:** JSON lists to hide chapters per profile (**admin** / **user** / **onboarding**); optional **`custom`** id hides the custom-sections block.
- **Custom Markdown chapters:** `customDocSectionsJson` — `title`, `body` (Markdown), optional **`profiles`** (`admin` / `user` / `onboarding`); rendered with **markdown-it** in HTML; **Markdown export** uses the same sections and respects hiding.
- **Discovery:** probe **`_design/system`** before **`getObjectView(system, schedule)`** so installs without that view no longer log a controller error.
- **Admin i18n:** German strings completed for jsonConfig **help** and **select** labels (less mixed DE/EN in the UI).
- **Onboarding copy:** “What runs automatically” clarifies **enabled JavaScript (script engine) scripts**; other rule engines are not listed yet.
- **Custom chapter cards:** less empty space above the title; leading newlines in `body` trimmed before render.

### 0.9.9 (2026-04-18)

- **My documentation:** optional **Help & emergencies** and **Routines in your own words** (`guestHelpNote`, `homeRoutinesNote`) — plain-language blocks in **Onboarding** and **User** HTML (with sidebar links when filled), Admin manual chapter, Markdown export, and **AI owner context** grounding.
- **Discovery (admin detail):** adapter instance `schedule` / `restartSchedule` CRON (with fallback state `.schedule`); optional **schedule-type objects** view; JavaScript scripts include **`common.engine`**.
- Admin UI: new fields + i18n (EN/DE/FR); `RENDERER_VERSION` bump.

### 0.9.8 (2026-04-17)

- HTML: QR code server-side SVG (`qrcode` package, offline-safe); **Copy link** = same public URL as QR (`baseUrl` + `/files/…`)
- Config: optional **filesystem export** (`exportPath`); **AI context hints** multiline textarea; `aiOwnerHints` / `exportPath` in `io-package` native defaults
- Multihost: host distribution block (admin); warning when AutoDoc runs on a non-primary host
- AI: guest vs resident handling for context hints (safety replace + Admin help text DE/EN/FR)
- Diagnosis: RAM/CPU (primary host), **copy for forum** snippet
- Changelog: fewer stored entries / fewer expanded rows in HTML
- Admin: AI tab fields use `hidden` (valid jsonConfig); discovery: npm probe when single host
- Docs: README (**base URL**, Docker export, AI hints); `TODO.md` / `PLAN.md` aligned with current QR implementation

### 0.9.7 (2026-04-11)

- AI: HTTP timeout; optional temperatures (user vs onboarding); room/category grounding; stricter German prompts; parsing cleanup; Ollama default temperature when unset; quality / neutral-guest fallbacks; onboarding technical-dump handling
- Startup: clearer **info** logs when generation is queued or skipped; default **generate on start** in defaults / jsonConfig for new installs
- Export: `meta.schemaVersion` `autodoc-json-1`; safer `meta.version` fallback; housekeeping in `io-package.json` news
- HTML: userdata / alias folder behaviour from end-of-page script; layout / template bumps (`RENDERER_VERSION`)
- Reliability (current `main`): duplicate runs avoided when generation is already in progress; phased **1/5–5/5** progress logging; OpenAI-compatible clients retry on selected HTTP errors with backoff; wider desktop main column

### 0.9.6 (2026-04-10)

- AI: HTML debug comment for KI source (primary vs fallback); German onboarding second pass for consistent **Sie**; German user prompt tuning

### 0.9.5 (2026-04-09)

- AI onboarding: leaner guest facts, stricter forbidden wording, fewer invented automation stories

### Earlier releases

Changes for **0.9.4** and older: see **`git log`** and `io-package.json` → `common.news`, or the previous detailed entries in repository history.

## License

MIT License

Copyright (c) 2026 crunchip77 <41550245+crunchip77@users.noreply.github.com>
