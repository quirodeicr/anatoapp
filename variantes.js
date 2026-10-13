/* ============================================================
   Pilates Lab — Más fácil o más difícil en un toque

   En cada ejercicio de una sesión, ⇅ ofrece las regresiones (más
   fácil) y las progresiones (más difícil) que anotaste en tus
   análisis MAT 1 (regresiones de Principios del Movimiento/Pre-Pilates
   y Mat 1, progresiones Mat 1 y Mat 2) y MAT 2 (regresiones
   Pre-Pilates, Mat 1 y Mat 2, progresiones), y el mismo ejercicio con
   un prop que asiste o resiste (fichas y planilla de Mat 3). La relación vale para los dos lados: si A es
   regresión de B, B es progresión de A (así los de Pre-Pilates
   también tienen a dónde progresar). Los grupos ("Serie de 5", "Serie
   lateral", "Teasers", "Todas las planchas", "Puentes", "Todas las
   inversiones") se abren en sus ejercicios. Primero los de la misma
   posición, para no cortar la fluidez; en una clase generada, solo
   lo que sus cuidados permiten.
   ============================================================ */
'use strict';

let VARIANTES = null;
function variantesDe(id) { if (!VARIANTES) VARIANTES = armarVariantes(); return VARIANTES[id] || { reg: [], prog: [] }; }
function armarVariantes() {
  const cat = catalogoPlan(), ids = new Set(cat.map(e => e.id)), V = {};
  const de = id => V[id] || (V[id] = { reg: new Set(), prog: new Set() });
  const GRUPOS = { 'serie de 5': ['mat1-e06', 'mat1-e07', 'mat1-e08', 'mat1-e09', 'mat1-e10'], 'serie lateral': ['mat1-e19', 'mat1-e20', 'mat1-e21', 'mat1-e22', 'mat1-e23'],
    'teasers': ['mat2-e02', 'mat2-e03', 'mat2-e04', 'mat2-e05'] };
  const pmCon = re => cat.filter(e => e.pm && re.test(e.n)).map(e => e.id);
  const resolver = (nombre, libro) => {
    const k = norm(nombre);
    if (!k) return [];
    if (GRUPOS[k]) return GRUPOS[k];
    if (/inversiones/.test(k)) return cat.filter(e => e.pos === 'inversion').map(e => e.id);
    if (/(tablas|planchas) laterales/.test(k)) return pmCon(/tabla lateral|side plank/i);
    if (/^(todas las )?(planchas|tablas)/.test(k)) return pmCon(/tabla|plank/i);
    if (/puentes/.test(k)) return pmCon(/bridge|puente/i);
    const r = EJ_REF(nombre, libro), id = r && (r.bb || r.pm);
    return id && ids.has(id) ? [id] : [];
  };
  /* "Unidad interna: Pelvic clock, Fingertip abdominals · Unidad externa: …" → nombres */
  const nombres = txt => (Array.isArray(txt) ? txt : String(txt || '').split(' · ')).flatMap(g => { const i = g.indexOf(':'); return (i > 0 ? g.slice(i + 1) : g).split(/,\s*/); })
    .map(t => t.replace(/\(.*?\)/g, '').trim()).filter(Boolean);
  const directo = [];
  for (const b of BB.ejercicios) {
    const m1 = b.analisis && typeof MAT1 !== 'undefined' ? MAT1.find(m => m.id === b.analisis) : null;
    const m2s = typeof MAT2 !== 'undefined' ? MAT2.filter(m => m.bb === b.id) : [];
    const reg = [], prog = [];
    if (m1) {
      nombres(m1.regPre).forEach(n => reg.push(...resolver(n, 'pre')));
      nombres(m1.regMat1).forEach(n => reg.push(...resolver(n, 'mat1')));
      nombres(m1.progMat1).forEach(n => prog.push(...resolver(n, 'mat1')));
      nombres(m1.progMat2).forEach(n => prog.push(...resolver(n, 'mat2')));
    }
    for (const m of m2s) {
      const r = m.reg || {};
      nombres(r.pm).forEach(n => reg.push(...resolver(n, 'pre')));
      nombres(r.m1).forEach(n => reg.push(...resolver(n, 'mat1')));
      nombres(r.m2).forEach(n => reg.push(...resolver(n, 'mat2')));
      nombres(m.prog).forEach(n => prog.push(...resolver(n, 'mat2')));
    }
    reg.forEach(x => { if (x !== b.id) { de(b.id).reg.add(x); directo.push([x, 'prog', b.id]); } });
    prog.forEach(x => { if (x !== b.id) { de(b.id).prog.add(x); directo.push([x, 'reg', b.id]); } });
  }
  /* la relación inversa, salvo que la ficha diga lo contrario */
  for (const [x, tipo, y] of directo) { const v = de(x), otro = tipo === 'reg' ? 'prog' : 'reg'; if (!v[otro].has(y)) v[tipo].add(y); }
  return Object.fromEntries(Object.entries(V).map(([k, v]) => [k, { reg: [...v.reg], prog: [...v.prog] }]));
}
const nivVar = id => (typeof infoGen === 'function' && infoGen(id) ? infoGen(id).nivel : 0);
/* las opciones para el ítem i de una sesión: en una clase generada, solo lo que sus cuidados permiten y,
   para progresar, hasta un nivel más; de costado con los lados intercalados, solo otro de costado */
function opcionesVariantes(p, i) {
  const x = p.items[i], e = ejPlan(x.id), v = variantesDe(x.id), cfg = p.gen || null;
  if (!e) return { reg: [], prog: [] };
  const nivSig = cfg ? (NIVELES_GEN[Math.min(3, (NIVEL_IDX[cfg.nivel] ?? 0) + 1)] || NIVELES_GEN[3])[0] : 'super';
  const sirve = c => !cfg || typeof permitidoGen !== 'function' || permitidoGen(c, { ...cfg, nivel: nivSig });
  const usados = new Set(p.items.map(y => y.id));
  const lista = (xs, sube) => xs.map(ejPlan).filter(Boolean).filter(c => !usados.has(c.id) && sirve(c) && (!x.lado || c.pos === e.pos))
    .sort((a, b) => (b.pos === e.pos) - (a.pos === e.pos) || (sube ? nivVar(a.id) - nivVar(b.id) : nivVar(b.id) - nivVar(a.id)) || (a.f === 'pre') - (b.f === 'pre'));
  /* el mismo ejercicio con un prop: los que asisten (más fácil) o resisten (más difícil) según tus fichas
     de Mat 1 y Mat 2, y los de tu planilla de Mat 3; en una clase generada, solo los props que tiene */
  const ps = typeof infoGen === 'function' && infoGen(x.id) ? infoGen(x.id).props : [];
  const props = cfg && cfg.sinProps ? [] : ps.filter(o => o.tipo !== x.prop && (!cfg || !cfg.props.length || cfg.props.includes(o.tipo)))
    .filter((o, k, a) => a.findIndex(q => q.tipo === o.tipo && q.modo === o.modo) === k)
    .sort((a, b) => ['asiste', 'resiste', ''].indexOf(a.modo) - ['asiste', 'resiste', ''].indexOf(b.modo));
  return { reg: lista(v.reg, false), prog: lista(v.prog, true), props };
}
const tieneVariantes = (p, i) => { const o = opcionesVariantes(p, i); return o.reg.length + o.prog.length + o.props.length > 0; };

function abrirVariantes(p, i) {
  const x = p.items[i], e = ejPlan(x.id), cfg = p.gen || null, soloPos = !!x.lado, niv = nivVar;
  /* los de la misma posición a la vista; los demás, aparte */
  const bloque = (cs, tipo, nada) => {
    const misma = cs.filter(c => c.pos === e.pos), otras = cs.filter(c => c.pos !== e.pos);
    if (!cs.length) return `<p class="vacio">${nada}</p>`;
    return (misma.length ? `<div class="var-lista">${misma.map(c => fila(c, tipo)).join('')}</div>` : `<p class="micro">Ninguno en ${POS_CLASE[e.pos].nom.toLowerCase()}.</p>`)
      + (otras.length ? `<details class="var-otras"><summary>En otras posiciones (${otras.length}): cambian la fluidez</summary><div class="var-lista">${otras.map(c => fila(c, tipo)).join('')}</div></details>` : '');
  };
  const fila = (c, tipo) => `<button type="button" class="var-ej" data-id="${c.id}" data-tipo="${tipo}">
      <span class="cl-mini">${miniPlan(c)}</span>
      <span class="var-txt"><b>${esc(c.n)}</b><small>${POS_CLASE[c.pos].ico} ${POS_CLASE[c.pos].nom} · ${fuenteNom(c.f)}${typeof NIVELES_GEN !== 'undefined' ? ' · ' + NIVELES_GEN[Math.min(3, niv(c.id))][1] : ''}${c.pos !== e.pos ? ' · <i>cambia de posición</i>' : ''}</small></span></button>`;
  const { reg: regs, prog: progs, props } = opcionesVariantes(p, i);
  const m = abrirModal(`<div class="var">
    <h3>${esc(e.n)}</h3>
    <p class="micro">Según tu material (Principios del Movimiento y Pre-Pilates, análisis MAT 1 y MAT 2, Mat 3)${cfg ? `; para progresar, hasta ${NIVELES_GEN[Math.min(3, (NIVEL_IDX[cfg.nivel] ?? 0) + 1)][1].toLowerCase()}${cfg.cuidados.length ? ' y lo que sus cuidados permiten' : ''}` : ''}.${soloPos ? ' Va en los dos lados.' : ''}</p>
    <label class="var-motivo"><span>Por qué lo cambiás <small>(opcional: va a la observación de la hoja para entregar)</small></span><input id="varMotivo" maxlength="160" placeholder="Por ejemplo: le molesta la rodilla al flexionar"></label>
    <h4>⬇️ Más fácil (regresión)</h4>
    ${bloque(regs, 'reg', soloPos ? 'Tus fichas no tienen regresiones de costado para este ejercicio.' : 'Tus fichas no tienen regresiones para este ejercicio.')}
    <h4>⬆️ Más difícil (progresión)</h4>
    ${bloque(progs, 'prog', soloPos ? 'Tus fichas no tienen progresiones de costado para este ejercicio (con su nivel y cuidados).' : 'Tus fichas no tienen progresiones para este ejercicio (con su nivel y cuidados).')}
    ${props.length ? `<h4>🎯 Con un prop</h4><p class="micro">El mismo ejercicio con un prop: los que asisten lo hacen más fácil y los que resisten, más difícil (tus fichas de Mat 1 y Mat 2 y tu planilla de Mat 3).</p>
      <div class="var-lista">${props.map((o, k) => `<button type="button" class="var-ej var-prop" data-k="${k}"><span class="var-txt"><b>${esc(o.tipo)} <i class="var-tag ${o.modo || 'm3'}">${o.modo === 'asiste' ? 'más fácil' : o.modo === 'resiste' ? 'más difícil' : 'Mat 3'}</i></b><small>${esc(o.txt)}</small></span></button>`).join('')}</div>` : ''}
    <div class="fila"><button type="button" class="btn ghost" data-cerrar>Cerrar</button></div></div>`);
  $('[data-cerrar]', m).onclick = cerrarModal;
  /* un prop: queda en el ejercicio (y en el otro lado, si está intercalado) con su para qué y el motivo */
  $$('.var-prop', m).forEach(b => b.onclick = () => {
    const o = props[+b.dataset.k], motivo = (($('#varMotivo', m) || {}).value || '').trim();
    const gemelo = x.lado ? p.items.findIndex((y, k) => k !== i && y.id === x.id && y.lado && y.lado !== x.lado) : -1;
    for (const y of [x, ...(gemelo >= 0 ? [p.items[gemelo]] : [])]) Object.assign(y, { prop: o.tipo, propModo: o.modo || '', nota: o.txt.slice(0, 160), motivoProp: motivo });
    cerrarModal(); SND.toque(); tocar(p);
    rehacerPlan(p, `.pl-fila[data-i="${i}"]`);
    toast(`Con <b>${esc(o.tipo)}</b>${o.modo === 'asiste' ? ' (asiste: más fácil)' : o.modo === 'resiste' ? ' (resiste: más difícil)' : ''}${gemelo >= 0 ? ' en los dos lados' : ''}.`, 'toast-suave');
  });
  $$('.var-ej:not(.var-prop)', m).forEach(b => b.onclick = () => {
    const c = ejPlan(b.dataset.id), motivo = ($('#varMotivo', m) || {}).value || '';
    /* si estaba de los dos lados (intercalados), cambian los dos */
    const gemelo = x.lado ? p.items.findIndex((y, k) => k !== i && y.id === x.id && y.lado && y.lado !== x.lado) : -1;
    const nuevo = y => {
      const lado = y.lado && c.pos === 'costado' ? y.lado : '';
      /* el cambio queda anotado (qué era, si es más fácil o más difícil y por qué) para la hoja para entregar */
      return { id: c.id, reps: cfg && typeof repsGen === 'function' ? repsGen(c, cfg) : null, prop: '', nota: y.prop ? '' : y.nota || '',
        cambio: { de: (y.cambio && y.cambio.de) || y.id, tipo: b.dataset.tipo, motivo: motivo.trim() },
        ...(lado ? { lado } : {}), ...(cfg && typeof adaptacionGen === 'function' ? { adap: adaptacionGen(c, cfg, lado) } : {}) };
    };
    if (gemelo >= 0) p.items[gemelo] = nuevo(p.items[gemelo]);
    p.items[i] = nuevo(x);
    cerrarModal(); SND.toque(); tocar(p);
    rehacerPlan(p, `.pl-fila[data-i="${i}"]`);
    toast(`Cambiado por <b>${esc(c.n)}</b> (${b.dataset.tipo === 'reg' ? 'más fácil' : 'más difícil'})${c.pos !== e.pos ? '. Cambia de posición: mirá la transición.' : ''}${gemelo >= 0 ? ' En los dos lados.' : ''}`, 'toast-suave');
  });
}
