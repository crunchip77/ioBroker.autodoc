![Logo](admin/autodoc.png)

# ioBroker.autodoc

**Adapter version 0.9.5** — **release candidate** for **community testing** (forum).  
After positive feedback and bugfixes, the plan is: **Adapter Checker green → PR to [ioBroker.repositories](https://github.com/ioBroker/ioBroker.repositories) → npm**.

| | |
| --- | --- |
| **npm** | Not published yet — install via **GitHub tarball** (see [Installation](#installation)). |
| **Official adapter list** | Not included yet — intended **after** forum testing. |
| **Feedback** | Please report issues and wishes in the forum thread or [GitHub Issues](https://github.com/crunchip77/ioBroker.autodoc/issues). |

**Tests:** ![Test and Release](https://github.com/crunchip77/ioBroker.autodoc/workflows/Test%20and%20Release/badge.svg)

_NPM and “stable repository” badges will be added once the adapter is published and listed._

## Description

**ioBroker.autodoc** (0.9.5) automatically generates structured, human-readable documentation for your ioBroker installation. With a single button press — or fully automatically — the adapter scans your system and produces standalone HTML and Markdown files.

Three documentation profiles are always generated in one run:

| Profile                | Audience             | Focus                                                                              |
| ---------------------- | -------------------- | ---------------------------------------------------------------------------------- |
| **Admin**              | System administrator | Adapters, hosts, RAM/CPU, scripts, aliases, userdata, maintenance score, diagnosis |
| **User / Family**      | Everyday users       | Rooms, devices, automations, connected systems — plain language                    |
| **Onboarding / Guest** | Visitors             | Welcome, tips, capabilities overview, rooms, what runs automatically, QR code      |

---

## Features

### Documentation generation

- **Automatic discovery** — adapter instances, hosts, rooms, functions, scripts, states, `0_userdata.0`, `alias.0.*`, system config
- **Three HTML files per run** — `autodoc-admin.html`, `autodoc-user.html`, `autodoc-onboarding.html` (+ timestamped copies)
- **Generate Now** — adapter settings or state `action.generate` / `sendTo('autodoc.0', 'generate', …)`
- **Triggers** — startup, interval (hours), adapter change (30 s debounce), template change (`RENDERER_VERSION` → auto-regenerate)

### Content (Admin highlights)

- **Rooms & functions** — `enum.rooms` / `enum.functions`, devices resolved with icons and categories (`roleMapper`)
- **Scripts** — status, folder, trigger, **cron schedule** (human-readable), optional **blue row accent** when scheduled
- **Aliases** — all `alias.0.*` targets, grouped by folder, filterable
- **User-defined variables** — `0_userdata.0.*`, grouped by folder, filterable
- **Hosts** — CPU, uptime; **RAM**: system memory when available, else **sum of all adapter `memRss`** (Docker-friendly), else js-controller only
- **Repository** — active ioBroker repo (`stable` / `beta`) in **Diagnosis** (not under location)
- **Location** — city, country, timezone from `system.config`
- **Maintenance** — documentation score (explained in UI), scripts without description, disabled instances; **orange** collapsible accents
- **Changelog & troubleshooting** — theme-aware colours (light/dark)

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
- Notifications; **AI** (opt-in: Ollama, Mistral, Groq, Anthropic) with privacy notice
- **Languages** — EN, DE, FR

---

## Installation

**Adapters →** install from **Custom URL** (until npm is available):

**Stable branch (recommended for forum testers):**

```
https://github.com/crunchip77/ioBroker.autodoc/tarball/main
```

**Development / latest features:**

```
https://github.com/crunchip77/ioBroker.autodoc/tarball/dev
```

**Important — Custom URL cache:** ioBroker caches the GitHub tarball by **`version` in `package.json`**. If you reinstall the **same version** (e.g. still `0.9.2`), the controller may **not** replace the adapter files, so you keep an **old `lib/`** and bugs persist. After pulling fixes from Git, either install a **new adapter version** (e.g. `0.9.5`) or remove the old copy under `node_modules/iobroker.autodoc` / use the controller’s reinstall path, then **restart** the adapter instance.

HTML template changes also bump `RENDERER_VERSION` in `lib/htmlRenderer.js`; on start, a mismatch forces **regeneration** of the HTML files (if auto-generate on start is enabled or you trigger **Generate now**).

**Verify in browser:** open the generated HTML → **View source** → in `<head>` you should see `<!-- autodoc-renderer:2026.04.07.13 -->` (or newer). If that line is missing or older, the running adapter code is not updated.

**Repository:** [github.com/crunchip77/ioBroker.autodoc](https://github.com/crunchip77/ioBroker.autodoc)

---

## Configuration (short)

| Area                                                 | What                                                                     |
| ---------------------------------------------------- | ------------------------------------------------------------------------ |
| **Project name & language**                          | Shown in titles and exports                                              |
| **Base URL**                                         | For `info.htmlUrl*` links (host:port)                                    |
| **Generate on start / interval / on adapter change** | As needed                                                                |
| **My documentation**                                 | Description, contact, notes, per-adapter and per-room tables, hide lists |
| **AI**                                               | Provider, model, keys — optional                                         |

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

## Roadmap

| Milestone | Status |
| --------- | ------ |
| **0.9.x** | Release candidate — **forum testing**, feedback, bugfixes |
| **Next** | [Adapter Checker](https://adapter-check.iobroker.in/) clean → **ioBroker.repositories** PR + **npm** |
| **1.x** | PDF export, backup integration, custom templates (optional) |

---

## Changelog

Notable changes are recorded here (adapter version: `package.json` / `io-package.json`; HTML template iterations: `RENDERER_VERSION` in `lib/htmlRenderer.js`).

### [0.9.5] — 2026-04

#### Changed

- **AI onboarding prompts** — Guest context no longer includes adapter/script counts (reduces maintenance-adapter leakage). Stronger forbidden terms (including “Broker”, maintenance-score, English “Schedule/Score”), explicit German **Sie**-only bullets, no du-imperatives. System messages updated to discourage invented automation stories.

---

### [0.9.4] — 2026-04

#### Changed

- **AI (HTML)** — Onboarding prompt uses guest-oriented facts (no full adapter dump); OpenAI-compatible and Anthropic calls support an optional **system** message; onboarding gets a fixed guest-safety system prompt.
- **AI (German)** — Extra style rules for idiomatic Hochdeutsch (natural **Sie**-forms, fewer calques / Denglish); **German system messages** for onboarding and user when `language` is `de`.

---

### [0.9.3] — 2026-04

#### Fixed

- **HTML viewer** — same fixes as below, but **adapter version bumped** so ioBroker **Custom URL installs** actually replace `node_modules` (same `0.9.x` version was often **cached**, leaving broken HTML renderer on disk).
- **Diagnostics** — HTML pages include `<!-- autodoc-renderer:… -->` in `<head>` so you can confirm which renderer build generated the file.

---

### [0.9.2] — 2026-04

**Release candidate (forum / pre-npm).**

#### Added

- **Aliases chapter (Admin)** — reads `alias.0.*`, shows read/write targets, grouped by folder, with search filter
- **RAM: total ioBroker memory** — sums `system.adapter.*.*.memRss` when host system RAM is unavailable (Docker); label **(alle Adapter)**; js-controller-only fallback labelled **(js-controller)**
- **Documentation score** — short explanation text above the score bar (what 0–100 % means)
- **User-defined variables & aliases** — search filter bars + open-all-groups on search
- **Manual notes position** — project/contact/notes block moved **up** in Admin and User profiles (right after header)
- **Onboarding** — “What can this smart home?” capability cards from functions/categories; tips section **always** shown (fallback text if no notes); admin hint when no manual content; **⏱** next to scheduled scripts
- **Visual cues (HTML)** — gold: manual notes (room arrow, table row, adapter card, disabled-adapter group when any note); orange: maintenance / disabled scripts groups; blue: script rows with cron schedule; Onboarding clock mark for schedules
- **Navigation** — TOC order matches manual-notes-first where applicable

#### Changed

- **Repository badge** — moved from “Location” to **Diagnosis** section
- **Changelog cards** — colours use CSS variables (readable in dark mode)
- **Collapsible summaries** — `var(--text)` instead of hardcoded greys for dark mode

#### Fixed

- **RAM cell** — escaped HTML showed raw `<small>` tags; `esc()` removed for composed RAM cell
- **Host RAM** — `memRss` values are already in MB in js-controller (no double division)
- **Search hint** — always visible; colour uses theme variables
- **HTML viewer** — embedded chapter scripts closed with real `</script>`; client search `escRe` regex injected via `JSON.stringify` (fixes blank white main content in all profiles)
- **CI (GitHub Actions)** — `check-and-lint`: ESLint for inlined client script in `wrapPage`, `npm run check` / `StateCommon` cast, LF line endings (`.gitattributes`)
- **Adapter checker / packaging** — `io-package` / `package.json` (admin dep, native fields, keywords, news i18n), single `jsonConfig.json`, Dependabot + automerge workflow
- **Git tags** — release tag **`v0.9.2`** marks this RC; misleading **`v1.0.0`** tag removed on GitHub (adapter stays on **0.9.x** until a real **1.0.0** release)

---

### [0.9.1] — 2026-04

#### Added

- Dark mode fixes for collapsibles and changelog; search hint visibility
- Admin: **Funktionen** as proper `<h3>` before collapsible list
- Various i18n keys (repo, score, aliases, …)

#### Fixed

- jsonConfig / admin UI validation issues (previous iterations)

---

### [0.9.0] — 2026-04-07

#### Added

- Mobile layout (hamburger, overlay nav); stale-docs banner; health badge; relative timestamps
- QR code + copy fallback on Onboarding; search hints in nav
- Host RAM/CPU/uptime; location & timezone; script cron schedules as badges
- User-defined variables (`0_userdata.0`); pending updates; BackItUp last backup
- `info.templateVersion` + `RENDERER_VERSION` auto-regenerate on template change
- `info.nextGeneration` state

#### Changed

- Onboarding order: tips before stat cards; function chips after rooms
- Version aligned to `0.9.x` pre-1.0 convention

#### Fixed

- Docker RAM display; clipboard on HTTP; numerous dark-mode contrast issues

---

### Earlier history

See git history for **0.1.0–0.8**: profile redesign, AI providers, notifications, three-profile HTML, initial architecture (`discovery.js`, `documentModel.js`, `htmlRenderer.js`, `markdownRenderer.js`, `versionTracker.js`, `i18n.js`, jsonConfig admin UI).

---

## License

MIT License

Copyright (c) 2026 crunchip77 <41550245+crunchip77@users.noreply.github.com>
