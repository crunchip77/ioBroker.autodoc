# Changelog

All notable changes to this project are documented here. The adapter version is in `package.json` / `io-package.json`; HTML template iterations use `RENDERER_VERSION` in `lib/htmlRenderer.js`.

## [0.9.2] — 2026-04

**Release candidate (forum / pre-npm).**

### Added

- **Aliases chapter (Admin)** — reads `alias.0.*`, shows read/write targets, grouped by folder, with search filter
- **RAM: total ioBroker memory** — sums `system.adapter.*.*.memRss` when host system RAM is unavailable (Docker); label **(alle Adapter)**; js-controller-only fallback labelled **(js-controller)**
- **Documentation score** — short explanation text above the score bar (what 0–100 % means)
- **User-defined variables & aliases** — search filter bars + open-all-groups on search
- **Manual notes position** — project/contact/notes block moved **up** in Admin and User profiles (right after header)
- **Onboarding** — “What can this smart home?” capability cards from functions/categories; tips section **always** shown (fallback text if no notes); admin hint when no manual content; **⏱** next to scheduled scripts
- **Visual cues (HTML)** — gold: manual notes (room arrow, table row, adapter card, disabled-adapter group when any note); orange: maintenance / disabled scripts groups; blue: script rows with cron schedule; Onboarding clock mark for schedules
- **Navigation** — TOC order matches manual-notes-first where applicable

### Changed

- **Repository badge** — moved from “Location” to **Diagnosis** section
- **Changelog cards** — colours use CSS variables (readable in dark mode)
- **Collapsible summaries** — `var(--text)` instead of hardcoded greys for dark mode

### Fixed

- **RAM cell** — escaped HTML showed raw `<small>` tags; `esc()` removed for composed RAM cell
- **Host RAM** — `memRss` values are already in MB in js-controller (no double division)
- **Search hint** — always visible; colour uses theme variables
- **CI (GitHub Actions)** — `check-and-lint`: ESLint for inlined client script in `wrapPage`, `npm run check` / `StateCommon` cast, LF line endings (`.gitattributes`)
- **Adapter checker / packaging** — `io-package` / `package.json` (admin dep, native fields, keywords, news i18n), single `jsonConfig.json`, Dependabot + automerge workflow
- **Git tags** — release tag **`v0.9.2`** marks this RC; misleading **`v1.0.0`** tag removed on GitHub (adapter stays on **0.9.x** until a real **1.0.0** release)

---

## [0.9.1] — 2026-04

### Added

- Dark mode fixes for collapsibles and changelog; search hint visibility
- Admin: **Funktionen** as proper `<h3>` before collapsible list
- Various i18n keys (repo, score, aliases, …)

### Fixed

- jsonConfig / admin UI validation issues (previous iterations)

---

## [0.9.0] — 2026-04-07

### Added

- Mobile layout (hamburger, overlay nav); stale-docs banner; health badge; relative timestamps
- QR code + copy fallback on Onboarding; search hints in nav
- Host RAM/CPU/uptime; location & timezone; script cron schedules as badges
- User-defined variables (`0_userdata.0`); pending updates; BackItUp last backup
- `info.templateVersion` + `RENDERER_VERSION` auto-regenerate on template change
- `info.nextGeneration` state

### Changed

- Onboarding order: tips before stat cards; function chips after rooms
- Version aligned to `0.9.x` pre-1.0 convention

### Fixed

- Docker RAM display; clipboard on HTTP; numerous dark-mode contrast issues

---

## Earlier history

See git history and previous README sections for 0.1.0–0.8, profile redesign, AI providers, notifications, three-profile HTML, etc.

---

## [0.1.0] — initial architecture

- `discovery.js`, `documentModel.js`, `htmlRenderer.js`, `markdownRenderer.js`, `versionTracker.js`, `i18n.js`
- Three profiles, file export, version tracking, jsonConfig admin UI
