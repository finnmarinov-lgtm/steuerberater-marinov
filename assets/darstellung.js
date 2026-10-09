// Darstellungs-Einstellungen: Farbschema (dunkel, hell, wie Gerät) und Schriftgröße, im Browser gemerkt
(function () {
  const d = document.documentElement;
  const geraetDunkel = matchMedia('(prefers-color-scheme: dark)');
  const speichern = (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* privates Fenster: nur für diesen Besuch */ } };
  const anwenden = () => {
    const f = d.dataset.wahl || 'dunkel';
    d.dataset.theme = f === 'system' ? (geraetDunkel.matches ? 'dunkel' : 'hell') : f;
  };
  for (const feld of document.querySelectorAll('.darstellung input')) {
    feld.checked = feld.name === 'farbe' ? feld.value === (d.dataset.wahl || 'dunkel') : feld.value === (d.dataset.schrift || 'normal');
    feld.addEventListener('change', () => {
      if (feld.name === 'farbe') { d.dataset.wahl = feld.value; speichern('mp-farbe', feld.value); anwenden(); }
      else { d.dataset.schrift = feld.value; speichern('mp-schrift', feld.value); }
    });
  }
  geraetDunkel.addEventListener('change', anwenden);
  // Feld schließen, wenn daneben geklickt wird
  document.addEventListener('click', e => {
    for (const det of document.querySelectorAll('.darstellung[open], .menue[open]')) if (!det.contains(e.target)) det.open = false;
  });
  // Esc schließt Menü und Darstellungsfeld, der Fokus geht zurück auf den Knopf
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    for (const det of document.querySelectorAll('.darstellung[open], .menue[open]')) {
      const warDrin = det.contains(document.activeElement);
      det.open = false;
      if (warDrin) det.querySelector('summary').focus();
    }
  });
  // Mit der Tab-Taste aus dem offenen Menü hinaus: Menü schließen
  document.addEventListener('focusin', e => {
    for (const det of document.querySelectorAll('.darstellung[open], .menue[open]')) if (!det.contains(e.target)) det.open = false;
  });
})();

// Zufälliges Reisefoto in der Seitenleiste (wie auf der alten Seite)
for (const fig of document.querySelectorAll('[data-reisen]')) {
  const liste = fig.dataset.reisen.split('|').map(e => e.split('~'));
  const [datei, name] = liste[Math.floor(Math.random() * liste.length)];
  const img = fig.querySelector('img');
  img.src = fig.dataset.wurzel + datei; img.alt = name;
  fig.querySelector('figcaption').textContent = name;
}

// Merken, dass jemand auf der Seite unterwegs ist (für die Startseite: dann direkt zum Globus)
if (!document.body.classList.contains('startseite')) { try { sessionStorage.setItem('mp-besucht', '1'); } catch (e) { /* ohne Speicher: Fahrt wird gezeigt */ } }

// Link auf eine einzelne Leistung (#leistung-NN): Zeile aufklappen und hinscrollen
function oeffneZiel() {
  const ziel = location.hash && document.getElementById(decodeURIComponent(location.hash.slice(1)));
  if (ziel && ziel.tagName === 'DETAILS') { ziel.open = true; ziel.scrollIntoView({ block: 'start' }); }
}
oeffneZiel();
addEventListener('hashchange', oeffneZiel);
