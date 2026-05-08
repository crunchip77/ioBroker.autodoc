# AutoDoc — user guide (first steps)

Structured help for **operators** who install and run the adapter from the [GitHub repository](https://github.com/crunchip77/ioBroker.autodoc).

- **German** walkthrough — includes a fictional **„Muster‑Einfamilienhaus“** scenario: **[`README.de.md`](README.de.md)**  

**Figures:** **SVG wireframes** (where shown) plus **real screenshots** for **all six** admin tabs below — optional tabs included. Naming and privacy: **[`assets/SCREENSHOTS.md`](assets/SCREENSHOTS.md)**. Per-field tooltips in Admin (`?`) remain authoritative. Project overview: **[README](../../README.md)**.

## Prerequisites

- **Node.js** ≥ 22  
- ioBroker versions as declared on the README under **Requirements**  

## Installation (URL / clone)

Until the adapter is listed on npm, installs typically use Git (see README **Install**). After adding an instance, open **Instances → AutoDoc.X → Config**.

## Admin tabs (what to configure first)

1. **Basic settings** — project name, documentation language, markdown profile preference, timers and triggers (“Generate …”).  
2. **Manual documentation (“My documentation”)** — human text for households and guests (`guestHelpNote`, playbook, troubleshooting quick lines). Optional **Mermaid** diagrams: see field help there (embedded SVG vs. browser/CDN fallback).  
3. **Advanced** — **`documentationStatesMode`** (`full` vs `metadata`), optional **Filesystem export path**, optional **PDF after each run** (needs **`puppeteer`**), **`documentation.exportHashes`** usage (summarised below).  
4. **HTML export & extra sections** — themes, chapter visibility/order, custom sections; the intro text on that tab also points to **PDF** settings (they live under **Advanced**).  
5. **Notifications** / **AI** — optional; opt-in only.

### Figures

**SVG wireframes** are schematic (**not pixel-perfect**). **PNG screenshots** are real Admin UI (**demo instance**; layout varies by Admin theme/version).

![Basic settings — schematic](assets/fig-tab-grundeinstellungen.svg)

*Real Admin UI:*

![Basic settings tab — screenshot](assets/screen-grundeinstellungen-admin.png)

![My documentation — schematic](assets/fig-tab-meine-dokumentation.svg)

*Real Admin UI (demo instance; **My documentation** is a long scroll — four screenshots, top to bottom):*

**1/4 —** Project, contact & notes; guest help & everyday automation wording.

![My documentation — screenshot (1/4)](assets/screen-meine-dokumentation-admin.png)

**2/4 —** Playbook, optional **Mermaid** diagram, automatic host topology, emergency one-liners (WLAN / power / water).

![My documentation — screenshot (2/4)](assets/screen-meine-dokumentation-admin-2.png)

**3/4 —** Short “misc” line (optional); per-adapter and per-room notes.

![My documentation — screenshot (3/4)](assets/screen-meine-dokumentation-admin-3.png)

**4/4 —** Hide rooms or adapters per profile (onboarding vs. user/family); guest JavaScript filename visibility.

![My documentation — screenshot (4/4)](assets/screen-meine-dokumentation-admin-4.png)

![Advanced — base URL schematic (fictitious host)](assets/fig-erweitert-basisurl.svg)

*Real Admin UI (demo; **Advanced** is a long scroll — two screenshots, top to bottom). **Base URL** and export paths are **placeholders**, not your real network.*

**1/2 —** Content limits; **documentation in states** (`metadata` vs `full`); optional **Base URL** for bookmark/QR targets.

![Advanced tab — screenshot (1/2)](assets/screen-erweitert-basisurl-admin.png)

**2/2 —** Documentation **setup score** options; optional **filesystem export** path; **PDF after each run** (Puppeteer / Chromium).

![Advanced tab — screenshot (2/2)](assets/screen-erweitert-basisurl-admin-2.png)

*Real Admin UI (demo; tab **HTML export & extra chapters** — three screenshots, top to bottom). Intro text mentions **PDF** (switches live under **Advanced**). Replace logo URLs / custom-chapter demo text with your own placeholders for public repos.*

**1/3 —** Appearance: HTML **color scheme** & **preset**, optional **sidebar logo** URL.

![HTML export & extra chapters — screenshot (1/3)](assets/screen-html-export-pdf-hint-admin.png)

**2/3 —** **Admin** profile: chapter order & hidden chapters (**JSON** arrays). **User/Family**: hidden chapters & order (**JSON**).

![HTML export & extra chapters — screenshot (2/3)](assets/screen-html-export-pdf-hint-admin-2.png)

**3/3 —** **Onboarding**: hidden chapters & order (**JSON**); **custom Markdown chapters** (**JSON** objects); footer points to optional font/CSS (fields further down).

![HTML export & extra chapters — screenshot (3/3)](assets/screen-html-export-pdf-hint-admin-3.png)

*Real Admin UI (demo; **Notifications** — skip this tab entirely if you do not need post-run messaging). Keep **adapter instance IDs**, recipients, and custom templates **out of public repos** or use placeholders.*

![Notifications tab — screenshot](assets/screen-benachrichtigungen-admin.png)

*Real Admin UI (demo; **AI documentation** — long tab, two screenshots **top to bottom**). Inline **privacy / hardware** notices are product text. For public repos prefer **local Ollama** or **redacted** cloud fields; never publish **API keys**.*

**1/2 —** Provider & model selection, **Ollama base URL**, request timeout.

![AI documentation — screenshot (1/2)](assets/screen-ki-dokumentation-admin.png)

**2/2 —** Optional operator **context hints** (prompt-only); **temperature**; opt-in **“AI explains JavaScript scripts”**.

![AI documentation — screenshot (2/2)](assets/screen-ki-dokumentation-admin-2.png)

Naming, swap-out **PNG** hints, redaction: **[`assets/SCREENSHOTS.md`](assets/SCREENSHOTS.md)**.

## Generating documentation

Trigger **Generate** from the instance (state `action.generate`, or the schedule you enabled). After a successful run you get:

- **Files** under `/files/autodoc.<instance>/` — canonical **HTML** (admin, user, onboarding), **Markdown**, **JSON**
- **States** such as `info.htmlUrlAdmin` / `info.htmlUrlUser` / `info.htmlUrlOnboarding`, `info.lastGeneration`, …

Whether large bodies live in **`documentation.*`** states or only on disk depends on **`documentationStatesMode`**:

| Mode       | Behaviour (short) |
| ---------- | ------------------- |
| **full**   | Full markdown/HTML/JSON also duplicated into adapter states (legacy, larger DB). |
| **metadata** | States hold placeholders; canonical full text stays under **`/files/`**. Scripts that used to read states for full exports should read **`/files/`** or HTTP links. |

**In both modes** the adapter updates **`documentation.exportHashes`** — **SHA-256 (hex)** of the latest **Markdown**, **Admin HTML**, **JSON**, and (after a successful **PDF** run) **`autodoc-*.pdf`** files so integrations can cheaply detect “did the doc change?” without parsing full payloads.

## Onboarding QR and copied link

Guests need a **reachable** browser URL for the onboarding HTML file. Configure **IoBroker base URL** (advanced) to match how *you* open Admin (scheme, host, port). Wrong or empty values break QR/copy from other devices — see README **Public base URL**.

## Optional Mermaid CLI

The optional **`@mermaid-js/mermaid-cli`** package (installed with `npm install` on the adapter host) renders diagrams to **inline SVG during HTML generation** when it works — better for offline copies and **no jsDelivr script** in the export when every diagram is embedded. If some blocks stay as `<pre class="mermaid">` (CLI missing or a diagram failed), the HTML still loads Mermaid from the CDN in the browser. See PLAN/TODO **Phase 5** for Puppeteer/OS caveats (PDF and mmdc share similar Chromium assumptions).

## Repository checks before release

Maintainers run the **adapter checker** from the cloned repo (expects the default branch you pass to `repochecker`; `package.json` uses **`main`**):

```bash
npm install
npm run adapter-check
```

See **`CONTRIBUTING.md`** for interpretation (npm not published yet on purpose, **`common.extIcon`**, known repochecker quirks). CI still runs **`npm test`**, **`npm run lint`**, **`npm run check`**.

## Demo content only here

Examples in docs use **neutral demo wording**. Do **not** commit real IPs, LAN hostnames from production, or live forum/card payloads.
