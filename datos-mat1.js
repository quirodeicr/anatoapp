/* ============================================================
   AnatoApp — Análisis MAT 1 y repertorio Pre-Pilates
   Fuentes:
     · "Analisis MAT 1.pdf" / "Mat 1.xlsx": 25 fichas de análisis
       de ejercicios (una por hoja)
     · "Principios Movimiento y Posiciones.xlsx": se importa aparte
       en datos-premat.js e imagenes.js (ver importar_premat.py)

   Se corrigió la ortografía de los nombres (Hundread → Hundred,
   Circule → Circle…) sin cambiar el contenido. Los accesorios
   llevan un rótulo corto [para las fichas] y el detalle tal como
   estaba en la planilla. Lo que en las fichas se contradice o
   parece copiado de otra hoja quedó marcado en `revisar` y NO se
   usa para generar preguntas.
   ============================================================ */

TEMAS.premat = { nom: 'Pre-Pilates (Pre-MAT)', color: 'magenta', icono: '🧘' };
TEMAS.mat1   = { nom: 'Análisis MAT 1',        color: 'magenta', icono: '📘' };

/* Las unidades nuevas van después de Progresiones y antes de Poblaciones especiales. */
UNIDADES.splice(UNIDADES.findIndex(u => u.id === 'u11'), 0,
  { id: 'u12', nom: 'Pre-Pilates por posición', temas: ['premat'], icono: '🧘' },
  { id: 'u13', nom: 'Análisis MAT 1',            temas: ['mat1'],   icono: '📘' });

/* ---------- regresiones Pre-Pilates que comparten varias fichas ---------- */
const REG = {
  abd:   'Unidad interna: Pelvic clock, Fingertip abdominals · Unidad externa: Table tops, Marching, Bridges · Movilidad de columna: Abdominal curl, Oblique abdominals',
  roll:  'Unidad interna: Pelvic clock · Unidad externa: Toe taps, Marching, Diagonal press, Dead bug, Bridge marching · Movilidad de columna: Abdominal curl, Oblique abdominals',
  prono: 'Rocket, Mini swan, Swan, Standing extension, Swimming, Opposite arm and leg reach, Cat cow, Sternum drops, Plank, Bridges',
  mmii:  'MMII: Marching supine, Marching seated, Swimming, Opposite single leg, de pie, Sentadillas, Desplantes',
  lado:  'Estabilidad lumbopélvica: Marching, Toe taps, Diagonal press · Movilidad de columna: Seated side stretch, Standing lateral flexion · Fuerza y potencia de MMII: levantamiento lateral de piernas (ABD), levantamiento de pierna acostado de lado (ADD) · Fuerza y equilibrio de MMSS: todas las planchas; las más importantes, las laterales (side plank, en antebrazo, con piernas juntas, levantando la pierna)'
};
const TEASER_M2 = ['Teaser 1 (roll down)', 'Teaser prep (bend knee, single leg)', 'Teaser 2 (leg lowers)', 'Teaser 3 (arms and legs together)'];
const PROPS_LEGSTRETCH = {
  asiste:  [['Bola bajo la espalda'], ['Bola en la mano'], ['Bola en el abdomen']],
  resiste: [['Pesas en manos y tobillos'], ['Magic circle'], ['Liga abierta en la planta de los pies', 'Las manos tensan la liga']]
};
const PROPS_HUNDRED = {
  asiste:  [['Bola entre las piernas', 'Activa los aductores'], ['Bola en la línea del brasier'],
            ['Banda abierta en la planta de los pies', 'Se sujeta con las manos'], ['Magic circle por dentro de las rodillas']],
  resiste: [['Mancuernas en las manos', 'Con pulsos'], ['Banda cerrada en las manos', 'Pulsos en abducción'],
            ['Magic circle entre las palmas', 'Presionando el aro contra el piso']]
};
const PROPS_LADO = {
  asiste:  [['Bola en las costillas', 'Se pide que separe las costillas de la bola'],
            ['Liga abierta en la planta del pie', 'Con los extremos en las manos, apoya la elevación de la pierna']],
  resiste: [['Pesas en el tobillo'],
            ['Magic circle entre los pies', 'El pie de abajo presiona el aro al piso; el de arriba lo empuja al techo'],
            ['Liga cerrada en los tobillos', 'El pie de abajo presiona para no desplazarse al levantar la pierna de arriba']]
};

/* ---------- las 25 fichas ---------- */
const MAT1 = [
  { id: 'm01', n: 'Hundred prep', series: '10 sets', pos: 'Supino',
    bb: 'Integración del tronco (unidad interna)', obj: ['Fortalecer el tronco'],
    regPre: REG.abd, regMat1: [],
    progMat1: ['Hundred', 'Single leg stretch', 'Double leg stretch', 'Single straight leg stretch', 'Double straight leg stretch', 'Roll up', 'Rolling like a ball', 'Seal', 'Open leg rocker'],
    progMat2: TEASER_M2, ...PROPS_HUNDRED },

  { id: 'm02', n: 'Hundred', series: '10 sets', pos: 'Supino',
    bb: 'Integración del tronco (unidad interna)', obj: ['Fortalecer el tronco'],
    regPre: REG.abd, regMat1: ['Hundred prep'],
    progMat1: ['Single leg stretch', 'Double leg stretch', 'Single straight leg stretch', 'Double straight leg stretch', 'Roll up', 'Rolling like a ball', 'Seal', 'Open leg rocker'],
    progMat2: [...TEASER_M2, 'Hip circles'], ...PROPS_HUNDRED },

  { id: 'm03', n: 'Roll up', series: '3 a 6', pos: 'Supino',
    bb: 'Integración del tronco: unidad interna, unidad externa y movilidad de columna',
    obj: ['Fortalecer el tronco', 'Movilidad de la columna'],
    regPre: REG.abd, regMat1: ['Single leg stretch', 'Double leg stretch', 'Single straight leg stretch', 'Double straight leg stretch'],
    nota: 'El Bicycle se añade por objetivo, no por patrón de movimiento.',
    progMat1: ['Rolling like a ball', 'Seal', 'Open leg rocker'], progMat2: [...TEASER_M2, 'Hip circles', 'Neck pull'],
    asiste: [['Balón en la línea del brasier'], ['Balón entre los tobillos y otro entre las manos'],
             ['Banda abierta en la planta de los pies', 'Se hala con las manos'],
             ['Rodillo detrás de la espalda', 'En la línea del brasier, con las piernas flexionadas']],
    resiste: [['Pesas en las manos'], ['Rodillo a lo largo de la columna', 'Para dar inestabilidad'],
              ['Rodillo bajo el tendón de Aquiles', 'Presionando, para dar inestabilidad'],
              ['Magic circle entre las muñecas', 'La fuerza se hace con el dorso de las muñecas, de adentro hacia afuera']] },

  { id: 'm04', n: 'Rolling like a ball', series: '', pos: 'Supino',
    bb: 'Integración del tronco', obj: ['Estabilidad lumbopélvica'],
    regPre: REG.roll, regMat1: ['Hundred', 'Roll up'],
    progMat1: ['Open leg rocker', 'Seal'], progMat2: ['Boomerang'],
    asiste: [['Bola entre abdomen y piernas'], ['Aro por dentro de las piernas', 'Para abducción'], ['Bola por dentro de las piernas', 'Para aducción']],
    resiste: [['Bola en la zona poplítea'], ['Liga cerrada en las muñecas', 'Abrir'], ['Aro en los tobillos', 'Abducción']] },

  { id: 'm05', n: 'Single leg circle', series: '4 a 8 sets', pos: 'Supino',
    bb: 'Integración del tronco: estabilidad lumbopélvica',
    obj: ['Estabilidad lumbopélvica', 'Estabilidad escapular', 'Flexión de cadera'],
    regPre: 'Toe taps, Marching (unidad interna), Side leg lift', regMat1: ['Hundred prep', 'Hundred', 'Large circle'],
    progMat1: ['Side leg circles'], progMat2: ['Hip circles', 'Modified corkscrew', 'Corkscrew'],
    asiste: [['Banda abierta en la planta del pie', 'Apoyo con las manos'], ['Banda cerrada en las manos']],
    resiste: [['Bola debajo del sacro'], ['Bola bajo el pie'], ['Rodillo bajo la columna'], ['Pesas en piernas y manos']] },

  { id: 'm06', n: 'Single leg stretch', series: '8 a 12 sets', pos: 'Supino',
    bb: 'Integración del tronco: estabilidad lumbopélvica',
    obj: ['Fortalecer la estabilidad lumbopélvica', 'Fortalecer los abdominales'],
    regPre: REG.abd, regMat1: ['Hundred prep', 'Hundred'],
    progMat1: ['Double leg stretch', 'Single straight leg stretch', 'Double straight leg stretch', 'Roll up', 'Rolling like a ball', 'Seal', 'Open leg rocker'],
    progMat2: [...TEASER_M2, 'Neck pull'], ...PROPS_LEGSTRETCH },

  { id: 'm07', n: 'Double leg stretch', series: '3 a 6 reps', pos: 'Supino',
    bb: 'Integración del tronco: estabilidad lumbopélvica',
    obj: ['Fortalecer la estabilidad lumbopélvica', 'Fortalecer los abdominales'],
    regPre: REG.abd, regMat1: ['Hundred prep', 'Hundred', 'Single leg stretch'],
    progMat1: ['Single straight leg stretch', 'Double straight leg stretch', 'Roll up', 'Rolling like a ball', 'Seal', 'Open leg rocker'],
    progMat2: [...TEASER_M2, 'Neck pull'], ...PROPS_LEGSTRETCH },

  { id: 'm08', n: 'Single straight leg stretch', series: '8 a 12 sets', pos: 'Supino',
    bb: 'Integración del tronco: estabilidad lumbopélvica',
    obj: ['Fortalecer la estabilidad lumbopélvica', 'Fortalecer los abdominales'],
    regPre: REG.abd, regMat1: ['Hundred prep', 'Hundred', 'Single leg stretch', 'Double leg stretch'],
    progMat1: ['Double straight leg stretch', 'Roll up', 'Rolling like a ball', 'Seal', 'Open leg rocker'],
    progMat2: [...TEASER_M2, 'Neck pull'], ...PROPS_LEGSTRETCH },

  { id: 'm09', n: 'Double straight leg stretch', series: '2 a 4 reps', pos: 'Supino',
    bb: 'Integración del tronco: estabilidad lumbopélvica',
    obj: ['Fortalecer la estabilidad lumbopélvica', 'Fortalecer los abdominales'],
    regPre: REG.abd, regMat1: ['Hundred prep', 'Hundred', 'Single leg stretch', 'Double leg stretch', 'Single straight leg stretch'],
    progMat1: ['Bicycle (Criss cross)', 'Roll up', 'Rolling like a ball', 'Seal', 'Open leg rocker'],
    progMat2: [...TEASER_M2, 'Neck pull'], ...PROPS_LEGSTRETCH },

  { id: 'm10', n: 'Criss cross bicycle', series: '8 a 12 reps', pos: 'Supino',
    bb: 'Integración del tronco: unidad interna, unidad externa (slings) y movilidad de columna',
    obj: ['Fortalecer la estabilidad lumbopélvica', 'Fortalecer los abdominales'],
    regPre: REG.abd + ' · Angels in the snow',
    regMat1: ['Hundred prep', 'Hundred', 'Single leg stretch', 'Double leg stretch', 'Single straight leg stretch', 'Double straight leg stretch'],
    progMat1: ['Roll up', 'Rolling like a ball', 'Seal', 'Open leg rocker'],
    progMat2: [...TEASER_M2, 'Neck pull'], ...PROPS_LEGSTRETCH },

  { id: 'm11', n: 'Spine stretch forward', series: '4 a 8 reps', pos: 'Sedente',
    bb: 'Integración del tronco: movilidad de columna',
    obj: ['Flexión de columna', 'Elongación axial', 'Estabilidad pélvica'],
    regPre: 'Movilidad de columna: Cat cow, Abdominal curl, Standing roll down, Standing flexion, Seated side stretch, Seated twist (regresión para isquiotibiales)',
    regMat1: ['Hundred prep', 'Hundred', 'Single leg stretch', 'Double leg stretch', 'Single straight leg stretch', 'Double straight leg stretch'],
    nota: 'El Spine stretch side no es tan difícil.',
    progMat1: ['Saw', 'Roll up', 'Rolling like a ball', 'Seal', 'Open leg rocker'],
    progMat2: [...TEASER_M2, 'Neck pull', 'Roll over', 'Corkscrew', 'Jackknife', 'Scissors', 'Bicycle', 'Boomerang'],
    asiste: [['Bola en la mano'], ['Bola en el abdomen', 'Presionar la bola como si fuera a reventar'], ['Magic circle']],
    resiste: [['Pesas en las manos', 'Resisten y también asisten'], ['Rodillo', 'Deslizarse sobre el rodillo con las manos adelante'],
              ['Liga abierta en la planta de los pies', 'Las manos tensan la liga']],
    tambien: { 'Pesas en las manos': ['Asiste'] },
    revisar: ['En la planilla, la lista de accesorios que asisten no tiene rótulo; se asumió que son los que asisten.'] },

  { id: 'm12', n: 'Spine stretch side', series: '4 a 6 reps', pos: 'Sedente',
    bb: 'Integración del tronco: movilidad de columna y flexión lateral del tronco',
    obj: ['Elongación axial', 'Flexión lateral de columna', 'Estabilidad pélvica'],
    regPre: 'Movilidad de columna: Abdominal curl, Oblique abdominals, Opposite arm and leg reach, Standing flexion, Standing lateral flexion, Standing full body rotation, Tail wag · Seated side stretch (es lo mismo) · Seated twist (no es regresión: mismo nivel de esfuerzo)',
    regMat1: ['Serie lateral (puede ser)'],
    progMat1: ['Side bananas', 'Saw'], progMat2: ['Spine twist', 'Side bend twist', 'Side bend mermaid', 'Corkscrew', 'Toda la serie side kneeling'],
    asiste: [['Liga abierta en las manos', 'Un extremo en cada mano; se tensa con el giro lateral'], ['Pesa', 'Asiste por gravedad para bajar más']],
    resiste: [['Bola bajo las palmas', 'Control y estabilidad; también asiste el arrastre'],
              ['Magic circle bajo la mano de apoyo', 'Genera inestabilidad'],
              ['Liga bajo la cadera', 'Se sienta sobre la liga y hala con la mano del lado de la flexión lateral']],
    tambien: { 'Bola bajo las palmas': ['Asiste'] } },

  { id: 'm13', n: 'Saw', series: '4 a 6 reps', pos: 'Sedente', resp: 'Sniff breath',
    bb: 'Integración del tronco: movilidad de columna, flexión lateral, extensión y rotación del tronco',
    obj: ['Movilidad de columna: flexión, extensión y rotación', 'Elongación axial', 'Estabilidad pélvica'],
    regPre: 'Movilidad de columna: Cat cow, Abdominal curl, Standing roll down, Standing flexion, Standing lateral flexion, Standing full body rotation, Seated side stretch, Seated twist',
    regMat1: ['Criss cross bicycle', 'Spine stretch forward', 'Spine stretch side'],
    progMat1: ['Roll up', 'Rolling like a ball', 'Open leg rocker', 'Seal'],
    progMat2: ['Spine twist', 'Side bend twist', 'Side bend mermaid', 'Roll over', 'Neck pull', 'Jackknife', 'Scissors', 'Bicycle'],
    asiste: [['Liga abierta en las manos', 'Un extremo en cada mano; se tensa con el giro lateral']],
    resiste: [['Pesas en las manos', 'Asisten cuando va hacia adelante y resisten hacia atrás; retan a conservar la alineación de la cintura escapular y controlar la extensión con rotación'],
              ['Banda abierta y banda cerrada en el tobillo']],
    tambien: { 'Pesas en las manos': ['Asiste'] },
    revisar: ['En la planilla figura "Aro acapona" entre los accesorios que asisten: no se entiende el texto.'] },

  { id: 'm14', n: 'Open leg rocker', series: '4 a 8 reps', pos: 'Supino',
    bb: 'Integración del tronco: unidad interna, unidad externa y estabilidad lumbopélvica',
    obj: ['Estabilidad lumbopélvica', 'Fortalecimiento del tronco', 'Coordinación y balance', 'Estabilidad escapular'],
    regPre: 'Pelvic clock, Fingertip abdominals, Pelvic tilt · Marching, Toe taps, Diagonal press, Dead bug, Bridges · Abdominal curl, Oblique abdominals',
    regMat1: ['Hundred prep', 'Hundred', 'Single leg circle', 'Serie de 5', 'Roll up', 'Rolling like a ball', 'Seal'],
    progMat1: [], progMat2: ['Teaser prep (bend knee, single leg)', 'Teaser 1 (roll down)', 'Teaser 2 (leg lowers)', 'Teaser 3 (arms and legs together)', 'Hip circles', 'Boomerang'],
    asiste: [['Liga abierta en la planta de los pies', 'Extremos en las manos a la altura de los hombros; se tensa para controlar el movimiento'],
             ['Banda abierta con los codos doblados'], ['Aro', 'Se toma un extremo del aro, con las piernas por dentro']],
    resiste: [['Magic circle entre los pies', 'Se presiona en abducción y aducción mientras se controla el movimiento'], ['Balón entre las piernas', 'Abducción y aducción']] },

  { id: 'm15', n: 'Swan', series: '3 a 6 reps', pos: 'Prono',
    bb: 'Integración del tronco: movilidad de columna', obj: ['Movilidad de columna: extensión axial', 'Estabilidad escapular'],
    regPre: REG.prono, regMat1: [],
    progMat1: ['Single leg kicks', 'Double leg kicks'], progMat2: ['Swan dive', 'Swan rocking', 'Rocking', 'Neck pull', 'Leg pull down', 'Leg pull up'],
    asiste: [['Bola en el esternón', 'Permite elevar la espalda alta del mat']],
    resiste: [['Magic circle en el esternón', 'Se presiona con el pecho'],
              ['Rodillo bajo las manos', 'Brazos estirados; en la exhalación rueda sobre el rodillo'],
              ['Bola bajo las manos', 'Presionar y dejar rodar los antebrazos sobre la bola']] },

  { id: 'm16', n: 'Single leg kicks', series: '3 a 6 reps', pos: 'Prono', resp: 'Sniff breath',
    bb: 'Fuerza y potencia de MMII', obj: ['Fortalecer isquiotibiales', 'Estirar cuádriceps', 'Fortalecer la extensión de columna'],
    regPre: REG.mmii + ' · ' + REG.prono, regMat1: ['Swan'],
    progMat1: ['Double leg kicks', 'Swimming'], progMat2: ['Leg pull down', 'Leg pull up', 'Kneeling side kicks', 'Swan dive', 'Swan rocking'],
    asiste: [['Bola en el esternón', 'Permite elevar la espalda alta del mat']],
    resiste: [['Magic circle en el esternón', 'Se presiona con el pecho'], ['Rodillo bajo las manos'], ['Dos bolas bajo las manos'],
              ['Pesas en los tobillos'], ['Banda cerrada en los tobillos', 'La pierna de abajo presiona y limita el estiramiento de la banda']] },

  { id: 'm17', n: 'Double leg kicks', series: '3 a 6 reps', pos: 'Prono', resp: 'Sniff breath',
    bb: 'Integración del tronco: movilidad de columna · Fuerza y potencia de MMII',
    obj: ['Fortalecer la extensión de columna', 'Estirar isquiotibiales y glúteos'],
    regPre: REG.mmii + ' · ' + REG.prono, regMat1: ['Swan', 'Single leg kicks'],
    progMat1: ['Swimming'], progMat2: ['Leg pull down', 'Leg pull up', 'Kneeling side kicks', 'Swan dive', 'Swan rocking'],
    asiste: [['Liga abierta en los empeines', 'Extremos en las manos: al extender piernas y espalda, los pies ayudan a extender la espalda']],
    resiste: [['Pesas en los tobillos'], ['Rodillo bajo las manos'], ['Dos bolas bajo las manos']] },

  { id: 'm18', n: 'Swimming', series: '15 a 25 sets', pos: 'Prono', resp: 'Sniff breath',
    bb: 'Integración del tronco: estabilidad lumbopélvica y movilidad de columna',
    obj: ['Estabilidad lumbopélvica', 'Elongación axial y movilidad de columna'],
    regPre: 'Estabilidad lumbopélvica: ' + REG.prono + ' · ' + REG.mmii, regMat1: ['Swan', 'Single leg kicks', 'Double leg kicks'],
    progMat1: [], progMat2: ['Swan dive', 'Swan rocking', 'Rocking'],
    asiste: [['Liga cerrada en tobillos y muñecas', 'Se hace el movimiento natural del ejercicio'],
             ['Un balón en cada mano', 'Presionar en cada brazada; atención a extender bien las manos'],
             ['Rodillo bajo los brazos', 'Brazos estirados sobre el rodillo, y patear']],
    resiste: [['Pesas en tobillos y manos'], ['Magic circle en cada mano', 'Presionar las palmas en cada brazada']] },

  { id: 'm19', n: 'Side leg lift', series: '6 a 10 reps', pos: 'Decúbito lateral',
    bb: 'Integración del tronco (estabilidad lumbopélvica) · Fuerza y potencia',
    obj: ['Fuerza y potencia de miembro inferior', 'Integración del tronco'],
    nota: 'El objetivo principal es la integración del tronco, pero se trabaja más el miembro inferior y el costado.',
    regPre: REG.lado, regMat1: ['Hundred', 'Serie de 5', 'Single leg circle', 'Roll up'],
    progMat1: ['Side leg circles (big and small)', 'Side leg kicks', 'Side leg bicycle', 'Side leg bananas'],
    progMat2: ['Kneeling side kicks', 'Seated twist', 'Side bend twist', 'Side bend mermaid'],
    ...PROPS_LADO,
    revisar: ['El principio dice "fuerza y potencia del miembro SUPERIOR"; en el resto de la serie lateral es miembro inferior.'] },

  { id: 'm20', n: 'Side leg circles (big and small)', series: '4 a 10 reps', pos: 'Decúbito lateral',
    bb: 'Fuerza y potencia de miembro inferior · Integración del tronco (estabilidad lumbopélvica)',
    obj: ['Fuerza y potencia de miembro inferior', 'Integración del tronco'],
    regPre: REG.lado, regMat1: ['Hundred', 'Serie de 5', 'Single leg circle', 'Roll up', 'Side leg lift'],
    progMat1: ['Side leg kicks', 'Side leg bicycle', 'Side leg bananas'],
    progMat2: ['Kneeling side kicks', 'Seated twist', 'Side bend twist', 'Side bend mermaid'],
    ...PROPS_LADO },

  { id: 'm21', n: 'Side leg kicks', series: '4 a 8 reps', pos: 'Decúbito lateral',
    bb: 'Fuerza y potencia de miembro inferior · Integración del tronco (estabilidad lumbopélvica)',
    obj: ['Fuerza y potencia de miembro inferior', 'Integración del tronco'],
    regPre: REG.lado, regMat1: ['Hundred', 'Serie de 5', 'Single leg circle', 'Roll up', 'Side leg lift', 'Side leg circles'],
    progMat1: ['Side leg bicycle', 'Side leg bananas'],
    progMat2: ['Kneeling side kicks', 'Seated twist', 'Side bend twist', 'Side bend mermaid'],
    asiste: [['Bola en las costillas', 'Se pide que separe las costillas de la bola']],
    resiste: [['Pesas en el tobillo'], ['Liga cerrada en los muslos'],
              ['Liga cerrada en los tobillos', 'El pie de abajo presiona para no desplazarse al levantar la pierna de arriba']] },

  { id: 'm22', n: 'Side leg bicycle', series: '4 a 6 reps', pos: 'Decúbito lateral',
    bb: 'Fuerza y potencia de miembro inferior · Integración del tronco (estabilidad lumbopélvica)',
    obj: ['Fuerza y potencia de miembro inferior', 'Integración del tronco'],
    regPre: REG.lado, regMat1: ['Hundred', 'Serie de 5', 'Single leg circle', 'Roll up', 'Side leg lift', 'Side leg circles', 'Side leg kicks'],
    progMat1: ['Side leg bananas'], progMat2: ['Kneeling side kicks', 'Seated twist', 'Side bend twist', 'Side bend mermaid'],
    asiste: [['Bola en las costillas', 'Se pide que separe las costillas de la bola']],
    resiste: [['Pesas en el tobillo']] },

  { id: 'm23', n: 'Side leg bananas', series: '4 a 6 reps', pos: 'Decúbito lateral',
    bb: 'Integración del tronco (estabilidad lumbopélvica)',
    obj: ['Fuerza y potencia de miembro inferior', 'Integración del tronco'],
    regPre: REG.lado, regMat1: ['Hundred', 'Serie de 5', 'Single leg circle', 'Roll up', 'Side leg lift', 'Side leg circles', 'Side leg kicks'],
    progMat1: [], progMat2: ['Kneeling side kicks', 'Seated twist', 'Side bend twist', 'Side bend mermaid'],
    asiste: [['Bola en las costillas', 'Se pide que separe las costillas de la bola']],
    resiste: [['Pesas en el tobillo'], ['Aro entre los tobillos'],
              ['Bola entre las piernas', 'Presionar en la elevación; arriba se pueden hacer 20 pulsos'],
              ['Bola bajo la mano de arriba', 'Brazo extendido presionando con la palma, dejando rodar la bola en los levantamientos']],
    revisar: ['En el principio del movimiento falta el punto 1 (quedó "1- 2- Integración del tronco").'] },

  { id: 'm24', n: 'Seal', series: '4 a 8 reps', pos: 'Supino',
    bb: 'Integración del tronco (estabilidad lumbopélvica) · Movilidad de columna',
    obj: ['Integración del tronco: estabilidad lumbopélvica', 'Movilidad de columna'],
    regPre: REG.roll, regMat1: ['Hundred', 'Serie de 5', 'Roll up', 'Rolling like a ball'],
    progMat1: ['Open leg rocker'],
    progMat2: ['Teaser prep (bend knee, single leg)', 'Teaser 1 (roll down)', 'Teaser 2 (leg lowers)', 'Teaser 3 (arms and legs together)'],
    asiste: [['Bola entre las piernas', 'Como un aro de básquet: no puede caer; rodar y aplaudir, igual al regresar']],
    resiste: [['Bola en las plantas de los pies', 'Hacer las palmadas sin que la bola se caiga']] },

  { id: 'm25', n: 'Push up', series: '1 a 3 sets de 5 reps', pos: 'Prono',
    bb: 'Fuerza y potencia de MMSS · Estabilidad escapular · Trabajo global de todo el cuerpo',
    obj: ['Fuerza y potencia de MMSS', 'Estabilidad escapular'],
    regPre: 'MMSS: Cat cow, Opposite single arm and leg reach, Remo, Prensa de tríceps, Inmersión de tríceps, Overhead press, Lateral press, Pulling down, Bíceps curl · Principal: todas las planchas (Plank all four single arm lift, Sternum drops, Modified plank, plancha con brazos extendidos, con una pierna levantada, en antebrazo, con flexión de brazos, boca arriba, con elevación de hombros) · Importantes: las planchas laterales',
    regMat1: ['Swimming', 'Serie lateral'],
    progMat1: ['Leg pull down', 'Leg pull up', 'Kneeling side kicks', 'Seated twist', 'Side bend twist', 'Side bend mermaid'],
    progMat2: ['Teaser prep (bend knee, single leg)', 'Teaser 1 (roll down)', 'Teaser 2 (leg lowers)', 'Teaser 3 (arms and legs together)'],
    asiste: [['Bola entre las piernas', 'Como un aro de básquet: no puede caer; rodar y aplaudir']],
    resiste: [['Bola en las plantas de los pies', 'Hacer las palmadas sin que la bola se caiga']],
    sinProps: true,
    revisar: ['Los accesorios y las progresiones MAT 2 son idénticos a los del Seal: parecen copiados de esa hoja. No se usan para preguntas.'] }
];

/* ============================================================
   EJERCICIOS DE PRÁCTICA GENERADOS A PARTIR DE LAS FICHAS
   ============================================================ */
const FOTOS = [];   // ¿Qué ejercicio es? (se llena abajo)
(() => {
  /* este archivo se carga antes que app.js: normalización propia */
  const norm = s => String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim();
  const mat = id => MAT1.find(m => m.id === id);
  const nombre = id => mat(id).n;

  /* --- MAT 1 por posición --- */
  const porPos = {};
  MAT1.forEach(m => (porPos[m.pos] = porPos[m.pos] || []).push(m.n));
  CLASIFICACIONES.push({ id: 'cm-pos', tema: 'mat1', q: 'MAT 1: ¿en qué posición se hace cada ejercicio?', grupos: porPos });

  /* --- asiste o resiste: un ejercicio por grupo de fichas con los mismos accesorios --- */
  const gruposProps = [
    ['m01', 'm02'], ['m03'], ['m04'], ['m05'], ['m06', 'm07', 'm08', 'm09', 'm10'], ['m11'], ['m12'], ['m13'],
    ['m14'], ['m15'], ['m16'], ['m17'], ['m18'], ['m19', 'm20'], ['m21'], ['m23'], ['m24']
  ];
  gruposProps.forEach(ids => {
    const m = mat(ids[0]);
    if (m.sinProps) return;
    const nombres = ids.map(nombre);
    const titulo = nombres.length > 2 ? `${nombres[0]} y su serie` : nombres.join(' / ');
    CLASIFICACIONES.push({
      id: 'cp-' + ids[0], tema: 'mat1', q: `${titulo}: ¿el accesorio asiste o resiste?`,
      grupos: { Asiste: m.asiste.map(p => p[0]), Resiste: m.resiste.map(p => p[0]) },
      tambien: m.tambien || {},
      porque: 'Un accesorio que asiste facilita lograr o controlar el movimiento; uno que resiste agrega carga o inestabilidad. ' +
        'El mismo accesorio puede hacer las dos cosas según cómo se use.'
    });
  });

  /* --- progresiones que se repiten igual en varias fichas --- */
  SECUENCIAS.push(
    { id: 'sm1', tema: 'mat1', q: 'MAT 1: ordená la progresión de la serie abdominal supina',
      pasos: ['Hundred prep', 'Hundred', 'Single leg stretch', 'Double leg stretch', 'Single straight leg stretch', 'Double straight leg stretch', 'Roll up'],
      porque: 'Cada ficha lista como progresión los ejercicios que le siguen en esta cadena, y como regresión los anteriores.' },
    { id: 'sm2', tema: 'mat1', q: 'MAT 1: ordená la familia de rodadas', pasos: ['Rolling like a ball', 'Seal', 'Open leg rocker'] },
    { id: 'sm3', tema: 'mat1', q: 'MAT 1: ordená la serie sentada de movilidad espinal', pasos: ['Spine stretch forward', 'Spine stretch side', 'Saw'] },
    { id: 'sm4', tema: 'mat1', q: 'MAT 1: ordená la serie prona', pasos: ['Swan', 'Single leg kicks', 'Double leg kicks', 'Swimming'] },
    { id: 'sm5', tema: 'mat1', q: 'MAT 1: ordená la serie lateral',
      pasos: ['Side leg lift', 'Side leg circles', 'Side leg kicks', 'Side leg bicycle', 'Side leg bananas'] },
    { id: 'sm6', tema: 'mat1', q: 'Progresión MAT 2 de la serie lateral',
      pasos: ['Kneeling side kicks', 'Seated twist', 'Side bend twist', 'Side bend mermaid'] }
  );

  /* --- series y repeticiones: se empareja dinámicamente sin valores repetidos --- */
  PARES.push({ id: 'pm-series', tema: 'mat1', q: 'Uní cada ejercicio del MAT 1 con sus series', dinamico: 'mat1series' });

  /* --- tarjetas conceptuales --- */
  CARDS.push(
    { id: 'mc1', tema: 'mat1', tipo: 'simple',
      q: 'En tus fichas, ¿qué respiración acompaña al Saw, los Leg kicks y el Swimming?',
      a: ['Sniff breath'], dist: ['Respiración diafragmática profunda', 'Respiración en apnea', 'Respiración pulmonar'] },
    { id: 'mc2', tema: 'mat1', tipo: 'simple',
      q: '¿Por qué el Bicycle se agrega entre las regresiones del Roll up?',
      a: ['Por objetivo, no por patrón de movimiento.'],
      dist: ['Por patrón de movimiento, no por objetivo.', 'Porque se hace en la misma posición.', 'Porque usa los mismos accesorios.'] },
    { id: 'mc3', tema: 'mat1', tipo: 'simple',
      q: '¿Qué diferencia a un accesorio que ASISTE de uno que RESISTE?',
      a: ['El que asiste facilita el movimiento o su control; el que resiste agrega carga o inestabilidad y aumenta el reto.'],
      op: 'El que asiste facilita el movimiento; el que resiste lo dificulta',
      dist: ['El que asiste agrega carga; el que resiste la quita',
             'El que asiste se usa al inicio; el que resiste, al final de la clase',
             'El que asiste es una bola o banda; el que resiste, pesas o aro'],
      porque: 'Lo define el uso, no el objeto: en el Saw, la misma pesa asiste cuando el cuerpo va hacia adelante y resiste cuando vuelve.' },
    { id: 'mc4', tema: 'mat1', tipo: 'lista',
      q: 'Regresiones Pre-Pilates de la serie abdominal supina (Hundred, Leg stretches, Roll up)',
      a: ['Pelvic clock', 'Fingertip abdominals', 'Table tops', 'Marching', 'Bridges', 'Abdominal curl', 'Oblique abdominals'],
      noDist: ['Toe taps', 'Diagonal press', 'Dead bug', 'Bridge marching', 'Pelvic tilt'] },
    { id: 'mc5', tema: 'mat1', tipo: 'lista',
      q: 'Regresiones Pre-Pilates de la serie prona (Swan)',
      a: ['Rocket', 'Mini swan', 'Standing extension', 'Swimming', 'Opposite arm and leg reach', 'Cat cow', 'Sternum drops', 'Plank', 'Bridges'] },
    { id: 'mc6', tema: 'mat1', tipo: 'lista',
      q: 'Regresiones Pre-Pilates de la movilidad espinal sentada (Saw)',
      a: ['Cat cow', 'Abdominal curl', 'Standing roll down', 'Standing flexion', 'Standing lateral flexion', 'Standing full body rotation', 'Seated side stretch', 'Seated twist'],
      noDist: ['Tail wag', 'Oblique abdominals', 'Opposite arm and leg reach', 'Standing extension'] },
    { id: 'mc7', tema: 'mat1', tipo: 'lista',
      q: 'Regresiones Pre-Pilates de la serie lateral, por principio',
      a: ['Estabilidad lumbopélvica: Marching, Toe taps, Diagonal press',
          'Movilidad de columna: Seated side stretch, Standing lateral flexion',
          'Fuerza y potencia de MMII: levantamiento lateral (ABD) y acostado de lado (ADD)',
          'Fuerza y equilibrio de MMSS: planchas, sobre todo las laterales'] },
    { id: 'mc8', tema: 'mat1', tipo: 'lista', q: 'Objetivos del Open leg rocker',
      a: ['Estabilidad lumbopélvica', 'Fortalecimiento del tronco', 'Coordinación y balance', 'Estabilidad escapular'],
      dist: ['Extensión de columna', 'Rotación del tronco', 'Fuerza de cuádriceps', 'Flexión lateral de columna'] },
    { id: 'mc9', tema: 'mat1', tipo: 'lista', q: 'Objetivos del Single leg circle',
      a: ['Estabilidad lumbopélvica', 'Estabilidad escapular', 'Flexión de cadera'],
      dist: ['Extensión de columna', 'Rotación del tronco', 'Estirar cuádriceps'] },
    { id: 'mc10', tema: 'mat1', tipo: 'lista', q: 'Objetivos del Single leg kicks',
      a: ['Fortalecer isquiotibiales', 'Estirar cuádriceps', 'Fortalecer la extensión de columna'],
      dist: ['Fortalecer abdominales', 'Flexión lateral de columna', 'Rotación del tronco'] },
    { id: 'mc11', tema: 'mat1', tipo: 'lista', q: 'Objetivos del Spine stretch forward',
      a: ['Flexión de columna', 'Elongación axial', 'Estabilidad pélvica'],
      dist: ['Extensión de columna', 'Rotación del tronco', 'Flexión lateral de columna'] },
    { id: 'mc12', tema: 'mat1', tipo: 'lista', q: 'Objetivos del Spine stretch side',
      a: ['Elongación axial', 'Flexión lateral de columna', 'Estabilidad pélvica'],
      dist: ['Flexión de columna', 'Extensión de columna', 'Rotación del tronco'] },
    { id: 'mc13', tema: 'mat1', tipo: 'lista', q: 'Objetivos del Saw',
      a: ['Movilidad de columna: flexión, extensión y rotación', 'Elongación axial', 'Estabilidad pélvica'] }
  );

  CLOZES.push(
    { id: 'zm1', tema: 'mat1', t: 'En el Saw, la pesa asiste cuando el cuerpo va hacia [adelante] y resiste hacia [atrás].',
      dist: ['arriba', 'abajo', 'el costado'] },
    { id: 'zm2', tema: 'mat1', t: 'En la regresión del Roll up, el Bicycle se agrega por [objetivo], no por [patrón de movimiento].',
      dist: ['posición', 'accesorio', 'respiración'] },
    { id: 'zm3', tema: 'mat1', t: 'Las regresiones Pre-Pilates de la serie abdominal se agrupan en unidad [interna], unidad [externa] y [movilidad de columna].',
      dist: ['anterior', 'posterior', 'estabilidad escapular'] },
    { id: 'zm4', tema: 'mat1', t: 'En la serie lateral, con la bola en las [costillas] se pide [separar] las costillas de la bola.',
      dist: [['caderas', 'escápulas'], ['apoyar', 'juntar']] },
    { id: 'zm5', tema: 'mat1', t: 'En el Seal, la bola entre las piernas [asiste]; la bola en las plantas de los pies [resiste].',
      dist: ['estira', 'relaja'] }
  );

  /* ============================================================
     PRE-PILATES (datos-premat.js)
     Las filas con contradicciones (`revisar`) no se usan para preguntas.
     ============================================================ */
  const pm = PREMAT.filter(e => !e.revisar);
  const agrupar = (lista, clave, validos, mapa = x => x) => {
    const g = {};
    lista.forEach(e => {
      const k = mapa(e[clave]);
      if (validos && !validos.includes(k)) return;
      (g[k] = g[k] || []).push(e.n);
    });
    return g;
  };

  const posGrupo = p => p.startsWith('Sedente') ? 'Sedente' : p.startsWith('Plancha') ? 'Plancha' : p;
  CLASIFICACIONES.push(
    { id: 'cpm-pos1', tema: 'premat', q: 'Pre-Pilates: ¿en qué posición se hace?',
      grupos: agrupar(pm, 'pos', ['Supino', 'Prono', '4 puntos', 'Decúbito lateral'], posGrupo) },
    { id: 'cpm-pos2', tema: 'premat', q: 'Pre-Pilates: ¿en qué posición se hace?',
      grupos: agrupar(pm, 'pos', ['Sedente', 'Bípedo', 'Plancha'], posGrupo) },
    { id: 'cpm-princ', tema: 'premat', q: 'Pre-Pilates: ¿qué principio del movimiento trabaja?',
      grupos: agrupar(pm.filter(e => e.n !== 'Variación de Swimming'), 'principio') },
    { id: 'cpm-it', tema: 'premat', q: 'Integración del tronco: ¿qué componente trabaja?',
      grupos: agrupar(pm, 'comp', ['Respiración', 'Unidad interna', 'Estabilidad lumbopélvica', 'Movilidad de la columna']),
      porque: 'Los que tus fichas ubican en "unidad externa" (Toe taps, Diagonal press) quedaron fuera: en tus apuntes manuscritos están en estabilidad lumbopélvica.' },
    { id: 'cpm-mmii', tema: 'premat', q: 'Fuerza y potencia de MMII: ¿qué trabaja?',
      grupos: agrupar(pm, 'comp', ['Flexión de cadera', 'Extensión de cadera', 'Abducción de cadera', 'Aducción de cadera']) },
    { id: 'cpm-mmii2', tema: 'premat', q: 'Fuerza y potencia de MMII: ¿qué trabaja?',
      grupos: agrupar(pm, 'comp', ['Pies y tobillos', 'Patrón de movimiento funcional']) },
    { id: 'cpm-mmss', tema: 'premat', q: 'Fuerza y equilibrio de MMSS: ¿qué trabaja?',
      grupos: agrupar(pm, 'comp', ['Estabilidad glenohumeral', 'Ritmo escapular', 'Estabilidad escapular (planchas)']) },
    { id: 'cpm-mmss2', tema: 'premat', q: 'Fuerza y equilibrio de MMSS: ¿qué trabaja?',
      grupos: agrupar(pm, 'comp', ['Activación del hombro posterior', 'Activación del hombro anterior', 'Movimiento del brazo recto']) }
  );

  /* ¿Pre-MAT o MAT 1? Se excluyen los que aparecen en los dos libros (Swan, Swimming). */
  const enMat1 = new Set(MAT1.map(m => norm(m.n)));
  const enPre = new Set(PREMAT.map(e => norm(e.n)));
  CLASIFICACIONES.push({
    id: 'cpm-libro', tema: 'premat', q: '¿Este ejercicio es de Pre-Pilates o del MAT 1?',
    grupos: {
      'Pre-Pilates': pm.filter(e => !enMat1.has(norm(e.n))).map(e => e.n),
      'MAT 1': MAT1.filter(m => !enPre.has(norm(m.n))).map(m => m.n)
    }
  });

  CARDS.push(
    { id: 'pc1', tema: 'premat', tipo: 'lista', q: 'Ejercicios de respiración de Pre-Pilates (Breathing exercises)',
      a: ['Diaphragmatic breathing', 'Lateral breathing', 'Pulmonary breathing'],
      dist: ['Pelvic clock', 'Fingertip abdominals', 'Low back bridge'] }
  );
  CLOZES.push(
    { id: 'zp1', tema: 'premat', libre: true,
      t: 'Los ejercicios de respiración de Pre-Pilates son la respiración [diafragmática], la [lateral] y la [pulmonar].',
      dist: ['clavicular', 'paradójica', 'apneica'] }
  );

  /* ¿Qué ejercicio es? — un ítem por posición; cada repaso muestra una foto distinta. */
  const posFoto = { 'Supino': ['Supino'], 'Prono': ['Prono'], '4 puntos': ['4 puntos'], 'Decúbito lateral': ['Decúbito lateral'],
    'Sedente': ['Sedente', 'Sedente (silla)'], 'Bípedo': ['Bípedo'], 'Planchas': ['Plancha prona', 'Plancha supina', 'De rodillas'] };
  Object.entries(posFoto).forEach(([nom, poses], i) => {
    const ej = PREMAT.filter(e => poses.includes(e.pos) && e.fotos && !e.revisar && !e.fotoDudosa);
    if (ej.length >= 2) FOTOS.push({ id: 'ft' + (i + 1), tema: 'premat', pos: nom, ejercicios: ej.map(e => e.id) });
  });
})();
