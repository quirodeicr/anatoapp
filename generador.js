/* ============================================================
   Pilates Lab — Generador de clases

   Arma una clase completa a partir de lo que se elija (duración,
   nivel, props o ninguno, cuidados, el orden de las posiciones —el
   del manual, uno a elección o al azar— y un principio para darle
   más peso) y la guarda como una sesión de "Mis sesiones", donde se
   puede revisar, cambiar y copiar.

   Siempre cumple:
     · los 5 principios del movimiento de Balanced Body (todo el
       cuerpo, integración del tronco, parte inferior, parte superior,
       movilidad/flexibilidad/recuperación): al menos dos ejercicios de
       cada uno, según los análisis MAT 1 y MAT 2 y la planilla de
       Pre-Pilates; el "todo el cuerpo" pide además los tres planos;
     · los elementos de una clase balanceada (Mat 2, págs. 66–69):
       calentamiento, flexión, movilidad de columna, extensión, rotación
       o lateral, tren superior y tren inferior;
     · la fluidez: un bloque por posición, cada cambio con su transición
       (TRANSICIONES de clase.js), los props agrupados para no cambiar
       a cada rato, de lo más simple a lo más exigente dentro de cada
       bloque, respiración al empezar y recuperación al terminar.
   Los props salen de los accesorios que asisten o resisten en las
   fichas MAT 1 y MAT 2 y de las fotos de Mat 3 Props. Los cuidados
   usan las precauciones del manual (y la columna de contraindicaciones
   de Pre-Pilates).
   La clasificación por principio de lo que las fichas no dicen (los
   secundarios, los planos de Mat 1 y 2) es elaboración propia.
   ============================================================ */
'use strict';

const PRINCIPIOS = [
  { k: 'global', nom: 'Movimiento de todo el cuerpo', corto: 'Todo el cuerpo', ico: '🌀' },
  { k: 'tronco', nom: 'Integración del tronco', corto: 'Tronco', ico: '🎯' },
  { k: 'mmii', nom: 'Fuerza y potencia de la parte inferior', corto: 'Parte inferior', ico: '🦵' },
  { k: 'mmss', nom: 'Fuerza y equilibrio de la parte superior', corto: 'Parte superior', ico: '💪' },
  { k: 'movil', nom: 'Movilidad, flexibilidad y recuperación', corto: 'Movilidad', ico: '🌿' }
];
const PLANOS_GEN = ['sagital', 'frontal', 'transversal'];
const NIVELES_GEN = [['principiante', 'Principiante'], ['intermedio', 'Intermedio'], ['avanzado', 'Avanzado'], ['super', 'Súper avanzado']];
const CUIDADOS_GEN = [
  ['osteo', 'Osteoporosis'], ['lumbar', 'Zona lumbar'], ['cuello', 'Cuello y hombros'],
  ['muneca', 'Muñecas'], ['rodilla', 'Rodillas'], ['cadera', 'Cadera']
];
/* props: lo que dicen las fichas (bola, banda, aro, mancuerna…) en los de la app */
const PROP_TIPOS = [
  ['Bola', /bola|pelota/], ['Liga cerrada', /(liga|banda) cerrada/], ['Liga abierta', /(liga|banda)( abierta)?|bandas?\b/],
  ['Pesa', /pesa|mancuerna/], ['Círculo', /\baro\b|magic circle|circulo/], ['Roller', /rodillo|roller/],
  ['Bloque', /bloque|caja/], ['Silla', /silla|banca/]
];
/* props de las fotos de Mat 3 Props (qué prop se mostró en cada ejercicio) */
const PROPS_MAT3 = {
  'mat1-e01': ['Bola', 'Círculo', 'Liga abierta', 'Pesa', 'Roller'], 'mat1-e02': ['Bola', 'Círculo', 'Liga abierta', 'Pesa', 'Roller'],
  'mat1-e03': ['Bola', 'Círculo', 'Liga abierta', 'Liga cerrada', 'Pesa', 'Roller'], 'mat1-e04': ['Bola', 'Liga abierta', 'Liga cerrada', 'Pesa', 'Roller'],
  'mat1-e05': ['Bola', 'Círculo', 'Liga cerrada'], 'mat1-e06': ['Bola', 'Círculo', 'Liga abierta', 'Pesa'], 'mat1-e07': ['Bola', 'Círculo'],
  'mat1-e09': ['Bola', 'Liga abierta'], 'mat1-e10': ['Círculo', 'Liga abierta'], 'mat2-e10': ['Bola', 'Círculo', 'Liga cerrada'],
  'mat2-e07': ['Bola', 'Círculo', 'Liga cerrada'], 'mat2-e13': ['Bola', 'Círculo', 'Liga abierta', 'Pesa'],
  'mat1-e11': ['Bola', 'Liga abierta', 'Liga cerrada', 'Roller'], 'mat1-e12': ['Bola', 'Círculo', 'Liga cerrada'], 'mat1-e13': ['Liga abierta'],
  'mat1-e24': ['Bola', 'Liga cerrada'], 'mat1-e14': ['Círculo', 'Liga abierta'], 'mat1-e15': ['Bola', 'Círculo', 'Liga cerrada', 'Roller'],
  'mat1-e18': ['Círculo', 'Liga cerrada', 'Roller'], 'mat2-e12': ['Bola', 'Círculo', 'Liga abierta', 'Roller']
};
/* el orden de posiciones del manual (Mat 1, págs. 65–67): de pie → cuatro apoyos → supino
   (con las inversiones) → sentado → prono → plancha → de costado → cierre de pie */
const ORDEN_MANUAL = ['pie', 'cuatro', 'supino', 'sentado', 'prono', 'plancha', 'costado'];
const POS_GEN = ORDEN_MANUAL;
/* cuánto de la clase va en cada posición (elaboración propia, sobre las secuencias de muestra) */
const PESO_POS = { pie: 0.09, cuatro: 0.09, supino: 0.3, sentado: 0.15, prono: 0.14, plancha: 0.08, costado: 0.15 };

/* ---------- lo que se sabe de cada ejercicio del catálogo ---------- */
const nivelNum = n => /super|súper/i.test(n || '') ? 3 : /avanzado/i.test(n || '') ? 2 : /intermedio/i.test(n || '') ? 1 : 0;
const propTipo = t => { const s = norm(t); const x = PROP_TIPOS.find(([, re]) => re.test(s)); return x ? x[0] : null; };
let INFO_GEN = null;
function infoGen(id) {
  if (!INFO_GEN) {
    INFO_GEN = {};
    for (const e of catalogoPlan()) INFO_GEN[e.id] = analizarEjGen(e);
  }
  return INFO_GEN[id];
}
function analizarEjGen(e) {
  const pri = new Set(), sec = new Set(), planos = new Set(), props = [], requiere = [];
  let nivel = 0, prec = {}, contra = '', calienta = false, recupera = false, texto = '';
  const marcar = (t, conj) => {
    const s = norm(t);
    if (/integracion del tronco|unidad interna|unidad externa|lumbopelv|abdomin|respiracion|pelvis neutra|fortalecer el tronco|control abdominal|core|control del centro|tronco lateral|oblicuos/.test(s)) conj.add('tronco');
    if (/mmii|miembro inferior|potencia de mmii|isquiotib|glute|aductor|abductor|abduccion de cadera|aduccion de cadera|extension de cadera|extensores de cadera|flexores de cadera|rotadores de cadera|cadena posterior|pies y tobillos|fortalecer mmii/.test(s)) conj.add('mmii');
    if (/mmss|miembro superior|glenohumeral|escapul|plancha|brazo recto|hombro posterior|hombro anterior|ritmo escapular|cintura escapular|serrato|triceps|dorsal ancho|deltoides|manguito/.test(s)) conj.add('mmss');
    if (/todo el cuerpo|global|patron de movimiento funcional/.test(s)) conj.add('global');
    if (/movilidad|estir|flexibilidad|elongacion|stretch/.test(s)) conj.add('movil');
  };
  const sumarProps = (lista, modo) => (lista || []).forEach(([t, d]) => { const tipo = propTipo(t); if (tipo) props.push({ tipo, txt: d ? `${t}: ${d.charAt(0).toLowerCase()}${d.slice(1)}` : t, modo }); });
  if (e.pm) {
    const p = PREMAT.find(x => x.id === e.id);
    const pr = norm(p.principio);
    pri.add(/mmii/.test(pr) ? 'mmii' : /mmss/.test(pr) ? 'mmss' : 'tronco');
    marcar([p.comp, p.obj].join(' '), sec);
    const pl = norm(p.plano || '');
    if (/multi/.test(pl)) PLANOS_GEN.forEach(x => planos.add(x)); else if (pl) planos.add(pl);
    contra = p.contra || '';
    calienta = /respiracion|unidad interna|pelvis neutra/.test(norm(p.comp || ''));
    recupera = /movilidad de la columna/.test(norm(p.comp || '')) && /stretch|roll down|cat cow|flexion|lateral|rotation|twist|tail wag/i.test(p.n);
    /* lo que pide un prop para hacerse (banda, aro, silla) */
    const req = /silla|banca/i.test(p.n + p.pos) ? 'Silla' : /\baro\b/i.test(p.n) ? 'Círculo' : /banda|liga|resistencia/i.test(p.n) ? 'Liga abierta' : null;
    if (req) requiere.push(req);
    /* sin apoyo en un solo brazo ni plancha a una pierna en principiantes (Mat 1, pág. 74) */
    if ((/plancha|lateral/i.test(p.pos) && /pierna (levantada|estirada)|levantamiento de (la )?pierna|levantamiento de piernas|sube y baja/i.test(p.n)) || /single arm lift plank/i.test(p.n)) nivel = 1;
    texto = [p.n, p.comp, p.obj].join(' ');
  } else {
    const b = BB.ejercicios.find(x => x.id === e.id);
    const m1 = b.analisis && typeof MAT1 !== 'undefined' ? MAT1.find(m => m.id === b.analisis) : null;
    const m2 = typeof MAT2 !== 'undefined' ? MAT2.find(m => m.bb === e.id) : null;
    const ficha = m1 || m2 || {};
    const principal = m1 ? m1.bb : m2 ? m2.principio : '';
    /* el primero que nombra la ficha es el principal; lo demás (y los objetivos) suma */
    const primero = String(principal).split(/·|:|,/)[0];
    marcar(primero, pri);
    if (/movimiento global/i.test(principal)) pri.add('global');
    /* lo secundario: la ficha y los propósitos del manual (Push Ups, Leg Pull y Twist: "fortalecer todo el cuerpo") */
    marcar([principal, ...(ficha.obj || []), ...(b.prop || [])].join(' '), sec);
    nivel = nivelNum(b.nivel);
    prec = b.prec || {};
    sumarProps(ficha.asiste, 'asiste'); sumarProps(ficha.resiste, 'resiste');
    const n = norm(b.n);
    if (/saw|twist|criss|corkscrew|hip circles/.test(n)) planos.add('transversal');
    if (/side|mermaid|bananas|kneeling/.test(n)) planos.add('frontal');
    if (!planos.size || /twist|saw|criss|side bend|corkscrew/.test(n)) planos.add('sagital');
    calienta = /hundred/.test(n);
    recupera = /spine stretch|saw|mermaid/.test(n);
    texto = [b.n, principal, ...(ficha.obj || []), ...(b.prop || [])].join(' ');
  }
  /* props de las fotos de Mat 3 que las fichas no nombran */
  for (const t of PROPS_MAT3[e.id] || []) if (!props.some(x => x.tipo === t)) props.push({ tipo: t, txt: `Con ${t.toLowerCase()} (como en tus fotos de Mat 3)`, modo: '' });
  pri.forEach(k => sec.add(k));
  const n = norm(e.n);
  const elementos = new Set(ELEMENTOS_CLASE.filter(el => el.re.test(n)).map(el => el.k));
  if (e.pm) {
    /* Pre-Pilates por su componente */
    const c = norm(texto);
    if (/estabilidad escapular|plancha|hombro/.test(c)) elementos.add('superior');
    if (/abduccion|aduccion|extension de cadera|flexion de cadera|pies y tobillos|sentadilla|squat|estocada|zancada|heel raise/.test(c)) elementos.add('inferior');
    if (/rotation|rotacion|twist|tail wag|oblique/.test(c)) elementos.add('rotacion');
    if (/swan|rocket|swimming|extension/.test(n) && (e.pos === 'prono' || /standing extension/.test(n))) elementos.add('extension');
    if (/curl|abdominals|toe tap|pelvic clock|dead bug|diagonal press/.test(n)) elementos.add('flexion');
  }
  /* rodar en C (Rolling Like a Ball, Seal, Open Leg Rocker) es trabajo abdominal en flexión */
  if (/rolling|seal|rocker|boomerang/.test(n)) elementos.add('flexion');
  return { pri, sec, planos, props, requiere, nivel, prec, contra, calienta, recupera, elementos };
}
const principiosDe = id => { const i = infoGen(id); return i ? i.sec : new Set(); };
/* variantes del mismo ejercicio: una sola por clase (dos de la familia del swan: la preparación
   y el ejercicio) */
const FAMILIAS_GEN = [
  ['tablaLat', /tabla lateral|side plank|prep tabla lateral/, 1], ['tablaEsp', /tabla de espalda|tabla espalda/, 1], ['tabla', /^tabla|plank/, 1],
  ['respira', /breathing|respiraci/, 1], ['marcha', /^marching|^marcha|standing marching|walking/, 1], ['swimming', /swimming/, 1],
  ['swan', /swan|rocket/, 2], ['squat', /squat|sentadilla/, 1], ['bridge', /bridge|puente/, 1], ['multifidi', /multifidi/, 1],
  ['pelvis', /pelvic/, 1], ['abd', /abdominal curl|oblique abdominals|fingertip/, 1], ['legLift', /levantamiento .*pierna|leg lift/, 1],
  ['zancada', /estocada|zancada/, 1], ['teaser', /teaser/, 2], ['inv', /roll over|corkscrew|jackknife|scissors|^bicycle$/, 2], ['legStretch', /leg stretch/, 2], ['sideKick', /side leg (kicks|bicycle|bananas)/, 2], ['abdPie', /abduccion|abd con paso|aduccion|paso al costado/, 1], ['banda', /con banda|con bandas|con liga/, 2]
];
function familiaGen(e) { const n = norm(e.n); const f = FAMILIAS_GEN.find(([, re]) => re.test(n)); return f ? { k: f[0], max: f[2] } : { k: 'n:' + n, max: 1 }; }

/* ---------- azar con semilla (para poder pedir "otra versión" y repetirla) ---------- */
function azarGen(semilla) {
  let a = semilla >>> 0;
  return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const mezclarGen = (xs, r) => { const a = [...xs]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

/* ---------- opciones ---------- */
const CFG_GEN_BASE = { dur: 60, nivel: 'principiante', props: [], sinProps: true, uso: 'auto', orden: 'manual', posiciones: [...ORDEN_MANUAL], enfasis: '', cuidados: [] };
function cfgGen() {
  if (!S.genCfg) S.genCfg = JSON.parse(JSON.stringify(CFG_GEN_BASE));
  for (const [k, v] of Object.entries(CFG_GEN_BASE)) if (S.genCfg[k] === undefined) S.genCfg[k] = JSON.parse(JSON.stringify(v));
  return S.genCfg;
}

/* ---------- qué ejercicios entran con estas opciones ---------- */
const NIVEL_IDX = { principiante: 0, intermedio: 1, avanzado: 2, super: 3 };
function permitidoGen(e, cfg) {
  const i = infoGen(e.id), niv = NIVEL_IDX[cfg.nivel] ?? 0, cu = new Set(cfg.cuidados);
  if (i.nivel > niv) return false;
  /* principiantes: sin piernas largas bajando del todo (Double Straight Leg Stretch) */
  if (niv === 0 && e.id === 'mat1-e09') return false;
  /* inversiones: solo avanzado, y nunca con osteoporosis, problemas lumbares o cervicales (Mat 2, pág. 58) */
  if (e.pos === 'inversion' && (niv < 2 || cu.has('osteo') || cu.has('lumbar') || cu.has('cuello'))) return false;
  if (cu.has('osteo') && (/evitar/i.test(e.osteo || '') || (e.pm && /abdominal curl|oblique|roll down|standing flexion/i.test(e.n)))) return false;
  /* contraindicaciones de Pre-Pilates para la zona: afuera; las que dicen "agudo" quedan como aviso
     (con la zona sensible pero sin dolor agudo son de los más indicados: respiración, pelvis neutra) */
  if (contraGen(i.contra).some(t => !/agud/.test(t) && cfg.cuidados.some(z => ZONA_GEN[z].test(t)))) return false;
  /* con cuidados, lo más exigente que el manual marca para esa zona queda afuera; lo demás lleva la adaptación */
  const zonas = Object.keys(i.prec).join(' ');
  for (const z of ['lumbar', 'cuello', 'muneca', 'rodilla', 'cadera']) if (cu.has(z) && zonas.includes(z) && i.nivel >= 2) return false;
  if (cu.has('cuello') && /hombro/.test(zonas) && i.nivel >= 2) return false;
  /* props: los que el ejercicio necesita tienen que estar */
  if (i.requiere.some(t => cfg.sinProps || !cfg.props.includes(t))) return false;
  return true;
}
const ZONA_GEN = { osteo: /osteopor/, lumbar: /lumbar|espalda/, cuello: /cervical|cuello|hombro|subacromial/, muneca: /muneca/, rodilla: /rodilla|patelo/, cadera: /cadera/ };
const contraGen = c => String(c || '').split(/,|;/).map(t => norm(t)).filter(Boolean);
function adaptacionGen(e, cfg) {
  const i = infoGen(e.id), cu = cfg.cuidados;
  const agudo = String(i.contra || '').split(/,|;/).map(t => t.trim()).find(t => /agud/i.test(t) && cu.some(z => ZONA_GEN[z].test(norm(t))));
  if (agudo) return `No hacerlo con ${agudo.charAt(0).toLowerCase()}${agudo.slice(1)} (tu planilla).`;
  for (const [k, t] of Object.entries(i.prec || {})) if (cu.some(z => k.includes(z) || (z === 'cuello' && k.includes('hombro')))) return t;
  if (cu.includes('osteo') && /modificar/i.test(e.osteo || '')) { const b = BB.ejercicios.find(x => x.id === e.id); return (b && b.osteoTxt) || 'Modificar con osteoporosis.'; }
  return '';
}

/* ---------- tiempo de cada ejercicio (el mismo que estima Mis sesiones) ---------- */
function repsGen(e, cfg) {
  const r = rangoReps(e.reps);
  if (!r) return 6;
  const niv = NIVEL_IDX[cfg.nivel] ?? 0, f = [0, 0.5, 0.85, 1][niv];
  return Math.round(r[0] + (r[1] - r[0]) * f);
}

/* ---------- el orden de las posiciones ---------- */
const hayTransicion = (a, b) => !!TRANSICIONES[a + '>' + b];
/* reglas de fluidez para un orden: cada cambio tiene su transición y no se vuelve a supino
   después del prono (la corrección del examen lo marcó) */
function ordenValido(ps) {
  for (let i = 1; i < ps.length; i++) if (!hayTransicion(ps[i - 1], ps[i])) return false;
  const iS = ps.indexOf('supino');
  return !(iS >= 0 && ['prono', 'plancha', 'costado'].some(p => ps.includes(p) && ps.indexOf(p) < iS));
}
function ordenAlAzar(r, niv) {
  /* siempre supino (core), prono (extensión) y algo de pie o de costado; lo demás, a veces */
  const base = ['supino', 'prono'], opcionales = mezclarGen(['pie', 'cuatro', 'sentado', 'plancha', 'costado'], r);
  for (let intento = 0; intento < 400; intento++) {
    const extra = opcionales.filter(() => r() < 0.72);
    if (!extra.includes('sentado') && r() < 0.6) extra.push('sentado');
    if (!extra.includes('costado') && !extra.includes('pie')) extra.push(r() < 0.5 ? 'costado' : 'pie');
    if (niv === 0) { const k = extra.indexOf('plancha'); if (k >= 0 && r() < 0.5) extra.splice(k, 1); }
    const ps = mezclarGen([...base, ...extra], r);
    /* empieza donde hay respiración o activación y termina donde hay con qué recuperar */
    if (ordenValido(ps) && ['pie', 'supino', 'sentado', 'cuatro'].includes(ps[0]) && ['pie', 'sentado', 'cuatro'].includes(ps[ps.length - 1])) return ps;
  }
  return [...ORDEN_MANUAL];
}
function ordenDeCfg(cfg, r) {
  if (cfg.orden === 'azar') return ordenAlAzar(r, NIVEL_IDX[cfg.nivel] ?? 0);
  if (cfg.orden === 'elegido') { const ps = cfg.posiciones.filter(p => POS_GEN.includes(p)); return ps.length ? ps : [...ORDEN_MANUAL]; }
  /* en una clase corta, siete cambios de posición son muchos: sin cuatro apoyos ni plancha */
  return cfg.dur <= 30 ? ORDEN_MANUAL.filter(p => p !== 'cuatro' && p !== 'plancha') : [...ORDEN_MANUAL];
}

/* ---------- generar ---------- */
function generarClase(cfg, semilla = Date.now()) {
  const r = azarGen(semilla);
  /* al azar se prueban algunos órdenes y queda el primero con el que la clase cubre todo */
  let mejor = null;
  for (let intento = 0; intento < (cfg.orden === 'azar' ? 8 : 1); intento++) {
    const g = armarClase(cfg, ordenDeCfg(cfg, r), r);
    if (!mejor || g.req.length < mejor.req.length) mejor = g;
    if (!g.req.length) break;
  }
  const motivos = motivosGen(cfg, mejor.orden, mejor.req, mejor.ids);
  const min = duracionPlan({ items: mejor.items });
  if (min < cfg.dur - 6) motivos.push({ nom: 'Duración', tipo: 'tiempo', por: `dura ≈ ${min} min`,
    txt: `Dura ≈ ${min} min: con estas opciones no hay más ejercicios en estas posiciones (ya van con las repeticiones de arriba del rango); sumá una posición o hacé dos series de algunos.` });
  return { items: mejor.items, orden: mejor.orden, semilla, faltan: motivos.filter(m => m.tipo !== 'enfasis' && m.tipo !== 'tiempo').map(m => m.nom), motivos };
}
function armarClase(cfg, orden, r) {
  const niv = NIVEL_IDX[cfg.nivel] ?? 0;
  /* las inversiones entran si después del supino viene sentado (supino → inversión → sentado) */
  const conInv = orden[orden.indexOf('supino') + 1] === 'sentado';
  const pool = catalogoPlan().filter(e => permitidoGen(e, cfg) && (e.pos !== 'inversion' || conInv));
  /* las inversiones van al final del bloque de supino (el manual: supino → inversión → sentado) */
  const posDe = e => (e.pos === 'inversion' ? 'supino' : e.pos);
  const bloques = orden.map(p => ({ pos: p, items: [], seg: 0, peso: PESO_POS[p] || 0.1 }));
  const total = cfg.dur * 60;
  /* el cierre de pie del manual: si la clase empieza de pie y es el orden del manual, vuelve a pie al final */
  const cierrePie = cfg.orden === 'manual' && orden[0] === 'pie' && orden[orden.length - 1] !== 'pie';
  const sumaPeso = bloques.reduce((a, b) => a + b.peso, 0);
  const trans = Math.max(0, bloques.length - 1 + (cierrePie ? 1 : 0)) * SEG_TRANSICION;
  bloques.forEach(b => { b.meta = (total - trans) * b.peso / sumaPeso * (cierrePie && b.pos === 'pie' ? 0.6 : 1); });
  const usados = new Set(), fams = {};
  let extraFam = 0;
  const segDe = e => segEj(e, repsGen(e, cfg));
  const libreFam = e => { const f = familiaGen(e); return (fams[f.k] || 0) < f.max + (f.k.startsWith('n:') || f.k === 'respira' ? 0 : extraFam); };
  /* tampoco dos con el mismo nombre (el Swan de Pre-Pilates y el del manual) */
  const nombres = new Set();
  const cand = b => pool.filter(e => posDe(e) === b.pos && !usados.has(e.id) && !nombres.has(norm(e.n)) && libreFam(e));
  const poner = (b, e, tag = '') => { b.items.push({ e, tag }); b.seg += segDe(e); usados.add(e.id); nombres.add(norm(e.n)); const f = familiaGen(e).k; fams[f] = (fams[f] || 0) + 1; };
  /* el repertorio es lo central; Pre-Pilates prepara (más en principiantes) */
  const topePre = [0.5, 0.35, 0.25, 0.2][niv];
  const nPre = () => todos.reduce((a, b) => a + b.items.filter(x => x.e.pm).length, 0), nTot = () => todos.reduce((a, b) => a + b.items.length, 0);
  const nivelBien = e => 1 - Math.abs(infoGen(e.id).nivel - Math.min(niv, 2)) * 0.25;

  /* 1 · calentamiento: respiración o activación al empezar el primer bloque */
  const calor = e => /breath|respir/i.test(e.n) ? 3 : /standing multifidi|pelvic|neutral spine|floor|all four abdominals/i.test(e.n) ? 2 : 1;
  const b0 = bloques[0], cal = mezclarGen(cand(b0).filter(e => infoGen(e.id).calienta), r).sort((a, b) => calor(b) - calor(a));
  if (cal.length) poner(b0, cal[0], 'calienta');
  /* 2 · recuperación al final: movilidad o estiramiento del último bloque (o el cierre de pie) */
  const bFin = cierrePie ? { pos: 'pie', items: [], seg: 0, meta: 150, fin: true } : bloques[bloques.length - 1];
  const rec = mezclarGen(cand(bFin).filter(e => infoGen(e.id).recupera), r)
    .sort((a, b) => /roll down|stretch|cat cow/i.test(b.n) - /roll down|stretch|cat cow/i.test(a.n));
  if (rec.length) poner(bFin, rec[0], 'recupera');
  const todos = cierrePie ? [...bloques, bFin] : bloques;

  /* 3 · lo que la clase tiene que tener: los 5 principios (dos de cada uno), los elementos
     del balance y los tres planos; se cubre primero lo que falta, en el bloque con más lugar */
  const necesita = () => {
    const xs = todos.flatMap(b => b.items.map(x => x.e)), req = [];
    for (const p of PRINCIPIOS) { const n = xs.filter(e => infoGen(e.id).sec.has(p.k)).length, prim = xs.some(e => infoGen(e.id).pri.has(p.k));
      if (n < 2 || (['tronco', 'mmii', 'mmss'].includes(p.k) && !prim)) req.push('p:' + p.k);
      else if (p.k === cfg.enfasis && n < 4) req.push('f:' + p.k); }
    for (const el of ELEMENTOS_CLASE) if (!xs.some(e => infoGen(e.id).elementos.has(el.k))) req.push('e:' + el.k);
    for (const pl of ['frontal', 'transversal']) if (!xs.some(e => infoGen(e.id).planos.has(pl))) req.push('pl:' + pl);
    return req;
  };
  const cubre = (e, req) => req.filter(q => { const [t, k] = q.split(':'), i = infoGen(e.id);
    return t === 'p' || t === 'f' ? i.sec.has(k) : t === 'e' ? i.elementos.has(k) : i.planos.has(k); }).length;
  const lugar = b => (b.meta - b.seg) / Math.max(1, b.meta);
  const puntaje = (e, b, req) => cubre(e, req) * 3 + (cfg.enfasis && infoGen(e.id).sec.has(cfg.enfasis) ? 1.2 : 0) + nivelBien(e)
    + (!cfg.sinProps && infoGen(e.id).props.some(p => cfg.props.includes(p.tipo)) ? 0.6 : 0) + r() * 1.4 + lugar(b) * 0.8
    + (e.pm ? (nPre() + 1 > topePre * Math.max(8, nTot() + 1) ? -4 : 0) : 1);
  for (let paso = 0; paso < 60; paso++) {
    const req = necesita();
    if (!req.length) break;
    let mejor = null;
    for (const b of todos) {
      if (b.fin && b.items.length >= 2) continue;
      for (const e of cand(b)) { const c = cubre(e, req); if (!c) continue; const s = puntaje(e, b, req) - (b.seg > b.meta ? 2 : 0); if (!mejor || s > mejor.s) mejor = { s, e, b }; }
    }
    if (!mejor) break;
    poner(mejor.b, mejor.e);
  }
  /* 4 · completar el tiempo: el bloque con más lugar suma el mejor candidato; con pocas
     posiciones, si no alcanza, se permite una variante más de cada familia y se estiran los bloques */
  const usado = () => todos.reduce((a, b) => a + b.seg, 0) + trans;
  for (let paso = 0; paso < 120 && usado() < total - 50; paso++) {
    let libres = todos.filter(b => !b.fin && cand(b).length && b.seg < b.meta + 40).sort((a, b) => lugar(b) - lugar(a));
    if (!libres.length && extraFam < 1) { extraFam++; todos.forEach(b => { if (!b.fin) b.meta += (total - usado()) / todos.length; }); continue; }
    if (!libres.length) { libres = todos.filter(b => !b.fin && cand(b).length).sort((a, b) => lugar(b) - lugar(a)); if (!libres.length) break; libres[0].meta = libres[0].seg + 200; }
    const b = libres[0], req = necesita(), cs = cand(b).map(e => ({ e, s: puntaje(e, b, req) })).sort((a, b2) => b2.s - a.s);
    if (!cs.length) break;
    if (usado() + segDe(cs[0].e) > total + 60) { b.meta = b.seg; continue; }
    poner(b, cs[0].e);
  }
  /* 5 · el orden dentro de cada bloque: calentamiento, Pre-Pilates (preparan), el repertorio en el
     orden del libro (de lo más simple a lo más exigente), las inversiones y la recuperación */
  const clave = x => [x.tag === 'calienta' ? 0 : x.tag === 'recupera' ? 9 : x.e.pos === 'inversion' ? 8 : x.e.pm ? 1 : 2 + infoGen(x.e.id).nivel * 0.1,
    x.e.pm ? +x.e.id.slice(2) : (x.e.f === 'mat1' ? 0 : 100) + +x.e.id.split('-e')[1]];
  todos.forEach(b => b.items.sort((a, c) => { const ka = clave(a), kc = clave(c); return ka[0] - kc[0] || ka[1] - kc[1]; }));
  const items = todos.flatMap(b => b.items);

  /* 6 · props: donde el material los usa, agrupados (se repite el del ejercicio anterior si se
     puede, para no cambiar a cada rato); con principiantes asisten, con avanzados resisten */
  const modoPref = cfg.uso !== 'auto' ? cfg.uso : niv === 0 ? 'asiste' : niv >= 2 ? 'resiste' : '';
  /* en tramos: se toma un prop para dos a cuatro ejercicios seguidos que lo usan y se deja
     un rato (cerca de la mitad de la clase con prop, sin cambiar a cada ejercicio) */
  let enMano = '', quedan = 0, pausa = 0;
  const opsDe = e => { const i = infoGen(e.id), ops = i.props.filter(p => cfg.props.includes(p.tipo)), pref = ops.filter(p => !modoPref || !p.modo || p.modo === modoPref); return pref.length ? pref : ops; };
  const salida = items.map(({ e, tag }, k) => {
    const i = infoGen(e.id), x = { id: e.id, reps: repsGen(e, cfg), prop: '', nota: '', pr: [...i.pri], adap: adaptacionGen(e, cfg) };
    if (i.requiere.length) { x.prop = i.requiere[0]; return x; }
    if (cfg.sinProps || !cfg.props.length || tag === 'calienta') return x;
    const ops = opsDe(e);
    if (enMano) {
      const o = ops.find(p => p.tipo === enMano);
      if (o && quedan > 0) { quedan--; x.prop = o.tipo; x.nota = o.txt.slice(0, 140); if (!quedan) { enMano = ''; pausa = 1 + Math.floor(r() * 2); } return x; }
      enMano = ''; pausa = 1;
    }
    if (pausa > 0) { pausa--; return x; }
    if (!ops.length || r() < 0.25) return x;
    /* el prop que más ejercicios seguidos puede acompañar */
    const largo = t => { let n = 0; for (let q = k + 1; q < items.length && opsDe(items[q].e).some(p => p.tipo === t); q++) n++; return n; };
    const o = [...ops].sort((a, b) => largo(b.tipo) - largo(a.tipo) + (r() - 0.5))[0];
    x.prop = o.tipo; x.nota = o.txt.slice(0, 140); enMano = o.tipo; quedan = 1 + Math.floor(r() * 3);
    return x;
  });
  /* si no hay más ejercicios para estas opciones y posiciones, se llega al tiempo con las
     repeticiones de arriba del rango del manual */
  let falta = total - usado();
  for (let k = 0; k < salida.length && falta > 120; k++) {
    const e = items[k].e, rg = rangoReps(e.reps), x = salida[k];
    if (!rg || x.reps >= rg[1]) continue;
    falta -= segEj(e, rg[1]) - segEj(e, x.reps); x.reps = rg[1];
  }
  return { items: salida, orden: cierrePie ? [...orden, 'pie'] : orden, req: necesita(), ids: items.map(x => x.e.id) };
}
const SEG_TRANSICION = 45;

/* lo que la clase no llegó a cubrir y por qué: las opciones lo dejan afuera (cuidados, nivel,
   props), lo trabajan posiciones que no están en el orden, o hay pocos con estas opciones */
const EN_POS = { pie: 'de pie', cuatro: 'en cuatro apoyos', supino: 'en supino', sentado: 'en posición sentada', prono: 'en prono', plancha: 'en plancha', costado: 'de costado' };
function motivosGen(cfg, orden, req, ids = []) {
  const pos = new Set(orden), posDe = e => (e.pos === 'inversion' ? 'supino' : e.pos);
  const todos = catalogoPlan().filter(e => permitidoGen(e, cfg));
  const opciones = cfg.cuidados.length ? 'los cuidados elegidos' : cfg.sinProps ? `el nivel ${nomNivelGen(cfg.nivel).toLowerCase()} y sin props` : `el nivel ${nomNivelGen(cfg.nivel).toLowerCase()}`;
  const lista = xs => xs.length > 1 ? xs.slice(0, -1).join(', ') + ' o ' + xs[xs.length - 1] : xs[0];
  return req.map(q => {
    const [t, k] = q.split(':');
    const cubreQ = e => { const i = infoGen(e.id); return t === 'p' || t === 'f' ? i.sec.has(k) : t === 'e' ? i.elementos.has(k) : i.planos.has(k); };
    const pr = PRINCIPIOS.find(p => p.k === k) || {};
    const nom = t === 'p' ? pr.nom : t === 'f' ? 'Más ' + String(pr.corto).toLowerCase() : t === 'e' ? (ELEMENTOS_CLASE.find(el => el.k === k) || {}).nom : 'Plano ' + k;
    /* el énfasis pide cuatro: si entraron menos, no falta nada, solo no hay más */
    if (t === 'f') { const n = ids.filter(id => infoGen(id).sec.has(k)).length;
      return { nom, tipo: 'enfasis', por: `entraron ${n}; con estas opciones y posiciones no hay más`, txt: `Énfasis en ${String(pr.corto).toLowerCase()}: entraron ${n} (con estas opciones y posiciones no hay más).` }; }
    const hay = todos.filter(cubreQ), aca = hay.filter(e => pos.has(posDe(e)));
    const m = !hay.length ? { nom, tipo: 'opciones', por: t === 'e' && k === 'flexion' && cfg.cuidados.includes('osteo')
        ? 'con osteoporosis el manual pide evitar la flexión de columna con carga; el centro se trabaja en neutro'
        : `con ${opciones} no queda ningún ejercicio que lo trabaje` }
      : !aca.length ? { nom, tipo: 'orden', por: `lo trabajan ejercicios ${lista(ORDEN_MANUAL.filter(p => hay.some(e => posDe(e) === p)).map(p => EN_POS[p]))}, que no están en el orden` }
      : { nom, tipo: 'pocos', por: `con estas opciones y posiciones hay ${aca.length === 1 ? 'uno solo' : 'pocos'}` };
    m.txt = `Sin ${nom.charAt(0).toLowerCase()}${nom.slice(1)}: ${m.por}.`;
    return m;
  });
}

/* ---------- la sesión ---------- */
const nomNivelGen = k => (NIVELES_GEN.find(x => x[0] === k) || [k, k])[1];
function resumenCfgGen(cfg, orden) {
  const ps = (orden || []).map(p => POS_CLASE[p].nom.toLowerCase());
  return [`${cfg.dur} min`, nomNivelGen(cfg.nivel), cfg.sinProps || !cfg.props.length ? 'sin props' : cfg.props.join(', '),
    cfg.cuidados.length ? 'cuidando: ' + cfg.cuidados.map(c => (CUIDADOS_GEN.find(x => x[0] === c) || [c, c])[1].toLowerCase()).join(', ') : '',
    cfg.enfasis ? 'más ' + (PRINCIPIOS.find(p => p.k === cfg.enfasis) || {}).corto.toLowerCase() : '',
    ps.length ? (cfg.orden === 'azar' ? 'orden al azar: ' : cfg.orden === 'elegido' ? 'orden elegido: ' : 'orden del manual: ') + ps.join(' → ') : ''].filter(Boolean).join(' · ');
}
function crearClaseGenerada(cfg, plan = null) {
  const g = generarClase(cfg);
  const focos = [];
  if (cfg.cuidados.includes('osteo')) focos.push('Osteoporosis: cuidar la flexión');
  const datos = { nombre: `Clase de ${cfg.dur} min · ${nomNivelGen(cfg.nivel)}`, dur: cfg.dur, focos, items: g.items,
    notas: `Generada: ${resumenCfgGen(cfg, g.orden)}.${g.motivos.map(m => ' ' + m.txt).join('')}`, gen: { ...JSON.parse(JSON.stringify(cfg)), semilla: g.semilla, orden2: g.orden } };
  if (plan) { Object.assign(plan, datos, { editado: Date.now() }); guardar(); return plan; }
  return nuevoPlan(datos);
}

/* ---------- pantalla ---------- */
let genAbierto = false;
function abrirGenerador() { genAbierto = true; planAbierto = null; if (vista !== 'planes') ir('planes'); else vGenerador(); }
function vGenerador() {
  const cfg = cfgGen();
  const chip = (grupo, v, t, on, extra = '') => `<button type="button" data-g="${grupo}" data-v="${esc(v)}" class="${on ? 'on' : ''}" aria-pressed="${on}" ${extra}>${t}</button>`;
  const posLista = () => {
    const sel = cfg.posiciones.filter(p => POS_GEN.includes(p)), resto = POS_GEN.filter(p => !sel.includes(p));
    return [...sel.map((p, i) => `<li class="gen-pos on" data-p="${p}"><span>${i + 1}</span><b>${POS_CLASE[p].ico} ${POS_CLASE[p].nom}</b>
        <button type="button" data-a="sube" aria-label="Antes" ${i ? '' : 'disabled'}>↑</button><button type="button" data-a="baja" aria-label="Después" ${i < sel.length - 1 ? '' : 'disabled'}>↓</button><button type="button" data-a="saca" aria-label="Sacar ${POS_CLASE[p].nom}">✕</button></li>`),
      ...resto.map(p => `<li class="gen-pos" data-p="${p}"><span>·</span><b>${POS_CLASE[p].ico} ${POS_CLASE[p].nom}</b><button type="button" data-a="pone" class="gen-pone">＋ sumar</button></li>`)].join('');
  };
  const avisoOrden = () => {
    if (cfg.orden !== 'elegido') return '';
    const ps = cfg.posiciones.filter(p => POS_GEN.includes(p)), malos = [];
    for (let i = 1; i < ps.length; i++) if (!hayTransicion(ps[i - 1], ps[i])) malos.push(`${POS_CLASE[ps[i - 1]].nom} → ${POS_CLASE[ps[i]].nom}`);
    const vuelve = ps.indexOf('supino') > ps.indexOf('prono') && ps.includes('prono');
    return malos.length || vuelve ? `<p class="gen-aviso">${malos.length ? `Sin una transición directa en el material: ${malos.join(', ')} (la app igual la marca en la sesión). ` : ''}${vuelve ? 'El manual no vuelve a supino después del prono.' : ''}</p>` : '<p class="gen-ok">Cada cambio de posición tiene su transición.</p>';
  };
  /* antes de generar: qué no va a poder cubrir con estas opciones (al azar, solo lo que no depende del orden) */
  const previa = () => {
    let g; try { g = generarClase(cfg, 1); } catch (e) { return ''; }
    const ms = g.motivos.filter(m => cfg.orden !== 'azar' || m.tipo === 'opciones');
    return ms.length ? `<div class="gen-aviso gen-previa"><b>Con estas opciones:</b><ul>${ms.map(m => `<li>${esc(m.txt)}</li>`).join('')}</ul></div>`
      : '<p class="gen-ok gen-previa">Con estas opciones la clase cubre los 5 principios, los elementos de una clase balanceada y los tres planos.</p>';
  };
  app().innerHTML = `
    <button type="button" class="volver" id="genVolver">← Mis sesiones</button>
    <h1 class="tit">Generar una clase</h1>
    <p class="sub">La app arma una clase completa con tu material: los <b>5 principios del movimiento</b>, los elementos de una clase balanceada, los tres planos y la fluidez entre posiciones. Elegí lo que quieras; lo demás lo decide ella.</p>

    <section class="gen-sec"><h2>Duración</h2><div class="chips" role="group" aria-label="Duración">${[30, 45, 60, 75].map(m => chip('dur', m, m + ' min', cfg.dur === m)).join('')}</div></section>
    <section class="gen-sec"><h2>Nivel</h2><div class="chips" role="group" aria-label="Nivel">${NIVELES_GEN.map(([k, t]) => chip('nivel', k, t, cfg.nivel === k)).join('')}</div>
      <p class="micro">Principiante: sin inversiones, sin bajar las piernas largas del todo ni apoyo en un brazo (como pide el manual). Las inversiones aparecen desde Avanzado.</p></section>
    <section class="gen-sec"><h2>Props</h2><div class="chips" role="group" aria-label="Props">${chip('sinprops', '1', 'Sin props', cfg.sinProps)}${PROPS_PLAN.map(t => chip('prop', t, t, !cfg.sinProps && cfg.props.includes(t))).join('')}</div>
      ${!cfg.sinProps && cfg.props.length ? `<div class="chips gen-uso" role="group" aria-label="Para qué">${[['auto', 'Según el nivel'], ['asiste', 'Que asistan'], ['resiste', 'Que resistan']].map(([k, t]) => chip('uso', k, t, cfg.uso === k)).join('')}</div>` : ''}
      <p class="micro">Se usan donde tus fichas de Mat 1 y Mat 2 (accesorios que asisten o resisten) y tus fotos de Mat 3 los muestran, agrupados para no cambiar de prop a cada rato.</p></section>
    <section class="gen-sec"><h2>Orden de las posiciones</h2>
      <div class="chips" role="group" aria-label="Orden">${[['manual', 'Como el manual'], ['elegido', 'Elegir el orden'], ['azar', 'Al azar']].map(([k, t]) => chip('orden', k, t, cfg.orden === k)).join('')}</div>
      ${cfg.orden === 'manual' ? '<p class="micro">De pie → cuatro apoyos → supino → sentado → prono → plancha → de costado → cierre de pie (Mat 1, págs. 65–67).</p>'
        : cfg.orden === 'azar' ? '<p class="micro">Cambia cada vez, pero siempre con una transición entre posiciones, sin volver a supino después del prono y con supino (centro) y prono (extensión).</p>'
        : `<ol class="gen-posiciones" id="genPos">${posLista()}</ol>${avisoOrden()}`}</section>
    <section class="gen-sec"><h2>Darle más peso a un principio <small>(opcional)</small></h2><div class="chips" role="group" aria-label="Énfasis">${chip('enfasis', '', 'Equilibrada', !cfg.enfasis)}${PRINCIPIOS.map(p => chip('enfasis', p.k, `${p.ico} ${p.corto}`, cfg.enfasis === p.k)).join('')}</div>
      <p class="micro">Siempre están los cinco; el elegido suma más ejercicios.</p></section>
    <section class="gen-sec"><h2>Cuidados <small>(opcional)</small></h2><div class="chips" role="group" aria-label="Cuidados">${CUIDADOS_GEN.map(([k, t]) => chip('cuidado', k, t, cfg.cuidados.includes(k))).join('')}</div>
      <p class="micro">Saca lo que el manual pide evitar y anota la adaptación del manual en cada ejercicio que la tiene. No reemplaza la indicación de un profesional de la salud.</p></section>
    ${previa()}
    <div class="fila pl-acc"><button type="button" class="btn3d verde" id="genIr">✨ Generar la clase</button></div>`;
  $('#genVolver').onclick = () => { genAbierto = false; vPlanes(); };
  $$('[data-g]').forEach(b => b.onclick = () => {
    const g = b.dataset.g, v = b.dataset.v;
    if (g === 'dur') cfg.dur = +v;
    else if (g === 'nivel') cfg.nivel = v;
    else if (g === 'sinprops') { cfg.sinProps = true; cfg.props = []; }
    else if (g === 'prop') { cfg.sinProps = false; cfg.props = cfg.props.includes(v) ? cfg.props.filter(x => x !== v) : [...cfg.props, v]; if (!cfg.props.length) cfg.sinProps = true; }
    else if (g === 'uso') cfg.uso = v;
    else if (g === 'orden') cfg.orden = v;
    else if (g === 'enfasis') cfg.enfasis = v;
    else if (g === 'cuidado') cfg.cuidados = cfg.cuidados.includes(v) ? cfg.cuidados.filter(x => x !== v) : [...cfg.cuidados, v];
    guardar(); SND.toque();
    const y = window.scrollY; vGenerador(); window.scrollTo(0, y);
  });
  $$('#genPos [data-a]').forEach(b => b.onclick = () => {
    const p = b.closest('[data-p]').dataset.p, ps = cfg.posiciones.filter(x => POS_GEN.includes(x)), i = ps.indexOf(p);
    if (b.dataset.a === 'saca') ps.splice(i, 1);
    else if (b.dataset.a === 'pone') ps.push(p);
    else { const j = b.dataset.a === 'sube' ? i - 1 : i + 1; [ps[i], ps[j]] = [ps[j], ps[i]]; }
    cfg.posiciones = ps; guardar(); SND.toque();
    const y = window.scrollY; vGenerador(); window.scrollTo(0, y);
  });
  $('#genIr').onclick = () => {
    const p = crearClaseGenerada(cfg);
    genAbierto = false; planAbierto = p.id; SND.fin();
    vPlan(p.id);
    toast('Clase generada y guardada en <b>Mis sesiones</b>. Revisala y cambiá lo que quieras.', 'toast-suave');
  };
}
