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
})();
