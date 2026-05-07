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

### `package-lock.json` and `npm ci`

CI (`ioBroker/testing-action-check`) runs **`npm ci`**. The optional **@mermaid-js/mermaid-cli** chain (Puppeteer / `chromium-bidi` / Mermaid) depends on versions that must appear as **full** `packages["node_modules/…"]` entries in the lockfile. The repo therefore uses **`overrides`** (`chromium-bidi` → pinned `devtools-protocol`) and explicit **devDependencies** (`cytoscape`, `d3-selection`, `devtools-protocol`) so Linux + Node 22/24 installs stay in sync.

After changing **dependencies** or **overrides**, run **`npm install`**, commit **`package.json`** and **`package-lock.json`** together, and verify **`npm ci`** on a clean **`node_modules`** locally if you can.

## Releases and README changelog

- Keep the **Changelog** section in [`README.md`](README.md) aligned with **`common.news`** in `io-package.json`: list only the **same 7** newest versions; move dropped versions into [`CHANGELOG_OLD.md`](CHANGELOG_OLD.md) (see intro there).
- Add a dated `### x.y.z` section at the **top** of that window when you ship a release (expected for ioBroker adapter listings).
- Keep **`version`** in `package.json` and `io-package.json` consistent with the documented release (Adapter Checker may flag mismatches, e.g. **E6006** — follow the checker output for the current ruleset).
- Bump **`version`** in `package.json` and `io-package.json` together.
- Update **`common.news`** in `io-package.json` (max **7** entries for [Adapter Checker](https://adapter-check.iobroker.in/) / repository listings — drop the oldest key when you add a release; move the dropped **README** section to [`CHANGELOG_OLD.md`](CHANGELOG_OLD.md); keep longer prose history there).
- Before proposing inclusion in the stable/beta repository set, run the **[Adapter Checker](https://adapter-check.iobroker.in/)** against the package and fix reported issues.

### npm version vs HTML renderer build

The published **adapter semver** (`package.json` / `io-package.json`) is independent of the **HTML renderer build** string `RENDERER_VERSION` in `lib/htmlRenderer.js`. Generated pages may contain `<!-- autodoc-renderer:… -->` in `<head>` for debugging template drift — do not confuse that marker with the npm package version.

**When to bump `RENDERER_VERSION` (in `lib/htmlRenderer.js`, format `YYYY.MM.DD.NN`):**

- **Do bump** when anything users should receive in **exported** docs changes: HTML shell/layout/CSS, chapter body rendering, **Markdown** export wording or structure from `lib/markdownRenderer.js`, Quick Start / guest sections, or other pipeline output written under `/files/`. On adapter start, `main.js` compares this string to `info.templateVersion` and **queues a full documentation run** on mismatch—so installs with **Generate on start** disabled still refresh once after an update.
- **Skip the bump** for changes that do not affect generated HTML/Markdown/JSON **content or structure** (e.g. refactors only touching Admin config UI, logging, or unused code paths).
- Increment the trailing **`.NN`** for a second or third change on the same calendar day.
- For a numbered release, note the new `RENDERER_VERSION` in the **README** changelog when it matters for support or upgrade notes (optional for purely internal tweaks).

<a id="admin-ui-translations-i18n"></a>

### Admin UI translations (i18n)

- Source of truth for **keys** is `admin/i18n/en.json`. **DE** and **FR** are maintained alongside English for important releases.
- Other locale files (`es`, `it`, `nl`, `pl`, `pt`, `ru`, `uk`, `zh-cn`, …) may use **English text as a fill-in** for missing keys so the Admin never shows raw key names. **Native speakers:** PRs to replace those strings with real translations are welcome; no need to re-translate the whole file at once.
- After adding keys to `en.json`, update **DE/FR** when you can, and either run the project’s i18n workflow or copy the new English string into other locales until translated.
