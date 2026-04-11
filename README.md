![Logo](admin/autodoc.png)

# ioBroker.autodoc

**Adapter version 0.9.7** — **release candidate** for **community testing** (forum).  
`main` and `dev` are aligned for this RC. After feedback and bugfixes: **Adapter Checker green → PR to [ioBroker.repositories](https://github.com/ioBroker/ioBroker.repositories) → npm**.

| | |
| --- | --- |
| **npm** | Not published yet — will be installable like any other adapter via ioBroker Admin once listed (see [ioBroker documentation](https://www.iobroker.net/#en/documentation)). |
| **Official adapter list** | Not included yet — intended **after** forum testing. |
| **Changelog** | [**CHANGELOG.md**](CHANGELOG.md) |
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
- **In-page “Änderungen” / changelog styling** — theme-aware colours in generated HTML (not the same as [**CHANGELOG.md**](CHANGELOG.md) for the adapter)

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
- Notifications; **AI** (opt-in: Ollama, Mistral, Groq, Anthropic) — optional **HTTP timeout** and **sampling temperature** per profile (admin); **room + category grounding** in prompts; German **guest vs resident** rules (second onboarding pass for consistent **Sie** when needed). HTML comment before the KI box shows **primary vs fallback** source (see [**CHANGELOG.md**](CHANGELOG.md) for adapter-side AI changes).
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

Version history belongs in **[CHANGELOG.md](CHANGELOG.md)** only (not duplicated in this readme).

**Release checklist:** new section in **CHANGELOG.md** → bump **`package.json`** / **`io-package.json`** → update **`common.news`**.

**Two version lines (often confused):**

| What | Where |
| ---- | ----- |
| **Adapter npm semver** | `package.json`, `io-package.json`, **CHANGELOG.md** headings |
| **HTML renderer build** | `RENDERER_VERSION` in `lib/htmlRenderer.js` → `<!-- autodoc-renderer:… -->` in generated pages (independent of npm version) |

---

## License

MIT License

Copyright (c) 2026 crunchip77 <41550245+crunchip77@users.noreply.github.com>
