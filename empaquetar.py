# -*- coding: utf-8 -*-
"""
Regenera PilatesLab.html: la app entera en un solo archivo, lista para compartir.

Uso:  python empaquetar.py              -> PilatesLab.html (se versiona; sin fotos privadas)
      python empaquetar.py --con-fotos  -> publicar/PilatesLab-con-fotos.html (no se versiona)

Toma index.html y todos los scripts que carga y escribe el archivo con todo
incrustado adentro. Los scripts de privado/ (fotos de Mat 3 Props, con
personas) solo entran con --con-fotos: el repositorio es público.
"""
import io, os, re, sys

BASE = os.path.dirname(os.path.abspath(__file__))
CON_FOTOS = "--con-fotos" in sys.argv
SALIDA = os.path.join(BASE, "publicar", "PilatesLab-con-fotos.html") if CON_FOTOS else os.path.join(BASE, "PilatesLab.html")


def leer(nombre):
    ruta = os.path.join(BASE, nombre)
    if not os.path.exists(ruta):
        sys.exit("Falta el archivo: %s" % nombre)
    with io.open(ruta, encoding="utf-8") as f:
        return f.read()


def inyectar(marca, codigo, texto):
    """Sustituye <script src="marca"></script> por el codigo incrustado.

    Dos cuidados:

    1. Si el JavaScript contiene la secuencia de cierre de etiqueta (aunque
       sea dentro de un comentario o de un texto), el navegador corta el
       bloque ahi mismo y el archivo empaquetado queda roto. Se neutraliza
       partiendo la secuencia, que en JavaScript significa exactamente lo
       mismo pero el analizador de HTML ya no la reconoce.

    2. Se pasa una funcion como reemplazo para que las secuencias tipo \\1
       que puedan aparecer dentro del JavaScript no se interpreten como
       referencias a grupos de la expresion regular.
    """
    seguro = re.sub(r"</(?=script)", r"<\\/", codigo, flags=re.I)

    patron = r'<script src="%s"></script>' % re.escape(marca)
    nuevo, n = re.subn(patron, lambda m: "<script>\n%s\n</script>" % seguro, texto)
    if n != 1:
        sys.exit("Se esperaba una sola etiqueta para %s, se encontraron %d" % (marca, n))
    return nuevo


def main():
    html = leer("index.html")
    for nombre in re.findall(r'<script src="([^"]+)"></script>', html):
        if nombre.startswith("privado/") and not (CON_FOTOS and os.path.exists(os.path.join(BASE, nombre))):
            # sin fotos privadas: se saca la etiqueta (la app funciona igual, sin la vista Fotos)
            html = html.replace('<script src="%s"></script>\n' % nombre, "").replace('<script src="%s"></script>' % nombre, "")
            continue
        html = inyectar(nombre, leer(nombre), html)

    if "<script src=" in html:
        sys.exit("Quedaron referencias a archivos externos sin incrustar.")

    # Debe haber exactamente tantos cierres de bloque como aperturas.
    abre = len(re.findall(r"<script\b", html, re.I))
    cierra = len(re.findall(r"</script\s*>", html, re.I))
    if abre != cierra:
        sys.exit("Bloques de script descompensados: %d aperturas y %d cierres." % (abre, cierra))

    os.makedirs(os.path.dirname(SALIDA), exist_ok=True)
    with io.open(SALIDA, "w", encoding="utf-8") as f:
        f.write(html)

    print("Listo: %s  (%.1f KB)" % (SALIDA, os.path.getsize(SALIDA) / 1024.0))
    print("Ese es el archivo que podes compartir." + (" Tiene las fotos de Mat 3 (personas): no lo subas al repo." if CON_FOTOS else ""))


if __name__ == "__main__":
    main()
