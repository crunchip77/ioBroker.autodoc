![Logo](admin/autodoc.png)

# ioBroker.autodoc

Automatically generates structured documentation (HTML, Markdown, JSON) for your ioBroker installation — on demand, on a schedule, or when the system changes.

**Version:** 0.9.7

| | |
| --- | --- |
| **Install** | [ioBroker Admin](https://www.iobroker.net/#en/documentation) — from the adapter list when published, or from this repository while in RC/testing. |
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

- **Node.js** ≥ 22 (see `package.json` `engines`)

## Configuration

Configure the instance in **ioBroker Admin** (tabs for basics, manual notes, advanced options, notifications, AI). Generation can be triggered manually, on startup, on a timer, and after adapter changes (debounced).

Useful **states** (selection): `action.generate`; `info.lastGeneration` / `info.nextGeneration`; `info.htmlUrlAdmin` / `info.htmlUrlUser` / `info.htmlUrlOnboarding`; `info.templateVersion` (HTML template / renderer alignment).

## Features (overview)

- Discovery across instances, hosts, enums, scripts, aliases, userdata, system config
- Standalone HTML per profile with search, dark mode, responsive layout
- Markdown + JSON export and version history (rotation configurable)
- Maintenance-oriented hints (e.g. documentation score, scripts without description)
- Multilingual Admin UI strings (e.g. EN / DE / FR); generated copy follows your configured project language where applicable
- Optional AI providers (e.g. Ollama, Groq, Anthropic) with strict opt-in

For **roadmap, phases, and detailed internal notes**, see [`TODO.md`](TODO.md) and [`PLAN.md`](PLAN.md).

**Contributing / releases:** see [`CONTRIBUTING.md`](CONTRIBUTING.md).

## Changelog

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
