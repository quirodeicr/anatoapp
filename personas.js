/* ============================================================
   Pilates Lab — Personas (perfil de cada persona que entrena)

   En "Mis sesiones": cada persona tiene su nivel, sus cuidados (con
   el lado: rodilla derecha…), los props que tiene, lo que le gusta o
   sus objetivos, cuánto duran sus clases, un principio con más peso
   y notas. Desde su perfil se genera una clase con todo eso cargado;
   la sesión queda a su nombre ("Para") y el generador varía respecto
   de sus últimas dos clases. Se guarda en S.personas (solo en este
   navegador, como el resto del progreso).
   ============================================================ */
'use strict';

function personas() { if (!Array.isArray(S.personas)) S.personas = []; return S.personas; }
const personaDe = id => personas().find(x => x.id === id);
let personaAbierta = null;
function nuevaPersona() {
  const x = { id: 'h' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), nombre: '', nivel: 'principiante', dur: 60,
    cuidados: [], ladoCuidado: {}, props: [], sinProps: true, enfasis: '', gusta: '', notas: '', creado: HOY() };
  personas().unshift(x); guardar();
  return x;
}
/* las sesiones de una persona (las generadas para ella o con su nombre en "Para"), la más nueva primero */
const sesionesDe = h => planes().filter(p => p.persona === h.id || (!p.persona && h.nombre && norm(p.para || '') === norm(h.nombre)))
  .sort((a, b) => (b.fecha || '').localeCompare(a.fecha || '') || b.editado - a.editado);
/* lo que hizo en sus últimas dos clases: el generador lo deja para otro día si puede */
const recientesDe = h => [...new Set(sesionesDe(h).slice(0, 2).flatMap(p => p.items.map(x => x.id)))];
const resumenPersona = h => [nomNivelGen(h.nivel), h.cuidados.length ? h.cuidados.map(c => nomCuidadoGen(c, h)).join(', ') : 'sin cuidados',
  h.sinProps || !h.props.length ? 'sin props' : h.props.join(', ')].join(' · ');

/* el generador con lo de la persona cargado */
function generarParaPersona(h) {
  const cfg = cfgGen();
  Object.assign(cfg, { persona: h.id, nivel: h.nivel, dur: h.dur || cfg.dur, cuidados: [...h.cuidados], ladoCuidado: { ...(h.ladoCuidado || {}) },
    props: [...h.props], sinProps: h.sinProps || !h.props.length, enfasis: h.enfasis || '' });
  guardar();
  personaAbierta = null;
  abrirGenerador();
}

/* tarjetas en la lista de sesiones */
function personasHTML() {
  const xs = personas();
  return `<h2 class="secc">Personas${xs.length ? ' · ' + xs.length : ''}</h2>
    <div class="pe-lista">${xs.map(h => { const n = sesionesDe(h).length;
      return `<button type="button" class="pe-tarjeta" data-pe="${h.id}"><b>👤 ${esc(h.nombre || 'Sin nombre')}</b><small>${esc(resumenPersona(h))}</small><span>${n ? `${n} ${n === 1 ? 'sesión' : 'sesiones'}` : 'Sin sesiones todavía'}</span></button>`; }).join('')}
      <button type="button" class="pe-tarjeta pe-nueva" id="peNueva"><b>＋ Persona</b><small>Su nivel, sus cuidados y sus props, para generarle clases.</small></button></div>`;
}
function conectarPersonas() {
  $$('[data-pe]').forEach(b => b.onclick = () => { personaAbierta = b.dataset.pe; SND.toque(); vPersona(personaAbierta); });
  const nb = $('#peNueva');
  if (nb) nb.onclick = () => { const h = nuevaPersona(); personaAbierta = h.id; SND.toque(); vPersona(h.id); setTimeout(() => { const i = $('#peNombre'); if (i) i.focus(); }, 50); };
}

function vPersona(id) {
  const h = personaDe(id);
  if (!h) { personaAbierta = null; return vPlanes(); }
  const chip = (g, v, t, on) => `<button type="button" data-g="${g}" data-v="${esc(v)}" class="${on ? 'on' : ''}" aria-pressed="${on}">${t}</button>`;
  const ses = sesionesDe(h);
  app().innerHTML = `
    <button type="button" class="volver" id="peVolver">← Mis sesiones</button>
    <label class="pl-nombre"><span class="sr">Nombre</span><input id="peNombre" value="${esc(h.nombre)}" placeholder="Nombre o apodo" maxlength="60"></label>
    <p class="micro">Queda guardado solo en este navegador, como tu progreso.</p>
    <section class="gen-sec"><h2>Nivel</h2><div class="chips" role="group" aria-label="Nivel">${NIVELES_GEN.map(([k, t]) => chip('nivel', k, t, h.nivel === k)).join('')}</div></section>
    <section class="gen-sec"><h2>Duración de sus clases</h2><div class="chips" role="group" aria-label="Duración">${[30, 45, 60, 75].map(m => chip('dur', m, m + ' min', (h.dur || 60) === m)).join('')}</div></section>
    <section class="gen-sec"><h2>Cuidados</h2><div class="chips" role="group" aria-label="Cuidados">${CUIDADOS_GEN.map(([k, t]) => chip('cuidado', k, t, h.cuidados.includes(k))).join('')}</div>
      ${ZONAS_LADO.filter(z => h.cuidados.includes(z)).map(z => `<div class="chips gen-lado" role="group" aria-label="${ZONA_NOM[z]}: qué lado"><span>${ZONA_NOM[z]}:</span>${[['', 'Las dos'], ['der', 'Derecha'], ['izq', 'Izquierda']].map(([k, t]) => chip('ladoCuidado', z + ':' + k, t, ((h.ladoCuidado || {})[z] || '') === k)).join('')}</div>`).join('')}</section>
    <section class="gen-sec"><h2>Props que tiene</h2><div class="chips" role="group" aria-label="Props">${chip('sinprops', '1', 'Sin props', h.sinProps || !h.props.length)}${PROPS_PLAN.map(t => chip('prop', t, t, !h.sinProps && h.props.includes(t))).join('')}</div></section>
    <section class="gen-sec"><h2>Darle más peso a un principio <small>(opcional)</small></h2><div class="chips" role="group" aria-label="Énfasis">${chip('enfasis', '', 'Equilibrada', !h.enfasis)}${PRINCIPIOS.map(p => chip('enfasis', p.k, `${p.ico} ${p.corto}`, h.enfasis === p.k)).join('')}</div></section>
    <label class="pl-notas">Le gusta, objetivos<textarea id="peGusta" rows="2" placeholder="Viene del gimnasio, quiere ganar movilidad…">${esc(h.gusta || '')}</textarea></label>
    <label class="pl-notas">Notas<textarea id="peNotas" rows="2" placeholder="Lo que conviene recordar en cada clase">${esc(h.notas || '')}</textarea></label>
    <div class="fila pl-acc"><button type="button" class="btn3d verde" id="peGenerar">✨ Generar una clase</button><button type="button" class="btn ghost" id="peHistoria">🗂 Historia clínica</button><button type="button" class="btn ghost" id="peBorrar">Borrar persona</button></div>
    <h2 class="secc">Sus sesiones${ses.length ? ' · ' + ses.length : ''}</h2>
    ${ses.length ? `<div class="pl-lista">${ses.map(p => `<article class="pl-tarjeta" data-id="${p.id}"><button type="button" class="pl-abrir" data-ses="${p.id}"><b>${esc(p.nombre)}</b><small>${p.fecha ? fechaLinda(p.fecha) : 'Sin fecha'}</small><span class="pl-datos">${p.items.length} ejercicios · ≈ ${duracionPlan(p)} min</span></button></article>`).join('')}</div>`
      : '<p class="vacio">Todavía no tiene sesiones: tocá <b>✨ Generar una clase</b>.</p>'}`;
  const guardarTxt = () => { h.nombre = $('#peNombre').value.trim(); h.gusta = $('#peGusta').value; h.notas = $('#peNotas').value; guardar(); };
  ['#peNombre', '#peGusta', '#peNotas'].forEach(s => $(s).onchange = guardarTxt);
  $('#peVolver').onclick = () => { guardarTxt(); personaAbierta = null; vPlanes(); };
  $$('[data-g]').forEach(b => b.onclick = () => {
    guardarTxt();
    const g = b.dataset.g, v = b.dataset.v;
    if (g === 'nivel') h.nivel = v;
    else if (g === 'dur') h.dur = +v;
    else if (g === 'cuidado') { h.cuidados = h.cuidados.includes(v) ? h.cuidados.filter(x => x !== v) : [...h.cuidados, v]; if (!h.cuidados.includes(v) && h.ladoCuidado) delete h.ladoCuidado[v]; }
    else if (g === 'ladoCuidado') { const [z, l] = v.split(':'); h.ladoCuidado = { ...(h.ladoCuidado || {}) }; if (l) h.ladoCuidado[z] = l; else delete h.ladoCuidado[z]; }
    else if (g === 'sinprops') { h.sinProps = true; h.props = []; }
    else if (g === 'prop') { h.sinProps = false; h.props = h.props.includes(v) ? h.props.filter(x => x !== v) : [...h.props, v]; if (!h.props.length) h.sinProps = true; }
    else if (g === 'enfasis') h.enfasis = v;
    guardar(); SND.toque();
    const y = window.scrollY; vPersona(id); window.scrollTo(0, y);
  });
  $('#peGenerar').onclick = () => { guardarTxt(); SND.toque(); generarParaPersona(h); };
  $('#peHistoria').onclick = () => { guardarTxt(); historiaDePersona(h); };
  $('#peBorrar').onclick = async () => {
    if (!(await confirmar(`¿Borrar el perfil de ${h.nombre || 'esta persona'}? Sus sesiones quedan.`, 'Borrar'))) return;
    planes().forEach(p => { if (p.persona === h.id) delete p.persona; });
    S.personas = personas().filter(x => x.id !== h.id); personaAbierta = null; guardar(); vPlanes();
  };
  $$('[data-ses]').forEach(b => b.onclick = () => { personaAbierta = null; planAbierto = b.dataset.ses; vPlan(b.dataset.ses); });
}
