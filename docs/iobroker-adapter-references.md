# ioBroker-Adapterentwicklung — Referenzen (adapter-neutral)

Sammlung von **offiziellen Links und typischen Stolpersteinen**, sobald ein Adapter **regelkonform** (Checker, npm, ggf. `ioBroker.repositories`) gehalten werden soll. **Ohne** projektspezifische Paketnamen oder Release-Notizen — die gehören in die jeweilige `CONTRIBUTING.md` / `TODO.md`.

## Offizielle Einstiege

1. **ioBroker AI Developer Guide** — https://github.com/Jey-Cee/iobroker-ai-developer-guide  
2. **Adapter Creator** (Konventionen / Vorlagen) — https://github.com/ioBroker/create-adapter  
3. **Adapter Checker** — https://adapter-check.iobroker.in/  
4. **ioBroker.repositories** (Listen, Einreichung, Coding-Best-Practices) — https://github.com/ioBroker/ioBroker.repositories#development-and-coding-best-practices  

Vor größeren Änderungen an **`io-package.json`**, **Admin-Konfig**, **`package.json`** (Adapter-Felder) oder **Release-Workflow**: diese Quellen mit dem **gehosteten Checker** und den **aktuellen** Regeltexten abgleichen.

## Typische Adapter-Checker-Themen (Kurz)

- **W4001** („nicht in repositories"): **normal**, bis ein PR auf **`sources-dist.json`** gemerged ist — danach sollte die Meldung entfallen.
- **E2004** (`common.news`): nur **Versionen eintragen, die auf npm existieren**; ältere Git-only-Versionen nicht in `news` lassen.
- **E2001**: für die zentrale Liste wird **Maintainer „bluefox"** als npm-Owner erwartet — `npm owner add bluefox <dein-paketname>` (Befehl aus Checker-Doku / Meldung prüfen).
- **E3009 / fehlende Eltern-Objekte**: jeder State braucht ein Eltern-Objekt (`type: "channel"` oder `"device"`). Fehlen diese, meldet der Objekt-Checker beim `ioBroker.repositories`-Review **E3009** — ioBroker selbst läuft trotzdem, der Fehler fällt erst beim formalen Review auf. **Fix:** Channel-Objekte **vor** ihren States in `instanceObjects` (`io-package.json`) eintragen — Channel immer zuerst, dann die States darunter. Referenz-Adapter für das Muster: **telegram**, **backitup**, **dwd**.
- **W5042 / optionale Abhängigkeiten**: manche Pakete (z. B. schwere Browser-Bibliotheken) stehen bewusst unter **`optionalDependencies`**; der lokale Repochecker kann das anders bewerten als der gehostete Checker — **Doppel-Eintrag** unter `dependencies` + `optionalDependencies` vermeiden (oft durch Regeln verboten). Wenn mehrere optionale Pakete dieselbe Peer-Linie teilen (z. B. **`puppeteer`** + **`@mermaid-js/mermaid-cli`**), **Peer-Ranges vor Merge prüfen** und in der eigenen **`CONTRIBUTING.md`** festhalten — sonst wirkt es wie ungelöste Tech-Debt bei **`ioBroker.repositories`**-Review.

Konkrete Meldungen und Projekt-Workarounds immer im **eigenen** Repo (`CONTRIBUTING.md`) festhalten.

## `@alcalzone/release-script` (häufig bei create-adapter)

- **README-Changelog:** Unter **`## Changelog`** die Überschriftzeile exakt ``### **WORK IN PROGRESS**`` stehen lassen (nicht umbenennen oder „schöner" schreiben — sonst schlägt **`check:changelog`** mit z. B. „changelog placeholder is missing" fehl). Darunter die Work-in-progress-Stichpunkte bis zum nächsten Release. Plugins (**z. B.** `@alcalzone/release-script-plugin-changelog`, **`release-script-plugin-iobroker`**) vergleichen diese Zeile **wortgetreu**.
- **`common.news`:** nur **veröffentlichte** npm-Versionen; max. **7** Einträge üblich (Checker / Listen).
- **Branch:** Viele Setups erlauben `npm run release` nur von **`main`** — auf Entwicklungsbranches ggf. `--branchPattern` (siehe Repo-Doku / `package.json`).
- **Publish:** Wenn das Projekt auf release-script ausgelegt ist, nicht nur nacktes `npm publish`, sondern den dokumentierten Release-Befehl nutzen.

## npm / GitHub (optional)

- **npm:** Account, idealerweise **2FA**; Registry `https://registry.npmjs.org/`.
- **GitHub Actions + npm:** „Trusted Publishing" (OIDC) ist Projekt-sache; ohne Einrichtung kann ein Workflow-Schritt scheitern oder übersprungen werden.

## Übersetzungen / i18n

ioBroker erwartet Übersetzungen in allen 10 Sprachen (en, de, ru, pt, nl, fr, it, es, pl, zh-cn). Workflow:

1. **Basis:** `admin/i18n/en.json` als Quelle pflegen.
2. **Maschinell vorübersetzen:** `npm run translate` (`@iobroker/adapter-dev`) übersetzt via Google Translate alle **fehlenden** Keys in die anderen Sprachen. Wichtig: nur fehlende Keys werden ergänzt — vorhandene (auch englisch-identische) werden übersprungen. Sollen alle neu übersetzt werden: Zieldatei vorher leeren oder `--rebuild` nutzen.
3. **Community-Qualität:** Adapter bei [Weblate (weblate.iobroker.net)](https://weblate.iobroker.net) anmelden — dazu Issue in [ioBrokerTranslator/requests](https://github.com/ioBrokerTranslator/requests) erstellen. Voraussetzung: `npm run translate all` laufen lassen und committen, dann GitHub Webhook konfigurieren (Payload URL `https://weblate.iobroker.net/hooks/github/`). Weblate schickt danach automatisch PRs für Übersetzungsverbesserungen.
- **E5606** (identische Übersetzungen): tritt auf wenn Sprachen englische Fallbacks enthalten — `npm run translate` nach dem Leeren der Dateien behebt das.
- **de / fr** (oder andere manuell gepflegte Sprachen): bleiben bei `npm run translate` unverändert, wenn bereits alle Keys vorhanden sind.

## `ioBroker.repositories`

PR auf **`sources-dist.json`** ist der Schritt für Sichtbarkeit in den **Standard-Adapterlisten** — **unabhängig** vom npm-Tarball. Zeitpunkt und Branch-Policy im jeweiligen Projekt abstimmen.

Beim Review wird ein **Objekt-Dump** (`adaptername.0.json`) als **Datei-Anhang** am PR erwartet (nicht als Kommentar-Paste — der Bot verarbeitet nur echte Anhänge). Anleitung: https://github.com/ioBroker/ioBroker.repochecker/blob/master/OBJECTDUMP_de.md

---

*Kopierbar in andere Adapter-Repos; Projektdetails (Paketname, Checker-Ausnahmen, Branch-Workflow) dort ergänzen.*
