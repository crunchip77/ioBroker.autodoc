# AutoDoc — user guide (first steps)

Structured help for **operators** who install and run the adapter from the [GitHub repository](https://github.com/crunchip77/ioBroker.autodoc).

- **German** walkthrough — includes a fictional **„Muster‑Einfamilienhaus“** scenario: **[`README.de.md`](README.de.md)**  

**Figures:** simplified **SVG wireframes** below (not real screenshots). For **PNG/WebP** capture naming and privacy rules see **[`assets/SCREENSHOTS.md`](assets/SCREENSHOTS.md)**. Per-field tooltips in Admin (`?`) remain authoritative. Project overview: **[README](../../README.md)**.

## Prerequisites

- **Node.js** ≥ 22  
- ioBroker versions as declared on the README under **Requirements**  

## Installation (URL / clone)

Until the adapter is listed on npm, installs typically use Git (see README **Install**). After adding an instance, open **Instances → AutoDoc.X → Config**.

## Admin tabs (what to configure first)

1. **Basic settings** — project name, documentation language, markdown profile preference, timers and triggers (“Generate …”).  
2. **Manual documentation (“My documentation”)** — human text for households and guests (`guestHelpNote`, playbook, troubleshooting quick lines). Optional **Mermaid** diagrams: see field help there (embedded SVG vs. browser/CDN fallback).  
3. **Advanced** — **`documentationStatesMode`** (`full` vs `metadata`), optional **Filesystem export path**, **`documentation.exportHashes`** usage (summarised below).  
4. **Notifications** / **AI** — optional; opt-in only.

### Figures (wireframes — not pixel-perfect Admin UI)

![Basic settings — schematic](assets/fig-tab-grundeinstellungen.svg)

![My documentation — schematic](assets/fig-tab-meine-dokumentation.svg)

![Advanced — base URL schematic (fictitious host)](assets/fig-erweitert-basisurl.svg)

Add or substitute **PNG** snapshots from your **demo** Host — naming and DPI hints: **[`assets/SCREENSHOTS.md`](assets/SCREENSHOTS.md)**.

## Generating documentation

Trigger **Generate** from the instance (state `action.generate`, or the schedule you enabled). After a successful run you get:

- **Files** under `/files/autodoc.<instance>/` — canonical **HTML** (admin, user, onboarding), **Markdown**, **JSON**
- **States** such as `info.htmlUrlAdmin` / `info.htmlUrlUser` / `info.htmlUrlOnboarding`, `info.lastGeneration`, …

Whether large bodies live in **`documentation.*`** states or only on disk depends on **`documentationStatesMode`**:

| Mode       | Behaviour (short) |
| ---------- | ------------------- |
| **full**   | Full markdown/HTML/JSON also duplicated into adapter states (legacy, larger DB). |
| **metadata** | States hold placeholders; canonical full text stays under **`/files/`**. Scripts that used to read states for full exports should read **`/files/`** or HTTP links. |

**In both modes** the adapter updates **`documentation.exportHashes`** — **SHA-256 (hex)** of the latest export blobs so integrations can cheaply detect “did the doc change?” without parsing full payloads.

## Onboarding QR and copied link

Guests need a **reachable** browser URL for the onboarding HTML file. Configure **IoBroker base URL** (advanced) to match how *you* open Admin (scheme, host, port). Wrong or empty values break QR/copy from other devices — see README **Public base URL**.

## Optional Mermaid CLI

The optional **`@mermaid-js/mermaid-cli`** package (installed with `npm install` on the adapter host) renders diagrams to **inline SVG during HTML generation** when it works — better for offline copies. Without it, HTML falls back to live Mermaid loading in the browser; see PLAN/TODO **Phase 5** notes for Puppeteer/OS caveats.

## Repository checks before release

Maintainers run the **adapter checker** from the cloned repo (expects the default branch you pass to `repochecker`; `package.json` uses **`main`**):

```bash
npm install
npm run adapter-check
```

See **`CONTRIBUTING.md`** for interpretation (npm not published yet on purpose, **`common.extIcon`**, known repochecker quirks). CI still runs **`npm test`**, **`npm run lint`**, **`npm run check`**.

## Demo content only here

Examples in docs use **neutral demo wording**. Do **not** commit real IPs, LAN hostnames from production, or live forum/card payloads.
