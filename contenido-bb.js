/* ============================================================
   AnatoApp — material de Balanced Body convertido en práctica

   Toma BB (datos-bb.js, generado desde los JSON del manual) y POSES
   (poses.js) y agrega:
     · 3 temas y 3 unidades nuevas en la ruta
     · flashcards y preguntas del manual (con su página)
     · "Ordená la secuencia" de cada ejercicio
     · clasificación por osteoporosis según el manual
     · "¿Qué ejercicio es?" con la animación de cada ejercicio
   ============================================================ */
'use strict';

const NOM_FUENTE = { mov: 'Principios del Movimiento', mat1: 'Mat 1', mat2: 'Mat 2' };
const TEMA_BB = { mov: 'bb-mov', mat1: 'bb-mat1', mat2: 'bb-mat2' };
const pagManual = (f, p) => !p ? '' : `${NOM_FUENTE[f]}, pág. ${p[0] === p[1] ? p[0] : p[0] + '–' + p[1]}`;
const EJ_BB = Object.fromEntries(BB.ejercicios.map(e => [e.id, e]));
const ANIMS = [];

(() => {
  TEMAS['bb-mov'] = { nom: 'Postura y observación (manual)', color: 'verde', icono: '🧍' };
  TEMAS['bb-mat1'] = { nom: 'Mat 1 (manual)', color: 'magenta', icono: '📗' };
  TEMAS['bb-mat2'] = { nom: 'Mat 2 (manual)', color: 'magenta', icono: '📕' };

  /* antes de la unidad final de repaso */
  const iFin = UNIDADES.findIndex(u => u.id === 'u11');
  UNIDADES.splice(iFin < 0 ? UNIDADES.length : iFin, 0,
    { id: 'u14', nom: 'Postura y observación', temas: ['bb-mov'], icono: '🧍' },
    { id: 'u15', nom: 'Mat 1: el repertorio', temas: ['bb-mat1'], icono: '📗' },
    { id: 'u16', nom: 'Mat 2: repertorio avanzado', temas: ['bb-mat2'], icono: '📕' });

  BB.flash.forEach(c => CARDS.push({
    id: c.id, tema: TEMA_BB[c.f], tipo: 'flash', q: c.q, a: [c.a], pag: pagManual(c.f, c.pag), examen: c.examen
  }));
  BB.quiz.forEach(q => CARDS.push({
    id: q.id, tema: TEMA_BB[q.f], tipo: 'quiz', q: q.q, a: [q.correcta], ops: q.ops, correcta: q.correcta,
    porque: q.explica, pag: pagManual(q.f, q.pag)
  }));

  /* Ordená la secuencia: cada paso, hasta su primera pausa (las fichas
     largas no entran en la pantalla del celular) */
  const corto = t => {
    let s = t.split(/[;:]\s|\.\s/)[0].replace(/\.$/, '');
    if (s.length > 95) { const c = s.lastIndexOf(',', 95); s = c > 40 ? s.slice(0, c) : s.slice(0, 92) + '…'; }
    return s;
  };
  BB.ejercicios.forEach(e => {
    const pasos = e.seq.map(s => `${s.fase}: ${corto(s.accion)}`);
    if (pasos.length >= 3 && new Set(pasos).size === pasos.length)
      SECUENCIAS.push({ id: 'bbo-' + e.id, tema: TEMA_BB[e.f], q: `Ordená la secuencia de ${e.n}`, pasos, pag: pagManual(e.f, e.pag) });
  });

  /* Osteoporosis según el manual (ficha de cada ejercicio + sección de Mat 1) */
  const de = k => BB.ejercicios.filter(e => e.osteo === k).map(e => e.n);
  CLASIFICACIONES.push({
    id: 'bbc-osteo', tema: 'bb-mat1', q: 'Según el manual: con osteoporosis u osteopenia, ¿evitar o se puede hacer?',
    grupos: { 'Evitar': de('evitar'), 'Se puede (con carga de peso o extensión)': de('apto'), 'Solo con soporte o versión intermedia': de('modificar') },
    porque: 'Con osteoporosis se evita la flexión de columna con carga y la rotación con carga, sobre todo combinadas; se recomienda la extensión y la carga de peso (Mat 1, págs. 79–82).',
    pag: 'Mat 1, págs. 79–82'
  });

  /* ¿Qué ejercicio es? — animación */
  BB.ejercicios.filter(e => POSES[e.id]).forEach(e => ANIMS.push({
    id: 'bba-' + e.id, tema: TEMA_BB[e.f], ej: e.id, pag: pagManual(e.f, e.pag)
  }));
})();
