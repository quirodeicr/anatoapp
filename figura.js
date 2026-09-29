/* ============================================================
   AnatoApp — figura articulada (v2)

   Maniquí 2D con cinemática directa + inversa y apoyos en el piso.

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
      const a = P.tr + P.fl * (P.cur ? P.cur[i] : (i + 0.5) / 4 - 0.5);
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
    if (!tronco.length && uni.length) {
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
    const contactos = {};
    for (const n of ap) contactos[n] = contactoDe(E, n);
    return { E, avisos, contactos, dx, dy };
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
    ej._prep = { poses, K };
    return ej._prep;
  }
  function mezclar(A, B, f) {
    const r = { ...B };
    for (const k of ['tr', 'fl', 'cab']) r[k] = k === 'tr' ? lerpAng(A[k], B[k], f) : lerp(A[k], B[k], f);
    const ca = A.cur || [-0.375, -0.125, 0.125, 0.375], cb = B.cur || [-0.375, -0.125, 0.125, 0.375];
    r.cur = ca.map((v, q) => lerp(v, cb[q], f));
    for (const k of ['bc', 'bl', 'pc', 'pl']) r[k] = [lerpAng(A[k][0], B[k][0], f), lerp(A[k][1], B[k][1], f), lerp(A[k][2] || 0, B[k][2] || 0, f)];
    const ka = A.k || {}, kb = B.k || {};
    r.k = {};
    for (const k of ['bc', 'bl', 'pc', 'pl']) if (ka[k] || kb[k]) r.k[k] = [0, 1, 2].map(i => lerp((ka[k] || [])[i] ?? 1, (kb[k] || [])[i] ?? 1, f));
    if (ka.ancho != null || kb.ancho != null) r.k.ancho = lerp(ka.ancho ?? 1, kb.ancho ?? 1, f);
    if (ka.tronco != null || kb.tronco != null) r.k.tronco = lerp(ka.tronco ?? 1, kb.tronco ?? 1, f);
    r.g = lerp(A.g || 0, B.g || 0, f);
    /* los agarres se mantienen solo si están en las dos poses */
    r.ik = {};
    for (const [b, d] of Object.entries(B.ik || {})) if ((A.ik || {})[b] === d) r.ik[b] = d;
    return r;
  }
  /* cuadro de la transición i → i+1 en la fracción f */
  function cuadro(ej, i, f) {
    const { poses, K } = preparar(ej), n = poses.length;
    const j = (i + 1) % n, A = poses[i], B = poses[j];
    if (f <= 0 || n === 1) return resolver(A, ej, { xoff: K[i].xoff, pins: K[i].pins });
    if (f >= 1) return resolver(B, ej, { xoff: K[j].xoff, pins: K[j].pins });
    const P = mezclar(A, B, f), comp = compartidos(ej, A, B), pins = {};
    for (const a of comp) if (K[i].cont[a] && K[j].cont[a]) pins[a] = lerp(K[i].cont[a].x, K[j].cont[a].x, f);
    /* sin apoyo rígido clavado, el punto de anclaje avanza en línea recta */
    const ancla = { x: lerp(anclaX(K[i].E, ej.ancla), anclaX(K[j].E, ej.ancla), f) };
    return resolver(P, ej, { pins, forzados: comp, ancla });
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
        const clave = [r.E.H, r.E.S, r.E.C, r.E.seg.pc.tobillo, r.E.seg.bc.muneca];
        if (previo) { const salto = Math.max(...clave.map((p, q) => Math.hypot(p.x - previo[q].x, p.y - previo[q].y))); if (salto > 26) fallas.push(`${donde}: salto brusco (${salto.toFixed(0)})`); }
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
  function tronco(E) {
    const P = E.col, n = P.length;
    /* radios adelante / atrás (glúteos, abdomen, pecho) */
    const ra = E.fr ? radios(E) : [9.5, 8.8, 9.2, 11.2, 10], rp = E.fr ? radios(E) : [11, 9, 8.8, 9.8, 10.2];
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
  function dibujo(E, fantasma, orden) {
    const c1 = COL.cerca, c2 = E.fr ? COL.cerca : COL.lejos;
    const cuello = `<path d="${huso(E.S, E.C, 4.4, 4.2)}" fill="${c1.piel}"/>`;
    const partes = { BC: brazo(E.seg.bc, c1), BL: brazo(E.seg.bl, c2), PC: pierna(E.seg.pc, c1), PL: pierna(E.seg.pl, c2), T: `<path d="${tronco(E)}" fill="${c1.ropa}"/>`, C: cuello + cabeza(E, c1) };
    const seq = orden || (E.fr ? ['PL', 'PC', 'T', 'C', 'BL', 'BC'] : ['BL', 'PL', 'C', 'T', 'PC', 'BC']);
    return `<g class="${fantasma ? 'fig-fantasma' : 'fig-cuerpo'}">${seq.map(k => partes[k]).join('')}</g>`;
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
  function figuraSVG(ej, r, enc, fantasma) {
    const E = mover(r.E, enc.cx, enc.cy);
    const silla = ej.silla && !fantasma
      ? `<g class="fig-silla"><rect x="${f1(E.H.x - 16)}" y="${f1(E.H.y + 12)}" width="30" height="5" rx="2"/><rect x="${f1(E.H.x - 14)}" y="${f1(E.H.y + 16)}" width="4" height="${f1(PISO - E.H.y - 16)}"/><rect x="${f1(E.H.x + 8)}" y="${f1(E.H.y + 16)}" width="4" height="${f1(PISO - E.H.y - 16)}"/><rect x="${f1(E.H.x - 18)}" y="${f1(E.H.y - 30)}" width="4" height="46" rx="2"/></g>` : '';
    return (fantasma || ej.camara === 'arriba' ? '' : sombra(E)) + silla + dibujo(E, fantasma, ej.orden);
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

  /* reproductor: anima de pose en pose y avisa en qué pose está */
  function reproductor(cont, ej, { alCambiar = () => {}, auto = true, fantasma = true } = {}) {
    const enc = encuadre(ej), { poses } = preparar(ej), n = poses.length;
    cont.innerHTML = `<svg viewBox="0 0 ${W} ${H}" class="fig-svg" role="img" aria-label="Animación: ${ej.nom || 'ejercicio'}">${fondo(ej)}${etiquetaCam(ej)}<g ${zoom(enc)}><g class="fg"></g><g class="fc"></g></g></svg>`;
    const gF = cont.querySelector('.fg'), gC = cont.querySelector('.fc');
    const pausaBase = ej.pausa || 650;
    let i = 0, t0 = performance.now(), play = auto && n > 1, raf = null, vivo = true;
    const dur = k => poses[(k + 1) % n].dur || ej.dur || 1500;
    const quieto = () => matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.dataset.fx === 'suaves';
    const suav = f => (f < 0.5 ? 2 * f * f : 1 - Math.pow(-2 * f + 2, 2) / 2);
    const pintar = (idx, f) => { gC.innerHTML = figuraSVG(ej, cuadro(ej, idx, suav(f)), enc); };
    gF.innerHTML = fantasma && n > 1 ? figuraSVG(ej, cuadro(ej, 0, 0), enc, true) : '';
    function paso(t) {
      if (!vivo || !cont.isConnected) { vivo = false; return; }
      if (play) {
        const el = t - t0, pausa = poses[i].pausa ?? pausaBase;
        if (quieto()) { if (el > dur(i) + pausa) { i = (i + 1) % n; t0 = t; pintar(i, 0); alCambiar(i); } }
        else if (el < pausa) { /* quieto en la pose */ }
        else if (el < pausa + dur(i)) pintar(i, (el - pausa) / dur(i));
        else { i = (i + 1) % n; t0 = t; pintar(i, 0); alCambiar(i); }
      }
      raf = requestAnimationFrame(paso);
    }
    pintar(0, 0); alCambiar(0);
    raf = requestAnimationFrame(paso);
    return {
      ir(k) { i = ((k % n) + n) % n; t0 = performance.now(); pintar(i, 0); alCambiar(i); },
      siguiente() { this.ir(i + 1); },
      anterior() { this.ir(i - 1); },
      pausar() { play = false; pintar(i, 0); },
      reanudar() { if (n > 1) { play = true; t0 = performance.now(); } },
      get reproduciendo() { return play; },
      get indice() { return i; },
      destruir() { vivo = false; cancelAnimationFrame(raf); }
    };
  }

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

  return { svgEstatico, reproductor, esqueletoEn, validar, cuadro, preparar, diag, W, H, PISO };
})();
