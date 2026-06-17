# Contributing to ioBroker.autodoc

This file is for **contributors in the Git repository**. It is intentionally **not** listed in the `files` array in `package.json`: the **npm tarball** for ioBroker installs should contain **runtime files only** (same idea as adapters generated with [create-adapter](https://github.com/ioBroker/create-adapter)). **`README.md`** is still published (npm always includes it). **`LICENSE`** is listed in `files` so it is part of the package contents.

## References (ioBroker ecosystem)

Adapter-neutral link collection (reusable across projects): [`docs/iobroker-adapter-references.md`](docs/iobroker-adapter-references.md) — **Gedächtnisstützen** for rule-compliant adapter work (not a full mirror of external docs).

Use the links at the top of [`TODO.md`](TODO.md) (**Wichtige Referenzen**) while developing or reviewing changes — especially:

- [ioBroker Developer Portal](https://www.iobroker.dev)
- [Adapter Checker](https://adapter-check.iobroker.in/)
- [ioBroker.repositories — Best Practices](https://github.com/ioBroker/ioBroker.repositories#development-and-coding-best-practices)
- [REVIEW_CHECKLIST](https://github.com/ioBroker/ioBroker.repositories/blob/master/REVIEW_CHECKLIST.md)
- [type-detector](https://github.com/ioBroker/ioBroker.type-detector)
- [ioBroker AI Developer Guide](https://github.com/Jey-Cee/iobroker-ai-developer-guide)
- [Adapter Creator](https://github.com/ioBroker/create-adapter)

Roadmap and internal task tracking: [`TODO.md`](TODO.md), [`PLAN.md`](PLAN.md).

### npm package identity (for maintainers)

- **Public package name:** [`iobroker.autodoc`](https://www.npmjs.com/package/iobroker.autodoc) (matches `package.json` → **`name`**). First publish from **0.9.35** onward; earlier **0.9.x** builds were Git-only (see **`common.news`** and **README** changelog).
- **Owners:** whoever maintains releases should appear under `npm owner ls iobroker.autodoc`; GitHub org/user for the repo is **crunchip77** (see `package.json` **`author`** / **`repository`**).
- **Keep versions in sync:** on every **npm** release, bump **`version`** in **`package.json`** and **`io-package.json`** together (use a normal **`x.y.z`** triple for publishes), refresh **`common.news`** (max **7** keys — **only** versions that **exist on npm**, checker **E2004**), and align the README **Changelog** window with the same set. Use **`npm run release`** ([`@alcalzone/release-script`](https://github.com/AlCalzone/release-script)) rather than a naked **`npm publish`** so ioBroker plugins run as intended (see **Releases and README changelog** below).
- **Between publishes:** if `main`/`dev` already targets the next **`x.y.z`** but **`npm publish` has not happened yet**, use a **pre-release** version (e.g. **`0.9.39-alpha.0`**) in **`package.json`** / **`io-package.json`** so **repochecker** does not require a **`common.news`** row for a version that is not on npm (**E1036** vs **E2004**). Strip the suffix and add the **`news`** entry for **`x.y.z`** immediately before **`npm publish`**.

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

This runs **`@iobroker/repochecker@5.11.1`** in **`--local`** mode against **`https://github.com/crunchip77/ioBroker.autodoc` `main`** (see `package.json` → **`adapter-check`**). **Note:** **`--local`** can hit **`[E9999] … reading 'includes'`** (tooling bug: first repo scan uses **`context.readFiles`** before it exists). The **hosted** checker ([Adapter Checker](https://adapter-check.iobroker.in/) / **`iobroker.dev`**) is an alternative but may return **504 Gateway Timeout** or fail under load — retry later, try branch **`main`**, or rely on **`npm run adapter-check`** and CI. Upgrade **`@iobroker/repochecker`** when a fixed release is available.

Typical messages while **ioBroker.repositories** PR is still open:

- **E1025 / E1042 (`extIcon`):** the checker **HTTP-fetches** **`common.extIcon`**. The file must **exist** at that URL and be a **valid** icon (also **≤ 512×512** px for **E1042**). Use the **`main`** raw GitHub URL (same commit users get from the default branch).
- **E2000 (package not on npm):** the adapter **is** published as **`iobroker.autodoc`** (from **0.9.35**). If a checker run still reports **E2000**, retry after registry/index lag or compare with the [hosted Adapter Checker](https://adapter-check.iobroker.in/) for the same version tarball.
- **W4001 (adapter not in `ioBroker.repositories` yet):** expected until your **repositories** PR is **merged**; after **latest** (or beta) entry lands, re-run the checker — the warning should **clear**.
- **W5029 (`manual-review` missing in `.releaseconfig.json`):** the hosted **repochecker** expects all three plugins **`iobroker`**, **`license`**, and **`manual-review`** (ioBroker release-script convention). **`manual-review`** pauses before `git commit` and asks for confirmation — run **`npm run release`** only in an **interactive** terminal (not headless CI); **`--yes`** does not skip this prompt. For a fully automated pipeline, split “prepare” vs “commit/tag/push” manually if needed.
- **W5005 / E5005 (`setTimeout` in lib files):** **Fixed** across all affected files:
  - **`lib/aiEnhancer.js`**: `invokeProvider` in `AiEnhancer` passes `ms => this.adapter.delay(ms)` — uses the ioBroker adapter base class `delay()` method (lifecycle-managed, compact mode safe). `postJsonTransientRetries` requires `delayFn` and uses it directly, no global `setTimeout` fallback.
  - **`lib/htmlRenderer.js`**: All four occurrences are inside browser `<script>` template strings (generated HTML output, run in the browser). Changed to `window.setTimeout(` — functionally identical in the browser; the repochecker regex excludes `.setTimeout` via negative lookbehind.
  - **`lib/htmlToPdf.js`**: One-shot sleep during PDF rendering. Changed to `globalThis.setTimeout(` — also excluded by the repochecker regex.
- **W5042 (`puppeteer` used in source but missing from `dependencies`):** **`puppeteer` is intentionally listed under `optionalDependencies`** in `package.json` (with `@mermaid-js/mermaid-cli`). PDF export loads it via **`require('puppeteer')`** in **`lib/htmlToPdf.js`** only when present; adapters without Puppeteer/Chromium avoid a heavyweight default install — especially relevant on constrained hosts (e.g. Raspberry Pi). The repochecker rule appears to match **`dependencies` only**, not **`optionalDependencies`**, so this warning is a **known false positive** here. Do **not** add a second **`puppeteer`** entry under `dependencies` merely to silence W5042: ioBroker’s checker rejects listing the **same package in both `dependencies` and `optionalDependencies`**, and moving Puppeteer exclusively into **`dependencies`** would force Chromium downloads for everyone. Treat W5042 as **expected until** upstream repochecker counts **`optionalDependencies`** (or equivalent) as declared.
- **`aiApiKey` (jsonConfig `password`):** listed under **`protectedNative`** and **`encryptedNative`** in **`io-package.json`** (ioBroker adapter security — W5057/W5058). Existing plain-text keys are re-encrypted when the user saves config in Admin.
- **E8917 / W0066 (`@types/node`):** pin **`@types/node`** to the **Node 22** line (`^22.x`, matching **`engines.node`**) and add a Dependabot **`ignore`** for **`version-update:semver-major`** on **`@types/node`** in **`.github/dependabot.yml`** (see ioBroker.javascript / repochecker E8917).
- **`puppeteer` Dependabot major:** also ignore **`version-update:semver-major`** for **`puppeteer`** in **`.github/dependabot.yml`** — see **[Optional Puppeteer + mermaid-cli](#optional-puppeteer-mermaid-cli)** below.

<a id="optional-puppeteer-mermaid-cli"></a>

### Optional Puppeteer + `@mermaid-js/mermaid-cli` (ioBroker policy)

**Purpose:** PDF export (`lib/htmlToPdf.js`) and server-side Mermaid SVG (`lib/mermaidServerSvg.js` via **`mmdc`**) use headless Chromium. Both packages are **`optionalDependencies`** so default installs stay lightweight (relevant for constrained hosts, e.g. Raspberry Pi) — aligned with ioBroker practice for heavy browser stacks.

**Current aligned pair (2026-05, verify in `package.json`):**

| Package | Version | Role |
| ------- | ------- | ---- |
| **`puppeteer`** | **`^24.43.1`** | PDF + shared Chromium for **`mmdc`** |
| **`@mermaid-js/mermaid-cli`** | **`11.15.0`** (pinned) | embed **`pre.mermaid`** as SVG during generation |

**Why not Puppeteer 25 yet:** **`@mermaid-js/mermaid-cli@11.15.0`** declares **`peerDependencies.puppeteer: ^23 \|\| ^24`**. Puppeteer **25.x** causes **`npm ci` / ERESOLVE** on CI — not an adapter bug, but an upstream peer gap. **Do not merge** Dependabot PRs that bump **`puppeteer`** to **25** until **`mmdc`** peers **`^25`** (check with **`npm view @mermaid-js/mermaid-cli@latest peerDependencies`**). **`.github/dependabot.yml`** ignores **`puppeteer`** **`version-update:semver-major`** for that reason.

**ioBroker Checker / `ioBroker.repositories` review — do not “fix” the wrong way:**

| Message | Maintainer stance |
| ------- | ----------------- |
| **W5042** (`puppeteer` “missing” from **`dependencies`**) | **Expected false positive.** **`puppeteer`** is declared under **`optionalDependencies`**. Moving it to **`dependencies`** would force Chromium for all installs and can trigger checker errors (**same package in both `dependencies` and `optionalDependencies`**). **Document W5042 for reviewers; do not duplicate the entry.** |
| **Failed Dependabot PR (puppeteer 25)** | Close or ignore; not a release blocker if **`main`** CI is green with **24 + mermaid-cli 11**. |
| **`npm ci` on CI** | **`package-lock.json`** must include a full **`packages["node_modules/puppeteer"]`** entry. After dependency changes: fresh **`npm install`**, verify **`npm ci`** on clean **`node_modules`**, commit **`package.json`** + lock together. |

**Upgrade procedure (when upstream allows Puppeteer 25):**

1. Confirm **`@mermaid-js/mermaid-cli`** peer range includes **`^25`** (or upgrade **`mmdc`** first, then **`puppeteer`** in **one** PR).
2. Regenerate lockfile; run **`npm ci`**, **`npm run lint`**, **`npm run check`**, **`npm test`** (Mermaid integration tests in **`mermaidServerSvg.test.js`**).
3. Remove or narrow the Dependabot **`ignore`** for **`puppeteer`** major only when safe.
4. Mention in release notes / **`common.news`** if install size or Node/Chromium requirements change.

**For `ioBroker.repositories` PR text:** optional PDF/Mermaid features require **`npm install`** (or install with optional deps) in the adapter directory; core documentation generation works **without** Puppeteer. **W5042** and the Puppeteer **24/25** peer lock are **documented maintainer choices**, not checklist errors.

**Important:** Never run **`npx iobroker …`** inside the adapter clone unless you intentionally bootstrap a controller there — it can overwrite **`package.json`**. Restore with **`git checkout -- package.json package-lock.json`** if that happens.

<a id="object-hierarchy"></a>

### Object hierarchy in `instanceObjects` (`io-package.json`)

ioBroker requires every state to have a parent object (`type: "channel"` or `"device"`). Missing parent objects cause **E3009** during the `ioBroker.repositories` review object check — the adapter runs fine locally but the bot rejects the dump.

**Rule:** for every group of states (`action.*`, `documentation.*`, `info.*`, `versioning.*`), add the corresponding channel object **before** the states in `instanceObjects`. Channels must appear first; states follow:

```json
"instanceObjects": [
  { "_id": "info", "type": "channel", "common": { "name": { "en": "Information", "de": "Informationen" } }, "native": {} },
  { "_id": "info.connection", "type": "state", "common": { ... }, "native": {} }
]
```

Reference adapters: **telegram**, **backitup**, **dwd** — all define their `info` channel in `instanceObjects` with a multilingual `common.name`.

`instanceObjects` is the right place for static objects that are always present. Use `setObjectNotExistsAsync` in `onReady`/`createStates()` only for objects that are dynamic or context-dependent (e.g. discovered devices).

### `package-lock.json` and `npm ci`

CI (`ioBroker/testing-action-check`) runs **`npm ci`**. The optional **@mermaid-js/mermaid-cli** chain (Puppeteer / `chromium-bidi` / Mermaid) depends on versions that must appear as **full** `packages["node_modules/…"]` entries in the lockfile. The repo therefore uses **`overrides`** (`chromium-bidi` → pinned `devtools-protocol`) and explicit **devDependencies** (`cytoscape`, `d3-selection`, `devtools-protocol`) so Linux + Node 22/24 installs stay in sync.

**GitHub Actions:** `.github/workflows/test-and-release.yml` uses the **ioBroker.example** concurrency snippet (`group: ${{ github.ref }}`, **`cancel-in-progress: true`**). **`@iobroker/repochecker`** (**E3009**) compares this block **literally** to that template — custom `group` values always fail the check. Trade-off: a new push on the **same** branch invalidates older in-flight workflow runs (**Windows + Node 24** can show “Cancelled” if you push again before the matrix finishes).

**`deploy` on semver tags (`v*.*.*`):** **`ioBroker/testing-action-deploy`** would publish to npm and create a release. If you already ran **`npm publish`** from your machine and then **`git push`** the tag, the workflow now runs **`npm view iobroker.autodoc@${version}`** first and **skips** that deploy step when the semver is already on npm — keeping the workflow **green** (add a GitHub Release manually when still missing). **Node.js deprecation** notices about embedded **`actions/checkout` / `setup-node`** stem from **`ioBroker/testing-action-*@v1`** bundle versions; upgrading those actions is tracked upstream (`ioBroker/testing-action-deploy` etc.), not locally in every adapter YAML.

After changing **dependencies** or **overrides**, run **`npm install`**, commit **`package.json`** and **`package-lock.json`** together, and verify **`npm ci`** on a clean **`node_modules`** locally if you can.

## Releases and README changelog

- Run **`npm run release`** only on **`main`** — **`@alcalzone/release-script-plugin-iobroker`** defaults to **`main`** only (`check:git` aborts on **`dev`**). From **`dev`**, merge/sync then: **`git checkout main && git pull origin main`** before **`npm run release`** (see branch workflow above).

<a id="maintainer-checklist-release-order"></a>

### Maintainer checklist — release order (do not skip)

Follow these steps **in order** after the code for **`x.y.z`** is finished. **`npm publish` does not create a GitHub Release or Git tag.** If you publish from **`main`** but skip the tag/release step, **GitHub “Latest release” will lag npm** until you fix it.

1. **`main` up to date:** `git checkout main && git pull origin main`.
2. **Bump & metadata:** Prefer **`npm run release`** from **`main`** (interactive terminal; **`manual-review`**: inspect diff; **`yes`** only when correct — avoid **`Ctrl+C`** on prompts: Node 24 **enquirer** may throw **`ERR_USE_AFTER_CLOSE`**). If versioning was done manually, ensure **`package.json`**, **`io-package.json`** (`common.version`), **`common.news`** (**only semver keys that exist on npm** — checker **E2004**), root **`package-lock.json`** **`version`**, and README **`Version:`** / changelog all match **`x.y.z`**.
3. **Quality gates:** `npm test`, `npm run lint`, `npm run check` (and optional `npm run adapter-check`).
4. **Commit & push `main`:** `git add` / `git commit` as needed, then `git push origin main`.
5. **npm publish:** `npm login` if needed (`npm publish` cannot run without Maintainer auth — browser / security key flow is normal); then `npm publish --access public`. If **`Enter OTP`** appears, use an **npm TOTP authenticator**, not unrelated app entries (**GitHub** alone is unrelated). OTP **rate limiting** (**E429**) after bad attempts: pause or use a **Granular Publish token** (User **`.npmrc`**, never commit tokens). Optionally run **`npm pkg fix`** and commit **`repository.url`** normalization if **`npm publish`** warns.
6. **Verify registry:** `npm view iobroker.autodoc version` → **`x.y.z`**.
7. **Git tag + GitHub Release (mandatory parity with npm):** on the **`main`** commit you intend to label **`x.y.z`** (normally current **`main`** after publish):  
   `git tag -a vx.y.z -m "vx.y.z: …"` → `git push origin vx.y.z` → **`gh release create vx.y.z --title "vx.y.z" --verify-tag --notes "…"`** (or equivalent on the GitHub UI). Omitting this leaves **releases** stale while **`npm`** is current.
8. **Sync `dev`:** `git checkout dev`, merge/fast-forward **`origin/main`** into **`dev`**, `git push origin dev`, stay on **`dev`** for ongoing work unless hotfixing **`main`** only.

Quick reference for **Agents / Copilot**: when the Maintainer asks to **finish a release** or **publish**, ensure step **7** is proposed or executed after confirmation that step **6** succeeded — do not assume **npm** updates GitHub **Releases**.

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
