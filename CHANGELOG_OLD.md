# Older releases (AutoDoc)

Histories for versions **no longer** in the **7-version** window shared by `common.news` in `io-package.json` and the main [`README.md`](README.md#changelog) changelog (Adapter Checker / **ioBroker.repositories**).

### 0.9.36 (2026-05-09)

- **npm metadata:** Tarball aligns with **`main`** — **`common.news`** only npm-published keys (checker **E2004** alignment after first **0.9.35** publish). README version line synced. No adapter behavior changes.

### 0.9.26 (2026-04-28)

- **Phase 5.x.2 — quick start tuning:** Onboarding **Quick Start** (HTML + Markdown) shows a **shorter** view of the same `docModel.quickStart` data: **3** setup lines, **4** room cards, **2** highlights per room (`sliceQuickStartForOnboarding` in `lib/quickStartGuide.js`). **User** “at a glance” keeps the **full** depth; intro copy clarifies resident vs guest; a **link to the Rooms chapter** appears when room highlights exist and that chapter is not hidden (User HTML + User Markdown). **KI** user grounding still uses the **full** quick-start facts. `RENDERER_VERSION` **2026.04.28.6**.

### 0.9.27 (2026-04-28)

- **Phase 5.x.3 (step 1 — curated Mermaid):** New optional field **`manualMermaidDiagram`** under **My documentation** (native + Admin UI). Parsed into `manualContext.mermaidDiagram` (max **12 000** characters). **HTML** profiles load **Mermaid 10.9.1** from jsDelivr when the export contains `pre.mermaid` and render client-side (`securityLevel: 'strict'`, theme follows dark toggle on first paint). **Markdown** adds a fenced **`mermaid`** block under **Manual information**. **Hide** the block with chapter id **`mermaid`** in User/Onboarding hide lists (`docTemplateConfig` whitelist updated). Onboarding HTML shows the diagram in the **welcome** area; Admin/User manual chapter uses subsection `#mermaid-diagram`. Export copy: `mermaidDiagramTitle` / `mermaidDiagramIntro` in **EN / DE / FR** (`lib/i18n.js`). `RENDERER_VERSION` **2026.04.28.8**.

### 0.9.25 (2026-04-28)

- **My documentation — playbook:** optional **`ownerPlaybookNote`** (household procedures: order, must-dos, do-not rules in plain language). Shown in Admin manual, separate **User** / **Onboarding** HTML chapter (`#owner-playbook`) with nav when filled, **Markdown** (User/Onboarding profile) under **Manual information**, and **AI owner context**. Hide with chapter id **`ownerPlaybook`** on tab **HTML export & extra sections** (not *Advanced*). Export/renderer: `RENDERER_VERSION` **2026.04.28.5**. Admin UI copy EN/DE/FR; **Doc layout intro** clarifies Admin vs User/Onboarding hide lists.

### 0.9.24 (2026-04-28)

- **Wording — documentation setup vs. diagnosis:** Admin chapter title **Maintenance & documentation setup** (EN/DE/FR); technical **Diagnosis** stays its own chapter. Labels use **documentation setup score** where appropriate; checklist copy points to Adapter **Advanced** and configurable minimums. If **all** score checks are disabled, HTML/Markdown show a short explanation (100 % default).
- **Quick Start:** when two rooms have the same device count, order is **stable** (locale-aware room name).
- **Admin jsonConfig:** helper texts aligned with **documentation setup score** (EN/DE/FR; other admin locales keep English until translated). Short **intro line** between **ioBroker base URL** and the setup-score block explains the link (QR/bookmarks). `RENDERER_VERSION` **2026.04.28.4**.

### 0.9.23 (2026-04-28)

- **Maintenance / documentation score:** Advanced settings add **per-check toggles** and numeric **thresholds** (minimum project description length, unassigned-instance warn level). The percentage counts **only checks left enabled**. Export copy (`scoreDesc`, EN/DE/FR) states that the score reflects **setup / meta**, not script or room “content quality”.
- **Quick Start (5.x.2):** room guide cards are ordered with **more device-rich rooms first** (`lib/quickStartGuide.js`).
- **Admin i18n:** new Advanced block strings EN/DE/FR; other admin languages ship English until translated. `RENDERER_VERSION` **2026.04.28.3**.

### 0.9.22 (2026-04-28)

- **Documentation score — setup checklist:** Maintenance checklist adds **project narrative** (manual description **≥ 40** characters), **base URL unset** (Advanced base URL non‑empty), and **instances without room** (fewer than **10** unassigned instances). **`common.desc`** for scripts and **scripts without `desc`** are listed for information only and **never** affect the score. **`RENDERER_VERSION` 2026.04.28.2**.

### 0.9.21 (2026-04-28)

- **Onboarding — guest script privacy:** New **Advanced** (hide lists) setting **`onboardingGuestShowScriptNames`** (default **off**). When off, **Quick Start** omits **`script`** rows that would expose internal JavaScript file names — no substitute line built only from `common.desc` (optional group-purpose text). **What runs automatically** keeps the short count-only summary (same privacy rule as before). Opt in to restore listing internal script file names in both places. Implemented via **`lib/guestScriptPrivacy.js`**; **Onboarding** HTML and **Markdown** exports. `RENDERER_VERSION` **2026.04.28.1**.

### 0.9.20 (2026-04-27)

- **Phase 5.x.2 — Quick Start & room highlights:** **Onboarding** HTML and **Markdown** include a structured **Quick Start** from discovery (`lib/quickStartGuide.js` → `docModel.quickStart`): top function areas, scripts with descriptions, and up to eight **room guide** cards with device highlights. **User** profile: **Quick overview** chapter (same data, compact) in HTML; **Markdown** adds a **Quick overview** section (anchor `at-a-glance`) after the table of contents. New User hidden chapter id **`atAGlance`**. i18n **EN / DE / FR** reviewed; **es, it, nl, pl, pt, ru, uk, zh-cn** ship with the **same English strings** as `en.json` until contributors translate (see [CONTRIBUTING — Admin i18n](CONTRIBUTING.md#admin-ui-translations-i18n)). `RENDERER_VERSION` bump.
- **Onboarding (same release, follow-up):** **Next steps** copy tuned for guests (EN/DE/FR); **What runs automatically** lists at most five script names, then a short line for the remainder; self-links in Admin HTML and guest help cleaned up. `RENDERER_VERSION` **2026.04.27.9**.
- **Tooling / DX:** JSDoc param and return **descriptions** completed for smaller `lib` helpers and `main.js`; the three very large files `lib/aiEnhancer.js`, `lib/htmlRenderer.js`, and `lib/markdownRenderer.js` keep type tags but relax **description**-required rules in `eslint.config.mjs` to avoid hundreds of one-line noise comments.

### 0.9.19 (2026-04-27)

- **Phase 5.x.1 — diagnosis snapshot checklists:** In **User** and **Onboarding** HTML (and matching **Markdown** export), the **Help & emergencies** chapter can show a short **numbered checklist** when the same **Node.js** rule as **Admin → Diagnosis** would flag the runtime (non-LTS or &lt; 20). Includes a **snapshot disclaimer** (moment in time when documentation was generated). Implemented via `lib/diagnosisSnapshot.js` (shared with Admin logic). No duplicate block in **Admin** HTML (full Diagnosis chapter remains the technical source).

### 0.9.18 (2026-04-27)

- **Phase 5.x.1 (hybrid Help & emergencies):** optional **quick facts** (one line each: Wi‑Fi / network, power / fuses, water, other) plus **bookmark links** to the generated **User**, **Onboarding**, and (in Admin) **Admin** HTML — same URLs as the QR / `info.htmlUrl*` states; requires a correct **ioBroker base URL** in **Advanced** settings.
- **Output:** **User** and **Onboarding** HTML, **Admin** manual section, **Markdown** export, **AI owner context** (quick facts as labeled facts in the prompt).
- **Config:** new native fields `troubleshootWifiHint`, `troubleshootPowerHint`, `troubleshootWaterHint`, `troubleshootExtraHint`; `jsonConfig` + **i18n** EN/DE/FR; `RENDERER_VERSION` bump.

### 0.9.17 (2026-04-25)

- **HTML export:** **Color presets** (`htmlThemePreset`: default, high contrast, warm, slate) — built-in **CSS variable** palettes for light/dark without writing base CSS; optional **font** / **extra CSS** unchanged.
- **Admin — chapter order:** optional JSON `adminChapterOrderJson` (merged with the default id list) — **Admin** HTML **sidebar and chapter body** follow the order; **Admin profile Markdown** **table of contents and body** match. **Hiding** chapters unchanged (`adminHiddenChaptersJson`).
- **io-package** / **jsonConfig** / **i18n** (EN, DE, FR) for the new fields; `RENDERER_VERSION` updated.
- **Admin i18n:** **Full list of valid admin chapter ids** in the help for chapter order and hide fields (EN/DE/FR); **DE** preset label for slate is **Slate** (technical id: `slate`).

**Also on `dev` before this release (documented here in one place):**

- **Admin HTML:** Long sections are **collapsed by default** (script folders, state references, shared states, userdata, aliases) with short summary lines; page scroll is shorter until you expand.
- **Admin HTML:** Sidebar **table of contents** lists **State references** and **Shared states** as sub-items under **Scripts** when those sections exist (jump targets `#state-references`, `#shared-states`).
- **Markdown export (Admin profile):** **`<details>`** blocks for script folders, state-reference table, shared-state table, **userdata**, and **aliases**; TOC sub-links under Scripts; **userdata** / **aliases** chapters; stable anchors. Viewers that support HTML in Markdown (e.g. GitHub) show collapsible sections.
- **Maintenance:** Documentation **score** no longer drops because of **disabled adapter instances**; disabled instances stay listed; diagnosis no longer flags them as findings.

### 0.9.16 (2026-04-24)

- Default: max stored timestamped doc file sets (`maxStoredFiles`) is now **3** per type; `0` still means use that default (was **5**).

### 0.9.15 (2026-04-24)

- Script-source AI: cancel via `action.cancelScriptSourceAi`, Admin (**KI** tab) button, or `sendTo` `cancelScriptSourceAi`; `info.aiScriptSourceProgress` shows **cancelled** when the phase ends (current HTTP request may still complete).

### 0.9.14 (2026-04-24)

- AI script source pass: state `info.aiScriptSourceProgress` (e.g. **5/12**) and optional max characters per script (`aiMaxScriptCharsForAi`, default **12000**).

### 0.9.13 (2026-04-21)

- **Admin:** `common.messagebox: true` in `io-package.json` — required so **js-controller** delivers **jsonConfig** `textSendTo` messages (`getStatus`, `getForumCard`). Without it, the **Basic** tab fields “Last generated” / “Forum system card” may not appear or work; check the log for *messagebox not enabled*.

### 0.9.12 (2026-04-21)

- **Admin — Forum system card:** **Basic** tab: readonly field + copy — loads plaintext via `sendTo` command `getForumCard` (same text as the diagnosis “Copy for Forum” block, language-aware). State **`info.forumCardPlain`** stores the last generated card.
- **AI — script source (opt-in):** **`aiAnalyzeScriptSources`** sends **sanitized** JavaScript (lines matching common secret patterns redacted) to the configured provider; **User** and **Onboarding** HTML/Markdown show short per-script explanations and an optional **automation overview** paragraph when several scripts are summarized.

### 0.9.11 (2026-04-20)

- **Advanced — Documentation states storage:** **`full`** (default: last MD / Admin HTML / JSON also in `documentation.*` states, as before) or **`metadata`** (full exports only under `/files` as `autodoc-latest.*` / profile HTML; large `documentation.*` states hold short placeholders — less load on object DB / **Redis**). Scripts that read `documentation.*` as full text must use **`/files/`** or **`info.htmlUrl*`** when using metadata mode.
- **State `documentation.exportHashes`:** JSON with **SHA-256 (hex)** for `autodoc-latest.md`, `autodoc-latest.json`, `autodoc-admin.html`, and (after PDF export) `autodoc-{admin,user,onboarding}.pdf` when written (change detection without loading large payloads).
- **Download actions** (`autodoc.md` / `.json` / `.html`): content is read preferentially from the latest adapter files; legacy full-state fallback only if needed.
- **HTML changelog:** lines for **adapter instance version** changes; **i18n** strings for changelog types (including EN / DE / FR).
- **Docs:** `README` / `TODO.md` / `PLAN.md` reorganized for open vs. completed work (no functional change).

### 0.9.10 (2026-04-19)

- **Admin — HTML export & extra sections:** optional **color scheme** (auto / light / dark), **logo URL**, **font stack** and **extra CSS** in a **collapsible “advanced” block** (jsonConfig schema-safe for ioBroker.admin).
- **Chapter visibility:** JSON lists to hide chapters per profile (**admin** / **user** / **onboarding**); optional **`custom`** id hides the custom-sections block.
- **Custom Markdown chapters:** `customDocSectionsJson` — `title`, `body` (Markdown), optional **`profiles`** (`admin` / `user` / `onboarding`); rendered with **markdown-it** in HTML; **Markdown export** uses the same sections and respects hiding.
- **Discovery:** probe **`_design/system`** before **`getObjectView(system, schedule)`** so installs without that view no longer log a controller error.
- **Admin i18n:** German strings completed for jsonConfig **help** and **select** labels (less mixed DE/EN in the UI).
- **Onboarding copy:** “What runs automatically” clarifies **enabled JavaScript (script engine) scripts**; other rule engines are not listed yet.
- **Custom chapter cards:** less empty space above the title; leading newlines in `body` trimmed before render.

### 0.9.9 (2026-04-18)

- **My documentation:** optional **Help & emergencies**, **Routines in your own words**, and **Playbook** (`guestHelpNote`, `homeRoutinesNote`, `ownerPlaybookNote` since 0.9.25) — plain-language blocks in **Onboarding** and **User** HTML (with sidebar links when filled), Admin manual chapter, Markdown export, and **AI owner context** grounding.
- **Discovery (admin detail):** adapter instance `schedule` / `restartSchedule` CRON (with fallback state `.schedule`); optional **schedule-type objects** view; JavaScript scripts include **`common.engine`**.
- Admin UI: new fields + i18n (EN/DE/FR); `RENDERER_VERSION` bump.

### 0.9.8 (2026-04-17)

- HTML: QR code server-side SVG (`qrcode` package, offline-safe); **Copy link** = same public URL as QR (`baseUrl` + `/files/…`)
- Config: optional **filesystem export** (`exportPath`); **AI context hints** multiline textarea; `aiOwnerHints` / `exportPath` in `io-package` native defaults
- Multihost: host distribution block (admin); warning when AutoDoc runs on a non-primary host
- AI: guest vs resident handling for context hints (safety replace + Admin help text DE/EN/FR)
- Diagnosis: RAM/CPU (primary host), **copy for forum** snippet
- Changelog: fewer stored entries / fewer expanded rows in HTML
- Admin: AI tab fields use `hidden` (valid jsonConfig); discovery: npm probe when single host
- Docs: README (**base URL**, Docker export, AI hints); `TODO.md` / `PLAN.md` aligned with current QR implementation

### 0.9.7 (2026-04-11)

- AI: HTTP timeout; optional temperatures (user vs onboarding); room/category grounding; stricter German prompts; parsing cleanup; Ollama default temperature when unset; quality / neutral-guest fallbacks; onboarding technical-dump handling
- Startup: clearer **info** logs when generation is queued or skipped; default **generate on start** in defaults / jsonConfig for new installs
- Export: `meta.schemaVersion` `autodoc-json-1`; safer `meta.version` fallback; housekeeping in `io-package.json` news
- HTML: userdata / alias folder behaviour from end-of-page script; layout / template bumps (`RENDERER_VERSION`)
- Reliability (current `main`): duplicate runs avoided when generation is already in progress; phased **1/5–5/5** progress logging; OpenAI-compatible clients retry on selected HTTP errors with backoff; wider desktop main column

### 0.9.6 (2026-04-10)

- AI: HTML debug comment for KI source (primary vs fallback); German onboarding second pass for consistent **Sie**; German user prompt tuning

### 0.9.5 (2026-04-09)

- AI onboarding: leaner guest facts, stricter forbidden wording, fewer invented automation stories

### Earlier releases

Changes for **0.9.4** and older: see **`git log`** and this file’s history in Git, or archived tags.
## 0.9.30 (2026-05-07)

- **Three-dimensional documentation score:** The single maintenance percentage is replaced by **three independent sub-scores** — each with its own progress bar and checklist — plus an overall average:
  - **Data collection** — did autodoc successfully read hosts, instances, and rooms?
  - **Manual content** — has the user filled in description, base URL, contact, and custom texts?
  - **Documentation depth** — does the result go beyond a raw data dump? (rooms assigned, diagram present, rooms with device assignments)
- **Default unassigned-instance threshold raised** from 10 to **30** — typical installations already have 15–20 infrastructure adapters (admin, backitup, discovery …) that never need room assignments.
- **HTML and Markdown renderers** updated to render all three score bars with labels and dimension descriptions. Overall score shown at the bottom as the average.
- **i18n (EN/DE/FR):** added keys for all three dimension titles, descriptions, and individual checks. `documentationScore` label changed to "Overall score" / "Gesamtpunktzahl" / "Score global".

## 0.9.29 (2026-05-07)

- **Maintenance score — room assignment:** `unassignedCount` now counts only **enabled** instances (disabled ones were already tracked separately; behaviour now matches the documented "active instances" wording in EN/DE/FR help text). Label renamed to **"Active instances not assigned to any room"** in all three languages.
- **Scan findings:** removed the `common.desc`-on-scripts finding. `common.desc` on script objects is an **optional group-purpose field** (primarily used on global scripts), not a per-script description — reporting its absence as a finding was misleading. The key and all i18n strings are removed.
- **User view — connected systems:** adapter list switched from a single-column card stack to a **responsive multi-column grid** (`adapter-card-grid`) — same compact layout already used in the admin adapter view.
- **Mermaid host topology:** added explicit **`activeNode`** and **`offNode`** `classDef` entries with neutral slate colours (`activeNode: #94a3b8` fill / dark text; `offNode: #475569` darker fill with muted text + dashed border). Avoids the near-white Mermaid default that looked harsh in dark mode.
- **Mermaid dark-mode re-render:** `toggleDark()` now calls `window.rerenderMermaid()`. The Mermaid init block stores each diagram's original source in `data-mermaid-src` before first render and restores it (plus clears `data-processed`) on theme switch, so diagrams actually update their colour scheme when the user toggles dark mode.
- **discovery:** `common.type` (adapter category) now collected per instance; pre-existing indentation inconsistency on `connectionType`/`dataSource`/`tier` corrected.

## 0.9.28 (2026-04-28)

- **Phase 5.x.3 (step 2 — auto host topology):** Optional **`autoMermaidHostGraph`** and **`autoMermaidHostGraphMaxNodes`** (8–80, default **40**) under **My documentation**. Generates `manualContext.autoHostTopologyMermaid` via **`lib/autoHostTopologyMermaid.js`**: **Mermaid** `flowchart TB` with one **subgraph per ioBroker host** and **instance** nodes (`system.adapter.*` shortened, disabled instances suffixed `(off)`). When there are more instances than the limit, **round-robin** selection across hosts applies; a **`%%`** comment notes **`shown / total`**. Renders in HTML after the owner diagram (`#mermaid-diagram-auto`), in Onboarding **welcome** after the curated diagram, and as a second **`mermaid`** fenced block in Markdown. Same hide chapter id **`mermaid`** as the owner diagram. Export strings **`mermaidAutoTopologyTitle`** / **`mermaidAutoTopologyIntro`** (EN/DE/FR). `RENDERER_VERSION` **2026.04.28.9**.

Older releases (**0.9.27** and earlier): [`CHANGELOG_OLD.md`](CHANGELOG_OLD.md).
