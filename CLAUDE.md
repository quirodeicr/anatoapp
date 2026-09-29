# AnatoApp — contexto del proyecto para Claude Code

App de estudio de **anatomía aplicada al método Pilates**, hecha a partir del material de la usuaria:
apuntes manuscritos, Análisis MAT 1, planilla de Principios del Movimiento (Pre-Pilates) y los manuales
de Balanced Body (Principios del Movimiento módulo 1, Mat 1, Mat 2). La usa para estudiar y la comparte
como un único archivo HTML. Textos en **voseo rioplatense y sin género** ("Todavía no", "otra persona").

## Entorno y reglas de trabajo

- El proyecto vive en el repo de GitHub `quirodeicr/anatoapp` (raíz del repo; antes era la carpeta `Anatoapp`). Finales de línea LF (`.gitattributes`); `publicar/` no se versiona.
- **Sin Node.js ni build tools.** JavaScript plano; los scripts auxiliares son Python 3 (pymupdf, openpyxl, Pillow para los importadores).
- `index.html` carga los `.js` sueltos (versión de carpeta). **Después de cualquier cambio** correr:
  ```
  python empaquetar.py
  ```
  que genera `AnatoApp.html` (archivo único para compartir; incrusta cada `<script src>`). El empaquetador neutraliza `</script` dentro del JS: nunca escribir esa secuencia en comentarios.
- Versión web (Artifact de claude.ai): `python web_artefacto.py` genera `publicar/anatoapp-web.html` (sin `<html>/<head>/<body>`) para publicar con la herramienta Artifact. El link anterior (`claude.ai/artifact/L8qvjqdFibzG6ySjWwFx9k`) pertenece a la cuenta vieja: en una cuenta nueva hay que publicar un artifact nuevo.
- Probar con el servidor local: configuración `anatoapp` de `.claude/launch.json` (puerto 8777). Tras editar, forzar recarga (`fetch(url,{cache:'reload'})` y `location.reload()`), el navegador cachea los `.js`.
- El progreso de estudio vive en `localStorage` del navegador (llave `'anatoapp.v1'`, adentro estado v2; migra solo desde v1). No está en los archivos: se exporta desde la app (Perfil → Exportar progreso o "Copia con mi progreso").

## Archivos

| Archivo | Qué es |
|---|---|
| `app.js` | Motor: FSRS-5, ítems, formatos de ejercicio, sesiones, vistas, gamificación, zoom del mapa, apuntes (repertorio, manual, posiciones). |
| `datos.js` | Tarjetas de los apuntes manuscritos, CLOZES, PARES, CLASIFICACIONES, SECUENCIAS, REGIONES (mapa), REPERTORIO, LOGROS. Bloques EXCLUSIONES y OPCIONES. |
| `datos-mat1.js` | Fichas del Análisis MAT 1 (25) + ítems derivados y unidades u12/u13. |
| `datos-premat.js`, `imagenes.js` | 99 ejercicios Pre-Pilates y 109 fotos. **Generados** por `importar_premat.py` desde la planilla "Principios Movimiento y Posiciones.xlsx". |
| `datos-bb.js` | Material Balanced Body. **Generado** por `importar_bb.py` desde `fuentes/*.json` (+ `fuentes/quiz_revisado.json`). |
| `contenido-bb.js` | Convierte datos-bb en práctica: temas bb-mov/bb-mat1/bb-mat2, unidades u14–u16, flashcards, preguntas, ordenar, osteoporosis, ANIMS ("¿Qué ejercicio es?" animado). |
| `figura.js` | Motor de la figura articulada (v2). |
| `poses.js` | Poses de 48 ejercicios de Mat 1/Mat 2 y 13 posiciones. |
| `diagramas.js` | Figuras del manual en SVG (plomada, pelvis con deslizador, columna, rodillas, pies, escápulas, Janda, aprendizaje motor, orden de clase). |
| `mapa.js` | Lámina anatómica del mapa corporal (LAMINA): frente/espalda, mitad superficial y mitad profunda. |
| `efectos.js` | Música generativa, sonidos (Web Audio, sin archivos) y efectos visuales. |
| `_galeria.html` | Herramienta de control de poses (no se empaqueta): `_galeria.html#mat1-e0` muestra cada transición y las fallas del validador. |
| `fuentes/` | JSON del material Balanced Body y `quiz_revisado.json` (preguntas rebalanceadas). |
| `LÉEME.md` | Documentación para la usuaria (fuentes, formatos, principios con referencias). |

## Criterios de contenido (importantes)

- **Distractores:** nunca ofrecer como incorrecto algo anatómicamente cierto aunque no figure en los apuntes (EXCLUSIONES en datos.js; `tambien` en clasificaciones).
- La usuaria se quejó de que **la respuesta correcta a veces era obvia**. Reglas: la correcta no debe medir más de ~1,3× la opción más larga ni tener palabras exclusivas de la pregunta; en opción múltiple usar `op` (respuesta corta) + `dist` paralelos que cambian un dato; listas con `dist` propio no se rellenan con listas ajenas (`noDonar`); cloze con `dist` por hueco; fotos y animaciones con distractores de la misma posición. Las 30 preguntas del material BB se reescribieron por esto (`fuentes/quiz_revisado.json`): no volver a las originales.
- Datos inconsistentes de las planillas (columnas de músculos/plano autogeneradas, Push Up del MAT 1 que copia accesorios del Seal) se muestran marcados **revisar** pero no se preguntan. Fotos con el nombre escrito se recortan en `importar_premat.py` (CON_TEXTO); fotos casi iguales en PARECIDAS; dudosas en FOTO_DUDOSA.
- Los "Por qué" son elaboración propia, no texto de los apuntes.
- Las fotos Pre-Pilates parecen del manual del curso: advertir antes de compartir públicamente.

## Gráficos y animaciones (la usuaria insiste: deben ser precisos y exactos)

- Decisión: **figura articulada propia**, no imágenes de Google (derechos) ni generadas por IA (poses erradas).
- `figura.js` v2: proporciones antropométricas; columna en 4 segmentos. Pose = `tr` (dirección del tronco), `fl` (flexión de columna, + enrolla), `cab` (cuello), `bc/bl/pc/pl` = brazos/piernas `[ángulo absoluto, flexión ≥0, muñeca/tobillo]`, `apoyo` = lo que toca el piso (pelvis, tronco, espalda, hombros, cabeza, pieC/L, talonC/L, puntaC/L, manoC/L, rodillaC/L, antebrazoC/L), `ik` = agarres (tobilloC, pantorrillaC, rodillaC, nuca, pelvis, cintura, sien), `k` = escorzos, `s` = paso del manual. Supino con la cabeza a la izquierda; prono con la cabeza a la derecha.
- El motor resuelve rodillas y codos con cinemática inversa; lo apoyado en dos poses seguidas queda clavado (no patina). Opciones por ejercicio: `vista:'frente'`, `camara:'arriba'`, `persp` (sentado visto de frente), `rueda` (rodar), `ancla`, `libre`.
- **Toda pose nueva debe pasar `FIGURA.validar(ej)` con 0 fallas** (apoyos que flotan, partes que atraviesan el piso, articulaciones fuera de rango, agarres que no llegan, saltos). Hoy las 61 pasan.

## Otras decisiones

- Neuropedagogía: FSRS-5, práctica de recuperación, retroalimentación elaborada, reaprendizaje en la misma sesión, andamiaje que se retira (reconocer → producir), intercalado, calibración metacognitiva, hipercorrección, errores sin castigo.
- Música instrumental opcional (la música no mejora el aprendizaje por sí misma; se baja sola en la retroalimentación). En iPhone el audio se desbloquea en touchend/pointerup/click y usa `navigator.audioSession='playback'` o un `<audio>` silencioso para sonar con el interruptor de silencio (confirmado que funciona).
- Mapa corporal: cada forma lleva los nombres EXACTOS de REGIONES (datos.js); si se agregan músculos, darles forma en mapa.js. Zoom con pellizco, doble toque y botones.

## Pendiente conocido

- Material BB: faltan los módulos 2 a 5 de Principios del Movimiento (el material de origen los marca como pendientes). Cuando lleguen: copiarlos a `fuentes/`, sumarlos a FUENTES en `importar_bb.py` y correrlo.
