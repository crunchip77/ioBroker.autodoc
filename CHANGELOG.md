# Changelog

## **WORK IN PROGRESS**

## 0.9.7 (2026-04-11)

-   (crunchip77) AI: configurable HTTP request timeout; optional sampling temperature for user vs onboarding profiles (empty = provider default).
-   (crunchip77) AI: room/category grounding block in prompts to reduce off-topic inventions.
-   (crunchip77) AI onboarding: neutral guest placeholder when output looks like a technical dump or would copy admin tone; HTML comment distinguishes `fallback-neutral` vs `primary`.
-   (crunchip77) AI parsing: more tolerant `NARRATIVE:` / `RECOMMENDATIONS:` splitting; strips echoed labels and empty list items.
-   (crunchip77) German prompts: stronger guest vs resident rules and wording fixes (e.g. blinds: Jalousien/Rollläden).
-   (crunchip77) Export: `meta.schemaVersion` set to `autodoc-json-1`; `meta.version` falls back to `0.0.0` if missing; removed misleading `1.0.0` news entry from `io-package.json`.

## 0.9.6 (2026-04-10)

-   (crunchip77) AI: HTML comment before KI box documents primary vs fallback source (user / onboarding).
-   (crunchip77) German onboarding: optional second LLM pass for consistent Sie-form when du/Sie mix detected.
-   (crunchip77) `docModel.ai.meta`: `onboardingFromUserFallback`, `userFromOnboardingFallback` (also in exported JSON).
-   (crunchip77) German user AI: prompt block against Denglish, unnecessary brands, and alarmist maintenance tone.

## 0.9.5 (2026-04-09)

-   (crunchip77) AI onboarding: leaner guest context (no adapter/script counts); stronger forbidden terms and German Sie-only bullets; fewer invented automation stories.

## 0.9.4 (2026-04-08)

-   (crunchip77) AI: guest-oriented onboarding facts; optional system message for OpenAI-compatible and Anthropic; guest-safety system prompt for onboarding.
-   (crunchip77) AI German: Hochdeutsch style rules and German system messages when `language` is `de`.

## 0.9.3 (2026-04-07)

-   (crunchip77) Fix: HTML viewer blank main area (script closing + search regex); version bump so installs refresh cached adapter files where applicable.
-   (crunchip77) Diagnostics: `<!-- autodoc-renderer:… -->` in HTML `<head>` to verify renderer build.

## 0.9.2 (2026-04-06)

-   (crunchip77) Admin: aliases chapter (`alias.0.*`), RAM total from adapter `memRss` when host RAM unavailable, documentation score explanation, filters for userdata and aliases, manual notes moved up in profiles.
-   (crunchip77) Onboarding: capability cards, tips section fallback, scheduled-script marker, visual cue colours (gold/orange/blue).
-   (crunchip77) Fix: RAM cell HTML escaping, host RAM units, search hint visibility, embedded chapter scripts and client search regex (blank page).
-   (crunchip77) CI and packaging: ESLint for inlined script, adapter checker fields, Dependabot; Git tag `v0.9.2` for RC; removed phantom `1.0.0` news.

## 0.9.1 (2026-04-05)

-   (crunchip77) Dark mode fixes for collapsibles and changelog; search hint always visible; admin Funktionen heading; i18n keys.

## 0.9.0 (2026-04-07)

-   (crunchip77) Mobile layout, stale-docs banner, relative timestamps, QR onboarding, host stats, userdata, template version state, cron badges, many dark-mode fixes.

## 0.8.0 and older

-   (crunchip77) See git history for 0.1.0–0.8.x: profile redesign, AI providers, notifications, three-profile HTML, core modules (`discovery.js`, `documentModel.js`, `htmlRenderer.js`, `markdownRenderer.js`, `versionTracker.js`, `i18n.js`, admin UI).
