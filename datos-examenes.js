/* ============================================================
   AnatoApp — tus exámenes previos de Balanced Body

   Fuente: las revisiones de los exámenes que se rindieron en la
   formación (transcripción completa en fuentes/examenes-previos.md):
     · Principios del Movimiento (20/12/2025) 35/37
     · Mat 1 (10/2/2026)  77/96
     · Mat 2 (21/3/2026)  62/116
     · Mat 3 (1/5/2026)   30/77

   Qué se hizo con las preguntas:
     · Las de opción múltiple se reescribieron con los criterios de la
       app: la correcta no se delata por el largo, los distractores
       cambian un dato y nunca son algo anatómicamente cierto.
     · "Todas las anteriores", "A y B" y "Ninguna" no sobreviven a
       mezclar las opciones: esas preguntas pasaron a "seleccioná las
       correctas" (o a emparejar), que obliga a reconocer cada parte.
     · Las de respuesta abierta pasaron a listas, clasificaciones,
       emparejar y ordenar, con lo que la corrección aceptó.
     · Lo que la corrección no dejó claro (la grilla de la bola de
       Mat 3, el tercer ejercicio escapular de Mat 2) NO se pregunta:
       queda en la revisión como pendiente de confirmar.
   Las falladas van primero: son las que la lección presenta antes.
   ============================================================ */
'use strict';

const EXAMENES = [
  { id: 'pm', nom: 'Principios del Movimiento', fecha: '20/12/2025', pts: 35, de: 37, tiempo: '32:22' },
  { id: 'mat1', nom: 'Mat 1', fecha: '10/2/2026', pts: 77, de: 96, tiempo: '85:23' },
  { id: 'mat2', nom: 'Mat 2', fecha: '21/3/2026', pts: 62, de: 116, tiempo: '85:42' },
  { id: 'mat3', nom: 'Mat 3 (accesorios)', fecha: '1/5/2026', pts: 30, de: 77, tiempo: '83:29' }
];
const EXAMEN = Object.fromEntries(EXAMENES.map(e => [e.id, e]));

/* Lo que marcó la corrección, en forma de reglas para la próxima vez. */
const LECCIONES_EXAMEN = [
  { ico: '☑️', t: 'Si cada opción es cierta, la respuesta es "Todas las anteriores".', de: 'Principios · la unidad interna reacciona de forma refleja, consciente y al impulsar el cuerpo: elegiste solo la refleja.' },
  { ico: '🔎', t: 'En las preguntas con "excepto", buscá lo que pertenece a OTRO principio.', de: 'Principios · la integración de la unidad interna y externa es del tronco, no del tren inferior.' },
  { ico: '🦵', t: 'Tren inferior y tren superior piden ejercicios distintos: no repitas la respuesta.', de: 'Mat 1 · para el tren inferior pusiste Plank, Push ups y Swan (tren superior): 1 de 4.' },
  { ico: '🔢', t: 'En una clase, repeticiones exactas: "6", no "4 a 8".', de: 'Mat 1 y Mat 2 · "Indicar # de repeticiones específicas, no un rango".' },
  { ico: '🔀', t: 'Pensá cómo pasa el cuerpo de un ejercicio al siguiente.', de: 'Mat 1 · "¿Cómo transicionás de 8 a 9?" (de Saw, sentado, a Swan, prono): pasar de medio lado a prono.' },
  { ico: '🌊', t: 'Clase balanceada y fluida: seguí el orden de posiciones del manual (de pie, cuatro apoyos, supino, sentado, prono, plancha, costado, cierre).', de: 'Mat 2 · 0 de 50, "más balanceada y fluida": después de la serie de prono volvías a supino con Teaser, Roll over y Shoulder bridge.' },
  { ico: '⭕', t: 'Con accesorios, decí siempre DÓNDE va el aro, la bola o la banda.', de: 'Mat 3 · "¿Aro adónde?": 0 de 3 en tres principios.' },
  { ico: '📚', t: 'Solo ejercicios del curso.', de: 'Mat 3 · "Control balance no lo vimos en este curso".' },
  { ico: '🦴', t: 'Cuello: Roll over, Neck pull… y también Boomerang.', de: 'Mat 2 · marcaste Roll over y Neck pull; faltó Boomerang.' },
  { ico: '🪚', t: 'Seated twist prepara para el Saw; ojo con el principio del movimiento.', de: 'Mat 2 · 4 de 5 en la programación del Seated twist.' }
];

/* Las preguntas falladas o con puntaje parcial, para la revisión. */
const REVISION_EXAMEN = [
  { ex: 'pm', n: 11, pts: '0/1', q: 'En un cuerpo sano, la unidad interna reacciona…',
    tu: 'Reflexivamente, ante los cambios posturales y la carga', ok: 'Todas las anteriores (refleja, consciente y al impulsar el cuerpo)', item: 'exq-pm11' },
  { ex: 'pm', n: 20, pts: '0/1', q: 'Protocolos del tren inferior: todo lo siguiente, excepto…',
    tu: 'Agilidad, equilibrio y coordinación', ok: 'Integración de la unidad interna y externa (es del tronco)', item: 'exq-pm20' },
  { ex: 'mat1', pts: '1/4', q: 'Principio Respiración: 1 Pre-Pilates y 3 de Mat 1',
    tu: 'Respiración diafragmática · Hundred, Roll up, Spine stretch forward', ok: 'Solo aceptaron el Hundred', com: 'Hundred sí', item: 'exm-resp' },
  { ex: 'mat1', pts: '1/4', q: 'Principio Fuerza y balance del cuerpo inferior',
    tu: 'Plank · Push ups, Swan, Double leg kicks (apertura de pecho)', ok: 'Ejercicios del tren inferior (ver la lista de la app)', com: 'Plank no, ni Push ups ni Swan. Si esa es la razón de Double leg kicks, no', item: 'exm-inf' },
  { ex: 'mat1', pts: '17/30', q: 'Clase corta de 15 ejercicios de Mat, en orden y con repeticiones',
    tu: 'Rangos de repeticiones (3–6, 4–8…) y de Saw (sentado) a Swan (prono) sin transición', ok: 'Números exactos y transiciones pensadas',
    com: '3 antes que 2 y 6 después de 3. ¿Cómo transicionás de 8 a 9? Pasar de medio lado a prono. Indicar # de repeticiones específicas, no un rango', clase: true },
  { ex: 'mat2', pts: '4/5', q: 'Programación para el Seated twist (principio + 2 Pre-Pilates + 2 de Mat)',
    tu: 'Movilidad espinal e integración del tronco · Torsión sentado, Abdominales oblicuos · Saw, Criss cross', ok: 'Seated twist prepara para el Saw', com: 'Seated twist prepara para Saw y ojo con el PM' },
  { ex: 'mat2', pts: '4/6', q: 'Precaución con lesión cervical',
    tu: 'Rollover y Neck pull', ok: 'Rollover, Neck pull y Boomerang', com: 'Boomerang también', item: 'exm-cerv' },
  { ex: 'mat2', pts: '2/3', q: '3 ejercicios de Mat 2 que aumenten la estabilidad escapular',
    tu: 'Leg pull down, Leg pull up, Side bend', ok: 'Leg pull down y Leg pull up; Side bend quedó en duda', com: 'Side bend?', item: 'exm-escap' },
  { ex: 'mat2', pts: '0/50', q: 'Clase de una hora con 20 a 25 ejercicios de Mat 1 y 2',
    tu: 'Serie de prono (Swan, kicks, Swimming) y después otra vez supino (Teaser, Roll over, Shoulder bridge); repeticiones en rango', ok: 'Secuencia balanceada y fluida',
    com: 'Reorganizar la secuencia de la clase para que sea más balanceada y fluida y volvérmela a enviar', clase: true },
  { ex: 'mat3', pts: '2/8', q: '¿Dónde va la bola en Hundred, Single leg stretch, Criss cross y Bicycle?',
    tu: 'Criss cross: detrás de la espalda · Bicycle: debajo de la pelvis y entre tobillos', ok: 'La revisión no muestra las correctas: confirmalo con el manual de Mat 3', pendiente: true },
  { ex: 'mat3', pts: '0/3 ×3', q: 'Entrenamiento con el aro: integración del tronco, tren inferior y tren superior',
    tu: 'Hundred, Roll up, Leg circles · Footwork, Side kicks, Bridge · Push ups, Leg pull front, Plank', ok: 'Cada ejercicio con el aro y dónde va', com: '¿Aro adónde?' },
  { ex: 'mat3', pts: '1/3', q: 'Movimiento de todo el cuerpo con el aro',
    tu: 'Teaser, Boomerang, Control balance', ok: 'Ejercicios que se vieron en el curso', com: 'Control balance no lo vimos en este curso, ¿de dónde sacaste esto?' },
  { ex: 'mat3', pts: 'sin nota', q: 'Entrenamiento completo con cada accesorio y cada principio (30 puntos)',
    tu: '10 grupos de 3 ejercicios con su accesorio', ok: 'Quedó "Requiere revisión" en el PDF', pendiente: true }
];

(() => {
  TEMAS['ex-pm'] = { nom: 'Examen: Principios del Movimiento', color: 'verde', icono: '📝' };
  TEMAS['ex-mat'] = { nom: 'Exámenes de Mat 1, 2 y 3', color: 'magenta', icono: '🎓' };

  const iFin = UNIDADES.findIndex(u => u.id === 'u11');
  UNIDADES.splice(iFin < 0 ? UNIDADES.length : iFin, 0,
    { id: 'u17', nom: 'Examen: Principios', temas: ['ex-pm'], icono: '📝' },
    { id: 'u18', nom: 'Exámenes de Mat', temas: ['ex-mat'], icono: '🎓' });

  const PM = 'Principios del Movimiento';
  /* pregunta de opción múltiple: la primera opción es la correcta (se mezclan al mostrarse) */
  const quiz = (n, q, ops, porque, extra = {}) => CARDS.push({
    id: 'exq-pm' + n, tema: 'ex-pm', tipo: 'quiz', q, a: [ops[0]], ops, correcta: ops[0], porque,
    examen: { ex: 'pm', n, fallada: !!extra.fallada, formato: extra.formato }, pag: extra.pag
  });
  /* "seleccioná las correctas" (lo que en el examen era "Todas las anteriores") */
  const lista = (id, tema, ex, q, a, dist, porque, extra = {}) => CARDS.push({
    id, tema, tipo: 'lista', q, a, dist, porque, noDonar: true,
    examen: { ex, n: extra.n, fallada: !!extra.fallada, formato: extra.formato }, pag: extra.pag
  });
  const simple = (id, tema, ex, q, a, dist, porque, extra = {}) => CARDS.push({
    id, tema, tipo: 'simple', q, a: [a], dist, porque,
    examen: { ex, n: extra.n, fallada: !!extra.fallada }, pag: extra.pag
  });

  /* ---------------- PRINCIPIOS DEL MOVIMIENTO ---------------- */

  /* falladas primero */
  lista('exq-pm11', 'ex-pm', 'pm',
    'En un cuerpo sano, ¿cómo reacciona la unidad interna del núcleo?',
    ['De forma refleja ante la postura y la carga', 'De forma consciente cuando hace falta soporte', 'Al impulsar el cuerpo hacia adelante'],
    ['Recién después de mover brazos y piernas', 'Solo cuando se contrae el recto abdominal', 'Solo con la respiración forzada', 'Solo cuando se la activa a propósito'],
    'La unidad interna se activa sola, de forma refleja y anticipatoria, cada vez que cambian la postura o la carga sobre la columna; también se puede activar a voluntad para dar soporte, y acompaña el impulso del cuerpo hacia adelante. En el examen la respuesta era "Todas las anteriores": elegiste solo la refleja.',
    { n: 11, fallada: true, formato: 'Todas las anteriores' });

  quiz(20, 'Protocolos para el tren inferior: ¿qué NO es foco de ese principio (pertenece a otro)?',
    ['Integrar la unidad interna y la externa', 'Alineación óptima de la pierna', 'Equilibrar rango articular y fuerza', 'Agilidad, equilibrio y coordinación'],
    'Integrar la unidad interna y la externa es el principio 2, Integración del tronco. El tren inferior trabaja la alineación de la pierna, el equilibrio entre rango y fuerza, y agilidad, equilibrio y coordinación. En el examen elegiste "agilidad, equilibrio y coordinación", que sí es parte del tren inferior.',
    { fallada: true, formato: 'excepto' });

  /* Módulo 1: movimiento de todo el cuerpo */
  quiz(1, '¿Cuáles son los tres niveles de observación para analizar los patrones de movimiento?',
    ['Global, planar integrado y local', 'Anterior, lateral y posterior', 'Global, transversal y sagital', 'Rango, integridad y estabilidad articular'],
    'De lo general a lo particular: el patrón completo (global), cada plano de movimiento (planar integrado) y la articulación o el músculo puntual (local). Después se vuelve a lo global para comprobar el cambio.',
    { pag: `${PM}, págs. 4–5` });
  quiz(2, 'Vista de lado, ¿qué puntos se alinean con la línea vertical de gravedad?',
    ['Oreja, hombro, centro del tórax, cresta ilíaca, rodilla y tobillo',
     'Nariz, esternón, ombligo, sínfisis púbica, rótulas y tobillos',
     'Hombros nivelados, tórax sobre la pelvis y EIAS niveladas',
     'Occipital, apófisis espinosas, pliegue glúteo, rodillas y talones'],
    'De lado, la plomada pasa por la cara LATERAL del cuerpo: lóbulo de la oreja, punta del hombro, centro de la caja torácica, punto alto de la cresta ilíaca, cara lateral de la rodilla y maléolo lateral. Nariz, esternón y ombligo son marcas de la vista de frente; el occipital y las espinosas, de la de atrás; y el nivel de hombros y EIAS es alineación horizontal.',
    { pag: `${PM}, págs. 9–13`, formato: 'Todo lo anterior (incorrecta)' });
  quiz(3, '¿Qué desequilibrio muscular se asocia con la cifosis torácica?',
    ['Extensores torácicos y escapulares débiles o largos; pecho corto',
     'Extensores torácicos cortos y fuertes; pecho débil y largo',
     'Pecho y estabilizadores escapulares fuertes y acortados',
     'Pecho débil y largo; estabilizadores escapulares cortos'],
    'En la cifosis se acorta lo de adelante (pectorales) y queda estirado y débil lo de atrás (extensores torácicos y estabilizadores de la escápula). Por eso se estira el pecho y se fortalecen la extensión y la escápula.',
    { pag: `${PM}, págs. 14–17` });
  quiz(4, 'Al planificar el programa de ejercicios de un cliente, ¿qué factores clave se consideran?',
    ['Estado físico actual, edad, control motor y estilo de aprendizaje',
     'Control inconsciente del movimiento, velocidad, resistencia y edad',
     'Competencia total, equilibrio y control en todos los ejercicios',
     'Capacidad de reacción, adaptación a la variación y condición general'],
    'Se planifica para la persona que está adelante: cómo está hoy, su edad, cuánto control del movimiento tiene y cómo aprende mejor (viendo, escuchando o sintiendo).',
    { pag: `${PM}, págs. 20–21` });
  quiz(5, '¿A qué filosofía se refiere la regla 80/20 del entrenamiento?',
    ['80 % perfeccionar lo aprendido y 20 % habilidades nuevas', '80 % habilidades nuevas y 20 % perfeccionar lo aprendido',
     '80 % trabajo de fuerza y 20 % de flexibilidad', '80 % de la clase en el mat y 20 % en aparatos'],
    'La mayor parte de la sesión consolida lo que ya se sabe hacer, que es donde se gana calidad, y una parte chica presenta algo nuevo: desafío suficiente sin perder el control.',
    { pag: `${PM}, págs. 20–21` });

  /* Módulo 2: integración del tronco */
  quiz(6, '¿Cuáles son los cuatro elementos de la integración del tronco?',
    ['Respiración, unidad interna, unidad externa y movilidad espinal', 'Respiración, núcleo, tronco y columna vertebral',
     'Diafragma, suelo pélvico, multífidos y transverso', 'Movilidad cervical, torácica, lumbar y sacra'],
    'Primero se respira, después se estabiliza desde adentro (unidad interna), se suman las cadenas que producen fuerza (unidad externa) y todo protege a una columna que se mueve (movilidad espinal). Diafragma, suelo pélvico, multífidos y transverso son solo la unidad interna.');
  quiz(7, 'En la inhalación, el diafragma se contrae y su cúpula se mueve…',
    ['Hacia abajo, y entra el aire', 'Hacia arriba, y entra el aire', 'Hacia abajo, y sale el aire', 'Hacia arriba, y sale el aire'],
    'Al contraerse, el diafragma se aplana y desciende: el tórax gana volumen, baja la presión y entra el aire. En la exhalación se relaja y la cúpula vuelve a subir.');
  quiz(8, '¿Qué movimiento de la columna suele facilitar la inhalación?',
    ['Extensión', 'Flexión', 'Ninguno: la respiración no influye'],
    'Al inhalar el tórax se expande y la columna torácica tiende a extenderse; al exhalar las costillas bajan y se facilita la flexión. Para la flexión lateral y la rotación sirve cualquiera de las dos fases, según el ejercicio.',
    { formato: 'Tanto A como B / Ninguno' });
  quiz(9, '¿Qué músculos forman la unidad interna o núcleo?',
    ['Suelo pélvico, transverso del abdomen, multífidos y diafragma', 'Erector espinal, fascia toracolumbar y transverso del abdomen',
     'Suelo pélvico, oblicuo externo y recto del abdomen', 'Oblicuos interno y externo, multífidos y diafragma'],
    'Son la "caja" profunda: el diafragma arriba, el suelo pélvico abajo, el transverso adelante y a los costados, los multífidos atrás. Oblicuos, recto y erectores son unidad externa.');
  lista('exq-pm10', 'ex-pm', 'pm',
    'Ejercicios fundamentales que traen conciencia a la respiración en relación con el transverso del abdomen',
    ['Fingertip abdominals', 'All four abdominals'],
    ['Sternum drops', 'Tail wag', 'Bridge marching', 'Angels in the snow'],
    'Los dos trabajan la unidad interna con la respiración: Fingertip abdominals en supino, con las yemas de los dedos sobre el abdomen para sentir el transverso, y All four abdominals en cuatro apoyos. En el examen la respuesta era "A y B".',
    { n: 10, formato: 'A y B' });
  quiz(12, '¿Qué ejercicios en supino enseñan la estabilidad lumbopélvica?',
    ['Marching, Toe taps y Dead bug', 'Cat/Cow, Tail wag y Opposite arm and leg', 'Marching, Mini swan y Swimming', 'Bridging, Standing march y Standing diagonal press'],
    'Son la progresión en supino: Marching, Toe taps, Diagonal press, Dead bug y Bridge marching. Mini swan y Swimming son en prono; Cat/Cow, Tail wag y Opposite arm and leg, en cuatro apoyos; los "Standing", de pie.');
  quiz(13, '¿Qué ejercicio enseña la estabilidad lumbopélvica en prono?',
    ['Swimming', 'Diagonal press', 'Dead bug', 'Bridge'],
    'Swimming se hace boca abajo: brazos y piernas alternados sin que la pelvis se mueva. Diagonal press, Dead bug y Bridge se hacen en supino.');
  quiz(14, 'En supino, ¿qué ejercicio fortalece isquiotibiales y glúteos mientras entrena la estabilidad de las cadenas cruzadas?',
    ['Bridge marching', 'Articulated bridge', 'Reverse plank', 'Opposite arm and leg'],
    'En el puente, levantar un pie obliga a la pelvis a no rotar: glúteos e isquiotibiales sostienen y las cadenas oblicuas estabilizan. El Articulated bridge moviliza la columna vértebra por vértebra; Opposite arm and leg es en cuatro apoyos.');
  quiz(15, '¿Cuáles son las funciones primarias de la columna vertebral?',
    ['Movimiento, transferencia de fuerza y protección de la médula', 'Movimiento, regulación de la temperatura y protección de la médula',
     'Transferencia de fuerza, bombeo de la linfa y protección de la médula', 'Movimiento, transferencia de fuerza y absorción de nutrientes'],
    'La columna mueve el tronco, transmite la fuerza entre la parte superior y la inferior del cuerpo, y protege la médula espinal y las raíces nerviosas que salen entre las vértebras. En el examen la respuesta era "Todas las anteriores".',
    { formato: 'Todas las anteriores' });
  quiz(16, '¿Cómo se llama la primera vértebra cervical?',
    ['Atlas', 'Axis', 'Cóndilo occipital', 'Apófisis odontoides'],
    'C1 es el atlas: sostiene el cráneo, como el titán de la mitología sostiene el mundo. C2 es el axis, con la apófisis odontoides sobre la que gira el atlas. El cóndilo occipital es parte del cráneo.');
  quiz(17, 'Tail wag y Seated side stretch buscan mejorar ¿qué movimiento de la columna?',
    ['Flexión lateral', 'Rotación axial', 'Flexión anterior', 'Extensión torácica'],
    'Tail wag (en cuatro apoyos, la "cola" va de un lado al otro) y Seated side stretch trabajan la columna en el plano frontal.');
  quiz(18, '¿Qué movimientos de la columna ocurren en el plano sagital?',
    ['Flexión y extensión', 'Flexión lateral y rotación', 'Rotación y extensión', 'Flexión lateral y flexión'],
    'El plano sagital divide el cuerpo en derecha e izquierda: en él la columna se flexiona y se extiende. La flexión lateral es frontal y la rotación, transversal.',
    { pag: `${PM}, págs. 6–8` });
  quiz(19, '¿Qué es el núcleo pulposo?',
    ['El centro blando y gelatinoso del disco intervertebral', 'La médula ósea del interior del cuerpo vertebral',
     'El agujero central del arco vertebral', 'La vértebra ubicada en el centro de la columna'],
    'El disco tiene un anillo fibroso por fuera y el núcleo pulposo, gelatinoso, por dentro: reparte la presión entre las vértebras como un amortiguador.');

  /* Módulo 3: tren inferior */
  /* la 21 era "Todas las anteriores" con una vista por opción: pasó a emparejar */
  PARES.push({
    id: 'exp-pm21', tema: 'ex-pm', q: 'Alineación ideal de las piernas de pie: uní cada vista con lo que se observa',
    pares: [['De lado', 'Cadera, rodilla y tobillo, uno sobre otro'],
            ['De frente', 'Por dentro de la EIAS, centro de la rótula y 2.º dedo'],
            ['De atrás', 'Pliegue glúteo, hueco poplíteo, Aquiles y talón']],
    porque: 'Las tres descripciones eran correctas: en el examen la respuesta era "Todas las anteriores".',
    examen: { ex: 'pm', n: 21, formato: 'Todas las anteriores' }
  });
  quiz(22, 'El trabajo de pie y tobillo, como la elevación de talones y los saltos, sirve para…',
    ['Estabilizar y fortalecer el tobillo y mejorar el equilibrio', 'Fortalecer el tobillo, activar el core y movilizar la columna',
     'Mejorar el equilibrio, retar la columna y movilizar la cadera', 'Estirar el tendón de Aquiles y movilizar la columna'],
    'Elevar los talones y saltar cargan el tobillo sobre su propio eje: más estabilidad, más fuerza y mejor equilibrio. La columna y la cadera no son el objetivo de ese trabajo.');
  quiz(23, 'Si los flexores de cadera están muy contracturados, los isquiotibiales no tienen rango y cuesta ganarles fuerza. ¿De qué es ejemplo?',
    ['Inhibición recíproca', 'Entrenamiento recíproco', 'Aislamiento inhibido', 'Activación recíproca'],
    'Cuando un músculo se contrae, su opuesto se relaja: es la inhibición recíproca. El manual la usa para explicar que un lado acortado de la articulación limita al otro: primero se equilibra el rango y después se busca fuerza.');
  quiz(24, '¿Cuál de estas articulaciones del miembro inferior es una enartrosis?',
    ['Cadera', 'Rodilla', 'Tobillo', 'Sacroilíaca'],
    'Enartrosis es la articulación esférica, una cabeza dentro de una cavidad, que se mueve en los tres planos: la cadera. La rodilla funciona sobre todo como bisagra, el tobillo es una tróclea y la sacroilíaca casi no se mueve.');
  quiz(25, 'Sobre la articulación sacroilíaca, ¿qué afirmación es FALSA?',
    ['Es una articulación fija, sin movimiento', 'A menudo es un área de disfunción', 'Permite un movimiento mínimo', 'Está unida por ligamentos muy fuertes'],
    'La sacroilíaca se mueve poco (pequeños deslizamientos de nutación y contranutación), pero se mueve. Sus ligamentos fuertes la estabilizan, y cuando falla aparece dolor.',
    { formato: 'excepto' });
  quiz(26, 'La marcha con movimiento del brazo contrario entrena…',
    ['La contrarrotación de tronco y pelvis al mover brazos y piernas', 'La fuerza de los flexores de cadera con carga externa',
     'La coordinación de los brazos sin demanda de estabilidad', 'La movilidad de la escápula en elevación completa'],
    'Al marchar con el brazo opuesto, la pelvis y el tórax giran en sentidos contrarios, como al caminar: se entrena esa contrarrotación con el tronco estable.');
  quiz(27, '¿Qué ejercicios potentes del tren inferior desarrollan una fuerza equilibrada en piernas y caderas?',
    ['Sentadillas y zancadas', 'Standing multifidi', 'Marcha de pie', 'Stepping out'],
    'Sentadillas y zancadas cargan cadera, rodilla y tobillo a la vez con el propio peso: son el trabajo de potencia del tren inferior. Standing multifidi y la marcha de pie apuntan sobre todo a la estabilidad.');

  /* Módulo 4: tren superior */
  quiz(28, '¿Qué movimiento NO pertenece a la articulación glenohumeral?',
    ['Rotación hacia arriba y abajo', 'Flexión y extensión', 'Abducción y aducción', 'Rotación medial y lateral'],
    'La rotación hacia arriba y hacia abajo es de la ESCÁPULA sobre el tórax. El húmero, en la glenoides, se flexiona, se extiende, abduce, aduce y rota hacia medial y lateral.',
    { formato: 'excepto' });
  quiz(29, '¿A qué se refiere el ritmo escapulohumeral?',
    ['Al movimiento de la escápula en relación con el del húmero', 'Al movimiento de una escápula en relación con la otra',
     'Al movimiento de la clavícula en relación con el esternón', 'Al movimiento del húmero en relación con el antebrazo'],
    'Al elevar el brazo, el húmero y la escápula se mueven coordinados (aproximadamente 2 grados de húmero por cada grado de escápula): si la escápula no rota hacia arriba, el hombro se pinza.');
  quiz(30, 'Protocolo para el tren superior: ¿qué NO corresponde?',
    ['Priorizar los motores grandes sobre la estabilidad', 'Estabilidad y resistencia glenohumeral', 'Movilidad escapular y coordinación', 'Estabilidad escapular y control dinámico'],
    'El orden es al revés: primero la estabilidad glenohumeral y escapular, después la fuerza de los músculos grandes (pectoral, dorsal ancho, deltoides). Fuerza sin estabilidad carga el hombro.',
    { formato: 'excepto' });
  quiz(31, '¿Qué patrón funcional NO es del tren superior?',
    ['Striding (dar zancadas)', 'Pushing (empujar)', 'Pulling (tirar)', 'Lifting (levantar)'],
    'Empujar, tirar y levantar son los patrones del tren superior; dar zancadas es un patrón del tren inferior.',
    { formato: 'excepto' });
  quiz(32, 'Sternum drops mueve las escápulas principalmente en…',
    ['Protracción y retracción', 'Elevación y depresión', 'Elevación y retracción', 'Depresión y protracción'],
    'En cuatro apoyos y con los codos estirados, el esternón baja entre los brazos (las escápulas se juntan: retracción) y vuelve a subir (se separan: protracción).');
  quiz(33, 'La rotación hacia arriba de las escápulas ocurre cuando los brazos…',
    ['Suben por delante o por el costado', 'Se llevan por detrás del cuerpo', 'Descansan a los costados del cuerpo', 'Bajan desde arriba hasta los costados'],
    'Para que el brazo suba por encima de la cabeza, la escápula gira y su ángulo inferior se va hacia afuera: rotación hacia arriba. Al bajar los brazos o llevarlos atrás, rota hacia abajo.');

  /* Módulo 5: flexibilidad dinámica */
  lista('exq-pm34', 'ex-pm', 'pm', '¿De qué es responsable el reflejo de estiramiento?',
    ['Moderar la longitud del músculo', 'Evitar que la articulación se estire de más'],
    ['Hacer que el músculo se estire solo', 'Relajar el músculo ante un tirón rápido', 'Ganar flexibilidad con cada rebote', 'Aumentar la fuerza del antagonista'],
    'Si un músculo se estira demasiado o muy rápido, el huso muscular lo hace contraer: frena el estiramiento y protege la articulación. Por eso se estira despacio y sin rebotes. En el examen la respuesta era "Solo A y B".',
    { n: 34, formato: 'Solo A y B' });
  quiz(35, '¿Qué NO es un objetivo de la liberación miofascial?',
    ['Mejorar la fuerza muscular', 'Relajar los músculos', 'Mejorar la circulación sanguínea y linfática', 'Disminuir la "pegajosidad" entre tejidos'],
    'La liberación miofascial (por ejemplo, con el rodillo) relaja, mejora la circulación y ayuda a que los tejidos se deslicen entre sí. La fuerza se gana con carga, no con presión.',
    { formato: 'excepto' });
  quiz(36, '¿En qué consiste el estiramiento activo aislado?',
    ['Contraer el músculo opuesto para liberar el músculo objetivo', 'Contraer isométricamente el músculo objetivo antes de soltar',
     'Mantener el estiramiento entre 40 y 60 segundos', 'Rebotar suavemente al final del rango de movimiento'],
    'Usa la inhibición recíproca: contraer el antagonista relaja el músculo que se quiere estirar, en repeticiones cortas. Contraer el propio músculo antes de soltar es FNP (contracción-relajación); sostener la posición es el estiramiento estático; rebotar es balístico.');
  quiz(37, '¿Qué NO forma parte de la recuperación?',
    ['Clase aeróbica', 'Respiración', 'Descanso', 'Relajación'],
    'Recuperar es bajar la carga: respirar, descansar y relajar. Una clase aeróbica es más estímulo, no recuperación.',
    { formato: 'excepto' });

  /* ---------------- MAT 1, 2 y 3 ---------------- */

  /* falladas primero */
  simple('exm-resp', 'ex-mat', 'mat1',
    'Examen de Mat 1, principio Respiración: de estos ejercicios de Mat 1, ¿cuál te aceptaron?',
    'The Hundred', ['The Roll up', 'Spine stretch forward', 'Rolling like a ball'],
    'El Hundred es el ejercicio de la respiración: 5 tiempos de inhalación y 5 de exhalación con el bombeo de brazos, 10 ciclos. Roll up y Spine stretch forward no se aceptaron para este principio.',
    { fallada: true, pag: 'Mat 1, págs. 14–17' });
  lista('exm-inf', 'ex-mat', 'mat1',
    'Ejercicios de Mat 1 para Fuerza y potencia del tren INFERIOR (según tu Análisis MAT 1)',
    ['Side leg kicks', 'Side leg circles', 'Single leg kicks', 'Side leg lifts'],
    ['Push ups', 'Swan', 'The Hundred', 'Spine stretch forward', 'Saw'],
    'Tu Análisis MAT 1 ubica en el tren inferior la serie de costado (lifts, circles, kicks, bicycle) y Single leg kicks; Double leg kicks también, si se justifica por los isquiotibiales y no por la apertura de pecho. En el examen pusiste Plank, Push ups y Swan, que son del tren superior.',
    { fallada: true });
  lista('exm-cerv', 'ex-mat', 'mat2',
    'Ejercicios de Mat que requieren precaución con una lesión cervical (examen Mat 2)',
    ['Roll over', 'Neck pull', 'Boomerang'],
    ['Spine twist', 'Leg pull down', 'Side bend', 'Modified corkscrew'],
    'Los tres cargan el cuello: Roll over y Boomerang ruedan hasta apoyarse sobre los hombros, y Neck pull tira de la cabeza con las manos detrás. En el examen marcaste Roll over y Neck pull: faltó Boomerang.',
    { fallada: true });
  lista('exm-escap', 'ex-mat', 'mat2',
    'Ejercicios de Mat 2 que aumentan la estabilidad escapular (confirmados en el examen)',
    ['Leg pull down', 'Leg pull up'],
    ['Spine twist', 'Neck pull', 'Teaser preparation', 'Roll over'],
    'Los dos son planchas: boca abajo (Leg pull down) y boca arriba (Leg pull up). Sostener el peso sobre las manos exige estabilidad escapular. Side bend quedó en duda en la corrección.',
    { fallada: true });

  lista('exm-9p', 'ex-mat', 'mat1', 'Los 9 principios de Pilates (según Balanced Body)',
    ['Respiración', 'Concentración', 'Control', 'Centrar', 'Precisión', 'Desarrollo muscular balanceado', 'Ritmo / fluir', 'Movimiento de todo el cuerpo', 'Relajación'],
    ['Integración del tronco', 'Flexibilidad dinámica', 'Potencia del tren inferior', 'Estabilidad escapular'],
    'Son los principios de la práctica. No confundirlos con los 5 principios del movimiento de Balanced Body (integración del tronco, tren inferior, tren superior, movimiento de todo el cuerpo y flexibilidad dinámica): "Movimiento de todo el cuerpo" es el único nombre que está en las dos listas.',
    { pag: 'Mat 1, pág. 12' });
  CLASIFICACIONES.push({
    id: 'exc-9y5', tema: 'ex-mat', q: '¿Es uno de los 9 principios de Pilates o uno de los principios del movimiento de Balanced Body?',
    grupos: {
      '9 principios de Pilates': ['Respiración', 'Concentración', 'Control', 'Centrar', 'Precisión', 'Desarrollo muscular balanceado', 'Ritmo / fluir', 'Relajación'],
      'Principios del movimiento (BB)': ['Integración del tronco', 'Tren inferior: fuerza y potencia', 'Tren superior: fuerza y equilibrio', 'Flexibilidad dinámica']
    },
    porque: 'Los 9 principios describen cómo se practica; los principios del movimiento, qué se entrena. "Movimiento de todo el cuerpo" está en las dos listas, por eso no aparece acá.',
    examen: { ex: 'mat1' }
  });
  CLOZES.push({
    id: 'exz-jp', tema: 'ex-mat',
    t: 'Joseph Pilates nació en [Alemania], se mudó a los Estados Unidos en [1926] y vivió y enseñó en [Nueva York].',
    dist: [['Inglaterra', 'Suiza'], ['1945', '1967'], ['Los Ángeles', 'Boston']],
    examen: { ex: 'mat1' }
  });
  CLASIFICACIONES.push({
    id: 'exc-osteo', tema: 'ex-mat', q: 'Examen de Mat 1: con osteoporosis, ¿contraindicado o no?',
    grupos: {
      'Contraindicado': ['Hundred', 'Rolling like a ball', 'Double straight leg stretch'],
      'No contraindicado': ['Swan', 'Side leg series', 'Single leg kicks']
    },
    porque: 'Los tres contraindicados flexionan la columna con carga, lo que concentra la presión en la parte anterior de las vértebras. Swan es extensión, y la serie de costado y los kicks no flexionan la columna.',
    pag: 'Mat 1, págs. 79–82', examen: { ex: 'mat1' }
  });
  simple('exm-teaser-osteo', 'ex-mat', 'mat2', 'Cliente con osteoporosis: ¿cómo se modifica el Teaser?',
    'No se modifica: se evita', ['Con las rodillas flexionadas y los pies apoyados', 'Con una pelota detrás de la espalda', 'Con menos rango y menos repeticiones'],
    'El Teaser exige una flexión fuerte de la columna con carga, contraindicada con osteoporosis por el riesgo de fractura vertebral. No hay versión segura: se reemplaza por otro ejercicio. La corrección lo calificó "Excelente".');
  simple('exm-pelvis', 'ex-mat', 'mat1', '¿Qué puntos óseos anteriores definen la pelvis neutra?',
    'Las EIAS y la sínfisis púbica, en un mismo plano', ['Las EIAS y el ombligo, en un mismo plano', 'Las crestas ilíacas y el pubis, a la misma altura', 'Las EIPS y el sacro, en un mismo plano'],
    'En pelvis neutra, las espinas ilíacas anterosuperiores (EIAS) y la sínfisis púbica quedan en el mismo plano. Las EIPS y el sacro están atrás.',
    { pag: 'Principios del Movimiento, pág. 19' });
  lista('exm-spine-isq', 'ex-mat', 'mat1', 'Formas de modificar el Spine stretch para isquiotibiales tensos',
    ['Flexionar un poco las rodillas', 'Sentarse sobre un alza (mat enrollado o toalla)'],
    ['Estirar los brazos más fuerte hacia adelante', 'Hacer el ejercicio más rápido', 'Juntar las piernas del todo', 'Apoyar las manos detrás de la cadera'],
    'Con isquiotibiales cortos, la pelvis se va hacia atrás y la columna no puede articular. Flexionar las rodillas o elevar la cadera sobre un alza devuelve la pelvis a neutra. Lo preguntaron en Mat 1 y en Mat 2.');
  lista('exm-lumbar1', 'ex-mat', 'mat1', 'Ejercicios de Mat 1 que requieren precaución con problemas de espalda baja',
    ['Roll up', 'Rolling like a ball', 'Double leg stretch', 'Double leg kicks'],
    ['Saw', 'Side leg circles', 'Push ups', 'Side leg kicks'],
    'Los cuatro cargan la zona lumbar: el Roll up y el Rolling en flexión, el Double leg stretch con la palanca de las piernas lejos y el Double leg kicks en extensión. El manual indica precaución lumbar en cada uno.');
  lista('exm-lumbar2', 'ex-mat', 'mat2', 'Ejercicios de Mat 2 que requieren precaución con problemas de espalda baja',
    ['Roll over', 'Jackknife', 'Corkscrew', 'Boomerang'],
    ['Leg pull down', 'Leg pull up', 'Kneeling side kicks', 'Bicycle'],
    'Todos ruedan o se invierten sobre la parte alta de la espalda con las piernas por encima de la cabeza: mucha flexión y carga lumbar.');
  lista('exm-cuello2', 'ex-mat', 'mat2', 'Ejercicios de Mat 2 que requieren precaución con lesiones de cuello y hombros',
    ['Roll over', 'Neck pull', 'Jackknife'],
    ['Spine twist', 'Modified corkscrew', 'Hip circles', 'Teaser preparation'],
    'Roll over y Jackknife apoyan el peso sobre los hombros y el cuello en la inversión; Neck pull flexiona la columna con las manos detrás de la cabeza.');
  lista('exm-munecas', 'ex-mat', 'mat2', 'Ejercicios de Mat 2 que requieren modificación con lesiones de muñeca',
    ['Kneeling side kicks', 'Leg pull up', 'Leg pull down'],
    ['Spine twist', 'Teaser preparation', 'Neck pull', 'Roll over'],
    'Los tres cargan el peso del cuerpo sobre la mano: se pueden hacer apoyando los antebrazos o con el puño cerrado.');
  lista('exm-resp-mov', 'ex-mat', 'mat2', '¿Cómo facilita la respiración el movimiento?',
    ['Inhalar facilita la extensión', 'Exhalar facilita la flexión', 'Flexión lateral y rotación, con cualquiera'],
    ['Inhalar facilita la flexión', 'Exhalar facilita la extensión', 'Retener el aire facilita la rotación', 'Exhalar bloquea la flexión lateral'],
    'Inhalar expande el tórax y acompaña la extensión; exhalar baja las costillas y acompaña la flexión. En la flexión lateral y la rotación se usa una u otra fase según el ejercicio.');
  lista('exm-core', 'ex-mat', 'mat2', 'Ejercicios de Pre-Pilates que se enfocan en la activación del core',
    ['Pelvic clock', 'Toe taps'],
    ['Sternum drops', 'Angels in the snow', 'Telescope arms', 'Seated side stretch'],
    'Pelvic clock enseña a mover la pelvis desde la unidad interna y Toe taps suma el peso de la pierna sin perder la estabilidad. Sternum drops, Angels in the snow y Telescope arms son del tren superior (escápula).');
  lista('exm-escap-pre', 'ex-mat', 'mat2', 'Ejercicios de Pre-Pilates para la movilidad y la estabilidad escapular',
    ['Sternum drops', 'Angels in the snow', 'Telescope arms'],
    ['Pelvic clock', 'Toe taps', 'Tail wag', 'Seated side stretch'],
    'Los tres son del principio Fuerza y equilibrio del tren superior: Sternum drops (estabilidad escapular, en cuatro apoyos), Angels in the snow y Telescope arms (ritmo escapular).');
  lista('exm-pelvica', 'ex-mat', 'mat2', 'Ejercicios de Pre-Pilates que enseñan la estabilidad pélvica',
    ['Marching', 'Opposite arm and leg reach', 'Pelvic clock'],
    ['Sternum drops', 'Angels in the snow', 'Telescope arms', 'Seated side stretch'],
    'Marching y Opposite arm and leg reach piden que la pelvis no se mueva mientras se mueven los miembros; Pelvic clock enseña a encontrarla y controlarla.');
  PARES.push({
    id: 'exp-estir', tema: 'ex-mat', q: 'Técnicas de estiramiento: uní cada una con cómo se hace',
    pares: [['Estático', 'Sostener la posición de elongación'],
            ['Activo aislado', 'Contraer el antagonista en repeticiones cortas'],
            ['Contracción-relajación (FNP)', 'Contracción isométrica en elongación y después soltar'],
            ['Liberación miofascial', 'Presión sostenida, por ejemplo con el rodillo']],
    porque: 'El activo aislado usa la inhibición recíproca; la FNP aprovecha la relajación que sigue a una contracción isométrica.',
    examen: { ex: 'mat2' }
  });
  SECUENCIAS.push({
    id: 'exo-teaser', tema: 'ex-mat', q: 'Ordená la secuencia para ir del Pelvic clock al Teaser',
    pasos: ['Pelvic clock', 'The Hundred', 'The Roll up', 'Teaser preparation', 'Teaser'],
    porque: 'De la activación del core al desafío máximo en flexión: cada paso alarga la palanca y pide más control. La corrección la aceptó completa (4/4).',
    examen: { ex: 'mat2' }
  });
  SECUENCIAS.push({
    id: 'exo-rocking', tema: 'ex-mat', q: 'Ordená la secuencia para ir del Bridge al Rocking',
    pasos: ['Bridge', 'Swan', 'Double leg kicks', 'Swan dive', 'Rocking'],
    porque: 'Una progresión en extensión: de la cadena posterior en supino (Bridge) al prono, sumando dinámica hasta el Rocking. Aceptada completa (4/4).',
    examen: { ex: 'mat2' }
  });
  PARES.push({
    id: 'exp-prog', tema: 'ex-mat', q: 'Programación de Mat 2: uní cada ejercicio con su foco',
    pares: [['Teaser', 'Unidad interna y articulación de la columna'],
            ['Boomerang', 'Todo el cuerpo: coordinación y equilibrio'],
            ['Leg pull up', 'Estabilidad escapular y extensores de cadera']],
    porque: 'Así lo programaste en el examen y la corrección lo aceptó completo (5/5 cada uno).',
    examen: { ex: 'mat2' }
  });

  /* Mat 3: accesorios */
  simple('exm-aro-rolling', 'ex-mat', 'mat3', 'En los ejercicios de rodar (Rolling like a ball, Open leg rocker, Boomerang), ¿dónde va el aro?',
    'Entre los tobillos o las rodillas', ['En las manos, con los brazos estirados', 'Detrás de la espalda, a la altura del brasier', 'Debajo de la pelvis'],
    'Entre los tobillos o las rodillas: las piernas presionan el aro y se activan los aductores mientras se rueda. Lo contestaste bien en el examen de Mat 3 (6/6).');
  CLASIFICACIONES.push({
    id: 'exc-curl', tema: 'ex-mat', q: 'Abdominal curl: ¿con la bola detrás de la espalda o con el aro entre las manos?',
    grupos: {
      'Bola detrás de la espalda': ['Da soporte al tronco', 'Asiste la articulación de la columna', 'Facilita la extensión torácica', 'Movilidad segmentaria'],
      'Aro entre las manos': ['Organiza la cintura escapular', 'Sin soporte para el tronco', 'Integra la línea media', 'Isometría de brazos y centro']
    },
    porque: 'La bola sostiene y acompaña a la columna; el aro no sostiene: conecta los brazos con el centro con una contracción isométrica. Así lo contestaste en Mat 3 (2/2).',
    examen: { ex: 'mat3' }
  });
  lista('exm-banda-dlk', 'ex-mat', 'mat3', 'Con la banda, ¿por qué el Double leg kicks se hace más fácil?',
    ['La banda asiste la elevación del pecho', 'Da soporte a los brazos'],
    ['Aumenta la carga de los isquiotibiales', 'Obliga a flexionar la columna', 'Quita el trabajo de la escápula', 'Acorta el rango de las piernas'],
    'La tensión de la banda ayuda a levantar el pecho (extensión torácica) y sostiene los brazos para mantener abierto el pecho y organizados los hombros.');
  PARES.push({
    id: 'exp-roller', tema: 'ex-mat', q: 'Estiramiento dinámico en el roller: uní cada estiramiento con cómo se usa el roller',
    pares: [['Pectorales', 'A lo largo, bajo la columna'],
            ['Flexores de cadera', 'Bajo el sacro'],
            ['Extensión torácica', 'Transversal, bajo la espalda alta'],
            ['Dorsales', 'De costado sobre el roller'],
            ['Glúteos y piramidal', 'Sentado sobre el roller']],
    porque: 'La secuencia que armaste en Mat 3 (5/5): el roller cambia de posición para abrir cada zona.',
    examen: { ex: 'mat3' }
  });
  lista('exm-banda-sup', 'ex-mat', 'mat3', 'Ejercicios con la banda para la fuerza del tren superior',
    ['Bicep curl', 'Tricep press', 'Chest expansion'],
    ['Scissors', 'Heel beats', 'Single leg circles', 'Side kick series'],
    'Los tres trabajan el brazo contra la resistencia de la banda: flexión de codo, extensión de codo y extensión de hombro con apertura de pecho.');
  lista('exm-flex-din', 'ex-mat', 'mat3', 'Ejercicios de Mat para el principio Flexibilidad dinámica',
    ['Spine stretch forward', 'Saw', 'Mermaid', 'Open leg rocker', 'Single straight leg stretch'],
    ['Push ups', 'Side leg lifts', 'The Hundred', 'Leg pull down'],
    'Todos estiran en movimiento: la columna (Spine stretch, Saw, Mermaid) o los isquiotibiales (Open leg rocker, Single straight leg stretch). Fueron aceptados en Mat 1 y en Mat 3.');
  lista('exm-clase', 'ex-mat', 'mat2', 'Al escribir una clase en el examen, ¿qué pidió la corrección?',
    ['Repeticiones exactas, no rangos', 'Pensar la transición entre ejercicios', 'Secuencia balanceada y fluida'],
    ['Copiar el rango de repeticiones del manual', 'Cambiar de posición en cada ejercicio', 'Dejar todos los abdominales para el final', 'Empezar por los ejercicios más difíciles'],
    'Lo marcaron en Mat 1 (17/30) y en Mat 2 (0/50). Practicalo en Práctica → Armá tu clase: la app revisa las mismas cosas.');
  SECUENCIAS.push({
    id: 'exo-posiciones', tema: 'ex-mat', q: 'Ordená las posiciones de una clase de Mat según el manual',
    pasos: ['De pie', 'Cuatro apoyos', 'Supino', 'Sentado', 'Prono', 'Plancha', 'De costado', 'Cierre de pie'],
    porque: 'Así ordenan el manual y sus secuencias de muestra. Tu clase del examen de Mat 2 volvía a supino después del prono, y la corrección pidió reorganizarla para que fuera más balanceada y fluida.',
    pag: 'Mat 1, págs. 65–67', examen: { ex: 'mat2' }
  });
})();
