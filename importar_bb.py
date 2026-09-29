# -*- coding: utf-8 -*-
"""
Importa el material de estudio de Balanced Body (Principios del Movimiento,
Mat 1, Mat 2) desde los JSON de la carpeta fuentes/ y genera datos-bb.js.

    python importar_bb.py

Si existe fuentes/quiz_revisado.json, sus preguntas reemplazan a las
originales (opciones rebalanceadas para que la correcta no se delate por
ser la más larga).
"""
import io, json, os, re

BASE = os.path.dirname(os.path.abspath(__file__))
F = lambda *p: os.path.join(BASE, 'fuentes', *p)
leer = lambda p: json.load(io.open(p, encoding='utf-8'))

FUENTES = [
    ('mov', 'modulo-01.json', 'Principios del Movimiento'),
    ('mat1', 'mat1.json', 'Mat 1'),
    ('mat2', 'mat2.json', 'Mat 2'),
]

# posición de cada ejercicio (para elegir distractores parecidos)
POS = {}
for i in range(1, 11): POS['mat1-e%02d' % i] = 'supino'
POS.update({'mat1-e05': 'sentado', 'mat1-e11': 'sentado', 'mat1-e12': 'sentado', 'mat1-e13': 'sentado',
            'mat1-e14': 'sentado', 'mat1-e24': 'sentado', 'mat1-e25': 'plancha'})
for i in range(15, 19): POS['mat1-e%02d' % i] = 'prono'
for i in range(19, 24): POS['mat1-e%02d' % i] = 'costado'
POS.update({
    'mat2-e01': 'sentado', 'mat2-e02': 'supino', 'mat2-e03': 'supino', 'mat2-e04': 'supino', 'mat2-e05': 'supino',
    'mat2-e06': 'sentado', 'mat2-e07': 'inversion', 'mat2-e08': 'supino', 'mat2-e09': 'inversion', 'mat2-e10': 'supino',
    'mat2-e11': 'plancha', 'mat2-e12': 'plancha', 'mat2-e13': 'inversion', 'mat2-e14': 'costado', 'mat2-e15': 'costado',
    'mat2-e16': 'costado', 'mat2-e17': 'costado', 'mat2-e18': 'inversion', 'mat2-e19': 'inversion', 'mat2-e20': 'supino',
    'mat2-e21': 'sentado', 'mat2-e22': 'prono', 'mat2-e23': 'prono'})
NOM_POS = {'supino': 'Supino', 'sentado': 'Sentado', 'prono': 'Prono', 'costado': 'De costado',
           'plancha': 'Plancha', 'inversion': 'Inversión (sobre los hombros)'}

# ficha del Análisis MAT 1 (datos-mat1.js) que corresponde a cada ejercicio de Mat 1
ANALISIS = {'mat1-e%02d' % i: 'm%02d' % i for i in range(1, 26)}
ANALISIS.update({'mat1-e04': 'm05', 'mat1-e05': 'm04'})

# La sección "Pilates y osteoporosis" (Mat 1, págs. 79–82) lista como
# contraindicados algunos ejercicios cuya ficha no trae la precaución, e
# incluye la extensión (Swan, Swimming) entre lo recomendado.
OSTEO_SECCION = {
    'mat1-e11': ('evitar', 'Contraindicado con osteoporosis (Mat 1, pág. 80: flexión de columna).'),
    'mat1-e12': ('evitar', 'Contraindicado con osteoporosis (Mat 1, pág. 80).'),
    'mat1-e15': ('apto', 'Recomendado con osteoporosis: extensión de columna (Mat 1, pág. 80).'),
    'mat1-e18': ('apto', 'Recomendado con osteoporosis: extensión de columna (Mat 1, pág. 80).'),
}

def osteo(eid, prec):
    t = (prec or {}).get('osteoporosis')
    if t:
        tl = t.lower()
        if tl.startswith('evitar'): return ('evitar', t)
        if tl.startswith('apto'): return ('apto', t)
        return ('modificar', t)
    return OSTEO_SECCION.get(eid, (None, None))

def paginas(p):
    if not p: return None
    p = [x for x in p if x is not None]
    return [min(p), max(p)] if p else None

def main():
    rev = {}
    if os.path.exists(F('quiz_revisado.json')):
        rev = leer(F('quiz_revisado.json'))
    out = {'fuentes': {}, 'secciones': [], 'ejercicios': [], 'flash': [], 'quiz': [], 'figuras': [],
           'notasManuscritas': [], 'notasTraduccion': []}
    for clave, archivo, nombre in FUENTES:
        d = leer(F(archivo))
        out['fuentes'][clave] = {'nom': nombre, 'titulo': d.get('titulo') or d.get('manual'), 'pags': d.get('paginas_manual')}
        for s in d.get('secciones', []):
            x = {'id': s['id'], 'f': clave, 'titulo': s['titulo'], 'pag': paginas(s.get('paginas_manual')),
                 'resumen': s.get('resumen', ''), 'puntos': s.get('puntos_clave', [])}
            if 'musculos_por_accion' in s: x['tabla'] = s['musculos_por_accion']
            out['secciones'].append(x)
        for e in d.get('ejercicios', []):
            o, ot = osteo(e['id'], e.get('precauciones'))
            prec = {k: v for k, v in (e.get('precauciones') or {}).items() if k != 'osteoporosis'}
            fig = e.get('figura') or {}
            out['ejercicios'].append({
                'id': e['id'], 'f': clave, 'n': e['nombre'], 'pag': paginas(e.get('paginas_manual')),
                'nivel': e.get('nivel', ''), 'reps': e.get('repeticiones', ''),
                'inicial': e.get('posicion_inicial', ''), 'seq': e.get('secuencia', []),
                'optima': e.get('forma_optima', ''), 'indic': e.get('indicaciones', []),
                'var': e.get('variantes', []), 'prop': e.get('proposito', []), 'prec': prec,
                'osteo': o, 'osteoTxt': ot, 'trans': e.get('transicion', ''),
                'verificar': fig.get('verificar', ''), 'pos': POS.get(e['id']),
                'analisis': ANALISIS.get(e['id']) if clave == 'mat1' else None,
            })
        for c in d.get('flashcards', []):
            out['flash'].append({'id': 'bb-' + c['id'], 'f': clave, 'q': c['frente'], 'a': c['reverso'],
                                 'pag': paginas(c.get('paginas_manual')), 'examen': bool(c.get('marcado_examen'))})
        for q in d.get('quiz', []):
            r = rev.get(q['id'], {})
            ops = r.get('opciones', q['opciones'])
            cor = r.get('correcta', q['correcta'])
            out['quiz'].append({'id': 'bb-' + q['id'], 'f': clave, 'q': r.get('pregunta', q['pregunta']),
                                'ops': ops, 'correcta': ops[cor], 'explica': r.get('explicacion', q.get('explicacion', '')),
                                'pag': paginas(q.get('paginas_manual'))})
        for fg in d.get('figuras', []):
            out['figuras'].append({'id': fg['id'], 'f': clave, 'pag': fg.get('pagina_manual'), 'que': fg.get('que_muestra', '')})
        for n in d.get('notas_manuscritas_de_la_usuaria', []):
            out['notasManuscritas'].append({'f': clave, 'pag': n.get('pagina_manual'), 'nota': n.get('nota', '')})
        for n in d.get('notas_de_traduccion', []):
            out['notasTraduccion'].append({'f': clave, 'nota': n})
    out['nomPos'] = NOM_POS
    js = ('/* Generado por importar_bb.py a partir de fuentes/*.json — no editar a mano.\n'
          '   Material: Balanced Body (Principios del Movimiento, Mat 1, Mat 2). */\n'
          '"use strict";\nconst BB = ' + json.dumps(out, ensure_ascii=False, indent=1) + ';\n')
    io.open(os.path.join(BASE, 'datos-bb.js'), 'w', encoding='utf-8').write(js)
    print('datos-bb.js: %d secciones, %d ejercicios, %d flashcards, %d preguntas%s' % (
        len(out['secciones']), len(out['ejercicios']), len(out['flash']), len(out['quiz']),
        ' (revisadas: %d)' % len(rev) if rev else ''))

if __name__ == '__main__':
    main()
