# Marinov & Partner Steuerberater – Webseite

Webseite der Kanzlei Marinov & Partner Steuerberater, Dessau-Roßlau: <https://steuerberater-marinov.de>
(veröffentlicht über GitHub Pages aus `main`, eigene Domain über `CNAME`; die frühere Vorschau-Adresse leitet dorthin um).

## Inhalt

- Drei Sprachen: Deutsch (Startseite `index.html`), Englisch (`en/`), Bulgarisch (`bg/`)
- Startbereich: ein Scroll spielt die Kamerafahrt zum Tischglobus ab, danach ist der Globus drehbar; jedes Land ist anklickbar
  (Skript `assets/globus.js`, Texte je Sprache als JSON in der Startseite), zusätzlich Auswahlfeld und Tastaturbedienung
- Alle Texte der alten Seite: Kanzlei, Philosophie, Partner, Beratung (Expatriates und Arbeitgeber mit aufklappbaren Einzelleistungen),
  Freiberufler, Einwanderer, Gebühren, Karriere, Links, Impressum
- Suche über alle Seiten, Steuer-Nachrichten von Haufe (täglich per GitHub Action `tools/news.py` → `assets/news.json`)
- Darstellung: Dunkel (Standard), Hell oder wie Gerät, Schriftgröße normal oder groß
- `404.html` leitet Adressen der alten Seite (`/index.php/…`) auf die neuen Seiten um
- Keine Inhalte von fremden Servern: Schriften (Spectral, Golos Text), three.js, d3, Kartendaten liegen in `assets/`

## Gegenüber der alten Seite geändert

- Impressum: § 5 DDG statt § 5 TMG
- E101 heißt jetzt A1-Bescheinigung
- Links: Steuerberaterkammer Sachsen-Anhalt statt Hessen, Frankfurter Finanzbehörden entfernt
- Telefonnummer überall +49 340 661496-24 (die alte Nummer aus der Datenschutzerklärung ist nicht mehr aktiv)
- Datenschutzerklärung neu geschrieben (GitHub Pages, keine Cookies, lokaler Speicher, Nachrichten); die bulgarische Seite verweist auf EN/DE
- Kein „internationales Netzwerk“ mehr, stattdessen Mandanten in vielen Ländern
- Tippfehler korrigiert, Gebühren-Beispiel ohne Jahreszahl 2009

## Noch offen

- Datenschutzerklärung von einer Fachperson prüfen lassen
- Bulgarische Texte gegenlesen lassen
- Hochformat-Video für Handys (bis dahin Ausschnitt des 16:9-Videos)

Gebaut mit `build.py` aus den gesicherten Texten der alten Seite; geprüft mit `pruefen.py` (Verweise, HTML, Überschriften, Beschriftungen,
Textfehler) und `vollstaendig.py` (alle Zeilen der alten Seite vorhanden).
