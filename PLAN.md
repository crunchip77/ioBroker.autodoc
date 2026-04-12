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

**Erledigt (ehemals Phase 5-Idee):** QR-Code Onboarding (CDN qrcodejs + Link kopieren).

---

## Zukunftsvision — Zusammenhänge & Kontext (Brainstorming)

> **Status:** Sammelplatte für Ideen — keine feste Roadmap. Soll verhindern, dass Diskussionen (Forum, intern) verloren gehen.

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
- Optional später: **Mermaid** oder **Bilder** nur für diesen Kontext — siehe auch „Bewusst weggelassen“ (Mermaid dort bewusst zurückgestellt; hier **Neuabwägung** möglich).

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

### Leitplanken (Merksätze)

- Standard-Nutzung muss **ohne** Extra-Pflege **lohnen**.
- Manuelles ist **opt-in**, begrenzt (Länge/Anzahl), und soll **nicht** bei jedem Export ungültig werden, wenn sich nur die Installation ändert.
- **Gemeinsame Datenbasis** für alle drei Profile, **unterschiedliche Darstellung** (sachlich Admin / alltagsnah User / gästetauglich Onboarding).

---

## Bewusst weggelassen

| Feature                                       | Grund                                       |
| --------------------------------------------- | ------------------------------------------- |
| Mermaid-Diagramme / Graphen                   | Für v1.0 zurückgestellt (Komplexität); **Neuabwägung** möglich unter „Zukunftsvision — Zusammenhänge & Kontext“ (optional, auto- oder kuratiert) |
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
| **v1.x**   | Phase 5: PDF, Backup-Integration, Custom Templates                                                                       | ⬜ geplant |                                                           |
