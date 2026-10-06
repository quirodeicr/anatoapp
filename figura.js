/* ============================================================
   AnatoApp — figura articulada (v3)

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
  const RIGIDOS = ['pelvis', 'tronco', 'espalda', 'hombros', 'cabeza'];
  const UNIHUESO = /^(rodilla|antebrazo)[CL]$/;     // se resuelven girando un solo hueso
  const EXTREMO = /^(pie|talon|punta|mano)[CL]$/;   // se resuelven con cinemática inversa

  /* ---------- pose con valores por defecto ---------- */
  function completa(P) {
    return {
      tr: -90, fl: 0, cab: 0, bc: [90, 0, 0], bl: [90, 0, 0], pc: [90, 0, 0], pl: [90, 0, 0],
      apoyo: [], ik: {}, k: {}, g: 0, dx: 0, ...P,
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
    const hombro = pol(S, aTop + 180, 3.5);
    const E = {
      vista, fr, anch, g: P.g || 0, col, angs, S, C, H: Hc, aTop, aCue,
      ant: { x: Math.cos(rad(aTop + 90)), y: Math.sin(rad(aTop + 90)) },
      antCab: { x: Math.cos(rad(aCue + 90)), y: Math.sin(rad(aCue + 90)) },
      arriba: { x: Math.cos(rad(aCue)), y: Math.sin(rad(aCue)) },
      lat, esc,
      hom: { bc: fr ? off(hombro, 14 * anch) : hombro, bl: fr ? off(hombro, -14 * anch) : hombro },
      cad: { pc: fr ? off(Hc, 8 * anch) : Hc, pl: fr ? off(Hc, -8 * anch) : Hc },
      seg: {}
    };
    for (const b of ['bc', 'bl']) E.seg[b] = brazoFK(E.hom[b], P[b], [esc(b, 0), esc(b, 1), esc(b, 2)]);
    for (const p of ['pc', 'pl']) E.seg[p] = piernaFK(E.cad[p], P[p], [esc(p, 0), esc(p, 1), esc(p, 2)]);
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
      case 'pie': return { x: p.tobillo.x, y: Math.max(p.talon.y + RPIE, p.punta.y + RPIE * 0.7) };
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
  function resolver(P, ej, { pins = {}, xoff = 0, forzados = null, ancla = null } = {}) {
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
    const piso = ej.persp ? PISO - 24 : PISO;
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
      dy = Math.min(PISO - Math.max(...base.map(n => contactoDe(E, n).y)), dyCuerpo);
    } else dy = dyCuerpo;
    /* 2. corrimiento horizontal: un apoyo rígido clavado manda */
    let dx = ancla ? ancla.x - anclaX(E, ej.ancla) : xoff;
    const pinR = rig.find(n => pins[n] != null);
    if (pinR) dx = pins[pinR] - contactoDe(E, pinR).x;
    E = mover(E, dx, dy);
    /* 3. rodilla / antebrazo en el piso */
    for (const n of rig.filter(n => UNIHUESO.test(n))) unHueso(E, n, P);
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
      for (const k of ['bc', 'bl', 'pc', 'pl']) if (!usados.has(k)) chocar(E, k, P, piso);
    }
    const contactos = {};
    for (const n of ap) contactos[n] = contactoDe(E, n);
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
      const haciaX = Math.cos(rad(m.aA)) >= 0 ? 0 : 180;
      const flex = ((a0 - haciaX + 540) % 360) - 180;
      E.seg[clave] = brazoFK(m.raiz, [a0, flex, 0], m.e);
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
        const m2 = E.seg[clave], sentido = Math.cos(rad(m2.aM)) >= 0 ? 0 : 180;
        E.seg[clave] = brazoFK(m2.raiz, [m2.a0, m2.a0 - m2.aA, sentido - m2.aA], m2.e);
        break;
      }
      /* talón o punta: se corrige el tobillo hasta que el punto toque */
      const actual = tipo === 'talon' ? m.talon : m.punta, r = tipo === 'talon' ? RPIE : RPIE * 0.7;
      const des = { x: x - (actual.x - m.tobillo.x), y: PISO - r - (actual.y - m.tobillo.y) };
      ok = ubicarMiembro(E, clave, des, P, PISO);
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
    for (const b of ['bc', 'bl']) { const m = E.seg[b]; Q[b] = [m.a0, n180(m.a0 - m.aA), n180(m.aM - m.aA)]; Q.k[b] = [...m.e]; }
    for (const p of ['pc', 'pl']) { const m = E.seg[p]; Q[p] = [m.a0, n180(m.aP - m.a0), n180(m.aPie - m.aP + 90)]; Q.k[p] = [...m.e]; }
    return Q;
  }
  const anclaX = (E, nombre) => (nombre === 'pie' ? E.seg.pc.tobillo.x : nombre === 'mano' ? E.seg.bc.muneca.x : nombre === 'S' ? E.S.x : E.H.x);
  const compartidos = (ej, A, B) => ej.rueda ? [] : (A.apoyo || []).filter(a => (B.apoyo || []).includes(a) && !(B.libre || []).includes(a));

  /* ---------- tiempo y articulación ---------- */
  /* perfil de velocidad de mínimo jerk: arranca y frena con aceleración nula */
  const mj = t => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * t * (10 + t * (6 * t - 15)));
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
    if (ej.rueda || ej.vista === 'frente' || ej.camara === 'arriba') return 0;
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
    if (ej.rueda && n > 1) rodar(ej);
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
      let x = 0, prev = null;
      for (let k = 0; k <= M; k++) {
        const P = mezclar(A, B, k / M, ej, 0), r = resolver(P, ej, { xoff: 0 });
        const h = PISO - r.E.H.y;
        if (prev) { x += (h + prev.h) / 2 * rad(n180(P.tr - prev.tr)); tabla.push(x); }
        prev = { h, tr: P.tr };
      }
      K[i].rueda = tabla;
    }
    for (let i = 1; i < n; i++) {
      K[i].xoff = K[i - 1].xoff + K[i - 1].rueda[M];
      const r = resolver(poses[i], ej, { xoff: K[i].xoff });
      K[i].E = r.E; K[i].cont = r.contactos;
    }
    K[n - 1].resto = K[0].xoff - K[n - 1].xoff - K[n - 1].rueda[M];
  }
  function xRueda(K, i, f) {
    const t = K[i].rueda, M = t.length - 1, q = Math.min(M - 1, Math.floor(f * M)), u = f * M - q;
    return K[i].xoff + lerp(t[q], t[q + 1], u) + (K[i].resto || 0) * mj(f);
  }

  /* Mezcla de dos poses en la fracción de tiempo f (0…1, sin suavizar). */
  function mezclar(A, B, f, ej, art = 0) {
    const r = { ...B }, e = mj(f);
    const dTr = n180(B.tr - A.tr), ca = A.cur || CUR0, cb = B.cur || CUR0;
    /* cada segmento (lumbar baja… torácica alta, cuello) arranca con un
       pequeño retraso respecto del anterior y dura el 60 % del tiempo */
    const D = 0.4, ret = art > 0 ? [4, 3, 2, 1, 0] : art < 0 ? [0, 1, 2, 3, 4] : null;
    const fr = q => (ret ? mj((f - ret[q] * D / 4) / (1 - D)) : e);
    r.segs = [0, 1, 2, 3].map(q => { const t = fr(q); return A.tr + dTr * t + lerp(A.fl * ca[q], B.fl * cb[q], t); });
    r.tr = A.tr + dTr * e;
    r.fl = lerp(A.fl, B.fl, e);
    r.cur = ca.map((v, q) => lerp(v, cb[q], e));
    r.cab = lerp(A.cab, B.cab, fr(4));
    const perfil = ej.vista !== 'frente' && ej.camara !== 'arriba';
    const sA = segAngs(A), sB = segAngs(B);
    const libre = (P, k) => !(P.apoyo || []).some(a => (k[0] === 'p' ? /^(pie|talon|punta|rodilla)/ : /^(mano|antebrazo)/).test(a) && a.slice(-1) === (k[1] === 'c' ? 'C' : 'L'));
    for (const k of ['bc', 'bl', 'pc', 'pl']) {
      const brazo = k[0] === 'b', q = brazo ? 3 : 0;
      const resto = [lerp(A[k][1], B[k][1], e), lerp(A[k][2] || 0, B[k][2] || 0, e)];
      if (!perfil) { r[k] = [lerpAng(A[k][0], B[k][0], e), ...resto]; continue; }
      /* ángulo del hombro (o la cadera) respecto de su segmento, dentro del rango
         anatómico: decide por qué lado gira el miembro */
      const v = VENT[k[0]], ra = enVentana(A[k][0] - sA[q] - 180, v), rb = enVentana(B[k][0] - sB[q] - 180, v);
      if (!brazo && art && libre(A, k) && libre(B, k)) {
        /* piernas en el aire mientras la columna articula: viajan con la pelvis
           (Roll Over, Teaser, Jackknife) */
        r[k] = [r.segs[q] + 180 + lerp(ra, rb, e), ...resto];
      } else {
        /* el resto se orienta en el espacio (brazos que alcanzan, piernas apoyadas),
           girando por el lado que permite la articulación */
        let d = rb - ra + n180(sB[q] - sA[q]);
        /* giro: −1 / +1 obliga el sentido (los brazos que circulan por arriba de la
           cabeza hasta atrás: de perfil, la circunducción se ve como un giro largo) */
        const g = (B.giro || {})[k];
        if (g && Math.sign(d) !== g) d += g * 360;
        r[k] = [A[k][0] + d * e, ...resto];
      }
    }
    const ka = A.k || {}, kb = B.k || {};
    r.k = {};
    for (const k of ['bc', 'bl', 'pc', 'pl']) if (ka[k] || kb[k]) r.k[k] = [0, 1, 2].map(q => lerp((ka[k] || [])[q] ?? 1, (kb[k] || [])[q] ?? 1, e));
    if (ka.ancho != null || kb.ancho != null) r.k.ancho = lerp(ka.ancho ?? 1, kb.ancho ?? 1, e);
    if (ka.tronco != null || kb.tronco != null) r.k.tronco = lerp(ka.tronco ?? 1, kb.tronco ?? 1, e);
    r.g = lerp(A.g || 0, B.g || 0, e);
    /* los agarres se mantienen solo si están en las dos poses */
    r.ik = {};
    for (const [b, d] of Object.entries(B.ik || {})) if ((A.ik || {})[b] === d) r.ik[b] = d;
    return r;
  }
  /* cuadro de la transición i → i+1 en la fracción de tiempo f */
  function cuadro(ej, i, f) {
    const { poses, K } = preparar(ej), n = poses.length;
    const j = (i + 1) % n, A = poses[i], B = poses[j];
    if (f <= 0 || n === 1) return resolver(A, ej, { xoff: K[i].xoff, pins: K[i].pins });
    if (f >= 1) return resolver(B, ej, { xoff: K[j].xoff, pins: K[j].pins });
    const P = mezclar(A, B, f, ej, K[i].art), comp = compartidos(ej, A, B), pins = {}, e = mj(f);
    for (const a of comp) if (K[i].cont[a] && K[j].cont[a]) pins[a] = lerp(K[i].cont[a].x, K[j].cont[a].x, e);
    /* sin apoyo rígido clavado, el punto de anclaje avanza (rodando, si rueda) */
    const ancla = { x: K[i].rueda ? xRueda(K, i, f) : lerp(anclaX(K[i].E, ej.ancla), anclaX(K[j].E, ej.ancla), e) };
    return resolver(P, ej, { pins, forzados: comp, ancla });
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
    if (!ap.length || ej.silla || ej.camara === 'arriba' || ej.persp || ap.some(a => SIN_CONTROL.test(a))) return null;
    const r = cuadro(ej, i, 0), cm = centroMasa(r.E), b = baseApoyo(r.E);
    /* sentado sobre la pelvis, los isquiones y el cóccix ocupan unos 6 más de cada lado */
    const tol = ap.length === 1 && ap[0] === 'pelvis' ? 6 : 2;
    const fuera = cm.x < b.x0 - tol ? b.x0 - tol - cm.x : cm.x > b.x1 + tol ? cm.x - b.x1 - tol : 0;
    return { cm, base: b, tol, fuera };
  }

  /* ---------- control automático de calidad ---------- */
  function validar(ej, pasos = 10) {
    const { poses } = preparar(ej), n = poses.length, fallas = [];
    const limite = (E, donde) => {
      for (const k of ['pc', 'pl']) { const m = E.seg[k], fx = ((m.aP - m.a0 + 540) % 360) - 180; if (!E.fr && (fx < -6 || fx > 162)) fallas.push(`${donde}: rodilla ${k} fuera de rango (${fx.toFixed(0)}°)`); }
      for (const k of ['bc', 'bl']) { const m = E.seg[k], fx = ((m.a0 - m.aA + 540) % 360) - 180; if (!E.fr && (fx < -8 || fx > 160)) fallas.push(`${donde}: codo ${k} fuera de rango (${fx.toFixed(0)}°)`); }
    };
    let previo = null;
    for (let i = 0; i < (n > 1 ? n : 1); i++) {
      for (let s = 0; s < (n > 1 ? pasos : 1); s++) {
        const f = s / pasos, r = cuadro(ej, i, f), donde = `pose ${i}${f ? ` → ${(i + 1) % n} (${Math.round(f * 100)}%)` : ''}`;
        r.avisos.forEach(a => fallas.push(`${donde}: ${a}`));
        if (ej.camara !== 'arriba') {
          const pts = contorno(r.E, ej.persp ? new Set(['pc', 'pl']) : new Set());
          const bajo = Math.max(...pts.map(p => p.y));
          if (bajo > PISO + 1.2) fallas.push(`${donde}: atraviesa el piso (${(bajo - PISO).toFixed(1)})`);
          const piso = ej.persp ? PISO - 24 : PISO;
          if (ej.persp ? bajo > piso + 1.2 : false) fallas.push(`${donde}: atraviesa el piso`);
          if (bajo < piso - 1.2) fallas.push(`${donde}: flota (${(piso - bajo).toFixed(1)})`);
          const ap = f ? Object.keys(r.contactos) : (poses[i].apoyo || []);
          for (const a of ap) { const c = contactoDe(r.E, a); if (Math.abs(c.y - piso) > 1.2) fallas.push(`${donde}: ${a} no toca el piso (${(PISO - c.y).toFixed(1)})`); }
        }
        limite(r.E, donde);
        if (!f) { const q = equilibrio(ej, i); if (q && q.fuera > 0) fallas.push(`${donde}: fuera de equilibrio (centro de masa ${q.fuera.toFixed(1)} fuera de la base)`); }
        const clave = [r.E.H, r.E.S, r.E.C, r.E.seg.pc.tobillo, r.E.seg.bc.muneca];
        /* velocidad de las marcas en unidades cada 100 ms: más de 30 (~3,5 m/s) es un salto */
        const ms = (poses[(i + 1) % n].dur || ej.dur || 1500) / pasos;
        if (previo) { const salto = Math.max(...clave.map((p, q) => Math.hypot(p.x - previo[q].x, p.y - previo[q].y))) * 100 / ms; if (salto > 30) fallas.push(`${donde}: salto brusco (${salto.toFixed(0)} cada 100 ms)`); }
        previo = clave;
      }
    }
    return [...new Set(fallas)];
  }

  /* ---------- dibujo ---------- */
  function huso(a, b, r0, r1) {
    const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 0.001, nx = -dy / d, ny = dx / d;
    return `M${f1(a.x + nx * r0)},${f1(a.y + ny * r0)} L${f1(b.x + nx * r1)},${f1(b.y + ny * r1)} A${f1(r1)},${f1(r1)} 0 0 0 ${f1(b.x - nx * r1)},${f1(b.y - ny * r1)} L${f1(a.x - nx * r0)},${f1(a.y - ny * r0)} A${f1(r0)},${f1(r0)} 0 0 0 ${f1(a.x + nx * r0)},${f1(a.y + ny * r0)} Z`;
  }
  /* curva suave por una lista de puntos (Catmull-Rom → Bézier) */
  function suave(pts) {
    let d = `${f1(pts[0].x)},${f1(pts[0].y)}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
      d += ` C${f1(p1.x + (p2.x - p0.x) / 6)},${f1(p1.y + (p2.y - p0.y) / 6)} ${f1(p2.x - (p3.x - p1.x) / 6)},${f1(p2.y - (p3.y - p1.y) / 6)} ${f1(p2.x)},${f1(p2.y)}`;
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
     FIGURA ANATÓMICA (v4, en prueba): misma cinemática, otro dibujo.
     Siluetas con relieves musculares (deltoides, bíceps y tríceps,
     cuádriceps, isquiotibiales, gemelos), rótula y pliegues reales de
     rodilla y codo, manos con pulgar, pies con talón, arco y dedos,
     cara de perfil (frente, nariz, labios, mentón, ojo, ceja, oreja),
     pelo con rodete y ropa de entrenamiento. Solo de perfil: de frente
     y desde arriba se usa el dibujo clásico.
     ===================================================================== */
  let ESTILO = 'clasico';
  const ANAT = {
    cerca: { piel: '#eec19c', pielS: '#d8a27c', top: '#2f8f8a', calza: '#2d3042', calzaS: '#3b3f55', pelo: '#3a2618', linea: 'rgba(60,34,20,.55)', fino: 'rgba(60,34,20,.28)', ojo: '#2b1d14', labio: '#c4766c', blanco: '#fbf4ec' },
    lejos: { piel: '#d3a07a', pielS: '#bd8762', top: '#226b67', calza: '#1f2231', calzaS: '#2b2e40', pelo: '#2a1b10', linea: 'rgba(40,22,12,.5)', fino: 'rgba(40,22,12,.22)' }
  };
  /* perfiles de ancho [t, anterior, posterior] a lo largo de cada hueso */
  const PERF = {
    muslo:  [[0, 7.6, 8.6], [0.15, 7.6, 8.3], [0.4, 7.1, 7.1], [0.7, 6.1, 5.9], [0.9, 5.5, 5.0], [1, 5.3, 4.8]],
    pierna: [[0, 5.0, 4.8], [0.12, 4.3, 5.6], [0.3, 3.9, 6.0], [0.5, 3.4, 4.8], [0.75, 2.8, 3.2], [1, 2.5, 2.6]],
    brazo:  [[0, 5.2, 5.0], [0.16, 5.6, 5.0], [0.38, 4.6, 4.7], [0.62, 4.2, 4.4], [0.88, 3.3, 3.6], [1, 3.1, 3.3]],
    ante:   [[0, 3.2, 3.3], [0.22, 3.7, 3.3], [0.5, 3.0, 2.8], [0.85, 2.2, 2.1], [1, 2.1, 2.0]]
  };
  /* tronco: distancia del eje al frente y a la espalda según la altura (0 cadera … 1 hombros) */
  const TR_FRENTE = [[0, 7.0], [0.1, 8.6], [0.22, 8.5], [0.36, 7.8], [0.5, 8.3], [0.62, 9.4], [0.74, 10.9], [0.84, 10.5], [0.93, 9.0], [1, 8.0]];
  const TR_ESPALDA = [[0, 11.6], [0.08, 11.1], [0.2, 9.1], [0.32, 8.8], [0.5, 9.3], [0.7, 10.0], [0.88, 10.1], [1, 9.4]];
  const enPerfil = (tabla, s) => { for (let q = 1; q < tabla.length; q++) if (s <= tabla[q][0]) { const [a, va] = tabla[q - 1], [b, vb] = tabla[q]; return lerp(va, vb, (s - a) / (b - a || 1)); } return tabla[tabla.length - 1][1]; };
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
  function convexo(centro, uA, uB, r, lado) {
    const nA = lado > 0 ? { x: uA.y, y: -uA.x } : { x: -uA.y, y: uA.x }, nB = lado > 0 ? { x: uB.y, y: -uB.x } : { x: -uB.y, y: uB.x };
    let bx = nA.x + nB.x, by = nA.y + nB.y; const bl = Math.hypot(bx, by) || 1;
    return { x: centro.x + bx / bl * r, y: centro.y + by / bl * r };
  }
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
  const linea = (pts, col, ancho = 0.45) => `<path d="M${suave(pts)}" fill="none" stroke="${col.fino}" stroke-width="${ancho}" stroke-linecap="round"/>`;

  function piernaAnat(m, col) {
    const uA = unit(m.raiz, m.rod), uB = unit(m.rod, m.tobillo), flex = n180(m.aP - m.a0);
    const mA = ladoHueso(m.raiz, m.rod, PERF.muslo, 1), mP = ladoHueso(m.raiz, m.rod, PERF.muslo, -1);
    const pA = ladoHueso(m.rod, m.tobillo, PERF.pierna, 1), pP = ladoHueso(m.rod, m.tobillo, PERF.pierna, -1);
    const rotula = convexo(m.rod, uA, uB, 5.6, 1);
    const ant = [...mA, rotula, ...pA.slice(1)];
    const post = articular(mP, pP, m.rod, uA, uB, flex, 4.9, -1);
    /* pie en su marco: x hacia los dedos, y hacia la planta */
    const pie = enMarco(m.tobillo, m.aPie, m.e[2], [[0.8, -2.4], [5, -1.9], [9.5, -1.2], [12.8, -0.5], [14.3, 0.7], [13.1, 2.1], [10, 2.5], [6.5, 1.8], [2.5, 2.3], [-1.6, 2.9], [-3.9, 1.5], [-3.5, -0.7], [-2.2, -2.6]]);
    /* la calza llega al tobillo; el pie va descalzo */
    const raiz = tapa(m.raiz, uA, 7.6, 8.6);
    /* la calza llega hasta el 88 % de la pierna (el tobillo y el pie quedan descubiertos) */
    const corta = PERF.pierna.filter(([t]) => t <= 0.75).concat([[0.88, lerp(2.8, 2.5, 0.52), lerp(3.2, 2.6, 0.52)]]);
    const pAc = ladoHueso(m.rod, m.tobillo, corta, 1), pPc = ladoHueso(m.rod, m.tobillo, corta, -1);
    const calza = [...raiz, ...mA, rotula, ...pAc.slice(1), ...[...articular(mP, pPc, m.rod, uA, uB, flex, 4.9, -1)].reverse()];
    /* piel solo donde se ve (tobillo y pie): así no asoma un borde claro bajo la calza */
    const pielPie = [...pA.filter(p => p.t >= 0.7), ...pie, ...[...pP.filter(p => p.t >= 0.7)].reverse()];
    return { f: [forma(cerrar(pielPie), col.piel), forma(cerrar(calza), col.calza)],
      l: [linea([rotula, { x: rotula.x - uB.x * 2.4 + uA.x * 0.6, y: rotula.y - uB.y * 2.4 + uA.y * 0.6 }], col),
          linea(ladoHueso(m.rod, m.tobillo, [[0.1, 0, 3.9], [0.3, 0, 4.6], [0.52, 0, 3.4]], -1), col),
          linea(enMarco(m.tobillo, m.aPie, m.e[2], [[11.6, -0.9], [12.2, 0.9]]), col, 0.3)] };
  }
  function brazoAnat(m, col) {
    const uA = unit(m.raiz, m.codo), uB = unit(m.codo, m.muneca), flex = n180(m.a0 - m.aA);
    const bA = ladoHueso(m.raiz, m.codo, PERF.brazo, 1), bP = ladoHueso(m.raiz, m.codo, PERF.brazo, -1);
    const aA = ladoHueso(m.codo, m.muneca, PERF.ante, 1), aP = ladoHueso(m.codo, m.muneca, PERF.ante, -1);
    const olecranon = convexo(m.codo, uA, uB, 3.7, -1);
    const ant = articular(bA, aA, m.codo, uA, uB, flex, 3.4, 1);
    const post = [...bP, olecranon, ...aP.slice(1)];
    /* mano en su marco: x hacia los dedos, y hacia adelante (pulgar) */
    const mano = enMarco(m.muneca, m.aM, m.e[2], [[0, -2.0], [2.2, -2.7], [5.4, -3.5], [6.2, -2.8], [5.6, -2.1], [8.6, -1.6], [10.2, -0.4], [9.7, 1.0], [6, 2.2], [2, 2.2], [0, 2.0]], -1);
    const deltoides = ladoHueso(m.raiz, m.codo, [[0.04, 4.6, 0], [0.22, 3.4, 0], [0.36, 1.0, 0], [0.24, -2.6, 0], [0.06, -4.2, 0]], 1);
    const raiz = tapa(m.raiz, uA, 5.2, 5.0);
    const dedos = enMarco(m.muneca, m.aM, m.e[2], [[6.4, 0.9], [8.9, 0.4]], -1);
    return { f: [forma(cerrar([...raiz, ...ant, mano[mano.length - 1], ...mano.slice(0, -1).reverse(), ...[...post].reverse()]), col.piel)],
      l: [linea(deltoides, col, 0.4), linea(dedos, col, 0.3)] };
  }
  function troncoAnat(E, col, aire) {
    /* eje del tronco suavizado (Catmull-Rom por las 5 vértebras de control) */
    const P = E.col, ejes = [];
    for (let i = 0; i < 4; i++) for (let k = 0; k < 4; k++) {
      const t = k / 4, p0 = P[Math.max(0, i - 1)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(4, i + 2)];
      const t2 = t * t, t3 = t2 * t, cr = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      ejes.push({ x: cr(p0.x, p1.x, p2.x, p3.x), y: cr(p0.y, p1.y, p2.y, p3.y) });
    }
    ejes.push(P[4]);
    let largo = 0; const acum = [0];
    for (let i = 1; i < ejes.length; i++) { largo += Math.hypot(ejes[i].x - ejes[i - 1].x, ejes[i].y - ejes[i - 1].y); acum.push(largo); }
    const a = aire - 0.5, N = ejes.length;
    const nor = i => { const u = unit(ejes[Math.max(0, i - 1)], ejes[Math.min(N - 1, i + 1)]); return { x: u.y, y: -u.x, u }; };
    const fr = [], es = [];
    ejes.forEach((p, i) => {
      const s = acum[i] / largo, q = nor(i);
      let wf = enPerfil(TR_FRENTE, s), we = enPerfil(TR_ESPALDA, s);
      if (s > 0.5 && s < 0.95) wf *= 1 + 0.08 * a * Math.sin((s - 0.5) / 0.45 * Math.PI);
      if (s > 0.15 && s < 0.4) wf *= 1 + 0.06 * a;
      if (s > 0.45 && s < 0.9) we *= 1 + 0.03 * a;
      fr.push({ x: p.x + q.x * wf, y: p.y + q.y * wf, s }); es.push({ x: p.x - q.x * we, y: p.y - q.y * we, s });
    });
    const q0 = nor(0), u0 = q0.u, H0 = ejes[0];
    /* glúteo: arco por detrás y por debajo de la cadera hasta el muslo; pubis adelante */
    const gl = (g, r) => ({ x: H0.x + (-q0.x * Math.cos(rad(g)) - u0.x * Math.sin(rad(g))) * r, y: H0.y + (-q0.y * Math.cos(rad(g)) - u0.y * Math.sin(rad(g))) * r });
    const nalga = [gl(28, 11.2), gl(55, 9.6), gl(82, 7.2)];
    const pubis = { x: H0.x + q0.x * 4.6 - u0.x * 5.2, y: H0.y + q0.y * 4.6 - u0.y * 5.2 };
    const qN = nor(N - 1), uN = qN.u, S = ejes[N - 1];
    const cuelloF = { x: S.x + uN.x * 3.6 + qN.x * 3.8, y: S.y + uN.y * 3.6 + qN.y * 3.8 }, cuelloE = { x: S.x + uN.x * 4.2 - qN.x * 4.2, y: S.y + uN.y * 4.2 - qN.y * 4.2 };
    const contorno = [pubis, ...fr, cuelloF, cuelloE, ...[...es].reverse(), ...nalga];
    /* calza: de la cadera hasta la cintura (s < 0.3) */
    const corte = 0.3, frC = fr.filter(p => p.s <= corte), esC = es.filter(p => p.s <= corte);
    const calza = [pubis, ...frC, ...[...esC].reverse(), ...nalga];
    /* borde de la calza (cintura) */
    const cint = [frC[frC.length - 1], esC[esC.length - 1]];
    return { f: [forma(cerrar(contorno), col.top), forma(cerrar(calza), col.calza)],
      l: [`<path d="M${f1(cint[0].x)},${f1(cint[0].y)} L${f1(cint[1].x)},${f1(cint[1].y)}" stroke="rgba(255,255,255,.18)" stroke-width=".8"/>`] };
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
      l: [`<path d="M${suave(labioS)} Z" fill="${col.labio || col.piel}" opacity=".8"/><path d="M${suave(labioI)} Z" fill="${col.labio || col.piel}" opacity=".65"/>`,
        `<ellipse cx="${f1(oreja.x)}" cy="${f1(oreja.y)}" rx="2.3" ry="1.45" transform="rotate(${f1(angOreja)} ${f1(oreja.x)} ${f1(oreja.y)})" fill="${col.pielS}" opacity=".55"/><path d="M${suave(pts([[0.3, 0.9], [-1.4, 0.4], [-1.5, -1.6], [-0.4, -2.6]]))}" fill="none" stroke="${col.linea}" stroke-width=".35"/>`,
        `<path d="M${suave([...ojo, ojo[0]])}" fill="${col.blanco || '#fff'}" stroke="${col.linea}" stroke-width=".3"/><circle cx="${f1(iris.x)}" cy="${f1(iris.y)}" r=".62" fill="${col.ojo || '#222'}"/>`,
        `<path d="M${suave(ojo.slice(0, 3))}" fill="none" stroke="${col.ojo || '#222'}" stroke-width=".55" stroke-linecap="round"/>`,
        `<path d="M${suave(ceja)}" fill="none" stroke="${col.pelo}" stroke-width=".8" stroke-linecap="round"/>`,
        `<path d="M${suave(boca)}" fill="none" stroke="${col.linea}" stroke-width=".4" stroke-linecap="round"/>`,
        `<path d="M${suave(fosa)}" fill="none" stroke="${col.linea}" stroke-width=".35"/>`,
        ...mechones.map(m => `<path d="M${suave(m)}" fill="none" stroke="rgba(255,255,255,.14)" stroke-width=".5"/>`)] };
  }
  function cuelloAnat(E, col) {
    const u = unit(E.S, E.C), n = { x: u.y, y: -u.x };
    const p = (t, w) => ({ x: E.S.x + (E.C.x - E.S.x) * t + n.x * w, y: E.S.y + (E.C.y - E.S.y) * t + n.y * w });
    /* el frente del cuello es la normal anterior del tronco */
    const fr = E.antCab, sig = (n.x * fr.x + n.y * fr.y) > 0 ? 1 : -1;
    const pts = [p(-0.15, 4.6 * sig), p(0.5, 3.9 * sig), p(0.95, 3.6 * sig), p(0.95, -4.4 * sig), p(0.4, -4.3 * sig), p(-0.2, -5.4 * sig)];
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
      const s = 0.1 + (k + 0.5) / 17 * 0.9, q = en(s), atras = enPerfil(TR_ESPALDA, s) - 3.8;
      const pt = { x: q.x - q.u.y * atras, y: q.y + q.u.x * atras, u: q.u };
      out += vert(pt, k < 5 ? 3.4 : 2.9, largo * 0.9 / 17 * 0.74, k < 5 ? ' lumbar' : ' dorsal');
    }
    const q0 = en(0.04), at0 = enPerfil(TR_ESPALDA, 0.04) - 3.6;
    out += vert({ x: q0.x - q0.u.y * at0, y: q0.y + q0.u.x * at0, u: q0.u }, 4.2, largo * 0.09, ' sacro');
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
  function dibujoAnat(E, fantasma, orden, aire) {
    const c1 = ANAT.cerca, c2 = ANAT.lejos;
    const P = { BC: brazoAnat(E.seg.bc, c1), BL: brazoAnat(E.seg.bl, c2), PC: piernaAnat(E.seg.pc, c1), PL: piernaAnat(E.seg.pl, c2), T: troncoAnat(E, c1, aire ?? 0.5) };
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
      return `<g>${fs.map(x => `<path d="${x.d}" fill="${col.linea}" stroke="${col.linea}" stroke-width="1.1" stroke-linejoin="round"/>`).join('')}${fs.map(x => `<path d="${x.d}" fill="${x.fill}"/>`).join('')}${ks.flatMap(k => P[k].l).join('')}</g>`;
    }).join('');
    return `<g class="${fantasma ? 'fig-fantasma' : 'fig-cuerpo'}">${svg}</g>`;
  }

  /* sombra en el mat bajo lo que está apoyado: ayuda a leer el contacto */
  function sombra(E) {
    const pts = contorno(E).filter(p => p.y > PISO - 5);
    if (!pts.length) return '';
    const x0 = Math.min(...pts.map(p => p.x)), x1 = Math.max(...pts.map(p => p.x));
    return `<ellipse cx="${f1((x0 + x1) / 2)}" cy="${PISO + 1}" rx="${f1((x1 - x0) / 2 + 5)}" ry="2.6" class="fig-sombra"/>`;
  }

  /* ---------- encuadre y salida ---------- */
  function encuadre(ej) {
    if (ej._enc) return ej._enc;
    const { poses } = preparar(ej), n = poses.length;
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    for (let i = 0; i < n; i++) for (const f of n > 1 ? [0, 0.25, 0.5, 0.75] : [0]) {
      const r = cuadro(ej, i, f);
      for (const p of contorno(r.E)) { x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); y0 = Math.min(y0, p.y); y1 = Math.max(y1, p.y); }
    }
    const arriba = ej.camara === 'arriba';
    const cy = arriba ? H / 2 - (y0 + y1) / 2 : 0;
    const alto = arriba ? y1 - y0 : Math.max(PISO, y1) - y0;
    const esc = Math.min(ej.zoomMax || 1.75, (W - 24) / (x1 - x0), arriba ? (H - 24) / alto : (PISO - 10) / alto);
    ej._enc = { cx: W / 2 - (x0 + x1) / 2, cy, esc, oy: arriba ? H / 2 : PISO };
    return ej._enc;
  }
  const zoom = enc => `transform="translate(${W / 2} ${enc.oy}) scale(${enc.esc.toFixed(3)}) translate(${-W / 2} ${-enc.oy})"`;
  function figuraSVG(ej, r, enc, fantasma, aire) {
    const E = mover(r.E, enc.cx, enc.cy);
    const silla = ej.silla && !fantasma
      ? `<g class="fig-silla"><rect x="${f1(E.H.x - 16)}" y="${f1(E.H.y + 12)}" width="30" height="5" rx="2"/><rect x="${f1(E.H.x - 14)}" y="${f1(E.H.y + 16)}" width="4" height="${f1(PISO - E.H.y - 16)}"/><rect x="${f1(E.H.x + 8)}" y="${f1(E.H.y + 16)}" width="4" height="${f1(PISO - E.H.y - 16)}"/><rect x="${f1(E.H.x - 18)}" y="${f1(E.H.y - 30)}" width="4" height="46" rx="2"/></g>` : '';
    const anat = (ej.estilo || ESTILO) === 'anatomico' && !E.fr && ej.camara !== 'arriba';
    return (fantasma || ej.camara === 'arriba' ? '' : sombra(E)) + silla + (anat ? dibujoAnat(E, fantasma, ej.orden, aire) : dibujo(E, fantasma, ej.orden, aire));
  }
  function fondo(ej) {
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
    return `<svg viewBox="0 0 ${W} ${H}" class="fig-svg" role="img" aria-label="${ej.nom || 'figura'}">${fondo(ej)}${etiquetaCam(ej)}<g ${zoom(enc)}>${figuraSVG(ej, cuadro(ej, i, f), enc)}</g></svg>`;
  }

  /* ---------- capas didácticas (en coordenadas del dibujo) ---------- */
  /* trayectoria de manos, pies y cabeza durante una transición: se muestran
     las que más se mueven, con una flecha al final */
  const MARCAS = [
    ['mano', E => E.seg.bc.mano, 'tray-mano'], ['mano', E => E.seg.bl.mano, 'tray-mano'],
    ['pie', E => E.seg.pc.punta, 'tray-pie'], ['pie', E => E.seg.pl.punta, 'tray-pie'],
    ['cabeza', E => E.C, 'tray-cab'], ['pelvis', E => E.H, 'tray-pel']
  ];
  function trayectorias(ej, i, enc, N = 18) {
    const cuadros = [];
    for (let k = 0; k <= N; k++) cuadros.push(mover(cuadro(ej, i, k / N).E, enc.cx, enc.cy));
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
  /* centro de masa, su plomada y la base de apoyo */
  function capaFisica(ej, r, enc) {
    if (ej.camara === 'arriba') return '';
    const E = mover(r.E, enc.cx, enc.cy), cm = centroMasa(E);
    const piso = ej.persp ? PISO - 24 : PISO;
    const toca = contorno(E).filter(p => p.y >= piso - 1.5);
    let base = '', ok = true;
    if (toca.length) {
      const x0 = Math.min(...toca.map(p => p.x)), x1 = Math.max(...toca.map(p => p.x));
      const soloPelvis = r.contactos && Object.keys(r.contactos).length === 1 && r.contactos.pelvis;
      const tol = soloPelvis ? 6 : 2;
      ok = cm.x >= x0 - tol && cm.x <= x1 + tol;
      base = `<rect x="${f1(x0 - 1)}" y="${piso - 1.6}" width="${f1(x1 - x0 + 2)}" height="3.2" rx="1.6" class="fis-base"/>`;
    }
    return `<g class="fis ${ok ? 'fis-ok' : 'fis-fuera'}">${base}<line x1="${f1(cm.x)}" y1="${f1(cm.y)}" x2="${f1(cm.x)}" y2="${piso}" class="fis-plomada"/>
      <circle cx="${f1(cm.x)}" cy="${f1(cm.y)}" r="3.6" class="fis-cm"/><path d="M${f1(cm.x - 3.6)},${f1(cm.y)} H${f1(cm.x + 3.6)} M${f1(cm.x)},${f1(cm.y - 3.6)} V${f1(cm.y + 3.6)}" class="fis-cruz"/></g>`;
  }

  /* ---------- reproductor ----------
     Anima de pose en pose. Además de reproducir en bucle permite:
       · ir paso a paso (siguiente/anterior animan solo esa transición),
       · recorrer el movimiento con un deslizador (irA, posición continua),
       · cámara lenta (velocidad 0,25 a 1),
       · capas: fantasma de la pose a la que va, trayectorias, centro de masa,
       · respiración: el tórax se expande al inhalar (resp por transición). */
  function reproductor(cont, ej, { alCambiar = () => {}, alAvanzar = null, auto = true, fantasma = true, resp = null, capas = {} } = {}) {
    const enc = encuadre(ej), { poses } = preparar(ej), n = poses.length;
    cont.innerHTML = `<svg viewBox="0 0 ${W} ${H}" class="fig-svg" role="img" aria-label="Animación: ${ej.nom || 'ejercicio'}">${fondo(ej)}${etiquetaCam(ej)}<g ${zoom(enc)}><g class="fg"></g><g class="ft"></g><g class="fc"></g><g class="ff"></g></g></svg>`;
    const gF = cont.querySelector('.fg'), gT = cont.querySelector('.ft'), gC = cont.querySelector('.fc'), gFis = cont.querySelector('.ff');
    const pausaBase = ej.pausa || 650;
    const capa = { fantasma, tray: false, fisica: false, ...capas };
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
    const pintar = () => {
      const r = cuadro(ej, i, f);
      gC.innerHTML = figuraSVG(ej, r, enc, false, aire(i, f));
      gF.innerHTML = capa.fantasma && n > 1 ? figuraSVG(ej, cuadro(ej, f > 0 && f < 1 ? (i + 1) % n : (i + 1) % n, 0), enc, true) : '';
      if (capa.tray && n > 1) { if (trayDe !== i) { gT.innerHTML = trayectorias(ej, i, enc); trayDe = i; } } else { gT.innerHTML = ''; trayDe = -1; }
      gFis.innerHTML = (capa.columna && ej.camara !== 'arriba' && !r.E.fr ? columnaSVG(mover(r.E, enc.cx, enc.cy)) : '') + (capa.fisica ? capaFisica(ej, r, enc) : '');
      if (alAvanzar) alAvanzar(i + f);
    };
    const llegar = k => { i = ((k % n) + n) % n; f = 0; alCambiar(i); };
    function paso(t) {
      if (!vivo || !cont.isConnected) { vivo = false; return; }
      if (modo === 'bucle') {
        const el = t - t0, pausa = (poses[i].pausa ?? pausaBase) / Math.max(vel, 0.5);
        if (quieto()) { if (el > dur(i) + pausa) { llegar(i + 1); t0 = t; pintar(); } }
        else if (el < pausa) { if (f !== 0) { f = 0; pintar(); } }
        else if (el < pausa + dur(i)) { f = (el - pausa) / dur(i); pintar(); }
        else { llegar(i + 1); t0 = t; pintar(); }
      } else if (modo === 'uno') {
        const u = Math.min(1, (t - t0) / dur(i));
        f = dir > 0 ? f0 + (1 - f0) * u : f0 * (1 - u);
        if (quieto()) f = dir > 0 ? 1 : 0;
        if (dir > 0 && f >= 1) { modo = 'quieto'; llegar(i + 1); }
        else if (dir < 0 && f <= 0) { modo = 'quieto'; f = 0; alCambiar(i); }
        pintar();
      }
      raf = requestAnimationFrame(paso);
    }
    pintar(); alCambiar(0);
    raf = requestAnimationFrame(paso);
    return {
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
      reanudar() { if (n > 1) { if (f > 0) { t0 = performance.now() - (poses[i].pausa ?? pausaBase) / Math.max(vel, 0.5) - f * dur(i); } else t0 = performance.now(); modo = 'bucle'; } },
      /* posición continua: 2,5 = a mitad de camino entre la pose 2 y la 3 */
      irA(pos) { modo = 'quieto'; const k = Math.floor(pos); const fr = pos - k; i = ((k % n) + n) % n; f = Math.max(0, Math.min(0.999, fr)); pintar(); },
      capa(nombre, on) { capa[nombre] = on; trayDe = -1; pintar(); },
      set velocidad(v) { const pausa = (poses[i].pausa ?? pausaBase) / Math.max(vel, 0.5); const el = performance.now() - t0; const prog = el < pausa ? null : (el - pausa) / dur(i); vel = v; if (modo === 'bucle' && prog != null) t0 = performance.now() - (poses[i].pausa ?? pausaBase) / Math.max(vel, 0.5) - prog * dur(i); else if (modo === 'uno') { f0 = f; t0 = performance.now(); } },
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

  return { estilo(v) { if (v) ESTILO = v; return ESTILO; }, svgEstatico, reproductor, tira, esqueletoEn, validar, cuadro, preparar, diag, centroMasa, equilibrio, W, H, PISO };
})();
