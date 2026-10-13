/* ============================================================
   Pilates Lab — Formularios para imprimir y completar

   · Hoja para entregar: el plan de la clase con Nº, ejercicio,
     repeticiones y una observación por ejercicio (la adaptación, el
     prop y para qué, o el ejercicio que se cambió y por qué). Dos
     copias: una para entregar y otra para quien da la clase. Con
     renglones para completar a mano y lugar para las firmas.
   · Historia clínica: datos, motivo y objetivos, derivación,
     antecedentes por zona (con el lado), salud general, dolor (0 a
     10), actividad física, evaluación postural con los términos de
     Principios del Movimiento (plomada, hiperlordosis, hipercifosis,
     genu valgo/varo, síndromes cruzados de Janda), precauciones,
     seguimiento por sesión y consentimiento. Lo que se sabe (el perfil
     de la persona, la clase) viene completado; lo demás, en blanco.

   Un mismo armado (`spec`: lista de bloques) se dibuja en Word y en
   PDF; la hoja para entregar también sale en Excel.
   ============================================================ */
'use strict';

const DOCS_EXP = [['clase', 'La clase', 'con o sin movimientos e imágenes'], ['entrega', 'Hoja para entregar', 'ejercicio, repeticiones y observación · 2 copias'], ['historia', 'Historia clínica', 'para completar']];
const fechaLarga = f => { try { return new Date(f + 'T12:00').toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' }); } catch (e) { return f || ''; } };
const nomEj = id => (ejPlan(id) || {}).n || '';

/* la observación de un ejercicio: el cambio y por qué, la adaptación, el prop y para qué, la nota */
function obsItem(x) {
  const xs = [];
  if (x.cambio && x.cambio.de) xs.push(`En lugar de ${nomEj(x.cambio.de)} (${x.cambio.tipo === 'reg' ? 'más fácil' : x.cambio.tipo === 'prog' ? 'más difícil' : 'con prop'})${x.cambio.motivo ? ': ' + x.cambio.motivo.trim() : ''}.`);
  if (x.adap) xs.push(`Adaptación: ${x.adap}`);
  const nota = String(x.nota || '').trim();
  if (x.prop) {
    /* la nota del generador empieza con el nombre del prop ("Bola: …"): no se repite */
    const sinProp = nota.replace(new RegExp('^' + x.prop.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*:\\s*', 'i'), '');
    xs.push(`Prop: ${x.prop}${x.propModo === 'asiste' ? ' (asiste)' : x.propModo === 'resiste' ? ' (resiste)' : ''}${sinProp ? ' — ' + sinProp : ''}${x.motivoProp ? `. Por qué: ${x.motivoProp.trim()}` : ''}`);
  } else if (nota) xs.push(nota);
  return xs.join(' ').replace(/\.\./g, '.');
}
/* lo que se sabe de la persona: su perfil, o las opciones con que se generó la clase */
function contextoDe(p) {
  const h = p.persona && typeof personaDe === 'function' ? personaDe(p.persona) : null;
  const g = p.gen || h || null;
  const cuidados = g && g.cuidados ? g.cuidados.map(c => typeof nomCuidadoGen === 'function' ? nomCuidadoGen(c, g) : c) : [];
  if (p.focos && p.focos.some(f => /osteopor/i.test(f)) && !cuidados.some(c => /osteopor/i.test(c))) cuidados.push('osteoporosis');
  return { h, g, cuidados, nivel: g && g.nivel && typeof nomNivelGen === 'function' ? nomNivelGen(g.nivel) : '', props: g ? (g.sinProps || !(g.props || []).length ? 'sin props' : g.props.join(', ')) : '' };
}

/* ---------- los dos formularios como lista de bloques ---------- */
/* en blanco (sin ejercicios): para imprimir varias y completar a mano */
const enBlanco = p => !p.items.length;
function specEntrega(p, cfg) {
  const c = contextoDe(p), blanco = enBlanco(p);
  const filas = p.items.map((x, i) => { const e = ejPlan(x.id); return e ? [String(i + 1), `${e.n}\n${POS_CLASE[e.pos].nom}${x.lado ? ' ' + LADO_NOM[x.lado] : ''}`, x.reps ? `${x.reps} ${unidadReps(e.reps)}` : (e.reps || ''), obsItem(x)] : null; }).filter(Boolean);
  const copias = cfg.copias === 1 ? [''] : ['Copia para entregar', 'Copia para quien da la clase'];
  return copias.flatMap((rot, k) => [
    ...(k ? [{ t: 'salto' }] : []),
    { t: 'titulo', texto: 'Plan de clase', rot },
    { t: 'sub', texto: [cfg.estudio, blanco ? '' : p.nombre].filter(Boolean).join(' · ') },
    { t: 'campos', pares: [['Persona', p.para || (c.h && c.h.nombre) || ''], ['Fecha', !blanco && p.fecha ? fechaLarga(p.fecha) : ''], ['Sesión n.º', ''], ['Hora', ''],
      ['Quien da la clase', cfg.quien || ''], ['Duración', blanco ? '' : `≈ ${duracionPlan(p)} min`],
      ['Nivel', c.nivel], ['Props', blanco ? '' : c.props], ['Cuidados', c.cuidados.join(', ')], ['Objetivo', c.h && c.h.gusta ? c.h.gusta.trim() : '']] },
    { t: 'tabla', cols: [['Nº', 0.06], ['Ejercicio', 0.32], ['Repeticiones', 0.15], ['Observación (adaptación, prop y por qué; o qué se cambió y por qué)', 0.47]], filas, vacias: blanco ? 30 : 2, alto: blanco ? 24 : 22 },
    { t: 'lineas', label: 'Observaciones generales', n: 2 },
    { t: 'firmas', labels: ['Firma de quien da la clase', 'Firma de quien recibe'] }
  ]);
}
const ZONAS_HC = [['cuello', 'Cuello'], ['hombro', 'Hombros'], ['codo', 'Codos'], ['muneca', 'Muñecas y manos'], ['dorsal', 'Espalda alta (dorsal)'], ['lumbar', 'Zona lumbar'], ['cadera', 'Cadera'], ['rodilla', 'Rodillas'], ['tobillo', 'Tobillos y pies']];
const SALUD_HC = [['cardio', 'Hipertensión o problemas cardíacos'], ['diabetes', 'Diabetes'], ['osteo', 'Osteoporosis u osteopenia'], ['hernia', 'Hernia de disco o ciática'], ['artrosis', 'Artrosis o artritis'], ['resp', 'Problemas respiratorios (asma…)'],
  ['mareo', 'Mareos o vértigo'], ['piso', 'Piso pélvico (pérdidas, prolapso)'], ['embarazo', 'Embarazo actual o posparto reciente'], ['cirugia', 'Cirugías (cuáles y cuándo)'], ['fractura', 'Fracturas'], ['medic', 'Medicación'], ['alergia', 'Alergias']];
function specHistoria(p, cfg = {}) {
  const c = contextoDe(p), g = c.g || {}, cu = g.cuidados || [], lc = g.ladoCuidado || {};
  const LADO = { der: 'Derecha', izq: 'Izquierda' };
  /* lo que ya se sabe por sus cuidados queda marcado */
  const zona = ([k, nom]) => { const on = cu.includes(k) || (k === 'hombro' && cu.includes('cuello')) || (k === 'lumbar' && cu.includes('lumbar'));
    return [nom, on ? 'X' : '', '', on ? (lc[k] ? LADO[lc[k]] : '') : '', ''];
  };
  const salud = ([k, nom]) => [nom, k === 'osteo' && cu.includes('osteo') ? 'X' : '', '', ''];
  const adaps = [...new Set(p.items.map(x => x.adap).filter(Boolean))];
  return [
    { t: 'titulo', texto: 'Historia clínica', rot: '' },
    { t: 'sub', texto: [cfg.estudio, 'Pilates · completar en la primera sesión y actualizar si algo cambia'].filter(Boolean).join(' · ') },
    { t: 'seccion', texto: 'Datos personales' },
    { t: 'campos', pares: [['Nombre y apellidos', p.para || (c.h && c.h.nombre) || ''], ['Fecha', p.blanco ? '' : fechaLarga(p.fecha || HOY())], ['Fecha de nacimiento', ''], ['Edad', ''], ['Teléfono', ''], ['Correo', ''],
      ['Contacto de emergencia', ''], ['Teléfono de emergencia', ''], ['Ocupación', ''], ['Horas al día en posición sentada', ''], ['Quien completa la historia', cfg.quien || '']] },
    { t: 'seccion', texto: 'Motivo de consulta y objetivos' },
    { t: 'lineas', label: c.h && c.h.gusta ? '' : 'Qué busca con las clases', n: c.h && c.h.gusta ? 0 : 3, texto: c.h && c.h.gusta ? c.h.gusta.trim() : '' },
    { t: 'seccion', texto: 'Derivación' },
    { t: 'campos', pares: [['Profesional de la salud que deriva', ''], ['Diagnóstico', '']] },
    { t: 'checks', label: 'Autorización médica para hacer ejercicio', ops: ['Sí', 'No', 'No hace falta'] },
    { t: 'seccion', texto: 'Lesiones o dolor por zona' },
    { t: 'tabla', cols: [['Zona', 0.28], ['Sí', 0.07], ['No', 0.07], ['Lado', 0.14], ['Detalle (qué, desde cuándo, tratamiento)', 0.44]], filas: ZONAS_HC.map(zona), alto: 18 },
    { t: 'seccion', texto: 'Salud general' },
    { t: 'tabla', cols: [['', 0.4], ['Sí', 0.07], ['No', 0.07], ['Detalle', 0.46]], filas: SALUD_HC.map(salud), alto: 18 },
    { t: 'seccion', texto: 'Dolor actual' },
    { t: 'campos', pares: [['Zona', ''], ['Desde cuándo', ''], ['Qué lo empeora', ''], ['Qué lo alivia', '']] },
    { t: 'escala', label: 'Intensidad (0 = nada, 10 = el peor dolor)' },
    { t: 'seccion', texto: 'Actividad física' },
    { t: 'campos', pares: [['Deporte o actividad', ''], ['Frecuencia', '']] },
    { t: 'checks', label: 'Experiencia en Pilates', ops: ['Ninguna', 'Algo', 'Sí, con regularidad'] },
    { t: 'checks', label: 'Nivel con que empieza', ops: (typeof NIVELES_GEN !== 'undefined' ? NIVELES_GEN : []).map(n => n[1]), on: c.nivel ? [c.nivel] : [] },
    { t: 'seccion', texto: 'Evaluación postural (Principios del Movimiento)' },
    { t: 'checks', label: 'Plomada lateral · cabeza', ops: ['Alineada', 'Adelantada'] },
    { t: 'checks', label: 'Plomada lateral · hombros', ops: ['Alineados', 'Adelantados'] },
    { t: 'checks', label: 'Columna', ops: ['Neutra', 'Hiperlordosis lumbar', 'Hipercifosis torácica', 'Espalda plana'] },
    { t: 'checks', label: 'Pelvis', ops: ['Neutra', 'Anteversión', 'Retroversión'] },
    { t: 'checks', label: 'Rodillas', ops: ['Alineadas', 'Hiperextensión', 'Genu valgo', 'Genu varo'] },
    { t: 'checks', label: 'Plomada posterior', ops: ['Hombros a la misma altura', 'Escápulas despegadas', 'Escoliosis', 'Pelvis inclinada'] },
    { t: 'checks', label: 'Pies', ops: ['Neutros', 'Pronación', 'Supinación'] },
    { t: 'checks', label: 'Síndromes cruzados (Janda)', ops: ['No', 'Superior', 'Inferior'] },
    { t: 'checks', label: 'Respiración', ops: ['Lateral (costal)', 'Abdominal', 'Alta (clavicular)'] },
    { t: 'lineas', label: 'Movilidad, flexibilidad y otras observaciones', n: 2 },
    { t: 'seccion', texto: 'Precauciones para las clases' },
    { t: 'lineas', label: '', n: c.cuidados.length || adaps.length ? 1 : 3, texto: [c.cuidados.length ? 'Cuidar: ' + c.cuidados.join(', ') + '.' : '', ...adaps.slice(0, 6)].filter(Boolean).join(' · ') },
    { t: 'seccion', texto: 'Seguimiento' },
    { t: 'tabla', cols: [['Fecha', 0.15], ['Sesión', 0.25], ['Cómo llegó, qué se trabajó, cómo se fue', 0.6]], filas: p.items.length ? [[p.fecha ? fechaLarga(p.fecha) : '', p.nombre || '', '']] : [], vacias: p.items.length ? 5 : 6, alto: 24 },
    { t: 'parrafo', texto: 'Declaro que la información es correcta y que voy a avisar cualquier cambio en mi salud. Entiendo que las clases no reemplazan la indicación de un profesional de la salud.' },
    { t: 'firmas', labels: ['Firma de la persona', 'Firma de quien da la clase', 'Fecha'] }
  ];
}

/* ---------- Word ---------- */
function docxForm(spec, cfg, titulo) {
  const K = docxKit(), { run, par, celda, filaTabla } = K, { ancho } = papelDocx(cfg);
  const VERDE = '1F6F4A', GRIS = '666666', CLARO = 'EEF6F1';
  let cuerpo = '', salto = false;
  const multilinea = (t, o) => String(t || '').split('\n').map((l, k) => par(run(l, k ? { ...o, b: false, sz: 17, color: GRIS } : o), { despues: 0 })).join('');
  for (const b of spec) {
    if (b.t === 'salto') { salto = true; continue; }
    if (b.t === 'titulo') { cuerpo += par(run(b.texto) + (b.rot ? run('    ' + b.rot, { sz: 18, color: GRIS }) : ''), { estilo: 'Title', despues: 20, salto }); salto = false; }
    else if (b.t === 'sub') { if (b.texto) cuerpo += par(run(b.texto, { color: GRIS, sz: 19 }), { despues: 100 }); }
    else if (b.t === 'seccion') cuerpo += par(run(b.texto, { b: true, sz: 23, color: VERDE }), { antes: 160, despues: 60, keep: true });
    else if (b.t === 'campos') {
      const wl = Math.round(ancho * 0.18), wv = Math.round(ancho / 2 - wl);
      let filas = '';
      for (let i = 0; i < b.pares.length; i += 2) {
        const [l1, v1] = b.pares[i], [l2, v2] = b.pares[i + 1] || ['', ''];
        filas += filaTabla(celda(par(run(l1, { b: true, sz: 17 }), { despues: 0 }), wl, { fill: CLARO }) + celda(par(run(v1, { sz: 19 }), { despues: 0 }), wv)
          + celda(par(run(l2, { b: true, sz: 17 }), { despues: 0 }), wl, { fill: l2 ? CLARO : '' }) + celda(par(run(v2, { sz: 19 }), { despues: 0 }), ancho - 2 * wl - wv), { alto: 380 });
      }
      cuerpo += K.tabla([wl, wv, wl, ancho - 2 * wl - wv], filas) + par('', { despues: 60 });
    } else if (b.t === 'tabla') {
      const ws = b.cols.map(([, f]) => Math.round(ancho * f)); ws[ws.length - 1] = ancho - ws.slice(0, -1).reduce((a, x) => a + x, 0);
      const alto = Math.round((b.alto || 18) * 20);
      let filas = filaTabla(b.cols.map(([t], i) => celda(par(run(t, { b: true, sz: 17 }), { despues: 0 }), ws[i], { fill: 'E3F2EA', centro: true })).join(''), { cab: true });
      for (const f of b.filas) filas += filaTabla(f.map((v, i) => celda(multilinea(v, { sz: 19, b: i === 1 && b.cols.length === 4 && /Ejercicio/.test(b.cols[1][0]) }), ws[i])).join(''), { alto });
      for (let k = 0; k < (b.vacias || 0); k++) filas += filaTabla(ws.map(w => celda(par(''), w)).join(''), { alto });
      cuerpo += K.tabla(ws, filas) + par('', { despues: 60 });
    } else if (b.t === 'checks') {
      const on = new Set(b.on || []);
      cuerpo += par(run(b.label + ':  ', { b: true, sz: 19 }) + b.ops.map(o => run((on.has(o) ? '☒ ' : '☐ ') + o + '    ', { sz: 19 })).join(''), { despues: 50 });
    } else if (b.t === 'escala') {
      cuerpo += par(run(b.label + ':  ', { b: true, sz: 19 }) + Array.from({ length: 11 }, (_, k) => run(`☐ ${k}   `, { sz: 19 })).join(''), { despues: 60 });
    } else if (b.t === 'lineas') {
      if (b.label) cuerpo += par(run(b.label, { b: true, sz: 19 }), { despues: 30, keep: true });
      const filas = [...(b.texto ? [filaTabla(celda(par(run(b.texto, { sz: 19 }), { despues: 0 }), ancho), { alto: 380 })] : []),
        ...Array.from({ length: b.n || 0 }, () => filaTabla(celda(par(''), ancho), { alto: 380 }))].join('');
      if (filas) cuerpo += K.tabla([ancho], filas) + par('', { despues: 60 });
    } else if (b.t === 'parrafo') cuerpo += par(run(b.texto, { sz: 18, color: '333333' }), { antes: 120, despues: 120 });
    else if (b.t === 'firmas') {
      const w = Math.floor(ancho / b.labels.length);
      cuerpo += K.tabla(b.labels.map(() => w), filaTabla(b.labels.map(l => celda(par('', { despues: 0 }) + par(run(l, { sz: 17, color: GRIS }), { despues: 0 }), w)).join(''), { alto: 900 })) + par('', { despues: 0 });
    }
  }
  return docxPaquete(cuerpo || par(''), K, titulo, cfg);
}

/* ---------- PDF ---------- */
function pdfForm(spec, cfg, titulo) {
  const doc = nuevoPDF(cfg), { PW, M, AN, texto, rect, linea, medir, escribir, nueva, cabe } = doc;
  const VERDE = '0.12 0.43 0.29', GRIS = '0.4 0.4 0.4', NEGRO = '0.1 0.1 0.1', BORDE = '0.72 0.72 0.72';
  const t = s => pdfTexto(s);
  const caja = (x, yTop, marcado) => { rect(x, yTop, 8.5, 8.5, null, '0.35 0.35 0.35'); if (marcado) { linea(x + 1.5, yTop + 1.5, x + 7, yTop + 7, NEGRO, 1); linea(x + 7, yTop + 1.5, x + 1.5, yTop + 7, NEGRO, 1); } };
  let cabTabla = null;
  for (const b of spec) {
    if (b.t === 'salto') { nueva(); continue; }
    if (b.t === 'titulo') {
      if (!cabe(60)) nueva();
      texto(t(b.texto), M, doc.y, 18, true, VERDE);
      if (b.rot) texto(t(b.rot), PW - M - pdfAncho(t(b.rot), false, 9), doc.y + 5, 9, false, GRIS);
      doc.y += 26;
    } else if (b.t === 'sub') { if (b.texto) { escribir(medir([[b.texto, false, 10, GRIS]], AN), M); doc.y += 6; } }
    else if (b.t === 'seccion') { if (!cabe(70)) nueva(); doc.y += 8; texto(t(b.texto), M, doc.y, 11.5, true, VERDE); doc.y += 15; linea(M, doc.y, PW - M, doc.y, '0.6 0.78 0.68', 0.8); doc.y += 6; }
    else if (b.t === 'campos') {
      const wc = AN / 2 - 6;
      for (let i = 0; i < b.pares.length; i += 2) {
        const par2 = [b.pares[i], b.pares[i + 1]].filter(Boolean);
        const medidas = par2.map(([l, v]) => { const wl = pdfAncho(t(l + ': '), true, 9) + 2; return { l, v, wl, ls: v ? pdfPartir(v, false, 10, wc - wl) : [] }; });
        const h = Math.max(18, ...medidas.map(m => m.ls.length * 12.5 + 6));
        if (!cabe(h)) nueva();
        medidas.forEach((m, k) => {
          const x = M + k * (wc + 12);
          texto(t(m.l + ':'), x, doc.y + 3, 9, true, NEGRO);
          if (m.ls.length) m.ls.forEach((ln, j) => texto(ln, x + m.wl, doc.y + 2 + j * 12.5, 10, false, NEGRO));
          else linea(x + m.wl, doc.y + 14, x + wc, doc.y + 14, '0.55 0.55 0.55', 0.5);
        });
        doc.y += h;
      }
      doc.y += 4;
    } else if (b.t === 'tabla') {
      const ws = b.cols.map(([, f]) => AN * f), alto = b.alto || 18, PAD = 3;
      const cab = () => {
        const ls = b.cols.map(([h], i) => pdfPartir(h, true, 8.5, ws[i] - 2 * PAD)), h = Math.max(...ls.map(l => l.length)) * 10.5 + 2 * PAD;
        let x = M;
        ls.forEach((l, i) => { rect(x, doc.y, ws[i], h, '0.89 0.95 0.92', BORDE); l.forEach((ln, j) => texto(ln, x + PAD, doc.y + PAD + j * 10.5, 8.5, true, NEGRO)); x += ws[i]; });
        doc.y += h;
      };
      cabTabla = cab;
      if (!cabe(60)) nueva();
      cab();
      const filas = [...b.filas, ...Array.from({ length: b.vacias || 0 }, () => b.cols.map(() => ''))];
      for (const f of filas) {
        const ls = f.map((v, i) => String(v || '').split('\n').flatMap((parte, k) => pdfPartir(parte, i === 1 && k === 0 && /Ejercicio/.test(b.cols[1][0]), k ? 8 : 9, ws[i] - 2 * PAD).map(ln => ({ ln, k }))));
        const h = Math.max(alto, Math.max(...ls.map(l => l.length)) * 10.5 + 2 * PAD);
        if (!cabe(h)) { nueva(); cab(); }
        let x = M;
        ls.forEach((l, i) => {
          rect(x, doc.y, ws[i], h, null, BORDE);
          l.forEach(({ ln, k }, j) => texto(ln, x + PAD, doc.y + PAD + j * 10.5, k ? 8 : 9, i === 1 && k === 0 && /Ejercicio/.test(b.cols[1][0]), k ? GRIS : NEGRO));
          x += ws[i];
        });
        doc.y += h;
      }
      doc.y += 8;
    } else if (b.t === 'checks') {
      const on = new Set(b.on || []), lab = t(b.label + ':'), wl = pdfAncho(lab, true, 9.5) + 6;
      if (!cabe(16)) nueva();
      texto(lab, M, doc.y, 9.5, true, NEGRO);
      let x = M + wl;
      for (const o of b.ops) {
        const w = 12 + pdfAncho(t(o), false, 9.5) + 12;
        if (x + w > PW - M) { x = M + 14; doc.y += 14; if (!cabe(14)) nueva(); }
        caja(x, doc.y + 0.5, on.has(o)); texto(t(o), x + 12, doc.y, 9.5, false, NEGRO); x += w;
      }
      doc.y += 16;
    } else if (b.t === 'escala') {
      const lab = t(b.label + ':'), wl = pdfAncho(lab, true, 9.5) + 8;
      if (!cabe(22)) nueva();
      texto(lab, M, doc.y + 3, 9.5, true, NEGRO);
      for (let k = 0; k <= 10; k++) { const x = M + wl + k * 22; rect(x, doc.y, 18, 15, null, '0.45 0.45 0.45'); const s = String(k); texto(s, x + 9 - pdfAncho(s, false, 9) / 2, doc.y + 3.5, 9, false, NEGRO); }
      doc.y += 22;
    } else if (b.t === 'lineas') {
      if (b.label) { if (!cabe(30)) nueva(); texto(t(b.label), M, doc.y, 9.5, true, NEGRO); doc.y += 13; }
      if (b.texto) { escribir(medir([[b.texto, false, 10, NEGRO]], AN), M); doc.y += 2; }
      for (let k = 0; k < (b.n || 0); k++) { if (!cabe(18)) nueva(); doc.y += 17; linea(M, doc.y, PW - M, doc.y, '0.6 0.6 0.6', 0.5); }
      doc.y += 8;
    } else if (b.t === 'parrafo') { doc.y += 4; escribir(medir([[b.texto, false, 9, '0.25 0.25 0.25']], AN), M); doc.y += 6; }
    else if (b.t === 'firmas') {
      if (!cabe(44)) nueva();
      const w = AN / b.labels.length;
      doc.y += 26;
      b.labels.forEach((l, k) => { const x = M + k * w; linea(x + 4, doc.y, x + w - 10, doc.y, '0.4 0.4 0.4', 0.6); texto(t(l), x + 4, doc.y + 3, 8.5, false, GRIS); });
      doc.y += 18;
    }
  }
  return doc.cerrar(titulo);
}

/* ---------- Excel (la hoja para entregar: las dos copias con un salto de página) ---------- */
function xlsxEntrega(spec, cfg, titulo) {
  const cols = [{ w: 6 }, { w: 34 }, { w: 16 }, { w: 60 }];
  const filas = [], merges = [], saltos = [];
  let r = 1;
  const celda = (ref, v, s) => v === '' || v == null ? `<c r="${ref}" s="${s}"/>` : `<c r="${ref}" s="${s}" t="inlineStr"><is><t xml:space="preserve">${xmlEsc(v)}</t></is></c>`;
  const lineas = (txt, ancho) => String(txt || '').split('\n').reduce((a, l) => a + Math.max(1, Math.ceil(l.length / Math.max(4, ancho * 1.1))), 0);
  const fila = (vals, estilos, alto) => { filas.push(`<row r="${r}"${alto ? ` ht="${alto}" customHeight="1"` : ''}>${vals.map((v, i) => celda('ABCD'[i] + r, v, estilos[i] ?? estilos[0])).join('')}</row>`); return r++; };
  for (const b of spec) {
    if (b.t === 'salto') { saltos.push(r - 1); continue; }
    if (b.t === 'titulo') { const k = fila([b.texto + (b.rot ? '  ·  ' + b.rot : '')], [1], 26); merges.push(`A${k}:D${k}`); }
    else if (b.t === 'sub') { if (b.texto) { const k = fila([b.texto], [6]); merges.push(`A${k}:D${k}`); } }
    else if (b.t === 'campos') { for (let i = 0; i < b.pares.length; i += 2) { const [l1, v1] = b.pares[i], [l2, v2] = b.pares[i + 1] || ['', '']; fila([l1, v1, l2, v2], [4, 3, l2 ? 4 : 3, 3], Math.max(18, 15 * Math.max(lineas(v1, 34), lineas(v2, 60)))); } r++; }
    else if (b.t === 'tabla') {
      fila(b.cols.map(c => c[0]), [2], 30);
      for (const f of b.filas) fila(f, [7, 4, 3, 3], Math.max(32, 15 * Math.max(...f.map((v, i) => lineas(v, cols[i].w)))));
      for (let k = 0; k < (b.vacias || 0); k++) fila(['', '', '', ''], [3], 32);
      r++;
    } else if (b.t === 'lineas') { const k = fila([b.label], [4]); merges.push(`A${k}:D${k}`); for (let j = 0; j < b.n; j++) { const q = fila(['', '', '', ''], [3], 22); merges.push(`A${q}:D${q}`); } r++; }
    else if (b.t === 'firmas') { r++; fila([b.labels[0], '', b.labels[1] || '', ''], [6], 40); r++; }
  }
  const hoja = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheetPr><pageSetUpPr fitToPage="1"/></sheetPr><dimension ref="A1:D${r}"/><sheetViews><sheetView workbookViewId="0"/></sheetViews><sheetFormatPr defaultRowHeight="15"/><cols>${cols.map((c, i) => `<col min="${i + 1}" max="${i + 1}" width="${c.w}" customWidth="1"/>`).join('')}</cols><sheetData>${filas.join('')}</sheetData>${merges.length ? `<mergeCells count="${merges.length}">${merges.map(m => `<mergeCell ref="${m}"/>`).join('')}</mergeCells>` : ''}<pageMargins left="0.4" right="0.4" top="0.5" bottom="0.6" header="0.3" footer="0.3"/><pageSetup paperSize="${cfg.papel === 'a4' ? 9 : 1}" orientation="portrait" fitToWidth="1" fitToHeight="0"/><headerFooter><oddFooter>&amp;L${xmlEsc(sinEmoji(titulo))} · Pilates Lab&amp;RPágina &amp;P de &amp;N</oddFooter></headerFooter>${saltos.length ? `<rowBreaks count="${saltos.length}" manualBreakCount="${saltos.length}">${saltos.map(k => `<brk id="${k}" max="16383" man="1"/>`).join('')}</rowBreaks>` : ''}</worksheet>`;
  const R = (id, tipo, dest) => `<Relationship Id="${id}" Type="${tipo}" Target="${dest}"/>`, RT = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/';
  const rels = (...xs) => `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${xs.join('')}</Relationships>`;
  return armarZip([
    { name: '[Content_Types].xml', data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/></Types>` },
    { name: '_rels/.rels', data: rels(R('rId1', RT + 'officeDocument', 'xl/workbook.xml'), R('rId2', 'http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties', 'docProps/core.xml')) },
    { name: 'docProps/core.xml', data: coreXml(titulo) },
    { name: 'xl/workbook.xml', data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Hoja para entregar" sheetId="1" r:id="rId1"/></sheets></workbook>` },
    { name: 'xl/_rels/workbook.xml.rels', data: rels(R('rId1', RT + 'worksheet', 'worksheets/sheet1.xml'), R('rId2', RT + 'styles', 'styles.xml')) },
    { name: 'xl/styles.xml', data: XLSX_ESTILOS },
    { name: 'xl/worksheets/sheet1.xml', data: hoja }
  ]);
}

/* ---------- armar el formulario que se pidió ---------- */
function exportarFormulario(p, cfg) {
  const entrega = cfg.doc === 'entrega';
  const spec = entrega ? specEntrega(p, cfg) : specHistoria(p, cfg);
  const quien = p.para || (contextoDe(p).h || {}).nombre || '';
  const titulo = (entrega ? (p.blanco ? 'Hoja de clase en blanco' : 'Plan de clase') : (p.blanco ? 'Historia clínica en blanco' : 'Historia clínica')) + (quien ? ' · ' + quien : '');
  const formato = !entrega && cfg.formato === 'xlsx' ? 'docx' : cfg.formato;
  const bytes = formato === 'pdf' ? pdfForm(spec, cfg, titulo) : formato === 'xlsx' ? xlsxEntrega(spec, cfg, titulo) : docxForm(spec, cfg, titulo);
  const base = (sinEmoji(titulo).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '-') || 'formulario').slice(0, 60);
  return { nombre: `${base}.${formato}`, bytes, formato };
}
/* hojas en blanco para imprimir varias (hoja de la clase o historia clínica) */
function hojasEnBlanco() {
  abrirExportar({ nombre: '', para: '', items: [], focos: [], notas: '', fecha: HOY(), blanco: true }, { blanco: true });
}
/* desde el perfil de una persona: la historia clínica con lo que se sabe de ella */
function historiaDePersona(h) {
  const p = { nombre: 'Historia clínica', para: h.nombre, persona: h.id, items: [], focos: [], notas: '', fecha: HOY() };
  abrirExportar(p, { doc: 'historia' });
}
