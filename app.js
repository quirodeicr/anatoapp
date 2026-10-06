/* ============================================================
   Pilates Lab — motor de estudio

   Principios que implementa (ver "Cómo aprende tu cerebro acá"
   en Perfil y el LÉEME para las referencias):
     · Repetición espaciada con modelo de memoria (FSRS-5)
     · Práctica de recuperación con retroalimentación elaborada
     · Reaprendizaje sucesivo: lo fallado vuelve en la misma sesión
     · Andamiaje que se retira: reconocer → producir, según la
       estabilidad de cada recuerdo
     · Intercalado entre unidades
     · Metacognición: predicción y calibración
     · Hipercorrección de errores de alta confianza
     · Gamificación orientada al dominio (sin castigar el error)
   ============================================================ */
'use strict';

/* ---------------- utilidades ---------------- */

const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const pad2 = n => String(n).padStart(2, '0');
/* Fechas en hora LOCAL: con UTC, en América la racha y los repasos
   cambiaban de día a media tarde. */
const fechaLocal = d => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const HOY = () => fechaLocal(new Date());
function sumarDias(f, k) {
  const [y, m, d] = f.split('-').map(Number);
  return fechaLocal(new Date(y, m - 1, d + k));
}
const DIAS = k => sumarDias(HOY(), k);
function diasEntre(a, b) {
  const [y1, m1, d1] = a.split('-').map(Number), [y2, m2, d2] = b.split('-').map(Number);
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 864e5);
}
const esc = s => String(s).replace(/[&<>"']/g, c =>
  ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));

function norm(s) {
  return String(s).toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/\(.*?\)/g, ' ')
    .replace(/[^a-z0-9ñ% ]/g, ' ')
    .replace(/\s+/g, ' ').trim();
}
/* clave: lo esencial de un ítem para reconocerlo al escribirlo */
function clave(item) {
  return norm(String(item).replace(/^\s*\d+\.\s*/, '').split(/[—:(]/)[0]);
}
/* etiqueta: cómo se muestra un ítem en una ficha */
function etiqueta(item) {
  return String(item).replace(/^\s*\d+\.\s*/, '').split(' — ')[0]
    .replace(/\s*\([^)]*\)/g, '').replace(/\s+/g, ' ').trim();
}
/* claveComp: para comparar ítems entre listas (tolera plurales) */
const claveComp = s => norm(etiqueta(s)).replace(/s\b/g, '');

function mezclar(a) {
  a = a.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
const azar = a => a[Math.floor(Math.random() * a.length)];
const tomar = (a, n) => mezclar(a).slice(0, n);
function unicosPor(lista, f) {
  const vistos = new Set();
  return lista.filter(x => { const k = f(x); if (vistos.has(k)) return false; vistos.add(k); return true; });
}
function fmtDias(n) {
  if (n <= 1) return '1 día';
  if (n < 30) return n + ' días';
  if (n < 365) { const m = Math.round(n / 30); return m + (m === 1 ? ' mes' : ' meses'); }
  return 'más de un año';
}
const fmtTiempo = s => s < 60 ? s + ' s' : Math.floor(s / 60) + ' min ' + pad2(s % 60) + ' s';

/* ============================================================
   FSRS-5 — Free Spaced Repetition Scheduler
   Modelo de memoria de tres variables:
     D  dificultad del ítem (1–10)
     S  estabilidad: días hasta que la probabilidad de recordar
        cae al 90 %
     R  recuperabilidad: probabilidad de recordar hoy
   Parámetros por defecto de FSRS-5 (Ye y col.; open-spaced-repetition).
   ============================================================ */

const FSRS = (() => {
  const W = [0.40255, 1.18385, 3.173, 15.69105, 7.1949, 0.5345, 1.4604, 0.0046,
             1.54575, 0.1192, 1.01925, 1.9395, 0.11, 0.29605, 2.2698, 0.2315,
             2.9898, 0.51655, 0.6621];
  const DECAY = -0.5, FACTOR = 19 / 81;
  const lim = d => Math.min(10, Math.max(1, d));
  /* curva del olvido: R(t) con t en días */
  const R = (t, s) => Math.pow(1 + FACTOR * t / s, DECAY);
  /* días hasta que R cae a la retención objetivo */
  const intervalo = (s, r) => s / FACTOR * (Math.pow(r, 1 / DECAY) - 1);
  const s0 = g => W[g - 1];
  const d0 = g => lim(W[4] - Math.exp(W[5] * (g - 1)) + 1);
  const dNext = (d, g) => {
    const dp = d + (-W[6] * (g - 3)) * (10 - d) / 9;          // amortiguación lineal
    return lim(W[7] * d0(4) + (1 - W[7]) * dp);                // reversión a la media
  };
  const sRecall = (d, s, r, g) => s * (Math.exp(W[8]) * (11 - d) * Math.pow(s, -W[9]) *
    (Math.exp(W[10] * (1 - r)) - 1) * (g === 2 ? W[15] : 1) * (g === 4 ? W[16] : 1) + 1);
  const sForget = (d, s, r) => Math.min(s,
    W[11] * Math.pow(d, -W[12]) * (Math.pow(s + 1, W[13]) - 1) * Math.exp(W[14] * (1 - r)));
  /* repaso en el mismo día (reaprendizaje dentro de la sesión) */
  const sShort = (s, g) => s * Math.exp(W[17] * (g - 3 + W[18]));
  return { R, intervalo, s0, d0, dNext, sRecall, sForget, sShort, lim };
})();
const MAX_IVL = 365;

/* ---------------- ítems ---------------- */

const ITEMS = [];
CARDS.forEach(c => ITEMS.push({ id: c.id, tema: c.tema, tipo: c.tipo, ref: c }));
CLOZES.forEach(x => ITEMS.push({ id: x.id, tema: x.tema, tipo: 'cloze', ref: x }));
PARES.forEach(x => ITEMS.push({ id: x.id, tema: x.tema, tipo: 'pares', ref: x }));
CLASIFICACIONES.forEach(x => ITEMS.push({ id: x.id, tema: x.tema, tipo: 'clasif', ref: x }));
SECUENCIAS.forEach(x => ITEMS.push({ id: x.id, tema: x.tema, tipo: 'orden', ref: x }));
if (typeof FOTOS !== 'undefined') FOTOS.forEach(x => ITEMS.push({ id: x.id, tema: x.tema, tipo: 'foto', ref: x }));
if (typeof ANIMS !== 'undefined') ANIMS.forEach(x => ITEMS.push({ id: x.id, tema: x.tema, tipo: 'anim', ref: x }));
const PM = typeof PREMAT !== 'undefined' ? Object.fromEntries(PREMAT.map(e => [e.id, e])) : {};
const imagen = id => (typeof IMGS !== 'undefined' && IMGS[id]) || null;
const ITEM = Object.fromEntries(ITEMS.map(i => [i.id, i]));
const esCard = it => it.tipo === 'simple' || it.tipo === 'lista';
const itemsDeUnidad = u => ITEMS.filter(i => u.temas.includes(i.tema));
const unidadDe = tema => UNIDADES.find(u => u.temas.includes(tema));

/* ---------------- estado y persistencia ---------------- */

/* Se conserva el nombre de la llave para no perder el avance anterior:
   adentro ahora vive el formato v2, y el v1 se migra solo. */
const LLAVE = 'anatoapp.v1';
let S = null;
let ALMACEN_OK = true;

function estadoInicial() {
  return {
    v: 2, creado: HOY(),
    items: {},          // id -> { s, d, last, due, reps, lapses, vistas, aciertos }
    log: {},            // fecha -> { n, bien, xp, metaOk }
    calib: [],          // { pred, real }
    hiper: {}, hiperOk: 0,
    racha: 0, ultimoDia: null, protectores: 0,
    xp: 0, logros: {}, mapa: [],
    sesiones: 0, perfectas: 0, combosMax: 0, totalResp: 0,
    pj: PJ_BASE(),      // personaje y estudio (estudio.js)
    clase: null, clasesOk: 0, claseXpDia: null,   // Armá tu clase (clase.js)
    planes: [],         // Mis sesiones (planes.js): sesiones de Pilates planeadas
    cfg: { retencion: 0.9, meta: 50, sonido: true, sesion: 15,
           musica: true, estiloMusica: 'lofi', volMusica: 0.35, volSonido: 0.8, vibracion: true,
           efectos: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'suaves' : 'completos' }
  };
}

function completar(d) {
  const base = estadoInicial();
  for (const k of Object.keys(base)) if (d[k] === undefined) d[k] = base[k];
  d.cfg = Object.assign(base.cfg, d.cfg || {});
  return d;
}

/* v1 (SM-2: ef, iv) → v2 (FSRS: s, d). El intervalo alcanzado se
   toma como estabilidad y el factor de facilidad se traduce a
   dificultad. Las fechas de repaso se conservan tal cual. */
function migrar(d) {
  if (!d || typeof d !== 'object') return null;
  if (d.v === 2 && d.items) return completar(d);
  if (d.v === 1 && d.cards) {
    const n = estadoInicial();
    n.creado = d.creado || HOY();
    for (const [id, c] of Object.entries(d.cards)) {
      if (!ITEM[id]) continue;
      const s = Math.max(0.5, c.iv || 0.5);
      const due = c.due || HOY();
      n.items[id] = {
        s, d: FSRS.lim(10 - ((c.ef || 2.5) - 1.3) * 5),
        last: c.iv ? sumarDias(due, -c.iv) : due, due,
        reps: c.rep || 0, lapses: c.lapses || 0, vistas: c.vistas || 0, aciertos: c.aciertos || 0
      };
    }
    for (const [f, e] of Object.entries(d.log || {})) {
      n.log[f] = { n: e.n || 0, bien: e.bien || 0, xp: (e.n || 0) * 8 };
      n.xp += n.log[f].xp;
    }
    n.totalResp = Object.values(n.log).reduce((a, e) => a + e.n, 0);
    n.racha = d.racha || 0; n.ultimoDia = d.ultimoDia || null;
    n.calib = Array.isArray(d.calib) ? d.calib : [];
    return n;
  }
  return null;
}

function probarAlmacen() {
  try {
    localStorage.setItem('__anatoapp_test', '1');
    localStorage.removeItem('__anatoapp_test');
    return true;
  } catch (e) { return false; }
}

/* Progreso incrustado en el propio archivo (copias generadas por la app). */
function estadoIncrustado() {
  const slot = document.getElementById('estado-inicial');
  if (!slot || !slot.textContent.trim()) return null;
  try { return migrar(JSON.parse(slot.textContent)); } catch (e) { return null; }
}

function cargar() {
  let guardado = null;
  try {
    const raw = localStorage.getItem(LLAVE);
    guardado = raw ? migrar(JSON.parse(raw)) : null;
  } catch (e) { guardado = null; }
  /* El avance vivo de este navegador manda; el del archivo solo se
     adopta si acá todavía no hay nada. */
  S = guardado || estadoIncrustado() || estadoInicial();
  return S;
}

let guardarPend = null;
function guardar() {
  clearTimeout(guardarPend);
  guardarPend = setTimeout(() => {
    try { localStorage.setItem(LLAVE, JSON.stringify(S)); }
    catch (e) { avisoAlmacen(); }
  }, 120);
}

/* ---------------- memoria ---------------- */

/* probabilidad estimada de recordar el ítem HOY (null si nunca se vio) */
function memoria(id) {
  const f = S.items[id];
  if (!f) return null;
  return FSRS.R(Math.max(0, diasEntre(f.last, HOY())), f.s);
}
const vencidos = () => { const h = HOY(); return ITEMS.filter(i => S.items[i.id] && S.items[i.id].due <= h); };
const porMemoria = (a, b) => (memoria(a.id) ?? 1) - (memoria(b.id) ?? 1);

function siguienteEstado(f, g, hoy) {
  /* Primera exposición. Los formatos autocorregidos nunca llegan acá con
     "fácil" (ver notaAuto); en una flashcard sí vale: puede que ya lo supieras. */
  if (!f) return { s: FSRS.s0(g), d: FSRS.d0(g), g };
  const t = Math.max(0, diasEntre(f.last, hoy));
  const r = FSRS.R(t, f.s);
  const s = t === 0 ? FSRS.sShort(f.s, g)
          : g === 1 ? FSRS.sForget(f.d, f.s, r)
          : FSRS.sRecall(f.d, f.s, r, g);
  return { s: Math.max(0.1, Math.min(s, 36500)), d: FSRS.dNext(f.d, g), g };
}

function diasIntervalo(s, fuzz) {
  let i = FSRS.intervalo(s, S.cfg.retencion);
  if (fuzz && i >= 3) i *= 0.95 + Math.random() * 0.1;   // evita que todo venza el mismo día
  return Math.max(1, Math.min(MAX_IVL, Math.round(i)));
}

/* g: 1 otra vez · 2 difícil · 3 bien · 4 fácil */
function registrarRepaso(id, g) {
  const hoy = HOY(), prev = S.items[id];
  const n = siguienteEstado(prev, g, hoy);
  const f = S.items[id] = prev || { reps: 0, lapses: 0, vistas: 0, aciertos: 0 };
  f.s = n.s; f.d = n.d; f.last = hoy;
  f.reps++; f.vistas++;
  if (n.g >= 3) f.aciertos++;
  if (prev && n.g === 1) f.lapses++;
  const ivl = n.g === 1 ? 0 : diasIntervalo(f.s, true);
  f.due = ivl ? sumarDias(hoy, ivl) : hoy;
  return { ivl, nota: n.g };
}

function previa(id, g) {
  const n = siguienteEstado(S.items[id], g, HOY());
  return n.g === 1 ? 0 : diasIntervalo(n.s, false);
}

function recalcularVencimientos() {
  for (const f of Object.values(S.items)) {
    if (!f.last || f.due <= f.last) continue;   // lo fallado sigue para hoy
    f.due = sumarDias(f.last, diasIntervalo(f.s, false));
  }
}

function calibracion() {
  const c = S.calib.slice(-60);
  if (c.length < 5) return null;
  const ok = c.filter(x => x.pred === x.real).length;
  return { n: c.length, acierto: ok / c.length,
    exceso: c.filter(x => x.pred && !x.real).length,
    defecto: c.filter(x => !x.pred && x.real).length };
}

function infoUnidad(u) {
  const its = itemsDeUnidad(u), h = HOY();
  const fs = its.map(i => S.items[i.id]);
  const vistos = its.filter(i => S.items[i.id]);
  const intro = vistos.length;
  const mem = intro ? vistos.reduce((a, i) => a + memoria(i.id), 0) / intro : null;
  let est = 0;
  if (intro === its.length) est = fs.every(f => f.s >= 30) ? 3 : fs.every(f => f.s >= 7) ? 2 : 1;
  return { total: its.length, intro, mem, est, venc: vistos.filter(i => S.items[i.id].due <= h).length };
}

/* ---------------- gamificación ---------------- */

const NIVELES = ['Célula', 'Tejido', 'Fibra', 'Fascículo', 'Músculo', 'Articulación',
                 'Cadena', 'Sistema', 'Organismo', 'Maestría del movimiento'];
const nivelDe = xp => Math.floor((1 + Math.sqrt(1 + xp / 15)) / 2);
const xpNivel = n => 60 * (n - 1) * n;
const nombreNivel = n => n <= NIVELES.length ? NIVELES[n - 1] : `${NIVELES[NIVELES.length - 1]} ${n - NIVELES.length + 1}`;

function logHoy() {
  const h = HOY();
  return S.log[h] = S.log[h] || { n: 0, bien: 0, xp: 0 };
}
function ganarXP(n) {
  if (!n) return;
  S.xp += n;
  const e = logHoy();
  e.xp = (e.xp || 0) + n;
  if (!e.metaOk && e.xp >= S.cfg.meta) e.metaOk = true;
}

/* La racha cuenta días con al menos un ejercicio. Cada 7 días se gana
   un protector (máx. 2) que cubre un día perdido: la meta es el hábito,
   no la ansiedad por no romperla. */
function actualizarRacha() {
  const hoy = HOY();
  if (S.ultimoDia === hoy) return;
  if (!S.ultimoDia) S.racha = 1;
  else {
    const gap = diasEntre(S.ultimoDia, hoy);
    if (gap === 1) S.racha++;
    else if (gap > 1 && S.racha > 0 && S.protectores >= gap - 1) {
      S.protectores -= gap - 1; S.racha++;
      toast(`🛡️ Usaste ${gap - 1 === 1 ? 'un protector' : (gap - 1) + ' protectores'}: tu racha sigue viva`);
    } else S.racha = 1;
  }
  if (S.racha % 7 === 0 && S.protectores < 2) {
    S.protectores++;
    toast('🛡️ Ganaste un protector de racha');
  }
  S.ultimoDia = hoy;
}
function rachaVigente() {
  if (!S.ultimoDia) return 0;
  const gap = diasEntre(S.ultimoDia, HOY());
  if (gap <= 1) return S.racha;
  return S.protectores >= gap - 1 ? S.racha : 0;
}

function revisarLogros() {
  const c = calibracion();
  const cond = {
    primer_paso:     () => S.sesiones >= 1,
    racha_3:         () => S.racha >= 3,
    racha_7:         () => S.racha >= 7,
    racha_30:        () => S.racha >= 30,
    meta_5:          () => Object.values(S.log).filter(e => e.metaOk).length >= 5,
    perfecta:        () => S.perfectas >= 1,
    combo_10:        () => S.combosMax >= 10,
    resp_100:        () => S.totalResp >= 100,
    resp_500:        () => S.totalResp >= 500,
    hipercorreccion: () => S.hiperOk >= 1,
    calibrado:       () => c && S.calib.length >= 20 && c.acierto >= 0.8,
    unidad_3:        () => UNIDADES.some(u => infoUnidad(u).est === 3),
    todo_visto:      () => ITEMS.every(i => S.items[i.id]),
    mapa:            () => REGIONES.every(r => S.mapa.includes(r.id)),
    nivel_5:         () => nivelDe(S.xp) >= 5
  };
  const nuevos = [];
  for (const l of LOGROS) {
    if (S.logros[l.id] || !cond[l.id] || !cond[l.id]()) continue;
    S.logros[l.id] = HOY();
    nuevos.push(l.id);
  }
  return nuevos;
}
function anunciarLogros(ids) {
  ids.forEach((id, i) => {
    const l = LOGROS.find(x => x.id === id);
    if (l) setTimeout(() => { toast(`${l.ico} Logro: <b>${esc(l.nom)}</b>`, 'toast-logro'); SND.logro(); }, i * 900);
  });
}

/* Sonidos, música y efectos visuales: efectos.js */

function toast(html, clase = '') {
  const t = document.createElement('div');
  t.className = 'toast ' + clase;
  t.setAttribute('role', 'status');
  t.innerHTML = html;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2800);
}

function avisoAlmacen(msg) {
  if ($('#aviso-storage')) return;
  const d = document.createElement('div');
  d.id = 'aviso-storage';
  d.className = 'aviso';
  d.innerHTML = (msg || 'No se pudo guardar el progreso en este navegador.') +
    ' <button type="button" id="cerrar-aviso" aria-label="Cerrar">✕</button>';
  document.body.appendChild(d);
  $('#cerrar-aviso').onclick = () => d.remove();
}
function avisoOk(msg, ms) {
  const previo = $('#aviso-ok');
  if (previo) previo.remove();
  const d = document.createElement('div');
  d.id = 'aviso-ok';
  d.className = 'aviso ok';
  d.innerHTML = msg + ' <button type="button" id="cerrar-ok" aria-label="Cerrar">✕</button>';
  document.body.appendChild(d);
  $('#cerrar-ok').onclick = () => d.remove();
  setTimeout(() => { if (d.isConnected) d.remove(); }, ms || 9000);
}

/* Diálogos propios: confirm() puede estar bloqueado dentro de visores. */
function abrirModal(html) {
  cerrarModal();
  const m = document.createElement('div');
  m.className = 'modal';
  m.innerHTML = `<div class="modal-in" role="dialog" aria-modal="true">${html}</div>`;
  m.addEventListener('click', e => { if (e.target === m) cerrarModal(); });
  document.body.appendChild(m);
  SND.abrir();
  return m;
}
const cerrarModal = () => $$('.modal').forEach(m => m.remove());
function confirmar(msg, si = 'Sí', no = 'Cancelar') {
  return new Promise(res => {
    const m = abrirModal(`<p class="modal-msg">${msg}</p>
      <div class="fila2"><button type="button" class="btn3d gris" data-r="0">${no}</button>
      <button type="button" class="btn3d rojo" data-r="1">${si}</button></div>`);
    $$('[data-r]', m).forEach(b => b.onclick = () => { cerrarModal(); res(b.dataset.r === '1'); });
  });
}

/* ============================================================
   MOTOR DE FICHAS — tocar o arrastrar (mouse, dedo o teclado)
   ============================================================ */

function crearFicha(t, id, datos = {}) {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'ficha';
  b.textContent = t;
  b.dataset.f = id;
  for (const [k, v] of Object.entries(datos)) b.dataset[k] = v;
  return b;
}
/* Cada ficha tiene un lugar fijo en el banco: al salir deja un hueco
   del mismo tamaño, para que el resto no salte de lugar. */
function llenarBanco(banco, fichas) {
  for (const f of fichas) {
    const s = document.createElement('span');
    s.className = 'slot';
    s.dataset.slot = f.dataset.f;
    s.appendChild(f);
    banco.appendChild(s);
  }
}
const enCasa = f => !!f.parentElement && f.parentElement.classList.contains('slot');
function sacarDeCasa(f) {
  if (!enCasa(f)) return;
  const ph = document.createElement('span');
  ph.className = 'ficha ph';
  ph.textContent = f.textContent;
  ph.setAttribute('aria-hidden', 'true');
  f.parentElement.replaceChild(ph, f);
}
function aCasa(f, raiz) {
  if (enCasa(f)) return;
  const slot = $(`.slot[data-slot="${f.dataset.f}"]`, raiz);
  if (!slot) return;
  const ph = $('.ph', slot);
  if (ph) slot.replaceChild(f, ph); else slot.appendChild(f);
  aterriza(f);
}
function moverA(f, zona, idx) {
  sacarDeCasa(f);
  const hijos = [...zona.children].filter(h => h.classList.contains('ficha') && !h.classList.contains('ph') && h !== f);
  if (idx == null || idx >= hijos.length) zona.appendChild(f);
  else zona.insertBefore(f, hijos[idx]);
  aterriza(f);
}
/* rebote breve al caer una ficha en su lugar */
function aterriza(f) {
  f.classList.remove('aterriza'); void f.offsetWidth; f.classList.add('aterriza');
  setTimeout(() => f.classList.remove('aterriza'), 320);
}
function zonaBajo(x, y, raiz) {
  const el = document.elementFromPoint(x, y);
  const z = el && el.closest('[data-zona]');
  return z && raiz.contains(z) ? z : null;
}
function indiceEn(zona, x, y, excluir) {
  const hijos = [...zona.children].filter(h => h.classList.contains('ficha') && !h.classList.contains('ph') && h !== excluir);
  for (let i = 0; i < hijos.length; i++) {
    const r = hijos[i].getBoundingClientRect();
    if (y < r.top) return i;
    if (y <= r.bottom && x < r.left + r.width / 2) return i;
  }
  return hijos.length;
}

function motorFichas(raiz, { alTocar, alSoltar, alCambiar = () => {} }) {
  let a = null;
  const limpiar = () => {
    if (!a) return;
    if (a.sobre) a.sobre.classList.remove('sobre');
    if (a.fantasma) a.fantasma.remove();
    a.f.classList.remove('arrastrando');
  };
  raiz.addEventListener('pointerdown', e => {
    const f = e.target.closest('.ficha');
    if (!f || f.classList.contains('ph') || f.classList.contains('bloq') || !raiz.contains(f)) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    a = { f, x0: e.clientX, y0: e.clientY, id: e.pointerId, activo: false, fantasma: null, sobre: null };
    try { f.setPointerCapture(e.pointerId); } catch (_) {}
  });
  raiz.addEventListener('pointermove', e => {
    if (!a || e.pointerId !== a.id) return;
    if (!a.activo) {
      if (Math.hypot(e.clientX - a.x0, e.clientY - a.y0) < 8) return;
      a.activo = true;
      const r = a.f.getBoundingClientRect();
      a.dx = a.x0 - r.left; a.dy = a.y0 - r.top;
      const g = a.f.cloneNode(true);
      g.classList.add('fantasma'); g.classList.remove('sel');
      g.style.width = r.width + 'px';
      document.body.appendChild(g);
      a.fantasma = g;
      a.f.classList.add('arrastrando');
      SND.agarrar();
    }
    a.fantasma.style.transform = `translate(${e.clientX - a.dx}px, ${e.clientY - a.dy}px)`;
    const z = zonaBajo(e.clientX, e.clientY, raiz);
    if (z !== a.sobre) {
      if (a.sobre) a.sobre.classList.remove('sobre');
      if (z) z.classList.add('sobre');
      a.sobre = z;
    }
  });
  const terminar = (e, cancelado) => {
    if (!a || e.pointerId !== a.id) return;
    const { f, activo } = a;
    limpiar();
    a = null;
    if (cancelado) return;
    if (!activo) alTocar(f);
    else {
      const z = zonaBajo(e.clientX, e.clientY, raiz);
      if (z) { alSoltar(f, z, indiceEn(z, e.clientX, e.clientY, f)); SND.soltar(); }
    }
    alCambiar();
  };
  raiz.addEventListener('pointerup', e => terminar(e, false));
  raiz.addEventListener('pointercancel', e => terminar(e, true));
  raiz.addEventListener('keydown', e => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const f = e.target.closest && e.target.closest('.ficha');
    if (!f || f.classList.contains('ph') || f.classList.contains('bloq')) return;
    e.preventDefault(); e.stopPropagation();
    alTocar(f); alCambiar();
  });
}

/* ============================================================
   EJERCICIOS
   Cada constructor devuelve:
     consigna, pregunta, el, n
     listo()        ¿se puede comprobar?
     comprobar()    → { p (0–1), sol, n, reconocimiento? }
     solucion()     html con la respuesta correcta
     bloquear()
     autoResolver(bien)   solo para pruebas automáticas
   y opcionalmente: auto (termina solo), manual (se autocalifica),
   tecla(k), enfocar().
   ============================================================ */

/* --- formato según el momento del aprendizaje ---
   Al principio: reconocer (elegir, seleccionar fichas).
   Cuando el recuerdo ya es estable (S ≥ 4 días): producir
   (flashcard, escribir). Es el andamiaje que se retira. */
function aptoBanco(c) {
  return !c.sinBanco && c.a.length >= 2 && !c.a.some(x => /^[^:]{2,24}:\s/.test(x));
}
function formatoPara(it, reintento) {
  const f = S.items[it.id];
  const joven = !f || f.s < 4 || reintento;
  if (it.tipo === 'simple') return joven ? 'opcion' : 'flash';
  if (it.tipo === 'lista') return aptoBanco(it.ref) ? (joven ? 'banco' : 'escribir') : (joven ? 'flash' : 'escribir');
  return it.tipo;
}
function construir(it, fmt, joven) {
  const f = { opcion: ejOpcion, flash: ejFlash, banco: ejBanco, escribir: ejEscribir, orden: ejOrden,
              pares: ejPares, clasif: ejClasif, cloze: ejCloze, gen: ejGen, foto: ejFoto,
              quiz: ejQuiz, anim: ejAnim }[fmt];
  const ej = f(it, joven);
  if (!ej.cambio) ej.cambio = () => {};
  return ej;
}

/* --- distractores --- */
function distractoresSimple(c, n, prohib) {
  const out = [];
  const add = arr => {
    for (const x of mezclar(arr)) {
      if (out.length >= n) return;
      const k = norm(x);
      if (!prohib.has(k)) { prohib.add(k); out.push(x); }
    }
  };
  const otras = CARDS.filter(o => o.tipo === 'simple' && o.id !== c.id);
  add(otras.filter(o => o.tema === c.tema).map(o => o.a[0]));
  add(otras.filter(o => TEMAS[o.tema].color === TEMAS[c.tema].color).map(o => o.a[0]));
  add(otras.map(o => o.a[0]));
  return out;
}
function distractoresLista(c, n) {
  const prohibidas = new Set([...c.a, ...(c.noDist || [])].map(claveComp));
  const out = [];
  const agregar = lista => {
    for (const t of mezclar(lista)) {
      if (out.length >= n) return;
      const e = etiqueta(t);
      if (!e || /:/.test(e) || e.length > 44) continue;
      const k = claveComp(e);
      if (!k || prohibidas.has(k)) continue;
      prohibidas.add(k);
      out.push(e);
    }
  };
  /* Los distractores escritos a mano ya son del mismo tipo que la respuesta:
     si alcanzan, no se completa con otras listas (daba mezclas obvias, como
     tipos de respiración entre músculos). */
  if (c.dist) agregar(c.dist);
  if (c.distPool === 'repertorio') agregar(REPERTORIO.map(r => r.n));
  else if (c.distPool === 'osteoNo') agregar(REPERTORIO.filter(r => r.osteo === 'no').map(r => r.n));
  else if (!c.dist || out.length < n) {
    /* Donantes: otras listas del mismo tema (sin las de ejercicios, que
       darían distractores obvios). Solo si la tarjeta no trae distractores
       propios se recurre a temas afines. */
    const listas = CARDS.filter(o => o.tipo === 'lista' && o.id !== c.id && aptoBanco(o) && !o.distPool && !o.noDonar);
    agregar(listas.filter(o => o.tema === c.tema).flatMap(o => o.a));
    if (!c.dist) agregar(listas.filter(o => o.tema !== c.tema && TEMAS[o.tema].color === TEMAS[c.tema].color).flatMap(o => o.a));
  }
  return out;
}

/* --- opción múltiple --- */
function opcionesUI({ consigna, pregunta, contexto, opciones, correcta, reconocimiento, explica, foto }) {
  const el = document.createElement('div');
  el.innerHTML = `${foto ? `<figure class="foto-ej"><img src="${foto}" alt="Ejercicio a reconocer"></figure>` : ''}
    ${contexto ? `<p class="ctx">${esc(contexto)}</p>` : ''}
    <div class="ops">${opciones.map((o, i) => `<button type="button" class="op" data-i="${i}">
      <span class="op-k">${i + 1}</span><span class="op-t">${esc(o)}</span></button>`).join('')}</div>`;
  const botones = $$('.op', el);
  let sel = null;
  const ej = {
    consigna, pregunta, el, n: 1,
    listo: () => sel !== null,
    tecla(k) { const b = botones[parseInt(k, 10) - 1]; if (b && !b.disabled) b.click(); },
    bloquear() { botones.forEach((b, i) => { b.disabled = true; if (opciones[i] === correcta) b.classList.add('bien'); }); },
    solucion: () => `<p class="sol-t">${esc(correcta)}</p>`,
    comprobar() {
      const ok = opciones[sel] === correcta;
      ej.bloquear();
      if (!ok) botones[sel].classList.add('mal');
      return { p: ok ? 1 : 0, n: 1, reconocimiento, explica, sol: ok ? '' : ej.solucion() };
    },
    autoResolver(bien = true) {
      botones[bien ? opciones.indexOf(correcta) : opciones.findIndex(o => o !== correcta)].click();
    }
  };
  botones.forEach(b => b.onclick = () => {
    sel = +b.dataset.i;
    botones.forEach(x => x.classList.toggle('sel', x === b));
    SND.toque(); ej.cambio();
  });
  return ej;
}

/* Si la tarjeta trae `op`, se usa esa versión corta de la respuesta: la
   completa suele ser mucho más larga que los distractores, y la longitud
   delata la opción correcta sin necesidad de saber. */
function ejOpcion(it) {
  const c = it.ref, correcta = c.op || c.a[0];
  const prohib = new Set([norm(correcta)]);
  let dist = [];
  if (c.dist) dist = tomar(c.dist, 3).filter(d => { const k = norm(d); if (prohib.has(k)) return false; prohib.add(k); return true; });
  if (dist.length < 3) dist.push(...distractoresSimple(c, 3 - dist.length, prohib));
  return opcionesUI({ consigna: 'Elegí la respuesta correcta', pregunta: esc(c.q),
    opciones: mezclar([correcta, ...dist]), correcta, reconocimiento: true,
    explica: c.op && !c.porque ? c.a[0] : undefined });
}

/* --- generados (práctica libre) --- */
function qIntruso() {
  const listas = CARDS.filter(c => c.tipo === 'lista' && aptoBanco(c) && unicosPor(c.a.map(etiqueta), claveComp).length >= 3);
  for (let k = 0; k < 25; k++) {
    const c = azar(listas);
    const intr = distractoresLista(c, 1)[0];
    if (!intr) continue;
    const propios = tomar(unicosPor(c.a.map(etiqueta), claveComp), 3);
    const ops = mezclar([...propios, intr]);
    return { enunciado: '¿Cuál <b>NO</b> pertenece al grupo?', contexto: c.q, opciones: ops, correcta: intr,
      explica: `Según tus apuntes, el grupo es: ${c.a.map(etiqueta).join(' · ')}.` };
  }
}
function qSemaforo() {
  const e = azar(REPERTORIO.filter(x => x.osteo));
  const mapa = { si: 'Sí se puede', no: 'No: contraindicado', mod: 'Solo modificado' };
  return {
    enunciado: `Cliente con <b>osteoporosis</b>: ¿<i>${esc(e.n)}</i>?`,
    opciones: ['Sí se puede', 'No: contraindicado', 'Solo modificado'],
    correcta: mapa[e.osteo],
    explica: e.osteo === 'no'
      ? 'Implica flexión de columna: concentra la carga en la parte anterior del cuerpo vertebral, justo donde el hueso osteoporótico colapsa.'
      : e.osteo === 'si'
      ? 'No carga la columna en flexión. Y por la ley de Wolff conviene cargar: el hueso se fortalece ante el estrés.'
      : 'Está en la lista de tus apuntes, pero admitido con modificación.'
  };
}
function ejGen(it) {
  const q = it.gen === 'semaforo' ? qSemaforo() : qIntruso();
  return opcionesUI({ consigna: it.gen === 'semaforo' ? 'Semáforo' : 'Encontrá el intruso', pregunta: q.enunciado,
    contexto: q.contexto, opciones: q.opciones, correcta: q.correcta, reconocimiento: true, explica: q.explica });
}

/* --- ¿qué ejercicio es? (foto) ---
   Los distractores salen de la misma posición pero de OTRO componente:
   así no se comparan dos fotos casi idénticas (p. ej. dos variantes de
   plancha), que harían la pregunta injusta. */
function ejFoto(it) {
  const x = it.ref;
  const e = PM[azar(x.ejercicios)];
  const prohib = new Set([norm(e.n)]);
  const dist = [];
  const add = lista => {
    for (const o of mezclar(lista)) {
      if (dist.length >= 3) return;
      const k = norm(o.n);
      if (!prohib.has(k)) { prohib.add(k); dist.push(o.n); }
    }
  };
  /* Distractores de la MISMA posición (si no, una plancha competía con
     ejercicios de pie y la respuesta era obvia), salvo los que tienen una
     foto casi igual a la mostrada. */
  const distinta = o => !(e.parecida && o.parecida === e.parecida);
  const mismaPos = PREMAT.filter(o => o.id !== e.id && x.ejercicios.includes(o.id) && distinta(o));
  const mismaPosSinFoto = PREMAT.filter(o => o.id !== e.id && PM[x.ejercicios[0]] && o.pos === e.pos && distinta(o) && !o.revisar);
  add(mismaPos);
  add(mismaPosSinFoto);
  add(PREMAT.filter(o => o.id !== e.id && distinta(o) && !o.revisar));
  const explica = `${e.n}: ${e.pos.toLowerCase()} · ${e.principio} · ${e.comp}${e.obj ? ' · ' + e.obj : ''}`;
  return opcionesUI({ consigna: `¿Qué ejercicio es? · ${x.pos}`, pregunta: '', foto: imagen(e.id),
    opciones: mezclar([e.n, ...dist]), correcta: e.n, reconocimiento: true, explica });
}

/* --- preguntas del manual: opciones fijas, revisadas para que la
   correcta no se delate por ser la más larga --- */
function ejQuiz(it) {
  const c = it.ref;
  return opcionesUI({ consigna: c.examen ? 'Pregunta de tu examen' : 'Pregunta del manual', pregunta: esc(c.q), opciones: mezclar(c.ops), correcta: c.correcta, reconocimiento: true });
}

/* --- ¿qué ejercicio es? (animación) ---
   La figura hace el ejercicio completo, sin nombre ni texto de los pasos.
   Distractores de la misma posición: hay que mirar el movimiento. */
function ejAnim(it) {
  const e = EJ_BB[it.ref.ej];
  const prohib = new Set([norm(e.n)]), dist = [];
  const add = lista => {
    for (const o of mezclar(lista)) {
      if (dist.length >= 3) return;
      const k = norm(o.n);
      if (!prohib.has(k)) { prohib.add(k); dist.push(o.n); }
    }
  };
  const con = BB.ejercicios.filter(o => POSES[o.id] && o.id !== e.id);
  add(con.filter(o => o.pos === e.pos));
  add(con);
  const ej = opcionesUI({ consigna: '¿Qué ejercicio es?', pregunta: '', opciones: mezclar([e.n, ...dist]), correcta: e.n,
    reconocimiento: true, explica: `${e.n}: ${(BB.nomPos[e.pos] || '').toLowerCase()} · ${e.nivel}. ${e.inicial}` });
  const fig = document.createElement('div');
  fig.className = 'fig-ej';
  ej.el.prepend(fig);
  FIGURA.reproductor(fig, { ...POSES[e.id], nom: '' }, { fantasma: false, fluido: ritmoFluido() });
  /* después de responder se puede ver el ejercicio paso a paso, con sus fases */
  const comprobar = ej.comprobar;
  ej.comprobar = () => {
    const r = comprobar();
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'btn small ghost ver-pasos'; b.textContent = '⤢ Verlo paso a paso';
    b.onclick = () => abrirVisorGrande(e);
    fig.after(b);
    return r;
  };
  return ej;
}

/* --- flashcard (autoevaluada, con predicción previa) --- */
function ejFlash(it) {
  const c = it.ref;
  const el = document.createElement('div');
  el.innerHTML = `
    <div class="flip"><div class="flip-in">
      <div class="cara frente">
        <span class="cara-tag">Pregunta</span>
        <p class="flip-q">${esc(c.q)}</p>
        <p class="flip-hint">Recordá la respuesta —en tu cabeza o en voz alta— antes de girar.</p>
      </div>
      <div class="cara dorso">
        <span class="cara-tag">Respuesta</span>
        <ul class="resp">${c.a.map(x => `<li>${esc(x)}</li>`).join('')}</ul>
        ${c.porque ? `<div class="porque"><b>Por qué</b><p>${esc(c.porque)}</p></div>` : ''}
      </div>
    </div></div>
    <div class="flash-acc">
      <div class="fase1">
        <p class="predq">Antes de girar: ¿la sabés?</p>
        <div class="fila2">
          <button type="button" class="btn3d gris" data-pred="0">Todavía no</button>
          <button type="button" class="btn3d azul" data-pred="1">Sí, la sé</button>
        </div>
      </div>
      <div class="fase2" hidden>
        <p class="predq">¿Cómo te fue al recordarla?</p>
        <div class="notas4">${[1, 2, 3, 4].map(g => `<button type="button" class="cal n${g}" data-g="${g}">
          <b>${['Otra vez', 'Difícil', 'Bien', 'Fácil'][g - 1]}</b>
          <i>${g === 1 ? 'hoy' : fmtDias(previa(it.id, g))}</i></button>`).join('')}</div>
      </div>
    </div>`;
  let pred = null, hecho = false;
  const ej = {
    consigna: 'Flashcard · recuperá de memoria', pregunta: '', el, manual: true, n: 1,
    tecla(k) {
      if (pred === null) { if (k === ' ') $('[data-pred="1"]', el).click(); return; }
      const b = $(`[data-g="${k}"]`, el);
      if (b) b.click();
    },
    autoResolver(bien = true) {
      $(`[data-pred="${bien ? 1 : 0}"]`, el).click();
      $(`[data-g="${bien ? 3 : 1}"]`, el).click();
    }
  };
  $$('[data-pred]', el).forEach(b => b.onclick = () => {
    pred = b.dataset.pred === '1';
    $('.flip', el).classList.add('girada');
    $('.fase1', el).hidden = true;
    $('.fase2', el).hidden = false;
    SND.flip();
  });
  $$('[data-g]', el).forEach(b => b.onclick = () => {
    if (hecho) return;
    hecho = true;
    const g = +b.dataset.g;
    ej.alCalificar({ nota: g, pred, p: g >= 2 ? 1 : 0 });
  });
  return ej;
}

/* --- escribir de memoria (generación) --- */
function contarAciertos(txt, resp) {
  const lineas = String(txt).split(/\n|,|;/).map(norm).filter(x => x.length > 2);
  let n = 0;
  const usadas = new Set();
  for (const r of resp) {
    const k = clave(r);
    if (!k) continue;
    for (let i = 0; i < lineas.length; i++) {
      if (usadas.has(i)) continue;
      const l = lineas[i];
      if (l.includes(k) || (k.includes(l) && l.length >= 4)) { n++; usadas.add(i); break; }
    }
  }
  return n;
}
function listaSolucion(resp, texto) {
  return `<ul class="sol-lista">${resp.map(x => {
    const ok = texto != null && contarAciertos(texto, [x]) === 1;
    return `<li class="${texto == null ? '' : ok ? 'ok' : 'falta'}">${esc(x)}</li>`;
  }).join('')}</ul>`;
}
function ejEscribir(it) {
  const c = it.ref;
  const m = c.q.match(/al menos (\d+)/i);
  const meta = Math.min(c.a.length, m ? +m[1] : c.a.length);
  const el = document.createElement('div');
  el.innerHTML = `
    <label class="gen-l" for="intento">Escribí lo que recuerdes, uno por línea. Producir la respuesta la fija mucho más que reconocerla.</label>
    <textarea id="intento" class="gen-t" rows="${Math.min(7, Math.max(3, meta))}" autocomplete="off" spellcheck="false"></textarea>
    <div class="marcador"><b id="mk">0</b> de ${meta}${meta < c.a.length ? ` <small>(tus apuntes tienen ${c.a.length})</small>` : ''}</div>`;
  const ta = $('textarea', el), mk = $('#mk', el);
  const ej = {
    consigna: 'Escribí de memoria', pregunta: esc(c.q), el, n: meta,
    listo: () => ta.value.trim().length > 1,
    enfocar: () => ta.focus(),
    bloquear() { ta.readOnly = true; },
    solucion: () => listaSolucion(c.a, ta.value),
    comprobar() {
      const h = contarAciertos(ta.value, c.a);
      ej.bloquear();
      const p = Math.min(1, h / meta);
      return { p, n: meta, sol: p >= 1 ? '' : listaSolucion(c.a, ta.value) };
    },
    autoResolver(bien = true) {
      ta.value = bien ? c.a.map(etiqueta).join('\n') : 'no me acuerdo';
      ta.dispatchEvent(new Event('input'));
    }
  };
  ta.addEventListener('input', () => {
    const n = contarAciertos(ta.value, c.a);
    mk.textContent = n;
    mk.parentElement.classList.toggle('lleno', n >= meta);
    ej.cambio();
  });
  ta.addEventListener('keydown', e => {
    e.stopPropagation();
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); accion(); }
  });
  return ej;
}

/* --- seleccionar fichas (banco de palabras) --- */
function ejBanco(it) {
  const c = it.ref;
  const todas = unicosPor(c.a.map(etiqueta), claveComp);
  const correctas = todas.length <= 6 ? todas : tomar(todas, 5);
  const dist = distractoresLista(c, correctas.length <= 3 ? 3 : 4);
  const fichas = mezclar([...correctas.map(t => ({ t, ok: 1 })), ...dist.map(t => ({ t, ok: 0 }))])
    .map((x, i) => crearFicha(x.t, 'f' + i, { ok: x.ok }));
  const pregunta = (c.tema === 'repertorio' || c.distPool ? 'Según tus apuntes — ' : '') +
    c.q.replace(/\s*\(nombra al menos \d+\)/i, '');
  const el = document.createElement('div');
  el.innerHTML = `
    <p class="cuenta">Elegí las <b>${correctas.length}</b> que correspondan${todas.length > correctas.length ? ' <small>(tus apuntes tienen más; acá aparecen algunas)</small>' : ''}</p>
    <div class="zona-resp" data-zona="resp" aria-label="Tu respuesta"></div>
    <div class="banco" data-zona="banco"></div>`;
  const resp = $('[data-zona="resp"]', el), banco = $('[data-zona="banco"]', el);
  llenarBanco(banco, fichas);
  const ej = {
    consigna: 'Seleccioná las correctas', pregunta: esc(pregunta), el, n: correctas.length,
    listo: () => !!$('.ficha', resp),
    bloquear() { fichas.forEach(f => f.classList.add('bloq')); },
    solucion: () => `<ul class="sol-lista">${correctas.map(t => `<li>${esc(t)}</li>`).join('')}</ul>`,
    comprobar() {
      let tp = 0, fp = 0;
      $$('.ficha', resp).forEach(f => {
        if (f.dataset.ok === '1') { tp++; f.classList.add('bien'); } else { fp++; f.classList.add('mal'); }
      });
      fichas.filter(f => f.dataset.ok === '1' && enCasa(f)).forEach(f => f.classList.add('falto'));
      ej.bloquear();
      const p = Math.max(0, (tp - fp) / correctas.length);
      return { p, n: correctas.length, sol: p >= 1 ? '' : ej.solucion() };
    },
    autoResolver(bien = true) {
      fichas.filter(f => bien ? f.dataset.ok === '1' : true).forEach(f => moverA(f, resp));
      ej.cambio();
    }
  };
  motorFichas(el, {
    alTocar: f => { SND.soltar(); if (enCasa(f)) moverA(f, resp); else aCasa(f, el); },
    alSoltar: (f, z, i) => { if (z === banco) aCasa(f, el); else if (z === resp) moverA(f, resp, i); },
    alCambiar: () => ej.cambio()
  });
  return ej;
}

/* --- ordenar --- */
function lis(seq) {   // subsecuencia creciente más larga
  const d = seq.map(() => 1);
  for (let i = 1; i < seq.length; i++)
    for (let j = 0; j < i; j++) if (seq[j] < seq[i]) d[i] = Math.max(d[i], d[j] + 1);
  return seq.length ? Math.max(...d) : 0;
}
function ejOrden(it, joven) {
  const x = it.ref;
  let tramo = x.pasos;
  if (joven && tramo.length > 5) {
    const k = 4, i0 = Math.floor(Math.random() * (tramo.length - k + 1));
    tramo = tramo.slice(i0, i0 + k);
  }
  let orden;
  do { orden = mezclar(tramo); } while (tramo.length > 1 && orden.every((t, i) => t === tramo[i]));
  const fichas = orden.map(t => crearFicha(t, 'o' + tramo.indexOf(t), { pos: tramo.indexOf(t) }));
  const el = document.createElement('div');
  el.innerHTML = `${tramo !== x.pasos ? '<p class="cuenta">Un tramo de la secuencia completa</p>' : ''}
    <div class="zona-resp orden" data-zona="resp" aria-label="Tu orden"></div>
    <div class="banco" data-zona="banco"></div>`;
  const resp = $('[data-zona="resp"]', el), banco = $('[data-zona="banco"]', el);
  llenarBanco(banco, fichas);
  const ej = {
    consigna: 'Ordená los pasos', pregunta: esc(x.q), el, n: tramo.length,
    listo: () => $$('.ficha', resp).length === tramo.length,
    bloquear() { fichas.forEach(f => f.classList.add('bloq')); },
    solucion: () => `<ol class="sol-lista">${tramo.map(t => `<li>${esc(t)}</li>`).join('')}</ol>`,
    comprobar() {
      const puestas = $$('.ficha', resp);
      const seq = puestas.map(f => +f.dataset.pos);
      puestas.forEach((f, i) => f.classList.add(seq[i] === i ? 'bien' : 'mal'));
      ej.bloquear();
      const exacto = seq.every((v, i) => v === i);
      const p = exacto ? 1 : lis(seq) / tramo.length;
      return { p: exacto ? 1 : Math.min(p, 0.99), n: tramo.length, sol: exacto ? '' : ej.solucion() };
    },
    autoResolver(bien = true) {
      const ord = fichas.slice().sort((a, b) => a.dataset.pos - b.dataset.pos);
      (bien ? ord : ord.reverse()).forEach(f => moverA(f, resp));
      ej.cambio();
    }
  };
  motorFichas(el, {
    alTocar: f => { SND.soltar(); if (enCasa(f)) moverA(f, resp); else aCasa(f, el); },
    alSoltar: (f, z, i) => { if (z === banco) aCasa(f, el); else if (z === resp) moverA(f, resp, i); },
    alCambiar: () => ej.cambio()
  });
  return ej;
}

/* --- emparejar --- */
function paresRepertorio(n) {
  for (let intento = 0; intento < 40; intento++) {
    const elegidos = [];
    for (const e of mezclar(REPERTORIO.filter(r => r.obj.length))) {
      if (elegidos.length >= n) break;
      /* el par (e, o) entra solo si nadie más del conjunto puede
         reclamar o, y e no puede reclamar el objetivo de otro */
      const o = mezclar(e.obj).find(o => !elegidos.some(p =>
        p.o === o || e.obj.includes(p.o) || p.e.obj.includes(o)));
      if (o) elegidos.push({ e, o });
    }
    if (elegidos.length >= n) return elegidos.map(p => [p.e.n, OBJETIVOS[p.o]]);
  }
  return [['Hundred', 'Calentamiento'], ['Swimming', 'Movimiento de todo el cuerpo'],
          ['Swan', 'Estabilidad escapular'], ['Kneeling side family', 'Cadena / sistema lateral']];
}
/* Ejercicio ↔ series, sin repetir el valor de la derecha en el mismo juego. */
function paresSeries(n, lista = MAT1) {
  const usados = new Set(), out = [];
  for (const m of mezclar(lista.filter(m => m.series))) {
    if (out.length >= n) break;
    if (usados.has(m.series)) continue;
    usados.add(m.series);
    out.push([m.n, m.series]);
  }
  return out;
}
function ejPares(it, joven) {
  const x = it.ref, n = joven ? 4 : 5;
  const pares = x.dinamico === 'repertorio' ? paresRepertorio(n)
              : x.dinamico === 'mat1series' ? paresSeries(n)
              : x.dinamico === 'mat2series' ? paresSeries(n, MAT2)
              : tomar(x.pares, Math.min(n, x.pares.length));
  const izq = mezclar(pares.map((p, k) => ({ t: p[0], k })));
  const der = mezclar(pares.map((p, k) => ({ t: p[1], k })));
  const el = document.createElement('div');
  el.innerHTML = `<div class="pares">
    <div class="col">${izq.map(o => `<button type="button" class="par" data-lado="i" data-k="${o.k}">${esc(o.t)}</button>`).join('')}</div>
    <div class="col">${der.map(o => `<button type="button" class="par" data-lado="d" data-k="${o.k}">${esc(o.t)}</button>`).join('')}</div>
  </div>`;
  let sel = { i: null, d: null }, hechos = 0, errores = 0, fin = false;
  const ej = {
    consigna: 'Tocá los pares que van juntos', pregunta: esc(x.q), el, auto: true, n: pares.length,
    bloquear() { fin = true; $$('.par', el).forEach(b => b.disabled = true); },
    solucion: () => `<ul class="sol-lista">${pares.map(p => `<li><b>${esc(p[0])}</b> → ${esc(p[1])}</li>`).join('')}</ul>`,
    autoResolver(bien = true) {
      const bot = (lado, k) => $(`.par[data-lado="${lado}"][data-k="${k}"]`, el);
      if (!bien && pares.length > 1) { bot('i', 0).click(); bot('d', 1).click(); }
      pares.forEach((_, k) => { bot('i', k).click(); bot('d', k).click(); });
    }
  };
  $$('.par', el).forEach(b => b.onclick = () => {
    if (fin || b.classList.contains('hecho')) return;
    const lado = b.dataset.lado;
    if (sel[lado] === b) { b.classList.remove('sel'); sel[lado] = null; return; }
    if (sel[lado]) sel[lado].classList.remove('sel');
    sel[lado] = b;
    b.classList.add('sel');
    if (!(sel.i && sel.d)) { SND.toque(); return; }
    const a = sel.i, z = sel.d;
    sel = { i: null, d: null };
    if (a.dataset.k === z.dataset.k) {
      [a, z].forEach(e => { e.classList.remove('sel'); e.classList.add('hecho'); e.disabled = true; });
      SND.par();
      [a, z].forEach(e => FX.chispasEn(e, { n: 8, dist: 34, tam: 6 }));
      if (++hechos === pares.length) {
        fin = true;
        const p = pares.length / (pares.length + errores);
        setTimeout(() => ej.alCompletar({ p: errores ? Math.min(p, 0.99) : 1, n: pares.length, sol: errores ? ej.solucion() : '' }), 280);
      }
    } else {
      errores++;
      SND.parMal(); vibrar(50);
      [a, z].forEach(e => { e.classList.remove('sel'); e.classList.add('error'); setTimeout(() => e.classList.remove('error'), 450); });
    }
  });
  return ej;
}

/* --- clasificar --- */
function ejClasif(it, joven) {
  const x = it.ref, tambien = x.tambien || {};
  let grupos;
  if (x.dinamico === 'osteo') {
    const de = k => REPERTORIO.filter(r => r.osteo === k).map(r => r.n);
    grupos = joven
      ? { 'Sí se puede': tomar(de('si'), 3), 'No: contraindicado': tomar(de('no'), 3) }
      : { 'Sí se puede': tomar(de('si'), 3), 'No: contraindicado': tomar(de('no'), 4), 'Solo modificado': tomar(de('mod'), 1) };
  } else grupos = x.grupos;
  const cubetas = Object.keys(grupos);
  const total = joven ? 6 : 8;
  const pool = cubetas.flatMap(b => grupos[b].map(t => ({ t, b })));
  const elegidas = cubetas.map(b => azar(pool.filter(p => p.b === b)));
  for (const p of mezclar(pool)) {
    if (elegidas.length >= total) break;
    if (!elegidas.includes(p)) elegidas.push(p);
  }
  const fichas = mezclar(elegidas).map((p, i) => crearFicha(p.t, 'c' + i, { b: p.b }));
  const el = document.createElement('div');
  el.innerHTML = `
    <div class="cubetas n${cubetas.length}">${cubetas.map((b, i) =>
      `<div class="cubeta" data-zona="b${i}" data-nombre="${esc(b)}"><h5>${esc(b)}</h5></div>`).join('')}</div>
    <p class="cuenta suave">Arrastrá cada ficha a su grupo, o tocá la ficha y después el grupo.</p>
    <div class="banco" data-zona="banco"></div>`;
  const banco = $('[data-zona="banco"]', el);
  llenarBanco(banco, fichas);
  let elegida = null;
  const soltar = () => { if (elegida) elegida.classList.remove('sel'); elegida = null; el.classList.remove('eligiendo'); };
  const aceptaEn = (f, nombre) => f.dataset.b === nombre || (tambien[f.textContent] || []).includes(nombre);
  const ej = {
    consigna: 'Clasificá', pregunta: esc(x.q), el, n: fichas.length,
    listo: () => !$('.ficha:not(.ph)', banco),
    bloquear() { soltar(); fichas.forEach(f => f.classList.add('bloq')); },
    solucion() {
      const extra = fichas.filter(f => (tambien[f.textContent] || []).length);
      return `<div class="sol-cubs">${cubetas.map(b => {
        const fs = elegidas.filter(p => p.b === b);
        return fs.length ? `<p><b>${esc(b)}:</b> ${fs.map(p => esc(p.t)).join(' · ')}</p>` : '';
      }).join('')}${extra.map(f => `<p class="sol-nota">${esc(f.textContent)} también vale en: ${esc(tambien[f.textContent].join(', '))}.</p>`).join('')}</div>`;
    },
    comprobar() {
      let ok = 0;
      $$('.cubeta', el).forEach(cub => $$('.ficha', cub).forEach(f => {
        const bien = aceptaEn(f, cub.dataset.nombre);
        f.classList.add(bien ? 'bien' : 'mal');
        if (bien) ok++;
      }));
      ej.bloquear();
      const p = ok / fichas.length;
      return { p, n: fichas.length, sol: p >= 1 ? '' : ej.solucion() };
    },
    autoResolver(bien = true) {
      const cubs = $$('.cubeta', el);
      /* para equivocarse hace falta una ficha que tenga algún grupo incorrecto
         (las que valen en todos los grupos no sirven) */
      const iMal = bien ? -1 : fichas.findIndex(f => cubs.some(c => !aceptaEn(f, c.dataset.nombre)));
      fichas.forEach((f, i) => {
        const buena = cubs.find(c => c.dataset.nombre === f.dataset.b);
        const mala = cubs.find(c => !aceptaEn(f, c.dataset.nombre));
        moverA(f, i === iMal && mala ? mala : buena);
      });
      ej.cambio();
    }
  };
  motorFichas(el, {
    alTocar: f => {
      SND.toque();
      if (!enCasa(f)) { aCasa(f, el); soltar(); return; }
      if (elegida === f) { soltar(); return; }
      soltar();
      elegida = f; f.classList.add('sel'); el.classList.add('eligiendo');
    },
    alSoltar: (f, z) => {
      if (elegida === f) soltar();
      if (z === banco) aCasa(f, el);
      else if (z.classList.contains('cubeta')) moverA(f, z);
    },
    alCambiar: () => ej.cambio()
  });
  $$('.cubeta', el).forEach(cub => cub.addEventListener('click', e => {
    if (e.target.closest('.ficha') || !elegida) return;
    const f = elegida;
    soltar(); moverA(f, cub); SND.soltar(); ej.cambio();
  }));
  return ej;
}

/* --- completar (cloze) --- */
function ejCloze(it, joven) {
  const x = it.ref;
  const partes = x.t.split(/\[([^\]]+)\]/);
  const resp = partes.filter((_, i) => i % 2);
  const nd = joven ? 2 : 4;
  const prohib = new Set(resp.map(norm));
  const dist = [];
  const add = (arr, tope) => {
    for (const d of mezclar(arr)) {
      if (dist.length >= tope) return;
      const k = norm(d);
      if (!prohib.has(k)) { prohib.add(k); dist.push(d); }
    }
  };
  /* dist puede venir por hueco ([[años], [países]]): así cada hueco tiene
     alternativas de su mismo tipo y no queda una sola ficha que "encaja". */
  if (x.dist && Array.isArray(x.dist[0])) {
    const porHueco = Math.max(1, Math.ceil(nd / x.dist.length));
    x.dist.forEach((grupo, i) => add(grupo, Math.min(nd, porHueco * (i + 1))));
  } else add(x.dist || [], nd);
  const fichas = mezclar([...resp, ...dist]).map((t, i) => crearFicha(t, 'z' + i));
  const el = document.createElement('div');
  el.innerHTML = `<p class="frase">${partes.map((p, i) => i % 2
      ? `<span class="hueco" data-zona="h${(i - 1) / 2}" aria-label="hueco"></span>` : esc(p)).join('')}</p>
    <div class="banco" data-zona="banco"></div>`;
  const banco = $('[data-zona="banco"]', el);
  llenarBanco(banco, fichas);
  const huecos = $$('.hueco', el);
  const ocupante = h => $('.ficha', h);
  const ej = {
    consigna: 'Completá la frase', pregunta: '', el, n: resp.length,
    listo: () => huecos.every(ocupante),
    bloquear() { fichas.forEach(f => f.classList.add('bloq')); },
    solucion: () => `<p class="frase chica">${partes.map((p, i) => i % 2 ? `<b class="sol-h">${esc(p)}</b>` : esc(p)).join('')}</p>`,
    comprobar() {
      const puestos = huecos.map(h => (ocupante(h) || {}).textContent || '');
      let buenos;
      if (x.libre) {
        const quedan = resp.map(norm);
        buenos = puestos.map(t => { const i = quedan.indexOf(norm(t)); if (i < 0) return false; quedan.splice(i, 1); return true; });
      } else buenos = puestos.map((t, i) => norm(t) === norm(resp[i]));
      huecos.forEach((h, i) => { const o = ocupante(h); if (o) o.classList.add(buenos[i] ? 'bien' : 'mal'); });
      ej.bloquear();
      const p = buenos.filter(Boolean).length / resp.length;
      return { p, n: resp.length, sol: p >= 1 ? '' : ej.solucion() };
    },
    autoResolver(bien = true) {
      huecos.forEach((h, i) => {
        const f = fichas.find(f => enCasa(f) && (bien ? norm(f.textContent) === norm(resp[i]) : !resp.map(norm).includes(norm(f.textContent))))
               || fichas.find(f => enCasa(f));
        if (f) moverA(f, h);
      });
      ej.cambio();
    }
  };
  motorFichas(el, {
    alTocar: f => {
      SND.toque();
      if (!enCasa(f)) { aCasa(f, el); return; }
      const h = huecos.find(h => !ocupante(h));
      if (h) moverA(f, h);
    },
    alSoltar: (f, z) => {
      if (z === banco) { aCasa(f, el); return; }
      if (!z.classList.contains('hueco')) return;
      const o = ocupante(z);
      if (o && o !== f) aCasa(o, el);
      moverA(f, z);
    },
    alCambiar: () => ej.cambio()
  });
  return ej;
}

/* ============================================================
   SESIÓN (lección, repaso o práctica)
   ============================================================ */

let L = null;
let vista = 'inicio', vistaPrevia = 'inicio';
const entrada = (it, fmt = null) => ({ it, fmt, fijo: !!fmt, intento: 0 });

function intercalar(lote) {
  const porTema = {};
  for (const i of lote) (porTema[i.tema] = porTema[i.tema] || []).push(i);
  const pilas = Object.values(porTema).map(mezclar);
  const out = [];
  while (pilas.some(p => p.length)) for (const p of mezclar(pilas)) if (p.length) out.push(p.shift());
  return out;
}
/* Arranca recuperando algo ya visto (calentamiento), y reparte los
   repasos entre lo nuevo para intercalar. */
function entrelazar(nuevos, repasos) {
  const r = repasos.slice(), out = [];
  if (r.length) out.push(r.shift());
  nuevos.forEach((n, i) => { out.push(n); if (i % 2 === 1 && r.length) out.push(r.shift()); });
  return out.concat(r);
}

function sesionUnidad(u) {
  const pool = itemsDeUnidad(u);
  const sinVer = pool.filter(i => !S.items[i.id]);
  const nCards = sinVer.filter(esCard).slice(0, 4);
  const nEj = sinVer.filter(i => !esCard(i)).slice(0, nCards.length >= 4 ? 2 : 6 - nCards.length);
  const nuevos = [...nCards, ...nEj];
  const venc = vencidos().sort(porMemoria);
  const repasos = [
    ...venc.filter(i => u.temas.includes(i.tema)).slice(0, 2),
    ...venc.filter(i => !u.temas.includes(i.tema)).slice(0, 2)
  ];
  if (nuevos.length + repasos.length < 7) {
    const extra = pool.filter(i => S.items[i.id] && !repasos.includes(i)).sort(porMemoria)
      .slice(0, 7 - nuevos.length - repasos.length);
    repasos.push(...extra);
  }
  return entrelazar(nuevos, mezclar(repasos)).map(it => entrada(it));
}
const sesionRepaso = () => intercalar(vencidos().sort(porMemoria).slice(0, S.cfg.sesion)).map(it => entrada(it));

const MODOS = {
  flash:    { nom: 'Flashcards', ico: '🃏', desc: 'Recordá, girá la tarjeta y calificá qué tan bien salió.', tipos: ['simple', 'lista', 'flash'], fmt: 'flash' },
  anim:     { nom: '¿Qué ejercicio es? (animación)', ico: '🎬', desc: 'Mirá la figura hacer el ejercicio de Mat 1 o Mat 2 y reconocelo.', tipos: ['anim'] },
  examen:   { nom: 'Simulacro de examen', ico: '📝', desc: 'Lo que te preguntaron en Principios, Mat 1, Mat 2 y Mat 3. Lo que fallaste sale primero.', temas: ['ex-pm', 'ex-mat'] },
  quiz:     { nom: 'Preguntas del manual', ico: '📖', desc: 'Principios del Movimiento, Mat 1 y Mat 2, con la página del libro.', tipos: ['quiz'], sinTemas: ['ex-pm', 'ex-mat'] },
  pares:    { nom: 'Emparejar', ico: '🔗', desc: 'Tocá los pares: músculo y acción, cadena y función.', tipos: ['pares'] },
  orden:    { nom: 'Ordenar', ico: '↕️', desc: 'Arrastrá los pasos de cada progresión a su lugar.', tipos: ['orden'] },
  clasif:   { nom: 'Clasificar', ico: '🗂️', desc: 'Arrastrá cada ficha al grupo que le corresponde.', tipos: ['clasif'] },
  cloze:    { nom: 'Completar', ico: '✍️', desc: 'Arrastrá la palabra que falta a cada hueco.', tipos: ['cloze'] },
  escribir: { nom: 'De memoria', ico: '🧠', desc: 'Escribí las listas sin ayuda. El formato más exigente.', tipos: ['lista'], fmt: 'escribir' },
  foto:     { nom: '¿Qué ejercicio es?', ico: '📷', desc: 'Mirá la foto y reconocé el ejercicio de Pre-Pilates.', tipos: ['foto'] },
  intruso:  { nom: 'Intruso', ico: '🎯', desc: 'Uno no pertenece al grupo. Encontralo.', gen: 'intruso' },
  semaforo: { nom: 'Semáforo osteoporosis', ico: '🚦', desc: '¿Se puede, no se puede o va modificado?', gen: 'semaforo' }
};
function poolModo(k, uId) {
  const m = MODOS[k];
  let pool = m.temas ? ITEMS.filter(i => m.temas.includes(i.tema)) : ITEMS.filter(i => m.tipos.includes(i.tipo));
  if (m.sinTemas) pool = pool.filter(i => !m.sinTemas.includes(i.tema));
  if (k === 'escribir') pool = pool.filter(i => i.tipo === 'lista');
  if (uId) { const u = UNIDADES.find(x => x.id === uId); pool = pool.filter(i => u.temas.includes(i.tema)); }
  return pool;
}
function sesionPractica(k, uId) {
  const m = MODOS[k];
  if (m.gen) return Array.from({ length: 10 }, () =>
    entrada({ id: null, tipo: 'gen', gen: m.gen, tema: m.gen === 'semaforo' ? 'osteo' : 'repertorio', ref: {} }, 'gen'));
  const pool = poolModo(k, uId);
  const vistos = pool.filter(i => S.items[i.id]).sort(porMemoria);
  /* en el simulacro, lo que se falló en el examen va primero */
  const fallada = i => !!(i.ref && i.ref.examen && i.ref.examen.fallada);
  const sinVer = mezclar(pool.filter(i => !S.items[i.id]));
  const lote = (k === 'examen'
    ? [...sinVer.filter(fallada), ...vistos, ...sinVer.filter(i => !fallada(i))].slice(0, 10)
    : [...vistos, ...sinVer].slice(0, 8));
  /* las fotos se sortean en cada pregunta: el mismo grupo puede repetirse */
  while (k === 'foto' && pool.length && lote.length < 10) lote.push(azar(pool));
  return (k === 'examen' ? lote : mezclar(lote)).map(it => entrada(it, m.fmt || null));
}

function iniciarSesion(tipo, entradas, titulo) {
  if (!entradas.length) { toast('No hay ejercicios para esta selección todavía.'); return; }
  L = { tipo, titulo, cola: entradas, total: entradas.length, hechos: 0, xp: 0, combo: 0, comboMax: 0,
        primeras: 0, primerasOk: 0, inicio: Date.now(), nuevosLogros: [],
        metaAntes: !!(S.log[HOY()] || {}).metaOk, nivelAntes: nivelDe(S.xp), rachaAntes: rachaVigente(), pctAnt: 0 };
  vistaPrevia = ['inicio', 'practica', 'mapa', 'apuntes', 'perfil', 'estudio'].includes(vista) ? vista : 'inicio';
  vista = 'sesion';
  cerrarModal();
  document.body.classList.add('en-sesion');
  window.scrollTo(0, 0);
  pintarEjercicio();
}

function pintarEjercicio() {
  const en = L.cola[0];
  if (!en) { finSesion(); return; }
  const reintento = en.intento > 0;
  const fmt = (en.fijo && en.fmt) || formatoPara(en.it, reintento);
  const f = en.it.id ? S.items[en.it.id] : null;
  const joven = reintento || !f || f.s < 4;
  const ej = construir(en.it, fmt, joven);
  L.actual = { en, fmt, ej, t0: Date.now(), nuevo: !!en.it.id && !f, cerrado: false };
  const pct = Math.round(100 * L.hechos / L.total);
  const cont = document.createElement('div');
  cont.className = 'sesion';
  cont.innerHTML = `
    <div class="ses-top">
      <button type="button" class="ses-x" id="salir" aria-label="Salir de la lección">✕</button>
      <div class="ses-prog" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"><span style="width:${L.pctAnt}%"></span></div>
      <span class="ses-combo ${L.combo >= 3 ? 'on' : ''} ${L.combo >= 10 ? 'fuego' : ''}" title="Aciertos seguidos">🔥 ${L.combo}</span>
      ${botonMusica('ses-musica')}
    </div>
    <div class="ses-cuerpo">
      <div class="ses-tags">
        ${L.actual.nuevo ? '<span class="tag nuevo">Nuevo</span>' : ''}
        ${reintento ? '<span class="tag repite">Otra vez</span>' : ''}
        ${tagExamen(en.it)}
        ${en.it.tema && TEMAS[en.it.tema] && fmt !== 'anim' ? `<span class="tag tag-tema c-${TEMAS[en.it.tema].color}">${TEMAS[en.it.tema].icono} ${TEMAS[en.it.tema].nom}</span>` : ''}
      </div>
      <p class="ses-consigna">${ej.consigna}</p>
      ${ej.pregunta ? `${ilusPregunta(en.it)}<h2 class="ses-preg">${ej.pregunta}</h2>` : ''}
      <div class="ses-ej"></div>
    </div>
    ${ej.manual ? '' : `<div class="ses-pie"><div class="ses-pie-in">
      <button type="button" class="btn3d gris" id="nose">No sé</button>
      ${ej.auto ? '' : '<button type="button" class="btn3d verde" id="comprobar" disabled>Comprobar</button>'}
    </div></div>`}`;
  app().innerHTML = '';
  app().appendChild(cont);
  $('.ses-ej', cont).appendChild(ej.el);
  /* la barra avanza desde donde estaba, con un brillo al moverse */
  const barra = $('.ses-prog span', cont);
  if (pct !== L.pctAnt) requestAnimationFrame(() => requestAnimationFrame(() => {
    barra.style.width = pct + '%'; barra.classList.add('avanza');
  }));
  L.pctAnt = pct;
  conectarMusica(cont);
  $('#salir', cont).onclick = salirSesion;
  const btn = $('#comprobar', cont);
  if (btn) {
    btn.onclick = accion;
    ej.cambio = () => { btn.disabled = !ej.listo(); };
    ej.cambio();
  }
  const nose = $('#nose', cont);
  if (nose) nose.onclick = rendirse;
  if (ej.auto) ej.alCompletar = procesar;
  if (ej.manual) ej.alCalificar = procesar;
  if (ej.enfocar) setTimeout(ej.enfocar, 60);
}

/* Ítems que salen de un examen previo: de cuál, y si ahí se falló */
function tagExamen(it) {
  const x = it.ref && it.ref.examen;
  if (!x || typeof EXAMEN === 'undefined') return '';
  return `<span class="tag examen ${x.fallada ? 'fallada' : ''}">📝 ${x.fallada ? 'La fallaste en' : 'De'} tu examen de ${esc(EXAMEN[x.ex].nom)}</span>`;
}

/* Botón principal / Enter: comprobar o continuar */
function accion() {
  if (!L || vista !== 'sesion' || !L.actual) return;
  const a = L.actual;
  if (a.cerrado) { continuar(); return; }
  if (a.ej.manual || a.ej.auto || !a.ej.listo()) return;
  procesar(a.ej.comprobar());
}
function rendirse() {
  const a = L && L.actual;
  if (!a || a.cerrado) return;
  if (a.ej.bloquear) a.ej.bloquear();
  procesar({ p: 0, n: a.ej.n || 1, sol: a.ej.solucion ? a.ej.solucion() : '', rendido: true });
}

/* Traduce el desempeño a la nota de FSRS. El formato de reconocimiento
   y la primera exposición nunca dan "fácil": reconocer no es recordar. */
function notaAuto(p, ms, n, nuevo, reconocimiento) {
  if (p >= 1) return (nuevo || reconocimiento) ? 3 : (ms < 2500 + 1500 * n ? 4 : 3);
  if (p >= 0.75) return 2;
  return 1;
}

function procesar(res) {
  const a = L.actual;
  if (!a || a.cerrado) return;
  a.cerrado = true;
  const ms = Date.now() - a.t0;
  const it = a.en.it, primera = a.en.intento === 0;
  let nota = res.nota != null ? res.nota : notaAuto(res.p, ms, res.n || 1, a.nuevo, res.reconocimiento);
  const exito = res.nota != null ? res.nota >= 2 : res.p >= 1;
  let info = null;
  if (it.id) {
    info = registrarRepaso(it.id, nota);
    nota = info.nota;
    /* hipercorrección: un error cometido con seguridad se marca, y
       acertarlo después se reconoce */
    if (res.pred === true && nota === 1) S.hiper[it.id] = 1;
    else if (exito && S.hiper[it.id]) { delete S.hiper[it.id]; S.hiperOk++; }
  }
  if (res.pred != null) {
    S.calib.push({ pred: res.pred, real: nota >= 2 });
    if (S.calib.length > 300) S.calib = S.calib.slice(-300);
  }
  L.combo = exito ? L.combo + 1 : 0;
  L.comboMax = Math.max(L.comboMax, L.combo);
  S.combosMax = Math.max(S.combosMax, L.combo);
  let xp = primera ? ({ 4: 12, 3: 10, 2: 6, 1: 0 }[nota]) : (exito ? 4 : 0);
  if (exito && L.combo >= 5 && L.combo % 5 === 0) xp += 5;
  if (primera) { L.primeras++; if (exito) L.primerasOk++; }
  const e = logHoy();
  e.n++; if (exito) e.bien++;
  S.totalResp++;
  ganarXP(xp); L.xp += xp;
  actualizarRacha();
  /* reaprendizaje sucesivo: lo fallado vuelve al final de la sesión
     (con un formato más asistido) hasta acertarlo, máx. 2 veces más */
  const reencolar = nota === 1 && a.en.intento < 2;
  L.cola.shift();
  if (reencolar) L.cola.push({ ...a.en, intento: a.en.intento + 1 });
  else L.hechos++;
  L.nuevosLogros.push(...revisarLogros());
  guardar();
  if (exito) { SND.bien(L.combo); vibrar(15); } else { SND.mal(); vibrar([40, 40, 40]); }
  FX.marcar($('.ses-ej'), exito ? 'ok' : 'mal');
  if (a.ej.manual) flashSiguiente(xp, info, reencolar);
  else mostrarHoja(res, nota, exito, xp, info, reencolar);
  celebrarCombo(exito);
}

/* Cada 5 aciertos seguidos: cartel, sonido y bono. El combo refuerza la
   racha de recuperación, pero cortarlo no se castiga: vuelve a 0 y listo. */
function celebrarCombo(exito) {
  const c = $('.ses-combo');
  if (c && exito && L.combo >= 2) { c.textContent = '🔥 ' + L.combo; c.classList.add('on', 'late'); c.classList.toggle('fuego', L.combo >= 10); }
  if (!exito || L.combo < 5 || L.combo % 5) return;
  const txt = L.combo >= 20 ? '¡Imparable!' : L.combo >= 15 ? '¡En llamas!' : L.combo >= 10 ? '¡Racha de fuego!' : '¡Combo!';
  setTimeout(() => {
    SND.combo(L ? L.combo : 5);
    FX.cartel(`<span class="cartel-num">🔥 ${L ? L.combo : ''}</span><span>${txt}</span><small>+5 XP de bono</small>`, 'cartel-combo');
    if (fxCompletos()) FX.chispas(innerWidth / 2, innerHeight * 0.4, { n: 26, dist: 140, colores: ['#f59e0b', '#ef4444', '#facc15', '#fb923c'] });
  }, 350);
}

const ELOGIOS = ['¡Correcto!', '¡Excelente!', '¡Muy bien!', '¡Eso es!', '¡Impecable!'];
function mostrarHoja(res, nota, exito, xp, info, reencolar) {
  const a = L.actual, it = a.en.it;
  const clase = exito ? 'ok' : nota === 2 ? 'parcial' : 'mal';
  const titulo = exito ? azar(ELOGIOS) : nota === 2 ? 'Casi: revisá lo marcado' : res.rendido ? 'Esta era la respuesta' : 'No era así';
  /* elaboración: siempre que hubo error; en aciertos, solo si es nuevo */
  const porque = (!exito || a.nuevo) ? ((it.ref && it.ref.porque) || res.explica || '') : '';
  let prox = '';
  if (reencolar) prox = 'Te la vuelvo a preguntar antes de terminar: acertarla una vez en la sesión es lo que la fija.';
  else if (info && info.ivl) prox = `Vuelve en <b>${fmtDias(info.ivl)}</b>, justo antes de que empiece a borrarse.`;
  const pie = $('.ses-pie');
  if (pie) pie.classList.add('oculto');
  const h = document.createElement('div');
  h.className = 'hoja ' + clase;
  h.setAttribute('role', 'status');
  h.setAttribute('aria-live', 'polite');
  h.innerHTML = `<div class="hoja-in">
    <div class="hoja-h">
      <span class="hoja-ico">${exito ? '✓' : nota === 2 ? '≈' : '✕'}</span>
      <b>${titulo}</b>
      ${xp ? `<span class="xp-pop">+${xp} XP</span>` : ''}
      ${L.combo >= 3 ? `<span class="combo-pop">🔥 ${L.combo}</span>` : ''}
    </div>
    ${res.sol ? `<div class="hoja-sol">${res.sol}</div>` : ''}
    ${porque ? `<div class="hoja-pq"><b>Por qué</b><p>${esc(porque)}</p></div>` : ''}
    ${prox ? `<p class="hoja-prox">${prox}</p>` : ''}
    ${it.ref && it.ref.pag ? `<p class="hoja-pag">📖 Ver manual: ${esc(it.ref.pag)}</p>` : ''}
    ${it.ref && it.ref.examen && typeof EXAMEN !== 'undefined' ? `<p class="hoja-pag">📝 Examen de ${esc(EXAMEN[it.ref.examen.ex].nom)} (${esc(EXAMEN[it.ref.examen.ex].fecha)})${it.ref.examen.n ? ', pregunta ' + it.ref.examen.n : ''}${it.ref.examen.formato ? ` · allá era «${esc(it.ref.examen.formato)}»` : ''}</p>` : ''}
    <button type="button" class="btn3d ${exito ? 'verde' : clase === 'parcial' ? 'naranja' : 'rojo'} ancho" id="continuar">Continuar</button>
  </div>`;
  $('.sesion').appendChild(h);
  if (exito) setTimeout(() => {
    FX.chispasEn($('.hoja-ico', h), { n: 14, dist: 60 });
    if (xp) FX.chispasEn($('.xp-pop', h), { n: 8, dist: 36, colores: ['#facc15', '#f59e0b'], tam: 6 });
  }, 120);
  const b = $('#continuar', h);
  b.onclick = continuar;
  setTimeout(() => b.focus({ preventScroll: true }), 40);
}

function flashSiguiente(xp, info, reencolar) {
  const msg = reencolar ? 'La vemos de nuevo antes de terminar' : info && info.ivl ? `Vuelve en ${fmtDias(info.ivl)}` : '';
  toast(`${xp ? `<b>+${xp} XP</b> · ` : ''}${msg}`, 'toast-suave');
  const token = L.actual;
  setTimeout(() => { if (L && L.actual === token) pintarEjercicio(); }, 650);
}
function continuar() { if (L) pintarEjercicio(); }

async function salirSesion() {
  if (L && L.hechos > 0 && !(await confirmar('¿Salir de la lección? Lo que respondiste ya quedó guardado; solo perdés el bono por terminar.', 'Salir', 'Seguir'))) return;
  L = null;
  document.body.classList.remove('en-sesion');
  ir(vistaPrevia);
}

function finSesion() {
  const dur = Math.round((Date.now() - L.inicio) / 1000);
  const precision = L.primeras ? L.primerasOk / L.primeras : 1;
  const perfecta = L.primeras > 0 && L.primerasOk === L.primeras;
  const bonus = 10 + (perfecta ? 10 : 0);
  ganarXP(bonus); L.xp += bonus;
  S.sesiones++;
  if (perfecta) S.perfectas++;
  L.nuevosLogros.push(...revisarLogros());
  guardar();
  const e = S.log[HOY()] || { xp: 0 };
  const metaPct = Math.min(1, (e.xp || 0) / S.cfg.meta);
  const metaRecien = e.metaOk && !L.metaAntes;
  const logros = [...new Set(L.nuevosLogros)].map(id => LOGROS.find(x => x.id === id)).filter(Boolean);
  const racha = rachaVigente(), rachaSube = racha > L.rachaAntes;
  const nivelNuevo = nivelDe(S.xp) > L.nivelAntes ? nivelDe(S.xp) : 0;
  const frase = perfecta ? 'Todo a la primera. Estos recuerdos van a espaciarse más.'
    : precision >= 0.7 ? 'Buen trabajo. Lo que costó es justo lo que más se fijó.'
    : 'Costó, y eso es buena señal: recuperar con esfuerzo deja más huella que acertar fácil.';
  const volver = vistaPrevia;
  const xpSes = L.xp, comboMax = L.comboMax;
  L = null;
  vista = 'finsesion';
  document.body.classList.add('en-sesion');
  app().innerHTML = `<div class="fin-ses">
    <div class="fin-trofeo"><span class="rayos"></span><span class="ico">${perfecta ? '💎' : precision >= 0.7 ? '🏅' : '🌱'}</span></div>
    <h1>${perfecta ? '¡Lección perfecta!' : '¡Lección completa!'}</h1>
    <p class="sub centro">${frase}</p>
    ${bloqueFinPJ()}
    <div class="fin-stats">
      <div class="fs xp"><small>XP</small><b data-cuenta="${xpSes}" data-pre="+">+${xpSes}</b></div>
      <div class="fs ok"><small>Precisión</small><b data-cuenta="${Math.round(precision * 100)}" data-suf=" %">${Math.round(precision * 100)} %</b></div>
      <div class="fs t"><small>Tiempo</small><b>${fmtTiempo(dur)}</b></div>
      <div class="fs fu"><small>Combo máx.</small><b>🔥 ${comboMax}</b></div>
    </div>
    <div class="fin-meta">
      <div class="anillo" style="--p:${metaPct}"><span data-cuenta="${Math.round(metaPct * 100)}" data-suf="%">${Math.round(metaPct * 100)}%</span></div>
      <div><b>${metaRecien ? '¡Meta diaria cumplida! 🎉' : 'Meta diaria'}</b>
      <p>${e.xp || 0} de ${S.cfg.meta} XP hoy · racha de <b class="${rachaSube ? 'racha-sube' : ''}">${racha} ${racha === 1 ? 'día' : 'días'}${rachaSube ? ' 🔥' : ''}</b></p></div>
    </div>
    ${logros.length ? `<div class="fin-logros"><h3>Logros nuevos</h3>${logros.map(l =>
      `<div class="logro-nuevo"><span>${l.ico}</span><div><b>${esc(l.nom)}</b><small>${esc(l.desc)}</small></div></div>`).join('')}</div>` : ''}
    <button type="button" class="btn3d verde ancho" id="finOk">Continuar</button>
  </div>`;
  SND.fin();
  confeti(perfecta ? 170 : 110);
  $$('[data-cuenta]').forEach((el, i) => setTimeout(() =>
    FX.contar(el, +el.dataset.cuenta, 900, el.dataset.suf || '', el.dataset.pre || ''), 250 + i * 120));
  if (rachaSube) setTimeout(SND.racha, 1100);
  $$('.logro-nuevo').forEach((el, i) => setTimeout(() => { el.classList.add('entra'); SND.logro(); }, 1300 + i * 500));
  if ($('.fin-pj.con-nuevos')) setTimeout(() => { SND.logro(); FX.chispasEn($('.fin-pj-av'), { n: 20, dist: 80 }); }, 900);
  if (nivelNuevo) setTimeout(() => FX.nivel(nivelNuevo, nombreNivel(nivelNuevo)), 1500 + logros.length * 500);
  $('#finOk').onclick = () => { document.body.classList.remove('en-sesion'); ir(volver); };
  setTimeout(() => { const b = $('#finOk'); if (b) b.focus({ preventScroll: true }); }, 50);
}

/* ============================================================
   VISTAS
   ============================================================ */

const app = () => $('#app');

function ir(v) {
  /* tocar "Sesiones" estando en una sesión vuelve a la lista */
  if (v === 'planes' && vista === 'planes') planAbierto = null;
  L = null;
  juegoMapa = null;
  vista = v;
  document.body.classList.remove('en-sesion');
  $$('.nav button').forEach(b => b.classList.toggle('on', b.dataset.v === (v === 'clase' ? 'practica' : v)));
  cerrarModal();
  window.scrollTo(0, 0);
  render();
}
function render() {
  ({ inicio: vInicio, practica: vPractica, mapa: vMapa, apuntes: vApuntes, perfil: vPerfil, estudio: vEstudio, clase: vClase, planes: vPlanes }[vista] || vInicio)();
  pintarHud();
}
function pintarHud() {
  document.documentElement.dataset.fx = fxCompletos() ? 'completos' : 'suaves';
  const h = $('#hud');
  if (!h) return;
  const r = rachaVigente(), n = nivelDe(S.xp);
  h.innerHTML = `
    <span class="hud-c fuego ${r ? 'on' : ''}" title="Racha: días seguidos estudiando">🔥 <b>${r}</b></span>
    <span class="hud-c xp" title="Experiencia total">⚡ <b>${S.xp}</b></span>
    <span class="hud-c nv" title="Nivel ${n}: ${esc(nombreNivel(n))}">Nv <b>${n}</b></span>`;
}
const estrellasHTML = n => `<span class="estrellas" aria-label="${n} de 3 estrellas">${'★'.repeat(n)}<span class="apagada">${'★'.repeat(3 - n)}</span></span>`;

/* --- INICIO --- */
function vInicio() {
  const due = vencidos().length;
  const e = S.log[HOY()] || { xp: 0 };
  const metaPct = Math.min(1, (e.xp || 0) / S.cfg.meta);
  const racha = rachaVigente();
  const enRiesgo = racha > 0 && S.ultimoDia !== HOY();
  const recomendada = UNIDADES.find(u => { const i = infoUnidad(u); return i.intro < i.total; });
  const manana = ITEMS.filter(i => S.items[i.id] && S.items[i.id].due === DIAS(1)).length;
  const offs = [0, 56, 84, 56, 0, -56, -84, -56];
  app().innerHTML = `
    ${tarjetaPJ()}
    <section class="meta-card">
      <div class="anillo grande" style="--p:${metaPct}"><span><b>${e.xp || 0}</b><small>/${S.cfg.meta} XP</small></span></div>
      <div class="meta-txt">
        <b>${metaPct >= 1 ? 'Meta de hoy cumplida ✓' : 'Meta de hoy'}</b>
        <p>${metaPct >= 1 ? 'Lo que sumes ahora es extra.' : `Te faltan ${S.cfg.meta - (e.xp || 0)} XP. Una lección son unos 80.`}</p>
        <p class="racha-txt ${enRiesgo ? 'riesgo' : ''}">${racha ? `🔥 ${racha} ${racha === 1 ? 'día' : 'días'} de racha${enRiesgo ? ' · estudiá hoy para mantenerla' : ''}` : 'Empezá hoy tu racha'}${S.protectores ? ` · 🛡️×${S.protectores}` : ''}</p>
      </div>
    </section>

    <section class="repaso-card ${due ? '' : 'aldia'}">
      ${due ? `<div><b>Repaso del día</b>
          <p>${due} ${due === 1 ? 'recuerdo está' : 'recuerdos están'} por bajar del ${Math.round(S.cfg.retencion * 100)} % de probabilidad de recordarse.</p></div>
          <button type="button" class="btn3d naranja" id="repasar">Repasar ${Math.min(due, S.cfg.sesion)}</button>`
        : `<div><b>Estás al día ✓</b>
          <p>${Object.keys(S.items).length ? `Mañana ${manana ? `vuelven ${manana}` : 'no vence nada'}. Seguí la ruta para sumar contenido nuevo.` : 'Empezá la ruta: cada lección presenta unos pocos conceptos nuevos.'}</p></div>`}
    </section>

    ${ejDelDiaHTML()}

    <h2 class="secc">Tu ruta</h2>
    <div class="ruta">
      ${UNIDADES.map((u, i) => {
        const inf = infoUnidad(u);
        const estado = inf.intro === 0 ? 'nueva' : inf.intro < inf.total ? 'curso' : 'vista';
        const rec = u === recomendada;
        return `<div class="nodo-wrap" style="--x:${offs[i % offs.length]}px">
          ${rec ? `<span class="globo">${inf.intro ? 'Seguí acá' : 'Empezá acá'}</span>` : ''}
          <button type="button" class="nodo ${estado} ${rec ? 'rec' : ''} ${inf.venc ? 'vence' : ''}" data-u="${u.id}" style="--p:${inf.intro / inf.total}" aria-label="${esc(u.nom)}">
            <span class="nodo-ico">${u.icono}</span>
            ${inf.venc ? `<span class="nodo-badge">${inf.venc}</span>` : ''}
          </button>
          ${estrellasHTML(inf.est)}
          <div class="nodo-nom">${esc(u.nom)}</div>
          ${inf.mem != null ? `<div class="nodo-mem">memoria ${Math.round(inf.mem * 100)} %</div>` : `<div class="nodo-mem">${inf.total} ejercicios</div>`}
        </div>`;
      }).join('')}
    </div>`;
  const r = $('#repasar');
  if (r) r.onclick = () => iniciarSesion('repaso', sesionRepaso(), 'Repaso del día');
  $('#pjCard').onclick = () => ir('estudio');
  $$('.nodo').forEach(b => b.onclick = () => hojaUnidad(UNIDADES.find(u => u.id === b.dataset.u)));
  conectarEjDelDia();
}
/* ejercicio del día: uno del manual por fecha, animado; se abre paso a paso */
function ejDelDia() {
  const con = BB.ejercicios.filter(e => POSES[e.id] && POSES[e.id].poses.length > 1);
  const d = Math.floor(new Date(HOY() + 'T12:00:00').getTime() / 864e5);
  return con[((d * 7) % con.length + con.length) % con.length];
}
function ejDelDiaHTML() {
  const e = ejDelDia();
  if (!e) return '';
  const a2 = MAT2.find(m => m.bb === e.id), a1 = e.analisis && MAT1.find(m => m.id === e.analisis);
  const obj = (a2 && a2.obj) || (a1 && a1.obj) || e.prop.slice(0, 2);
  return `<section class="dia-card" id="ejDia">
    <div class="dia-fig" aria-hidden="true"></div>
    <div class="dia-txt"><small>Ejercicio del día · ${esc(NOM_FUENTE[e.f])}</small><b>${esc(e.n)}</b>
      <p>${esc(obj.slice(0, 2).join(' · '))}</p>
      <button type="button" class="btn small" id="ejDiaVer">⤢ Verlo paso a paso</button></div>
  </section>`;
}
function conectarEjDelDia() {
  const c = $('#ejDia');
  if (!c) return;
  const e = ejDelDia();
  FIGURA.reproductor($('.dia-fig', c), { ...POSES[e.id], nom: e.n }, { fantasma: false, fluido: ritmoFluido(),
    resp: POSES[e.id].poses.map((_, k) => { const p = pasoDePose(POSES[e.id], (k + 1) % POSES[e.id].poses.length); return p > 0 && e.seq[p - 1] ? respDeFase(e.seq[p - 1].fase) : null; }) });
  $('#ejDiaVer').onclick = () => { SND.toque(); abrirVisorGrande(e); };
}

function hojaUnidad(u) {
  const inf = infoUnidad(u), sinVer = inf.total - inf.intro;
  const m = abrirModal(`
    <div class="mu-h"><span class="mu-ico">${u.icono}</span>
      <div><h3>${esc(u.nom)}</h3><p>${inf.intro} de ${inf.total} ejercicios vistos</p></div></div>
    <div class="mu-est">${estrellasHTML(inf.est)}</div>
    <div class="barra gruesa"><span style="width:${Math.round(100 * inf.intro / inf.total)}%"></span></div>
    ${inf.mem != null ? `<p class="mu-mem">Memoria estimada hoy: <b>${Math.round(inf.mem * 100)} %</b>${inf.venc ? ` · ${inf.venc} para repasar` : ''}</p>` : ''}
    <button type="button" class="btn3d verde ancho" id="muLec">${sinVer ? `Lección · ${Math.min(6, sinVer)} ${Math.min(6, sinVer) === 1 ? 'nuevo' : 'nuevos'}` : 'Repasar la unidad'}</button>
    <button type="button" class="btn ghost ancho" id="muApu">Ver los apuntes de esta unidad</button>
    <p class="micro">★ todo visto · ★★ todo estable a 7 días · ★★★ todo estable a 30 días</p>`);
  $('#muLec', m).onclick = () => iniciarSesion('leccion', sesionUnidad(u), u.nom);
  $('#muApu', m).onclick = () => { temaAbierto = u.temas[0]; ir('apuntes'); };
}

/* --- PRÁCTICA --- */
let practicaUnidad = '';
function vPractica() {
  app().innerHTML = `
    <h1 class="tit">Práctica libre</h1>
    <p class="sub">Elegí el formato. Variar la forma de recuperar un mismo contenido hace el recuerdo más flexible: no aprendés la tarjeta, aprendés el concepto. Todo lo que respondés acá también ajusta tus repasos.</p>
    <label class="sel-u">Unidad
      <select id="selU"><option value="">Todas</option>${UNIDADES.map(u =>
        `<option value="${u.id}" ${practicaUnidad === u.id ? 'selected' : ''}>${esc(u.nom)}</option>`).join('')}</select>
    </label>
    <button type="button" class="modo destacado" id="armaClase">
      <span class="modo-ico">🧩</span><b>Armá tu clase</b>
      <small>Diseñá una clase de Mat como en el examen. La app revisa lo mismo que la corrección: repeticiones exactas, orden de posiciones, transiciones y balance.</small>
      <i>lo que más puntos te costó en Mat 1 y Mat 2</i></button>
    <div class="modos">${Object.entries(MODOS).map(([k, m]) => {
      const n = m.gen ? null : poolModo(k, practicaUnidad).length;
      return `<button type="button" class="modo" data-m="${k}" ${n === 0 ? 'disabled' : ''}>
        <span class="modo-ico">${m.ico}</span><b>${m.nom}</b><small>${m.desc}</small>
        <i>${m.gen ? 'se genera al azar' : n + ' disponibles'}</i></button>`;
    }).join('')}</div>`;
  $('#selU').onchange = e => { practicaUnidad = e.target.value; vPractica(); };
  $('#armaClase').onclick = () => ir('clase');
  $$('.modo[data-m]').forEach(b => b.onclick = () =>
    iniciarSesion('practica', sesionPractica(b.dataset.m, practicaUnidad), MODOS[b.dataset.m].nom));
}

/* --- MAPA --- */
/* Lámina anatómica (mapa.js). Tocar un músculo muestra su nombre y su
   región; tocar un nombre de la lista lo señala en la figura. El juego
   "¿Dónde está?" es recuperación espacial: nombre → lugar. */
let regionSel = null, vistaMapa = 'frente', juegoMapa = null;
function vMapa() {
  app().innerHTML = `
    <h1 class="tit">Mapa corporal</h1>
    <p class="sub">Tocá un músculo para ver su nombre y qué región mueve. Nombre + lugar en el cuerpo son dos rutas hacia el mismo recuerdo: si una falla, la otra lo recupera.</p>
    <div class="mapa">
      <div class="figura">
        <div class="seg vistas-mapa" role="tablist">${[['frente', 'Frente'], ['espalda', 'Espalda']].map(([k, t]) =>
          `<button type="button" role="tab" data-vm="${k}" class="${vistaMapa === k ? 'on' : ''}" aria-selected="${vistaMapa === k}"><b>${t}</b></button>`).join('')}</div>
        <div class="lienzo" id="lienzo"></div>
        <p class="mapa-cap" id="mapaCap" aria-live="polite">Tocá un músculo</p>
        <p class="mapa-ley">Izquierda: capa superficial · Derecha: capa profunda<br>Pellizcá o tocá dos veces para acercar</p>
        <p class="mapa-cont">${S.mapa.length} de ${REGIONES.length} regiones exploradas</p>
      </div>
      <div class="detalle" id="detalle"></div>
    </div>`;
  $$('[data-vm]').forEach(b => b.onclick = () => { cambiarVistaMapa(b.dataset.vm); SND.flip(); });
  pintarLamina();
  pintarRegion();
}
function cambiarVistaMapa(v) {
  vistaMapa = v;
  $$('[data-vm]').forEach(b => { b.classList.toggle('on', b.dataset.vm === v); b.setAttribute('aria-selected', b.dataset.vm === v); });
  pintarLamina();
}
function pintarLamina() {
  const l = $('#lienzo');
  if (!l) return;
  l.innerHTML = LAMINA.svg(vistaMapa) + `<div class="zoom-bot">
      <button type="button" data-z="1.6" aria-label="Acercar">+</button>
      <button type="button" data-z="0.625" aria-label="Alejar">−</button>
      <button type="button" data-z="0" aria-label="Ver la figura entera">⟲</button></div>`;
  const svg = $('svg', l);
  const zoom = activarZoom(svg, l);
  svg.addEventListener('click', e => {
    if (zoom.arrastro()) return;
    const g = e.target.closest('[data-toca]');
    if (g) tocarForma(g);
  });
  svg.addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse' || juegoMapa) return;
    const g = e.target.closest('[data-toca]');
    $$('.f.hover', svg).forEach(x => x.classList.remove('hover'));
    if (g && !g.classList.contains('k-h')) g.classList.add('hover');
  });
  svg.addEventListener('pointerleave', () => $$('.f.hover', svg).forEach(x => x.classList.remove('hover')));
  resaltarRegion();
}
/* Zoom de la lámina: pellizcar con dos dedos, arrastrar cuando está
   ampliada, doble toque, rueda (con Ctrl o el pellizco del trackpad) y
   botones. Sin zoom, el dedo sigue desplazando la página. */
function activarZoom(svg, cont) {
  const VB = svg.viewBox.baseVal, W0 = VB.width, H0 = VB.height, MIN = W0 / 5;
  const vb = { x: 0, y: 0, w: W0, h: H0 };
  const ptrs = new Map();
  let movido = 0, previo = null, ultimoToque = 0;
  const aplicar = () => {
    vb.w = Math.min(W0, Math.max(MIN, vb.w)); vb.h = vb.w * H0 / W0;
    vb.x = Math.min(W0 - vb.w, Math.max(0, vb.x)); vb.y = Math.min(H0 - vb.h, Math.max(0, vb.y));
    svg.setAttribute('viewBox', `${vb.x.toFixed(1)} ${vb.y.toFixed(1)} ${vb.w.toFixed(1)} ${vb.h.toFixed(1)}`);
    const ampliada = vb.w < W0 - 0.5;
    svg.style.touchAction = ampliada ? 'none' : 'pan-y';
    cont.classList.toggle('ampliada', ampliada);
  };
  const aSVG = (cx, cy) => { const r = svg.getBoundingClientRect(); return { x: vb.x + (cx - r.left) / r.width * vb.w, y: vb.y + (cy - r.top) / r.height * vb.h }; };
  const zoomEn = (cx, cy, f) => {
    const p = aSVG(cx, cy), nw = Math.min(W0, Math.max(MIN, vb.w / f)), k = nw / vb.w;
    vb.x = p.x - (p.x - vb.x) * k; vb.y = p.y - (p.y - vb.y) * k; vb.w = nw;
    aplicar();
  };
  const centro = () => { const [a, b] = [...ptrs.values()]; return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, d: Math.hypot(a.x - b.x, a.y - b.y) }; };
  svg.addEventListener('pointerdown', e => {
    ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (ptrs.size === 1) movido = 0;
    if (ptrs.size === 2) previo = centro();
    /* doble toque: acercar (o volver al tamaño normal) */
    if (e.pointerType !== 'mouse' && ptrs.size === 1) {
      const t = performance.now();
      if (t - ultimoToque < 300) { if (vb.w < W0 - 0.5) { vb.w = W0; aplicar(); } else zoomEn(e.clientX, e.clientY, 2.5); movido = 99; ultimoToque = 0; }
      else ultimoToque = t;
    }
  });
  svg.addEventListener('pointermove', e => {
    if (!ptrs.has(e.pointerId)) return;
    const a = ptrs.get(e.pointerId), dx = e.clientX - a.x, dy = e.clientY - a.y;
    ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (ptrs.size === 2) {
      const c = centro();
      if (previo && previo.d > 0) {
        zoomEn(c.x, c.y, c.d / previo.d);
        const r = svg.getBoundingClientRect();
        vb.x -= (c.x - previo.x) / r.width * vb.w; vb.y -= (c.y - previo.y) / r.height * vb.h; aplicar();
      }
      previo = c; movido += 20; e.preventDefault();
    } else if (vb.w < W0 - 0.5 && (e.pointerType !== 'mouse' || e.buttons === 1)) {
      const r = svg.getBoundingClientRect();
      vb.x -= dx / r.width * vb.w; vb.y -= dy / r.height * vb.h; aplicar();
      movido += Math.abs(dx) + Math.abs(dy);
    }
  });
  const soltar = e => { ptrs.delete(e.pointerId); if (ptrs.size < 2) previo = null; };
  svg.addEventListener('pointerup', soltar);
  svg.addEventListener('pointercancel', soltar);
  svg.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') soltar(e); });
  svg.addEventListener('wheel', e => {
    if (!e.ctrlKey && vb.w >= W0 - 0.5) return;
    e.preventDefault();
    zoomEn(e.clientX, e.clientY, Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.002)));
  }, { passive: false });
  svg.addEventListener('dblclick', e => { if (vb.w < W0 - 0.5) { vb.w = W0; aplicar(); } else zoomEn(e.clientX, e.clientY, 2.5); });
  $$('.zoom-bot [data-z]', cont).forEach(b => b.onclick = () => {
    const f = +b.dataset.z, r = svg.getBoundingClientRect();
    if (!f) { vb.w = W0; aplicar(); } else zoomEn(r.left + r.width / 2, r.top + r.height / 2, f);
    SND.toque();
  });
  aplicar();
  return {
    arrastro: () => movido > 8,
    /* acerca la vista a una forma (al señalarla desde la lista) */
    enfocar(el) {
      const b = el.getBBox ? el.getBBox() : null;
      if (!b || vb.w >= W0 - 0.5) return;
      vb.x = b.x + b.width / 2 - vb.w / 2; vb.y = b.y + b.height / 2 - vb.h / 2; aplicar();
    }
  };
}
function resaltarRegion() {
  const svg = $('#lienzo svg');
  if (!svg) return;
  svg.classList.toggle('hay-sel', !!regionSel && !juegoMapa);
  $$('.f[data-toca]', svg).forEach(g => {
    const f = LAMINA.buscar(vistaMapa, g.dataset.id);
    g.classList.toggle('sel', !juegoMapa && !!regionSel && f.r.includes(regionSel));
  });
}
/* señala en la figura todas las formas de un nombre (cambia de vista si hace falta) */
function focoNombre(nom, silencio) {
  const todas = LAMINA.conNombre(nom);
  if (!todas.length) return false;
  if (!todas.some(x => x.v === vistaMapa)) cambiarVistaMapa(todas[0].v);
  const ids = todas.filter(x => x.v === vistaMapa).map(x => x.f.id);
  $$('#lienzo .f.foco').forEach(g => g.classList.remove('foco'));
  ids.forEach(id => { const g = $(`#lienzo [data-id="${id}"]`); if (g) g.classList.add('foco'); });
  if (!silencio) capMapa(LAMINA.buscar(vistaMapa, ids[0]));
  return true;
}
function capMapa(f, extra = '') {
  const c = $('#mapaCap');
  if (!c) return;
  if (!f) { c.innerHTML = juegoMapa ? `🎯 Tocá: <b class="obj-cap">${esc(juegoMapa.cola[juegoMapa.i])}</b>` : 'Tocá un músculo'; return; }
  const regs = f.r.map(id => REGIONES.find(r => r.id === id).nom);
  c.innerHTML = `<b>${esc(f.nom)}</b>${regs.length ? ` · ${regs.map(esc).join(', ')}` : f.k === 'n' ? ' · <span class="nada">no está en tus apuntes</span>' : ''}${extra}`;
}
function explorar(id) {
  if (S.mapa.includes(id)) return;
  S.mapa.push(id);
  const c = $('.mapa-cont');
  if (c) c.textContent = `${S.mapa.length} de ${REGIONES.length} regiones exploradas`;
  anunciarLogros(revisarLogros());
  guardar();
}
function tocarForma(g) {
  const f = LAMINA.buscar(vistaMapa, g.dataset.id);
  if (!f) return;
  if (juegoMapa) { responderJuego(f, g); return; }
  SND.toque();
  $$('#lienzo .f.foco').forEach(x => x.classList.remove('foco'));
  g.classList.add('foco');
  capMapa(f);
  if (f.r.length) {
    if (!f.r.includes(regionSel)) regionSel = f.r[0];
    explorar(regionSel);
    resaltarRegion();
    pintarRegion(f.m);
  }
}
function pintarRegion(marcados = []) {
  const d = $('#detalle');
  if (!d) return;
  if (juegoMapa) { pintarJuego(); return; }
  const chips = `<div class="reg-chips">${REGIONES.map(r =>
    `<button type="button" class="chip-reg ${r.id === regionSel ? 'on' : ''} ${S.mapa.includes(r.id) ? 'vista' : ''}" data-reg="${r.id}">${esc(r.nom)}</button>`).join('')}</div>`;
  const r = REGIONES.find(x => x.id === regionSel);
  d.innerHTML = chips + (r ? `<h3>${esc(r.nom)}</h3>
    ${r.grupos.map(g => `<div class="grupo"><h4>${esc(g.acc)}</h4>
      <ul>${g.m.map(m => {
        const hay = LAMINA.conNombre(m), oculto = hay.length && hay.every(x => x.f.k === 'h');
        return `<li${hay.length ? ` class="senalable${marcados.includes(m) ? ' marcado' : ''}" data-nom="${esc(m)}" tabindex="0" role="button"` : ''}>${esc(m)}${oculto ? ' <small class="prof-tag">profundo</small>' : ''}</li>`;
      }).join('')}</ul></div>`).join('')}
    <div class="fila"><button type="button" class="btn ghost small" id="tapar">Ocultar y recitar</button>
    <button type="button" class="btn small" id="juegoMapa">🎯 ¿Dónde está?</button></div>`
    : `<p class="vacio">Elegí una región o tocá un músculo en la figura.</p>
       <button type="button" class="btn ancho" id="juegoMapa">🎯 Jugar: ¿Dónde está?</button>
       <p class="micro">Te nombro un músculo y lo buscás en la figura. Encontrar el lugar a partir del nombre es otra forma de recuperar.</p>`);
  $$('.chip-reg', d).forEach(b => b.onclick = () => {
    regionSel = b.dataset.reg; explorar(regionSel); SND.toque();
    capMapa(null);
    /* muestra la vista donde está la región */
    const enVista = v => LAMINA.FORMAS[v].some(f => f.k !== 'h' && f.r.includes(regionSel));
    if (!enVista(vistaMapa)) cambiarVistaMapa(vistaMapa === 'frente' ? 'espalda' : 'frente');
    else { $$('#lienzo .f.foco').forEach(x => x.classList.remove('foco')); resaltarRegion(); }
    pintarRegion();
  });
  $$('li[data-nom]', d).forEach(li => {
    const senalar = () => {
      SND.toque();
      $$('li.marcado', d).forEach(x => x.classList.remove('marcado'));
      li.classList.add('marcado');
      focoNombre(li.dataset.nom);
      if (matchMedia('(max-width:700px)').matches) $('#lienzo').scrollIntoView({ behavior: 'smooth', block: 'center' });
    };
    li.onclick = senalar;
    li.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); senalar(); } };
  });
  const t = $('#tapar', d);
  if (t) t.onclick = () => {
    const uls = $$('#detalle .grupo ul');
    uls.forEach(u => u.classList.toggle('oculto'));
    t.textContent = uls[0].classList.contains('oculto') ? 'Mostrar respuestas' : 'Ocultar y recitar';
  };
  $('#juegoMapa', d).onclick = iniciarJuegoMapa;
}

/* --- juego ¿Dónde está? --- */
function iniciarJuegoMapa() {
  /* solo músculos que se ven en alguna vista */
  const nombres = [...new Set(Object.values(LAMINA.FORMAS).flat().filter(f => f.k === 'm').flatMap(f => f.m))];
  const pref = regionSel ? nombres.filter(n => LAMINA.conNombre(n).some(x => x.f.r.includes(regionSel))) : [];
  const base = pref.length >= 6 ? pref : nombres;
  juegoMapa = { cola: mezclar(base).slice(0, 10), i: 0, ok: 0, racha: 0, bloqueo: false };
  SND.abrir();
  capMapa(null);
  $$('#lienzo .f.foco').forEach(x => x.classList.remove('foco'));
  resaltarRegion();
  pintarJuego();
  capMapa(null);
  if (matchMedia('(max-width:700px)').matches) $('.figura').scrollIntoView({ behavior: 'smooth', block: 'start' });
}
function pintarJuego() {
  const j = juegoMapa, d = $('#detalle');
  if (!d || !j) return;
  d.innerHTML = `<div class="juego-m">
    <p class="juego-n">${j.i + 1} / ${j.cola.length} · ✓ ${j.ok}${j.racha >= 3 ? ` · 🔥 ${j.racha}` : ''}</p>
    <p class="juego-p">Tocá en la figura:</p>
    <p class="juego-obj">${esc(j.cola[j.i])}</p>
    <p class="micro">Si no está en esta vista, girá la figura con <b>Frente / Espalda</b>.</p>
    <div class="fila"><button type="button" class="btn ghost small" id="jSaltar">No sé</button>
    <button type="button" class="btn ghost small" id="jSalir">Terminar</button></div></div>`;
  $('#jSaltar').onclick = () => responderJuego(null);
  $('#jSalir').onclick = finJuegoMapa;
}
function responderJuego(f, g) {
  const j = juegoMapa;
  if (!j || j.bloqueo) return;
  const obj = j.cola[j.i];
  const bien = !!f && !!f.m && f.m.includes(obj);
  j.bloqueo = true;
  if (bien) {
    j.ok++; j.racha++;
    SND.bien(j.racha); vibrar(15);
    g.classList.add('foco', 'acierto');
    FX.chispasEn(g, { n: 14, dist: 50 });
    capMapa(f, ' ✓');
    ganarXP(2); guardar(); pintarHud();
  } else {
    j.racha = 0;
    SND.mal(); vibrar([40, 40, 40]);
    if (g) { g.classList.add('error-m'); setTimeout(() => g.classList.remove('error-m'), 700); }
    const donde = LAMINA.conNombre(obj);
    const otraVista = !donde.some(x => x.v === vistaMapa);
    setTimeout(() => {
      if (juegoMapa !== j) return;
      focoNombre(obj, true);
      capMapa(donde.find(x => x.v === vistaMapa).f, f ? ` <span class="nada">(tocaste: ${esc(f.nom)})</span>` : '');
      if (otraVista) toast(`Estaba en la vista de ${vistaMapa === 'frente' ? 'frente' : 'espalda'}`, 'toast-suave');
    }, g ? 350 : 0);
  }
  setTimeout(() => {
    if (juegoMapa !== j) return;
    $$('#lienzo .f.foco, #lienzo .f.acierto').forEach(x => x.classList.remove('foco', 'acierto'));
    j.bloqueo = false;
    j.i++;
    if (j.i >= j.cola.length) finJuegoMapa();
    else { pintarJuego(); capMapa(null); }
  }, bien ? 1100 : 2400);
}
function finJuegoMapa() {
  const j = juegoMapa;
  juegoMapa = null;
  if (j && j.i > 0) {
    toast(`🎯 Encontraste ${j.ok} de ${j.i} · +${j.ok * 2} XP`);
    if (j.ok >= 8) { SND.fin(); confeti(); }
  }
  $$('#lienzo .f.foco').forEach(x => x.classList.remove('foco'));
  capMapa(null);
  resaltarRegion();
  pintarRegion();
}

/* --- APUNTES --- */
let temaAbierto = null;
let pestanaApuntes = 'tarjetas';
function vApuntes() {
  const pestanas = [['tarjetas', 'Tarjetas'], ['repertorio', `Repertorio · ${BB.ejercicios.length}`], ['familias', 'Familias'], ['premat', `Pre-Pilates · ${PREMAT.length}`],
    ['manual', 'Manual'], ['posiciones', 'Posiciones'], ['examenes', 'Tus exámenes']];
  if (pestanaApuntes === 'mat1') pestanaApuntes = 'repertorio';
  app().innerHTML = `
    <h1 class="tit">Apuntes</h1>
    <p class="sub">Tus apuntes y fichas. Usalos para reparar lo que falló, no para releer de corrido: releer se siente productivo y casi no deja huella.</p>
    <div class="seg pestanas" role="tablist">${pestanas.map(([k, t]) =>
      `<button type="button" role="tab" aria-selected="${pestanaApuntes === k}" class="${pestanaApuntes === k ? 'on' : ''}" data-p="${k}"><b>${t}</b></button>`).join('')}</div>
    <input class="buscador" id="q" type="search" placeholder="${{ tarjetas: 'Buscar músculo, ejercicio, concepto…', manual: 'Buscar en el manual…', posiciones: 'Buscar posición…', examenes: 'Buscar en tus exámenes…', familias: 'Buscar ejercicio, posición, objetivo…' }[pestanaApuntes] || 'Buscar ejercicio, posición, accesorio…'}" aria-label="Buscar">
    <div id="lista"></div>`;
  $$('.pestanas button').forEach(b => b.onclick = () => { pestanaApuntes = b.dataset.p; vApuntes(); });
  const activa = $('.pestanas .on');
  if (activa) activa.scrollIntoView({ inline: 'center', block: 'nearest' });
  const pintar = { tarjetas: pintarApuntes, repertorio: pintarRepertorio, familias: pintarFamilias, premat: pintarPremat, manual: pintarManual, posiciones: pintarPosiciones, examenes: pintarExamenes }[pestanaApuntes];
  $('#q').oninput = () => pintar($('#q').value);
  pintar('');
  if (temaAbierto && pestanaApuntes === 'tarjetas') setTimeout(() => { const a = $('.acord.open'); if (a) a.scrollIntoView({ block: 'start' }); }, 30);
}

/* --- REPERTORIO (Mat 1 y Mat 2 del manual, con animación) --- */
const NIVELES_EJ = ['Principiante', 'Intermedio', 'Avanzado', 'Súper avanzado'];
const nivelBase = n => NIVELES_EJ.find(x => norm(n || '').startsWith(norm(x))) || (/todos/i.test(n || '') ? 'Principiante' : '');
const OSTEO_TXT = { evitar: 'Evitar con osteoporosis', apto: 'Apto con osteoporosis', modificar: 'Osteoporosis: solo modificado' };
const PREC_NOM = k => k.split('_').map(p => ({ muneca: 'muñeca', lumbar: 'zona lumbar', sacroiliaca: 'sacroilíaca', flexores: 'flexores', cuello: 'cuello', hombro: 'hombro', codo: 'codo', cadera: 'cadera', rodilla: 'rodilla', pie: 'pie', espalda: 'espalda', cadera_lumbar: 'cadera y zona lumbar' }[p] || p)).join(', ').replace('flexores, cadera', 'flexores de cadera').replace(/, ([^,]+)$/, ' y $1');
let filtroRep = { f: '', nivel: '', osteo: false };
/* paso de la secuencia que ilustra cada pose */
const pasoDePose = (ej, i) => ej.poses[i].s != null ? ej.poses[i].s : i;
function faseHTML(e, paso) {
  if (paso === 0) return `<span class="fase-chip ini">Posición inicial</span><p>${esc(e.inicial)}</p>`;
  const s = e.seq[paso - 1];
  if (!s) return '';
  const cl = /inhala.*exhala|continuo/i.test(s.fase) ? 'ambas' : /inhala/i.test(s.fase) ? 'inhala' : /exhala/i.test(s.fase) ? 'exhala' : 'ambas';
  return `<span class="fase-chip ${cl}">${esc(s.fase)}</span><p>${esc(s.accion)}</p>`;
}
function fichaRepHTML(e) {
  const ej = POSES[e.id];
  const ico = ej ? FIGURA.svgEstatico(ej, Math.floor(ej.poses.length / 2)) : '';
  const prec = Object.entries(e.prec || {});
  return `<details class="ficha-rep" data-ej="${e.id}">
    <summary><span class="rep-mini">${ico}</span>
      <span class="rep-t"><b>${esc(e.n)}</b><small>${esc(NOM_FUENTE[e.f])} · ${esc(BB.nomPos[e.pos] || '')} · ${esc(e.nivel)}</small></span>
      ${e.osteo ? `<span class="pill osteo-${e.osteo}" title="${esc(e.osteoTxt || '')}">${e.osteo === 'evitar' ? '🦴✕' : e.osteo === 'apto' ? '🦴✓' : '🦴~'}</span>` : ''}</summary>
    <div class="rep-cuerpo">
      ${ej ? visorHTML(e) : ''}
      <ol class="rep-pasos">
        <li data-paso="0"><b>Posición inicial</b> ${esc(e.inicial)}</li>
        ${e.seq.map((s, i) => `<li data-paso="${i + 1}"><b>${esc(s.fase)}</b> ${esc(s.accion)}</li>`).join('')}
      </ol>
      <dl>
        <dt>Nivel</dt><dd>${esc(e.nivel || '—')}</dd>
        <dt>Repeticiones</dt><dd>${esc(e.reps || '—')}</dd>
        ${e.optima ? `<dt>Forma óptima</dt><dd>${esc(e.optima)}</dd>` : ''}
        ${e.indic.length ? `<dt>Indicaciones</dt><dd><ul>${e.indic.map(x => `<li>${esc(x)}</li>`).join('')}</ul></dd>` : ''}
        ${e.prop.length ? `<dt>Propósito</dt><dd><ul>${e.prop.map(x => `<li>${esc(x)}</li>`).join('')}</ul></dd>` : ''}
        ${prec.length || e.osteoTxt ? `<dt>Precauciones</dt><dd><ul>${prec.map(([k, v]) => `<li><b>${esc(PREC_NOM(k))}:</b> ${esc(v)}</li>`).join('')}
          ${e.osteoTxt ? `<li class="osteo-li osteo-${e.osteo}"><b>Osteoporosis:</b> ${esc(e.osteoTxt)}</li>` : ''}</ul></dd>` : ''}
        ${e.var.length ? `<dt>Variantes</dt><dd><ul>${e.var.map(v => `<li><b>${esc(v.nombre)}</b>${v.descripcion ? ` — ${esc(v.descripcion)}` : ''}</li>`).join('')}</ul></dd>` : ''}
        ${e.trans ? `<dt>Transición</dt><dd>${esc(e.trans)}</dd>` : ''}
      </dl>
      ${e.analisis && MAT1.find(m => m.id === e.analisis) ? `<div class="rep-analisis"><h5>Tu análisis MAT 1 (accesorios, regresiones y progresiones)</h5>${fichaMat1HTML(MAT1.find(m => m.id === e.analisis))}</div>` : ''}
      ${MAT2.filter(m => m.bb === e.id).map(m => `<div class="rep-analisis"><h5>Tu análisis MAT 2${MAT2.filter(x => x.bb === e.id).length > 1 ? ` · ${esc(m.n)}` : ''} (accesorios, regresiones y progresiones)</h5>${fichaMat2HTML(m)}</div>`).join('')}
      <p class="pag-manual">📖 Ver manual: ${esc(pagManual(e.f, e.pag))}</p>
    </div>
  </details>`;
}
/* --- visor de animación: reproducir, paso a paso, deslizador, cámara lenta y capas --- */
const respDeFase = fase => /inhala.*exhala|continuo/i.test(fase || '') ? 'ambas' : /inhala/i.test(fase || '') ? 'inhala' : /exhala/i.test(fase || '') ? 'exhala' : null;
/* fotos de "Mat 3 Props" (privado/fotos-mat3.js, fuera del repo): agrupadas por prop */
const fotosDe = id => (typeof FOTOS_MAT3 !== 'undefined' && FOTOS_MAT3[id]) || null;
function fotosHTML(F) {
  const grupos = [];
  F.fotos.forEach((f, k) => { let g = grupos.find(x => x.prop === f.prop); if (!g) grupos.push(g = { prop: f.prop, fotos: [] }); g.fotos.push({ ...f, k }); });
  return grupos.map(g => `<div class="vf-prop"><h5>${esc(g.prop || 'Sin prop')}</h5>${F.props[g.prop] ? `<p>${esc(F.props[g.prop])}</p>` : ''}
    <div class="vf-grid">${g.fotos.map(f => `<button type="button" class="vf-foto" data-foto="${f.k}" aria-label="Ampliar: ${esc(F.nombre)} con ${esc(g.prop)}"><img src="${f.src}" alt="${esc(F.nombre)} con ${esc(g.prop)}" loading="lazy" width="${f.w}" height="${f.h}"></button>`).join('')}</div></div>`).join('')
    + (F.observaciones ? `<p class="vf-obs"><b>Observaciones de tu planilla:</b> ${esc(F.observaciones)}</p>` : '')
    + '<p class="micro">Fotos de tu planilla Mat 3 Props: el mismo ejercicio con cada prop. Las caras de quienes miran la clase están pixeladas.</p>';
}
function verFoto(F, k) {
  let d = $('#foto-grande');
  if (!d) {
    d = document.createElement('dialog'); d.id = 'foto-grande'; d.className = 'foto-grande';
    d.innerHTML = '<button type="button" class="fg-cerrar" aria-label="Cerrar">✕</button><img alt=""><p></p>';
    document.body.appendChild(d);
    $('.fg-cerrar', d).onclick = () => d.close();
    d.addEventListener('click', ev => { if (ev.target === d) d.close(); });
  }
  const f = F.fotos[k];
  $('img', d).src = f.src; $('img', d).alt = `${F.nombre} con ${f.prop}`; $('p', d).textContent = `${F.nombre} · ${f.prop}`;
  d.showModal();
}
function visorHTML(e, grande = false) {
  const ej = POSES[e.id], n = ej.poses.length, F = fotosDe(e.id);
  const marcas = ej.poses.map((_, k) => `<i style="left:${(k / n * 100).toFixed(2)}%"></i>`).join('');
  return `<div class="visor${grande ? ' grande' : ''}">
    ${F ? `<div class="visor-modo" role="group" aria-label="Ver"><button type="button" data-modo="anim" aria-pressed="true">Animación</button><button type="button" data-modo="fotos" aria-pressed="false">📷 Fotos con props <small>${F.fotos.length}</small></button></div>
    <div class="visor-fotos" hidden></div>` : ''}
    <div class="visor-anim">
    <div class="rep-fig" aria-live="off"></div>
    <div class="rep-fase" aria-live="polite"></div>
    ${n > 1 ? `<label class="visor-tl"><span class="sr">Recorrer el movimiento</span><span class="tl-marcas" aria-hidden="true">${marcas}</span>
      <input type="range" min="0" max="${n}" step="0.002" value="0"></label>
    <div class="rep-ctrl">
      <button type="button" class="btn small ghost" data-acc="ant" aria-label="Paso anterior">◀</button>
      <button type="button" class="btn small" data-acc="play" aria-label="Pausar o reproducir">⏸</button>
      <button type="button" class="btn small ghost" data-acc="sig" aria-label="Paso siguiente">▶</button>
      <span class="vel" role="group" aria-label="Velocidad">${[[1, '1×'], [0.5, '½×'], [0.25, '¼×']].map(([v, t]) =>
        `<button type="button" class="chip-vel${v === 1 ? ' on' : ''}" data-vel="${v}" aria-pressed="${v === 1}">${t}</button>`).join('')}</span>
      ${grande ? '' : '<button type="button" class="btn small ghost" data-acc="grande" aria-label="Ver en grande, paso a paso">⤢</button>'}
    </div>` : ''}
    <div class="visor-capas">
      ${n > 1 ? `<span class="vel" role="group" aria-label="Ritmo">${[['fluido', 'Fluido'], ['pasos', 'Por pasos']].map(([r, t]) =>
        `<button type="button" class="chip-vel${(r === 'fluido') === ritmoFluido() ? ' on' : ''}" data-ritmo="${r}" aria-pressed="${(r === 'fluido') === ritmoFluido()}">${t}</button>`).join('')}</span>` : ''}
      ${n > 1 ? '<button type="button" class="chip-capa" data-capa="tray" aria-pressed="false">〰️ Trayectoria</button>' : ''}
      <button type="button" class="chip-capa" data-capa="fisica" aria-pressed="false">⚖️ Centro de masa</button>
      ${n > 1 ? '<button type="button" class="chip-capa on" data-capa="fantasma" aria-pressed="true">👻 Hacia dónde va</button>' : ''}
    </div>
    ${n > 1 ? '<div class="visor-tira" role="list"></div>' : ''}
    </div>
  </div>`;
}
/* ritmo de las animaciones: fluido (frena solo donde el movimiento empieza o
   termina) o por pasos (frena en cada paso del manual); se recuerda en este navegador */
function ritmoFluido() { try { return localStorage.getItem('anatoapp.ritmo') !== 'pasos'; } catch { return true; } }
function guardarRitmo(fluido) { try { localStorage.setItem('anatoapp.ritmo', fluido ? 'fluido' : 'pasos'); } catch { /* sin almacenamiento */ } }
/* conecta un visor; pasos = <li data-paso> de la lista de pasos (opcional) */
function activarVisor(raiz, e, pasos = []) {
  const ej = POSES[e.id], n = ej.poses.length, fig = $('.rep-fig', raiz), fase = $('.rep-fase', raiz);
  const bPlay = $('[data-acc="play"]', raiz), rango = $('.visor-tl input', raiz), tiraEl = $('.visor-tira', raiz);
  /* respiración de cada transición: la del paso al que se llega */
  const resp = ej.poses.map((_, k) => { const p = pasoDePose(ej, (k + 1) % n); return p > 0 && e.seq[p - 1] ? respDeFase(e.seq[p - 1].fase) : null; });
  let arrastrando = false, mostrado = -1;
  const marcar = p => {
    if (p === mostrado) return;
    mostrado = p;
    pasos.forEach(li => li.classList.toggle('on', +li.dataset.paso === p));
    fase.innerHTML = faseHTML(e, p);
  };
  const tiraOn = k => tiraEl && $$('.tira-p', tiraEl).forEach(b => { b.classList.toggle('on', +b.dataset.k === k); b.setAttribute('aria-current', +b.dataset.k === k ? 'step' : 'false'); });
  const rep = FIGURA.reproductor(fig, ej, {
    resp, capas: { fantasma: n > 1 }, fluido: ritmoFluido(),
    alCambiar: i => { marcar(pasoDePose(ej, i)); tiraOn(i); },
    alAvanzar: pos => {
      if (rango && !arrastrando) rango.value = pos;
      /* en movimiento se muestra el paso que se está haciendo (el de la pose a la que va) */
      const i = Math.floor(pos), f = pos - i;
      if (f > 0.02) marcar(pasoDePose(ej, (i + 1) % n));
    }
  });
  const icono = () => { if (bPlay) bPlay.textContent = rep.enBucle ? '⏸' : '▶︎'; };
  if (bPlay) bPlay.onclick = () => { arrastrando = false; if (rep.enBucle) rep.pausar(); else rep.reanudar(); icono(); SND.toque(); };
  const sig = $('[data-acc="sig"]', raiz), ant = $('[data-acc="ant"]', raiz);
  if (sig) sig.onclick = () => { arrastrando = false; rep.siguiente(); icono(); SND.toque(); };
  if (ant) ant.onclick = () => { arrastrando = false; rep.anterior(); icono(); SND.toque(); };
  if (rango) {
    rango.oninput = () => { arrastrando = true; rep.irA(+rango.value % n); icono(); };
    ['change', 'pointerup', 'touchend', 'keyup', 'blur'].forEach(ev => rango.addEventListener(ev, () => { arrastrando = false; }));
  }
  $$('[data-vel]', raiz).forEach(b => b.onclick = () => {
    rep.velocidad = +b.dataset.vel;
    $$('[data-vel]', raiz).forEach(x => { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', x === b); });
    SND.toque();
  });
  $$('[data-ritmo]', raiz).forEach(b => b.onclick = () => {
    const fl = b.dataset.ritmo === 'fluido';
    rep.fluido = fl; guardarRitmo(fl);
    $$('[data-ritmo]', raiz).forEach(x => { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', x === b); });
    SND.toque();
  });
  $$('[data-capa]', raiz).forEach(b => b.onclick = () => {
    const on = !b.classList.contains('on');
    b.classList.toggle('on', on); b.setAttribute('aria-pressed', on);
    rep.capa(b.dataset.capa, on); SND.toque();
  });
  if (tiraEl) {
    const mini = FIGURA.tira(ej);
    tiraEl.innerHTML = mini.map((svg, k) => { const p = pasoDePose(ej, k);
      const cl = p > 0 && e.seq[p - 1] ? respDeFase(e.seq[p - 1].fase) || '' : 'ini';
      return `<button type="button" class="tira-p ${cl}" data-k="${k}" role="listitem" aria-label="${p ? 'Paso ' + p : 'Posición inicial'}">${svg}<b>${p ? p : '0'}</b></button>`; }).join('');
    $$('.tira-p', tiraEl).forEach(b => b.onclick = () => { rep.ir(+b.dataset.k); icono(); SND.toque(); });
    tiraOn(0);
  }
  /* tocar un paso de la lista lleva la figura a esa pose */
  pasos.forEach(li => li.onclick = () => {
    const k = ej.poses.findIndex((_, i) => pasoDePose(ej, i) === +li.dataset.paso);
    if (k >= 0) { rep.ir(k); icono(); SND.toque(); }
  });
  const gr = $('[data-acc="grande"]', raiz);
  if (gr) gr.onclick = () => { rep.pausar(); icono(); abrirVisorGrande(e); };
  /* Animación ↔ Fotos con props (las fotos se arman recién al abrirlas) */
  const F = fotosDe(e.id), vf = $('.visor-fotos', raiz), va = $('.visor-anim', raiz);
  if (F && vf) $$('[data-modo]', raiz).forEach(b => b.onclick = () => {
    const fotos = b.dataset.modo === 'fotos';
    $$('[data-modo]', raiz).forEach(x => x.setAttribute('aria-pressed', x === b));
    if (fotos && !vf.childElementCount) { vf.innerHTML = fotosHTML(F); $$('.vf-foto', vf).forEach(x => x.onclick = () => verFoto(F, +x.dataset.foto)); }
    vf.hidden = !fotos; va.hidden = fotos;
    if (fotos) rep.pausar(); else rep.reanudar();
    icono(); SND.toque();
  });
  return rep;
}
/* el visor en grande: la figura arriba y los pasos del manual debajo */
function abrirVisorGrande(e) {
  const m = abrirModal(`<div class="visor-modal">
    <div class="vm-cab"><h3>${esc(e.n)}</h3><button type="button" class="btn small ghost" data-cerrar aria-label="Cerrar">✕</button></div>
    ${visorHTML(e, true)}
    <ol class="rep-pasos">
      <li data-paso="0"><b>Posición inicial</b> ${esc(e.inicial)}</li>
      ${e.seq.map((x, i) => `<li data-paso="${i + 1}"><b>${esc(x.fase)}</b> ${esc(x.accion)}</li>`).join('')}
    </ol>
    <p class="micro">◀ ▶ hacen un paso por vez. Arrastrá la barra para ver cualquier instante del movimiento; con ¼× va en cámara lenta. ⚖️ muestra el centro de masa: si cae sobre la base de apoyo (verde) la posición se sostiene.</p>
  </div>`);
  m.classList.add('modal-visor');
  const rep = activarVisor(m, e, $$('.rep-pasos li', m));
  const cerrar = () => { rep.destruir(); cerrarModal(); };
  $('[data-cerrar]', m).onclick = cerrar;
  m.addEventListener('click', ev => { if (ev.target === m) rep.destruir(); });
}
/* un reproductor por ficha abierta; se destruye al cerrarla */
function activarFichaRep(d) {
  const e = EJ_BB[d.dataset.ej];
  llenarMinis(d);
  if (!POSES[e.id] || !$('.visor', d)) return;
  d._rep = activarVisor($('.visor', d), e, $$('.rep-pasos li', d));
}
function conectarFichasRep(cont) {
  $$('.ficha-rep', cont).forEach(d => d.addEventListener('toggle', () => {
    if (d.open) activarFichaRep(d);
    else if (d._rep) { d._rep.destruir(); d._rep = null; }
  }));
}
function pintarRepertorio(filtro) {
  const cont = $('#lista');
  if (filtro != null) filtroRep.f = filtro;
  const f = norm(filtroRep.f);
  const hits = BB.ejercicios.filter(e =>
    (!f || f.length < 2 || norm([e.n, e.inicial, e.nivel, ...e.prop, ...e.indic].join(' ')).includes(f)) &&
    (!filtroRep.nivel || nivelBase(e.nivel) === filtroRep.nivel) &&
    (!filtroRep.osteo || e.osteo === 'apto' || e.osteo === 'modificar'));
  const chips = `<div class="filtros-rep">
    ${['', ...NIVELES_EJ].map(n => `<button type="button" class="chip-reg ${filtroRep.nivel === n ? 'on' : ''}" data-nivel="${n}">${n || 'Todos los niveles'}</button>`).join('')}
    <button type="button" class="chip-reg ${filtroRep.osteo ? 'on' : ''}" data-osteo="1">🦴 Apto o modificado con osteoporosis</button>
  </div>
  <p class="micro">Tocá un ejercicio para ver la animación: cada fase muestra si se inhala o se exhala (el tórax se expande al inhalar). Con ◀ ▶ vas paso a paso, la barra recorre el movimiento, ¼× es cámara lenta y ⤢ lo abre en grande. El orden es el del manual.</p>`;
  cont.innerHTML = chips + (hits.length ? ['mat1', 'mat2'].map(fu => {
    const xs = hits.filter(e => e.f === fu);
    return xs.length ? `<h3 class="grupo-t">${NOM_FUENTE[fu]} <i>${xs.length}</i></h3>${xs.map(fichaRepHTML).join('')}` : '';
  }).join('') : '<p class="vacio">Ningún ejercicio con esos filtros.</p>');
  $$('[data-nivel]', cont).forEach(b => b.onclick = () => { filtroRep.nivel = b.dataset.nivel; pintarRepertorio(); });
  $$('[data-osteo]', cont).forEach(b => b.onclick = () => { filtroRep.osteo = !filtroRep.osteo; pintarRepertorio(); });
  conectarFichasRep(cont);
}

/* --- MANUAL (secciones de los tres manuales, con figuras) --- */
function tablaMusculos(t) {
  const nom = k => k.replace(/_/g, ' ').replace('muneca', 'muñeca').replace(/^./, c => c.toUpperCase());
  return `<div class="tabla-mus">${Object.entries(t).map(([acc, v]) => `<div class="tm-g"><h5>${esc(nom(acc))}</h5>${typeof v === 'string'
    ? `<p>${esc(v)}</p>` : `<dl>${Object.entries(v).map(([z, m]) => `<dt>${esc(nom(z))}</dt><dd>${esc(m)}</dd>`).join('')}</dl>`}</div>`).join('')}</div>`;
}
function seccionHTML(s) {
  const figs = (typeof DIAGRAMAS !== 'undefined' && DIAGRAMAS.deSeccion(s.id)) || '';
  return `<details class="seccion-bb">
    <summary><b>${esc(s.titulo)}</b><small>${esc(pagManual(s.f, s.pag))}</small></summary>
    <div class="sec-cuerpo">
      <p class="sec-res">${esc(s.resumen)}</p>
      ${figs}
      ${s.puntos.length ? `<ul class="sec-puntos">${s.puntos.map(p => `<li>${esc(p)}</li>`).join('')}</ul>` : ''}
      ${s.tabla ? tablaMusculos(s.tabla) : ''}
    </div>
  </details>`;
}
function pintarManual(filtro) {
  const f = norm(filtro || ''), cont = $('#lista');
  const hits = BB.secciones.filter(s => f.length < 2 || norm([s.titulo, s.resumen, ...s.puntos].join(' ')).includes(f));
  const notas = BB.notasManuscritas.length ? `<details class="seccion-bb notas-mano"><summary><b>✍️ Tus notas a mano en el manual</b><small>${BB.notasManuscritas.length}</small></summary>
    <div class="sec-cuerpo">${BB.notasManuscritas.map(n => `<p><b>${esc(NOM_FUENTE[n.f])}, pág. ${n.pag}:</b> ${esc(n.nota)}</p>`).join('')}</div></details>` : '';
  const trad = BB.notasTraduccion.length ? `<details class="seccion-bb"><summary><b>⚠️ Errores de la traducción al español</b><small>${BB.notasTraduccion.length}</small></summary>
    <div class="sec-cuerpo"><ul class="sec-puntos">${BB.notasTraduccion.map(n => `<li>${esc(n.nota)}</li>`).join('')}</ul></div></details>` : '';
  cont.innerHTML = `<p class="micro">Resúmenes del manual con la página del libro impreso para consultarlo. Las figuras están dibujadas a partir del texto: las que tienen controles se pueden tocar.</p>` +
    (hits.length ? ['mov', 'mat1', 'mat2'].map(fu => {
      const xs = hits.filter(s => s.f === fu);
      return xs.length ? `<h3 class="grupo-t">${NOM_FUENTE[fu]} <i>${xs.length}</i></h3>${xs.map(seccionHTML).join('')}${fu === 'mov' && f.length < 2 ? notas + trad : ''}` : '';
    }).join('') : '<p class="vacio">Nada con ese término.</p>');
  if (typeof DIAGRAMAS !== 'undefined') DIAGRAMAS.conectar(cont);
}

/* --- POSICIONES --- */
const POSICIONES_FIG = [
  ['pos-supino', 'Supino', 'Boca arriba. Base de la mayoría de los ejercicios de abdominales.'],
  ['pos-supino-rodillas', 'Supino con rodillas flexionadas', 'Pies apoyados, talones en línea con los isquiones. Posición de partida del Hundred Prep y de muchos Pre-Pilates.'],
  ['pos-mesa', 'Piernas en mesa', 'Caderas y rodillas a 90°, espinillas paralelas al piso.'],
  ['pos-prono', 'Prono', 'Boca abajo. Extensión de columna: Swan, Swimming, Kicks.'],
  ['pos-sedente', 'Sedente', 'Sentado sobre el centro de los isquiones, pelvis vertical.'],
  ['pos-sedente-silla', 'Sedente en silla', 'Pies apoyados, rodillas a 90°, columna larga.'],
  ['pos-4-puntos', '4 puntos (cuadrupedia)', 'Manos bajo los hombros, rodillas bajo las caderas.'],
  ['pos-plancha', 'Plancha prona', 'Una línea de cabeza a talones, hombros sobre las muñecas.'],
  ['pos-plancha-supina', 'Plancha supina', 'Boca arriba sobre las manos, caderas altas (Leg Pull Up).'],
  ['pos-lateral', 'Decúbito lateral', 'De costado, hombros y caderas apilados; cabeza en la mano.'],
  ['pos-rodillas', 'De rodillas', 'Rodillas bajo las caderas, tronco vertical.'],
  ['pos-bipedo', 'Bípedo (de pie)', 'De pie, peso repartido en ambos pies.'],
  ['pos-bipedo-frente', 'Bípedo, de frente', 'Referencia para la plomada frontal y la alineación horizontal.']
];
const POS_PREMAT = { 'Supino': 'pos-supino-rodillas', 'Prono': 'pos-prono', 'Sedente': 'pos-sedente', 'Sedente (silla)': 'pos-sedente-silla',
  '4 puntos': 'pos-4-puntos', 'Bípedo': 'pos-bipedo', 'Decúbito lateral': 'pos-lateral', 'Plancha prona': 'pos-plancha',
  'Plancha supina': 'pos-plancha-supina', 'De rodillas': 'pos-rodillas' };
function pintarPosiciones(filtro) {
  const f = norm(filtro || ''), cont = $('#lista');
  const cuenta = id => {
    const pm = Object.entries(POS_PREMAT).filter(([, v]) => v === id).map(([k]) => k);
    return PREMAT.filter(e => pm.includes(e.pos)).length;
  };
  const xs = POSICIONES_FIG.filter(([, n, d]) => f.length < 2 || norm(n + ' ' + d).includes(f));
  cont.innerHTML = `<div class="pos-grid">${xs.map(([id, n, d]) => `<figure class="pos-card">
      ${FIGURA.svgEstatico(POSES[id], 0)}
      <figcaption><b>${esc(n)}</b><small>${esc(d)}</small>${cuenta(id) ? `<i>${cuenta(id)} ejercicios Pre-Pilates</i>` : ''}</figcaption>
    </figure>`).join('')}</div>`;
}

/* --- fichas del MAT 1 --- */
const listaComas = xs => xs && xs.length ? xs.map(esc).join(', ') : '<span class="nada">—</span>';
function fichaMat1HTML(m) {
  const props = (tit, xs) => `<div class="props-col"><h5>${tit}</h5>${xs && xs.length ? `<ul>${xs.map(([c, d]) =>
    `<li><b>${esc(c)}</b>${d ? ` — ${esc(d)}` : ''}</li>`).join('')}</ul>` : '<p class="nada">—</p>'}</div>`;
  return `<details class="ficha-ej c-magenta">
    <summary><b>${esc(m.n)}</b><span class="pill">${esc(m.pos)}</span>${m.series ? `<span class="pill gris">${esc(m.series)}</span>` : ''}${m.revisar ? '<span class="pill aviso-p">revisar</span>' : ''}</summary>
    <dl>
      <dt>Principio (BB)</dt><dd>${esc(m.bb)}</dd>
      <dt>Objetivo</dt><dd>${m.obj.length > 1 ? `<ol>${m.obj.map(o => `<li>${esc(o)}</li>`).join('')}</ol>` : esc(m.obj[0] || '')}</dd>
      ${m.resp ? `<dt>Respiración</dt><dd>${esc(m.resp)}</dd>` : ''}
      <dt>Regresiones Pre-Pilates</dt><dd>${chipsTexto(m.regPre, 'pre')}</dd>
      <dt>Regresiones MAT 1</dt><dd>${chipsEj(m.regMat1, 'mat1')}</dd>
      <dt>Progresiones MAT 1</dt><dd>${chipsEj(m.progMat1, 'mat1')}</dd>
      <dt>Progresiones MAT 2</dt><dd>${chipsEj(m.progMat2, 'mat2')}</dd>
    </dl>
    <div class="props">${props('Accesorio que asiste', m.asiste)}${props('Accesorio que resiste', m.resiste)}</div>
    ${m.nota ? `<p class="pq"><b>Nota:</b> ${esc(m.nota)}</p>` : ''}
    ${m.revisar ? `<div class="revisar"><b>Para revisar en tu planilla</b>${m.revisar.map(r => `<p>${esc(r)}</p>`).join('')}</div>` : ''}
  </details>`;
}
/* --- miniaturas de ejercicios: foto (Pre-Pilates) o figura del manual ---
   Se insertan al abrir cada ficha (llenarMinis), así la lista no carga cientos
   de dibujos de entrada. Tocar un chip abre el ejercicio. */
const _minis = new Map();
function miniEj(ref) {
  if (!ref) return '';
  if (ref.pm) { const src = imagen(ref.pm); return src ? `<img src="${src}" alt="" loading="lazy">` : (POS_PREMAT[(PM[ref.pm] || {}).pos] ? miniEj({ bb: POS_PREMAT[PM[ref.pm].pos] }) : ''); }
  if (ref.bb && POSES[ref.bb]) {
    if (!_minis.has(ref.bb)) { const ej = POSES[ref.bb]; _minis.set(ref.bb, FIGURA.svgEstatico(ej, ej.poses.length > 1 ? Math.min(ej.poses.length - 1, 1 + Math.floor((ej.poses.length - 1) / 2)) : 0)); }
    return _minis.get(ref.bb);
  }
  return '';
}
const refAttr = r => r ? (r.bb ? ` data-bb="${r.bb}"` : r.pm ? ` data-pm="${r.pm}"` : '') : '';
function chipEj(nombre, libro = '') {
  const r = EJ_REF(nombre, libro);
  return `<button type="button" class="chip-ej${r ? '' : ' sin'}"${refAttr(r)}${r ? '' : ' disabled'}>${r ? '<span class="ce-img" data-mini></span>' : ''}<span>${esc(nombre)}</span></button>`;
}
const chipsEj = (xs, libro = '') => xs && xs.length ? `<span class="chips-ej">${xs.map(n => chipEj(n, libro)).join('')}</span>` : '<span class="nada">—</span>';
/* "Unidad interna: Pelvic clock, Fingertip abdominals · Unidad externa: …" → grupos con chips */
function chipsTexto(txt, libro = '') {
  if (!txt) return '<span class="nada">—</span>';
  return txt.split(' · ').map(g => {
    const i = g.indexOf(':'), et = i > 0 ? g.slice(0, i) : '', resto = i > 0 ? g.slice(i + 1) : g;
    return `<div class="grupo-chips">${et ? `<small>${esc(et)}</small>` : ''}${chipsEj(resto.split(/,\s*/).map(x => x.trim()).filter(Boolean), libro)}</div>`;
  }).join('');
}
function llenarMinis(raiz) {
  $$('[data-mini]', raiz).forEach(sp => {
    const b = sp.closest('[data-bb],[data-pm]');
    sp.innerHTML = miniEj(b && (b.dataset.bb ? { bb: b.dataset.bb } : { pm: b.dataset.pm }));
    sp.removeAttribute('data-mini');
  });
}
/* tocar un ejercicio: animación paso a paso o ficha de Pre-Pilates con foto */
function abrirEjercicio(ref) {
  if (ref.bb && EJ_BB[ref.bb] && POSES[ref.bb]) return abrirVisorGrande(EJ_BB[ref.bb]);
  if (ref.pm && PM[ref.pm]) {
    const m = abrirModal(`<div class="vm-cab"><h3>${esc(PM[ref.pm].n)}</h3><button type="button" class="btn small ghost" data-cerrar aria-label="Cerrar">✕</button></div>${fichaPremHTML(PM[ref.pm]).replace('<details class="ficha-pm">', '<details class="ficha-pm" open>')}`);
    m.classList.add('modal-visor');
    $('[data-cerrar]', m).onclick = cerrarModal;
  }
}
document.addEventListener('click', ev => {
  const b = ev.target.closest && ev.target.closest('.chip-ej[data-bb], .chip-ej[data-pm], .fam-ej[data-bb], .fam-ej[data-pm]');
  if (!b) return;
  ev.preventDefault();
  SND.toque();
  abrirEjercicio(b.dataset.bb ? { bb: b.dataset.bb } : { pm: b.dataset.pm });
});

/* --- ilustración de la pregunta: si nombra un solo ejercicio y pregunta por sus
   regresiones, objetivos, accesorios, series o respiración, se muestra su foto o
   su figura. Nunca en preguntas de posición o familia (la imagen las delataría). --- */
let _nombresEj = null;
function nombresEj() {
  if (_nombresEj) return _nombresEj;
  const out = [], add = (n, ref) => { const k = norm(String(n).replace(/^the /i, '').replace(/\(.*?\)/g, '').replace(/[—–].*$/, '')); if (k.length > 2) out.push([k, ref]); };
  BB.ejercicios.forEach(e => { if (POSES[e.id]) e.n.split(/\s*(?:\/| y )\s*/).forEach(n => add(n, { bb: e.id })); });
  MAT2.forEach(m => add(m.n, { bb: m.bb }));
  MAT1.forEach(m => { const e = BB.ejercicios.find(x => x.analisis === m.id); if (e) add(m.n, { bb: e.id }); });
  PREMAT.forEach(e => { if (imagen(e.id)) add(e.n, { pm: e.id }); });
  return (_nombresEj = out.sort((a, b) => b[0].length - a[0].length));
}
function ilusPregunta(it) {
  const c = it.ref;
  if (!c || it.tipo === 'anim' || it.tipo === 'foto') return '';
  const q = norm(String(c.q || c.t || ''));
  if (!/regresi|progresi|objetivo|accesorio|asiste|resiste|serie|respiraci|sniff/.test(q) || /posici|familia|que ejercicio/.test(q)) return '';
  const tomados = [], refs = new Map();
  for (const [k, ref] of nombresEj()) {
    let i = q.indexOf(k);
    while (i >= 0) {
      const fin = i + k.length, borde = (j, d) => j < 0 || j >= q.length || !/[a-z0-9]/.test(q[j]);
      if (borde(i - 1) && borde(fin) && !tomados.some(([a, b]) => i < b && fin > a)) { tomados.push([i, fin]); refs.set(ref.bb || ref.pm, ref); }
      i = q.indexOf(k, i + 1);
    }
  }
  if (refs.size !== 1) return '';
  const html = miniEj([...refs.values()][0]);
  return html ? `<figure class="ses-ilus" aria-hidden="true">${html}</figure>` : '';
}

/* --- fichas del MAT 2 --- */
function fichaMat2HTML(m) {
  const props = (tit, xs) => `<div class="props-col"><h5>${tit}</h5>${xs && xs.length ? `<ul>${xs.map(([c, d]) =>
    `<li><b>${esc(c)}</b>${d ? ` — ${esc(d)}` : ''}</li>`).join('')}</ul>` : '<p class="nada">—</p>'}</div>`;
  return `<details class="ficha-ej c-magenta" open>
    <summary><b>${esc(m.n)}</b><span class="pill">${esc(m.pos)}</span>${m.series ? `<span class="pill gris">${esc(m.series)}</span>` : ''}${m.revisar ? '<span class="pill aviso-p">revisar</span>' : ''}</summary>
    <dl>
      <dt>Principio</dt><dd>${esc(m.principio)}</dd>
      <dt>Objetivo</dt><dd>${m.obj.length > 1 ? `<ol>${m.obj.map(o => `<li>${esc(o)}</li>`).join('')}</ol>` : esc(m.obj[0] || '')}</dd>
      ${m.resp ? `<dt>Respiración</dt><dd>${esc(m.resp)}</dd>` : ''}
      <dt>Regresiones Pre-Pilates</dt><dd>${chipsEj(m.reg.pm, 'pre')}</dd>
      <dt>Regresiones Mat 1</dt><dd>${chipsEj(m.reg.m1, 'mat1')}</dd>
      <dt>Regresiones Mat 2</dt><dd>${chipsEj(m.reg.m2, 'mat2')}</dd>
      <dt>Progresiones</dt><dd>${chipsEj(m.prog, 'mat2')}</dd>
    </dl>
    <div class="props">${props('Accesorio que asiste', m.asiste)}${props('Accesorio que resiste', m.resiste)}</div>
    ${m.nota ? `<p class="pq"><b>Nota:</b> ${esc(m.nota)}</p>` : ''}
    ${m.revisar ? `<div class="revisar"><b>Para revisar en tu planilla</b>${m.revisar.map(r => `<p>${esc(r)}</p>`).join('')}</div>` : ''}
  </details>`;
}

/* --- FAMILIAS POR POSICIÓN: de Pre-Pilates a Mat 2, con foto o figura --- */
const POS_FAMILIA = { 'Supino': 'pos-supino-rodillas', 'Decúbito lateral': 'pos-lateral', 'Prono': 'pos-prono', '4 puntos': 'pos-4-puntos',
  'Planchas': 'pos-plancha', 'Sedente': 'pos-sedente', 'Bípedo': 'pos-bipedo' };
function pintarFamilias(filtro) {
  const f = norm(filtro || ''), cont = $('#lista');
  const hits = FAMILIAS.filter(x => f.length < 2 || norm([x.n, x.orig, x.pos, x.principio, ...x.obj].join(' ')).includes(f));
  const tarjeta = x => `<button type="button" class="fam-ej${x.ref ? '' : ' sin'}"${refAttr(x.ref)}${x.ref ? '' : ' disabled'}>
      <span class="fe-img">${x.ref ? '<span data-mini></span>' : '<span class="fe-nada">sin foto</span>'}</span>
      <b>${esc(x.ref && x.ref.pm && PM[x.ref.pm] ? PM[x.ref.pm].n : x.n)}</b><small>${esc(x.obj.join(' · '))}</small></button>`;
  cont.innerHTML = `<p class="micro">Cada familia junta los ejercicios de una misma posición: lo de Pre-Pilates prepara lo de Mat 1, y lo de Mat 1, lo de Mat 2. Tocá un ejercicio para ver su foto o su animación paso a paso.</p>` +
    (hits.length ? FAMILIA_POS.map(pos => {
      const xs = hits.filter(x => x.pos === pos);
      if (!xs.length) return '';
      const cols = ['pre', 'mat1', 'mat2'].map(l => [l, xs.filter(x => x.libro === l)]).filter(([, ys]) => ys.length);
      return `<details class="familia"${f.length > 1 ? ' open' : ''}>
        <summary><span class="gp-fig">${FIGURA.svgEstatico(POSES[POS_FAMILIA[pos]], 0)}</span><b>${esc(pos)}</b>
          <span class="fam-cuenta">${cols.map(([l, ys]) => `<i class="lb-${l}">${NOM_LIBRO[l]} ${ys.length}</i>`).join('')}</span></summary>
        ${cols.map(([l, ys]) => `<h4 class="fam-libro lb-${l}">${NOM_LIBRO[l]}</h4>
          ${[...new Set(ys.map(y => y.sub || ''))].map(sub => `${sub ? `<h5 class="fam-sub">${esc(sub)}</h5>` : ''}<div class="fam-grid">${ys.filter(y => (y.sub || '') === sub).map(tarjeta).join('')}</div>`).join('')}`).join('')}
      </details>`;
    }).join('') : '<p class="vacio">Nada con ese término.</p>');
  $$('.familia', cont).forEach(d => {
    if (d.open) llenarMinis(d);
    d.addEventListener('toggle', () => { if (d.open) llenarMinis(d); });
  });
}

function pintarMat1(filtro) {
  const f = norm(filtro), cont = $('#lista');
  const hits = f.length > 1 ? MAT1.filter(m => norm(JSON.stringify(m)).includes(f)) : MAT1;
  const orden = ['Supino', 'Sedente', 'Prono', 'Decúbito lateral'];
  cont.innerHTML = hits.length ? orden.map(p => {
    const xs = hits.filter(m => m.pos === p);
    return xs.length ? `<h3 class="grupo-t">${p}</h3>${xs.map(fichaMat1HTML).join('')}` : '';
  }).join('') : '<p class="vacio">Nada con ese término.</p>';
}

/* --- ejercicios Pre-Pilates (con foto) --- */
function fichaPremHTML(e) {
  const fotos = [imagen(e.id), imagen(e.id + '_2')].filter(Boolean);
  return `<details class="ficha-pm">
    <summary>${fotos[0] ? `<img class="mini" src="${fotos[0]}" alt="" loading="lazy">` : POS_PREMAT[e.pos] ? `<span class="mini mini-fig" title="Posición: ${esc(e.pos)}">${FIGURA.svgEstatico(POSES[POS_PREMAT[e.pos]], 0)}</span>` : '<span class="mini"></span>'}
      <span class="pm-t"><b>${esc(e.n)}</b><small>${esc(e.principio)} · ${esc(e.comp)}</small></span>
      ${e.revisar || e.fotoDudosa ? '<span class="pill aviso-p">revisar</span>' : ''}</summary>
    <div class="pm-body">
      ${fotos.length ? `<div class="pm-fotos">${fotos.map(s => `<img src="${s}" alt="${esc(e.n)}" loading="lazy">`).join('')}</div>` : ''}
      <dl>
        <dt>Posición</dt><dd>${esc(e.pos)}</dd>
        <dt>Objetivo</dt><dd>${esc(e.obj || '—')}</dd>
        <dt>Repeticiones</dt><dd>${esc(e.reps || '—')}</dd>
        ${e.obs ? `<dt>Observación</dt><dd>${esc(e.obs)}</dd>` : ''}
        ${e.contra ? `<dt>Contraindicaciones</dt><dd>${esc(e.contra)}</dd>` : ''}
        ${e.musculos ? `<dt>Músculos</dt><dd>${esc(e.musculos)}</dd>` : ''}
        ${e.cadena ? `<dt>Cadena miofascial</dt><dd>${esc(e.cadena)}</dd>` : ''}
        ${e.plano ? `<dt>Plano</dt><dd>${esc(e.plano)}</dd>` : ''}
      </dl>
      ${e.orig ? `<p class="pq">En tu planilla figura como “${esc(e.orig)}”.</p>` : ''}
      ${e.revisar || e.fotoDudosa ? `<div class="revisar"><b>Para revisar en tu planilla</b>${[...(e.revisar || []), ...(e.fotoDudosa ? [e.fotoDudosa] : [])].map(r => `<p>${esc(r)}</p>`).join('')}</div>` : ''}
    </div>
  </details>`;
}
function pintarPremat(filtro) {
  const f = norm(filtro), cont = $('#lista');
  const hits = f.length > 1 ? PREMAT.filter(e => norm([e.n, e.orig, e.pos, e.principio, e.comp, e.obj, e.musculos].join(' ')).includes(f)) : PREMAT;
  const posiciones = [...new Set(PREMAT.map(e => e.pos))];
  const aclaracion = '<p class="micro">Las preguntas usan nombre, foto, posición, principio y componente. Músculos, cadena miofascial y plano se muestran como están en tu planilla, pero no se preguntan: varias filas se contradicen (las marcadas con <b>revisar</b>).</p>';
  cont.innerHTML = hits.length ? aclaracion + posiciones.map(p => {
    const xs = hits.filter(e => e.pos === p);
    return xs.length ? `<h3 class="grupo-t grupo-pos">${POS_PREMAT[p] ? `<span class="gp-fig">${FIGURA.svgEstatico(POSES[POS_PREMAT[p]], 0)}</span>` : ''}${esc(p)} <i>${xs.length}</i></h3>${xs.map(fichaPremHTML).join('')}` : '';
  }).join('') : '<p class="vacio">Nada con ese término.</p>';
}
function pastillaMemoria(id) {
  const f = S.items[id];
  if (!f) return '<span class="pill">sin ver</span>';
  const m = Math.round(memoria(id) * 100), d = diasEntre(HOY(), f.due);
  return `<span class="pill ${m < 80 ? 'baja' : ''}">memoria ${m} % · ${d <= 0 ? 'para hoy' : 'en ' + fmtDias(d)}</span>`;
}
function fichaHTML(c) {
  return `<article class="nota">
    <h4>${esc(c.q)} ${pastillaMemoria(c.id)}</h4>
    <ul>${c.a.map(a => `<li>${esc(a)}</li>`).join('')}</ul>
    ${c.porque ? `<p class="pq"><b>Por qué:</b> ${esc(c.porque)}</p>` : ''}
    ${c.pag ? `<p class="pag-manual">📖 ${esc(c.pag)}</p>` : ''}
  </article>`;
}
function pintarApuntes(filtro) {
  const f = norm(filtro), cont = $('#lista');
  if (f.length > 1) {
    const hits = CARDS.filter(c => norm(c.q).includes(f) || c.a.some(a => norm(a).includes(f)) || norm(c.porque || '').includes(f));
    cont.innerHTML = hits.length
      ? `<p class="nres">${hits.length} resultado${hits.length === 1 ? '' : 's'}</p>` + hits.map(fichaHTML).join('')
      : '<p class="vacio">Nada con ese término.</p>';
    return;
  }
  cont.innerHTML = Object.entries(TEMAS).map(([k, t]) => {
    const cs = CARDS.filter(c => c.tema === k), abierto = temaAbierto === k;
    return `<div class="acord c-${t.color} ${abierto ? 'open' : ''}">
      <button type="button" class="acord-h" data-k="${k}" aria-expanded="${abierto}">
        <span class="ico">${t.icono}</span><b>${esc(t.nom)}</b><i>${cs.length}</i><span class="fl">${abierto ? '−' : '+'}</span>
      </button>
      ${abierto ? `<div class="acord-b">${cs.map(fichaHTML).join('')}</div>` : ''}
    </div>`;
  }).join('');
  $$('.acord-h', cont).forEach(b => b.onclick = () => {
    temaAbierto = temaAbierto === b.dataset.k ? null : b.dataset.k;
    pintarApuntes('');
  });
}

/* --- TUS EXÁMENES (datos-examenes.js) --- */
function pintarExamenes(filtro) {
  const f = norm(filtro), cont = $('#lista');
  const revs = REVISION_EXAMEN.filter(r => !f || norm([r.q, r.tu, r.ok, r.com || ''].join(' ')).includes(f));
  const lecs = LECCIONES_EXAMEN.filter(l => !f || norm(l.t + ' ' + l.de).includes(f));
  cont.innerHTML = `
    ${f ? '' : `<div class="ex-notas">${EXAMENES.map(e => {
      const pct = Math.round(100 * e.pts / e.de);
      return `<div class="ex-nota ${pct >= 80 ? 'alta' : pct >= 60 ? 'media' : 'baja'}"><small>${esc(e.fecha)}</small><b>${esc(e.nom)}</b>
        <span class="ex-pts">${e.pts}<i>/${e.de}</i></span><div class="barra"><span style="width:${pct}%"></span></div></div>`;
    }).join('')}</div>
    <button type="button" class="btn3d azul ancho" id="exSimulacro">📝 Simulacro: lo que te preguntaron, primero lo fallado</button>`}
    ${lecs.length ? `<h3 class="secc">Lo que marcó la corrección</h3>
    <ul class="lecciones">${lecs.map(l => `<li><span>${l.ico}</span><div><b>${esc(l.t)}</b><small>${esc(l.de)}</small></div></li>`).join('')}</ul>` : ''}
    ${revs.length ? `<h3 class="secc">Preguntas falladas o con puntaje parcial</h3>
    ${revs.map(r => `<article class="nota ex-rev ${r.pendiente ? 'pendiente' : ''}">
      <h4><span class="tag">${esc(EXAMEN[r.ex].nom)}${r.n ? ' · ' + r.n : ''}</span> <span class="ex-p">${esc(r.pts)}</span></h4>
      <p class="ex-q">${esc(r.q)}</p>
      <p class="ex-tu"><b>Tu respuesta:</b> ${esc(r.tu)}</p>
      <p class="ex-ok"><b>${r.pendiente ? 'Pendiente:' : 'Lo correcto:'}</b> ${esc(r.ok)}</p>
      ${r.com ? `<p class="ex-com">💬 «${esc(r.com)}»</p>` : ''}
      ${r.item && ITEM[r.item] ? `<button type="button" class="btn small" data-ex-item="${r.item}">Practicar esta</button>` : ''}
      ${r.clase ? '<button type="button" class="btn small" data-ex-clase>Armá tu clase</button>' : ''}
    </article>`).join('')}` : ''}
    ${!revs.length && !lecs.length ? '<p class="vacio">Nada con ese término.</p>' : ''}
    <p class="micro">Transcripción completa de los cuatro exámenes en <code>fuentes/examenes-previos.md</code>. Lo que la revisión no dejó claro no se pregunta en la app.</p>`;
  const sim = $('#exSimulacro');
  if (sim) sim.onclick = () => iniciarSesion('practica', sesionPractica('examen'), MODOS.examen.nom);
  $$('[data-ex-item]', cont).forEach(b => b.onclick = () => iniciarSesion('practica', [entrada(ITEM[b.dataset.exItem])], 'Pregunta de examen'));
  $$('[data-ex-clase]', cont).forEach(b => b.onclick = () => ir('clase'));
}

/* --- PERFIL --- */
function segmento(nombre, opciones, actual) {
  return `<div class="seg" data-cfg="${nombre}">${opciones.map(([v, t, d]) =>
    `<button type="button" class="${String(v) === String(actual) ? 'on' : ''}" data-v="${v}"><b>${t}</b>${d ? `<small>${d}</small>` : ''}</button>`).join('')}</div>`;
}
function vPerfil() {
  const n = nivelDe(S.xp), base = xpNivel(n), tope = xpNivel(n + 1);
  const cal = calibracion();
  const dias = [...Array(21)].map((_, i) => DIAS(-20 + i));
  const maxD = Math.max(1, ...dias.map(d => (S.log[d] || {}).xp || 0));
  const fut = [...Array(15)].map((_, i) => { const d = DIAS(i); return Object.values(S.items).filter(f => i === 0 ? f.due <= d : f.due === d).length; });
  const maxF = Math.max(1, ...fut);
  const incr = estadoIncrustado();
  const usandoIncr = !!incr && JSON.stringify(S.items) === JSON.stringify(incr.items);
  app().innerHTML = `
    <section class="nivel-card">
      <div class="nivel-badge">${n}</div>
      <div class="nivel-txt"><small>Nivel ${n}</small><b>${esc(nombreNivel(n))}</b>
        <div class="barra gruesa xpb"><span style="width:${Math.round(100 * (S.xp - base) / (tope - base))}%"></span></div>
        <small>${S.xp - base} / ${tope - base} XP para el nivel ${n + 1}</small></div>
    </section>
    <div class="cifras">
      <div class="cifra"><b>🔥 ${rachaVigente()}</b><span>racha</span></div>
      <div class="cifra"><b>⚡ ${S.xp}</b><span>XP total</span></div>
      <div class="cifra"><b>${S.totalResp}</b><span>ejercicios</span></div>
      <div class="cifra"><b>${Object.keys(S.items).length}/${ITEMS.length}</b><span>vistos</span></div>
    </div>

    <h2 class="secc">Logros · ${Object.keys(S.logros).length} de ${LOGROS.length}</h2>
    <div class="logros">${LOGROS.map(l => `<div class="logro ${S.logros[l.id] ? '' : 'bloq'}" title="${esc(l.desc)}">
      <span class="logro-ico">${l.ico}</span><b>${esc(l.nom)}</b><small>${esc(l.desc)}</small></div>`).join('')}</div>

    <h2 class="secc">Memoria por unidad</h2>
    <p class="micro">Probabilidad estimada de recordar hoy lo que ya viste. Baja con los días y sube con cada repaso: es la curva del olvido, medida.</p>
    <div class="temas">${UNIDADES.map(u => {
      const inf = infoUnidad(u), m = inf.mem == null ? null : Math.round(inf.mem * 100);
      return `<div class="tema"><div class="tema-h"><span class="ico">${u.icono}</span><b>${esc(u.nom)}</b>
        <i>${m == null ? 'sin ver' : m + ' %'}</i></div>
        <div class="barra"><span style="width:${m || 0}%"></span></div>
        <small>${inf.intro}/${inf.total} vistos · ${estrellasHTML(inf.est)}</small></div>`;
    }).join('')}</div>

    <h2 class="secc">Actividad · últimos 21 días</h2>
    <div class="graf">${dias.map(d => { const x = (S.log[d] || {}).xp || 0;
      return `<span class="col" title="${d}: ${x} XP"><i style="height:${Math.round(100 * x / maxD)}%"></i></span>`; }).join('')}</div>

    <h2 class="secc">Lo que viene · próximos 15 días</h2>
    <div class="graf fut">${fut.map((x, i) => `<span class="col" title="${i ? 'dentro de ' + i + ' d' : 'hoy'}: ${x}"><i style="height:${Math.round(100 * x / maxF)}%"></i></span>`).join('')}</div>
    <p class="micro">Cada recuerdo reaparece justo cuando la probabilidad de recordarlo cae a tu retención objetivo. Ese punto cuesta, y por eso mismo es donde más se fija.</p>

    <h2 class="secc">Calibración metacognitiva</h2>
    ${cal ? `<div class="calib-box">
      <div class="calib-num"><b>${Math.round(cal.acierto * 100)} %</b><span>de tus predicciones aciertan</span></div>
      <div class="calib-det">
        <p><b>${cal.exceso}</b> veces creíste saber y no sabías <small>(ilusión de fluidez)</small></p>
        <p><b>${cal.defecto}</b> veces creíste no saber y sí sabías <small>(subestimación)</small></p>
      </div></div>`
      : '<p class="vacio">Se calcula con las flashcards: antes de girar, predecís si la sabés.</p>'}

    <h2 class="secc">Ajustes</h2>
    <p class="ajuste-t">Retención objetivo</p>
    ${segmento('retencion', [[0.85, '85 %', 'menos repasos'], [0.9, '90 %', 'equilibrado'], [0.95, '95 %', 'examen cerca']], S.cfg.retencion)}
    <p class="ajuste-t">Meta diaria</p>
    ${segmento('meta', [[20, 'Relajada', '20 XP'], [50, 'Regular', '50 XP'], [100, 'Intensa', '100 XP']], S.cfg.meta)}
    <p class="ajuste-t">Repasos por sesión</p>
    ${segmento('sesion', [[10, '10'], [15, '15'], [20, '20']], S.cfg.sesion)}

    <h2 class="secc">Música y efectos</h2>
    <p class="micro">La música es instrumental y se genera en el momento: cada vuelta es distinta y no ocupa espacio. Baja sola cuando suena la respuesta. Si te distrae para leer, apagala con 🎵 o la tecla <kbd>M</kbd>.</p>
    <p class="ajuste-t">Música de fondo</p>
    ${segmento('musica', [[true, 'Encendida'], [false, 'Apagada']], S.cfg.musica)}
    <div class="${S.cfg.musica ? '' : 'atenuado'}">
      <p class="ajuste-t">Estilo</p>
      ${segmento('estiloMusica', Object.entries(ESTILOS).map(([k, e]) =>
        [k, e.nom, { calma: 'pads y campanas', lofi: 'relajada, con ritmo', energia: 'arpegios, más rápida' }[k]]), S.cfg.estiloMusica)}
      <label class="ajuste-t rango">Volumen de la música <input type="range" min="0.05" max="1" step="0.05" value="${S.cfg.volMusica}" data-vol="volMusica"></label>
    </div>
    <p class="ajuste-t">Sonidos</p>
    ${segmento('sonido', [[true, 'Activados'], [false, 'Apagados']], S.cfg.sonido)}
    <div class="${S.cfg.sonido ? '' : 'atenuado'}">
      <label class="ajuste-t rango">Volumen de los sonidos <input type="range" min="0.05" max="1" step="0.05" value="${S.cfg.volSonido}" data-vol="volSonido"></label>
    </div>
    <p class="ajuste-t">Vibración <small>(celular)</small></p>
    ${segmento('vibracion', [[true, 'Activada'], [false, 'Apagada']], S.cfg.vibracion)}
    <p class="ajuste-t">Efectos visuales</p>
    ${segmento('efectos', [['completos', 'Completos', 'chispas y confeti'], ['suaves', 'Suaves', 'sin movimiento']], S.cfg.efectos)}

    <h2 class="secc">Cómo aprende tu cerebro acá</h2>
    ${PRINCIPIOS_HTML}

    <h2 class="secc">Guardar y compartir</h2>
    <p class="micro">La app puede generar <b>una copia de sí misma en un solo archivo</b>. Ese archivo es la app entera: se manda por WhatsApp o correo y funciona con doble clic, sin internet.</p>
    <div class="fila">
      <button type="button" class="btn" id="copiaProg">Copia con mi progreso</button>
      <button type="button" class="btn ghost" id="copiaLimpia">Copia limpia, sin progreso</button>
    </div>
    <p class="micro">Para otra persona conviene la copia limpia: arranca de cero. La copia con progreso sirve para llevar tu avance a otra computadora en un solo archivo.</p>
    ${incr ? `<div class="marca">Este archivo trae progreso incrustado (${Object.keys(incr.items).length} ejercicios, guardado el ${esc(incr.creado || 's/f')}).
      ${usandoIncr ? 'Es el que estás usando.' : 'No se está usando: en este navegador ya había avance propio.'}
      ${usandoIncr ? '' : '<button type="button" class="btn small" id="usarIncrustado">Usar el del archivo</button>'}</div>` : ''}

    <h2 class="secc">Respaldo</h2>
    <p class="micro">Tu avance vive en este navegador. <b>Exportar</b> baja un archivo <code>.json</code> con tus fechas de repaso: no hace falta abrirlo, es la agenda interna. Para recuperarlo, usá <b>Importar</b>.</p>
    <div class="fila">
      <button type="button" class="btn" id="exp">Exportar progreso</button>
      <label class="btn ghost" for="imp">Importar</label>
      <input type="file" id="imp" accept="application/json,.json" hidden>
      <button type="button" class="btn peligro" id="reset">Empezar de cero</button>
    </div>`;

  $$('.seg').forEach(g => $$('button', g).forEach(b => b.onclick = () => {
    const k = g.dataset.cfg, raw = b.dataset.v;
    S.cfg[k] = raw === 'true' ? true : raw === 'false' ? false : isNaN(+raw) ? raw : +raw;
    if (k === 'retencion') recalcularVencimientos();
    guardar();
    AUD.iniciar(); AUD.volumenes();
    if (k === 'musica') { if (S.cfg.musica) MUSICA.iniciar(); else MUSICA.detener(); conectarMusica(); $$('.btn-musica').forEach(x => x.classList.toggle('off', !S.cfg.musica)); }
    if (k === 'estiloMusica') { S.cfg.musica = true; MUSICA.reiniciar(); $$('.btn-musica').forEach(x => x.classList.remove('off')); }
    if (k === 'sonido' && S.cfg.sonido) SND.bien(1);
    if (k === 'efectos' && S.cfg.efectos === 'completos') FX.chispasEn(b, { n: 14, dist: 50 });
    const y = window.scrollY;
    vPerfil(); pintarHud();
    window.scrollTo(0, y);
  }));
  $$('[data-vol]').forEach(r => {
    r.oninput = () => { S.cfg[r.dataset.vol] = +r.value; AUD.iniciar(); AUD.volumenes(); };
    r.onchange = () => { guardar(); if (r.dataset.vol === 'volSonido') SND.par(); };
  });
  $('#exp').onclick = () => descargar(`pilateslab-${HOY()}.json`, JSON.stringify(S, null, 2), 'application/json',
    'Respaldo guardado. No hace falta abrirlo: para recuperar tu avance usá <b>Importar</b> y elegí este archivo.');
  $('#imp').onchange = e => {
    const file = e.target.files[0];
    if (!file) return;
    const fr = new FileReader();
    fr.onload = () => {
      try {
        const d = migrar(JSON.parse(fr.result));
        if (!d) { avisoAlmacen('Ese archivo no parece un respaldo de Pilates Lab (ni de AnatoApp).'); return; }
        S = d; guardar(); ir('perfil');
        avisoOk(`Progreso restaurado: <b>${Object.keys(d.items).length}</b> ejercicios con sus fechas de repaso.`);
      } catch (x) { avisoAlmacen('No se pudo leer el archivo: puede estar dañado o editado a mano.'); }
    };
    fr.readAsText(file);
  };
  $('#copiaProg').onclick = () => generarCopia(true);
  $('#copiaLimpia').onclick = () => generarCopia(false);
  if ($('#usarIncrustado')) $('#usarIncrustado').onclick = async () => {
    if (!(await confirmar('Esto reemplaza tu avance actual por el que trae el archivo. ¿Seguro?', 'Reemplazar'))) return;
    S = estadoIncrustado(); guardar(); ir('perfil');
    avisoOk('Ahora estás usando el progreso que venía en el archivo.');
  };
  $('#reset').onclick = async () => {
    if (!(await confirmar('Esto borra todo el progreso, los XP y los logros. ¿Empezar de cero?', 'Borrar todo'))) return;
    /* Se guarda un estado vacío en vez de borrar la clave: si el archivo
       trae progreso incrustado, así no reaparece al recargar. */
    S = estadoInicial(); guardar(); ir('inicio');
    avisoOk('Listo, empezás de cero.');
  };
}

const PRINCIPIOS_HTML = `<div class="principios">
  <details><summary><b>Repetición espaciada con modelo de memoria</b></summary>
    <p>Cada ejercicio tiene tres números: su dificultad, su estabilidad (cuántos días aguanta el recuerdo) y la probabilidad de recordarlo hoy. El algoritmo FSRS los recalcula con cada respuesta y programa el repaso justo cuando esa probabilidad cae a tu retención objetivo. Es el sucesor moderno de los algoritmos tipo SM-2: se basa en un modelo de la curva del olvido en lugar de intervalos fijos.</p></details>
  <details><summary><b>Recuperar, no releer</b></summary>
    <p>Nunca se muestra la respuesta primero. El esfuerzo de traer un dato de la memoria es lo que la fortalece (efecto de prueba), mucho más que volver a leerlo.</p></details>
  <details><summary><b>Retroalimentación inmediata y elaborada</b></summary>
    <p>Cada respuesta se corrige en el momento, con la solución y el porqué. La retroalimentación que explica el mecanismo rinde más que un simple correcto o incorrecto.</p></details>
  <details><summary><b>Reaprendizaje sucesivo</b></summary>
    <p>Lo que fallás vuelve antes de terminar la sesión, con un formato más asistido, hasta que lo recuperás bien. Después se espacia entre sesiones.</p></details>
  <details><summary><b>Andamiaje que se retira</b></summary>
    <p>Un concepto nuevo se practica reconociendo (elegir, seleccionar fichas). Cuando su recuerdo ya es estable, se pasa a producir: flashcard y escritura libre. Así la dificultad crece a la par del dominio.</p></details>
  <details><summary><b>Intercalado</b></summary>
    <p>Las lecciones mezclan lo nuevo de una unidad con repasos de otras. Obliga a discriminar entre conceptos parecidos, que es lo que pide un examen.</p></details>
  <details><summary><b>Metacognición e hipercorrección</b></summary>
    <p>En las flashcards predecís si sabés antes de ver. La app mide si tu sensación de saber es confiable. Y un error cometido con seguridad, bien corregido, se recuerda especialmente bien: por eso hay un logro para eso.</p></details>
  <details><summary><b>Gamificación sin castigo</b></summary>
    <p>XP, niveles, racha, meta diaria y logros sostienen el hábito. No hay "vidas": equivocarse no te saca de la lección, porque el error seguido de corrección es parte del aprendizaje y castigarlo haría que intentes menos.</p></details>
  <details><summary><b>Dos rutas al mismo recuerdo</b></summary>
    <p>El mapa corporal asocia cada músculo con su lugar en el cuerpo: codificación verbal y espacial a la vez.</p></details>
  <p class="micro">Referencias en el archivo LÉEME.</p>
</div>`;

/* ============================================================
   COPIAS DE SÍ MISMA Y DESCARGAS
   ============================================================ */

/* Un archivo HTML no puede reescribirse solo mientras se usa: los
   navegadores no dejan que una página toque el disco. Lo que sí puede
   es construir una copia nueva de sí misma con el progreso adentro. */
async function construirCopia(conProgreso) {
  const clon = document.documentElement.cloneNode(true);
  const main = $('#app', clon);
  if (main) main.innerHTML = '';
  $$('.aviso, .modal, .toast, .confeti, .fantasma, .hoja', clon).forEach(n => n.remove());
  clon.removeAttribute('data-theme');
  const body = $('body', clon);
  if (body) body.classList.remove('en-sesion');
  $$('.nav button', clon).forEach((b, i) => b.classList.toggle('on', i === 0));
  const hud = $('#hud', clon);
  if (hud) hud.innerHTML = '';

  /* Si la app corre desde la carpeta (index.html + datos.js + app.js),
     los scripts externos se incrustan para que la copia sea autónoma. */
  for (const s of $$('script[src]', clon)) {
    const r = await fetch(s.getAttribute('src'));
    if (!r.ok) throw new Error('fetch');
    const n = document.createElement('script');
    n.textContent = (await r.text()).replace(/<\/(script)/gi, '<\\/$1');
    s.replaceWith(n);
  }

  let slot = $('#estado-inicial', clon);
  if (!slot) {
    slot = document.createElement('script');
    slot.type = 'application/json';
    slot.id = 'estado-inicial';
    (body || clon).appendChild(slot);
  }
  /* Se escapan los "<" para que un cierre de etiqueta dentro del JSON
     no pueda cortar el bloque antes de tiempo. */
  slot.textContent = conProgreso ? JSON.stringify(S).replace(/</g, '\\u003c') : '';
  return '<!doctype html>\n' + clon.outerHTML;
}

async function generarCopia(conProgreso) {
  let html;
  try { html = await construirCopia(conProgreso); }
  catch (e) {
    avisoAlmacen('No se pudo armar la copia desde acá. Abrí la app con <b>Abrir Pilates Lab.bat</b> o desde <b>PilatesLab.html</b> y probá de nuevo.');
    return;
  }
  descargar(conProgreso ? `PilatesLab-con-progreso-${HOY()}.html` : 'PilatesLab.html', html, 'text/html',
    conProgreso ? 'Copia guardada con tu progreso adentro: es la app entera en un archivo.'
                : 'Copia limpia guardada, sin progreso. Es la que conviene compartir.');
}

async function descargar(nombre, contenido, tipo, mensajeOk) {
  /* En una página publicada la descarga pasa por la capacidad
     `downloads` del visor; en el archivo local, por un enlace. */
  let dl = null;
  try {
    dl = (typeof claude !== 'undefined' && claude && claude.use) ? await claude.use('downloads') : null;
  } catch (e) { dl = null; }
  if (dl) {
    try {
      await dl.save({ filename: nombre, data: contenido });
      avisoOk(mensajeOk);
    } catch (err) {
      const code = err && err.code;
      if (code === 'declined') return;
      if (code === 'extension_not_enabled' || code === 'rejected_extension')
        avisoAlmacen('Esta vista no permite descargar archivos <b>.html</b>. Generá la copia desde la app abierta como archivo.');
      else if (code) avisoAlmacen('No se pudo descargar (' + esc(code) + ').');
    }
    return;
  }
  const blob = new Blob([contenido], { type: tipo });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  avisoOk(mensajeOk + ' Suele quedar en tu carpeta <b>Descargas</b>.');
}

/* ============================================================
   ARRANQUE
   ============================================================ */

document.addEventListener('keydown', e => {
  if (e.target.matches && e.target.matches('input, textarea, select')) return;
  if ((e.key === 'm' || e.key === 'M') && !e.ctrlKey && !e.metaKey && !e.altKey) { alternarMusica(); return; }
  if (vista === 'finsesion' && e.key === 'Enter') { const b = $('#finOk'); if (b) { e.preventDefault(); b.click(); } return; }
  if (vista !== 'sesion' || !L || !L.actual) return;
  if (e.key === 'Escape') { salirSesion(); return; }
  if (e.key === 'Enter') {
    /* Enter sobre una opción o ficha enfocada la activa; si no, comprueba o continúa */
    if (e.target.closest && e.target.closest('.ses-ej button') && !L.actual.cerrado) return;
    e.preventDefault(); accion(); return;
  }
  if (!L.actual.cerrado && L.actual.ej.tecla) L.actual.ej.tecla(e.key);
});

ALMACEN_OK = probarAlmacen();
cargar();
document.addEventListener('DOMContentLoaded', () => {
  $$('.nav button').forEach(b => b.onclick = () => ir(b.dataset.v));
  const ranura = $('#musica-slot');
  if (ranura) { ranura.outerHTML = botonMusica('hdr-musica'); conectarMusica($('header')); }
  ir('inicio');
  if (!ALMACEN_OK) {
    avisoAlmacen('<b>Esta vista no guarda tu progreso.</b> Podés estudiar y usar todo, pero al cerrar se pierde el avance. Para que la memoria persistente funcione, abrí la app desde el archivo descargado.');
  }
});
