# -*- coding: utf-8 -*-
"""Arma publicar/revision.html: la revisión de las animaciones, ejercicio por
ejercicio. Para cada uno de prueba-figura/revision.json muestra la animación de
antes (poses.js del commit "antes"), la de ahora, las fotos de Mat 3 Props si las
hay (privado/mat3, no se versiona), lo que dice el manual y qué se corrigió.
Página para publicar como Artifact privado (las fotos son de la clase).

  python prueba-figura/armar_revision.py
"""
import base64, json, os, subprocess
BASE = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.dirname(BASE)
leer = lambda p: open(p, encoding="utf-8").read()
seguro = lambda js: js.replace("</script", "<\\/script")

rev = json.load(open(os.path.join(BASE, "revision.json"), encoding="utf-8"))
ids = [e["id"] for e in rev["ejercicios"]]
antes = subprocess.run(["git", "show", rev["antes"] + ":poses.js"], cwd=RAIZ, capture_output=True, check=True).stdout.decode("utf-8")
figura_antes = subprocess.run(["git", "show", rev["antes"] + ":figura.js"], cwd=RAIZ, capture_output=True, check=True).stdout.decode("utf-8")

# el texto del manual de cada ejercicio (datos-bb.js es un objeto JSON)
bbjs = leer(os.path.join(RAIZ, "datos-bb.js"))
bb = json.loads(bbjs[bbjs.index("{", bbjs.index("const BB")): bbjs.rindex("}") + 1])
nom_libro = {k: v["nom"] for k, v in bb["fuentes"].items()}
manual = {}
for e in bb["ejercicios"]:
    if e["id"] in ids:
        manual[e["id"]] = {k: e.get(k) for k in ("n", "f", "pag", "nivel", "reps", "inicial", "seq", "optima", "indic")}
        manual[e["id"]]["libro"] = nom_libro.get(e["f"], e["f"])

# fotos de Mat 3 Props de esos ejercicios
fotos, mat3 = {}, os.path.join(RAIZ, "privado", "mat3", "mat3.json")
if os.path.exists(mat3):
    for h in json.load(open(mat3, encoding="utf-8")):
        for eid in h["ejercicios"]:
            if eid not in ids:
                continue
            lista = fotos.setdefault(eid, [])
            for f in h["fotos"]:
                datos = open(os.path.join(RAIZ, "privado", "mat3", f["archivo"]), "rb").read()
                lista.append({"prop": "Roller" if f["prop"] == "Roler" else f["prop"], "w": f["w"], "h": f["h"],
                              "src": "data:image/jpeg;base64," + base64.b64encode(datos).decode()})

# fotos de Pre-Pilates de referencia (imagenes.js, del material del curso)
import re
imgs = leer(os.path.join(RAIZ, "imagenes.js"))
for e in rev["ejercicios"]:
    for pm in e.get("fotos_pm", []):
        m = re.search(r'"' + pm + r'": "(data:image/[^"]+)"', imgs)
        nom = re.search(r'"id": "' + pm + r'",\s*"n": "([^"]+)"', leer(os.path.join(RAIZ, "datos-premat.js")))
        if m:
            fotos.setdefault(e["id"], []).append({"prop": "Pre-Pilates: " + (nom.group(1) if nom else pm), "src": m.group(1)})

datos = {"ejercicios": rev["ejercicios"], "manual": manual, "fotos": fotos}
pagina = leer(os.path.join(BASE, "revision.html"))
pagina = pagina.replace("/*FIGURA*/", seguro(leer(os.path.join(RAIZ, "figura.js"))))
pagina = pagina.replace("/*POSES*/", seguro(leer(os.path.join(RAIZ, "poses.js"))))
pagina = pagina.replace("/*POSES_ANTES*/", "(function () {\n" + seguro(figura_antes) + "\nwindow.FIGURA_ANTES = FIGURA;\n" + seguro(antes).replace("const FIGURA", "const FIGURA_X") + "\nwindow.POSES_ANTES = POSES;\n})();")
pagina = pagina.replace("/*DATOS*/", "const REV = " + seguro(json.dumps(datos, ensure_ascii=False)) + ";")
os.makedirs(os.path.join(RAIZ, "publicar"), exist_ok=True)
salida = os.path.join(RAIZ, "publicar", "revision.html")
open(salida, "w", encoding="utf-8", newline="\n").write(pagina)
print("OK ->", salida, f"({len(pagina.encode('utf-8')) / 1024:.1f} KB)", "· ejercicios:", len(ids), "· con fotos:", len(fotos))
