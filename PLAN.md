# AutoDoc Adapter — Projektplan

## Vision

AutoDoc ist ein ioBroker-Adapter, der aus einer Installation automatisch eine lesbare,
strukturierte und ständig neu erzeugbare Dokumentation macht. Der Mehrwert liegt darin,
dass man endlich einen aktuellen Überblick über ein oft sehr komplexes System bekommt,
ohne alles manuell pflegen zu müssen — auch nach Monaten noch erklärbar, für sich selbst,
für Familie, Mitbewohner oder bei Migrationen.

Drei echte Zielgruppen mit komplett unterschiedlicher Sprache:

- **Admin**: "Warum macht das System X wenn Y passiert?" — volle technische Tiefe
- **User / Familie**: "Wie funktioniert unser Zuhause?" — verständlich, kein JSON
- **Onboarding / Gäste**: "Wie benutze ich dieses Haus?" — null Technik, reine Alltagssprache

Langfristige inhaltliche Richtung (Zusammenhänge, Auto vs. Pflege, Forum-Feedback): siehe Abschnitt **„Zukunftsvision — Zusammenhänge & Kontext (Brainstorming)“** weiter unten.

## Technische Grundlagen

- **Sprache**: JavaScript (ioBroker Creator Standard)
- **Admin UI**: JSON/jsonConfig
- **Framework**: @iobroker/create-adapter v3.1.2
- **Node.js**: Version 22
- **Repository**: [crunchip77/ioBroker.autodoc](https://github.com/crunchip77/ioBroker.autodoc)

## Entwicklungs-Umgebung

- **IDE**: Visual Studio Code auf Windows
- **Testsystem**: ioBroker auf Unraid-Server (separat vom Produktivsystem)
- **Deployment**: `dev`-Branch → GitHub Push → Installation auf Testserver via ioBroker Admin → **Benutzerdefinierte URL** → `https://github.com/crunchip77/ioBroker.autodoc/tarball/dev` (oder `/tarball/main` nach Merge)
- **Release-Strategie**: `dev` testen → Merge nach `main` für Forum-/RC-Tester; **npm + repositories** erst wenn Adapter-Checker und PR durch sind (Versionsnummer dann bewusst wählen — **nicht** mit RC **0.9.x** verwechseln)

## Branch-Strategie

- `main` = stabiler Stand nach Merge aus `dev` (**0.9.x** Release-Kandidat / Forum); separates **npm-Release** später mit eigener Versionspolitik
- `dev` = aktive Entwicklung; Commits immer auf `dev`
- Kein direkter Feature-Push auf `main` ohne vorherigen `dev`-Stand; Merges `dev` → `main` für getestete RC-Schnitte

## Release-Prozess (echter ioBroker-Release)

Solange der Adapter **nicht auf npm** und **nicht in `ioBroker.repositories`** eingetragen ist, haben Git-Tags und GitHub Releases keine Wirkung auf Update-Erkennung oder Installation im ioBroker Admin. URL-Installation lädt immer `main` HEAD.

**Reihenfolge für einen echten Release:**

1. `package.json` + `io-package.json` Version synchron bumpen
2. News-Eintrag in `io-package.json` (EN + DE minimum)
3. `dev` → Merge nach `main` _(für aktuellen **0.9.x**-RC / Forum umgesetzt; vor **npm** erneut Version + News setzen)_
4. `npm publish` → Paket auf npmjs.com
5. Git-Tag + GitHub Release erstellen (erst jetzt sinnvoll)
6. PR zu [ioBroker/ioBroker.repositories](https://github.com/ioBroker/ioBroker.repositories) für Beta-Eintrag (`sources-dist.json`)
7. Voraussetzung: [Adapter Checker](https://adapter-check.iobroker.in/) vollständig grün

## Wichtige Referenzen

- [ioBroker AI Developer Guide](https://github.com/Jey-Cee/iobroker-ai-developer-guide)
- [Adapter Creator](https://github.com/ioBroker/create-adapter)
- [Adapter Checker](https://adapter-check.iobroker.in/)

---

## Phase 1 — Basis ✅ ABGESCHLOSSEN (v0.1.0)

- Modularisierung: `lib/discovery.js`, `lib/documentModel.js`, `lib/markdownRenderer.js`, `lib/htmlRenderer.js`, `lib/versionTracker.js`, `lib/i18n.js`
- Dateibasierter Export: Markdown, HTML, JSON nach `/files/autodoc.0/`
- Admin UI: `jsonConfig.json5` + i18n (EN, DE, FR)
- Drei Zielgruppenprofile: Admin, User, Onboarding
- Adapter-Beschreibungen aus ioBroker-Metadaten (`common.desc`, `common.titleLang`)
- Versionsverfolgung mit Diff und Changelog
- Automatische Generierung: Startup, Timer, Event-basiert (30s Debounce)
- HTML-Renderer mit Sidebar-Navigation, Stat-Cards, profil-bewusstem Layout

---

## Phase 2 — Inhalt ✅ ABGESCHLOSSEN

Der Sprung von "Adapter-Inventar" zu echter "System-Dokumentation".

### 2.1 Räume und Geräte ✅

- `enum.rooms` und `enum.functions` auslesen
- Räume-Kapitel in HTML + Markdown

### 2.2 Skript-Dokumentation ✅

- Alle Skripte aus `script.js.*` mit Name, Status, Beschreibung, Trigger-Typ

### 2.3 Wartungs- und Diagnosehilfe ✅

- Instanzen ohne Raum, Skripte ohne Beschreibung, deaktivierte Instanzen
- Score + Checkliste (Admin-Profil)

### 2.4 Such-/Filterfunktion im HTML ✅

- Clientseitiges JS, kein Server, filtert Tabellen + Karten
- Suchbox im Nav-Sidebar, Ergebnis-Zähler, Escape-Reset

---

## Phase 3 — Tiefe ✅ ABGESCHLOSSEN

### 3.1 Notifications ✅

- `sendTo` nach Generierung: Telegram, Email, Pushover, Signal, WhatsApp, generisch
- Konfigurierbar: Instanz, Empfänger, optionales Nachrichten-Template

### 3.2 Dependency-Analyse ✅

- `lib/dependencyAnalyzer.js`: Regex-Extraktion von State-Referenzen aus Script-Quellcode
- `stateRefs` pro Script + Cross-Reference-Tabelle (Shared States)
- HTML: Unterabschnitt "State References" + "Shared States" (Admin-only)

### 3.3 AI-Enhanced Documentation ✅

- `lib/aiEnhancer.js`: pluggable Provider-Architektur, opt-in
- Provider: `anthropic` (Claude Haiku/Sonnet, paid), `groq` (Llama 3.3 70B, Free Tier), `ollama` (lokal, kein Datenschutzproblem)
- Groq + Ollama nutzen OpenAI-kompatible API — minimaler Overhead
- Admin-Profil wird automatisch übersprungen (alle Daten bereits faktisch vorhanden)
- Narrative Zusammenfassung + Maintenance-Empfehlungen (nur user/onboarding)
- HTML: hervorgehobene AI-Box; Markdown: Blockquote
- Fehler → stille Warnung, Doku wird trotzdem generiert

### 3.x i18n-Vollständigkeit ✅

- Alle hardcodierten englischen Strings in htmlRenderer.js durch i18n-Schlüssel ersetzt
- EN, DE, FR vollständig

### 3.x Adapter-Metadaten & manualContext ✅

- `discovery.js`: liest `connectionType`, `dataSource`, `tier` aus `common.*` je Instanz
- `discovery.js`: `filterNative()` entfernt sensitive Felder (password/token/key/secret/...) per Regex, behält nur skalare Werte → sicheres Admin-Detail
- `documentModel.js`: `parseManualContext()` normalisiert manualContext (JSON-String oder Objekt), gibt immer `{description, contact, notes, adapters:{}, rooms:{}}` zurück
- `htmlRenderer.js`: Admin-Tabelle zeigt Badges (🔌/☁️ connectionType, Push/Poll dataSource, Tier); manualContext-Notiz pro Adapter in allen Profilen

---

## Phase 4 — Profile-Redesign ✅ ABGESCHLOSSEN

Echte Zielgruppen-Dokus statt "mehr oder weniger Detail vom selben Template".

### Architektur-Entscheidungen

- **Dispatcher-Muster** in `htmlRenderer.js`: `renderHtml()` → `renderAdminHtml()` / `renderUserHtml()` / `renderOnboardingHtml()`
- Bestehende Kapitel-Methoden bleiben für Admin/User nutzbar
- Onboarding bekommt eigene Methoden ohne technische Kapitel

### Bekannte Probleme & Lösungen

- **Raum-Mitglieder auflösen**: Unique Device-IDs bündeln, einmalig `getForeignObjectsAsync` statt N Einzelaufrufe
- **Rollen-Inkonsistenz**: `lib/roleMapper.js` normalisiert alle Adapter-Rollen auf Kategorien + Icons
- **Live-States**: Opt-in (`config.readLiveStates`), nur sinnvolle Rollen (Thermostat, Tür/Fenster, Alarm), fault-tolerant
- **Dünner Onboarding-Inhalt**: Hinweis wenn kein `manualContext` + kein AI → Nutzer zur Konfiguration auffordern
- **`system.config`**: Graceful fallback wenn Stadt/Land nicht gepflegt

### 4.1 Discovery-Erweiterungen

- `system.config` auslesen (Stadt, Land, Systemsprache)
- Geräte-Namen-Auflösung: Raum-Mitglieder → Device-Objekte → `common.name`
- Geräte nach Device gruppieren (nicht jede State einzeln)
- Live-States für Schlüssel-Rollen (opt-in)

### 4.2 `lib/roleMapper.js`

- ioBroker-Rollen → Kategorien + Icons + Labels (EN/DE/FR)
- Abdeckung: Licht, Dimmer, Rolllade, Thermostat, Feuchtigkeit, Bewegung, Tür/Fenster, Medien, Schloss, Alarm, Steckdose, Kamera

### 4.3 DocumentModel-Erweiterungen

- `docModel.systemConfig`: Stadt, Land, Sprache
- `docModel.rooms.rooms[].devices[]`: aufgelöste Geräte mit Name, Kategorie, Icon, ggf. currentValue + unit
- Abwärtskompatibel: nur neue Felder hinzu

### 4.4 Renderer-Architektur: Dispatcher

- `renderHtml()` als Dispatcher
- `renderAdminHtml()` = aktuelles Rendering (leicht bereinigt)
- `renderUserHtml()` = neue User-Methode
- `renderOnboardingHtml()` = komplett neu

### 4.5 Onboarding-Profil: Neues Template

- Sprache: "Du", kurze Sätze, kein Passiv, kein Fachjargon
- Inhalt: Willkommenstext, Räume mit Geräte-Namen, "Was läuft automatisch?", manualContext, AI-Summary prominent
- Kein: Adapter-Inventar, OIDs, State-Counts, Trigger-Typen
- Live-Values wenn aktiviert: Thermostat-Temperatur, Tür/Fenster-Status

### 4.6 User/Familie-Profil: Überarbeitung

- Räume mit aufgelösten Gerätenamen + Funktion
- Skripte: nur Name + Beschreibung, kein Trigger-Typ
- Wartungshinweise in Alltagssprache (keine OIDs)
- Adapter: nur Titel, keine Version/ID

### 4.7 Admin-Profil: Ergänzungen

- Device-Hierarchie in Räumen (mit OIDs für Vollständigkeit)
- Rest bleibt wie bisher

---

## Phase 5 — Erweiterungen (Nice-to-Have)

- PDF-Export
- Backup-Adapter Integration (Doku mit Backup speichern)
- Custom Templates

**Erledigt (ehemals Phase 5-Idee):** QR-Code und teilbarer Link für das Onboarding-Profil — **serverseitig** als eingebettetes SVG (npm-Paket `qrcode`), **ohne CDN** und ohne zusätzliches Client-Skript für die QR-Erzeugung. „Link kopieren“ nutzt dieselbe öffentliche `/files/…`-URL wie der QR-Code (Voraussetzung: sinnvoll gesetzte **ioBroker base URL** in den Adapter-Einstellungen; siehe README).

### Phase 5.x — Onboarding / Troubleshooting / Mermaid (gestaffelt)

> Abgestimmt für die nächste Ausbaustufe. Checkboxen: [TODO.md — Phase 5.x](TODO.md). **Priorität:** 1 → 2 → 3.

**1. Notfall & Troubleshooting für Laien (Hybrid)**  
MVP: eigener Onboarding-Abschnitt (optional User), Inhalt primär **manuell** (Kontakte, Totalausfall, wo Hilfe) — keine erfundenen Diagnosen; optional **sichere** Auto-Snippets nur aus bekannten Config-Fakten (z. B. Basis-URL). Später: kurze Checklisten nur bei **konkreten** Diagnose-Befunden (Momentaufnahme).

**2. Quick Start & Raumguides (strukturierter)**  
MVP: im `documentModel` feste, kurze Blöcke (systemweit Top 3–5 Aktionen; pro Raum 2–3 Highlights); Renderer zeigt Kacheln/Listen statt nur Fließtext; KI höchstens zur Formulierung. Später: Sortierung/Relevanz (Kategorien/Funktionen), unterschiedliche Länge Onboarding vs. User.

**3. Mermaid / kleine Graphen**  
**Stufe 1 (MVP):** Mermaid aus **kuratiertem** Inhalt (eigenes Feld / `manualContext`); Ausgabe mindestens in Markdown, HTML-Darstellung bewusst wählen (Codeblock vs. Client-Render). **Stufe 2:** optional kleiner **begrenzter** Auto-Graph (z. B. Multihost Host → Instanzen mit Knotenlimit). **Nicht Ziel:** vollständiger Skript-/State-Graph großer Installationen ohne Filter.

---

## Zukunftsvision — Zusammenhänge & Kontext (Brainstorming)

> **Status:** Sammelplatte für Ideen — **keine feste Roadmap**, derzeit **kein aktiver Umsetzungsplan**. PDF, Backup-Integration, Custom Templates und die Ideen in der Tabelle unten bleiben bewusst **zur späteren Abstimmung** (Phase 5 + diese Vision). Soll verhindern, dass Diskussionen (Forum, intern) verloren gehen.

### Auslöser

- **Ziel des Adapters:** aus der Installation **automatisch** aktuelle, gut lesbare Doku — ohne Pflicht zur manuellen Pflege.
- **Forum** ([Test Adapter autodoc](https://forum.iobroker.net/topic/84267/test-adapter-autodoc/)): Nutzer **UlliJ** lobt AutoDoc und wünscht sich die **Kombination** mit manuell erstellter Doku, die **Zusammenhänge** verständlich macht (z. B. Topologie-Skizzen: Proxmox, LXC, ioBroker, Influx, Grafana, Funk-Ökosysteme). Verlinkung **von** externer Doku **zu** AutoDoc wurde praktisch gezeigt („quick & dirty“).
- **Abgrenzung zu „Bilder in Notizen“:** Bilder/Grafiken können *ein* Baustein sein; der Kernfeedback ist breiter: **Beziehungen** zwischen Teilen des Systems sichtbar machen — für **Onboarding** (Gäste), **User** (Alltag) und **Admin** (Aufbau, Abhängigkeiten, Sonderfälle, Wiederanlauf).

### Spannungsfeld

- Je **mehr** Nutzer einpflegen müssen, desto eher wird es **nicht** genutzt („zu faul“ / kein Zeitbudget) — **Auto-Charakter** leidet.
- **Lösungsrichtung:** starke **auto-Basisschicht** aus Objekten/Metadaten/Analyse (bereits z. B. Inventar, Skript-Übersicht, Dependency-/Referenz-Ideen) + **optionale, dünne** Schicht für Dinge, die ioBroker **nicht** weiß (Umgebung, Absicht, Notfall-Infos, externe Doku-Links).

### Admin-Profil — „Wie ist das System aufgebaut?“

**Möglichst ohne Zusatzpflege:**

- Inventar: Hosts, Controller/Node, Instanzen, Adapter-Metadaten, Diagnose, Repos — Landkarte des **Ist-Zustands**.
- **Abhängigkeiten / Querbezüge:** aus vorhandener Analyse (z. B. `stateRefs`, Skript↔Objekt, Instanzübersicht) — echte **Auto-Doku**.
- Skript-Landkarte (Trigger, Zeitpläne, Ordner) als Grundlage für **„was läuft wie automatisch“** und für **Recovery-Listen** (was muss nach Neuaufbau wieder existieren), ohne Romane.

**Nur wo nötig (opt-in, wenig Felder):**

- Kurzes Kapitel **„Umgebung & Wiederanlauf“** mit festen Unterpunkten; Auto-Befüllung wo möglich, **Lücken** optional vom Nutzer (einmalig oder selten).
- **Externe Quelle:** prominente Links (Wiki, BookStack, Markdown-Repo) statt alles in den Adapter zu duplizieren.
- Optional später: **Mermaid** oder **Bilder** nur für diesen Kontext — **Umsetzung Mermaid:** [Phase 5.x](TODO.md) (gestaffelt: kuratiert → klein & auto); Bilder weiterhin separat zu klären.

### User-Profil

- **Gleiche Schichtung**, andere **Tiefe und Sprache:** Alltag („Räume, Geräte, was passiert von selbst“), **kein** technisches Recovery-Kapitel wie im Admin.
- **Auto-first** noch strenger: kurze Texte, Karten, wenig Pflege-Fläche; optionale **Hausnotizen** bleiben knapp.

### Onboarding-Profil

- **Orientierung** und **„was läuft automatisch“** in groben, vertrauenswürdigen Worten; strikt **faktenbasiert** wo KI genutzt wird (Guards, Fallbacks — bestehende Philosophie fortsetzen).
- **Zusammenhänge** als sehr kurzer Block + ggf. **eine** visuelle oder verlinkte Ebene — kein Architektur-Wälzer für Gäste.

### Umsetzungs-Ideen (nicht priorisiert)

| Richtung | Idee |
| -------- | ---- |
| **A — Auto** | Aus `documentModel` generierte Kurztexte/Kacheln „Zusammenspiel“; **automatische** Mermaid-Graphen *nur* wo Daten tragfähig sind (z. B. kleine Hierarchien). |
| **B — Semi-auto** | Ein konfigurierbares Markdown-Feld „System & Zusammenhänge“ mit optionalen Mermaid-Blöcken (wenig Pflege, hoher Effekt). |
| **C — Verknüpfung** | Felder für **URLs** externer Doku; AutoDoc bleibt **Quelle der Wahrheit** für Installationsstand, externe Doku für **Absicht/Kontext**. |
| **D — Medien** | Bild-Upload oder Ablage unter `files/…` + Verweise — höherer Aufwand (Größe, Dark Mode, Rotation). |

### Skript-Quellcode-Analyse & Smarthome-Beschreibung durch KI (Brainstorming)

> **Status:** Noch unentschieden — zwei Varianten denkbar, Form und Tiefe offen. Zu gegebenem Anlass näher erörtern.

**Grundgedanke:** Nicht nur Metadaten (Name, Trigger, Status) der Skripte auslesen, sondern den eigentlichen Quellcode durch KI analysieren lassen — um automatisch zu beschreiben, was das Smarthome **tatsächlich tut**: Inhaltsverzeichnis der Automatisierungen, „was steuert was", „wie reagiert das System auf X".

#### Variante A — Deep Script Analysis (Erweiterung von Phase 3.3 / live)

- `discovery.js` liest `common.source` (JS-Quellcode) pro Skript ein (opt-in, neues Config-Flag)
- Neuer KI-Pass in `aiEnhancer.js`: Skripte (oder Batches) werden an den gewählten Provider gesendet
- KI erklärt pro Skript in 2–4 Sätzen, was es tut und wie es steuert
- Globaler Automations-Überblick: KI fasst alle Skripte zusammen → „Was läuft in diesem Zuhause automatisch?"
- Mögliche Kapitelstruktur: Licht, Heizung, Sicherheit, Benachrichtigungen — aus echtem Code abgeleitet
- **Herausforderungen:** Token-Limits (Batching/Truncation nötig), Datenschutz (Code kann Credentials enthalten → Opt-in + Hinweis; ggf. analog zu `filterNative()`)

#### Variante B — Backup-basierte Dokumentation (Erweiterung Phase 5)

- ioBroker-Backups (`backitup`) enthalten `iobroker-objects.json` mit allen Skripten inkl. Quellcode
- AutoDoc könnte Backups **offline** parsen → Doku ohne live laufendes System (z. B. vor Migration, nach Crash, für zweite Instanz)
- Gleiche Discovery/DocumentModel/Renderer-Pipeline, nur andere Datenquelle
- Kombinierbar mit Variante A: KI analysiert Skript-Code direkt aus dem Backup
- **Herausforderungen:** ZIP/tar.gz-Parsing, große JSON-Dateien, Versions-Kompatibilität der Backup-Formate

#### Offene Fragen (noch nicht entschieden)

- Welche Variante (A, B oder beide kombiniert) hat mehr praktischen Nutzen?
- Wie tief soll die Analyse gehen — pro Skript oder nur globale Zusammenfassung?
- Wo wird das Ergebnis angezeigt — neues Kapitel, Ergänzung der bestehenden Skript-Tabelle, oder eigenes Profil?
- Datenschutz-Handling bei Code mit eingebetteten Credentials klar regeln

---

### System-Visitenkarte / „Für Forum kopieren" (Forum-Feedback)

> **Status:** Forum-Wunsch (sigi234) — noch nicht entschieden, zu gegebenem Anlass weiter ausarbeiten.

**Grundgedanke:** Eine kompakte, teilbare System-Kurzübersicht — damit helfende Forum-Nutzer die wichtigsten Systemdaten auf einen Blick sehen, ohne immer nachfragen zu müssen. Die Kerndaten (js-controller-Version, Node.js, RAM, CPU, Instanzen-Anzahl, Repository) sind im Admin-Profil bereits vorhanden, aber als Teil der vollen Doku — kein schnelles Teilen möglich.

**Mögliche Umsetzung:**
- „Für Forum kopieren"-Button im Admin-UI → legt vorgefertigten Textblock in die Zwischenablage
- Alternativ: kompakte eigenständige „System-Card" als separates Mini-HTML / Plaintext-Export
- Inhalt: js-controller, Node.js-Version + LTS-Status, RAM, CPU, Laufzeit, Instanzen-Anzahl, Repository-Kanal
- Kein Extra-Aufwand für den Nutzer — Daten werden ohnehin bereits erfasst

**Offene Fragen:**
- Button im Admin-UI (jsonConfig) oder in der generierten HTML-Seite (oder beides)?
- Plaintext (Forum-freundlich) oder formatierter HTML-Snippet?
- Zusammenhang zu Custom Templates (Ebene 1) prüfen — könnte dort aufgehen

---

### Custom Templates (Phase 5 — Ausarbeitung)

> **Status:** In Phase 5 als Stichpunkt vorhanden — hier konkretisiert, noch nicht priorisiert. Zu gegebenem Anlass weiter ausarbeiten.

Custom Templates kann vieles bedeuten. Sinnvolle Scope-Abgrenzung nach Aufwand und realem Nutzen:

| Ebene | Beschreibung | Aufwand | Empfehlung |
| ----- | ------------ | ------- | ---------- |
| **1 — Kapitel-Auswahl** | Nutzer wählt welche Kapitel erscheinen (Checkboxen), Reihenfolge anpassbar | Gering | ✅ sinnvoll |
| **2 — Layout / Styling** | Eigenes CSS-Theme, Logo, Farben, **Schriftart** (`font-family`), **Hell/Dunkel fest vorgeben oder Auto mit Umschalter**, ggf. **Header-Bild/Logo-URL** — z. B. für Weitergabe an Familie/Hausverwaltung | Mittel | ✅ sinnvoll |
| **3 — Freie Zusatz-Sektionen** | Nutzer definiert eigene Kapitel mit Markdown-Freitext (Notfallkontakte, WLAN, etc.) — Ergänzung zu `manualContext`, aber strukturierter; optional **pro Profil** (`admin` / `user` / `onboarding`) | Mittel | ✅ sinnvoll |
| **4 — Eigene Daten-Abfragen** | Nutzer definiert welche States/Objekte zusätzlich abgefragt werden, eigene Tabellen | Hoch | ⚠️ Grenzwertig |
| **5 — Vollständiges Template-Replacement** | Nutzer liefert eigene Handlebars/Jinja-Vorlage, volle HTML-Kontrolle | Sehr hoch | ❌ Over-Engineering |

**Empfehlung:** Ebene 1 + 3 als Kombination — Kapitel-Auswahl und freie Zusatz-Sektionen. Löst 90% der realen Wünsche ohne Template-Engine. Ebene 4–5 widerspricht dem Kern-Versprechen „automatisch ohne Pflege".

**Verbindung zur System-Visitenkarte:** Ebene 1 (Kapitel-Auswahl) könnte den Forum-Wunsch abdecken — ein fokussiertes Template das nur Kerndaten zeigt.

**Umsetzungsstand (Adapter-Code, laufend erweiterbar):**

- **Ebene 3 (MVP):** JSON `customDocSectionsJson` — Liste `{ title, body[, profiles] }`, Markdown → **alle drei HTML-Profile** + **Markdown-Export**; Nav-Einträge; KI-Owner-Context nennt die Kapitelüberschriften.
- **Ebene 2 (Teil):** `htmlColorScheme` (auto / light / dark), `htmlHeaderLogoUrl` (https oder `/…`), `htmlFontStack`, `htmlExtraCss` — nur **exportiertes HTML**, nicht Markdown.
- **Ebene 1 (Teil):** `adminHiddenChaptersJson` — Kapitel im **Admin-HTML** ausblenden (und im **Markdown**, wenn Dokumentationsprofil Admin); optional **`custom`** für eigene Markdown-Kapitel. Zusätzlich **`userHiddenChaptersJson`** / **`onboardingHiddenChaptersJson`** — Kapitel im **User-** bzw. **Onboarding-HTML** und im passenden **Markdown-Profil**; **keine** freie Reihenfolge (nur an/aus).

**Noch offen (bewusst):** Drag-and-drop-Reihenfolge der Kapitel, vollständiges Theme-Preset ohne rohes CSS, PDF, Ebene 4–5.

---

### Leitplanken (Merksätze)

- Standard-Nutzung muss **ohne** Extra-Pflege **lohnen**.
- Manuelles ist **opt-in**, begrenzt (Länge/Anzahl), und soll **nicht** bei jedem Export ungültig werden, wenn sich nur die Installation ändert.
- **Gemeinsame Datenbasis** für alle drei Profile, **unterschiedliche Darstellung** (sachlich Admin / alltagsnah User / gästetauglich Onboarding).

---

## Architektur-Grenzen & Lösungsrichtungen (Brainstorming / noch nicht entschieden)

> **Status:** Diskutiert im Dev-Meeting 2026-04-15 und in Folge-Sessions. Probleme und Lösungsrichtungen dokumentiert — finale Entscheidung offen.

### Ausgangsproblem: ioBroker-Abhängigkeit

Alles was AutoDoc erzeugt, landet in `/files/autodoc.0/` — ioBrokers **virtueller Dateischicht**. Der Zugriff darauf setzt einen laufenden ioBroker voraus (Web-Adapter oder Admin-UI). Fällt ioBroker aus, ist die Dokumentation nicht mehr erreichbar.

Zusätzliche Dimension: **nicht jeder Nutzer hat einen Web-Adapter** installiert — und das ist bewusst so, denn nicht jeder braucht einen. Mail/Notification ist ebenfalls kein universelles Fallback (nicht jeder hat es integriert oder möchte es nutzen).

### Wie ioBroker Dateien intern speichert

| Backend | `writeFileAsync()` schreibt nach... | Binärdaten (Bilder) |
|---------|-------------------------------------|---------------------|
| **jsonl** (Default) | `iobroker-data/files/` als echte OS-Dateien auf Disk | ⚠️ Disk wächst, jsonl-DB selbst bleibt sauber |
| **redis** | In Redis als binäre Blobs (RAM/Memory) | ❌ Redis bläht bei Bildern massiv auf |

### Der kleinste gemeinsame Nenner: Admin-UI

Der **ioBroker Admin** (Port 8081) ist die einzige Komponente, die **jede Installation** hat — auch Multihost-Raspberry-Pi-Setups ohne Web-Adapter, ohne VIS, ohne NAS. Der Admin:
- Kann Dateien aus `/files/` anzeigen (eingebaut, kein Web-Adapter nötig)
- Kann HTML inline rendern (Datei-Browser)
- Läuft auf praktisch jedem Host

**Konsequenz:** `/files/autodoc.0/` bleibt der primäre Ausgabeort. Admin ist der universelle Viewer. Web-Adapter ist optional, kein Pflichtbestandteil.

### Problem: Bilder und DB-Bloat

Wenn Bilder (Grundrisse, Topologie-Skizzen, Screenshots) in `/files/autodoc.0/` gespeichert werden:
- **jsonl-Backend:** Disk wächst, aber jsonl-DB selbst bleibt sauber — vertretbar bei kleinen Dateien
- **Redis-Backend:** Bilder im RAM/Speicher → inakzeptabel bei echten Fotos oder mehreren Assets

### Saubere Trennung (Lösungsrichtung)

```
/files/autodoc.0/           ← ioBroker-Datenbank (virtual filesystem)
  ├── admin.html             → immer überschrieben bei Regenerierung
  ├── user.html              → immer überschrieben
  ├── onboarding.html        → immer überschrieben
  └── doc.json               → immer überschrieben
                             → KEIN Anwachsen, nur Latest-Stand

Realer Dateisystem-Pfad:    ← AUSSERHALB der ioBroker-Datenbank (opt-in)
  iobroker-data/autodoc-export/
  ├── smarthome.html         → portable, selbst-enthaltende HTML-Kopie
  └── assets/
      └── grundriss.svg      → User-Assets, NICHT in jsonl/redis
```

**Generierter Content** → immer in `/files/`, immer überschrieben, keine Akkumulation, kein Bloat.

**User-Assets (Bilder)** → NICHT in ioBroker-Datenbank, sondern in einem echten Dateisystempfad außerhalb von jsonl/redis (noch zu klären: wer verwaltet diesen Pfad, wie kommt Admin daran?).

### Optionaler Filesystem-Export (ioBroker-unabhängiger Zugriff)

Ein optionaler, konfigurierbarer **realer Ausgabepfad** ermöglicht Zugriff auf die Doku auch wenn ioBroker down ist:

- Nutzer konfiguriert z.B. `/mnt/nas/autodoc/`, `D:\Docs\smarthome\` oder einen lokalen Pfad
- AutoDoc schreibt die fertige HTML **zusätzlich** dorthin (kein Ersetzen der ioBroker-Ausgabe)
- Browser öffnet `smarthome.html` direkt via `file://` — **kein Webserver nötig**
- Wer einen Webserver hat: Pfad ins Webroot → immer online erreichbar
- Wer keinen hat: Pfad auf NAS, lokaler Disk, USB-Mount — direkt per Browser öffenbar
- Wer es nicht braucht: Feld leer lassen

**Voraussetzung:** HTML muss wirklich selbst-enthaltend sein (kein CDN). Aktuell wird `qrcodejs` noch über CDN geladen (mit Fallback) — das wäre zu bereinigen.

### Assets/Bilder: Lösungsoptionen (noch nicht entschieden)

| Option | Beschreibung | DB-Bloat | Admin-Zugriff | Offline |
|--------|-------------|----------|--------------|---------|
| **A — Externe URLs only** | Nutzer referenziert URLs (NAS-HTTP, Cloud, intern) | Null | ✅ wenn erreichbar | ⚠️ nur wenn URL erreichbar |
| **B — SVG/Text in `/files/`** | Nur Text-basierte Grafiken (SVG, Mermaid) in DB; Fotos → externe URL | Minimal (SVG klein) | ✅ via Admin/Web | ✅ SVG immer inline möglich |
| **C — Assets außerhalb DB** | Bilder in realem Filesystem-Pfad; Adapter serviert via eigenem HTTP-Endpunkt | Null in DB | ✅ erfordert Web-Adapter | ✅ wenn Pfad erreichbar |
| **D — Inline Base64** | Bilder direkt in HTML eingebettet | N/A (kein File-Store) | ✅ immer | ✅ immer | ❌ Dateigröße ×3–5 bei Fotos |

**Tendenz:** Option B als Basis (SVG/Mermaid-Diagramme in `/files/`, klein und sauber) + Option A für Fotos (externe URLs, kein Storage-Problem). Option D nur für sehr kleine Icons vertretbar.

**Für Redis-Nutzer:** Explizit dokumentieren: nur externe URLs oder SVGs empfohlen — keine Binär-Uploads in `/files/`.

### Multihost — Analyse & Entscheidungen

In ioBroker-Multihost-Setups (z.B. 2–3 Raspberry Pis):

> Dev-Meeting 2026-04-15: kein definitives Ergebnis zu neuen Ansätzen — die bekannten Probleme wurden bestätigt. Einziger konkreter Vorschlag: **2x generieren** — einmal für den Admin-Aufruf (`/files/`), einmal für direkten Dateisystem-Zugriff. Das deckt sich mit dem hier dokumentierten Dual-Output-Ansatz (→ „Optionaler Filesystem-Export").

#### Was bereits funktioniert (kein Handlungsbedarf)

- `getObjectViewAsync('system', 'host', {})` → liest **alle** Hosts aus der zentralen DB ✅
- `getForeignObjectAsync(host._id)` → holt vollständige native-Daten (Node.js, OS) für **jeden** Host ✅
- `instance.common.host` → welcher Adapter auf welchem Host läuft, bereits in `rawData` ✅
- `getForeignStateAsync('system.host.{hostId}.*')` → RAM/CPU für alle Hosts ✅
- `host.common.npmVersion` aus zentraler DB → npm-Version für alle Hosts, kein Problem ✅
- `writeFileAsync('autodoc.0', ...)` → geht durch ioBrokers zentrales File-API → landet immer auf Master ✅

#### Wo AutoDoc laufen soll: Master

AutoDoc **muss auf dem Master** laufen. Gründe:
- `execSync('npm -v')` als lokaler Fallback läuft nur auf dem eigenen Host — auf Master sinnvoll, auf Slave irreführend
- Realer Filesystem-Export schreibt auf das lokale Filesystem — auf Master gewollt, auf Slave nicht
- Der Master ist der primäre Admin-Zugriffspunkt

**Umsetzung:** Log-Warnung wenn AutoDoc auf einem Host läuft, aber mehrere Hosts im System erkannt werden und der eigene Host nicht der erste/einzige ist. Kein hartes Blockieren — nur informativer Hinweis.

#### Was fehlt: Host-Zugehörigkeit in der Dokumentation

`instance.common.host` ist bereits erfasst, wird aber nicht gerendert. Im Admin-Profil fehlt damit die wichtigste Multihost-Information: welcher Adapter läuft auf welchem Pi.

**Entscheidung: Adapter-Gruppierung nach Host** (statt nur einer Spalte):
- Nur aktiv wenn > 1 Host im System erkannt → kein Layout-Overhead bei Single-Host
- Admin-Profil: Adapter-Tabelle nach Host gruppiert mit Host-Header (Name, Node.js, OS)
- Klare Lastverteilung auf einen Blick: welcher Pi trägt welche Last

```
┌─ Host: raspi-master ──────────────────────────┐
│  admin.0 · javascript.0 · autodoc.0 · ...     │
└───────────────────────────────────────────────┘
┌─ Host: raspi-slave1 ──────────────────────────┐
│  zigbee.0 · hm-rpc.0 · ...                    │
└───────────────────────────────────────────────┘
```

#### Filesystem-Export in Multihost

- AutoDoc läuft auf Master → Export-Pfad auf Master-Filesystem → korrekt
- Empfehlung für Multihost-Nutzer: **NAS-Mount als Export-Pfad** — löst gleichzeitig das ioBroker-Unabhängigkeits-Problem (NAS läuft auch wenn alle Pis down)
- Kein Zwang — wer keinen NAS hat, lässt das Feld leer

#### Mermaid-Topologie (Phase 5+)

Automatisch generierter Topologie-Graph aus vorhandenen Daten — inhaltlich tragfähig da alle Daten (welcher Adapter auf welchem Host) bereits vorhanden. Zurückgestellt für Phase 5.

```
Master → Slave1 (zigbee.0, hm-rpc.0)
       → Slave2 (sonos.0, unifi.0)
```

### Offene Fragen (noch nicht entschieden)

- Wie bekommen User-Assets (Bilder außerhalb DB) ihren Weg in die HTML wenn sie via Admin aufgerufen wird — eigener HTTP-Handler im Adapter? Eigener `/files/`-Subordner mit strikten Größenlimits?
- Wie sieht ein Upload-UI für Assets aus (Admin-Dateimanager reicht? Eigenes Tab?)
- Größenlimit für Assets: welcher Wert ist sinnvoll?
- Soll der Filesystem-Export-Pfad ein Pflichtfeld für bestimmte Setups sein oder immer opt-in?

---

## Bewusst weggelassen

| Feature                                       | Grund                                       |
| --------------------------------------------- | ------------------------------------------- |
| Ungefilterte Groß-Graphen (Skript/State ohne Limit) | Bewusst nicht als „Komplett-Graph“; **Mermaid gestaffelt** siehe [Phase 5.x](TODO.md) (kuratiert → klein & auto) |
| Vollständiges Code-Parsing für Abhängigkeiten | Fehleranfällig, unverhältnismäßiger Aufwand |
| REST-API / Webhooks                           | Wer JSON hat, kann selbst damit arbeiten    |
| Alexa/Google Home Integration                 | Kein Bezug zur Dokumentation                |
| Analytics/Adapter-Popularität                 | Kein Dokumentations-Feature                 |
| Mobile App                                    | Außerhalb des Scope                         |
| Kollaborative Features                        | Außerhalb des Scope                         |

---

## Ausbaustufen Zusammenfassung

| Version    | Inhalt                                                                                                                   | Status     | Anmerkung                                                 |
| ---------- | ------------------------------------------------------------------------------------------------------------------------ | ---------- | --------------------------------------------------------- |
| **v0.x**   | Basis: Adapter-Inventar, Export, Profile, Versionierung                                                                  | ✅ main    | interner Meilenstein                                      |
| **v0.9.x** | RC: drei Profile, Aliase, UX-Akzente, RAM-Summe, Onboarding-Capabilities, Filter, Doku-Score-Erklärung, README (Changelog) | ✅ main/dev | Forum / Custom-URL; vor npm mit Checker abgleichen        |
| **npm/stable** | Erster Eintrag **npm** + **ioBroker.repositories** nach Adapter-Checker grün                                         | ⬜ geplant | Versionsnummer beim Release festlegen (nicht mit RC verwechseln) |
| **v1.x**   | Phase 5: PDF, Backup-Integration, Custom Templates; Phase 5.x: Troubleshooting (Hybrid), Quick Start/Raumguides, Mermaid (gestaffelt)                                                                       | ⬜ geplant | Reihenfolge 5.x: [TODO.md](TODO.md) |
