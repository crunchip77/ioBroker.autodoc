# ioBroker-Adapterentwicklung — Referenzen (adapter-neutral)

Sammlung von **offiziellen Links und typischen Stolpersteinen**, sobald ein Adapter **regelkonform** (Checker, npm, ggf. `ioBroker.repositories`) gehalten werden soll. **Ohne** projektspezifische Paketnamen oder Release-Notizen — die gehören in die jeweilige `CONTRIBUTING.md` / `TODO.md`.

**Gedächtnisstützen (Pflicht-Abgleich):** Die Links unten sind **keine Volltext-Kopie**, sondern die **maßgeblichen Quellen**, die bei Adapter-Arbeit (Cursor, Review, Release) **aktiv abgeglichen** werden sollen — damit Checker, **ioBroker.repositories**-Review und Konventionen eingehalten bleiben. Bei Widersprüchen gilt der **aktuelle** Text auf der verlinkten Seite.

## Regelkonform entwickeln — Kernquellen

| Quelle | Link | Wofür |
| ------ | ---- | ----- |
| **ioBroker Developer Portal** | https://www.iobroker.dev | Zentraler Einstieg (u. a. gehosteter Adapter Checker, Ökosystem-Doku) |
| **Adapter Checker** (gehostet) | https://adapter-check.iobroker.in/ | Automatische Regelprüfung vor npm / Listen-PR |
| **Coding Best Practices** | https://github.com/ioBroker/ioBroker.repositories#development-and-coding-best-practices | Offizielle Konventionen für Adapter-Code und Metadaten |
| **Adapter Review Checklist** | https://github.com/ioBroker/ioBroker.repositories/blob/master/REVIEW_CHECKLIST.md | Manuelle Review-Matrix für **ioBroker.repositories**-PRs (Tester, README, `io-package.json`, Runtime) |
| **type-detector** | https://github.com/ioBroker/ioBroker.type-detector | State-Rollen, Gerätetypen, Kanäle — Referenz wenn Objekte/Rollen gesetzt oder geprüft werden |

Vor größeren Änderungen an **`io-package.json`**, **Admin-Konfig**, **`package.json`** (Adapter-Felder), **Runtime** (`main.js`, `lib/`) oder **Release-Workflow**: diese Kernquellen mit dem **gehosteten Checker** und den **aktuellen** Regeltexten abgleichen.

## Weitere offizielle Einstiege

1. **ioBroker AI Developer Guide** — https://github.com/Jey-Cee/iobroker-ai-developer-guide  
2. **Adapter Creator** (Konventionen / Vorlagen) — https://github.com/ioBroker/create-adapter  

## Review-Checkliste — Kurzüberblick (Stichpunkte)

Aus **[REVIEW_CHECKLIST.md](https://github.com/ioBroker/ioBroker.repositories/blob/master/REVIEW_CHECKLIST.md)** — bei größeren PRs / vor **repositories**-Einreichung querlesen:

- **Testing:** GitHub Actions aktiv; Paket- und Adapter-Integrationstests grün.  
- **README:** Englische Beschreibung, Changelog, Lizenz; bei Sentry-Nutzung Hinweis oben.  
- **`package.json`:** `adapter-core`; Mindest-**Node.js**-Version auch in README; grob gegen Best Practices fliegen.  
- **`io-package.json`:** `js-controller`-Abhängigkeit; `news`/Namen übersetzt; `native` passt zu Admin (`index_m.html` / `jsonConfig`); Passwörter über `protectedNative` / `encryptedNative`; Web-Settings exakt benannt (`port`, `bind`, `secure`, … — nicht für andere Geräte missbrauchen).  
- **Verzeichnisse:** Widget/`www`/`docs`/`admin` sinnvoll und mit `io-package.json` konsistent.  
- **Adapter-Logik:** Timeouts/Intervalle in `unload` räumen; externe Kommunikation nicht stumpf per `schedule` (Randomisierung bei Scheduled-Adaptern); nur nötige Event-Handler; `strictObjectChecks: false` nur begründet; Objekt-Rollen plausibel; `setObject` vermeiden; `onStateChange`-Ack; Parallelität bei State/Object-Erzeugung; `info.connection` nur wenn Kanal/Objekt definiert.

## State-Rollen / Gerätetypen (`type-detector`)

Wenn der Adapter **Rollen**, **Kanäle** oder **Gerätetypen** setzt oder prüft: **[`@iobroker/type-detector`](https://github.com/ioBroker/ioBroker.type-detector)** als Referenz nutzen (offizielle Rollen-/Typ-Liste, nicht frei erfinden). Für reine Doku-/Utility-Adapter oft weniger relevant — trotzdem bei `common.role` / `setState`-Mustern im Blick behalten.

## Typische Adapter-Checker-Themen (Kurz)

- **W4001** („nicht in repositories“): **normal**, bis ein PR auf **`sources-dist.json`** gemerged ist — danach sollte die Meldung entfallen.  
- **E2004** (`common.news`): nur **Versionen eintragen, die auf npm existieren**; ältere Git-only-Versionen nicht in `news` lassen.  
- **E2001**: für die zentrale Liste wird **Maintainer „bluefox“** als npm-Owner erwartet — `npm owner add bluefox <dein-paketname>` (Befehl aus Checker-Doku / Meldung prüfen).  
- **W5042 / optionale Abhängigkeiten**: manche Pakete (z. B. schwere Browser-Bibliotheken) stehen bewusst unter **`optionalDependencies`**; der lokale Repochecker kann das anders bewerten als der gehostete Checker — **Doppel-Eintrag** unter `dependencies` + `optionalDependencies` vermeiden (oft durch Regeln verboten). Wenn mehrere optionale Pakete dieselbe Peer-Linie teilen (z. B. **`puppeteer`** + **`@mermaid-js/mermaid-cli`**), **Peer-Ranges vor Merge prüfen** und in der eigenen **`CONTRIBUTING.md`** festhalten — sonst wirkt es wie ungelöste Tech-Debt bei **`ioBroker.repositories`**-Review.

Konkrete Meldungen und Projekt-Workarounds immer im **eigenen** Repo (`CONTRIBUTING.md`) festhalten.

## `@alcalzone/release-script` (häufig bei create-adapter)

- **README-Changelog:** Unter **`## Changelog`** die Überschriftzeile exakt ``### **WORK IN PROGRESS**`` stehen lassen (nicht umbenennen oder „schöner“ schreiben — sonst schlägt **`check:changelog`** mit z. B. „changelog placeholder is missing“ fehl). Darunter die Work-in-progress-Stichpunkte bis zum nächsten Release. Plugins (**z. B.** `@alcalzone/release-script-plugin-changelog`, **`release-script-plugin-iobroker`**) vergleichen diese Zeile **wortgetreu**.  
- **`common.news`:** nur **veröffentlichte** npm-Versionen; max. **7** Einträge üblich (Checker / Listen).  
- **Branch:** Viele Setups erlauben `npm run release` nur von **`main`** — auf Entwicklungsbranches ggf. `--branchPattern` (siehe Repo-Doku / `package.json`).  
- **Publish:** Wenn das Projekt auf release-script ausgelegt ist, nicht nur nacktes `npm publish`, sondern den dokumentierten Release-Befehl nutzen.

## npm / GitHub (optional)

- **npm:** Account, idealerweise **2FA**; Registry `https://registry.npmjs.org/`.  
- **GitHub Actions + npm:** „Trusted Publishing“ (OIDC) ist Projekt-sache; ohne Einrichtung kann ein Workflow-Schritt scheitern oder übersprungen werden.

## `ioBroker.repositories`

PR auf **`sources-dist.json`** ist der Schritt für Sichtbarkeit in den **Standard-Adapterlisten** — **unabhängig** vom npm-Tarball. Zeitpunkt und Branch-Policy im jeweiligen Projekt abstimmen.

---

*Kopierbar in andere Adapter-Repos; Projektdetails (Paketname, Checker-Ausnahmen, Branch-Workflow) dort ergänzen.*
