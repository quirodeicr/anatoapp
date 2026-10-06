/* ============================================================
   Pilates Lab — términos tocables

   En los textos de la app (apuntes, fichas, retroalimentación, pasos
   del manual, sesiones…) los nombres de músculos y de ejercicios se
   subrayan; al tocarlos se abre una ventana:
   · músculo: su lugar en el mapa corporal (resaltado), la región y la
     acción de tus apuntes, lo que dicen las tarjetas y los ejercicios
     que lo trabajan;
   · ejercicio: la animación (o la foto de Pre-Pilates) con su ficha.
   Dentro de una pregunta no se subraya nada hasta responder (la
   ventana podría delatar la respuesta): solo en la hoja de corrección.
   Se carga después de app.js.
   ============================================================ */
'use strict';

const TERMINOS = (() => {
  const clave = s => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[\s\-–—]+/g, ' ').trim();
  const sinNota = m => m.replace(/\s*\(.*?\)\s*/g, ' ').trim();

  /* ---------- músculos: nombre de tus apuntes → nombres exactos de REGIONES ---------- */
  const TODOS = [];
  REGIONES.forEach(r => r.grupos.forEach(g => g.m.forEach(m => TODOS.push({ r, g, m }))));
  const exactos = base => [...new Set(TODOS.filter(x => clave(sinNota(x.m)) === clave(base)).map(x => x.m))];
  const MUSC = new Map();
  const poner = (superficies, nom, ms) => { if (!ms.length) return; superficies.forEach(s => MUSC.set(clave(s), { nom, ms })); };
  const ESPECIALES = /^(Trapecio superior, medio e inferior|Intercostales int\. y ext\.|Serrato posterior sup\. e inf\.|Gemelos sup\. e inf\.|Ilíaco|Espinal)$/;
  for (const m of new Set(TODOS.map(x => x.m))) if (!ESPECIALES.test(m)) poner([sinNota(m)], sinNota(m), exactos(sinNota(m)));
  const trap = TODOS.filter(x => /^Trapecio/.test(x.m)).map(x => x.m);
  poner(['Trapecio', 'Trapecios', 'Trapecio medio', 'Trapecio inferior'], 'Trapecio', [...new Set(trap)]);
  poner(['Trapecio superior'], 'Trapecio superior', [...new Set(trap)]);
  poner(['Intercostales', 'Intercostales internos', 'Intercostales externos'], 'Intercostales', ['Intercostales int. y ext.']);
  poner(['Serrato posterior'], 'Serrato posterior', ['Serrato posterior sup. e inf.']);
  poner(['Gemelo superior', 'Gemelo inferior', 'Gemelos superior e inferior'], 'Gemelos superior e inferior', ['Gemelos sup. e inf.']);
  poner(['Músculo ilíaco', 'Iliopsoas', 'Psoas ilíaco'], 'Iliopsoas', ['Psoas mayor', 'Ilíaco']);
  /* sinónimos y nombres comunes */
  const ALIAS = {
    'Gastrocnemio': ['Gastrocnemios', 'Gemelos'], 'Erectores de la espina': ['Erectores', 'Erector de la columna', 'Erectores de la columna', 'Erectores espinales', 'Erector espinal'],
    'TFL': ['Tensor de la fascia lata'], 'Suelo pélvico': ['Piso pélvico', 'Suelo pelviano', 'Piso pelviano'], 'Transverso del abdomen': ['Transverso abdominal'],
    'Psoas mayor': ['Psoas'], 'Multífidos': ['Multífido'], 'Recto abdominal': ['Recto del abdomen', 'Rectos abdominales'],
    'Bíceps braquial': ['Bíceps'], 'Tríceps braquial': ['Tríceps'], 'Piriforme': ['Piramidal'], 'Escalenos': ['Escaleno'], 'Romboides': ['Romboide']
  };
  for (const [m, xs] of Object.entries(ALIAS)) { const e = MUSC.get(clave(m)); if (e) poner(xs, e.nom === 'Gastrocnemio' ? 'Gastrocnemio (gemelos)' : e.nom, e.ms); }
  /* grupos musculares que los textos nombran juntos */
  const GRUPOS = [
    [['Isquiotibiales', 'Isquiotibial', 'Isquios'], 'Isquiotibiales', ['Semimembranoso', 'Semitendinoso', 'Bíceps femoral']],
    [['Cuádriceps'], 'Cuádriceps', ['Recto femoral', 'Vasto lateral', 'Vasto medial', 'Vasto intermedio']],
    [['Vastos'], 'Vastos', ['Vasto lateral', 'Vasto medial', 'Vasto intermedio']],
    [['Aductores', 'Aductores de cadera'], 'Aductores', ['Pectíneo', 'Aductor largo', 'Aductor corto', 'Aductor mayor', 'Grácil']],
    [['Glúteos'], 'Glúteos', ['Glúteo mayor', 'Glúteo medio', 'Glúteo menor']],
    [['Oblicuos', 'Oblicuos abdominales'], 'Oblicuos', ['Oblicuo externo', 'Oblicuo interno']],
    [['Manguito rotador', 'Manguito de los rotadores'], 'Manguito rotador', TODOS.filter(x => x.g.acc === 'Manguito rotador').map(x => x.m)],
    [['Abdominales', 'Músculos abdominales'], 'Abdominales', ['Recto abdominal', 'Oblicuo externo', 'Oblicuo interno', 'Transverso del abdomen']],
    [['Extensores de la columna', 'Extensores de columna', 'Extensores de la espalda', 'Extensores espinales'], 'Extensores de la columna', ['Iliocostal', 'Espinal', 'Erectores de la espina']],
    [['Flexores de cadera', 'Flexores de la cadera'], 'Flexores de cadera', ['Psoas mayor', 'Ilíaco', 'Sartorio', 'Recto femoral']],
    [['Pectorales'], 'Pectorales', ['Pectoral mayor', 'Pectoral menor']],
    [['Peroneos'], 'Peroneos', ['Peroneo largo', 'Peroneo corto', 'Peroneo anterior']],
    [['Unidad interna'], 'Unidad interna', ['Diafragma', 'Transverso del abdomen', 'Suelo pélvico', 'Multífidos']]
  ];
  for (const [sup, nom, ms] of GRUPOS) poner(sup, nom, ms.filter(m => TODOS.some(x => x.m === m)));

  /* ---------- ejercicios: los nombres que ya resuelve la app (manual y Pre-Pilates) ---------- */
  const EJ = new Map();
  const NO_EJ = new Set(['walking', 'marching', 'squats', 'estocada', 'aduccion de pie', 'rocket', 'pinwheel']);
  /* si un nombre es del manual y de Pre-Pilates (Swan, Swimming), gana el del manual */
  for (const [k, ref] of nombresEj()) if (k.length >= 3 && !NO_EJ.has(k) && !MUSC.has(k) && !EJ.has(k)) EJ.set(k, ref);
  ['twist', 'seated twist'].forEach(k => { const r = EJ_REF(k); if (r) EJ.set(k, r); });

  /* ---------- una expresión con todo, insensible a tildes y mayúsculas ---------- */
  const VOC = { a: '[aáàä]', e: '[eéèë]', i: '[iíìï]', o: '[oóòö]', u: '[uúùü]', n: '[nñ]' };
  const patron = k => k.split(' ').map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/[aeioun]/g, c => VOC[c])).join('[\\s\\-–—]+');
  const todas = [...new Set([...MUSC.keys(), ...EJ.keys()])].sort((a, b) => b.length - a.length);
  const RE = new RegExp(`(?<![\\p{L}\\p{N}])(?:${todas.map(patron).join('|')})(?![\\p{L}\\p{N}])`, 'giu');
  const resolver = txt => { const k = clave(txt); return MUSC.has(k) ? { t: 'm', k } : EJ.has(k) ? { t: 'e', k } : null; };

  /* ---------- subrayar en el DOM ---------- */
  const SALTAR = 'button,a,input,textarea,select,label,summary,svg,script,style,h1,h2,h3,code,pre,.termino,.no-term,.mapa,.lienzo,.chips,.cl-ej,.tira-p,.toast,.cartel,.fx-capa,[contenteditable],.rep-fig,.pt-cab';
  /* en una lección, solo después de responder (la hoja de corrección) */
  const enPregunta = el => { const s = el.closest('.sesion'); return !!s && !el.closest('.hoja'); };
  const vistos = new WeakMap();
  const bloqueDe = el => el.closest('p,li,dd,td,blockquote,.porque,.hoja-pq,.hoja-sol,div') || el;
  function enlazarTexto(nodo) {
    const txt = nodo.nodeValue;
    RE.lastIndex = 0;
    if (!RE.test(txt)) return;
    const padre = nodo.parentElement, bloque = bloqueDe(padre);
    let usados = vistos.get(bloque);
    if (!usados) vistos.set(bloque, (usados = new Set()));
    const sujeto = (padre.closest('[data-sujeto]') || {}).dataset?.sujeto;
    const frag = document.createDocumentFragment();
    let i = 0, cambio = false;
    RE.lastIndex = 0;
    for (let m; (m = RE.exec(txt));) {
      const r = resolver(m[0]);
      if (!r) continue;
      const id = r.t + ':' + r.k;
      if (usados.has(id) || (r.t === 'e' ? idRef(EJ.get(r.k)) : id) === sujeto) continue;
      usados.add(id); cambio = true;
      frag.append(txt.slice(i, m.index));
      const s = document.createElement('span');
      s.className = 'termino t-' + r.t; s.dataset.t = id; s.tabIndex = 0; s.setAttribute('role', 'button');
      s.setAttribute('aria-label', `${m[0]}: ${r.t === 'm' ? 'ver el músculo' : 'ver el ejercicio'}`);
      s.textContent = m[0];
      frag.append(s);
      i = m.index + m[0].length;
    }
    if (!cambio) return;
    frag.append(txt.slice(i));
    nodo.replaceWith(frag);
  }
  function enlazar(raiz) {
    if (!raiz || raiz.nodeType !== 1 || raiz instanceof SVGElement || !raiz.isConnected) return;
    if (raiz.closest(SALTAR) || enPregunta(raiz)) return;
    const w = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT, { acceptNode(n) {
      const p = n.parentElement;
      return !p || n.nodeValue.length < 3 || !/\S/.test(n.nodeValue) || p.closest(SALTAR) || enPregunta(p) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
    } });
    const nodos = [];
    while (w.nextNode()) nodos.push(w.currentNode);
    nodos.forEach(enlazarTexto);
  }
  /* lo nuevo que aparece en pantalla se revisa una vez por cuadro (las animaciones SVG no cuentan) */
  const pendientes = new Set();
  let cuadro = 0;
  const obs = new MutationObserver(ms => {
    for (const m of ms) for (const n of m.addedNodes) {
      if (n.nodeType === 1 && !(n instanceof SVGElement)) pendientes.add(n);
      else if (n.nodeType === 3 && n.parentElement && !(n.parentElement instanceof SVGElement)) pendientes.add(n.parentElement);
    }
    if (pendientes.size && !cuadro) cuadro = requestAnimationFrame(procesar);
  });
  function procesar() {
    cuadro = 0;
    const xs = [...pendientes]; pendientes.clear();
    obs.disconnect();
    try { xs.forEach(enlazar); } finally { obs.takeRecords(); observar(); }
  }
  const observar = () => obs.observe(document.body, { childList: true, subtree: true });

  /* ---------- la ventana ---------- */
  let pila = [];
  function cerrar() { const p = $('.pop-term'); if (p) { if (p._rep) p._rep.destruir(); p.remove(); } pila = []; document.removeEventListener('keydown', teclas); }
  function teclas(e) { if (e.key === 'Escape') { e.stopPropagation(); cerrar(); } }
  function mostrar(id, apilar = true) {
    let p = $('.pop-term');
    if (!p) {
      p = document.createElement('div');
      p.className = 'pop-term';
      p.addEventListener('click', e => { if (e.target === p) cerrar(); });
      document.body.appendChild(p);
      document.addEventListener('keydown', teclas);
      SND.abrir();
    } else SND.toque();
    if (p._rep) { p._rep.destruir(); p._rep = null; }
    if (apilar) pila.push(id);
    const [t, k] = [id.slice(0, 1), id.slice(2)];
    const cuerpo = t === 'm' ? htmlMusculo(MUSC.get(k)) : htmlEjercicio(EJ.get(k) || (k.startsWith('bb=') ? { bb: k.slice(3) } : { pm: k.slice(3) }));
    const tit = t === 'm' ? MUSC.get(k).nom : nombreRef(EJ.get(k) || (k.startsWith('bb=') ? { bb: k.slice(3) } : { pm: k.slice(3) }));
    p.innerHTML = `<div class="pt-in" role="dialog" aria-modal="true" aria-label="${esc(tit)}" data-sujeto="${esc(id)}">
      <div class="pt-cab">${pila.length > 1 ? '<button type="button" class="btn small ghost" data-pt="volver" aria-label="Volver">←</button>' : ''}
        <h3><small>${t === 'm' ? 'Músculo' : 'Ejercicio'}</small>${esc(tit)}</h3>
        <button type="button" class="btn small ghost" data-pt="cerrar" aria-label="Cerrar">✕</button></div>
      ${cuerpo}</div>`;
    $('[data-pt="cerrar"]', p).onclick = cerrar;
    const v = $('[data-pt="volver"]', p);
    if (v) v.onclick = () => { pila.pop(); mostrar(pila[pila.length - 1], false); };
    $$('[data-ir]', p).forEach(b => b.onclick = ev => { ev.stopPropagation(); mostrar(b.dataset.ir); });
    if (t === 'm') conectarMusculo(p, MUSC.get(k)); else conectarEjercicio(p, EJ.get(k) || (k.startsWith('bb=') ? { bb: k.slice(3) } : { pm: k.slice(3) }));
    llenarMinis(p);
    $('[data-pt="cerrar"]', p).focus({ preventScroll: true });
  }
  const nombreRef = r => r.bb ? (EJ_BB[r.bb] || {}).n || r.bb : (PM[r.pm] || {}).n || r.pm;
  const idRef = r => r.bb ? 'e:bb=' + r.bb : 'e:pm=' + r.pm;

  /* --- músculo --- */
  function claveDeMusc(info) {
    /* todas las formas de nombrarlo (para buscarlo en los textos de los ejercicios) */
    const ks = [];
    for (const [k, v] of MUSC) if (v.ms.some(m => info.ms.includes(m))) ks.push(k);
    return ks;
  }
  function htmlMusculo(info) {
    const filas = TODOS.filter(x => info.ms.includes(x.m));
    const porReg = new Map();
    filas.forEach(x => { if (!porReg.has(x.r.id)) porReg.set(x.r.id, { r: x.r, gs: [] }); porReg.get(x.r.id).gs.push(x); });
    const nota = m => (m.match(/\((.*?)\)/) || [])[1];
    const enMapa = info.ms.some(m => LAMINA.conNombre(m).length);
    /* lo que dicen tus apuntes: pares y tarjetas que lo nombran */
    const ks = claveDeMusc(info), menciona = s => { const c = ' ' + clave(s).replace(/[^a-z0-9 ]/g, ' ') + ' '; return ks.some(k => c.includes(' ' + k + ' ')); };
    const pares = PARES.filter(pr => Array.isArray(pr.pares)).flatMap(pr => pr.pares.filter(([a, b]) => menciona(a) || menciona(b)).map(([a, b]) => `${pr.q.replace(/^Uní cada /, '').replace(/^\w/, c => c.toUpperCase())}: <b>${esc(a)}</b> ↔ ${esc(b)}`));
    const cards = CARDS.filter(c => !c.revisar && Array.isArray(c.a) && menciona([c.q, ...c.a].join(' '))).slice(0, 3);
    /* ejercicios que lo trabajan: propósitos del manual y músculos de Pre-Pilates */
    const bb = BB.ejercicios.filter(e => POSES[e.id] && menciona((e.prop || []).join(' '))).slice(0, 8);
    const pm = PREMAT.filter(e => e.musculos && menciona(e.musculos)).slice(0, 8);
    const chip = r => `<button type="button" class="pt-ej" data-ir="${idRef(r)}"${r.bb ? ` data-bb="${r.bb}"` : ` data-pm="${r.pm}"`}><span class="ce-img" data-mini></span><span>${esc(nombreRef(r))}</span></button>`;
    return `${enMapa ? '<div class="pt-mapa" aria-label="Ubicación en el mapa corporal"></div>' : ''}
      <dl class="pt-dl">${[...porReg.values()].map(({ r, gs }) => {
        /* por acción: "Extensión de columna: Iliocostal, Espinal…" */
        const porAcc = new Map();
        gs.forEach(x => { if (!porAcc.has(x.g.acc)) porAcc.set(x.g.acc, []); porAcc.get(x.g.acc).push(x.m); });
        return `<dt>${esc(r.nom)}</dt><dd>${[...porAcc].map(([acc, ms]) => `<b>${esc(acc)}</b>${info.ms.length > 1 || nota(ms[0]) ? ': ' + ms.map(m => `${info.ms.length > 1 ? esc(sinNota(m)) : ''}${nota(m) ? ` <small>(${esc(nota(m))})</small>` : ''}`).join(', ') : ''}`).join('<br>')}</dd>`;
      }).join('')}</dl>
      ${pares.length || cards.length ? `<h4>En tus apuntes</h4><ul class="pt-lista">${pares.map(x => `<li>${x}</li>`).join('')}${cards.map(c => `<li><b>${esc(c.q)}</b> ${esc((c.a || [])[0] || '')}</li>`).join('')}</ul>` : ''}
      ${bb.length || pm.length ? `<h4>Ejercicios que lo trabajan</h4><div class="pt-ejs">${bb.map(e => chip({ bb: e.id })).join('')}${pm.map(e => chip({ pm: e.id })).join('')}</div>
        <p class="micro">Según los propósitos del manual (Mat 1 y Mat 2) y la columna de músculos de tu planilla de Pre-Pilates.</p>` : ''}
      ${enMapa ? '<div class="fila"><button type="button" class="btn small" data-pt="mapa">Ver en el mapa corporal</button></div>' : ''}`;
  }
  function conectarMusculo(p, info) {
    const caja = $('.pt-mapa', p);
    if (caja) {
      /* la vista (frente o espalda) donde más se ve */
      const vs = ['frente', 'espalda'].map(v => ({ v, n: info.ms.flatMap(m => LAMINA.conNombre(m)).filter(x => x.v === v && x.f.k !== 'h').length + 0.1 * info.ms.flatMap(m => LAMINA.conNombre(m)).filter(x => x.v === v).length }));
      const v = vs.sort((a, b) => b.n - a.n)[0].v;
      caja.innerHTML = LAMINA.svg(v);
      const svg = $('svg', caja);
      svg.classList.add('hay-sel');
      const ids = new Set(info.ms.flatMap(m => LAMINA.conNombre(m)).filter(x => x.v === v).map(x => x.f.id));
      const gs = [...ids].map(id => $(`[data-id="${id}"]`, svg)).filter(Boolean);
      gs.forEach(g => g.classList.add('foco'));
      /* acercar a lo resaltado (con margen), sin perder de vista dónde está en el cuerpo */
      requestAnimationFrame(() => {
        if (!gs.length) return;
        /* caja en unidades de la lámina (la capa profunda está espejada) */
        let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
        gs.forEach(g => { let b; try { b = g.getBBox(); } catch (e) { return; } if (!b.width) return;
          const x = g.closest('.capa.prof') ? 400 - b.x - b.width : b.x;
          x0 = Math.min(x0, x); y0 = Math.min(y0, b.y); x1 = Math.max(x1, x + b.width); y1 = Math.max(y1, b.y + b.height); });
        if (!isFinite(x0)) return;
        const bx = x0, by = y0, bw = x1 - x0, bh = y1 - y0;
        const lado = Math.min(400, Math.max(230, bw * 1.8, bh * 1.8 * 400 / 460)), alto = lado * 460 / 400;
        const cx = bx + bw / 2, cy = by + bh / 2;
        const vx = Math.max(0, Math.min(400 - lado, cx - lado / 2)), vy = Math.max(0, Math.min(890 - alto, cy - alto / 2));
        svg.setAttribute('viewBox', `${vx.toFixed(1)} ${vy.toFixed(1)} ${lado.toFixed(1)} ${alto.toFixed(1)}`);
      });
    }
    const b = $('[data-pt="mapa"]', p);
    if (b) b.onclick = () => {
      cerrar(); cerrarModal();
      ir('mapa');
      setTimeout(() => { const m = info.ms.find(x => LAMINA.conNombre(x).length); if (m) focoNombre(m); }, 60);
    };
  }

  /* --- ejercicio --- */
  function htmlEjercicio(r) {
    if (r.pm && PM[r.pm]) return fichaPremHTML(PM[r.pm]).replace('<details class="ficha-pm"', '<details open class="ficha-pm pt-pm"');
    const e = EJ_BB[r.bb];
    if (!e) return '<p class="vacio">No encontré la ficha.</p>';
    const pz = BB.nomPos ? BB.nomPos[e.pos] : e.pos;
    return `<div class="pt-pills"><span class="pill">${esc(pz || '')}</span><span class="pill gris">${e.f === 'mat1' ? 'Mat 1' : 'Mat 2'}</span>${e.reps ? `<span class="pill gris">${esc(e.reps)}</span>` : ''}${e.nivel ? `<span class="pill gris">${esc(e.nivel)}</span>` : ''}</div>
      ${POSES[e.id] ? '<div class="pt-anim fig-ej"></div>' : ''}
      ${e.inicial ? `<p><b>Posición inicial.</b> ${esc(e.inicial)}</p>` : ''}
      ${e.seq && e.seq.length ? `<ol class="pt-pasos">${e.seq.map(x => `<li><b>${esc(x.fase)}</b> ${esc(x.accion)}</li>`).join('')}</ol>` : ''}
      ${e.prop && e.prop.length ? `<h4>Propósitos</h4><ul class="pt-lista">${e.prop.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}
      ${e.osteoTxt ? `<p class="micro">🦴 ${esc(e.osteoTxt)}</p>` : ''}
      ${POSES[e.id] ? '<div class="fila"><button type="button" class="btn small" data-pt="grande">Ver en grande, paso a paso</button></div>' : ''}`;
  }
  function conectarEjercicio(p, r) {
    if (!r.bb || !POSES[r.bb]) return;
    const e = EJ_BB[r.bb], caja = $('.pt-anim', p);
    if (caja) p._rep = FIGURA.reproductor(caja, { ...POSES[e.id], nom: e.n }, { fantasma: false, fluido: ritmoFluido(),
      resp: POSES[e.id].poses.map((_, k) => { const q = pasoDePose(POSES[e.id], (k + 1) % POSES[e.id].poses.length); return q > 0 && e.seq[q - 1] ? respDeFase(e.seq[q - 1].fase) : null; }) });
    const g = $('[data-pt="grande"]', p);
    if (g) g.onclick = () => { cerrar(); abrirVisorGrande(e); };
  }

  /* ---------- tocar un término ---------- */
  const abrirDesde = el => { const id = el.dataset.t; if (!id) return; if (id[0] === 'm' && !MUSC.has(id.slice(2))) return; mostrar(id[0] === 'e' ? idRef(EJ.get(id.slice(2))) : id); };
  document.addEventListener('click', e => {
    const t = e.target.closest && e.target.closest('.termino');
    if (!t) return;
    e.preventDefault(); e.stopPropagation();
    abrirDesde(t);
  }, true);
  document.addEventListener('keydown', e => {
    const t = e.target.closest && e.target.closest('.termino');
    if (t && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); abrirDesde(t); }
  });

  observar();
  enlazar(document.body);
  return { enlazar, mostrar, cerrar, MUSC, EJ, resolver };
})();
