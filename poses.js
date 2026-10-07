/* ============================================================
   Pilates Lab — poses de ejercicios y posiciones (motor: figura.js v2)

   tr dirección del tronco · fl flexión de columna (+ enrolla, − extiende)
   cab flexión de cuello · bc/bl brazos [ángulo, codo, muñeca]
   pc/pl piernas [muslo, rodilla, tobillo: + en punta, − flexionado]
   apoyo = lo que toca el piso (se resuelve solo con cinemática inversa)
   ik = agarres (manos a tobillos, nuca, pelvis…)
   Supino: cabeza a la izquierda. Prono: cabeza a la derecha.
   Pose 0 = posición inicial; s = paso de la secuencia del manual.
   Para revisarlas: _galeria.html (muestra cada transición y el control
   automático de apoyos, piso y articulaciones).
   ============================================================ */
'use strict';

const POSES = (() => {
  /* combina una pose con cambios; apoyo, ik y k se reemplazan enteros */
  const X = (base, c = {}) => ({ ...base, ...c });
  /* rueda todo el cuerpo (rodar como una pelota) */
  const rotar = (p, g, extra = {}) => ({
    ...p, tr: p.tr + g, ...['bc', 'bl', 'pc', 'pl'].reduce((o, k) => (p[k] ? { ...o, [k]: [p[k][0] + g, p[k][1], p[k][2] || 0] } : o), {}), ...extra
  });

  /* ---------- posiciones base ---------- */
  const DE_PIE = { tr: -90, fl: 0, cab: 0, bc: [90, 8, 0], bl: [92, 8, 0], pc: [90, 0, 0], pl: [90, 0, 0], apoyo: ['pieC', 'pieL'] };
  const SUPINO = { tr: 180, fl: 0, cab: 0, bc: [3, 0, 0], bl: [4, 0, 0], pc: [1, 0, 60], pl: [1, 0, 60], apoyo: ['pelvis', 'tronco', 'talonC', 'talonL', 'manoC', 'manoL'] };
  const SUPINO_FLEX = X(SUPINO, { pc: [1, 0, -5], pl: [1, 0, -5] });
  const SUPINO_PUNTA = X(SUPINO, { pc: [1, 0, 85], pl: [1, 0, 85] });
  const RODILLAS = { tr: 180, fl: 0, cab: 0, bc: [3, 0, 0], bl: [4, 0, 0], pc: [-55, 115, 30], pl: [-57, 115, 30], apoyo: ['pelvis', 'tronco', 'pieC', 'pieL', 'manoC', 'manoL'] };
  const MESA = X(RODILLAS, { pc: [-90, 90, 60], pl: [-91, 90, 60], apoyo: ['pelvis', 'tronco', 'manoC', 'manoL'] });
  const PRONO = { tr: 0, fl: 0, cab: 0, bc: [178, 0, 0], bl: [179, 0, 0], pc: [180, 0, 90], pl: [180, 0, 90], apoyo: ['pelvis', 'tronco', 'puntaC', 'puntaL'] };
  /* manos en el mat apenas detrás de la cadera con los brazos rectos (a 95° el codo se doblaba 40°) */
  const SENTADO = { tr: -90, fl: 0, cab: 0, bc: [112, 0, 0], bl: [114, 0, 0], pc: [0, 0, -5], pl: [0, 0, -5], apoyo: ['pelvis', 'talonC', 'talonL', 'manoC', 'manoL'] };
  /* manos bajo los hombros y rodillas bajo la cadera, brazos rectos (con -15° el codo se doblaba 21°) */
  const CUADRUPEDIA = { tr: -18, fl: 0, cab: -10, bc: [90, 0, 0], bl: [91, 0, 0], pc: [90, 90, 90], pl: [91, 90, 90], apoyo: ['rodillaC', 'rodillaL', 'puntaC', 'puntaL', 'manoC', 'manoL'] };
  /* plancha: brazos estirados bajo los hombros y el cuerpo en una línea de la cabeza a los talones */
  const PLANCHA = { tr: -19, fl: 0, cab: 0, bc: [81, 0, 0], bl: [82, 0, 0], pc: [160, 0, 40], pl: [160, 0, 40], apoyo: ['manoC', 'manoL', 'puntaC', 'puntaL'] };
  /* plancha supina (Leg Pull Up): brazos rectos con las manos bajo los hombros y el cuerpo en línea
     de los talones a los hombros, a unos 26° del piso (con el tronco más bajo los codos se doblaban) */
  const PL_SUPINA = { tr: -154, fl: 0, cab: 18, bc: [95, 0, 0], bl: [96, 0, 0], pc: [27, 0, 70], pl: [27, 0, 70], apoyo: ['manoC', 'manoL', 'talonC', 'talonL'] };
  /* abdominal: cabeza y espalda alta despegadas hasta la punta de los omóplatos;
     la lumbar y la torácica baja siguen en el mat (la curva va arriba) */
  const CURL = { tr: -159, fl: 42, cur: [-0.5, -0.5, -0.143, 0.5], cab: 22 };
  /* sentado en V (Teaser) */
  const V = { tr: -128, fl: 12, cab: 4, bc: [-50, 0, 0], bl: [-49, 0, 0], pc: [-55, 0, 85], pl: [-54, 0, 85], apoyo: ['pelvis'] };
  /* de costado, vista de frente: lado C = el de abajo */
  const COSTADO = { tr: -166, fl: 0, cab: 6, bc: [165, -100, 0], bl: [95, 0, 0], pc: [2, 0, 90], pl: [10, 0, 90], k: { pc: [1, 1, 0.5], pl: [1, 1, 0.5] }, ik: { bc: 'sien' }, apoyo: ['pelvis', 'tronco', 'manoL'] };
  /* de costado, vista desde arriba: se ve la silueta sagital (el frente del cuerpo hacia
     arriba de la imagen). Tronco en línea con el borde posterior del mat, caderas
     flexionadas para que los pies lleguen al borde anterior. Brazo de abajo: el codo en
     el mat más allá de la cabeza y la cabeza en la mano (el antebrazo en escorzo); brazo
     de arriba: la mano apoyada en el mat delante del pecho. Patea la pierna de arriba (pc). */
  const COSTADO_ARRIBA = { tr: 180, fl: 0, cab: 0, bc: [-74, 12, 6], bl: [180, 160, 0], pc: [-34, 0, 82], pl: [-37, 0, 84], k: { bc: [0.34, 0.6, 0.9], bl: [1.1, 0.28, 0.5] } };
  /* sentado visto de frente: piernas hacia quien mira (muy en escorzo: se acercan) */
  const SENTADO_FRENTE = { tr: -90, fl: 0, cab: 0, bc: [178, 0, 0], bl: [2, 0, 0], pc: [118, 0, -100], pl: [62, 0, -100], k: { pc: [0.36, 0.4, 1.1], pl: [0.36, 0.4, 1.1] }, apoyo: ['pelvis'] };
  /* Roll Over: apoyo en los omóplatos (nunca en el cuello), la pelvis apilada
     sobre los hombros y las piernas paralelas al piso por encima de la cabeza;
     la flexión se concentra en la torácica alta, que queda casi en el mat */
  const ROLL_OVER = { tr: 106, fl: 80, cur: [-0.2, -0.1, 0.05, 0.8], cab: 15, bc: [0, 0, 0], bl: [1, 0, 0], pc: [180, 0, 90], pl: [181, 0, 90], apoyo: ['hombros', 'manoC', 'manoL'] };
  /* vertical sobre los hombros: la curva se concentra arriba */
  const TOP = [-0.1, -0.1, 0, 0.7];
  const VERTICAL = { tr: 96, fl: 90, cur: TOP, cab: 18, bc: [0, 0, 0], bl: [1, 0, 0], pc: [-90, 0, 88], pl: [-89, 0, 88], apoyo: ['hombros', 'manoC', 'manoL'] };
  const VERTICAL_MANOS = X(VERTICAL, { ik: { bc: 'pelvis', bl: 'pelvis' }, apoyo: ['hombros'] });
  /* plancha lateral, vista de frente (lado C = brazo de apoyo, abajo) */
  /* de frente, el brazo cercano (bc) va detrás de la cabeza: la mano bajo la sien
     acostada de costado, o en la nuca */
  const DEBAJO = ['BC', 'PL', 'PC', 'T', 'C', 'BL'];
  const PL_LATERAL = { tr: -160, fl: 0, cab: 0, bc: [90, 0, 0], bl: [-90, 0, 0], pc: [19, 0, 90], pl: [21, 0, 90], k: { pc: [1, 1, 0.5], pl: [1, 1, 0.5] }, apoyo: ['manoC', 'pieC', 'pieL'] };

  const P = {};
  const ej = (id, nom, opts, poses) => { P[id] = { nom, vista: 'perfil', ...opts, poses }; };

  /* ================= POSICIONES ================= */
  ej('pos-bipedo', 'Bípedo (de pie)', {}, [DE_PIE]);
  ej('pos-bipedo-frente', 'Bípedo, de frente', { vista: 'frente' }, [X(DE_PIE, { bc: [97, 0, 0], bl: [83, 0, 0], pc: [92, 0, 90], pl: [88, 0, 90], k: { pc: [1, 1, 0.3], pl: [1, 1, 0.3] } })]);
  ej('pos-supino', 'Supino', {}, [SUPINO]);
  ej('pos-supino-rodillas', 'Supino con rodillas flexionadas', {}, [RODILLAS]);
  ej('pos-mesa', 'Supino, piernas en mesa', {}, [MESA]);
  ej('pos-prono', 'Prono', {}, [PRONO]);
  ej('pos-sedente', 'Sedente', {}, [SENTADO]);
  ej('pos-sedente-silla', 'Sedente en silla', { silla: true }, [{ tr: -90, fl: 0, cab: 0, bc: [95, 70, 0], bl: [96, 70, 0], pc: [0, 90, 0], pl: [2, 88, 0], apoyo: ['pieC', 'pieL'] }]);
  ej('pos-4-puntos', '4 puntos (cuadrupedia)', {}, [CUADRUPEDIA]);
  ej('pos-plancha', 'Plancha prona', {}, [PLANCHA]);
  ej('pos-plancha-supina', 'Plancha supina', {}, [PL_SUPINA]);
  ej('pos-lateral', 'Decúbito lateral', { vista: 'frente', orden: DEBAJO }, [COSTADO]);
  ej('pos-rodillas', 'De rodillas', {}, [{ tr: -90, fl: 0, cab: 0, bc: [90, 5, 0], bl: [92, 5, 0], pc: [87, 101, 90], pl: [88, 101, 90], apoyo: ['rodillaC', 'rodillaL'] }]);

  /* ================= MAT 1 ================= */
  ej('mat1-e01', 'The Hundred Preparation', {}, [
    RODILLAS,
    X(RODILLAS, { bc: [-90, 0, 0], bl: [-88, 0, 0], apoyo: ['pelvis', 'tronco', 'pieC', 'pieL'], s: 1 }),
    X(RODILLAS, { ...CURL, bc: [10, 0, 0], bl: [9, 0, 0], apoyo: ['pelvis', 'pieC', 'pieL'], s: 2 }),
    X(RODILLAS, { ...CURL, bc: [4, 0, 0], bl: [3, 0, 0], apoyo: ['pelvis', 'pieC', 'pieL'], s: 3, dur: 500, pausa: 60 }),
    X(RODILLAS, { ...CURL, bc: [16, 0, 0], bl: [15, 0, 0], apoyo: ['pelvis', 'pieC', 'pieL'], s: 3, dur: 500, pausa: 60 })
  ]);
  ej('mat1-e02', 'The Hundred', {}, [
    RODILLAS,
    X(MESA, { s: 1 }),
    X(MESA, { bc: [-90, 0, 0], bl: [-88, 0, 0], apoyo: ['pelvis', 'tronco'], s: 2 }),
    X(MESA, { ...CURL, bc: [10, 0, 0], bl: [9, 0, 0], pc: [-42, 0, 80], pl: [-41, 0, 80], apoyo: ['pelvis'], s: 3 }),
    X(MESA, { ...CURL, bc: [4, 0, 0], bl: [3, 0, 0], pc: [-42, 0, 80], pl: [-41, 0, 80], apoyo: ['pelvis'], s: 4, dur: 500, pausa: 60 }),
    X(MESA, { ...CURL, bc: [16, 0, 0], bl: [15, 0, 0], pc: [-42, 0, 80], pl: [-41, 0, 80], apoyo: ['pelvis'], s: 4, dur: 500, pausa: 60 })
  ]);
  /* Roll Up — brazos por encima de la cabeza solo hasta donde las costillas bajas
     siguen en el mat (no apoyados); piernas juntas, pies en punta suave */
  const RU0 = { tr: 180, fl: 0, cab: 0, bc: [-158, 0, 0], bl: [-157, 0, 0], pc: [1, 0, 30], pl: [1, 0, 30], apoyo: ['pelvis', 'tronco', 'talonC', 'talonL'] };
  const PIES_FLEX = { pc: [1, 0, -10], pl: [1, 0, -10] };
  ej('mat1-e03', 'The Roll Up', {}, [
    RU0,
    /* 1 · inhala: brazos al techo, pies flexionados (el talón se desliza un poco), la cabeza asiente… */
    X(RU0, { bc: [-90, 0, 0], bl: [-89, 0, 0], ...PIES_FLEX, cab: 10, libre: ['talonC', 'talonL'], s: 1, dur: 1300 }),
    /* …y enrolla cabeza y espalda alta */
    X(RU0, { ...CURL, bc: [-62, 0, 0], bl: [-61, 0, 0], ...PIES_FLEX, apoyo: ['pelvis', 'talonC', 'talonL'], s: 1, dur: 1200 }),
    /* 2 · exhala: vértebra por vértebra hasta la C sobre las piernas, abrazando una pelota */
    X(RU0, { tr: -46, fl: 96, cab: 18, bc: [2, 6, 0], bl: [3, 6, 0], ...PIES_FLEX, apoyo: ['pelvis', 'talonC', 'talonL'], s: 2, dur: 2100 }),
    /* 3 · inhala: abdominales y glúteos redondean la pelvis (retroversión) manteniendo la C */
    X(RU0, { tr: -104, fl: 92, cab: 22, bc: [-2, 8, 0], bl: [-1, 8, 0], ...PIES_FLEX, apoyo: ['pelvis', 'talonC', 'talonL'], s: 3, dur: 1500 }),
    /* 4 · exhala: termina de bajar vértebra por vértebra… */
    X(RU0, { bc: [-90, 0, 0], bl: [-89, 0, 0], ...PIES_FLEX, s: 4, dur: 2100 }),
    /* …y los brazos vuelven por encima de la cabeza */
    X(RU0, { libre: ['talonC', 'talonL'], s: 4, dur: 1200 })
  ]);
  const SLC = X(SUPINO, { pc: [-90, 0, 80], pl: [1, 0, 60], apoyo: ['pelvis', 'tronco', 'talonL', 'manoC', 'manoL'] });
  ej('mat1-e04', 'Single Leg Circles', {}, [
    SLC,
    X(SLC, { pc: [-98, 0, 80], k: { pc: [0.86, 0.86, 1] }, s: 1, dur: 900 }),
    X(SLC, { pc: [-82, 0, 80], k: { pc: [0.8, 0.8, 1] }, s: 1, dur: 900 }),
    X(SLC, { pc: [-74, 0, 80], k: { pc: [0.93, 0.93, 1] }, s: 2, dur: 900 })
  ]);
  const BOLA = { tr: -115, fl: 90, cab: 35, pc: [-78, 152, 40], pl: [-79, 152, 40], ik: { bc: 'pantorrillaC', bl: 'pantorrillaL' }, apoyo: ['pelvis'] };
  ej('mat1-e05', 'Rolling Like a Ball', { rueda: true }, [
    BOLA,
    rotar(BOLA, -82, { apoyo: ['hombros'], dx: -24, s: 1 }),
    X(BOLA, { s: 2 })
  ]);
  const SLS = X(RODILLAS, { ...CURL, pc: [-140, 150, 70], pl: [-30, 0, 85], ik: { bc: 'tobilloC', bl: 'rodillaC' }, apoyo: ['pelvis'] });
  ej('mat1-e06', 'Single Leg Stretch', {}, [
    SLS,
    X(SLS, { pc: [-30, 0, 85], pl: [-140, 150, 70], ik: { bc: 'rodillaL', bl: 'tobilloL' }, s: 1 }),
    X(SLS, { s: 2 })
  ]);
  const DLS = X(RODILLAS, { ...CURL, pc: [-140, 150, 70], pl: [-139, 150, 70], ik: { bc: 'tobilloC', bl: 'tobilloL' }, apoyo: ['pelvis'] });
  ej('mat1-e07', 'Double Leg Stretch', {}, [
    DLS,
    X(DLS, { pc: [-26, 0, 85], pl: [-25, 0, 85], bc: [-152, 0, 0], bl: [-150, 0, 0], ik: {}, s: 1 }),
    X(DLS, { s: 2 })
  ]);
  const SSLS = X(SUPINO, { ...CURL, pc: [-105, 0, 85], pl: [-8, 0, 85], ik: { bc: 'pantorrillaC', bl: 'pantorrillaC' }, apoyo: ['pelvis'] });
  ej('mat1-e08', 'Single Straight Leg Stretch', {}, [
    SSLS,
    X(SSLS, { pc: [-118, 0, 85], s: 1, dur: 600, pausa: 100 }),
    X(SSLS, { pc: [-8, 0, 85], pl: [-105, 0, 85], ik: { bc: 'pantorrillaL', bl: 'pantorrillaL' }, s: 2 }),
    X(SSLS, { pc: [-8, 0, 85], pl: [-118, 0, 85], ik: { bc: 'pantorrillaL', bl: 'pantorrillaL' }, s: 1, dur: 600, pausa: 100 })
  ]);
  const CODOS_NUCA = { bc: [0.55, 0.7, 0.45], bl: [0.5, 0.7, 0.45] };
  const DSLS = X(SUPINO, { ...CURL, pc: [-90, 0, 85], pl: [-89, 0, 85], ik: { bc: 'nuca', bl: 'nuca' }, k: CODOS_NUCA, apoyo: ['pelvis'] });
  ej('mat1-e09', 'Double Straight Leg Stretch', {}, [
    DSLS,
    X(DSLS, { pc: [-35, 0, 85], pl: [-34, 0, 85], s: 1 }),
    X(DSLS, { s: 2 })
  ]);
  const CC = X(SUPINO, { ...CURL, pc: [-140, 150, 70], pl: [-28, 0, 85], ik: { bc: 'nuca', bl: 'nuca' }, k: CODOS_NUCA, apoyo: ['pelvis'] });
  ej('mat1-e10', 'Criss Cross / Bicycle', {}, [
    CC,
    X(CC, { tr: -155, fl: 50, ik: { bc: 'nuca' }, bl: [-38, 150, 0], s: 1 }),
    X(CC, { pc: [-28, 0, 85], pl: [-140, 150, 70], s: 2 }),
    X(CC, { tr: -155, fl: 50, pc: [-28, 0, 85], pl: [-140, 150, 70], ik: { bl: 'nuca' }, bc: [-38, 150, 0], s: 1 })
  ]);
  const SSF = X(SENTADO, { bc: [0, 0, 0], bl: [1, 0, 0], pc: [0, 0, -10], pl: [0, 0, -10], apoyo: ['pelvis', 'talonC', 'talonL'] });
  ej('mat1-e11', 'Spine Stretch Forward', {}, [
    SSF,
    X(SSF, { tr: -40, fl: 133, cab: 18, bc: [24, 0, 0], bl: [25, 0, 0], s: 1, dur: 1800 }),
    X(SSF, { s: 2, dur: 1800 })
  ]);
  ej('mat1-e12', 'Spine Stretch Side', { vista: 'frente', persp: true }, [
    SENTADO_FRENTE,
    X(SENTADO_FRENTE, { tr: -108, fl: -42, bc: [112, 0, 0], bl: [-122, 25, 0], apoyo: ['pelvis', 'manoC'], s: 1 }),
    X(SENTADO_FRENTE, { s: 2 }),
    X(SENTADO_FRENTE, { tr: -72, fl: 42, bl: [68, 0, 0], bc: [-58, -25, 0], apoyo: ['pelvis', 'manoL'], s: 1 }),
    X(SENTADO_FRENTE, { s: 2 })
  ]);
  const SAW = X(SSF, { bc: [0, 0, 0], bl: [180, 0, 0], k: { bc: [0.25, 0.25, 0.3], bl: [0.25, 0.25, 0.3] } });
  ej('mat1-e13', 'Saw', {}, [
    SAW,
    X(SAW, { k: {}, s: 1 }),
    X(SAW, { k: {}, tr: -42, fl: 115, cab: 20, bc: [22, 0, 0], bl: [-145, 0, 0], s: 2, dur: 1800 }),
    X(SAW, { k: {}, s: 3, dur: 1800 })
  ]);
  const OLR = { tr: -88, fl: 30, cab: 10, pc: [-78, 125, 60], pl: [-77, 125, 60], ik: { bc: 'tobilloC', bl: 'tobilloL' }, apoyo: ['pelvis'] };
  const OLR_V = X(OLR, { tr: -97, fl: 16, cab: 6, pc: [-66, 0, 85], pl: [-65, 0, 85] });
  ej('mat1-e14', 'Open Leg Rocker', { rueda: true }, [
    OLR,
    X(OLR, { pc: [-66, 0, 85], s: 1 }),
    X(OLR_V, { s: 2 }),
    rotar(OLR_V, -80, { apoyo: ['hombros'], dx: -26, s: 3, dur: 1300 }),
    X(OLR_V, { s: 4, dur: 1300 })
  ]);
  const CODOS_AFUERA = { bc: [0.6, 0.78, 1], bl: [0.6, 0.78, 1] };
  const SWAN0 = X(PRONO, { bc: [-150, 150, 0], bl: [-149, 150, 0], k: CODOS_AFUERA, pc: [180, 0, 85], pl: [180, 0, 85], apoyo: ['pelvis', 'tronco', 'puntaC', 'puntaL', 'manoC', 'manoL'] });
  /* la extensión se concentra en la torácica; la lumbar acompaña poco */
  const ARCO = [-0.1, 0.05, 0.35, 0.7];
  ej('mat1-e15', 'Swan', {}, [
    SWAN0,
    /* 1 · inhala: omóplatos hacia abajo, se alarga la columna y empieza a despegar el esternón… */
    X(SWAN0, { tr: -6, fl: -24, cur: ARCO, cab: 0, apoyo: ['pelvis', 'puntaC', 'puntaL', 'manoC', 'manoL'], s: 1, dur: 1100 }),
    /* …empuja el mat y extiende la espalda alta, cabeza en línea, pubis en el mat */
    X(SWAN0, { tr: -20, fl: -58, cur: ARCO, cab: -4, apoyo: ['pelvis', 'puntaC', 'puntaL', 'manoC', 'manoL'], s: 1, dur: 1500 }),
    /* 2 · exhala: baja con control */
    X(SWAN0, { s: 2, dur: 1800 })
  ]);
  /* esfinge: tórax elevado con el brazo vertical, el codo bajo el hombro a 90° y el antebrazo en el mat
     (con el tórax a -14° el codo quedaba muy atrás, doblado 147°) */
  const SLK = X(PRONO, { tr: -34, fl: -20, cab: 0, bc: [95, 90, 0], bl: [96, 90, 0], pc: [180, 0, 90], pl: [180, 0, 90], apoyo: ['pelvis', 'antebrazoC', 'antebrazoL', 'puntaC', 'puntaL'] });
  const kickC = f => X(SLK, { pc: [180, f, 90], apoyo: ['pelvis', 'antebrazoC', 'antebrazoL', 'rodillaC', 'puntaL'], s: 1, dur: 550, pausa: 80 });
  const kickL = f => X(SLK, { pl: [180, f, 90], apoyo: ['pelvis', 'antebrazoC', 'antebrazoL', 'rodillaL', 'puntaC'], s: 1, dur: 550, pausa: 80 });
  ej('mat1-e16', 'Single Leg Kicks', {}, [
    SLK, kickC(125), kickC(145), X(SLK, { s: 2 }), kickL(125), kickL(145)
  ]);
  const DLK = X(PRONO, { cab: 0, pc: [180, 0, 90], pl: [180, 0, 90], ik: { bc: 'cintura', bl: 'cintura' }, apoyo: ['pelvis', 'tronco', 'puntaC', 'puntaL'] });
  const DLKk = f => X(DLK, { pc: [180, f, 90], pl: [180, f - 2, 90], apoyo: ['pelvis', 'tronco', 'rodillaC', 'rodillaL'], s: 1, dur: 500, pausa: 60 });
  ej('mat1-e17', 'Double Leg Kicks', {}, [
    DLK, DLKk(120), DLKk(140), DLKk(125),
    X(DLK, { tr: -20, fl: -50, cab: 0, ik: {}, bc: [174, 0, 0], bl: [176, 0, 0], apoyo: ['pelvis', 'puntaC', 'puntaL'], s: 2, dur: 1600 })
  ]);
  const SWIM = X(PRONO, { tr: -8, fl: -20, bc: [0, 0, 0], bl: [2, 0, 0], apoyo: ['pelvis'] });
  ej('mat1-e18', 'Swimming', {}, [
    SWIM,
    X(SWIM, { bc: [-14, 0, 0], pl: [-168, 0, 90], s: 1, dur: 500, pausa: 40 }),
    X(SWIM, { bl: [-12, 0, 0], pc: [-168, 0, 90], s: 1, dur: 500, pausa: 40 })
  ]);
  ej('mat1-e19', 'Side Leg Lifts', { vista: 'frente', orden: DEBAJO }, [
    COSTADO,
    X(COSTADO, { pl: [-16, 0, 90], s: 1 }),
    X(COSTADO, { s: 2 })
  ]);
  /* la pierna de arriba levantada a la altura de la cadera dibuja un círculo: desde
     arriba se ve ir adelante y atrás, y acortarse cuando sube (escorzo) */
  const CIRC = (a, k) => X(COSTADO_ARRIBA, { pc: [a, 0, 84], k: { ...COSTADO_ARRIBA.k, pc: [k, k, 1] } });
  ej('mat1-e20', 'Side Leg Circles (Small & Big)', { camara: 'arriba' }, [
    COSTADO_ARRIBA,
    X(CIRC(-46, 0.9), { s: 1, dur: 900 }),
    X(CIRC(-30, 0.8), { s: 2, dur: 900 }),
    X(CIRC(-16, 0.92), { s: 2, dur: 900 })
  ]);
  ej('mat1-e21', 'Side Leg Kicks', { camara: 'arriba' }, [
    COSTADO_ARRIBA,
    /* 1 · inhala: patea al frente con el pie flexionado… */
    X(COSTADO_ARRIBA, { pc: [-74, 0, -8], s: 1, dur: 800 }),
    /* …y un segundo pulso, un poco más lejos */
    X(COSTADO_ARRIBA, { pc: [-86, 0, -12], s: 1, dur: 380, pausa: 70 }),
    /* 2 · exhala: patea atrás con el pie en punta, sin mover el tronco */
    X(COSTADO_ARRIBA, { pc: [22, 0, 88], s: 2, dur: 1300 })
  ]);
  ej('mat1-e22', 'Side Leg Bicycle', { camara: 'arriba' }, [
    COSTADO_ARRIBA,
    X(COSTADO_ARRIBA, { pc: [-70, 95, 80], s: 1 }),
    X(COSTADO_ARRIBA, { pc: [-74, 0, 85], s: 1 }),
    X(COSTADO_ARRIBA, { pc: [22, 0, 88], s: 2 }),
    X(COSTADO_ARRIBA, { pc: [22, 130, 88], s: 2 }),
    X(COSTADO_ARRIBA, { pc: [-50, 130, 88], s: 2 })
  ]);
  const BAN0 = X(COSTADO, { tr: -172, cab: 0, bc: [180, 0, 0], bl: [0, 0, 0], ik: {}, pc: [0, 0, 90], pl: [8, 0, 90], apoyo: ['pelvis', 'tronco'] });
  ej('mat1-e23', 'Side Leg Bananas', { vista: 'frente', orden: DEBAJO }, [
    BAN0,
    X(BAN0, { tr: -174, fl: 18, cab: 4, bc: [-168, 0, 0], bl: [-163, 0, 0], pc: [-16, 0, 90], pl: [-10, 0, 90], apoyo: ['pelvis'], s: 1, dur: 1500 }),
    X(BAN0, { s: 2, dur: 1500 })
  ]);
  const SEAL = { tr: -115, fl: 88, cab: 34, pc: [-84, 150, 60], pl: [-83, 150, 60], k: { pc: [0.72, 0.8, 0.8], pl: [0.72, 0.8, 0.8] }, ik: { bc: 'tobilloC', bl: 'tobilloL' }, apoyo: ['pelvis'] };
  const SEAL_AP = X(SEAL, { k: { pc: [0.72, 0.68, 0.8], pl: [0.72, 0.68, 0.8] } });
  ej('mat1-e24', 'Seal', { rueda: true }, [
    SEAL,
    X(SEAL_AP, { s: 1, dur: 350, pausa: 40 }), X(SEAL, { s: 1, dur: 350, pausa: 40 }),
    rotar(SEAL, -80, { apoyo: ['hombros'], dx: -22, s: 2 }),
    X(SEAL_AP, { s: 3, dur: 1300 }), X(SEAL, { s: 3, dur: 350, pausa: 40 })
  ]);
  /* rodar hacia abajo "como sobre una pelota de playa" hasta apoyar las manos con los brazos rectos
     (antes el tronco colgaba más y los codos se doblaban 79°) */
  const PU_ROLL = { tr: 40, fl: 65, cab: 20, bc: [90, 0, 0], bl: [91, 0, 0], pc: [84, 15, 0], pl: [85, 15, 0], apoyo: ['pieC', 'pieL', 'manoC', 'manoL'] };
  /* 2 · "caminar con las manos hasta la plancha": una mano por vez (3 pasos cada una), la
     otra queda clavada en el mat con el codo apenas flojo; la que avanza se despega unos
     7 cm; los talones se despegan a mitad
     de camino. Cada pose se resolvió para que el hombro quede al alcance de las manos
     apoyadas (antes las manos se deslizaban hasta la plancha). Al volver, el mismo camino. */
  const PU_CAMINAR = [
    {tr: 43, fl: 58, cab: 17, bc: [77.7, 36.1, 0], bl: [80.6, 0, 0], pc: [86, 0, 0], pl: [87, 0, 0], apoyo: ['pieC', 'pieL', 'manoL'], s: 2, dur: 520},
    {tr: 42, fl: 51, cab: 15, bc: [77.7, 0, 0], bl: [102, 0, 0], pc: [100, 0, 0], pl: [101, 0, 0], apoyo: ['pieC', 'pieL', 'manoC', 'manoL'], s: 2, dur: 420},
    {tr: 39, fl: 45, cab: 14, bc: [82.2, 0, 0], bl: [105.3, 62.1, 0], pc: [102, 0, 0], pl: [103, 0, 0], apoyo: ['pieC', 'pieL', 'manoC'], s: 2, dur: 520},
    {tr: 33, fl: 34, cab: 10, bc: [98.3, 0, 0], bl: [79, 0, 0], pc: [112, 0, 0], pl: [113, 0, 0], apoyo: ['pieC', 'pieL', 'manoC', 'manoL'], s: 2, dur: 420},
    {tr: 40, fl: 23, cab: 7, bc: [117.1, 62.9, 0], bl: [92.2, 0, 0], pc: [123, 0, 40], pl: [124, 0, 40], apoyo: ['puntaC', 'puntaL', 'manoL'], s: 2, dur: 520},
    {tr: 35, fl: 20, cab: 6, bc: [86.2, 0, 0], bl: [100.6, 0, 0], pc: [128, 0, 40], pl: [129, 0, 40], apoyo: ['puntaC', 'puntaL', 'manoC', 'manoL'], s: 2, dur: 420},
    {tr: 28, fl: 12, cab: 4, bc: [93.7, 0, 0], bl: [113.2, 62.6, 0], pc: [132, 0, 40], pl: [133, 0, 40], apoyo: ['puntaC', 'puntaL', 'manoC'], s: 2, dur: 520},
    {tr: 23, fl: 12, cab: 4, bc: [100.8, 0, 0], bl: [81.4, 0, 0], pc: [137, 0, 40], pl: [138, 0, 40], apoyo: ['puntaC', 'puntaL', 'manoC', 'manoL'], s: 2, dur: 420},
    {tr: 18, fl: 4, cab: 1, bc: [104.8, 59.9, 0], bl: [84.9, 0, 0], pc: [139, 0, 40], pl: [140, 0, 40], apoyo: ['puntaC', 'puntaL', 'manoL'], s: 2, dur: 520},
    {tr: -1, fl: 4, cab: 1, bc: [78.7, 0, 0], bl: [98.2, 0, 0], pc: [152, 0, 40], pl: [153, 0, 40], apoyo: ['puntaC', 'puntaL', 'manoC', 'manoL'], s: 2, dur: 420},
    {tr: -6, fl: 4, cab: 1, bc: [80.4, 0, 0], bl: [114.4, 68.9, 0], pc: [155, 0, 40], pl: [156, 0, 40], apoyo: ['puntaC', 'puntaL', 'manoC'], s: 2, dur: 520}
  ];
  ej('mat1-e25', 'Push Ups', { ancla: 'pie' }, [
    X(DE_PIE, { bc: [-90, 0, 0], bl: [-88, 0, 0] }),
    X(PU_ROLL, { s: 1, dur: 1800 }),
    ...PU_CAMINAR,
    X(PLANCHA, { s: 2, dur: 420 }),
    /* 3 · baja en bloque (codos flexionados): el cuerpo sigue recto de la cabeza a los talones */
    X(PLANCHA, { tr: -8, pc: [172, 0, 40], pl: [172, 0, 40], s: 3 }),
    X(PLANCHA, { s: 4, alto: true }),
    ...[...PU_CAMINAR].reverse().map(p => X(p, { s: 4 })),
    X(PU_ROLL, { s: 4, dur: 520 })
  ]);

  /* ================= MAT 2 ================= */
  /* sentado visto desde arriba: el tronco en escorzo, piernas hacia abajo de la imagen;
     la rotación se ve como la línea de los hombros y los brazos que gira */
  /* piernas juntas y estiradas con los pies flexionados (dedos al techo), brazos abiertos a
     la altura de los hombros. La columna rota sobre la pelvis quieta (rot): giran los
     hombros, los brazos en línea y la cabeza; las caderas y los pies quedan parejos */
  const TW = { tr: -90, fl: 0, cab: 0, rot: 0, bc: [180, 0, 0], bl: [0, 0, 0], pc: [86.4, 0, 90], pl: [93.6, 0, 90], k: { tronco: 0.04, pc: [1, 1, 0.32], pl: [1, 1, 0.32] } };
  const girar = g => X(TW, { rot: g, bc: [180 + g, 0, 0], bl: [g, 0, 0] });
  ej('mat2-e01', 'Spine Twist', { vista: 'frente', camara: 'arriba', matV: true }, [
    TW,
    /* 1 · inhala: rota de un solo movimiento continuo hasta el final del giro */
    X(girar(-48), { s: 1, dur: 1600 }),
    /* 2 · exhala: vuelve al centro (ahí cambia la respiración: se detiene antes del otro lado) */
    X(TW, { s: 2, dur: 1400, alto: true }),
    /* al otro lado */
    X(girar(48), { s: 1, dur: 1600 }),
    X(TW, { s: 2, dur: 1400 })
  ]);
  const MESA_BRAZOS = X(MESA, { bc: [-168, 0, 0], bl: [-167, 0, 0], apoyo: ['pelvis', 'tronco'] });
  ej('mat2-e02', 'Teaser Preparation', {}, [
    MESA_BRAZOS,
    { tr: -124, fl: 10, cab: 4, bc: [-18, 0, 0], bl: [-17, 0, 0], pc: [-40, 40, 70], pl: [-39, 40, 70], apoyo: ['pelvis'], s: 1, dur: 1800 },
    X(MESA_BRAZOS, { s: 2, dur: 1800 })
  ]);
  ej('mat2-e03', 'Teaser 1 — Torso Roll Down', {}, [
    MESA_BRAZOS,
    X(V, { s: 1, dur: 1800 }),
    X(V, { tr: 180, fl: 0, cab: 0, bc: [-172, 0, 0], bl: [-171, 0, 0], apoyo: ['pelvis', 'tronco'], s: 2, dur: 1800 }),
    X(V, { s: 3, dur: 1800 })
  ]);
  const PIERNAS_ARRIBA = X(SUPINO, { pc: [-90, 0, 85], pl: [-89, 0, 85], bc: [-170, 0, 0], bl: [-169, 0, 0], apoyo: ['pelvis', 'tronco'] });
  ej('mat2-e04', 'Teaser 2 — Leg Lowers', {}, [
    PIERNAS_ARRIBA,
    X(V, { s: 1, dur: 1800 }),
    X(V, { pc: [-12, 0, 85], pl: [-11, 0, 85], s: 2 }),
    X(V, { s: 3 })
  ]);
  ej('mat2-e05', 'Teaser 3 — Arms and Legs Together', {}, [
    V,
    X(V, { tr: -172, fl: 0, cab: 0, bc: [-174, 0, 0], bl: [-173, 0, 0], pc: [-8, 0, 85], pl: [-7, 0, 85], s: 1, dur: 1800 }),
    X(V, { s: 2, dur: 1800 })
  ]);
  /* Hip Circles — sentada en V apoyada en las manos, vista DESDE ARRIBA: de perfil el
     círculo no se ve (las piernas van hacia los costados). Desde arriba la figura mira
     hacia abajo de la imagen: el tronco reclinado se ve en escorzo (se ve el pecho); los
     hombros quedan más atrás que las manos, así que los brazos bajan hacia las caderas
     (las manos en el mat a los costados, detrás de la pelvis) y las piernas van hacia adelante. Los pies dibujan
     el círculo: a la derecha de quien lo hace (izquierda de la imagen), lejos al bajar
     (la pierna se ve más larga), a su izquierda y cerca al subir (más corta, en escorzo).
     a = dirección de las piernas en la imagen, l = largo aparente */
  const hipc = (a, l, c = {}) => ({ tr: -90, fl: 0, cab: 0, bc: [101, 0, 0], bl: [79, 0, 0], pc: [a - 3, 0, 85], pl: [a + 3, 0, 85],
    k: { tronco: 0.7, bc: [0.38, 0.38, 0.75], bl: [0.38, 0.38, 0.75], pc: [l, l, 0.8], pl: [l, l, 0.8] }, ...c });
  const HIPC = hipc(90, 0.5);
  /* la trayectoria de los pies arranca visible: es el círculo */
  ej('mat2-e06', 'Hip Circles', { vista: 'frente', camara: 'arriba', capas: { tray: true } }, [
    HIPC,
    /* 1 · inhala: a su derecha, bajando hacia el mat… */
    hipc(116, 0.72, { s: 1, dur: 700, alto: false }),
    /* …abajo: lejos, cerca del mat */
    hipc(90, 0.92, { s: 1, dur: 700, alto: false }),
    /* 2 · exhala: a su izquierda y de vuelta arriba */
    hipc(64, 0.72, { s: 2, dur: 700, alto: false }),
    hipc(90, 0.5, { s: 2, dur: 700, alto: true }),
    /* en el otro sentido */
    hipc(64, 0.72, { s: 1, dur: 700, alto: false }),
    hipc(90, 0.92, { s: 1, dur: 700, alto: false }),
    hipc(116, 0.72, { s: 2, dur: 700, alto: false })
  ]);
  const RO0 = X(SUPINO_PUNTA, { bc: [3, 0, 0], bl: [4, 0, 0] });
  ej('mat2-e07', 'Roll Over', { ancla: 'S' }, [
    RO0,
    X(RO0, { pc: [-90, 0, 88], pl: [-89, 0, 88], apoyo: ['pelvis', 'tronco', 'manoC', 'manoL'], s: 1 }),
    X(ROLL_OVER, { s: 2, dur: 1900 }),
    X(ROLL_OVER, { pc: [180, 0, -5], pl: [181, 0, -5], k: { pc: [0.95, 0.95, 1] }, s: 2 }),
    X(SUPINO, { pc: [-32, 0, -5], pl: [-31, 0, -5], apoyo: ['pelvis', 'tronco', 'manoC', 'manoL'], s: 3, dur: 1900 })
  ]);
  const MC = { tr: 180, fl: 0, cab: 0, bc: [0, 0, 0], bl: [0, 0, 0], pc: [2, 0, 90], pl: [-2, 0, 90], k: { pc: [0.3, 0.3, 0.6], pl: [0.3, 0.3, 0.6] } };
  ej('mat2-e08', 'Modified Corkscrew', { vista: 'frente', camara: 'arriba' }, [
    MC,
    X(MC, { pc: [58, 0, 90], pl: [52, 0, 90], k: { pc: [0.72, 0.72, 0.8], pl: [0.72, 0.72, 0.8] }, s: 1 }),
    X(MC, { pc: [-52, 0, 90], pl: [-58, 0, 90], k: { pc: [0.72, 0.72, 0.8], pl: [0.72, 0.72, 0.8] }, s: 2 })
  ]);
  ej('mat2-e09', 'Corkscrew', { ancla: 'S' }, [
    X(RO0, { pc: [-90, 0, 88], pl: [-89, 0, 88], apoyo: ['pelvis', 'tronco', 'manoC', 'manoL'] }),
    X(ROLL_OVER, { s: 1, dur: 1800 }),
    X(ROLL_OVER, { tr: 150, fl: 70, cur: [-0.375, -0.125, 0.125, 0.375], pc: [-150, 0, 88], pl: [-148, 0, 88], k: { pc: [0.85, 0.85, 1], pl: [0.85, 0.85, 1] }, s: 2, dur: 1600 }),
    X(RO0, { pc: [-62, 0, 88], pl: [-60, 0, 88], k: { pc: [0.85, 0.85, 1], pl: [0.85, 0.85, 1] }, apoyo: ['pelvis', 'tronco', 'manoC', 'manoL'], s: 3, dur: 1600 }),
    X(ROLL_OVER, { tr: 150, fl: 70, cur: [-0.375, -0.125, 0.125, 0.375], pc: [-150, 0, 88], pl: [-148, 0, 88], k: { pc: [0.8, 0.8, 1], pl: [0.8, 0.8, 1] }, s: 4, dur: 1600 })
  ]);
  const NP0 = X(SUPINO_FLEX, { ik: { bc: 'nuca', bl: 'nuca' }, k: CODOS_NUCA, apoyo: ['pelvis', 'tronco', 'talonC', 'talonL'] });
  ej('mat2-e10', 'Neck Pull', {}, [
    NP0,
    X(NP0, { ...CURL, apoyo: ['pelvis', 'talonC', 'talonL'], s: 1 }),
    X(NP0, { tr: -40, fl: 120, cab: 25, apoyo: ['pelvis', 'talonC', 'talonL'], s: 2, dur: 1800 }),
    X(NP0, { tr: -90, fl: 0, cab: 0, apoyo: ['pelvis', 'talonC', 'talonL'], s: 3, dur: 1600 }),
    X(NP0, { tr: -122, fl: 0, cab: 0, apoyo: ['pelvis', 'talonC', 'talonL'], s: 4, dur: 1400 })
  ]);
  ej('mat2-e11', 'Leg Pull Down', { ancla: 'mano' }, [
    PLANCHA,
    X(PLANCHA, { pc: [-162, 0, 90], apoyo: ['manoC', 'manoL', 'puntaL'], s: 1 }),
    X(PLANCHA, { s: 2 })
  ]);
  /* patada al techo con dos pulsos arriba (respiración percusiva), bajar y alternar;
     la pierna de apoyo sostiene la línea y la cadera no baja */
  const lpu = (m, a, c = {}) => X(PL_SUPINA, { [m]: [a, 0, 85], apoyo: ['manoC', 'manoL', m === 'pc' ? 'talonL' : 'talonC'], s: 1, ...c });
  ej('mat2-e12', 'Leg Pull Up', { ancla: 'mano' }, [
    PL_SUPINA,
    lpu('pc', -66, { dur: 1000 }), lpu('pc', -56, { dur: 260, alto: false }), lpu('pc', -72, { dur: 300 }),
    X(PL_SUPINA, { s: 2, dur: 900 }),
    lpu('pl', -66, { dur: 1000 }), lpu('pl', -56, { dur: 260, alto: false }), lpu('pl', -72, { dur: 300 }),
    X(PL_SUPINA, { s: 2, dur: 900 })
  ]);
  ej('mat2-e13', 'Jackknife', { ancla: 'S' }, [
    X(RO0, { pc: [-90, 0, 88], pl: [-89, 0, 88], apoyo: ['pelvis', 'tronco', 'manoC', 'manoL'] }),
    X(ROLL_OVER, { s: 1, dur: 1800 }),
    X(ROLL_OVER, { tr: 105, fl: 88, cab: 44, pc: [155, 0, 90], pl: [156, 0, 90], apoyo: ['hombros', 'manoC', 'manoL', 'puntaC', 'puntaL'], s: 2 }),
    X(VERTICAL, { s: 3, dur: 1600 }),
    X(RO0, { tr: 160, fl: 30, cab: 12, pc: [-98, 0, 88], pl: [-97, 0, 88], apoyo: ['manoC', 'manoL'], s: 4, dur: 1900 })
  ]);
  const KSK = { tr: -35, fl: 0, cab: 0, bl: [86, 0, 0], ik: { bc: 'nuca' }, pl: [92, 88, 90], pc: [180, 0, 90], k: { pl: [1, 0.3, 0.3] }, apoyo: ['manoL', 'rodillaL'] };
  ej('mat2-e14', 'Kneeling Side Kicks', { vista: 'frente', orden: DEBAJO }, [
    KSK,
    X(KSK, { pc: [182, 0, -5], k: { ...KSK.k, pc: [0.72, 0.72, 0.8] }, s: 1 }),
    X(KSK, { pc: [176, 0, 90], k: { ...KSK.k, pc: [0.84, 0.84, 1] }, s: 2 })
  ]);
  const SIT_HIP = { tr: -118, fl: 0, cab: 0, bc: [96, 0, 0], bl: [40, 60, 0], pc: [4, -176, 90], pl: [-4, -180, 90], k: { pc: [1, 1, 0.5], pl: [1, 1, 0.5] }, apoyo: ['pelvis', 'manoC'] };
  /* sentado de lado con las piernas estiradas: paso previo a elevar la cadera */
  const SIT_LARGO = X(SIT_HIP, { pc: [12, 0, 90], pl: [15, 0, 90], k: { pc: [1, 1, 0.5], pl: [1, 1, 0.5] }, apoyo: ['pelvis', 'manoC', 'pieC', 'pieL'] });
  ej('mat2-e15', 'Twist (Seated Twist)', { vista: 'frente' }, [
    SIT_HIP,
    X(SIT_LARGO, { s: 1, dur: 900 }),
    X(PL_LATERAL, { s: 1, dur: 1200 }),
    X(PL_LATERAL, { cab: 30, bl: [55, 10, 0], k: { ...PL_LATERAL.k, ancho: 0.78 }, s: 1 }),
    X(SIT_LARGO, { s: 2, dur: 1400 })
  ]);
  ej('mat2-e16', 'Side Bend Twist', { vista: 'frente' }, [
    PL_LATERAL,
    X(PL_LATERAL, { bl: [-150, 0, 0], s: 1 }),
    X(PL_LATERAL, { cab: 32, bl: [70, 20, 0], k: { ...PL_LATERAL.k, ancho: 0.78 }, s: 2 }),
    X(PL_LATERAL, { bl: [-90, 0, 0], g: 0.5, s: 3 })
  ]);
  ej('mat2-e17', 'Side Bend (Mermaid)', { vista: 'frente' }, [
    PL_LATERAL,
    X(PL_LATERAL, { bl: [-112, 0, 0], s: 1 }),
    X(PL_LATERAL, { tr: -170, fl: 20, cab: 12, bl: [12, 0, 0], s: 2 }),
    X(PL_LATERAL, { tr: -150, fl: -30, cab: -5, bl: [-172, 0, 0], s: 3 })
  ]);
  const TIJ = X(VERTICAL_MANOS, { pc: [-128, 0, 88], pl: [-48, 0, 88] });
  ej('mat2-e18', 'Scissors', { ancla: 'S' }, [
    X(RO0, { apoyo: ['pelvis', 'tronco', 'manoC', 'manoL'] }),
    X(VERTICAL, { s: 1, dur: 2000 }),
    X(VERTICAL_MANOS, { s: 2 }),
    X(TIJ, { s: 3 }),
    X(VERTICAL_MANOS, { s: 4 }),
    X(TIJ, { pc: [-48, 0, 88], pl: [-128, 0, 88], s: 3 })
  ]);
  ej('mat2-e19', 'Bicycle', { ancla: 'S' }, [
    VERTICAL_MANOS,
    X(TIJ, { s: 1 }),
    X(TIJ, { pl: [-40, 95, 80], s: 2 }),
    X(TIJ, { pc: [-70, 0, 88], pl: [-115, 100, 80], s: 2 }),
    X(TIJ, { pc: [-48, 0, 88], pl: [-128, 0, 88], s: 3 })
  ]);
  const PUENTE = { tr: 162, fl: -12, cab: 22, pc: [-18, 100, 30], pl: [-16, 100, 30], ik: { bc: 'pelvis', bl: 'pelvis' }, apoyo: ['hombros', 'pieC', 'pieL'] };
  ej('mat2-e20', 'Shoulder Bridge', { ancla: 'S' }, [
    PUENTE,
    X(PUENTE, { pc: [-100, 0, -10], apoyo: ['hombros', 'pieL'], s: 1 }),
    X(PUENTE, { pc: [6, 0, -5], apoyo: ['hombros', 'pieL'], s: 2 }),
    X(PUENTE, { pc: [-100, 0, -10], apoyo: ['hombros', 'pieL'], s: 3 })
  ]);
  ej('mat2-e21', 'Boomerang', {}, [
    X(SENTADO, { pc: [0, 0, 85], pl: [1, 0, 85], apoyo: ['pelvis', 'talonC', 'talonL', 'manoC', 'manoL'] }),
    X(SUPINO_PUNTA, { pc: [-80, 0, 88], pl: [-79, 0, 88], apoyo: ['tronco', 'manoC', 'manoL'], libre: ['manoC', 'manoL'], s: 1, dur: 1400 }),
    X(ROLL_OVER, { s: 1, dur: 1400 }),
    X(V, { s: 2, dur: 2000 }),
    /* los brazos circulan por arriba de la cabeza hasta entrelazar las manos atrás,
       y al soltar siguen el círculo hacia arriba (giro: sentido obligado) */
    X(V, { tr: -116, bc: [150, 0, 0], bl: [152, 0, 0], giro: { bc: -1, bl: -1 }, s: 3, dur: 1700 }),
    X(V, { tr: -100, pc: [-30, 0, 85], pl: [-29, 0, 85], bc: [-95, 0, 0], bl: [-93, 0, 0], giro: { bc: 1, bl: 1 }, s: 4, dur: 1300 }),
    X(SENTADO, { tr: -40, fl: 125, cab: 20, bc: [16, 0, 0], bl: [17, 0, 0], pc: [0, 0, 85], pl: [1, 0, 85], apoyo: ['pelvis', 'talonC', 'talonL'], s: 4, dur: 1800 })
  ]);
  const SD_ARCO = X(SWAN0, { tr: -28, fl: -66, cab: 0, apoyo: ['pelvis', 'puntaC', 'puntaL', 'manoC', 'manoL'] });
  ej('mat2-e22', 'Swan Dive y Swan Rocking', {}, [
    SWAN0,
    X(SD_ARCO, { s: 1, dur: 1600 }),
    X(SD_ARCO, { tr: 10, bc: [-4, 0, 0], bl: [-2, 0, 0], pc: [-158, 0, 88], pl: [-157, 0, 88], apoyo: ['tronco'], libre: ['manoC', 'manoL'], dx: 8, s: 2, dur: 1100 }),
    X(SD_ARCO, { tr: -42, pc: [178, 0, 88], pl: [178, 0, 88], bc: [140, 110, 0], bl: [142, 110, 0], apoyo: ['pelvis', 'puntaC', 'puntaL'], dx: -6, s: 3, dur: 1100 })
  ]);
  const BOW = { tr: -18, fl: -45, cab: 0, pc: [-165, 150, 80], pl: [-163, 150, 80], ik: { bc: 'tobilloC', bl: 'tobilloL' }, apoyo: ['pelvis'] };
  ej('mat2-e23', 'Rocking', { rueda: true }, [
    X(PRONO, { tr: -12, fl: -20, pc: [178, 150, 80], pl: [178, 150, 80], ik: { bc: 'tobilloC', bl: 'tobilloL' }, apoyo: ['pelvis', 'tronco', 'rodillaC', 'rodillaL'] }),
    X(BOW, { s: 1, dur: 1500 }),
    rotar(BOW, 24, { apoyo: ['tronco'], dx: 10, s: 2, dur: 1000 }),
    rotar(BOW, -18, { apoyo: ['pelvis'], dx: -4, s: 3, dur: 1000 })
  ]);

  return P;
})();
