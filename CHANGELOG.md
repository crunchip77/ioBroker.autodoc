# Changelog

## [Unreleased] — dev branch

### Added
- Generate all three profiles (Admin, User, Onboarding) simultaneously in one pass — separate HTML files `autodoc-admin.html`, `autodoc-user.html`, `autodoc-onboarding.html`
- **"Generate now" button** in adapter settings — trigger documentation without restarting
- `sendTo('autodoc.0', 'generateNow', {})` command for use in ioBroker scripts and automations
- New ioBroker states: `info.htmlUrlAdmin`, `info.htmlUrlUser`, `info.htmlUrlOnboarding`
- **Dark mode toggle** in generated HTML (floating button, preference stored in localStorage)
- **Full-text search** in generated HTML — real-time highlighting with prev/next navigation (Enter / Shift+Enter), Escape clears
- **Print-friendly CSS** — `@media print` hides navigation, expands collapsed `<details>` blocks
- **Changelog section** in Admin profile — last 5 entries visible, older entries and change details collapsible
- **Collapsible rooms** — each room in all profiles wrapped in `<details>` (room name + device count as summary)
- **Collapsible device hierarchy** in Admin profile — per room
- **User/Family hide list** — `userHideRooms` and `userHideAdapters` config tables to exclude content from User profile
- **Onboarding hide list** — `onboardingHideRooms` and `onboardingHideAdapters` config tables to exclude technical rooms/adapters from guest view
- **Ansprechpartner (contact person)** shown prominently on Onboarding welcome page with 👤 icon
- **Mistral AI** provider added; Google AI removed; privacy warning added prominently to AI settings tab
- Clickable documentation link in ioBroker admin instance list via `localLinks`
- Collapsible maintenance tables (scripts without description, disabled instances)
- Script filter + collapsible inactive scripts in Admin profile
- Tabbed admin UI (Basic settings, My documentation, Advanced, Notifications, AI documentation)
- Per-adapter notes, per-room notes, contact person, general notes as dedicated table inputs
- `autoGenerateInterval` for scheduled generation (hourly)

### Fixed
- Node.js version displayed correctly (was showing js-controller version)
- js-controller version now shown separately in Diagnosis section
- `renderManualContext` received raw config instead of parsed `docModel.manualContext`
- `UNCAUGHT_EXCEPTION` in `aiEnhancer.js` for User/Onboarding profiles (removed stale `instancesWithoutRoom` reference)
- Missing comma in `admin/i18n/de.json` and `en.json` causing mixed-language UI
- i18n help text lookup mismatch caused by em-dash vs hyphen in key strings
- `jsonConfig` validation error: `header` type missing required `size` property
- `localLinks` `%INSTANCE%` placeholder not supported — hardcoded to instance `0`
- Dead code `void roomNote` in `renderUserRoomsChapter`

### Changed
- `buildHtmlUrl()` refactored to `buildBaseUrl()` — profile-specific URLs constructed separately
- `persistDocumentation()` now writes all three HTML profiles instead of one
- Onboarding automations section: shows fallback when no active scripts, separates described/undescribed scripts

---

## [1.0.0] — 2025-xx-xx

### Added
- Initial release
- Multi-profile HTML/Markdown documentation generation (Admin, User/Family, Onboarding)
- Adapter instance discovery, rooms, functions, scripts
- Version tracking and changelog storage
- AI enhancement (Ollama, Groq, Anthropic)
- Notifications (Telegram, email, Pushover)
- i18n: English, German, French
