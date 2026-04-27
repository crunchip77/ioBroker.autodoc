# Contributing to ioBroker.autodoc

This file is for **contributors in the Git repository**. It is intentionally **not** listed in the `files` array in `package.json`: the **npm tarball** for ioBroker installs should contain **runtime files only** (same idea as adapters generated with [create-adapter](https://github.com/ioBroker/create-adapter)). **`README.md`** is still published (npm always includes it). **`LICENSE`** is listed in `files` so it is part of the package contents.

## References (ioBroker ecosystem)

Use the links at the top of [`TODO.md`](TODO.md) (**Wichtige Referenzen**) while developing or reviewing changes:

- [ioBroker AI Developer Guide](https://github.com/Jey-Cee/iobroker-ai-developer-guide)
- [Adapter Creator](https://github.com/ioBroker/create-adapter)
- [Adapter Checker](https://adapter-check.iobroker.in/)

Roadmap and internal task tracking: [`TODO.md`](TODO.md), [`PLAN.md`](PLAN.md).

## Branch workflow (Git)

- **Develop on `dev`:** use `git checkout dev` for everyday commits and experiments. Pushes: `git push origin dev`.
- **Merge to `main` when stable:** when a version is ready for a broader default (URL installs from `main`, pre-release testing complete), merge into `main` and push, e.g. `git checkout main && git pull && git merge dev && git push origin main`, then return to `dev` for further work: `git checkout dev`. If `main` ever receives a hotfix alone, merge `main` back into `dev` so both branches stay aligned.

## Local checks

```bash
npm install
npm test
npm run lint
npm run check
```

Optional: `npm run dev-server` for a local Admin/dev loop (see `@iobroker/dev-server`).

## Releases and README changelog

- Add a dated `### x.y.z` section under **Changelog** in [`README.md`](README.md) (expected for ioBroker adapter listings).
- Keep **`version`** in `package.json` and `io-package.json` consistent with the documented release (Adapter Checker may flag mismatches, e.g. **E6006** — follow the checker output for the current ruleset).
- Bump **`version`** in `package.json` and `io-package.json` together.
- Update **`common.news`** in `io-package.json` (max **7** entries).
- Before proposing inclusion in the stable/beta repository set, run the **[Adapter Checker](https://adapter-check.iobroker.in/)** against the package and fix reported issues.

### npm version vs HTML renderer build

The published **adapter semver** (`package.json` / `io-package.json`) is independent of the **HTML renderer build** string `RENDERER_VERSION` in `lib/htmlRenderer.js`. Generated pages may contain `<!-- autodoc-renderer:… -->` in `<head>` for debugging template drift — do not confuse that marker with the npm package version.

<a id="admin-ui-translations-i18n"></a>

### Admin UI translations (i18n)

- Source of truth for **keys** is `admin/i18n/en.json`. **DE** and **FR** are maintained alongside English for important releases.
- Other locale files (`es`, `it`, `nl`, `pl`, `pt`, `ru`, `uk`, `zh-cn`, …) may use **English text as a fill-in** for missing keys so the Admin never shows raw key names. **Native speakers:** PRs to replace those strings with real translations are welcome; no need to re-translate the whole file at once.
- After adding keys to `en.json`, update **DE/FR** when you can, and either run the project’s i18n workflow or copy the new English string into other locales until translated.
