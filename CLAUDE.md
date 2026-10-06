# Pilates Lab (antes AnatoApp) — contexto del proyecto para Claude Code

App de estudio de **anatomía aplicada al método Pilates** (se llamaba AnatoApp; la usuaria la renombró **Pilates Lab**), hecha a partir del material de la usuaria:
apuntes manuscritos, Análisis MAT 1, planilla de Principios del Movimiento (Pre-Pilates) y los manuales
de Balanced Body (Principios del Movimiento módulo 1, Mat 1, Mat 2). La usa para estudiar y la comparte
como un único archivo HTML. Textos en **voseo rioplatense y sin género** ("Todavía no", "otra persona").

## Entorno y reglas de trabajo

- El proyecto vive en el repo de GitHub `quirodeicr/anatoapp` (raíz del repo; antes era la carpeta `Anatoapp`). Finales de línea LF (`.gitattributes`); `publicar/` no se versiona.
- Orden de carga (index.html): datos… → contenido-bb.js → datos-examenes.js → datos-familias.js → datos-mat2.js → diagramas/mapa/efectos → estudio.js → clase.js → planes.js → privado/fotos-mat3.js (si existe) → app.js (estadoInicial usa `PJ_BASE` de estudio.js).
- **Sin Node.js ni build tools.** JavaScript plano; los scripts auxiliares son Python 3 (pymupdf, openpyxl, Pillow para los importadores).
- `index.html` carga los `.js` sueltos (versión de carpeta). **Después de cualquier cambio** correr:
  ```
  python empaquetar.py
  ```
  que genera `PilatesLab.html` (archivo único para compartir; incrusta cada `<script src>`; **sin** las fotos de `privado/`, porque se versiona y el repo es público). `python empaquetar.py --con-fotos` genera `publicar/PilatesLab-con-fotos.html` (no se versiona) con las fotos de Mat 3 Props. El empaquetador neutraliza `</script` dentro del JS: nunca escribir esa secuencia en comentarios.
- Versión web (Artifact de claude.ai): `python web_artefacto.py` genera `publicar/pilateslab-web.html` (sin `<html>/<head>/<body>`) desde la versión con fotos si existe (la usuaria aprobó las fotos en la web, con las caras de terceros pixeladas). Artifact de la app: `claude.ai/artifact/ShiXvKGB2tZCJSLnNYx4tZ` (compartido por link); laboratorio: `claude.ai/artifact/4g9xHumekKC7w9e8j4Kr42`.
- Probar con el servidor local: configuración `anatoapp` de `.claude/launch.json` (puerto 8777). Tras editar, forzar recarga (`fetch(url,{cache:'reload'})` y `location.reload()`), el navegador cachea los `.js`.
- El progreso de estudio vive en `localStorage` del navegador (llave `'anatoapp.v1'` — no cambiarla al renombrar, ni `'anatoapp.tema'`; adentro estado v2; migra solo desde v1). No está en los archivos: se exporta desde la app (Perfil → Exportar progreso o "Copia con mi progreso").

## Archivos

| Archivo | Qué es |
|---|---|
| `app.js` | Motor: FSRS-5, ítems, formatos de ejercicio, sesiones, vistas, gamificación, zoom del mapa, apuntes (repertorio, manual, posiciones). |
| `datos.js` | Tarjetas de los apuntes manuscritos, CLOZES, PARES, CLASIFICACIONES, SECUENCIAS, REGIONES (mapa), REPERTORIO, LOGROS. Bloques EXCLUSIONES y OPCIONES. |
| `datos-mat1.js` | Fichas del Análisis MAT 1 (25) + ítems derivados y unidades u12/u13. |
| `datos-premat.js`, `imagenes.js` | 99 ejercicios Pre-Pilates y 109 fotos. **Generados** por `importar_premat.py` desde la planilla "Principios Movimiento y Posiciones.xlsx". |
| `datos-bb.js` | Material Balanced Body. **Generado** por `importar_bb.py` desde `fuentes/*.json` (+ `fuentes/quiz_revisado.json`). |
| `contenido-bb.js` | Convierte datos-bb en práctica: temas bb-mov/bb-mat1/bb-mat2, unidades u14–u16, flashcards, preguntas, ordenar, osteoporosis, ANIMS ("¿Qué ejercicio es?" animado). |
| `datos-examenes.js` | Los 4 exámenes previos de BB (Principios 35/37, Mat 1 77/96, Mat 2 62/116, Mat 3 30/77): temas ex-pm/ex-mat, unidades u17/u18 (68 ítems, `examen: {ex, n, fallada, formato}`), EXAMENES, LECCIONES_EXAMEN y REVISION_EXAMEN (Apuntes → Tus exámenes). Fuente: `fuentes/examenes-previos.md`. |
| `datos-mat2.js` | Análisis MAT 2 (23 fichas de "Mat 2 ordenado.xlsx", `bb` = ejercicio del manual), tema `mat2an` (u19) y preguntas de familias, tema `familias` (u20). `EJ_REF(nombre, libro)` resuelve un nombre a su ficha (`{pm}` con foto o `{bb}` con animación). Copia textual en `fuentes/mat2-analisis.json`. |
| `datos-familias.js` | 146 ejercicios por familia de posición y libro. **Generado** por `importar_familias.py` desde `fuentes/familias.json` (hojas de familias de "Resumen Todos los ejercicios.xlsx"; su primera hoja es la planilla de Principios que ya estaba). |
| `clase.js` | "Armá tu clase" (Práctica): arma una clase con BB.ejercicios + Pre-Pilates y la revisa como la corrección (cantidad, reps exactas, orden de posiciones, transiciones, calentamiento, balance). Estado en `S.clase`, `S.clasesOk`. |
| `planes.js` | "Mis sesiones" (pestaña 📋 Sesiones): planificador de clases reales que quedan guardadas en `S.planes` (nombre, fecha, para, duración, focos, notas; ejercicios BB + Pre-Pilates con reps, accesorio, foto de Mat 3 si hay y nota). Revisión (orden, transiciones, reps, calentamiento, balance, osteoporosis, duración), copiar como texto, duplicar; "Guardar como sesión" desde Armá tu clase. Reusa POS_CLASE, TRANSICIONES, rangoReps… de clase.js. |
| `estudio.js` | Personaje y estudio (pestaña Estudio, tarjeta en Inicio, festejo en el cierre de lección): avatar SVG personalizable, aparatos/prendas/accesorios que se desbloquean por nivel, lecciones, racha, logros, clases aprobadas. Estado en `S.pj` (`vistos` = desbloqueos ya anunciados). |
| `figura.js` | Motor de la figura articulada (v3): mínimo jerk, columna articulada por segmentos, articulaciones por rango, rodar sin deslizar, choque con el piso, centro de masa; reproductor con paso a paso, deslizador, velocidad y capas (trayectoria, centro de masa, pose siguiente) y respiración. |
| `poses.js` | Poses de 48 ejercicios de Mat 1/Mat 2 y 13 posiciones. |
| `diagramas.js` | Figuras del manual en SVG (plomada, pelvis con deslizador, columna, rodillas, pies, escápulas, Janda, aprendizaje motor, orden de clase). |
| `mapa.js` | Lámina anatómica del mapa corporal (LAMINA): frente/espalda, mitad superficial y mitad profunda. |
| `efectos.js` | Música generativa, sonidos (Web Audio, sin archivos) y efectos visuales. |
| `_galeria.html` | Herramienta de control de poses (no se empaqueta): `_galeria.html#mat1-e0` muestra cada transición y las fallas del validador. |
| `importar_mat3.py` | Extrae fotos y textos de "Mat 3 Props.xlsx" (19 hojas, 116 fotos: el ejercicio con bola, ligas, pesa, círculo, roller) a `privado/`: pixela las caras de quienes miran la clase (CARAS, revisadas foto por foto), recorta los textos de capturas de chat (CORTE), achica a JPEG, saca lo personal de las observaciones. `EJERCICIO` mapea hoja → ejercicios (Hundred → e01 y e02; "Roll up" es Rolling like a ball). |
| `privado/` | **No se versiona** (el repo es público): `mat3/` (fotos procesadas y `mat3.json`) y `fotos-mat3.js` (`FOTOS_MAT3[id]`, base64), que index.html carga y la vista "Fotos con props" del visor muestra si existe. Se regenera con `importar_mat3.py "Mat 3 Props.xlsx"`. |
| `prueba-figura/` | Laboratorio de la modelo anatómica (no se empaqueta): `pagina.html`, `poses-prueba.js` (Roll Up, Swan, Side Leg Kicks y Spine Twist desde arriba), `armar.py` → `publicar/prueba-figura.html`. |
| `fuentes/` | JSON del material Balanced Body, `quiz_revisado.json` (preguntas rebalanceadas) y `examenes-previos.md` (transcripción de los exámenes; los PDF no se versionan porque tienen datos personales). |
| `LÉEME.md` | Documentación para la usuaria (fuentes, formatos, principios con referencias). |

## Criterios de contenido (importantes)

- **Distractores:** nunca ofrecer como incorrecto algo anatómicamente cierto aunque no figure en los apuntes (EXCLUSIONES en datos.js; `tambien` en clasificaciones).
- La usuaria se quejó de que **la respuesta correcta a veces era obvia**. Reglas: la correcta no debe medir más de ~1,3× la opción más larga ni tener palabras exclusivas de la pregunta; en opción múltiple usar `op` (respuesta corta) + `dist` paralelos que cambian un dato; listas con `dist` propio no se rellenan con listas ajenas (`noDonar`); cloze con `dist` por hueco; fotos y animaciones con distractores de la misma posición. Las 30 preguntas del material BB se reescribieron por esto (`fuentes/quiz_revisado.json`): no volver a las originales.
- Datos inconsistentes de las planillas (columnas de músculos/plano autogeneradas, Push Up del MAT 1 que copia accesorios del Seal) se muestran marcados **revisar** pero no se preguntan. Fotos con el nombre escrito se recortan en `importar_premat.py` (CON_TEXTO); fotos casi iguales en PARECIDAS; dudosas en FOTO_DUDOSA.
- Los "Por qué" son elaboración propia, no texto de los apuntes.
- Exámenes: "Todas las anteriores" / "A y B" / "Ninguna" no sobreviven a mezclar opciones → pasan a lista ("seleccioná las correctas") o a emparejar. Lo que la revisión no aclara (grilla de la bola de Mat 3, 3.er ejercicio escapular de Mat 2) no se pregunta. Las falladas van primero en su tema.
- Análisis MAT 2 y familias: los nombres se corrigen sin cambiar el contenido; lo contradictorio o corrido de columna va en `revisar` y no se pregunta (Hip circles: tu planilla dice supino, el manual sentado). "Seated twist" de Mat 2 es el Twist del manual, no el Seated Twist de Pre-Pilates. Las ilustraciones de preguntas (`ilusPregunta`) solo aparecen si la pregunta nombra un único ejercicio y no pregunta posición ni familia.
- Personaje: nada de género en los textos; los tonos de piel y los peinados son todos libres (se desbloquean colores de fantasía, prendas, accesorios y aparatos). Las fichas de aparatos solo afirman lo que está en el material o es conocimiento general ("se cuenta que…" para las anécdotas).
- Las fotos Pre-Pilates parecen del manual del curso: advertir antes de compartir públicamente.

## Gráficos y animaciones (la usuaria insiste: deben ser precisos y exactos)

- Decisión: **figura articulada propia**, no imágenes de Google (derechos) ni generadas por IA (poses erradas).
- `figura.js` v2: proporciones antropométricas; columna en 4 segmentos. Pose = `tr` (dirección del tronco), `fl` (flexión de columna, + enrolla), `cab` (cuello), `bc/bl/pc/pl` = brazos/piernas `[ángulo absoluto, flexión ≥0, muñeca/tobillo]`, `apoyo` = lo que toca el piso (pelvis, tronco, espalda, hombros, cabeza, pieC/L, talonC/L, puntaC/L, manoC/L, rodillaC/L, antebrazoC/L), `ik` = agarres (tobilloC, pantorrillaC, rodillaC, nuca, pelvis, cintura, sien), `k` = escorzos, `s` = paso del manual. Supino con la cabeza a la izquierda; prono con la cabeza a la derecha.
- El motor resuelve rodillas y codos con cinemática inversa; lo apoyado en dos poses seguidas queda clavado (no patina). Opciones por ejercicio: `vista:'frente'`, `camara:'arriba'`, `persp` (sentado visto de frente), `rueda` (rodar), `ancla`, `libre`.
- Transiciones (v3): `mezclar()` interpola con mínimo jerk; `articulacion()` decide el orden de los segmentos (ancla pelvis: al despegar/flexionar va primero la cabeza, al apoyar/enderezar la pelvis; ancla hombros: al revés; `art` en la pose lo fuerza). Brazos orientados en el espacio y piernas en el aire con la pelvis cuando la columna articula; el sentido de giro lo decide el rango articular (`giro: {bc: ±1}` lo obliga, p. ej. circunducción del Boomerang). `rueda`: la cadera avanza h·Δθ (se ignora `dx`). Miembros libres que atravesarían el piso giran hasta apoyarse (`chocar`); la mano o el pie que se apoya o despega en esa transición se queda en el piso doblando el codo o la rodilla (`cambian`).
- Modo fluido (v4): el ciclo se divide en frases entre **paradas naturales** (pose inicial, cambios de sentido —el movimiento gira más de ~100°—, sostenes; `alto: true/false` en la pose lo fuerza, `ej.continuo` saca la inicial). Cada frase acelera, va pareja y frena (`rampa`, smoothstep); por dentro cada canal (segmento de columna, cabeza, miembros, `rot`) sigue una cúbica de Hermite monótona (PCHIP, `fluidez()`), así pasa por los pasos intermedios sin frenar; lo que se apoya o despega llega con velocidad 0 y un miembro apoyado se mueve en bloque. `pausa` en la pose acorta el respiro en una parada. Inercia: un brazo en el aire que lleva el tronco arranca un poco después y lo pasa apenas al frenar (solo junto a paradas, `inercia()` en `mezclar`). El fantasma ("Hacia dónde va") aparece con un fundido de 220 ms y en modo fluido muestra el final de la frase.
- Estilo anatómico (laboratorio): silueta slim y grácil (la usuaria la prefiere aunque difiera levemente de un cuerpo real). Glúteo anclado a la pelvis (domo que acompaña la flexión), busto sostenido con pliegue, hombros en pendiente (trapecio y clavícula) y el pecho que se funde con el borde del cuello (puntos en el marco del cuello), pliegue de la ingle en la bisectriz, rodilla y codo como arco (`arco()`), manos y pies finos; lo blando se apoya y se aplana contra el piso; `suave()` acepta esquinas (`esq`) para cortes sin bultos. Respiración diafragmática/lateral: el pecho casi no sube. Sin capa de columna vertebral en el laboratorio (la usuaria no la quiere).
- Vista desde arriba (estilo anatómico): de costado es la misma silueta que de perfil (`dibujoAnat`); sentado (`vista:'frente'`) usa `dibujoArriba` (coronilla con rodete, tórax que gira con `rot` sobre la pelvis quieta, piernas y pies desde arriba). Mat a escala (180 × 60 cm) y sombra en el mat.
- **Toda pose nueva debe pasar `FIGURA.validar(ej)` con 0 fallas** (apoyos que flotan, partes que atraviesan el piso, articulaciones fuera de rango, agarres que no llegan, saltos de más de 30 unidades cada 100 ms, y en poses de equilibrio el centro de masa fuera de la base de apoyo real), **por pasos y en modo fluido** (en tiempo real, 25 cuadros por segundo). Hoy las 61 y las 4 del laboratorio pasan. Validación rápida sin navegador: cargar figura.js y poses.js en un `vm` de Node.

## Otras decisiones

- Neuropedagogía: FSRS-5, práctica de recuperación, retroalimentación elaborada, reaprendizaje en la misma sesión, andamiaje que se retira (reconocer → producir), intercalado, calibración metacognitiva, hipercorrección, errores sin castigo.
- Música instrumental opcional (la música no mejora el aprendizaje por sí misma; se baja sola en la retroalimentación). En iPhone el audio se desbloquea en touchend/pointerup/click y usa `navigator.audioSession='playback'` y además, siempre en iPhone/iPad, un `<audio>` silencioso en bucle (48 kHz estéreo; si la página bloquea `data:`, pasa a `blob:`) para sonar con el interruptor de silencio. WebKit ignora `audioSession` dentro de un iframe sin permiso de micrófono (la versión web de claude.ai): ahí depende del `<audio>`.
- Mapa corporal: cada forma lleva los nombres EXACTOS de REGIONES (datos.js); si se agregan músculos, darles forma en mapa.js. Zoom con pellizco, doble toque y botones.

## Pendiente conocido

- "Mat 3 Props.xlsx" (Drive, 68 MB; se baja con `drive.usercontent.google.com/download?id=1qx1I1jHBVGPNZetbjWyqhWbmQUc9wb8x&export=download&confirm=t`): ya está en la app (vista "Fotos con props" en 20 ejercicios). Las hojas sin fotos (Teaser, Hip Circles, Corkscrew, Spine Twist, Side Series) tienen solo texto: falta sumar sus textos de props.
- Modelo anatómica: está en el laboratorio; generalizarla a las 48 animaciones y a la app recién cuando la usuaria la apruebe. Ya se hizo lo que pidió (sin capa de columna, sin piquito entre cuello y pecho, silueta slim y grácil, rodilla y codo en arco, sin línea del deltoides, manos y pies finos). Al generalizar, revisar las rodillas que la cinemática inversa dobla sin que la pose lo pida (`rodillas.js` en el scratchpad lo detectaba): Plancha prona, Push Ups, Leg Pull Down y Jackknife; en el Roll Up se arregló dejando deslizar los talones (`libre`) al flexionar o estirar los pies.

- Material BB: faltan los módulos 2 a 5 de Principios del Movimiento (el material de origen los marca como pendientes). Cuando lleguen: copiarlos a `fuentes/`, sumarlos a FUENTES en `importar_bb.py` y correrlo.
