# -*- coding: utf-8 -*-
"""
Extrae las fotos y los textos de "Mat 3 Props.xlsx" (ejercicios con props:
bola, ligas, pesa, círculo, roller) a privado/mat3/, que NO se versiona: el
repositorio es público y las fotos muestran personas (y las observaciones,
datos personales).

  python importar_mat3.py "ruta/Mat 3 Props.xlsx"

Cada hoja tiene la ficha (nombre, posición, principio, objetivo, un renglón por
prop y observaciones) y fotos ancladas en el renglón del prop que muestran.
Las caras de quienes miran la clase se pixelan (CARAS); quien hace el ejercicio
queda visible porque es la demostración. Las fotos se achican a JPEG.
Salida: privado/mat3/<hoja>/NN.jpg y privado/mat3/mat3.json.
"""
import io, os, re, sys, json
import openpyxl
from PIL import Image

BASE = os.path.dirname(os.path.abspath(__file__))
SALIDA = os.path.join(BASE, "privado", "mat3")
ANCHO = 640          # ancho máximo de cada foto
CALIDAD = 70

# hoja → ejercicio(s) de la app (cada hoja revisada foto por foto)
EJERCICIO = {
    "Hundred Prep-Hundred": ["mat1-e01", "mat1-e02"], "Roll Up 1": ["mat1-e03"], "Single Leg Circule": ["mat1-e04"],
    "Roll up": ["mat1-e05"],  # la hoja dice "Rolling like a ball"
    "Single Leg Stretch (2)": ["mat1-e06"], "Double Leg Stretch": ["mat1-e07"], "Double Straight leg strech": ["mat1-e09"],
    "Criss Cross-bicycle": ["mat1-e10"], "Spine Strech Foward": ["mat1-e11"], "Spine Strech Side": ["mat1-e12"], "saw": ["mat1-e13"],
    "Open Leg Rocker": ["mat1-e14"], "SWAN": ["mat1-e15"], "Swiming": ["mat1-e18"], "Seal": ["mat1-e24"],
    "Roll over": ["mat2-e07"], "Neck Pull": ["mat2-e10"], "Leg Pull UP": ["mat2-e12"], "Jackknife": ["mat2-e13"],
}
NOMBRE = {"Hundred Prep-Hundred": "Hundred", "Roll Up 1": "Roll Up", "Single Leg Circule": "Single Leg Circles", "Roll up": "Rolling Like a Ball",
          "Single Leg Stretch (2)": "Single Leg Stretch", "Double Leg Stretch": "Double Leg Stretch", "Double Straight leg strech": "Double Straight Leg Stretch",
          "Criss Cross-bicycle": "Criss Cross", "Spine Strech Foward": "Spine Stretch Forward", "Spine Strech Side": "Spine Stretch Side", "saw": "Saw",
          "Open Leg Rocker": "Open Leg Rocker", "SWAN": "Swan", "Swiming": "Swimming", "Seal": "Seal", "Roll over": "Roll Over", "Neck Pull": "Neck Pull",
          "Leg Pull UP": "Leg Pull Up", "Jackknife": "Jackknife"}

# caras de quienes no hacen el ejercicio: (hoja, n.º de foto) → cajas [x0, y0, x1, y1]
# en fracciones de la imagen (las fotos se numeran por fila y columna de anclaje)
CARAS = {
    ("Hundred Prep-Hundred", 1): [[0.32, 0.1, 0.45, 0.28], [0.82, 0.25, 0.98, 0.45]], ("Hundred Prep-Hundred", 2): [[0.48, 0, 0.63, 0.14]],
    ("Hundred Prep-Hundred", 3): [[0.75, 0.32, 0.9, 0.52], [0.92, 0.42, 1, 0.6]], ("Hundred Prep-Hundred", 6): [[0.52, 0, 0.68, 0.15]],
    ("Hundred Prep-Hundred", 7): [[0.66, 0, 0.84, 0.13]], ("Hundred Prep-Hundred", 8): [[0.55, 0.07, 0.7, 0.28]], ("Hundred Prep-Hundred", 9): [[0.55, 0, 0.75, 0.1]],
    ("Hundred Prep-Hundred", 11): [[0.52, 0, 0.68, 0.12]], ("Hundred Prep-Hundred", 12): [[0.56, 0, 0.72, 0.14]], ("Hundred Prep-Hundred", 13): [[0.57, 0.04, 0.73, 0.24]],
    ("Hundred Prep-Hundred", 14): [[0.66, 0.02, 0.84, 0.2]], ("Hundred Prep-Hundred", 15): [[0.74, 0, 0.92, 0.1]], ("Hundred Prep-Hundred", 16): [[0.58, 0, 0.76, 0.12]],
    ("Roll Up 1", 3): [[0.55, 0, 0.68, 0.17], [0.77, 0, 0.9, 0.17]],
    ("Roll Up 1", 6): [[0.53, 0.03, 0.65, 0.2], [0.77, 0.07, 0.89, 0.24]],
    ("Roll Up 1", 7): [[0.73, 0, 0.85, 0.16]],
    ("Roll Up 1", 8): [[0.42, 0, 0.6, 0.07], [0.76, 0, 0.92, 0.06]],
    ("Roll Up 1", 10): [[0.2, 0.02, 0.35, 0.25], [0.45, 0, 0.56, 0.09], [0.7, 0, 0.82, 0.17]],
    ("Single Leg Circule", 1): [[0.27, 0, 0.45, 0.1]], ("Single Leg Circule", 3): [[0.1, 0, 0.32, 0.1]], ("Single Leg Circule", 4): [[0.06, 0.04, 0.3, 0.17]],
    ("Single Leg Circule", 5): [[0.62, 0, 0.85, 0.09]], ("Single Leg Circule", 6): [[0, 0.08, 0.08, 0.2], [0.88, 0.25, 1, 0.36]],
    ("Roll up", 2): [[0.46, 0, 0.64, 0.08]], ("Roll up", 4): [[0.57, 0.04, 0.74, 0.22], [0.92, 0.05, 1, 0.2]],
    ("Roll up", 5): [[0.52, 0.04, 0.68, 0.24], [0.8, 0, 0.96, 0.13]], ("Roll up", 6): [[0.88, 0, 1, 0.08]],
    ("Single Leg Stretch (2)", 1): [[0.48, 0.18, 0.62, 0.33], [0.07, 0.3, 0.2, 0.43]], ("Single Leg Stretch (2)", 2): [[0.5, 0.13, 0.64, 0.28], [0, 0.22, 0.11, 0.35]],
    ("Single Leg Stretch (2)", 3): [[0.2, 0, 0.36, 0.17], [0.48, 0, 0.63, 0.12]], ("Single Leg Stretch (2)", 4): [[0.45, 0.06, 0.59, 0.2], [0, 0.19, 0.1, 0.32]],
    ("Single Leg Stretch (2)", 5): [[0.5, 0.1, 0.64, 0.25], [0, 0.24, 0.12, 0.37]], ("Single Leg Stretch (2)", 6): [[0.64, 0, 0.8, 0.17]],
    ("Single Leg Stretch (2)", 7): [[0.52, 0, 0.68, 0.09]], ("Single Leg Stretch (2)", 8): [[0.51, 0, 0.69, 0.12]], ("Single Leg Stretch (2)", 9): [[0.28, 0, 0.48, 0.05]],
    ("Single Leg Stretch (2)", 10): [[0.52, 0.3, 0.68, 0.46], [0.88, 0.3, 1, 0.46]],
    ("Double Leg Stretch", 1): [[0.43, 0.13, 0.57, 0.28], [0.18, 0.21, 0.3, 0.35]], ("Double Leg Stretch", 2): [[0.53, 0.26, 0.67, 0.4], [0, 0.3, 0.13, 0.52]],
    ("Double Leg Stretch", 3): [[0.37, 0.03, 0.51, 0.18]], ("Double Leg Stretch", 4): [[0.43, 0.26, 0.56, 0.4]],
    ("Double Straight leg strech", 1): [[0.48, 0.08, 0.62, 0.23], [0.19, 0.24, 0.32, 0.37]], ("Double Straight leg strech", 2): [[0.5, 0.17, 0.64, 0.31], [0, 0.3, 0.12, 0.44]],
    ("Double Straight leg strech", 3): [[0.63, 0.1, 0.8, 0.3]], ("Double Straight leg strech", 4): [[0.61, 0, 0.77, 0.12]],
    ("Criss Cross-bicycle", 4): [[0.3, 0, 0.46, 0.13]],
    ("Neck Pull", 2): [[0.25, 0, 0.45, 0.13]], ("Neck Pull", 3): [[0, 0.35, 0.06, 0.55]], ("Neck Pull", 5): [[0.66, 0, 0.84, 0.08]],
    ("Neck Pull", 6): [[0.84, 0, 1, 0.16], [0.52, 0, 0.7, 0.08]],
    ("Roll over", 3): [[0.15, 0.3, 0.3, 0.42]], ("Roll over", 4): [[0.55, 0, 0.7, 0.13]],
    ("Jackknife", 4): [[0.08, 0, 0.3, 0.12], [0.88, 0, 1, 0.08]], ("Jackknife", 5): [[0, 0, 0.12, 0.05]], ("Jackknife", 7): [[0, 0, 0.15, 0.14]],
    ("Spine Strech Foward", 3): [[0.93, 0.38, 1, 0.5]], ("Spine Strech Side", 2): [[0.57, 0.02, 0.75, 0.16]], ("Spine Strech Side", 3): [[0.04, 0.05, 0.2, 0.22]],
    ("Open Leg Rocker", 1): [[0.9, 0.3, 1, 0.5]], ("Swiming", 1): [[0.85, 0.15, 1, 0.45]],
    ("Leg Pull UP", 1): [[0.86, 0.17, 1, 0.32]], ("Leg Pull UP", 3): [[0, 0.06, 0.1, 0.18]], ("Leg Pull UP", 6): [[0.14, 0.2, 0.3, 0.34], [0, 0, 0.55, 0.12]],
    ("Leg Pull UP", 7): [[0.85, 0.22, 1, 0.38]],
}
# capturas de chat con un texto cortado abajo: se recorta hasta esa altura (y un poco el borde verde)
CORTE = {
    ("Neck Pull", 3): 0.8, ("Neck Pull", 5): 0.9, ("Neck Pull", 6): 0.71, ("Roll over", 2): 0.84, ("Roll over", 3): 0.88, ("Roll over", 4): 0.82,
    ("Jackknife", 2): 0.9, ("Jackknife", 3): 0.92, ("Jackknife", 6): 0.83, ("Leg Pull UP", 2): 0.9, ("Leg Pull UP", 3): 0.82, ("Leg Pull UP", 4): 0.91,
    ("Leg Pull UP", 5): 0.86, ("Leg Pull UP", 6): 0.88,
}

def pixelar(im, caja):
    w, h = im.size
    x0, y0, x1, y1 = int(caja[0] * w), int(caja[1] * h), int(caja[2] * w), int(caja[3] * h)
    zona = im.crop((x0, y0, x1, y1))
    bloque = max(8, w // 60)
    chica = zona.resize((max(1, (x1 - x0) // bloque), max(1, (y1 - y0) // bloque)), Image.BILINEAR)
    im.paste(chica.resize(zona.size, Image.NEAREST), (x0, y0))

def carpeta(nombre):
    return re.sub(r"[^a-z0-9]+", "-", nombre.lower()).strip("-")

def texto(v):
    return re.sub(r"\s+", " ", str(v)).strip() if v not in (None, "") else ""

def main(ruta):
    wb = openpyxl.load_workbook(ruta)
    hojas = []
    for ws in wb.worksheets:
        imgs = sorted(ws._images, key=lambda i: (i.anchor._from.row, i.anchor._from.col, i.anchor._from.rowOff, i.anchor._from.colOff))
        if not imgs:
            continue
        etiquetas = {r: texto(ws.cell(r, 1).value) for r in range(1, ws.max_row + 1)}
        valor = {etiquetas[r]: texto(ws.cell(r, 2).value) for r in etiquetas if etiquetas[r]}
        props = {k: valor.get(k, "") for k in ("Bola", "Liga Cerrada", "Liga Abierta", "Pesa", "Círculo", "Roler")}
        dest = os.path.join(SALIDA, carpeta(ws.title))
        os.makedirs(dest, exist_ok=True)
        fotos = []
        for n, img in enumerate(imgs, 1):
            im = Image.open(io.BytesIO(img._data())).convert("RGB")
            for caja in CARAS.get((ws.title, n), []):
                pixelar(im, caja)
            if (ws.title, n) in CORTE:
                w, h = im.size
                im = im.crop((int(w * 0.02), 0, int(w * 0.98), int(h * CORTE[(ws.title, n)])))
            if im.width > ANCHO:
                im = im.resize((ANCHO, round(im.height * ANCHO / im.width)), Image.LANCZOS)
            archivo = f"{n:02d}.jpg"
            im.save(os.path.join(dest, archivo), "JPEG", quality=CALIDAD, optimize=True, progressive=True)
            prop = etiquetas.get(img.anchor._from.row + 1, "")
            fotos.append({"archivo": f"{carpeta(ws.title)}/{archivo}", "prop": "Roller" if prop == "Roler" else prop, "w": im.width, "h": im.height})
        hojas.append({"hoja": ws.title, "ejercicios": EJERCICIO.get(ws.title, []), "nombre": NOMBRE.get(ws.title, valor.get("Nombre del Ejercicio", "")),
                      "posicion": valor.get("Posición", ""), "principio": valor.get("Principio del Movimiento", ""),
                      "objetivo": valor.get("Objetivo", ""), "props": props, "observaciones": valor.get("Observaciones", ""), "fotos": fotos})
    json.dump(hojas, open(os.path.join(SALIDA, "mat3.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    peso = sum(os.path.getsize(os.path.join(SALIDA, f["archivo"])) for h in hojas for f in h["fotos"])
    print(len(hojas), "hojas,", sum(len(h["fotos"]) for h in hojas), f"fotos ({peso / 1024 / 1024:.1f} MB) →", SALIDA)
    escribir_js(hojas)

def limpiar(t):
    """Notas de estudio para la app: sin lo personal (salud) ni espacios de más."""
    t = re.sub(r"\s*En mi caso[^.]*\.", "", t or "")
    return re.sub(r"\s+([,.])", r"\1", t).strip()

def escribir_js(hojas):
    """privado/fotos-mat3.js: FOTOS_MAT3[id del ejercicio] = {nombre, props, observaciones, fotos}
    con las fotos en base64. Lo incrustan web_artefacto.py y empaquetar.py --con-fotos."""
    import base64
    datos = {}
    for h in hojas:
        lista = [{"prop": f["prop"], "w": f["w"], "h": f["h"],
                  "src": "data:image/jpeg;base64," + base64.b64encode(open(os.path.join(SALIDA, f["archivo"]), "rb").read()).decode()} for f in h["fotos"]]
        props = {("Roller" if k == "Roler" else k): limpiar(v) for k, v in h["props"].items() if v}
        for ej in h["ejercicios"]:
            datos[ej] = {"nombre": h["nombre"], "props": props, "observaciones": limpiar(h["observaciones"]), "fotos": lista}
    js = ("/* Fotos de \"Mat 3 Props\" (generado por importar_mat3.py; NO se versiona: el repo es público).\n"
          "   Caras de quienes miran la clase pixeladas. */\n"
          "const FOTOS_MAT3 = " + json.dumps(datos, ensure_ascii=False) + ";\n")
    ruta = os.path.join(BASE, "privado", "fotos-mat3.js")
    open(ruta, "w", encoding="utf-8", newline="\n").write(js)
    print("fotos-mat3.js:", len(datos), "ejercicios,", f"{len(js) / 1024 / 1024:.1f} MB")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    main(sys.argv[1])
