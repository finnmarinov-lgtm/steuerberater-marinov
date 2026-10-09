# Marinov & Partner Steuerberater – neue Webseite (Vorschau)

Vorschau der neuen Webseite der Kanzlei Marinov & Partner Steuerberater, Dessau-Roßlau.
Die offizielle Seite ist weiterhin <https://www.steuerberater-marinov.de>. Diese Vorschau ist für Suchmaschinen gesperrt (`noindex`).

## Inhalt

- Drei Sprachen: Deutsch (Startseite `index.html`), Englisch (`en/`), Bulgarisch (`bg/`)
- Startbereich: ein Scroll spielt die Kamerafahrt zum Tischglobus ab, danach ist der Globus drehbar; Deutschland und Bulgarien sind anklickbar
- Alle Texte der alten Seite: Kanzlei, Philosophie, Partner, Beratung (Expatriates und Arbeitgeber mit aufklappbaren Einzelleistungen), Freiberufler, Einwanderer, Gebühren, Karriere, Links, Impressum, Datenschutz
- Keine Inhalte von fremden Servern: Schriften (Spectral, Golos Text), three.js, d3, Kartendaten liegen in `assets/`

## Gegenüber der alten Seite geändert

- Impressum: § 5 DDG statt § 5 TMG
- E101 heißt jetzt A1-Bescheinigung
- Links: Steuerberaterkammer Sachsen-Anhalt statt Hessen, Frankfurter Finanzbehörden entfernt
- Telefonnummer in der Datenschutzerklärung an die übrige Seite angeglichen (+49 340 661496-24)
- Tippfehler korrigiert, Gebühren-Beispiel ohne Jahreszahl 2009
- Kein Nachrichten-Kasten (Haufe-Feed) und keine Suche mehr

## Vor der Veröffentlichung prüfen

- Telefonnummer: Die alte Datenschutzerklärung nannte 0340/850769-0 – welche Nummer gilt?
- Datenschutzerklärung an den neuen Hoster anpassen (Server-Logs, keine Cookies mehr)
- Texte der Länderkarten im Globus und die bulgarischen Kurztexte gegenlesen lassen
- Hochformat-Video für Handys, ggf. neues Video mit Start- und Endbild

Gebaut mit `build.py` aus den gesicherten Texten der alten Seite.
