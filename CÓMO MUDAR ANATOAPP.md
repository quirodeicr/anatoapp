# Cómo mudar AnatoApp a otra cuenta de Claude Code

En esta carpeta hay dos paquetes:

| Archivo | Qué trae | ¿Hace falta? |
|---|---|---|
| **AnatoApp-proyecto.zip** (2,2 MB) | Toda la app: código, datos, fotos, material de Balanced Body, herramientas y `CLAUDE.md` con el contexto del proyecto | **Sí** |
| **AnatoApp-originales.zip** (70 MB) | Tus archivos de origen: el PDF de los apuntes, Análisis MAT 1 (PDF y Excel) y la planilla de Principios con las fotos | Solo si vas a volver a importar la planilla o revisar los originales |

## Pasos

1. **Descomprimí `AnatoApp-proyecto.zip`** donde quieras (por ejemplo en Documentos). Se crea la carpeta `Anatoapp`.
2. Si querés los originales, **descomprimí `AnatoApp-originales.zip` en el mismo lugar**: sus archivos caen solos en `Anatoapp/fuentes/originales/`.
3. En la cuenta nueva, abrí Claude Code **en la carpeta `Anatoapp`** (en la app de escritorio: elegí esa carpeta como proyecto).
4. Listo. Claude va a leer `CLAUDE.md`, que explica cómo está hecha la app, los criterios que acordamos (distractores, voseo, animaciones con control de calidad) y cómo empaquetar. Podés pedirle, por ejemplo, "leé el CLAUDE.md y el LÉEME y seguimos con la app".

La computadora nueva necesita **Python 3**. Para volver a importar la planilla de Pre-Pilates también hacen falta `openpyxl` y `Pillow`:

```
pip install openpyxl pillow
```

## Lo que NO viaja en los archivos

- **Tu progreso de estudio** (repasos, XP, racha) vive en el navegador, no en la carpeta. Para llevarlo: abrí la app que usás hoy → **Perfil → Guardar y compartir → Copia con mi progreso** (o **Exportar progreso** y después **Importar** en la nueva).
- **El link web** (`claude.ai/artifact/L8qvjqdF…`) es de la cuenta vieja y sigue funcionando mientras esa cuenta exista. En la cuenta nueva pedile a Claude: "corré `python empaquetar.py` y `python web_artefacto.py` y publicá `publicar/anatoapp-web.html` como artifact". Te va a dar un link nuevo.
- **La memoria de Claude** de la cuenta vieja no se transfiere; por eso todo lo importante quedó escrito en `CLAUDE.md`.

## Comandos útiles dentro de la carpeta

| Para | Comando |
|---|---|
| Regenerar el archivo único para compartir (`AnatoApp.html`) | `python empaquetar.py` |
| Generar la versión web para publicar | `python web_artefacto.py` |
| Reimportar el material de Balanced Body (`fuentes/*.json`) | `python importar_bb.py` |
| Reimportar la planilla de Pre-Pilates (con fotos) | `python importar_premat.py` |
| Revisar las animaciones y su control de calidad | abrir `_galeria.html` con el servidor local (configuración `anatoapp`, puerto 8777) |
