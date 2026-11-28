# AutoDoc — Projektplan

## Vision

AutoDoc macht aus einer ioBroker-Installation automatisch eine **lesbare, aktuelle Dokumentation** — ohne Dauerpflege. Drei Sprachen, eine Datenbasis:

- **Admin** — technische Tiefe (warum passiert X, wenn Y)
- **User / Familie** — Alltag, kein JSON
- **Onboarding / Gäste** — Bedienung des Hauses, null Technik

AutoDoc ist **periodisches Systemgedächtnis** (HTML + kompaktes JSON). Admin-Assistent und MCP sind **Gespräch und Aktion**. Kein zweites Chat, kein eigener MCP-Adapter.

Checkboxen: **[TODO.md](TODO.md)**. Nutzer-Changelog: **[README.md](README.md)**. Release: **[CONTRIBUTING.md](CONTRIBUTING.md)**.

---

## Dokumente & Arbeitsteilung

| Datei | Zweck |
| ----- | ----- |
| **TODO.md** | Was **jetzt** offen ist (Features **und** aktuelle Bot-/Listen-Tickets) |
| **PLAN.md** (hier) | Warum, Festlegungen, Architektur, Ideen |
| **README.md** | Nutzer + Changelog |
| **CONTRIBUTING.md** | Release-Schritte, Checker-Codes, Dependabot-Ausnahmen |

Erledigte Phasen **nicht** hier nacherzählen — README-Changelog und Git.

---

<a id="wie-wir-arbeiten"></a>

## Wie wir arbeiten

### Git

Drei Stufen, nicht in einem Rutsch:

1. **`dev`** — Fehler, Ausbau; commit/push; Test per `…/tarball/dev`.
2. **`main`** — nach einem **geprüften Versionsstand** (Fast-forward), nicht nach jedem Commit.
3. **npm / Listen** — eigener Schritt von **`main`**: [CONTRIBUTING — Release](CONTRIBUTING.md#maintainer-checklist-release-order).

### Issues, PRs, Bots

Quelle der Wahrheit für **Codes** (E/W/S) und Puppeteer: **CONTRIBUTING**. Hier nur das **Verhalten**:

| Quelle | Was tun |
| ------ | ------- |
| **ioBroker-Bot Checker-Issue** (aktuell [#65](https://github.com/crunchip77/ioBroker.autodoc/issues/65)) | Jede Zeile prüfen. Bekannte False Positives (z. B. **W5042**) **nicht** „wegfixen“. Nach echten Fixes `@iobroker-bot recheck` — Issue **nicht** leer schließen. |
| **Bot „add to stable“** (aktuell [#74](https://github.com/crunchip77/ioBroker.autodoc/issues/74)) | **Nicht manuell schließen** (Bot öffnet sonst neu). Blocker als Kommentar (zu wenige Tester). Alte Nummern (**#54**) nicht weiter zitieren. |
| **Bot-PRs** (Template/Auto-Merge) | Review wie normale PRs. Aktuell [PR #75](https://github.com/crunchip77/ioBroker.autodoc/pull/75). |
| **Dependabot** | Patch/Minor bei grüner CI mergen. **Majors** `puppeteer` / `@mermaid-js/mermaid-cli` schließen, bis der Peer-Lock in CONTRIBUTING bewusst fällt. |
| **`pull_request_target`** ([#66](https://github.com/crunchip77/ioBroker.autodoc/issues/66)) | Workflow anpassen (Vorlage: `pull_request` für Dependabot-Auto-Merge), dann Issue schließen. |
| **Listen-PR** `ioBroker.repositories` | Nur wenn der Eintrag **fehlt**; Checker vorher ohne vermeidbare **Errors**. Objekt-Dump als **Datei-Anhang**. **latest** ist Stand 2026-11-28 **drin** — kein zweiter PR „weil W4001 früher mal war“. |
| **Feature-PRs** in diesem Repo | Kurz, nur der Diff. Arbeit auf **`dev`**. |

Produkt-Roadmap lebt in **TODO/PLAN**, nicht als GitHub-Issue-Kopie.

### Technische Eckdaten

- JavaScript, `@iobroker/adapter-core`, Admin **jsonConfig** bis React-Cutover (`adminUI.config: json`)
- Node **≥ 22**, js-controller **≥ 6.0.11** (Minimum **nicht** nur wegen 7.2.5 anheben)
- Admin **≥ 7.8.23**
- Repo: [crunchip77/ioBroker.autodoc](https://github.com/crunchip77/ioBroker.autodoc)

---

## Produktstand (kurz)

| Bereich | Stand |
| ------- | ----- |
| Profile, Discovery, Renderer, i18n EN/DE/FR, Multihost, QR, Forum-Karte | ✅ |
| KI Variante A, Custom Templates (ohne DnD), PDF, Mermaid+SVG, Quick Start, Hybrid-Notfall | ✅ |
| Große Doku nur `/files/`, States Platzhalter (ab 0.9.39), Delta-UX, Automatisierung-Überblick | ✅ **0.9.48** |
| npm **0.9.48** + Provenance; **latest**-Liste | ✅ |
| **stable**-Liste | ⬜ zurückgestellt — [TODO § 2](TODO.md#prozess) |
| Context-Pack, `sendTo`-Erweiterung, React, `system.ai`, DM, `common.custom` | ⬜ [TODO § 3](TODO.md#naechste-features) |
| Backup / KI-B | ⬜ zurückgestellt |

---

<a id="admin-ui-react-zielbild"></a>

## Festlegung — Instanz-UI React (2026-11-28)

**jsonConfig** bleibt bis zum Cutover die **funktionierende** Seite. Sie skaliert schlecht: Kapitelreihenfolge als JSON-String, keine DnD, KI-Credentials nicht wie Admin 8 (`@iobroker/ai-gui`).

**Beschluss:** Instanz-Ansicht wird **React** (ein `native`-Schema, Feature-Parität, dann `adminUI.config`). Kein paralleles Doppelfeld. Keine Asset-Galerie in dem Schritt.

Checkboxen: [TODO § 3.2](TODO.md#admin-react).

---

<a id="plattform-ki-mcp-2026-11"></a>

## Festlegung — Plattform KI / MCP / Admin 8 (2026-11-28)

| Thema | Beschluss |
| ----- | ---------- |
| **Context-Pack** | Kleines Artefakt unter `/files/` als Default für Modelle/`sendTo`. `doc.json` bleibt voll. |
| **`sendTo`** | Lesekommandos für Pack/Meta/Raumkurz; `generateNow` mit User-Recht wo der Controller den User setzt. |
| **KI-Provider** | Ziel **`system.ai`** + optional manuelle Keys über **`@iobroker/ai-core`**. Opt-in, Secret-Heuristik, kein KI-Flut im Admin-Profil. |
| **Skript-KI** | Zuerst Beschreibung/Kommentare; `common.source` nur Lücken. Variante B = Backup. |
| **Geräte / Absicht** | DM/`type-detector` Best Effort; optionales **`common.custom.autodoc`**. |
| **Nicht** | Eigener MCP-Server; Cursor-Abo als `aiApiKey`; Controller-Minimum nur für User-Feld. |

Reihenfolge: [TODO § 3.1](TODO.md#plattform-2026-11).

### Reconnaissance (Live, 2026-11-28)

Ältere Notizen (js-controller 7.2.2 / „latest fehlt“) sind **überholt**.

| Komponente | Stand | Für AutoDoc |
| ---------- | ----- | ----------- |
| **js-controller** | **7.2.5**; Minimum Adapter **≥ 6.0.11** | User auf `sendTo` **optional**. Discovery über Objekte/Views. |
| **Admin** | 8.x, KI-Assistent, MCP, **`system.ai`** | Assistent = Bedienung. AutoDoc liefert Context-Pack + `sendTo`. |
| **`@iobroker/ai-core` / `ai-gui`** | geteilt Admin / javascript 10.4+ | Eigene `aiApiKey`-Felder angleichen, nicht dauerhaft parallel. |
| **javascript** | 10.4+: Editor-KI, `execute` mit User | AutoDoc erklärt nicht denselben Quelltext nochmal an einen zweiten Key. |
| **iobroker.mcp** / Admin-`/mcp` | Streamable HTTP, ACL | Clients lesen `/files/` und `sendTo`. |
| **ioBroker.repositories** | **`autodoc` in latest** | **stable** weiter [#74](https://github.com/crunchip77/ioBroker.autodoc/issues/74). |

Bei Controller-/Admin-Sprüngen diese Tabelle **ersetzen**, nicht stapeln.

---

<a id="ki-skript-festlegung"></a>

## Festlegung — KI + Skriptquellcode

| Frage | Beschluss |
| ----- | ---------- |
| **A / B** | **A** live (`aiAnalyzeScriptSources`) ✅. **B** an Backup gekoppelt. |
| **Tiefe** | Pro Skript Kurztext wenn Feature an; optional eine globale Zusammenfassung; Admin ohne KI-Marketing. |
| **Datenschutz** | Opt-in, Heuristik gegen Secrets (wie `filterNative`), kein Vollversprechen. |
| **Provider** | Bis Plattform-Anschluss: `native`-Felder; danach `system.ai` \| manuell. |
| **Quelle (nächster Schritt)** | Zuerst `common.desc` / Kommentare; `common.source` nur Lücken. |

---

<a id="system-visitenkarte-festlegung"></a>

## Festlegung — System-Visitenkarte

Umgesetzt: jsonConfig `textSendTo` **`getForumCard`**, State `info.forumCardPlain`, `lib/forumCard.js`, Diagnose-HTML.

| Frage | Beschluss |
| ----- | ---------- |
| **Wo** | Primär Instanz-UI (heute jsonConfig, Ziel React). HTML-Snippet in Admin-Doku behalten. |
| **Format** | Plaintext, forumtauglich, kein HTML in der Zwischenablage. |
| **Templates** | Kapitel „nur System“ ersetzt den Copy-Button **nicht**. |

---

<a id="custom-templates-detail"></a>

## Custom Templates

Sinnvoll: Kapitel ein/aus + Reihenfolge, Theme/Presets, freie Markdown-Sektionen. **Nicht:** eigene Datenabfragen oder Handlebars-Volltemplates.

**Da:** Hide-JSON (Admin/User/Onboarding), Order-JSON, `htmlThemePreset` + Theme-Felder, `customDocSectionsJson`, PDF.

**Offen:** Drag-and-Drop **mit React**.

---

<a id="zukunftsvision"></a>

## Ideen (kein zweites TODO)

Forum ([Test Adapter autodoc](https://forum.iobroker.net/topic/84267/test-adapter-autodoc/)): Auto-Inventar **plus** Zusammenhänge, die ioBroker nicht kennt (Umgebung, Absicht). Standardnutzung muss **ohne** Extra-Pflege lohnen; Manuelles ist opt-in und dünn.

**Noch offen / nur stückweise:**

- Automatisierungs-Semantik über Skripte hinaus (Szenen, Node-RED, …) — **Best Effort** + Transparenz. Admin-Kapitel **Automatisierung im Überblick** ✅ 0.9.48.
- Kuratierte „Warum“-Ebene und `common.custom.autodoc` (Paket 8).
- User-Zeile `alive`/`connected`; Zeitplan-Landkarte vertiefen.
- Weitere Diagnose-Signale nur bei harten Daten.

**Plattform-Brücken** (DM, `system.ai`) stehen in [TODO § 3](TODO.md#naechste-features), nicht hier nochmal als Roadmap.

---

<a id="architektur-grenzen"></a>

## Architektur

Drei Schichten in **dieser** Datei (kein zweites Architektur-Doc): **Ist** (Code), **Leitplanken** (neue Features), **offen** (bewusst unentschieden).

### Dateien vs. States

Kanonisch: **`/files/autodoc.<instanz>/`**, pro Lauf überschrieben, kein Archiv im Adapter. Ab **0.9.39** sind große `documentation.*`-States **Platzhalter**. Hashes: `documentation.exportHashes`. Optional **`exportPath`** (NAS/`file://`) zusätzlich — nie Pflicht.

**jsonl:** Dateien auf Disk, DB bleibt schlank. **Redis:** Blobs im RAM — **keine** Fotos in `/files/`.

Admin (8081) ist der universelle Viewer; Web-Adapter optional.

<a id="architektur-medien-mvp"></a>

### Medien (MVP)

| Bedarf | Lösung |
| ------ | ------ |
| Fotos / große PNG | **https://-URLs**, nicht Upload in die ioBroker-Dateischicht |
| SVG / QR / kleine Diagramme | generiert (QR) oder **opt-in** Mermaid (`enableManualMermaid`) |
| Portable Kopie | `exportPath` + relative Pfade / eingebettetes SVG |
| Mermaid | Bei Generierung **SVG** (`@mermaid-js/mermaid-cli`), sonst `<pre>` + jsDelivr-Fallback. Markdown: Fence mit Quelltext. Chromium **Best Effort** (Docker/LXC). |

Kein Asset-Upload-Tab. Soft-Empfehlung: Dateien unter `/files/autodoc.*` deutlich unter ~500 KB; bei Redis strenger.

### Leitplanken (Schicht 2)

| Thema | Regel |
| ----- | ----- |
| Artefakte | `/files/`, Latest only |
| Redis | keine großen Binärdateien über AutoDoc |
| `exportPath` | opt-in, vom Master in Multihost |
| Portable HTML | kein CDN für Kern; QR/Mermaid als SVG wenn möglich |
| Graphen | nur **opt-in** kuratiertes Mermaid; kein Auto-Host-Graph |

### Backup der Installation vs. „Backup-Anbindung“

Standard-ioBroker-Backup enthält Objekte, States (Platzhalter) und `/files/autodoc.*`. **`exportPath`** nur, wenn der Ordner **extra** gesichert wird. Externe URLs: nur der Link.

**Phase-5-Idee** „Doku aus Backitup-`tar.gz`“ ist **etwas anderes** (Offline/Migration) — [TODO § 4](TODO.md#zurueckgestellt).

<a id="multihost-plan"></a>

### Multihost

AutoDoc auf dem **Master** (Warnung, kein hartes Block). Host-Karten im Admin bei >1 Host. Export-Pfad = Dateisystem des Masters (NAS-Mount sinnvoll). Host-Übersicht = Karten/Tabelle, **kein** Auto-Mermaid-Graph.

---

## Bewusst weggelassen

| Feature | Grund |
| ------- | ----- |
| Ungefilterte Groß-Graphen | Mermaid nur kuratiert / klein |
| Auto-Host-Mermaid | Host-Karten/Tabelle reichen; Nutzer-Diagramm nur opt-in |
| Voll-AST aller Live-Skripte | Aufwand, Last |
| REST / Webhooks / Mobile / Kollaboration / Smart-Speaker | außerhalb Scope |
| Eigener MCP-Server | Admin-MCP / `iobroker.mcp` |
| HTTP-Asset-Server | erst bei echtem Bedarf |
