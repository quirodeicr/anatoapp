# -*- coding: utf-8 -*-
"""
Importa los ejercicios Pre-Pilates desde "Principios Movimiento y Posiciones.xlsx"
y genera dos archivos para la app:

  datos-premat.js   los 100 ejercicios con posición, principio, componente,
                    objetivo, repeticiones y el resto de las columnas
  imagenes.js       la foto de cada ejercicio, reducida y en JPEG

Uso:  python importar_premat.py "ruta/a/Principios Movimiento y Posiciones.xlsx"

Correcciones que aplica (no cambian el contenido, solo la forma):
  · ortografía de los nombres en inglés (Hundread → Hundred, Swam → Swan…)
  · posiciones y principios escritos de varias maneras se unifican
  · la foto de la fila 54 estaba anclada en la fila 53: se reasigna
Y marca con `revisar` las filas donde las columnas se contradicen.
"""
import io, os, re, sys, json, zipfile, base64
import openpyxl
from PIL import Image

BASE = os.path.dirname(os.path.abspath(__file__))
ORIGEN = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(os.path.abspath(__file__)), "fuentes", "originales", "Principios Movimiento y Posiciones.xlsx")

NOMBRES = {
    "Deagobal Press": "Diagonal Press",
    "Swiming prep single arm lift": "Swimming prep — single arm lift",
    "Swiming prep single leg lift": "Swimming prep — single leg lift",
    "Swiming": "Swimming",
    "Swam": "Swan",
    "Oblicue abdominals": "Oblique Abdominals",
    "Seated side streth": "Seated Side Stretch",
    "Seated twist": "Seated Twist",
    "Standing Flx": "Standing Flexion",
    "Standing Extensión": "Standing Extension",
    "Standing lateral Flex": "Standing Lateral Flexion",
    "Standing diagonal Press": "Standing Diagonal Press",
    "Maring Supine": "Marching Supine",
    "Variación swiming": "Variación de Swimming",
    "All fourextensión o extesión a Flex": "All fours: extensión de cadera",
    "All four Flexion to Extensión": "All fours: de flexión a extensión",
    "Arm rais toguether and alternathing": "Arm Raises (juntos y alternados)",
    "Angels in the snow": "Angels in the Snow",
    "Telescope Arme": "Telescope Arms",
    "Pinwell": "Pinwheel",
    "Sendatilla Flexión de rodillas": "Sentadilla con flexión de rodillas",
    "Sentadilla estrecha y paralela 90pág": "Sentadilla estrecha y paralela",
    "Rotación Lateral del hombro con la liga dira afuera": "Rotación lateral del hombro con liga",
    "Rotación medial del hombro , roto adentro": "Rotación medial del hombro con liga",
    "Tabla flexón de brazos- Solo las palmas": "Tabla con flexión de brazos (sobre las palmas)",
    "Preparación de la tabla elevacion y depresión de la espalda": "Preparación de tabla de espalda: elevación y depresión",
    "Tabla espalda  pierna estirada": "Tabla de espalda con pierna estirada",
    "Levantamiento de piernas con planca de espalda": "Levantamiento de piernas en tabla de espalda",
    "Prensa de Triceps con banda. Tiro atrás": "Prensa de tríceps con banda (tiro atrás)",
    "Inmersión de triceps. Bnaca o silla pilates": "Inmersión de tríceps (banca o silla)",
    "Presna por encima de la cabeza , con banda": "Prensa por encima de la cabeza con banda",
    "Tirando hacia abajo banda abre la banda arriba y abajo": "Tirón hacia abajo con banda",
    "Flexión de bíceps de cualquier ángulo. Con banda con apoyo de pies": "Flexión de bíceps con banda",
    "Tirar hacia atrás los brazos atrás con una liga": "Tirar los brazos hacia atrás con liga",
    "Marcha con  movimiento de brazos": "Marcha con movimiento de brazos",
    "Squats": "Squats",
}
POSICIONES = {
    "supino": "Supino", "prono": "Prono", "sedente": "Sedente", "sendente en silla": "Sedente (silla)",
    "sedente en silla": "Sedente (silla)", "4 puntos": "4 puntos", "bípedo": "Bípedo",
    "decúbito lateral": "Decúbito lateral", "plancha": "Plancha prona", "planca espalda": "Plancha supina",
    "rodilla": "De rodillas",
}
PRINCIPIOS = {
    "integración del tronco": "Integración del tronco",
    "fuerza y potencia de mmii": "Fuerza y potencia de MMII",
    "fuerza y equilibrio mmss": "Fuerza y equilibrio de MMSS",
}
COMPONENTES = {
    "breathing exercises": "Respiración",
    "neutral pelvis": "Pelvis neutra",
    "unidad interna": "Unidad interna",
    "unidad externa": "Unidad externa",
    "unidad externa soa-sop": "Unidad externa (SOA-SOP)",
    "estabilidad lumbopélvica": "Estabilidad lumbopélvica",
    "estabilidad lumbopélvica-unidad externa": "Estabilidad lumbopélvica + Unidad externa",
    "movilidad de la columna": "Movilidad de la columna",
    "flexión de cadera": "Flexión de cadera",
    "extensión de la cadera": "Extensión de cadera",
    "abducción de cadera": "Abducción de cadera",
    "aducción de cadera": "Aducción de cadera",
    "fortalecimiento de pies y tobillo": "Pies y tobillos",
    "patrón de movimiento funcional": "Patrón de movimiento funcional",
    "estabilidad glenohumeral": "Estabilidad glenohumeral",
    "ritmo escapular": "Ritmo escapular",
    "ritmo escapular y movilidad de hombro": "Ritmo escapular",
    "estabilidad escapular e integración del tronco": "Estabilidad escapular (planchas)",
    "activación del hombro posterior": "Activación del hombro posterior",
    "activación del hombro anterior": "Activación del hombro anterior",
    "movimiento del brazo recto": "Movimiento del brazo recto",
    "movimiento de todo el cuerpo": "Movimiento de todo el cuerpo",
}

def limpio(v):
    return re.sub(r"\s+", " ", str(v)).strip() if v not in (None, "") else ""

def capital(s):
    return s[:1].upper() + s[1:] if s else s

# ---------- datos ----------
wb = openpyxl.load_workbook(ORIGEN, data_only=True)
ws = wb.worksheets[0]
cab = [limpio(c.value) for c in ws[1]]
filas = []
for r in range(2, ws.max_row + 1):
    nombre = limpio(ws.cell(r, 1).value)
    if not nombre:
        continue
    fila = {cab[c - 1]: limpio(ws.cell(r, c).value) for c in range(1, len(cab) + 1)}
    fila["_fila"] = r
    filas.append(fila)

# el libro (Pre-MAT / MAT 1) viene de las hojas por familia
libro = {}
for hoja in wb.worksheets[1:]:
    for r in range(3, hoja.max_row + 1):
        n, l = limpio(hoja.cell(r, 1).value), limpio(hoja.cell(r, 4).value)
        if n and l:
            libro.setdefault(n.lower(), l)

# ---------- imágenes: ancla de cada foto → fila ----------
z = zipfile.ZipFile(ORIGEN)
dr = z.read("xl/drawings/drawing1.xml").decode("utf8")
rels = dict(re.findall(r'Id="(rId\d+)"[^>]*Target="\.\./media/([^"]+)"',
                       z.read("xl/drawings/_rels/drawing1.xml.rels").decode("utf8")))
fotos = {}
patron = re.compile(r'<xdr:from><xdr:col>\d+</xdr:col><xdr:colOff>-?\d+</xdr:colOff><xdr:row>(\d+)</xdr:row>'
                    r'<xdr:rowOff>(-?\d+)</xdr:rowOff></xdr:from>(?:<xdr:to><xdr:col>\d+</xdr:col>'
                    r'<xdr:colOff>-?\d+</xdr:colOff><xdr:row>(\d+)</xdr:row>)?.*?r:embed="(rId\d+)"', re.S)
for m in patron.finditer(dr):
    desde, off = int(m.group(1)) + 1, int(m.group(2))
    hasta = int(m.group(3)) + 1 if m.group(3) else desde
    # una foto que empieza al pie de una fila y termina en la siguiente es de la siguiente
    fila = hasta if (hasta > desde and off > 1_000_000) else desde
    fotos.setdefault(fila, []).append(rels[m.group(4)])

# ---------- fotos que traen el nombre del ejercicio escrito ----------
# En "¿Qué ejercicio es?" el nombre escrito regalaría la respuesta. Se recorta
# el bloque de texto: la imagen se divide en franjas separadas por espacio
# blanco y se conserva la más alta (la foto). "hv" repite el corte en columnas.
# Los números extra son recortes manuales (izquierda, arriba) en píxeles, y un
# rectángulo opcional que se tapa con blanco (x0, y0, x1, fracción de alto) para
# textos que quedan al costado de la foto. Se verificó el resultado a ojo.
CON_TEXTO = {
    "pm012": "v", "pm013": "v", "pm015": "v", "pm016": "v", "pm017": "hv", "pm033": "v", "pm036": "v",
    "pm038": "v", "pm039": "v", "pm041": "v", "pm043": "v", "pm045": "v", "pm047": "v", "pm048": "v",
    "pm058": "v", "pm060": "v", "pm061": "v", "pm062": "hv", "pm068": "v", "pm069": "hv",
    "pm081": ("v", 0, 0, (0, 0, 75, 0.62)), "pm085": ("v", 45, 40),
}
# La foto no parece corresponder al ejercicio: no se usa en "¿Qué ejercicio es?".
FOTO_DUDOSA = {
    "pm004": "La foto muestra a alguien sentado, pero el ejercicio figura en supino.",
    "pm039": "La foto es la misma que la de Standing Lateral Flexion (dice \"8. Standing Lateral Flexion\").",
    "pm033": "La foto decía \"1. Mini Swan\", pero la fila es Rocket.",
    "pm055": "La foto muestra un ejercicio acostado de lado, pero la fila es Aducción de pie.",
}
# Fotos casi idénticas entre sí: nunca se ofrecen como opciones en la misma pregunta.
PARECIDAS = {
    "acostada_respira": ["pm001", "pm003", "pm006"],
    "banda_pecho": ["pm092", "pm093", "pm094"],
    "banda_inclinada": ["pm088", "pm089", "pm098"],
    "paso_lateral": ["pm049", "pm050", "pm051", "pm052"],
    "cuadrupedia_brazo_pierna": ["pm008", "pm025"],
    "puente": ["pm009", "pm019"],
    "marcha_supina": ["pm015", "pm043"],
    "curl_abdominal": ["pm031", "pm032"],
    "extension_prona": ["pm033", "pm034"],
    "plie": ["pm014", "pm060"],
    "estocada": ["pm063", "pm064"],
    "rotacion_hombro_banda": ["pm065", "pm066"],
    "tabla_espalda_rodillas": ["pm078", "pm079"],
    "tabla_lateral": ["pm084", "pm086"],
    "cuadrupedia_cadera": ["pm047", "pm048"],
}

def bloques(im, eje):
    g = im.convert("L"); w, h = g.size; px = g.load()
    n = h if eje == 0 else w
    res, ini, blanco = [], None, 0
    for i in range(n):
        rng = range(0, w, 2) if eje == 0 else range(0, h, 2)
        oscuro = sum(1 for j in rng if (px[j, i] if eje == 0 else px[i, j]) < 200)
        if oscuro > 1:
            if ini is None: ini = i
            blanco = 0
        elif ini is not None:
            blanco += 1
            if blanco >= 5:
                res.append((ini, i - blanco + 1)); ini = None; blanco = 0
    if ini is not None: res.append((ini, n))
    return res

def sin_texto(im, regla):
    modo, izq, arr, tapar = (regla, 0, 0, None) if isinstance(regla, str) else (tuple(regla) + (None,))[:4]
    w, h = im.size
    bs = bloques(im, 0)
    if bs:
        y0, y1 = max(bs, key=lambda b: b[1] - b[0])
        im = im.crop((0, max(0, y0 - 4), w, min(h, y1 + 4)))
    if modo == "hv":
        cs = bloques(im, 1)
        if cs:
            x0, x1 = max(cs, key=lambda b: b[1] - b[0])
            im = im.crop((max(0, x0 - 4), 0, min(im.size[0], x1 + 4), im.size[1]))
    if izq or arr:
        im = im.crop((izq, arr, im.size[0], im.size[1]))
    if tapar:
        from PIL import ImageDraw
        x0, y0, x1, fh = tapar
        ImageDraw.Draw(im).rectangle([x0, y0, x1, int(im.size[1] * fh)], fill="white")
    return im

def miniatura(nombre_media, clave=None):
    im = Image.open(io.BytesIO(z.read("xl/media/" + nombre_media))).convert("RGB")
    im.thumbnail((600, 400), Image.LANCZOS)
    if clave in CON_TEXTO:
        im = sin_texto(im, CON_TEXTO[clave])
    buf = io.BytesIO()
    im.save(buf, "JPEG", quality=72, optimize=True, progressive=True)
    return "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode("ascii")

# ---------- detección de contradicciones ----------
def revisar(f):
    notas = []
    musc, comp, plano, obj = f["Músculos Biomecánicos"].lower(), f["Componente del Principio"].lower(), f["Plano"].lower(), f["Obejetivo"].lower()
    if "hazme" in musc:
        notas.append("La columna de músculos tiene un texto que no corresponde (\"%s\")." % f["Músculos Biomecánicos"])
    if "aducción" in comp and "glúteo medio" in musc:
        notas.append("Componente: aducción, pero los músculos listados (glúteo medio y menor) son abductores.")
    if "abducción" in comp and ("psoas" in musc or "recto femoral" in musc):
        notas.append("Componente: abducción, pero los músculos (psoas, recto femoral) y el plano sagital corresponden a flexión.")
    if "elevación lateral" in f["Nombre exacto BB"].lower() and "sagital" in plano:
        notas.append("Una elevación lateral de brazos ocurre en el plano frontal (deltoides medio), no en el sagital.")
    if f["Nombre exacto BB"].lower().startswith("tail wag") and "extensión y flexión" in obj:
        notas.append("El objetivo dice extensión y flexión, pero el Tail Wag es flexión lateral (plano frontal).")
    return notas

# ---------- salida ----------
ejercicios, imagenes = [], {}
for i, f in enumerate(filas, 1):
    orig = f["Nombre exacto BB"]
    n = NOMBRES.get(orig, orig)
    pid = "pm%03d" % i
    pos = POSICIONES.get(f["Posición"].lower(), capital(f["Posición"]))
    pri = PRINCIPIOS.get(f["Principio del Movimiento BB"].lower(), f["Principio del Movimiento BB"])
    compo = f["Componente del Principio"]
    compo = COMPONENTES.get(compo.lower(), capital(compo))
    e = {
        "id": pid, "n": n, "pos": pos, "principio": pri, "comp": compo,
        "obj": capital(f["Obejetivo"]), "reps": f["Repetición"],
        "musculos": f["Músculos Biomecánicos"], "cadena": f["Cadenas miofasciales"],
        "plano": f["Plano"], "contra": f["Contraindicaciones"], "obs": f["Observaciones"],
        "libro": "Pre-MAT",
    }
    if n != orig:
        e["orig"] = orig
    notas = revisar(f)
    if notas:
        e["revisar"] = notas
    lista = fotos.get(f["_fila"], [])
    if lista:
        e["fotos"] = len(lista)
        for k, media in enumerate(lista):
            clave = pid + ("" if k == 0 else "_%d" % (k + 1))
            imagenes[clave] = miniatura(media, clave)
    if pid in FOTO_DUDOSA:
        e["fotoDudosa"] = FOTO_DUDOSA[pid]
    for grupo, ids in PARECIDAS.items():
        if pid in ids:
            e["parecida"] = grupo
    ejercicios.append(e)

# duplicados exactos (la planilla repite "Movimiento de rotación con resistencia")
vistos, unicos = set(), []
for e in ejercicios:
    k = (e["n"], e["pos"], e["comp"])
    if k in vistos:
        # su foto pasa a ser la segunda del ejercicio que se conserva
        guardado = next(u for u in unicos if (u["n"], u["pos"], u["comp"]) == k)
        if e["id"] in imagenes and guardado["id"] + "_2" not in imagenes:
            imagenes[guardado["id"] + "_2"] = imagenes.pop(e["id"])
            guardado["fotos"] = guardado.get("fotos", 1) + 1
        else:
            imagenes.pop(e["id"], None)
        continue
    vistos.add(k)
    unicos.append(e)

cab_js = "/* Generado por importar_premat.py desde \"Principios Movimiento y Posiciones.xlsx\".\n   No editar a mano: corregí la planilla y volvé a correr el script. */\n"
with io.open(os.path.join(BASE, "datos-premat.js"), "w", encoding="utf-8") as fh:
    fh.write(cab_js + "const PREMAT = " + json.dumps(unicos, ensure_ascii=False, indent=1) + ";\n")
with io.open(os.path.join(BASE, "imagenes.js"), "w", encoding="utf-8") as fh:
    fh.write(cab_js + "const IMGS = " + json.dumps(imagenes, ensure_ascii=False) + ";\n")

sin_foto = [e["n"] for e in unicos if not e.get("fotos")]
print("ejercicios:", len(unicos), "(duplicados quitados: %d)" % (len(ejercicios) - len(unicos)))
print("fotos:", len(imagenes), " sin foto:", sin_foto)
print("para revisar:", sum(1 for e in unicos if e.get("revisar")))
print("imagenes.js: %.1f KB" % (os.path.getsize(os.path.join(BASE, "imagenes.js")) / 1024))
print("posiciones:", sorted({e["pos"] for e in unicos}))
print("principios:", sorted({e["principio"] for e in unicos}))
print("componentes:", sorted({e["comp"] for e in unicos}))
