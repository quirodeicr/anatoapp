/* ============================================================
   Pilates Lab — Mis sesiones (planificador)

   Para planear sesiones reales (una clase, una práctica propia) y
   guardarlas: nombre, fecha, para quién, foco y notas; los ejercicios
   del manual (Mat 1 y Mat 2) y de Pre-Pilates, cada uno con sus
   repeticiones, el prop y una nota. La app estima la duración, marca
   las transiciones entre posiciones y la revisa con los mismos
   criterios que "Armá tu clase" (orden, transiciones, repeticiones,
   calentamiento, balance), sin la cantidad fija del examen.
   Se guarda con el progreso (S.planes: S.sesiones ya cuenta las
   sesiones de estudio) y viaja en el respaldo y en la copia.
   ============================================================ */
'use strict';

const PROPS_PLAN = ['Bola', 'Liga cerrada', 'Liga abierta', 'Pesa', 'Círculo', 'Roller', 'Bloque', 'Silla'];
const FOCOS_PLAN = ['Movilidad de columna', 'Core / centro', 'Extensión', 'Rotación', 'Tren superior', 'Tren inferior', 'Equilibrio', 'Respiración', 'Osteoporosis: cuidar la flexión'];
/* posiciones de Pre-Pilates en las de la clase */
const POS_PM_CLASE = { 'Supino': 'supino', 'Sedente': 'sentado', 'Sedente (silla)': 'sentado', '4 puntos': 'cuatro', 'Bípedo': 'pie', 'Prono': 'prono',
  'Decúbito lateral': 'costado', 'Plancha prona': 'plancha', 'Plancha supina': 'plancha', 'De rodillas': 'cuatro' };

/* catálogo: los 48 del manual + los 99 de Pre-Pilates */
let CATALOGO_PLAN = null;
function catalogoPlan() {
  if (CATALOGO_PLAN) return CATALOGO_PLAN;
  const bb = BB.ejercicios.map(e => ({ id: e.id, n: e.n, pos: e.pos, f: e.f, reps: e.reps, trans: e.trans, osteo: e.osteo }));
  const pm = PREMAT.filter(p => POS_PM_CLASE[p.pos]).map(p => ({ id: p.id, n: p.n, pos: POS_PM_CLASE[p.pos], f: 'pre', reps: p.reps || '', pm: true }));
  return (CATALOGO_PLAN = [...pm, ...bb]);
}
const ejPlan = id => catalogoPlan().find(e => e.id === id);
const miniPlan = e => e.pm ? miniEj({ pm: e.id }) : miniEj({ bb: e.id });
const fuenteNom = f => f === 'pre' ? 'Pre-Pilates' : f === 'mat1' ? 'Mat 1' : 'Mat 2';

function planes() { if (!Array.isArray(S.planes)) S.planes = []; return S.planes; }
const nuevoId = () => 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
function nuevoPlan(base = {}) {
  const p = { id: nuevoId(), nombre: base.nombre || 'Sesión nueva', fecha: base.fecha || HOY(), para: base.para || '', dur: base.dur || 55,
    focos: base.focos || [], notas: base.notas || '', items: base.items || [], creado: HOY(), editado: Date.now() };
  planes().unshift(p); guardar();
  return p;
}
const tocar = p => { p.editado = Date.now(); guardar(); };

/* duración estimada: preparar cada ejercicio, sus repeticiones y los cambios de posición */
function duracionPlan(p) {
  let seg = 0, prev = null;
  for (const x of p.items) {
    const e = ejPlan(x.id); if (!e) continue;
    const r = x.reps || (rangoReps(e.reps) || [6])[0], u = unidadReps(e.reps);
    seg += 20 + r * (u === 'sets' ? 12 : u === 'círculos' ? 5 : 7);
    if (prev && prev.pos !== e.pos) seg += 20;
    prev = e;
  }
  return Math.round(seg / 60);
}

let planAbierto = null, filtroPlan = { pos: '', f: '', q: '' };

/* ---------------- lista ---------------- */
function vPlanes() {
  if (planAbierto && planes().some(p => p.id === planAbierto)) return vPlan(planAbierto);
  planAbierto = null;
  const lista = [...planes()].sort((a, b) => (b.fecha || '').localeCompare(a.fecha || '') || b.editado - a.editado);
  const hoy = HOY();
  app().innerHTML = `
    <h1 class="tit">Mis sesiones</h1>
    <p class="sub">Planeá tus sesiones de Pilates y quedan guardadas acá. La app calcula la duración, te marca las transiciones y las revisa como en "Armá tu clase".</p>
    <div class="fila pl-acc">
      <button type="button" class="btn3d verde" id="plNueva">＋ Nueva sesión</button>
      ${claseActual().items.length ? '<button type="button" class="btn ghost" id="plDeClase">Desde mi clase de examen</button>' : ''}
    </div>
    ${lista.length ? `<div class="pl-lista">${lista.map(p => {
      const ps = [...new Set(p.items.map(x => (ejPlan(x.id) || {}).pos).filter(Boolean))];
      const proxima = p.fecha && p.fecha >= hoy;
      return `<article class="pl-tarjeta${proxima ? ' proxima' : ''}" data-id="${p.id}">
        <button type="button" class="pl-abrir" data-a="abrir" aria-label="Abrir ${esc(p.nombre)}">
          <b>${esc(p.nombre)}</b>
          <small>${p.fecha ? fechaLinda(p.fecha) : 'Sin fecha'}${p.para ? ' · ' + esc(p.para) : ''}</small>
          <span class="pl-datos">${p.items.length} ejercicios · ≈ ${duracionPlan(p)} min ${ps.map(k => POS_CLASE[k].ico).join('')}</span>
          ${p.focos.length ? `<span class="pl-focos">${p.focos.map(f => `<i>${esc(f)}</i>`).join('')}</span>` : ''}
        </button>
        <div class="pl-mini-acc">
          <button type="button" data-a="dup" aria-label="Duplicar ${esc(p.nombre)}">⧉</button>
          <button type="button" data-a="borrar" aria-label="Borrar ${esc(p.nombre)}">🗑</button>
        </div>
      </article>`; }).join('')}</div>`
      : '<p class="vacio">Todavía no hay sesiones. Tocá <b>＋ Nueva sesión</b> para planear la primera.</p>'}`;
  $('#plNueva').onclick = () => { const p = nuevoPlan(); planAbierto = p.id; SND.toque(); vPlan(p.id); };
  const dc = $('#plDeClase');
  if (dc) dc.onclick = () => { const p = planDesdeClase(); planAbierto = p.id; SND.toque(); vPlan(p.id); toast('Copiada tu clase de examen como sesión nueva.', 'toast-suave'); };
  $$('.pl-tarjeta').forEach(t => {
    const p = planes().find(x => x.id === t.dataset.id);
    $$('[data-a]', t).forEach(b => b.onclick = async () => {
      const a = b.dataset.a;
      if (a === 'abrir') { planAbierto = p.id; vPlan(p.id); }
      else if (a === 'dup') { const c = nuevoPlan({ ...JSON.parse(JSON.stringify(p)), nombre: p.nombre + ' (copia)' }); SND.toque(); vPlanes(); toast(`Duplicada: <b>${esc(c.nombre)}</b>`, 'toast-suave'); }
      else if (a === 'borrar') {
        if (!(await confirmar(`¿Borrar la sesión "${p.nombre}"?`, 'Borrar'))) return;
        S.planes = planes().filter(x => x.id !== p.id); guardar(); vPlanes();
      }
    });
  });
}
const fechaLinda = f => { try { return new Date(f + 'T12:00').toLocaleDateString('es', { weekday: 'short', day: 'numeric', month: 'short' }); } catch (e) { return f; } };

/* la clase de "Armá tu clase" como sesión (los Pre-Pilates de esa lista se buscan por nombre) */
function planDesdeClase() {
  const items = claseActual().items.map(x => {
    const e = ejClase(x.id);
    if (!e) return null;
    if (e.f !== 'pre') return { id: e.id, reps: x.reps || null, prop: '', nota: '' };
    const p = PREMAT.find(q => norm(q.n) === norm(e.n));
    return p ? { id: p.id, reps: x.reps || null, prop: '', nota: '' } : null;
  }).filter(Boolean);
  return nuevoPlan({ nombre: 'Mi clase de examen', items });
}

/* ---------------- editor ---------------- */
function vPlan(id) {
  const p = planes().find(x => x.id === id);
  if (!p) { planAbierto = null; return vPlanes(); }
  const es = p.items.map(x => ejPlan(x.id)).filter(Boolean);
  const ps = [...new Set(es.map(e => e.pos))];
  app().innerHTML = `
    <button type="button" class="volver" id="plVolver">← Mis sesiones</button>
    <label class="pl-nombre"><span class="sr">Nombre de la sesión</span><input id="plNombre" value="${esc(p.nombre)}" maxlength="80"></label>
    <div class="pl-campos">
      <label>Fecha<input type="date" id="plFecha" value="${esc(p.fecha || '')}"></label>
      <label>Para<input id="plPara" value="${esc(p.para)}" placeholder="un grupo, una persona…" maxlength="60"></label>
      <label>Duración buscada<span class="pl-min"><input type="number" id="plDur" inputmode="numeric" min="10" max="120" step="5" value="${p.dur || ''}"> min</span></label>
    </div>
    <div class="chips pl-focos-sel" role="group" aria-label="Foco de la sesión">${FOCOS_PLAN.map(f => `<button type="button" data-foco="${esc(f)}" class="${p.focos.includes(f) ? 'on' : ''}" aria-pressed="${p.focos.includes(f)}">${esc(f)}</button>`).join('')}</div>
    <label class="pl-notas">Notas<textarea id="plNotas" rows="2" placeholder="Objetivo, adaptaciones, música, recordatorios…">${esc(p.notas)}</textarea></label>

    <div class="pl-resumen" id="plResumen">${resumenPlanHTML(p)}</div>
    <div class="fila pl-acc">
      <button type="button" class="btn3d verde" id="plRevisar" ${p.items.length ? '' : 'disabled'}>Revisar sesión</button>
      <button type="button" class="btn ghost" id="plCopiar" ${p.items.length ? '' : 'disabled'}>Copiar como texto</button>
      <button type="button" class="btn ghost" id="plDup">Duplicar</button>
      <button type="button" class="btn ghost" id="plBorrar">Borrar</button>
    </div>
    <div id="plRes"></div>

    <h2 class="secc">Ejercicios · ${p.items.length}${ps.length ? ' ' + ps.map(k => POS_CLASE[k].ico).join('') : ''}</h2>
    <ol class="cl-lista pl-items" id="plLista">${p.items.length ? filasPlan(p) : '<li class="vacio">Todavía está vacía. Buscá ejercicios abajo y tocá para sumarlos en orden.</li>'}</ol>

    <h2 class="secc">Sumar ejercicios</h2>
    <label class="pl-buscar"><span class="sr">Buscar ejercicio</span><input type="search" id="plQ" placeholder="Buscar (Roll Up, bridge, swan…)" value="${esc(filtroPlan.q)}"></label>
    <div class="cl-filtros">
      <div class="chips" id="plPos"><button type="button" data-p="" class="${filtroPlan.pos ? '' : 'on'}">Todas</button>${Object.entries(POS_CLASE).map(([k, x]) =>
        `<button type="button" data-p="${k}" class="${filtroPlan.pos === k ? 'on' : ''}">${x.ico} ${x.nom}</button>`).join('')}</div>
      <div class="chips" id="plF">${[['', 'Todo'], ['pre', 'Pre-Pilates'], ['mat1', 'Mat 1'], ['mat2', 'Mat 2']].map(([k, t]) =>
        `<button type="button" data-f="${k}" class="${filtroPlan.f === k ? 'on' : ''}">${t}</button>`).join('')}</div>
    </div>
    <div class="cl-pool" id="plPool"></div>`;
  pintarPoolPlan(p);
  $('#plVolver').onclick = () => { planAbierto = null; vPlanes(); };
  const campo = (sel, k, fn = v => v) => { $(sel).onchange = e => { p[k] = fn(e.target.value); tocar(p); if (k === 'dur') $('#plResumen').innerHTML = resumenPlanHTML(p); }; };
  campo('#plNombre', 'nombre', v => v.trim() || 'Sesión sin nombre');
  campo('#plFecha', 'fecha'); campo('#plPara', 'para', v => v.trim());
  campo('#plDur', 'dur', v => Math.max(0, Math.round(+v)) || null);
  $('#plNotas').oninput = e => { p.notas = e.target.value; tocar(p); };
  $$('[data-foco]').forEach(b => b.onclick = () => {
    const f = b.dataset.foco, on = !p.focos.includes(f);
    p.focos = on ? [...p.focos, f] : p.focos.filter(x => x !== f);
    b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); tocar(p); SND.toque();
  });
  $('#plRevisar').onclick = () => revisarPlan(p);
  $('#plCopiar').onclick = () => copiarPlan(p);
  $('#plDup').onclick = () => { const c = nuevoPlan({ ...JSON.parse(JSON.stringify(p)), nombre: p.nombre + ' (copia)' }); planAbierto = c.id; vPlan(c.id); toast('Duplicada: estás editando la copia.', 'toast-suave'); };
  $('#plBorrar').onclick = async () => {
    if (!(await confirmar(`¿Borrar la sesión "${p.nombre}"?`, 'Borrar'))) return;
    S.planes = planes().filter(x => x.id !== p.id); planAbierto = null; guardar(); vPlanes();
  };
  $('#plQ').oninput = e => { filtroPlan.q = e.target.value; pintarPoolPlan(p); };
  $$('#plPos button').forEach(b => b.onclick = () => { filtroPlan.pos = b.dataset.p; $$('#plPos button').forEach(x => x.classList.toggle('on', x === b)); pintarPoolPlan(p); });
  $$('#plF button').forEach(b => b.onclick = () => { filtroPlan.f = b.dataset.f; $$('#plF button').forEach(x => x.classList.toggle('on', x === b)); pintarPoolPlan(p); });
  conectarFilasPlan(p);
}

function resumenPlanHTML(p) {
  const min = duracionPlan(p), meta = p.dur || 0;
  const estado = !meta || !p.items.length ? '' : min > meta + 8 ? 'larga' : min < meta - 12 ? 'corta' : 'justa';
  return `<span><b>≈ ${min} min</b> estimados${meta ? ` de ${meta} buscados` : ''}</span>
    ${estado === 'larga' ? '<span class="pl-aviso">Se pasa: sacá ejercicios o bajá repeticiones.</span>' : estado === 'corta' ? '<span class="pl-aviso">Te sobra tiempo: podés sumar ejercicios.</span>' : estado === 'justa' ? '<span class="pl-ok">Entra en el tiempo.</span>' : ''}`;
}

function filasPlan(p) {
  return p.items.map((x, i) => {
    const e = ejPlan(x.id); if (!e) return '';
    const pz = POS_CLASE[e.pos], r = rangoReps(e.reps), prev = i ? ejPlan(p.items[i - 1].id) : null;
    const trans = prev && prev.pos !== e.pos ? transicionHTML(prev, e) : '';
    const F = typeof fotosDe === 'function' ? fotosDe(e.id) : null, kFoto = F && x.prop ? F.fotos.findIndex(f => norm(f.prop) === norm(x.prop)) : -1;
    return `${trans}<li class="cl-fila pl-fila" data-i="${i}">
      <span class="cl-n">${i + 1}</span>
      <span class="cl-mini">${miniPlan(e)}</span>
      <div class="cl-info"><b>${esc(e.n)}</b>
        <small><span class="cl-pos p-${e.pos}">${pz.ico} ${pz.nom}</span> ${fuenteNom(e.f)}${e.reps ? ` · ${esc(e.reps)}` : ''}</small>
        <div class="pl-extra">
          <label class="pl-prop"><span class="sr">Prop</span><select data-k="prop"><option value="">Sin prop</option>${PROPS_PLAN.map(o => `<option ${x.prop === o ? 'selected' : ''}>${o}</option>`).join('')}</select></label>
          ${kFoto >= 0 ? `<button type="button" class="pl-foto" data-foto="${kFoto}" aria-label="Ver la foto de ${esc(e.n)} con ${esc(x.prop)}">📷</button>` : ''}
          <label class="pl-nota"><span class="sr">Nota</span><input data-k="nota" value="${esc(x.nota || '')}" placeholder="nota (variante, cue…)" maxlength="140"></label>
        </div></div>
      <label class="cl-reps"><input type="number" data-k="reps" inputmode="numeric" min="1" max="100" step="1" value="${x.reps || ''}" placeholder="${r ? r[0] + (r[1] > r[0] ? '–' + r[1] : '') : '#'}" aria-label="Repeticiones de ${esc(e.n)}"><small>${unidadReps(e.reps)}</small></label>
      <div class="cl-mover">
        <button type="button" data-a="sube" aria-label="Subir" ${i ? '' : 'disabled'}>↑</button>
        <button type="button" data-a="baja" aria-label="Bajar" ${i < p.items.length - 1 ? '' : 'disabled'}>↓</button>
        <button type="button" data-a="quita" aria-label="Quitar">✕</button>
      </div>
    </li>`;
  }).join('');
}

function conectarFilasPlan(p) {
  $$('.pl-fila').forEach(li => {
    const i = +li.dataset.i, x = p.items[i];
    $$('[data-k]', li).forEach(el => el.onchange = () => {
      const k = el.dataset.k;
      x[k] = k === 'reps' ? (Math.round(+el.value) > 0 ? Math.round(+el.value) : null) : el.value;
      tocar(p);
      if (k === 'reps') $('#plResumen').innerHTML = resumenPlanHTML(p);
      if (k === 'prop') { const y = window.scrollY; vPlan(p.id); window.scrollTo(0, y); }
    });
    const bf = $('.pl-foto', li);
    if (bf) bf.onclick = () => verFoto(fotosDe(x.id), +bf.dataset.foto);
    $$('[data-a]', li).forEach(b => b.onclick = () => {
      const a = b.dataset.a;
      if (a === 'quita') p.items.splice(i, 1);
      else { const j = a === 'sube' ? i - 1 : i + 1; [p.items[i], p.items[j]] = [p.items[j], p.items[i]]; }
      SND.toque(); tocar(p);
      const y = window.scrollY; vPlan(p.id); window.scrollTo(0, y);
    });
  });
}

function pintarPoolPlan(p) {
  const q = norm(filtroPlan.q || ''), usados = new Set(p.items.map(x => x.id));
  const lista = catalogoPlan().filter(e => (!filtroPlan.pos || e.pos === filtroPlan.pos) && (!filtroPlan.f || e.f === filtroPlan.f) && (!q || norm(e.n).includes(q)));
  const mostrar = lista.slice(0, 60);
  $('#plPool').innerHTML = mostrar.length ? mostrar.map(e => `<button type="button" class="cl-ej ${usados.has(e.id) ? 'usado' : ''}" data-id="${e.id}">
      <span class="cl-mini">${miniPlan(e)}</span><span class="cl-pos p-${e.pos}">${POS_CLASE[e.pos].ico}</span><b>${esc(e.n)}</b><small>${fuenteNom(e.f)}${usados.has(e.id) ? ' · ya está' : ''}</small></button>`).join('')
      + (lista.length > mostrar.length ? `<p class="micro">Hay ${lista.length - mostrar.length} más: buscá por nombre o filtrá por posición.</p>` : '')
    : '<p class="vacio">No hay ejercicios con ese filtro.</p>';
  $$('#plPool .cl-ej').forEach(b => b.onclick = () => {
    p.items.push({ id: b.dataset.id, reps: null, prop: '', nota: '' });
    tocar(p); SND.soltar();
    const y = window.scrollY; vPlan(p.id); window.scrollTo(0, y);
    toast(`Sumado: <b>${esc(ejPlan(b.dataset.id).n)}</b> (n.º ${p.items.length})`, 'toast-suave');
  });
}

/* ---------------- revisión (los criterios de "Armá tu clase", sin la cantidad del examen) ---------------- */
function analizarPlan(p) {
  const es = p.items.map(x => ({ ...ejPlan(x.id), rep: x.reps })).filter(e => e.id);
  const out = [], add = (estado, t, d) => out.push({ estado, t, d });
  const sinReps = es.filter(e => !(e.rep > 0));
  add(sinReps.length ? 'aviso' : 'ok', 'Repeticiones',
    sinReps.length ? `Falta el número en: ${sinReps.map(e => e.n).join(', ')}.` : 'Cada ejercicio tiene su número.');
  const fuera = es.filter(e => e.rep > 0 && rangoReps(e.reps) && (e.rep < rangoReps(e.reps)[0] || e.rep > rangoReps(e.reps)[1]));
  if (fuera.length) add('aviso', 'Fuera de lo que indica el material', fuera.map(e => `${e.n}: ${e.rep} (${e.reps})`).join(' · '));
  const regresos = []; let fueAtras = null;
  es.forEach((e, i) => { if (POS_CLASE[e.pos].grupo >= 3 && !fueAtras) fueAtras = e; if (fueAtras && (e.pos === 'supino' || e.pos === 'inversion')) regresos.push(`${i + 1}. ${e.n}`); });
  add(regresos.length ? 'mal' : 'ok', 'Orden de posiciones',
    regresos.length ? `Después de ${fueAtras.n} volvés a supino con: ${regresos.join(', ')}. El manual ordena de pie → cuatro apoyos → supino → sentado → prono → plancha → de costado.` : 'Sigue el orden del manual.');
  const cambios = es.slice(1).filter((e, i) => e.pos !== es[i].pos).length;
  add(cambios > Math.max(6, Math.round(es.length / 2.5)) ? 'aviso' : 'ok', `Transiciones: ${cambios} cambios de posición`,
    cambios > Math.max(6, Math.round(es.length / 2.5)) ? 'Agrupá los ejercicios de la misma posición para que fluya.' : 'Mirá cada "↳" de la lista: así pasa el cuerpo de uno al otro.');
  const primero = es[0];
  add(primero && (primero.f === 'pre' || /hundred|breath/i.test(primero.n)) ? 'ok' : 'aviso', 'Calentamiento',
    primero && (primero.f === 'pre' || /hundred|breath/i.test(primero.n)) ? `Arranca con ${primero.n}.` : 'Conviene arrancar con un Pre-Pilates de activación o respiración, o con el Hundred.');
  const faltan = ELEMENTOS_CLASE.filter(el => !es.some(e => el.re.test(norm(e.n))));
  add(faltan.length > 1 ? 'aviso' : 'ok', 'Balance', faltan.length ? `Falta: ${faltan.map(f => f.nom.toLowerCase()).join(', ')}.` : 'Tiene flexión, movilidad, extensión, rotación o lateral, tren superior y tren inferior.');
  if (p.focos.some(f => /osteoporosis/i.test(f))) {
    const ojo = es.filter(e => /evitar/i.test(e.osteo || ''));
    add(ojo.length ? 'mal' : 'ok', 'Osteoporosis', ojo.length ? `El manual indica evitar: ${ojo.map(e => e.n).join(', ')} (flexión de columna con carga).` : 'Ningún ejercicio marcado para evitar en osteoporosis.');
  }
  const min = duracionPlan(p);
  if (p.dur) add(min > p.dur + 8 ? 'aviso' : 'ok', `Duración: ≈ ${min} de ${p.dur} min`, min > p.dur + 8 ? 'Se pasa del tiempo buscado.' : min < p.dur - 12 ? 'Sobra tiempo: podés sumar ejercicios o repeticiones.' : 'Entra en el tiempo.');
  return out;
}
function revisarPlan(p) {
  const out = analizarPlan(p), nMal = out.filter(x => x.estado === 'mal').length, nAv = out.filter(x => x.estado === 'aviso').length;
  $('#plRes').innerHTML = `<div class="cl-res ${nMal ? '' : 'ok'}">
    <h3>${nMal ? (nMal === 1 ? 'Hay un punto para corregir' : `Hay ${nMal} puntos para corregir`) : nAv ? 'Bien armada, con algunos detalles' : '¡Sesión bien armada!'}</h3>
    <ul class="cl-check">${out.map(x => `<li class="${x.estado}"><span>${x.estado === 'ok' ? '✓' : x.estado === 'aviso' ? '!' : '✕'}</span><div><b>${esc(x.t)}</b><p>${esc(x.d)}</p></div></li>`).join('')}</ul>
  </div>`;
  nMal ? SND.mal() : SND.fin();
  $('#plRes').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ---------------- copiar como texto (para mandar o imprimir) ---------------- */
function textoPlan(p) {
  const l = [p.nombre + (p.fecha ? ' — ' + fechaLinda(p.fecha) : '') + (p.para ? ' · ' + p.para : '')];
  if (p.focos.length) l.push('Foco: ' + p.focos.join(', '));
  if (p.notas.trim()) l.push('Notas: ' + p.notas.trim());
  l.push('');
  let prev = null;
  p.items.forEach((x, i) => {
    const e = ejPlan(x.id); if (!e) return;
    if (prev && prev.pos !== e.pos) l.push(`   ↳ ${POS_CLASE[prev.pos].nom} → ${POS_CLASE[e.pos].nom}: ${TRANSICIONES[prev.pos + '>' + e.pos] || 'transición'}`);
    l.push(`${i + 1}. ${e.n} — ${x.reps ? x.reps + ' ' + unidadReps(e.reps) : (e.reps || '')} (${POS_CLASE[e.pos].nom})${x.prop ? ' · ' + x.prop : ''}${x.nota ? ' · ' + x.nota : ''}`);
    prev = e;
  });
  l.push('', `Duración estimada: ≈ ${duracionPlan(p)} min`);
  return l.join('\n');
}
async function copiarPlan(p) {
  const t = textoPlan(p);
  try { await navigator.clipboard.writeText(t); toast('Copiada: pegala donde quieras (WhatsApp, notas…).', 'toast-suave'); SND.toque(); return; }
  catch (e) { /* sin permiso para el portapapeles: se muestra para copiar a mano */ }
  const m = abrirModal(`<div class="pl-texto"><h3>Copiá la sesión</h3><textarea readonly rows="14">${esc(t)}</textarea>
    <div class="fila"><button type="button" class="btn" data-cerrar>Listo</button></div></div>`);
  const ta = $('textarea', m); ta.focus(); ta.select();
  $('[data-cerrar]', m).onclick = cerrarModal;
}
