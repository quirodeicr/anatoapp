/* ============================================================
   Pilates Lab — Más fácil o más difícil en un toque

   En cada ejercicio de una sesión, ⇅ ofrece las regresiones (más
   fácil) y las progresiones (más difícil) que anotaste en tus
   análisis MAT 1 (regresiones Pre-Pilates y Mat 1, progresiones Mat 1
   y Mat 2) y MAT 2 (regresiones Pre-Pilates, Mat 1 y Mat 2,
   progresiones). La relación vale para los dos lados: si A es
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
  return { reg: lista(v.reg, false), prog: lista(v.prog, true) };
}
const tieneVariantes = (p, i) => { const o = opcionesVariantes(p, i); return o.reg.length + o.prog.length > 0; };

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
  const { reg: regs, prog: progs } = opcionesVariantes(p, i);
  const m = abrirModal(`<div class="var">
    <h3>${esc(e.n)}</h3>
    <p class="micro">Según tus análisis MAT 1 y MAT 2${cfg ? `; para progresar, hasta ${NIVELES_GEN[Math.min(3, (NIVEL_IDX[cfg.nivel] ?? 0) + 1)][1].toLowerCase()}${cfg.cuidados.length ? ' y lo que sus cuidados permiten' : ''}` : ''}.${soloPos ? ' Va en los dos lados.' : ''}</p>
    <h4>⬇️ Más fácil (regresión)</h4>
    ${bloque(regs, 'reg', soloPos ? 'Tus fichas no tienen regresiones de costado para este ejercicio.' : 'Tus fichas no tienen regresiones para este ejercicio.')}
    <h4>⬆️ Más difícil (progresión)</h4>
    ${bloque(progs, 'prog', soloPos ? 'Tus fichas no tienen progresiones de costado para este ejercicio (con su nivel y cuidados).' : 'Tus fichas no tienen progresiones para este ejercicio (con su nivel y cuidados).')}
    <div class="fila"><button type="button" class="btn ghost" data-cerrar>Cerrar</button></div></div>`);
  $('[data-cerrar]', m).onclick = cerrarModal;
  $$('.var-ej', m).forEach(b => b.onclick = () => {
    const c = ejPlan(b.dataset.id);
    /* si estaba de los dos lados (intercalados), cambian los dos */
    const gemelo = x.lado ? p.items.findIndex((y, k) => k !== i && y.id === x.id && y.lado && y.lado !== x.lado) : -1;
    const nuevo = y => {
      const lado = y.lado && c.pos === 'costado' ? y.lado : '';
      return { id: c.id, reps: cfg && typeof repsGen === 'function' ? repsGen(c, cfg) : null, prop: '', nota: y.nota || '',
        ...(lado ? { lado } : {}), ...(cfg && typeof adaptacionGen === 'function' ? { adap: adaptacionGen(c, cfg, lado) } : {}) };
    };
    if (gemelo >= 0) p.items[gemelo] = nuevo(p.items[gemelo]);
    p.items[i] = nuevo(x);
    cerrarModal(); SND.toque(); tocar(p);
    rehacerPlan(p, `.pl-fila[data-i="${i}"]`);
    toast(`Cambiado por <b>${esc(c.n)}</b> (${b.dataset.tipo === 'reg' ? 'más fácil' : 'más difícil'})${c.pos !== e.pos ? '. Cambia de posición: mirá la transición.' : ''}${gemelo >= 0 ? ' En los dos lados.' : ''}`, 'toast-suave');
  });
}
