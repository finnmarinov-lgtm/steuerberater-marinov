# Holt die neuesten Steuer-Meldungen aus dem Haufe-Feed (wie auf der alten Seite) und speichert sie als assets/news.json.
# Läuft täglich per GitHub Action, damit Besucher nichts von fremden Servern laden müssen.
import json, os, urllib.request
import xml.etree.ElementTree as ET
from email.utils import parsedate_to_datetime

FEED = 'https://www.haufe.de/xml/rss_129148.xml'
ZIEL = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'assets', 'news.json')

anfrage = urllib.request.Request(FEED, headers={'User-Agent': 'Mozilla/5.0 (Marinov-Webseite News-Abruf)'})
with urllib.request.urlopen(anfrage, timeout=30) as antwort:
    wurzel = ET.fromstring(antwort.read())

meldungen = []
for item in wurzel.iter('item'):
    titel = (item.findtext('title') or '').strip()
    link = (item.findtext('link') or '').strip()
    if not titel or not link.startswith('https://'):
        continue
    try:
        datum = parsedate_to_datetime(item.findtext('pubDate')).date().isoformat()
    except Exception:
        datum = ''
    meldungen.append({'titel': titel, 'link': link, 'datum': datum})
    if len(meldungen) == 8:
        break

neu = json.dumps({'quelle': 'Haufe', 'meldungen': meldungen}, ensure_ascii=False, indent=1)
alt = open(ZIEL, encoding='utf-8').read() if os.path.exists(ZIEL) else ''
if neu != alt:
    open(ZIEL, 'w', encoding='utf-8').write(neu)
    print(f'{len(meldungen)} Meldungen gespeichert')
else:
    print('keine neuen Meldungen')
