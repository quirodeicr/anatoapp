# -*- coding: utf-8 -*-
"""
Genera datos-familias.js desde fuentes/familias.json (las hojas de familias
por posición de "Resumen Todos los ejercicios.xlsx").

  python importar_familias.py

fuentes/familias.json guarda las filas tal como están en la planilla. Este
script solo corrige la forma (ortografía de los nombres en inglés, mayúsculas,
principios escritos de varias maneras) sin cambiar el contenido; el nombre
original queda en `orig` cuando cambia. La app enlaza cada fila con su ficha
(Pre-Pilates con foto, o ejercicio del manual con animación) en datos-mat2.js.
"""
import os, re, ast, json

BASE = os.path.dirname(os.path.abspath(__file__))
# los nombres corregidos de Pre-Pilates son los mismos que usa importar_premat.py
_arbol = ast.parse(open(os.path.join(BASE, "importar_premat.py"), encoding="utf-8").read())
NOMBRES_PREMAT = next(ast.literal_eval(n.value) for n in _arbol.body
                      if isinstance(n, ast.Assign) and getattr(n.targets[0], "id", "") == "NOMBRES")
DATOS = json.load(open(os.path.join(BASE, "fuentes", "familias.json"), encoding="utf-8"))

POSICIONES = {"Supino": "Supino", "Decúbito Lateral": "Decúbito lateral", "Prono": "Prono", "4 puntos": "4 puntos",
              "Planchas": "Planchas", "Sedente": "Sedente", "Bípedo": "Bípedo"}
LIBROS = {"pre mat": "pre", "premat": "pre", "mat 1": "mat1", "mat1": "mat1", "mat 2": "mat2", "mat2": "mat2"}

NOMBRES = {
    # Pre-Pilates (la app los busca también por el nombre original de la planilla)
    "Deagonal Press": "Diagonal Press",
    "Oblicue abdominals": "Oblique Abdominals",
    "Arm rais toguether and alternathing": "Arm Raises (juntos y alternados)",
    "Angels in the snow": "Angels in the Snow",
    "Serie de tobillos boca arriba(point flex)": "Serie de tobillos boca arriba (point/flex)",
    "Clamchel": "Clamshell",
    "Telescope Arme": "Telescope Arms",
    "Pinwell": "Pinwheel",
    "Swiming prep single arm lift": "Swimming prep — single arm lift",
    "Swiming prep single leg lift": "Swimming prep — single leg lift",
    "Swiming": "Swimming",
    "Swam": "Swan",
    "Variación swiming": "Variación de Swimming",
    "All fourextensión o extesión a Flex": "All fours: extensión de cadera",
    "All four Flexion to Extensión": "All fours: de flexión a extensión",
    "Marching Seated en la silla": "Marching Seated",
    "Sentado con el aro en la silla": "Sentado con el aro",
    "Elevación Lateral": "Elevación Lateral de Brazos",
    "Standing Flx": "Standing Flexion",
    "Standing Extensión": "Standing Extension",
    "Standing lateral Flex": "Standing Lateral Flexion",
    "Standing diagonal Press": "Standing Diagonal Press",
    "Seated side streth": "Seated Side Stretch",
    "Seated twist": "Seated Twist",
    # MAT 1
    "Hundread Prep": "Hundred prep",
    "Hundread": "Hundred",
    "Single Leg Circule": "Single leg circles",
    "Single straith Leg Stretch": "Single straight leg stretch",
    "Double straight Leg Stretch": "Double straight leg stretch",
    "Criss Cross Bicycle": "Criss cross",
    "Rolling like a Ball": "Rolling like a ball",
    "Open leg Rocker": "Open leg rocker",
    "Side leg lift": "Side leg lifts",
    "Side leg circules big and small": "Side leg circles (small & big)",
    "Side leg Kicks": "Side leg kicks",
    "Side leg Bicycle": "Side leg bicycle",
    "Side leg Bananas": "Side leg bananas",
    "Single Leg Kicks-- Sniffi Breath": "Single leg kicks",
    "Puch Up": "Push up",
    "Spine strech foward": "Spine stretch forward",
    "Spine strech side": "Spine stretch side",
    # MAT 2
    "Teaser Preparation 1: Bend Knee 2-Single leg": "Teaser preparation (bent knee, single leg)",
    "Teaser Roll Down": "Teaser 1 (roll down)",
    "Teaser Leg Lovers": "Teaser 2 (leg lowers)",
    "Teaser Arm and leg toguether": "Teaser 3 (arms and legs together)",
    "Hip Circules": "Hip circles",
    "Corscrew": "Corkscrew",
    "Sissors": "Scissors",
    "Shoukder Bridgets": "Shoulder bridge",
    "Leg pull up": "Leg pull up",
}
# en MAT 2, "Seated twist" es el Twist del manual (no el Seated Twist de Pre-Pilates)
NOMBRES_MAT2 = {"Seated twist": "Twist (seated twist)", "Side bend mermaid": "Side bend (mermaid)"}
NOTAS = {"Single Leg Kicks-- Sniffi Breath": "Con sniff breath."}

PRINCIPIOS = [
    (r"in(t?e)?graci[oó]n del tronco", "Integración del tronco"),
    (r"fuerza y potencia del? mmii", "Fuerza y potencia de MMII"),
    (r"fuerza y equilibrio( de)? mmss", "Fuerza y equilibrio de MMSS"),
    # la hoja Mat 2 dice "potencia del MMSS"; el nombre del principio es "equilibrio de MMSS"
    (r"fuerza y potencia del? mmss", "Fuerza y equilibrio de MMSS"),
]
TEXTO = [  # ortografía y abreviaturas de los objetivos
    (r"\bMOVILIDAD DE LA COLUMNA Flex-ext-rotación lateral Columna", "Movilidad de la columna: flexión, extensión y rotación"),
    (r"\bMovi columna exte axial", "Movilidad de columna en extensión axial"), (r"\bUI UE Mov columna", "Unidad interna y externa, movilidad de columna"),
    (r"\bIT--", "Integración del tronco --"), (r"\bIT-", "Integración del tronco: "), (r"^IT$", "Integración del tronco"), (r"Inmersión", "inversión"),
    (r"Cuadriceps", "cuádriceps"), (r"Pelvica", "pélvica"), (r"EXT columna", "extensión de columna"), (r"flx ext", "flexión y extensión"),
    (r"Movimiento Todo el cuerpo", "Movimiento de todo el cuerpo"), (r" ,", ","),
    (r"Estabiliad", "Estabilidad"), (r"Lumbopelvica|lumbopelvica|Lumbopélvica", "lumbopélvica"), (r"lumpélvica", "lumbopélvica"),
    (r"clolumna", "columna"), (r"columana", "columna"), (r"trono", "tronco"), (r"esmipa", "escápula"),
    (r"aabductores", "abductores"), (r"Enlongación", "Elongación"), (r"Moviento", "Movimiento"),
    (r"Cordinación", "Coordinación"), (r"Flx|flx", "flexión"), (r"\bFlex\b", "Flexión"), (r"\bExt\b", "Extensión"),
    (r"\s+", " "),
]

def limpiar(t):
    t = (t or "").strip()
    for a, b in TEXTO:
        t = re.sub(a, b, t)
    return t.strip(" .-")

def objetivos(t):
    t = limpiar(t)
    partes = [p.strip(" .-") for p in re.split(r"\s*(?:(?<![\w])\d\s*[-.]*\s*|(?<=[a-zá-ú])\d\s*-|---|--)\s*", t) if p.strip(" .-")]
    partes = [limpiar(p) for p in partes]
    return [p[0].upper() + p[1:] for p in partes if p] or ([t] if t else [])

def principio(t):
    k = (t or "").strip().lower()
    for a, b in PRINCIPIOS:
        if re.fullmatch(a, k):
            return b
    return (t or "").strip()

filas = []
for r in DATOS["filas"]:
    libro = LIBROS[r["libro"].strip().lower()]
    orig = r["n"].strip()
    n = (NOMBRES_MAT2.get(orig) if libro == "mat2" else None) or NOMBRES.get(orig) or (NOMBRES_PREMAT.get(orig) if libro == "pre" else None) or re.sub(r"\s+", " ", orig)
    pos = POSICIONES[r["pos"]]
    sub = r["sub"].strip() if r["sub"] else ("Plancha prona" if pos == "Planchas" else None)
    fila = {"pos": pos, "n": n, "libro": libro, "principio": principio(r["principio"]), "obj": objetivos(r["objetivo"])}
    if sub:
        fila["sub"] = sub
    if n != orig:
        fila["orig"] = orig
    if orig in NOTAS:
        fila["nota"] = NOTAS[orig]
    filas.append(fila)

cab = ("/* Generado por importar_familias.py desde fuentes/familias.json\n"
       "   (hojas de familias de \"Resumen Todos los ejercicios.xlsx\").\n"
       "   No editar a mano: corregí la planilla, volvé a extraerla y corré el script. */\n")
js = cab + "const FAMILIAS = " + json.dumps(filas, ensure_ascii=False, indent=1) + ";\n"
open(os.path.join(BASE, "datos-familias.js"), "w", encoding="utf-8", newline="\n").write(js)
from collections import Counter
print(len(filas), "filas →", dict(Counter((f["pos"]) for f in filas)))
print("libros:", dict(Counter(f["libro"] for f in filas)))
print("principios:", sorted(set(f["principio"] for f in filas)))
