# Material de estudio: Balanced Body (Principios del Movimiento, Mat 1, Mat 2)

Contenido de estudio redactado a partir del manual (2.ª edición), un archivo JSON por módulo. No es una transcripción: son resúmenes, puntos clave, flashcards, preguntas y descripciones de figuras, cada uno con la página del manual físico para consultarlo.

## Archivos

- `modulo-01.json`: Ver el cuerpo en movimiento (págs. 1–21). Listo.
- `modulo-02.json`: Integración del tronco (págs. 22–67). Pendiente.
- `modulo-03.json`: Fuerza y potencia del tren inferior (págs. 68–92). Pendiente.
- `modulo-04.json`: Fuerza y equilibrio del tren superior (págs. 93–127). Pendiente.
- `modulo-05.json`: Movilidad, flexibilidad y recuperación (págs. 128–147). Pendiente.
- `mat1.json`: Mat 1, una guía detallada para enseñar Pilates (págs. 1–84). Listo: 25 ejercicios + 9 secciones.
- `mat2.json`: Mat 2 (págs. 1–73). Listo: 23 ejercicios + 4 secciones nuevas (lo repetido de Mat 1 no se duplica).

## Estructura de cada módulo

| Campo | Contenido |
|---|---|
| `secciones[]` | `id`, `titulo`, `paginas_manual` [inicio, fin], `resumen`, `puntos_clave[]` (y a veces tablas como `musculos_por_accion`) |
| `flashcards[]` | `id`, `frente`, `reverso`, `paginas_manual[]`, opcional `marcado_examen: true` |
| `quiz[]` | `id`, `pregunta`, `opciones[]`, `correcta` (índice desde 0), `explicacion`, `paginas_manual[]` |
| `figuras[]` | `id`, `pagina_manual`, `que_muestra`, `formato_recomendado` (`svg_codigo` o `ia_imagen`), `viabilidad_ia`, `prompt_imagen`, `prompt_negativo`, `verificar` |
| `notas_manuscritas_de_la_usuaria[]` | Anotaciones a mano en el manual, por página |
| `notas_de_traduccion[]` | Errores o términos confusos de la traducción al español |

## Ejercicios (solo en los archivos Mat)

`ejercicios[]` tiene: `id`, `nombre` (nombre original en inglés, como se usa en clase), `paginas_manual`, `nivel`, `repeticiones`, `posicion_inicial`, `secuencia[]` (`fase`: Inhala/Exhala, `accion`), `forma_optima`, `indicaciones[]`, `variantes[]` (`nombre`, `descripcion`), `proposito[]`, `precauciones{}` (por zona o condición; `osteoporosis` cuando aplica), `transicion` y `figura{}` (`prompt_imagen`, `prompt_negativo`, `viabilidad_ia`, `verificar`). Algunos campos pueden faltar si el manual no los incluye.

Ideas para la app: modo "tarjeta de ejercicio" con la secuencia paso a paso, filtro por nivel, filtro "apto con osteoporosis" y un armador de clases que siga el orden del manual (de pie → cuatro puntos → supino → sentado → prono → costado → cierre).

## Paginación

`paginas_manual` es el número impreso en el libro físico. Si la app también abre el PDF escaneado: **página_pdf = página_manual + 6** (igual en los tres manuales).

## Sugerencias para la app

- Cada tarjeta y pregunta debe mostrar "Ver manual, pág. X".
- Filtro "solo temas de examen" usando `marcado_examen`.
- Repetición espaciada para las flashcards.

## Figuras y posturas

1. **`svg_codigo`**: diagramas propios dibujados en código (siluetas simples, líneas de plomada, pelvis que rota con un deslizador, columna en C/S, síndromes cruzados). Son exactos y pueden ser interactivos. Es lo recomendado para todo lo que dependa de ángulos o referencias anatómicas precisas.
2. **`ia_imagen`**: prompts en inglés (los generadores de imágenes responden mejor así) para posturas de ejercicio generales. Cada figura trae un campo `verificar` con lo que hay que revisar antes de aceptar la imagen. Conviene generar, revisar y guardar la imagen aprobada. No es buena idea generarla en vivo cada vez.

Estilo base común para todas las imágenes, para que se vean consistentes:
`Clean educational fitness illustration, adult in plain fitted athletic clothing, plain light background, soft even lighting, full body visible, no text, no logos`
