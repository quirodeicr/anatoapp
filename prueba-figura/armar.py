# -*- coding: utf-8 -*-
"""Arma publicar/prueba-figura.html (página única para publicar como Artifact)
incrustando figura.js, poses.js y poses-prueba.js en prueba-figura/pagina.html,
y las fotos de Mat 3 Props si existe privado/mat3 (ver importar_mat3.py).

  python prueba-figura/armar.py
"""
import os
BASE = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.dirname(BASE)
leer = lambda p: open(p, encoding="utf-8").read()
pagina = leer(os.path.join(BASE, "pagina.html"))
for marca, archivo in [("/*FIGURA*/", os.path.join(RAIZ, "figura.js")), ("/*POSES*/", os.path.join(RAIZ, "poses.js")),
                       ("/*PRUEBA*/", os.path.join(BASE, "poses-prueba.js"))]:
    js = leer(archivo).replace("</script", "<\\/script")
    pagina = pagina.replace(marca, js)
# fotos de Mat 3 Props (privado/mat3, generado por importar_mat3.py; no se versiona)
import re, json, base64
EJS = re.findall(r"'(mat\d-e\d+)':", leer(os.path.join(BASE, "poses-prueba.js")))
fotos, mat3 = {}, os.path.join(RAIZ, "privado", "mat3", "mat3.json")
if os.path.exists(mat3):
    for h in json.load(open(mat3, encoding="utf-8")):
        mios = [e for e in h["ejercicios"] if e in EJS]
        if not mios:
            continue
        lista = []
        for f in h["fotos"]:
            datos = open(os.path.join(RAIZ, "privado", "mat3", f["archivo"]), "rb").read()
            lista.append({"prop": f["prop"], "w": f["w"], "h": f["h"], "src": "data:image/jpeg;base64," + base64.b64encode(datos).decode()})
        props = {("Roller" if k == "Roler" else k): v for k, v in h["props"].items() if v}
        # las observaciones son notas de estudio; lo personal (salud) no va en una página que se comparte
        obs = re.sub(r"\s*En mi caso[^.]*\.", "", h["observaciones"]).strip()
        for e in mios:
            fotos[e] = {"nombre": h["nombre"], "props": props, "observaciones": obs, "fotos": lista}
pagina = pagina.replace("/*FOTOS*/", "const FOTOS_PRUEBA = " + json.dumps(fotos, ensure_ascii=False) + ";")
print("fotos:", {k: len(v["fotos"]) for k, v in fotos.items()} or "sin privado/mat3")
os.makedirs(os.path.join(RAIZ, "publicar"), exist_ok=True)
salida = os.path.join(RAIZ, "publicar", "prueba-figura.html")
open(salida, "w", encoding="utf-8", newline="\n").write(pagina)
print("OK ->", salida, f"({len(pagina.encode('utf-8')) / 1024:.1f} KB)")
