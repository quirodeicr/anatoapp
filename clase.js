/* ============================================================
   AnatoApp — Armá tu clase

   En los exámenes, diseñar la clase fue lo que más puntos costó:
   Mat 1, 17 de 30 y Mat 2, 0 de 50. Acá se arma una clase con los
   ejercicios del manual y la app la revisa con lo mismo que marcó
   la corrección:
     · repeticiones exactas, no rangos
     · el orden de posiciones del manual (de pie → cuatro apoyos →
       supino → sentado → prono → plancha → de costado → cierre),
       sin volver a supino después del prono
     · la transición pensada cada vez que cambia la posición
     · una clase balanceada: los 7 elementos (Mat 2, págs. 66–69)
   La clase en curso se guarda con el progreso (S.clase).
   ============================================================ */
'use strict';

const POS_CLASE = {
  pie:       { nom: 'De pie',        ico: '🧍', grupo: 0 },
  cuatro:    { nom: 'Cuatro apoyos', ico: '🐈', grupo: 1 },
  supino:    { nom: 'Supino',        ico: '🛌', grupo: 2 },
  inversion: { nom: 'Inversión',     ico: '🙃', grupo: 2 },
  sentado:   { nom: 'Sentado',       ico: '🪑', grupo: 2 },
  prono:     { nom: 'Prono',         ico: '🦢', grupo: 3 },
  plancha:   { nom: 'Plancha',       ico: '➖', grupo: 4 },
  costado:   { nom: 'De costado',    ico: '🦵', grupo: 5 }
};
const MODOS_CLASE = {
  mat1:  { nom: 'Mat 1 · clase corta', min: 15, max: 15, fuentes: ['mat1'],
           consigna: '15 ejercicios de Mat 1 con variedad de posiciones, en orden y con el número de repeticiones (examen de Mat 1).' },
  mat12: { nom: 'Mat 1 y 2 · una hora', min: 20, max: 25, fuentes: ['mat1', 'mat2'],
           consigna: 'De 20 a 25 ejercicios de Mat 1 y Mat 2, en orden y con repeticiones, balanceada y fluida (examen de Mat 2).' }
};

/* Pre-Pilates que las secuencias del manual usan de calentamiento */
const PRE_CLASE = [
  ['Pelvic Clock', 'supino'], ['Marching', 'supino'], ['Toe Taps', 'supino'], ['Bridge with Marching', 'supino'],
  ['Cat Cow', 'cuatro'], ['Sternum Drops', 'cuatro'], ['Squats', 'pie'], ['Standing Roll Down', 'pie']
];

/* Cómo pasar de una posición a otra (la corrección de Mat 1 preguntó
   "¿cómo transicionás de 8 a 9?": de sentado a prono, por medio lado) */
const TRANSICIONES = {
  'supino>sentado': 'Enrollá la columna hasta sentarte, como en el Roll up.',
  'sentado>supino': 'Bajá vértebra por vértebra hasta apoyar la espalda.',
  'sentado>prono': 'Pasá por medio lado: girá hacia un costado, apoyá las manos y bajá a prono.',
  'supino>prono': 'Rodá hacia un costado y seguí hasta quedar boca abajo.',
  'prono>costado': 'Girá hacia un lado y alineá hombros, cadera y tobillos.',
  'prono>plancha': 'Apoyá las manos debajo de los hombros y empujá el piso hasta la plancha.',
  'plancha>prono': 'Bajá las rodillas y apoyá el cuerpo con control.',
  'prono>cuatro': 'Empujá con las manos y llevá la cadera hacia atrás hasta cuatro apoyos.',
  'cuatro>prono': 'Deslizá las manos hacia adelante y bajá el cuerpo con control.',
  'costado>sentado': 'Apoyá la mano de abajo y subí a sentarte.',
  'costado>prono': 'Girá hacia el piso sin perder la línea del cuerpo.',
  'costado>plancha': 'Girá hacia el piso, apoyá las manos y subí a la plancha.',
  'plancha>costado': 'Rotá el cuerpo sobre una mano hasta el costado.',
  'sentado>pie': 'Cruzá las piernas o rodá hacia adelante para ponerte de pie, como al final del Seal.',
  'plancha>pie': 'Caminá con las manos hacia los pies y enrollá la columna hasta quedar de pie.',
  'pie>plancha': 'Enrollá la columna hacia abajo y caminá con las manos hasta la plancha.',
  'pie>supino': 'Bajá a sentarte y rodá la espalda hasta el mat.',
  'pie>cuatro': 'Bajá las manos al mat y apoyá las rodillas.',
  'cuatro>supino': 'Sentate de costado y rodá la espalda hasta el mat.',
  'supino>inversion': 'Desde supino, llevá las piernas por encima de la cabeza con control.',
  'inversion>supino': 'Bajá vértebra por vértebra hasta apoyar la pelvis.',
  'sentado>inversion': 'Rodá hacia atrás hasta apoyarte sobre los hombros.',
  'inversion>sentado': 'Rodá hacia adelante hasta sentarte sobre los isquiones.'
};

/* Los elementos de una clase balanceada (Mat 2, págs. 66–69; Mat 1, págs. 76–78) */
const ELEMENTOS_CLASE = [
  { k: 'flexion',   nom: 'Abdominales en flexión',          re: /hundred|roll up|leg stretch|criss|teaser|neck pull|abdominal|toe taps|pelvic clock/ },
  { k: 'movilidad', nom: 'Movilidad de columna',            re: /roll up|rolling|rocker|seal|spine stretch|saw|cat cow|roll down|swan|boomerang|roll over|mermaid/ },
  { k: 'extension', nom: 'Extensión (prono)',               re: /swan|leg kicks|swimming|rocking/ },
  { k: 'rotacion',  nom: 'Rotación o trabajo lateral',      re: /saw|criss|twist|corkscrew|hip circles|side|mermaid|kneeling/ },
  { k: 'superior',  nom: 'Tren superior (escápula, planchas)', re: /push up|leg pull|sternum|^twist|side bend|plank/ },
  { k: 'inferior',  nom: 'Tren inferior',                   re: /side leg|single leg kicks|double leg kicks|shoulder bridge|scissors|^bicycle|squat|bridge|kneeling side/ }
];

const rangoReps = txt => {
  const m = String(txt || '').match(/(\d+)\s*(?:–|-|a)\s*(\d+)/);
  if (m) return [+m[1], +m[2]];
  const u = String(txt || '').match(/(\d+)/);
  return u ? [+u[1], +u[1]] : null;
};
const unidadReps = txt => /c[ií]rculo/i.test(txt) ? 'círculos' : /sets?\b/i.test(txt) ? 'sets' : 'reps';

/* catálogo de ejercicios para armar la clase */
function ejerciciosClase() {
  const bb = BB.ejercicios.map(e => ({ id: e.id, n: e.n, pos: e.pos, f: e.f, reps: e.reps, trans: e.trans, osteo: e.osteo, nivel: e.nivel }));
  const pre = PRE_CLASE.map(([n, pos]) => {
    const p = PREMAT.find(x => norm(x.n) === norm(n));
    return { id: 'pre-' + norm(n).replace(/ /g, '-'), n, pos, f: 'pre', reps: (p && p.reps) || '' };
  });
  return [...pre, ...bb];
}
let CATALOGO_CLASE = null;
const ejClase = id => (CATALOGO_CLASE || (CATALOGO_CLASE = ejerciciosClase())).find(e => e.id === id);

function claseActual() {
  if (!S.clase || !MODOS_CLASE[S.clase.modo]) S.clase = { modo: 'mat1', items: [] };
  S.clase.items = S.clase.items.filter(x => ejClase(x.id));
  return S.clase;
}
let filtroClase = { pos: '', f: '' };

function vClase() {
  const c = claseActual(), m = MODOS_CLASE[c.modo];
  const nMat = c.items.filter(x => ejClase(x.id).f !== 'pre').length;
  app().innerHTML = `
    <button type="button" class="volver" id="clVolver">← Práctica</button>
    <h1 class="tit">Armá tu clase</h1>
    <p class="sub">Lo que más puntos te costó en los exámenes: 17 de 30 en Mat 1 y 0 de 50 en Mat 2. Armala acá y la app la revisa con lo mismo que marcó la corrección.</p>
    <div class="seg" id="clModo">${Object.entries(MODOS_CLASE).map(([k, x]) =>
      `<button type="button" data-v="${k}" class="${c.modo === k ? 'on' : ''}"><b>${x.nom}</b><small>${x.min === x.max ? x.min : x.min + ' a ' + x.max} ejercicios</small></button>`).join('')}</div>
    <p class="micro">${esc(m.consigna)}</p>

    <h2 class="secc">Tu clase · ${nMat} de ${m.min === m.max ? m.min : m.min + '–' + m.max}${c.items.length > nMat ? ` <small class="cl-pre">+ ${c.items.length - nMat} de Pre-Pilates</small>` : ''}</h2>
    <ol class="cl-lista" id="clLista">${c.items.length ? filasClase(c) : '<li class="vacio">Todavía está vacía. Tocá ejercicios de la lista de abajo para sumarlos en orden.</li>'}</ol>
    <div class="fila cl-acc">
      <button type="button" class="btn3d verde" id="clRevisar" ${c.items.length ? '' : 'disabled'}>Revisar mi clase</button>
      <button type="button" class="btn ghost" id="clVaciar" ${c.items.length ? '' : 'disabled'}>Vaciar</button>
    </div>
    <div id="clRes"></div>

    <h2 class="secc">Sumar ejercicios</h2>
    <div class="cl-filtros">
      <div class="chips" id="clPos"><button type="button" data-p="" class="${filtroClase.pos ? '' : 'on'}">Todas</button>${Object.entries(POS_CLASE).map(([k, p]) =>
        `<button type="button" data-p="${k}" class="${filtroClase.pos === k ? 'on' : ''}">${p.ico} ${p.nom}</button>`).join('')}</div>
      <div class="chips" id="clF">${[['', 'Todo'], ['pre', 'Pre-Pilates'], ...m.fuentes.map(f => [f, f === 'mat1' ? 'Mat 1' : 'Mat 2'])].map(([k, t]) =>
        `<button type="button" data-f="${k}" class="${filtroClase.f === k ? 'on' : ''}">${t}</button>`).join('')}</div>
    </div>
    <div class="cl-pool" id="clPool"></div>`;
  pintarPoolClase();
  $('#clVolver').onclick = () => ir('practica');
  $$('#clModo button').forEach(b => b.onclick = () => {
    c.modo = b.dataset.v;
    if (filtroClase.f && filtroClase.f !== 'pre' && !MODOS_CLASE[c.modo].fuentes.includes(filtroClase.f)) filtroClase.f = '';
    guardar(); vClase();
  });
  $$('#clPos button').forEach(b => b.onclick = () => { filtroClase.pos = b.dataset.p; vClase(); });
  $$('#clF button').forEach(b => b.onclick = () => { filtroClase.f = b.dataset.f; vClase(); });
  $('#clRevisar').onclick = revisarClase;
  $('#clVaciar').onclick = async () => {
    if (!(await confirmar('¿Vaciar la clase y empezar de nuevo?', 'Vaciar'))) return;
    c.items = []; guardar(); vClase();
  };
  conectarFilasClase();
}

function filasClase(c) {
  return c.items.map((x, i) => {
    const e = ejClase(x.id), p = POS_CLASE[e.pos], r = rangoReps(e.reps);
    const prev = i ? ejClase(c.items[i - 1].id) : null;
    const trans = prev && prev.pos !== e.pos ? transicionHTML(prev, e) : '';
    return `${trans}<li class="cl-fila" data-i="${i}">
      <span class="cl-n">${i + 1}</span>
      <div class="cl-info"><b>${esc(e.n)}</b>
        <small><span class="cl-pos p-${e.pos}">${p.ico} ${p.nom}</span> ${e.f === 'pre' ? 'Pre-Pilates' : e.f === 'mat1' ? 'Mat 1' : 'Mat 2'}${e.reps ? ` · manual: ${esc(e.reps)}` : ''}</small></div>
      <label class="cl-reps"><input type="number" inputmode="numeric" min="1" max="100" step="1" value="${x.reps || ''}" placeholder="${r ? r[0] + (r[1] > r[0] ? '–' + r[1] : '') : '#'}" aria-label="Repeticiones de ${esc(e.n)}"><small>${unidadReps(e.reps)}</small></label>
      <div class="cl-mover">
        <button type="button" data-a="sube" aria-label="Subir" ${i ? '' : 'disabled'}>↑</button>
        <button type="button" data-a="baja" aria-label="Bajar" ${i < c.items.length - 1 ? '' : 'disabled'}>↓</button>
        <button type="button" data-a="quita" aria-label="Quitar">✕</button>
      </div>
    </li>`;
  }).join('');
}

function transicionHTML(a, b) {
  const regreso = POS_CLASE[b.pos].grupo === 2 && b.pos !== 'sentado' && POS_CLASE[a.pos].grupo >= 3;
  const delManual = a.trans && norm(a.trans).includes(norm(b.n).split(' ').slice(0, 2).join(' ')) ? a.trans : '';
  const txt = delManual || TRANSICIONES[a.pos + '>' + b.pos] || `Pensá cómo pasa el cuerpo de ${POS_CLASE[a.pos].nom.toLowerCase()} a ${POS_CLASE[b.pos].nom.toLowerCase()} sin cortar el flujo.`;
  return `<li class="cl-trans ${regreso ? 'aviso' : ''}" aria-hidden="true">↳ ${POS_CLASE[a.pos].nom} → ${POS_CLASE[b.pos].nom}: ${esc(txt)}${delManual ? ' <i>(manual)</i>' : ''}${regreso ? ' <b>Vuelve a supino después del prono.</b>' : ''}</li>`;
}

function conectarFilasClase() {
  const c = claseActual();
  $$('.cl-fila').forEach(li => {
    const i = +li.dataset.i;
    $('input', li).onchange = e => {
      const v = Math.round(+e.target.value);
      c.items[i].reps = v > 0 ? v : null;
      guardar();
    };
    $$('[data-a]', li).forEach(b => b.onclick = () => {
      const a = b.dataset.a;
      if (a === 'quita') c.items.splice(i, 1);
      else {
        const j = a === 'sube' ? i - 1 : i + 1;
        [c.items[i], c.items[j]] = [c.items[j], c.items[i]];
      }
      SND.toque(); guardar();
      const y = window.scrollY; vClase(); window.scrollTo(0, y);
    });
  });
}

function pintarPoolClase() {
  const c = claseActual(), m = MODOS_CLASE[c.modo];
  const usados = new Set(c.items.map(x => x.id));
  const lista = ejerciciosClase().filter(e => (e.f === 'pre' || m.fuentes.includes(e.f)) &&
    (!filtroClase.pos || e.pos === filtroClase.pos) && (!filtroClase.f || e.f === filtroClase.f));
  $('#clPool').innerHTML = lista.length ? lista.map(e => `<button type="button" class="cl-ej ${usados.has(e.id) ? 'usado' : ''}" data-id="${e.id}">
      <span class="cl-pos p-${e.pos}">${POS_CLASE[e.pos].ico}</span><b>${esc(e.n)}</b><small>${e.f === 'pre' ? 'Pre-Pilates' : e.f === 'mat1' ? 'Mat 1' : 'Mat 2'}${usados.has(e.id) ? ' · ya está' : ''}</small></button>`).join('')
    : '<p class="vacio">No hay ejercicios con ese filtro.</p>';
  $$('.cl-ej').forEach(b => b.onclick = () => {
    c.items.push({ id: b.dataset.id, reps: null });
    guardar(); SND.soltar();
    const y = window.scrollY; vClase(); window.scrollTo(0, y);
    toast(`Sumado: <b>${esc(ejClase(b.dataset.id).n)}</b> (n.º ${c.items.length})`, 'toast-suave');
  });
}

/* ---------------- revisión ---------------- */

function analizarClase(c) {
  const m = MODOS_CLASE[c.modo];
  const es = c.items.map(x => ({ ...ejClase(x.id), rep: x.reps }));
  const mat = es.filter(e => e.f !== 'pre');
  const out = [];
  const add = (estado, t, d) => out.push({ estado, t, d });

  /* cantidad */
  const nOk = mat.length >= m.min && mat.length <= m.max;
  add(nOk ? 'ok' : 'mal', `Cantidad: ${mat.length} ejercicios de Mat`,
    nOk ? 'Justo lo que pide la consigna.' : `La consigna pide ${m.min === m.max ? m.min : 'de ' + m.min + ' a ' + m.max}. ${mat.length < m.min ? 'Faltan ' + (m.min - mat.length) + '.' : 'Sobran ' + (mat.length - m.max) + '.'}`);
  const deOtroNivel = mat.filter(e => !m.fuentes.includes(e.f));
  if (deOtroNivel.length) add('mal', 'Ejercicios de otro nivel', `${deOtroNivel.map(e => e.n).join(', ')} no es de ${m.fuentes.map(f => f === 'mat1' ? 'Mat 1' : 'Mat 2').join(' ni ')}.`);

  /* repeticiones exactas */
  const sinReps = es.filter(e => !(e.rep > 0));
  add(sinReps.length ? 'mal' : 'ok', 'Repeticiones exactas',
    sinReps.length ? `Falta el número en: ${sinReps.map(e => e.n).join(', ')}. La corrección pidió "# de repeticiones específicas, no un rango".`
      : 'Cada ejercicio tiene un número, no un rango.');
  const fuera = es.filter(e => e.rep > 0 && rangoReps(e.reps) && (e.rep < rangoReps(e.reps)[0] || e.rep > rangoReps(e.reps)[1]));
  if (fuera.length) add('aviso', 'Repeticiones fuera de lo que indica el manual',
    fuera.map(e => `${e.n}: ${e.rep} (manual: ${e.reps})`).join(' · '));

  /* orden de posiciones */
  const regresos = [];
  let fueAtras = null;
  es.forEach((e, i) => {
    if (POS_CLASE[e.pos].grupo >= 3 && !fueAtras) fueAtras = e;
    if (fueAtras && (e.pos === 'supino' || e.pos === 'inversion')) regresos.push(`${i + 1}. ${e.n}`);
  });
  add(regresos.length ? 'mal' : 'ok', 'Orden de posiciones',
    regresos.length ? `Después de ${fueAtras.n} (${POS_CLASE[fueAtras.pos].nom.toLowerCase()}) volvés a supino con: ${regresos.join(', ')}. El manual ordena de pie → cuatro apoyos → supino → sentado → prono → plancha → de costado → cierre. Fue lo que la corrección de Mat 2 pidió reorganizar.`
      : 'Sigue el orden del manual: no vuelve a supino después del prono.');
  const cambios = es.slice(1).filter((e, i) => e.pos !== es[i].pos).length;
  const muchos = cambios > Math.max(6, Math.round(es.length / 2.5));
  add(muchos ? 'aviso' : 'ok', `Transiciones: ${cambios} cambios de posición`,
    muchos ? 'Son muchos para una clase fluida: agrupá los ejercicios de la misma posición.'
      : cambios ? 'Mirá cada "↳" en tu lista: ¿cómo pasa el cuerpo de uno al otro? En el examen lo tenés que poder explicar.' : 'Todavía no cambia de posición.');

  /* calentamiento */
  const primero = es[0];
  const calienta = primero && (primero.f === 'pre' || /hundred/i.test(primero.n));
  add(calienta ? 'ok' : 'aviso', 'Calentamiento',
    calienta ? `Arranca con ${primero.n}.` : 'Joe empezaba con el Hundred para despertar la circulación; también sirve un Pre-Pilates de activación (Mat 1, págs. 76–78).');

  /* balance: los elementos */
  const tiene = ELEMENTOS_CLASE.map(el => ({ ...el, ej: es.filter(e => el.re.test(norm(e.n))) }));
  const faltan = tiene.filter(t => !t.ej.length);
  add(faltan.length ? (faltan.some(f => f.k === 'extension') || faltan.length > 1 ? 'mal' : 'aviso') : 'ok', 'Clase balanceada',
    faltan.length ? `Falta: ${faltan.map(f => f.nom.toLowerCase()).join(', ')}.${faltan.some(f => f.k === 'extension') ? ' Sin extensión, la clase queda toda en flexión.' : ''}`
      : 'Tiene flexión, movilidad, extensión, rotación o lateral, tren superior y tren inferior.');
  const posiciones = new Set(es.map(e => e.pos === 'inversion' ? 'supino' : e.pos));
  add(posiciones.size >= 4 ? 'ok' : 'aviso', `Variedad de posiciones: ${posiciones.size}`,
    posiciones.size >= 4 ? [...posiciones].map(p => POS_CLASE[p].nom.toLowerCase()).join(', ') + '.' : 'La consigna pide variedad de posiciones: sumá prono, de costado o plancha.');

  const aprobada = out.every(x => x.estado !== 'mal');
  return { out, aprobada };
}

function revisarClase() {
  const c = claseActual();
  const { out, aprobada } = analizarClase(c);
  const nMal = out.filter(x => x.estado === 'mal').length;
  let premio = '';
  if (aprobada) {
    S.clasesOk = (S.clasesOk || 0) + 1;
    const hoy = HOY();
    if (S.claseXpDia !== hoy) {
      S.claseXpDia = hoy;
      ganarXP(30);
      premio = '<span class="xp-pop">+30 XP</span>';
    }
    guardar(); pintarHud();
  }
  $('#clRes').innerHTML = `<div class="cl-res ${aprobada ? 'ok' : ''}">
    <h3>${aprobada ? '¡Clase lista para el examen!' : nMal === 1 ? 'Casi: hay un punto para corregir' : `Hay ${nMal} puntos para corregir`} ${premio}</h3>
    <ul class="cl-check">${out.map(x => `<li class="${x.estado}"><span>${x.estado === 'ok' ? '✓' : x.estado === 'aviso' ? '!' : '✕'}</span>
      <div><b>${esc(x.t)}</b><p>${esc(x.d)}</p></div></li>`).join('')}</ul>
    ${aprobada ? '<p class="micro">Escribila así en el examen: cada ejercicio con su número de repeticiones y, si cambia la posición, cómo pasás al siguiente.</p>' : ''}
  </div>`;
  if (aprobada) {
    SND.fin();
    if (fxCompletos()) FX.chispasEn($('#clRes h3'), { n: 22, dist: 90 });
    if (typeof avisarDesbloqueos === 'function') avisarDesbloqueos();
  } else SND.mal();
  $('#clRes').scrollIntoView({ behavior: 'smooth', block: 'start' });
}
