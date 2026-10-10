# Holt die neuesten Steuer-Meldungen aus dem Haufe-Feed (wie auf der alten Seite) und speichert sie als assets/news.json.
# Läuft täglich per GitHub Action, damit Besucher nichts von fremden Servern laden müssen.
# Stimmt etwas nicht (Feed leer, umgebaut oder seit Wochen ohne neue Meldung), bricht das Skript mit Fehler ab und lässt
# die bisherige Datei unangetastet – die Action schlägt dann sichtbar fehl und GitHub schickt eine Mail.
import datetime, json, os, sys, time, urllib.request
import xml.etree.ElementTree as ET
from email.utils import parsedate_to_datetime
from urllib.parse import urlparse

FEED = 'https://www.haufe.de/xml/rss_129148.xml'
ZIEL = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'assets', 'news.json')
MINDESTENS = 3        # weniger Meldungen im Feed gelten als Fehler
HOECHSTALTER = 30     # Tage: ist die neueste Meldung älter, stimmt mit dem Feed etwas nicht


def abbruch(grund):
    print(f'FEHLER: {grund} – assets/news.json bleibt unverändert. Feed prüfen: {FEED}')
    sys.exit(1)


def hole_feed():
    anfrage = urllib.request.Request(FEED, headers={'User-Agent': 'Mozilla/5.0 (Marinov-Webseite News-Abruf)'})
    fehler = None
    for versuch in range(3):  # kurze Aussetzer überbrücken
        try:
            with urllib.request.urlopen(anfrage, timeout=30) as antwort:
                return antwort.read()
        except Exception as e:
            fehler = e
            time.sleep(5 * (versuch + 1))
    abbruch(f'Feed nicht erreichbar ({fehler})')


try:
    wurzel = ET.fromstring(hole_feed())
except ET.ParseError as e:
    abbruch(f'Feed ist kein gültiges XML mehr ({e})')

meldungen = []
for item in wurzel.iter('item'):
    titel = (item.findtext('title') or '').strip()
    link = (item.findtext('link') or '').strip()
    # nur echte Haufe-Meldungen mit sicherer Adresse
    if not titel or urlparse(link).scheme != 'https' or not (urlparse(link).hostname or '').endswith('haufe.de'):
        continue
    try:
        datum = parsedate_to_datetime(item.findtext('pubDate')).date().isoformat()
    except Exception:
        datum = ''
    meldungen.append({'titel': titel, 'link': link, 'datum': datum})
    if len(meldungen) == 8:
        break

if len(meldungen) < MINDESTENS:
    abbruch(f'nur {len(meldungen)} brauchbare Meldungen im Feed (Aufbau geändert?)')
daten = sorted(m['datum'] for m in meldungen if m['datum'])
if daten:
    alter = (datetime.date.today() - datetime.date.fromisoformat(daten[-1])).days
    if alter > HOECHSTALTER:
        abbruch(f'neueste Meldung ist {alter} Tage alt (Feed eingestellt oder umgezogen?)')

neu = json.dumps({'quelle': 'Haufe', 'meldungen': meldungen}, ensure_ascii=False, indent=1)
alt = open(ZIEL, encoding='utf-8').read() if os.path.exists(ZIEL) else ''
if neu != alt:
    open(ZIEL, 'w', encoding='utf-8').write(neu)
    print(f'{len(meldungen)} Meldungen gespeichert')
else:
    print('keine neuen Meldungen')
