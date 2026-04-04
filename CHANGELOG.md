# CHANGELOG

## 0.1.0 (2026-04-04)

Phase 1 complete — adapter is fully functional with modular architecture,
three documentation profiles, HTML export, version tracking, and i18n support.

### Features
- Modular architecture: `lib/discovery.js`, `lib/documentModel.js`, `lib/markdownRenderer.js`, `lib/htmlRenderer.js`, `lib/versionTracker.js`, `lib/i18n.js`
- File-based export: Markdown, HTML, and JSON to `/files/autodoc.0/`
- Three documentation profiles: Admin, User, Onboarding — each with profile-aware content and detail level
- HTML export with sidebar navigation, stat cards, and adapter cards
- Adapter descriptions and titles from ioBroker metadata (`common.desc`, `common.titleLang`)
- Version tracking with semantic versioning and changelog generation
- Automatic documentation generation: on startup, on timer (configurable interval), event-based with 30s debounce
- i18n support with translations for English, German, and French
- Local timestamps for generated file names
- Admin UI via `jsonConfig.json5` with full i18n (EN, DE)

### Fixes
- Use local time instead of UTC for documentation file names
- Lint-clean codebase (prettier + eslint)

---

## 0.0.1 (2026-04-01)

Initial adapter scaffold.

### Features
- Generate markdown documentation from adapter configuration
- Generate JSON documentation from adapter configuration
- Read basic ioBroker system information from `system.config`
- Read host information of the current adapter instance
- Detect adapter instances including host, enabled state, title and version
- Build enabled and disabled instance summaries
- Build per-host instance summaries
- Support optional filtering to enabled instances only
- Support optional compact markdown output without full instance details
- Support optional limit for documented instances
- Include applied filter metadata in markdown and JSON output
- Support automatic generation on adapter start
- Support manual generation via `action.generate`

### States
- Add `info.connection`
- Add `info.lastGeneration`
- Add `info.lastTrigger`
- Add `info.summary`
- Add `info.systemLanguage`
- Add `info.instanceCount`
- Add `info.enabledInstanceCount`
- Add `info.disabledInstanceCount`
- Add `info.instanceHosts`
- Add `info.hostName`
- Add `info.hostPlatform`
- Add `info.hostVersion`
- Add `documentation.markdown`
- Add `documentation.json`
- Add `action.generate`
