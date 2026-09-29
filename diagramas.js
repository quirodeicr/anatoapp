/* ============================================================
   AnatoApp — figuras del manual dibujadas en código (SVG)

   Son las figuras que el material marca como "svg_codigo": dependen de
   ángulos o referencias anatómicas precisas, y un dibujo generado por IA
   las suele errar. Varias son interactivas: botones, deslizador o puntos
   que se tocan para ver su nombre.
   ============================================================ */
'use strict';

const DIAGRAMAS = (() => {
  const f1 = n => (+n).toFixed(1);
  const W = 320, H = 200;
  const caja = (id, titulo, cuerpo, pie = '') =>
    `<figure class="diag" data-diag="${id}"><figcaption>${titulo}</figcaption>${cuerpo}${pie ? `<p class="diag-pie">${pie}</p>` : ''}</figure>`;
  const botones = (ops, on) => `<div class="diag-bot">${ops.map(([k, t]) => `<button type="button" class="chip-reg ${k === on ? 'on' : ''}" data-op="${k}">${t}</button>`).join('')}</div>`;
  /* inserta elementos encima de un SVG de la figura */
  const sobre = (svg, extra) => svg.replace(/<\/svg>\s*$/, extra + '</svg>');

  /* ---------- 1. Tres niveles de observación ---------- */
  function tresNiveles() {
    const n = [['Global', 'todo el cuerpo', 160, 42], ['Planar', 'sagital · frontal · transversal', 262, 150], ['Local / regional', 'una articulación o zona', 58, 150]];
    const flecha = (x1, y1, x2, y2, t) => `<path d="M${x1},${y1} Q${(x1 + x2) / 2 + (y2 - y1) * 0.25},${(y1 + y2) / 2 - (x2 - x1) * 0.25} ${x2},${y2}" class="dg-flecha" marker-end="url(#pta)"/>${t ? `<text x="${(x1 + x2) / 2 + (y2 - y1) * 0.32}" y="${(y1 + y2) / 2 - (x2 - x1) * 0.3}" class="dg-mini" text-anchor="middle">${t}</text>` : ''}`;
    return caja('niveles', 'Los tres niveles de observación',
      `<svg viewBox="0 0 ${W} ${H}" class="dg"><defs><marker id="pta" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 Z" class="dg-punta"/></marker></defs>
        ${flecha(196, 58, 236, 124, 'descomponer')}${flecha(214, 168, 108, 168, 'acercarse')}${flecha(66, 124, 124, 58, 'verificar')}
        ${n.map(([t, s, x, y]) => `<g><rect x="${x - 58}" y="${y - 20}" width="116" height="40" rx="12" class="dg-nodo"/>
          <text x="${x}" y="${y - 3}" text-anchor="middle" class="dg-t">${t}</text><text x="${x}" y="${y + 11}" text-anchor="middle" class="dg-mini">${s}</text></g>`).join('')}
      </svg>`, 'Lo global detecta dónde se interrumpe el patrón, lo local lo corrige y se vuelve a lo global para comprobar la mejora (págs. 4–5).');
  }

  /* ---------- 2. Los tres planos con la figura ---------- */
  function planos() {
    const P = typeof POSES !== 'undefined' ? POSES : {};
    const fig = (ej, t, s) => `<div class="dg-celda">${FIGURA.svgEstatico(ej, 0)}<b>${t}</b><small>${s}</small></div>`;
    const pl = P['pos-plancha'];
    const pie = { nom: 'un pie', vista: 'frente', poses: [{ tr: -90, bc: [98, 0, 0], bl: [82, 0, 0], pc: [92, 0, 90], pl: [-90, 180, 90], k: { pc: [1, 1, 0.3], pl: [0.55, 0.9, 0.3] }, apoyo: ['pieC'] }] };
    const rot = { nom: 'rotación', vista: 'frente', poses: [{ tr: -90, g: 0.7, bc: [180, 0, 0], bl: [0, 0, 0], pc: [92, 0, 90], pl: [88, 0, 90], k: { ancho: 0.72, bc: [0.6, 0.6, 0.7], bl: [0.6, 0.6, 0.7], pc: [1, 1, 0.3], pl: [1, 1, 0.3] }, apoyo: ['pieC', 'pieL'] }] };
    return caja('planos', 'Los tres planos',
      `<div class="dg-fila">${pl ? fig(pl, 'Sagital', 'Plancha: el “sándwich muscular” anterior y posterior sostiene la columna.') : ''}
        ${fig(pie, 'Frontal', 'En un pie: el sistema lateral mantiene la pelvis nivelada.')}
        ${fig(rot, 'Transversal', 'Rotación de pie: rota el tórax, no la pelvis ni los pies. Compará ambos lados.')}</div>`);
  }

  /* ---------- 3. Plomada lateral (interactiva) ---------- */
  const DE_PIE = { tr: -90, fl: 0, cab: 0, bc: [90, 8, 0], bl: [92, 8, 0], pc: [90, 0, 0], pl: [90, 0, 0], apoyo: ['pieC', 'pieL'] };
  const PLOMADA = {
    ideal: [DE_PIE, 'Postura de referencia: los seis puntos quedan sobre la línea.'],
    cabeza: [{ ...DE_PIE, cab: 30 }, 'Cabeza adelantada: el lóbulo de la oreja queda por delante de la línea.'],
    cifosis: [{ ...DE_PIE, tr: -86, fl: 32, cab: 12, bc: [100, 8, 0], bl: [102, 8, 0] }, 'Hipercifosis: hombros y oreja por delante; el tórax se hunde.'],
    rodillas: [{ ...DE_PIE, tr: -93, pc: [98, -16, 8], pl: [98, -16, 8] }, 'Rodillas en hiperextensión: la rodilla queda por detrás de la línea.']
  };
  const PUNTOS_LAT = ['Lóbulo de la oreja', 'Parte superior del hombro', 'Centro de la caja torácica', 'Punto alto de la cresta ilíaca', 'Punto medio lateral de la rodilla', 'Ligeramente delante del maléolo lateral'];
  function svgPlomada(estado) {
    const ej = { nom: 'plomada', vista: 'perfil', poses: [PLOMADA[estado][0]], zoomMax: 1.2 };
    const { E, T } = FIGURA.esqueletoEn(ej);
    const mez = (a, b, k) => ({ x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k });
    const pts = [E.C, { x: E.S.x, y: E.S.y - 3 }, mez(E.W, E.S, 0.55), mez(E.H, E.W, 0.4), E.L1.rod, { x: E.L1.tob.x + 3, y: E.L1.tob.y }].map(T);
    const x = T({ x: E.L1.tob.x + 3, y: 0 }).x;
    return sobre(FIGURA.svgEstatico(ej, 0), `<line x1="${f1(x)}" y1="4" x2="${f1(x)}" y2="${FIGURA.PISO}" class="dg-plomada"/>
      ${pts.map((p, i) => `<g class="dg-pto" data-nombre="${i + 1}. ${PUNTOS_LAT[i]}" tabindex="0"><circle cx="${f1(p.x)}" cy="${f1(p.y)}" r="6" class="dg-pto-c"/><text x="${f1(p.x)}" y="${f1(p.y + 3.2)}" text-anchor="middle" class="dg-pto-n">${i + 1}</text></g>`).join('')}`);
  }
  function plomada() {
    return caja('plomada', 'Plomada lateral: seis puntos de referencia',
      `${botones([['ideal', 'Ideal'], ['cabeza', 'Cabeza adelantada'], ['cifosis', 'Hipercifosis'], ['rodillas', 'Rodillas hiperextendidas']], 'ideal')}
       <div class="dg-lienzo">${svgPlomada('ideal')}</div><p class="dg-cap" aria-live="polite">${PLOMADA.ideal[1]} Tocá un número para ver su nombre.</p>`,
      'De arriba abajo: oreja → hombro → centro del tórax → cresta ilíaca → rodilla → delante del maléolo (centro del cuboides). Pág. 10.');
  }

  /* ---------- 4. Plomada frontal y alineación horizontal ---------- */
  function svgFrente(modo) {
    const ej = { nom: 'frente', vista: 'frente', poses: [{ ...DE_PIE, bc: [97, 0, 0], bl: [83, 0, 0], pc: [92, 0, 90], pl: [88, 0, 90], k: { pc: [1, 1, 0.3], pl: [1, 1, 0.3] } }], zoomMax: 1.2 };
    const { E, T } = FIGURA.esqueletoEn(ej);
    let extra = '';
    if (modo === 'plomada') {
      const c = T(E.C), piso = FIGURA.PISO;
      const pts = [[T({ x: E.C.x, y: E.C.y + 2 }), 'Nariz'], [T({ x: (E.W.x + E.S.x) / 2, y: (E.W.y + E.S.y) / 2 }), 'Centro del esternón'], [T({ x: E.W.x, y: E.W.y + 4 }), 'Ombligo'], [T({ x: E.H.x, y: E.H.y + 9 }), 'Centro del pubis']];
      const pierna = L => [[T({ x: L.c.x, y: L.c.y - 3 }), 'Interior de la EIAS'], [T(L.rod), 'Centro de la rótula'], [T(L.tob), 'Centro del frente del tobillo'], [T({ x: L.punta.x, y: L.punta.y + 1 }), 'Entre el 1.º y 2.º dedo']];
      const todos = [...pts, ...pierna(E.L1), ...pierna(E.L2)];
      extra = `<line x1="${f1(c.x)}" y1="4" x2="${f1(c.x)}" y2="${piso}" class="dg-plomada"/>
        ${[E.L1, E.L2].map(L => { const a = T(L.c), b = T(L.punta); return `<line x1="${f1(a.x)}" y1="${f1(a.y)}" x2="${f1(b.x)}" y2="${f1(b.y)}" class="dg-plomada fina"/>`; }).join('')}
        ${todos.map(([p, n], i) => `<g class="dg-pto" data-nombre="${n}" tabindex="0"><circle cx="${f1(p.x)}" cy="${f1(p.y)}" r="4.5" class="dg-pto-c"/></g>`).join('')}`;
    } else {
      const lin = [[E.C.y - 2, 'Ojos'], [E.S.y, 'Hombros'], [E.H.y - 10, 'Crestas ilíacas'], [E.H.y - 4, 'EIAS'], [E.H.y + 5, 'Trocánteres'], [E.L1.rod.y, 'Rodillas']];
      extra = lin.map(([y, n]) => { const p = T({ x: 0, y }); return `<g class="dg-pto" data-nombre="${n}: a la misma altura de ambos lados" tabindex="0"><line x1="70" y1="${f1(p.y)}" x2="250" y2="${f1(p.y)}" class="dg-horiz"/><text x="252" y="${f1(p.y + 3)}" class="dg-mini">${n}</text></g>`; }).join('');
    }
    return sobre(FIGURA.svgEstatico(ej, 0), extra);
  }
  function frente() {
    return caja('frente', 'Vista de frente: plomada y niveles',
      `${botones([['plomada', 'Plomada frontal'], ['horiz', 'Alineación horizontal']], 'plomada')}
       <div class="dg-lienzo">${svgFrente('plomada')}</div><p class="dg-cap" aria-live="polite">Tocá un punto para ver su nombre.</p>`,
      'Tronco: nariz → esternón → ombligo → pubis. Piernas: EIAS → rótula → tobillo → entre el 1.º y 2.º dedo. De espaldas: centro del cráneo → columna → sacro; pliegue glúteo → hueco poplíteo → tendón de Aquiles (págs. 10–11).');
  }

  /* ---------- 5. Pelvis: anteversión / retroversión (deslizador) ---------- */
  function svgPelvis(g) {
    const cx = 170, cy = 116, r = Math.PI / 180 * g;
    const rot = (x, y) => ({ x: cx + x * Math.cos(r) - y * Math.sin(r), y: cy + x * Math.sin(r) + y * Math.cos(r) });
    const pt = (x, y) => { const q = rot(x, y); return `${f1(q.x)},${f1(q.y)}`; };
    /* ilion de perfil (adelante = derecha): cresta, EIAS, EIAI, pubis,
       tuberosidad isquiática, escotadura ciática, EIPS */
    const ilion = `M${pt(-40, -26)} Q${pt(-28, -56)} ${pt(2, -52)} Q${pt(26, -48)} ${pt(33, -25)}
      Q${pt(26, -18)} ${pt(28, -8)} Q${pt(20, 2)} ${pt(22, 12)} L${pt(31, 22)} Q${pt(26, 30)} ${pt(12, 26)}
      Q${pt(4, 36)} ${pt(-10, 33)} Q${pt(-18, 24)} ${pt(-22, 12)} Q${pt(-34, 6)} ${pt(-30, -6)} Q${pt(-44, -12)} ${pt(-40, -26)} Z`;
    const sacro = `M${pt(-40, -30)} L${pt(-26, -34)} Q${pt(-30, -6)} ${pt(-44, 14)} Q${pt(-50, -8)} ${pt(-40, -30)} Z`;
    const eias = rot(33, -25), pubis = rot(31, 22);
    /* columna lumbar: arranca perpendicular al platillo del sacro y se
       endereza hacia arriba; con anteversión la curva crece */
    const base = rot(-33, -33);
    let a0 = -68 + g, paso = (-98 - a0) / 5, p0 = base, v = '';
    for (let i = 0; i < 5; i++) {
      const an = a0 + paso * (i + 0.5), ra = an * Math.PI / 180;
      const p1 = { x: p0.x + Math.cos(ra) * 17, y: p0.y + Math.sin(ra) * 17 };
      const nx = -Math.sin(ra) * 8, ny = Math.cos(ra) * 8, m = 0.12;
      const a1 = { x: p0.x + (p1.x - p0.x) * m, y: p0.y + (p1.y - p0.y) * m }, b1 = { x: p1.x - (p1.x - p0.x) * m, y: p1.y - (p1.y - p0.y) * m };
      v += `<path d="M${f1(a1.x + nx)},${f1(a1.y + ny)} L${f1(b1.x + nx)},${f1(b1.y + ny)} L${f1(b1.x - nx)},${f1(b1.y - ny)} L${f1(a1.x - nx)},${f1(a1.y - ny)} Z" class="dg-hueso lum"/>`;
      p0 = p1;
    }
    /* tazón con agua: el nivel queda horizontal; si se inclina, derrama */
    const r1 = rot(-40, -58), r2 = rot(40, -58);
    const tazon = `M${f1(r1.x)},${f1(r1.y)} Q${pt(0, -4)} ${f1(r2.x)},${f1(r2.y)} Z`;
    const nivel = Math.max(r1.y, r2.y) + 3;
    const lado = g > 7 ? r2 : g < -7 ? r1 : null, sg = g > 0 ? 1 : -1;
    const derrame = lado ? `<path d="M${f1(lado.x)},${f1(lado.y)} q${sg * 7},6 ${sg * 5},20 q${sg * 5},-4 ${sg * 2},-18 Z" class="dg-agua"/><circle cx="${f1(lado.x + sg * 7)}" cy="${f1(lado.y + 30)}" r="2.2" class="dg-agua"/>` : '';
    return `<svg viewBox="0 0 ${W} ${H}" class="dg"><defs><clipPath id="tz"><path d="${tazon}"/></clipPath></defs>
      <text x="14" y="18" class="dg-mini">perfil · adelante →</text>
      <g transform="translate(${cx} ${cy}) scale(1.4) translate(${-cx} ${-cy})">
      ${v}
      <path d="M${cx - 4},${cy + 4} L${cx + 8},${H - 4}" class="dg-femur"/>
      <path d="${sacro}" class="dg-hueso"/>
      <path d="${ilion}" class="dg-hueso pelvis"/>
      <circle cx="${cx}" cy="${cy}" r="8" class="dg-cabeza-fem"/>
      <rect x="${cx - 70}" y="${f1(nivel)}" width="140" height="80" clip-path="url(#tz)" class="dg-agua"/>
      <path d="${tazon}" class="dg-tazon"/>${derrame}
      <line x1="${f1(eias.x)}" y1="${f1(eias.y)}" x2="${f1(pubis.x)}" y2="${f1(pubis.y)}" class="dg-plano"/>
      <line x1="${f1(pubis.x)}" y1="${f1(eias.y - 26)}" x2="${f1(pubis.x)}" y2="${f1(pubis.y + 14)}" class="dg-plomada fina"/>
      <circle cx="${f1(eias.x)}" cy="${f1(eias.y)}" r="4" class="dg-pto-c"/><text x="${f1(eias.x + 7)}" y="${f1(eias.y - 3)}" class="dg-t">EIAS</text>
      <circle cx="${f1(pubis.x)}" cy="${f1(pubis.y)}" r="4" class="dg-pto-c"/><text x="${f1(pubis.x + 7)}" y="${f1(pubis.y + 8)}" class="dg-t">Pubis</text>
    </g></svg>`;
  }
  const estadoPelvis = g => Math.abs(g) <= 3 ? '<b>Neutra</b>: EIAS y pubis en un plano vertical (de pie o sentado).'
    : g > 0 ? `<b>Anteversión</b>: la EIAS queda por delante del pubis. El tazón derrama hacia adelante y la lordosis lumbar aumenta.`
    : `<b>Retroversión</b>: la EIAS queda por detrás del pubis. El tazón derrama hacia atrás y la zona lumbar se aplana.`;
  function pelvis() {
    return caja('pelvis', 'Pelvis neutra, anteversión y retroversión (perfil)',
      `${botones([['-15', 'Retroversión'], ['0', 'Neutra'], ['15', 'Anteversión']], '0')}
       <div class="dg-lienzo">${svgPelvis(0)}</div>
       <input type="range" min="-20" max="20" step="1" value="0" class="dg-slider" aria-label="Inclinación de la pelvis">
       <p class="dg-cap" aria-live="polite">${estadoPelvis(0)}</p>`,
      'Triángulo con las manos: talones de las manos en las EIAS y dedos en el pubis. En supino, el plano EIAS–pubis queda paralelo al piso. Neutra no significa inmóvil (pág. 19).');
  }

  /* ---------- 6. Curvas de la columna ---------- */
  const CURVAS = {
    normal: { pts: [[0, 0], [5, 0.12], [-9, 0.42], [6, 0.74], [-4, 0.9], [-12, 1]], txt: 'Curvas normales: lordosis cervical, cifosis torácica y lordosis lumbar.' },
    lordosis: { pts: [[0, 0], [5, 0.12], [-9, 0.42], [15, 0.74], [-2, 0.9], [-16, 1]], txt: 'Hiperlordosis lumbar: extensores lumbares y flexores de cadera tensos, abdominales débiles, pelvis en anteversión.' },
    cifosis: { pts: [[0, 0], [9, 0.12], [-18, 0.42], [6, 0.74], [-4, 0.9], [-12, 1]], txt: 'Hipercifosis torácica: extensores torácicos y estabilizadores escapulares débiles, pectorales tensos.' },
    c: { frente: true, f: y => 14 * Math.sin(Math.PI * y), txt: 'Escoliosis en C: una sola curva lateral (con rotación). Estirar con suavidad el lado cóncavo y fortalecer el convexo.' },
    s: { frente: true, f: y => 11 * Math.sin(2 * Math.PI * y), txt: 'Escoliosis en S: dos curvas en regiones distintas y en sentidos opuestos.' }
  };
  function svgColumna(k) {
    const c = CURVAS[k], x0 = 160, y0 = 24, alto = 150;
    const fx = y => {
      if (c.frente) return c.f(y);
      const P = c.pts;
      for (let i = 0; i < P.length - 1; i++) if (y <= P[i + 1][1]) {
        const t = (y - P[i][1]) / (P[i + 1][1] - P[i][1]), s = (1 - Math.cos(Math.PI * t)) / 2;
        return P[i][0] + (P[i + 1][0] - P[i][0]) * s;
      }
      return P[P.length - 1][0];
    };
    const n = 24, v = [];
    for (let i = 0; i < n; i++) {
      const y1 = i / n, y2 = (i + 0.78) / n;
      const a = { x: x0 + fx(y1) * 2.2, y: y0 + y1 * alto }, b = { x: x0 + fx(y2) * 2.2, y: y0 + y2 * alto };
      const w = i < 7 ? 6 : i < 19 ? 8 : 10;
      const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1, nx = -dy / d * w, ny = dx / d * w;
      v.push(`<path d="M${f1(a.x + nx)},${f1(a.y + ny)} L${f1(b.x + nx)},${f1(b.y + ny)} L${f1(b.x - nx)},${f1(b.y - ny)} L${f1(a.x - nx)},${f1(a.y - ny)} Z" class="dg-hueso ${i < 7 ? 'cerv' : i < 19 ? 'tor' : 'lum'}"/>`);
    }
    const base = { x: x0 + fx(1) * 2.2, y: y0 + alto };
    const sacro = c.frente
      ? `<path d="M${f1(base.x - 16)},${f1(base.y + 2)} L${f1(base.x + 16)},${f1(base.y + 2)} L${f1(base.x)},${f1(base.y + 22)} Z" class="dg-hueso"/>`
      : `<path d="M${f1(base.x - 6)},${f1(base.y)} L${f1(base.x + 12)},${f1(base.y + 4)} L${f1(base.x - 4)},${f1(base.y + 22)} Z" class="dg-hueso"/>`;
    const craneo = `<ellipse cx="${f1(x0 + fx(0) * 2.2 + (c.frente ? 0 : 6))}" cy="${y0 - 8}" rx="${c.frente ? 16 : 19}" ry="13" class="dg-hueso craneo"/>`;
    const eje = `<line x1="${x0}" y1="${y0 - 20}" x2="${x0}" y2="${y0 + alto + 24}" class="dg-plomada fina"/>`;
    const lbl = c.frente ? `<text x="20" y="20" class="dg-mini">vista de espaldas</text>`
      : `<text x="20" y="20" class="dg-mini">perfil · adelante →</text><text x="232" y="${y0 + 20}" class="dg-mini">cervical</text><text x="232" y="${y0 + 80}" class="dg-mini">torácica</text><text x="232" y="${y0 + 135}" class="dg-mini">lumbar</text>`;
    return `<svg viewBox="0 0 ${W} ${H}" class="dg">${lbl}${eje}${craneo}${v.join('')}${sacro}</svg>`;
  }
  function columna() {
    return caja('columna', 'Curvas de la columna y desalineaciones',
      `${botones([['normal', 'Normal'], ['lordosis', 'Hiperlordosis'], ['cifosis', 'Hipercifosis'], ['c', 'Escoliosis en C'], ['s', 'Escoliosis en S']], 'normal')}
       <div class="dg-lienzo">${svgColumna('normal')}</div><p class="dg-cap" aria-live="polite">${CURVAS.normal.txt}</p>`, 'Págs. 14–15.');
  }

  /* ---------- 7. Rodillas ---------- */
  function svgRodillas(k) {
    const pierna = (cad, rod, tob, cl = '') => `<path d="M${cad[0]},${cad[1]} L${rod[0]},${rod[1]} L${tob[0]},${tob[1]}" class="dg-pierna ${cl}"/><circle cx="${rod[0]}" cy="${rod[1]}" r="6" class="dg-rotula"/><path d="M${tob[0] - 7},${tob[1] + 6} L${tob[0] + 9},${tob[1] + 6}" class="dg-pie"/>`;
    if (k === 'hiper' || k === 'perfil') {
      const r = k === 'hiper' ? 150 : 160;
      return `<svg viewBox="0 0 ${W} ${H}" class="dg"><text x="20" y="20" class="dg-mini">perfil · adelante →</text>
        <line x1="161" y1="20" x2="161" y2="186" class="dg-plomada"/>${pierna([160, 30], [r, 105], [158, 178])}
        <text x="190" y="108" class="dg-t">${k === 'hiper' ? '← rodilla detrás de la línea' : '← rodilla sobre la línea'}</text></svg>`;
    }
    const dx = k === 'valgo' ? -16 : k === 'varo' ? 18 : 0, pies = k === 'valgo' ? 28 : k === 'varo' ? 4 : 16;
    return `<svg viewBox="0 0 ${W} ${H}" class="dg"><text x="20" y="20" class="dg-mini">de frente</text>
      ${pierna([130, 30], [140 - dx, 105], [160 - pies, 178])}${pierna([190, 30], [180 + dx, 105], [160 + pies, 178])}</svg>`;
  }
  const TXT_ROD = {
    perfil: 'Perfil de referencia: la rodilla queda sobre la línea de plomada.',
    hiper: 'Hiperextensión: la rodilla queda por detrás de la plomada (hipermovilidad). Evitar bloquearla bajo carga; equilibrar isquiotibiales y cuádriceps.',
    neutra: 'De frente, alineación de referencia.',
    valgo: 'Genu valgo: las rodillas se tocan y los bordes internos de los pies no. Ángulo Q aumentado; más común en mujeres.',
    varo: 'Genu varo: los bordes internos de los pies se tocan y las rodillas no. Ángulo Q disminuido; a veces con hiperextensión.'
  };
  function rodillas() {
    return caja('rodillas', 'Rodillas: hiperextensión, valgo y varo',
      `${botones([['perfil', 'Perfil'], ['hiper', 'Hiperextensión'], ['neutra', 'Frente'], ['valgo', 'Genu valgo'], ['varo', 'Genu varo']], 'perfil')}
       <div class="dg-lienzo">${svgRodillas('perfil')}</div><p class="dg-cap" aria-live="polite">${TXT_ROD.perfil}</p>`, 'Pág. 16.');
  }

  /* ---------- 8. Pie visto desde atrás ---------- */
  function pies() {
    const pie = (x, g, t, s) => {
      const r = g * Math.PI / 180, top = [x + Math.sin(r) * 60, 40], base = [x, 150];
      return `<g><path d="M${x - 16},30 L${x + 16},30 L${x + 12},120 L${x - 12},120 Z" class="dg-pierna-sil"/>
        <ellipse cx="${x}" cy="150" rx="18" ry="16" class="dg-talon" transform="rotate(${g} ${x} 150)"/>
        <line x1="${f1(top[0])}" y1="${top[1]}" x2="${base[0]}" y2="${base[1]}" class="dg-plano"/>
        <path d="M${x - 30},172 L${x + 30},172" class="dg-piso"/>
        ${g ? `<path d="M${x + (g > 0 ? 22 : -22)},166 l${g > 0 ? 8 : -8},0" class="dg-flecha-c" marker-end="url(#ptb)"/>` : ''}
        <text x="${x}" y="190" text-anchor="middle" class="dg-t">${t}</text><text x="${x}" y="22" text-anchor="middle" class="dg-mini">${s}</text></g>`;
    };
    return caja('pies', 'Pie derecho visto desde atrás',
      `<svg viewBox="0 0 ${W} ${H}" class="dg"><defs><marker id="ptb" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0,0 L10,5 L0,10 Z" class="dg-punta"/></marker></defs>
        ${pie(60, 10, 'Supinación', 'peso afuera')}${pie(160, 0, 'Neutro', 'Aquiles vertical')}${pie(260, -10, 'Pronación', 'peso adentro')}</svg>`,
      'Pronación: arco aplanado, Aquiles inclinado hacia medial, peso en el borde interno → fortalecer el arco y la línea media de la pierna. Supinación: arco alto, peso en el borde externo, pie rígido → estirar el arco y el lado medial (pág. 17).');
  }

  /* ---------- 9. Escápulas ---------- */
  function escapulas() {
    const esp = (x, tipo) => {
      const dy = tipo === 'elevada' ? -14 : 0;
      const esc = (lado) => {
        const s = lado;
        const pts = [[s * 14, 40 + dy], [s * 44, 36 + dy], [s * 26, 96 + dy]];
        return `<path d="M${pts.map(([a, b]) => `${x + a},${b}`).join(' L')} Z" class="dg-escapula ${tipo === 'alada' ? 'alada' : ''}"/>
          ${tipo === 'alada' ? `<path d="M${x + s * 14},${40} L${x + s * 26},${96}" class="dg-borde"/>` : ''}`;
      };
      return `<g><path d="M${x - 56},22 Q${x},10 ${x + 56},22 L${x + 48},140 L${x - 48},140 Z" class="dg-torso"/>
        <line x1="${x}" y1="24" x2="${x}" y2="136" class="dg-plomada fina"/>${esc(-1)}${esc(1)}
        ${tipo === 'elevada' ? `<path d="M${x - 44},30 l0,-10 M${x + 44},30 l0,-10" class="dg-flecha-c" marker-end="url(#ptc)"/>` : ''}
        <text x="${x}" y="160" text-anchor="middle" class="dg-t">${{ normal: 'Normal', alada: 'Alada', elevada: 'Elevada' }[tipo]}</text></g>`;
    };
    return caja('escapulas', 'Escápulas vistas de espaldas',
      `<svg viewBox="0 0 ${W} 170" class="dg"><defs><marker id="ptc" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0,0 L10,5 L0,10 Z" class="dg-punta"/></marker></defs>
        ${esp(56, 'normal')}${esp(160, 'alada')}${esp(264, 'elevada')}</svg>`,
      'Alada: el borde medial se separa de las costillas (serrato anterior débil o tórax poco profundo). Elevada: hacia las orejas (trapecio superior, pectoral menor y elevador de la escápula tensos; serrato y trapecio inferior débiles). Pág. 17.');
  }

  /* ---------- 10. Síndromes cruzados (Janda) ---------- */
  const CRUZ = {
    sup: { pose: { ...DE_PIE, tr: -86, fl: 24, cab: 28, bc: [100, 8, 0], bl: [102, 8, 0] }, zona: 'S',
      tenso: [['Trapecio superior y elevador de la escápula', 'atras-arriba'], ['Pectorales mayor y menor', 'adelante-abajo']],
      debil: [['Flexores profundos del cuello', 'adelante-arriba'], ['Trapecio inferior, serrato anterior y romboides', 'atras-abajo']],
      txt: 'Superior: cabeza adelantada y hombros redondeados. Acortados: elevador de la escápula, trapecio superior, ECM, escalenos, pectorales, subescapular, dorsal ancho, bíceps. Alargados: trapecio inferior, serrato anterior, romboides, supraespinoso, infraespinoso, deltoides, flexores profundos del cuello, tríceps.' },
    inf: { pose: { ...DE_PIE, tr: -93, fl: -22, cab: -4 }, zona: 'H',
      tenso: [['Erectores de la columna (lumbar)', 'atras-arriba'], ['Flexores de cadera (iliopsoas, recto femoral)', 'adelante-abajo']],
      debil: [['Abdominales', 'adelante-arriba'], ['Glúteos', 'atras-abajo']],
      txt: 'Inferior: anteversión pélvica con más lordosis lumbar. Acortados: iliopsoas, recto femoral, erectores, TFL, aductores, cuadrado lumbar. Alargados: recto abdominal, glúteos, vastos lateral y medial, piriforme, isquiotibiales.' }
  };
  function svgCruz(k) {
    const c = CRUZ[k], ej = { nom: 'cruz', vista: 'perfil', poses: [c.pose], zoomMax: 1.2 };
    const { E, T } = FIGURA.esqueletoEn(ej);
    const centro = T(k === 'sup' ? { x: (E.S.x + E.C.x) / 2, y: (E.S.y + E.C.y) / 2 + 2 } : { x: (E.H.x + E.W.x) / 2, y: (E.H.y + E.W.y) / 2 + 2 });
    const d = 30;
    const pos = { 'atras-arriba': [-d, -d], 'adelante-abajo': [d, d], 'adelante-arriba': [d, -d], 'atras-abajo': [-d, d] };
    const linea = (par, cl) => { const [a, b] = par.map(([, p]) => pos[p]); return `<line x1="${f1(centro.x + a[0])}" y1="${f1(centro.y + a[1])}" x2="${f1(centro.x + b[0])}" y2="${f1(centro.y + b[1])}" class="dg-cruz ${cl}"/>`; };
    const etiq = (par, cl) => par.map(([n, p]) => { const [dx, dy] = pos[p]; const x = centro.x + dx * 1.15, y = centro.y + dy * 1.15;
      return `<g class="dg-pto" data-nombre="${cl === 'tenso' ? 'Acortado y activo' : 'Alargado e inactivo'}: ${n}" tabindex="0"><circle cx="${f1(x)}" cy="${f1(y)}" r="7" class="dg-cruz-c ${cl}"/><text x="${f1(x)}" y="${f1(y + 3)}" text-anchor="middle" class="dg-pto-n">${cl === 'tenso' ? 'T' : 'D'}</text></g>`; }).join('');
    return sobre(FIGURA.svgEstatico(ej, 0), linea(c.tenso, 'tenso') + linea(c.debil, 'debil') + etiq(c.tenso, 'tenso') + etiq(c.debil, 'debil'));
  }
  function cruzados() {
    return caja('cruz', 'Síndromes cruzados (Janda)',
      `${botones([['sup', 'Superior'], ['inf', 'Inferior']], 'sup')}
       <div class="dg-lienzo">${svgCruz('sup')}</div>
       <p class="dg-leyenda"><span class="ley tenso">T</span> acortado y activo <span class="ley debil">D</span> alargado e inactivo · tocá cada círculo</p>
       <p class="dg-cap" aria-live="polite">${CRUZ.sup.txt}</p>`,
      'Estirar lo corto, fortalecer lo largo y practicar el patrón nuevo hasta volverlo hábito (pág. 18).');
  }

  /* ---------- 11. Aprendizaje motor ---------- */
  function aprendizaje() {
    const et = [['Incompetente inconsciente', '“No puedo y no sé que no puedo”'], ['Incompetente consciente', '“No puedo y lo sé”'], ['Competente consciente', '“Puedo si me concentro”'], ['Competente inconsciente', '“Puedo sin pensarlo”']];
    return caja('aprendizaje', 'Las cuatro etapas del aprendizaje motor ★ tema de examen',
      `<div class="dg-escalera">${et.map(([t, s], i) => `<div class="dg-esc e${i}" style="--h:${70 + i * 28}px"><span>${i + 1}</span><b>${t}</b><i>${s}</i></div>`).join('')}</div>`,
      'La etapa 1 es la más difícil de atravesar: hay que crear conciencia del déficit. Regla 80/20: 80 % refuerza lo que ya sale, 20 % introduce retos (págs. 20–21).');
  }

  /* ---------- 12. Orden de posiciones de una clase de mat ---------- */
  function ordenClase() {
    const P = typeof POSES !== 'undefined' ? POSES : {};
    const pasos = [['pos-bipedo', 'De pie'], ['pos-4-puntos', 'Cuatro puntos'], ['pos-supino-rodillas', 'Supino'], ['pos-sedente', 'Sentado'], ['pos-prono', 'Prono'], ['pos-plancha', 'Plancha'], ['pos-lateral', 'De costado'], ['pos-bipedo', 'Cierre de pie']];
    return caja('orden', 'Orden de posiciones en una clase de mat',
      `<div class="dg-orden">${pasos.map(([id, t], i) => `<div class="dg-paso">${P[id] ? FIGURA.svgEstatico(P[id], 0) : ''}<b>${i + 1}. ${t}</b></div>`).join('<span class="dg-sig">→</span>')}</div>`,
      'Orden aproximado de las secuencias de muestra (Mat 1, págs. 65–67).');
  }

  const POR_SECCION = {
    'm1-s2': [tresNiveles], 'm1-s3': [planos], 'm1-s4': [plomada, frente], 'm1-s5': [columna, rodillas, pies, escapulas],
    'm1-s6': [cruzados], 'm1-s7': [pelvis], 'm1-s8': [aprendizaje], 'mat1-s4': [ordenClase]
  };
  function deSeccion(id) {
    return (POR_SECCION[id] || []).map(fn => { try { return fn(); } catch (e) { return ''; } }).join('');
  }

  /* interacción: botones, deslizador y puntos que se tocan */
  function conectar(cont) {
    $$('.diag', cont).forEach(d => {
      const tipo = d.dataset.diag, lienzo = $('.dg-lienzo', d), cap = $('.dg-cap', d);
      const pintar = op => {
        if (tipo === 'plomada') { lienzo.innerHTML = svgPlomada(op); cap.innerHTML = PLOMADA[op][1] + ' Tocá un número para ver su nombre.'; }
        if (tipo === 'frente') { lienzo.innerHTML = svgFrente(op); cap.textContent = op === 'horiz' ? 'Cada línea compara izquierda y derecha: deberían quedar a la misma altura. Tocá una.' : 'Tocá un punto para ver su nombre.'; }
        if (tipo === 'columna') { lienzo.innerHTML = svgColumna(op); cap.textContent = CURVAS[op].txt; }
        if (tipo === 'rodillas') { lienzo.innerHTML = svgRodillas(op); cap.textContent = TXT_ROD[op]; }
        if (tipo === 'cruz') { lienzo.innerHTML = svgCruz(op); cap.textContent = CRUZ[op].txt; }
        if (tipo === 'pelvis') { const g = +op; lienzo.innerHTML = svgPelvis(g); cap.innerHTML = estadoPelvis(g); const s = $('.dg-slider', d); if (s) s.value = g; }
        puntos();
      };
      const puntos = () => $$('.dg-pto', d).forEach(p => {
        const mostrar = () => { $$('.dg-pto.on', d).forEach(x => x.classList.remove('on')); p.classList.add('on'); if (cap) cap.textContent = p.dataset.nombre; SND.toque(); };
        p.onclick = mostrar;
        p.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); mostrar(); } };
      });
      $$('.diag-bot [data-op]', d).forEach(b => b.onclick = () => {
        $$('.diag-bot .on', d).forEach(x => x.classList.remove('on'));
        b.classList.add('on');
        pintar(b.dataset.op);
        SND.toque();
      });
      const sl = $('.dg-slider', d);
      if (sl) sl.oninput = () => {
        const g = +sl.value;
        lienzo.innerHTML = svgPelvis(g); cap.innerHTML = estadoPelvis(g);
        $$('.diag-bot .on', d).forEach(x => x.classList.remove('on'));
      };
      puntos();
    });
  }

  return { deSeccion, conectar };
})();
