# AutoDoc — user guide (first steps)

Structured help for **operators** who install and run the adapter from the [GitHub repository](https://github.com/crunchip77/ioBroker.autodoc). Screenshots and per-field walkthroughs stay out of scope here; use the **Inline help** texts in ioBroker Admin (`jsonConfig`) and the [**README**](https://github.com/crunchip77/ioBroker.autodoc/blob/main/README.md).

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

Maintainers run the **adapter checker** from the cloned repo (`dev` workflow):

```bash
npm install
npm run adapter-check
```

See **`CONTRIBUTING.md`** for interpretation (npm not published yet on purpose, **`common.extIcon`**, known repochecker quirks). CI still runs **`npm test`**, **`npm run lint`**, **`npm run check`**.

## Demo content only here

Examples in docs use **neutral demo wording**. Do **not** commit real IPs, LAN hostnames from production, or live forum/card payloads.
