// Suche über alle Seiten einer Sprache (Index: assets/suche-<sprache>.json, beim Bauen erzeugt)
(function () {
  const feld = document.getElementById('suchfeld');
  const ziel = document.getElementById('treffer');
  const info = document.getElementById('treffer-info');
  if (!feld || !ziel) return;
  const d = ziel.dataset;
  const q = new URLSearchParams(location.search).get('q') || '';
  feld.value = q;
  const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const klein = s => s.toLocaleLowerCase(document.documentElement.lang);

  fetch(d.index).then(r => r.json()).then(seiten => {
    const begriffe = klein(q).split(/\s+/).filter(b => b.length > 1);
    if (!begriffe.length) { info.textContent = d.leer; return; }
    const treffer = [];
    for (const s of seiten) {
      const titel = klein(s.titel), text = klein(s.text);
      let punkte = 0, alle = true;
      for (const b of begriffe) {
        const n = text.split(b).length - 1 + (titel.includes(b) ? 5 : 0);
        if (!n) { alle = false; break; }
        punkte += n;
      }
      if (alle) treffer.push({ s, punkte });
    }
    treffer.sort((a, b) => b.punkte - a.punkte);
    info.textContent = treffer.length ? d.anzahl.replace('{n}', treffer.length) : d.keine;
    for (const { s } of treffer) {
      const pos = klein(s.text).indexOf(begriffe[0]);
      const von = Math.max(0, pos - 90);
      let auszug = (von ? '… ' : '') + s.text.slice(von, von + 240) + ' …';
      auszug = esc(auszug);
      for (const b of begriffe) {
        auszug = auszug.replace(new RegExp('(' + b.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi'), '<mark>$1</mark>');
      }
      const li = document.createElement('li');
      li.innerHTML = `<a href="${d.wurzel}${s.url}">${esc(s.titel)}</a><p>${auszug}</p>`;
      ziel.append(li);
    }
  });
})();
