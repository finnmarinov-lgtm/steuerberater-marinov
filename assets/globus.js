// Startbereich der Startseite: ein Scroll spielt die Kamerafahrt zum Tischglobus ab, danach liegt ein drehbarer 3D-Globus
// genau auf der Kugel im letzten Videobild. Land anklicken (oder im Auswahlfeld wählen) → Infokarte.
// Texte und Länderkarten je Sprache stehen in <script type="application/json" id="globus-daten"> (schreibt build.py).
// Lage der Kugel im Video abgleichen: Startseite mit ?abgleich öffnen, dann abgleich.setze(x, y, r) in der Konsole.
import * as THREE from './lib/three.module.min.js';
const { geoEquirectangular, geoPath, geoCentroid, geoDistance, geoContains } = window.d3;
const { feature } = window.topojson;

const DATEN = JSON.parse(document.getElementById('globus-daten').textContent);
const { texte: T, laender: LAENDER, allgemein: ALLGEMEIN } = DATEN;
const SPRACHE = document.documentElement.lang || 'de';
const medien = datei => new URL(`../medien/${datei}?v=${DATEN.version}`, import.meta.url).href;
const bibliothek = datei => new URL(`./lib/${datei}`, import.meta.url).href;

// Laden mit bis zu drei Versuchen (z. B. bei wackliger Verbindung)
const holen = (url, n = 3) => fetch(url).then(r => r.ok ? r : Promise.reject(new Error(r.status)))
  .catch(e => n > 1 ? new Promise(ok => setTimeout(ok, 500)).then(() => holen(url, n - 1)) : Promise.reject(e));

// Lage der Kugel im letzten Bild von medien/fahrt.mp4 (Pixel im Video)
const VIDEO = { b: 1280, h: 734 };
const KUGEL = { x: 852, y: 327, r: 204 };
const ABGLEICH = new URLSearchParams(location.search).has('abgleich');

const buehne = document.getElementById('buehne');
const video = document.getElementById('fahrt');
const leinwand = document.getElementById('globus');
const karte = document.getElementById('infokarte');
const inhalt = document.getElementById('karteninhalt');
const landwahl = document.getElementById('landwahl');
let zustand = 'start';

if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
scrollTo(0, 0);

// ---------- Ablauf: ein Scroll spielt die ganze Fahrt ----------
function setzeZustand(z) {
  zustand = z;
  buehne.className = z;
  document.body.classList.toggle('gesperrt', z !== 'globus');
}
function starteFahrt() {
  if (zustand !== 'start') return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return zumGlobus();
  setzeZustand('fahrt');
  video.playbackRate = 1;
  video.play().catch(zumGlobus);
  requestAnimationFrame(abbremsen);
}
// Letzte Sekunde sanft abbremsen, damit die Kamera nicht hart stehen bleibt
function abbremsen() {
  if (zustand !== 'fahrt') return;
  const rest = video.duration - video.currentTime;
  if (rest < 1) video.playbackRate = Math.max(0.3, rest);
  requestAnimationFrame(abbremsen);
}
function zumGlobus() {
  // Wer die Fahrt gesehen hat, landet bei der Rückkehr in dieser Sitzung direkt beim Globus
  try { sessionStorage.setItem('mp-besucht', '1'); } catch (e) { /* ohne Speicher: Fahrt wird wieder gezeigt */ }
  if (zustand === 'globus') return;
  if (!video.ended) video.pause();
  buehne.style.backgroundImage = `url(${medien('ende.jpg')})`; // Hintergrund = letztes Videobild
  setzeZustand('globus');
  setTimeout(dreheNachEuropa, 1500); // erst drehen, wenn die Überblendung fertig ist
}
video.addEventListener('ended', zumGlobus);
document.getElementById('los').addEventListener('click', starteFahrt);
document.getElementById('ueberspringen').addEventListener('click', zumGlobus);
addEventListener('wheel', e => {
  if (zustand === 'globus') return;
  e.preventDefault();
  if (e.deltaY > 0) starteFahrt();
}, { passive: false });
let touchY = null;
addEventListener('touchstart', e => { touchY = e.touches[0].clientY; }, { passive: true });
addEventListener('touchmove', e => {
  if (zustand === 'globus') return;
  e.preventDefault();
  if (touchY !== null && touchY - e.touches[0].clientY > 20) starteFahrt();
}, { passive: false });
addEventListener('keydown', e => {
  if (zustand !== 'start') return;
  if (['ArrowDown', 'PageDown', ' ', 'Enter'].includes(e.key) && e.target === document.body) { e.preventDefault(); starteFahrt(); }
});
// Mit der Tab-Taste aus dem Startbild in den Inhalt: Fahrt überspringen, sonst bliebe die Seite gesperrt
document.addEventListener('focusin', e => {
  if (zustand === 'start' && !buehne.contains(e.target) && buehne.compareDocumentPosition(e.target) & Node.DOCUMENT_POSITION_FOLLOWING) zumGlobus();
});

// ---------- 3D-Globus ----------
const renderer = new THREE.WebGLRenderer({ canvas: leinwand, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
const szene = new THREE.Scene();
const kamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 1, 4000);
kamera.position.z = 2000; // Strahl für Klicks startet vor dem Globus
szene.add(new THREE.HemisphereLight(0xffffff, 0xb9b4aa, 1.6));
const sonne = new THREE.DirectionalLight(0xffffff, 1.5);
sonne.position.set(-0.6, 0.5, 1);
szene.add(sonne);

const neigung = new THREE.Group();   // Achse wie im Video
const kugelGruppe = new THREE.Group(); // Drehung um die Achse
neigung.add(kugelGruppe);
szene.add(neigung);

const textur = document.createElement('canvas');
textur.width = 4096; textur.height = 2048;
const tctx = textur.getContext('2d');
const tex = new THREE.CanvasTexture(textur);
tex.colorSpace = THREE.SRGBColorSpace;
tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
// zweite, unsichtbare Karte: jedes Land hat eine eigene Farbe = Nummer (schnelles Finden und Hervorheben)
const idKarte = document.createElement('canvas');
idKarte.width = 4096; idKarte.height = 2048;
const ictx = idKarte.getContext('2d', { willReadFrequently: true });
const idTex = new THREE.CanvasTexture(idKarte);
idTex.minFilter = idTex.magFilter = THREE.NearestFilter;
idTex.generateMipmaps = false;
let idDaten = null;
const hoverUniform = { value: -1 };
const material = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.82, metalness: 0 });
material.onBeforeCompile = shader => {
  shader.uniforms.idKarte = { value: idTex };
  shader.uniforms.hoverId = hoverUniform;
  shader.fragmentShader = shader.fragmentShader
    .replace('#include <common>', `#include <common>
      uniform sampler2D idKarte;
      uniform float hoverId;`)
    .replace('#include <map_fragment>', `#include <map_fragment>
      vec4 idc = texture2D(idKarte, vMapUv);
      float landId = floor(idc.r * 255.0 + 0.5) + floor(idc.g * 255.0 + 0.5) * 256.0 - 1.0;
      if (hoverId >= 0.0 && abs(landId - hoverId) < 0.5) diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.36, 0.55, 0.75), 0.45);`);
};
const kugel = new THREE.Mesh(new THREE.SphereGeometry(1, 96, 64), material);
kugelGruppe.add(kugel);

const DEG = Math.PI / 180;

// Achse steht fest wie beim Globus im Video (Stift oben, Stab unten); gedreht wird nur um die Achse
const NEIG = 6;
let lon = 25, neig = NEIG, ziel = null;
neigung.rotation.z = -9 * DEG;

let laender = [];
// Ländernamen in der Seitensprache: Länder-Nummer (wie in den Kartendaten) -> Zweibuchstaben-Code -> Name vom Browser
const namen = new Intl.DisplayNames([SPRACHE], { type: 'region' });
const nummerZuCode = {};
holen(bibliothek('codes.json')).then(r => r.json())
  .then(liste => { for (const [a2, , num] of liste) nummerZuCode[num] = a2; fuelleAuswahl(); }).catch(() => {});
function landName(f) {
  if (LAENDER[f.id]) return LAENDER[f.id].name;
  const a2 = nummerZuCode[f.id];
  try { if (a2) return namen.of(a2); } catch (e) { /* unbekannter Code: Name aus den Kartendaten */ }
  return f.properties.name;
}
// Karte für alle Länder ohne eigene Texte – nur Leistungen, die auf der alten Seite stehen
const allgemein = name => ({ name, unter: ALLGEMEIN.unter.replace('{land}', name), punkte: ALLGEMEIN.punkte, sprache: ALLGEMEIN.sprache });
// Auswahlfeld: erst die Länder mit eigener Karte, dann alle übrigen alphabetisch
function fuelleAuswahl() {
  if (!laender.length) return;
  landwahl.querySelectorAll('optgroup, option[disabled]').forEach(o => o.remove());
  const gruppe = document.createElement('optgroup');
  gruppe.label = T.alle;
  laender.filter(f => f.id && !(f.id in LAENDER)).map(f => [f.id, landName(f)])
    .sort((a, b) => a[1].localeCompare(b[1], SPRACHE))
    .forEach(([id, n]) => { const o = document.createElement('option'); o.value = id; o.textContent = n; gruppe.append(o); });
  landwahl.append(gruppe);
}

let hover = null;
const projektion = geoEquirectangular().scale(4096 / (2 * Math.PI)).translate([2048, 1024]);
const pfad = geoPath(projektion, tctx);
const idPfad = geoPath(projektion, ictx);

function maleTextur() {
  tctx.fillStyle = '#f2f2f0';
  tctx.fillRect(0, 0, 4096, 2048);
  for (const f of laender) {
    const aktiv = f.id in LAENDER || DATEN.hervorheben.includes(f.id);
    tctx.beginPath(); pfad(f);
    tctx.fillStyle = aktiv ? '#2f5d8a' : '#a4a7a9';
    tctx.fill();
    tctx.lineWidth = 1.6; tctx.strokeStyle = '#f7f7f5'; tctx.stroke();
  }
  tex.needsUpdate = true;
  ictx.fillStyle = '#000';
  ictx.fillRect(0, 0, 4096, 2048);
  laender.forEach((f, i) => {
    const n = i + 1;
    ictx.fillStyle = `rgb(${n & 255},${n >> 8},0)`;
    ictx.beginPath(); idPfad(f); ictx.fill();
  });
  idDaten = ictx.getImageData(0, 0, 4096, 2048).data;
  idTex.needsUpdate = true;
}

holen(bibliothek('countries-50m.json'))
  .then(r => r.json())
  .then(topo => { laender = feature(topo, topo.objects.countries).features; maleTextur(); fuelleAuswahl(); });

let lage = { x: 0, y: 0, r: 100 };
// Der Achsstift oben liegt vor der Kugel: aus dem letzten Videobild ausschneiden und über den 3D-Globus legen
const stiftLeinwand = document.getElementById('ringvorne');
const endBild = new Image();
endBild.src = medien('ende.jpg');
endBild.onload = () => anordnen();
function zeichneStift(s, ox, oy) {
  const B = buehne.clientWidth, H = buehne.clientHeight, dpr = Math.min(devicePixelRatio, 2);
  stiftLeinwand.width = B * dpr; stiftLeinwand.height = H * dpr;
  if (!endBild.complete || !endBild.naturalWidth) return;
  const maske = document.createElement('canvas');
  maske.width = endBild.naturalWidth; maske.height = endBild.naturalHeight;
  const m = maske.getContext('2d');
  m.fillRect(KUGEL.x + 19, 84, 28, 42); // Achsstift oben (bis knapp an die Kugel), in Bildpunkten des Videos
  m.globalCompositeOperation = 'source-in';
  m.drawImage(endBild, 0, 0);
  const g = stiftLeinwand.getContext('2d');
  g.setTransform(dpr * s, 0, 0, dpr * s, dpr * ox, dpr * oy);
  g.drawImage(maske, 0, 0);
}
function anordnen() {
  const B = buehne.clientWidth, H = buehne.clientHeight;
  if (!B || !H) return; // unsichtbar (z. B. verstecktes Fenster): Lage behalten
  renderer.setSize(B, H, false);
  kamera.left = -B / 2; kamera.right = B / 2; kamera.top = H / 2; kamera.bottom = -H / 2;
  kamera.updateProjectionMatrix();
  // gleiche Rechnung wie object-fit: cover (+ object-position)
  const s = Math.max(B / VIDEO.b, H / VIDEO.h);
  const posX = parseFloat(getComputedStyle(video).objectPosition) / 100 || 0.5;
  const ox = (B - VIDEO.b * s) * posX, oy = (H - VIDEO.h * s) / 2;
  lage = { x: ox + KUGEL.x * s, y: oy + KUGEL.y * s, r: KUGEL.r * s + 1.5 };
  neigung.position.set(lage.x - B / 2, H / 2 - lage.y, 0);
  neigung.scale.set(lage.r * 0.99, lage.r, lage.r); // Kugel im Video ist minimal schmaler als hoch
  zeichneStift(s, ox, oy);
}
addEventListener('resize', anordnen);
anordnen();

function richte() {
  kugelGruppe.rotation.y = -(90 + lon) * DEG;
  neigung.rotation.x = neig * DEG;
}

function dreheNachEuropa() { if (!ABGLEICH) ziel = { lon: 15, neig: NEIG }; }

// ---------- Ziehen, Zeigen, Anklicken ----------
const strahl = new THREE.Raycaster();
const zeiger = new THREE.Vector2();
let ziehen = null;

function landUnter(e) {
  if (kamera.right === 0) anordnen();
  richte();
  kugel.updateWorldMatrix(true, false); // Lage aktuell halten, auch wenn seit der letzten Drehung kein Bild gezeichnet wurde
  const rect = leinwand.getBoundingClientRect();
  zeiger.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
  strahl.setFromCamera(zeiger, kamera);
  const treffer = strahl.intersectObject(kugel)[0];
  if (!treffer) return null;
  const p = [(treffer.uv.x - 0.5) * 360, (treffer.uv.y - 0.5) * 180];
  const px = Math.min(4095, Math.floor(treffer.uv.x * 4096)), py = Math.min(2047, Math.floor((1 - treffer.uv.y) * 2048));
  const o = (py * 4096 + px) * 4;
  const n = idDaten ? idDaten[o] + idDaten[o + 1] * 256 : 0;
  const f = n > 0 ? laender[n - 1] : null;
  if (f && f.id in LAENDER) return f;
  // kleine Länder großzügig treffen: Nähe zu Deutschland/Bulgarien reicht
  for (const id in LAENDER) {
    const z = laender.find(x => x.id === id);
    if (z && geoDistance(geoCentroid(z), p) < 4.5 * DEG) return z;
  }
  return f || null;
}

const schild = document.getElementById('landname');
function zeigeLandname(f, e) {
  if (!f) { schild.classList.remove('zeigen'); return; }
  const b = buehne.getBoundingClientRect();
  schild.innerHTML = landName(f) + (f.id ? `<small>${T.schild}</small>` : '');
  schild.style.left = (e.clientX - b.left) + 'px';
  schild.style.top = (e.clientY - b.top) + 'px';
  // am rechten Rand das Schild links neben die Maus setzen, damit es nicht abgeschnitten wird
  schild.style.transform = e.clientX - b.left > b.width - 220 ? 'translate(calc(-100% - 14px), -130%)' : '';
  schild.classList.add('zeigen');
}
leinwand.addEventListener('pointerleave', () => schild.classList.remove('zeigen'));
leinwand.addEventListener('pointerdown', e => {
  if (zustand !== 'globus') return;
  schild.classList.remove('zeigen');
  ziehen = { x: e.clientX, y: e.clientY, lon, neig, bewegt: false };
  leinwand.setPointerCapture(e.pointerId);
  ziel = null;
});
leinwand.addEventListener('pointermove', e => {
  if (zustand !== 'globus') return;
  if (ziehen) {
    const dx = e.clientX - ziehen.x, dy = e.clientY - ziehen.y;
    if (!ziehen.bewegt && Math.hypot(dx, dy) < 5) return; // Zittern beim Klicken ignorieren
    ziehen.bewegt = true;
    lon = ziehen.lon - dx / lage.r * 60;
    return;
  }
  const f = landUnter(e);
  const id = f ? f.id : null;
  leinwand.style.cursor = f ? 'pointer' : 'grab';
  zeigeLandname(f, e);
  if (id !== hover) { hover = id; hoverUniform.value = f ? laender.indexOf(f) : -1; }
});
let gezogen = false;
const ziehenEnde = e => { if (ziehen) { gezogen = Math.hypot(e.clientX - ziehen.x, e.clientY - ziehen.y) > 5; ziehen = null; } };
leinwand.addEventListener('pointerup', ziehenEnde);
leinwand.addEventListener('pointercancel', ziehenEnde);
leinwand.addEventListener('click', e => {
  if (zustand !== 'globus') return;
  if (gezogen) { gezogen = false; return; }
  const f = landUnter(e);
  if (f && f.id) zeigeLand(f.id);
});

function zeigeLand(id) {
  const f = laender.find(x => x.id === id);
  const l = LAENDER[id] || allgemein(landName(f));
  if (f) { const [cl] = geoCentroid(f); ziel = { lon: cl, neig: NEIG }; }
  inhalt.innerHTML = `
    <h2>${l.name}</h2>
    <p class="unter">${l.unter}</p>
    <ul>${l.punkte.map(p => `<li>${p}</li>`).join('')}</ul>
    <p class="sprache">${l.sprache}${l.bg ? ` · <span class="bg" lang="bg">${l.bg}</span>` : ''}</p>
    <div class="aktionen">
      <a class="knopf" href="tel:${DATEN.tel}">${T.anrufen}</a>
      <a class="knopf hell" href="mailto:${DATEN.mail}">${T.schreiben}</a>
    </div>`;
  karte.classList.add('offen');
  landwahl.value = id;
}
function schliesseKarte() { karte.classList.remove('offen'); landwahl.value = ''; }
document.getElementById('schliessen').addEventListener('click', () => { schliesseKarte(); landwahl.focus(); });
landwahl.addEventListener('change', () => landwahl.value ? zeigeLand(landwahl.value) : schliesseKarte());
// Im Hochformat liegt die Karte als Blatt über der Seite: beim Wegscrollen von der Bühne schließen
new IntersectionObserver(([e]) => { if (!e.isIntersecting && karte.classList.contains('offen')) schliesseKarte(); }).observe(buehne);
// Esc schließt die Infokarte (Fokus bleibt in der Bühne)
buehne.addEventListener('keydown', e => {
  if (e.key !== 'Escape' || !karte.classList.contains('offen')) return;
  const warDrin = karte.contains(document.activeElement);
  schliesseKarte();
  if (warDrin) landwahl.focus();
});

// ---------- Tastatur am Globus: Pfeiltasten drehen, Eingabetaste zeigt das Land in der Mitte ----------
const meldung = document.getElementById('meldung');
let meldungTimer;
function zeigeMeldung(text) {
  meldung.textContent = text;
  meldung.classList.add('zeigen');
  clearTimeout(meldungTimer);
  meldungTimer = setTimeout(() => meldung.classList.remove('zeigen'), 2600);
}
// Die Tastatur wählt einen Punkt: ←/→ dreht den Globus (Längengrad vorne), ↑/↓ wandert nach Norden/Süden.
// Start bei Europa; das Land am Punkt wird hervorgehoben und angesagt.
let tastBreite = 50, tastLand = null;
const laengeVorne = () => (((ziel ? ziel.lon : lon) + 540) % 360) - 180;
function waehleMitTastatur() {
  const punkt = [laengeVorne(), tastBreite];
  tastLand = laender.find(f => geoContains(f, punkt)) || null;
  hover = tastLand ? tastLand.id : null;
  hoverUniform.value = tastLand ? laender.indexOf(tastLand) : -1;
  if (tastLand) zeigeMeldung(`${landName(tastLand)} – ${T.mitte}`);
}
leinwand.addEventListener('focus', () => { if (zustand === 'globus' && leinwand.matches(':focus-visible')) waehleMitTastatur(); });
leinwand.addEventListener('keydown', e => {
  if (zustand !== 'globus') return;
  const drehen = { ArrowLeft: -10, ArrowRight: 10 }[e.key], wandern = { ArrowUp: 10, ArrowDown: -10 }[e.key];
  if (drehen !== undefined) {
    e.preventDefault();
    ziel = { lon: laengeVorne() + drehen, neig: NEIG };
    waehleMitTastatur();
  } else if (wandern !== undefined) {
    e.preventDefault();
    tastBreite = Math.max(-55, Math.min(75, tastBreite + wandern));
    waehleMitTastatur();
  } else if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    if (!tastLand) waehleMitTastatur();
    if (tastLand && tastLand.id) zeigeLand(tastLand.id);
  }
});

// ---------- Zeichnen ----------
function schleife() {
  if (ziel) {
    const d = ((ziel.lon - lon + 540) % 360) - 180;
    lon += d * 0.035;
    neig += (ziel.neig - neig) * 0.035;
    if (Math.abs(d) < 0.05 && Math.abs(ziel.neig - neig) < 0.05) ziel = null;
  }
  richte();
  renderer.render(szene, kamera);
  requestAnimationFrame(schleife);
}
schleife();

// Prüfzugang (nur auf dem eigenen Rechner): Bildschirmlage eines Landes, Land unter einem Punkt
if (location.hostname === 'localhost' || ABGLEICH) {
  window.__globus = {
    zustand: () => zustand, lage: () => lage, lon: () => lon, laender: () => laender, landUnter, zeigeLand,
    // Bildschirmpunkt (clientX/Y) eines Längen-/Breitengrads auf der Vorderseite der Kugel
    punkt(laenge, breite) {
      const phi = (laenge + 180) * DEG, t = breite * DEG;
      const v = new THREE.Vector3(-Math.cos(phi) * Math.cos(t), Math.sin(t), Math.sin(phi) * Math.cos(t));
      kugel.updateWorldMatrix(true, false);
      kugel.localToWorld(v).project(kamera);
      const r = leinwand.getBoundingClientRect();
      return { x: r.left + (v.x + 1) / 2 * r.width, y: r.top + (1 - v.y) / 2 * r.height, vorne: v.z < 1 };
    },
  };
}

if (ABGLEICH) {
  // Abgleich: letztes Videobild zeigen, Globus halb durchsichtig darüber
  zumGlobus(); ziel = null;
  leinwand.style.transition = 'none';
  leinwand.style.opacity = '0.55';
  window.abgleich = { KUGEL, setze(x, y, r, l, n) { Object.assign(KUGEL, { x, y, r }); if (l != null) lon = l; if (n != null) neig = n; anordnen(); } };
}

// Schon unterwegs gewesen oder „Bewegung reduzieren“ eingestellt? Dann direkt zum Globus statt zur Vogelperspektive
let schonDa = false;
try { schonDa = !!sessionStorage.getItem('mp-besucht'); } catch (e) { /* ohne Speicher: Fahrt wird gezeigt */ }
if ((schonDa || matchMedia('(prefers-reduced-motion: reduce)').matches) && !ABGLEICH) { video.style.display = 'none'; zumGlobus(); }
