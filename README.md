![Logo](admin/autodoc.png)

# ioBroker.autodoc

[![NPM version](https://img.shields.io/npm/v/iobroker.autodoc.svg)](https://www.npmjs.com/package/iobroker.autodoc)
[![Downloads](https://img.shields.io/npm/dm/iobroker.autodoc.svg)](https://www.npmjs.com/package/iobroker.autodoc)
![Number of Installations](https://iobroker.live/badges/autodoc-installed.svg)
![Current version in stable repository](https://iobroker.live/badges/autodoc-stable.svg)
[![NPM](https://nodei.co/npm/iobroker.autodoc.png?downloads=true)](https://nodei.co/npm/iobroker.autodoc/)

**Tests:** ![Test and Release](https://github.com/crunchip77/ioBroker.autodoc/workflows/Test%20and%20Release/badge.svg)

## Description

**ioBroker.autodoc** automatically generates structured documentation for your ioBroker installation. With a single button press — or fully automatically — the adapter scans your system and produces ready-to-use documentation files in Markdown and HTML format.

The generated documentation is tailored to the selected target audience: technical administrators, everyday family members, or new users just getting started.

## Features

- **Automatic Discovery** — scans adapter instances, hosts, rooms, functions, scripts, state objects and system metadata
- **Three Target Profiles** — Admin, User/Family, Onboarding — each with genuinely different language, structure and level of detail
- **Device Resolution** — room members resolved to human-readable device names via ioBroker object metadata
- **Role Mapping** — ioBroker roles normalized to categories with icons (💡 Light, 🌡️ Climate, 🪟 Shutters, 🚪 Door …)
- **Live State Values** (opt-in) — show current thermostat temperature, door/window status in Onboarding and User profiles
- **Adapter Metadata** — reads adapter titles, descriptions, connection type and tier from ioBroker metadata; no manual input required, multilingual
- **Markdown + HTML Export** — standalone files saved to `/files/autodoc.0/`, readable in any browser without internet access
- **Multilingual** — documentation language selectable: English, German, French
- **Version Tracking** — every generation is versioned (YYYY.MM.DD.HH), changes are detected and logged in a changelog
- **Flexible Triggering** — manual via button, on adapter start, on a configurable schedule, or event-based after adapter changes (30 s debounce)
- **Script Documentation** — lists all JavaScript/Blockly scripts with name, status, description and trigger type
- **Dependency Analysis** — which scripts reference which states (regex-based), cross-reference table for shared states
- **Maintenance Hints** — flags scripts without description and disabled adapter instances with documentation score
- **Diagnosis Section** — scan statistics, Node.js version badge (LTS check), OS info, data-driven findings including OS update reminder
- **Troubleshooting Section** — 4 concrete scenarios (adapter not starting, not connecting, script not running, doc not generating) with numbered steps
- **Node.js & OS Info** — host Node.js version displayed with green/red LTS badge, kernel and architecture in system chapter
- **Smart Adapter Table** (Admin) — enabled adapters shown by default; disabled adapters collapsed in a toggle group; real-time filter with hints
- **Script Folder Labels** — Root, General Scripts (common), Global Scripts (global) and custom folders shown in human-readable form
- **AI-enhanced Documentation** (opt-in) — pluggable providers: Anthropic Claude, Groq (free tier), Ollama (local/private); narrative summary for user/onboarding profiles
- **Notifications** — send a message via Telegram, Email, Pushover or generic `sendTo` after generation
- **Manual Context** — add project description, contact info, and per-adapter / per-room notes via configuration
- **Search in HTML** — client-side filter in the generated HTML file, no server needed

## Installation

Install via ioBroker admin under **Adapters → Install from custom URL**:

```
https://github.com/crunchip77/ioBroker.autodoc/tarball/dev
```

## Configuration

Open the adapter settings in the ioBroker admin UI.

| Setting | Description | Default |
|---|---|---|
| **Project name** | Name of your ioBroker project or installation | — |
| **Target system** | Usually `ioBroker` | `ioBroker` |
| **Documentation profile** | Target audience: `admin`, `user`, `onboarding` | `admin` |
| **Documentation language** | Language for generated documentation | `en` |
| **Read live states** | Show current device values in Onboarding/User profiles (thermostat, door/window) | off |
| **Generate on adapter start** | Create documentation automatically when adapter starts | off |
| **Generate on adapter changes** | Regenerate after adapter install/remove/enable/disable (30 s debounce) | off |
| **Auto-generate interval (hours)** | Periodically generate every X hours, `0` = disabled | `0` |
| **Only document enabled instances** | Exclude disabled adapter instances from the output | off |
| **Hide instance details** | Show only summary counts, no per-instance rows | off |
| **Maximum documented instances** | Cap the number of instances in the output, `0` = unlimited | `0` |
| **Maximum stored documentation files** | How many timestamped file sets to keep, oldest deleted automatically | `5` |
| **ioBroker base URL** | Used for `info.htmlUrl`, e.g. `192.168.1.100:8081`. Protocol optional. | — |
| **Manual context (JSON)** | Structured info: `{"description":"...","contact":"...","notes":"...","adapters":{},"rooms":{}}` | — |
| **AI provider** | `none`, `anthropic`, `groq`, or `ollama`. Not used for admin profile | `none` |
| **AI model** | Model ID — leave empty for provider default | — |
| **API key** | Anthropic (`sk-ant-...`) or Groq (`gsk_...`) — not needed for Ollama | — |
| **Ollama base URL** | Only for Ollama, e.g. `http://localhost:11434` | — |

### Documentation Profiles

| Profile | Audience | Language | Content |
|---|---|---|---|
| **admin** | System administrator | Technical | Full system overview, adapter table with badges, device hierarchy with OIDs, script analysis, maintenance score, diagnosis |
| **user** | Family members, regular users | Plain language | Rooms with device names and icons, automations, connected systems (title only) |
| **onboarding** | New users, guests | Informal ("Du") | Welcome with city, device grid with icons and live values, automations as plain sentences, adapter cards |

### Manual Context

The **Manual context** field accepts a JSON object with the following structure:

```json
{
  "description": "Our smart home in Munich",
  "contact": "Max, 0171-123456",
  "notes": "WiFi password: ...",
  "adapters": {
    "hue.0": "Controls living room and kitchen lights",
    "telegram.0": "Family notifications — add via /start"
  },
  "rooms": {
    "Living room": "Shutters close automatically at 21:00",
    "Bedroom": "Do not disturb mode active from 22:00"
  }
}
```

- `adapters` notes are shown per-adapter in the documentation (all profiles)
- `rooms` notes are shown per-room in all profiles
- Sensitive fields in adapter native configs (passwords, tokens, keys) are always filtered out automatically

## Usage

1. Open the adapter configuration and fill in your project details.
2. Select the desired profile and language.
3. Save and restart the adapter, or set `autodoc.0.action.generate` to `true` in the Objects view.
4. Find the generated files in `/files/autodoc.0/` — open the `.html` file in any browser or the `.md` file in any Markdown viewer.

## States

### Actions

| State | Type | Description |
|---|---|---|
| `action.generate` | button | Set to `true` to trigger manual documentation generation |
| `action.downloadMarkdown` | button | Write latest Markdown content to `autodoc.md` in `/files/` |
| `action.downloadHtml` | button | Write latest HTML content to `autodoc.html` in `/files/` |
| `action.downloadJson` | button | Write latest JSON content to `autodoc.json` in `/files/` |

### Documentation

| State | Type | Description |
|---|---|---|
| `documentation.lastMarkdownFile` | string | Filename of the last generated Markdown file |
| `documentation.lastHtmlFile` | string | Filename of the last generated HTML file |
| `documentation.lastJsonFile` | string | Filename of the last generated JSON file |
| `documentation.markdown` | string | Full Markdown content of the last generation |
| `documentation.html` | string | Full HTML content of the last generation |
| `documentation.json` | json | Full JSON document model of the last generation |
| `documentation.stateSummary` | json | Summary of discovered state objects |

### Info

| State | Type | Description |
|---|---|---|
| `info.connection` | boolean | `true` while the adapter is running |
| `info.lastGeneration` | string | ISO timestamp of the last generation |
| `info.lastTrigger` | string | Trigger source: `startup`, `manual`, `scheduled`, `event` |
| `info.summary` | string | Human-readable summary of the last generation |
| `info.systemLanguage` | string | ioBroker system language from `system.config` |
| `info.instanceCount` | number | Total documented adapter instances |
| `info.enabledInstanceCount` | number | Number of enabled instances |
| `info.disabledInstanceCount` | number | Number of disabled instances |
| `info.hostName` | string | Primary host name |
| `info.hostPlatform` | string | Primary host platform |
| `info.hostVersion` | string | Primary host ioBroker version |
| `info.totalStateObjects` | number | Total number of state objects found |
| `info.writableStateObjects` | number | Number of writable state objects |
| `info.readonlyStateObjects` | number | Number of read-only state objects |
| `info.instanceHosts` | json | Host summary for documented instances |

### Versioning

| State | Type | Description |
|---|---|---|
| `versioning.latestVersion` | string | Version string of the last generation (YYYY.MM.DD.HH) |
| `versioning.changeCount` | number | Number of changes detected vs. previous version |
| `versioning.changelog` | json | History of the last 50 generations with change details |
| `versioning.lastDocumentModel` | json | Full document model of the previous generation (used for diff) |

## Output Files

Generated files are stored in `/files/autodoc.0/` with a timestamp in the filename, e.g.:

```
autodoc-2026-04-04T10-30-00-000Z.md
autodoc-2026-04-04T10-30-00-000Z.html
autodoc-2026-04-04T10-30-00-000Z.json
```

The HTML file is a **standalone** document — no internet connection required, no external dependencies. It includes a sidebar navigation, statistics cards, adapter tables with status badges and a responsive layout.

## Roadmap

### v0.1 — Basis ✅
Modular architecture, file export, three profiles, adapter metadata, version tracking, auto-generation, i18n.

### v1.0 — Content ✅
Rooms & functions, script documentation, maintenance hints, client-side search in HTML.

### v1.x — Depth ✅
Notifications, dependency analysis, AI-enhanced documentation, full i18n (EN/DE/FR), adapter metadata enrichment, structured manual context.

### v1.5 — Profile Redesign ✅
Genuine per-audience documentation — completely different language and structure per profile:
- **Dispatcher architecture** — `renderAdminHtml()` / `renderUserHtml()` / `renderOnboardingHtml()`
- **Device resolution** — room members resolved to human-readable names, categories, icons
- **Role mapping** — 29 ioBroker role patterns → 14 categories + icons
- **Live state values** (opt-in) — thermostat temperature, door/window status
- **Onboarding** — city-aware welcome, device grid, automations as plain sentences, AI box prominent
- **User/Family** — device cards per room, scripts name+description only, adapters title only
- **Admin** — device hierarchy table per room with OIDs, diagnosis section with scan statistics and concrete troubleshooting paths

### v2.x — Extensions (planned)
- PDF export
- Backup adapter integration — save documentation together with backups
- Custom templates

## Changelog

### 1.5.0-dev
- Profile redesign: genuine per-audience templates for Admin, User and Onboarding
- Device resolution and role mapping (29 patterns → 14 categories + icons)
- Live state values (opt-in), system.config integration
- Admin diagnosis section: scan statistics, Admin UI paths, data-driven findings incl. Node.js LTS check and OS update reminder
- Fehlerbehebung / Troubleshooting section: 4 concrete scenarios with numbered steps
- Node.js version badge (green = LTS ≥ v20, red = outdated) and OS kernel/arch in system chapter and hosts table
- Adapter table (Admin): disabled instances collapsed by default, real-time filter with field hints
- Script folder labels: Root, General Scripts (common), Global Scripts (global), custom folders
- Adapter badges: connection type (Local/Cloud), data source (Push/Polling), quality tier
- Removed misleading "instances without room assignment" metric
- Multiple bugfixes (room.devices alignment, onboarding adapter section, markdownRenderer crash)

### 1.0.0
- Notifications after generation: Telegram, Email, Pushover, Signal, WhatsApp, generic
- Dependency analysis: state references extracted from script source, cross-reference table (Admin)
- AI-enhanced documentation (opt-in): narrative summary and maintenance recommendations
- Full i18n: all rendered output translated (EN, DE, FR)
- Fixed `autodoc-latest.{md,html,json}` files for stable browser access
- New `info.htmlUrl` state with direct URL to latest HTML via web adapter
- Configurable file rotation (`maxStoredFiles`, default 5 timestamped sets)

### 0.1.0
- Modular architecture: `lib/discovery.js`, `lib/documentModel.js`, `lib/markdownRenderer.js`, `lib/htmlRenderer.js`, `lib/versionTracker.js`, `lib/i18n.js`
- File-based export: Markdown, HTML, and JSON to `/files/autodoc.0/`
- Three documentation profiles: Admin, User, Onboarding with profile-aware content
- HTML export with sidebar navigation, stat cards, and adapter cards
- Version tracking with changelog generation
- Automatic generation: on startup, timer, event-based with 30 s debounce
- i18n support: English, German, French
- Rooms & functions chapter: reads `enum.rooms` and `enum.functions`
- Admin UI via `jsonConfig.json5` with full i18n (EN, DE)

### 0.0.1
- Initial release with Markdown/HTML/JSON export, three documentation profiles, automatic discovery, version tracking

## License

MIT License

Copyright (c) 2026 crunchip77 <41550245+crunchip77@users.noreply.github.com>
