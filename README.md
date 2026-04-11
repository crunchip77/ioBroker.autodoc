![Logo](admin/autodoc.png)

# ioBroker.autodoc

**Adapter version 0.9.7** — **release candidate** for **community testing** (forum).  
`main` and `dev` are aligned for this RC. After feedback and bugfixes: **Adapter Checker green → PR to [ioBroker.repositories](https://github.com/ioBroker/ioBroker.repositories) → npm**.

| | |
| --- | --- |
| **npm** | Not published yet — will be installable like any other adapter via ioBroker Admin once listed (see [ioBroker documentation](https://www.iobroker.net/#en/documentation)). |
| **Official adapter list** | Not included yet — intended **after** forum testing. |
| **Changelog** | [In this README](#changelog) (required for ioBroker repository checker) |
| **Repository** | [github.com/crunchip77/ioBroker.autodoc](https://github.com/crunchip77/ioBroker.autodoc) |
| **Feedback** | Please report issues and wishes in the forum thread or [GitHub Issues](https://github.com/crunchip77/ioBroker.autodoc/issues). |

**Tests:** ![Test and Release](https://github.com/crunchip77/ioBroker.autodoc/workflows/Test%20and%20Release/badge.svg)

_NPM and “stable repository” badges will be added once the adapter is published and listed._

## Description

**ioBroker.autodoc** (0.9.7) automatically generates structured, human-readable documentation for your ioBroker installation. With a single button press — or fully automatically — the adapter scans your system and produces standalone HTML and Markdown files.

Three documentation profiles are always generated in one run:

| Profile                | Audience             | Focus                                                                              |
| ---------------------- | -------------------- | ---------------------------------------------------------------------------------- |
| **Admin**              | System administrator | Adapters, hosts, RAM/CPU, scripts, aliases, userdata, maintenance score, diagnosis |
| **User / Family**      | Everyday users       | Rooms, devices, automations, connected systems — plain language                    |
| **Onboarding / Guest** | Visitors             | Welcome, tips, capabilities overview, rooms, what runs automatically, QR code      |

---

## Configuration (short)

| Area                                                 | What                                                                     |
| ---------------------------------------------------- | ------------------------------------------------------------------------ |
| **Project name & language**                          | Shown in titles and exports                                              |
| **Base URL**                                         | For `info.htmlUrl*` links (host:port)                                    |
| **Generate on start / interval / on adapter change** | As needed                                                                |
| **My documentation**                                 | Description, contact, notes, per-adapter and per-room tables, hide lists |
| **AI**                                               | Provider, model, API key, base URL; optional **timeout (s)**, **temperature** (user vs onboarding), hardware hint |

---

## States (selection)

| State                                         | Role                                                  |
| --------------------------------------------- | ----------------------------------------------------- |
| `action.generate`                             | Trigger generation                                    |
| `info.lastGeneration` / `info.nextGeneration` | Timestamps                                            |
| `info.templateVersion`                        | Last HTML renderer id (auto-regenerate if code newer) |
| `info.htmlUrlAdmin` / `User` / `Onboarding`   | Direct links to latest HTML                           |

---

## Output files

Under `/files/autodoc.<instance>/`:

- `autodoc-admin.html`, `autodoc-user.html`, `autodoc-onboarding.html` — latest
- Timestamped `.md`, `.html`, `.json` — history (rotated by config)

HTML is standalone; Onboarding may load QR library from CDN (optional).

---

## Features

### Documentation generation

- **Automatic discovery** — adapter instances, hosts, rooms, functions, scripts, states, `0_userdata.0`, `alias.0.*`, system config
- **Three HTML files per run** — `autodoc-admin.html`, `autodoc-user.html`, `autodoc-onboarding.html` (+ timestamped copies)
- **Generate Now** — adapter settings or state `action.generate` / `sendTo('autodoc.0', 'generate', …)`
- **Triggers** — startup, interval (hours), adapter change (30 s debounce), template change (`RENDERER_VERSION` → auto-regenerate)
- **HTML template vs adapter package** — `RENDERER_VERSION` in `lib/htmlRenderer.js`; if it does not match the last run, the adapter can **regenerate** HTML (when auto-generate on start is on or you use **Generate now**). To see which **renderer build** produced a file, open the HTML → **View source** → `<head>` contains `<!-- autodoc-renderer:… -->` (diagnostic for this adapter, not the npm semver).

### Content (Admin highlights)

- **Rooms & functions** — `enum.rooms` / `enum.functions`, devices resolved with icons and categories (`roleMapper`)
- **Scripts** — status, folder, trigger, **cron schedule** (human-readable), optional **blue row accent** when scheduled
- **Aliases** — all `alias.0.*` targets, grouped by folder, filterable
- **User-defined variables** — `0_userdata.0.*`, grouped by folder, filterable
- **Hosts** — CPU, uptime; **RAM**: system memory when available, else **sum of all adapter `memRss`** (Docker-friendly), else js-controller only
- **Repository** — active ioBroker repo (`stable` / `beta`) in **Diagnosis** (not under location)
- **Location** — city, country, timezone from `system.config`
- **Maintenance** — documentation score (explained in UI), scripts without description, disabled instances; **orange** collapsible accents
- **In-page “Änderungen” / changelog styling** — theme-aware colours in generated HTML (adapter release notes: [Changelog](#changelog) in this README)

### Manual documentation

- **Tabbed Admin UI** — Basic, My documentation, Advanced, Notifications, AI
- **Project description, contact, notes** — shown **early** in Admin and User profiles when set
- **Per-adapter and per-room notes** — in all profiles; **gold** visual cues (row border, arrow, card edge) where a manual note exists
- **Hide lists** — separate for **User** and **Onboarding** (rooms/adapters)

### HTML viewer

- **Search** — full-text in sidebar; hint text always visible under search box
- **Dark mode** — toggle in nav footer, `localStorage`
- **Mobile** — hamburger menu, overlay nav (≤ 700 px width)
- **Visual cues** — gold = manual hint, orange = maintenance attention, blue = scheduled script / link accent
- **Onboarding** — QR code + copy link fallback, “What can this smart home?” capability cards, ⏱ for cron scripts, stale-docs banner, relative timestamps

### Exports & integrations

- Markdown + JSON + HTML; **states** `info.htmlUrlAdmin`, `info.htmlUrlUser`, `info.htmlUrlOnboarding`
- Notifications; **AI** (opt-in: Ollama, Mistral, Groq, Anthropic) — optional **HTTP timeout** and **sampling temperature** per profile (admin); **room + category grounding** in prompts; German **guest vs resident** rules (second onboarding pass for consistent **Sie** when needed). HTML comment before the KI box shows **primary vs fallback** source (see [Changelog](#changelog) for adapter-side AI changes).
- **Languages** — EN, DE, FR

---

## Roadmap

| Milestone | Status |
| --------- | ------ |
| **0.9.x** | Release candidate — **forum testing**, feedback, bugfixes |
| **Next** | [Adapter Checker](https://adapter-check.iobroker.in/) clean → **ioBroker.repositories** PR + **npm** |
| **1.x** | PDF export, backup integration, custom templates (optional) |

---

## Changelog

**Current adapter version: 0.9.7** (must match `package.json` / `io-package.json` — ioBroker repository checker **E6006**.)

**Release checklist:** add a dated `### x.y.z` subsection below → bump **`package.json`** / **`io-package.json`** → update **`common.news`** (max 7 entries).

**Two version lines (often confused):**

| What | Where |
| ---- | ----- |
| **Adapter npm semver** | `package.json`, `io-package.json`, this **Changelog** section |
| **HTML renderer build** | `RENDERER_VERSION` in `lib/htmlRenderer.js` → `<!-- autodoc-renderer:… -->` in generated pages (independent of npm version) |

### Work in progress

- Forum RC feedback; npm + `ioBroker.repositories` entry after [Adapter Checker](https://adapter-check.iobroker.in/) stays green.

### 0.9.7 (2026-04-11)

- (crunchip77) AI: configurable HTTP request timeout; optional sampling temperature for user vs onboarding profiles (empty = provider default).
- (crunchip77) AI: room/category grounding block in prompts to reduce off-topic inventions.
- (crunchip77) AI onboarding: neutral guest placeholder when output looks like a technical dump or would copy admin tone; HTML comment distinguishes `fallback-neutral` vs `primary`.
- (crunchip77) AI parsing: more tolerant `NARRATIVE:` / `RECOMMENDATIONS:` splitting; strips echoed labels and empty list items.
- (crunchip77) German prompts: stronger guest vs resident rules and wording fixes (e.g. blinds: Jalousien/Rollläden).
- (crunchip77) Export: `meta.schemaVersion` set to `autodoc-json-1`; `meta.version` falls back to `0.0.0` if missing; removed misleading `1.0.0` news entry from `io-package.json`.
- (crunchip77) Startup generation: **info** logs when documentation is queued vs skipped (and why); admin **help** text (EN/DE/FR) for “generate on start” (async run, `info.templateVersion`, log hint).
- (crunchip77) **autoGenerateOnStart** default **on** in `io-package.json` native defaults and jsonConfig default (existing instances keep their saved checkbox value).
- (crunchip77) HTML: userdata + alias filters run from **end-of-page** script (works when viewers drop inline `<main>` scripts); folder `<details>` **closed** on load when search is empty; `pageshow` refresh for BF-cache; `RENDERER_VERSION` bump.
- (crunchip77) AI (Ollama): conservative **default temperature** when admin leaves temperature empty; stricter DE system + lektor prompts; **quality gate** after polish (short factual resident summary or neutral guest block); extra noise stripping; **iroBroker**-style typos caught in onboarding technical-dump detection.

### 0.9.6 (2026-04-10)

- (crunchip77) AI: HTML comment before KI box documents primary vs fallback source (user / onboarding).
- (crunchip77) German onboarding: optional second LLM pass for consistent Sie-form when du/Sie mix detected.
- (crunchip77) `docModel.ai.meta`: `onboardingFromUserFallback`, `userFromOnboardingFallback` (also in exported JSON).
- (crunchip77) German user AI: prompt block against Denglish, unnecessary brands, and alarmist maintenance tone.

### 0.9.5 (2026-04-09)

- (crunchip77) AI onboarding: leaner guest context (no adapter/script counts); stronger forbidden terms and German Sie-only bullets; fewer invented automation stories.

### 0.9.4 (2026-04-08)

- (crunchip77) AI: guest-oriented onboarding facts; optional system message for OpenAI-compatible and Anthropic; guest-safety system prompt for onboarding.
- (crunchip77) AI German: Hochdeutsch style rules and German system messages when `language` is `de`.

### 0.9.3 (2026-04-07)

- (crunchip77) Fix: blank HTML main area (script closing + search regex); reinstall with a new adapter version or clear install cache if files stay stale.
- (crunchip77) Diagnostics: `<!-- autodoc-renderer:… -->` in HTML `<head>` to verify renderer build.

### 0.9.2 (2026-04-06)

- (crunchip77) Admin: aliases chapter (`alias.0.*`), RAM total from adapter `memRss` when host RAM unavailable, documentation score explanation, filters for userdata and aliases, manual notes moved up in profiles.
- (crunchip77) Onboarding: capability cards, tips section fallback, scheduled-script marker, visual cue colours (gold/orange/blue).
- (crunchip77) Fix: RAM cell HTML escaping, host RAM units, search hint visibility, embedded chapter scripts and client search regex (blank page).
- (crunchip77) CI and packaging: ESLint for inlined script, adapter checker fields, Dependabot; Git tag `v0.9.2` for RC; removed phantom `1.0.0` news.

### 0.9.1 (2026-04-05)

- (crunchip77) Dark mode fixes for collapsibles and changelog; search hint always visible; admin Funktionen heading; i18n keys.

### 0.9.0 (2026-04-07)

- (crunchip77) Mobile layout, stale-docs banner, relative timestamps, QR onboarding, host stats, userdata, template version state, cron badges, many dark-mode fixes.

### 0.8.0 and older

- (crunchip77) See git history for 0.1.0–0.8.x: profile redesign, AI providers, notifications, three-profile HTML, core modules (`discovery.js`, `documentModel.js`, `htmlRenderer.js`, `markdownRenderer.js`, `versionTracker.js`, `i18n.js`, admin UI).

---

## License

MIT License

Copyright (c) 2026 crunchip77 <41550245+crunchip77@users.noreply.github.com>
