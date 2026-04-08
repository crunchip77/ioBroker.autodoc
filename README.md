![Logo](admin/autodoc.png)

# ioBroker.autodoc

[![NPM version](https://img.shields.io/npm/v/iobroker.autodoc.svg)](https://www.npmjs.com/package/iobroker.autodoc)
[![Downloads](https://img.shields.io/npm/dm/iobroker.autodoc.svg)](https://www.npmjs.com/package/iobroker.autodoc)
![Number of Installations](https://iobroker.live/badges/autodoc-installed.svg)
![Current version in stable repository](https://iobroker.live/badges/autodoc-stable.svg)

**Tests:** ![Test and Release](https://github.com/crunchip77/ioBroker.autodoc/workflows/Test%20and%20Release/badge.svg)

**Current branch build:** `0.9.x` (release candidate) — install from GitHub custom URL until published to npm.

## Description

**ioBroker.autodoc** automatically generates structured, human-readable documentation for your ioBroker installation. With a single button press — or fully automatically — the adapter scans your system and produces standalone HTML and Markdown files.

Three documentation profiles are always generated in one run:

| Profile | Audience | Focus |
|---|---|---|
| **Admin** | System administrator | Adapters, hosts, RAM/CPU, scripts, aliases, userdata, maintenance score, diagnosis |
| **User / Family** | Everyday users | Rooms, devices, automations, connected systems — plain language |
| **Onboarding / Guest** | Visitors | Welcome, tips, capabilities overview, rooms, what runs automatically, QR code |

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

Until the adapter is on npm, use **Adapters → Custom URL**:

**Development / latest features:**

```
https://github.com/crunchip77/ioBroker.autodoc/tarball/dev
```

**Stable branch:**

```
https://github.com/crunchip77/ioBroker.autodoc/tarball/main
```

ioBroker caches the downloaded tarball by **package version**. After pulling new code, bump `package.json` / `io-package.json` version or reinstall; HTML template changes also bump `RENDERER_VERSION` in `lib/htmlRenderer.js` for automatic regeneration.

---

## Configuration (short)

| Area | What |
|---|---|
| **Project name & language** | Shown in titles and exports |
| **Base URL** | For `info.htmlUrl*` links (host:port) |
| **Generate on start / interval / on adapter change** | As needed |
| **My documentation** | Description, contact, notes, per-adapter and per-room tables, hide lists |
| **AI** | Provider, model, keys — optional |

---

## States (selection)

| State | Role |
|---|---|
| `action.generate` | Trigger generation |
| `info.lastGeneration` / `info.nextGeneration` | Timestamps |
| `info.templateVersion` | Last HTML renderer id (auto-regenerate if code newer) |
| `info.htmlUrlAdmin` / `User` / `Onboarding` | Direct links to latest HTML |

---

## Output files

Under `/files/autodoc.<instance>/`:

- `autodoc-admin.html`, `autodoc-user.html`, `autodoc-onboarding.html` — latest
- Timestamped `.md`, `.html`, `.json` — history (rotated by config)

HTML is standalone; Onboarding may load QR library from CDN (optional).

---

## Roadmap

| Milestone | Status |
|---|---|
| **0.9.x** | Release candidate — feature-complete for forum testing |
| **1.0.0** | After [Adapter Checker](https://adapter-check.iobroker.in/) green → npm + `ioBroker.repositories` |
| **1.x** | PDF export, backup integration, custom templates (optional) |

---

## Changelog

See [CHANGELOG.md](CHANGELOG.md).

---

## License

MIT License

Copyright (c) 2026 crunchip77 <41550245+crunchip77@users.noreply.github.com>
