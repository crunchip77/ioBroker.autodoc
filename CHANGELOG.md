# Changelog

## [0.9.0] — 2026-04-07 (Release Candidate)

### Added
- **Mobile responsive layout** — hamburger menu (☰) on screens ≤ 700 px; nav sidebar opens as overlay; full-width content on phones
- **Dark mode toggle in nav sidebar** — always visible, labeled (🌙 Dark Mode / ☀️ Hell Mode), no longer a floating button
- **Stale documentation warning** — yellow banner when docs are older than 7 days; red/critical after 30 days (client-side JS, no server needed)
- **Adapter health badge** — `12/14 aktiv` shown directly next to the page title in all profiles
- **Relative timestamps** — generation time displays as "vor 2 Stunden" in addition to exact time; hover shows full timestamp
- **QR code on Onboarding** — scan to share page URL; graceful fallback to "Link kopieren" button when CDN unavailable; copy works over HTTP (execCommand fallback)
- **Search hints** — help text `↑↓ navigieren · Esc = löschen` appears on focus; arrow buttons have descriptive tooltips
- **Host RAM / CPU / Uptime** — new columns in Admin hosts table; reads `freemem`/`totalmem` (native) or process RAM (Docker-aware fallback)
- **System location & timezone** — reads `system.config` (city, country, timezone); shown in Admin System Overview
- **Active repository badge** — shows which ioBroker repo channel is active (`stable` = green, `beta`/`latest` = yellow); in Admin System Overview
- **Script schedules** — cron expressions read from `script.common.schedule`; shown as human-readable badge in script table (e.g. "täglich um 06:00", "alle 15 min", "Mo–Fr um 08:00")
- **User-defined variables chapter** — new Admin-only section for all `0_userdata.0.*` datapoints; grouped by folder, shows type, current value, description
- **Pending adapter updates** — amber stat card in Admin when updates are available (reads `system.adapter.<name>.latestVersion`)
- **BackItUp integration** — last backup date shown as stat card in Admin (reads `backitup.0.info.lastBackup`; silently skipped if not installed)
- **RENDERER_VERSION auto-regenerate** — adapter stores `info.templateVersion` after each generation; on next start, if the HTML renderer has changed, documentation is automatically regenerated — no more manual version bumps needed as cache busters
- `info.nextGeneration` state — ISO timestamp of next scheduled generation
- `info.templateVersion` state — HTML renderer version used for last generation

### Changed
- **Onboarding profile order** — "Tips & Notes" now appears directly after the welcome text (before stat cards); stat cards moved after tips for better context on first visit
- **Onboarding functions** — function chips moved from before rooms to after rooms, presented as a capability summary box ("Steuerbare Bereiche im ganzen Haus")
- **User profile functions** — "Funktionen" is now a separate `<h3>` section clearly visually separated from the room list; collapsed by default
- **Location section** — temperature unit removed (it is a UI preference, not meaningful system information)
- Version reset from `1.2.1` → `0.9.0` to align with ioBroker adapter versioning convention (1.0.0 = first official npm release)

### Fixed
- Dark mode text colors — hardcoded `#555` / `#444` colors replaced with `var(--text)` / `var(--text-faint)` throughout
- RAM displayed as "0 / 0 MB" on Docker/Unraid — corrected state names (`freemem`/`totalmem` are in MB, not bytes); process RAM fallback added
- QR copy button silently failing over HTTP — `navigator.clipboard` requires HTTPS; fallback to `document.execCommand('copy')` added
- `color:#555` hardcoded in Onboarding description box — now uses `var(--text)` for correct dark mode rendering

---

## [Unreleased / 1.x-dev] — previous development entries

### Added
- Generate all three profiles (Admin, User, Onboarding) simultaneously — separate HTML files
- **"Generate Now" button** in adapter settings via `setState` on `action.generate`
- `sendTo('autodoc.0', 'generateNow', {})` support
- New states: `info.htmlUrlAdmin`, `info.htmlUrlUser`, `info.htmlUrlOnboarding`
- **Dark mode toggle** in generated HTML (localStorage)
- **Full-text search** — real-time highlighting, prev/next navigation, Escape to clear
- **Print-friendly CSS** — nav hidden, `<details>` expanded on print
- **Changelog section** in Admin profile
- **Collapsible rooms** in all profiles (`<details>`)
- **Collapsible device hierarchy** in Admin profile
- **User/Family hide list** — `userHideRooms`, `userHideAdapters`
- **Onboarding hide list** — `onboardingHideRooms`, `onboardingHideAdapters`
- Contact person shown prominently on Onboarding welcome
- Mistral AI provider; Google AI removed; privacy warning in AI tab
- Multiple local links in instance list (Admin, User, Onboarding)
- Tabbed admin UI (5 tabs)
- Per-adapter notes, per-room notes as table inputs

### Fixed
- Node.js version showing js-controller version instead
- `renderManualContext` received raw config instead of parsed `docModel.manualContext`
- `UNCAUGHT_EXCEPTION` in `aiEnhancer.js` for User/Onboarding profiles
- Missing comma in `admin/i18n/de.json` and `en.json`
- `jsonConfig` validation: `header` type missing required `size` property
- `localLinks` `%INSTANCE%` placeholder not supported
- Adapter restart loop caused by `extendForeignObjectAsync` in `onReady`
- `htmlFilename is not defined` in `persistDocumentation`
- `versionTracker.js` crash on fresh install (null check for `previousDocModel`)

---

## [1.0.0] — internal milestone

- Notifications: Telegram, Email, Pushover, Signal, WhatsApp, generic
- Dependency analysis: state references from script source, cross-reference table
- AI-enhanced documentation (opt-in): Ollama, Groq, Anthropic
- Full i18n: EN, DE, FR
- `info.htmlUrl` state, file rotation, `maxStoredFiles`

## [0.1.0] — initial release

- Modular architecture: `discovery.js`, `documentModel.js`, `htmlRenderer.js`, `markdownRenderer.js`, `versionTracker.js`, `i18n.js`
- Three documentation profiles: Admin, User, Onboarding
- Rooms & functions from `enum.rooms` / `enum.functions`
- Version tracking with changelog
- Auto-generation: startup, timer, event-based
- Admin UI via `jsonConfig.json5`
