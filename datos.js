/* ============================================================
   AnatoApp — Base de conocimiento (v2)
   Digitalizada de los apuntes manuscritos de Anatomía aplicada
   al método Pilates (43 fotos, 12 pliegos únicos).

   Código de color heredado de los apuntes originales:
     verde   → conceptos y principios
     rojo    → músculos y preguntas de acción
     magenta → repertorio de ejercicios

   Campos opcionales de las tarjetas:
     dist     → distractores escritos a mano (mejores que los automáticos)
     noDist   → cosas que NO pueden usarse como distractor porque, aunque
                no figuren en la lista de los apuntes, son anatómicamente
                correctas (p. ej. el semimembranoso también flexiona la
                rodilla). Evita castigar un conocimiento verdadero.
     distPool → de dónde sacar distractores ('repertorio', 'osteoNo')
     sinBanco → no usar el formato de selección con fichas (por seguridad
                del contenido o porque los ítems no se prestan)
   ============================================================ */

const TEMAS = {
  historia:   { nom: 'Historia y origen',             color: 'verde',   icono: '⏳' },
  principios: { nom: 'Los 5 principios',              color: 'verde',   icono: '⭐' },
  planos:     { nom: 'Planos y movimiento',           color: 'verde',   icono: '🧭' },
  cadenas:    { nom: 'Cadenas musculares',            color: 'verde',   icono: '⛓️' },
  tronco:     { nom: 'Músculos del tronco',           color: 'rojo',    icono: '🫁' },
  mmii:       { nom: 'Músculos del miembro inferior', color: 'rojo',    icono: '🦵' },
  mmss:       { nom: 'Músculos del miembro superior', color: 'rojo',    icono: '💪' },
  repertorio: { nom: 'Repertorio de ejercicios',      color: 'magenta', icono: '🤸' },
  osteo:      { nom: 'Osteoporosis',                  color: 'magenta', icono: '🦴' },
  embarazo:   { nom: 'Embarazo',                      color: 'magenta', icono: '🤰' },
  postura:    { nom: 'Observación postural',          color: 'verde',   icono: '📐' },
  progresion: { nom: 'Progresiones',                  color: 'magenta', icono: '📈' }
};

/* La ruta de aprendizaje: unidades en un orden que va de lo general
   a lo aplicado. Todas quedan abiertas (autonomía), pero la app
   recomienda la siguiente. */
const UNIDADES = [
  { id:'u1',  nom:'Origen del método',      temas:['historia'],        icono:'⏳' },
  { id:'u2',  nom:'Los 5 principios',       temas:['principios'],      icono:'⭐' },
  { id:'u3',  nom:'Planos y movimiento',    temas:['planos'],          icono:'🧭' },
  { id:'u4',  nom:'El tronco',              temas:['tronco'],          icono:'🫁' },
  { id:'u5',  nom:'Cadenas musculares',     temas:['cadenas'],         icono:'⛓️' },
  { id:'u6',  nom:'Miembro inferior',       temas:['mmii'],            icono:'🦵' },
  { id:'u7',  nom:'Miembro superior',       temas:['mmss'],            icono:'💪' },
  { id:'u8',  nom:'Observación postural',   temas:['postura'],         icono:'📐' },
  { id:'u9',  nom:'Repertorio',             temas:['repertorio'],      icono:'🤸' },
  { id:'u10', nom:'Progresiones',           temas:['progresion'],      icono:'📈' },
  { id:'u11', nom:'Poblaciones especiales', temas:['osteo','embarazo'], icono:'🦴' }
];

/* ------------------------------------------------------------
   TARJETAS (conceptos)
   tipo: 'lista'  → varios elementos; se practica seleccionando
                    fichas (al principio) o escribiendo de memoria
         'simple' → respuesta corta; opción múltiple al principio,
                    flashcard cuando ya está consolidada
   'porque' → elaboración: el mecanismo detrás del dato.
------------------------------------------------------------ */

const CARDS = [

  /* ---------- HISTORIA ---------- */
  { id:'h1', tema:'historia', tipo:'simple',
    q:'¿Qué es el método Pilates?',
    a:['Un sistema de acondicionamiento físico desarrollado por Joseph Pilates para fortalecer músculos, aumentar la flexibilidad y mejorar la salud general.'],
    dist:['Una disciplina de relajación basada en estiramientos pasivos, creada en la India.',
          'Un programa de rehabilitación exclusivo para bailarines, creado por Clara Pilates.',
          'Un entrenamiento de fuerza máxima con pesas libres, creado en Nueva York.'],
    porque:'No es una rutina de ejercicios sueltos: es un sistema, y por eso todo el repertorio se organiza bajo principios comunes.' },

  { id:'h2', tema:'historia', tipo:'lista',
    q:'¿En qué tres cosas se enfoca el método?',
    a:['Respiración','Alineación','Patrones de movimiento eficiente'],
    dist:['Fuerza máxima','Velocidad','Resistencia aeróbica'],
    porque:'Los tres son la base de todo lo demás: sin respiración no hay unidad interna, sin alineación no hay carga segura, y sin patrón eficiente el movimiento se compensa.' },

  { id:'h3', tema:'historia', tipo:'simple',
    q:'Nombre completo, año de nacimiento y nacionalidad del fundador',
    a:['Joseph Hubertus Pilates, 1883, alemán'],
    dist:['Joseph Hubertus Pilates, 1926, inglés','Joseph Pilates, 1867, estadounidense','Joseph Hubertus Pilates, 1883, inglés'] },

  { id:'h4', tema:'historia', tipo:'lista',
    q:'¿Qué enfermedades padeció Joseph Pilates de niño?',
    a:['Asma','Raquitismo','Fiebre reumática'],
    dist:['Tuberculosis','Diabetes','Poliomielitis'],
    porque:'Su propia fragilidad fue el motor del método: diseñó el sistema para reconstruir un cuerpo enfermo, no para entrenar a un atleta sano.' },

  { id:'h5', tema:'historia', tipo:'lista',
    q:'¿Qué disciplinas practicó de joven?',
    a:['Boxeo','Esgrima','Lucha','Gimnasia','Yoga y meditación'],
    dist:['Natación','Ciclismo','Atletismo'],
    porque:'De ahí sale la mezcla característica: potencia y precisión occidentales + control respiratorio y concentración orientales.' },

  { id:'h6', tema:'historia', tipo:'simple',
    q:'¿Qué pasó durante su juventud en Inglaterra?',
    a:['Fue detenido y encerrado en la Isla de Man. Ejerció de enfermero y allí inició el sistema.'],
    dist:['Fue entrenador de boxeo en Londres y allí diseñó los aparatos.',
          'Trabajó con el New York City Ballet y allí inició el sistema.',
          'Estudió medicina en Inglaterra y publicó el método.'],
    porque:'Trabajando con internos encamados nace la idea de usar resortes y la camilla como resistencia: el origen del Reformer.' },

  { id:'h7', tema:'historia', tipo:'simple',
    q:'¿Qué ocurre en 1926?',
    a:['Llega a Nueva York con Clara y nace el estudio, junto al New York City Ballet (8ª Avenida).'],
    dist:['Nace Joseph Pilates en Alemania.','Fallece Clara y el estudio cierra.','Es detenido en la Isla de Man.'],
    porque:'La cercanía con el ballet explica por qué el repertorio clásico exige tanto control, elongación axial y precisión.' },

  { id:'h8', tema:'historia', tipo:'simple',
    q:'¿Qué sucede en 1967 y en 1977?',
    a:['1967: fallece Joseph Pilates (poco antes se quemó el estudio). 1977: fallece Clara.'],
    dist:['1967: llega a Nueva York. 1977: abre el estudio.',
          '1967: fallece Clara. 1977: fallece Joseph.',
          '1967: se jubila y vuelve a Alemania. 1977: fallece Joseph.'] },

  /* ---------- PRINCIPIOS ---------- */
  { id:'p0', tema:'principios', tipo:'lista',
    q:'Los 5 principios del movimiento (según BB)',
    a:['Movimiento de todo el cuerpo',
       'Integración del tronco',
       'Fuerza y potencia de la parte inferior del cuerpo',
       'Fuerza y equilibrio de la parte superior del cuerpo',
       'Movilidad, flexibilidad y recuperación'],
    dist:['Respiración y concentración','Control y precisión','Fluidez del movimiento'],
    porque:'Son la columna vertebral de la app entera: cada ejercicio del repertorio se clasifica según qué principio entrena.' },

  { id:'p1', tema:'principios', tipo:'simple',
    q:'Principio 1 — Movimiento de todo el cuerpo: ¿qué debe moverse?',
    a:['La columna, los miembros inferiores y los miembros superiores. Incluye movimientos en los tres planos: sagital, frontal y transversal.'],
    dist:['Solo el tronco, manteniendo los miembros quietos.',
          'Los miembros inferiores, únicamente en el plano sagital.',
          'La columna, solo en flexión y extensión.'] },

  { id:'p1b', tema:'principios', tipo:'lista',
    q:'¿Qué dos herramientas de valoración pertenecen al principio 1?',
    a:['Análisis postural estático','Detección de desalineaciones'],
    dist:['Test de fuerza máxima','Medición de frecuencia cardíaca','Prueba de flexibilidad de isquiotibiales'] },

  { id:'p2', tema:'principios', tipo:'lista',
    q:'Principio 2 — Integración del tronco: sus 4 componentes',
    a:['Respiración (diafragmática, lateral/costal, pulmonar)',
       'Unidad interna (diafragma, espinal, TvA y suelo pélvico)',
       'Unidad externa (cadenas musculares)',
       'Movilidad espinal'],
    dist:['Fuerza de miembros superiores','Flexibilidad de isquiotibiales','Equilibrio en un pie'],
    porque:'Unidad interna = estabilidad profunda y anticipatoria. Unidad externa = producción de fuerza y movimiento. Si la interna no se activa primero, la externa compensa y aparece el dolor.' },

  { id:'p3', tema:'principios', tipo:'lista',
    q:'Principio 3 — Parte inferior: las 3 dimensiones de la CADERA',
    a:['Flexión / Extensión','Abducción / Aducción','Rotación lateral / medial'],
    dist:['Inversión / Eversión','Flexión plantar / Dorsiflexión','Pronación / Supinación'] },

  { id:'p3b', tema:'principios', tipo:'lista',
    q:'Principio 3 — Movimientos de rodilla, tobillo y pie',
    a:['Rodilla: flexión / extensión y rotación lateral / medial',
       'Tobillo: flexión plantar / dorsiflexión',
       'Pie: inversión / eversión / circunducción / flexión / extensión'] },

  { id:'p4', tema:'principios', tipo:'lista',
    q:'Principio 4 — Parte superior: ¿qué dos cosas se entrenan?',
    a:['Estabilidad y resistencia glenohumeral','Estabilidad y movilidad escapular'],
    dist:['Movilidad de la columna lumbar','Fuerza de cuádriceps','Flexibilidad de isquiotibiales'],
    porque:'La regla del principio 4 es "cualquier cosa que genere estabilidad". El ejemplo canónico: todas las planchas en sus presentaciones.' },

  { id:'p5', tema:'principios', tipo:'simple',
    q:'¿Cuál es el principio 5?',
    a:['Movilidad, flexibilidad y recuperación'],
    dist:['Integración del tronco','Fuerza y equilibrio de la parte superior del cuerpo','Respiración, alineación y patrón eficiente'] },

  /* ---------- PLANOS ---------- */
  { id:'pl1', tema:'planos', tipo:'simple',
    q:'Plano SAGITAL: ¿qué movimientos ocurren?',
    a:['Flexión y extensión'],
    dist:['Rotación medial y lateral','Flexión lateral, abducción y aducción','Inversión y eversión'],
    porque:'Es el plano de la línea media hacia adelante y atrás. Por eso el sistema longitudinal profundo, que nos mantiene erguidos, trabaja aquí.' },

  { id:'pl2', tema:'planos', tipo:'lista',
    q:'Plano FRONTAL: ¿qué movimientos ocurren?',
    a:['Flexión lateral','Abducción (ABD)','Aducción (ADD)','Estabilidad lateral y medial'],
    dist:['Rotación medial','Rotación lateral','Flexión','Extensión'],
    porque:'Es el plano del sistema lateral: el que equilibra la pelvis sobre los fémures al caminar y al estar de pie.' },

  { id:'pl3', tema:'planos', tipo:'simple',
    q:'Plano TRANSVERSAL: ¿qué movimientos ocurren?',
    a:['Rotación medial y lateral'],
    dist:['Flexión y extensión','Flexión lateral, abducción y aducción','Inversión y eversión'],
    porque:'Es el plano de los sistemas oblicuos (anterior y posterior), que trabajan siempre en contralateral.' },

  /* ---------- CADENAS ---------- */
  { id:'c0', tema:'cadenas', tipo:'simple',
    q:'¿A qué principio pertenecen las cadenas posturales y a qué unidad?',
    a:['Al principio de Integración del tronco, específicamente a la UNIDAD EXTERNA.'],
    dist:['Al principio de Integración del tronco, a la UNIDAD INTERNA.',
          'Al principio de Movimiento de todo el cuerpo, a la unidad interna.',
          'Al principio de Movilidad y recuperación, a la unidad externa.'],
    porque:'La unidad externa genera movimiento y estabilidad en los planos sagital, frontal y transversal. Para que el movimiento sea equilibrado los cuatro sistemas deben trabajar coordinados.' },

  { id:'c1', tema:'cadenas', tipo:'lista',
    q:'CADENA 1 — Sistema OBLICUO ANTERIOR: ¿qué músculos lo forman?',
    a:['Serrato anterior','Oblicuos internos contralaterales','Oblicuos externos','Aductores contralaterales'],
    noDist:['Aductores'],
    porque:'Aquí se genera la rotación y la flexión. Es la cadena que inicia el gesto de dar un paso o lanzar.' },

  { id:'c2', tema:'cadenas', tipo:'lista',
    q:'CADENA 2 — Sistema LONGITUDINAL PROFUNDO: ¿qué músculos lo forman?',
    a:['Erector de la columna','Cuadrado lumbar','Fascia toracolumbar','Ligamento sacrotuberoso','Bíceps femoral'],
    porque:'Es la cadena del plano SAGITAL: mantiene el cuerpo erguido contra la gravedad. Responsable de la extensión de la columna vertebral.' },

  { id:'c2b', tema:'cadenas', tipo:'simple',
    q:'¿Qué otras dos estructuras completan el sistema longitudinal profundo hacia abajo?',
    a:['Gastrocnemio y fascia plantar'],
    dist:['Tibial anterior y fascia lata','Sóleo y peroneo largo','Glúteo medio y TFL'],
    porque:'La cadena llega literalmente hasta la planta del pie: por eso un pie rígido puede manifestarse como una espalda que no se extiende.' },

  { id:'c3', tema:'cadenas', tipo:'lista',
    q:'CADENA 3 — Sistema OBLICUO POSTERIOR: ¿qué músculos lo forman?',
    a:['Dorsal ancho','Glúteo mayor contralateral'],
    porque:'Genera extensión y rotación trabajando en contralateral. Compensa a la cadena oblicua anterior, que es la que inicia la flexión.' },

  { id:'c4', tema:'cadenas', tipo:'lista',
    q:'CADENA 4 — Sistema LATERAL: ¿qué músculos lo forman?',
    a:['Glúteo medio','Glúteo menor','Aductores','Cuadrado lumbar'],
    noDist:['Aductores contralaterales'],
    porque:'Es la cadena del plano FRONTAL: equilibra las fuerzas de la pelvis sobre los fémures al caminar y estar de pie. Su fallo se ve como caída de pelvis (Trendelenburg).' },

  { id:'c5', tema:'cadenas', tipo:'simple',
    q:'¿Qué hace el sistema lateral con la pelvis?',
    a:['Produce la aducción y abducción de las caderas y oblicua la pelvis arriba y abajo.'],
    dist:['Produce la flexión y extensión de la columna.',
          'Genera la rotación del tronco junto con el serrato anterior.',
          'Mantiene la escápula pegada a la caja torácica.'] },

  /* ---------- TRONCO ---------- */
  { id:'t1', tema:'tronco', tipo:'simple',
    q:'¿Cuál es el músculo PRINCIPAL de la respiración?',
    a:['El diafragma'],
    dist:['Los escalenos','El transverso del abdomen','Los intercostales externos'] },

  { id:'t2', tema:'tronco', tipo:'lista',
    q:'¿Cuáles son los músculos ACCESORIOS de la respiración?',
    a:['Intercostales internos y externos','Serrato posterior superior e inferior','Escalenos','Trapecio superior'],
    noDist:['Recto abdominal','Oblicuo interno','Oblicuo externo','Transverso del abdomen','Transverso del abdomen (TvA)'],
    porque:'Cuando el diafragma no hace su trabajo, los accesorios toman el mando: de ahí el cuello y los trapecios tensos del alumno que respira mal.' },

  { id:'t3', tema:'tronco', tipo:'lista',
    q:'Los 3 tipos de respiración que se trabajan',
    a:['Diafragmática','Lateral / costal','Pulmonar'],
    dist:['Paradójica','Clavicular','Apneica'] },

  { id:'t4', tema:'tronco', tipo:'lista',
    q:'¿Qué músculos forman la UNIDAD INTERNA?',
    a:['Diafragma','Espinal (multífidos)','Transverso del abdomen (TvA)','Suelo pélvico (SP)'],
    noDist:['Multífidos'],
    porque:'Los cuatro forman una caja: techo (diafragma), piso (suelo pélvico), pared anterior (TvA) y pared posterior (multífidos). Se activan antes que el movimiento, no durante.' },

  { id:'t5', tema:'tronco', tipo:'lista',
    q:'¿Quién dobla el torso? (flexión de tronco)',
    a:['Oblicuo interno','Oblicuo externo','Recto abdominal'] },

  { id:'t6', tema:'tronco', tipo:'lista',
    q:'¿Quién estira la columna? (extensión)',
    a:['Iliocostal','Espinal','Erectores de la espina'],
    noDist:['Multífidos','Cuadrado lumbar'] },

  /* ---------- MMII ---------- */
  { id:'i1', tema:'mmii', tipo:'lista',
    q:'¿Quiénes CIERRAN las piernas? (aductores)',
    a:['Pectíneo','Aductor largo','Aductor corto','Aductor mayor','Grácil'],
    noDist:['Obturador externo','Cuadrado femoral','Glúteo mayor'],
    porque:'Los aductores no solo cierran: participan en la cadena oblicua anterior y en el sistema lateral, por eso son clave en la estabilidad de la pelvis al caminar.' },

  { id:'i2', tema:'mmii', tipo:'lista',
    q:'¿Quién EXTIENDE la cadera? (la "pata de cabra" / isquiotibiales)',
    a:['Semimembranoso','Semitendinoso','Bíceps femoral'],
    noDist:['Glúteo mayor','Aductor mayor','Glúteo medio'],
    porque:'El bíceps femoral además forma parte del sistema longitudinal profundo, conectando la pelvis con la pierna a través del ligamento sacrotuberoso.' },

  { id:'i3', tema:'mmii', tipo:'lista',
    q:'¿Quién DOBLA / flexiona la rodilla?',
    a:['Sartorio','Grácil','Semitendinoso','Bíceps femoral'],
    noDist:['Semimembranoso','Gastrocnemio','Gastrocnemio — trabaja con la rodilla EXTENDIDA'] },

  { id:'i4', tema:'mmii', tipo:'lista',
    q:'¿Quién EXTIENDE la rodilla?',
    a:['Recto femoral','Vasto lateral','Vasto medial','Vasto intermedio'],
    noDist:['TFL','Tensor de la fascia lata (TFL)','Cuádriceps femoral (recto femoral)'],
    porque:'El recto femoral es el único de los cuatro que cruza también la cadera: por eso además flexiona cadera y se acorta en la lordosis.' },

  { id:'i5', tema:'mmii', tipo:'lista',
    q:'¿Quién lleva la punta del pie hacia arriba? (dorsiflexión)',
    a:['Tibial anterior','Extensor largo de los dedos','Extensor largo del dedo gordo'],
    noDist:['Peroneo anterior'] },

  { id:'i6', tema:'mmii', tipo:'lista',
    q:'¿Quién hace puntillas? (flexión plantar)',
    a:['Gastrocnemio — trabaja con la rodilla EXTENDIDA','Sóleo — trabaja con la rodilla FLEXIONADA'],
    noDist:['Tibial posterior','Peroneo largo','Peroneo corto'],
    porque:'El gastrocnemio cruza la rodilla; si la rodilla está flexionada queda acortado y no puede generar fuerza. Por eso se aísla el sóleo flexionando la rodilla.' },

  { id:'i7', tema:'mmii', tipo:'lista',
    q:'¿Quién gira el pie hacia ADENTRO? (inversión)',
    a:['Tibial anterior','Tibial posterior'],
    noDist:['Extensor largo del dedo gordo'] },

  { id:'i8', tema:'mmii', tipo:'lista',
    q:'¿Quién gira el pie hacia AFUERA? (eversión)',
    a:['Peroneo largo','Peroneo corto','Peroneo anterior'],
    noDist:['Extensor largo de los dedos'] },

  { id:'i9', tema:'mmii', tipo:'lista',
    q:'¿Quiénes son los ROTADORES de cadera que estabilizan y sostienen la pelvis? (rotadores laterales)',
    a:['Cuadrado femoral','Obturador externo','Obturador interno','Piriforme','Gemelos superior e inferior'],
    noDist:['Glúteo mayor','Sartorio','Psoas mayor','Glúteo medio','Ilíaco','Bíceps femoral'],
    porque:'Son los profundos de la cadera: el equivalente al manguito rotador del hombro. Estabilizan la cabeza femoral dentro del acetábulo.' },

  { id:'i10', tema:'mmii', tipo:'lista',
    q:'¿Quién hace el movimiento LATERAL de cadera y muslo? ¿Quién ABRE las piernas?',
    a:['Tensor de la fascia lata (TFL)','Glúteo medio','Glúteo menor','Glúteo mayor'],
    noDist:['Piriforme','Sartorio'],
    porque:'Glúteo medio y menor son el motor del sistema lateral: su debilidad hace que la pelvis caiga del lado contrario al apoyo.' },

  { id:'i11', tema:'mmii', tipo:'lista',
    q:'¿Quién DOBLA la cadera? ¿Quién lleva la rodilla al pecho? ¿Quién eleva la pierna estirada?',
    a:['Psoas mayor','Ilíaco','Sartorio','Cuádriceps femoral (recto femoral)'],
    noDist:['Recto femoral','Tensor de la fascia lata (TFL)','TFL','Pectíneo','Aductor largo','Aductor corto','Grácil'],
    porque:'El psoas nace en las vértebras lumbares: si está acortado tira la lumbar hacia adelante y genera lordosis.' },

  /* ---------- MMSS ---------- */
  { id:'s1', tema:'mmss', tipo:'lista',
    q:'¿Por qué músculos está compuesto el MANGUITO ROTADOR y qué hace cada uno?',
    a:['Subescapular — rotación medial','Infraespinoso — rotación lateral','Redondo menor — rotación lateral','Supraespinoso — abducción de hombro'],
    porque:'Su función real es centrar la cabeza humeral en la glena. Sin ellos, el deltoides luxaría el hombro hacia arriba en cada elevación.' },

  { id:'s2', tema:'mmss', tipo:'lista',
    q:'¿Quiénes son los responsables de SOSTENER las escápulas en cada movimiento del hombro?',
    a:['Pectoral menor','Serrato anterior'],
    noDist:['Trapecio superior, medio e inferior','Romboides','Elevador de la escápula'],
    porque:'El serrato anterior mantiene la escápula pegada a la caja torácica: su fallo produce la escápula alada.' },

  { id:'s3', tema:'mmss', tipo:'lista',
    q:'¿Qué músculos RETRAEN, ROTAN y ELEVAN la cintura escapular?',
    a:['Elevador de la escápula','Romboides','Trapecio superior, medio e inferior'],
    noDist:['Serrato anterior','Pectoral menor'] },

  { id:'s4', tema:'mmss', tipo:'lista',
    q:'¿Qué músculos APRIETAN la parte superior del cuerpo hacia afuera? (los grandes motores)',
    a:['Pectoral mayor','Deltoides','Dorsal ancho'],
    porque:'Son los movilizadores potentes. El dorsal ancho además cierra la cadena oblicua posterior con el glúteo mayor contralateral.' },

  { id:'s5', tema:'mmss', tipo:'lista',
    q:'¿Cuáles son los músculos diseñados para PRECISIÓN, destreza y tareas complejas? (motora fina)',
    a:['Braquial','Braquiorradial','Bíceps braquial','Tríceps braquial','Coracobraquial'] },

  /* ---------- REPERTORIO ---------- */
  { id:'r1', tema:'repertorio', tipo:'lista', distPool:'repertorio',
    q:'¿Qué ejercicios se usan como CALENTAMIENTO?',
    a:['Hundred prep','Hundred'] },

  { id:'r2', tema:'repertorio', tipo:'simple',
    q:'¿Para qué sirve el HUNDRED? (dos objetivos)',
    a:['Estabiliza el tronco y la espalda baja. Enseña a levantar la cabeza desde el abdomen.'],
    dist:['Moviliza la columna en extensión. Estira la cadena anterior.',
          'Trabaja la rotación del tronco. Fortalece el sistema lateral.',
          'Estira los isquiotibiales. Trabaja la estabilidad escapular.'],
    porque:'Es la puerta de entrada del repertorio: si la cabeza sube desde el cuello y no desde el abdomen, todo lo que viene después se construye sobre una compensación.' },

  { id:'r3', tema:'repertorio', tipo:'lista', distPool:'repertorio',
    q:'Ejercicios que MOVILIZAN tórax o columna (nombra al menos 6)',
    a:['Hundred prep','Roll up','Rolling like a ball','Spine stretch forward (elongación axial)','Saw','Spine stretch side','Single leg kicks','Seal','Roll over','Corkscrew','Neck pull','Jackknife'] },

  { id:'r4', tema:'repertorio', tipo:'lista', distPool:'repertorio',
    q:'Ejercicios de TRABAJO DE ABDOMEN / flexión de tronco (nombra al menos 8)',
    a:['Hundred prep','Hundred','Roll up','Rolling like a ball','Single leg stretch','Double leg stretch','Single straight leg stretch','Double straight leg stretch','Criss cross','Teaser family','Hip circle','Roll over','Neck pull','Jackknife','Scissors','Bicycle','Boomerang','Rocking'],
    porque:'Todos comparten flexión de tronco y cadena oblicua anterior/posterior — y por eso todos caen en la lista de contraindicados en osteoporosis.' },

  { id:'r5', tema:'repertorio', tipo:'lista', distPool:'repertorio',
    q:'Ejercicios de TRABAJO DE PIERNA Y PIES',
    a:['Single straight leg stretch (estira isquiotibiales)','Single leg kicks','Double leg kicks','Side leg lifts','Side leg circles','Single leg circles','Teaser family'] },

  { id:'r6', tema:'repertorio', tipo:'lista', distPool:'repertorio',
    q:'Ejercicios de ESTABILIDAD ESCAPULAR (nombra al menos 6)',
    a:['Single leg circles','Rolling like a ball','Saw','Open leg rocker','Swan','Single leg kicks','Seal','Push up','Hip circles','Roll over','Mod corkscrew','Corkscrew','Jackknife'] },

  { id:'r7', tema:'repertorio', tipo:'lista', distPool:'repertorio',
    q:'Ejercicios de TRABAJO DE HOMBROS / miembro superior',
    a:['Spine stretch forward (movilidad escapular)','Saw','Double leg kicks (estira pecho / parte anterior)','Seal','Push up','Jackknife'] },

  { id:'r8', tema:'repertorio', tipo:'lista', distPool:'repertorio',
    q:'Ejercicios de FLEXIÓN y movilidad de CADERAS (nombra al menos 6)',
    a:['Single leg circles','Double straight leg stretch (flexores de cadera)','Side leg kicks','Side leg circles','Side leg lifts','Side leg bananas','Mod corkscrew','Scissors (flexores de cadera)','Bicycle','Boomerang'] },

  { id:'r9', tema:'repertorio', tipo:'lista', distPool:'repertorio',
    q:'Ejercicios de TRABAJO DE ROTACIÓN',
    a:['Criss cross','Saw','Spine twist','Hip circles','Mod corkscrew','Corkscrew'] },

  { id:'r10', tema:'repertorio', tipo:'lista', distPool:'repertorio',
    q:'Ejercicios de la CADENA / SISTEMA LATERAL',
    a:['Side leg lifts','Side leg circles','Side leg kicks','Side leg bananas','Kneeling side family (kicks)','Seated twist','Side bend twist','Side bend mermaid'] },

  { id:'r11', tema:'repertorio', tipo:'lista', distPool:'repertorio',
    q:'Ejercicios de MOVIMIENTO DE TODO EL CUERPO',
    a:['Push ups','Open leg rocker','Leg pull down (estabilidad escapular y lumbar)','Leg pull up (extensores de cadera)','Spine twist','Side bend mermaid','Knee stretch knees off'] },

  /* ---------- OSTEOPOROSIS ---------- */
  { id:'o1', tema:'osteo', tipo:'simple',
    q:'¿Qué es la osteoporosis?',
    a:['Una enfermedad que se caracteriza por baja densidad ósea, que lleva a fragilidad de los huesos y alta susceptibilidad a fracturas (sobre todo de cadera).'],
    dist:['Una desviación lateral de la columna que aparece en la adolescencia.',
          'Una inflamación de las articulaciones por desgaste del cartílago.',
          'Una pérdida de masa muscular asociada a la edad.'] },

  { id:'o2', tema:'osteo', tipo:'simple',
    q:'¿Por qué se le llama "la enfermedad silenciosa"?',
    a:['Porque no da síntomas hasta que ocurre la fractura.'],
    dist:['Porque solo afecta a personas sedentarias.','Porque aparece únicamente después de los 80 años.','Porque la densitometría no puede detectarla.'],
    porque:'Esto es lo que justifica el tamizaje con densitometría: sin prueba, el primer signo clínico suele ser ya un hueso roto.' },

  { id:'o3', tema:'osteo', tipo:'lista',
    q:'¿Qué tres cosas indica la prueba de densidad ósea (densitometría)?',
    a:['Detecta la osteoporosis antes de que ocurra una fractura',
       'Predice la probabilidad de fractura',
       'Monitorea el rango de la pérdida ósea y el avance de los tratamientos'],
    dist:['Mide la fuerza muscular del cliente','Diagnostica la escoliosis','Indica qué ejercicios hacer'] },

  { id:'o4', tema:'osteo', tipo:'simple',
    q:'¿Qué mide el T-score?',
    a:['La relación de la masa ósea del paciente con la masa normal del hueso de un adulto joven.'],
    dist:['La fuerza muscular comparada con la de un adulto joven.',
          'El riesgo de caídas según la edad.',
          'La masa ósea comparada con la de otra persona de la misma edad.'] },

  { id:'o5', tema:'osteo', tipo:'simple',
    q:'T-score de −1 a −2,5: ¿qué indica?',
    a:['Una pérdida del 10 % al 25 % del hueso. Es la OSTEOPENIA (la más común).'],
    dist:['Una pérdida del 25 % al 30 %: osteoporosis.','Densidad normal, sin pérdida.','Una pérdida menor al 5 %: sin riesgo.'] },

  { id:'o6', tema:'osteo', tipo:'simple',
    q:'T-score mayor a −2,5: ¿qué indica?',
    a:['Pérdida del 25 % al 30 % del hueso: OSTEOPOROSIS.'],
    dist:['Pérdida del 10 % al 25 %: osteopenia.','Densidad normal, sin pérdida.','Pérdida del 50 %: fractura segura.'] },

  { id:'o7', tema:'osteo', tipo:'simple',
    q:'¿Cuál es la distribución por sexo de la osteoporosis?',
    a:['80 % en mujeres y 20 % en hombres.'],
    dist:['50 % en mujeres y 50 % en hombres.','20 % en mujeres y 80 % en hombres.','95 % en mujeres y 5 % en hombres.'] },

  { id:'o8', tema:'osteo', tipo:'lista',
    q:'¿Cuáles son las consecuencias de la osteoporosis?',
    a:['Caída → fractura y colapso vertebral',
       'Dolor de espalda severo',
       'Pérdida de estatura',
       'Deformidad de la columna vertebral: cifosis ("joroba")'],
    dist:['Aumento de la masa muscular','Mayor flexibilidad articular','Escoliosis en la infancia'],
    porque:'El colapso vertebral es por compresión anterior del cuerpo vertebral — exactamente la carga que produce la flexión de columna. De ahí la lista de ejercicios prohibidos.' },

  { id:'o9', tema:'osteo', tipo:'lista',
    q:'¿Cómo se PREVIENE la osteoporosis?',
    a:['Dieta balanceada (calcio y vitamina D)','Ejercicio con peso','Estilo de vida saludable','Densitometría regular','Suplementos','Exámenes de laboratorio'],
    dist:['Reposo prolongado','Evitar toda carga sobre el hueso','Ejercicios solo en flexión'] },

  { id:'o10', tema:'osteo', tipo:'simple',
    q:'¿Qué dice la LEY DE WOLFF?',
    a:['Los huesos se fortalecen ante el incremento del estrés. Por lo tanto, para construir hueso hay que retar al cliente y trabajar más fuerte.'],
    dist:['Los huesos se debilitan ante el estrés, por eso hay que evitar cargarlos.',
          'Los huesos solo se fortalecen con calcio, no con ejercicio.',
          'Los músculos crecen en proporción al hueso que los sostiene.'],
    porque:'Es la razón por la que a un cliente con osteoporosis NO se le da un programa suave: se le da carga, pero en extensión y en cadena cerrada, nunca en flexión de columna.' },

  { id:'o11', tema:'osteo', tipo:'simple',
    q:'¿Cuál es el criterio general de qué NO hacer con osteoporosis?',
    a:['Todo lo que sea FLEXIÓN de columna vertebral.'],
    dist:['Todo lo que sea EXTENSIÓN de columna vertebral.','Todo trabajo en posición lateral.','Todo ejercicio con carga de peso.'],
    porque:'La flexión concentra la carga en la parte anterior del cuerpo vertebral, justo donde el hueso osteoporótico colapsa. Extensión, rotación controlada y trabajo lateral sí se permiten.' },

  { id:'o12', tema:'osteo', tipo:'lista', distPool:'osteoNo',
    q:'¿Qué SÍ se puede hacer con osteoporosis? (nombra al menos 6)',
    a:['Single leg circles','Swan','Single leg kicks','Double leg kicks','Swimming','Family de los Side','Spine twist','Leg pull up y down','Mod corkscrew','Kneeling side','Side bend mermaid','Swan dive','Swan rocking'] },

  /* ---------- EMBARAZO ---------- */
  /* sinBanco: no se ofrecen distractores porque ofrecer un ejercicio como
     "no está en la lista" podría sugerir que es seguro en el embarazo, y
     los apuntes no dicen eso. */
  { id:'e1', tema:'embarazo', tipo:'lista', sinBanco:true,
    q:'¿Qué ejercicios requieren CUIDADO o están contraindicados en el embarazo?',
    a:['Leg pull down','Kneeling side','Hundred','Spine twist','Double straight leg stretch'] },

  /* ---------- POSTURA ---------- */
  { id:'po1', tema:'postura', tipo:'simple',
    q:'¿Cuántos niveles de observación postural hay y cuáles son?',
    a:['3 niveles: global, planar y local.'],
    dist:['2 niveles: anterior y posterior.','4 niveles: cabeza, tronco, pelvis y pies.','3 niveles: frontal, lateral y posterior.'] },

  { id:'po2', tema:'postura', tipo:'lista',
    q:'Observación VERTICAL frontal — ¿qué puntos del TORSO se alinean?',
    a:['Nariz','Centro del esternón','Ombligo','Centro del pubis'] },

  { id:'po3', tema:'postura', tipo:'lista',
    q:'Observación VERTICAL frontal — ¿qué puntos de las PIERNAS se revisan?',
    a:['EIAS (espinas ilíacas anterosuperiores)','Centro de la rodilla / rótula','Centro del tobillo','Espacio entre los pies'],
    noDist:['Nivel de las EIAS'] },

  { id:'po4', tema:'postura', tipo:'lista',
    q:'Observación LATERAL — ¿qué puntos forman la plomada?',
    a:['Lóbulo de la oreja','Parte superior del hombro','Centro de la caja torácica','Cresta ilíaca','Articulación de la cadera','Delante de la rodilla','Delante del tobillo'] },

  { id:'po5', tema:'postura', tipo:'lista',
    q:'Observación VERTICAL de espalda — ¿qué puntos se alinean?',
    a:['Centro del cráneo','Espina dorsal recta','Centro del sacro / coxis','Centro del pliegue glúteo','Centro de la fosa poplítea','Centro del tendón de Aquiles'] },

  { id:'po6', tema:'postura', tipo:'lista',
    q:'Observación HORIZONTAL posterior — ¿qué niveles se comparan?',
    a:['Nivel de los ojos','Escápulas niveladas','Distancia equitativa entre la espina y las escápulas','Nivel de las EIAS','Nivel de las crestas ilíacas','Nivel de los trocánteres','Nivel de las rodillas'],
    noDist:['EIAS'] },

  { id:'po7', tema:'postura', tipo:'simple',
    q:'¿Qué puntos nos indican una PELVIS NEUTRA?',
    a:['Las EIAS y el hueso púbico en el mismo plano.'],
    dist:['Los trocánteres y las rodillas al mismo nivel.','El sacro y el coxis en línea vertical.','Las crestas ilíacas y los hombros al mismo nivel.'] },

  { id:'po8', tema:'postura', tipo:'simple',
    q:'ESCOLIOSIS: ¿qué es?',
    a:['Desviación lateral de la espina dorsal.'],
    dist:['Curva hacia el frente de la columna.','Curva hacia posterior de la columna.','Rotación de la pelvis hacia adelante.'] },

  { id:'po9', tema:'postura', tipo:'simple',
    q:'LORDOSIS: ¿qué es y qué la acompaña?',
    a:['Curva hacia el frente. Se acompaña de pelvis inclinada hacia adelante, abdomen débil y flexores de cadera apretados.'],
    dist:['Curva hacia posterior, con pectorales apretados.','Desviación lateral de la espina dorsal.','Curva hacia el frente, con abdomen fuerte y flexores de cadera elongados.'],
    porque:'El psoas acortado tira de las lumbares hacia adelante mientras el abdomen no sostiene: el resultado es la pelvis en anteversión.' },

  { id:'po10', tema:'postura', tipo:'simple',
    q:'CIFOSIS: ¿qué es y qué la acompaña?',
    a:['Curva hacia posterior. Se acompaña de extensores torácicos débiles y músculos frontales (pectorales) apretados.'],
    dist:['Curva hacia el frente, con abdomen débil.','Desviación lateral de la espina dorsal.','Curva hacia posterior, con extensores torácicos fuertes y pectorales elongados.'] },

  { id:'po11', tema:'postura', tipo:'simple',
    q:'¿Qué tres factores del cliente se toman en cuenta al diseñar un programa?',
    a:['El estado físico actual, la edad y el estilo de aprendizaje.'],
    dist:['La altura, el peso y el calzado.','La edad, el sexo y la profesión.','El estado físico actual, la edad y la dieta.'] },

  { id:'po12', tema:'postura', tipo:'simple',
    q:'¿Cuál es la regla 80/20 en el diseño de un programa?',
    a:['80 % afinar o reforzar las habilidades que el cliente ya tiene, 20 % desafíos y desarrollo de nuevas habilidades.'],
    dist:['50 % reforzar y 50 % desafíos nuevos.','20 % reforzar y 80 % desafíos nuevos.','100 % desafíos nuevos en cada clase.'],
    porque:'Es exactamente el principio de la "dificultad deseable": suficiente reto para forzar adaptación, sin tanto que el patrón se rompa. Vale igual para entrenar un cuerpo que para estudiar.' },

  /* ---------- PROGRESIONES ---------- */
  { id:'g1', tema:'progresion', tipo:'lista',
    q:'UNIDAD INTERNA — ejercicios de activación',
    a:['Pelvic clock','Finger tips','All four abdominales','Floor back bridging','Standing multifidi','Single leg multifidi','Neutral squats'] },

  { id:'g2', tema:'progresion', tipo:'lista',
    q:'ESTABILIDAD LUMBOPÉLVICA — progresión en SUPINO',
    a:['1. Marching','2. Toe taps','3. Diagonal press','4. Dead bug','5. Bridge marching'],
    porque:'La progresión va de menos a más grados de libertad: primero una pierna con apoyo, luego sin apoyo, luego brazo y pierna a la vez.' },

  { id:'g3', tema:'progresion', tipo:'lista',
    q:'ESTABILIDAD LUMBOPÉLVICA — progresión en PRONO',
    a:['6. Swimming prep','7. Swimming'] },

  { id:'g4', tema:'progresion', tipo:'lista',
    q:'ESTABILIDAD LUMBOPÉLVICA — progresión en 4 PUNTOS',
    a:['8. Opposite arm and leg reach prep','9. Opposite leg reach prep','10. Opposite arm and leg completo'] },

  { id:'g5', tema:'progresion', tipo:'lista',
    q:'ESTABILIDAD LUMBOPÉLVICA — progresión DE PIE',
    a:['11. Standing diagonal press','12. Standing march','13. Walking'],
    porque:'La secuencia completa es supino → prono → 4 puntos → de pie: se va reduciendo la base de sustentación y aumentando la demanda antigravitatoria.' },

  { id:'g6', tema:'progresion', tipo:'lista',
    q:'MOVILIDAD ESPINAL en SUPINO',
    a:['Cat / Cow','Tail wag','Abdominal curls','Oblique abdominal'] },

  { id:'g7', tema:'progresion', tipo:'lista',
    q:'MOVILIDAD ESPINAL — extensión, flexión y flexión lateral sentado',
    a:['Extensión: Rockets, Mini swan','Flexión lateral: Seated side stretch, Seated twist'] },

  { id:'g8', tema:'progresion', tipo:'lista',
    q:'MOVILIDAD ESPINAL en BÍPEDA',
    a:['Standing roll down','Standing flexion','Standing extension','Standing lateral flexion','Standing full body rotation'] },

  { id:'g9', tema:'progresion', tipo:'lista',
    q:'FUERZA parte inferior — progresión de FLEXIÓN DE CADERA',
    a:['1. Marching supine','2. Marching seated','3. Marching standing'] },

  { id:'g10', tema:'progresion', tipo:'lista',
    q:'FUERZA parte inferior — progresión de EXTENSIÓN DE CADERA',
    a:['1. Prone hip extension','2. All fours','3. Standing'] },

  { id:'g11', tema:'progresion', tipo:'simple',
    q:'FUERZA parte inferior — ¿qué familia trabaja la ABD de cadera?',
    a:['La Sides family'],
    dist:['La Teaser family','Los Marching','La Swimming family'] }
];

/* ------------------------------------------------------------
   REVISIÓN DE DISTRACTORES
   Elementos que nunca deben ofrecerse como "incorrectos" en cada
   tarjeta, porque la anatomía (o la ambigüedad del nombre) los
   haría defendibles como correctos. Castigar un conocimiento
   verdadero enseña lo contrario de lo que se busca.
------------------------------------------------------------ */
const EXCLUSIONES = {
  i2:  ['Piriforme'],                                        // asiste la extensión de cadera
  i3:  ['Gemelos superior e inferior',                       // "gemelos" = gastrocnemio en el habla común
        'Tensor de la fascia lata (TFL)'],                   // actúa sobre la rodilla vía cintilla iliotibial
  i4:  ['Glúteo mayor'],                                     // estabiliza la rodilla en extensión vía cintilla
  i6:  ['Gemelos superior e inferior'],                      // "gemelos" = gastrocnemio en el habla común
  i7:  ['Gastrocnemio', 'Sóleo'],                            // el tríceps sural también invierte la subastragalina
  i9:  ['Aductor largo', 'Aductor corto', 'Aductor mayor', 'Pectíneo'],  // descritos como rotadores laterales en varios textos
  i10: ['Gemelos superior e inferior', 'Obturador interno'], // abducen la cadera flexionada
  i11: ['Glúteo medio', 'Glúteo menor'],                     // fibras anteriores asisten la flexión
  s2:  ['Dorsal ancho'],                                     // sujeta el ángulo inferior de la escápula
  s3:  ['Dorsal ancho'],                                     // deprime y retrae la cintura escapular
  po2: ['Centro de la caja torácica', 'Centro del cráneo'],  // también caen sobre la línea media frontal
  po3: ['Nivel de las rodillas', 'Nivel de los trocánteres'],
  po4: ['Nivel de los trocánteres'],                         // la plomada lateral pasa por el trocánter mayor
  po5: ['Nivel de los ojos', 'Escápulas niveladas', 'Distancia equitativa entre la espina y las escápulas',
        'Nivel de las EIAS', 'Nivel de las crestas ilíacas', 'Nivel de los trocánteres', 'Nivel de las rodillas'],
  g2:  ['Marching supine'],                                  // casi sinónimo de "Marching"
  g4:  ['All fours', 'All four abdominales', 'Cat / Cow'],   // también se hacen en 4 puntos
  g5:  ['Marching standing'],                                // casi sinónimo de "Standing march"
  g8:  ['Standing'],
  g9:  ['Marching', 'Standing march', 'Bridge marching'],    // casi sinónimos de los de la lista
  g10: ['Standing extension', 'All four abdominales']
};
for (const [id, xs] of Object.entries(EXCLUSIONES)) {
  const c = CARDS.find(c => c.id === id);
  if (c) c.noDist = [...(c.noDist || []), ...xs];
}

/* ------------------------------------------------------------
   OPCIÓN MÚLTIPLE SIN PISTAS DE FORMATO
   La respuesta completa (la de flashcards y apuntes) es más larga y
   detallada que cualquier distractor: la longitud delataba la correcta
   en la mitad de las preguntas. Para la opción múltiple se usa una
   versión corta (`op`) y distractores de la MISMA forma, que cambian un
   solo dato clave. Así hay que saber cuál es, no adivinar por el formato.
------------------------------------------------------------ */
const OPCIONES = {
  h1: { op: 'Un sistema de acondicionamiento físico creado por Joseph Pilates',
        dist: ['Un sistema de rehabilitación postural creado por Clara Pilates',
               'Un método de entrenamiento de danza creado para el ballet',
               'Un sistema de estiramientos pasivos derivado del yoga clásico'] },
  h6: { op: 'Detenido en la Isla de Man, trabajó como enfermero e inició el sistema',
        dist: ['Detenido en Londres, trabajó como boxeador e inició el sistema',
               'Detenido en la Isla de Man, trabajó como cocinero y enseñó gimnasia',
               'Estudió enfermería en Inglaterra y allí publicó su primer libro'] },
  h7: { op: 'Llega a Nueva York con Clara y abre su estudio',
        dist: ['Llega a Nueva York solo y entra al New York City Ballet',
               'Vuelve a Alemania con Clara y abre su primer estudio',
               'Llega a Inglaterra con Clara y abre su estudio'] },
  h8: { op: '1967: fallece Joseph. 1977: fallece Clara',
        dist: ['1967: fallece Clara. 1977: fallece Joseph',
               '1967: se quema el estudio. 1977: fallece Joseph',
               '1967: fallece Joseph. 1977: cierra el estudio'] },
  p1: { op: 'Columna y miembros superiores e inferiores, en los tres planos',
        dist: ['Columna y miembros inferiores, solo en el plano sagital',
               'Columna y miembros superiores e inferiores, solo en el plano sagital',
               'Tronco y miembros superiores, en los planos frontal y transversal'] },
  c0: { op: 'Integración del tronco, unidad externa',
        dist: ['Integración del tronco, unidad interna',
               'Movimiento de todo el cuerpo, unidad interna',
               'Movilidad y recuperación, unidad externa'] },
  c5: { op: 'Abduce y aduce las caderas, y eleva o baja la pelvis',
        dist: ['Flexiona y extiende las caderas, y eleva o baja la pelvis',
               'Abduce y aduce las caderas, y rota la pelvis',
               'Rota las caderas y lleva la pelvis hacia adelante'] },
  r2: { op: 'Estabiliza el tronco y enseña a subir la cabeza desde el abdomen',
        dist: ['Estabiliza el tronco y enseña a subir la cabeza desde el cuello',
               'Moviliza la columna y enseña a subir la cabeza desde el abdomen',
               'Estira los isquiotibiales y enseña la respiración lateral costal'] },
  o1: { op: 'Baja densidad ósea: hueso frágil y alto riesgo de fractura',
        dist: ['Baja masa muscular: hueso frágil y alto riesgo de caídas',
               'Desgaste del cartílago: dolor y rigidez en las articulaciones',
               'Desviación lateral de la columna que aparece en la adolescencia'] },
  o4: { op: 'La masa ósea comparada con la de un adulto joven',
        dist: ['La masa ósea comparada con la de alguien de su misma edad',
               'La masa muscular comparada con la de un adulto joven',
               'El riesgo de fractura comparado con el de un adulto joven'] },
  o5: { op: 'Pérdida del 10 al 25 %: osteopenia',
        dist: ['Pérdida del 25 al 30 %: osteoporosis', 'Pérdida del 10 al 25 %: osteoporosis', 'Pérdida del 25 al 30 %: osteopenia'] },
  o6: { op: 'Pérdida del 25 al 30 %: osteoporosis',
        dist: ['Pérdida del 10 al 25 %: osteopenia', 'Pérdida del 10 al 25 %: osteoporosis', 'Pérdida del 25 al 30 %: osteopenia'] },
  o10: { op: 'El hueso se fortalece cuando aumenta la carga',
         dist: ['El hueso se debilita cuando aumenta la carga',
                'El músculo se fortalece cuando aumenta la carga',
                'El hueso se fortalece con reposo y calcio'] },
  po9: { op: 'Curva hacia adelante, abdomen débil y flexores de cadera apretados',
         dist: ['Curva hacia adelante, abdomen fuerte y flexores de cadera elongados',
                'Curva hacia atrás, abdomen débil y flexores de cadera apretados',
                'Curva hacia atrás, extensores torácicos débiles y pectorales apretados'] },
  po10: { op: 'Curva hacia atrás, extensores torácicos débiles y pectorales apretados',
          dist: ['Curva hacia atrás, extensores torácicos fuertes y pectorales elongados',
                 'Curva hacia adelante, abdomen débil y flexores de cadera apretados',
                 'Desviación lateral, con un lado del tronco más corto'] },
  po11: { op: 'Estado físico actual, edad y estilo de aprendizaje',
          dist: ['Estado físico actual, edad y experiencia deportiva previa',
                 'Edad, peso, altura y nivel de actividad física',
                 'Estado físico actual, profesión y tipo de alimentación'] },
  po12: { op: '80 % reforzar lo que ya domina, 20 % desafíos nuevos',
          dist: ['20 % reforzar lo que ya domina, 80 % desafíos nuevos',
                 '50 % reforzar lo que ya domina, 50 % desafíos nuevos',
                 '80 % desafíos nuevos, 20 % reforzar lo que ya domina'] }
};
for (const [id, o] of Object.entries(OPCIONES)) {
  const c = CARDS.find(c => c.id === id);
  if (c) Object.assign(c, o);
}

/* Listas que necesitaban un distractor propio más: sin él se completaban
   con elementos de otro tipo (p. ej. "Asma" entre disciplinas deportivas). */
const DIST_EXTRA = {
  h5: ['Remo'], p0: ['Elongación axial'], p2: ['Estabilidad escapular'],
  o8: ['Aumento de la estatura'], o9: ['Evitar la exposición al sol']
};
for (const [id, xs] of Object.entries(DIST_EXTRA)) {
  const c = CARDS.find(c => c.id === id);
  if (c) c.dist = [...(c.dist || []), ...xs];
}
/* Los tipos de respiración no deben aparecer como distractores entre músculos. */
CARDS.find(c => c.id === 't3').noDonar = true;

/* ------------------------------------------------------------
   COMPLETAR (cloze) — se arrastra la palabra a su hueco.
   [corchetes] = respuesta. libre:true = los huecos admiten las
   respuestas en cualquier orden (p. ej. una enumeración).
   Los distractores se eligieron para que NUNCA sean correctos.
------------------------------------------------------------ */

const CLOZES = [
  { id:'z1', tema:'tronco', t:'El músculo principal de la respiración es el [diafragma].',
    dist:['escaleno','trapecio superior','transverso del abdomen'] },
  { id:'z2', tema:'tronco', libre:true,
    t:'La unidad interna la forman el diafragma, los multífidos, el [transverso del abdomen] y el [suelo pélvico].',
    dist:['recto abdominal','oblicuo externo','dorsal ancho'] },
  { id:'z3', tema:'mmii',
    t:'El [gastrocnemio] trabaja con la rodilla extendida y el [sóleo] con la rodilla flexionada.',
    dist:['tibial anterior','peroneo largo','vasto medial'],
    porque:'El gastrocnemio cruza la rodilla: con la rodilla flexionada queda acortado y no puede generar fuerza, así que el sóleo toma el trabajo.' },
  { id:'z4', tema:'mmii',
    t:'Los rotadores laterales profundos de la cadera incluyen el [piriforme] y los [obturadores].',
    dist:['vastos','tibiales','sóleo'] },
  { id:'z5', tema:'mmii', libre:true,
    t:'El [psoas mayor] y el [ilíaco] flexionan la cadera: llevan la rodilla al pecho.',
    dist:['semitendinoso','glúteo mayor','sóleo'] },
  { id:'z6', tema:'mmss',
    t:'El [supraespinoso] hace la abducción del hombro y el [subescapular], la rotación medial.',
    dist:['infraespinoso','redondo menor','romboides'] },
  { id:'z7', tema:'mmss', libre:true,
    t:'El [serrato anterior] y el [pectoral menor] sostienen la escápula en cada movimiento del hombro.',
    dist:['deltoides','bíceps braquial','braquiorradial'] },
  { id:'z8', tema:'cadenas',
    t:'El sistema oblicuo posterior une el [dorsal ancho] con el [glúteo mayor] contralateral.',
    dist:['serrato anterior','glúteo medio','cuadrado lumbar'] },
  { id:'z9', tema:'cadenas',
    t:'El sistema [lateral] equilibra la pelvis sobre los fémures al caminar y al estar de pie.',
    dist:['longitudinal profundo','oblicuo anterior','oblicuo posterior'] },
  { id:'z10', tema:'cadenas',
    t:'El sistema longitudinal profundo trabaja en el plano [sagital] y mantiene el cuerpo erguido contra la [gravedad].',
    dist:[['frontal','transversal'], ['rotación','inercia']] },
  { id:'z11', tema:'historia', t:'Joseph Pilates nació en [1883] en [Alemania].',
    dist:[['1926','1967'], ['Inglaterra','Austria']] },
  { id:'z12', tema:'historia', t:'En [1926] llegó a [Nueva York] con Clara y abrió su estudio.',
    dist:[['1883','1967'], ['Londres','Berlín']] },
  { id:'z13', tema:'historia', t:'Estuvo detenido en [la Isla de Man]; allí trabajó como [enfermero] e inició el sistema.',
    dist:[['Londres','Nueva York'], ['boxeador','bailarín']] },
  { id:'z14', tema:'principios', libre:true,
    t:'El método se enfoca en la [respiración], la [alineación] y los patrones de movimiento eficiente.',
    dist:['fuerza máxima','velocidad','resistencia'] },
  { id:'z15', tema:'principios',
    t:'La unidad [interna] da la estabilidad profunda; la unidad [externa] son las cadenas musculares.',
    dist:['anterior','posterior','lateral'] },
  { id:'z16', tema:'planos',
    t:'La flexión y la extensión ocurren en el plano [sagital]; la rotación, en el plano [transversal].',
    dist:['frontal','coronal'] },
  { id:'z17', tema:'osteo', t:'Un T-score entre −1 y −2,5 indica [osteopenia]; mayor a −2,5, [osteoporosis].',
    dist:['escoliosis','artrosis','cifosis'] },
  { id:'z18', tema:'osteo', t:'Según la ley de [Wolff], el hueso se fortalece ante el incremento del [estrés].',
    dist:[['Newton','Pilates'], ['reposo','calcio']] },
  { id:'z19', tema:'osteo', t:'El [80 %] de los casos de osteoporosis son mujeres y el [20 %], hombres.',
    dist:['50 %','30 %','70 %'] },
  { id:'z20', tema:'osteo', t:'Con osteoporosis se evita todo lo que sea [flexión] de columna.',
    dist:['extensión','elongación','estabilización'],
    porque:'La flexión concentra la carga en la parte anterior del cuerpo vertebral, donde el hueso osteoporótico colapsa.' },
  { id:'z21', tema:'postura', t:'La regla del programa es [80 %] afinar habilidades y [20 %] desafíos nuevos.',
    dist:['50 %','70 %','30 %'] },
  { id:'z22', tema:'postura', t:'La pelvis está neutra cuando las [EIAS] y el [hueso púbico] están en el mismo plano.',
    dist:['trocánteres','sacro','crestas ilíacas'] },
  { id:'z23', tema:'postura', t:'La lordosis se acompaña de abdomen [débil] y flexores de cadera [apretados].',
    dist:['fuerte','elongados','relajados'] },
  { id:'z24', tema:'repertorio', t:'El Hundred estabiliza el tronco y enseña a levantar la cabeza desde el [abdomen].',
    dist:['cuello','pecho','trapecio'] },
  { id:'z25', tema:'progresion', t:'La estabilidad lumbopélvica progresa de supino a prono, luego a [4 puntos] y al final [de pie].',
    dist:['sentado','decúbito lateral','invertido'] }
];

/* ------------------------------------------------------------
   EMPAREJAR — tocar pares. Cada conjunto se revisó para que
   ningún elemento de la izquierda pueda emparejarse, con verdad
   anatómica, con otro elemento de la derecha del mismo conjunto
   (p. ej. no se juntan "Sóleo" y "Peroneo largo" con "Flexión
   plantar", porque el peroneo también flexiona el tobillo).
------------------------------------------------------------ */

const PARES = [
  { id:'pr1', tema:'planos', q:'Uní cada plano con sus movimientos',
    pares:[['Sagital','Flexión y extensión'],['Frontal','Flexión lateral, ABD y ADD'],['Transversal','Rotación medial y lateral']] },
  { id:'pr2', tema:'cadenas', q:'Uní cada cadena con un músculo que la forma',
    pares:[['Oblicuo anterior','Serrato anterior'],['Longitudinal profundo','Ligamento sacrotuberoso'],['Oblicuo posterior','Dorsal ancho'],['Lateral','Glúteo medio']] },
  { id:'pr3', tema:'cadenas', q:'Uní cada cadena con su función',
    pares:[['Oblicuo anterior','Genera rotación y flexión'],['Longitudinal profundo','Mantiene el cuerpo erguido contra la gravedad'],['Oblicuo posterior','Extensión y rotación contralateral'],['Lateral','Equilibra la pelvis al caminar']] },
  { id:'pr4a', tema:'mmii', q:'Uní cada músculo con su acción',
    pares:[['Pectíneo','Aducción de cadera'],['Semimembranoso','Extensión de cadera'],['Glúteo medio','Abducción de cadera'],['Vasto medial','Extensión de rodilla']] },
  { id:'pr4b', tema:'mmii', q:'Uní cada músculo con su acción',
    pares:[['Recto femoral','Flexión de cadera'],['Piriforme','Rotación lateral de cadera'],['Tibial anterior','Dorsiflexión'],['Sóleo','Flexión plantar']] },
  { id:'pr4c', tema:'mmii', q:'Uní cada músculo con su acción',
    pares:[['Peroneo largo','Eversión'],['Tibial posterior','Inversión'],['Bíceps femoral','Flexión de rodilla'],['Vasto intermedio','Extensión de rodilla']] },
  { id:'pr5', tema:'mmss', q:'Uní cada músculo con su función',
    pares:[['Subescapular','Rotación medial del hombro'],['Infraespinoso','Rotación lateral del hombro'],['Supraespinoso','Abducción del hombro'],['Serrato anterior','Evita la escápula alada'],['Romboides','Retrae la escápula'],['Braquiorradial','Precisión y motora fina']] },
  { id:'pr6', tema:'tronco', q:'Uní cada músculo con su papel',
    pares:[['Diafragma','Principal de la respiración'],['Escalenos','Accesorio: eleva las primeras costillas'],['Recto abdominal','Flexión del tronco'],['Iliocostal','Extensión de la columna'],['Cuadrado lumbar','Eleva la pelvis de un lado']] },
  { id:'pr7', tema:'historia', q:'Uní cada dato con lo que pasó',
    pares:[['1883','Nace Joseph Pilates'],['1926','Llega a Nueva York con Clara'],['1967','Fallece Joseph Pilates'],['1977','Fallece Clara'],['Isla de Man','Inicia el sistema como enfermero']] },
  { id:'pr8', tema:'postura', q:'Uní cada término con su descripción',
    pares:[['Escoliosis','Desviación lateral de la columna'],['Lordosis','Curva hacia el frente, pelvis inclinada'],['Cifosis','Curva hacia posterior, pectorales apretados'],['Pelvis neutra','EIAS y pubis en el mismo plano']] },
  { id:'pr9', tema:'osteo', q:'Uní cada concepto con su significado',
    pares:[['T-score −1 a −2,5','Osteopenia'],['T-score mayor a −2,5','Osteoporosis'],['Ley de Wolff','El hueso se fortalece con el estrés'],['Densitometría','Detecta antes de la fractura'],['"Enfermedad silenciosa"','Sin síntomas hasta la fractura']] },
  /* Dinámico: se arma en cada repaso con pares que no admitan ambigüedad. */
  { id:'pr10', tema:'repertorio', q:'Uní cada ejercicio con un objetivo que trabaja (según tus apuntes)', dinamico:'repertorio' }
];

/* ------------------------------------------------------------
   CLASIFICAR — arrastrar cada ficha a su grupo.
   tambien: grupos adicionales que también se aceptan como
   correctos porque la anatomía lo respalda aunque los apuntes
   ubiquen el músculo en un solo grupo.
------------------------------------------------------------ */

const CLASIFICACIONES = [
  { id:'cl1', tema:'osteo', q:'Cliente con osteoporosis: ¿se puede, no se puede o va modificado?', dinamico:'osteo',
    porque:'El criterio general es evitar la flexión de columna: carga la parte anterior del cuerpo vertebral, donde el hueso osteoporótico colapsa.' },
  { id:'cl2', tema:'tronco', q:'¿Unidad interna o unidad externa?',
    grupos:{ 'Unidad interna':['Diafragma','Multífidos','Transverso del abdomen','Suelo pélvico'],
             'Unidad externa':['Serrato anterior','Dorsal ancho','Glúteo mayor','Erector de la columna','Bíceps femoral','Glúteo medio'] },
    porque:'La unidad interna estabiliza en profundidad y se activa antes del movimiento; la externa son las cadenas que lo producen.' },
  { id:'cl3', tema:'planos', q:'¿En qué plano ocurre cada movimiento?',
    grupos:{ 'Sagital':['Flexión','Extensión'], 'Frontal':['Flexión lateral','Abducción','Aducción'], 'Transversal':['Rotación medial','Rotación lateral'] } },
  { id:'cl4', tema:'cadenas', q:'¿A qué cadena pertenece cada estructura?',
    grupos:{ 'Oblicuo anterior':['Serrato anterior','Oblicuo interno'],
             'Longitudinal profundo':['Erector de la columna','Ligamento sacrotuberoso','Bíceps femoral','Fascia toracolumbar'],
             'Oblicuo posterior':['Dorsal ancho','Glúteo mayor'],
             'Lateral':['Glúteo medio','Glúteo menor'] } },
  { id:'cl5', tema:'mmii', q:'Clasificá por su acción sobre la cadera',
    grupos:{ 'Flexión':['Psoas mayor','Ilíaco','Recto femoral','Sartorio'],
             'Extensión':['Semimembranoso','Semitendinoso','Bíceps femoral'],
             'Aducción':['Pectíneo','Aductor largo','Aductor corto','Grácil'],
             'Abducción':['TFL','Glúteo medio','Glúteo menor'] },
    tambien:{ 'Pectíneo':['Flexión'], 'Aductor largo':['Flexión'], 'Aductor corto':['Flexión'], 'Grácil':['Flexión'],
              'TFL':['Flexión'], 'Sartorio':['Abducción'] } },
  { id:'cl6', tema:'mmii', q:'Clasificá por su acción sobre rodilla y tobillo',
    grupos:{ 'Extensión de rodilla':['Vasto lateral','Vasto medial','Vasto intermedio','Recto femoral'],
             'Flexión de rodilla':['Sartorio','Grácil','Semitendinoso','Bíceps femoral'],
             'Flexión plantar':['Gastrocnemio','Sóleo'],
             'Dorsiflexión':['Tibial anterior','Extensor largo de los dedos','Extensor largo del dedo gordo'] },
    tambien:{ 'Gastrocnemio':['Flexión de rodilla'] } },
  { id:'cl7', tema:'mmss', q:'Clasificá los músculos del miembro superior',
    grupos:{ 'Manguito rotador':['Subescapular','Infraespinoso','Redondo menor','Supraespinoso'],
             'Sostienen la escápula':['Pectoral menor','Serrato anterior'],
             'Mueven la cintura escapular':['Elevador de la escápula','Romboides','Trapecio'],
             'Precisión y motora fina':['Braquial','Braquiorradial','Bíceps braquial','Tríceps braquial','Coracobraquial'] },
    tambien:{ 'Serrato anterior':['Mueven la cintura escapular'], 'Pectoral menor':['Mueven la cintura escapular'],
              'Romboides':['Sostienen la escápula'], 'Trapecio':['Sostienen la escápula'] } },
  { id:'cl8', tema:'postura', q:'¿Qué rasgo corresponde a cada desalineación?',
    grupos:{ 'Lordosis':['Curva hacia el frente','Pelvis inclinada hacia adelante','Abdomen débil','Flexores de cadera apretados'],
             'Cifosis':['Curva hacia posterior','Extensores torácicos débiles','Pectorales apretados'],
             'Escoliosis':['Desviación lateral'] } },
  { id:'cl9', tema:'tronco', q:'¿Respiración principal o accesoria?',
    grupos:{ 'Principal':['Diafragma'], 'Accesorios':['Intercostales','Serrato posterior','Escalenos','Trapecio superior'] } }
];

/* ------------------------------------------------------------
   ORDENAR — arrastrar los pasos a su lugar.
   Solo se incluyen secuencias cuyo orden está claro en los
   apuntes (la progresión en 4 puntos se dejó afuera: el orden
   anotado es ambiguo).
------------------------------------------------------------ */

const SECUENCIAS = [
  { id:'sq1', tema:'progresion', q:'Ordená la progresión de estabilidad lumbopélvica en SUPINO',
    pasos:['Marching','Toe taps','Diagonal press','Dead bug','Bridge marching'],
    porque:'Cada paso suma grados de libertad: primero una pierna con apoyo, luego sin apoyo, luego brazo y pierna, y al final sobre el puente.' },
  { id:'sq2', tema:'progresion', q:'Ordená las posiciones de la progresión de estabilidad lumbopélvica',
    pasos:['Supino','Prono','4 puntos','De pie'],
    porque:'Se va reduciendo la base de sustentación y aumentando la demanda antigravitatoria.' },
  { id:'sq3', tema:'progresion', q:'Ordená la progresión DE PIE', pasos:['Standing diagonal press','Standing march','Walking'] },
  { id:'sq4', tema:'progresion', q:'Ordená la progresión de FLEXIÓN DE CADERA', pasos:['Marching supine','Marching seated','Marching standing'] },
  { id:'sq5', tema:'progresion', q:'Ordená la progresión de EXTENSIÓN DE CADERA', pasos:['Prone hip extension','All fours','Standing'] },
  { id:'sq6', tema:'progresion', q:'Ordená los bloques de MOVILIDAD ESPINAL como aparecen en tu secuencia',
    pasos:['Supino (Cat/cow, Tail wag…)','Extensión (Rockets, Mini swan)','Flexión lateral (Seated side stretch, Seated twist)','Bípeda (Standing roll down…)'] },
  { id:'sq7', tema:'historia', q:'Ordená la vida de Joseph Pilates',
    pasos:['Nace en Alemania','Enfermedades de la infancia','Boxeo, esgrima y gimnasia','Detención en la Isla de Man','Estudio en Nueva York','Fallece Joseph','Fallece Clara'] },
  { id:'sq8', tema:'principios', q:'Ordená los 5 principios del movimiento (según BB)',
    pasos:['Movimiento de todo el cuerpo','Integración del tronco','Fuerza y potencia inferior','Fuerza y equilibrio superior','Movilidad, flexibilidad y recuperación'] },
  { id:'sq9', tema:'osteo', q:'Ordená de menor a mayor pérdida ósea',
    pasos:['Hueso de adulto joven (referencia)','Osteopenia: pérdida del 10–25 %','Osteoporosis: pérdida del 25–30 %'] },
  { id:'sq10', tema:'postura', q:'Ordená los 3 niveles de observación, de lo general a lo particular',
    pasos:['Global','Planar','Local'],
    porque:'Primero se mira el cuerpo entero, después cada plano y al final cada región.' }
];

/* ------------------------------------------------------------
   MAPA CORPORAL — músculos por región y acción
------------------------------------------------------------ */

const REGIONES = [
  { id:'hombro', nom:'Hombro',
    grupos:[
      { acc:'Manguito rotador', m:['Subescapular (rot. medial)','Infraespinoso (rot. lateral)','Redondo menor (rot. lateral)','Supraespinoso (ABD)'] },
      { acc:'Grandes motores',  m:['Pectoral mayor','Deltoides','Dorsal ancho'] }
    ]},
  { id:'escapula', nom:'Cintura escapular',
    grupos:[
      { acc:'Sostienen la escápula', m:['Pectoral menor','Serrato anterior'] },
      { acc:'Retraen / rotan / elevan', m:['Elevador de la escápula','Romboides','Trapecio superior, medio e inferior'] }
    ]},
  { id:'brazo', nom:'Brazo y antebrazo',
    grupos:[
      { acc:'Precisión y motora fina', m:['Braquial','Braquiorradial','Bíceps braquial','Tríceps braquial','Coracobraquial'] }
    ]},
  { id:'troncoant', nom:'Tronco anterior',
    grupos:[
      { acc:'Flexión de tronco', m:['Recto abdominal','Oblicuo externo','Oblicuo interno'] },
      { acc:'Unidad interna',   m:['Diafragma','Transverso del abdomen','Suelo pélvico','Multífidos'] },
      { acc:'Respiración accesoria', m:['Intercostales int. y ext.','Serrato posterior sup. e inf.','Escalenos','Trapecio superior'] }
    ]},
  { id:'troncopost', nom:'Tronco posterior',
    grupos:[
      { acc:'Extensión de columna', m:['Iliocostal','Espinal','Erectores de la espina'] },
      { acc:'Estabilidad lateral',  m:['Cuadrado lumbar'] }
    ]},
  { id:'cadera', nom:'Cadera',
    grupos:[
      { acc:'Flexión',    m:['Psoas mayor','Ilíaco','Sartorio','Recto femoral'] },
      { acc:'Extensión',  m:['Glúteo mayor','Semimembranoso','Semitendinoso','Bíceps femoral'] },
      { acc:'Abducción',  m:['TFL','Glúteo medio','Glúteo menor','Glúteo mayor'] },
      { acc:'Aducción',   m:['Pectíneo','Aductor largo','Aductor corto','Aductor mayor','Grácil'] },
      { acc:'Rotación lateral (profundos)', m:['Cuadrado femoral','Obturador externo','Obturador interno','Piriforme','Gemelos sup. e inf.'] }
    ]},
  { id:'muslo', nom:'Muslo',
    grupos:[
      { acc:'Extensión de rodilla', m:['Recto femoral','Vasto lateral','Vasto medial','Vasto intermedio'] },
      { acc:'Flexión de rodilla',   m:['Sartorio','Grácil','Semitendinoso','Bíceps femoral'] }
    ]},
  { id:'pierna', nom:'Pierna',
    grupos:[
      { acc:'Flexión plantar', m:['Gastrocnemio (rodilla extendida)','Sóleo (rodilla flexionada)'] },
      { acc:'Dorsiflexión',    m:['Tibial anterior','Extensor largo de los dedos','Extensor largo del dedo gordo'] }
    ]},
  { id:'pie', nom:'Pie y tobillo',
    grupos:[
      { acc:'Inversión', m:['Tibial anterior','Tibial posterior'] },
      { acc:'Eversión',  m:['Peroneo largo','Peroneo corto','Peroneo anterior'] }
    ]}
];

/* ------------------------------------------------------------
   REPERTORIO — objetivos y clasificación en osteoporosis
   osteo: 'no' = contraindicado | 'si' = permitido | 'mod' = modificado
          null = los apuntes no lo ubican en ninguna lista (no se pregunta)
------------------------------------------------------------ */

const REPERTORIO = [
  { n:'Hundred prep',               obj:['calentamiento','abdomen','movilizar'], osteo:'no' },
  { n:'Hundred',                    obj:['calentamiento','abdomen'],             osteo:'no' },
  { n:'Roll up',                    obj:['abdomen','movilizar'],                 osteo:'no' },
  { n:'Rolling like a ball',        obj:['abdomen','movilizar','escapular'],     osteo:'no' },
  { n:'Single leg stretch',         obj:['abdomen'],                             osteo:'no' },
  { n:'Double leg stretch',         obj:['abdomen'],                             osteo:'no' },
  { n:'Single straight leg stretch',obj:['abdomen','pierna'],                    osteo:'no' },
  { n:'Double straight leg stretch',obj:['abdomen','cadera'],                    osteo:'no' },
  { n:'Criss cross',                obj:['abdomen','rotacion'],                  osteo:'no' },
  { n:'Spine stretch forward',      obj:['movilizar','hombros'],                 osteo:'no' },
  { n:'Spine stretch side',         obj:['movilizar'],                           osteo:'no' },
  { n:'Saw',                        obj:['movilizar','escapular','hombros','rotacion'], osteo:'no' },
  { n:'Open leg rocker',            obj:['escapular','todocuerpo'],              osteo:'no' },
  { n:'Seal',                       obj:['movilizar','escapular','hombros'],     osteo:'no' },
  { n:'Teaser family',              obj:['abdomen','pierna'],                    osteo:'no' },
  { n:'Hip circles',                obj:['abdomen','escapular','rotacion'],      osteo:'no' },
  { n:'Roll over',                  obj:['abdomen','movilizar','escapular'],     osteo:'no' },
  { n:'Corkscrew',                  obj:['movilizar','escapular','rotacion'],    osteo:'no' },
  { n:'Neck pull',                  obj:['abdomen','movilizar'],                 osteo:'no' },
  { n:'Jackknife',                  obj:['abdomen','movilizar','escapular','hombros'], osteo:'no' },
  { n:'Scissors',                   obj:['abdomen','cadera'],                    osteo:'no' },
  { n:'Bicycle',                    obj:['abdomen','cadera'],                    osteo:'no' },
  { n:'Boomerang',                  obj:['abdomen','cadera'],                    osteo:'no' },
  { n:'Rocking',                    obj:['abdomen'],                             osteo:'no' },
  { n:'Seated twist',               obj:['lateral'],                             osteo:'mod' },
  { n:'Shoulder bridge',            obj:['cadera'],                              osteo:'mod' },
  { n:'Single leg circles',         obj:['pierna','cadera','escapular'],         osteo:'si' },
  { n:'Swan',                       obj:['escapular'],                           osteo:'si' },
  { n:'Swan dive',                  obj:['escapular'],                           osteo:'si' },
  { n:'Swan rocking',               obj:['escapular'],                           osteo:'si' },
  { n:'Single leg kicks',           obj:['movilizar','pierna','escapular'],      osteo:'si' },
  { n:'Double leg kicks',           obj:['pierna','hombros'],                    osteo:'si' },
  { n:'Swimming',                   obj:['todocuerpo'],                          osteo:'si' },
  { n:'Side leg lifts',             obj:['pierna','cadera','lateral'],           osteo:'si' },
  { n:'Side leg circles',           obj:['pierna','cadera','lateral'],           osteo:'si' },
  { n:'Side leg kicks',             obj:['cadera','lateral'],                    osteo:'si' },
  { n:'Side leg bananas',           obj:['cadera','lateral'],                    osteo:'si' },
  { n:'Kneeling side family',       obj:['lateral'],                             osteo:'si' },
  { n:'Spine twist',                obj:['rotacion','todocuerpo'],               osteo:'si' },
  { n:'Leg pull up',                obj:['todocuerpo'],                          osteo:'si' },
  { n:'Leg pull down',              obj:['todocuerpo'],                          osteo:'si' },
  { n:'Mod corkscrew',              obj:['cadera','escapular','rotacion'],       osteo:'si' },
  { n:'Side bend mermaid',          obj:['lateral','todocuerpo'],                osteo:'si' },
  { n:'Push ups',                   obj:['todocuerpo','escapular','hombros'],    osteo:null },
  { n:'Knee stretch knees off',     obj:['todocuerpo'],                          osteo:null },
  { n:'Side bend twist',            obj:['lateral'],                             osteo:null }
];

const OBJETIVOS = {
  calentamiento:'Calentamiento',
  movilizar:'Movilizar tórax o columna',
  abdomen:'Trabajo de abdomen',
  pierna:'Trabajo de pierna y pies',
  escapular:'Estabilidad escapular',
  hombros:'Trabajo de hombros / MS',
  cadera:'Flexión y movilidad de caderas',
  rotacion:'Trabajo de rotación',
  lateral:'Cadena / sistema lateral',
  todocuerpo:'Movimiento de todo el cuerpo'
};

/* ------------------------------------------------------------
   LOGROS — reconocen conductas que la investigación asocia con
   aprender (constancia, recuperar, corregir errores, calibrarse),
   no solo acumular puntos.
------------------------------------------------------------ */

const LOGROS = [
  { id:'primer_paso',     ico:'🌱', nom:'Primer paso',          desc:'Completar la primera lección' },
  { id:'racha_3',         ico:'🔥', nom:'Encendido',            desc:'3 días seguidos' },
  { id:'racha_7',         ico:'📅', nom:'Semana completa',      desc:'7 días seguidos' },
  { id:'racha_30',        ico:'🏆', nom:'Hábito formado',       desc:'30 días seguidos' },
  { id:'meta_5',          ico:'🎯', nom:'Constancia',           desc:'Cumplir la meta diaria 5 días' },
  { id:'perfecta',        ico:'💎', nom:'Sin errores',          desc:'Una lección perfecta' },
  { id:'combo_10',        ico:'⚡', nom:'En racha',             desc:'10 aciertos seguidos' },
  { id:'resp_100',        ico:'💯', nom:'Cien recuperaciones',  desc:'100 ejercicios respondidos' },
  { id:'resp_500',        ico:'🧠', nom:'Quinientas',           desc:'500 ejercicios respondidos' },
  { id:'hipercorreccion', ico:'💡', nom:'Error que enseña',     desc:'Acertar algo que antes fallaste con total seguridad' },
  { id:'calibrado',       ico:'🧭', nom:'Metacognición fina',   desc:'Acertar el 80 % de tus predicciones (mín. 20)' },
  { id:'unidad_3',        ico:'⭐', nom:'Unidad dominada',      desc:'Tres estrellas en una unidad' },
  { id:'todo_visto',      ico:'🗺️', nom:'Recorrido completo',   desc:'Ver todos los ejercicios al menos una vez' },
  { id:'mapa',            ico:'🧍', nom:'Cartografía',          desc:'Explorar todas las regiones del mapa corporal' },
  { id:'nivel_5',         ico:'🎖️', nom:'Nivel Músculo',        desc:'Llegar al nivel 5' }
];
