# Echte Screenshots für den User-Guide (optional)

Die Dateien **`fig-*.svg`** im Ordner **`assets/`** sind **Schemas** („Drahtgitter“): sie sind **kein** Ersatz für echtes Admin‑UI‑Pixel‑Layout, laden aber ohne persönliche Daten und werden auf GitHub sauber angezeigt.

Willst du **echte Screenshots**, arbeite vorzugsweise mit **neutralen Platzhaltern** oder **Demo-Installation**:

## Aufnahmen

| Dateiname (Empfehlung) | Kurz beschreibbarer Inhalt |
| ----------------------- | ---------------------------- |
| `screen-grundeinstellungen-admin.png` | Tab **Grundeinstellungen**, nur nicht-kritische Felder sichtbar (Projektname z. B. „Demo …“). |
| `screen-meine-dokumentation-admin.png` … `screen-meine-dokumentation-admin-4.png` | Tab **Meine Dokumentation** als **vier** zusammenhängende Screenshots (langer Scroll): Projekt/Gästetexte; Playbook/Mermaid/Auto-Topologie/Notfall; Adapter-/Raum-Notizen; Sichtbarkeit pro Profil. |
| `screen-erweitert-basisurl-admin.png` … `screen-erweitert-basisurl-admin-2.png` | Tab **Erweitert**, **zwei** Teile (Scroll): Grenzen & **States-Modus** & Basis-URL; **Setup-Score**, Dateisystem-Export, **PDF**. Basis-URL/Pfade immer **erfunden** oder geschwärzt. |
| `screen-html-export-pdf-hint-admin.png` … `screen-html-export-pdf-hint-admin-3.png` | Tab **HTML-Export & Zusatzkapitel**, **drei** Teile: Darstellung/PDF-Hinweis; Admin- & User-Kapitel (**JSON**); Onboarding-Kapitel, **eigene Kapitel** (**JSON**), Schrift/CSS-Hinweis. Keine sensiblen Daten in Logo/JSON-Demos. |
| *(optional)* `screen-benachrichtigungen-admin.png` | Tab **Benachrichtigungen** — noch nicht im Repo; Chat‑IDs/Webhooks/API‑Spuren **nie** klartext zeigen. |
| *(optional)* `screen-ki-dokumentation-admin.png` | Tab **KI-Dokumentation** — noch nicht im Repo; **keine** API‑Keys oder Rechnungen sichtbar. |

**Eingebunden im Repo:** die vier Tab‑Serien (**Grundeinstellungen**, **Meine Dokumentation**, **Erweitert**, **HTML‑Export**) in **`README.md`** und **`README.de.md`** (Dateinamen siehe erste vier Tabellenzeilen). Die **optional**‑Zeilen stehen bereit zum Nachziehen für **Benachrichtigungen** / **KI** — gleiche Untersektion wie die anderen Tabs.

- **PNG** oder **WebP**, Breite etwa **920–1280 px**, Dateigröße **< 350 KB**, wo möglich.
- Admin- und AutoDoc-Version in der Bildunterschrift nennen (z. B. „screenshot 2026‑05, Admin ≥ …“).

## Datenschutz

- **Keine** echten Gast-WLANs, **keine** echten Routen IPs, QR-Ziele nur mit **erfundener** Basis-URL oder geschwärzte Bereiche.

## Lange Tabs (Scroll)

Viele Tabs sind höher als ein Bildschirm — **ein Screenshot pro Aussage** reicht (z. B. nur der relevante Bereich). Optional **mehrere Dateien** pro Tab (`…-admin.png`, `…-admin-2.png`, …) und im Markdown nacheinander einbinden (im Repo z. B. **Meine Dokumentation** vier Teile, **Erweitert** zwei, **HTML-Export & Zusatzkapitel** drei). Technischer Footer der Instanz (RAM, Node…) im Guide oft **wegschneiden**.

## SVG-Schemas (`fig-*.svg`)

Die **von Hand** gepflegten Diagramme sind **gültiges XML**: im Text **`&`** nur als **`&amp;`**; keine **Steuerzeichen** aus Word/Clipboard — sonst meldet GitHub z. B. „Invalid image source“ bei der eingebetteten Vorschau.

## Markdown einbinden

In **`README.md`** oder **`README.de.md`** z. B.:

```md
![Grundeinstellungen (Demo)](assets/screen-grundeinstellungen-admin.png)
```

Die bestehenden **SVG-Verweise** kannst du ersetzen oder darunter echte Screenshots ergänzen.
