/* ============================================================
   Pilates Lab — Análisis MAT 2 y familias por posición
   Fuentes:
     · "Mat 2 ordenado.xlsx" (hoja Mat 2): 23 fichas de análisis, con
       series, posición, principio, objetivos, regresiones (Pre-Pilates,
       Mat 1, Mat 2), progresiones, accesorios que asisten y resisten, y
       respiración. Copia textual en fuentes/mat2-analisis.json.
     · "Resumen Todos los ejercicios.xlsx" (hojas de familias): los
       ejercicios de cada posición en Pre-Pilates, Mat 1 y Mat 2. Se
       genera en datos-familias.js (importar_familias.py).

   Como en el MAT 1: se corrigió la ortografía de los nombres sin cambiar
   el contenido. Lo que en la planilla se contradice, está corrido de
   columna o parece copiado de otra fila quedó en `revisar` y NO se usa
   para generar preguntas.
   ============================================================ */

TEMAS.mat2an   = { nom: 'Análisis MAT 2',        color: 'magenta', icono: '📗' };
TEMAS.familias = { nom: 'Familias por posición', color: 'verde',   icono: '🧩' };

(() => {
  const i = UNIDADES.findIndex(u => u.id === 'u11');
  UNIDADES.splice(i < 0 ? UNIDADES.length : i, 0,
    { id: 'u19', nom: 'Análisis MAT 2',        temas: ['mat2an'],   icono: '📗' },
    { id: 'u20', nom: 'Familias por posición', temas: ['familias'], icono: '🧩' });
})();

/* ---------- regresiones y accesorios que comparten varias fichas ---------- */
const R2 = {
  pmTablas: ['Todas las tablas y tablas laterales'],
  m1Lado: ['Serie lateral', 'Serie de 5', 'Push up'],
  pmTeaser: ['Diagonal press', 'Dead bug', 'Abdominal curl', 'Planchas', 'All four abdominals'],
  m1Teaser: ['Hundred prep', 'Hundred', 'Serie de 5', 'Roll up', 'Rolling like a ball', 'Seal', 'Open leg rocker', 'Serie lateral'],
  pmRoll: ['Cat cow', 'Abdominal curl', 'Diagonal curl', 'Standing flexion'],
  m1Roll: ['Hundred prep', 'Hundred', 'Serie de 5', 'Single leg circles', 'Roll up', 'Rolling like a ball', 'Seal', 'Open leg rocker', 'Spine stretch forward'],
  pmInv: ['Todos los de unidad interna y unidad externa', 'Puentes', 'Planchas'],
  m1Inv: ['Hundred', 'Serie de 5', 'Serie lateral', 'Push up', 'Rolling like a ball', 'Seal', 'Open leg rocker'],
  m2Inv: ['Teasers', 'Leg pull up', 'Leg pull down', 'Hip circles', 'Roll over', 'Modified corkscrew', 'Corkscrew'],
  pmSwan: ['Rocket', 'Swan'],
  progTeaser: ['Kneeling side kicks', 'Side bend twist', 'Side bend (mermaid)', 'Leg pull up', 'Leg pull down', 'Shoulder bridge', 'Boomerang']
};
const P2 = {
  teaser: {
    asiste: [['Liga abierta en la planta del pie', 'Se toma con las manos'], ['Aro', 'Se usa igual que la liga']],
    resiste: [['Bola entre los tobillos', 'Presionarla'], ['Pesas en los tobillos'], ['Aro entre tobillos o piernas', 'Presionarlo']]
  },
  lado: { asiste: [['Caja o bloque de yoga', 'Eleva la altura del apoyo de la mano']] },
  ladoBola: {
    asiste: [['Caja o bloque de yoga', 'Eleva la altura del apoyo de la mano'], ['Bola en la mano', 'Llevar el recorrido con ella']],
    resiste: [['Pesa en la mano']]
  },
  pelvis: { asiste: [['Bola o rodillo bajo la pelvis']], resiste: [['Aro, bola o banda cerrada en los tobillos']] }
};

/* ---------- las 23 fichas (bb = ejercicio del manual con animación) ---------- */
const MAT2 = [
  { id: 'n01', n: 'Kneeling side kicks', bb: 'mat2-e14', series: '6 a 8 sets', pos: 'Decúbito lateral',
    principio: 'Fuerza y equilibrio de MMSS', obj: ['Estabilidad escapular', 'Fortalecer MMII', 'Integración del tronco'],
    reg: { pm: R2.pmTablas, m1: R2.m1Lado, m2: ['Teaser', 'Leg pull up', 'Leg pull down'] },
    prog: ['Side bend twist', 'Side bend (mermaid)'], ...P2.lado, resiste: [] },

  { id: 'n02', n: 'Twist (seated twist)', bb: 'mat2-e15', series: '4 sets', pos: 'Decúbito lateral',
    principio: 'Fuerza y equilibrio de MMSS', obj: ['Estabilidad escapular', 'Fortalecer MMII', 'Integración del tronco'],
    reg: { pm: R2.pmTablas, m1: R2.m1Lado, m2: ['Teaser', 'Leg pull up', 'Leg pull down', 'Kneeling side kicks'] },
    prog: ['Side bend twist', 'Side bend (mermaid)'], ...P2.ladoBola,
    nota: 'Es el Twist del manual de Mat 2 (en plancha lateral), no el Seated Twist de Pre-Pilates.' },

  { id: 'n03', n: 'Side bend (mermaid)', bb: 'mat2-e17', series: '4 a 6 sets', pos: 'Decúbito lateral',
    principio: 'Fuerza y equilibrio de MMSS', obj: ['Fortalecer el tronco lateral', 'Flexión lateral'],
    reg: { pm: ['Todas las planchas laterales'], m1: ['Serie lateral', 'Push up'], m2: ['Twist (seated twist)', 'Side bend twist'] },
    prog: ['Boomerang'], ...P2.ladoBola,
    revisar: ['En las regresiones Mat 2 figura también "seated bend mermaid", que parece el mismo ejercicio.'] },

  { id: 'n04', n: 'Leg pull down', bb: 'mat2-e11', series: '4 a 6 reps', pos: 'Planchas',
    principio: 'Fuerza y equilibrio de MMSS', obj: ['Fortalecimiento de todo el cuerpo'], resp: 'Sniff breath',
    reg: { pm: [], m1: [], m2: [] }, prog: [],
    asiste: [['Caja o bloque de yoga', 'Eleva la altura del apoyo de las manos']],
    resiste: [['Bola bajo el pie de apoyo'], ['Liga cerrada en los tobillos']],
    revisar: ['En regresiones solo figura "Cajón" (es un accesorio) y en progresiones "Liga, poner un balón… debe explicar": falta completarlas.'] },

  { id: 'n05', n: 'Leg pull up', bb: 'mat2-e12', series: '4 a 6 reps', pos: 'Planchas',
    principio: 'Fuerza y equilibrio de MMSS', obj: ['Fortalecimiento de todo el cuerpo'],
    reg: { pm: ['Todas las planchas: frontal, lateral y posterior', 'Puentes'], m1: ['Push up', 'Serie lateral', 'Serie de 5'], m2: ['Leg pull down'] },
    prog: ['Shoulder bridge', 'Kneeling side kicks', 'Twist (seated twist)', 'Side bend twist', 'Side bend (mermaid)', 'Boomerang'],
    asiste: [['Bola o rodillo en la espalda', 'Si no logra subir la espalda del todo']],
    resiste: [['Rodillo en los tobillos'], ['Bola bajo el tobillo', 'Presionarla con el tobillo'], ['Liga cerrada en los tobillos']] },

  { id: 'n06', n: 'Swan dive', bb: 'mat2-e22', series: '3 a 6 reps', pos: 'Prono',
    principio: 'Integración del tronco', obj: ['Movilidad de columna en extensión axial', 'MMSS'],
    reg: { pm: R2.pmSwan, m1: ['Swan'], m2: ['Leg pull up'] }, prog: ['Swan rocking'],
    asiste: [['Liga cerrada en las muñecas'], ['Aro entre las manos', 'Presionarlo']],
    resiste: [['Bola bajo las palmas', 'Presionarla y rodarla entre las palmas y el suelo']] },

  { id: 'n07', n: 'Swan rocking', bb: 'mat2-e22', series: '3 a 6 reps', pos: 'Prono',
    principio: 'Integración del tronco', obj: ['Movilidad de columna en extensión axial', 'MMSS'],
    reg: { pm: R2.pmSwan, m1: ['Swan'], m2: ['Leg pull up'] }, prog: ['Rocking'],
    asiste: [['Bola bajo el abdomen o la pelvis'], ['Foam roller']],
    resiste: [['Banda elástica en las piernas o aro mágico']] },

  { id: 'n08', n: 'Rocking', bb: 'mat2-e23', series: '4 a 6 reps', pos: 'Prono',
    principio: 'Integración del tronco', obj: ['Movilidad de columna en extensión axial', 'MMSS'],
    reg: { pm: R2.pmSwan, m1: ['Double leg kicks'], m2: ['Leg pull up', 'Swan dive', 'Swan rocking'] }, prog: [],
    asiste: [['Aro', 'Para estirar']], resiste: [] },

  { id: 'n09', n: 'Spine twist', bb: 'mat2-e01', series: '4 a 8 sets', pos: 'Sedente',
    principio: 'Integración del tronco', obj: ['Movilidad de columna: rotación y fortalecimiento de la columna'], resp: 'Sniff breath',
    reg: { pm: ['Standing lateral flexion', 'Standing full body rotation', 'Tail wag', 'Angels in the snow', 'Pinwheel', 'Arm raises (juntos y alternados)', 'Seated side stretch', 'Seated twist'],
           m1: ['Spine stretch forward', 'Spine stretch side', 'Saw'], m2: [] },
    prog: ['Side bend twist', 'Twist (seated twist)', 'Side bend (mermaid)'],
    asiste: [['Liga abierta cruzada por los glúteos'], ['Liga cerrada en los tobillos y liga abierta en las manos', 'Para hacer los pulsos de la respiración'],
             ['Rodillo y bloque de yoga para sentarse encima', 'Si hay acortamiento de isquiotibiales']],
    resiste: [['Pesas'], ['Rodillo vertical bajo las nalgas']],
    nota: 'El Seated Twist de Pre-Pilates no tiene sniff breath.' },

  { id: 'n10', n: 'Teaser preparation (bent knee, single leg)', bb: 'mat2-e02', series: '3 a 6 reps', pos: 'Supino',
    principio: 'Integración del tronco', obj: ['Fortalecer abdominales', 'Estabilidad lumbopélvica', 'Flexión de cadera'],
    reg: { pm: R2.pmTeaser, m1: R2.m1Teaser, m2: [] },
    prog: ['Teaser 1 (roll down)', 'Teaser 2 (leg lowers)', 'Teaser 3 (arms and legs together)', 'Hip circles (3 planos de movimiento)', 'Kneeling side kicks'],
    ...P2.teaser },

  { id: 'n11', n: 'Teaser 1 (roll down)', bb: 'mat2-e03', series: '3 a 6 reps', pos: 'Supino',
    principio: 'Integración del tronco', obj: ['Fortalecer abdominales', 'Estabilidad lumbopélvica', 'Flexión de cadera'],
    reg: { pm: R2.pmTeaser, m1: R2.m1Teaser, m2: ['Hip circles', 'Teaser preparation'] },
    prog: ['Teaser 2 (leg lowers)', 'Teaser 3 (arms and legs together)', ...R2.progTeaser], ...P2.teaser },

  { id: 'n12', n: 'Teaser 2 (leg lowers)', bb: 'mat2-e04', series: '3 a 6 reps', pos: 'Supino',
    principio: 'Integración del tronco', obj: ['Fortalecer abdominales', 'Estabilidad lumbopélvica', 'Flexión de cadera'],
    reg: { pm: R2.pmTeaser, m1: R2.m1Teaser, m2: ['Hip circles', 'Teaser preparation', 'Teaser 1 (roll down)'] },
    prog: ['Teaser 3 (arms and legs together)', ...R2.progTeaser], ...P2.teaser },

  { id: 'n13', n: 'Teaser 3 (arms and legs together)', bb: 'mat2-e05', series: '3 a 6 reps', pos: 'Supino',
    principio: 'Integración del tronco', obj: ['Fortalecer abdominales', 'Estabilidad lumbopélvica', 'Flexión de cadera'],
    reg: { pm: R2.pmTeaser, m1: R2.m1Teaser, m2: ['Hip circles', 'Teaser preparation', 'Teaser 1 (roll down)', 'Teaser 2 (leg lowers)'] },
    prog: R2.progTeaser, ...P2.teaser },

  { id: 'n14', n: 'Hip circles', bb: 'mat2-e06', series: '3 a 6 reps', pos: 'Supino',
    principio: 'Integración del tronco', obj: ['Fortalecer abdominales', 'Flexión de cadera', 'Estabilidad lumbopélvica'],
    reg: { pm: R2.pmTeaser, m1: ['Hundred prep', 'Hundred', 'Single leg circles', 'Serie de 5', 'Roll up', 'Serie lateral', 'Rolling like a ball', 'Seal', 'Open leg rocker'], m2: ['Teasers'] },
    prog: [],
    asiste: [['Rodillo o balón en la espalda'], ['Bola en los tobillos']],
    resiste: [['Bola o aro entre los tobillos', 'Presionarlos'], ['Pesas en los tobillos']],
    revisar: ['Las columnas de esta fila parecen corridas: en "Progresiones" hay accesorios. Se muestran como asiste y resiste, sin preguntar.',
              'En la planilla figura en supino; el manual lo describe sentado en V con las manos atrás.'] },

  { id: 'n15', n: 'Roll over', bb: 'mat2-e07', series: '3 en cada sentido', pos: 'Supino',
    principio: 'Integración del tronco', obj: ['Fortalecimiento del abdomen', 'Movilidad de columna: flexión, inversión y regreso'],
    reg: { pm: R2.pmRoll, m1: R2.m1Roll, m2: ['Teasers', 'Hip circles'] },
    prog: ['Modified corkscrew', 'Corkscrew', 'Jackknife', 'Scissors', 'Bicycle', 'Boomerang'],
    asiste: [['Bola, rodillo o aro detrás de la espalda']], resiste: [['Liga cerrada entre las piernas', 'Abrirla']] },

  { id: 'n16', n: 'Modified corkscrew', bb: 'mat2-e08', series: '3 a 6 reps', pos: 'Supino',
    principio: 'Integración del tronco', obj: ['Control abdominal', 'Estabilidad lumbopélvica', 'Movilidad de columna'],
    reg: { pm: R2.pmRoll, m1: R2.m1Roll, m2: ['Teasers', 'Hip circles'] },
    prog: ['Corkscrew', 'Jackknife', 'Scissors', 'Bicycle', 'Boomerang'],
    asiste: [['Bola o aro en los tobillos']], resiste: [['Pesas en los tobillos', 'Asisten y resisten']] },

  { id: 'n17', n: 'Corkscrew', bb: 'mat2-e09', series: '3 a 4 reps', pos: 'Supino',
    principio: 'Integración del tronco', obj: ['Movilidad de columna: rotación', 'Control abdominal', 'Estabilidad escapular'],
    reg: { pm: ['Puentes', 'Abdominal curl', 'Oblique abdominals', 'Tail wag', 'Pinwheel', 'Telescope arms', 'Planchas laterales', '4 puntos', 'Standing flexion', 'Standing full body rotation'],
           m1: ['Roll up', 'Serie de 5', 'Side leg bananas', 'Rolling like a ball', 'Seal', 'Open leg rocker', 'Spine stretch forward', 'Saw'],
           m2: ['Roll over', 'Hip circles', 'Modified corkscrew'] },
    prog: ['Jackknife', 'Scissors', 'Bicycle', 'Boomerang'],
    asiste: [['Bola o aro entre las piernas', 'Presionarlos']], resiste: [['Pesas en los tobillos']],
    revisar: ['Entre las regresiones Mat 1 figuran los Teaser y el Spine twist, que son de Mat 2.'] },

  { id: 'n18', n: 'Neck pull', bb: 'mat2-e10', series: '3 a 6 reps', pos: 'Supino',
    principio: 'Integración del tronco', obj: ['Fortalecer los abdominales', 'Movilidad de columna: flexión y extensión'],
    reg: { pm: [], m1: [], m2: [] }, prog: [],
    asiste: [['Balón entre los talones', 'Presionarlo'], ['Pesas en los tobillos'], ['Liga cerrada', 'Abrirla']], resiste: [],
    revisar: ['Regresiones y progresiones son idénticas a las del Corkscrew: parecen copiadas de esa fila.', 'Las pesas y la liga figuran como accesorios que asisten.'] },

  { id: 'n19', n: 'Jackknife', bb: 'mat2-e13', series: '3 a 4 reps', pos: 'Supino',
    principio: 'Integración del tronco', obj: ['Fortalecer abdominales', 'Estabilizar las escápulas', 'Flexión dinámica de columna en inversión'],
    reg: { pm: R2.pmInv, m1: R2.m1Inv, m2: R2.m2Inv }, prog: ['Scissors', 'Bicycle', 'Boomerang'], ...P2.pelvis },

  { id: 'n20', n: 'Scissors', bb: 'mat2-e18', series: '4 a 6 reps', pos: 'Supino',
    principio: 'Integración del tronco', obj: ['Unidad interna y externa, movilidad de columna', 'Fuerza y potencia'],
    reg: { pm: R2.pmInv, m1: R2.m1Inv, m2: R2.m2Inv }, prog: ['Bicycle', 'Boomerang'],
    asiste: [['Caja, cojín o soporte bajo la pelvis'], ['Liga abierta para los pies']],
    resiste: [['Banda elástica en las plantas de los pies', 'Con los extremos en las manos'], ['Aro mágico']],
    revisar: ['En el objetivo dice "Fuerza y potencia MMSS"; en Scissors trabajan sobre todo los miembros inferiores.'] },

  { id: 'n21', n: 'Bicycle', bb: 'mat2-e19', series: '4 a 6 sets', pos: 'Supino',
    principio: 'Integración del tronco', obj: ['Unidad interna y externa, movilidad de columna', 'Fuerza y potencia'],
    reg: { pm: R2.pmInv, m1: R2.m1Inv, m2: R2.m2Inv }, prog: ['Boomerang'], ...P2.pelvis },

  { id: 'n22', n: 'Shoulder bridge', bb: 'mat2-e20', series: '3 a 4 sets', pos: 'Supino',
    principio: 'Integración del tronco', obj: ['Estabilidad lumbopélvica', 'Estabilidad escapular'],
    reg: { pm: ['Todos los puentes'], m1: [], m2: ['Leg pull up', 'Leg pull down'] }, prog: ['Boomerang'],
    asiste: [['Caja bajo los pies'], ['Balón pequeño entre los muslos'], ['Soporte bajo la pelvis']],
    resiste: [['Aro entre los muslos'], ['Banda elástica sobre los muslos']],
    nota: 'En la planilla las series dicen "4-4 sets"; el manual indica 3 a 4.' },

  { id: 'n23', n: 'Boomerang', bb: 'mat2-e21', series: '4 reps', pos: 'Sedente',
    principio: 'Movimiento global', obj: ['Integración del tronco', 'MMSS', 'MMII'],
    reg: { pm: ['Integración del tronco, MMSS y MMII'], m1: ['Roll up', 'Rolling like a ball', 'Open leg rocker', 'Seal'],
           m2: ['Roll over', 'Teaser', 'Jackknife', 'Scissors', 'Bicycle', 'Todas las inversiones'] },
    prog: [], asiste: [], resiste: [['Aro en los tobillos'], ['Bola en los tobillos']] }
];

/* ============================================================
   NOMBRES → FICHAS (para mostrar foto o animación de cada ejercicio)
   ============================================================ */
const EJ_REF = (() => {
  const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\(.*?\)/g, ' ').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
  const bb = {
    'hundred prep': 'mat1-e01', 'the hundred preparation': 'mat1-e01', 'hundred': 'mat1-e02', 'roll up': 'mat1-e03', 'the roll up': 'mat1-e03',
    'single leg circles': 'mat1-e04', 'single leg circle': 'mat1-e04', 'rolling like a ball': 'mat1-e05', 'single leg stretch': 'mat1-e06',
    'double leg stretch': 'mat1-e07', 'single straight leg stretch': 'mat1-e08', 'double straight leg stretch': 'mat1-e09',
    'criss cross': 'mat1-e10', 'spine stretch forward': 'mat1-e11', 'spine stretch side': 'mat1-e12', 'saw': 'mat1-e13',
    'open leg rocker': 'mat1-e14', 'single leg kicks': 'mat1-e16', 'double leg kicks': 'mat1-e17',
    'side leg lifts': 'mat1-e19', 'side leg lift': 'mat1-e19', 'side leg circles': 'mat1-e20', 'side leg kicks': 'mat1-e21',
    'side leg bicycle': 'mat1-e22', 'side leg bananas': 'mat1-e23', 'seal': 'mat1-e24', 'push up': 'mat1-e25', 'push ups': 'mat1-e25',
    'spine twist': 'mat2-e01', 'teaser preparation': 'mat2-e02', 'teaser prep': 'mat2-e02', 'teaser 1': 'mat2-e03', 'teaser': 'mat2-e03',
    'teaser 2': 'mat2-e04', 'teaser 3': 'mat2-e05', 'hip circles': 'mat2-e06', 'roll over': 'mat2-e07',
    'modified corkscrew': 'mat2-e08', 'corkscrew': 'mat2-e09', 'neck pull': 'mat2-e10', 'leg pull down': 'mat2-e11',
    'leg pull up': 'mat2-e12', 'jackknife': 'mat2-e13', 'kneeling side kicks': 'mat2-e14', 'twist': 'mat2-e15',
    'side bend twist': 'mat2-e16', 'side bend': 'mat2-e17', 'side bend mermaid': 'mat2-e17', 'scissors': 'mat2-e18',
    'shoulder bridge': 'mat2-e20', 'boomerang': 'mat2-e21', 'swan dive': 'mat2-e22', 'swan rocking': 'mat2-e22', 'rocking': 'mat2-e23'
  };
  /* nombres que cambian de ejercicio según el libro */
  const porLibro = { mat1: { swan: 'mat1-e15', swimming: 'mat1-e18', bicycle: 'mat1-e10' }, mat2: { bicycle: 'mat2-e19', 'seated twist': 'mat2-e15' } };
  const pm = new Map();
  const alias = { 'diagonal curl': 'Oblique Abdominals', 'deagonal press': 'Diagonal Press', 'arm raises': 'Arm Raises (juntos y alternados)',
    'angels in the snow': 'Angels in the Snow', 'telescope arms': 'Telescope Arms', 'pinwheel': 'Pinwheel',
    'tabla de espalda con pierna estirada': 'Tabla espalda pierna estirada' };
  (typeof PREMAT !== 'undefined' ? PREMAT : []).forEach(e => { pm.set(norm(e.n), e.id); if (e.orig) pm.set(norm(e.orig), e.id); });
  /* libro: 'pre' | 'mat1' | 'mat2' | '' (sin libro: primero el manual, después Pre-Pilates) */
  return (nombre, libro = '') => {
    const k = norm(nombre);
    if (!k) return null;
    if (libro !== 'pre') {
      const id = (porLibro[libro] || {})[k] || bb[k];
      if (id) return { bb: id };
    }
    if (libro !== 'mat1' && libro !== 'mat2') {
      const id = pm.get(k) || (alias[k] && pm.get(norm(alias[k])));
      if (id) return { pm: id };
    }
    if (!libro && (k === 'swan' || k === 'swimming')) return { bb: porLibro.mat1[k] };
    return null;
  };
})();

/* familias con su ficha resuelta */
const FAMILIA_POS = ['Supino', 'Decúbito lateral', 'Prono', '4 puntos', 'Planchas', 'Sedente', 'Bípedo'];
const NOM_LIBRO = { pre: 'Pre-Pilates', mat1: 'Mat 1', mat2: 'Mat 2' };
FAMILIAS.forEach(f => { f.ref = EJ_REF(f.n, f.libro); });

/* ============================================================
   EJERCICIOS DE PRÁCTICA
   ============================================================ */
(() => {
  const norm = s => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim();
  const ficha = id => MAT2.find(m => m.id === id);
  const ok = MAT2.filter(m => !m.revisar);

  /* --- ¿en qué familia (posición) está? (Hip circles queda afuera: el manual lo hace sentado) --- */
  const porPos = {};
  MAT2.filter(m => m.id !== 'n14').forEach(m => (porPos[m.pos] = porPos[m.pos] || []).push(m.n));
  CLASIFICACIONES.push(
    { id: 'c2-pos', tema: 'mat2an', q: 'MAT 2: ¿en qué familia de posición lo ubicaste?', grupos: porPos,
      tambien: { 'Leg pull down': ['Prono'], 'Leg pull up': ['Prono'] },
      porque: 'En tu planilla, las familias agrupan los ejercicios por la posición de partida. Kneeling side kicks y el Twist van con el decúbito lateral; los Leg pull, con las planchas.' });

  /* --- asiste o resiste --- */
  [['n02'], ['n05'], ['n06'], ['n07'], ['n09'], ['n10', 'n11', 'n12', 'n13'], ['n15'], ['n17'], ['n20'], ['n21', 'n19'], ['n22']].forEach(ids => {
    const m = ficha(ids[0]);
    if (m.revisar || !m.asiste.length || !m.resiste.length) return;
    const titulo = ids.length > 2 ? 'Teaser (prep, 1, 2 y 3)' : ids.map(i => ficha(i).n).join(' / ');
    CLASIFICACIONES.push({
      id: 'c2-' + ids[0], tema: 'mat2an', q: `${titulo}: ¿el accesorio asiste o resiste?`,
      grupos: { Asiste: m.asiste.map(p => p[0]), Resiste: m.resiste.map(p => p[0]) },
      porque: 'Asiste lo que facilita lograr o controlar el movimiento (un apoyo, una liga que ayuda a subir); resiste lo que agrega carga o inestabilidad.'
    });
  });

  /* --- progresiones encadenadas (las de tu planilla) --- */
  SECUENCIAS.push(
    { id: 's2-teaser', tema: 'mat2an', q: 'MAT 2: ordená la familia del Teaser, de la más fácil a la más difícil',
      pasos: ['Teaser preparation', 'Teaser 1 (roll down)', 'Teaser 2 (leg lowers)', 'Teaser 3 (arms and legs together)'],
      porque: 'Cada ficha lista como regresión los Teaser anteriores y como progresión los siguientes.' },
    { id: 's2-inv', tema: 'mat2an', q: 'MAT 2: ordená la progresión de las inversiones que propusiste desde el Roll over',
      pasos: ['Roll over', 'Modified corkscrew', 'Corkscrew', 'Jackknife', 'Scissors', 'Bicycle', 'Boomerang'],
      porque: 'Es la lista de progresiones del Roll over; cada ficha siguiente repite la cadena desde su lugar.' },
    { id: 's2-swan', tema: 'mat2an', q: 'MAT 2: ordená la familia prona', pasos: ['Swan dive', 'Swan rocking', 'Rocking'],
      porque: 'Swan dive progresa a Swan rocking, y este a Rocking.' },
    { id: 's2-lp', tema: 'mat2an', q: 'MAT 2: ¿qué Leg pull va primero?', pasos: ['Leg pull down', 'Leg pull up'],
      porque: 'El Leg pull down figura entre las regresiones del Leg pull up.' }
  );

  /* --- series --- */
  PARES.push({ id: 'p2-series', tema: 'mat2an', q: 'Uní cada ejercicio del MAT 2 con sus series', dinamico: 'mat2series' });

  /* --- tarjetas --- */
  CARDS.push(
    { id: 'c2-sniff', tema: 'mat2an', tipo: 'lista', q: 'En tu análisis MAT 2, ¿qué ejercicios llevan sniff breath?',
      a: ['Leg pull down', 'Spine twist'], dist: ['Shoulder bridge', 'Roll over', 'Hip circles', 'Jackknife'],
      porque: 'El sniff breath (respiración percusiva, en pulsos) acompaña los dos pulsos de la pierna en el Leg pull down y los de la rotación en el Spine twist.' },
    { id: 'c2-st-pre', tema: 'mat2an', tipo: 'lista', q: 'Regresiones Pre-Pilates del Spine twist (en tu planilla)',
      a: ficha('n09').reg.pm, dist: ['Squats', 'Toe taps', 'Marching supine', 'Low back bridge'], noDonar: true,
      porque: 'Son ejercicios de rotación, flexión lateral y movilidad escapular: preparan la rotación sentada.' },
    { id: 'c2-st-m1', tema: 'mat2an', tipo: 'lista', q: 'Regresiones Mat 1 del Spine twist',
      a: ['Spine stretch forward', 'Spine stretch side', 'Saw'], dist: ['Swan', 'Hundred', 'Single leg kicks'], noDonar: true },
    { id: 'c2-teaser-pre', tema: 'mat2an', tipo: 'lista', q: 'Regresiones Pre-Pilates de los Teaser',
      a: R2.pmTeaser, dist: ['Rocket', 'Standing extension', 'Squats', 'Seated side stretch'], noDonar: true,
      porque: 'Unidad interna, unidad externa y movilidad de columna en flexión: lo que pide subir a la V.' },
    { id: 'c2-roll-pre', tema: 'mat2an', tipo: 'lista', q: 'Regresiones Pre-Pilates del Roll over y el Modified corkscrew',
      a: R2.pmRoll, dist: ['Rocket', 'Standing extension', 'Squats', 'Marching standing'], noDonar: true },
    { id: 'c2-obj-jack', tema: 'mat2an', tipo: 'lista', q: 'Objetivos del Jackknife',
      a: ficha('n19').obj, dist: ['Extensión de columna', 'Flexión lateral de columna', 'Estirar cuádriceps'] },
    { id: 'c2-obj-cork', tema: 'mat2an', tipo: 'lista', q: 'Objetivos del Corkscrew',
      a: ficha('n17').obj, dist: ['Extensión de columna', 'Flexión lateral de columna', 'Fuerza de cuádriceps'] },
    { id: 'c2-obj-sb', tema: 'mat2an', tipo: 'lista', q: 'Objetivos del Shoulder bridge',
      a: ficha('n22').obj, dist: ['Movilidad de columna en rotación', 'Flexión lateral', 'Estirar isquiotibiales'] },
    { id: 'c2-boom', tema: 'mat2an', tipo: 'simple', q: '¿Qué principio del movimiento le asignaste al Boomerang?',
      a: ['Movimiento global'], dist: ['Integración del tronco', 'Fuerza y potencia de MMII', 'Fuerza y equilibrio de MMSS'],
      porque: 'Es el último del Mat 2 y reúne todo: tronco, brazos y piernas (roll over, teaser y circunducción de brazos).' },
    { id: 'c2-twist', tema: 'mat2an', tipo: 'simple', q: 'El "Seated twist" de tu análisis MAT 2, ¿qué ejercicio es?',
      a: ['El Twist del manual: sentado sobre una cadera sube a la plancha lateral y rota'],
      op: 'El Twist: de sentado de costado a plancha lateral con rotación',
      dist: ['El Seated Twist de Pre-Pilates: sentado, rota el tronco', 'El Spine twist: sentado con piernas al frente, rota con pulsos', 'El Saw: rota y flexiona hacia el pie contrario'],
      porque: 'Comparte nombre con el Seated Twist de Pre-Pilates, pero en Mat 2 es el Twist, de la familia lateral (con Kneeling side kicks y Side bend).' }
  );
  CLOZES.push(
    { id: 'z2-1', tema: 'mat2an', t: 'En el Spine twist, sentarse sobre un [rodillo] o un bloque de yoga asiste si hay acortamiento de [isquiotibiales].',
      dist: [['aro', 'bola'], ['cuádriceps', 'aductores']] },
    { id: 'z2-2', tema: 'mat2an', t: 'En el Modified corkscrew, las pesas en los tobillos [asisten] y [resisten].', dist: ['estiran', 'relajan'] },
    { id: 'z2-3', tema: 'mat2an', t: 'En el Leg pull up, una bola o un rodillo en la [espalda] asiste si no logra subir la espalda del todo.',
      dist: ['nuca', 'muñeca', 'rodilla'] }
  );

  /* ============================================================
     FAMILIAS POR POSICIÓN
     ============================================================ */
  const enLibros = {};
  FAMILIAS.forEach(f => { const k = norm(f.n); (enLibros[k] = enLibros[k] || new Set()).add(f.libro); });
  /* ¿de qué libro es? — por familia; afuera los que comparten nombre en dos libros (Swan, Swimming) */
  FAMILIA_POS.forEach((pos, i) => {
    const xs = FAMILIAS.filter(f => f.pos === pos && enLibros[norm(f.n)].size === 1);
    const grupos = {};
    xs.forEach(f => { const g = NOM_LIBRO[f.libro]; if (!(grupos[g] || []).includes(f.n)) (grupos[g] = grupos[g] || []).push(f.n); });
    if (Object.keys(grupos).length >= 2)
      CLASIFICACIONES.push({ id: 'cf-libro' + i, tema: 'familias', q: `Familia ${pos.toLowerCase()}: ¿de qué libro es cada ejercicio?`, grupos,
        porque: 'Cada familia arranca en Pre-Pilates (preparación), sigue en Mat 1 y termina en Mat 2: así se arman regresiones y progresiones dentro de la misma posición.' });
  });
  /* ¿a qué familia pertenece? (Mat 1 y Mat 2) */
  const famMat = libro => {
    const g = {};
    FAMILIAS.filter(f => f.libro === libro && enLibros[norm(f.n)].size === 1).forEach(f => {
      const enVarias = FAMILIAS.filter(o => norm(o.n) === norm(f.n)).map(o => o.pos);
      if (new Set(enVarias).size > 1) return;           // Leg pull: en prono y en planchas
      if (f.n === 'Hip circles') return;                 // tu planilla lo ubica en supino; el manual, sentado
      if (!(g[f.pos] || []).includes(f.n)) (g[f.pos] = g[f.pos] || []).push(f.n);
    });
    return g;
  };
  CLASIFICACIONES.push(
    { id: 'cf-fam1', tema: 'familias', q: 'Mat 1: ¿en qué familia de posición está?', grupos: famMat('mat1') },
    { id: 'cf-fam2', tema: 'familias', q: 'Mat 2: ¿en qué familia de posición está?', grupos: famMat('mat2') }
  );
  /* las familias, de la preparación al ejercicio más avanzado */
  SECUENCIAS.push(
    { id: 'sf-prono', tema: 'familias', q: 'Familia prona: ordená de Pre-Pilates a Mat 2', pasos: ['Mini swan', 'Swan (Mat 1)', 'Swan dive', 'Rocking'],
      porque: 'Mini swan prepara la extensión; el Swan de Mat 1 la lleva más lejos; Swan dive y Rocking agregan el balanceo.' },
    { id: 'sf-sed', tema: 'familias', q: 'Familia sedente: ordená de Pre-Pilates a Mat 2', pasos: ['Seated twist (Pre-Pilates)', 'Saw', 'Spine twist'],
      porque: 'La rotación sentada empieza simple en Pre-Pilates, suma flexión en el Saw y pulsos con piernas largas en el Spine twist.' },
    { id: 'sf-lado', tema: 'familias', q: 'Familia lateral: ordená de Pre-Pilates a Mat 2', pasos: ['Prep tabla lateral', 'Side leg lifts', 'Kneeling side kicks', 'Side bend (mermaid)'],
      porque: 'De la preparación de la plancha lateral a la serie lateral acostada, luego de rodillas y por último en plancha lateral completa.' }
  );
  CARDS.push(
    { id: 'cf-1', tema: 'familias', tipo: 'simple', q: '¿Qué agrupa una "familia" en tu resumen de ejercicios?',
      a: ['Los ejercicios que comparten posición de partida, de Pre-Pilates a Mat 2'],
      op: 'Ejercicios con la misma posición de partida, de Pre-Pilates a Mat 2',
      dist: ['Ejercicios con el mismo principio del movimiento', 'Ejercicios que usan el mismo accesorio', 'Ejercicios con la misma cantidad de series'],
      porque: 'Dentro de una familia, lo de Pre-Pilates suele ser la regresión de lo de Mat 1, y lo de Mat 1, de lo de Mat 2.' },
    { id: 'cf-2', tema: 'familias', tipo: 'lista', q: 'Familia de planchas: ¿qué ejercicios de Mat están en ella?',
      a: ['Push up', 'Leg pull down', 'Leg pull up'], dist: ['Swan dive', 'Spine twist', 'Corkscrew', 'Seal'], noDonar: true }
  );
})();
