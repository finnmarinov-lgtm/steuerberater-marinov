// Zeigt die neuesten Steuer-Meldungen (assets/news.json, täglich aktualisiert) in jeder Liste mit data-news
(function () {
  const listen = document.querySelectorAll('[data-news]');
  if (!listen.length) return;
  const sprache = document.documentElement.lang || 'de';
  const datumFormat = new Intl.DateTimeFormat(sprache, { day: 'numeric', month: 'long', year: 'numeric' });
  for (const liste of listen) {
    fetch(liste.dataset.news).then(r => r.ok ? r.json() : Promise.reject(r.status)).then(daten => {
      if (!daten.meldungen || !daten.meldungen.length) throw new Error('keine Meldungen'); // dann den Hinweis zeigen statt eines leeren Kastens
      liste.textContent = '';
      for (const m of daten.meldungen.slice(0, Number(liste.dataset.anzahl || 6))) {
        const li = document.createElement('li');
        if (m.datum) {
          const zeit = document.createElement('time');
          zeit.dateTime = m.datum;
          zeit.textContent = datumFormat.format(new Date(m.datum + 'T12:00:00'));
          li.append(zeit);
        }
        const a = document.createElement('a');
        a.href = m.link; a.textContent = m.titel; a.target = '_blank'; a.rel = 'noopener';
        li.append(a);
        liste.append(li);
      }
    }).catch(() => { liste.textContent = liste.dataset.fehler || ''; });
  }
})();
