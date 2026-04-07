![Logo](admin/autodoc.png)

# ioBroker.autodoc

[![NPM version](https://img.shields.io/npm/v/iobroker.autodoc.svg)](https://www.npmjs.com/package/iobroker.autodoc)
[![Downloads](https://img.shields.io/npm/dm/iobroker.autodoc.svg)](https://www.npmjs.com/package/iobroker.autodoc)
![Number of Installations](https://iobroker.live/badges/autodoc-installed.svg)
![Current version in stable repository](https://iobroker.live/badges/autodoc-stable.svg)

**Tests:** ![Test and Release](https://github.com/crunchip77/ioBroker.autodoc/workflows/Test%20and%20Release/badge.svg)

## Description

**ioBroker.autodoc** automatically generates structured, human-readable documentation for your ioBroker installation. With a single button press — or fully automatically — the adapter scans your system and produces standalone HTML and Markdown files.

Three completely different documentation profiles, each tailored to its audience:

| Profile | Audience | Language | Focus |
|---|---|---|---|
| **Admin** | System administrator | Technical | Full system depth: adapter table, device hierarchy with OIDs, scripts, maintenance score, diagnosis |
| **User / Family** | Everyday users | Plain | Rooms with device names and icons, automations, connected systems |
| **Onboarding / Guest** | Visitors, new residents | Informal | Welcome, tips & notes, rooms overview, what runs automatically |

---

## Features

### Documentation generation
- **Automatic Discovery** — adapter instances, hosts, rooms, functions, scripts, state objects, system metadata
- **Three profiles in one pass** — `autodoc-admin.html`, `autodoc-user.html`, `autodoc-onboarding.html` always generated simultaneously
- **"Generate Now" button** — trigger generation directly from adapter settings, no restart needed
- **Flexible triggering** — on start, scheduled (hourly), event-based after adapter changes (30 s debounce), or via `sendTo`
- **Auto-regenerate on template change** — adapter detects updated HTML renderer and regenerates automatically after install

### Content
- **Rooms & functions** — reads `enum.rooms` and `enum.functions`, resolves member objects to readable device names
- **Role mapping** — 29+ ioBroker role patterns → 14 categories with icons (💡 Light, 🌡️ Climate, 🪟 Shutters, 🚪 Door …)
- **Live state values** (opt-in) — thermostat temperature, door/window status in Onboarding and User profiles
- **Script documentation** — name, status, description, trigger type, and **schedule** (cron → readable: "täglich um 06:00")
- **User-defined variables** — displays all datapoints under `0_userdata.0`, grouped by folder (Admin profile)
- **Dependency analysis** — state references extracted from script source, cross-reference table
- **Maintenance hints** — flags scripts without description, disabled instances, documentation score
- **Diagnosis** — Node.js LTS badge, OS info, js-controller version, scan statistics
- **Changelog section** — last 10 generation events, older entries collapsed
- **Troubleshooting** — 4 concrete scenarios with numbered steps

### System information (Admin profile)
- **Host table** — RAM (system or process for Docker), CPU %, uptime per host
- **Repository badge** — shows active ioBroker repo channel (`stable` = green, `beta` = yellow)
- **Location & timezone** — from `system.config` (city, country, timezone)
- **Pending adapter updates** — amber stat card when updates are available
- **BackItUp last backup** — backup age in days (requires BackItUp adapter)
- **Adapter health badge** — `12/14 aktiv` in the page title

### Manual documentation
- **Tabbed settings UI** — five tabs: Basic settings, My documentation, Advanced, Notifications, AI
- **Project info** — name, description, contact person, general notes
- **Per-adapter notes** — human-readable hints per adapter (shown in all profiles)
- **Per-room notes** — notes per room (User and Onboarding profiles)
- **Onboarding hide list** — exclude rooms/adapters from guest view (backup, security, etc.)
- **User/Family hide list** — separate control for family members

### HTML viewer
- **Full-text search** — real-time highlighting, prev/next (Enter/↑↓), Escape to clear, hint text on focus
- **Dark mode toggle** — in the nav sidebar, labeled, persistent in localStorage
- **Mobile responsive** — hamburger menu on screens ≤ 700 px, nav as overlay, full-width content
- **QR code** (Onboarding) — scan to share page URL; copy-link fallback for offline/HTTP
- **Stale docs warning** — banner if documentation is older than 7 days (critical after 30 days)
- **Relative timestamps** — "vor 2 Stunden" displayed next to raw timestamp
- **Collapsible sections** — rooms, device hierarchies, functions, disabled adapters, changelog
- **Print-friendly CSS** — `Ctrl+P` hides nav, expands all `<details>` blocks

### Exports & integrations
- **Markdown + HTML + JSON** — timestamped + latest files in `/files/autodoc.0/`
- **Direct links** in admin instance list — three separate links: Admin, User, Onboarding
- **URL states** — `info.htmlUrlAdmin`, `info.htmlUrlUser`, `info.htmlUrlOnboarding`
- **Notifications** — Telegram, Email, Pushover, generic `sendTo` after generation
- **AI enhancement** (opt-in) — Ollama (local/private), Mistral AI, Groq, Anthropic Claude; privacy warning shown prominently
- **Multilingual** — EN, DE, FR

---

## Installation

> **Note:** This adapter is currently in testing. Not yet available on npm.

Install via ioBroker admin → **Adapters → Custom URL**:

```
https://github.com/crunchip77/ioBroker.autodoc/tarball/main
```

---

## Configuration

### Basic settings

| Setting | Description | Default |
|---|---|---|
| **Project name** | Name of your ioBroker installation | — |
| **Documentation language** | Language for the generated documentation | `en` |
| **ioBroker base URL** | Used for `info.htmlUrl*` states, e.g. `192.168.1.100:8081` | — |
| **Generate on adapter start** | Regenerate automatically on every adapter start | off |
| **Generate on adapter changes** | Regenerate after adapter install/remove/enable/disable (30 s debounce) | off |
| **Auto-generate interval (hours)** | Periodically generate every X hours, `0` = disabled | `0` |
| **Only document enabled instances** | Exclude disabled instances | off |
| **Maximum stored files** | How many timestamped sets to keep | `5` |

### My Documentation tab

| Setting | Description |
|---|---|
| **Project description** | Short description shown on Onboarding welcome page |
| **Contact person** | Name/phone shown with 👤 icon on Onboarding |
| **General notes** | Free-text notes, shown as "Tips & Notes" on Onboarding |
| **Adapter notes** | Per-adapter: enter adapter name and a human-readable note |
| **Room notes** | Per-room: enter room name and a note |
| **Onboarding hide rooms** | Rooms to exclude from guest profile |
| **Onboarding hide adapters** | Adapters to exclude from guest profile |
| **User hide rooms** | Rooms to exclude from user/family profile |
| **User hide adapters** | Adapters to exclude from user/family profile |

### Manual Context (JSON alternative)

All manual documentation can also be entered as a single JSON object in the legacy field:

```json
{
  "description": "Our smart home in Munich",
  "contact": "Max, 0171-123456",
  "notes": "WiFi password: ...\nHeating: manual override via app",
  "adapters": {
    "hue": "Controls living room and kitchen lights",
    "telegram": "Family notifications — add via /start"
  },
  "rooms": {
    "Living room": "Shutters close automatically at 21:00",
    "Bedroom": "Do not disturb from 22:00"
  }
}
```

---

## States

### Actions

| State | Type | Description |
|---|---|---|
| `action.generate` | button | Set to `true` to trigger manual generation |
| `action.downloadMarkdown` | button | Write latest Markdown to `/files/` |
| `action.downloadHtml` | button | Write latest HTML to `/files/` |
| `action.downloadJson` | button | Write latest JSON to `/files/` |

### Info

| State | Type | Description |
|---|---|---|
| `info.connection` | boolean | `true` while adapter is running |
| `info.lastGeneration` | string | ISO timestamp of last generation |
| `info.nextGeneration` | string | ISO timestamp of next scheduled generation |
| `info.lastTrigger` | string | Trigger source: `startup`, `manual`, `scheduled`, `event` |
| `info.templateVersion` | string | HTML renderer version used for last generation |
| `info.htmlUrlAdmin` | string | Direct URL to Admin HTML documentation |
| `info.htmlUrlUser` | string | Direct URL to User HTML documentation |
| `info.htmlUrlOnboarding` | string | Direct URL to Onboarding HTML documentation |
| `info.summary` | string | Human-readable generation summary |

### Versioning

| State | Type | Description |
|---|---|---|
| `versioning.latestVersion` | string | Version string (YYYY.MM.DD.HH) |
| `versioning.changeCount` | number | Changes detected vs. previous generation |
| `versioning.changelog` | json | History of last 50 generations |

---

## Output Files

Files are stored in `/files/autodoc.0/`:

```
autodoc-admin-2026-04-07T08-21-05.html     ← Admin profile
autodoc-user-2026-04-07T08-21-05.html      ← User/Family profile
autodoc-onboarding-2026-04-07T08-21-05.html← Onboarding/Guest profile
autodoc-2026-04-07T08-21-05.md             ← Markdown (all content)
autodoc-2026-04-07T08-21-05.json           ← Full document model

autodoc-admin.html     ← always the latest Admin HTML
autodoc-user.html      ← always the latest User HTML
autodoc-onboarding.html← always the latest Onboarding HTML
```

All HTML files are **standalone** — no internet connection required (except QR code CDN on Onboarding).

---

## Roadmap

| Version | Status | Content |
|---|---|---|
| 0.1 – 0.8 | ✅ | Basis, profile redesign, rooms, scripts, AI, i18n, notifications |
| **0.9.0** | ✅ dev | Mobile layout, live system stats, script schedules, user variables, auto-regenerate |
| **1.0.0** | ⬜ planned | First official release — after adapter checker passes → npm + ioBroker.repositories |
| 1.x | ⬜ planned | Phase 5: PDF export, Backup integration, Custom templates |

---

## Changelog

See [CHANGELOG.md](CHANGELOG.md)

---

## License

MIT License

Copyright (c) 2026 crunchip77 <41550245+crunchip77@users.noreply.github.com>
