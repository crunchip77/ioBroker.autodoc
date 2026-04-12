# Contributing to ioBroker.autodoc

This file is for **contributors in the Git repository**. It is intentionally **not** listed in the `files` array in `package.json`: the **npm tarball** for ioBroker installs should contain **runtime files only** (same idea as adapters generated with [create-adapter](https://github.com/ioBroker/create-adapter)). **`README.md`** is still published (npm always includes it). **`LICENSE`** is listed in `files` so it is part of the package contents.

## References (ioBroker ecosystem)

Use the links at the top of [`TODO.md`](TODO.md) (**Wichtige Referenzen**) while developing or reviewing changes:

- [ioBroker AI Developer Guide](https://github.com/Jey-Cee/iobroker-ai-developer-guide)
- [Adapter Creator](https://github.com/ioBroker/create-adapter)
- [Adapter Checker](https://adapter-check.iobroker.in/)

Roadmap and internal task tracking: [`TODO.md`](TODO.md), [`PLAN.md`](PLAN.md).

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
