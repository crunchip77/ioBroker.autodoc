![Logo](admin/autodoc.png)

# ioBroker.autodoc

**Adapter version 0.9.7** — **release candidate** for **community testing** (forum).  
`main` and `dev` are aligned for this RC. After feedback and bugfixes: **Adapter Checker green → PR to [ioBroker.repositories](https://github.com/ioBroker/ioBroker.repositories) → npm**.

| | |
| --- | --- |
| **npm** | Not published yet — install from Admin **Adapters** once the package is on npm / in your repository list (see [Installation](#installation)). |
| **Official adapter list** | Not included yet — intended **after** forum testing. |
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
- Notifications; **AI** (opt-in: Ollama, Mistral, Groq, Anthropic) — optional **HTTP timeout** and **sampling temperature** per profile (admin); **room + category grounding** in prompts; German **guest vs resident** rules (second onboarding pass for consistent **Sie** when needed). HTML comment before the KI box shows **primary vs fallback** source (see [Changelog](#changelog)).
- **Languages** — EN, DE, FR

---

## Installation

Install **ioBroker.autodoc** from the **Adapters** view in ioBroker Admin (search by name) once the adapter is available in your configured repository or on npm.

For **pre-release testing**, use the installation method described in the forum or by your administrator. **This readme does not document direct installs from GitHub URLs** (ioBroker project policy: avoid guiding normal users toward unofficial sources).

After any upgrade, **restart** the adapter instance so the controller loads the new files.

HTML template changes bump `RENDERER_VERSION` in `lib/htmlRenderer.js`; on start, a mismatch can force **regeneration** of the HTML files (if auto-generate on start is enabled or you use **Generate now**).

**Verify in browser:** open the generated HTML → **View source** → in `<head>` you should see `<!-- autodoc-renderer:… -->`. If that comment is missing or clearly older than your installed build, the running adapter code may not match the installation — confirm version/restart as needed.

**Repository:** [github.com/crunchip77/ioBroker.autodoc](https://github.com/crunchip77/ioBroker.autodoc)

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

## Roadmap

| Milestone | Status |
| --------- | ------ |
| **0.9.x** | Release candidate — **forum testing**, feedback, bugfixes |
| **Next** | [Adapter Checker](https://adapter-check.iobroker.in/) clean → **ioBroker.repositories** PR + **npm** |
| **1.x** | PDF export, backup integration, custom templates (optional) |

---

## Changelog

Release notes use the standard ioBroker / `@alcalzone/release-script` format in **[CHANGELOG.md](CHANGELOG.md)** (required by the repository checker and release tooling).

Adapter semver lives in `package.json` and `io-package.json`. **HTML template** iterations are separate: `RENDERER_VERSION` in `lib/htmlRenderer.js` (and `<!-- autodoc-renderer:… -->` in generated pages).

---

## License

MIT License

Copyright (c) 2026 crunchip77 <41550245+crunchip77@users.noreply.github.com>
