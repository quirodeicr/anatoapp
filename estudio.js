/* ============================================================
   Pilates Lab — tu personaje y tu estudio de Pilates

   Un personaje propio (nombre, piel, pelo, ropa, accesorios) que vive
   en un estudio. Con el progreso se desbloquean prendas, accesorios y
   aparatos: del mat y los accesorios chicos al Reformer y el Cadillac.
   Cada aparato tiene su ficha y, cuando corresponde, lo que se vio de
   él en los exámenes (dónde va el aro, para qué sirve la banda…).

   Los desbloqueos salen de lo que ya mide la app (nivel, lecciones,
   racha, logros, clases armadas): premian la constancia y el dominio,
   nunca castigan. Todo el dibujo es SVG propio, sin imágenes.
   El estado vive en S.pj (se guarda con el progreso).
   ============================================================ */
'use strict';

/* ---------------- catálogo ---------------- */

const PIELES = ['#f7dcc8', '#eec1a0', '#d9a07a', '#b97c56', '#8d5a3b', '#5e3a26'];
const COLORES_PELO = {
  negro:     { nom: 'Negro',          c: '#2b2220' },
  oscuro:    { nom: 'Castaño oscuro', c: '#4a2f22' },
  castano:   { nom: 'Castaño',        c: '#7a4a2a' },
  rubio:     { nom: 'Rubio',          c: '#d8b25a' },
  colorado:  { nom: 'Colorado',       c: '#b5532b' },
  canoso:    { nom: 'Canoso',         c: '#cfccc7' },
  rosa:      { nom: 'Rosa',           c: '#ec80ad', cond: { t: 'nivel', n: 2 } },
  violeta:   { nom: 'Violeta',        c: '#8b5cf6', cond: { t: 'racha', n: 3 } },
  turquesa:  { nom: 'Turquesa',       c: '#14b8a6', cond: { t: 'nivel', n: 5 } },
  azul:      { nom: 'Azul',           c: '#3b82f6', cond: { t: 'resp', n: 500 } }
};
const PELOS = {
  rodete:  'Rodete', corto: 'Corto', largo: 'Largo', colitas: 'Dos colitas',
  rulos: 'Rulos', trenza: 'Trenza', rapado: 'Rapado'
};
const COLORES_ROPA = {
  verde:    { nom: 'Verde agua', c: '#0d9488' },
  negro:    { nom: 'Negro',      c: '#2d2d35' },
  gris:     { nom: 'Gris',       c: '#9ca3af' },
  blanco:   { nom: 'Blanco',     c: '#f1f1ee' },
  coral:    { nom: 'Coral',      c: '#f97362' },
  lila:     { nom: 'Lila',       c: '#a78bfa' },
  amarillo: { nom: 'Amarillo',   c: '#facc15', cond: { t: 'nivel', n: 2 } },
  rosa:     { nom: 'Rosa',       c: '#ec4899', cond: { t: 'logro', id: 'meta_5' } },
  azul:     { nom: 'Azul',       c: '#2563eb', cond: { t: 'nivel', n: 4 } },
  dorado:   { nom: 'Dorado',     c: '#d4a017', cond: { t: 'logro', id: 'unidad_3' } }
};
const ARRIBAS = {
  remera:    { nom: 'Remera' },
  musculosa: { nom: 'Musculosa' },
  top:       { nom: 'Top deportivo' },
  buzo:      { nom: 'Buzo con capucha', cond: { t: 'nivel', n: 3 } }
};
const ABAJOS = {
  calza:  { nom: 'Calza' },
  short:  { nom: 'Short' },
  jogger: { nom: 'Jogging', cond: { t: 'sesiones', n: 5 } }
};
const ACCESORIOS_PJ = {
  lentes:      { nom: 'Lentes', ico: '👓' },
  vincha:      { nom: 'Vincha', ico: '🎀', cond: { t: 'sesiones', n: 1 } },
  auriculares: { nom: 'Auriculares', ico: '🎧', cond: { t: 'nivel', n: 2 } },
  botella:     { nom: 'Botella de agua', ico: '💧', cond: { t: 'racha', n: 3 } },
  munequeras:  { nom: 'Muñequeras', ico: '🩹', cond: { t: 'logro', id: 'combo_10' } },
  toalla:      { nom: 'Toalla', ico: '🧣', cond: { t: 'logro', id: 'meta_5' } },
  medalla:     { nom: 'Medalla', ico: '🥇', cond: { t: 'logro', id: 'perfecta' } },
  laurel:      { nom: 'Corona de laurel', ico: '🌿', cond: { t: 'logro', id: 'unidad_3' } }
};

/* Aparatos y objetos del estudio, en el orden en que suelen llegar.
   `info` es la ficha; `examen`, lo que salió en tus exámenes. */
const APARATOS = {
  mat: { nom: 'Mat', info: 'La base de todo el método. Joseph Pilates publicó su repertorio de suelo, 34 ejercicios, en 1945, en «Return to Life Through Contrology». Todo tu Mat 1, Mat 2 y Mat 3 sale de ahí.' },
  pelota: { nom: 'Pelota', cond: { t: 'sesiones', n: 1 },
    info: 'Una pelota blanda que puede asistir o resistir. En tu Análisis MAT 1, en el Hundred va entre las piernas (activa los aductores) o detrás de la espalda, en la línea del brasier, para asistir el curl.',
    examen: 'Mat 3: la bola detrás de la espalda da soporte y asiste la articulación de la columna; el aro entre las manos no sostiene el tronco.' },
  banda: { nom: 'Banda elástica', cond: { t: 'sesiones', n: 3 },
    info: 'Resiste o asiste según cómo se la use. Abierta en la planta del pie ayuda a sostener la pierna; cerrada en las muñecas o los tobillos agrega resistencia.',
    examen: 'Mat 3: Bicep curl, Tricep press y Chest expansion para el tren superior; en el Double leg kicks asiste la elevación del pecho y sostiene los brazos.' },
  aro: { nom: 'Magic circle', cond: { t: 'racha', n: 3 },
    info: 'Un aro flexible con dos almohadillas. Se cuenta que Joseph lo hizo con el aro de metal de un barril de cerveza. Se presiona entre las manos, los tobillos o las rodillas: activa los aductores y conecta los brazos con el centro.',
    examen: 'Mat 3: en Rolling like a ball, Open leg rocker y Boomerang va entre los tobillos o las rodillas. Y siempre decí dónde va: la corrección preguntó «¿aro adónde?».' },
  rodillo: { nom: 'Rodillo', cond: { t: 'nivel', n: 3 },
    info: 'Un cilindro de espuma. Da inestabilidad (el cuerpo tiene que controlarlo), apoyo, o sirve para la liberación miofascial.',
    examen: 'Mat 3, estiramiento dinámico: pectorales (a lo largo de la columna), flexores de cadera (bajo el sacro), extensión torácica (transversal), dorsales (de costado) y glúteos (sentado).' },
  pizarra: { nom: 'Pizarra de clases', cond: { t: 'clases', n: 1 },
    info: 'Tu pizarra para planificar. Una clase para el examen lleva repeticiones exactas, transiciones pensadas y el orden de posiciones del manual.', clase: true },
  spine: { nom: 'Spine corrector', cond: { t: 'nivel', n: 4 },
    info: 'Un arco con un escalón que acompaña a la columna: la sostiene en extensión para abrir el pecho y le da apoyo en la flexión y en la flexión lateral.' },
  chair: { nom: 'Wunda chair', cond: { t: 'nivel', n: 5 },
    info: 'Una caja con un pedal a resortes. Se trabaja sentado, de pie, de costado o boca abajo, y exige mucho equilibrio y fuerza. Se cuenta que Joseph la pensó para departamentos chicos: dada vuelta, era un sillón.' },
  barrel: { nom: 'Ladder barrel', cond: { t: 'racha', n: 7 },
    info: 'Una escalera de barras unida a un barril curvo; la distancia entre los dos se ajusta al largo de las piernas. Ideal para la extensión, la flexión lateral y los estiramientos.' },
  reformer: { nom: 'Reformer', cond: { t: 'nivel', n: 6 },
    info: 'El Universal Reformer, uno de los aparatos que inventó Joseph: un carro que se desliza sobre rieles, con resortes que dan la resistencia, barra de pies, correas y hombreras.' },
  diploma: { nom: 'Diploma', cond: { t: 'unidades', ids: ['u17', 'u18'] },
    info: 'Pasaste por todo lo que te preguntaron en tus cuatro exámenes. Lo que fallaste allá ya lo practicaste acá.' },
  planta: { nom: 'Planta', cond: { t: 'logro', id: 'meta_5' },
    info: 'Cinco días con la meta cumplida. Como las plantas: poco, pero todos los días.' },
  espejo: { nom: 'Espejo', cond: { t: 'resp', n: 100 },
    info: 'Cien ejercicios respondidos. En el estudio, el espejo ayuda a ver la alineación; acá, tu calibración en el Perfil te muestra qué tan bien sabés lo que sabés.' },
  cadillac: { nom: 'Cadillac', cond: { t: 'nivel', n: 8 },
    info: 'También llamado trapeze table: una camilla elevada con un marco de cuatro postes, barras y resortes. Según tu manual de Mat 1, nació en la Isla de Man, cuando Joseph fijó resortes a las cabeceras de las camas de hospital. Es el aparato más versátil: sirve para asistir a quien recién empieza y para el repertorio más avanzado.' }
};

/* nombres con juego de palabras (el 🎲 los va proponiendo) */
const NOMBRES_PJ = ['Core-azón', 'Pelvis Presley', 'Glúteo Máximo', 'Mat-emática', 'Teaser Rex', 'Pili Plomada',
  'Rolling Stone', 'Swan Lake', 'Cien-cia', 'Ada Ductora', 'Powerhouse', 'Roll-Upa', 'Reformín', 'Contrología'];

/* nombres para el estudio (el 🎲 de "Tu estudio" los va proponiendo) */
const NOMBRES_ESTUDIO = ['Estudio Powerhouse', 'Casa Contrología', 'El Rincón del Core', 'Mat y Respiro', 'La Plomada', 'Columna Neutra',
  'Estudio Inhalá', 'Centro y Control', 'El Reformer Feliz', 'Estudio Teaser', 'Ciento por Ciento', 'El Aro Mágico'];
/* el estudio lleva su propio nombre; si no le pusiste uno, es "Estudio de" y el personaje */
const nombreEstudio = () => (pj().estudio || '').trim() || `Estudio de ${pj().nombre}`;

const FRASES_PJ = [
  'Inhalá… y exhalá. Así arranca todo.',
  '¿Sabías que Joseph llamaba a su método «Contrología»?',
  'Columna larga, hombros lejos de las orejas.',
  'El Hundred son 100 bombeos: 10 ciclos de 5 y 5.',
  'Pelvis neutra: EIAS y pubis en el mismo plano.',
  'Repeticiones exactas, no rangos. Lo pidió la corrección.',
  'Pocas repeticiones con atención valen más que muchas sin ella.',
  'Mi ejercicio favorito es el Teaser… cuando me sale.',
  'Un recuerdo que cuesta traer es un recuerdo que se fija.',
  'Con osteoporosis, el Teaser no se modifica: se evita.',
  '«Todas las anteriores» también puede ser la correcta. Ojo.',
  'Aro entre los tobillos para rodar. ¡Y decí dónde va!'
];

const PJ_BASE = () => ({
  nombre: 'Core-azón', estudio: '', piel: 2, pelo: 'rodete', colorPelo: 'castano',
  arriba: 'remera', colorArriba: 'verde', abajo: 'calza', colorAbajo: 'negro', medias: 'coral',
  acc: [], vistos: []
});
/* completa lo que falte sin reemplazar el objeto: así lo que se edita (nombre, estudio)
   queda en S.pj aunque otra parte haya llamado a pj() mientras tanto */
function pj() {
  const base = PJ_BASE();
  if (!S.pj || typeof S.pj !== 'object') S.pj = base;
  else for (const k in base) if (S.pj[k] === undefined) S.pj[k] = base[k];
  if (!Array.isArray(S.pj.acc)) S.pj.acc = [];
  if (!Array.isArray(S.pj.vistos)) S.pj.vistos = [];
  return S.pj;
}

/* ---------------- condiciones ---------------- */

function cumple(c) {
  if (!c) return true;
  switch (c.t) {
    case 'nivel': return nivelDe(S.xp) >= c.n;
    case 'sesiones': return S.sesiones >= c.n;
    case 'racha': return !!S.logros['racha_' + c.n] || rachaVigente() >= c.n;
    case 'logro': return !!S.logros[c.id];
    case 'resp': return S.totalResp >= c.n;
    case 'clases': return (S.clasesOk || 0) >= c.n;
    case 'unidades': return c.ids.every(id => { const u = UNIDADES.find(x => x.id === id); if (!u) return false; const i = infoUnidad(u); return i.intro >= i.total; });
  }
  return false;
}
function progresoCond(c) {
  if (!c) return 1;
  const r = x => Math.max(0, Math.min(1, x));
  switch (c.t) {
    case 'nivel': return r(S.xp / xpNivel(c.n));
    case 'sesiones': return r(S.sesiones / c.n);
    case 'racha': return cumple(c) ? 1 : r(rachaVigente() / c.n);
    case 'resp': return r(S.totalResp / c.n);
    case 'clases': return r((S.clasesOk || 0) / c.n);
    case 'unidades': {
      const us = c.ids.map(id => UNIDADES.find(x => x.id === id)).filter(Boolean).map(infoUnidad);
      const tot = us.reduce((a, i) => a + i.total, 0);
      return tot ? r(us.reduce((a, i) => a + i.intro, 0) / tot) : 0;
    }
  }
  return cumple(c) ? 1 : 0;
}
function textoCond(c) {
  if (!c) return 'Disponible desde el principio';
  switch (c.t) {
    case 'nivel': return `Llegá al nivel ${c.n} (${nombreNivel(c.n)})`;
    case 'sesiones': return c.n === 1 ? 'Completá tu primera lección' : `Completá ${c.n} lecciones`;
    case 'racha': return `Estudiá ${c.n} días seguidos`;
    case 'resp': return `Respondé ${c.n} ejercicios`;
    case 'clases': return 'Armá una clase que pase la revisión (Práctica → Armá tu clase)';
    case 'unidades': return 'Pasá por todo lo de tus dos unidades de exámenes';
    case 'logro': { const l = LOGROS.find(x => x.id === c.id); return l ? `Logro «${l.nom}»: ${l.desc.charAt(0).toLowerCase() + l.desc.slice(1)}` : 'Un logro'; }
  }
  return '';
}
function faltaCond(c) {
  if (!c || cumple(c)) return '';
  switch (c.t) {
    case 'nivel': return `faltan ${xpNivel(c.n) - S.xp} XP`;
    case 'sesiones': { const n = c.n - S.sesiones; return `${n === 1 ? 'falta 1 lección' : 'faltan ' + n + ' lecciones'}`; }
    case 'racha': return `llevás ${rachaVigente()} de ${c.n}`;
    case 'resp': return `llevás ${S.totalResp} de ${c.n}`;
    case 'unidades': return `${Math.round(progresoCond(c) * 100)} % visto`;
  }
  return '';
}

/* todo lo desbloqueable, con un id único por categoría */
function catalogoPJ() {
  const out = [];
  for (const [k, a] of Object.entries(APARATOS)) out.push({ id: 'ap:' + k, k, cat: 'aparato', nom: a.nom, cond: a.cond });
  for (const [k, a] of Object.entries(ARRIBAS)) out.push({ id: 'ar:' + k, k, cat: 'arriba', nom: a.nom, cond: a.cond });
  for (const [k, a] of Object.entries(ABAJOS)) out.push({ id: 'ab:' + k, k, cat: 'abajo', nom: a.nom, cond: a.cond });
  for (const [k, a] of Object.entries(ACCESORIOS_PJ)) out.push({ id: 'ac:' + k, k, cat: 'accesorio', nom: a.nom, ico: a.ico, cond: a.cond });
  for (const [k, a] of Object.entries(COLORES_ROPA)) out.push({ id: 'cr:' + k, k, cat: 'color', nom: 'Color ' + a.nom.toLowerCase(), cond: a.cond });
  for (const [k, a] of Object.entries(COLORES_PELO)) out.push({ id: 'cp:' + k, k, cat: 'pelo', nom: 'Pelo ' + a.nom.toLowerCase(), cond: a.cond });
  return out;
}
const desbloqueado = it => cumple(it.cond);
function nuevosDesbloqueos() {
  const p = pj();
  return catalogoPJ().filter(it => it.cond && desbloqueado(it) && !p.vistos.includes(it.id));
}
function marcarVistos(items) {
  const p = pj();
  items.forEach(it => { if (!p.vistos.includes(it.id)) p.vistos.push(it.id); });
  guardar();
}
/* el próximo objetivo: lo bloqueado que está más cerca */
function proximoDesbloqueo() {
  const cat = catalogoPJ();
  const pend = cat.filter(it => it.cond && !desbloqueado(it) && it.cond.t !== 'logro');
  /* el más avanzado; a igual avance, los aparatos y lo que llega antes en el catálogo */
  const orden = it => [-progresoCond(it.cond), it.cat === 'aparato' ? 0 : 1, cat.indexOf(it)];
  pend.sort((a, b) => { const x = orden(a), y = orden(b); return x[0] - y[0] || x[1] - y[1] || x[2] - y[2]; });
  return pend[0] || null;
}
function avisarDesbloqueos() {
  const nuevos = nuevosDesbloqueos();
  nuevos.slice(0, 3).forEach((it, i) => setTimeout(() => {
    toast(`🎁 Nuevo para ${esc(pj().nombre)}: <b>${esc(it.nom)}</b>`, 'toast-logro');
    SND.logro();
  }, 600 + i * 900));
  if (nuevos.length) marcarVistos(nuevos);
}

/* lo equipado, cayendo en lo básico si quedó algo bloqueado */
function equipado() {
  const p = pj();
  const ok = (tabla, k, base) => tabla[k] && cumple(tabla[k].cond) ? k : base;
  return {
    piel: PIELES[p.piel] || PIELES[2],
    pelo: PELOS[p.pelo] ? p.pelo : 'rodete',
    colorPelo: COLORES_PELO[ok(COLORES_PELO, p.colorPelo, 'castano')].c,
    arriba: ok(ARRIBAS, p.arriba, 'remera'),
    colorArriba: COLORES_ROPA[ok(COLORES_ROPA, p.colorArriba, 'verde')].c,
    abajo: ok(ABAJOS, p.abajo, 'calza'),
    colorAbajo: COLORES_ROPA[ok(COLORES_ROPA, p.colorAbajo, 'negro')].c,
    medias: COLORES_ROPA[ok(COLORES_ROPA, p.medias, 'coral')].c,
    acc: p.acc.filter(a => ACCESORIOS_PJ[a] && cumple(ACCESORIOS_PJ[a].cond))
  };
}

/* ---------------- dibujo del personaje ---------------- */

function tono(hex, k) {
  const n = parseInt(hex.slice(1), 16);
  const f = v => Math.max(0, Math.min(255, Math.round(k < 0 ? v * (1 + k) : v + (255 - v) * k)));
  return '#' + [n >> 16, (n >> 8) & 255, n & 255].map(f).map(v => v.toString(16).padStart(2, '0')).join('');
}

/* <g> del personaje en un cuadro de 120 × 210 */
function avatarG(e, pose = 'quieto') {
  const piel = e.piel, pelo = e.colorPelo, top = e.colorArriba, bot = e.colorAbajo;
  const pielO = tono(piel, -0.14), topO = tono(top, -0.18), botO = tono(bot, -0.2);
  const arriba = pose === 'festeja';
  const brazos = arriba
    ? [['M42 84 Q31 66 27 47', 26, 44], ['M78 84 Q89 66 93 47', 94, 44]]
    : [['M42 84 Q33 104 31 127', 31, 129], ['M78 84 Q87 104 89 127', 89, 129]];
  const mangaCorta = arriba ? ['M42 84 Q38 77 36 71', 'M78 84 Q82 77 84 71'] : ['M42 84 Q38 93 36 100', 'M78 84 Q82 93 84 100'];
  const tiene = a => e.acc.includes(a);
  const g = [];

  /* pelo de atrás */
  const atras = {
    largo: `<path d="M37 36 Q40 14 60 15 Q82 14 84 36 L88 98 Q74 104 60 102 Q46 104 32 98 Z" fill="${pelo}"/>`,
    rodete: `<circle cx="60" cy="18" r="10.5" fill="${pelo}"/><path d="M52 24 Q60 28 68 24" stroke="${tono(pelo, -0.25)}" stroke-width="1.6" fill="none"/>`,
    colitas: `<ellipse cx="30" cy="58" rx="6.5" ry="14" transform="rotate(14 30 58)" fill="${pelo}"/><ellipse cx="90" cy="58" rx="6.5" ry="14" transform="rotate(-14 90 58)" fill="${pelo}"/>
      <circle cx="34" cy="45" r="2.6" fill="#f43f5e"/><circle cx="86" cy="45" r="2.6" fill="#f43f5e"/>`,
    rulos: `<circle cx="60" cy="42" r="32" fill="${pelo}"/>`,
    trenza: [66, 76, 86, 96].map((y, i) => `<ellipse cx="${84 + i * 1.2}" cy="${y}" rx="5" ry="6" fill="${pelo}" stroke="${tono(pelo, -0.25)}" stroke-width="1"/>`).join('') +
      `<circle cx="88.6" cy="103.5" r="2.4" fill="#f43f5e"/>`
  }[e.pelo] || '';
  g.push(atras);

  /* piernas */
  const pierna = (d, color, w) => `<path d="${d}" stroke="${color}" stroke-width="${w}" stroke-linecap="round" fill="none"/>`;
  const piernas = ['M51 128 L49 185', 'M69 128 L71 185'];
  if (e.abajo === 'short') {
    piernas.forEach(d => g.push(pierna(d, piel, 12.5)));
    g.push(pierna('M51 128 L50.4 148', bot, 14.5), pierna('M69 128 L69.6 148', bot, 14.5));
  } else if (e.abajo === 'jogger') {
    piernas.forEach(d => g.push(pierna(d, bot, 15)));
    g.push(pierna('M49.3 178 L49 185', botO, 14), pierna('M70.7 178 L71 185', botO, 14));
  } else piernas.forEach(d => g.push(pierna(d, bot, 13)));
  /* medias antideslizantes */
  g.push(`<ellipse cx="46" cy="189" rx="8.5" ry="4.8" fill="${e.medias}"/><ellipse cx="74" cy="189" rx="8.5" ry="4.8" fill="${e.medias}"/>
    <path d="M38.5 191 Q46 194 53.5 191 M66.5 191 Q74 194 81.5 191" stroke="${tono(e.medias, -0.25)}" stroke-width="1.2" fill="none"/>`);
  /* cadera y cintura */
  g.push(`<path d="M41 121 L79 121 L80.5 138 Q60 145 39.5 138 Z" fill="${bot}"/><path d="M41 123.5 L79 123.5" stroke="${botO}" stroke-width="2"/>`);

  /* cuello y tronco */
  g.push(`<rect x="54" y="64" width="12" height="15" rx="4" fill="${pielO}"/>`);
  const tronco = 'M38 85 Q38 77 46 76 L74 76 Q82 77 82 85 L79 124 L41 124 Z';
  g.push(`<path d="${tronco}" fill="${piel}"/>`);
  if (e.arriba === 'musculosa') g.push(`<path d="M45 77 L52 77 Q60 85 68 77 L75 77 Q78 92 79 124 L41 124 Q42 92 45 77 Z" fill="${top}"/>`);
  else if (e.arriba === 'top') g.push(`<path d="M42 81 Q44 77 50 77 Q60 84 70 77 Q76 77 78 81 L78 106 Q60 110 42 106 Z" fill="${top}"/>
    <path d="M42 104 Q60 108 78 104" stroke="${topO}" stroke-width="2" fill="none"/>`);
  else {
    if (e.arriba === 'buzo') g.push(`<path d="M43 79 Q60 94 77 79 Q73 69 60 69 Q47 69 43 79 Z" fill="${topO}"/>`);
    g.push(`<path d="${tronco}" fill="${top}"/>`);
    if (e.arriba === 'remera') g.push(`<path d="M53 76 Q60 83 67 76 Z" fill="${piel}"/>`);
    else g.push(`<path d="M53 77 Q60 86 67 77" stroke="${topO}" stroke-width="2" fill="none"/>
      <path d="M49 108 L71 108 L69 120 L51 120 Z" fill="${topO}" opacity=".55"/>
      <path d="M57 84 L56 96 M63 84 L64 96" stroke="#f8fafc" stroke-width="1.3" stroke-linecap="round"/>`);
  }

  /* brazos, mangas y manos */
  brazos.forEach(([d]) => g.push(pierna(d, e.arriba === 'buzo' ? top : piel, e.arriba === 'buzo' ? 12 : 10)));
  if (e.arriba === 'remera') mangaCorta.forEach(d => g.push(pierna(d, top, 13)));
  if (e.arriba === 'buzo') brazos.forEach(([, x, y]) => g.push(`<circle cx="${x}" cy="${y + (arriba ? 5 : -5)}" r="6.2" fill="${topO}"/>`));
  if (tiene('munequeras')) brazos.forEach(([, x, y]) => g.push(`<circle cx="${x}" cy="${y + (arriba ? 6 : -6)}" r="5.8" fill="#f43f5e"/>`));
  brazos.forEach(([, x, y]) => g.push(`<circle cx="${x}" cy="${y}" r="5.6" fill="${piel}"/>`));

  /* accesorios del cuerpo */
  if (tiene('toalla')) g.push(`<path d="M68 75 Q80 75 83 86 L79 113 L71.5 111 L74.5 89 Q71 82 63 80 Z" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.2"/>
    <path d="M73 104 L79.6 105.5" stroke="#38bdf8" stroke-width="2"/>`);
  if (tiene('medalla')) g.push(`<path d="M54 77 L60 97 L66 77" stroke="#2563eb" stroke-width="3.2" fill="none" stroke-linejoin="round"/>
    <circle cx="60" cy="101" r="6" fill="#facc15" stroke="#b7791f" stroke-width="1.4"/><path d="M60 97.5 L61 100 L63.5 100.2 L61.6 101.8 L62.2 104.3 L60 102.9 L57.8 104.3 L58.4 101.8 L56.5 100.2 L59 100 Z" fill="#fff7cc"/>`);

  /* cabeza */
  g.push(`<circle cx="36.5" cy="49" r="4.6" fill="${pielO}"/><circle cx="83.5" cy="49" r="4.6" fill="${pielO}"/>
    <circle cx="60" cy="46" r="24" fill="${piel}"/>`);
  /* cara */
  g.push(`<g class="pj-ojos"><ellipse cx="51" cy="48" rx="2.7" ry="3.4" fill="#2a2230"/><ellipse cx="69" cy="48" rx="2.7" ry="3.4" fill="#2a2230"/>
    <circle cx="51.9" cy="46.8" r=".95" fill="#fff"/><circle cx="69.9" cy="46.8" r=".95" fill="#fff"/></g>
    <path d="M46.5 41.5 Q51 39.2 55.5 41.2 M64.5 41.2 Q69 39.2 73.5 41.5" stroke="${tono(pelo, -0.2)}" stroke-width="1.7" stroke-linecap="round" fill="none"/>
    <ellipse cx="45" cy="55" rx="3.8" ry="2.3" fill="#f472b6" opacity=".32"/><ellipse cx="75" cy="55" rx="3.8" ry="2.3" fill="#f472b6" opacity=".32"/>
    ${arriba ? '<path d="M53 56 Q60 67 67 56 Z" fill="#7a2e2e"/><path d="M56.5 61.5 Q60 64.5 63.5 61.5" fill="#f87171"/>'
             : '<path d="M54 57 Q60 62.5 66 57" stroke="#7a3a3a" stroke-width="1.9" stroke-linecap="round" fill="none"/>'}`);

  /* pelo de adelante */
  const frente = {
    corto: 'M36 46 Q34 21 58 20 Q83 19 85 44 Q83 35 75 31 Q69 38 57 36 Q48 35 44 40 Q40 42 36 46 Z',
    largo: 'M36 50 Q33 21 60 20 Q87 20 85 48 Q80 33 66 30 Q60 38 48 38 Q40 40 36 50 Z',
    rodete: 'M36 44 Q36 21 60 21 Q84 21 84 44 Q78 30 60 29 Q42 30 36 44 Z',
    colitas: 'M36 44 Q36 21 60 21 Q84 21 84 44 Q80 33 70 31 Q66 36 58 33 Q46 31 36 44 Z',
    trenza: 'M36 48 Q34 21 60 20 Q86 20 84 46 Q78 30 60 28 Q46 30 40 38 Q37 42 36 48 Z',
    rapado: 'M37 42 Q38 22 60 22 Q82 22 83 42 Q72 30 60 30 Q48 30 37 42 Z'
  }[e.pelo];
  if (e.pelo === 'rulos') g.push([[40, 33, 8], [49, 25, 9], [61, 22, 9.5], [72, 25, 9], [81, 33, 8], [36, 43, 6], [84, 43, 6]]
    .map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${pelo}"/>`).join(''));
  else if (frente) g.push(`<path d="${frente}" fill="${pelo}" ${e.pelo === 'rapado' ? 'opacity=".85"' : ''}/>`);

  /* accesorios de la cabeza */
  if (tiene('laurel')) g.push([195, 210, 225, 240, 255, 285, 300, 315, 330, 345].map(a => {
    const r = a * Math.PI / 180, x = (60 + 27 * Math.cos(r)).toFixed(1), y = (46 + 27 * Math.sin(r)).toFixed(1);
    return `<ellipse cx="${x}" cy="${y}" rx="4.8" ry="2.2" transform="rotate(${a + 90} ${x} ${y})" fill="${a < 270 ? '#65a30d' : '#4d7c0f'}"/>`;
  }).join(''));
  if (tiene('vincha')) g.push('<path d="M36.5 40 Q60 21 83.5 40" stroke="#f43f5e" stroke-width="4.2" stroke-linecap="round" fill="none"/>');
  if (tiene('auriculares')) g.push(`<path d="M35 46 Q35 15 60 14 Q85 15 85 46" stroke="#374151" stroke-width="3.4" fill="none"/>
    <rect x="30" y="41" width="9" height="15" rx="3.5" fill="#1f2937"/><rect x="81" y="41" width="9" height="15" rx="3.5" fill="#1f2937"/>`);
  if (tiene('lentes')) g.push(`<g fill="rgba(255,255,255,.18)" stroke="#1f2937" stroke-width="1.7"><circle cx="51" cy="48" r="6.2"/><circle cx="69" cy="48" r="6.2"/></g>
    <path d="M57.2 47.5 Q60 46 62.8 47.5" stroke="#1f2937" stroke-width="1.6" fill="none"/>`);
  if (tiene('botella')) g.push(`<rect x="99" y="170" width="11" height="21" rx="3.5" fill="#38bdf8" opacity=".92"/><rect x="100.5" y="165" width="8" height="6" rx="1.5" fill="#0f172a"/>
    <rect x="101" y="176" width="3" height="10" rx="1.5" fill="#fff" opacity=".5"/>`);
  return g.join('');
}

function avatarSVG(pose = 'quieto', clase = '') {
  return `<svg class="pj-svg ${clase}" viewBox="0 0 120 210" role="img" aria-label="${esc(pj().nombre)}">${avatarG(equipado(), pose)}</svg>`;
}

/* ---------------- dibujo de los aparatos ---------------- */

const MADERA = '#c89b6d', MADERA_O = '#9c6c43', METAL = '#a3adb9', METAL_O = '#6b7684', TAPIZ = '#0f766e', TAPIZ_C = '#14b8a6', RESORTE = '#cbd5e1';
const resorte = (x1, y1, x2, y2, n = 7) => {
  const pts = [];
  for (let i = 0; i <= n * 2; i++) {
    const t = i / (n * 2), x = x1 + (x2 - x1) * t, y = y1 + (y2 - y1) * t;
    const dx = -(y2 - y1), dy = x2 - x1, l = Math.hypot(dx, dy) || 1, o = i % 2 ? 3 : -3;
    pts.push(`${(x + dx / l * (i && i < n * 2 ? o : 0)).toFixed(1)},${(y + dy / l * (i && i < n * 2 ? o : 0)).toFixed(1)}`);
  }
  return `<polyline points="${pts.join(' ')}" fill="none" stroke="${RESORTE}" stroke-width="1.6" stroke-linejoin="round"/>`;
};

/* cada aparato en su caja local; `caja` = [ancho, alto] */
const DIBUJOS = {
  mat: { caja: [130, 14], svg: `<path d="M9 1 L130 1 L121 13 L0 13 Z" fill="#8b7cf6"/><path d="M0 13 L121 13 L121 14.5 L0 14.5 Z" fill="#6d5fd0"/>` },
  pelota: { caja: [24, 24], svg: `<circle cx="12" cy="12" r="11" fill="#fb923c"/><path d="M3 9 Q12 15 21 9" stroke="#ea580c" stroke-width="1.2" fill="none"/><ellipse cx="8" cy="7.5" rx="3.6" ry="2.3" fill="#fff" opacity=".45"/>` },
  banda: { caja: [44, 16], svg: `<path d="M3 11 Q11 1 21 8 Q31 15 40 5" stroke="#22c55e" stroke-width="4.5" stroke-linecap="round" fill="none"/><path d="M3 11 Q12 16 22 12" stroke="#16a34a" stroke-width="3" stroke-linecap="round" fill="none"/>` },
  aro: { caja: [32, 32], svg: `<circle cx="16" cy="16" r="12" fill="none" stroke="#7c3aed" stroke-width="3.6"/><rect x="0.5" y="10" width="6" height="12" rx="2.5" fill="#c4b5fd"/><rect x="25.5" y="10" width="6" height="12" rx="2.5" fill="#c4b5fd"/>` },
  rodillo: { caja: [58, 18], svg: `<rect x="0" y="1" width="58" height="17" rx="8.5" fill="#60a5fa"/><ellipse cx="50" cy="9.5" rx="6" ry="8.5" fill="#93c5fd"/><path d="M6 5 L44 5" stroke="#fff" stroke-width="1.5" opacity=".5" stroke-linecap="round"/>` },
  pizarra: { caja: [84, 56], svg: `<rect x="0" y="0" width="84" height="54" rx="4" fill="#78716c"/><rect x="4" y="4" width="76" height="46" rx="2" fill="#fbfaf7"/>
    <text x="9" y="15" font-size="7.5" font-weight="800" fill="#0d9488">MI CLASE</text>
    ${['1. Hundred · 10', '2. Roll up · 5', '3. Leg circles · 5', '4. Swan · 4'].map((t, i) => `<text x="9" y="${25 + i * 7.5}" font-size="5.6" fill="#44403c">${t}</text>`).join('')}
    <path d="M60 30 L66 36 L76 22" stroke="#16a34a" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>` },
  spine: { caja: [62, 36], svg: `<path d="M0 36 L0 23 Q0 17 7 17 L17 17 L18 25 Q30 2 49 8 Q62 14 62 36 Z" fill="${TAPIZ}"/><path d="M0 34 L62 34 L62 36 L0 36 Z" fill="${MADERA_O}"/><path d="M24 20 Q35 8 49 12" stroke="${TAPIZ_C}" stroke-width="2" fill="none" opacity=".7"/>` },
  chair: { caja: [66, 60], svg: `<rect x="0" y="12" width="48" height="48" rx="3" fill="${MADERA}"/><rect x="-2" y="7" width="52" height="7" rx="3" fill="${TAPIZ}"/>
    <rect x="5" y="20" width="38" height="30" rx="2" fill="${MADERA_O}" opacity=".35"/>${resorte(12, 52, 36, 52, 5)}
    <path d="M47 55 L64 45" stroke="${METAL_O}" stroke-width="4" stroke-linecap="round"/><rect x="58" y="40" width="8" height="5" rx="2" transform="rotate(-30 62 42)" fill="${TAPIZ}"/>` },
  barrel: { caja: [100, 82], svg: `<rect x="0" y="76" width="100" height="6" rx="2" fill="${MADERA_O}"/>
    <rect x="4" y="6" width="5" height="72" rx="2" fill="${MADERA}"/><rect x="21" y="6" width="5" height="72" rx="2" fill="${MADERA}"/>
    ${[14, 25, 36, 47, 58].map(y => `<rect x="4" y="${y}" width="22" height="3.4" rx="1.7" fill="${MADERA_O}"/>`).join('')}
    <path d="M40 77 L40 46 Q40 18 68 18 Q96 18 96 46 L96 77 Z" fill="${TAPIZ}"/><path d="M47 40 Q52 25 68 24" stroke="${TAPIZ_C}" stroke-width="3" fill="none" opacity=".6" stroke-linecap="round"/>` },
  reformer: { caja: [172, 62], svg: `<rect x="6" y="50" width="7" height="12" rx="2" fill="${MADERA_O}"/><rect x="159" y="50" width="7" height="12" rx="2" fill="${MADERA_O}"/>
    <rect x="0" y="40" width="172" height="12" rx="4" fill="${MADERA}"/><path d="M8 43 L164 43" stroke="${MADERA_O}" stroke-width="1.5"/>
    <rect x="0" y="8" width="6" height="34" rx="2" fill="${MADERA}"/><circle cx="3" cy="11" r="3.2" fill="${METAL_O}"/>
    <path d="M5 12 L44 29 M5 15 L44 31" stroke="#334155" stroke-width="1.2"/>
    <rect x="40" y="27" width="60" height="12" rx="3.5" fill="${TAPIZ}"/><rect x="31" y="29" width="11" height="9" rx="3" fill="${TAPIZ_C}"/>
    <rect x="86" y="15" width="7" height="14" rx="2.5" fill="${TAPIZ_C}"/>
    ${resorte(100, 35, 144, 35, 8)}
    <path d="M152 41 L147 14" stroke="${METAL_O}" stroke-width="3.2" stroke-linecap="round"/><circle cx="147" cy="13" r="3.8" fill="${METAL}"/>` },
  cadillac: { caja: [142, 132], svg: `<rect x="6" y="100" width="7" height="32" rx="2" fill="${MADERA_O}"/><rect x="129" y="100" width="7" height="32" rx="2" fill="${MADERA_O}"/>
    <rect x="0" y="88" width="142" height="13" rx="4" fill="${TAPIZ}"/><rect x="2" y="100" width="138" height="5" rx="2" fill="${MADERA}"/>
    <rect x="4" y="0" width="5" height="90" rx="2" fill="${METAL}"/><rect x="133" y="0" width="5" height="90" rx="2" fill="${METAL}"/>
    <rect x="4" y="0" width="134" height="5" rx="2" fill="${METAL}"/>
    <path d="M58 5 L61 44 M86 5 L83 44" stroke="#334155" stroke-width="1.4"/><rect x="56" y="43" width="32" height="4.5" rx="2" fill="${MADERA}"/>
    <rect x="9" y="56" width="42" height="4" rx="2" fill="${METAL_O}"/>${resorte(30, 5, 30, 56, 6)}
    ${resorte(114, 5, 114, 42, 5)}<rect x="108" y="42" width="12" height="4" rx="2" fill="${TAPIZ_C}"/>` },
  diploma: { caja: [34, 42], svg: `<rect x="0" y="0" width="34" height="40" rx="2" fill="${MADERA}"/><rect x="3" y="3" width="28" height="34" fill="#fffdf5"/>
    <path d="M8 11 L26 11 M8 16 L26 16 M8 21 L20 21" stroke="#a8a29e" stroke-width="1.4"/><circle cx="17" cy="29" r="5" fill="#facc15" stroke="#ca8a04"/><path d="M14 33 L12 40 L17 37 L22 40 L20 33" fill="#dc2626"/>` },
  planta: { caja: [30, 46], svg: `<path d="M5 30 L25 30 L22 46 L8 46 Z" fill="#c2410c"/><path d="M4 28 L26 28 L26 32 L4 32 Z" fill="#ea580c"/>
    <path d="M15 28 Q4 20 3 6 Q13 12 15 28 Q14 12 22 1 Q25 16 15 28 Q24 18 29 16 Q27 26 15 28" fill="#16a34a"/>` },
  espejo: { caja: [28, 112], svg: `<rect x="0" y="0" width="28" height="112" rx="4" fill="${MADERA}"/><rect x="3" y="3" width="22" height="106" rx="2" fill="#dbeafe"/>
    <path d="M7 20 L14 10 M7 34 L20 18" stroke="#fff" stroke-width="2.4" opacity=".8" stroke-linecap="round"/>` }
};
/* dónde va cada cosa en la escena (420 × 262; el piso empieza en y = 158) */
const LUGARES = {
  espejo: [96, 18], diploma: [134, 24], pizarra: [176, 18], cadillac: [274, 40], reformer: [6, 116, 0.86],
  planta: [4, 212], chair: [26, 166], spine: [86, 206], barrel: [318, 150], mat: [146, 232],
  banda: [48, 244], pelota: [288, 226], aro: [318, 222], rodillo: [356, 238]
};

function aparatoMini(k) {
  const d = DIBUJOS[k];
  const m = 6, w = d.caja[0] + m * 2, h = d.caja[1] + m * 2;
  return `<svg viewBox="${-m} ${-m} ${w} ${h}" class="ap-mini" aria-hidden="true">${d.svg}</svg>`;
}

let pjPose = 'quieto';
function escenaSVG() {
  const aps = Object.keys(APARATOS).filter(k => cumple(APARATOS[k].cond));
  const orden = ['espejo', 'diploma', 'pizarra', 'cadillac', 'reformer', 'barrel', 'chair', 'planta', 'spine', 'mat', 'banda', 'pelota', 'aro', 'rodillo'];
  const visibles = orden.filter(k => aps.includes(k));
  const pieza = k => {
    const [x, y, s = 1] = LUGARES[k];
    return `<g transform="translate(${x} ${y}) scale(${s})"><g class="ap" data-ap="${k}" tabindex="0" role="button" aria-label="${esc(APARATOS[k].nom)}">${DIBUJOS[k].svg}</g></g>`;
  };
  /* lo que está detrás del personaje se dibuja antes; los accesorios del piso, delante */
  const iMat = orden.indexOf('mat');
  const antes = visibles.filter(k => orden.indexOf(k) <= iMat).map(pieza);
  const despues = visibles.filter(k => orden.indexOf(k) > iMat).map(pieza);
  /* cartel con el nombre del estudio, colgado arriba de la pared */
  const nom = nombreEstudio(), ancho = Math.min(236, Math.max(90, nom.length * 7.4 + 26));
  const cartel = `<g class="esc-cartel" transform="translate(${Math.min(414 - ancho, 296 - ancho / 2)} 1)"><path d="M${ancho * 0.2} 0 L${ancho * 0.2} 3 M${ancho * 0.8} 0 L${ancho * 0.8} 3" class="esc-cartel-hilo"/>
    <rect x="0" y="3" width="${ancho}" height="19" rx="4" class="esc-cartel-tabla"/><text x="${ancho / 2}" y="16.6" text-anchor="middle"${nom.length * 7.4 + 26 > ancho ? ` textLength="${ancho - 16}" lengthAdjust="spacingAndGlyphs"` : ''}>${esc(nom)}</text></g>`;
  return `<svg class="escena" viewBox="0 0 420 262" role="group" aria-label="${esc(nom)}">
    <rect x="0" y="0" width="420" height="160" class="esc-pared"/>
    <rect x="0" y="158" width="420" height="104" class="esc-piso"/>
    <path d="M0 158 L420 158" class="esc-zocalo"/>
    ${[196, 226].map(y => `<path d="M0 ${y} L420 ${y}" class="esc-tabla"/>`).join('')}
    <g class="esc-ventana"><rect x="22" y="20" width="62" height="70" rx="4"/><path d="M53 20 L53 90 M22 55 L84 55"/></g>
    <circle cx="44" cy="40" r="7" class="esc-sol"/>
    ${cartel}
    ${antes.join('')}
    <g transform="translate(151 44)"><g class="pj-escena" data-pj tabindex="0" role="button" aria-label="${esc(pj().nombre)}: tocá para charlar">${avatarG(equipado(), pjPose)}</g></g>
    ${despues.join('')}
  </svg>`;
}

/* ---------------- vistas ---------------- */

function frasePJ() {
  const due = vencidos().length, racha = rachaVigente(), e = S.log[HOY()] || {};
  const ctx = [];
  if (due) ctx.push(`Tenés ${due} ${due === 1 ? 'repaso' : 'repasos'} esperando. ¿Arrancamos?`);
  if (racha > 0 && S.ultimoDia !== HOY()) ctx.push(`¡No cortemos la racha de ${racha} ${racha === 1 ? 'día' : 'días'}!`);
  if (e.metaOk) ctx.push('Meta de hoy cumplida. Lo que sumemos ahora es extra.');
  const prox = proximoDesbloqueo();
  if (prox && progresoCond(prox.cond) >= 0.6) ctx.push(`Estamos cerca: ${prox.nom} (${faltaCond(prox.cond)}).`);
  return ctx.length && Math.random() < 0.7 ? azar(ctx) : azar(FRASES_PJ);
}

/* tarjeta chica en Inicio */
function tarjetaPJ() {
  const p = pj(), prox = proximoDesbloqueo(), nuevos = nuevosDesbloqueos().length;
  return `<button type="button" class="pj-card" id="pjCard" aria-label="Ir a ${esc(nombreEstudio())}">
    <span class="pj-card-av">${avatarSVG('quieto')}</span>
    <span class="pj-card-txt">
      <b>${esc(p.nombre)} ${nuevos ? `<span class="pj-nuevo">${nuevos} nuevo${nuevos === 1 ? '' : 's'}</span>` : ''}</b>
      <span class="pj-globo">${esc(frasePJ())}</span>
      ${prox ? `<span class="pj-prox"><small>Próximo: ${esc(prox.nom)} · ${esc(faltaCond(prox.cond) || textoCond(prox.cond))}</small>
        <span class="barra"><span style="width:${Math.round(progresoCond(prox.cond) * 100)}%"></span></span></span>` : ''}
    </span>
  </button>`;
}

/* en el cierre de la lección */
function bloqueFinPJ() {
  const nuevos = nuevosDesbloqueos();
  const p = pj();
  const html = `<div class="fin-pj ${nuevos.length ? 'con-nuevos' : ''}">
    <span class="fin-pj-av">${avatarSVG('festeja', 'salta')}</span>
    <div>${nuevos.length
      ? `<b>¡Nuevo para ${esc(nombreEstudio())}!</b><ul>${nuevos.slice(0, 5).map(it =>
          `<li>${it.cat === 'aparato' ? '🏋️' : it.ico || '👕'} ${esc(it.nom)}</li>`).join('')}${nuevos.length > 5 ? `<li>y ${nuevos.length - 5} más</li>` : ''}</ul>`
      : `<b>${esc(p.nombre)} festeja con vos</b><small>${esc(azar(FRASES_PJ))}</small>`}</div>
  </div>`;
  if (nuevos.length) marcarVistos(nuevos);
  return html;
}

let pestanaEstudio = 'vestuario';
function vEstudio() {
  const p = pj();
  const cat = catalogoPJ(), total = cat.filter(it => it.cond).length, ya = cat.filter(it => it.cond && desbloqueado(it)).length;
  const prox = proximoDesbloqueo();
  const recien = new Set(nuevosDesbloqueos().map(it => it.id));
  app().innerHTML = `
    <div class="pj-cab">
      <div class="pj-campo pj-campo-estudio">
        <label for="pjEstudio">🏠 Tu estudio</label>
        <div class="pj-nombre"><span class="pj-edit"><input id="pjEstudio" value="${esc(nombreEstudio())}" maxlength="32" placeholder="Estudio de ${esc(p.nombre)}" spellcheck="false" autocomplete="off"><span class="pj-lapiz" aria-hidden="true">✎</span></span>
          <button type="button" class="btn small" id="estDado" title="Otro nombre para el estudio" aria-label="Proponer otro nombre para el estudio">🎲</button></div>
      </div>
      <div class="pj-campo pj-campo-personaje">
        <label for="pjNombre">🧘 Tu personaje</label>
        <div class="pj-nombre"><span class="pj-edit"><input id="pjNombre" value="${esc(p.nombre)}" maxlength="24" spellcheck="false" autocomplete="off"><span class="pj-lapiz" aria-hidden="true">✎</span></span>
          <button type="button" class="btn small" id="pjDado" title="Otro nombre para tu personaje" aria-label="Proponer otro nombre para tu personaje">🎲</button></div>
      </div>
      <p class="sub">Tocá los nombres para cambiarlos. Con cada lección, racha y logro se suman prendas, accesorios y aparatos. Tocá a <span data-nom-pj>${esc(p.nombre)}</span> para charlar y cada aparato para ver su ficha.</p>
    </div>
    <div class="escena-wrap">
      ${escenaSVG()}
      <div class="globo-pj" id="pjGlobo" hidden></div>
    </div>
    <div class="pj-progreso">
      <div><b>${ya} de ${total}</b> desbloqueados</div>
      ${prox ? `<div class="pj-prox"><small>Próximo: <b>${esc(prox.nom)}</b> · ${esc(textoCond(prox.cond))}${faltaCond(prox.cond) ? ' · ' + esc(faltaCond(prox.cond)) : ''}</small>
        <span class="barra"><span style="width:${Math.round(progresoCond(prox.cond) * 100)}%"></span></span></div>` : '<div><small>¡Tenés todo el estudio!</small></div>'}
    </div>
    <div class="seg pestanas" role="tablist">${[['vestuario', 'Vestuario'], ['aparatos', 'Aparatos y objetos']].map(([k, t]) =>
      `<button type="button" role="tab" aria-selected="${pestanaEstudio === k}" class="${pestanaEstudio === k ? 'on' : ''}" data-p="${k}"><b>${t}</b></button>`).join('')}</div>
    <div id="pjPanel">${pestanaEstudio === 'vestuario' ? panelVestuario(recien) : panelAparatos(recien)}</div>`;

  /* los nombres se actualizan en vivo (texto, cartel del estudio, etiquetas) y se guardan al soltar */
  const refrescarNombres = () => {
    $$('[data-nom-pj]').forEach(x => { x.textContent = p.nombre; });
    const est = nombreEstudio(), t = $('.esc-cartel text');
    if (t) { t.textContent = est; t.removeAttribute('textLength'); }
    $('#pjEstudio').placeholder = `Estudio de ${p.nombre}`;
    const esc_ = $('.escena'); if (esc_) esc_.setAttribute('aria-label', est);
    const fig = $('.pj-escena'); if (fig) fig.setAttribute('aria-label', `${p.nombre}: tocá para charlar`);
  };
  $('#pjNombre').oninput = e => { p.nombre = e.target.value.trim().slice(0, 24) || 'Core-azón'; refrescarNombres(); };
  $('#pjNombre').onchange = e => { p.nombre = e.target.value.trim().slice(0, 24) || 'Core-azón'; e.target.value = p.nombre; guardar(); redibujarEstudio(); hablar(`¡Hola! Ahora me llamo ${p.nombre}.`); };
  $('#pjEstudio').oninput = e => { p.estudio = e.target.value.slice(0, 32); refrescarNombres(); };
  $('#pjEstudio').onchange = e => { p.estudio = e.target.value.trim().slice(0, 32); guardar(); redibujarEstudio(); };
  $('#pjDado').onclick = () => {
    const otros = NOMBRES_PJ.filter(n => n !== p.nombre);
    p.nombre = otros[(NOMBRES_PJ.indexOf(p.nombre) + 1) % otros.length] || azar(otros);
    guardar(); SND.toque();
    $('#pjNombre').value = p.nombre; refrescarNombres();
    if (!p.estudio) $('#pjEstudio').value = nombreEstudio();
    hablar(`¿«${p.nombre}»? ¡Me encanta!`);
  };
  $('#estDado').onclick = () => {
    const actual = nombreEstudio(), otros = NOMBRES_ESTUDIO.filter(n => n !== actual);
    p.estudio = otros[(NOMBRES_ESTUDIO.indexOf(actual) + 1) % otros.length] || azar(otros);
    guardar(); SND.toque();
    $('#pjEstudio').value = p.estudio; refrescarNombres();
    hablar(`«${p.estudio}»… ¡suena a un lugar donde da gusto entrenar!`);
  };
  $$('.pestanas button').forEach(b => b.onclick = () => { pestanaEstudio = b.dataset.p; redibujarEstudio(); });
  conectarEscena();
  conectarPanel();
  if (recien.size) setTimeout(() => marcarVistos(catalogoPJ().filter(it => recien.has(it.id))), 400);
}
function redibujarEstudio() { const y = window.scrollY; vEstudio(); window.scrollTo(0, y); }

function hablar(txt) {
  const g = $('#pjGlobo');
  if (!g) return;
  g.textContent = txt;
  g.hidden = false;
  g.classList.remove('entra'); void g.offsetWidth; g.classList.add('entra');
  clearTimeout(hablar.t);
  hablar.t = setTimeout(() => { g.hidden = true; }, 4200);
}

function conectarEscena() {
  const fig = $('.pj-escena');
  const tocarPJ = () => {
    fig.classList.remove('salta'); void fig.getBBox(); fig.classList.add('salta');
    SND.bien(1);
    hablar(frasePJ());
  };
  fig.addEventListener('click', tocarPJ);
  fig.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tocarPJ(); } });
  $$('.escena .ap').forEach(a => {
    const abrir = () => fichaAparato(a.dataset.ap);
    a.addEventListener('click', abrir);
    a.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); abrir(); } });
  });
}

function fichaAparato(k) {
  const a = APARATOS[k], ok = cumple(a.cond);
  const m = abrirModal(`<div class="ap-ficha">
    <div class="ap-ficha-dib">${aparatoMini(k)}</div>
    <h3>${esc(a.nom)}</h3>
    ${ok ? `<p>${esc(a.info)}</p>${a.examen ? `<div class="ap-examen"><b>📝 En tus exámenes</b><p>${esc(a.examen)}</p></div>` : ''}`
         : `<p class="ap-bloq">🔒 ${esc(textoCond(a.cond))}${faltaCond(a.cond) ? ` · ${esc(faltaCond(a.cond))}` : ''}</p>
            <div class="barra gruesa"><span style="width:${Math.round(progresoCond(a.cond) * 100)}%"></span></div>`}
    ${ok && a.clase ? '<button type="button" class="btn3d verde ancho" id="apClase">Armar una clase</button>' : ''}
    <button type="button" class="btn ghost ancho" id="apCerrar">Cerrar</button>
  </div>`);
  $('#apCerrar', m).onclick = cerrarModal;
  if ($('#apClase', m)) $('#apClase', m).onclick = () => { cerrarModal(); ir('clase'); };
}

const swatch = (grupo, k, color, nom, cond, on, nuevo) => {
  const ok = cumple(cond);
  return `<button type="button" class="sw ${on ? 'on' : ''} ${ok ? '' : 'bloq'} ${nuevo ? 'recien' : ''}" data-g="${grupo}" data-k="${k}"
    style="--sw:${color}" title="${esc(nom)}${ok ? '' : ' · 🔒 ' + esc(textoCond(cond))}" aria-label="${esc(nom)}${ok ? '' : ', bloqueado'}" aria-pressed="${on}">${ok ? '' : '🔒'}</button>`;
};
const opcion = (grupo, k, nom, cond, on, nuevo, ico = '') => {
  const ok = cumple(cond);
  return `<button type="button" class="pj-op ${on ? 'on' : ''} ${ok ? '' : 'bloq'} ${nuevo ? 'recien' : ''}" data-g="${grupo}" data-k="${k}" aria-pressed="${on}"
    title="${ok ? '' : '🔒 ' + esc(textoCond(cond))}">${ico ? `<span>${ico}</span>` : ''}${esc(nom)}${ok ? '' : ' 🔒'}</button>`;
};

function panelVestuario(recien) {
  const p = pj();
  const colores = (g, sel, pref) => Object.entries(COLORES_ROPA).map(([k, c]) => swatch(g, k, c.c, c.nom, c.cond, sel === k, recien.has(pref + k))).join('');
  return `<div class="pj-panel">
    <h3 class="pj-h">Piel</h3><div class="sws">${PIELES.map((c, i) => swatch('piel', i, c, 'Tono ' + (i + 1), null, p.piel === i)).join('')}</div>
    <h3 class="pj-h">Pelo</h3><div class="pj-ops">${Object.entries(PELOS).map(([k, n]) => opcion('pelo', k, n, null, p.pelo === k)).join('')}</div>
    <div class="sws">${Object.entries(COLORES_PELO).map(([k, c]) => swatch('colorPelo', k, c.c, c.nom, c.cond, p.colorPelo === k, recien.has('cp:' + k))).join('')}</div>
    <h3 class="pj-h">Arriba</h3><div class="pj-ops">${Object.entries(ARRIBAS).map(([k, a]) => opcion('arriba', k, a.nom, a.cond, p.arriba === k, recien.has('ar:' + k))).join('')}</div>
    <div class="sws">${colores('colorArriba', p.colorArriba, 'cr:')}</div>
    <h3 class="pj-h">Abajo</h3><div class="pj-ops">${Object.entries(ABAJOS).map(([k, a]) => opcion('abajo', k, a.nom, a.cond, p.abajo === k, recien.has('ab:' + k))).join('')}</div>
    <div class="sws">${colores('colorAbajo', p.colorAbajo, 'cr:')}</div>
    <h3 class="pj-h">Medias antideslizantes</h3><div class="sws">${colores('medias', p.medias, 'cr:')}</div>
    <h3 class="pj-h">Accesorios <small>(podés combinar varios)</small></h3>
    <div class="pj-ops">${Object.entries(ACCESORIOS_PJ).map(([k, a]) => opcion('acc', k, a.nom, a.cond, p.acc.includes(k), recien.has('ac:' + k), a.ico)).join('')}</div>
  </div>`;
}

function panelAparatos(recien) {
  return `<div class="ap-grid">${Object.entries(APARATOS).map(([k, a]) => {
    const ok = cumple(a.cond);
    return `<button type="button" class="ap-card ${ok ? '' : 'bloq'} ${recien.has('ap:' + k) ? 'recien' : ''}" data-ficha="${k}">
      ${aparatoMini(k)}<b>${esc(a.nom)}</b>
      ${ok ? `<small>${recien.has('ap:' + k) ? '¡Nuevo!' : 'En tu estudio'}</small>`
           : `<small>🔒 ${esc(textoCond(a.cond))}</small><span class="barra"><span style="width:${Math.round(progresoCond(a.cond) * 100)}%"></span></span>`}
    </button>`;
  }).join('')}</div>`;
}

function conectarPanel() {
  const p = pj();
  $$('#pjPanel [data-g]').forEach(b => b.onclick = () => {
    const g = b.dataset.g, k = b.dataset.k;
    if (b.classList.contains('bloq')) {
      toast(`🔒 ${esc(b.title.replace(/^.*🔒\s*/, '') || 'Todavía no')}`, 'toast-suave');
      SND.parMal();
      return;
    }
    if (g === 'piel') p.piel = +k;
    else if (g === 'acc') p.acc = p.acc.includes(k) ? p.acc.filter(x => x !== k) : [...p.acc, k];
    else p[g] = k;
    guardar(); SND.toque();
    pjPose = g === 'acc' && p.acc.includes(k) ? 'festeja' : 'quieto';
    redibujarEstudio();
    pjPose = 'quieto';
  });
  $$('#pjPanel [data-ficha]').forEach(b => b.onclick = () => fichaAparato(b.dataset.ficha));
}
