/* ============================================================
   Pilates Lab — figura articulada (v3)

   Maniquí 2D con cinemática directa + inversa y apoyos en el piso.

   Movimiento (v3):
     · Velocidad de "mínimo jerk" (Flash y Hogan, 1985): así acelera y
       frena un movimiento humano voluntario, sin arranques bruscos.
     · Articulación segmentaria: al despegar la columna del piso (Roll Up,
       Teaser, Roll Over, puentes) o al flexionarla sentado/de pie, los
       4 segmentos y el cuello se mueven de a uno, "vértebra por vértebra",
       en el orden que corresponde (ver articulacion()).
     · Brazos y piernas se interpolan en el espacio de la articulación
       (ángulo del hombro respecto del tórax, de la cadera respecto de la
       pelvis), dentro del rango anatómico: acompañan al tronco y nunca
       giran "por el lado imposible".
     · Rodar (rueda): sin deslizar. La cadera avanza h·Δθ, con h su altura
       sobre el punto de contacto (el piso es el centro instantáneo de
       rotación).
     · Centro de masa con las fracciones de Winter (2009) por segmento:
       validar() controla que en las poses de equilibrio caiga sobre la
       base de apoyo, y el reproductor puede mostrarlo con su plomada.

   POSE (ángulos en grados; 0 = derecha, 90 = abajo, -90 = arriba):
     tr   dirección del tronco (de la cadera a los hombros)
     fl   flexión de la columna (+ se enrolla hacia adelante, − extensión),
          repartida en 4 segmentos: así se ve la curva en C
     cab  flexión del cuello (+ mentón al pecho)
     bc/bl  brazo cercano / lejano: [brazo (absoluto), flexión de codo ≥ 0, muñeca]
     pc/pl  pierna cercana / lejana: [muslo (absoluto), flexión de rodilla ≥ 0,
            tobillo: 0 = pie a 90° de la pierna, + en punta, − flexionado]
     apoyo  lo que toca el piso: pelvis, tronco, espalda, hombros, cabeza,
            pieC/pieL (planta), talonC/L, puntaC/L, manoC/L, rodillaC/L, antebrazoC/L
     ik     agarres: { bc: 'tobilloC' | 'rodillaL' | 'nuca' | 'pelvis' … , bl: … }
     k      escorzos: { bc:[..], bl, pc, pl, ancho }   g giro de cabeza (de frente)
     s      paso de la secuencia   dx  corrimiento (rodar)   dur  duración
   Convención: supino con la cabeza a la izquierda; prono con la cabeza a la
   derecha; de pie mirando a la derecha. La rodilla siempre flexiona hacia
   atrás y el codo hacia adelante (los ángulos relativos lo garantizan).

   Entre dos poses, lo que está apoyado en ambas queda CLAVADO en su lugar
   (las piernas o brazos se resuelven con cinemática inversa), así nada
   flota, atraviesa el piso ni patina.
   ============================================================ */
'use strict';

const FIGURA = (() => {
  const W = 320, H = 200, PISO = 180;
  /* sentada vista de frente con perspectiva: la pelvis apoya a mitad del mat */
  const PISO_P = PISO - 14;
  /* proporciones antropométricas (fracción de la altura, Drillis y Contini),
     para una figura de ~154 de alto: cadera→hombro 0,29 · brazo 0,19 ·
     antebrazo 0,15 · muslo 0,25 · pierna 0,25 · cabeza 0,13 */
  const LC = [11, 10, 11.5, 11.5];                  // columna: lumbar baja, lumbar alta, torácica baja, torácica alta
  const L = { cuello: 17, brazo: 29, ante: 22.5, mano: 9, muslo: 38, pierna: 38, pie: 14, talon: 4 };
  const R = { perfil: [10, 9.5, 9.5, 10, 10], frente: [15, 11.5, 10.5, 13, 15], cabeza: 9.5 };
  const RPIE = 2.6, RMANO = 2.3, RROD = 5.2, RCODO = 3.4;
  const rad = g => g * Math.PI / 180, grad = r => r * 180 / Math.PI;
  const pol = (p, a, l) => ({ x: p.x + Math.cos(rad(a)) * l, y: p.y + Math.sin(rad(a)) * l });
  const f1 = n => (+n).toFixed(1);
  const lerp = (a, b, f) => a + (b - a) * f;
  const lerpAng = (a, b, f) => { const d = ((b - a + 540) % 360) - 180; return a + d * f; };
  /* abducción de un miembro (ver profundidad): un número (todo el miembro) o [brazo o muslo,
     antebrazo o pierna]; en grados, entre −80 y 80 */
  const abDe = (ab, k) => { const v = (ab || {})[k]; if (v == null) return null; const c = x => Math.max(-80, Math.min(80, x || 0)); return Array.isArray(v) ? [c(v[0]), c(v[1])] : [c(v), c(v)]; };
  const RIGIDOS = ['pelvis', 'tronco', 'espalda', 'hombros', 'cabeza'];
  const UNIHUESO = /^(rodilla|antebrazo)[CL]$/;     // se resuelven girando un solo hueso
  const EXTREMO = /^(pie|talon|punta|mano)[CL]$/;   // se resuelven con cinemática inversa

  /* ---------- pose con valores por defecto ---------- */
  function completa(P) {
    return {
      tr: -90, fl: 0, cab: 0, bc: [90, 0, 0], bl: [90, 0, 0], pc: [90, 0, 0], pl: [90, 0, 0],
      apoyo: [], ik: {}, k: {}, g: 0, dx: 0, ...P, ab: { ...(P.ab || {}) },
      bc: [...(P.bc || [90, 0, 0])], bl: [...(P.bl || [90, 0, 0])], pc: [...(P.pc || [90, 0, 0])], pl: [...(P.pl || [90, 0, 0])]
    };
  }

  /* ---------- cinemática directa ---------- */
  function esqueleto(P, vista) {
    const k = P.k || {};
    const esc = (lado, i) => (k[lado] && k[lado][i] != null ? k[lado][i] : 1);
    const fr = vista === 'frente', anch = k.ancho != null ? k.ancho : 1;
    /* k.tronco < 1: el tronco se ve en escorzo (por ejemplo, sentado visto desde arriba) */
    const kt = k.tronco != null ? k.tronco : 1;
    const Hc = { x: 0, y: 0 }, col = [Hc], angs = [];
    for (let i = 0; i < 4; i++) {
      /* segs: ángulo de cada segmento ya resuelto (transiciones articuladas) */
      const a = P.segs ? P.segs[i] : P.tr + P.fl * (P.cur ? P.cur[i] : (i + 0.5) / 4 - 0.5);
      angs.push(a); col.push(pol(col[i], a, LC[i] * kt));
    }
    const S = col[4], aTop = angs[3], aCue = aTop + P.cab;
    const C = pol(S, aCue, L.cuello * kt);
    const lat = { x: Math.cos(rad(P.tr - 90)), y: Math.sin(rad(P.tr - 90)) };
    const off = (p, d) => ({ x: p.x + lat.x * d, y: p.y + lat.y * d });
    /* rot: rotación axial del tórax sobre la pelvis quieta (sentado visto desde
       arriba, Spine Twist, Saw): gira la línea de los hombros, no la de las caderas */
    const latH = P.rot ? { x: Math.cos(rad(P.tr - 90 + P.rot)), y: Math.sin(rad(P.tr - 90 + P.rot)) } : lat;
    const offH = (p, d) => ({ x: p.x + latH.x * d, y: p.y + latH.y * d });
    const hombro = pol(S, aTop + 180, 3.5);
    const E = {
      vista, fr, anch, kt, g: P.g || 0, rot: P.rot || 0, latH, col, angs, S, C, H: Hc, aTop, aCue,
      ant: { x: Math.cos(rad(aTop + 90)), y: Math.sin(rad(aTop + 90)) },
      antCab: { x: Math.cos(rad(aCue + 90)), y: Math.sin(rad(aCue + 90)) },
      arriba: { x: Math.cos(rad(aCue)), y: Math.sin(rad(aCue)) },
      lat, esc,
      hom: { bc: fr ? offH(hombro, 14 * anch) : hombro, bl: fr ? offH(hombro, -14 * anch) : hombro },
      cad: { pc: fr ? off(Hc, 8 * anch) : Hc, pl: fr ? off(Hc, -8 * anch) : Hc },
      seg: {}
    };
    /* ab: el miembro sale de su plano (abducción, ver profundidad): de perfil se ve más corto */
    const ab = fr ? {} : (P.ab || {}), cab = (m, q) => { const a = abDe(ab, m); return a ? Math.cos(rad(a[q])) : 1; };
    E.ab = { ...ab };
    for (const b of ['bc', 'bl']) E.seg[b] = brazoFK(E.hom[b], P[b], [esc(b, 0) * cab(b, 0), esc(b, 1) * cab(b, 1), esc(b, 2)]);
    for (const p of ['pc', 'pl']) E.seg[p] = piernaFK(E.cad[p], P[p], [esc(p, 0) * cab(p, 0), esc(p, 1) * cab(p, 1), esc(p, 2)]);
    return E;
  }
  function brazoFK(h, [a0, flex, mun = 0], e) {
    const codo = pol(h, a0, L.brazo * e[0]), aA = a0 - flex;
    const muneca = pol(codo, aA, L.ante * e[1]), mano = pol(muneca, aA + mun, L.mano * e[2]);
    return { raiz: h, codo, muneca, mano, a0, aA, aM: aA + mun, e };
  }
  function piernaFK(c, [a0, flex, tob = 0], e) {
    const rod = pol(c, a0, L.muslo * e[0]), aP = a0 + flex;
    const tobillo = pol(rod, aP, L.pierna * e[1]), aPie = aP - 90 + tob;
    return { raiz: c, rod, tobillo, punta: pol(tobillo, aPie, L.pie * e[2]), talon: pol(tobillo, aPie + 180, L.talon * e[2]), a0, aP, aPie, e };
  }

  /* ---------- cinemática inversa (dos huesos) ----------
     s = +1 rodilla (el 2.º hueso gira en sentido positivo), −1 codo */
  function ik2(raiz, T, l1, l2, s) {
    const dx = T.x - raiz.x, dy = T.y - raiz.y;
    let d = Math.hypot(dx, dy);
    const alcanza = d <= l1 + l2 + 1.2;
    d = Math.min(l1 + l2 - 0.001, Math.max(Math.abs(l1 - l2) + 0.001, d));
    const phi = grad(Math.atan2(dy, dx));
    const a = grad(Math.acos(Math.max(-1, Math.min(1, (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d)))));
    const g = grad(Math.acos(Math.max(-1, Math.min(1, (l1 * l1 + l2 * l2 - d * d) / (2 * l1 * l2)))));
    const flex = 180 - g, a1 = phi - s * a;
    return { a1, flex, alcanza };
  }
  /* lleva el extremo de un miembro a un punto; de frente, escorza en vez de doblar */
  function ubicarMiembro(E, clave, T, P, piso = Infinity) {
    const esPierna = clave[0] === 'p', m = E.seg[clave], e = m.e;
    const l1 = (esPierna ? L.muslo : L.brazo) * e[0], l2 = (esPierna ? L.pierna : L.ante) * e[1];
    const recto = () => {
      const d = Math.hypot(T.x - m.raiz.x, T.y - m.raiz.y), a = grad(Math.atan2(T.y - m.raiz.y, T.x - m.raiz.x));
      const k = Math.min(1, d / (l1 + l2)), e2 = [e[0] * k, e[1] * k, e[2]];
      E.seg[clave] = esPierna ? piernaFK(m.raiz, [a, 0, P[clave][2]], e2) : brazoFK(m.raiz, [a, 0, P[clave][2]], e2);
      return d <= l1 + l2 + 0.6;
    };
    if (E.fr) {
      const d = Math.hypot(T.x - m.raiz.x, T.y - m.raiz.y), a = grad(Math.atan2(T.y - m.raiz.y, T.x - m.raiz.x));
      const k = Math.min(1.08, d / (l1 + l2));
      const ang = esPierna ? [a, 0, P[clave][2]] : [a, 0, P[clave][2]];
      const e2 = [e[0] * k, e[1] * k, e[2]];
      E.seg[clave] = esPierna ? piernaFK(m.raiz, ang, e2) : brazoFK(m.raiz, ang, e2);
      return d <= (l1 + l2) * 1.08 + 0.05;
    }
    const r = ik2(m.raiz, T, l1, l2, esPierna ? 1 : -1);
    const ang = [r.a1, r.flex, P[clave][2]];
    E.seg[clave] = esPierna ? piernaFK(m.raiz, ang, e) : brazoFK(m.raiz, ang, e);
    /* si el codo (o la rodilla) atravesaría el piso, en la realidad sale
       hacia el costado: de perfil se ve como un miembro más corto */
    const medio = esPierna ? E.seg[clave].rod : E.seg[clave].codo;
    if (medio.y + (esPierna ? RROD : RCODO) > piso + 0.5) return recto();
    return r.alcanza;
  }

  /* ---------- puntos de referencia del cuerpo ---------- */
  function radios(E) { return E.fr ? R.frente.map(r => r * E.anch) : R.perfil; }
  function marca(E, nombre) {
    const lado = nombre.slice(-1) === 'C' ? 'c' : 'l', b = E.seg['b' + lado], p = E.seg['p' + lado];
    const post = { x: -E.ant.x, y: -E.ant.y };
    switch (nombre.slice(0, -1)) {
      case 'tobillo': return p.tobillo;
      case 'rodilla': return p.rod;
      case 'pantorrilla': return { x: lerp(p.rod.x, p.tobillo.x, 0.45), y: lerp(p.rod.y, p.tobillo.y, 0.45) };
      case 'muslo': return { x: lerp(p.raiz.x, p.rod.x, 0.7), y: lerp(p.raiz.y, p.rod.y, 0.7) };
      case 'pie': return p.punta;
      case 'mano': return b.muneca;
    }
    if (nombre === 'nuca') return { x: E.C.x - E.antCab.x * 4.5 - E.arriba.x * 1, y: E.C.y - E.antCab.y * 4.5 - E.arriba.y * 1 };
    if (nombre === 'pelvis') { const ap = { x: Math.cos(rad(E.angs[0] + 90)), y: Math.sin(rad(E.angs[0] + 90)) }; return { x: E.H.x - ap.x * 11, y: E.H.y - ap.y * 11 }; }
    if (nombre === 'sien') return { x: E.C.x + E.lat.x * 8, y: E.C.y + E.lat.y * 8 };
    if (nombre === 'cintura') return { x: E.col[2].x + post.x * 9, y: E.col[2].y + post.y * 9 };
    return E.H;
  }
  /* punto de contacto con el piso de cada apoyo */
  function contactoDe(E, nombre) {
    const rr = radios(E), abajo = (p, r) => ({ x: p.x, y: p.y + r });
    const menor = arr => arr.reduce((m, p) => (p.y > m.y ? p : m));
    switch (nombre) {
      case 'pelvis': return abajo(E.H, rr[0]);
      case 'tronco': return menor(E.col.map((p, i) => abajo(p, rr[i])));
      case 'espalda': return menor([abajo(E.col[2], rr[2]), abajo(E.col[3], rr[3])]);
      case 'hombros': return menor([abajo(E.col[3], rr[3]), abajo(E.col[4], rr[4])]);
      case 'cabeza': return abajo(E.C, R.cabeza);
    }
    const lado = nombre.slice(-1) === 'C' ? 'c' : 'l', b = E.seg['b' + lado], p = E.seg['p' + lado];
    switch (nombre.slice(0, -1)) {
      /* la planta apoyada queda plana: el tobillo va a RPIE del piso. Antes se medía el pie
         inclinado como venía en la pose; al aplanarlo bajaba el tobillo y la pierna recta no
         llegaba al apoyo clavado (el pie patinaba) */
      case 'pie': return { x: p.tobillo.x, y: p.tobillo.y + RPIE };
      case 'talon': return abajo(p.talon, RPIE);
      case 'punta': return abajo(p.punta, RPIE * 0.7);
      case 'mano': return { x: b.muneca.x, y: Math.max(b.muneca.y + RMANO, b.mano.y + RMANO * 0.9) };
      case 'rodilla': return abajo(p.rod, RROD);
      case 'antebrazo': return menor([abajo(b.codo, RCODO), abajo(b.muneca, RMANO)]);
    }
    return E.H;
  }
  const miembroDe = nombre => (/^(pie|talon|punta|rodilla)/.test(nombre) ? 'p' : 'b') + (nombre.slice(-1) === 'C' ? 'c' : 'l');

  /* todos los puntos del borde del cuerpo (para piso, encuadre y control) */
  function contorno(E, excluir = new Set()) {
    const pts = [], rr = radios(E);
    let parte = '';
    const add = (p, r) => pts.push({ x: p.x, y: p.y + r, p: parte }, { x: p.x - r, y: p.y, p: parte }, { x: p.x + r, y: p.y, p: parte }, { x: p.x, y: p.y - r, p: parte });
    const lin = (a, b, r0, r1, n = 4) => { for (let i = 0; i <= n; i++) { const f = i / n; add({ x: lerp(a.x, b.x, f), y: lerp(a.y, b.y, f) }, lerp(r0, r1, f)); } };
    for (let i = 0; i < 4; i++) { parte = ['pelvis', 'lumbar', 'dorsal', 'hombros'][i]; lin(E.col[i], E.col[i + 1], rr[i], rr[i + 1], 3); }
    parte = 'cabeza'; add(E.C, R.cabeza);
    for (const k of ['bc', 'bl']) if (!excluir.has(k)) { const m = E.seg[k]; parte = k + '.brazo'; lin(m.raiz, m.codo, 4.2, 3.4); parte = k + '.antebrazo'; lin(m.codo, m.muneca, 3.3, 2.5); parte = k + '.mano'; lin(m.muneca, m.mano, RMANO, 2); }
    for (const k of ['pc', 'pl']) if (!excluir.has(k)) { const m = E.seg[k]; parte = k + '.muslo'; lin(m.raiz, m.rod, 7, RROD); parte = k + '.pierna'; lin(m.rod, m.tobillo, RROD, 3.4); parte = k + '.pie'; lin(m.talon, m.punta, RPIE, 1.8); }
    return pts;
  }
  function mover(E, dx, dy) {
    const m = p => ({ x: p.x + dx, y: p.y + dy });
    const o = { ...E, col: E.col.map(m), S: m(E.S), C: m(E.C), H: m(E.H), hom: { bc: m(E.hom.bc), bl: m(E.hom.bl) }, cad: { pc: m(E.cad.pc), pl: m(E.cad.pl) }, seg: {} };
    for (const k in E.seg) { const s = E.seg[k], t = { ...s }; for (const q of ['raiz', 'codo', 'muneca', 'mano', 'rod', 'tobillo', 'punta', 'talon']) if (s[q]) t[q] = m(s[q]); o.seg[k] = t; }
    return o;
  }

  /* ---------- resolver una pose en el mundo ----------
     pins: { apoyo: x } posiciones fijas; xoff: corrimiento si no hay pin rígido */
  function resolver(P, ej, { pins = {}, xoff = 0, forzados = null, ancla = null, cambian = [] } = {}) {
    const avisos = [];
    let E = esqueleto(P, ej.vista);
    const agarres = Object.entries(P.ik || {});
    if (ej.camara === 'arriba') {
      for (const [b, destino] of agarres) if (!ubicarMiembro(E, b, marca(E, destino), P)) avisos.push(`${b} no llega a ${destino}`);
      return { E: mover(E, -E.H.x + xoff, 0), avisos, contactos: {}, dx: xoff, dy: 0 };
    }
    const ap = forzados || P.apoyo || [];
    const rig = ap.filter(n => RIGIDOS.includes(n) || UNIHUESO.test(n));
    const ext = ap.filter(n => EXTREMO.test(n));
    /* 1. altura. Los miembros que se resuelven solos (apoyos con IK, un
       hueso, agarres) no la deciden. */
    const excl = new Set([...ext, ...rig.filter(n => UNIHUESO.test(n))].map(miembroDe));
    for (const [b] of agarres) excl.add(b);
    /* sentado visto de frente: las piernas vienen hacia quien mira, delante del mat */
    if (ej.persp) { excl.add('pc'); excl.add('pl'); }
    const piso = ej.persp ? PISO_P : PISO;
    const dyCuerpo = piso - Math.max(...contorno(E, excl).map(p => p.y));
    let dy;
    const tronco = rig.filter(n => RIGIDOS.includes(n)), uni = rig.filter(n => UNIHUESO.test(n));
    if (forzados && tronco.length && !ej.persp) {
      /* en una transición, lo que sigue apoyado (pelvis, espalda, hombros) queda
         en el piso; un brazo o una pierna que bajara de más choca con el piso
         (se corrige abajo) en vez de levantar todo el cuerpo */
      const sinMiembros = contorno(E, new Set(['bc', 'bl', 'pc', 'pl']));
      dy = Math.min(piso - Math.max(...tronco.map(n => contactoDe(E, n).y)), piso - Math.max(...sinMiembros.map(p => p.y)));
    } else if (!tronco.length && uni.length) {
      /* en rodillas o sobre los antebrazos: el muslo (o el brazo) llega vertical al piso */
      dy = Math.min(dyCuerpo, ...uni.map(n => {
        const m = E.seg[miembroDe(n)], pierna = n.startsWith('rodilla');
        return PISO - (m.raiz.y + (pierna ? L.muslo : L.brazo) * m.e[0] * 0.98 + (pierna ? RROD : RCODO));
      }));
    } else if (rig.length) dy = dyCuerpo;
    else if (ext.length) {
      /* apoyado en pies o manos: la altura la dan los pies (las manos se
         acomodan doblando los codos), sin que el tronco atraviese el piso */
      const pies = ext.filter(n => /^(pie|talon|punta)/.test(n)), base = pies.length ? pies : ext;
      /* en una transición, un brazo que llega al piso antes de tiempo se apoya
         (paso 6) en vez de levantar todo el cuerpo */
      const dyT = forzados && !ej.persp ? piso - Math.max(...contorno(E, new Set(['bc', 'bl', 'pc', 'pl'])).map(p => p.y)) : dyCuerpo;
      dy = Math.min(PISO - Math.max(...base.map(n => contactoDe(E, n).y)), dyT);
    } else dy = dyCuerpo;
    /* 2. corrimiento horizontal: un apoyo rígido clavado manda */
    let dx = ancla ? ancla.x - anclaX(E, ej.ancla) : xoff;
    const pinR = rig.find(n => pins[n] != null);
    if (pinR) dx = pins[pinR] - contactoDe(E, pinR).x;
    /* anclado en el pie (o la mano) que sigue apoyado: ese apoyo clavado decide el
       corrimiento; si lo decidía el tobillo, al doblarse la pierna el pie patinaba */
    else if (ej.ancla === 'pie' || ej.ancla === 'mano') {
      const pinA = ap.find(n => (ej.ancla === 'pie' ? /^(pie|talon|punta)C$/ : /^manoC$/).test(n) && pins[n] != null);
      if (pinA) dx = pins[pinA] - contactoDe(E, pinA).x;
    }
    E = mover(E, dx, dy);
    /* 3. rodilla / antebrazo en el piso */
    for (const n of rig.filter(n => UNIHUESO.test(n))) unHueso(E, n, P);
    /* apoyar la rodilla (o el antebrazo) gira el muslo y la corre: si es el apoyo clavado,
       se vuelve a poner en su lugar (antes el cuerpo se iba corriendo de pose en pose) */
    if (pinR && UNIHUESO.test(pinR)) E = mover(E, pins[pinR] - contactoDe(E, pinR).x, 0);
    /* 4. extremos apoyados: cinemática inversa hasta el piso (y al pin) */
    for (const n of ext) {
      const clave = miembroDe(n), cont = contactoDe(E, n);
      const x = pins[n] != null ? pins[n] : cont.x;
      apoyarExtremo(E, n, clave, x, P, piso);
      const falta = Math.abs(contactoDe(E, n).y - piso);
      if (falta > 1.2) avisos.push(`${n} no llega al piso (${falta.toFixed(1)})`);
    }
    /* 5. agarres (manos a tobillos, nuca, pelvis), sin atravesar el piso */
    for (const [b, destino] of agarres) {
      const T = marca(E, destino), m = E.seg[b];
      const falta = Math.hypot(T.x - m.raiz.x, T.y - m.raiz.y) - (L.brazo * m.e[0] + L.ante * m.e[1]);
      ubicarMiembro(E, b, T, P, piso);
      if (falta > 2.5) avisos.push(`${b} no llega a ${destino} (faltan ${falta.toFixed(1)})`);
    }
    /* 6. los miembros libres no atraviesan el piso: se apoyan en él */
    if (ej.camara !== 'arriba' && !ej.persp) {
      const usados = new Set([...excl, ...rig.filter(n => UNIHUESO.test(n)).map(miembroDe)]);
      for (const k of ['bc', 'bl', 'pc', 'pl']) {
        if (usados.has(k)) continue;
        /* la mano o el pie que se apoya (o despega) en esta transición: al llegar
           al piso se queda ahí y dobla el codo o la rodilla, como en un apoyo real */
        const n = cambian.find(a => miembroDe(a) === k);
        if (n && bajoMiembro(E, k) > piso + 0.3) apoyarExtremo(E, n, k, contactoDe(E, n).x, P, piso);
        chocar(E, k, P, piso);
      }
    }
    const contactos = {};
    for (const n of ap) contactos[n] = contactoDe(E, n);
    /* miembros con la mano o el pie apoyados o agarrados (para la profundidad 3D) */
    E.sujetos = {};
    for (const n of ap) if (EXTREMO.test(n) || UNIHUESO.test(n)) E.sujetos[miembroDe(n)] = true;
    for (const [b] of agarres) E.sujetos[b] = true;
    return { E, avisos, contactos, dx, dy };
  }
  /* parte más baja de un miembro */
  function bajoMiembro(E, k) {
    const m = E.seg[k], pts = [];
    const lin = (a, b, r0, r1) => { for (let q = 0; q <= 4; q++) { const t = q / 4; pts.push(lerp(a.y, b.y, t) + lerp(r0, r1, t)); } };
    if (k[0] === 'b') { lin(m.raiz, m.codo, 4.2, 3.4); lin(m.codo, m.muneca, 3.3, 2.5); lin(m.muneca, m.mano, RMANO, 2); }
    else { lin(m.raiz, m.rod, 7, RROD); lin(m.rod, m.tobillo, RROD, 3.4); lin(m.talon, m.punta, RPIE, 1.8); }
    return Math.max(...pts);
  }
  /* si un miembro libre atraviesa el piso, gira desde la raíz lo mínimo para apoyarse */
  function chocar(E, k, P, piso) {
    if (bajoMiembro(E, k) <= piso + 0.3) return;
    const m = E.seg[k], esPierna = k[0] === 'p';
    const fk = a0 => esPierna ? piernaFK(m.raiz, [a0, m.aP - m.a0, m.aPie - m.aP + 90], m.e) : brazoFK(m.raiz, [a0, m.a0 - m.aA, m.aM - m.aA], m.e);
    for (let d = 1; d <= 120; d += 1) for (const sg of [1, -1]) {
      const prueba = fk(m.a0 + sg * d), antes = E.seg[k];
      E.seg[k] = prueba;
      if (bajoMiembro(E, k) <= piso + 0.3) return;
      E.seg[k] = antes;
    }
  }
  function unHueso(E, n, P) {
    const clave = miembroDe(n), m = E.seg[clave], esPierna = clave[0] === 'p';
    const l1 = (esPierna ? L.muslo : L.brazo) * m.e[0], r = esPierna ? RROD : RCODO;
    const yObj = PISO - r, dyv = yObj - m.raiz.y;
    if (Math.abs(dyv) > l1) return;
    const s = grad(Math.asin(dyv / l1)), c1 = s, c2 = 180 - s;
    const cerca = (a, b) => Math.abs(((a - b + 540) % 360) - 180);
    const a0 = cerca(c1, m.a0) < cerca(c2, m.a0) ? c1 : c2;
    const codo = pol(m.raiz, a0, l1);
    if (esPierna) {
      /* la rodilla apoya; la pierna conserva su flexión (en 4 puntos queda en el piso, en una patada sube) */
      E.seg[clave] = piernaFK(m.raiz, [a0, P[clave][1], P[clave][2]], m.e);
    } else {
      /* sobre el antebrazo: del codo (su relieve en el piso) baja apenas hasta la muñeca,
         que queda a la altura de la mano apoyada, y la mano sigue plana en el mat
         (antes el antebrazo iba a la altura del codo y la mano caía al piso: muñeca "quebrada") */
      const haciaX = Math.cos(rad(m.aA)) >= 0 ? 0 : 180;
      const baja = grad(Math.asin(Math.max(0, Math.min(0.3, (RCODO - RMANO) / (L.ante * m.e[1])))));
      const aAnte = haciaX === 0 ? baja : 180 - baja;
      const flex = ((a0 - aAnte + 540) % 360) - 180;
      E.seg[clave] = brazoFK(m.raiz, [a0, flex, haciaX - aAnte], m.e);
    }
    void codo;
  }
  function apoyarExtremo(E, n, clave, x, P, PISO) {
    const tipo = n.slice(0, -1), esPierna = clave[0] === 'p';
    let ok = true;
    for (let it = 0; it < 4; it++) {
      const m = E.seg[clave];
      let T;
      if (tipo === 'pie') {
        /* planta en el piso: tobillo a la altura justa y pie horizontal */
        const sentido = Math.cos(rad(m.aPie)) >= 0 ? 0 : 180;
        T = { x, y: PISO - RPIE };
        ok = ubicarMiembro(E, clave, T, P, PISO);
        const m2 = E.seg[clave];
        E.seg[clave] = piernaFK(m2.raiz, [m2.a0, m2.aP - m2.a0, sentido - m2.aP + 90], m2.e);
        break;
      }
      if (tipo === 'mano') {
        T = { x, y: PISO - RMANO };
        ok = ubicarMiembro(E, clave, T, P, PISO);
        /* hacia dónde apuntan los dedos: lo dice la pose (dedos: 0 = a la derecha, 180 = a la
           izquierda, o { bc, bl }); si no, la dirección de la mano, y con el antebrazo casi
           vertical, a la derecha (en la app: hacia la cabeza en prono y plancha, hacia los
           pies en supino y sentado). Antes, con el brazo a 90° y 91°, una mano miraba para
           cada lado. */
        const m2 = E.seg[clave], c = Math.cos(rad(m2.aM)), dd = P.dedos == null ? null : typeof P.dedos === 'object' ? P.dedos[clave] : P.dedos;
        const sentido = dd != null ? dd : Math.abs(c) < 0.4 ? 0 : c >= 0 ? 0 : 180;
        E.seg[clave] = brazoFK(m2.raiz, [m2.a0, m2.a0 - m2.aA, sentido - m2.aA], m2.e);
        break;
      }
      /* talón o punta: el pie conserva su orientación en el espacio (la de la pose) y
         el tobillo va donde ese punto toca; así la rodilla no se dobla de a poco en
         cada vuelta (al doblarla giraba el pie y el blanco se acercaba otra vez) */
      const r = tipo === 'talon' ? RPIE : RPIE * 0.7, e2 = m.e[2];
      const probar = aPie => {
        const off = tipo === 'talon' ? pol({ x: 0, y: 0 }, aPie + 180, L.talon * e2) : pol({ x: 0, y: 0 }, aPie, L.pie * e2);
        const okI = ubicarMiembro(E, clave, { x: x - off.x, y: PISO - r - off.y }, P, PISO);
        const m2 = E.seg[clave];
        E.seg[clave] = piernaFK(m2.raiz, [m2.a0, m2.aP - m2.a0, aPie - m2.aP + 90], m2.e);
        const q = E.seg[clave];
        return { okI, limpio: Math.max(q.talon.y + RPIE, q.punta.y + 1.8) <= PISO + 0.3 };
      };
      /* si el resto del pie quedaría bajo el piso, el pie gira lo mínimo sobre ese punto */
      let res = probar(m.aPie);
      for (let d = 2; d <= 40 && !res.limpio; d += 2) for (const sg of [1, -1]) { res = probar(m.aPie + sg * d); if (res.limpio) break; }
      if (!res.limpio) res = probar(m.aPie);
      ok = res.okI;
      break;
    }
    void esPierna;
    return ok;
  }

  /* ---------- ejercicio: disposición de las poses clave ----------
     Cada pose clave se resuelve en orden: lo que comparte con la anterior
     queda en el mismo lugar. La solución (con la cinemática inversa ya
     aplicada) se guarda en ángulos, para que las transiciones terminen
     exactamente en el apoyo, sin saltos. */
  const n180 = a => ((a + 540) % 360) - 180;
  function hornear(P, E) {
    const Q = { ...P, k: { ...(P.k || {}) } };
    /* el escorzo k se guarda sin el acortamiento de la abducción (ab), que se aplica aparte */
    const cab = (m, q) => { const a = E.fr ? null : abDe(P.ab, m); return a ? Math.cos(rad(a[q])) : 1; };
    for (const b of ['bc', 'bl']) { const m = E.seg[b]; Q[b] = [m.a0, n180(m.a0 - m.aA), n180(m.aM - m.aA)]; Q.k[b] = [m.e[0] / cab(b, 0), m.e[1] / cab(b, 1), m.e[2]]; }
    for (const p of ['pc', 'pl']) { const m = E.seg[p]; Q[p] = [m.a0, n180(m.aP - m.a0), n180(m.aPie - m.aP + 90)]; Q.k[p] = [m.e[0] / cab(p, 0), m.e[1] / cab(p, 1), m.e[2]]; }
    return Q;
  }
  const anclaX = (E, nombre) => (nombre === 'pie' ? E.seg.pc.tobillo.x : nombre === 'mano' ? E.seg.bc.muneca.x : nombre === 'S' ? E.S.x : E.H.x);
  const compartidos = (ej, A, B) => ej.rueda ? [] : (A.apoyo || []).filter(a => (B.apoyo || []).includes(a) && !(B.libre || []).includes(a));

  /* ---------- tiempo y articulación ---------- */
  /* perfil de velocidad de mínimo jerk: arranca y frena con aceleración nula */
  const mj = t => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * t * (10 + t * (6 * t - 15)));
  /* modo fluido: cada canal (segmento de columna, cabeza, cada miembro) sigue una
     curva de Hermite cúbica; [α, β] = velocidad al salir y al llegar, relativa a la
     velocidad media del tramo (1 = constante, 0 = frena en esa pose) */
  const UNO = [1, 1];
  const herm = (x, [a, b]) => { x = x <= 0 ? 0 : x >= 1 ? 1 : x; const x2 = x * x, x3 = x2 * x; return 3 * x2 - 2 * x3 + a * (x3 - 2 * x2 + x) + b * (x3 - x2); };
  const CUR0 = [-0.375, -0.125, 0.125, 0.375];
  const segAngs = P => (P.cur || CUR0).map(c => P.tr + P.fl * c);
  /* rangos de la articulación (respecto del segmento al que se une; − = flexión):
     el hombro va de ~60° de extensión a ~250° de flexión; la cadera, de ~140 a 220 */
  const VENT = { b: [-250, 110], p: [-220, 140] };
  const enVentana = (a, [lo, hi]) => { while (a < lo) a += 360; while (a >= hi) a -= 360; return a; };
  const tieneTronco = P => (P.apoyo || []).some(a => a === 'tronco' || a === 'espalda');
  const sobreHombros = P => (P.apoyo || []).includes('hombros') && !(P.apoyo || []).includes('pelvis');
  /* Orden en que se mueve la columna entre dos poses:
       +1 desde la cabeza (cuello, torácica alta… lumbar baja)
       −1 desde la pelvis (lumbar baja… cuello)
        0 todo junto
     Con la pelvis como ancla (Roll Up, Teaser, Swan, sentado, de pie):
     al despegar o flexionar va primero la cabeza; al apoyar o enderezar,
     primero la pelvis (se "apila" desde abajo). Con los hombros como ancla
     (Roll Over, puentes, invertidas) es al revés: al subir despega primero
     la pelvis y al bajar se apoya primero la columna alta. */
  function articulacion(ej, A, B) {
    if (B.art != null) return B.art;
    /* lo que se hamaca (meces) se mueve en bloque: si la columna articulara por
       segmentos, la forma cambiaría mientras rueda */
    if (ej.rueda || (A.meces && B.meces) || ej.vista === 'frente' || ej.camara === 'arriba') return 0;
    const hombros = sobreHombros(A) || sobreHombros(B);
    const tA = tieneTronco(A), tB = tieneTronco(B);
    if (tA !== tB) { const despega = tA; return hombros ? (despega ? -1 : 1) : (despega ? 1 : -1); }
    const dfl = Math.abs(B.fl) - Math.abs(A.fl);
    if (Math.abs(dfl) < 15) return 0;
    return hombros ? (dfl > 0 ? -1 : 1) : (dfl > 0 ? 1 : -1);
  }

  function preparar(ej) {
    if (ej._prep) return ej._prep;
    const crudas = ej.poses.map(completa), n = crudas.length, poses = [], K = [];
    for (let i = 0; i < n; i++) {
      const P = crudas[i];
      let xoff, pins = {};
      if (i === 0) {
        const r0 = resolver(P, ej, {});
        xoff = r0.dx - anclaX(r0.E, ej.ancla) + (P.dx || 0);
      } else {
        const prev = K[i - 1], comp = compartidos(ej, poses[i - 1], P);
        for (const a of comp) if (prev.cont[a]) pins[a] = prev.cont[a].x;
        const r0 = resolver(P, ej, { xoff: 0 });
        xoff = anclaX(prev.E, ej.ancla) - anclaX(r0.E, ej.ancla) + r0.dx + (P.dx || 0);
        const ext = comp.find(a => EXTREMO.test(a));
        if (ext && !comp.some(a => RIGIDOS.includes(a) || UNIHUESO.test(a))) xoff = pins[ext] - contactoDe(r0.E, ext).x + r0.dx;
      }
      const r = resolver(P, ej, { xoff, pins });
      poses.push(hornear(P, r.E));
      K.push({ xoff: r.dx, cont: r.contactos, E: r.E, pins });
    }
    for (let i = 0; i < n; i++) K[i].art = n > 1 ? articulacion(ej, poses[i], poses[(i + 1) % n]) : 0;
    ej._prep = { poses, K };
    if ((ej.rueda || poses.some(p => p.meces || p.rueda)) && n > 1) rodar(ej);
    return ej._prep;
  }
  /* Rodar sin deslizar: en cada instante el cuerpo gira alrededor del punto
     que toca el piso, así que la cadera avanza h·Δθ (h = su altura sobre el
     piso). Se integra cada transición y se recolocan las poses clave; lo que
     no cierra en la vuelta al inicio se reparte en la última transición. */
  function rodar(ej) {
    const { poses, K } = ej._prep, n = poses.length, M = 24;
    for (let i = 0; i < n; i++) {
      const A = poses[i], B = poses[(i + 1) % n], tabla = [0];
      /* todo el ejercicio rueda (ej.rueda), las transiciones entre poses que se hamacan o la
         que llega a una pose con rueda: true (rodar hacia atrás por la columna) */
      if (!ej.rueda && !(A.meces && B.meces) && !B.rueda) continue;
      let x = 0, prev = null;
      for (let k = 0; k <= M; k++) {
        const P = mezclar(A, B, k / M, ej, 0), r = resolver(P, ej, { xoff: 0 });
        const h = PISO - r.E.H.y;
        if (prev) { x += (h + prev.h) / 2 * rad(n180(P.tr - prev.tr)); tabla.push(x); }
        prev = { h, tr: P.tr };
      }
      K[i].rueda = tabla;
    }
    /* se recolocan las poses: después de una transición que rueda, la pose queda donde
       llegó rodando; las que siguen sin rodar se corren lo mismo (con sus apoyos clavados) */
    let delta = 0;
    for (let i = 1; i < n; i++) {
      const prev = K[i - 1], nuevo = prev.rueda ? prev.xoff + prev.rueda[M] : K[i].xoff + delta;
      delta = nuevo - K[i].xoff;
      if (!prev.rueda && Math.abs(delta) < 1e-9) continue;
      const pins = Object.fromEntries(Object.entries(K[i].pins || {}).map(([a, v]) => [a, v + delta]));
      K[i].xoff = nuevo; K[i].pins = pins;
      const r = resolver(poses[i], ej, { xoff: nuevo, pins });
      K[i].E = r.E; K[i].cont = r.contactos;
    }
    if (K[n - 1].rueda) K[n - 1].resto = K[0].xoff - K[n - 1].xoff - K[n - 1].rueda[M];
  }
  /* la tabla se muestreó en tiempo con mínimo jerk: se busca por avance (e = mj(f)),
     así sirve igual para el modo fluido (e = f) */
  function xRueda(K, i, e) {
    const t = K[i].rueda, M = t.length - 1;
    let q = 0;
    while (q < M - 1 && mj((q + 1) / M) < e) q++;
    const e0 = mj(q / M), e1 = mj((q + 1) / M), u = e1 > e0 ? Math.max(0, Math.min(1, (e - e0) / (e1 - e0))) : 0;
    return K[i].xoff + lerp(t[q], t[q + 1], u) + (K[i].resto || 0) * e;
  }

  /* Mezcla de dos poses en la fracción de tiempo f (0…1, sin suavizar).
     Por pasos, todo arranca y frena en cada pose (mínimo jerk). En modo fluido
     f avanza parejo por el camino y cada canal usa sus tangentes (tg, de fluidez):
     lo que sigue moviéndose en el tramo siguiente pasa por la pose sin frenar y lo
     que termina ahí desacelera solo. tg.reg, si está, anota cuánto cambia cada canal. */
  function mezclar(A, B, f, ej, art = 0, fluido = false, tg = null) {
    const r = { ...B }, e = fluido ? f : mj(f);
    const ch = (c, d) => { if (tg && tg.reg) tg.reg[c] = d; return (tg && tg[c]) || UNO; };
    const pe = (c, d) => (fluido ? herm(f, ch(c, d)) : e);
    const dTr = n180(B.tr - A.tr), ca = A.cur || CUR0, cb = B.cur || CUR0;
    /* cada segmento (lumbar baja… torácica alta, cuello) arranca con un
       pequeño retraso respecto del anterior y dura el 60 % del tiempo.
       En modo fluido la onda va adelantando o atrasando cada segmento a mitad
       del tramo, sin cambiar la velocidad con la que entra y sale de las poses */
    const D = 0.4, ret = art > 0 ? [4, 3, 2, 1, 0] : art < 0 ? [0, 1, 2, 3, 4] : null;
    const fr = (q, c, d) => fluido ? herm(ret ? f + 0.1 * (2 - ret[q]) * Math.sin(Math.PI * f) ** 2 : f, ch(c, d))
      : ret ? mj((f - ret[q] * D / 4) / (1 - D)) : e;
    r.segs = [0, 1, 2, 3].map(q => { const a = A.tr + A.fl * ca[q], d = dTr + B.fl * cb[q] - A.fl * ca[q]; return a + d * fr(q, 's' + q, d); });
    /* la columna no se enrolla (ni se arquea) más de lo que da un cuerpo: con la
       articulación por segmentos, a mitad de camino la parte de arriba ya giró y la de
       abajo todavía no, y la curva total pasaba los 125°. Se limita respecto del segmento
       de la pelvis (que queda donde está); si las poses piden más, manda la pose */
    const spr = r.segs[3] - r.segs[0], cA = A.fl * (ca[3] - ca[0]), cB = B.fl * (cb[3] - cb[0]);
    const hi = Math.max(118, cA, cB), lo = Math.min(-55, cA, cB);
    if (spr > hi || spr < lo) { const k = (spr > hi ? hi : lo) / spr; r.segs = r.segs.map(v => r.segs[0] + (v - r.segs[0]) * k); }
    r.tr = A.tr + dTr * pe('tr', dTr);
    const efl = pe('fl', B.fl - A.fl);
    r.fl = lerp(A.fl, B.fl, efl);
    r.cur = ca.map((v, q) => lerp(v, cb[q], efl));
    r.cab = lerp(A.cab, B.cab, fr(4, 'cab', B.cab - A.cab));
    const perfil = ej.vista !== 'frente' && ej.camara !== 'arriba';
    const sA = segAngs(A), sB = segAngs(B);
    const libre = (P, k) => !(P.apoyo || []).some(a => (k[0] === 'p' ? /^(pie|talon|punta|rodilla)/ : /^(mano|antebrazo)/).test(a) && a.slice(-1) === (k[1] === 'c' ? 'C' : 'L'));
    /* Inercia (modo fluido): un brazo en el aire que lleva el tronco al moverse arranca
       un poco después que el tronco, lo alcanza y al frenar se pasa apenas y vuelve
       (superposición y continuidad, como un cuerpo real). Solo junto a una parada:
       entre pasos que siguen de largo la velocidad no cambia. */
    const ext = tg && tg._ext, mueveTronco = Math.abs(dTr) > 5 || Math.abs(B.fl - A.fl) > 5 || Math.abs((B.rot || 0) - (A.rot || 0)) > 5;
    const inercia = (e, k) => {
      if (!fluido || !ext || !mueveTronco || k[0] !== 'b' || !libre(A, k) || !libre(B, k)) return e;
      /* retraso cerca del arranque (≈ 6 % del giro) y adelanto al frenar (≈ 8 %): llegan juntos */
      const d = ext[0] ? 0.55 : 0, c = ext[1] ? 1 : 0;
      return e - d * e * (1 - e) ** 3 + c * e ** 4 * (1 - e);
    };
    for (const k of ['bc', 'bl', 'pc', 'pl']) {
      const brazo = k[0] === 'b', q = brazo ? 3 : 0;
      /* un miembro apoyado en las dos poses se mueve en bloque (pie plano, mano en el mat):
         ángulo, flexión y tobillo o muñeca con el mismo avance */
      const bloque = fluido && !libre(A, k) && !libre(B, k);
      /* ángulo del hombro (o la cadera) respecto de su segmento, dentro del rango
         anatómico: decide por qué lado gira el miembro */
      const v = VENT[k[0]], ra = enVentana(A[k][0] - sA[q] - 180, v), rb = enVentana(B[k][0] - sB[q] - 180, v);
      const d1 = B[k][1] - A[k][1], d2 = (B[k][2] || 0) - (A[k][2] || 0);
      const dBloque = (perfil ? rb - ra + n180(sB[q] - sA[q]) : n180(B[k][0] - A[k][0])) || d1 || d2;
      const pk = (c, d) => (bloque ? pe(k + 'b', dBloque) : pe(c, d));
      const resto = [lerp(A[k][1], B[k][1], pk(k + '1', d1)), lerp(A[k][2] || 0, B[k][2] || 0, pk(k + '2', d2))];
      if (!perfil) { let d = n180(B[k][0] - A[k][0]); const g = (B.giro || {})[k]; if (g && Math.sign(d) !== g) d += g * 360; r[k] = [A[k][0] + d * inercia(pk(k, d), k), ...resto]; continue; }
      if (!brazo && art && libre(A, k) && libre(B, k)) {
        /* piernas en el aire mientras la columna articula: viajan con la pelvis
           (Roll Over, Teaser, Jackknife) */
        r[k] = [r.segs[q] + 180 + lerp(ra, rb, pe(k + 'r', rb - ra)), ...resto];
      } else {
        /* el resto se orienta en el espacio (brazos que alcanzan, piernas apoyadas),
           girando por el lado que permite la articulación */
        let d = rb - ra + n180(sB[q] - sA[q]);
        /* giro: −1 / +1 obliga el sentido (los brazos que circulan por arriba de la
           cabeza hasta atrás: de perfil, la circunducción se ve como un giro largo) */
        const g = (B.giro || {})[k];
        if (g && Math.sign(d) !== g) d += g * 360;
        r[k] = [A[k][0] + d * inercia(pk(k, d), k), ...resto];
      }
    }
    const ka = A.k || {}, kb = B.k || {};
    r.k = {};
    for (const k of ['bc', 'bl', 'pc', 'pl']) if (ka[k] || kb[k]) r.k[k] = [0, 1, 2].map(q => { const a = (ka[k] || [])[q] ?? 1, b = (kb[k] || [])[q] ?? 1; return lerp(a, b, fluido && !libre(A, k) && !libre(B, k) ? herm(f, (tg && tg[k + 'b']) || UNO) : pe('k' + k + q, b - a)); });
    if (ka.ancho != null || kb.ancho != null) r.k.ancho = lerp(ka.ancho ?? 1, kb.ancho ?? 1, pe('kancho', (kb.ancho ?? 1) - (ka.ancho ?? 1)));
    if (ka.tronco != null || kb.tronco != null) r.k.tronco = lerp(ka.tronco ?? 1, kb.tronco ?? 1, pe('ktronco', (kb.tronco ?? 1) - (ka.tronco ?? 1)));
    r.ab = {};
    for (const k of ['bc', 'bl', 'pc', 'pl']) {
      const a = abDe(A.ab, k), b = abDe(B.ab, k);
      if (a || b) { const a2 = a || [0, 0], b2 = b || [0, 0]; r.ab[k] = [0, 1].map(q => lerp(a2[q], b2[q], pe('ab' + k + q, b2[q] - a2[q]))); }
    }
    r.g = lerp(A.g || 0, B.g || 0, pe('g', (B.g || 0) - (A.g || 0)));
    if (A.rot || B.rot) r.rot = lerp(A.rot || 0, B.rot || 0, pe('rot', (B.rot || 0) - (A.rot || 0)));
    /* los agarres se mantienen solo si están en las dos poses */
    r.ik = {};
    for (const [b, d] of Object.entries(B.ik || {})) if ((A.ik || {})[b] === d) r.ik[b] = d;
    return r;
  }
  /* cuadro de la transición i → i+1 en la fracción de tiempo f.
     fluido: f es el avance por el camino (ver fluidez y frases) */
  function cuadro(ej, i, f, fluido = false) {
    const { poses, K } = preparar(ej), n = poses.length;
    const j = (i + 1) % n, A = poses[i], B = poses[j];
    if (f <= 0 || n === 1) return resolver(A, ej, { xoff: K[i].xoff, pins: K[i].pins });
    if (f >= 1) return resolver(B, ej, { xoff: K[j].xoff, pins: K[j].pins });
    const tg = fluido ? fluidez(ej).tg[i] : null;
    const P = mezclar(A, B, f, ej, K[i].art, fluido, tg), comp = compartidos(ej, A, B), pins = {};
    const e = fluido ? herm(f, tg.ancla || UNO) : mj(f), etr = fluido ? herm(f, tg.tr || UNO) : e;
    /* el pie que pasa de apoyado plano a la punta (o al talón), o al revés, no se despega:
       rueda sobre la punta (o el talón), que queda en el mat. Antes el pie se levantaba en
       la transición y, sin ese apoyo, el cuerpo se habría caído (Push Ups) */
    if (!ej.rueda) for (const l of ['C', 'L']) for (const ex of ['punta', 'talon']) {
      const a = A.apoyo || [], b = B.apoyo || [], n = ex + l;
      if (!comp.includes(n) && !comp.includes('pie' + l) && ((a.includes('pie' + l) && b.includes(n)) || (a.includes(n) && b.includes('pie' + l)))) comp.push(n);
    }
    for (const a of comp) pins[a] = lerp(contactoDe(K[i].E, a).x, contactoDe(K[j].E, a).x, e);
    const cambian = ej.rueda ? [] : [...(A.apoyo || []), ...(B.apoyo || [])].filter(a => EXTREMO.test(a) && !comp.includes(a) && !comp.some(c => miembroDe(c) === miembroDe(a)));
    /* sin apoyo rígido clavado, el punto de anclaje avanza (rodando, si rueda) */
    const ancla = { x: K[i].rueda ? xRueda(K, i, etr) : lerp(anclaX(K[i].E, ej.ancla), anclaX(K[j].E, ej.ancla), e) };
    return resolver(P, ej, { pins, forzados: comp, ancla, cambian });
  }

  /* ---------- modo fluido ----------
     Un movimiento real no frena en cada paso del manual: frena donde termina,
     donde cambia de sentido o donde se sostiene. Esas poses son las paradas y
     dividen el ciclo en frases. Cada frase arranca con aceleración suave, va a
     velocidad pareja y frena al final (rampa); por dentro, cada canal pasa por
     las poses intermedias con la velocidad que trae (tangentes de Hermite
     monótonas, PCHIP: no se pasa de largo ni vuelve atrás).
     En la pose, alto: true la vuelve parada y alto: false la deja pasar;
     ej.continuo: la pose inicial no es parada (círculos, bombeos). */
  const MARCAS_MOV = E => [E.H, E.S, E.C, E.seg.bc.codo, E.seg.bc.mano, E.seg.bl.mano, E.seg.pc.rod, E.seg.pc.punta, E.seg.pl.rod, E.seg.pl.punta, ...E.col];
  function paradas(ej) {
    const { poses, K } = preparar(ej), n = poses.length, M = K.map(k => MARCAS_MOV(k.E));
    const dif = (a, b) => M[a].flatMap((p, q) => [M[b][q].x - p.x, M[b][q].y - p.y]);
    return poses.map((P, k) => {
      if (P.alto != null) return !!P.alto;
      if (k === 0 && !ej.continuo) return true;
      const di = dif((k - 1 + n) % n, k), dd = dif(k, (k + 1) % n), ni = Math.hypot(...di), nd = Math.hypot(...dd);
      /* se sostiene, o el movimiento se da vuelta (más de ~100°) */
      if (ni < 4 || nd < 4) return true;
      return di.reduce((s, v, q) => s + v * dd[q], 0) / (ni * nd) < -0.2;
    });
  }
  /* velocidad en una pose intermedia (Fritsch–Butland): 0 si el canal cambia de
     sentido o se queda quieto de un lado; si no, media armónica ponderada */
  const pchip = (s1, s2, h1, h2) => (s1 * s2 <= 0 ? 0 : (3 * h1 + 3 * h2) / ((2 * h2 + h1) / s1 + (h2 + 2 * h1) / s2));
  function fluidez(ej) {
    const prep = preparar(ej);
    if (prep.flu) return prep.flu;
    const { poses, K } = prep, n = poses.length;
    const durs = poses.map((_, k) => poses[(k + 1) % n].dur || ej.dur || 1500);
    const del = poses.map((A, k) => {
      const t = { reg: {} };
      mezclar(A, poses[(k + 1) % n], 0.5, ej, K[k].art, true, t);
      if (!K[k].rueda) t.reg.ancla = anclaX(K[(k + 1) % n].E, ej.ancla) - anclaX(K[k].E, ej.ancla);
      return t.reg;
    });
    const alto = n > 1 ? paradas(ej) : [true];
    const tg = del.map((d, k) => {
      const kp = (k - 1 + n) % n, kn = (k + 1) % n, t = {};
      for (const [c, v] of Object.entries(d)) {
        if (Math.abs(v) < 1e-6) continue;
        const S = v / durs[k];
        /* en una parada la velocidad la pone la rampa (1 = sin frenar dos veces); si el
           canal no sigue del otro lado (una mano o un pie que se apoya o despega, una
           pierna que pasa a moverse con la pelvis) llega o sale con velocidad 0 */
        const a = alto[k] ? 1 : c in del[kp] ? pchip(del[kp][c] / durs[kp], S, durs[kp], durs[k]) / S : 0;
        const b = alto[kn] ? 1 : c in del[kn] ? pchip(S, del[kn][c] / durs[kn], durs[k], durs[kn]) / S : 0;
        t[c] = [a, b];
      }
      t._ext = [alto[k], alto[kn]];
      return t;
    });
    /* tramos sin movimiento (la vuelta a la pose inicial): un respiro corto */
    const M = K.map(q => MARCAS_MOV(q.E));
    const quieto = M.map((m, k) => Math.max(...m.map((p, q) => Math.hypot(M[(k + 1) % n][q].x - p.x, M[(k + 1) % n][q].y - p.y))) < 2);
    const frases = [], cortes = alto.map((a, k) => (a ? k : -1)).filter(k => k >= 0);
    const inicios = cortes.length ? cortes : [0];
    inicios.forEach((ini, q) => {
      const fin = cortes.length ? inicios[(q + 1) % inicios.length] : 0;
      const segs = [];
      let k = ini;
      do { segs.push(k); k = (k + 1) % n; } while (k !== fin);
      const ds = segs.map(k => (quieto[k] ? Math.min(durs[k], 450) : durs[k])), T = ds.reduce((a, b) => a + b, 0);
      const c = [0];
      ds.forEach(d => c.push(c[c.length - 1] + d / T));
      /* rampa: fracción de la frase que dura la aceleración (y la frenada) */
      const m = segs.length, a = !cortes.length ? 0 : m === 1 ? 0.5 : Math.max(0.2, 0.5 / m);
      frases.push({ ini, segs, T, c, a, alto: !!cortes.length });
    });
    const fraseDe = [];
    frases.forEach((F, q) => F.segs.forEach(k => { fraseDe[k] = q; }));
    prep.flu = { tg, alto, frases, fraseDe };
    return prep.flu;
  }
  /* avance por el camino en función del tiempo de la frase: acelera, crucero y
     frena; velocidad y aceleración continuas (las rampas son smoothstep) */
  function rampa(t, a) {
    if (a <= 0) return t;
    if (t > 1 - a) return 1 - rampa(1 - t, a);
    const c = 1 / (1 - a);
    if (t < a) { const x = t / a; return c * a * (x * x * x - x * x * x * x / 2); }
    return c * (a / 2 + t - a);
  }
  function rampaInv(u, a) {
    let lo = 0, hi = 1;
    for (let q = 0; q < 30; q++) { const m = (lo + hi) / 2; if (rampa(m, a) < u) lo = m; else hi = m; }
    return (lo + hi) / 2;
  }
  /* de la fracción de tiempo de una frase a (tramo, avance) y de vuelta */
  function enFrase(F, t) {
    const u = rampa(Math.max(0, Math.min(1, t)), F.a);
    let s = 0;
    while (s < F.segs.length - 1 && u >= F.c[s + 1]) s++;
    return { i: F.segs[s], f: Math.max(0, Math.min(1, (u - F.c[s]) / (F.c[s + 1] - F.c[s]))) };
  }
  function deFrase(F, i, f) {
    const s = Math.max(0, F.segs.indexOf(i));
    return rampaInv(F.c[s] + f * (F.c[s + 1] - F.c[s]), F.a);
  }

  /* ---------- centro de masa (Winter 2009: fracción de la masa y posición
     del centro de cada segmento, desde su extremo proximal) ---------- */
  const MASA = { cabeza: 0.081, tronco: 0.497, brazo: [0.028, 0.436], ante: [0.016, 0.43], mano: [0.006, 0.506], muslo: [0.1, 0.433], pierna: [0.0465, 0.433], pie: [0.0145, 0.5] };
  function centroMasa(E) {
    let mx = 0, my = 0, m = 0;
    const add = (p, w) => { mx += p.x * w; my += p.y * w; m += w; };
    const en = (a, b, [w, t]) => add({ x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) }, w);
    const largo = LC.reduce((a, b) => a + b, 0);
    for (let q = 0; q < 4; q++) en(E.col[q], E.col[q + 1], [MASA.tronco * LC[q] / largo, 0.5]);
    add(E.C, MASA.cabeza);
    for (const k of ['bc', 'bl']) { const s = E.seg[k]; en(s.raiz, s.codo, MASA.brazo); en(s.codo, s.muneca, MASA.ante); en(s.muneca, s.mano, MASA.mano); }
    for (const k of ['pc', 'pl']) { const s = E.seg[k]; en(s.raiz, s.rod, MASA.muslo); en(s.rod, s.tobillo, MASA.pierna); en(s.talon, s.punta, MASA.pie); }
    return { x: mx / m, y: my / m };
  }
  /* base de apoyo: de qué x a qué x toca de verdad el piso */
  function baseApoyo(E) {
    const xs = contorno(E).filter(p => p.y >= PISO - 1.5).map(p => p.x);
    if (!xs.length) return null;
    return { x0: Math.min(...xs), x1: Math.max(...xs) };
  }
  /* ¿la pose clave está en equilibrio estático? (solo si el apoyo es chico:
     sentado en los isquiones, de pie, en planchas; acostado siempre lo está) */
  const SIN_CONTROL = /^(tronco|espalda|hombros|cabeza)$/;
  function equilibrio(ej, i) {
    const P = preparar(ej).poses[i];
    const ap = P.apoyo || [];
    /* en el extremo de un hamaqueo (meces) el cuerpo queda quieto un instante con el centro
       de masa corrido: por eso vuelve; no es una pose de equilibrio */
    if (!ap.length || P.meces || ej.silla || ej.camara === 'arriba' || ej.persp || ap.some(a => SIN_CONTROL.test(a))) return null;
    const r = cuadro(ej, i, 0), cm = centroMasa(r.E), b = baseApoyo(r.E);
    /* sentado sobre la pelvis, los isquiones y el cóccix ocupan unos 6 más de cada lado */
    const tol = ap.length === 1 && ap[0] === 'pelvis' ? 6 : 2;
    const fuera = cm.x < b.x0 - tol ? b.x0 - tol - cm.x : cm.x > b.x1 + tol ? cm.x - b.x1 - tol : 0;
    return { cm, base: b, tol, fuera };
  }

  /* ---------- dinámica: masas, inercias y fuerzas con el piso ----------
     Cada segmento tiene su masa (fracciones de Winter para una persona de 60 kg), su centro
     y su momento de inercia (radio de giro de Winter). Recorriendo la animación en tiempo
     real (modo fluido, 25 cuadros por segundo) se derivan velocidades y aceleraciones de
     cada segmento y con ellas la fuerza que hace el piso y el punto donde actúa (centro de
     presión o ZMP):
       · el piso solo empuja: la fuerza vertical tiene que ser hacia arriba;
       · el centro de presión cae dentro de lo que apoya: si cae afuera, el cuerpo se
         caería girando sobre el borde de su base;
       · sin resbalar: la fuerza horizontal no pasa el rozamiento (μ ≈ 0,6 en un mat).
     De perfil es el plano sagital; de frente, el frontal. Escala: 1 unidad ≈ 1,08 cm. */
  const KG = 60, CM_U = 0.0108, G = 9.81, MU = 0.6;
  const GIRO = { cabeza: 0.495, tronco: 0.3, brazo: 0.322, ante: 0.303, mano: 0.297, muslo: 0.323, pierna: 0.302, pie: 0.475 };
  function segmentos(E) {
    const out = [], largo = LC.reduce((a, b) => a + b, 0);
    const add = (a, b, nom, [w, t]) => { const L = Math.hypot(b.x - a.x, b.y - a.y) * CM_U, m = w * KG;
      out.push({ nom, m, x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), a: Math.atan2(b.y - a.y, b.x - a.x), I: m * (GIRO[nom] * L) ** 2 }); };
    for (let q = 0; q < 4; q++) add(E.col[q], E.col[q + 1], 'tronco', [MASA.tronco * LC[q] / largo, 0.5]);
    add(E.S, E.C, 'cabeza', [MASA.cabeza, 1]);
    for (const k of ['bc', 'bl']) { const s = E.seg[k]; add(s.raiz, s.codo, 'brazo', MASA.brazo); add(s.codo, s.muneca, 'ante', MASA.ante); add(s.muneca, s.mano, 'mano', MASA.mano); }
    for (const k of ['pc', 'pl']) { const s = E.seg[k]; add(s.raiz, s.rod, 'muslo', MASA.muslo); add(s.rod, s.tobillo, 'pierna', MASA.pierna); add(s.talon, s.punta, 'pie', MASA.pie); }
    return out;
  }
  /* cuadros de la animación en tiempo real (modo fluido), con su paso de tiempo */
  function cuadrosReales(ej, dt = 0.04) {
    const { poses } = preparar(ej), n = poses.length, frases = [];
    if (n < 2) return [{ alto: true, cs: [{ r: cuadro(ej, 0, 0), i: 0, f: 0 }], dt }];
    for (const F of fluidez(ej).frases) {
      const T = F.T / 1000, N = Math.max(2, Math.round(T / dt)), cs = [];
      for (let s = 0; s <= N; s++) { const { i, f } = enFrase(F, s / N); cs.push({ r: cuadro(ej, i, f, true), i, f }); }
      frases.push({ alto: F.alto, cs, dt: T / N });
    }
    return frases;
  }
  function dinamica(ej) {
    const prep = preparar(ej);
    if (prep.din) return prep.din;
    const out = [], plano = ej.camara !== 'arriba' && !ej.persp && !ej.silla, { poses, K } = prep, n = poses.length;
    /* tramos que ruedan de verdad (rodar sin deslizar y el cuerpo gira más de 20°): ahí el
       peso no está sobre el apoyo (es lo que hace rodar) y la velocidad la regulan los
       músculos cambiando apenas la forma; el centro de presión no se controla */
    const rueda = poses.map((A, i) => !!(K[i] && K[i].rueda) && Math.abs(n180(poses[(i + 1) % n].tr - A.tr)) > 20);
    for (const F of cuadrosReales(ej)) {
      const S = F.cs.map(c => segmentos(c.r.E)), N = S.length, dt = F.dt;
      /* una frase que frena en sus extremos arranca y termina quieta; si no (ciclo continuo) da la vuelta */
      const en = k => (k < 0 ? (F.alto ? 0 : N - 2) : k >= N ? (F.alto ? N - 1 : 1) : k);
      for (let k = 0; k < N; k++) {
        const P = S[en(k - 1)], A = S[k], Q = S[en(k + 1)];
        let fy = 0, fx = 0, mx = 0, num = 0;
        A.forEach((s, q) => {
          const ax = (Q[q].x - 2 * s.x + P[q].x) / dt / dt * CM_U, ay = -(Q[q].y - 2 * s.y + P[q].y) / dt / dt * CM_U;
          const d1 = n180(grad(Q[q].a - s.a)), d0 = n180(grad(s.a - P[q].a)), al = -rad(d1 - d0) / dt / dt;
          const x = s.x * CM_U, h = (PISO - s.y) * CM_U;
          fy += s.m * (G + ay); fx += s.m * ax; num += s.m * (G + ay) * x - s.m * h * ax + s.I * al; mx += s.m * x;
        });
        /* lo que toca el mat (o queda a menos de 3: el brazo o la espalda apoyados son blandos
           y la articulación del hombro del modelo queda un poco alta) */
        const c = F.cs[k], E = c.r.E, toca = plano ? contorno(E).filter(p => p.y >= PISO - 3) : [];
        /* margen de cada borde de la base: si ese borde es la pelvis, los isquiones y el cóccix
           apoyan unos 6 cm más que el punto más bajo del dibujo, y del lado del tronco el sacro
           (plano, de unos 10 cm) 8; si no, 4 (lo blando y lo aproximado del modelo) */
        let base = null;
        if (toca.length) { const a = toca.reduce((m, p) => (p.x < m.x ? p : m)), b = toca.reduce((m, p) => (p.x > m.x ? p : m)), lum = E.col[1].x - E.H.x;
          base = { x0: a.x, x1: b.x, t0: a.p === 'pelvis' ? (lum < 0 ? 8 : 6) : 4, t1: b.p === 'pelvis' ? (lum > 0 ? 8 : 6) : 4 }; }
        /* sentado sobre los isquiones (solo la pelvis toca el piso): la base real son los
           isquiones y el cóccix, unos 6 más de cada lado que el punto más bajo del dibujo */
        out.push({ i: c.i, f: c.f, fy, fx, zmp: num / fy / CM_U, cm: mx / KG / CM_U, base, rueda: rueda[c.i] && c.f > 0 && c.f < 1 });
      }
    }
    prep.din = out;
    return out;
  }
  /* fallas de la dinámica (para validar) */
  function fallasDinamicas(ej) {
    if (ej.camara === 'arriba' || ej.persp || ej.silla) return [];
    const n = preparar(ej).poses.length, fallas = [];
    for (const d of dinamica(ej)) {
      const donde = `dinámica, pose ${d.i} → ${(d.i + 1) % n} (${Math.round(d.f * 100)}%)`;
      if (d.fy <= 0) { fallas.push(`${donde}: el piso tendría que tirar (fuerza vertical ${d.fy.toFixed(0)} N)`); continue; }
      if (Math.abs(d.fx) > MU * d.fy) fallas.push(`${donde}: resbalaría (fuerza horizontal ${Math.abs(d.fx).toFixed(0)} N, rozamiento ${(MU * d.fy).toFixed(0)} N)`);
      /* margen: 4 (unos 4 cm: lo blando del apoyo y lo aproximado del modelo); sentado sobre los isquiones, 6 */
      if (d.base && !d.rueda) { const { x0, x1, t0, t1 } = d.base, fuera = d.zmp < x0 - t0 ? x0 - t0 - d.zmp : d.zmp > x1 + t1 ? d.zmp - x1 - t1 : 0;
        if (fuera > 0.3) fallas.push(`${donde}: se caería (centro de presión ${fuera.toFixed(1)} fuera de la base)`); }
    }
    return fallas;
  }

  /* ---------- control automático de calidad ---------- */
  function validar(ej, pasos = 10) {
    const { poses } = preparar(ej), n = poses.length, fallas = [];
    const limite = (E, donde) => {
      for (const k of ['pc', 'pl']) { const m = E.seg[k], fx = ((m.aP - m.a0 + 540) % 360) - 180; if (!E.fr && (fx < -6 || fx > 162)) fallas.push(`${donde}: rodilla ${k} fuera de rango (${fx.toFixed(0)}°)`); }
      for (const k of ['bc', 'bl']) { const m = E.seg[k], fx = ((m.a0 - m.aA + 540) % 360) - 180; if (!E.fr && (fx < -8 || fx > 160)) fallas.push(`${donde}: codo ${k} fuera de rango (${fx.toFixed(0)}°)`); }
    };
    /* control de física (de perfil): rangos que un cuerpo real no pasa. La columna se
       mide entre el segmento de la pelvis y el de arriba; la cadera, del eje de la pelvis
       al muslo; el cuello, del tórax a la cabeza (+ hacia el frente). El hombro no se
       controla: de perfil no se distingue un brazo atrás de una rotación o un círculo. */
    const sangr = (a, b, frente) => { const th = Math.atan2(a.x * b.y - a.y * b.x, a.x * b.x + a.y * b.y) * 180 / Math.PI; return (a.x * frente.y - a.y * frente.x) >= 0 ? th : -th; };
    const fisica = (E, donde) => {
      if (E.fr || ej.camara === 'arriba') return;
      const P = E.col, up0 = unit(P[0], P[1]), upT = unit(P[3], P[4]);
      const r90 = v => ({ x: -v.y, y: v.x }), lado = Math.sign(r90(upT).x * E.ant.x + r90(upT).y * E.ant.y) || 1;
      const fr0 = { x: r90(up0).x * lado, y: r90(up0).y * lado };
      const fuera = (q, v, lo, hi) => { if (v < lo || v > hi) fallas.push(`${donde}: ${q} fuera de rango (${v.toFixed(0)}°)`); };
      fuera('columna', sangr(up0, upT, fr0), -60, 125);
      fuera('cuello', sangr(upT, unit(E.S, E.C), E.ant), -60, 60);
      for (const k of ['pc', 'pl']) { const m = E.seg[k];
        fuera(`cadera ${k}`, sangr({ x: -up0.x, y: -up0.y }, unit(m.raiz, m.rod), fr0), -45, 150);
        fuera(`tobillo ${k}`, ((m.aPie - m.aP + 90 + 540) % 360) - 180, -35, 96); }
      for (const k of ['bc', 'bl']) { const m = E.seg[k]; fuera(`muñeca ${k}`, ((m.aM - m.aA + 540) % 360) - 180, -100, 100); }
    };
    /* forma interna (para lo que se hamaca como una mecedora: no cambia mientras rueda) */
    const forma = E => { const P = E.col, a = (p, q) => Math.atan2(q.y - p.y, q.x - p.x) * 180 / Math.PI, d = (x, y) => ((x - y + 540) % 360) - 180, base = a(P[0], P[1]);
      return [a(P[1], P[2]), a(P[2], P[3]), a(P[3], P[4]), a(E.S, E.C), E.seg.pc.a0, E.seg.pl.a0, E.seg.pc.aP, E.seg.pl.aP, E.seg.bc.a0, E.seg.bl.a0, E.seg.bc.aA, E.seg.bl.aA].map(v => d(v, base)); };
    let previo = null;
    /* r: cuadro; clave: es una pose clave; ms: tiempo desde el cuadro anterior */
    const revisar = (r, donde, i, clave, ms) => {
      r.avisos.forEach(a => fallas.push(`${donde}: ${a}`));
      if (ej.camara !== 'arriba') {
        const pts = contorno(r.E, ej.persp ? new Set(['pc', 'pl']) : new Set());
        const bajo = Math.max(...pts.map(p => p.y));
        if (bajo > PISO + 1.2) fallas.push(`${donde}: atraviesa el piso (${(bajo - PISO).toFixed(1)})`);
        const piso = ej.persp ? PISO_P : PISO;
        if (ej.persp ? bajo > piso + 1.2 : false) fallas.push(`${donde}: atraviesa el piso`);
        if (bajo < piso - 1.2) fallas.push(`${donde}: flota (${(piso - bajo).toFixed(1)})`);
        const ap = clave ? (poses[i].apoyo || []) : Object.keys(r.contactos);
        for (const a of ap) { const c = contactoDe(r.E, a); if (Math.abs(c.y - piso) > 1.2) fallas.push(`${donde}: ${a} no toca el piso (${(PISO - c.y).toFixed(1)})`); }
      }
      limite(r.E, donde);
      fisica(r.E, donde);
      if (clave) { const q = equilibrio(ej, i); if (q && q.fuera > 0) fallas.push(`${donde}: fuera de equilibrio (centro de masa ${q.fuera.toFixed(1)} fuera de la base)`); }
      /* las cuatro extremidades: un brazo o una pierna del lado lejano también puede saltar */
      const marcas = [r.E.H, r.E.S, r.E.C, r.E.seg.pc.tobillo, r.E.seg.bc.muneca, r.E.seg.pl.tobillo, r.E.seg.bl.muneca];
      /* velocidad de las marcas en unidades cada 100 ms: más de 30 (~3,5 m/s) es un salto */
      if (previo && ms) { const salto = Math.max(...marcas.map((p, q) => Math.hypot(p.x - previo[q].x, p.y - previo[q].y))) * 100 / ms; if (salto > 30) fallas.push(`${donde}: salto brusco (${salto.toFixed(0)} cada 100 ms)`); }
      previo = marcas;
    };
    /* lo que queda apoyado de una pose a la siguiente (manos, pies, rodillas, antebrazos)
       no se desliza por el mat; lo que se hamaca (meces en las dos poses) no cambia de forma */
    const EXTREMO = /^(pie|talon|punta|mano|rodilla|antebrazo)/;
    for (let i = 0; i < (n > 1 ? n : 1); i++) {
      const j = (i + 1) % n, libres = new Set([...(poses[i].libre || []), ...(poses[j].libre || [])]);
      const quedan = n > 1 && !ej.rueda && ej.camara !== 'arriba' ? (poses[i].apoyo || []).filter(a => EXTREMO.test(a) && !libres.has(a) && (poses[j].apoyo || []).includes(a)) : [];
      const meces = n > 1 && poses[i].meces && poses[j].meces;
      let x0 = null, g0 = null, f0 = null;
      for (let s = 0; s < (n > 1 ? pasos : 1); s++) {
        const f = s / pasos, r = cuadro(ej, i, f), donde = `pose ${i}${f ? ` → ${j} (${Math.round(f * 100)}%)` : ''}`;
        revisar(r, donde, i, !f, (poses[j].dur || ej.dur || 1500) / pasos);
        /* talón y punta son curvos: si el pie gira, el punto de contacto rueda (radio × ángulo) */
        if (quedan.length) { const xs = quedan.map(a => contactoDe(r.E, a).x), gs = quedan.map(a => r.E.seg[miembroDe(a)].aPie || 0);
          if (!x0) { x0 = xs; g0 = gs; } else xs.forEach((x, q) => { const rueda = /^(talon|punta)/.test(quedan[q]) ? RPIE * Math.abs(((gs[q] - g0[q] + 540) % 360) - 180) * Math.PI / 180 : 0;
            if (Math.abs(x - x0[q]) > 1.5 + rueda) fallas.push(`pose ${i} → ${j}: ${quedan[q]} se desliza por el mat (${Math.abs(x - x0[q]).toFixed(1)})`); }); }
        if (meces) { const fo = forma(r.E); if (!f0) f0 = fo; else fo.forEach((v, q) => { if (Math.abs(((v - f0[q] + 540) % 360) - 180) > 5) fallas.push(`pose ${i} → ${j}: al hamacarse cambia la forma del cuerpo`); }); }
      }
    }
    /* modo fluido: se recorre cada frase en tiempo real */
    if (n > 1) {
      previo = null;
      for (const F of fluidez(ej).frases) {
        const N = Math.max(2, Math.ceil(F.T / 40));
        for (let s = 0; s <= N; s++) {
          const { i, f } = enFrase(F, s / N);
          revisar(cuadro(ej, i, f, true), `fluido, pose ${i} → ${(i + 1) % n} (${Math.round(f * 100)}%)`, i, false, s ? F.T / N : 0);
        }
      }
    }
    /* dinámica con los pesos del cuerpo: el piso solo empuja, sin resbalar, y el centro de
       presión dentro de la base (ver dinamica) */
    fallas.push(...fallasDinamicas(ej));
    return [...new Set(fallas)];
  }

  /* ---------- dibujo ---------- */
  function huso(a, b, r0, r1) {
    const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 0.001, nx = -dy / d, ny = dx / d;
    return `M${f1(a.x + nx * r0)},${f1(a.y + ny * r0)} L${f1(b.x + nx * r1)},${f1(b.y + ny * r1)} A${f1(r1)},${f1(r1)} 0 0 0 ${f1(b.x - nx * r1)},${f1(b.y - ny * r1)} L${f1(a.x - nx * r0)},${f1(a.y - ny * r0)} A${f1(r0)},${f1(r0)} 0 0 0 ${f1(a.x + nx * r0)},${f1(a.y + ny * r0)} Z`;
  }
  /* curva suave por una lista de puntos (Catmull-Rom → Bézier). Un punto con
     esq: true es una esquina: la curva llega y sale sin tangente, así un corte
     (la cintura de la calza, la raíz del muslo) no se pasa de largo y no hace bulto */
  function suave(pts) {
    let d = `${f1(pts[0].x)},${f1(pts[0].y)}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
      const c1 = p1.esq ? p1 : { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 }, c2 = p2.esq ? p2 : { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 };
      d += ` C${f1(c1.x)},${f1(c1.y)} ${f1(c2.x)},${f1(c2.y)} ${f1(p2.x)},${f1(p2.y)}`;
    }
    return d;
  }
  function tronco(E, aire = 0.5) {
    const P = E.col, n = P.length;
    /* radios adelante / atrás (glúteos, abdomen, pecho). La respiración (aire
       0 = exhalado, 1 = inhalado) expande las costillas hacia adelante, los
       costados y atrás (respiración lateral del método), y al exhalar el
       abdomen se hunde un poco hacia la columna. */
    const ra = (E.fr ? radios(E) : [9.5, 8.8, 9.2, 11.2, 10]).slice(), rp = (E.fr ? radios(E) : [11, 9, 8.8, 9.8, 10.2]).slice();
    const a = aire - 0.5;
    if (E.fr) { ra[2] *= 1 + 0.07 * a; ra[3] *= 1 + 0.09 * a; rp[2] = ra[2]; rp[3] = ra[3]; }
    else { ra[1] *= 1 + 0.08 * a; ra[2] *= 1 + 0.07 * a; ra[3] *= 1 + 0.08 * a; rp[2] *= 1 + 0.04 * a; rp[3] *= 1 + 0.04 * a; }
    const nor = i => { const a = P[Math.max(0, i - 1)], b = P[Math.min(n - 1, i + 1)], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1; return { x: -dy / d, y: dx / d }; };
    /* nor apunta a la izquierda del sentido del tronco; en perfil eso es el frente */
    const A = [], B = [];
    P.forEach((p, i) => { const q = nor(i); A.push({ x: p.x + q.x * ra[i], y: p.y + q.y * ra[i] }); B.push({ x: p.x - q.x * rp[i], y: p.y - q.y * rp[i] }); });
    const top = ra[n - 1], bot = rp[0];
    return `M${suave(A)} A${f1((top + rp[n - 1]) / 2)},${f1((top + rp[n - 1]) / 2)} 0 0 0 ${suave(B.slice().reverse())} A${f1((bot + ra[0]) / 2)},${f1((bot + ra[0]) / 2)} 0 0 0 ${f1(A[0].x)},${f1(A[0].y)} Z`;
  }
  function cabeza(E, col) {
    const c = E.C, up = E.arriba, fr = E.fr;
    const atras = fr ? { x: -E.lat.x, y: -E.lat.y } : { x: -E.antCab.x, y: -E.antCab.y };
    const P = (ang, r = 9.8) => { const t = rad(ang); return { x: c.x + r * (up.x * Math.cos(t) + atras.x * Math.sin(t)), y: c.y + r * (up.y * Math.cos(t) + atras.y * Math.sin(t)) }; };
    const [a0, a1] = fr ? [-78, 78] : [-38, 128];
    const arco = [];
    for (let g = a0; g <= a1; g += 8) arco.push(P(g));
    arco.push(P(a1));
    const medio = fr ? P(0, 3.4) : P((a0 + a1) / 2 + 12, 3.6);
    const pelo = `<path d="M${arco.map(p => `${f1(p.x)},${f1(p.y)}`).join(' L')} Q${f1(medio.x)},${f1(medio.y)} ${f1(arco[0].x)},${f1(arco[0].y)} Z" fill="${col.pelo}"/>`;
    let cara = '', oreja = '';
    if (!fr) {
      const an = E.antCab, b = { x: c.x + an.x * 8.6 + up.x * 0.5, y: c.y + an.y * 8.6 + up.y * 0.5 };
      const t = { x: c.x + an.x * 12 - up.x * 0.8, y: c.y + an.y * 12 - up.y * 0.8 }, d = { x: b.x - up.x * 4, y: b.y - up.y * 4 };
      cara = `<path d="M${f1(b.x + up.x * 1.5)},${f1(b.y + up.y * 1.5)} L${f1(t.x)},${f1(t.y)} L${f1(d.x)},${f1(d.y)} Z" fill="${col.piel}"/>`;
      oreja = `<circle cx="${f1(c.x - an.x * 1.2)}" cy="${f1(c.y - an.y * 1.2)}" r="1.9" fill="${col.sombra}"/>`;
    } else if (E.g) {
      const q = { x: c.x - E.lat.x * E.g * 6.5 - up.x, y: c.y - E.lat.y * E.g * 6.5 - up.y };
      cara = `<circle cx="${f1(q.x)}" cy="${f1(q.y)}" r="1.9" fill="${col.sombra}"/>`;
    }
    return `${fr ? '' : cara}<circle cx="${f1(c.x)}" cy="${f1(c.y)}" r="${R.cabeza}" fill="${col.piel}"/>${oreja}${pelo}${fr ? cara : ''}`;
  }
  const COL = {
    cerca: { ropa: '#2f8f8a', ropa2: '#287e79', piel: '#f1c9a5', pelo: '#4a3426', sombra: '#c99a78' },
    lejos: { ropa: '#1f615d', ropa2: '#1c5652', piel: '#d7a883', pelo: '#3a281d', sombra: '#b08060' }
  };
  const pierna = (m, col) => `<path d="${huso(m.raiz, m.rod, 7, RROD)}" fill="${col.ropa}"/><path d="${huso(m.rod, m.tobillo, RROD, 3.4)}" fill="${col.ropa}"/><path d="${huso(m.talon, m.punta, RPIE, 1.7)}" fill="${col.piel}"/>`;
  const brazo = (m, col) => `<path d="${huso(m.raiz, m.codo, 4.3, 3.4)}" fill="${col.ropa2}"/><path d="${huso(m.codo, m.muneca, 3.3, 2.5)}" fill="${col.piel}"/><path d="${huso(m.muneca, m.mano, RMANO, 2)}" fill="${col.piel}"/>`;
  function dibujo(E, fantasma, orden, aire) {
    const c1 = COL.cerca, c2 = E.fr ? COL.cerca : COL.lejos;
    const cuello = `<path d="${huso(E.S, E.C, 4.4, 4.2)}" fill="${c1.piel}"/>`;
    const partes = { BC: brazo(E.seg.bc, c1), BL: brazo(E.seg.bl, c2), PC: pierna(E.seg.pc, c1), PL: pierna(E.seg.pl, c2), T: `<path d="${tronco(E, aire)}" fill="${c1.ropa}"/>`, C: cuello + cabeza(E, c1) };
    const seq = orden || (E.fr ? ['PL', 'PC', 'T', 'C', 'BL', 'BC'] : ['BL', 'PL', 'C', 'T', 'PC', 'BC']);
    return `<g class="${fantasma ? 'fig-fantasma' : 'fig-cuerpo'}">${seq.map(k => partes[k]).join('')}</g>`;
  }
  /* =====================================================================
     FIGURA ANATÓMICA (v4, la de la app): misma cinemática, otro dibujo.
     Siluetas con relieves musculares (deltoides, bíceps y tríceps,
     cuádriceps, isquiotibiales, gemelos), rótula y pliegues reales de
     rodilla y codo, manos con pulgar, pies con talón, arco y dedos,
     cara de perfil (frente, nariz, labios, mentón, ojo, ceja, oreja),
     pelo con rodete y ropa de entrenamiento. De frente: dibujoFrente;
     sentada vista desde arriba: dibujoArriba. 'clasico' queda para comparar.
     ===================================================================== */
  let ESTILO = 'anatomico';
  /* Colores como variables CSS con valor por defecto: cada página puede
     ajustarlos por tema (en oscuro el contorno se aclara para separar la
     figura del fondo). La calza es ciruela: contrasta con fondos claros y
     oscuros y no se confunde con el mat. */
  const v = (n, d) => `var(--ap-${n},${d})`;
  const ANAT = {
    cerca: { piel: v('piel', '#eec19c'), pielS: v('piel-s', '#d8a27c'), top: v('top', '#2f8f8a'), calza: v('calza', '#6d3d68'), pelo: v('pelo', '#3a2618'),
      linea: v('borde', 'rgba(60,34,20,.6)'), fino: v('fino', 'rgba(60,34,20,.28)'), ojo: '#2b1d14', labio: '#c4766c', blanco: '#fbf4ec', tinta: 'rgba(60,34,20,.55)' },
    lejos: { piel: v('piel-l', '#d3a07a'), pielS: v('piel-s', '#bd8762'), top: v('top-l', '#226b67'), calza: v('calza-l', '#4f2b4c'), pelo: v('pelo', '#2a1b10'),
      linea: v('borde', 'rgba(60,34,20,.6)'), fino: v('fino', 'rgba(40,22,12,.22)'), tinta: 'rgba(40,22,12,.5)' }
  };
  /* perfiles de ancho [t, anterior, posterior] a lo largo de cada hueso */
  const PERF = {
    muslo:  [[0, 5.3, 7.5], [0.15, 5.55, 7.15], [0.42, 5.9, 6.3], [0.7, 5.35, 5.15], [0.9, 4.9, 4.5], [1, 4.8, 4.3]],
    pierna: [[0, 4.5, 4.3], [0.12, 3.85, 5.0], [0.3, 3.5, 5.25], [0.5, 3.0, 4.1], [0.75, 2.45, 2.8], [1, 2.25, 2.35]],
    brazo:  [[0, 4.55, 4.35], [0.16, 4.8, 4.35], [0.38, 3.9, 4.1], [0.62, 3.6, 3.8], [0.88, 2.9, 3.15], [1, 2.8, 3.0]],
    ante:   [[0, 2.9, 3.0], [0.22, 3.25, 2.9], [0.5, 2.6, 2.4], [0.85, 1.95, 1.85], [1, 1.85, 1.75]]
  };
  /* tronco: distancia del eje al frente y a la espalda según la altura (0 cadera … 1 hombros) */
  /* frente: abdomen chato, costillas bajo el busto y el busto sostenido (top deportivo
     debajo de la ropa): redondeado, con el pliegue submamario marcado en s ≈ 0,57 */
  const TR_FRENTE = [[0, 6.0], [0.1, 6.6], [0.22, 6.5], [0.36, 6.2], [0.48, 6.8], [0.545, 7.2], [0.57, 7.6], [0.6, 9.6], [0.65, 10.8], [0.7, 11.2], [0.76, 10.9], [0.84, 9.9], [0.92, 8.6], [1, 7.2]];
  const TR_ESPALDA = [[0, 10.8], [0.08, 10.2], [0.2, 8.4], [0.32, 7.8], [0.48, 8.3], [0.7, 9.3], [0.86, 9.5], [0.94, 9.0], [1, 8.2]];
  /* anchos del tronco con una cúbica monótona (Fritsch–Carlson): pasa por cada valor de la
     tabla sin rebotes y sin las esquinas que dejaba la interpolación lineal en cada nodo */
  const _pend = new Map();
  function pendientes(tabla) {
    if (_pend.has(tabla)) return _pend.get(tabla);
    const n = tabla.length, d = [], m = new Array(n).fill(0);
    for (let i = 0; i < n - 1; i++) d.push((tabla[i + 1][1] - tabla[i][1]) / (tabla[i + 1][0] - tabla[i][0]));
    m[0] = d[0]; m[n - 1] = d[n - 2];
    for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (2 * d[i - 1] * d[i]) / (d[i - 1] + d[i]);
    _pend.set(tabla, m);
    return m;
  }
  const enPerfil = (tabla, s) => {
    if (s <= tabla[0][0]) return tabla[0][1];
    const m = pendientes(tabla);
    for (let q = 1; q < tabla.length; q++) if (s <= tabla[q][0]) {
      const [a, va] = tabla[q - 1], [b, vb] = tabla[q], h = b - a || 1, t = (s - a) / h, t2 = t * t, t3 = t2 * t;
      return (2 * t3 - 3 * t2 + 1) * va + (t3 - 2 * t2 + t) * h * m[q - 1] + (-2 * t3 + 3 * t2) * vb + (t3 - t2) * h * m[q];
    }
    return tabla[tabla.length - 1][1];
  };
  const unit = (a, b) => { const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 0.001; return { x: dx / d, y: dy / d, d }; };
  /* lado anterior (+1) o posterior (−1) de un hueso; normal anterior = ángulo − 90° */
  function ladoHueso(a, b, perfil, signo) {
    const u = unit(a, b), n = { x: u.y, y: -u.x };
    return perfil.map(([t, an, po]) => { const w = (signo > 0 ? an : po) * signo; return { x: a.x + (b.x - a.x) * t + n.x * w, y: a.y + (b.y - a.y) * t + n.y * w, t, dist: t * u.d }; });
  }
  /* articulación que flexiona: del lado del pliegue se cortan los puntos que se
     cruzarían y se pone el pliegue; del lado convexo, el relieve (rótula, olécranon) */
  function articular(prox, dist, centro, uA, uB, flex, w, lado) {
    const interior = rad(Math.max(10, 180 - Math.abs(flex)));
    const sAst = Math.min(14, w / Math.tan(interior / 2));
    const nA = lado > 0 ? { x: uA.y, y: -uA.x } : { x: -uA.y, y: uA.x }, nB = lado > 0 ? { x: uB.y, y: -uB.x } : { x: -uB.y, y: uB.x };
    let bx = nA.x + nB.x, by = nA.y + nB.y; const bl = Math.hypot(bx, by) || 1; bx /= bl; by /= bl;
    const pliegue = { x: centro.x + bx * Math.min(w / Math.sin(interior / 2), 7), y: centro.y + by * Math.min(w / Math.sin(interior / 2), 7) };
    const A = prox.filter(p => (prox[prox.length - 1].dist - p.dist) > sAst * 0.9 || p === prox[0]);
    const B = dist.filter(p => p.dist > sAst * 0.9 || p === dist[dist.length - 1]);
    return Math.abs(flex) > 25 ? [...A, pliegue, ...B] : [...prox, ...dist];
  }
  /* relieve redondeado del lado convexo de una articulación (rótula, olécranon): un arco
     entre las normales de los dos huesos; con la articulación recta, un solo punto */
  function arco(centro, uA, uB, r, lado) {
    const nA = lado > 0 ? { x: uA.y, y: -uA.x } : { x: -uA.y, y: uA.x }, nB = lado > 0 ? { x: uB.y, y: -uB.x } : { x: -uB.y, y: uB.x };
    const a0 = Math.atan2(nA.y, nA.x), d = Math.atan2(Math.sin(Math.atan2(nB.y, nB.x) - a0), Math.cos(Math.atan2(nB.y, nB.x) - a0));
    const ts = Math.abs(d) < rad(14) ? [0.5] : [0.15, 0.5, 0.85];
    return ts.map(t => ({ x: centro.x + Math.cos(a0 + d * t) * r, y: centro.y + Math.sin(a0 + d * t) * r }));
  }
  const perfEn = (T, t) => { for (let q = 1; q < T.length; q++) if (t <= T[q][0]) { const f = (t - T[q - 1][0]) / (T[q][0] - T[q - 1][0]); return [lerp(T[q - 1][1], T[q][1], f), lerp(T[q - 1][2], T[q][2], f)]; } return T[T.length - 1].slice(1); };
  /* puntos en el marco de un hueso: x a lo largo, y hacia la normal elegida */
  const enMarco = (o, ang, k, pts, signoY = 1) => {
    const u = { x: Math.cos(rad(ang)), y: Math.sin(rad(ang)) }, n = { x: -u.y * signoY, y: u.x * signoY };
    return pts.map(([x, y]) => ({ x: o.x + u.x * x * k + n.x * y, y: o.y + u.y * x * k + n.y * y }));
  };
  const cerrar = pts => `M${suave(pts)} Z`;
  /* tapa redondeada en la raíz (hombro, cadera): media vuelta por detrás de la articulación */
  function tapa(centro, u, rA, rP, n = 5) {
    const nA = { x: u.y, y: -u.x }, pts = [];
    for (let k = 1; k < n; k++) {
      const g = Math.PI * k / n, r = lerp(rP, rA, k / n);
      /* de posterior (−nA) a anterior (+nA) pasando por −u */
      pts.push({ x: centro.x - nA.x * r * Math.cos(g) - u.x * r * Math.sin(g) * 0.9, y: centro.y - nA.y * r * Math.cos(g) - u.y * r * Math.sin(g) * 0.9 });
    }
    return pts;
  }
  /* cada parte devuelve formas (relleno) y detalles (líneas finas); el contorno lo pone dibujoAnat */
  const forma = (d, fill) => ({ d, fill });
  const linea = (pts, col, ancho = 0.45) => `<path d="M${suave(pts)}" fill="none" style="stroke:${col.fino}" stroke-width="${ancho}" stroke-linecap="round"/>`;

  /* desde dónde se dibuja el muslo: la pierna cercana arranca dentro de la pelvis
     (que la envuelve); la lejana, desde la cadera con una tapa redondeada */
  const recortar = (perfil, t0) => {
    const i = perfil.findIndex(r => r[0] >= t0), a = perfil[i - 1], b = perfil[i];
    if (!a || b[0] === t0) return perfil.slice(Math.max(0, i));
    const u = (t0 - a[0]) / (b[0] - a[0]);
    return [[t0, lerp(a[1], b[1], u), lerp(a[2], b[2], u)], ...perfil.slice(i)];
  };
  function piernaAnat(m, col, envuelta = false) {
    const uA = unit(m.raiz, m.rod), uB = unit(m.rod, m.tobillo), flex = n180(m.aP - m.a0);
    const mA = ladoHueso(m.raiz, m.rod, envuelta ? recortar(C.PERF.muslo, 0.07) : C.PERF.muslo, 1), mP = ladoHueso(m.raiz, m.rod, envuelta ? recortar(C.PERF.muslo, 0.24) : C.PERF.muslo, -1);
    const pA = ladoHueso(m.rod, m.tobillo, C.PERF.pierna, 1), pP = ladoHueso(m.rod, m.tobillo, C.PERF.pierna, -1);
    /* rodilla: un arco suave sobre la rótula, sin punta */
    const rodilla = arco(m.rod, uA, uB, 4.75, 1);
    const ant = [...mA, ...rodilla, ...pA.slice(1)];
    const post = articular(mP, pP, m.rod, uA, uB, flex, 4.5, -1);
    /* pie en su marco (x hacia los dedos, y hacia la planta): fino, con el empeine largo,
       el arco de la planta marcado y el talón chico */
    const pie = enMarco(m.tobillo, m.aPie, m.e[2], C.PIE);
    /* la calza llega al tobillo; el pie va descalzo */
    const raiz = envuelta ? [] : tapa(m.raiz, uA, 4.2, 7.6);
    /* la calza llega hasta el 88 % de la pierna (el tobillo y el pie quedan descubiertos) */
    const corta = C.PERF.pierna.filter(([t]) => t <= 0.75).concat([[0.88, ...perfEn(C.PERF.pierna, 0.88)]]);
    const pAc = ladoHueso(m.rod, m.tobillo, corta, 1), pPc = ladoHueso(m.rod, m.tobillo, corta, -1);
    const calza = [...raiz, ...mA, ...rodilla, ...pAc.slice(1), ...[...articular(mP, pPc, m.rod, uA, uB, flex, 4.5, -1)].reverse()];
    /* piel solo donde se ve (tobillo y pie): así no asoma un borde claro bajo la calza */
    const pielPie = [...pA.filter(p => p.t >= 0.7), ...pie, ...[...pP.filter(p => p.t >= 0.7)].reverse()];
    return { f: [forma(cerrar(pielPie), col.piel), forma(cerrar(calza), col.calza)],
      l: [linea(ladoHueso(m.rod, m.tobillo, [[0.12, 0, 3.6], [0.3, 0, 4.2], [0.5, 0, 3.1]], -1), col, 0.3)] };
  }
  /* mano apoyada con la palma en el mat, vista de costado: el talón de la mano redondeado
     detrás de la muñeca, el dorso que baja de la muñeca a los nudillos y los dedos finos
     sobre el mat ([x hacia los dedos, altura sobre el piso]) */
  function manoEnPiso(m, ant, post, piso) {
    const sg = Math.cos(rad(m.aM)) >= 0 ? 1 : -1, k = m.e[2], W = m.muneca;
    const P = ([x, h]) => ({ x: W.x + sg * x * k, y: piso - h }), rel = q => (q.x - W.x) * sg;
    const antFrente = rel(ant[ant.length - 1]) > rel(post[post.length - 1]);
    /* el borde de adelante del antebrazo se corta donde empieza el dorso (pliegue de la muñeca) */
    const frente = antFrente ? ant : post, yC = piso - 3.8;
    let corte = frente.length;
    for (let i = frente.length - 1; i > 0; i--) if (frente[i - 1].y <= yC) { corte = i; break; }
    const a = frente[corte - 1], b = frente[corte] || a, f = b.y === a.y ? 1 : Math.max(0, Math.min(1, (yC - a.y) / (b.y - a.y)));
    const pliegue = { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f, esq: true };
    const recortado = [...frente.slice(0, corte), pliegue];
    const dorso = C.DORSO.filter(([x]) => x > rel(pliegue) + 0.6).map(P), mano = [...dorso, ...C.PALMA.map(P), ...C.TALON.map(P)];
    return antFrente ? { ant: recortado, post, mano } : { ant, post: recortado, mano: [...mano].reverse() };
  }
  function brazoAnat(m, col, piso = null) {
    const uA = unit(m.raiz, m.codo), uB = unit(m.codo, m.muneca), flex = n180(m.a0 - m.aA);
    const bA = ladoHueso(m.raiz, m.codo, C.PERF.brazo, 1), bP = ladoHueso(m.raiz, m.codo, C.PERF.brazo, -1);
    const aA = ladoHueso(m.codo, m.muneca, C.PERF.ante, 1), aP = ladoHueso(m.codo, m.muneca, C.PERF.ante, -1);
    const codo = arco(m.codo, uA, uB, 3.2, -1);
    const ant = articular(bA, aA, m.codo, uA, uB, flex, 3.1, 1);
    const post = [...bP, ...codo, ...aP.slice(1)];
    /* mano en su marco (x hacia los dedos, y hacia el pulgar): fina, con los dedos juntos
       que se afinan hacia la punta y el pulgar recogido junto al índice */
    const mano = enMarco(m.muneca, m.aM, m.e[2], C.MANO, -1);
    const raiz = tapa(m.raiz, uA, 4.8, 4.6);
    /* antebrazo apoyado (casi horizontal): la mano lo continúa; el dorso baja del borde de
       arriba del antebrazo a los nudillos y la palma sigue sobre el mat */
    if (piso != null && Math.abs(m.muneca.y - (piso - RMANO)) < 1.6 && Math.abs(Math.sin(rad(m.aM))) < 0.25 && Math.abs(Math.sin(rad(m.aA))) < 0.3) {
      const sg = Math.cos(rad(m.aM)) >= 0 ? 1 : -1, k = m.e[2], W = m.muneca;
      const P = ([x, h]) => ({ x: W.x + sg * x * k, y: piso - h });
      const antArriba = ant[ant.length - 1].y < post[post.length - 1].y;
      const dorso = C.DORSO.map(P), palma = C.PALMA.map(P), mano = [...dorso, ...palma];
      const contornoM = antArriba ? [...raiz, ...ant, ...mano, ...[...post].reverse()] : [...raiz, ...ant, ...[...mano].reverse(), ...[...post].reverse()];
      return { f: [forma(cerrar(contornoM), col.piel)], l: [linea(C.DEDOS_PISO.map(P), col, 0.22)] };
    }
    if (piso != null && Math.abs(m.muneca.y - (piso - RMANO)) < 1.6 && Math.abs(Math.sin(rad(m.aM))) < 0.25) {
      const z = manoEnPiso(m, ant, post, piso), sg = Math.cos(rad(m.aM)) >= 0 ? 1 : -1, k = m.e[2];
      const P = ([x, h]) => ({ x: m.muneca.x + sg * x * k, y: piso - h });
      return { f: [forma(cerrar([...raiz, ...z.ant, ...z.mano, ...[...z.post].reverse()]), col.piel)],
        l: [linea(C.DEDOS_PISO.map(P), col, 0.22)] };
    }
    const dedos = enMarco(m.muneca, m.aM, m.e[2], C.DEDOS, -1);
    return { f: [forma(cerrar([...raiz, ...ant, mano[mano.length - 1], ...mano.slice(0, -1).reverse(), ...[...post].reverse()]), col.piel)],
      l: [linea(dedos, col, 0.22)] };
  }
  function troncoAnat(E, col, aire, muslo, piso = null) {
    /* eje del tronco suavizado (Catmull-Rom por las 5 vértebras de control) */
    const P = E.col, ejes = [];
    for (let i = 0; i < 4; i++) for (let k = 0; k < 8; k++) {
      const t = k / 8, p0 = P[Math.max(0, i - 1)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(4, i + 2)];
      const t2 = t * t, t3 = t2 * t, cr = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      ejes.push({ x: cr(p0.x, p1.x, p2.x, p3.x), y: cr(p0.y, p1.y, p2.y, p3.y) });
    }
    ejes.push(P[4]);
    let largo = 0; const acum = [0];
    for (let i = 1; i < ejes.length; i++) { largo += Math.hypot(ejes[i].x - ejes[i - 1].x, ejes[i].y - ejes[i - 1].y); acum.push(largo); }
    const a = aire - 0.5, N = ejes.length;
    /* normal hacia el frente del cuerpo (a la izquierda del sentido cadera → hombros) */
    const nor = i => { const u = unit(ejes[Math.max(0, i - 1)], ejes[Math.min(N - 1, i + 1)]); return { x: -u.y, y: u.x, u }; };
    const fr = [], es = [];
    ejes.forEach((p, i) => {
      const s = acum[i] / largo, q = nor(i);
      let wf = enPerfil(C.TR_FRENTE, s), we = enPerfil(C.TR_ESPALDA, s);
      /* con la cámara 3D el tronco se ve con su volumen (ver proyectar) */
      if (E.vol) { const x = Math.max(0, Math.min(3, s * 4 - 0.5)), q = Math.min(2, Math.floor(x)), v = lerp(E.vol[q], E.vol[q + 1], x - q); wf *= v; we *= v; }
      /* respiración diafragmática y lateral: las costillas se abren a los costados y
         atrás; el pecho apenas sube y el abdomen se mueve poco (sigue activo) */
      if (s > 0.5 && s < 0.95) wf *= 1 + 0.03 * a * Math.sin((s - 0.5) / 0.45 * Math.PI);
      if (s > 0.15 && s < 0.4) wf *= 1 + 0.035 * a;
      if (s > 0.45 && s < 0.9) we *= 1 + 0.03 * a;
      fr.push({ x: p.x + q.x * wf, y: p.y + q.y * wf, s }); es.push({ x: p.x - q.x * we, y: p.y - q.y * we, s });
    });
    const q0 = nor(0), u0 = q0.u, H0 = ejes[0];
    /* Glúteo: es de la pelvis, no del muslo. En el marco de la pelvis (x adelante,
       y hacia la cabeza, origen en la cadera) es una curva redondeada detrás y debajo
       de la articulación; al flexionar la cadera la parte baja acompaña al muslo
       (el glúteo se estira y la tuberosidad isquiática queda abajo al sentarse) y al
       extenderla se recoge. Después se une al borde posterior del muslo (pliegue). */
    const enP = ([x, y]) => ({ x: H0.x + q0.x * x + u0.x * y, y: H0.y + q0.y * x + u0.y * y });
    const dM = unit(muslo.raiz, muslo.rod);
    const phi = Math.max(-40, Math.min(115, grad(Math.atan2(dM.x * q0.x + dM.y * q0.y, -(dM.x * u0.x + dM.y * u0.y)))));
    /* en extensión el glúteo se recoge poco (se contrae, no gira hacia atrás) */
    const girarG = ([x, y], w) => { const a = rad(phi * w * (phi < 0 ? 0.4 : 1)), c = Math.cos(a), sn = Math.sin(a); return [x * c - y * sn, x * sn + y * c]; };
    /* sentado, la parte baja (a ≤ 10,6 de la cadera) queda a la altura del apoyo de la pelvis */
    /* domo ancho: el punto más alto un poco por debajo de la cadera y una bajada larga
       (≈ 10 cm) hasta el pliegue con el muslo; contra el piso se aplana (ver piso) */
    const gluteo = C.GLUTEO.map(([p, w]) => enP(girarG(p, w)));
    const perfM = t => { const T = C.PERF.muslo; for (let q = 1; q < T.length; q++) if (t <= T[q][0]) { const f = (t - T[q - 1][0]) / (T[q][0] - T[q - 1][0]); return [lerp(T[q - 1][1], T[q][1], f), lerp(T[q - 1][2], T[q][2], f)]; } return T[T.length - 1].slice(1); };
    const atrasM = ladoHueso(muslo.raiz, muslo.rod, [[0.34, 0, perfM(0.34)[1]]], -1)[0];
    /* la pelvis cubre toda la raíz del muslo (hasta un 30 % del largo) para que no se vea la pierna lejana por un hueco */
    const frente30 = ladoHueso(muslo.raiz, muslo.rod, [[0.34, perfM(0.34)[0], 0]], 1)[0];
    /* pliegue de la ingle: donde se cruzan el frente del abdomen y el frente del muslo
       (sobre la bisectriz); de pie es el pubis, sentada es el fondo del pliegue */
    const nA = unit(muslo.raiz, ladoHueso(muslo.raiz, muslo.rod, [[0, 1, 0]], 1)[0]);
    let bx = q0.x + nA.x, by = q0.y + nA.y; const bl = Math.hypot(bx, by) || 1; bx /= bl; by /= bl;
    const medio = Math.acos(Math.max(-1, Math.min(1, q0.x * nA.x + q0.y * nA.y))) / 2;
    const dP = Math.min(9, 5.9 / Math.max(0.35, Math.cos(medio)));
    const pubis = { x: H0.x + bx * dP, y: H0.y + by * dP, esq: medio > rad(25) };
    const nalga = [...gluteo, { ...atrasM, esq: true }, { ...frente30, esq: true }];
    const qN = nor(N - 1), uN = qN.u, S = ejes[N - 1];
    /* arriba del hombro: por delante la zona de la clavícula sube hacia el cuello y por
       detrás el trapecio baja del cuello al hombro (sin escalón) */
    const sobre = (a, w) => ({ x: S.x + uN.x * a + qN.x * w, y: S.y + uN.y * a + qN.y * w });
    /* en el marco del cuello (hacia la cabeza) y justo sobre su borde: el pecho sube y
       se funde con el cuello sin piquito, aunque la cabeza esté flexionada */
    const uC = unit(S, E.C); let nC = { x: uC.y, y: -uC.x };
    if (nC.x * E.antCab.x + nC.y * E.antCab.y < 0) nC = { x: -nC.x, y: -nC.y };
    const enCuello = (t, w) => ({ x: S.x + (E.C.x - S.x) * t + nC.x * w, y: S.y + (E.C.y - S.y) * t + nC.y * w });
    const bordeF = t => lerp(4.2, 3.5, (t + 0.15) / 0.65), bordeE = t => -lerp(5.0, 3.9, (t + 0.2) / 0.6);
    /* sin escalón ni "cuello de tubo": adelante la clavícula baja a la garganta; atrás el
       trapecio baja en diagonal desde la mitad del cuello hasta la espalda alta */
    /* termina justo en los vértices del contorno del cuello (cuelloAnat: 3,75 adelante a
       0,2 y 4,05 atrás a 0,22), así el borde es uno solo y no quedan muescas */
    /* las dos uniones son curvas (Bézier) que salen del tronco en su dirección y llegan
       al cuello en la del cuello: se adaptan solas si la cabeza se flexiona o se extiende */
    const mas = (p, u, k) => ({ x: p.x + u.x * k, y: p.y + u.y * k });
    const bez = (A, B, D, F, n) => Array.from({ length: n }, (_, i) => { const t = (i + 1) / (n + 1), m = 1 - t;
      return { x: m * m * m * A.x + 3 * m * m * t * B.x + 3 * m * t * t * D.x + t * t * t * F.x, y: m * m * m * A.y + 3 * m * m * t * B.y + 3 * m * t * t * D.y + t * t * t * F.y }; });
    /* arrancan donde termina el perfil (s ≤ 0,93) siguiendo su dirección: sin el escalón
       que quedaba entre el ancho del perfil y el comienzo de la curva */
    const sH = 0.93, frH = fr.filter(p => p.s <= sH), esH = es.filter(p => p.s <= sH);
    /* el cuello sigue siendo una columna: la unión es corta (de la base del cuello, t ≈ 0,2,
       a la línea de los hombros), una curva que redondea sin abrirse en cono */
    const F3 = frH[frH.length - 1], B3 = esH[esH.length - 1], F0 = enCuello(0.2, 3.75), B0 = enCuello(0.22, -4.05);
    const tF = unit(frH[frH.length - 2], F3), tB = unit(esH[esH.length - 2], B3);
    const hombroF = [...bez(F3, mas(F3, tF, 2.2), mas(F0, uC, -1.8), F0, 4), { ...F0, esq: true }];
    const hombroE = [{ ...B0, esq: true }, ...bez(B0, mas(B0, uC, -1.8), mas(B3, tB, 2.6), B3, 5)];
    /* lo blando que toca el piso (glúteo, busto, espalda) se aplana un poco contra él */
    const apl = p => (piso == null ? p : p.y > piso + 0.5 ? { ...p, y: piso + 0.5 } : p.y > piso - 1 ? { ...p, y: piso } : p);
    const contorno = [pubis, ...frH, ...hombroF, ...hombroE, ...[...esH].reverse(), ...nalga].map(apl);
    /* musculosa: escote adelante (sobre el busto) y atrás (espalda alta), con el bretel
       que pasa por el hombro; arriba de eso se ve la piel (trapecio, clavícula, cuello) */
    const sF = 0.87, sE = 0.95, frT = fr.filter(p => p.s <= sF), esT = es.filter(p => p.s <= sE);
    const escote = [{ ...frT[frT.length - 1], esq: true }, sobre(-1.2, 3.6), sobre(0.6, 1.6), sobre(1.5, -1.2), sobre(1.0, -4.6), { ...esT[esT.length - 1], esq: true }];
    const musculosa = [pubis, ...frT.slice(0, -1), ...escote, ...[...esT.slice(0, -1)].reverse(), ...nalga].map(apl);
    /* calza: de la cadera hasta la cintura (s < 0.3) */
    const corte = 0.3, frC = fr.filter(p => p.s <= corte), esC = es.filter(p => p.s <= corte);
    const calza = [pubis, ...frC.slice(0, -1), { ...frC[frC.length - 1], esq: true }, { ...esC[esC.length - 1], esq: true }, ...[...esC.slice(0, -1)].reverse(), ...nalga].map(apl);
    /* borde de la calza (cintura) */
    const cint = [frC[frC.length - 1], esC[esC.length - 1]];
    return { f: [forma(cerrar(contorno), col.piel), forma(cerrar(musculosa), col.top), forma(cerrar(calza), col.calza)],
      l: [`<path d="M${f1(cint[0].x)},${f1(cint[0].y)} L${f1(cint[1].x)},${f1(cint[1].y)}" style="stroke:${col.fino}" stroke-width=".4"/>`,
        `<path d="M${suave(escote.map(apl))}" fill="none" style="stroke:${col.fino}" stroke-width=".4"/>`] };
  }
  function cabezaAnat(E, col) {
    const c = E.C, f = E.antCab, u = E.arriba;
    const P = ([x, y]) => ({ x: c.x + f.x * x + u.x * y, y: c.y + f.y * x + u.y * y });
    const pts = xs => xs.map(P);
    const piel = pts([[6.3, 6.8], [8.7, 3.6], [9.6, 1.4], [9.1, 0.2], [10.8, -1.6], [12.0, -2.7], [10.4, -3.3], [9.7, -3.4], [10.2, -4.3], [9.6, -4.9], [10.0, -5.4], [9.2, -6.2], [9.7, -7.3], [8.3, -8.6], [5.0, -8.6], [1.4, -6.6], [-4.6, -6.4], [-8.6, -2.6], [-9.4, 1.6], [-6.4, 7.6], [0, 9.8], [4.0, 9.0]]);
    const pelo = pts([[6.6, 6.4], [5.6, 8.4], [2.0, 10.2], [-3.4, 10.0], [-8.4, 6.4], [-10.0, 1.4], [-9.2, -3.0], [-6.4, -5.2], [-4.2, -3.6], [-2.6, 0.6], [0.2, 3.4], [3.6, 5.0]]);
    const rodete = P([-9.4, 6.2]);
    const ojo = pts([[5.9, 0.5], [7.0, 1.25], [8.1, 0.6], [7.0, -0.1]]);
    const iris = P([7.25, 0.5]);
    const ceja = pts([[5.6, 2.3], [7.2, 2.8], [8.7, 2.3]]);
    const boca = pts([[9.6, -4.9], [8.2, -5.0]]);
    const labioS = pts([[9.7, -3.5], [10.2, -4.3], [9.6, -4.9], [8.6, -4.6]]);
    const labioI = pts([[9.6, -4.9], [10.0, -5.4], [9.3, -6.0], [8.6, -5.3]]);
    const fosa = pts([[10.9, -2.9], [10.2, -2.6], [9.9, -3.0]]);
    const oreja = P([-0.6, -0.8]), angOreja = Math.atan2(u.y, u.x) * 180 / Math.PI;
    const mechones = [pts([[4.0, 8.4], [0.4, 8.6], [-4.6, 7.0]]), pts([[2.6, 5.2], [-1.6, 6.6], [-6.8, 3.8]]), pts([[-1.0, 2.4], [-5.2, 3.0], [-8.0, -0.6]])];
    return { f: [forma(cerrar(piel), col.piel), { d: `M${f1(rodete.x + 4.1)},${f1(rodete.y)} A4.1,4.1 0 1 0 ${f1(rodete.x - 4.1)},${f1(rodete.y)} A4.1,4.1 0 1 0 ${f1(rodete.x + 4.1)},${f1(rodete.y)} Z`, fill: col.pelo }, forma(cerrar(pelo), col.pelo)],
      l: [`<path d="M${suave(labioS)} Z" style="fill:${col.labio}" opacity=".8"/><path d="M${suave(labioI)} Z" style="fill:${col.labio}" opacity=".65"/>`,
        `<ellipse cx="${f1(oreja.x)}" cy="${f1(oreja.y)}" rx="2.3" ry="1.45" transform="rotate(${f1(angOreja)} ${f1(oreja.x)} ${f1(oreja.y)})" style="fill:${col.pielS}" opacity=".55"/><path d="M${suave(pts([[0.3, 0.9], [-1.4, 0.4], [-1.5, -1.6], [-0.4, -2.6]]))}" fill="none" stroke="${col.tinta}" stroke-width=".35"/>`,
        `<path d="M${suave([...ojo, ojo[0]])}" fill="${col.blanco || '#fff'}" stroke="${col.tinta}" stroke-width=".3"/><circle cx="${f1(iris.x)}" cy="${f1(iris.y)}" r=".62" fill="${col.ojo || '#222'}"/>`,
        `<path d="M${suave(ojo.slice(0, 3))}" fill="none" stroke="${col.ojo || '#222'}" stroke-width=".55" stroke-linecap="round"/>`,
        `<path d="M${suave(ceja)}" fill="none" style="stroke:${col.pelo}" stroke-width=".8" stroke-linecap="round"/>`,
        `<path d="M${suave(boca)}" fill="none" stroke="${col.tinta}" stroke-width=".4" stroke-linecap="round"/>`,
        `<path d="M${suave(fosa)}" fill="none" stroke="${col.tinta}" stroke-width=".35"/>`,
        ...mechones.map(m => `<path d="M${suave(m)}" fill="none" stroke="rgba(255,255,255,.14)" stroke-width=".5"/>`)] };
  }
  function cuelloAnat(E, col) {
    const u = unit(E.S, E.C), n = { x: u.y, y: -u.x };
    const p = (t, w) => ({ x: E.S.x + (E.C.x - E.S.x) * t + n.x * w, y: E.S.y + (E.C.y - E.S.y) * t + n.y * w });
    /* el frente del cuello es la normal anterior del tronco */
    const fr = E.antCab, sig = (n.x * fr.x + n.y * fr.y) > 0 ? 1 : -1;
    /* la base del cuello nace dentro del tronco y sus bordes empiezan en los vértices donde
       termina el tronco (trapecio y clavícula): así su contorno no asoma en la unión */
    /* bordes limpios (esquinas en las uniones, donde la curva del tronco llega tangente al
       cuello): sin el suavizado que inflaba la garganta y la nuca; la nuca, apenas cóncava */
    const E_ = q => ({ ...q, esq: true });
    const pts = [E_(p(-0.3, 0)), E_(p(0.2, 3.75 * sig)), E_(p(0.98, 3.3 * sig)), E_(p(0.98, -4.0 * sig)), p(0.6, -3.8 * sig), E_(p(0.22, -4.05 * sig))];
    return { f: [forma(cerrar(pts), col.piel)], l: [linea([p(0.1, -2.6 * sig), p(0.55, 1.6 * sig), p(0.85, 2.8 * sig)], col, 0.35)] };
  }
  /* columna vertebral (capa didáctica): sacro, 5 lumbares, 12 dorsales y 7 cervicales */
  function columnaSVG(E) {
    const P = E.col, ejes = [];
    for (let i = 0; i < 4; i++) for (let k = 0; k < 6; k++) { const t = k / 6; ejes.push({ x: lerp(P[i].x, P[i + 1].x, t), y: lerp(P[i].y, P[i + 1].y, t) }); }
    ejes.push(P[4]);
    let largo = 0; const acum = [0];
    for (let i = 1; i < ejes.length; i++) { largo += Math.hypot(ejes[i].x - ejes[i - 1].x, ejes[i].y - ejes[i - 1].y); acum.push(largo); }
    const en = s => { const L = s * largo; let i = 1; while (i < acum.length - 1 && acum[i] < L) i++; const t = (L - acum[i - 1]) / (acum[i] - acum[i - 1] || 1); const a = ejes[i - 1], b = ejes[i], u = unit(a, b); return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), u }; };
    const vert = (q, w, l, extra = '') => { const ang = Math.atan2(q.u.y, q.u.x) * 180 / Math.PI; return `<rect x="${f1(q.x - l / 2)}" y="${f1(q.y - w / 2)}" width="${f1(l)}" height="${f1(w)}" rx="${f1(w / 3)}" transform="rotate(${f1(ang)} ${f1(q.x)} ${f1(q.y)})" class="vert${extra}"/>`; };
    let out = '';
    for (let k = 0; k < 17; k++) {
      const s = 0.1 + (k + 0.5) / 17 * 0.9, q = en(s), atras = enPerfil(C.TR_ESPALDA, s) - 3.8;
      const pt = { x: q.x + q.u.y * atras, y: q.y - q.u.x * atras, u: q.u };
      out += vert(pt, k < 5 ? 3.4 : 2.9, largo * 0.9 / 17 * 0.74, k < 5 ? ' lumbar' : ' dorsal');
    }
    const q0 = en(0.04), at0 = enPerfil(C.TR_ESPALDA, 0.04) - 3.6;
    out += vert({ x: q0.x + q0.u.y * at0, y: q0.y - q0.u.x * at0, u: q0.u }, 4.2, largo * 0.09, ' sacro');
    const uc = unit(E.S, E.C);
    for (let k = 0; k < 7; k++) {
      const t = (k + 0.5) / 7 * 0.9, q = { x: lerp(E.S.x, E.C.x, t) - uc.y * 1.8 * 0, y: lerp(E.S.y, E.C.y, t), u: uc };
      const fr = E.antCab, pt = { x: q.x - fr.x * 1.8, y: q.y - fr.y * 1.8, u: uc };
      out += vert(pt, 2.3, Math.hypot(E.C.x - E.S.x, E.C.y - E.S.y) * 0.9 / 7 * 0.72, ' cervical');
    }
    return `<g class="columna">${out}</g>`;
  }
  /* Capas por profundidad (lado lejano, cuerpo con la pierna cercana, brazo cercano).
     En cada capa: primero todas las formas con un trazo grueso (el contorno) y
     encima los rellenos, así las uniones (cadera, cuello) no muestran costuras y
     la silueta queda bien definida. */
  function dibujoAnat(E, fantasma, orden, aire, piso = null) {
    const c1 = ANAT.cerca, c2 = ANAT.lejos;
    const P = { BC: brazoAnat(E.seg.bc, c1, piso), BL: brazoAnat(E.seg.bl, c2, piso), PC: piernaAnat(E.seg.pc, c1, true), PL: piernaAnat(E.seg.pl, c2), T: troncoAnat(E, c1, aire ?? 0.5, E.seg.pc, piso) };
    const cu = cuelloAnat(E, c1), ca = cabezaAnat(E, c1);
    P.C = { f: [...cu.f, ...ca.f], l: [...cu.l, ...ca.l] };
    const seq = orden || ['BL', 'PL', 'C', 'T', 'PC', 'BC'];
    const capas = [];
    for (const k of seq) {
      const grupo = k === 'BL' || k === 'PL' ? 'lejos' : k === 'BC' ? 'brazo' : 'cuerpo';
      const ult = capas[capas.length - 1];
      if (ult && ult.g === grupo) ult.ks.push(k); else capas.push({ g: grupo, ks: [k] });
    }
    const svg = capas.map(({ g, ks }) => {
      const col = g === 'lejos' ? c2 : c1, fs = ks.flatMap(k => P[k].f);
      return `<g>${fs.map(x => `<path d="${x.d}" style="fill:${col.linea};stroke:${col.linea}" stroke-width="1.1" stroke-linejoin="round"/>`).join('')}${fs.map(x => `<path d="${x.d}" style="fill:${x.fill}"/>`).join('')}${ks.flatMap(k => P[k].l).join('')}</g>`;
    }).join('');
    return `<g class="${fantasma ? 'fig-fantasma' : 'fig-cuerpo'}">${svg}</g>`;
  }

  /* ---------- vista desde arriba (estilo anatómico) ----------
     De costado, desde arriba se ve la silueta sagital: se usa el dibujo de perfil.
     Sentado, desde arriba (E.fr) se ve otra cosa: la coronilla con el rodete, la
     cintura escapular y los brazos, la pelvis que asoma atrás y a los costados y
     las piernas enteras con los pies hacia el techo. rot gira el tórax, los brazos
     y la cabeza sobre la pelvis quieta. */
  /* mat de 180 × 60 cm a la escala de la figura (≈ 1,08 cm por unidad) */
  function tapete(ej, enc) {
    if (camDe(ej)) return tapete3d(ej, enc);
    if (ej.camara !== 'arriba' || (ej.estilo || ESTILO) !== 'anatomico') return '';
    const E = mover(cuadro(ej, 0, 0).E, enc.cx, enc.cy), largo = 166, ancho = 56;
    let x, y, w, h;
    /* de frente con el tronco a lo largo de la imagen vertical (sentada, también reclinada) */
    const vertical = E.fr && (E.kt < 0.5 || Math.abs(E.C.x - E.H.x) < Math.abs(E.C.y - E.H.y));
    if (vertical) {
      /* sentada: el mat sigue a lo largo de las piernas y empieza detrás de las manos */
      w = ancho; h = largo; x = E.H.x - w / 2; y = Math.min(E.H.y - 24, E.seg.bc.mano.y - 8, E.seg.bl.mano.y - 8, E.C.y - 14);
    } else if (E.fr) {
      /* acostada boca arriba vista desde arriba: el mat a lo largo del cuerpo, la cabeza cerca de un extremo */
      const izq = E.C.x < E.H.x;
      w = largo; h = ancho; x = izq ? E.C.x - 14 : E.C.x + 14 - w; y = E.H.y - h / 2;
    } else {
      /* de costado: el tronco en línea con el borde posterior del mat (abajo en la
         imagen, la espalda) y los pies llegando al borde anterior */
      const atras = E.ant.y < 0 ? 1 : -1, izq = E.C.x < E.H.x;
      /* la cabeza (y el codo de abajo, que va más allá) cerca de un extremo */
      const borde = izq ? Math.min(E.C.x - 14, E.seg.bl.codo.x - 7, E.seg.bc.codo.x - 7) : Math.max(E.C.x + 14, E.seg.bl.codo.x + 7, E.seg.bc.codo.x + 7);
      w = largo; h = ancho; x = izq ? borde : borde - w;
      y = atras > 0 ? E.S.y + 12 - h : E.S.y - 12;
    }
    const lineas = vertical ? [0.25, 0.5, 0.75].map(t => `<line x1="${f1(x + 4)}" y1="${f1(y + h * t)}" x2="${f1(x + w - 4)}" y2="${f1(y + h * t)}" class="fig-mat-raya"/>`).join('')
      : [0.25, 0.5, 0.75].map(t => `<line x1="${f1(x + w * t)}" y1="${f1(y + 4)}" x2="${f1(x + w * t)}" y2="${f1(y + h - 4)}" class="fig-mat-raya"/>`).join('');
    return `<g class="fig-tapete"><rect x="${f1(x)}" y="${f1(y)}" width="${f1(w)}" height="${f1(h)}" rx="5" class="fig-mat-arriba"/>${lineas}</g>`;
  }
  /* contorno de un miembro visto de frente: radios simétricos a lo largo de un camino */
  function tubo(pts, rs) {
    const n = pts.length, I = [], D = [];
    const dir = i => unit(pts[Math.max(0, i - 1)], pts[Math.min(n - 1, i + 1)]);
    for (let i = 0; i < n; i++) { const u = dir(i), no = { x: -u.y, y: u.x }; I.push({ x: pts[i].x + no.x * rs[i], y: pts[i].y + no.y * rs[i] }); D.push({ x: pts[i].x - no.x * rs[i], y: pts[i].y - no.y * rs[i] }); }
    const tapaEn = (c, u, r, sg) => [0.3, 0.5, 0.7].map(t => { const g = Math.PI * t, no = { x: -u.y, y: u.x }; return { x: c.x + sg * (u.x * r * Math.sin(g) + no.x * r * Math.cos(g)), y: c.y + sg * (u.y * r * Math.sin(g) + no.y * r * Math.cos(g)) }; });
    return cerrar([...I, ...tapaEn(pts[n - 1], dir(n - 1), rs[n - 1], 1), ...D.reverse(), ...tapaEn(pts[0], dir(0), rs[0], -1)]);
  }
  const tramo = (a, b, ts) => ts.map(t => ({ x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) }));
  const elipse = (c, u, rLargo, rAncho, fill) => {
    const no = { x: -u.y, y: u.x }, pts = [];
    for (let k = 0; k < 12; k++) { const g = k / 12 * Math.PI * 2; pts.push({ x: c.x + u.x * rLargo * Math.cos(g) + no.x * rAncho * Math.sin(g), y: c.y + u.y * rLargo * Math.cos(g) + no.y * rAncho * Math.sin(g) }); }
    return forma(cerrar(pts), fill);
  };
  function dibujoArriba(E, fantasma, aire = 0.5) {
    const col = ANAT.cerca;
    const capa = (fs, ls = []) => `<g>${fs.map(x => `<path d="${x.d}" style="fill:${col.linea};stroke:${col.linea}" stroke-width="1.1" stroke-linejoin="round"/>`).join('')}${fs.map(x => `<path d="${x.d}" style="fill:${x.fill}"/>`).join('')}${ls.join('')}</g>`;
    /* ejes: u = de la cadera L a la C (pelvis, no gira), f = hacia adelante (las piernas) */
    const uP = unit(E.cad.pl, E.cad.pc), mid = p => ({ x: (E.seg.pc[p].x + E.seg.pl[p].x) / 2, y: (E.seg.pc[p].y + E.seg.pl[p].y) / 2 });
    const rodM = mid('rod');
    let fP = { x: -uP.y, y: uP.x };
    if ((rodM.x - E.H.x) * fP.x + (rodM.y - E.H.y) * fP.y < 0) fP = { x: -fP.x, y: -fP.y };
    const uH = unit(E.hom.bl, E.hom.bc);
    let fH = { x: -uH.y, y: uH.x };
    if (fH.x * fP.x + fH.y * fP.y < 0) fH = { x: -fH.x, y: -fH.y };
    const L2 = (c, u, f) => ([x, y]) => ({ x: c.x + u.x * x + f.x * y, y: c.y + u.y * x + f.y * y });
    /* piernas: muslo, rodilla y pierna vistos por delante; el pie con los dedos hacia el techo */
    const piernas = [], pies = [], rodillas = [];
    for (const k of ['pc', 'pl']) {
      const m = E.seg[k], uPie = unit(m.tobillo, m.punta), lp = Math.hypot(m.punta.x - m.tobillo.x, m.punta.y - m.tobillo.y);
      pies.push(elipse({ x: m.tobillo.x + uPie.x * (lp * 0.45 + 1.2), y: m.tobillo.y + uPie.y * (lp * 0.45 + 1.2) }, uPie, lp * 0.45 + 2.6, 4.1, col.piel));
      const pts = [...tramo(m.raiz, m.rod, [0, 0.3, 0.65, 1]), ...tramo(m.rod, m.tobillo, [0.22, 0.5, 0.78, 1])];
      piernas.push(forma(tubo(pts, C.ARRIBA_PIERNA), col.calza));
      const ur = unit(m.raiz, m.tobillo);
      rodillas.push(`<ellipse cx="${f1(m.rod.x)}" cy="${f1(m.rod.y)}" rx="2.6" ry="2.2" transform="rotate(${f1(Math.atan2(ur.y, ur.x) * 180 / Math.PI)} ${f1(m.rod.x)} ${f1(m.rod.y)})" fill="none" style="stroke:${col.fino}" stroke-width=".5"/>`);
    }
    const dedos = ['pc', 'pl'].map(k => { const m = E.seg[k], u = unit(m.tobillo, m.punta), no = { x: -u.y, y: u.x }, lp = Math.hypot(m.punta.x - m.tobillo.x, m.punta.y - m.tobillo.y), c = { x: m.tobillo.x + u.x * (lp * 0.9 + 3), y: m.tobillo.y + u.y * (lp * 0.9 + 3) };
      return [-2.4, -0.8, 0.8, 2.4].map(d => `<path d="M${f1(c.x + no.x * d - u.x * 1.2)},${f1(c.y + no.y * d - u.y * 1.2)} L${f1(c.x + no.x * d + u.x * 0.2)},${f1(c.y + no.y * d + u.y * 0.2)}" style="stroke:${col.fino}" stroke-width=".4" stroke-linecap="round"/>`).join(''); });
    /* pelvis: no gira; asoma detrás del tronco (glúteos) y a los costados (caderas) */
    const PL = L2(E.H, uP, fP);
    const pelvis = forma(cerrar([[-15.6, -1], [-14.8, -7.5], [-9, -12.6], [0, -13.6], [9, -12.6], [14.8, -7.5], [15.6, -1], [13.5, 5], [6, 7.5], [0, 7], [-6, 7.5], [-13.5, 5]].map(PL)), col.calza);
    /* tórax y cintura escapular (gira con rot); la respiración ensancha las costillas */
    const S0 = { x: (E.hom.bc.x + E.hom.bl.x) / 2, y: (E.hom.bc.y + E.hom.bl.y) / 2 }, ea = 1 + 0.05 * (aire - 0.5), fa = 1 + 0.025 * (aire - 0.5);
    const TH = ([x, y]) => L2(S0, uH, fH)([x * ea, y * fa]);
    const torax = forma(cerrar([[0, -7.4], [7, -7.8], [13, -7.0], [17.4, -4.4], [18.8, -0.2], [17.6, 3.8], [13.6, 5.8], [8.6, 9.2], [3.8, 9.9], [0, 8.6], [-3.8, 9.9], [-8.6, 9.2], [-13.6, 5.8], [-17.6, 3.8], [-18.8, -0.2], [-17.4, -4.4], [-13, -7.0], [-7, -7.8]].map(TH)), col.top);
    const escote = forma(cerrar([[-6.4, 1.6], [-3.6, 5.6], [0, 6.6], [3.6, 5.6], [6.4, 1.6], [0, 0.6]].map(TH)), col.piel);
    const omoplatos = [-1, 1].map(sg => linea([[sg * 4.2, -5.6], [sg * 8.6, -6.4], [sg * 12.4, -4.6]].map(TH), col, 0.45));
    /* brazos: del hombro a la mano, vistos desde arriba con la palma hacia el piso */
    const brazos = [], manos = [];
    for (const k of ['bc', 'bl']) {
      const m = E.seg[k], uM = unit(m.muneca, m.mano), lm = Math.hypot(m.mano.x - m.muneca.x, m.mano.y - m.muneca.y);
      manos.push(elipse({ x: m.muneca.x + uM.x * (lm * 0.55), y: m.muneca.y + uM.y * (lm * 0.55) }, uM, lm * 0.55 + 1.6, 3.5, col.piel));
      const pts = [...tramo(m.raiz, m.codo, [0, 0.25, 0.6, 1]), ...tramo(m.codo, m.muneca, [0.25, 0.6, 1])];
      brazos.push(forma(tubo(pts, C.ARRIBA_BRAZO), col.piel));
    }
    /* cabeza: coronilla (pelo tirado hacia atrás y rodete), orejas y la punta de la nariz */
    const CB = L2({ x: S0.x + fH.x * 1.6, y: S0.y + fH.y * 1.6 }, uH, fH);
    const cara = forma(cerrar([[0, 9.6], [3.6, 8.6], [6.4, 5.4], [7.2, 0.6], [6.4, -4.6], [3.8, -8], [0, -8.8], [-3.8, -8], [-6.4, -4.6], [-7.2, 0.6], [-6.4, 5.4], [-3.6, 8.6]].map(CB)), col.piel);
    const nariz = forma(cerrar([[-1.3, 8.8], [-0.9, 10.9], [0, 11.5], [0.9, 10.9], [1.3, 8.8]].map(CB)), col.piel);
    const orejas = [-1, 1].map(sg => elipse(CB([sg * 7.3, 0.4]), fH, 2.1, 1.1, col.piel));
    const pelo = forma(cerrar([[0, 7.6], [3.6, 6.9], [6.2, 4.2], [6.9, 0], [6.1, -4.6], [3.6, -7.9], [0, -8.7], [-3.6, -7.9], [-6.1, -4.6], [-6.9, 0], [-6.2, 4.2], [-3.6, 6.9]].map(CB)), col.pelo);
    const rodete = elipse(CB([0, -5.4]), fH, 3.6, 3.6, col.pelo);
    const mechones = [-4.6, -2.2, 0, 2.2, 4.6].map(x => `<path d="M${suave([[x * 1.05, 6.6], [x * 0.8, 1.6], [x * 0.45, -2.6]].map(CB))}" fill="none" stroke="rgba(255,255,255,.16)" stroke-width=".5"/>`);
    const vuelta = `<path d="M${suave([[-3, -5.4], [0, -2.2], [3, -5.4]].map(CB))}" fill="none" stroke="rgba(255,255,255,.18)" stroke-width=".5"/>`;
    const svg = capa(pies, dedos) + capa(piernas, rodillas) + capa([pelvis]) + capa([torax, escote], omoplatos) + capa(manos) + capa(brazos) + capa([...orejas, cara, nariz]) + capa([pelo, rodete], [...mechones, vuelta]);
    return `<g class="${fantasma ? 'fig-fantasma' : 'fig-cuerpo'}">${svg}</g>`;
  }

  /* ---------- vista de frente (estilo anatómico) ----------
     Plano frontal: la misma silueta grácil vista de frente. Tronco con cadera,
     cintura y caja torácica; top deportivo con breteles anchos y escote, calza
     hasta el tobillo; brazos y piernas con la rodilla y el codo en arco; cara de
     frente con el pelo tirado hacia atrás (el rodete asoma arriba). Sirve de pie,
     sentada de frente, de costado vista de frente y acostada vista desde arriba. */
  /* medio ancho del tronco según la altura (0 cadera … 0,86 axila) */
  const TRF = [[-0.02, 14.2], [0.06, 14.4], [0.14, 13.6], [0.22, 12.0], [0.3, 10.7], [0.38, 10.1], [0.46, 10.2], [0.56, 10.9], [0.66, 11.6], [0.76, 12.0], [0.86, 12.4]];
  /* miembros de frente: [t, lado de afuera, lado de adentro] */
  const PERF_F = {
    muslo:  [[0, 7.0, 5.6], [0.18, 6.6, 5.8], [0.45, 5.6, 5.2], [0.75, 4.8, 4.6], [1, 4.4, 4.0]],
    pierna: [[0, 4.4, 4.0], [0.22, 4.4, 4.3], [0.48, 3.6, 3.7], [0.8, 2.8, 2.6], [1, 2.5, 2.3]],
    brazo:  [[0, 4.6, 4.0], [0.2, 4.5, 3.9], [0.5, 3.8, 3.4], [0.85, 3.2, 3.0], [1, 3.0, 2.9]],
    ante:   [[0, 3.0, 2.9], [0.25, 3.2, 3.0], [0.6, 2.6, 2.4], [1, 2.0, 1.9]]
  };
  /* mano vista de canto (del lado del pulgar) y pie de frente: x hacia la punta */
  const MANO_F = [[0, -1.9], [2.5, -2.1], [5, -1.9], [7.5, -1.3], [9.2, -0.5], [9.6, 0.3], [8.6, 1.1], [6.4, 1.6], [5.6, 2.4], [3.8, 3.0], [1.6, 2.6], [0, 2.0]];
  const PIE_F = [[-1.5, -2.5], [1, -2.7], [4, -2.6], [7.5, -2.5], [10.5, -2.4], [12.6, -1.9], [13.9, -0.8], [14.1, 0.4], [13.2, 1.7], [10.5, 2.4], [7, 2.4], [3.5, 2.4], [1, 2.6], [-1.5, 2.3], [-2.6, 0]];
  /* ---------- la piel ----------
     El esqueleto (largos de los huesos y poses) es uno solo; la piel son estas tablas de
     anchos y formas. gracil es la silueta de la app; modelo toma la estructura de la
     modelo de las fotos de Pre-Pilates: muslos, cadera, glúteo y pantorrillas algo más
     llenos, cintura menos marcada y manos y pies de tamaño natural. ej.cuerpo o
     FIGURA.cuerpo() eligen cuál se dibuja. */
  const escalar = (pts, kx, ky = 1, kxNeg = kx) => pts.map(([x, y]) => [x * (x < 0 ? kxNeg : kx), y * ky]);
  const CUERPOS = {
    gracil: {
      PERF, TR_FRENTE, TR_ESPALDA, TRF, PERF_F, MANO_F, PIE_F, CALZA_88: [2.65, 2.45],
      GLUTEO: [[[-10.95, -2.5], 0.2], [[-10.6, -5.0], 0.35], [[-9.6, -7.5], 0.55], [[-8.3, -10.0], 0.75]],
      PIE: [[0.8, -2.1], [4, -1.7], [8, -1.05], [11.4, -0.45], [13.5, 0.05], [14.4, 0.75], [13.6, 1.5], [10.6, 1.85], [8, 1.35], [5.5, 1.15], [2.6, 1.75], [0.4, 2.3], [-2.4, 1.75], [-3.2, 0.3], [-2.4, -1.6], [-1.0, -2.3]],
      MANO: [[0, -1.75], [2.4, -2.05], [4.4, -2.35], [5.6, -2.15], [6.3, -1.45], [8.4, -0.95], [9.9, -0.2], [9.8, 0.55], [8.4, 0.95], [6, 1.55], [3, 1.75], [0, 1.75]],
      DEDOS: [[6.6, 0.45], [9.0, 0.1]],
      DORSO: [[2.8, 3.3], [4.6, 2.75], [6.1, 2.2], [7.6, 1.6], [9.2, 1.2], [10.3, 0.85], [10.8, 0.4], [10.5, 0]],
      PALMA: [[8, 0], [4.5, 0], [1, 0]], TALON: [[-0.6, 0.2], [-1.5, 0.75], [-2.0, 1.6]], DEDOS_PISO: [[6.4, 1.45], [9.3, 0.8]],
      ARRIBA_PIERNA: [6.6, 6.1, 5.3, 4.35, 4.35, 3.85, 3.1, 2.45], ARRIBA_BRAZO: [4.4, 4.0, 3.45, 3.0, 3.0, 2.6, 2.05]
    }
  };
  {
    const g = CUERPOS.gracil;
    CUERPOS.modelo = {
      PERF: {
        muslo:  [[0, 6.1, 8.6], [0.15, 6.4, 8.3], [0.42, 6.8, 7.25], [0.7, 6.05, 5.85], [0.9, 5.25, 4.85], [1, 5.0, 4.5]],
        pierna: [[0, 4.6, 4.4], [0.12, 4.0, 5.5], [0.3, 3.7, 5.85], [0.5, 3.2, 4.55], [0.75, 2.6, 3.0], [1, 2.4, 2.5]],
        brazo:  [[0, 4.7, 4.5], [0.16, 4.95, 4.5], [0.38, 4.05, 4.25], [0.62, 3.75, 3.95], [0.88, 3.0, 3.25], [1, 2.9, 3.1]],
        ante:   [[0, 3.2, 3.3], [0.22, 3.6, 3.2], [0.5, 2.9, 2.7], [0.85, 2.2, 2.05], [1, 2.05, 1.95]]
      },
      /* abdomen chato pero sin la cintura tan pellizcada; el busto y la espalda alta, iguales */
      TR_FRENTE: [[0, 6.6], [0.1, 7.1], [0.22, 7.0], [0.36, 6.9], [0.48, 7.35], [0.545, 7.7], [0.57, 8.0], [0.6, 9.8], [0.65, 10.8], [0.7, 11.2], [0.76, 10.9], [0.84, 9.9], [0.92, 8.6], [1, 7.2]],
      TR_ESPALDA: [[0, 11.6], [0.08, 11.0], [0.2, 9.1], [0.32, 8.4], [0.48, 8.7], [0.7, 9.4], [0.86, 9.5], [0.94, 9.0], [1, 8.2]],
      GLUTEO: [[[-11.8, -2.5], 0.2], [[-11.5, -5.2], 0.35], [[-10.4, -7.8], 0.55], [[-9.0, -10.4], 0.75]],
      /* pie y mano de tamaño natural (la punta del pie casi no pasa del punto de apoyo del esqueleto) */
      PIE: escalar(g.PIE, 1.055, 1.12, 1.22),
      MANO: escalar(g.MANO, 1.35, 1.1),
      DEDOS: escalar(g.DEDOS, 1.35, 1.1),
      DORSO: escalar(g.DORSO, 1.3, 1.08), PALMA: escalar(g.PALMA, 1.3), TALON: escalar(g.TALON, 1.1, 1.08), DEDOS_PISO: escalar(g.DEDOS_PISO, 1.3, 1.08),
      TRF: [[-0.02, 14.6], [0.06, 14.9], [0.14, 14.1], [0.22, 12.6], [0.3, 11.4], [0.38, 10.9], [0.46, 10.9], [0.56, 11.3], [0.66, 11.8], [0.76, 12.1], [0.86, 12.4]],
      PERF_F: {
        muslo:  [[0, 7.9, 6.3], [0.18, 7.5, 6.6], [0.45, 6.3, 5.9], [0.75, 5.3, 5.1], [1, 4.7, 4.3]],
        pierna: [[0, 4.6, 4.2], [0.22, 4.8, 4.6], [0.48, 3.9, 4.0], [0.8, 3.0, 2.8], [1, 2.6, 2.4]],
        brazo:  g.PERF_F.brazo,
        ante:   [[0, 3.3, 3.2], [0.25, 3.5, 3.3], [0.6, 2.85, 2.65], [1, 2.15, 2.05]]
      },
      MANO_F: escalar(g.MANO_F, 1.3, 1.08), PIE_F: escalar(g.PIE_F, 1.08, 1.1),
      ARRIBA_PIERNA: [7.4, 6.9, 6.0, 4.8, 4.8, 4.25, 3.35, 2.6], ARRIBA_BRAZO: [4.5, 4.1, 3.55, 3.2, 3.2, 2.8, 2.2]
    };
  }
  let CUERPO = 'gracil', C = CUERPOS.gracil;

  /* contorno de un miembro de dos huesos visto de frente: el lado del pliegue con su
     corte y el lado convexo con el arco de la rodilla o del codo */
  function miembroFrente(raiz, medio, fin, pA, pB, afuera, rArco, wPliegue) {
    const uA = unit(raiz, medio), uB = unit(medio, fin);
    const n = { x: uA.y, y: -uA.x }, sg = (n.x * afuera.x + n.y * afuera.y) >= 0 ? 1 : -1;
    const tab = T => T.map(([t, o, i]) => (sg > 0 ? [t, o, i] : [t, i, o]));
    const prox = sg2 => ladoHueso(raiz, medio, tab(pA), sg2).map(p => ({ ...p, h: 0 }));
    const A1 = prox(1), A2 = prox(-1);
    const B1 = ladoHueso(medio, fin, tab(pB), 1), B2 = ladoHueso(medio, fin, tab(pB), -1);
    const giro = uA.x * uB.y - uA.y * uB.x, ang = grad(Math.asin(Math.max(-1, Math.min(1, giro))));
    const flex = Math.abs(ang) < 2 && uA.x * uB.x + uA.y * uB.y > 0 ? 0 : grad(Math.acos(Math.max(-1, Math.min(1, uA.x * uB.x + uA.y * uB.y))));
    /* giro > 0: el hueso distal dobla hacia −n (ahí el pliegue) */
    let L1, L2;
    if (giro > 0) { L1 = [...A1, ...arco(medio, uA, uB, rArco, 1), ...B1.slice(1)]; L2 = articular(A2, B2, medio, uA, uB, flex, wPliegue, -1); }
    else { L2 = [...A2, ...arco(medio, uA, uB, rArco, -1), ...B2.slice(1)]; L1 = articular(A1, B1, medio, uA, uB, flex, wPliegue, 1); }
    return { L1, L2, uA, sg };
  }
  /* la calza llega al 88 % de la pierna */
  const piernaCalza = () => C.PERF_F.pierna.filter(([t]) => t <= 0.8).concat([[0.88, ...(C.CALZA_88 || perfEn(C.PERF_F.pierna, 0.88))]]);
  /* sentada vista de frente (persp): la pierna viene hacia quien mira, así que se ve
     más ancha cerca del pie (perspectiva) */
  const acercar = (T, t0, t1, k) => T.map(([t, o, i]) => { const z = 1 + k * (t0 + (t1 - t0) * t); return [t, o * z, i * z]; });
  function piernaFrente(m, col, H, persp = false) {
    const afuera = { x: m.raiz.x - H.x, y: m.raiz.y - H.y }, z = persp ? 0.5 : 0;
    const { L1, L2, uA } = miembroFrente(m.raiz, m.rod, m.tobillo, acercar(C.PERF_F.muslo, 0, 0.5, z), acercar(piernaCalza(), 0.5, 1, z), afuera, 4.4 * (1 + z * 0.5), 4.2);
    const tob = unit(m.rod, m.tobillo), nT = { x: tob.y, y: -tob.x };
    const enT = (t, w) => ({ x: m.rod.x + (m.tobillo.x - m.rod.x) * t + nT.x * w, y: m.rod.y + (m.tobillo.y - m.rod.y) * t + nT.y * w });
    const calza = [...tapa(m.raiz, uA, 5.8, 5.8), ...L1, ...[...L2].reverse()];
    /* tobillo y pie descalzos (debajo de la calza) */
    /* con perspectiva, el pie flexionado muestra la planta hacia quien mira (dedos arriba) */
    const zp = 1 + z * 0.6, pie = persp ? enMarco(m.tobillo, -90, 1, [[-1.2, -2.6], [3, -3.2], [7.5, -3.6], [10.6, -3.0], [12.2, -1.2], [12.4, 0.8], [11, 2.8], [7.5, 3.3], [3, 2.8], [-1.2, 2.4]].map(([x, y]) => [x * zp, y * zp]))
      : enMarco(m.tobillo, m.aPie, m.e[2], C.PIE_F);
    const tobillo = [enT(0.78, 2.8 * zp), enT(1, 2.4 * zp), ...pie, enT(1, -2.3 * zp), enT(0.78, -2.7 * zp)];
    /* rótula: un arco apenas marcado si la rodilla está casi estirada */
    const l = persp ? [-2.1, -0.7, 0.7, 2.1].map(d => linea(enMarco(m.tobillo, -90, 1, [[9.6 * zp, d * zp], [11.6 * zp, d * zp * 1.05]]), col, 0.3)) : [];
    const fx = Math.abs(n180(grad(Math.atan2(tob.y, tob.x)) - grad(Math.atan2(uA.y, uA.x))));
    if (fx < 25 && !persp) { const r = enT(0.02, 0); l.push(`<ellipse cx="${f1(r.x)}" cy="${f1(r.y)}" rx="2.3" ry="2.7" transform="rotate(${f1(grad(Math.atan2(tob.y, tob.x)) - 90)} ${f1(r.x)} ${f1(r.y)})" fill="none" style="stroke:${col.fino}" stroke-width=".4"/>`); }
    return { f: [forma(cerrar(tobillo), col.piel), forma(cerrar(calza), col.calza)], l };
  }
  function brazoFrente(m, col, S) {
    const { L1, L2, uA, sg } = miembroFrente(m.raiz, m.codo, m.muneca, C.PERF_F.brazo, C.PERF_F.ante, { x: m.raiz.x - S.x, y: m.raiz.y - S.y }, 3.0, 2.8);
    const raiz = tapa(m.raiz, uA, 3.7, 3.7);
    const mano = enMarco(m.muneca, m.aM, m.e[2], C.MANO_F, sg);
    const forma1 = forma(cerrar([...raiz, ...L1, ...[...L2].reverse()]), col.piel), forma2 = forma(cerrar(mano), col.piel);
    /* el borde arranca debajo del hombro: así no aparece una línea sobre el deltoides */
    const desde = L => L.filter(p => p.h !== 0 || p.t >= 0.22);
    const lados = [desde(L1), desde(L2)];
    const borde = lados.map(L => `<path d="M${suave(L)}" fill="none" style="stroke:${col.linea}" stroke-width="1.1" stroke-linecap="round"/>`).join('');
    const bordeMano = `<path d="${forma2.d}" style="fill:${col.linea};stroke:${col.linea}" stroke-width="1.1" stroke-linejoin="round"/>`;
    return { borde: borde + bordeMano, f: [forma1, forma2], l: [linea(enMarco(m.muneca, m.aM, m.e[2], [[5.8, 1.5], [3.6, 1.2]], sg), col, 0.25)] };
  }
  function troncoFrente(E, col, aire, piso) {
    const P = E.col, ejes = [];
    for (let i = 0; i < 4; i++) for (let k = 0; k < 6; k++) {
      const t = k / 6, p0 = P[Math.max(0, i - 1)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(4, i + 2)];
      const t2 = t * t, t3 = t2 * t, cr = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      ejes.push({ x: cr(p0.x, p1.x, p2.x, p3.x), y: cr(p0.y, p1.y, p2.y, p3.y) });
    }
    ejes.push(P[4]);
    let largo = 0; const acum = [0];
    for (let i = 1; i < ejes.length; i++) { largo += Math.hypot(ejes[i].x - ejes[i - 1].x, ejes[i].y - ejes[i - 1].y); acum.push(largo); }
    const N = ejes.length, k = E.anch, a = aire - 0.5;
    const nor = i => { const u = unit(ejes[Math.max(0, i - 1)], ejes[Math.min(N - 1, i + 1)]); return { x: u.y, y: -u.x, u }; };
    /* lado + (hacia bc y pc) y lado − */
    const lado = sg => ejes.map((p, i) => {
      const s = acum[i] / largo, q = nor(i);
      let w = enPerfil(C.TRF, s) * k;
      if (s > 0.5 && s < 0.9) w *= 1 + 0.04 * a * Math.sin((s - 0.5) / 0.4 * Math.PI);
      return { x: p.x + q.x * w * sg, y: p.y + q.y * w * sg, s };
    }).filter(p => p.s <= 0.86);
    const q0 = nor(0), H0 = ejes[0], u0 = q0.u, qN = nor(N - 1), uN = qN.u, S = ejes[N - 1];
    const abajo = (aa, w) => ({ x: H0.x + u0.x * aa + q0.x * w * k, y: H0.y + u0.y * aa + q0.y * w * k });
    const arriba = (aa, w) => ({ x: S.x + uN.x * aa + qN.x * w * k, y: S.y + uN.y * aa + qN.y * w * k });
    const uC = unit(S, E.C), nC = { x: uC.y, y: -uC.x };
    const cuello = (t, w) => ({ x: S.x + (E.C.x - S.x) * t + nC.x * w, y: S.y + (E.C.y - S.y) * t + nC.y * w });
    const hombro = sg => [arriba(-1.6, 13.4 * sg), arriba(0.4, 12.2 * sg), arriba(1.8, 9.2 * sg), arriba(2.9, 6.4 * sg)];
    const pelvis = sg => [abajo(-1, 14.2 * sg), abajo(-4.5, 12.6 * sg), abajo(-7, 8.5 * sg), abajo(-8.2, 2.5 * sg)];
    const apl = p => (piso == null ? p : p.y > piso + 0.5 ? { ...p, y: piso + 0.5 } : p.y > piso - 1 ? { ...p, y: piso } : p);
    const Lm = lado(1), Lp = lado(-1);
    const contorno = [...[...pelvis(1)].reverse(), ...Lm, ...hombro(1), cuello(0.25, 3.7), cuello(0.6, 3.3), cuello(0.9, 3.2), cuello(0.9, -3.2), cuello(0.6, -3.3), cuello(0.25, -3.7), ...[...hombro(-1)].reverse(), ...[...Lp].reverse(), ...pelvis(-1), abajo(-8.4, 0)].map(apl);
    /* top: breteles anchos, escote redondo; abajo llega a la cintura de la calza */
    const top = sg => [arriba(-3.4, 11.4 * sg), arriba(-1.2, 10.2 * sg), arriba(1.4, 10.0 * sg), arriba(2.6, 7.2 * sg), arriba(0.4, 6.6 * sg), arriba(-2.6, 4.8 * sg), arriba(-4.6, 2.2 * sg)];
    const desde = L => L.filter(p => p.s >= 0.27);
    const topF = [...[...desde(Lm)], ...top(1), arriba(-5.0, 0), ...[...top(-1)].reverse(), ...[...desde(Lp)].reverse()].map(apl);
    const corte = 0.3, hasta = L => L.filter(p => p.s <= corte);
    const cm = hasta(Lm), cp = hasta(Lp);
    const calza = [...[...pelvis(1)].reverse(), ...cm.slice(0, -1), { ...cm[cm.length - 1], esq: true }, { ...cp[cp.length - 1], esq: true }, ...[...cp.slice(0, -1)].reverse(), ...pelvis(-1), abajo(-8.4, 0)].map(apl);
    const c0 = cm[cm.length - 1], c1 = cp[cp.length - 1];
    const l = [`<path d="M${f1(c0.x)},${f1(c0.y)} L${f1(c1.x)},${f1(c1.y)}" style="stroke:${col.fino}" stroke-width=".4"/>`,
      /* escote y sisas */
      linea([arriba(2.6, 7.2), arriba(0.4, 6.6), arriba(-2.6, 4.8), arriba(-4.6, 2.2), arriba(-5.0, 0), arriba(-4.6, -2.2), arriba(-2.6, -4.8), arriba(0.4, -6.6), arriba(2.6, -7.2)], col, 0.4),
      ...[1, -1].map(sg => linea([desde(sg > 0 ? Lm : Lp).slice(-1)[0], arriba(-3.4, 11.4 * sg), arriba(-1.2, 10.2 * sg), arriba(1.4, 10.0 * sg)], col, 0.35)),
      /* busto sostenido (el pliegue de abajo) y clavículas */
      ...[1, -1].map(sg => linea([arriba(-17.2, 1.4 * sg), arriba(-18.4, 4.6 * sg), arriba(-17.6, 8.0 * sg), arriba(-15.6, 10.0 * sg)], col, 0.4)),
      ...[1, -1].map(sg => linea([arriba(-0.9, 1.9 * sg), arriba(-0.5, 3.8 * sg), arriba(-0.2, 5.6 * sg)], col, 0.35)),
      /* cuello: los esternocleidomastoideos, apenas */
      ...[1, -1].map(sg => linea([cuello(0.62, 2.5 * sg), cuello(0.3, 1.6 * sg), cuello(0.08, 0.9 * sg)], col, 0.3))];
    return { f: [forma(cerrar(contorno), col.piel), forma(cerrar(topF), col.top), forma(cerrar(calza), col.calza)], l };
  }
  function cabezaFrente(E, col) {
    const c = E.C, up = E.arriba, lado = { x: up.y, y: -up.x }, g = E.g || 0;
    const P = ([x, y]) => ({ x: c.x + lado.x * x + up.x * y, y: c.y + lado.y * x + up.y * y });
    const espejo = xs => [...xs, ...xs.slice(1, -1).reverse().map(([x, y]) => [-x, y])];
    const cara = espejo([[0, -9.6], [3.4, -8.8], [5.8, -6.4], [6.9, -3], [7.2, 0.8], [6.9, 4.4], [5.6, 7.6], [3.2, 9.5], [0, 10.1]]).map(P);
    const pelo = [[7.6, 0.6], [7.7, 4.4], [6.4, 8.0], [3.6, 10.3], [0, 10.9], [-3.6, 10.3], [-6.4, 8.0], [-7.7, 4.4], [-7.6, 0.6], [-6.6, 1.6], [-6.0, 4.4], [-4.2, 6.4], [-1.4, 6.9], [0.6, 6.4], [3.4, 6.6], [5.6, 5.2], [6.6, 2.6]].map(P);
    const rodete = P([0, 8.6]);
    const orejas = [-1, 1].map(sg => elipse(P([sg * 7.0, 0.2]), up, 2.4, 1.5, col.piel));
    /* rasgos: se corren con el giro de la cabeza */
    const R = ([x, y]) => P([x + g * 2.6, y]);
    const ojo = sg => [[-1.25, 0], [0, 0.62], [1.25, 0.05], [0, -0.45]].map(([x, y]) => R([sg * 2.75 + x, 0.4 + y]));
    const l = [];
    for (const sg of [-1, 1]) {
      const o = ojo(sg), ir = R([sg * 2.75, 0.45]);
      l.push(`<path d="M${suave([...o, o[0]])}" fill="${col.blanco || '#fff'}" stroke="${col.tinta}" stroke-width=".3"/><circle cx="${f1(ir.x)}" cy="${f1(ir.y)}" r=".55" fill="${col.ojo || '#222'}"/>`);
      l.push(`<path d="M${suave(o.slice(0, 3))}" fill="none" stroke="${col.ojo || '#222'}" stroke-width=".5" stroke-linecap="round"/>`);
      l.push(`<path d="M${suave([[-1.4, 1.75], [0.1, 2.25], [1.5, 1.95]].map(([x, y]) => R([sg * 2.75 + x * sg, y])))}" fill="none" style="stroke:${col.pelo}" stroke-width=".75" stroke-linecap="round"/>`);
    }
    l.push(`<path d="M${suave([[0.35, -0.6], [0.75, -2.9], [0.1, -3.6], [-0.6, -3.35]].map(R))}" fill="none" stroke="${col.tinta}" stroke-width=".35" stroke-linecap="round"/>`);
    l.push(`<path d="M${suave([[-2.0, -5.6], [-0.9, -5.15], [0, -5.35], [0.9, -5.15], [2.0, -5.6], [0, -5.9]].map(R))} Z" style="fill:${col.labio}" opacity=".8"/><path d="M${suave([[-1.9, -5.7], [0, -5.9], [1.9, -5.7], [0, -6.95]].map(R))} Z" style="fill:${col.labio}" opacity=".6"/>`);
    l.push(...[[[-3.6, 9.4], [-5.2, 7.0], [-6.6, 3.6]], [[1.2, 10.4], [3.8, 8.6], [5.8, 5.0]], [[-1.0, 10.5], [-1.8, 8.8], [-3.0, 7.1]]].map(m => `<path d="M${suave(m.map(P))}" fill="none" stroke="rgba(255,255,255,.14)" stroke-width=".5"/>`));
    return {
      f: [{ d: `M${f1(rodete.x + 3.8)},${f1(rodete.y)} A3.8,3.8 0 1 0 ${f1(rodete.x - 3.8)},${f1(rodete.y)} A3.8,3.8 0 1 0 ${f1(rodete.x + 3.8)},${f1(rodete.y)} Z`, fill: col.pelo },
        ...orejas,
        forma(cerrar(cara), col.piel), forma(cerrar(pelo), col.pelo)], l };
  }
  /* capas: piernas, tronco y cuello forman una sola silueta (sin costuras); la cabeza
     y cada brazo llevan su contorno. orden decide qué brazo queda detrás (por ejemplo,
     la mano bajo la cabeza de costado o detrás de la nuca) */
  function dibujoFrente(E, fantasma, orden, aire, piso = null, persp = false) {
    const c1 = ANAT.cerca;
    const P = { PC: piernaFrente(E.seg.pc, c1, E.H, persp), PL: piernaFrente(E.seg.pl, c1, E.H, persp), T: troncoFrente(E, c1, aire ?? 0.5, piso), C: cabezaFrente(E, c1), BC: brazoFrente(E.seg.bc, c1, E.S), BL: brazoFrente(E.seg.bl, c1, E.S) };
    const seq = orden || ['PL', 'PC', 'T', 'C', 'BL', 'BC'];
    const capas = [];
    for (const k of seq) {
      const grupo = k === 'PL' || k === 'PC' || k === 'T' ? 'cuerpo' : k;
      const ult = capas[capas.length - 1];
      if (ult && ult.g === grupo) ult.ks.push(k); else capas.push({ g: grupo, ks: [k] });
    }
    const svg = capas.map(({ ks }) => {
      /* el tronco abajo y las piernas encima: los bordes que coinciden (pelvis) quedan tapados */
      ks.sort((a, b) => (b === 'T') - (a === 'T'));
      const fs = ks.flatMap(k => P[k].f), bordes = ks.map(k => P[k].borde || P[k].f.map(x => `<path d="${x.d}" style="fill:${c1.linea};stroke:${c1.linea}" stroke-width="1.1" stroke-linejoin="round"/>`).join('')).join('');
      return `<g>${bordes}${fs.map(x => `<path d="${x.d}" style="fill:${x.fill}"/>`).join('')}${ks.flatMap(k => P[k].l).join('')}</g>`;
    }).join('');
    return `<g class="${fantasma ? 'fig-fantasma' : 'fig-cuerpo'}">${svg}</g>`;
  }

  /* ---------- profundidad y cámara 3D ----------
     El esqueleto se resuelve en el plano sagital (x a lo largo del mat, y hacia abajo) y
     lo que sale de ese plano va en z (+ hacia quien mira): las caderas a ±8 y los hombros
     a ±14 del eje del cuerpo (el lado cercano adelante) y cada miembro inclinado ab grados
     fuera de su plano (abducción: + se abre hacia afuera, − cruza sobre el cuerpo). De
     perfil z no se ve (el miembro solo se acorta, cos ab); la cámara 3D (elevación y giro)
     lo proyecta y se dibuja con la misma silueta. La física (apoyos, piso, validación)
     sigue en el plano: la cámara solo cambia cómo se ve. */
  const ANCHO3D = { b: 14, p: 8 };
  const PUNTOS = ['raiz', 'codo', 'muneca', 'mano', 'rod', 'tobillo', 'punta', 'talon'];
  const CAM3D = { elev: 20, giro: 24 };
  /* cámara del ejercicio: la que eligió quien mira (_cam, null = de perfil) o la del ejercicio */
  const camDe = ej => (ej.vista === 'frente' || ej.camara === 'arriba' || ej.persp ? null : ej._cam !== undefined ? ej._cam : ej.cam || null);
  /* Sin ab explícita, un miembro en escorzo (k < 1, que de perfil se ve más corto) también
     sale del plano: el brazo o el muslo hacia afuera y, si la mano o el pie están apoyados
     o agarrados, el antebrazo o la pierna vuelven hacia adentro (codos afuera en la flexión
     o con las manos en la cintura); si no, sigue hacia afuera. */
  function profundidad(E) {
    const Z = {}, d = (a, b) => Math.hypot(b.x - a.x, b.y - a.y);
    for (const k of ['bc', 'bl', 'pc', 'pl']) {
      const m = E.seg[k], s = k[1] === 'c' ? 1 : -1, brazo = k[0] === 'b', a = abDe(E.ab, k);
      const t = a ? a.map(x => s * Math.tan(rad(x)))
        : [0, 1].map(q => { const e = Math.min(1, m.e[q]); return e > 0.985 ? 0 : s * Math.sqrt(1 - e * e) / Math.max(0.2, e) * (q === 1 && (E.sujetos || {})[k] ? -1 : 1); });
      const z0 = s * ANCHO3D[k[0]], p1 = brazo ? m.codo : m.rod, p2 = brazo ? m.muneca : m.tobillo;
      const z1 = z0 + t[0] * d(m.raiz, p1), z2 = z1 + t[1] * d(p1, p2);
      Z[k] = brazo ? { raiz: z0, codo: z1, muneca: z2, mano: z2 + t[1] * d(m.muneca, m.mano) } : { raiz: z0, rod: z1, tobillo: z2, punta: z2, talon: z2 };
    }
    return Z;
  }
  /* proyección: giro alrededor de la vertical (pivote x0) y cámara elevada que mira hacia
     abajo (lo cercano baja en la imagen); el piso del eje del cuerpo queda en PISO */
  function proyector(cam) {
    const cT = Math.cos(rad(cam.elev || 0)), sT = Math.sin(rad(cam.elev || 0)), cP = Math.cos(rad(cam.giro || 0)), sP = Math.sin(rad(cam.giro || 0)), x0 = cam.x0 || 0;
    const pt = (p, z = 0) => { const x = p.x - x0, zr = x * sP + z * cP; return { x: x0 + x * cP - z * sP, y: PISO + (p.y - PISO) * cT + zr * sT }; };
    const dir = (v, z = 0) => ({ x: v.x * cP - z * sP, y: v.y * cT + (v.x * sP + z * cP) * sT });
    return { pt, dir, cT, sT };
  }
  function proyectar(E, cam) {
    if (!cam || E.fr) return E;
    const { pt, dir } = proyector(cam), Z = profundidad(E);
    const nrm = v => { const d = Math.hypot(v.x, v.y) || 1e-6; return { x: v.x / d, y: v.y / d }; };
    const ang = (a, b) => grad(Math.atan2(b.y - a.y, b.x - a.x));
    const o = { ...E, col: E.col.map(p => pt(p)), S: pt(E.S), C: pt(E.C), H: pt(E.H), cam, seg: {},
      hom: { bc: pt(E.hom.bc, Z.bc.raiz), bl: pt(E.hom.bl, Z.bl.raiz) }, cad: { pc: pt(E.cad.pc, Z.pc.raiz), pl: pt(E.cad.pl, Z.pl.raiz) } };
    for (const k of ['bc', 'bl', 'pc', 'pl']) {
      const m = E.seg[k], t = { ...m, e: [...m.e] };
      for (const q of PUNTOS) if (m[q]) t[q] = pt(m[q], Z[k][q]);
      /* la mano y el pie se dibujan en su marco: dirección y largo aparente (en escorzo) */
      if (k[0] === 'b') { t.a0 = ang(t.raiz, t.codo); t.aA = ang(t.codo, t.muneca); t.aM = ang(t.muneca, t.mano); t.e[2] = Math.max(0.55, Math.hypot(t.mano.x - t.muneca.x, t.mano.y - t.muneca.y) / L.mano); }
      else { t.a0 = ang(t.raiz, t.rod); t.aP = ang(t.rod, t.tobillo); t.aPie = ang(t.tobillo, t.punta); t.e[2] = Math.max(0.55, Math.hypot(t.punta.x - t.tobillo.x, t.punta.y - t.tobillo.y) / L.pie); }
      o.seg[k] = t;
    }
    /* la cabeza no se deforma: "arriba" proyectado y el frente perpendicular, del lado del frente */
    const up = nrm(dir(E.arriba)), fC = nrm(dir(E.antCab));
    o.arriba = up; o.antCab = (-up.y * fC.x + up.x * fC.y) >= 0 ? { x: -up.y, y: up.x } : { x: up.y, y: -up.x };
    o.angs = [0, 1, 2, 3].map(q => ang(o.col[q], o.col[q + 1]));
    o.aTop = o.angs[3]; o.aCue = ang(o.S, o.C);
    const uT = nrm({ x: o.col[4].x - o.col[3].x, y: o.col[4].y - o.col[3].y }), a0 = nrm(dir(E.ant));
    o.ant = (-uT.y * a0.x + uT.x * a0.y) >= 0 ? { x: -uT.y, y: uT.x } : { x: uT.y, y: -uT.x };
    /* volumen: el tronco es una sección elíptica (fondo de perfil, ancho de frente); visto
       de costado y desde arriba se ve más grueso. Grosor aparente de cada segmento */
    o.vol = E.angs.map((a, q) => {
      const Pu = nrm(dir({ x: Math.cos(rad(a)), y: Math.sin(rad(a)) })), n = { x: -Pu.y, y: Pu.x };
      const Pn = dir({ x: Math.cos(rad(a + 90)), y: Math.sin(rad(a + 90)) }), Pz = dir({ x: 0, y: 0 }, 1), r = R.frente[q] / R.perfil[q];
      return Math.hypot(Pn.x * n.x + Pn.y * n.y, r * (Pz.x * n.x + Pz.y * n.y));
    });
    return o;
  }
  /* mat de 180 × 60 cm en perspectiva, con su espesor del lado de quien mira */
  function tapete3d(ej, enc) {
    const { pt, cT } = proyector({ ...camDe(ej), x0: enc.xm }), m = p => ({ x: p.x + enc.cx, y: p.y + enc.cy });
    const L2 = 83, A2 = 28, xa = enc.xm - L2, xb = enc.xm + L2, P = (x, z, dy = 0) => m(pt({ x, y: PISO + dy }, z));
    const sup = [P(xa, -A2), P(xb, -A2), P(xb, A2), P(xa, A2)], esp = 3 / Math.max(0.4, cT);
    const borde = [P(xa, A2), P(xb, A2), P(xb, A2, esp), P(xa, A2, esp)];
    const d = pts => 'M' + pts.map(p => `${f1(p.x)},${f1(p.y)}`).join(' L') + ' Z';
    const rayas = [0.25, 0.5, 0.75].map(t => { const a = P(lerp(xa, xb, t), -A2 + 3), b = P(lerp(xa, xb, t), A2 - 3); return `<line x1="${f1(a.x)}" y1="${f1(a.y)}" x2="${f1(b.x)}" y2="${f1(b.y)}" class="fig-mat-raya"/>`; }).join('');
    return `<g class="fig-tapete"><path d="${d(borde)}" class="fig-mat"/><path d="${d(sup)}" class="fig-mat-3d"/>${rayas}</g>`;
  }
  /* sombra en el mat (en perspectiva): una elipse en el piso bajo lo que apoya */
  function sombra3d(E, cam, enc) {
    const pts = contorno(E).filter(p => p.y > PISO - 5);
    if (!pts.length) return '';
    const x0 = Math.min(...pts.map(p => p.x)), x1 = Math.max(...pts.map(p => p.x)), xc = (x0 + x1) / 2, rx = (x1 - x0) / 2 + 5;
    const { pt } = proyector(cam), q = [];
    for (let k = 0; k < 20; k++) { const g = k / 20 * Math.PI * 2, p = pt({ x: xc + rx * Math.cos(g), y: PISO + 0.5 }, 14 * Math.sin(g)); q.push(`${f1(p.x + enc.cx)},${f1(p.y + enc.cy)}`); }
    return `<path d="M${q.join(' L')} Z" class="fig-sombra"/>`;
  }

  /* sombra en el mat bajo lo que está apoyado: ayuda a leer el contacto */
  function sombra(E, piso = PISO) {
    const pts = contorno(E).filter(p => p.y > piso - 5);
    if (!pts.length) return '';
    const x0 = Math.min(...pts.map(p => p.x)), x1 = Math.max(...pts.map(p => p.x));
    return `<ellipse cx="${f1((x0 + x1) / 2)}" cy="${piso + 1}" rx="${f1((x1 - x0) / 2 + 5)}" ry="2.6" class="fig-sombra"/>`;
  }

  /* ---------- encuadre y salida ---------- */
  function encuadre(ej) {
    if (ej._enc) return ej._enc;
    const { poses } = preparar(ej), n = poses.length, cam = camDe(ej);
    if (cam) {
      /* 3D: el pivote del giro es el centro del movimiento; entra la figura y el borde del mat */
      const frs = [];
      for (let i = 0; i < n; i++) for (const f of n > 1 ? [0, 0.25, 0.5, 0.75] : [0]) frs.push(cuadro(ej, i, f).E);
      const wx = frs.flatMap(E => contorno(E).map(p => p.x)), xm = (Math.min(...wx) + Math.max(...wx)) / 2, c3 = { ...cam, x0: xm }, { pt } = proyector(c3);
      const pts = frs.flatMap(E => contorno(proyectar(E, c3))).concat([[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b]) => pt({ x: xm + a * 83, y: PISO }, b * 28)));
      const x0 = Math.min(...pts.map(p => p.x)), x1 = Math.max(...pts.map(p => p.x)), y0 = Math.min(...pts.map(p => p.y)), y1 = Math.max(...pts.map(p => p.y)) + 4;
      const esc = Math.min(ej.zoomMax || 1.75, (W - 16) / (x1 - x0), (H - 14) / (y1 - y0));
      ej._enc = { cx: W / 2 - (x0 + x1) / 2, cy: H / 2 - (y0 + y1) / 2, esc, oy: H / 2, xm };
      return ej._enc;
    }
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    for (let i = 0; i < n; i++) for (const f of n > 1 ? [0, 0.25, 0.5, 0.75] : [0]) {
      const r = cuadro(ej, i, f);
      for (const p of contorno(r.E)) { x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); y0 = Math.min(y0, p.y); y1 = Math.max(y1, p.y); }
    }
    const arriba = ej.camara === 'arriba';
    const cy = arriba ? H / 2 - (y0 + y1) / 2 : 0;
    /* con perspectiva, la escala se centra en el apoyo a mitad del mat: así la pelvis no se va al borde de atrás */
    const piso = ej.persp ? PISO_P : PISO;
    const alto = arriba ? y1 - y0 : Math.max(piso, y1) - y0;
    const esc = Math.min(ej.zoomMax || 1.75, (W - 24) / (x1 - x0), arriba ? (H - 24) / alto : (piso - 10) / alto);
    ej._enc = { cx: W / 2 - (x0 + x1) / 2, cy, esc, oy: arriba ? H / 2 : piso };
    return ej._enc;
  }
  const zoom = enc => `transform="translate(${W / 2} ${enc.oy}) scale(${enc.esc.toFixed(3)}) translate(${-W / 2} ${-enc.oy})"`;
  function figuraSVG(ej, r, enc, fantasma, aire) {
    C = CUERPOS[ej.cuerpo || CUERPO] || CUERPOS.gracil;
    const cam = camDe(ej), c3 = cam && { ...cam, x0: enc.xm || 0 };
    const E = mover(cam ? proyectar(r.E, c3) : r.E, enc.cx, enc.cy);
    const silla = ej.silla && !fantasma
      ? `<g class="fig-silla"><rect x="${f1(E.H.x - 16)}" y="${f1(E.H.y + 12)}" width="30" height="5" rx="2"/><rect x="${f1(E.H.x - 14)}" y="${f1(E.H.y + 16)}" width="4" height="${f1(PISO - E.H.y - 16)}"/><rect x="${f1(E.H.x + 8)}" y="${f1(E.H.y + 16)}" width="4" height="${f1(PISO - E.H.y - 16)}"/><rect x="${f1(E.H.x - 18)}" y="${f1(E.H.y - 30)}" width="4" height="46" rx="2"/></g>` : '';
    const est = (ej.estilo || ESTILO) === 'anatomico', arriba = ej.camara === 'arriba';
    /* de costado visto desde arriba se ve la silueta sagital: es el mismo dibujo que de perfil */
    const anat = est && !E.fr, desdeArriba = est && arriba && E.fr && E.kt < 0.5;
    const piso = !arriba && !ej.persp ? PISO : null;
    const cuerpo = desdeArriba ? dibujoArriba(E, fantasma, aire) : est && E.fr ? dibujoFrente(E, fantasma, ej.orden, aire, piso, !!ej.persp) : anat ? dibujoAnat(E, fantasma, ej.orden, aire, piso) : dibujo(E, fantasma, ej.orden, aire);
    /* desde arriba, la sombra del cuerpo en el mat ayuda a leer qué está apoyado y qué no */
    const sombraArr = est && arriba && !fantasma ? `<g class="fig-sombra-arriba" transform="translate(2.2 3)" fill="rgba(36,22,44,.15)" aria-hidden="true">${cuerpo.replace(/<(ellipse|circle)[^>]*\/>/g, '').replace(/<path d="([^"]*)"[^>]*\/>/g, (m, d) => (/fill="none"/.test(m) ? '' : `<path d="${d}"/>`))}</g>` : '';
    return (fantasma || arriba ? '' : cam ? sombra3d(r.E, c3, enc) : sombra(E, ej.persp ? PISO_P : PISO)) + silla + sombraArr + cuerpo;
  }
  function fondo(ej) {
    if (camDe(ej) || (ej.camara === 'arriba' && (ej.estilo || ESTILO) === 'anatomico')) return '';
    if (ej.camara === 'arriba') return ej.matV ? `<rect x="${W / 2 - 48}" y="6" width="96" height="${H - 12}" rx="10" class="fig-mat-arriba"/>`
      : `<rect x="18" y="${H / 2 - 42}" width="${W - 36}" height="84" rx="10" class="fig-mat-arriba"/>`;
    if (ej.persp) return `<path d="M70,${PISO - 24} L250,${PISO - 24} L304,${H - 2} L16,${H - 2} Z" class="fig-mat-persp"/>`;
    return `<rect x="14" y="${PISO}" width="${W - 28}" height="5" rx="2.5" class="fig-mat"/><rect x="14" y="${PISO + 5}" width="${W - 28}" height="2" rx="1" class="fig-mat-sombra"/>`;
  }
  const etiquetaCam = ej => ej.camara === 'arriba' ? `<text x="${W - 10}" y="14" text-anchor="end" class="fig-cam">vista desde arriba</text>`
    : ej.vista === 'frente' ? `<text x="${W - 10}" y="14" text-anchor="end" class="fig-cam">vista de frente</text>` : '';
  function svgEstatico(ej, i = 0, f = 0) {
    const enc = encuadre(ej);
    if (ej.silla) enc.esc = Math.min(enc.esc, 1.3);
    return `<svg viewBox="0 0 ${W} ${H}" class="fig-svg" role="img" aria-label="${ej.nom || 'figura'}">${fondo(ej)}${etiquetaCam(ej)}<g ${zoom(enc)}>${tapete(ej, enc)}${figuraSVG(ej, cuadro(ej, i, f), enc)}</g></svg>`;
  }

  /* ---------- capas didácticas (en coordenadas del dibujo) ---------- */
  /* trayectoria de manos, pies y cabeza durante una transición: se muestran
     las que más se mueven, con una flecha al final */
  const MARCAS = [
    ['mano', E => E.seg.bc.mano, 'tray-mano'], ['mano', E => E.seg.bl.mano, 'tray-mano'],
    ['pie', E => E.seg.pc.punta, 'tray-pie'], ['pie', E => E.seg.pl.punta, 'tray-pie'],
    ['cabeza', E => E.C, 'tray-cab'], ['pelvis', E => E.H, 'tray-pel']
  ];
  function trayectorias(ej, i, enc, N = 18, fluido = false) {
    const cuadros = [], cam = camDe(ej), pr = E => mover(cam ? proyectar(E, { ...cam, x0: enc.xm || 0 }) : E, enc.cx, enc.cy);
    if (fluido) {
      /* en modo fluido, el camino de toda la frase */
      const F = fluidez(ej), fr = F.frases[F.fraseDe[i]], M = N * Math.min(4, fr.segs.length);
      for (let k = 0; k <= M; k++) { const p = enFrase(fr, k / M); cuadros.push(pr(cuadro(ej, p.i, p.f, true).E)); }
    } else for (let k = 0; k <= N; k++) cuadros.push(pr(cuadro(ej, i, k / N).E));
    const res = MARCAS.map(([nom, f, cl]) => {
      const pts = cuadros.map(f);
      let largo = 0;
      for (let k = 1; k < pts.length; k++) largo += Math.hypot(pts[k].x - pts[k - 1].x, pts[k].y - pts[k - 1].y);
      return { nom, cl, pts, largo };
    }).filter(t => t.largo > 14).sort((a, b) => b.largo - a.largo);
    /* una por tipo (manos juntas, pies juntos), máximo tres */
    const vistos = new Set(), out = [];
    for (const t of res) if (!vistos.has(t.nom) && out.length < 3) { vistos.add(t.nom); out.push(t); }
    return out.map(t => {
      const a = t.pts[t.pts.length - 2], b = t.pts[t.pts.length - 1], ang = Math.atan2(b.y - a.y, b.x - a.x);
      const fl = [ang + 2.6, ang - 2.6].map(g => `${f1(b.x + Math.cos(g) * 4.5)},${f1(b.y + Math.sin(g) * 4.5)}`);
      return `<path d="M${suave(t.pts)}" class="tray ${t.cl}"/><path d="M${fl[0]} L${f1(b.x)},${f1(b.y)} L${fl[1]}" class="tray-flecha ${t.cl}"/>`;
    }).join('');
  }
  /* fuerza del piso en un cuadro: la de la dinámica en tiempo real (modo fluido) más cercana */
  function fuerzaEn(ej, i, f) {
    if (ej.camara === 'arriba' || ej.persp || ej.silla) return null;
    let mejor = null;
    for (const d of dinamica(ej)) if (d.i === i && (!mejor || Math.abs(d.f - f) < Math.abs(mejor.f - f))) mejor = d;
    return mejor;
  }
  /* flecha de la fuerza que hace el piso, desde el centro de presión: su largo es la fuerza
     respecto del peso (40 = el peso del cuerpo) */
  function flechaPiso(p, d, ok) {
    const k = 40 / (KG * G), vx = d.fx * k, vy = -d.fy * k, L = Math.hypot(vx, vy);
    if (L < 2) return '';
    const b = { x: p.x + vx, y: p.y + vy }, ang = Math.atan2(vy, vx), ala = g => `${f1(b.x - Math.cos(ang + g) * 4)},${f1(b.y - Math.sin(ang + g) * 4)}`;
    return `<g class="fis-piso ${ok ? '' : 'fuera'}"><path d="M${f1(p.x)},${f1(p.y)} L${f1(b.x)},${f1(b.y)}"/><path d="M${ala(0.45)} L${f1(b.x)},${f1(b.y)} L${ala(-0.45)}"/><circle cx="${f1(p.x)}" cy="${f1(p.y)}" r="1.8"/></g>`;
  }
  /* centro de masa, su plomada y la base de apoyo; con la dinámica, el centro de presión y
     la fuerza del piso (si el cuerpo acelera, se corre del pie de la plomada) */
  function capaFisica(ej, r, enc, i = 0, f = 0) {
    if (ej.camara === 'arriba') return '';
    const cam = camDe(ej), din = fuerzaEn(ej, i, f);
    if (cam) {
      /* 3D: el centro de masa, su plomada hasta el piso y la base, proyectados */
      const { pt } = proyector({ ...cam, x0: enc.xm || 0 }), cm = centroMasa(r.E), m = p => ({ x: p.x + enc.cx, y: p.y + enc.cy });
      const toca = contorno(r.E).filter(p => p.y >= PISO - 1.5);
      let base = '', ok = true;
      if (toca.length) {
        const x0 = Math.min(...toca.map(p => p.x)), x1 = Math.max(...toca.map(p => p.x)), tol = r.contactos && Object.keys(r.contactos).length === 1 && r.contactos.pelvis ? 6 : 2;
        ok = cm.x >= x0 - tol && cm.x <= x1 + tol;
        const a = m(pt({ x: x0 - 1, y: PISO })), b = m(pt({ x: x1 + 1, y: PISO }));
        base = `<line x1="${f1(a.x)}" y1="${f1(a.y)}" x2="${f1(b.x)}" y2="${f1(b.y)}" class="fis-base3d"/>`;
      }
      const c = m(pt(cm)), pie = m(pt({ x: cm.x, y: PISO }));
      const flecha = din && din.base ? flechaPiso(m(pt({ x: din.rueda ? (din.base.x0 + din.base.x1) / 2 : din.zmp, y: PISO })), { fx: din.fx * Math.cos(rad(cam.giro || 0)), fy: din.fy * Math.cos(rad(cam.elev || 0)) }, ok) : '';
      return `<g class="fis ${ok ? 'fis-ok' : 'fis-fuera'}">${base}${flecha}<line x1="${f1(c.x)}" y1="${f1(c.y)}" x2="${f1(pie.x)}" y2="${f1(pie.y)}" class="fis-plomada"/>
      <circle cx="${f1(c.x)}" cy="${f1(c.y)}" r="3.6" class="fis-cm"/><path d="M${f1(c.x - 3.6)},${f1(c.y)} H${f1(c.x + 3.6)} M${f1(c.x)},${f1(c.y - 3.6)} V${f1(c.y + 3.6)}" class="fis-cruz"/></g>`;
    }
    const E = mover(r.E, enc.cx, enc.cy), cm = centroMasa(E);
    const piso = ej.persp ? PISO_P : PISO;
    const toca = contorno(E).filter(p => p.y >= piso - 1.5);
    let base = '', ok = true, flecha = '';
    if (toca.length) {
      const x0 = Math.min(...toca.map(p => p.x)), x1 = Math.max(...toca.map(p => p.x));
      const soloPelvis = r.contactos && Object.keys(r.contactos).length === 1 && r.contactos.pelvis;
      const tol = soloPelvis ? 6 : 2;
      ok = cm.x >= x0 - tol && cm.x <= x1 + tol;
      base = `<rect x="${f1(x0 - 1)}" y="${piso - 1.6}" width="${f1(x1 - x0 + 2)}" height="3.2" rx="1.6" class="fis-base"/>`;
    }
    /* con la dinámica: el centro de presión dentro de la base (con sus márgenes) decide el
       color, y la flecha muestra la fuerza del piso. Rodando, el piso empuja en el punto que
       apoya (ahí el peso fuera del apoyo es lo que hace rodar) */
    if (din && din.base) {
      const zx = din.rueda ? (din.base.x0 + din.base.x1) / 2 : din.zmp;
      ok = din.rueda || (zx >= din.base.x0 - din.base.t0 && zx <= din.base.x1 + din.base.t1);
      flecha = flechaPiso({ x: zx + enc.cx, y: piso }, din, ok);
    }
    return `<g class="fis ${ok ? 'fis-ok' : 'fis-fuera'}">${base}${flecha}<line x1="${f1(cm.x)}" y1="${f1(cm.y)}" x2="${f1(cm.x)}" y2="${piso}" class="fis-plomada"/>
      <circle cx="${f1(cm.x)}" cy="${f1(cm.y)}" r="3.6" class="fis-cm"/><path d="M${f1(cm.x - 3.6)},${f1(cm.y)} H${f1(cm.x + 3.6)} M${f1(cm.x)},${f1(cm.y - 3.6)} V${f1(cm.y + 3.6)}" class="fis-cruz"/></g>`;
  }

  /* ---------- reproductor ----------
     Anima de pose en pose. Además de reproducir en bucle permite:
       · ir paso a paso (siguiente/anterior animan solo esa transición),
       · recorrer el movimiento con un deslizador (irA, posición continua),
       · cámara lenta (velocidad 0,25 a 1),
       · capas: fantasma de la pose a la que va, trayectorias, centro de masa,
       · respiración: el tórax se expande al inhalar (resp por transición). */
  function reproductor(cont, ej0, { alCambiar = () => {}, alAvanzar = null, auto = true, fantasma = true, resp = null, capas = {}, fluido = false } = {}) {
    /* copia propia: la cámara 3D que elige quien mira no cambia los otros visores */
    const { poses } = preparar(ej0), n = poses.length, ej = { ...ej0 };
    let enc = encuadre(ej), gF, gT, gC, gFis, gM;
    const montar = () => {
      cont.innerHTML = `<svg viewBox="0 0 ${W} ${H}" class="fig-svg" role="img" aria-label="Animación: ${ej.nom || 'ejercicio'}">${fondo(ej)}${etiquetaCam(ej)}<g ${zoom(enc)}><g class="fm">${tapete(ej, enc)}</g><g class="fg"></g><g class="ft"></g><g class="fc"></g><g class="ff"></g></g></svg>`;
      [gF, gT, gC, gFis, gM] = ['.fg', '.ft', '.fc', '.ff', '.fm'].map(q => cont.querySelector(q));
      cont.classList.toggle('fig-3d', !!camDe(ej));
    };
    montar();
    const pausaBase = ej.pausa || 650;
    let fluir = fluido;
    const pausaDe = k => (poses[k].pausa ?? pausaBase) / Math.max(vel, 0.5);
    /* modo fluido: se reproduce por frases (ver fluidez), con un respiro corto
       solo en las paradas naturales (inicio, final, cambio de sentido) */
    const FL = n > 1 ? fluidez(ej) : null;
    let ph = 0;
    const respiro = F => (F.alto ? Math.min(280, poses[F.ini].pausa ?? 280) : 0) / Math.max(vel, 0.5);
    const largo = F => F.T / vel;
    const ponerEn = (k, ff) => { if (k !== i) { i = k; alCambiar(i); } f = ff; };
    /* t0 para retomar la frase en la posición actual */
    const t0Fluido = () => { ph = FL.fraseDe[i]; const F = FL.frases[ph]; return performance.now() - (i === F.ini && f === 0 ? 0 : respiro(F) + deFrase(F, i, f) * largo(F)); };
    const capa = { fantasma, tray: false, fisica: false, ...(ej.capas || {}), ...capas };
    const FUNDIDO = 220, fanCache = {};
    let fanDe = -1, fanAntes = -1, fanT = 0;
    const fanSVG = k => fanCache[k] || (fanCache[k] = figuraSVG(ej, cuadro(ej, k, 0), enc, true));
    const destino = () => { if (fluir && FL) { const F = FL.frases[FL.fraseDe[i]]; return (F.segs[F.segs.length - 1] + 1) % n; } return (i + 1) % n; };
    /* aire al llegar a cada pose (0 exhalado … 1 inhalado) */
    const aireEn = [0.5];
    for (let k = 0; k < n; k++) aireEn.push(!resp ? 0.5 : resp[k] === 'inhala' ? 1 : resp[k] === 'exhala' ? 0 : aireEn[k]);
    if (resp) aireEn[0] = aireEn[n];
    const aire = (k, f) => lerp(aireEn[k], k + 1 < n ? aireEn[k + 1] : aireEn[0], resp && resp[k] === 'ambas' ? Math.sin(f * Math.PI * 4) * 0.25 + f : mj(f));
    let i = 0, f = 0, t0 = performance.now(), raf = null, vivo = true, vel = 1;
    /* modo: 'bucle' (reproduce todo), 'uno' (anima una transición y se detiene), 'quieto' */
    let modo = auto && n > 1 ? 'bucle' : 'quieto', dir = 1, f0 = 0, trayDe = -1;
    const dur = k => (poses[(k + 1) % n].dur || ej.dur || 1500) / vel;
    const quieto = () => matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.dataset.fx === 'suaves';
    let pintado = false;
    const pintar = () => {
      pintado = true;
      const r = cuadro(ej, i, f, fluir);
      gC.innerHTML = figuraSVG(ej, r, enc, false, aire(i, f));
      if (capa.fantasma && n > 1) {
        /* la pose a la que va (en modo fluido, donde termina el movimiento) aparece y se
           va con un fundido corto en vez de cambiar de golpe */
        const k = destino(), ahora = performance.now();
        if (k !== fanDe) { fanAntes = fanDe; fanDe = k; fanT = ahora; }
        const a = quieto() ? 1 : Math.min(1, (ahora - fanT) / FUNDIDO);
        gF.innerHTML = (fanAntes >= 0 && a < 1 ? `<g opacity="${(1 - a).toFixed(2)}">${fanSVG(fanAntes)}</g>` : '') + `<g opacity="${a.toFixed(2)}">${fanSVG(k)}</g>`;
      } else { gF.innerHTML = ''; fanDe = -1; }
      if (capa.tray && n > 1) {
        const clave = fluir ? 'f' + FL.fraseDe[i] : i;
        if (trayDe !== clave) { gT.innerHTML = trayectorias(ej, i, enc, 18, fluir); trayDe = clave; }
      } else { gT.innerHTML = ''; trayDe = -1; }
      gFis.innerHTML = (capa.columna && ej.camara !== 'arriba' && !r.E.fr && !camDe(ej) ? columnaSVG(mover(r.E, enc.cx, enc.cy)) : '') + (capa.fisica ? capaFisica(ej, r, enc, i, f) : '');
      if (alAvanzar) alAvanzar(i + f);
    };
    const llegar = k => { i = ((k % n) + n) % n; f = 0; alCambiar(i); };
    function paso(t) {
      if (!vivo || !cont.isConnected) { vivo = false; return; }
      if (modo === 'bucle' && fluir) {
        const F = FL.frases[ph], el = t - t0, r0 = respiro(F);
        if (quieto()) { if (el > r0 + largo(F)) { ph = (ph + 1) % FL.frases.length; t0 = t; ponerEn(FL.frases[ph].ini, 0); pintar(); } }
        else if (el < r0) { if (i !== F.ini || f !== 0) { ponerEn(F.ini, 0); pintar(); } }
        else if (el < r0 + largo(F)) { const p = enFrase(F, (el - r0) / largo(F)); ponerEn(p.i, p.f); pintar(); }
        else { ph = (ph + 1) % FL.frases.length; t0 = t; ponerEn(FL.frases[ph].ini, 0); pintar(); }
      } else if (modo === 'bucle') {
        const el = t - t0, pausa = pausaDe(i);
        if (quieto()) { if (el > dur(i) + pausa) { llegar(i + 1); t0 = t; pintar(); } }
        else if (el < pausa) { if (f !== 0) { f = 0; pintar(); } }
        else if (el < pausa + dur(i)) { f = (el - pausa) / dur(i); pintar(); }
        else { llegar(i + 1); t0 = t; pintar(); }
      } else if (modo === 'uno') {
        /* por pasos el cuadro ya suaviza cada transición; en modo fluido el paso
           suelto arranca y frena acá */
        const u0 = Math.min(1, (t - t0) / dur(i)), u = fluir ? mj(u0) : u0;
        f = dir > 0 ? f0 + (1 - f0) * u : f0 * (1 - u);
        if (quieto()) f = dir > 0 ? 1 : 0;
        if (dir > 0 && f >= 1) { modo = 'quieto'; llegar(i + 1); }
        else if (dir < 0 && f <= 0) { modo = 'quieto'; f = 0; alCambiar(i); }
        pintar();
      }
      /* un fundido del fantasma sigue aunque la figura esté quieta (pausa, parada) */
      if (!pintado && fanT && t - fanT < FUNDIDO + 40) pintar();
      pintado = false;
      raf = requestAnimationFrame(paso);
    }
    /* cámara 3D: arrastrar la figura la gira (y con el mouse, arriba y abajo la eleva) */
    const ponerCam = (c, reencuadrar) => {
      ej._cam = c; Object.keys(fanCache).forEach(k => delete fanCache[k]); fanDe = -1; trayDe = -1;
      if (reencuadrar || !c) { ej._enc = null; enc = encuadre(ej); montar(); }
      else gM.innerHTML = tapete(ej, enc);
      pintar();
    };
    let orb = null;
    cont.addEventListener('pointerdown', ev => {
      const c = camDe(ej);
      if (!c) return;
      orb = { x: ev.clientX, y: ev.clientY, c: { ...c }, mouse: ev.pointerType === 'mouse', movio: false, id: ev.pointerId };
    });
    cont.addEventListener('pointermove', ev => {
      if (!orb || ev.pointerId !== orb.id) return;
      const dx = ev.clientX - orb.x, dy = ev.clientY - orb.y;
      if (!orb.movio && Math.abs(dx) < 4 && Math.abs(dy) < 4) return;
      if (!orb.movio) { orb.movio = true; try { cont.setPointerCapture(ev.pointerId); } catch { /* sin captura */ } }
      const g = Math.max(-45, Math.min(45, orb.c.giro + dx * 0.4)), el = orb.mouse ? Math.max(0, Math.min(40, orb.c.elev - dy * 0.3)) : orb.c.elev;
      ponerCam({ ...orb.c, giro: g, elev: el }, false);
    });
    const soltar = () => { if (orb && orb.movio) ponerCam(ej._cam, true); orb = null; };
    cont.addEventListener('pointerup', soltar); cont.addEventListener('pointercancel', soltar);
    pintar(); alCambiar(0);
    raf = requestAnimationFrame(paso);
    return {
      /* cámara 3D ({ elev, giro } o null para volver al perfil) */
      camara(c) { ponerCam(c ? { ...CAM3D, ...c } : null, true); },
      get camara3d() { return camDe(ej); },
      /* salta a una pose clave */
      ir(k) { modo = 'quieto'; llegar(k); pintar(); },
      /* anima solo la transición a la pose siguiente (o vuelve a la anterior) */
      siguiente() { if (n < 2) return; if (modo === 'uno' && dir > 0) { llegar(i + 1); pintar(); } modo = 'uno'; dir = 1; f0 = f; t0 = performance.now(); },
      anterior() {
        if (n < 2) return;
        if (f > 0.02) { modo = 'uno'; dir = -1; f0 = f; t0 = performance.now(); return; }
        i = (i - 1 + n) % n; f = 1; modo = 'uno'; dir = -1; f0 = 1; t0 = performance.now();
      },
      pausar() { modo = 'quieto'; pintar(); },
      reanudar() { if (n > 1) { if (fluir) t0 = t0Fluido(); else if (f > 0) { t0 = performance.now() - pausaDe(i) - f * dur(i); } else t0 = performance.now(); modo = 'bucle'; } },
      /* fluido: reproduce de corrido; frena solo donde el movimiento empieza,
         termina o cambia de sentido */
      set fluido(b) { fluir = !!b && n > 1; trayDe = -1; if (modo === 'bucle') t0 = fluir ? t0Fluido() : performance.now() - pausaDe(i) - f * dur(i); pintar(); },
      get fluido() { return fluir; },
      /* posición continua: 2,5 = a mitad de camino entre la pose 2 y la 3 */
      irA(pos) { modo = 'quieto'; const k = Math.floor(pos); const fr = pos - k; i = ((k % n) + n) % n; f = Math.max(0, Math.min(0.999, fr)); pintar(); },
      capa(nombre, on) { capa[nombre] = on; trayDe = -1; pintar(); },
      set velocidad(v) {
        if (modo === 'bucle' && fluir) {
          const F = FL.frases[ph], el = performance.now() - t0, r0 = respiro(F), tau = el < r0 ? null : (el - r0) / largo(F);
          vel = v; t0 = performance.now() - (tau == null ? 0 : respiro(F) + tau * largo(F)); return;
        }
        const pausa = pausaDe(i); const el = performance.now() - t0; const prog = el < pausa ? null : (el - pausa) / dur(i); vel = v; if (modo === 'bucle' && prog != null) t0 = performance.now() - pausaDe(i) - prog * dur(i); else if (modo === 'uno') { f0 = f; t0 = performance.now(); } },
      get velocidad() { return vel; },
      get reproduciendo() { return modo !== 'quieto'; },
      get enBucle() { return modo === 'bucle'; },
      get indice() { return i; },
      get posicion() { return i + f; },
      get n() { return n; },
      destruir() { vivo = false; cancelAnimationFrame(raf); }
    };
  }
  /* tira de poses clave (miniaturas) */
  function tira(ej) { return preparar(ej).poses.map((_, k) => svgEstatico(ej, k, 0)); }

  /* articulaciones de una pose, en coordenadas del cuadro (para dibujar encima) */
  function esqueletoEn(ej, i = 0) {
    const enc = encuadre(ej), E0 = mover(cuadro(ej, i, 0).E, enc.cx, enc.cy);
    const T = p => ({ x: W / 2 + (p.x - W / 2) * enc.esc, y: enc.oy + (p.y - enc.oy) * enc.esc });
    /* compatibilidad con diagramas: nombres de la v1 */
    const E = { ...E0, W: E0.col[2], L1: { c: E0.seg.pc.raiz, rod: E0.seg.pc.rod, tob: E0.seg.pc.tobillo, punta: E0.seg.pc.punta }, L2: { c: E0.seg.pl.raiz, rod: E0.seg.pl.rod, tob: E0.seg.pl.tobillo, punta: E0.seg.pl.punta } };
    return { E, T, esc: enc.esc };
  }

  /* diagnóstico de una pose clave: lo más bajo, apoyos y agarres */
  function diag(ej, i = 0, f = 0) {
    const r = cuadro(ej, i, f), E = r.E, pts = contorno(E);
    const bajo = pts.reduce((m, p) => (p.y > m.y ? p : m));
    const P = preparar(ej).poses[i];
    const ags = Object.entries(P.ik || {}).map(([b, d]) => { const m = E.seg[b], T = marca(E, d); return `${b}→${d}: dist ${Math.hypot(T.x - m.raiz.x, T.y - m.raiz.y).toFixed(1)} alcance ${((L.brazo + L.ante) * 1).toFixed(0)}`; });
    const cont = (P.apoyo || []).map(a => `${a}:${(PISO - contactoDe(E, a).y).toFixed(1)}`);
    return { masBajo: bajo.p + ' ' + (bajo.y - PISO).toFixed(1), apoyos: cont.join(' '), agarres: ags, avisos: r.avisos };
  }

  /* la cámara 3D sirve de costado (de frente y desde arriba la figura ya es otro dibujo) */
  const puede3D = ej => !(ej.vista === 'frente' || ej.camara === 'arriba' || ej.persp);
  return { CAM3D, puede3D, dinamica, fallasDinamicas, segmentos, estilo(v) { if (v) ESTILO = v; return ESTILO; }, cuerpo(v) { if (v && CUERPOS[v]) CUERPO = v; return CUERPO; }, cuerpos: Object.keys(CUERPOS), svgEstatico, reproductor, tira, esqueletoEn, validar, cuadro, preparar, fluidez, enFrase, diag, centroMasa, equilibrio, W, H, PISO };
})();
