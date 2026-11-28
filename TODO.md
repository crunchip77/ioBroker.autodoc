# AutoDoc — TODO

Arbeitsliste: **offen oben**, Erledigtes nur als Kurzüberblick. **Warum** und Architektur: [PLAN.md](PLAN.md). **Nutzer-Changelog:** [README.md](README.md). **Release/Checker-Details:** [CONTRIBUTING.md](CONTRIBUTING.md).

Stand **2026-11-28**, Version **`0.9.48`**. Alltag **`dev`** → nach geprüftem Stand **`main`** → später npm/Listen ([CONTRIBUTING](CONTRIBUTING.md#maintainer-checklist-release-order)).

| Datei | Rolle |
| ----- | ----- |
| **TODO.md** | Checkboxen, aktuelle Issues/PRs, nächste Pakete |
| **[PLAN.md](PLAN.md)** | Vision, Festlegungen, Architektur, Ideen |
| **[README.md](README.md)** | Nutzer + Changelog |
| **[CONTRIBUTING.md](CONTRIBUTING.md)** | Release-Reihenfolge, Checker-Codes, Dependabot |

---

## Inhaltsverzeichnis

1. [Offen — Überblick](#offen-ueberblick)
2. [Prozess: Listen, Bot, PRs](#prozess)
3. [Nächste Features](#naechste-features)
4. [Zurückgestellt](#zurueckgestellt)
5. [Optional](#optional)
6. [Bewusst weggelassen](#bewusst-weggelassen)
7. [Erledigt (Kurz)](#erledigt)

---

<a id="offen-ueberblick"></a>

## 1. Offen — Überblick

| Thema | Status | Wo |
| ----- | ------ | --- |
| **npm** `iobroker.autodoc` **0.9.48** + Provenance | ✅ | CONTRIBUTING Release-Checkliste |
| **latest**-Liste (`sources-dist.json`) | ✅ Eintrag **`autodoc`** vorhanden | kein W4001-Nachbau |
| **stable**-Liste | ⬜ zurückgestellt (zu wenige Tester) | [#74](https://github.com/crunchip77/ioBroker.autodoc/issues/74) — **nicht** manuell schließen |
| **Checker-Bot** | 🟡 prüfen, nicht blind abhaken | [#65](https://github.com/crunchip77/ioBroker.autodoc/issues/65) |
| **`pull_request_target`** | ⬜ Workflow prüfen | [#66](https://github.com/crunchip77/ioBroker.autodoc/issues/66) |
| **Bot-PR Auto-Merge Dependabot** | ⬜ Review | [PR #75](https://github.com/crunchip77/ioBroker.autodoc/pull/75) |
| **Dependabot** mermaid-cli 11.17.1 | ⬜ Review | [PR #83](https://github.com/crunchip77/ioBroker.autodoc/pull/83) |
| **Plattform** (Context-Pack → `sendTo` → React → `system.ai` → …) | ⬜ nacheinander | [§ 3](#naechste-features), [PLAN](PLAN.md#plattform-ki-mcp-2026-11) |
| **React-Instanz** | ⬜ Zielbild | [§ 3.2](#admin-react), [PLAN](PLAN.md#admin-ui-react-zielbild) |
| **Backup / KI-Skript B** | ⬜ bewusst später | [§ 4](#zurueckgestellt) |
| **Kapitel-DnD** | ⬜ mit React, nicht jsonConfig | [PLAN Custom Templates](PLAN.md#custom-templates-detail) |

---

<a id="prozess"></a>

## 2. Prozess: Listen, Bot, PRs

> **Regel:** Bot-Issues sind **kein** Feature-Backlog. Jede Meldung einzeln bewerten. Codes und Ausnahmen: **CONTRIBUTING**. Produktideen bleiben in PLAN/TODO, nicht als GitHub-Issue duplizieren (außer echte Bugs/Nutzer-Tickets).

### Listen (`ioBroker.repositories`)

- [x] **latest:** `autodoc` steht in [`sources-dist.json`](https://github.com/ioBroker/ioBroker.repositories/blob/master/sources-dist.json) (Stand 2026-11-28). Historie: PR **#5978** gemerged, zwischenzeitlich wieder raus (Checker als „neu“), **wieder drin**.
- [ ] **stable:** erst bei genug Testern. Aktuelles Bot-Ticket: **[#74](https://github.com/crunchip77/ioBroker.autodoc/issues/74)** (0.9.48). **[#54](https://github.com/crunchip77/ioBroker.autodoc/issues/54)** ist **erledigt/alt** (0.9.46). Bot-Text: **Issue nicht schließen** — sonst kommt ein neues; Begründung als **Kommentar**.
- [ ] Neuer **latest**-PR nur, wenn der Eintrag **wirklich fehlt**. Checker **W4001** dann erwarten, nicht „trotz altem Merge“.

### ioBroker-Bot (Checker / Service)

Offen:

- [ ] **[#65](https://github.com/crunchip77/ioBroker.autodoc/issues/65)** Checker — nicht die ganze Liste als TODO übernehmen:
  - **E0036** `@iobroker/testing`: im Repo bereits **^6.3.2** — nach nächstem Check/Release mit `@iobroker-bot recheck` abgleichen.
  - **W5042** `puppeteer`: **bewusst** `optionalDependencies` — **nicht** nach `dependencies` schieben ([CONTRIBUTING](CONTRIBUTING.md#optional-puppeteer-mermaid-cli)).
  - **W8004** offener Bot-PR **#75** (Auto-Merge) — Review, nicht ignorieren und nicht blind mergen.
  - **S4047** = Hinweis **stable** — gleiche Entscheidung wie [#74](#prozess).
- [ ] **[#66](https://github.com/crunchip77/ioBroker.autodoc/issues/66)** GitHub schränkt `pull_request_target` ein. Repo hat `.github/workflows/automerge-dependabot.yml` mit diesem Trigger. Bot-Vorlage: Dependabot-Auto-Merge auf `pull_request` umstellen (PR **#75**). Issue **schließen**, wenn der Workflow passt.

Nach Fixes: im Issue **`@iobroker-bot recheck`** oder **`recreate`**. Issues **nicht** „leer schließen“, um die Liste sauber zu machen.

### Dependabot / Bot-PRs

- [ ] [PR #75](https://github.com/crunchip77/ioBroker.autodoc/pull/75) — `[iobroker-bot] Setup Auto-Merge` (Nachfolger von geschlossenem **#67**).
- [ ] [PR #83](https://github.com/crunchip77/ioBroker.autodoc/pull/83) — `mermaid-cli` **11.16.0 → 11.17.1** (Patch-Linie 11, CI prüfen).
- Majors **mermaid-cli 12** / **puppeteer 25:** schließen bzw. ignorieren, bis [CONTRIBUTING — Peer-Lock](CONTRIBUTING.md#optional-puppeteer-mermaid-cli) bewusst aufgehoben wird (bereits geschehen: PRs **#73**, **#80**).

Feature-PRs: kurz, nur der Diff — [.cursor/rules/concise-pr-and-comments.mdc](.cursor/rules/concise-pr-and-comments.mdc). Arbeit auf **`dev`**.

### Release (jedes npm)

Vollständige Reihenfolge: [CONTRIBUTING — Maintainer checklist](CONTRIBUTING.md#maintainer-checklist-release-order). Kurz: Tests → `main` → Tag/`deploy` (Provenance) → GitHub Release → `dev` sync. **`npm publish` allein ist unvollständig.**

- [x] Trusted Publishing / **E2008** ab **0.9.48**
- [ ] Checker ohne **vermeidbare** Errors; **W5042** bleibt dokumentiert

---

<a id="naechste-features"></a>

## 3. Nächste Features (Reihenfolge)

Ein Paket nach dem anderen. Begründung: [PLAN — Plattform](PLAN.md#plattform-ki-mcp-2026-11). **Nicht bauen:** eigener MCP-Server, zweites Chat-UI, js-controller-Minimum nur wegen 7.2.5 anheben.

<a id="plattform-2026-11"></a>

### 3.1 Plattform-Anschluss

- [ ] **1 — Context-Pack** — kleines Artefakt unter `/files/` (Inventar-Kurz, Delta, Raum-/Gäste-Kurz, Forum-Karte, Lücken). `doc.json` bleibt Vollmodell.
- [ ] **2 — `sendTo`-API** — zusätzlich zu `generateNow` / `cancelScriptSourceAi` / `getStatus` / `getForumCard`: z. B. `getContextPack`, `getExportMeta`, optional `getRoomBrief`.
- [ ] **3 — `sendTo`-Absender** — wo Controller **≥ 7.2.5** den User setzt: `generateNow` nur mit passenden Rechten; ältere Controller unverändert.
- [ ] **4 — React-Instanz** — [§ 3.2](#admin-react)
- [ ] **5 — KI über `system.ai` / `@iobroker/ai-core`** — Credential system \| manuell; bestehende Provider (Ollama/Groq/Anthropic) an den Stack, nicht wegwerfen. AutoDoc bleibt Batch-Doku.
- [ ] **6 — Skript-KI** — zuerst `common.desc` / Editor-Kommentare; `common.source` nur Lücken. Blockly nur Label. Variante B weiter an Backup.
- [ ] **7 — Geräte** — Device Manager (`dm:`) / type-detector **Best Effort**.
- [ ] **8 — `common.custom.autodoc`** — optional ein Satz am Objekt; `manualContext` in `native` bleibt Fallback.

<a id="admin-react"></a>

### 3.2 Admin-UI — React *(Zielbild)*

jsonConfig bleibt bis Cutover die laufende UI. [PLAN](PLAN.md#admin-ui-react-zielbild).

- [ ] Instanz-Ansicht in React (Tabs analog heute)
- [ ] Cutover: `adminUI.config`; ein `native`-Schema
- [ ] Nutzen: Kapitel-DnD, Listen statt JSON-Strings, `@iobroker/ai-gui` / `system.ai`, Generate-Status
- [ ] i18n: Keys aus `admin/i18n` wiederverwenden
- [ ] Nicht im selben Schritt: MCP-Server, Asset-Upload

Reihenfolge: **nach** Context-Pack/`sendTo`, **vor/mit** `system.ai`.

---

<a id="zurueckgestellt"></a>

## 4. Zurückgestellt

### Backup / ioBroker.backitup + KI-Skript Variante B

Kein kurzfristiger Bau. Nutzen erst nach Resonanz aus **latest**/Forum. [PLAN](PLAN.md#ki-skript-festlegung).

- Archive typisch **`*.tar.gz`** ([ioBroker.backitup](https://github.com/simatec/ioBroker.backitup)), nicht nur ZIP.
- Zugriff: lesbarer Pfad (Mount) oder lose `sendTo` an Backitup (`list` / `getSystemInfo` — gegen aktuelle Version prüfen). Keine Cloud-Zugänge in AutoDoc duplizieren.
- KI-B: gleiche Pipeline wie A, Quelle = Archiv.

### Custom Templates — DnD

Mit React ([§ 3.2](#admin-react)). Kapitel ausblenden/Reihenfolge/Presets/PDF sind **fertig**.

---

<a id="optional"></a>

## 5. Optional (kein Muss)

- Weitere Diagnose-Signale in `lib/diagnosisSnapshot.js` — nur bei tragfähigen Daten (wie Node heute).
- Quick-Start: weitere Caps/i18n (`lib/quickStartGuide.js`).
- Wiki `docs/user-guide/`: weitere Sprachen (EN/DE + Screenshots sind da).
- Forum-Karte: optionales Template „nur System“-HTML — Button in der Instanz reicht.
- Onboarding: ein Satz bei **großen** Inventar-Deltas (heute bewusst ohne).

---

<a id="bewusst-weggelassen"></a>

## 6. Bewusst weggelassen

- Ungefilterte Gesamtgraphen (Skript/State ohne Limit)
- Automatischer Host-Instanz-Mermaid-Graph (Host-Karten reichen)
- Vollständiges AST/Code-Parsing aller Skripte live
- REST-API / Webhooks, Mobile App, Alexa/Google, Analytics, Kollaboration
- Eigener **MCP-Server** (Admin-`/mcp` und `iobroker.mcp` lesen Dateien + `sendTo`)
- Asset-Upload-Galerie / eigener HTTP-Asset-Server (Medien: URLs + kleine SVG)

---

<a id="erledigt"></a>

## 7. Erledigt (Kurz)

Einzelne Checkbox-Historie liegt im **Git** und im **README-Changelog**. Hier nur Meilensteine:

| Bereich | Stand |
| ------- | ----- |
| Phasen 1–4, Profile, i18n EN/DE/FR, Multihost, QR, Forum-Karte | ✅ |
| KI Variante A (`aiAnalyzeScriptSources`), Provider-Tab `hidden` | ✅ |
| Custom Templates: Hide/Order JSON, Presets, Custom-Sections, User/Onboarding-Order | ✅ |
| 5.x.1 Hybrid-Notfall, 5.x.2 Quick Start, Mermaid SVG/mmdc (manuell, **opt-in**; Auto-Host-Graph entfernt) | ✅ |
| PDF 0.9.33, States nur Platzhalter ab 0.9.39, exportHashes | ✅ |
| Dokumentations-Score dreiteilig, Admin-MD Diagnose | ✅ |
| Phase B Doku-UX, Delta-UX, Automatisierung im Überblick | ✅ **0.9.48** |
| npm + GitHub Releases + Provenance | ✅ **0.9.48** |
| Checker-Runde **#60** (E4052, E6034, CI Node 26) | ✅ geschlossen |
