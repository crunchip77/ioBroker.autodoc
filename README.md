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

- **Automatic Discovery** — scans all adapter instances, hosts, state objects and system metadata
- **Three Target Profiles** — Admin, User/Family, Onboarding, each with different language and level of detail
- **Adapter Descriptions** — automatically reads adapter titles and descriptions from ioBroker metadata, no manual input needed, multilingual
- **Markdown + HTML Export** — files saved directly to `/files/autodoc.0/`, readable in any browser
- **Multilingual** — documentation language selectable: English, German (more via i18n)
- **Version Tracking** — every generation is versioned (YYYY.MM.DD.HH), changes are detected and logged in a changelog
- **Flexible Triggering**:
  - Manual via button in ioBroker admin or state
  - Automatic on adapter start
  - Scheduled at a configurable interval (hours)
  - Event-based after adapter installs, removals or enable/disable changes (30 s debounce)
- **Manual Context** — add project description, contact and custom notes via configuration
- **Configurable Filters** — limit to enabled instances only, hide instance details, cap instance count

## Installation

Install via ioBroker admin under **Adapters → Search → autodoc**, or directly from GitHub:

```
iobroker url https://github.com/crunchip77/ioBroker.autodoc
```

## Configuration

Open the adapter settings in the ioBroker admin UI.

| Setting | Description | Default |
|---|---|---|
| **Project name** | Name of your ioBroker project or installation | — |
| **Target system** | Usually `ioBroker` | `ioBroker` |
| **Documentation profile** | Target audience: `admin`, `user`, `onboarding` | `admin` |
| **Documentation language** | Language for generated documentation | `en` |
| **Project description** | Short description of what is being documented | — |
| **Additional notes** | Optional hints, devices, or special requirements | — |
| **Generate on adapter start** | Create documentation automatically when adapter starts | off |
| **Generate on adapter changes** | Regenerate after adapter install/remove/enable/disable (30 s debounce) | off |
| **Auto-generate interval (hours)** | Periodically generate every X hours, `0` = disabled | `0` |
| **Only document enabled instances** | Exclude disabled adapter instances from the output | off |
| **Hide instance details** | Show only summary counts, no per-instance rows | off |
| **Maximum documented instances** | Cap the number of instances in the output, `0` = unlimited | `0` |
| **Manual context (JSON)** | Additional structured info: `{"description":"...","contact":"...","notes":"..."}` | — |

### Documentation Profiles

| Profile | Audience | Adapter presentation | Technical details |
|---|---|---|---|
| **admin** | System administrator | Technical name + description + instance list | Full — hosts, state stats, appendices |
| **user** | Family members, regular users | Human-readable title + description, active adapters only | Minimal — status only |
| **onboarding** | New users, guests | Human-readable title + description + friendly note | None |

Each adapter's description is read directly from ioBroker metadata (`common.desc`, `common.titleLang`) in the configured documentation language — no manual input required.

## Usage

1. Open the adapter configuration and fill in your project details.
2. Select the desired profile and language.
3. Save and restart the adapter, or click **Generate documentation** in the ioBroker Objects view by setting `autodoc.0.action.generate` to `true`.
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

### v1.x — Should-Have
- **Notification adapter integration** — send a message when new documentation is generated (Telegram, Pushover, Email)
- **Backup adapter integration** — attach documentation to backups
- **History adapter integration** — extended long-term documentation history
- **Multilingual templates** — localized section headings and content throughout
- **Developer API** — REST endpoint and webhook support for third-party integrations

### v2.x — Nice-to-Have
- **PDF export** — generate a print-ready PDF alongside HTML/Markdown
- **Custom templates** — bring-your-own layout and chapter structure
- **Troubleshooting assistant** — automated health checks with suggested fixes
- **Analytics** — adapter usage statistics and system health trends

## Changelog

### 0.0.1
- Initial release with Markdown/HTML/JSON export, three documentation profiles, automatic discovery, version tracking, event-based and scheduled auto-generation

## License

MIT License

Copyright (c) 2026 crunchip77 <41550245+crunchip77@users.noreply.github.com>
