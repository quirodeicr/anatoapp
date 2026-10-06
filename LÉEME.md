# AnatoApp 2

App de estudio construida a partir de tu material de **Anatomía aplicada al método Pilates**:
484 ejercicios en 20 unidades.

## Fuentes del contenido

| Archivo | Qué aporta | Dónde vive en la app |
|---|---|---|
| Apuntes manuscritos (PDF de 43 fotos) | 95 tarjetas: anatomía, principios, cadenas, repertorio, osteoporosis, postura, progresiones | `datos.js` |
| `Analisis MAT 1.pdf` / `Mat 1.xlsx` (son el mismo material) | 25 fichas del MAT 1: series, posición, principio, objetivo, progresiones, regresiones y accesorios que asisten o resisten | `datos-mat1.js` |
| `Principios Movimiento y Posiciones.xlsx` | 99 ejercicios Pre-Pilates con posición, principio, componente, objetivo y 109 fotos | `datos-premat.js` e `imagenes.js`, generados por `importar_premat.py` |
| Material Balanced Body (`fuentes/modulo-01.json`, `mat1.json`, `mat2.json`) | Principios del Movimiento (módulo 1), Mat 1 (25 ejercicios) y Mat 2 (23 ejercicios): secciones, 64 flashcards, 30 preguntas, tus notas a mano y notas de traducción, cada cosa con su página del manual | `datos-bb.js`, generado por `importar_bb.py`; práctica en `contenido-bb.js` |
| Tus 4 exámenes previos (revisiones en PDF: Principios del Movimiento 35/37, Mat 1 77/96, Mat 2 62/116, Mat 3 30/77) | 68 ejercicios con lo que te preguntaron, lo que marcó la corrección y las preguntas falladas. Transcripción en `fuentes/examenes-previos.md` | `datos-examenes.js` |
| `Mat 2 ordenado.xlsx` (hoja Mat 2) | 23 fichas del MAT 2: series, posición, principio, objetivos, regresiones (Pre-Pilates, Mat 1, Mat 2), progresiones, accesorios que asisten o resisten y respiración. Copia textual en `fuentes/mat2-analisis.json` | `datos-mat2.js` |
| `Resumen Todos los ejercicios.xlsx` (hojas de familias) | 146 ejercicios agrupados por familia de posición (supino, decúbito lateral, prono, 4 puntos, planchas, sedente, bípedo) y libro (Pre-Pilates, Mat 1, Mat 2). La primera hoja es la misma planilla de Principios que ya estaba | `datos-familias.js`, generado por `importar_familias.py` desde `fuentes/familias.json`; práctica en `datos-mat2.js` |

Las 30 preguntas del material se reescribieron (`fuentes/quiz_revisado.json`): en 20 la respuesta correcta
era mucho más larga que las demás y se delataba sola. Ahora mide lo mismo que las otras opciones, y los
distractores son errores plausibles del mismo capítulo, nunca algo que en realidad sea cierto.

Los **"Por qué"** y la revisión de distractores son elaboración propia, no texto de tus archivos.

Con las preguntas de los exámenes se hizo lo mismo. Además, **"Todas las anteriores"**, **"A y B"** o
**"Ninguna"** dejan de tener sentido cuando las opciones se mezclan: esas preguntas pasaron a
*seleccioná las correctas* o a *emparejar*, que obligan a reconocer cada parte (en la hoja de respuesta se
aclara cómo era en el examen). Lo que la revisión no dejó claro —las respuestas de la grilla de la bola en
Mat 3, el tercer ejercicio escapular de Mat 2, el entrenamiento completo con accesorios que quedó "requiere
revisión"— **no se pregunta**: figura en Apuntes → Tus exámenes como pendiente de confirmar con el manual.

### Qué no se usa para preguntas

Las columnas de músculos, cadena miofascial y plano de la planilla de Principios se muestran en las fichas
pero **no se preguntan**: varias filas se contradicen (por ejemplo, un ejercicio de *aducción* con músculos
abductores) y una tiene un texto que no corresponde. Las filas con problemas quedan marcadas con
**revisar** en Apuntes → Pre-Pilates, igual que las fichas del MAT 1 con datos que parecen copiados de otra hoja.
En el análisis MAT 2 pasa lo mismo con cinco fichas: Leg pull down (regresiones incompletas), Hip circles
(columnas corridas y posición distinta de la del manual), Corkscrew (regresiones de Mat 2 listadas como Mat 1),
Neck pull (regresiones iguales a las del Corkscrew) y Scissors (objetivo con MMSS). Se muestran, no se preguntan.

### Fotos

Varias fotos traían el nombre del ejercicio escrito ("5. Standing Roll Down", "TOE TAPS"…): se recortaron para
que "¿Qué ejercicio es?" no regale la respuesta. Las fotos casi idénticas nunca aparecen como opciones de la
misma pregunta, y las que no parecen corresponder a su ejercicio no se usan. Todo eso está en
`importar_premat.py`, que se puede volver a correr si corregís la planilla.

> Las fotos parecen provenir del manual del curso. Para estudio propio no hay problema; antes de compartir
> el archivo o el link con terceros, tené en cuenta que las estás distribuyendo.

---

## Cómo abrirla

**Opción recomendada:** doble clic en **`Abrir AnatoApp.bat`** (se abre una ventana negra: dejala abierta).
**Opción rápida:** doble clic en **`AnatoApp.html`**.

> Elegí **una sola** forma y usá siempre esa: el progreso se guarda por dirección, y abrirla de las
> dos maneras crearía dos historiales separados.

Funciona sin internet. Tu progreso de la versión anterior se migra solo, sin perder nada.

---

## Qué hay adentro

**Inicio** — una ruta de 18 unidades, como en Duolingo. Cada nodo muestra cuánto viste, tus estrellas y
cuánto recordás hoy. Arriba: tu personaje, meta diaria, racha y el **Repaso del día**.

**Tus exámenes** — dos unidades con lo que te preguntaron en los cuatro exámenes (*Examen: Principios* y
*Exámenes de Mat*); lo que fallaste aparece primero y lleva la etiqueta "La fallaste en tu examen". En
**Práctica → Simulacro de examen** salen mezcladas, también con lo fallado adelante. En **Apuntes → Tus
exámenes** están tus notas, lo que marcó la corrección convertido en reglas ("si cada opción es cierta,
es *Todas las anteriores*", "repeticiones exactas, no rangos", "decí dónde va el aro"…) y cada pregunta
fallada con tu respuesta, lo correcto, el comentario de la corrección y un botón para practicarla.

**Armá tu clase** (en Práctica) — diseñar la clase fue lo que más puntos costó (17 de 30 en Mat 1 y 0 de 50
en Mat 2). Elegís la consigna (Mat 1 con 15 ejercicios o Mat 1 y 2 de una hora, con 20 a 25), sumás
ejercicios del manual y Pre-Pilates de calentamiento, los ordenás y escribís un número de repeticiones por
ejercicio. Entre dos posiciones distintas aparece la transición (la del manual cuando la hay). **Revisar mi
clase** controla lo mismo que la corrección: cantidad, repeticiones exactas, orden de posiciones del manual
(sin volver a supino después del prono), cantidad de cambios de posición, calentamiento y balance
(flexión, movilidad, extensión, rotación o lateral, tren superior, tren inferior). La clase queda guardada.

**Tu personaje y tu estudio** (pestaña Estudio) — un personaje con nombre propio (el 🎲 propone juegos de
palabras: *Core-azón*, *Pelvis Presley*, *Glúteo Máximo*, *Teaser Rex*…) que se viste a gusto: piel, pelo,
ropa, medias antideslizantes y accesorios. Vive en un estudio que se va llenando con el progreso: la pelota
con la primera lección, la banda, el Magic circle con 3 días seguidos, el rodillo, la pizarra al aprobar una
clase, el Spine corrector, la Wunda chair, el Ladder barrel, el Reformer, el diploma al terminar tus
exámenes y el Cadillac en el nivel 8; también prendas, colores y accesorios. Cada aparato tiene su ficha
y, cuando corresponde, lo que se vio de él en los exámenes. En Inicio te cuenta qué te falta para lo
próximo, al terminar una lección festeja con vos, y si lo tocás, charla. Todo está dibujado en código
(`estudio.js`): no usa imágenes.

**Nueve formatos de ejercicio**

| Formato | Qué hacés |
|---|---|
| Elegir | Opción múltiple, con distractores escritos a mano |
| Seleccionar fichas | Tocás o **arrastrás** las fichas correctas a la línea de respuesta |
| Completar | **Arrastrás** la palabra que falta a cada hueco de la frase |
| Emparejar | Tocás los pares: músculo ↔ acción, cadena ↔ función |
| Ordenar | **Arrastrás** los pasos de cada progresión a su lugar |
| Clasificar | **Arrastrás** cada ficha a su grupo (o tocás la ficha y después el grupo) |
| Flashcard | Predecís si la sabés, girás la tarjeta y calificás qué tan bien salió |
| De memoria | Escribís la lista sin ayuda |
| ¿Qué ejercicio es? | Ves la foto de un ejercicio Pre-Pilates y elegís su nombre |
| Armá tu clase | Diseñás una clase completa y la app la corrige como en el examen |

**Gamificación** — XP, 10 niveles (de *Célula* a *Maestría del movimiento*), racha con protectores,
meta diaria configurable, combos, 15 logros y cierre de lección con estadísticas.

**Música, sonidos y efectos** — música de fondo instrumental en tres estilos (*Calma*, *Lo-fi*,
*Energía*), generada en el momento por el navegador: cada vuelta es distinta, no usa archivos ni
internet. Se prende y apaga con 🎵 (arriba a la derecha o dentro de la lección) o la tecla **M**, y baja
sola cuando suena la respuesta. Los aciertos suenan más agudos a medida que crece el combo; cada 5
seguidos aparece un cartel con bono. Chispas al acertar, fichas que rebotan al caer, confeti y
celebración al subir de nivel. En **Perfil → Música y efectos** se ajustan volúmenes, estilo,
vibración y efectos *Suaves* (sin movimiento; también se activan solos si el sistema pide reducir
animaciones). Todo el código está en `efectos.js`.

**Mapa corporal** — lámina anatómica dibujada en vectores (`mapa.js`), de frente y de espalda. Como en los
atlas, la mitad izquierda muestra la capa superficial y la derecha la profunda. Cada músculo se toca y
muestra su nombre y su región; tocar un nombre de la lista lo señala en la figura (los profundos que no se
ven desde afuera, como el diafragma o el subescapular, aparecen punteados). El juego **¿Dónde está?** te
nombra un músculo y lo buscás en la figura. Es un dibujo didáctico, no una imagen médica real: las formas
y los lugares son correctos a grandes rasgos, pero están simplificados.

**Ejercicios animados** — los 48 ejercicios de Mat 1 y Mat 2 tienen una figura que hace el ejercicio fase
por fase, con el cartel de **Inhala / Exhala** y la acción de cada paso sincronizados (Apuntes → Repertorio),
y el tórax que se expande al inhalar. **Paso a paso:** ◀ ▶ animan un solo paso y se detienen; la barra recorre
cualquier instante del movimiento; ½× y ¼× son cámara lenta; la tira de abajo muestra cada pose clave; ⤢ lo
abre en grande con los pasos del manual. Tres capas opcionales: **Trayectoria** (el camino de manos, pies y
cabeza), **Centro de masa** (con su plomada: verde si cae sobre la base de apoyo, naranja si no) y **Hacia
dónde va** (la pose siguiente, en transparencia). En la práctica con animación, después de responder se puede
abrir el ejercicio paso a paso, y en Inicio hay un **ejercicio del día** animado. Las figuras se dibujan en código
(`figura.js` + `poses.js`): cada pose está definida con los ángulos de cada segmento y se revisó contra la
descripción del manual. No son fotos ni imágenes generadas por IA (que suelen errar manos, pelvis y curvas),
y no tienen derechos de terceros. Se usan también en la pregunta **¿Qué ejercicio es? (animación)**.
El motor (versión 3) trabaja como un muñeco articulado real: proporciones antropométricas estándar, columna
en 4 segmentos (para la curva en C), rodillas que solo flexionan hacia atrás y codos hacia adelante.
Se mueve como un cuerpo: con la velocidad de "mínimo jerk" de los movimientos humanos (arranca y frena
suave); la columna **articula vértebra por vértebra** (en el Roll Up despega primero la cabeza y la lumbar
al final; al bajar apoya primero la pelvis; en el Roll Over y los puentes, al revés); hombros y caderas
giran solo por su rango articular; al rodar (Rolling like a ball, Seal, Open leg rocker, Rocking) el cuerpo
**no patina**: avanza lo que gira; y un brazo o una pierna que bajaría de más **choca con el piso** en vez de
levantar el cuerpo. El **centro de masa** se calcula con las proporciones de cada segmento (Winter) y en las
posiciones de equilibrio (sentado en V, Open leg rocker, planchas, de rodillas) cae sobre la base de apoyo.
Con esto se corrigieron poses: el abdominal despega solo hasta la punta de los omóplatos (la lumbar queda en
el mat), el Roll Over apila la pelvis sobre los hombros con el peso en los omóplatos y nunca en el cuello, y
en el Boomerang los brazos circulan por arriba de la cabeza hasta entrelazarse atrás. Cada
pose declara qué toca el piso (pelvis, espalda, pies, talones, puntas, manos, rodillas, antebrazos) y el
motor calcula rodillas y codos con cinemática inversa para que esos puntos queden en el piso en **todos**
los cuadros; lo que está apoyado en dos poses seguidas queda clavado y no patina. Los agarres (manos en los
tobillos, en la nuca, bajo la pelvis) también se calculan. Un control automático revisa cada cuadro de las
61 animaciones: apoyos que no tocan el piso, partes que lo atraviesan, articulaciones fuera de rango,
agarres que no llegan, saltos bruscos (más de ~3,5 m/s) y poses de equilibrio con el centro de masa fuera
de la base. Todas lo pasan.
Para revisar o corregir una pose: abrí `_galeria.html` con el servidor local (muestra cada transición y
el resultado del control).

**Familias** (Apuntes) — los ejercicios de cada posición en Pre-Pilates, Mat 1 y Mat 2, con su foto o su
figura: se ve de un vistazo qué prepara a qué. Tocar un ejercicio abre su foto o su animación paso a paso.
En las fichas del análisis (MAT 1 y MAT 2, dentro de cada ejercicio del Repertorio) las regresiones y
progresiones también tienen miniatura y se pueden tocar. Las preguntas sobre un ejercicio en particular
(objetivos, regresiones, accesorios) muestran su figura, y en Armá tu clase cada ejercicio tiene la suya.

**Posiciones** — las 13 posiciones base (supino, prono, sedente, en silla, 4 puntos, planchas, decúbito
lateral, de rodillas, bípedo…) dibujadas con la misma figura; los ejercicios Pre-Pilates sin foto muestran
la figura de su posición.

**Manual** — las secciones de los tres manuales con su página, y las figuras del módulo 1 dibujadas a partir
del texto: plomada lateral y frontal con puntos que se tocan, pelvis con deslizador y el tazón de agua,
curvas de la columna y escoliosis, rodillas (hiperextensión, valgo, varo), pie visto desde atrás,
escápulas, síndromes cruzados de Janda, etapas del aprendizaje motor y orden de posiciones de una clase.

**Práctica libre** — Armá tu clase, Simulacro de examen, o elegís formato y unidad. **Mapa corporal** (con zoom: pellizcá, tocá dos veces o usá + / −), **Apuntes** con buscador y
**Perfil** con tu memoria por unidad, calibración, ajustes, copias y respaldo.

---

## Cómo está pensada (y por qué)

| Principio | Cómo aparece | Base |
|---|---|---|
| **Repetición espaciada con modelo de memoria** | Algoritmo **FSRS-5**. Cada ejercicio tiene dificultad, estabilidad (días que aguanta el recuerdo) y probabilidad de recordarlo hoy; el repaso se programa justo cuando esa probabilidad cae a tu retención objetivo (85, 90 o 95 %). Reemplaza al SM-2 de la versión anterior. | Ye, Su y Cao (2022); Cepeda y col. (2006) |
| **Práctica de recuperación** | Nunca se muestra la respuesta primero. | Roediger y Karpicke (2006); Adesope y col. (2017) |
| **Retroalimentación inmediata y elaborada** | Tras cada respuesta: qué estaba bien y mal, la solución y el *porqué*. | Hattie y Timperley (2007); Wisniewski, Zierer y Hattie (2020) |
| **Reaprendizaje sucesivo** | Lo que fallás vuelve antes de terminar la sesión, con un formato más asistido, hasta acertarlo. | Rawson y Dunlosky (2011) |
| **Andamiaje que se retira** | Un concepto nuevo se practica reconociendo (elegir, fichas); cuando su recuerdo ya es estable, se pasa a producir (flashcard, escritura). | Renkl y Atkinson (2003); Bjork y Bjork (2011) |
| **Efecto de generación** | Escribir de memoria y completar, en vez de solo reconocer. | Slamecka y Graf (1978) |
| **Intercalado** | Las lecciones mezclan lo nuevo con repasos de otras unidades. | Rohrer y Taylor (2007); Brunmair y Richter (2019) |
| **Metacognición y calibración** | En las flashcards predecís antes de ver; la app mide si tu sensación de saber es confiable. | Dunlosky y Rawson (2012) |
| **Hipercorrección** | Un error cometido con seguridad y bien corregido se recuerda especialmente bien; hay un logro para eso. | Butterfield y Metcalfe (2001) |
| **Errores sin castigo** | No hay "vidas": equivocarse no te saca de la lección. Intentar y fallar, con corrección, también enseña. | Kornell, Hays y Bjork (2009) |
| **Gamificación orientada al hábito y al dominio** | XP, racha, meta diaria y logros que premian conductas de aprendizaje (constancia, corregir errores, calibrarse), no solo puntos. | Sailer y Homner (2020); Bai, Hew y Huang (2020) |
| **Sonido al servicio de la retroalimentación** | El acierto y el error tienen sonidos distintos y breves; el de error es suave, no punitivo. La música **no mejora el aprendizaje por sí misma**: se ofrece por gusto y ánimo, siempre **sin letra** (la voz compite con la memoria de trabajo al leer), opcional y a volumen bajo. | Salamé y Baddeley (1989); Perham y Currie (2014); Kämpfe, Sedlmeier y Renkewitz (2011) |
| **Autonomía** | Todas las unidades están abiertas; la app recomienda por dónde seguir. | Ryan y Deci (2000) |
| **Codificación dual** | El mapa corporal asocia cada músculo a su lugar en el cuerpo. | Paivio (1986) |

### Una decisión de contenido importante

Los distractores (las opciones incorrectas) se revisaron uno por uno. Donde un músculo **no figura** en
la lista de tus apuntes pero la anatomía lo respalda —por ejemplo, el semimembranoso también flexiona
la rodilla, o "gemelos" es como se le dice al gastrocnemio—, **nunca se ofrece como incorrecto**.
Castigar un conocimiento verdadero enseñaría lo contrario de lo que se busca. La lista está comentada
en `datos.js`, en el bloque `EXCLUSIONES`.

En Clasificar, algunos músculos se aceptan en más de un grupo cuando la anatomía lo justifica
(el pectíneo aduce y también flexiona la cadera).

Los campos **"Por qué"** agregan el razonamiento fisiológico que conecta los datos. Son un apoyo para
entender, no texto literal de tus apuntes: contrastalos con tu manual antes de darlos por examinables.

---

## Cómo compartirla

**`AnatoApp.html`** es la app entera en un solo archivo (~1,6 MB, con las fotos). Mandalo por WhatsApp o correo:
la otra persona le hace doble clic y funciona sin internet, con **su propio** progreso.

Desde **Perfil → Guardar y compartir** la app genera copias de sí misma:
- **Copia con mi progreso** — tu avance incrustado adentro, para llevarlo a otra computadora en un archivo.
- **Copia limpia** — desde cero: es la que conviene mandarle a otra persona.

Un archivo HTML **no puede reescribirse solo** mientras lo usás (ningún navegador lo permite), así que
guardar la copia es una acción explícita, como guardar un documento.

---

## Respaldo

El progreso vive en el navegador y **no se sincroniza con Google Drive**.
**Perfil → Exportar progreso** baja un `.json` (no hace falta abrirlo); **Importar** lo recupera.

---

## Agregar o corregir contenido

El contenido está en **`datos.js`** (apuntes), **`datos-mat1.js`** (fichas del MAT 1),
**`datos-mat2.js`** (fichas del MAT 2 y preguntas de familias) y **`datos-examenes.js`** (tus exámenes),
comentados. Las familias por posición se regeneran con `python importar_familias.py` a partir de
`fuentes/familias.json`.
Además de las tarjetas (`CARDS`) hay `CLOZES` (completar), `PARES` (emparejar), `CLASIFICACIONES` y
`SECUENCIAS` (ordenar). Los ejercicios Pre-Pilates no se editan a mano: corregí la planilla y corré
`python importar_premat.py "ruta/a/Principios Movimiento y Posiciones.xlsx"`.
El material de Balanced Body se actualiza reemplazando los JSON de `fuentes/` y corriendo
`python importar_bb.py`. Después de editar, ejecutá en esta carpeta:

```
python empaquetar.py
```

y se regenera `AnatoApp.html` con tus cambios. Tu progreso no se pierde.

---

## Referencias

- Adesope, O. O., Trevisan, D. A. y Sundararajan, N. (2017). Rethinking the use of tests: A meta-analysis of practice testing. *Review of Educational Research, 87*(3).
- Bai, S., Hew, K. F. y Huang, B. (2020). Does gamification improve student learning outcome? *Educational Research Review, 30*.
- Bjork, E. L. y Bjork, R. A. (2011). Making things hard on yourself, but in a good way: Creating desirable difficulties to enhance learning.
- Brunmair, M. y Richter, T. (2019). Similarity matters: A meta-analysis of interleaved learning and its moderators. *Psychological Bulletin, 145*(11).
- Butterfield, B. y Metcalfe, J. (2001). Errors committed with high confidence are hypercorrected. *JEP: Learning, Memory, and Cognition, 27*(6).
- Cepeda, N. J. y col. (2006). Distributed practice in verbal recall tasks: A review and quantitative synthesis. *Psychological Bulletin, 132*(3).
- Dunlosky, J. y Rawson, K. A. (2012). Overconfidence produces underachievement. *Learning and Instruction, 22*(4).
- Hattie, J. y Timperley, H. (2007). The power of feedback. *Review of Educational Research, 77*(1).
- Kämpfe, J., Sedlmeier, P. y Renkewitz, F. (2011). The impact of background music on adult listeners: A meta-analysis. *Psychology of Music, 39*(4).
- Kornell, N., Hays, M. J. y Bjork, R. A. (2009). Unsuccessful retrieval attempts enhance subsequent learning. *JEP: LMC, 35*(4).
- Perham, N. y Currie, H. (2014). Does listening to preferred music improve reading comprehension performance? *Applied Cognitive Psychology, 28*(2).
- Paivio, A. (1986). *Mental representations: A dual coding approach*. Oxford University Press.
- Rawson, K. A. y Dunlosky, J. (2011). Optimizing schedules of retrieval practice for durable and efficient learning. *JEP: General, 140*(3).
- Renkl, A. y Atkinson, R. K. (2003). Structuring the transition from example study to problem solving. *Educational Psychologist, 38*(1).
- Roediger, H. L. y Karpicke, J. D. (2006). Test-enhanced learning. *Psychological Science, 17*(3).
- Rohrer, D. y Taylor, K. (2007). The shuffling of mathematics problems improves learning. *Instructional Science, 35*(6).
- Ryan, R. M. y Deci, E. L. (2000). Self-determination theory and the facilitation of intrinsic motivation. *American Psychologist, 55*(1).
- Salamé, P. y Baddeley, A. (1989). Effects of background music on phonological short-term memory. *Quarterly Journal of Experimental Psychology, 41A*(1).
- Sailer, M. y Homner, L. (2020). The gamification of learning: A meta-analysis. *Educational Psychology Review, 32*.
- Slamecka, N. J. y Graf, P. (1978). The generation effect. *JEP: Human Learning and Memory, 4*(6).
- Wisniewski, B., Zierer, K. y Hattie, J. (2020). The power of feedback revisited. *Frontiers in Psychology, 10*.
- Ye, J., Su, J. y Cao, Y. (2022). A stochastic shortest path algorithm for optimizing spaced repetition scheduling. *KDD '22*. (FSRS: open-spaced-repetition.)
