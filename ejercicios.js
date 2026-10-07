/* ============================================================
   Pilates Lab — Ejercicios (pestaña 🤸)

   Para mirar cada ejercicio: la animación de los de Mat 1 y Mat 2
   con sus pasos (inhala / exhala), la forma óptima, las indicaciones,
   los propósitos y las precauciones; y las fotos y datos de los de
   Pre-Pilates. Se filtra como en Sesiones: por posición (de pie,
   cuatro apoyos, supino, inversión, sentado, prono, plancha, de
   costado), por libro y buscando por nombre o por lo que trabaja.
   Tocar un ejercicio abre su ficha; ‹ › pasan al anterior o al
   siguiente de la lista filtrada (también con las flechas del teclado).
   Usa el catálogo de planes.js y POS_CLASE de clase.js.
   ============================================================ */
'use strict';

const LIBROS_EJ = [['bb', 'Mat 1 y 2'], ['mat1', 'Mat 1'], ['mat2', 'Mat 2'], ['pre', 'Pre-Pilates'], ['', 'Todos']];
let filtroEj = { pos: '', f: 'bb', q: '' }, listaEj = [];

/* primero los del manual (en el orden del libro) y después Pre-Pilates */
let CATALOGO_EJ = null;
const catalogoEj = () => CATALOGO_EJ || (CATALOGO_EJ = [...catalogoPlan().filter(e => !e.pm), ...catalogoPlan().filter(e => e.pm)]);
const deLibroEj = (e, f) => !f || (f === 'bb' ? !e.pm : e.f === f);
/* se busca en el nombre y en lo que trabaja (propósitos, indicaciones, objetivo, músculos) */
const _textoEj = new Map();
function textoEj(e) {
  if (!_textoEj.has(e.id)) {
    const x = e.pm ? PM[e.id] : EJ_BB[e.id];
    _textoEj.set(e.id, norm((e.pm ? [x.obj, x.musculos, x.principio, x.comp, x.orig] : [x.optima, ...x.prop, ...x.indic]).filter(Boolean).join(' ')));
  }
  return _textoEj.get(e.id);
}
const nombreEj = e => norm(e.n + ' ' + ((e.pm && PM[e.id].orig) || ''));
const ORDEN_POS = Object.keys(POS_CLASE);

function filtrarEj(f = filtroEj.f, pos = filtroEj.pos) {
  const q = norm(filtroEj.q.trim());
  const xs = catalogoEj().filter(e => deLibroEj(e, f) && (!pos || e.pos === pos) && (q.length < 2 || nombreEj(e).includes(q) || textoEj(e).includes(q)));
  /* agrupados en el orden de la clase; con búsqueda, primero los que la tienen en el nombre */
  return xs.map((e, i) => ({ e, i, k: ORDEN_POS.indexOf(e.pos), nom: q.length < 2 || nombreEj(e).includes(q) ? 0 : 1 }))
    .sort((a, b) => a.k - b.k || a.nom - b.nom || a.i - b.i).map(x => x.e);
}

function detalleEj(e) {
  if (e.pm) return 'Pre-Pilates · 📷';
  const x = EJ_BB[e.id];
  return `${fuenteNom(e.f)}${nivelBase(x.nivel) ? ' · ' + nivelBase(x.nivel) : ''}`;
}
const tarjetaEj = e => `<button type="button" class="cl-ej ej-t${e.pm ? ' ej-foto' : ''}" data-id="${e.id}">
    <span class="cl-mini" data-mini-ej></span><b>${esc(e.n)}</b><small>${detalleEj(e)}</small></button>`;

function vEjercicios() {
  app().innerHTML = `
    <h1 class="tit">Ejercicios</h1>
    <p class="sub">Animación e instrucciones de Mat 1 y Mat 2, y fotos de Pre-Pilates. Filtrá por posición o libro, o buscá por nombre o por lo que trabaja.</p>
    <label class="pl-buscar"><span class="sr">Buscar ejercicio</span><input type="search" id="ejQ" placeholder="Buscar (Roll Up, swan, glúteos…)" value="${esc(filtroEj.q)}" autocomplete="off"></label>
    <div class="cl-filtros">
      <div class="chips ej-chips" id="ejPos" role="group" aria-label="Posición"></div>
      <div class="chips ej-chips" id="ejF" role="group" aria-label="Libro">${LIBROS_EJ.map(([k, t]) =>
        `<button type="button" data-f="${k}" class="${filtroEj.f === k ? 'on' : ''}" aria-pressed="${filtroEj.f === k}">${t}</button>`).join('')}</div>
    </div>
    <p class="micro ej-cuenta" id="ejCuenta" aria-live="polite"></p>
    <div id="ejLista"></div>`;
  let t = 0;
  $('#ejQ').oninput = ev => { clearTimeout(t); t = setTimeout(() => { filtroEj.q = ev.target.value; pintarEjercicios(); }, 140); };
  $$('#ejF button').forEach(b => b.onclick = () => {
    filtroEj.f = b.dataset.f; SND.toque();
    $$('#ejF button').forEach(x => { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', x === b); });
    pintarEjercicios();
  });
  pintarEjercicios();
}

function pintarEjercicios() {
  const todas = filtrarEj(filtroEj.f, '');
  const cuenta = k => todas.filter(e => e.pos === k).length;
  $('#ejPos').innerHTML = `<button type="button" data-p="" class="${filtroEj.pos ? '' : 'on'}" aria-pressed="${!filtroEj.pos}">Todas <small>${todas.length}</small></button>`
    + ORDEN_POS.map(k => { const n = cuenta(k), on = filtroEj.pos === k;
      /* sin ejercicios en ese libro: el chip no aparece (salvo que sea el elegido) */
      return !n && !on ? '' : `<button type="button" data-p="${k}" class="${on ? 'on' : ''}${n ? '' : ' cero'}" aria-pressed="${on}">${POS_CLASE[k].ico} ${POS_CLASE[k].nom} <small>${n}</small></button>`; }).join('');
  $$('#ejPos button').forEach(b => b.onclick = () => { filtroEj.pos = b.dataset.p; SND.toque(); pintarEjercicios(); });
  /* en el celular cada fila de chips es una sola línea que se desliza: la elegida queda a la vista */
  $$('.ej-chips .on').forEach(b => { const f = b.parentElement; if (f.scrollWidth > f.clientWidth) f.scrollLeft = b.offsetLeft - f.offsetLeft - 24; });

  const lista = filtroEj.pos ? todas.filter(e => e.pos === filtroEj.pos) : todas;
  listaEj = lista.map(e => e.id);
  const libro = (LIBROS_EJ.find(([k]) => k === filtroEj.f) || [, ''])[1];
  const verQue = lista.every(e => e.pm) ? 'la foto y los datos' : lista.some(e => e.pm) ? 'la animación (o la foto) y las instrucciones' : 'la animación y las instrucciones';
  $('#ejCuenta').textContent = lista.length ? `${lista.length} ejercicio${lista.length === 1 ? '' : 's'}. Tocá uno para ver ${verQue}.` : '';
  const cont = $('#ejLista');
  if (!lista.length) {
    /* ¿hay en otro libro? */
    const otros = filtroEj.f ? filtrarEj('', filtroEj.pos) : [];
    const donde = filtroEj.pos ? ` ${POS_CLASE[filtroEj.pos].nom.toLowerCase()}` : '';
    cont.innerHTML = `<div class="vacio ej-vacio"><p>${filtroEj.q.trim().length > 1 ? `Nada con «${esc(filtroEj.q.trim())}»${donde ? ' en' + donde : ''} en ${esc(libro)}.` : `En ${esc(libro)} no hay ejercicios${donde ? ' en posición' + donde : ''}.`}</p>
      ${otros.length ? `<button type="button" class="btn small" id="ejTodos">Ver en todos los libros (${otros.length})</button>` : ''}</div>`;
    const b = $('#ejTodos');
    if (b) b.onclick = () => { filtroEj.f = ''; vEjercicios(); };
    return;
  }
  cont.innerHTML = ORDEN_POS.map(k => {
    const xs = lista.filter(e => e.pos === k);
    return xs.length ? `<section class="ej-grupo" aria-label="${POS_CLASE[k].nom}"><h3 class="grupo-t">${POS_CLASE[k].ico} ${POS_CLASE[k].nom} <i>${xs.length}</i></h3>
      <div class="cl-pool ej-pool">${xs.map(tarjetaEj).join('')}</div></section>` : '';
  }).join('');
  $$('.ej-t', cont).forEach(b => b.onclick = () => abrirFichaEj(b.dataset.id, listaEj));
  minisEj(cont);
}

/* las miniaturas se dibujan al acercarse a la pantalla (99 fotos y 48 figuras) */
let ioEj = null;
function minisEj(raiz) {
  if (ioEj) ioEj.disconnect();
  const llenar = sp => { const e = ejPlan(sp.closest('[data-id]').dataset.id); sp.innerHTML = e ? miniPlan(e) : ''; sp.removeAttribute('data-mini-ej'); };
  const sps = $$('[data-mini-ej]', raiz);
  if (!('IntersectionObserver' in window)) { sps.forEach(llenar); return; }
  ioEj = new IntersectionObserver(es => es.forEach(x => { if (x.isIntersecting) { ioEj.unobserve(x.target); llenar(x.target); } }), { rootMargin: '400px 0px' });
  sps.forEach(sp => ioEj.observe(sp));
}

/* ---------------- la ficha: animación + instrucciones ---------------- */
function metaEj(c) {
  const pz = POS_CLASE[c.pos];
  if (c.pm) {
    const x = PM[c.id];
    return [['libro lb-pre', 'Pre-Pilates'], ['', `${pz.ico} ${esc(x.pos)}`], ['', esc(x.principio)], x.reps ? ['', esc(x.reps)] : null];
  }
  const x = EJ_BB[c.id];
  return [[`libro lb-${x.f}`, esc(NOM_FUENTE[x.f])], ['', `${pz.ico} ${esc(BB.nomPos[x.pos] || pz.nom)}`], x.nivel ? ['', esc(x.nivel)] : null,
    x.reps ? ['', `${esc(x.reps)}`] : null,
    x.osteo ? [`osteo-${x.osteo}`, `${x.osteo === 'evitar' ? '🦴✕ Evitar' : x.osteo === 'apto' ? '🦴✓ Apto' : '🦴~ Modificar'} con osteoporosis`] : null];
}
function abrirFichaEj(id, lista = null, foco = null) {
  const c = ejPlan(id);
  if (!c) return;
  const i = lista ? lista.indexOf(id) : -1, n = i >= 0 ? lista.length : 0;
  const ant = n && i > 0 ? ejPlan(lista[i - 1]) : null, sig = n && i < n - 1 ? ejPlan(lista[i + 1]) : null;
  const e = c.pm ? PM[id] : EJ_BB[id];
  const flechas = n > 1 ? `<span class="ef-flechas">
      <button type="button" class="btn small ghost" data-ir="-1" ${ant ? `aria-label="Anterior: ${esc(ant.n)}"` : 'disabled aria-label="Anterior"'}>‹</button>
      <span class="ef-n">${i + 1} / ${n}</span>
      <button type="button" class="btn small ghost" data-ir="1" ${sig ? `aria-label="Siguiente: ${esc(sig.n)}"` : 'disabled aria-label="Siguiente"'}>›</button></span>` : '';
  const pie = n > 1 ? `<nav class="ef-nav" aria-label="Otros ejercicios">
      ${ant ? `<button type="button" class="btn ghost" data-ir="-1"><small>◀ Anterior</small>${esc(ant.n)}</button>` : '<span></span>'}
      ${sig ? `<button type="button" class="btn ghost ef-sig" data-ir="1"><small>Siguiente ▶</small>${esc(sig.n)}</button>` : '<span></span>'}</nav>` : '';
  const meta = `<p class="ef-meta">${metaEj(c).filter(Boolean).map(([cl, t]) => `<span class="ef-et ${cl}">${t}</span>`).join('')}</p>`;
  const cuerpo = c.pm
    ? `${!imagen(id) && POS_PREMAT[e.pos] ? `<div class="ef-pos-fig">${FIGURA.svgEstatico(POSES[POS_PREMAT[e.pos]], 0)}<small>La posición (${esc(e.pos)}); este ejercicio no tiene foto.</small></div>` : ''}
      <div class="pm-body ef-pm">${cuerpoPremHTML(e)}</div>`
    : `${POSES[id] ? visorHTML(e, true) : ''}
      <h4 class="ef-h">Paso a paso</h4>
      <ol class="rep-pasos">
        <li data-paso="0"><b>Posición inicial</b> ${esc(e.inicial)}</li>
        ${e.seq.map((x, k) => `<li data-paso="${k + 1}"><b>${esc(x.fase)}</b> ${esc(x.accion)}</li>`).join('')}
      </ol>
      <p class="micro">Tocá un paso para ver esa pose. ◀ ▶ van de a un paso, la barra recorre el movimiento y ¼× es cámara lenta.</p>
      <div class="ef-datos">${datosRepHTML(e)}</div>`;
  const m = abrirModal(`<div class="ef-ficha" data-sujeto="e:${c.pm ? 'pm' : 'bb'}=${id}">
    <div class="vm-cab"><h3>${esc(c.n)}</h3><span class="ef-acc">${flechas}<button type="button" class="btn small ghost" data-cerrar aria-label="Cerrar">✕</button></span></div>
    ${meta}${cuerpo}${pie}</div>`);
  m.classList.add('modal-visor', 'modal-ficha-ej');
  if (foco) m.style.animation = 'none';
  const rep = !c.pm && POSES[id] ? activarVisor($('.visor', m), e, $$('.rep-pasos li', m)) : null;
  llenarMinis(m);
  const cerrar = () => { if (rep) rep.destruir(); cerrarModal(); };
  $('[data-cerrar]', m).onclick = cerrar;
  $$('[data-ir]', m).forEach(b => b.onclick = () => {
    const d = +b.dataset.ir, otro = lista[i + d];
    if (!otro) return;
    if (rep) rep.destruir();
    SND.toque();
    abrirFichaEj(otro, lista, { pie: !!b.closest('.ef-nav'), d });
  });
  /* el foco queda en el mismo botón que se tocó (teclado) */
  if (foco) {
    const zona = foco.pie ? '.ef-nav' : '.ef-flechas';
    const b = $(`${zona} [data-ir="${foco.d}"]:not([disabled])`, m) || $(`${zona} [data-ir]:not([disabled])`, m);
    if (b) b.focus({ preventScroll: true });
  }
}
/* ← → pasan de ejercicio y Escape cierra (si no hay una ventana de término encima) */
document.addEventListener('keydown', ev => {
  const m = $('.modal-ficha-ej');
  if (!m || ev.defaultPrevented || ev.ctrlKey || ev.metaKey || ev.altKey || $('.pop-term')) return;
  if (ev.target.matches && ev.target.matches('input, textarea, select')) return;
  if (ev.key === 'Escape') { ev.preventDefault(); cerrarModal(); return; }
  if (ev.key !== 'ArrowLeft' && ev.key !== 'ArrowRight') return;
  const b = $(`.ef-flechas [data-ir="${ev.key === 'ArrowLeft' ? -1 : 1}"]`, m);
  if (b && !b.disabled) { ev.preventDefault(); b.click(); }
});
