/* ============================================================
   Pilates Lab — Exportar una sesión a Word, Excel y PDF

   Desde cada sesión de "Mis sesiones" (también las generadas):
   un .docx y un .xlsx editables y un .pdf para imprimir, con lo que
   se elija: solo los nombres, los nombres con el movimiento (posición
   inicial y pasos con la respiración, o además las indicaciones y la
   forma óptima), la primera imagen o la secuencia (la figura de la
   app; la foto de tu planilla en Pre-Pilates), repeticiones y prop,
   transiciones, los 5 principios, adaptaciones, notas y una casilla
   para tildar durante la clase. Papel carta o A4.

   Sin librerías: los .docx y .xlsx son XML dentro de un zip que se
   arma acá (sin comprimir) y el PDF se escribe a mano con las fuentes
   Helvetica del lector. Las fotos de Mat 3 (personas) no se exportan.
   ============================================================ */
'use strict';

const EXP_BASE = { formato: 'docx', mov: 'no', img: 'no', reps: true, trans: true, princ: true, adap: true, notas: true, tilde: false, papel: 'carta' };
const EXP_PRESETS = [
  ['nombres', 'Solo nombres', { mov: 'no', img: 'no' }],
  ['movs', 'Nombres y movimientos', { mov: 'breve', img: 'no' }],
  ['imagen', 'Nombres con imagen', { mov: 'no', img: 'primera' }],
  ['completa', 'Todo', { mov: 'completo', img: 'primera' }]
];
const EXP_FORMATOS = [['docx', 'Word', '.docx · editable'], ['xlsx', 'Excel', '.xlsx · editable'], ['pdf', 'PDF', '.pdf · para imprimir']];
function cfgExp() {
  if (!S.expCfg) S.expCfg = { ...EXP_BASE };
  for (const [k, v] of Object.entries(EXP_BASE)) if (S.expCfg[k] === undefined) S.expCfg[k] = v;
  return S.expCfg;
}

/* ---------- el contenido, igual para los tres formatos ---------- */
function datosExp(p, cfg) {
  const es = p.items.map(x => ({ x, e: ejPlan(x.id) })).filter(o => o.e);
  const info = [p.fecha ? fechaLinda(p.fecha) : '', p.para ? 'Para: ' + p.para : '', `${es.length} ejercicios`, `≈ ${duracionPlan(p)} min`].filter(Boolean).join(' · ');
  const extra = [];
  if (p.focos.length) extra.push('Foco: ' + p.focos.join(', '));
  if (cfg.notas && p.notas.trim()) extra.push('Notas: ' + p.notas.trim());
  const princ = typeof principiosDe === 'function' ? PRINCIPIOS.map(pr => ({ nom: pr.nom, corto: pr.corto, n: es.filter(o => principiosDe(o.e.id).has(pr.k)).length })) : [];
  const filas = [];
  let prev = null, num = 0;
  for (const { x, e } of es) {
    if (!prev || prev.pos !== e.pos) filas.push({ tipo: 'pos', nom: POS_CLASE[e.pos].nom, trans: prev ? `Desde ${POS_CLASE[prev.pos].nom.toLowerCase()}: ${TRANSICIONES[prev.pos + '>' + e.pos] || 'transición'}` : '' });
    num++;
    const b = e.pm ? null : BB.ejercicios.find(q => q.id === e.id), pm = e.pm ? PREMAT.find(q => q.id === e.id) : null;
    const f = { tipo: 'ej', num, id: e.id, pm: !!e.pm, nombre: e.n, pos: POS_CLASE[e.pos].nom, fuente: fuenteNom(e.f),
      reps: x.reps ? `${x.reps} ${unidadReps(e.reps)}` : (e.reps || ''), prop: x.prop || '', nota: x.nota || '', adap: x.adap || '',
      principios: typeof principiosDe === 'function' ? PRINCIPIOS.filter(pr => principiosDe(e.id).has(pr.k)).map(pr => pr.corto).join(', ') : '', mov: [] };
    /* el movimiento: del manual (posición inicial, pasos con la respiración, indicaciones) o de tu planilla */
    if (cfg.mov !== 'no') {
      if (b) {
        if (b.inicial) f.mov.push(['Posición inicial', b.inicial]);
        (b.seq || []).forEach(s => f.mov.push([s.fase, s.accion]));
        if (cfg.mov === 'completo') {
          if (b.optima) f.mov.push(['Forma óptima', b.optima]);
          if ((b.indic || []).length) f.mov.push(['Indicaciones', b.indic.join(' · ')]);
        }
      } else if (pm) {
        if (pm.obj) f.mov.push(['Objetivo', pm.obj]);
        if (pm.obs) f.mov.push(['Observación', pm.obs]);
        if (cfg.mov === 'completo') { if (pm.musculos) f.mov.push(['Músculos', pm.musculos]); if (pm.plano) f.mov.push(['Plano', pm.plano]); }
      }
    }
    filas.push(f);
    prev = e;
  }
  return { titulo: p.nombre || 'Sesión', info, extra, princ, filas, dur: duracionPlan(p) };
}

/* ---------- imágenes: la figura de la app (con su estilo) o la foto, como JPEG ---------- */
const STYLE_SVG = ['fill', 'fill-opacity', 'stroke', 'stroke-width', 'stroke-opacity', 'stroke-linecap', 'stroke-linejoin', 'stroke-dasharray', 'opacity', 'display', 'visibility', 'font-size', 'font-family', 'font-weight', 'stop-color', 'stop-opacity'];
async function svgAJpeg(svgTxt, ancho = 520) {
  const caja = document.createElement('div');
  caja.style.cssText = 'position:fixed;left:-10000px;top:0;width:520px;pointer-events:none';
  caja.innerHTML = svgTxt;
  document.body.appendChild(caja);
  const svg = caja.querySelector('svg');
  try {
    /* el dibujo toma colores de las clases de la página: se copian al elemento */
    [svg, ...svg.querySelectorAll('*')].forEach(el => {
      const cs = getComputedStyle(el);
      el.setAttribute('style', [el.getAttribute('style') || '', ...STYLE_SVG.map(k => `${k}:${cs.getPropertyValue(k)}`)].filter(Boolean).join(';'));
    });
    const vb = svg.viewBox.baseVal, w = vb && vb.width ? vb.width : FIGURA.W, h = vb && vb.height ? vb.height : FIGURA.H;
    svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    svg.setAttribute('width', w); svg.setAttribute('height', h);
    const txt = new XMLSerializer().serializeToString(svg);
    return await aJpeg('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(txt), ancho);
  } finally { caja.remove(); }
}
async function aJpeg(src, ancho = 520) {
  const img = new Image();
  img.src = src;
  await img.decode();
  const w = Math.min(ancho, img.naturalWidth || ancho), h = Math.round(w * (img.naturalHeight || 1) / (img.naturalWidth || 1));
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  g.fillStyle = '#fff'; g.fillRect(0, 0, w, h);
  g.drawImage(img, 0, 0, w, h);
  const url = c.toDataURL('image/jpeg', 0.88), bin = atob(url.split(',')[1]), bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return { bytes, w, h };
}
/* la primera imagen (posición inicial) o hasta cuatro de la secuencia */
async function imagenesEj(f, modo) {
  if (modo === 'no') return [];
  if (f.pm) { const src = imagen(f.id); return src ? [await aJpeg(src, 420)] : []; }
  const ej = typeof POSES !== 'undefined' && POSES[f.id];
  if (!ej) return [];
  const n = ej.poses.length, idx = modo === 'secuencia' && n > 1 ? [...new Set([0, 1, 2, 3].map(k => Math.round(k * (n - 1) / 3)))].slice(0, 4) : [0];
  const out = [];
  for (const i of idx) out.push(await svgAJpeg(FIGURA.svgEstatico(ej, i), modo === 'secuencia' ? 360 : 520));
  return out;
}

/* ---------- zip sin comprimir (alcanza para Word y Excel) ---------- */
const CRC_TABLA = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
function crc32(u8) { let c = 0xFFFFFFFF; for (let i = 0; i < u8.length; i++) c = CRC_TABLA[(c ^ u8[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
function armarZip(archivos) {
  const enc = new TextEncoder(), partes = [], central = [];
  const d = new Date(), hora = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1), dia = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
  let off = 0;
  for (const a of archivos) {
    const nom = enc.encode(a.name), dat = typeof a.data === 'string' ? enc.encode(a.data) : a.data, crc = crc32(dat);
    const L = new DataView(new ArrayBuffer(30));
    L.setUint32(0, 0x04034b50, true); L.setUint16(4, 20, true); L.setUint16(6, 0x0800, true); L.setUint16(8, 0, true);
    L.setUint16(10, hora, true); L.setUint16(12, dia, true); L.setUint32(14, crc, true); L.setUint32(18, dat.length, true); L.setUint32(22, dat.length, true);
    L.setUint16(26, nom.length, true); L.setUint16(28, 0, true);
    partes.push(new Uint8Array(L.buffer), nom, dat);
    const C = new DataView(new ArrayBuffer(46));
    C.setUint32(0, 0x02014b50, true); C.setUint16(4, 20, true); C.setUint16(6, 20, true); C.setUint16(8, 0x0800, true); C.setUint16(10, 0, true);
    C.setUint16(12, hora, true); C.setUint16(14, dia, true); C.setUint32(16, crc, true); C.setUint32(20, dat.length, true); C.setUint32(24, dat.length, true);
    C.setUint16(28, nom.length, true); C.setUint32(42, off, true);
    central.push(new Uint8Array(C.buffer), nom);
    off += 30 + nom.length + dat.length;
  }
  const tamC = central.reduce((a, u) => a + u.length, 0), F = new DataView(new ArrayBuffer(22));
  F.setUint32(0, 0x06054b50, true); F.setUint16(8, archivos.length, true); F.setUint16(10, archivos.length, true); F.setUint32(12, tamC, true); F.setUint32(16, off, true);
  return unirBytes([...partes, ...central, new Uint8Array(F.buffer)]);
}
function unirBytes(xs) { const t = xs.reduce((a, u) => a + u.length, 0), out = new Uint8Array(t); let o = 0; for (const u of xs) { out.set(u, o); o += u.length; } return out; }
/* texto para XML: sin caracteres de control y con & < > " escapados */
const xmlEsc = s => String(s == null ? '' : s).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const sinEmoji = s => String(s || '').replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}]/gu, '').replace(/\s{2,}/g, ' ').trim();
const coreXml = titulo => `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>${xmlEsc(titulo)}</dc:title><dc:creator>Pilates Lab</dc:creator><dcterms:created xsi:type="dcterms:W3CDTF">${new Date().toISOString().slice(0, 19)}Z</dcterms:created></cp:coreProperties>`;

/* ---------- Word (.docx) ---------- */
const EMU_PX = 9525;
function docxArmar(D, cfg, imgs) {
  const carta = cfg.papel !== 'a4', pgW = carta ? 12240 : 11906, pgH = carta ? 15840 : 16838, mar = 1000, ancho = pgW - 2 * mar;
  const medios = [];
  let idDib = 1;
  const run = (t, o = {}) => `<w:r><w:rPr>${o.b ? '<w:b/>' : ''}${o.i ? '<w:i/>' : ''}${o.color ? `<w:color w:val="${o.color}"/>` : ''}${o.sz ? `<w:sz w:val="${o.sz}"/><w:szCs w:val="${o.sz}"/>` : ''}</w:rPr><w:t xml:space="preserve">${xmlEsc(t)}</w:t></w:r>`;
  const par = (runs, o = {}) => `<w:p><w:pPr>${o.estilo ? `<w:pStyle w:val="${o.estilo}"/>` : ''}${o.keep ? '<w:keepNext/>' : ''}<w:spacing w:before="${o.antes || 0}" w:after="${o.despues == null ? 60 : o.despues}"/>${o.jc ? `<w:jc w:val="${o.jc}"/>` : ''}</w:pPr>${runs}</w:p>`;
  const dibujo = (im, anchoPx) => {
    const n = idDib++, rid = 'rIdImg' + n, cx = Math.round(anchoPx * EMU_PX), cy = Math.round(anchoPx * im.h / im.w * EMU_PX);
    medios.push({ name: `word/media/img${n}.jpeg`, data: im.bytes, rid, file: `media/img${n}.jpeg` });
    return `<w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="${cx}" cy="${cy}"/><wp:docPr id="${n}" name="Imagen ${n}"/><wp:cNvGraphicFramePr><a:graphicFrameLocks xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" noChangeAspect="1"/></wp:cNvGraphicFramePr><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="${n}" name="img${n}.jpeg"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="${rid}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r>`;
  };
  /* columnas: casilla, Nº, imagen, ejercicio (con el movimiento), repeticiones, prop */
  const conImg = cfg.img !== 'no', seq = cfg.img === 'secuencia', conReps = cfg.reps;
  const cols = [];
  if (cfg.tilde) cols.push(['', 420]);
  cols.push(['Nº', 480]);
  if (conImg && !seq) cols.push(['Imagen', 2300]);
  const fijas = cols.reduce((a, c) => a + c[1], 0) + (conReps ? 1500 + 1500 : 0);
  cols.push(['Ejercicio', ancho - fijas]);
  if (conReps) cols.push(['Repeticiones', 1500], ['Prop', 1500]);
  const celda = (contenido, w, o = {}) => `<w:tc><w:tcPr><w:tcW w:w="${w}" w:type="dxa"/>${o.span ? `<w:gridSpan w:val="${o.span}"/>` : ''}${o.fill ? `<w:shd w:val="clear" w:color="auto" w:fill="${o.fill}"/>` : ''}<w:vAlign w:val="${o.centro ? 'center' : 'top'}"/></w:tcPr>${contenido || par('')}</w:tc>`;
  const filaTabla = (celdas, o = {}) => `<w:tr><w:trPr><w:cantSplit/>${o.cab ? '<w:tblHeader/>' : ''}</w:trPr>${celdas}</w:tr>`;
  let filas = filaTabla(cols.map(([t, w]) => celda(par(run(t, { b: true, sz: 19 }), { despues: 0 }), w, { fill: 'E3F2EA', centro: true })).join(''), { cab: true });
  let k = 0;
  for (const f of D.filas) {
    if (f.tipo === 'pos') {
      const txt = run(f.nom, { b: true, sz: 20 }) + (cfg.trans && f.trans ? run('   ↳ ' + f.trans, { i: true, sz: 17, color: '555555' }) : '');
      filas += filaTabla(celda(par(txt, { despues: 0, keep: true }), ancho, { span: cols.length, fill: 'F2F2F2' }));
      continue;
    }
    const im = imgs[k++] || [];
    let ej = par(run(f.nombre, { b: true, sz: 22 }), { despues: 20 });
    ej += par(run([f.pos, f.fuente, cfg.princ && f.principios ? 'Principios: ' + f.principios : ''].filter(Boolean).join(' · '), { sz: 17, color: '666666' }), { despues: 40 });
    if (seq && im.length) { const anchoEj = cols.find(c => c[0] === 'Ejercicio')[1] / 1440 * 96 - 16; ej += par(im.map(x => dibujo(x, Math.floor(Math.min(150, (anchoEj - 6 * (im.length - 1)) / im.length, 110 * x.w / x.h)))).join(run(' ')), { despues: 40 }); }
    for (const [fase, acc] of f.mov) ej += par(run(fase + ': ', { b: true, sz: 19 }) + run(acc, { sz: 19 }), { despues: 30 });
    if (cfg.adap && f.adap) ej += par(run('Adaptación: ', { b: true, sz: 18, color: '8A4B00' }) + run(f.adap, { sz: 18, color: '8A4B00' }), { despues: 20 });
    if (f.nota) ej += par(run('Nota: ', { b: true, sz: 18 }) + run(f.nota, { sz: 18 }), { despues: 20 });
    const cs = [];
    let ci = 0;
    if (cfg.tilde) cs.push(celda(par(run('☐', { sz: 26 }), { jc: 'center', despues: 0 }), cols[ci++][1], { centro: true }));
    cs.push(celda(par(run(String(f.num), { b: true, sz: 22 }), { jc: 'center', despues: 0 }), cols[ci++][1]));
    if (conImg && !seq) { const w = cols[ci++][1]; cs.push(celda(im.length ? par(dibujo(im[0], Math.floor(Math.min(w / 1440 * 96 - 14, 120 * im[0].w / im[0].h))), { despues: 0, jc: 'center' }) : par(''), w)); }
    cs.push(celda(ej, cols[ci++][1]));
    if (conReps) { cs.push(celda(par(run(f.reps, { sz: 19 }), { despues: 0 }), cols[ci++][1])); cs.push(celda(par(run(f.prop, { sz: 19 }), { despues: 0 }), cols[ci++][1])); }
    filas += filaTabla(cs.join(''));
  }
  const borde = t => `<w:${t} w:val="single" w:sz="4" w:space="0" w:color="BFBFBF"/>`;
  const tabla = `<w:tbl><w:tblPr><w:tblW w:w="${ancho}" w:type="dxa"/><w:tblBorders>${['top', 'left', 'bottom', 'right', 'insideH', 'insideV'].map(borde).join('')}</w:tblBorders><w:tblLayout w:type="fixed"/><w:tblCellMar><w:top w:w="60" w:type="dxa"/><w:left w:w="90" w:type="dxa"/><w:bottom w:w="60" w:type="dxa"/><w:right w:w="90" w:type="dxa"/></w:tblCellMar></w:tblPr><w:tblGrid>${cols.map(c => `<w:gridCol w:w="${c[1]}"/>`).join('')}</w:tblGrid>${filas}</w:tbl>`;
  let cuerpo = par(run(D.titulo), { estilo: 'Title', despues: 60 }) + par(run(D.info, { color: '555555' }), { despues: 60 });
  for (const t of D.extra) cuerpo += par(run(t, { sz: 20 }), { despues: 60 });
  if (cfg.princ && D.princ.length) cuerpo += par(run('Los 5 principios del movimiento: ', { b: true, sz: 20 }) + run(D.princ.map(p => `${p.corto} ${p.n}`).join(' · '), { sz: 20 }), { despues: 160 });
  cuerpo += tabla + par('', { despues: 0 });
  const NS = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"';
  const documento = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document ${NS}><w:body>${cuerpo}<w:sectPr><w:footerReference w:type="default" r:id="rIdPie"/><w:pgSz w:w="${pgW}" w:h="${pgH}"/><w:pgMar w:top="${mar}" w:right="${mar}" w:bottom="${mar}" w:left="${mar}" w:header="600" w:footer="500" w:gutter="0"/></w:sectPr></w:body></w:document>`;
  const pie = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:ftr ${NS}><w:p><w:pPr><w:jc w:val="right"/></w:pPr>${run(sinEmoji(D.titulo) + ' · Pilates Lab · página ', { sz: 16, color: '888888' })}<w:r><w:rPr><w:sz w:val="16"/><w:color w:val="888888"/></w:rPr><w:fldChar w:fldCharType="begin"/></w:r><w:r><w:rPr><w:sz w:val="16"/><w:color w:val="888888"/></w:rPr><w:instrText xml:space="preserve"> PAGE </w:instrText></w:r><w:r><w:rPr><w:sz w:val="16"/><w:color w:val="888888"/></w:rPr><w:fldChar w:fldCharType="separate"/></w:r><w:r><w:rPr><w:sz w:val="16"/><w:color w:val="888888"/></w:rPr><w:t>1</w:t></w:r><w:r><w:rPr><w:sz w:val="16"/><w:color w:val="888888"/></w:rPr><w:fldChar w:fldCharType="end"/></w:r></w:p></w:ftr>`;
  const estilos = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:eastAsia="Calibri" w:cs="Calibri"/><w:sz w:val="21"/><w:szCs w:val="21"/><w:lang w:val="es-419"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="60" w:line="259" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/></w:style><w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:rPr><w:b/><w:color w:val="1F6F4A"/><w:sz w:val="40"/><w:szCs w:val="40"/></w:rPr></w:style><w:style w:type="table" w:default="1" w:styleId="TableNormal"><w:name w:val="Normal Table"/><w:tblPr><w:tblInd w:w="0" w:type="dxa"/><w:tblCellMar><w:top w:w="0" w:type="dxa"/><w:left w:w="108" w:type="dxa"/><w:bottom w:w="0" w:type="dxa"/><w:right w:w="108" w:type="dxa"/></w:tblCellMar></w:tblPr></w:style></w:styles>`;
  const tipos = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="jpeg" ContentType="image/jpeg"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/></Types>`;
  const rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/></Relationships>`;
  const docRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdEst" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/><Relationship Id="rIdPie" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/>${medios.map(m => `<Relationship Id="${m.rid}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="${m.file}"/>`).join('')}</Relationships>`;
  return armarZip([
    { name: '[Content_Types].xml', data: tipos }, { name: '_rels/.rels', data: rels }, { name: 'docProps/core.xml', data: coreXml(D.titulo) },
    { name: 'word/document.xml', data: documento }, { name: 'word/styles.xml', data: estilos }, { name: 'word/footer1.xml', data: pie },
    { name: 'word/_rels/document.xml.rels', data: docRels }, ...medios.map(m => ({ name: m.name, data: m.data }))
  ]);
}

/* ---------- Excel (.xlsx) ---------- */
const colLetra = i => { let s = ''; i++; while (i > 0) { const m = (i - 1) % 26; s = String.fromCharCode(65 + m) + s; i = Math.floor((i - 1) / 26); } return s; };
function xlsxArmar(D, cfg, imgs) {
  const cols = [];
  if (cfg.tilde) cols.push({ k: 'tilde', t: '✓', w: 4 });
  cols.push({ k: 'num', t: 'Nº', w: 5 });
  if (cfg.img !== 'no') cols.push({ k: 'img', t: 'Imagen', w: 24 });
  cols.push({ k: 'nombre', t: 'Ejercicio', w: 30 }, { k: 'pos', t: 'Posición', w: 13 });
  if (cfg.reps) cols.push({ k: 'reps', t: 'Repeticiones', w: 14 }, { k: 'prop', t: 'Prop', w: 12 });
  if (cfg.princ) cols.push({ k: 'principios', t: 'Principios', w: 22 });
  if (cfg.mov !== 'no') cols.push({ k: 'mov', t: 'Movimiento', w: 60 });
  cols.push({ k: 'notas', t: cfg.adap ? 'Adaptación y notas' : 'Notas', w: 30 });
  const ult = colLetra(cols.length - 1);
  const filas = [], merges = [], anclas = [];
  const celda = (ref, v, s) => v === '' || v == null ? `<c r="${ref}" s="${s}"/>` : typeof v === 'number' ? `<c r="${ref}" s="${s}"><v>${v}</v></c>` : `<c r="${ref}" s="${s}" t="inlineStr"><is><t xml:space="preserve">${xmlEsc(v)}</t></is></c>`;
  /* alto de una fila: las líneas que ocupa el texto más largo (o la imagen) */
  const lineas = (txt, ancho) => String(txt || '').split('\n').reduce((a, l) => a + Math.max(1, Math.ceil(l.length / Math.max(4, ancho * 1.1))), 0);
  let r = 1;
  filas.push(`<row r="${r}" ht="26" customHeight="1">${celda('A' + r, D.titulo, 1)}</row>`); merges.push(`A${r}:${ult}${r}`); r++;
  filas.push(`<row r="${r}">${celda('A' + r, D.info, 6)}</row>`); merges.push(`A${r}:${ult}${r}`); r++;
  for (const t of D.extra) { filas.push(`<row r="${r}" ht="${15 * lineas(t, cols.reduce((a, c) => a + c.w, 0))}" customHeight="1">${celda('A' + r, t, 8)}</row>`); merges.push(`A${r}:${ult}${r}`); r++; }
  if (cfg.princ && D.princ.length) { filas.push(`<row r="${r}">${celda('A' + r, 'Los 5 principios del movimiento: ' + D.princ.map(p => `${p.corto} ${p.n}`).join(' · '), 6)}</row>`); merges.push(`A${r}:${ult}${r}`); r++; }
  r++;
  const filaCab = r;
  filas.push(`<row r="${r}" ht="20" customHeight="1">${cols.map((c, i) => celda(colLetra(i) + r, c.t, 2)).join('')}</row>`); r++;
  let k = 0;
  for (const f of D.filas) {
    if (f.tipo === 'pos') {
      const t = f.nom + (cfg.trans && f.trans ? '   ↳ ' + f.trans : '');
      filas.push(`<row r="${r}" ht="${Math.max(16, 15 * lineas(t, cols.reduce((a, c) => a + c.w, 0)))}" customHeight="1">${celda('A' + r, t, 5)}${cols.slice(1).map((c, i) => celda(colLetra(i + 1) + r, '', 5)).join('')}</row>`);
      merges.push(`A${r}:${ult}${r}`); r++;
      continue;
    }
    const im = imgs[k++] || [];
    const val = {
      tilde: '', num: f.num, img: '', nombre: f.nombre, pos: f.pos, reps: f.reps, prop: f.prop, principios: f.principios,
      mov: f.mov.map(([a, b]) => `${a}: ${b}`).join('\n'),
      notas: [cfg.adap && f.adap ? 'Adaptación: ' + f.adap : '', f.nota ? 'Nota: ' + f.nota : ''].filter(Boolean).join('\n')
    };
    let alto = Math.max(18, ...cols.map(c => 15 * lineas(val[c.k], c.w)));
    const ci = cols.findIndex(c => c.k === 'img');
    if (ci >= 0 && im.length) {
      /* la imagen (o la secuencia en fila) dentro de la celda */
      const anchoPx = cols[ci].w * 7 + 5 - 8, cada = (anchoPx - (im.length - 1) * 3) / im.length;
      let x = 4;
      for (const m of im) { const w = Math.min(cada, 110 * m.w / m.h), h = w * m.h / m.w; anclas.push({ col: ci, fila: r - 1, x, w, h, m }); x += w + 3; alto = Math.max(alto, h * 0.75 + 8); }
    }
    filas.push(`<row r="${r}" ht="${Math.round(alto)}" customHeight="1">${cols.map((c, i) => celda(colLetra(i) + r, val[c.k], c.k === 'num' || c.k === 'tilde' ? 7 : c.k === 'nombre' ? 4 : 3)).join('')}</row>`);
    r++;
  }
  const NSR = 'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"';
  const hoja = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" ${NSR}><sheetPr><pageSetUpPr fitToPage="1"/></sheetPr><dimension ref="A1:${ult}${r - 1}"/><sheetViews><sheetView workbookViewId="0"><pane ySplit="${filaCab}" topLeftCell="A${filaCab + 1}" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><sheetFormatPr defaultRowHeight="15"/><cols>${cols.map((c, i) => `<col min="${i + 1}" max="${i + 1}" width="${c.w}" customWidth="1"/>`).join('')}</cols><sheetData>${filas.join('')}</sheetData><mergeCells count="${merges.length}">${merges.map(m => `<mergeCell ref="${m}"/>`).join('')}</mergeCells><pageMargins left="0.4" right="0.4" top="0.5" bottom="0.6" header="0.3" footer="0.3"/><pageSetup paperSize="${cfg.papel === 'a4' ? 9 : 1}" orientation="${cfg.mov !== 'no' || cols.length > 7 ? 'landscape' : 'portrait'}" fitToWidth="1" fitToHeight="0"/><headerFooter><oddFooter>&amp;L${xmlEsc(sinEmoji(D.titulo))} · Pilates Lab&amp;RPágina &amp;P de &amp;N</oddFooter></headerFooter>${anclas.length ? '<drawing r:id="rIdDib"/>' : ''}</worksheet>`;
  const dibujo = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" ${NSR}>${anclas.map((a, i) => {
    const cx = Math.round(a.w * EMU_PX), cy = Math.round(a.h * EMU_PX);
    return `<xdr:oneCellAnchor><xdr:from><xdr:col>${a.col}</xdr:col><xdr:colOff>${Math.round(a.x * EMU_PX)}</xdr:colOff><xdr:row>${a.fila}</xdr:row><xdr:rowOff>${4 * EMU_PX}</xdr:rowOff></xdr:from><xdr:ext cx="${cx}" cy="${cy}"/><xdr:pic><xdr:nvPicPr><xdr:cNvPr id="${i + 2}" name="Imagen ${i + 1}"/><xdr:cNvPicPr><a:picLocks noChangeAspect="1"/></xdr:cNvPicPr></xdr:nvPicPr><xdr:blipFill><a:blip r:embed="rIdImg${i + 1}"/><a:stretch><a:fillRect/></a:stretch></xdr:blipFill><xdr:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></xdr:spPr></xdr:pic><xdr:clientData/></xdr:oneCellAnchor>`;
  }).join('')}</xdr:wsDr>`;
  const estilos = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="5"><font><sz val="11"/><name val="Calibri"/><family val="2"/></font><font><b/><sz val="11"/><name val="Calibri"/><family val="2"/></font><font><b/><sz val="16"/><color rgb="FF1F6F4A"/><name val="Calibri"/><family val="2"/></font><font><i/><sz val="10"/><color rgb="FF444444"/><name val="Calibri"/><family val="2"/></font><font><sz val="10"/><color rgb="FF555555"/><name val="Calibri"/><family val="2"/></font></fonts><fills count="4"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFE3F2EA"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFF2F2F2"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border><border><left style="thin"><color rgb="FFBFBFBF"/></left><right style="thin"><color rgb="FFBFBFBF"/></right><top style="thin"><color rgb="FFBFBFBF"/></top><bottom style="thin"><color rgb="FFBFBFBF"/></bottom><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="9"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1"/><xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf><xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf><xf numFmtId="0" fontId="1" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf><xf numFmtId="0" fontId="3" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf><xf numFmtId="0" fontId="4" fillId="0" borderId="0" xfId="0" applyFont="1"/><xf numFmtId="0" fontId="1" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="top"/></xf><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`;
  const libro = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" ${NSR}><sheets><sheet name="Clase" sheetId="1" r:id="rId1"/></sheets><definedNames><definedName name="_xlnm.Print_Titles" localSheetId="0">Clase!$${filaCab}:$${filaCab}</definedName></definedNames></workbook>`;
  const tipos = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="jpeg" ContentType="image/jpeg"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${anclas.length ? '<Override PartName="/xl/drawings/drawing1.xml" ContentType="application/vnd.openxmlformats-officedocument.drawing+xml"/>' : ''}<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/></Types>`;
  const R = (id, tipo, dest) => `<Relationship Id="${id}" Type="${tipo}" Target="${dest}"/>`, RT = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/';
  const rels = (...xs) => `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${xs.join('')}</Relationships>`;
  const archivos = [
    { name: '[Content_Types].xml', data: tipos },
    { name: '_rels/.rels', data: rels(R('rId1', RT + 'officeDocument', 'xl/workbook.xml'), R('rId2', 'http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties', 'docProps/core.xml')) },
    { name: 'docProps/core.xml', data: coreXml(D.titulo) },
    { name: 'xl/workbook.xml', data: libro },
    { name: 'xl/_rels/workbook.xml.rels', data: rels(R('rId1', RT + 'worksheet', 'worksheets/sheet1.xml'), R('rId2', RT + 'styles', 'styles.xml')) },
    { name: 'xl/styles.xml', data: estilos },
    { name: 'xl/worksheets/sheet1.xml', data: hoja }
  ];
  if (anclas.length) {
    archivos.push({ name: 'xl/worksheets/_rels/sheet1.xml.rels', data: rels(R('rIdDib', RT + 'drawing', '../drawings/drawing1.xml')) },
      { name: 'xl/drawings/drawing1.xml', data: dibujo },
      { name: 'xl/drawings/_rels/drawing1.xml.rels', data: rels(...anclas.map((a, i) => R('rIdImg' + (i + 1), RT + 'image', `../media/img${i + 1}.jpeg`))) },
      ...anclas.map((a, i) => ({ name: `xl/media/img${i + 1}.jpeg`, data: a.m.bytes })));
  }
  return armarZip(archivos);
}

/* ---------- PDF (Helvetica del lector, texto en WinAnsi) ---------- */
/* anchos de Helvetica y Helvetica-Bold (AFM de Adobe) para 32–126 */
const PDF_W = [
  [278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278, 278, 556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 278, 278, 584, 584, 584, 556, 1015, 667, 667, 722, 722, 667, 611, 778, 722, 278, 500, 667, 556, 833, 722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 278, 278, 278, 469, 556, 333, 556, 556, 500, 556, 556, 278, 556, 556, 222, 222, 500, 222, 833, 556, 556, 556, 556, 333, 500, 278, 556, 500, 722, 500, 500, 500, 334, 260, 334, 584],
  [278, 333, 474, 556, 556, 889, 722, 238, 333, 333, 389, 584, 278, 333, 278, 278, 556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 333, 333, 584, 584, 584, 611, 975, 722, 722, 722, 722, 667, 611, 778, 722, 278, 556, 722, 611, 833, 722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 333, 278, 333, 584, 556, 333, 556, 611, 556, 611, 556, 333, 611, 611, 278, 278, 556, 278, 889, 611, 611, 611, 611, 389, 556, 333, 611, 556, 778, 556, 556, 500, 389, 280, 389, 584]
];
const WIN_ESP = { '€': 0x80, '…': 0x85, '‘': 0x91, '’': 0x92, '“': 0x93, '”': 0x94, '•': 0x95, '–': 0x96, '—': 0x97, '‹': 0x8B, '›': 0x9B };
const ANCHO_ESP = { 0x80: 556, 0x85: 1000, 0x91: 222, 0x92: 222, 0x93: 333, 0x94: 333, 0x95: 350, 0x96: 556, 0x97: 1000, 0x8B: 333, 0x9B: 333,
  0xA0: 278, 0xA1: 333, 0xBF: 611, 0xB0: 400, 0xB7: 278, 0xD7: 584, 0xAB: 556, 0xBB: 556, 0xBA: 365, 0xAA: 370, 0xB1: 584, 0xB2: 333, 0xB3: 333, 0xBD: 834 };
/* a WinAnsi: lo que no está (flechas, emojis, ≈) se reemplaza */
function pdfTexto(s) {
  s = sinEmoji(s).replace(/[→↳]/g, '›').replace(/←/g, '‹').replace(/≈/g, '~').replace(/≥/g, '>=').replace(/≤/g, '<=').replace(/[✓✔]/g, 'v').replace(/[☐□]/g, '').replace(/\s+/g, ' ');
  let out = '';
  for (const ch of s) {
    const c = ch.codePointAt(0);
    if (c >= 32 && c <= 126) out += ch;
    else if (WIN_ESP[ch]) out += String.fromCharCode(WIN_ESP[ch]);
    else if (c >= 0xA0 && c <= 0xFF) out += ch;
    else { const base = ch.normalize('NFD').replace(/[̀-ͯ]/g, ''); if (/^[\x20-\x7E]$/.test(base)) out += base; }
  }
  return out;
}
function pdfAncho(s, negrita, tam) {
  const t = PDF_W[negrita ? 1 : 0];
  let w = 0;
  for (const ch of s) {
    const c = ch.charCodeAt(0);
    if (c >= 32 && c <= 126) w += t[c - 32];
    else if (ANCHO_ESP[c]) w += ANCHO_ESP[c];
    else { const base = ch.normalize('NFD')[0], b = base.charCodeAt(0); w += b >= 32 && b <= 126 ? (/[ií]/.test(ch) && !negrita ? 278 : t[b - 32]) : 556; }
  }
  return w * tam / 1000;
}
function pdfPartir(s, negrita, tam, ancho) {
  const palabras = pdfTexto(s).split(' '), lineas = [];
  let l = '';
  for (const p of palabras) {
    const prueba = l ? l + ' ' + p : p;
    if (!l || pdfAncho(prueba, negrita, tam) <= ancho) l = prueba;
    else { lineas.push(l); l = p; }
  }
  if (l) lineas.push(l);
  return lineas.length ? lineas : [''];
}
const pdfStr = s => '(' + s.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)') + ')';
const n2 = v => (Math.round(v * 100) / 100).toString();
function pdfArmar(D, cfg, imgs) {
  const carta = cfg.papel !== 'a4', PW = carta ? 612 : 595.28, PH = carta ? 792 : 841.89, M = 42, AN = PW - 2 * M, PIE = 30;
  const paginas = [], fotos = [];
  let ops = [], y = M, usadas = new Set();
  const nueva = () => { if (ops.length) paginas.push({ ops, usadas }); ops = []; usadas = new Set(); y = M; };
  const Y = v => PH - v;
  const texto = (s, x, yTop, tam, negrita, color = '0.1 0.1 0.1') => ops.push(`BT /${negrita ? 'F2' : 'F1'} ${tam} Tf ${color} rg ${n2(x)} ${n2(Y(yTop + tam * 0.8))} Td ${pdfStr(s)} Tj ET`);
  const rect = (x, yTop, w, h, fill, stroke) => { if (fill) ops.push(`${fill} rg ${n2(x)} ${n2(Y(yTop + h))} ${n2(w)} ${n2(h)} re f`); if (stroke) ops.push(`${stroke} RG 0.7 w ${n2(x)} ${n2(Y(yTop + h))} ${n2(w)} ${n2(h)} re S`); };
  const foto = (m, x, yTop, w) => { let i = fotos.indexOf(m); if (i < 0) { fotos.push(m); i = fotos.length - 1; } usadas.add(i); const h = w * m.h / m.w; ops.push(`q ${n2(w)} 0 0 ${n2(h)} ${n2(x)} ${n2(Y(yTop + h))} cm /Im${i + 1} Do Q`); return h; };
  const cabe = h => y + h <= PH - M - PIE;
  /* bloques de texto: [texto, negrita, tamaño, color, sangría] → líneas medidas */
  const medir = (partes, ancho) => partes.flatMap(([s, b, tam, color]) => pdfPartir(s, b, tam, ancho).map(l => ({ l, b, tam, color, h: tam * 1.3 })));
  const escribir = (lineas, x) => { for (const ln of lineas) { if (!cabe(ln.h)) nueva(); texto(ln.l, x, y, ln.tam, ln.b, ln.color); y += ln.h; } };
  /* encabezado */
  escribir(medir([[D.titulo, true, 20, '0.12 0.43 0.29']], AN), M); y += 4;
  escribir(medir([[D.info, false, 10, '0.35 0.35 0.35'], ...D.extra.map(t => [t, false, 10, '0.2 0.2 0.2'])], AN), M);
  if (cfg.princ && D.princ.length) { y += 2; escribir(medir([['Los 5 principios del movimiento: ' + D.princ.map(p => `${p.corto} ${p.n}`).join(' · '), true, 10, '0.12 0.43 0.29']], AN), M); }
  y += 10;
  let k = 0;
  for (const f of D.filas) {
    if (f.tipo === 'pos') {
      const ls = medir([[f.nom, true, 11.5, '0.1 0.1 0.1'], ...(cfg.trans && f.trans ? [['› ' + f.trans, false, 9, '0.35 0.35 0.35']] : [])], AN - 12);
      const h = ls.reduce((a, l) => a + l.h, 0) + 8;
      if (!cabe(h + 60)) nueva();
      rect(M, y, AN, h, '0.95 0.95 0.95');
      y += 4; escribir(ls, M + 6); y += 8;
      continue;
    }
    /* una imagen va al costado; la secuencia, en fila debajo del nombre; nada más alto que 95 pt */
    const im = imgs[k++] || [], seq = im.length > 1, izq = im.length === 1 ? Math.min(140, 95 * im[0].w / im[0].h) : 0;
    /* solo nombres: más compacto (los principios en la misma línea que las repeticiones) */
    const compacto = !f.mov.length && !im.length;
    const x0 = M + (cfg.tilde ? 20 : 0) + 22, anchoTxt = AN - (x0 - M) - (izq ? izq + 10 : 0);
    const meta = [cfg.reps && f.reps ? f.reps : '', cfg.reps && f.prop ? 'Prop: ' + f.prop : '', f.pos, f.fuente, compacto && cfg.princ && f.principios ? 'Principios: ' + f.principios : ''].filter(Boolean).join(' · ');
    const conPr = !compacto && cfg.princ && f.principios;
    /* cabecera (nombre, datos, principios) y cuerpo (movimiento, adaptación, nota); la secuencia va entre los dos */
    const cab = medir([[f.nombre, true, 12, '0.08 0.08 0.08'], [meta, false, 9.5, '0.3 0.3 0.3'],
      ...(conPr ? [['Principios: ' + f.principios, false, 8.5, '0.12 0.43 0.29']] : [])], anchoTxt);
    const cuerpo = medir([...f.mov.map(([a, b]) => [`${a}: ${b}`, false, 9.5, '0.12 0.12 0.12']),
      ...(cfg.adap && f.adap ? [['Adaptación: ' + f.adap, false, 9, '0.54 0.29 0']] : []),
      ...(f.nota ? [['Nota: ' + f.nota, false, 9, '0.2 0.2 0.2']] : [])], anchoTxt);
    const hTxt = [...cab, ...cuerpo].reduce((a, l) => a + l.h, 0);
    const lugar = Math.min(130, ((AN - (x0 - M)) - (im.length - 1) * 6) / Math.max(1, im.length)), anchoSeq = m => Math.min(lugar, 95 * m.w / m.h);
    const hSeq = seq ? Math.max(...im.map(m => anchoSeq(m) * m.h / m.w)) + 6 : 0;
    const hImg = izq ? izq * im[0].h / im[0].w : 0;
    const sep = compacto ? 3 : 6, hBloque = Math.max(hTxt + hSeq, hImg) + 2 * sep;
    if (!cabe(hBloque) && hBloque < PH - 2 * M - PIE) nueva();
    const y0 = y;
    if (cfg.tilde) rect(M, y0 + 1, 11, 11, null, '0.4 0.4 0.4');
    texto(String(f.num), M + (cfg.tilde ? 20 : 0), y0, 12, true, '0.12 0.43 0.29');
    if (izq) foto(im[0], PW - M - izq, y0, izq);
    escribir(cab, x0);
    if (hSeq) { let x = x0; y += 2; for (const m of im) { const w = anchoSeq(m); foto(m, x, y, w); x += w + 6; } y += hSeq; }
    escribir(cuerpo, x0);
    y = Math.max(y, y0 + hImg) + sep;
    ops.push(`0.85 0.85 0.85 RG 0.5 w ${n2(M)} ${n2(Y(y))} m ${n2(PW - M)} ${n2(Y(y))} l S`);
    y += sep;
  }
  nueva();
  /* pie con el número de página */
  const tot = paginas.length;
  paginas.forEach((pg, i) => {
    const t = pdfTexto(`${D.titulo} · Pilates Lab`), d = pdfTexto(`página ${i + 1} de ${tot}`);
    pg.ops.push(`BT /F1 8 Tf 0.5 0.5 0.5 rg ${n2(M)} ${n2(M - 16)} Td ${pdfStr(t)} Tj ET`, `BT /F1 8 Tf 0.5 0.5 0.5 rg ${n2(PW - M - pdfAncho(d, false, 8))} ${n2(M - 16)} Td ${pdfStr(d)} Tj ET`);
  });
  /* objetos: 1 catálogo, 2 páginas, 3–4 fuentes, imágenes, y por página contenido + página */
  const objs = [];
  const latin1 = s => { const u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i) & 255; return u; };
  objs[1] = latin1('<< /Type /Catalog /Pages 2 0 R >>');
  objs[3] = latin1('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
  objs[4] = latin1('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');
  fotos.forEach((m, i) => { objs[5 + i] = unirBytes([latin1(`<< /Type /XObject /Subtype /Image /Width ${m.w} /Height ${m.h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${m.bytes.length} >>\nstream\n`), m.bytes, latin1('\nendstream')]); });
  let sig = 5 + fotos.length;
  const kids = [];
  for (const pg of paginas) {
    const cont = latin1(pg.ops.join('\n')), nc = sig++, np = sig++;
    objs[nc] = unirBytes([latin1(`<< /Length ${cont.length} >>\nstream\n`), cont, latin1('\nendstream')]);
    const xo = [...pg.usadas].map(i => `/Im${i + 1} ${5 + i} 0 R`).join(' ');
    objs[np] = latin1(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${n2(PW)} ${n2(PH)}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >>${xo ? ` /XObject << ${xo} >>` : ''} >> /Contents ${nc} 0 R >>`);
    kids.push(np);
  }
  objs[2] = latin1(`<< /Type /Pages /Kids [${kids.map(k2 => k2 + ' 0 R').join(' ')}] /Count ${kids.length} >>`);
  const info = sig;
  objs[info] = latin1(`<< /Title ${pdfStr(pdfTexto(D.titulo))} /Producer (Pilates Lab) >>`);
  const partes = [latin1('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n')], offs = [];
  let off = partes[0].length;
  for (let i = 1; i < objs.length; i++) {
    const cab = latin1(`${i} 0 obj\n`), fin = latin1('\nendobj\n');
    offs[i] = off;
    partes.push(cab, objs[i], fin);
    off += cab.length + objs[i].length + fin.length;
  }
  const xref = [`xref\n0 ${objs.length}\n0000000000 65535 f \n`, ...offs.slice(1).map(o => String(o).padStart(10, '0') + ' 00000 n \n')].join('');
  partes.push(latin1(xref + `trailer\n<< /Size ${objs.length} /Root 1 0 R /Info ${info} 0 R >>\nstartxref\n${off}\n%%EOF\n`));
  return unirBytes(partes);
}

/* ---------- armar y descargar ---------- */
async function exportarPlan(p, cfg) {
  const D = datosExp(p, cfg);
  const imgs = [];
  for (const f of D.filas) if (f.tipo === 'ej') { try { imgs.push(await imagenesEj(f, cfg.img)); } catch (e) { imgs.push([]); } }
  const bytes = cfg.formato === 'xlsx' ? xlsxArmar(D, cfg, imgs) : cfg.formato === 'pdf' ? pdfArmar(D, cfg, imgs) : docxArmar(D, cfg, imgs);
  const base = (sinEmoji(D.titulo).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '-') || 'sesion').slice(0, 60);
  return { nombre: `${base}.${cfg.formato}`, bytes };
}
const TIPO_EXP = { docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', pdf: 'application/pdf' };

function abrirExportar(p) {
  const cfg = cfgExp();
  const chip = (g, v, t, on) => `<button type="button" data-xg="${g}" data-xv="${esc(v)}" class="${on ? 'on' : ''}" aria-pressed="${on}">${t}</button>`;
  const presetDe = () => (EXP_PRESETS.find(([, , o]) => o.mov === cfg.mov && o.img === cfg.img) || [''])[0];
  const pintar = () => {
    const m = abrirModal(`<div class="exp">
      <h3>Descargar la sesión</h3>
      <p class="micro">Word y Excel quedan editables; el PDF es para imprimir.</p>
      <div class="exp-formatos" role="group" aria-label="Formato">${EXP_FORMATOS.map(([k, t, s]) => `<button type="button" data-xg="formato" data-xv="${k}" class="${cfg.formato === k ? 'on' : ''}" aria-pressed="${cfg.formato === k}"><b>${t}</b><small>${s}</small></button>`).join('')}</div>
      <h4>Qué incluir</h4>
      <div class="chips" role="group" aria-label="Contenido">${EXP_PRESETS.map(([k, t]) => chip('preset', k, t, presetDe() === k)).join('')}</div>
      <h4>Movimiento</h4>
      <div class="chips" role="group" aria-label="Movimiento">${chip('mov', 'no', 'Sin', cfg.mov === 'no')}${chip('mov', 'breve', 'Posición inicial y pasos', cfg.mov === 'breve')}${chip('mov', 'completo', '+ indicaciones', cfg.mov === 'completo')}</div>
      <h4>Imagen</h4>
      <div class="chips" role="group" aria-label="Imagen">${chip('img', 'no', 'Sin', cfg.img === 'no')}${chip('img', 'primera', 'La primera', cfg.img === 'primera')}${chip('img', 'secuencia', 'La secuencia', cfg.img === 'secuencia')}</div>
      <h4>Además</h4>
      <div class="chips" role="group" aria-label="Además">${[['reps', 'Repeticiones y prop'], ['trans', 'Transiciones'], ['princ', 'Los 5 principios'], ['adap', 'Adaptaciones'], ['notas', 'Notas'], ['tilde', 'Casilla para tildar']].map(([k, t]) => chip('extra', k, t, cfg[k])).join('')}</div>
      <h4>Papel</h4>
      <div class="chips" role="group" aria-label="Papel">${chip('papel', 'carta', 'Carta', cfg.papel !== 'a4')}${chip('papel', 'a4', 'A4', cfg.papel === 'a4')}</div>
      ${cfg.img !== 'no' && p.items.some(x => (ejPlan(x.id) || {}).pm) ? '<p class="micro exp-ojo">Las fotos de Pre-Pilates parecen del manual del curso: el archivo es para tu uso; no lo publiques.</p>' : ''}
      <div class="fila"><button type="button" class="btn3d verde" id="expIr">⬇️ Descargar ${EXP_FORMATOS.find(f => f[0] === cfg.formato)[1]}</button><button type="button" class="btn ghost" data-cerrar>Cerrar</button></div>
    </div>`);
    $$('[data-xg]', m).forEach(b => b.onclick = () => {
      const g = b.dataset.xg, v = b.dataset.xv;
      if (g === 'preset') Object.assign(cfg, EXP_PRESETS.find(x => x[0] === v)[2]);
      else if (g === 'extra') cfg[v] = !cfg[v];
      else cfg[g] = v;
      guardar(); SND.toque(); pintar();
    });
    $('[data-cerrar]', m).onclick = cerrarModal;
    $('#expIr', m).onclick = async () => {
      const bot = $('#expIr', m);
      bot.disabled = true; bot.textContent = 'Armando…';
      try {
        const { nombre, bytes } = await exportarPlan(p, cfg);
        cerrarModal();
        await descargar(nombre, new Blob([bytes], { type: TIPO_EXP[cfg.formato] }), TIPO_EXP[cfg.formato], `Listo: <b>${esc(nombre)}</b>.`);
      } catch (e) {
        console.error(e);
        bot.disabled = false; bot.textContent = 'Probar de nuevo';
        toast('No se pudo armar el archivo.', 'toast-suave');
      }
    };
  };
  pintar();
}
