# -*- coding: utf-8 -*-
"""Arma publicar/prueba-figura.html (página única para publicar como Artifact)
incrustando figura.js, poses.js y poses-prueba.js en prueba-figura/pagina.html.

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
os.makedirs(os.path.join(RAIZ, "publicar"), exist_ok=True)
salida = os.path.join(RAIZ, "publicar", "prueba-figura.html")
open(salida, "w", encoding="utf-8", newline="\n").write(pagina)
print("OK ->", salida, f"({len(pagina.encode('utf-8')) / 1024:.1f} KB)")
