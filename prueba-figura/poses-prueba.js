/* Poses afinadas con el manual para la prueba (Roll Up y Swan). */
const POSES_PRUEBA = (() => {
  const X = (b, c = {}) => ({ ...b, ...c });
  /* Roll Up — supino; brazos por encima de la cabeza solo hasta donde las costillas
     bajas siguen en el mat (no apoyados); piernas juntas, pies en punta suave */
  const RU0 = { tr: 180, fl: 0, cab: 0, bc: [-158, 0, 0], bl: [-157, 0, 0], pc: [1, 0, 30], pl: [1, 0, 30], apoyo: ['pelvis', 'tronco', 'talonC', 'talonL'] };
  /* abdominal: cabeza y torácica alta hasta la punta de los omóplatos */
  const CURL = { tr: -159, fl: 42, cur: [-0.5, -0.5, -0.143, 0.5], cab: 22 };
  const rollUp = { nom: 'The Roll Up', vista: 'perfil', poses: [
    RU0,
    /* 1 · inhala: brazos al techo, pies flexionados, la cabeza asiente */
    X(RU0, { bc: [-90, 0, 0], bl: [-89, 0, 0], pc: [1, 0, -10], pl: [1, 0, -10], cab: 10, s: 1, dur: 1300 }),
    /* …y enrolla cabeza y espalda alta */
    X(RU0, { ...CURL, bc: [-62, 0, 0], bl: [-61, 0, 0], pc: [1, 0, -10], pl: [1, 0, -10], apoyo: ['pelvis', 'talonC', 'talonL'], s: 1, dur: 1200 }),
    /* 2 · exhala: vértebra por vértebra hasta la C sobre las piernas, abrazando una pelota */
    X(RU0, { tr: -46, fl: 96, cab: 18, bc: [2, 6, 0], bl: [3, 6, 0], pc: [1, 0, -10], pl: [1, 0, -10], apoyo: ['pelvis', 'talonC', 'talonL'], s: 2, dur: 2100 }),
    /* 3 · inhala: abdominales y glúteos redondean la pelvis (retroversión) manteniendo la C */
    X(RU0, { tr: -104, fl: 92, cab: 22, bc: [-2, 8, 0], bl: [-1, 8, 0], pc: [1, 0, -10], pl: [1, 0, -10], apoyo: ['pelvis', 'talonC', 'talonL'], s: 3, dur: 1500 }),
    /* 4 · exhala: termina de bajar vértebra por vértebra… */
    X(RU0, { bc: [-90, 0, 0], bl: [-89, 0, 0], pc: [1, 0, -10], pl: [1, 0, -10], s: 4, dur: 2100 }),
    /* …y los brazos vuelven por encima de la cabeza */
    X(RU0, { s: 4, dur: 1200 })
  ] };
  /* Swan — prono, manos bajo los hombros, codos flexionados, piernas juntas */
  const CODOS = { bc: [0.6, 0.78, 1], bl: [0.6, 0.78, 1] };
  const SW0 = { tr: 0, fl: 0, cab: 0, bc: [-150, 150, 0], bl: [-149, 150, 0], k: CODOS, pc: [180, 0, 85], pl: [180, 0, 85], apoyo: ['pelvis', 'tronco', 'puntaC', 'puntaL', 'manoC', 'manoL'] };
  /* la extensión se concentra en la torácica; la lumbar acompaña poco */
  const ARCO = [-0.1, 0.05, 0.35, 0.7];
  const swan = { nom: 'Swan', vista: 'perfil', poses: [
    SW0,
    /* 1 · inhala: omóplatos hacia abajo, se alarga la columna y empieza a despegar el esternón */
    X(SW0, { tr: -6, fl: -24, cur: ARCO, cab: 0, apoyo: ['pelvis', 'puntaC', 'puntaL', 'manoC', 'manoL'], s: 1, dur: 1100 }),
    /* …empuja el mat y extiende la espalda alta, cabeza en línea, pubis en el mat */
    X(SW0, { tr: -20, fl: -58, cur: ARCO, cab: -4, apoyo: ['pelvis', 'puntaC', 'puntaL', 'manoC', 'manoL'], s: 1, dur: 1500 }),
    /* 2 · exhala: baja con control */
    X(SW0, { s: 2, dur: 1800 })
  ] };
  return { 'mat1-e03': rollUp, 'mat1-e15': swan };
})();
