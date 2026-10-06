# -*- coding: utf-8 -*-
"""
Genera la variante para publicar como página web (Artifact de claude.ai):
mismo contenido que la app empaquetada, sin <!doctype>/<html>/<head>/<body>,
que los aporta el visor. Usa publicar/PilatesLab-con-fotos.html si existe
(empaquetar.py --con-fotos; la usuaria aprobó las fotos en la web) y si no,
PilatesLab.html:

    python web_artefacto.py   ->  publicar/pilateslab-web.html
"""
import io, os, re

BASE = os.path.dirname(os.path.abspath(__file__))
CON_FOTOS = os.path.join(BASE, "publicar", "PilatesLab-con-fotos.html")
ORIGEN = CON_FOTOS if os.path.exists(CON_FOTOS) else os.path.join(BASE, "PilatesLab.html")
DESTINO = os.path.join(BASE, "publicar", "pilateslab-web.html")

with io.open(ORIGEN, encoding="utf-8") as f:
    html = f.read()

# En la galería de claude.ai el título es el nombre de la página: va solo.
titulo = "<title>Pilates Lab</title>"
estilo = re.search(r"<style>.*?</style>", html, re.S).group(0)
cuerpo = re.search(r"<body>(.*?)</body>", html, re.S).group(1).strip()
salida = "\n".join([titulo, estilo, cuerpo])

# El código menciona "<!doctype" legítimamente (la app se copia a sí
# misma), así que el chequeo se hace sobre el marcado sin los scripts.
marcado = re.sub(r"<script\b.*?</script\s*>", "<script></script>", salida, flags=re.S | re.I)
prohibido = ["<!doctype", "<html", "</html>", "<head>", "</head>", "<body", "</body>",
             "<script src=", 'href="http', 'src="http']
malos = [p for p in prohibido if p in marcado.lower()]
if malos:
    raise SystemExit("Quedaron restos del esqueleto o recursos externos: %s" % malos)
if len(re.findall(r"<script\b", salida, re.I)) != len(re.findall(r"</script\s*>", salida, re.I)):
    raise SystemExit("Bloques de script descompensados.")

os.makedirs(os.path.dirname(DESTINO), exist_ok=True)
with io.open(DESTINO, "w", encoding="utf-8") as f:
    f.write(salida)
print("OK ->", DESTINO, "(%.1f KB)" % (os.path.getsize(DESTINO) / 1024.0), "desde", os.path.basename(ORIGEN))
