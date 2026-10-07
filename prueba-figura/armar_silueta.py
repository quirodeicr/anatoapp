# -*- coding: utf-8 -*-
"""Arma publicar/silueta.html: el comparador de la silueta actual y la silueta
"como la modelo" (CUERPOS de figura.js), con la foto de referencia de Pre-Pilates
(Pulmonary Breathing, sacada de imagenes.js). Página para publicar como Artifact
privado: la foto es del material del curso.

  python prueba-figura/armar_silueta.py
"""
import os, re
BASE = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.dirname(BASE)
leer = lambda p: open(p, encoding="utf-8").read()
pagina = leer(os.path.join(BASE, "silueta.html"))
for marca, archivo in [("/*FIGURA*/", os.path.join(RAIZ, "figura.js")), ("/*POSES*/", os.path.join(RAIZ, "poses.js"))]:
    pagina = pagina.replace(marca, leer(archivo).replace("</script", "<\\/script"))
m = re.search(r'"pm003": "(data:image/[^"]+)"', leer(os.path.join(RAIZ, "imagenes.js")))
pagina = pagina.replace("{{FOTO}}", m.group(1) if m else "")
os.makedirs(os.path.join(RAIZ, "publicar"), exist_ok=True)
salida = os.path.join(RAIZ, "publicar", "silueta.html")
open(salida, "w", encoding="utf-8", newline="\n").write(pagina)
print("OK ->", salida, f"({len(pagina.encode('utf-8')) / 1024:.1f} KB)")
