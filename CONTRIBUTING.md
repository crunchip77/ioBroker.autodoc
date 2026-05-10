# Contributing to ioBroker.autodoc

This file is for **contributors in the Git repository**. It is intentionally **not** listed in the `files` array in `package.json`: the **npm tarball** for ioBroker installs should contain **runtime files only** (same idea as adapters generated with [create-adapter](https://github.com/ioBroker/create-adapter)). **`README.md`** is still published (npm always includes it). **`LICENSE`** is listed in `files` so it is part of the package contents.

## References (ioBroker ecosystem)

Adapter-neutral link collection (reusable across projects): [`docs/iobroker-adapter-references.md`](docs/iobroker-adapter-references.md).

Use the links at the top of [`TODO.md`](TODO.md) (**Wichtige Referenzen**) while developing or reviewing changes:

- [ioBroker AI Developer Guide](https://github.com/Jey-Cee/iobroker-ai-developer-guide)
- [Adapter Creator](https://github.com/ioBroker/create-adapter)
- [Adapter Checker](https://adapter-check.iobroker.in/)

Roadmap and internal task tracking: [`TODO.md`](TODO.md), [`PLAN.md`](PLAN.md).

### npm package identity (for maintainers)

- **Public package name:** [`iobroker.autodoc`](https://www.npmjs.com/package/iobroker.autodoc) (matches `package.json` → **`name`**). First publish from **0.9.35** onward; earlier **0.9.x** builds were Git-only (see **`common.news`** and **README** changelog).
- **Owners:** whoever maintains releases should appear under `npm owner ls iobroker.autodoc`; GitHub org/user for the repo is **crunchip77** (see `package.json` **`author`** / **`repository`**).
- **Keep versions in sync:** on every release, bump **`version`** in **`package.json`** and **`io-package.json`** together, refresh **`common.news`** (max **7** keys — only versions that **exist on npm**, checker **E2004**), and align the README **Changelog** window with the same set. Use **`npm run release`** ([`@alcalzone/release-script`](https://github.com/AlCalzone/release-script)) rather than a naked **`npm publish`** so ioBroker plugins run as intended (see **Releases and README changelog** below).

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

### Adapter Checker (`@iobroker/repochecker`)

After `npm install`, from the repository root (**working tree = this adapter**, `dev` branch or your PR branch):

```bash
npm run adapter-check
```

This runs **`@iobroker/repochecker`** in **`--local`** mode against **`https://github.com/crunchip77/ioBroker.autodoc` `main`** (see `package.json` → **`adapter-check`**). Typical messages while **ioBroker.repositories** PR is still open:

- **E1025 / E1042 (`extIcon`):** the checker **HTTP-fetches** **`common.extIcon`**. The file must **exist** at that URL and be a **valid** icon (also **≤ 512×512** px for **E1042**). Use the **`main`** raw GitHub URL (same commit users get from the default branch).
- **E2000 (package not on npm):** the adapter **is** published as **`iobroker.autodoc`** (from **0.9.35**). If a checker run still reports **E2000**, retry after registry/index lag or compare with the [hosted Adapter Checker](https://adapter-check.iobroker.in/) for the same version tarball.
- **W4001 (adapter not in `ioBroker.repositories` yet):** expected until your **repositories** PR is **merged**; after **latest** (or beta) entry lands, re-run the checker — the warning should **clear**.
- **W5029 (`manual-review` missing in `.releaseconfig.json`):** the hosted **repochecker** expects all three plugins **`iobroker`**, **`license`**, and **`manual-review`** (ioBroker release-script convention). **`manual-review`** pauses before `git commit` and asks for confirmation — run **`npm run release`** only in an **interactive** terminal (not headless CI); **`--yes`** does not skip this prompt. For a fully automated pipeline, split “prepare” vs “commit/tag/push” manually if needed.
- **W5042 (`puppeteer` used in source but missing from `dependencies`):** **`puppeteer` is intentionally listed under `optionalDependencies`** in `package.json` (with `@mermaid-js/mermaid-cli`). PDF export loads it via **`require('puppeteer')`** in **`lib/htmlToPdf.js`** only when present; adapters without Puppeteer/Chromium avoid a heavyweight default install — especially relevant on constrained hosts (e.g. Raspberry Pi). The repochecker rule appears to match **`dependencies` only**, not **`optionalDependencies`**, so this warning is a **known false positive** here. Do **not** add a second **`puppeteer`** entry under `dependencies` merely to silence W5042: ioBroker’s checker rejects listing the **same package in both `dependencies` and `optionalDependencies`**, and moving Puppeteer exclusively into **`dependencies`** would force Chromium downloads for everyone. Treat W5042 as **expected until** upstream repochecker counts **`optionalDependencies`** (or equivalent) as declared.
- **E9999 / checkCode crashes:** tooling bug seen on some setups (`includes` on `undefined`). Re-run via the hosted [Adapter Checker](https://adapter-check.iobroker.in/) if needed; fixing it belongs upstream.

**Important:** Never run **`npx iobroker …`** inside the adapter clone unless you intentionally bootstrap a controller there — it can overwrite **`package.json`**. Restore with **`git checkout -- package.json package-lock.json`** if that happens.

### `package-lock.json` and `npm ci`

CI (`ioBroker/testing-action-check`) runs **`npm ci`**. The optional **@mermaid-js/mermaid-cli** chain (Puppeteer / `chromium-bidi` / Mermaid) depends on versions that must appear as **full** `packages["node_modules/…"]` entries in the lockfile. The repo therefore uses **`overrides`** (`chromium-bidi` → pinned `devtools-protocol`) and explicit **devDependencies** (`cytoscape`, `d3-selection`, `devtools-protocol`) so Linux + Node 22/24 installs stay in sync.

**GitHub Actions:** `.github/workflows/test-and-release.yml` uses the **ioBroker.example** concurrency snippet (`group: ${{ github.ref }}`, **`cancel-in-progress: true`**). **`@iobroker/repochecker`** (**E3009**) compares this block **literally** to that template — custom `group` values always fail the check. Trade-off: a new push on the **same** branch invalidates older in-flight workflow runs (**Windows + Node 24** can show “Cancelled” if you push again before the matrix finishes).

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

### Admin (`jsonConfig`) structure

- **Do not nest** a full `"type": "tabs"` block **inside** a **`panel`** in `admin/jsonConfig.json`. ioBroker Admin has been observed to render an **empty** instance settings pane when that layout is used. Keep every main area as **its own root-level tab** under the top **`type": "tabs"`** only.

### Admin UI translations (i18n)

- Source of truth for **keys** is `admin/i18n/en.json`. **DE** and **FR** are maintained alongside English for important releases.
- Other locale files (`es`, `it`, `nl`, `pl`, `pt`, `ru`, `uk`, `zh-cn`, …) may use **English text as a fill-in** for missing keys so the Admin never shows raw key names. **Native speakers:** PRs to replace those strings with real translations are welcome; no need to re-translate the whole file at once.
- After adding keys to `en.json`, update **DE/FR** when you can, and either run the project’s i18n workflow or copy the new English string into other locales until translated.
