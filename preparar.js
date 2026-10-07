/* ============================================================
   Pilates Lab — Preparar examen (teórico y práctico)

   Dos modos rápidos desde Inicio, uno para cada examen:
   · Teórico: un repaso corto (12 preguntas) por área. Primero lo que
     fallaste en tus exámenes y todavía no está firme, después lo que tu
     memoria tiene más débil y algo nuevo. Muestra cuánto tenés
     preparado por área (la memoria estimada de cada pregunta, lo no
     visto cuenta 0) y lo que marcó la corrección.
   · Práctico (dar la clase):
       Ensayo en voz alta: la app nombra un ejercicio y vos lo enseñás
       (posición inicial, respiración de cada paso, indicaciones,
       repeticiones y transición al siguiente); después ves cómo es, con
       la animación, y calificás cómo te salió. Lo que no salió vuelve
       al final. Se puede ensayar el repertorio (Mat 1 o Mat 2, en el
       orden del manual), tu clase de examen o una de tus sesiones.
       Drill: preguntas rápidas generadas del manual (¿inhala o exhala?,
       ¿qué sigue?, transiciones, ¿de qué ejercicio es esta indicación?,
       repeticiones, osteoporosis).
   El ensayo se guarda en S.ensayo[id] = { n, ok, nota, ult }.
   Se carga después de app.js.
   ============================================================ */
'use strict';

/* ---------------- teórico ---------------- */
const AREAS_TEO = {
  todo:       { nom: 'Todo', ico: '📚' },
  principios: { nom: 'Principios del movimiento', ico: '⭐', temas: ['historia', 'principios', 'planos', 'postura', 'bb-mov', 'ex-pm'] },
  anatomia:   { nom: 'Anatomía', ico: '🫁', temas: ['tronco', 'mmii', 'mmss', 'cadenas'] },
  mat1:       { nom: 'Mat 1', ico: '🤸', temas: ['bb-mat1', 'mat1', 'repertorio', 'progresion', 'premat'], ex: 'mat1' },
  mat2:       { nom: 'Mat 2', ico: '🦢', temas: ['bb-mat2', 'mat2an', 'familias'], ex: 'mat2' },
  especiales: { nom: 'Poblaciones especiales', ico: '🦴', temas: ['osteo', 'embarazo'] }
};
let areaTeo = 'todo';
/* el teórico es escrito: sin fotos ni animaciones para reconocer */
function poolTeo(area) {
  const a = AREAS_TEO[area] || AREAS_TEO.todo;
  return ITEMS.filter(i => i.id && !['anim', 'foto'].includes(i.tipo) &&
    (!a.temas || a.temas.includes(i.tema) || (a.ex && i.tema === 'ex-mat' && i.ref && i.ref.examen && i.ref.examen.ex === a.ex)));
}
/* preparación: promedio de la memoria estimada hoy (lo no visto cuenta 0) */
function preparacionTeo(area) {
  const pool = poolTeo(area);
  if (!pool.length) return { pct: 0, vistos: 0, total: 0 };
  const vistos = pool.filter(i => S.items[i.id]);
  return { pct: vistos.reduce((s, i) => s + (memoria(i.id) || 0), 0) / pool.length, vistos: vistos.length, total: pool.length };
}
const falladaEnExamen = i => !!(i.ref && i.ref.examen && i.ref.examen.fallada);
const firme = i => { const f = S.items[i.id]; return !!f && f.s >= 7 && (memoria(i.id) || 0) >= 0.9; };
function sesionTeorico(area, n = 12) {
  const pool = poolTeo(area), lote = [];
  const tomar_ = (arr, k) => { for (const i of arr) { if (lote.length >= n || k <= 0) return; if (!lote.includes(i)) { lote.push(i); k--; } } };
  const flojas = mezclar(pool.filter(i => falladaEnExamen(i) && !firme(i)));
  const debiles = pool.filter(i => S.items[i.id] && !falladaEnExamen(i)).sort(porMemoria);
  const nuevas = mezclar(pool.filter(i => !S.items[i.id] && !falladaEnExamen(i)));
  tomar_(flojas, 4);
  tomar_(debiles.filter(i => (memoria(i.id) || 0) < 0.95), 5);
  tomar_(nuevas, 3);
  tomar_(debiles, n); tomar_(nuevas, n); tomar_(flojas, n);
  return intercalar(lote).map(it => entrada(it));
}

/* ---------------- práctico: ensayo en voz alta ---------------- */
const ensayo = () => { if (!S.ensayo || typeof S.ensayo !== 'object') S.ensayo = {}; return S.ensayo; };
const ordenLibro = f => BB.ejercicios.filter(e => e.f === f && POSES[e.id]);
/* un id de "Armá tu clase" (pre-…) o de una sesión (pm…) → ficha */
function fichaEnsayo(id) {
  if (EJ_BB[id]) return { bb: EJ_BB[id] };
  if (PM[id]) return { pm: PM[id] };
  if (/^pre-/.test(id)) { const p = PREMAT.find(x => 'pre-' + norm(x.n).replace(/ /g, '-') === id); if (p) return { pm: p }; }
  return null;
}
const nomFicha = f => (f.bb || f.pm).n;
const posFicha = f => f.bb ? f.bb.pos : (typeof POS_PM_CLASE !== 'undefined' && POS_PM_CLASE[f.pm.pos]) || null;
function conjuntosEnsayo() {
  const out = [
    { k: 'mat1', nom: 'Mat 1', ico: '🤸', ids: ordenLibro('mat1').map(e => e.id), repertorio: true },
    { k: 'mat2', nom: 'Mat 2', ico: '🦢', ids: ordenLibro('mat2').map(e => e.id), repertorio: true }
  ];
  const cl = typeof claseActual === 'function' ? claseActual().items.map(x => x.id).filter(fichaEnsayo) : [];
  if (cl.length) out.push({ k: 'clase', nom: 'Mi clase de examen', ico: '🧩', ids: cl });
  (S.planes || []).forEach(p => { const ids = p.items.map(x => x.id).filter(fichaEnsayo); if (ids.length) out.push({ k: 'plan:' + p.id, nom: p.nombre, ico: '📋', ids }); });
  return out;
}
let conjEnsayo = 'mat1';
/* del repertorio: los que menos te salieron (o nunca ensayaste), en el orden del manual;
   de una clase o sesión: la clase entera, en su orden */
function sesionEnsayo(k, n = 6) {
  const c = conjuntosEnsayo().find(x => x.k === k) || conjuntosEnsayo()[0];
  let ids = c.ids;
  if (c.repertorio) {
    /* nunca ensayados primero; después los que peor salieron, y entre iguales el que hace más que no ensayás */
    const E = ensayo(), peso = id => { const r = E[id]; return r ? r.nota * 100 - Math.min(60, Math.max(0, diasEntre(r.ult, HOY()))) : -1; };
    const elegidos = new Set(mezclar(ids).sort((a, b) => peso(a) - peso(b)).slice(0, n));
    ids = ids.filter(id => elegidos.has(id));
  } else ids = ids.slice(0, 14);
  return ids.map((id, i) => {
    /* el siguiente: en el repertorio, el que sigue en el manual; en una clase, el de la clase */
    const lista = c.repertorio ? c.ids : ids, j = lista.indexOf(id);
    return entrada({ id: null, tipo: 'gen', gen: 'ensayo', tema: 'repertorio',
      ref: { ej: id, sig: lista[j + 1] || null, manual: !!c.repertorio, pos: i + 1, total: ids.length } }, 'ensayo');
  });
}
const claseFase = f => /inhala.*exhala|continuo/i.test(f || '') ? 'ambas' : /inhala/i.test(f || '') ? 'inhala' : /exhala/i.test(f || '') ? 'exhala' : '';
/* un número para decir en la clase: el del medio del rango */
const repsSugeridas = txt => { const r = rangoReps(txt); return r ? Math.round((r[0] + r[1]) / 2) : null; };
function transicionEnsayo(f, sig, manual) {
  if (!sig) return '';
  const a = posFicha(f), b = posFicha(sig);
  const pos = a && b && a !== b ? (TRANSICIONES[a + '>' + b] || 'Pensá cómo pasa el cuerpo de una posición a la otra sin cortar el flujo.') : `Seguís en ${a ? POS_CLASE[a].nom.toLowerCase() : 'la misma posición'}: acomodá lo que cambia sin perder la conexión.`;
  return `${a && b && a !== b ? `<b>${esc(POS_CLASE[a].nom)} → ${esc(POS_CLASE[b].nom)}:</b> ` : ''}${esc(pos)}${manual && f.bb && f.bb.trans ? `<br><small>Según el manual: ${esc(f.bb.trans)}</small>` : ''}`;
}
function ejEnsayo(it) {
  const r = it.ref, f = fichaEnsayo(r.ej), sig = r.sig ? fichaEnsayo(r.sig) : null;
  const e = f.bb, p = f.pm, pz = posFicha(f);
  const el = document.createElement('div');
  el.className = 'ens';
  const reps = e ? e.reps : p.reps, nSug = repsSugeridas(reps);
  const prec = e ? Object.values(e.prec || {}) : [];
  el.innerHTML = `
    <div class="ens-cab"><span class="ens-num">${r.pos} de ${r.total}</span>${pz ? `<span class="cl-pos p-${pz}">${POS_CLASE[pz].ico} ${esc(POS_CLASE[pz].nom)}</span>` : ''}<span class="pill gris">${e ? (e.f === 'mat1' ? 'Mat 1' : 'Mat 2') : 'Pre-Pilates'}</span></div>
    <h2 class="ens-nom">${esc(nomFicha(f))}</h2>
    <div class="ens-frente">
      <p class="ens-pide">Enseñalo como en la clase, en voz alta:</p>
      <ul class="ens-check">
        <li>📍 La posición inicial</li>
        ${e ? '<li>🌬️ La respiración de cada paso</li><li>💬 Dos indicaciones (cues)</li>' : '<li>🎯 El objetivo</li>'}
        <li>🔢 Las repeticiones: un número, no un rango</li>
        ${sig ? `<li>🔀 La transición a <b>${esc(nomFicha(sig))}</b></li>` : ''}
      </ul>
      <p class="ens-crono" aria-live="off">⏱ <span>0:00</span></p>
      <button type="button" class="btn3d azul ancho" data-ens="ver">Ver cómo es</button>
    </div>
    <div class="ens-dorso" hidden>
      ${e && POSES[e.id] ? '<div class="fig-ej ens-fig"></div>' : p && imagen(p.id) ? `<figure class="foto-ej"><img src="${imagen(p.id)}" alt="${esc(p.n)}"></figure>` : ''}
      <dl class="ens-dl">
        <dt>📍 Posición inicial</dt><dd>${esc(e ? e.inicial : p.pos)}</dd>
        ${e ? `<dt>🌬️ Respiración y pasos</dt><dd><ol class="ens-pasos">${e.seq.map(s => `<li><span class="fase-chip ${claseFase(s.fase)}">${esc(s.fase)}</span> ${esc(s.accion)}</li>`).join('')}</ol></dd>` : ''}
        ${e && e.indic.length ? `<dt>💬 Indicaciones</dt><dd><ul>${e.indic.slice(0, 3).map(x => `<li>${esc(x)}</li>`).join('')}</ul></dd>` : ''}
        ${p ? `<dt>🎯 Objetivo</dt><dd>${esc([p.principio, p.comp, p.obj].filter(Boolean).join(' · '))}</dd>` : ''}
        <dt>🔢 Repeticiones</dt><dd>${esc(reps || '—')}${nSug ? ` · en la clase decí un número, por ejemplo <b>${nSug} ${unidadReps(reps)}</b>` : ''}</dd>
        ${sig ? `<dt>🔀 Transición a ${esc(nomFicha(sig))}</dt><dd>${transicionEnsayo(f, sig, r.manual)}</dd>` : ''}
        ${prec.length || (e && e.osteoTxt) ? `<dt>⚠️ Precauciones</dt><dd><ul>${prec.slice(0, 2).map(x => `<li>${esc(x)}</li>`).join('')}${e && e.osteoTxt ? `<li>🦴 ${esc(e.osteoTxt)}</li>` : ''}</ul></dd>` : ''}
        ${p && p.contra ? `<dt>⚠️ Contraindicaciones</dt><dd>${esc(p.contra)}</dd>` : ''}
      </dl>
      <p class="predq">¿Cómo te salió?</p>
      <div class="notas3">
        <button type="button" class="cal n1" data-g="1"><b>No me salió</b><i>vuelve al final</i></button>
        <button type="button" class="cal n2" data-g="2"><b>Me faltó algo</b><i>la repaso</i></button>
        <button type="button" class="cal n3" data-g="3"><b>Lo dije completo</b><i>¡a la clase!</i></button>
      </div>
    </div>`;
  /* cronómetro: en el examen el tiempo de la clase cuenta */
  const t0 = Date.now(), crono = $('.ens-crono span', el);
  const tic = setInterval(() => { if (!el.isConnected) { clearInterval(tic); return; } const s = Math.round((Date.now() - t0) / 1000); crono.textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; }, 1000);
  let hecho = false;
  const ver = () => {
    clearInterval(tic);
    $('.ens-frente', el).hidden = true; $('.ens-dorso', el).hidden = false;
    const fig = $('.ens-fig', el);
    if (fig) FIGURA.reproductor(fig, { ...POSES[e.id], nom: '' }, { fantasma: false, fluido: ritmoFluido(),
      resp: POSES[e.id].poses.map((_, k) => { const q = pasoDePose(POSES[e.id], (k + 1) % POSES[e.id].poses.length); return q > 0 && e.seq[q - 1] ? respDeFase(e.seq[q - 1].fase) : null; }) });
    SND.flip();
  };
  const ej = {
    consigna: '🎤 Ensayo · dar la clase', pregunta: '', el, manual: true, n: 1,
    tecla(k) { if (!$('.ens-dorso', el).hidden) { const b = $(`[data-g="${k}"]`, el); if (b) b.click(); } else if (k === ' ' || k === 'Enter') ver(); },
    autoResolver(bien = true) { ver(); $(`[data-g="${bien ? 3 : 1}"]`, el).click(); }
  };
  $('[data-ens="ver"]', el).onclick = ver;
  $$('[data-g]', el).forEach(b => b.onclick = () => {
    if (hecho) return;
    hecho = true;
    const g = +b.dataset.g, E = ensayo(), x = E[r.ej] || (E[r.ej] = { n: 0, ok: 0, nota: 0, ult: null });
    x.n++; if (g === 3) x.ok++; x.nota = g; x.ult = HOY();
    ej.alCalificar({ nota: g, p: g >= 2 ? 1 : 0 });
  });
  return ej;
}

/* ---------------- práctico: drill de la clase (preguntas generadas) ---------------- */
const enLibro = libro => BB.ejercicios.filter(e => POSES[e.id] && (!libro || e.f === libro));
const nomLibro = f => f === 'mat1' ? 'Mat 1' : 'Mat 2';
function distintos(correcta, candidatos, n = 3) {
  const vistos = new Set([norm(correcta)]), out = [];
  for (const c of candidatos) { const k = norm(c); if (!c || vistos.has(k)) continue; vistos.add(k); out.push(c); if (out.length >= n) break; }
  return out;
}
const GEN_EXTRA = {
  /* ¿inhala o exhala? en un paso concreto */
  respira(ref) {
    const cands = enLibro(ref.libro).flatMap(e => e.seq.map((s, k) => ({ e, s, k })).filter(x => /^(Inhala|Exhala)$/.test(x.s.fase)));
    const { e, s, k } = azar(cands);
    return { consigna: '🌬️ Respiración', enunciado: `<b>${esc(e.n)}</b>, paso ${k + 1}: «${esc(s.accion)}» ¿Inhala o exhala?`,
      opciones: ['Inhala', 'Exhala'], correcta: s.fase,
      explica: `${e.n}: ${e.seq.map(x => `${x.fase}: ${x.accion}`).join(' · ')}` };
  },
  /* ¿qué sigue en el orden del manual? */
  sigue(ref) {
    const libro = ref.libro || azar(['mat1', 'mat2']), L_ = ordenLibro(libro), i = Math.floor(Math.random() * (L_.length - 1));
    const correcta = L_[i + 1].n;
    const cerca = [L_[i + 2], L_[i - 1], L_[i + 3], L_[i - 2]].filter(Boolean).map(e => e.n);
    const dist = distintos(correcta, [...cerca, ...mezclar(L_).map(e => e.n)].filter(nn => nn !== L_[i].n));
    return { consigna: '↕️ Orden de la clase', enunciado: `En el orden del manual de ${nomLibro(libro)}, ¿qué viene después de <b>${esc(L_[i].n)}</b>?`,
      opciones: mezclar([correcta, ...dist]), correcta,
      explica: [L_[i - 1], L_[i], L_[i + 1], L_[i + 2]].filter(Boolean).map(e => e.n).join(' → ') };
  },
  /* cómo pasa el cuerpo entre dos ejercicios de distinta posición */
  transicion(ref) {
    const pares = [];
    for (const libro of ref.libro ? [ref.libro] : ['mat1', 'mat2']) {
      const L_ = ordenLibro(libro);
      for (let i = 0; i + 1 < L_.length; i++) if (L_[i].pos !== L_[i + 1].pos && TRANSICIONES[L_[i].pos + '>' + L_[i + 1].pos]) pares.push([L_[i], L_[i + 1]]);
    }
    const [a, b] = azar(pares), clave_ = a.pos + '>' + b.pos, correcta = TRANSICIONES[clave_];
    const dist = distintos(correcta, mezclar(Object.entries(TRANSICIONES).filter(([k]) => k !== clave_).map(([, v]) => v)));
    return { consigna: '🔀 Transición', enunciado: `De <b>${esc(a.n)}</b> (${esc(POS_CLASE[a.pos].nom.toLowerCase())}) a <b>${esc(b.n)}</b> (${esc(POS_CLASE[b.pos].nom.toLowerCase())}): ¿cómo pasás?`,
      opciones: mezclar([correcta, ...dist]), correcta,
      explica: a.trans ? `Según el manual, después de ${a.n}: ${a.trans}` : '' };
  },
  /* ¿de qué ejercicio es esta indicación? */
  cue(ref) {
    const palabras = e => norm(e.n).split(' ').filter(w => w.length > 3);
    const cands = enLibro(ref.libro).flatMap(e => e.indic.filter(c => !palabras(e).some(w => norm(c).includes(w))).map(c => ({ e, c })));
    const { e, c } = azar(cands);
    const otros = enLibro(ref.libro).filter(o => o.id !== e.id);
    const dist = distintos(e.n, [...mezclar(otros.filter(o => o.pos === e.pos)), ...mezclar(otros)].map(o => o.n));
    return { consigna: '💬 Indicaciones', enunciado: `«${esc(c)}» ¿En qué ejercicio usás esta indicación?`,
      opciones: mezclar([e.n, ...dist]), correcta: e.n, explica: `${e.n}: ${e.indic.join(' · ')}` };
  },
  /* repeticiones según el manual */
  reps(ref) {
    const todos = enLibro(ref.libro), e = azar(todos.filter(x => rangoReps(x.reps)));
    /* primero rangos de la misma unidad (reps con reps, sets con sets); si no alcanzan, el mismo rango en otra unidad */
    const misma = mezclar(todos.filter(x => x.reps !== e.reps && unidadReps(x.reps) === unidadReps(e.reps)).map(x => x.reps));
    const r = rangoReps(e.reps), u = unidadReps(e.reps), alt = [[r[0] + 2, r[1] + 2], [Math.max(1, r[0] - 2), Math.max(2, r[1] - 2)], [r[0] + 4, r[1] + 6]].map(([a_, b_]) => `${a_}–${b_} ${u === 'círculos' ? 'círculos en cada sentido' : u}`);
    const dist = distintos(e.reps, [...misma, ...alt]);
    const nSug = repsSugeridas(e.reps);
    return { consigna: '🔢 Repeticiones', enunciado: `Según el manual, ¿cuántas repeticiones lleva <b>${esc(e.n)}</b>?`,
      opciones: mezclar([e.reps, ...dist]), correcta: e.reps,
      explica: `En la clase decí un número exacto dentro del rango${nSug ? `, por ejemplo ${nSug}` : ''}: la corrección pidió "repeticiones específicas, no un rango".` };
  }
};
const MEZCLA_DRILL = ['respira', 'sigue', 'cue', 'transicion', 'respira', 'reps', 'sigue', 'cue', 'semaforo', 'respira'];
let libroDrill = '';
function sesionDrill(libro) {
  return MEZCLA_DRILL.map(g => entrada({ id: null, tipo: 'gen', gen: g, tema: g === 'semaforo' ? 'osteo' : 'repertorio', ref: { libro } }, 'gen'));
}

/* ---------------- tarjetas en Inicio y hojas de cada modo ---------------- */
function prepExamenHTML() {
  const t = preparacionTeo('todo'), E = ensayo();
  const bb = BB.ejercicios.filter(e => POSES[e.id]), listos = bb.filter(e => E[e.id] && E[e.id].nota === 3).length;
  return `<h2 class="secc">Preparar examen</h2>
    <div class="prep-grid">
      <button type="button" class="prep-card teo" id="prepTeo">
        <span class="prep-ico" aria-hidden="true">📝</span><b>Examen teórico</b>
        <small>Repaso rápido: lo que fallaste y lo más débil primero</small>
        <span class="prep-barra" aria-hidden="true"><span style="width:${Math.round(t.pct * 100)}%"></span></span>
        <i>preparación ${Math.round(t.pct * 100)} %</i></button>
      <button type="button" class="prep-card pra" id="prepPra">
        <span class="prep-ico" aria-hidden="true">🧑‍🏫</span><b>Examen práctico</b>
        <small>Dar la clase: ensayo en voz alta y drill</small>
        <span class="prep-barra" aria-hidden="true"><span style="width:${Math.round(100 * listos / bb.length)}%"></span></span>
        <i>${listos} de ${bb.length} ensayados completos</i></button>
    </div>`;
}
function conectarPrepExamen() {
  const t = $('#prepTeo'), p = $('#prepPra');
  if (t) t.onclick = () => { SND.toque(); hojaTeorico(); };
  if (p) p.onclick = () => { SND.toque(); hojaPractico(); };
}
function hojaTeorico() {
  const m = abrirModal(`<div class="prep-hoja">
    <div class="vm-cab"><h3>📝 Examen teórico</h3><button type="button" class="btn small ghost" data-cerrar aria-label="Cerrar">✕</button></div>
    <p class="sub">12 preguntas, unos 8 minutos. Primero lo que fallaste en tus exámenes y todavía no está firme, después lo que tu memoria tiene más débil y algo nuevo.</p>
    <div class="prep-areas" role="radiogroup" aria-label="Área">${Object.entries(AREAS_TEO).map(([k, a]) => {
      const pr = preparacionTeo(k);
      return `<button type="button" class="prep-area${k === areaTeo ? ' on' : ''}" role="radio" aria-checked="${k === areaTeo}" data-area="${k}">
        <span>${a.ico} ${esc(a.nom)}</span><span class="prep-barra" aria-hidden="true"><span style="width:${Math.round(pr.pct * 100)}%"></span></span>
        <small>${Math.round(pr.pct * 100)} % · ${pr.vistos} de ${pr.total} vistas</small></button>`;
    }).join('')}</div>
    <button type="button" class="btn3d verde ancho" id="teoEmpezar">Empezar · 12 preguntas</button>
    <button type="button" class="btn ghost ancho" id="teoSimulacro">📝 Simulacro con tus exámenes anteriores</button>
    <details class="prep-recordar"><summary>Lo que marcó la corrección (${LECCIONES_EXAMEN.length})</summary>
      <ul>${LECCIONES_EXAMEN.map(l => `<li><span aria-hidden="true">${l.ico}</span> ${esc(l.t)}</li>`).join('')}</ul></details>
    <p class="micro">La preparación de cada área es la probabilidad promedio de recordar hoy cada pregunta; lo que todavía no viste cuenta 0.</p>
  </div>`);
  m.classList.add('modal-prep');
  $('[data-cerrar]', m).onclick = cerrarModal;
  $$('[data-area]', m).forEach(b => b.onclick = () => {
    areaTeo = b.dataset.area;
    $$('[data-area]', m).forEach(x => { x.classList.toggle('on', x === b); x.setAttribute('aria-checked', x === b); });
    SND.toque();
  });
  $('#teoEmpezar', m).onclick = () => iniciarSesion('practica', sesionTeorico(areaTeo), `Teórico · ${AREAS_TEO[areaTeo].nom}`);
  $('#teoSimulacro', m).onclick = () => iniciarSesion('practica', sesionPractica('examen'), MODOS.examen.nom);
}
function hojaPractico() {
  const cs = conjuntosEnsayo();
  if (!cs.some(c => c.k === conjEnsayo)) conjEnsayo = 'mat1';
  const E = ensayo();
  const m = abrirModal(`<div class="prep-hoja">
    <div class="vm-cab"><h3>🧑‍🏫 Examen práctico · dar la clase</h3><button type="button" class="btn small ghost" data-cerrar aria-label="Cerrar">✕</button></div>
    <section class="prep-bloque">
      <h4>🎤 Ensayo en voz alta</h4>
      <p class="sub">Te nombro un ejercicio y lo enseñás como en la clase: posición inicial, respiración de cada paso, dos indicaciones, un número de repeticiones y la transición al siguiente. Después lo ves con la animación y calificás cómo te salió.</p>
      <div class="chips prep-conj" role="radiogroup" aria-label="Qué ensayar">${cs.map(c => {
        const ok = c.ids.filter(id => E[id] && E[id].nota === 3).length;
        return `<button type="button" role="radio" data-conj="${esc(c.k)}" class="${c.k === conjEnsayo ? 'on' : ''}" aria-checked="${c.k === conjEnsayo}">${c.ico} ${esc(c.nom)} <small>${ok}/${c.ids.length}</small></button>`;
      }).join('')}</div>
      <button type="button" class="btn3d verde ancho" id="ensEmpezar">Empezar el ensayo</button>
      <p class="micro">Del repertorio: 6 ejercicios, primero los que menos te salieron. De tu clase o una sesión: la clase entera en su orden, con sus transiciones.</p>
    </section>
    <section class="prep-bloque">
      <h4>⚡ Drill de la clase · 10 preguntas</h4>
      <p class="sub">¿Inhala o exhala?, ¿qué sigue en el orden?, transiciones, ¿de qué ejercicio es esta indicación?, repeticiones y osteoporosis.</p>
      <div class="chips prep-libro" role="radiogroup" aria-label="Libro">${[['', 'Mat 1 y 2'], ['mat1', 'Mat 1'], ['mat2', 'Mat 2']].map(([k, t]) =>
        `<button type="button" role="radio" data-libro="${k}" class="${k === libroDrill ? 'on' : ''}" aria-checked="${k === libroDrill}">${t}</button>`).join('')}</div>
      <button type="button" class="btn3d azul ancho" id="drillEmpezar">Empezar el drill</button>
    </section>
    <button type="button" class="btn ghost ancho" id="praClase">🧩 Armá tu clase (el diseño que se corrige en el examen)</button>
  </div>`);
  m.classList.add('modal-prep');
  $('[data-cerrar]', m).onclick = cerrarModal;
  $$('[data-conj]', m).forEach(b => b.onclick = () => {
    conjEnsayo = b.dataset.conj;
    $$('[data-conj]', m).forEach(x => { x.classList.toggle('on', x === b); x.setAttribute('aria-checked', x === b); });
    SND.toque();
  });
  $$('[data-libro]', m).forEach(b => b.onclick = () => {
    libroDrill = b.dataset.libro;
    $$('[data-libro]', m).forEach(x => { x.classList.toggle('on', x === b); x.setAttribute('aria-checked', x === b); });
    SND.toque();
  });
  $('#ensEmpezar', m).onclick = () => { const c = cs.find(x => x.k === conjEnsayo); iniciarSesion('practica', sesionEnsayo(conjEnsayo), `Ensayo · ${c ? c.nom : ''}`); };
  $('#drillEmpezar', m).onclick = () => iniciarSesion('practica', sesionDrill(libroDrill), 'Drill de la clase');
  $('#praClase', m).onclick = () => { cerrarModal(); ir('clase'); };
}
