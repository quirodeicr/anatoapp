/* ============================================================
   Pilates Lab — lámina anatómica del mapa corporal

   Figura dibujada a mano en vectores, al estilo de un atlas: en cada
   vista la mitad izquierda muestra la capa SUPERFICIAL y la derecha la
   PROFUNDA (se dibuja en coordenadas de la mitad izquierda y se refleja).
   Cada forma lleva los nombres EXACTOS de REGIONES (datos.js) que
   representa; la región se deduce de esos nombres.

   Tipos:  m músculo de los apuntes (se toca)   n músculo que no está en
           los apuntes (se toca, avisa)          t tendón / fascia
           b hueso    g piel (cabeza, manos, pies)
           h músculo profundo que no se ve: solo aparece punteado al
             señalarlo desde la lista
   a = dirección de las fibras (grados desde la vertical)
   ============================================================ */
'use strict';

const LAMINA = (() => {
  const M = (m, a, d, n) => ({ k: 'm', m: [].concat(m), a, d, n });
  const N = (n, a, d) => ({ k: 'n', m: [], a, d, n });
  const T = (d, a = 0, n) => ({ k: 't', a, d, n });
  const B = (d, n) => ({ k: 'b', a: 0, d, n });
  const G = d => ({ k: 'g', a: 0, d });
  const H = (m, d, n) => ({ k: 'h', m: [].concat(m), a: 0, d, n });
  const circ = (cx, cy, r) => `M${cx - r},${cy} C${cx - r},${cy - r * 1.33} ${cx + r},${cy - r * 1.33} ${cx + r},${cy} C${cx + r},${cy + r * 1.33} ${cx - r},${cy + r * 1.33} ${cx - r},${cy} Z`;

  /* silueta de la mitad izquierda (se cierra por la línea media x=200) */
  const SIL = `M200,18 C176,18 158,36 157,66 C156,92 162,112 172,124 C176,132 178,140 178,148
    C172,160 150,166 124,170 C100,174 86,190 83,214 C80,240 82,270 80,300 C78,330 76,345 74,360
    C70,400 66,440 66,472 C61,484 57,498 58,510 C59,517 64,517 67,511 C65,528 67,546 75,554
    C83,559 91,554 94,544 C97,520 97,496 94,476 C100,440 110,400 114,368 C118,350 122,330 124,300 C126,280 128,262 132,252
    C136,275 138,300 140,330 C142,350 141,370 138,390 C130,410 120,430 118,450
    C114,500 120,560 136,610 C140,625 140,640 138,655 C132,690 132,730 142,770
    C148,795 150,812 150,826 C146,840 140,856 142,868 C156,874 176,874 186,868
    C188,850 182,832 178,822 C178,800 190,760 192,720 C194,690 188,670 184,655
    C184,630 190,600 194,560 C196,520 198,490 200,468 Z`;

  /* el contorno se traza sin cerrar, para que no quede una línea en el medio */
  const SIL_ABIERTA = SIL.replace(/\s*Z\s*$/, '');

  /* ---------- piezas compartidas ---------- */
  const CABEZA = G('M200,18 C224,18 242,36 243,66 C244,92 238,112 228,124 C220,134 210,138 200,138 C190,138 180,134 172,124 C162,112 156,92 157,66 C158,36 176,18 200,18 Z');
  const OREJAS = G('M158,70 C150,68 149,86 156,94 L160,92 Z M242,70 C250,68 251,86 244,94 L240,92 Z');
  const MANO = G('M66,470 L95,472 C97,496 97,520 94,544 C91,554 83,559 75,554 C67,546 65,528 67,511 C64,517 59,517 58,510 C57,498 61,484 66,470 Z');
  const DEDOS = T('M74,516 L75,552 L76,552 L75,516 Z M80,518 L82,556 L83,556 L81,518 Z M86,517 L88,552 L89,552 L87,517 Z', 0, 'Mano');
  const PIE = G('M150,818 L180,818 C182,836 188,852 186,868 C176,874 156,874 142,868 C140,856 146,838 150,818 Z');
  const ECM = N('Esternocleidomastoideo', 25, 'M166,108 C170,128 182,152 190,170 L199,169 C196,150 186,124 176,104 Z');
  const INFRAHIOIDEOS = N('Músculos infrahioideos', 0, 'M192,132 L200,132 L200,168 L197,168 Z');
  const ESCALENOS = M('Escalenos', 30, 'M170,134 C166,148 158,158 146,165 L162,166 C170,158 175,150 177,138 Z');
  const TRAP_FRENTE = M(['Trapecio superior, medio e inferior', 'Trapecio superior'], 70,
    'M177,144 C168,156 150,164 122,170 L140,173 C156,170 168,164 179,156 Z', 'Trapecio (porción superior)');
  const CLAVICULA = B('M196,170 C180,166 160,172 140,172 C130,172 118,170 108,172 L108,178 C120,176 132,178 142,178 C162,178 180,172 196,177 Z', 'Clavícula');

  /* brazo, cara anterior */
  const BRAQUIORRADIAL = M('Braquiorradial', -5, 'M84,316 C74,350 70,400 71,468 L80,468 C80,420 86,372 94,344 C92,330 88,320 84,316 Z');
  const FLEXORES = N('Flexores del antebrazo', 10, 'M94,346 C104,350 112,356 116,366 C110,406 100,440 95,468 L80,468 C80,420 86,372 94,346 Z');
  const TRICEPS_MED = M('Tríceps braquial', 0, 'M122,252 C128,282 127,318 119,348 L115,346 C121,316 122,284 118,254 Z');

  /* pierna, cara anterior */
  const TIBIAL_ANT = M('Tibial anterior', -4, 'M151,662 C144,700 148,752 157,812 L165,812 C163,760 165,700 166,662 Z');
  const TIBIA = T('M166,664 C168,710 170,770 172,818 L177,818 C176,770 175,710 174,664 Z', 0, 'Tibia (cara medial, bajo la piel)');
  const EXT_DEDOS = M('Extensor largo de los dedos', 0, 'M141,666 C137,700 142,760 150,814 L156,814 C151,760 150,700 152,664 Z');
  const EXT_GORDO = M('Extensor largo del dedo gordo', 0, 'M154,728 C154,760 157,790 161,816 L165,816 C162,790 160,760 158,728 Z');
  const GASTRO_MED = M('Gastrocnemio (rodilla extendida)', 0, 'M178,664 C190,684 194,720 188,760 L180,758 C184,720 182,690 174,666 Z', 'Gastrocnemio (cabeza medial)');
  const SOLEO_MED = M('Sóleo (rodilla flexionada)', 0, 'M181,762 C186,780 185,800 179,818 L175,816 C177,798 178,780 178,762 Z');
  const ROTULA = B('M162,610 C170,610 174,618 173,626 C172,634 167,640 162,641 C157,640 152,634 151,626 C150,618 154,610 162,610 Z', 'Rótula');
  const LIG_ROT = T('M156,636 L168,636 L166,664 L159,664 Z', 0, 'Ligamento rotuliano');
  const TENDONES_PIE = [T('M155,818 L160,818 L150,866 L145,866 Z', 20), T('M162,818 L167,818 L163,868 L158,868 Z', 0), T('M169,818 L174,818 L178,868 L173,868 Z', -10)];

  /* cadera/muslo, cara anterior */
  const TFL = M('TFL', 15, 'M144,402 C134,410 124,428 121,448 C121,462 123,474 127,484 C135,466 142,448 148,428 Z', 'Tensor de la fascia lata (TFL)');
  const GLUTEO_MEDIO_F = M('Glúteo medio', 30, 'M138,392 C130,400 124,414 121,432 L124,440 C130,420 138,408 144,402 Z');
  const CINTILLA = T('M121,448 C118,500 122,560 136,612 C138,622 140,632 142,642 L148,640 C144,612 132,560 128,500 C127,490 127,486 127,484 Z', -5, 'Tracto iliotibial');
  const VASTO_LAT = M('Vasto lateral', -10, 'M128,484 C124,530 128,580 142,618 C148,628 154,630 158,622 L154,606 C148,560 148,510 154,470 C142,470 134,476 128,484 Z');
  const VASTO_MED = M('Vasto medial', 30, 'M172,540 C184,560 190,590 184,618 C178,628 168,628 166,616 L168,604 C172,580 172,560 172,540 Z');
  const PECTINEO = M('Pectíneo', 30, 'M182,452 C188,453 193,457 195,463 C190,474 184,484 176,492 C174,478 176,464 182,452 Z');
  const GRACIL = M('Grácil', 4, 'M197,480 C198,520 194,580 186,636 L180,634 C186,580 188,530 190,500 Z');

  const FRENTE = {
    sup: [
      ECM, INFRAHIOIDEOS, ESCALENOS, TRAP_FRENTE,
      M('Serrato anterior', 60, [272, 286, 300, 314].map(y =>
        `M138,${y} C146,${y - 3} 154,${y} 160,${y + 6} C154,${y + 11} 146,${y + 11} 138,${y + 10} Z`).join(' ')),
      M('Dorsal ancho', 20, 'M132,254 C130,280 134,310 139,338 L146,332 C142,305 140,282 140,262 Z'),
      T('M168,300 L178,292 C172,340 172,390 180,424 C186,440 192,452 196,460 L188,462 C178,448 166,432 152,414 L162,402 C168,396 170,388 170,380 Z', -45, 'Aponeurosis del oblicuo externo'),
      M('Oblicuo externo', -45, 'M140,300 C137,330 139,362 140,392 C144,400 148,406 153,413 L162,402 C168,396 170,388 170,380 C168,350 168,322 172,296 C162,292 150,294 140,300 Z'),
      M('Recto abdominal', 0, 'M196,286 L178,288 C172,330 172,380 178,420 C182,438 188,450 196,458 Z'),
      ...[318, 352, 386].map(y => T(`M196,${y} C188,${y - 2} 180,${y} 175,${y + 3} L175,${y + 7} C182,${y + 4} 190,${y + 2} 196,${y + 4} Z`, 90, 'Intersección tendinosa')),
      CLAVICULA,
      M('Pectoral mayor', 80, 'M194,178 L144,179 C136,196 128,216 120,234 C124,250 130,262 140,270 C156,282 176,288 194,284 Z'),
      M('Deltoides', 5, 'M140,176 C128,176 116,174 108,176 C94,182 86,198 84,222 C84,240 92,262 103,280 C108,262 114,246 120,234 C126,214 132,194 140,176 Z'),
      M('Tríceps braquial', 0, 'M82,250 C80,280 81,318 86,344 L91,342 C88,318 87,286 90,262 Z', 'Tríceps braquial (cabeza lateral)'),
      M('Bíceps braquial', 3, 'M104,240 C94,264 90,300 94,338 C98,346 106,348 112,340 C116,300 116,264 116,240 Z'),
      M('Braquial', 3, 'M90,292 C85,312 85,332 90,348 L96,346 C92,326 92,306 95,290 Z M116,292 C120,312 120,332 114,350 L110,346 C113,326 114,306 114,292 Z'),
      TRICEPS_MED,
      M('Coracobraquial', 10, 'M118,238 C124,246 126,258 124,272 L119,266 C118,256 117,246 116,240 Z'),
      FLEXORES, BRAQUIORRADIAL, MANO, DEDOS,
      GLUTEO_MEDIO_F, TFL, CINTILLA, VASTO_LAT,
      M(['Recto femoral'], 0, 'M156,446 C148,490 148,560 154,606 L168,606 C174,560 174,490 164,446 Z'),
      T('M159,470 L161,470 L161,590 L159,590 Z', 0),
      VASTO_MED,
      M(['Psoas mayor', 'Ilíaco'], 20, 'M160,444 C166,440 176,442 182,450 C178,462 174,474 168,486 C164,474 162,460 160,444 Z', 'Iliopsoas (psoas mayor + ilíaco)'),
      PECTINEO,
      M('Aductor largo', 30, 'M195,465 C197,472 197,480 195,488 C188,506 182,522 176,540 C172,524 172,508 176,494 C182,484 190,474 195,465 Z'),
      GRACIL,
      M('Sartorio', -25, 'M143,406 L151,403 C164,460 180,530 190,598 C191,616 188,632 184,642 L177,638 C180,622 181,610 180,598 C172,540 158,470 143,406 Z'),
      ROTULA, LIG_ROT,
      M('Peroneo largo', 0, 'M138,660 C132,695 134,740 144,800 L149,800 C142,745 140,700 143,664 Z'),
      EXT_DEDOS, TIBIAL_ANT, EXT_GORDO, TIBIA, GASTRO_MED, SOLEO_MED,
      PIE, ...TENDONES_PIE
    ],
    prof: [
      ECM, INFRAHIOIDEOS, ESCALENOS, TRAP_FRENTE,
      M('Intercostales int. y ext.', -45, 'M194,182 C170,180 150,186 138,200 C132,230 134,270 140,300 C160,300 180,300 194,302 Z'),
      ...[196, 218, 240, 262, 284].map(y => B(`M194,${y} C172,${y - 4} 152,${y + 2} 136,${y + 14} L137,${y + 20} C152,${y + 8} 172,${y + 2} 194,${y + 6} Z`, 'Costilla')),
      M('Serrato anterior', 60, [214, 234, 254, 274, 294].map(y =>
        `M136,${y} C146,${y - 2} 156,${y + 2} 162,${y + 10} C156,${y + 15} 146,${y + 14} 136,${y + 12} Z`).join(' ')),
      M('Pectoral menor', 60, 'M130,198 C140,200 156,214 172,232 C174,246 174,256 174,264 C160,252 146,232 128,208 Z'),
      CLAVICULA,
      H('Subescapular (rot. medial)', 'M126,196 C136,206 144,224 148,246 C140,250 130,246 124,236 C120,222 120,208 126,196 Z', 'Subescapular (cara anterior de la escápula, detrás de las costillas)'),
      H('Diafragma', 'M142,300 C150,262 176,250 196,258 L196,300 C180,294 160,294 142,300 Z', 'Diafragma (cúpula detrás de las costillas)'),
      B(circ(114, 190, 15), 'Cabeza del húmero'),
      M('Tríceps braquial', 0, 'M84,206 C80,240 80,280 86,344 L93,342 C90,300 92,250 100,204 Z', 'Tríceps braquial (cabeza lateral)'),
      N('Deltoides (cortado)', 5, 'M100,176 C92,182 86,194 84,210 L100,206 C102,196 104,186 108,178 Z'),
      M('Coracobraquial', 10, 'M112,204 C122,228 124,256 118,282 L104,280 C108,256 106,228 100,206 Z'),
      M('Braquial', 3, 'M93,268 C86,300 88,332 96,350 L112,350 C118,330 120,300 116,270 C108,264 100,264 93,268 Z'),
      TRICEPS_MED, FLEXORES, BRAQUIORRADIAL, MANO, DEDOS,
      M('Oblicuo interno', 45, 'M140,300 C136,330 138,365 144,396 L162,392 C158,370 156,340 160,304 Z'),
      M('Transverso del abdomen', 90, 'M196,302 C182,300 170,302 160,304 C156,340 158,370 162,392 C176,392 186,392 196,392 Z'),
      B('M140,392 C152,386 166,388 176,396 L174,401 C164,394 152,392 142,398 Z', 'Cresta ilíaca'),
      M('Ilíaco', 20, 'M146,399 C144,420 150,440 160,458 L168,454 C168,436 170,416 173,399 Z'),
      M('Psoas mayor', 10, 'M188,392 C186,412 180,432 172,452 L166,468 C162,458 164,438 175,398 Z'),
      H('Suelo pélvico', 'M170,440 C178,462 190,466 196,466 L196,452 C188,452 178,448 170,440 Z', 'Suelo pélvico (cierra la pelvis por abajo)'),
      GLUTEO_MEDIO_F, TFL, CINTILLA, VASTO_LAT,
      M('Vasto intermedio', 0, 'M154,470 C150,520 150,570 156,606 L168,606 C172,570 172,520 168,470 Z'),
      VASTO_MED, PECTINEO,
      H('Obturador externo', 'M176,444 C182,442 190,444 194,450 C188,456 182,458 176,456 Z', 'Obturador externo (profundo, bajo el pectíneo)'),
      M('Aductor corto', 30, 'M182,458 C188,464 192,472 194,482 C188,496 182,508 176,518 C174,502 176,478 182,458 Z'),
      M('Aductor mayor', 15, 'M195,484 C198,522 194,572 186,614 L176,606 C180,572 180,542 178,520 C184,508 190,496 195,484 Z'),
      GRACIL, ROTULA, LIG_ROT,
      M('Peroneo largo', 0, 'M138,660 C133,690 134,715 138,735 L143,735 C141,712 141,690 143,664 Z'),
      M('Peroneo corto', 0, 'M139,736 C138,764 142,790 148,810 L152,808 C147,788 145,762 144,736 Z'),
      EXT_DEDOS, TIBIAL_ANT, EXT_GORDO,
      M('Peroneo anterior', 0, 'M150,770 C152,790 154,806 156,818 L160,817 C158,804 156,788 154,770 Z', 'Peroneo anterior (tercer peroneo)'),
      H('Tibial posterior', 'M166,690 C164,730 166,780 172,815 L176,814 C172,780 170,730 172,690 Z', 'Tibial posterior (detrás de la tibia)'),
      TIBIA, GASTRO_MED, SOLEO_MED,
      PIE, ...TENDONES_PIE
    ],
    centro: [
      CABEZA, OREJAS,
      B('M194,172 L206,172 L206,284 L200,292 L194,284 Z', 'Esternón'),
      T('M196,286 L204,286 L204,458 L196,458 Z', 0, 'Línea alba'),
      B(circ(200, 460, 5), 'Sínfisis del pubis')
    ]
  };

  /* ---------- vista posterior ---------- */
  const TRICEPS_POST = M('Tríceps braquial', 0, 'M86,232 C80,268 84,310 94,346 L114,346 C122,306 124,268 120,240 C112,252 96,250 86,232 Z');
  const TEND_TRICEPS = T('M94,300 C98,302 106,302 114,298 C114,318 112,334 110,346 L100,346 C98,332 96,316 94,300 Z', 0, 'Tendón del tríceps');
  const BRAQUIORRAD_P = M('Braquiorradial', -5, 'M82,320 C72,350 68,400 70,468 L78,468 C78,420 84,372 92,346 Z');
  const EXTENSORES = N('Extensores del antebrazo', -8, 'M92,346 C104,350 114,358 116,368 C110,406 100,440 95,468 L78,468 C78,420 84,372 92,346 Z');
  const ANCONEO = N('Ancóneo', 40, 'M100,344 C106,348 112,354 114,362 L106,366 C104,358 102,350 100,344 Z');
  const PERONEO_P = M('Peroneo largo', 0, 'M136,684 C130,720 134,770 144,812 L150,810 C142,770 140,724 142,690 Z');
  const AQUILES = T('M159,774 L171,774 L168,832 L162,832 Z', 0, 'Tendón de Aquiles');
  const VASTO_LAT_P = M('Vasto lateral', -10, 'M130,486 C124,530 128,580 140,616 L146,612 C138,580 136,530 140,500 Z');
  const CINTILLA_P = T('M124,470 C120,520 124,570 136,616 L141,614 C132,570 128,520 130,480 Z', 0, 'Tracto iliotibial');
  const OBLICUO_P = M('Oblicuo externo', -45, 'M136,330 C136,350 138,372 142,394 L149,394 C145,372 143,350 143,332 Z');

  const ESPALDA = {
    sup: [
      M('Infraespinoso (rot. lateral)', -60, 'M126,214 C136,210 150,214 158,226 C162,240 162,252 160,262 C148,262 136,256 126,246 C122,234 122,222 126,214 Z'),
      M('Redondo menor (rot. lateral)', -70, 'M124,248 C134,258 146,264 158,266 L154,274 C142,272 130,266 120,258 Z'),
      N('Redondo mayor', -70, 'M120,262 C132,272 146,276 158,274 L160,284 C146,288 130,284 122,276 Z'),
      M('Dorsal ancho', -40, 'M122,272 C130,284 148,290 160,288 C174,300 188,316 196,326 L196,380 C178,386 160,392 146,396 C140,370 138,340 136,310 C132,295 128,282 122,272 Z'),
      T('M196,334 C184,346 168,366 150,392 C170,400 184,406 196,410 Z', -40, 'Fascia toracolumbar'),
      OBLICUO_P,
      M(['Trapecio superior, medio e inferior', 'Trapecio superior'], 80,
        'M196,100 C190,120 184,136 176,148 C160,160 136,166 112,172 L118,186 C136,190 150,200 158,222 C170,262 184,300 196,334 Z', 'Trapecio'),
      T('M196,150 C190,160 186,170 186,182 C190,190 194,194 196,196 Z', 0, 'Aponeurosis del trapecio'),
      M('Deltoides', 5, 'M112,172 C98,178 86,196 84,222 C84,242 92,262 103,280 C110,258 118,236 126,214 C124,200 120,188 116,180 Z'),
      TRICEPS_POST, TEND_TRICEPS, EXTENSORES, BRAQUIORRAD_P, ANCONEO, MANO, DEDOS,
      M('Glúteo medio', 20, 'M146,396 C130,402 120,418 118,440 L128,446 C138,428 154,414 176,408 C166,400 156,396 146,396 Z'),
      M('Glúteo mayor', 45, 'M196,412 C178,408 156,414 142,428 C128,444 122,466 126,490 C140,506 160,512 178,506 C188,500 194,488 196,474 Z'),
      CINTILLA_P, VASTO_LAT_P,
      M('Aductor mayor', 20, 'M180,500 C188,512 194,530 194,552 L186,556 C182,538 178,520 176,506 Z'),
      M('Bíceps femoral', 10, 'M148,504 C140,540 140,590 148,630 L158,630 C158,590 160,548 166,508 Z'),
      M('Semimembranoso', 0, 'M184,540 C192,570 194,600 190,634 L184,634 C186,600 184,570 180,546 Z'),
      M('Semitendinoso', -5, 'M168,508 C172,550 178,592 182,632 L188,630 C188,590 184,548 178,506 Z'),
      PERONEO_P,
      M('Sóleo (rodilla flexionada)', 0, 'M138,720 C138,760 146,790 156,806 L172,806 C180,790 188,764 190,730 C184,750 176,760 168,760 C160,760 144,750 138,720 Z'),
      AQUILES,
      M('Gastrocnemio (rodilla extendida)', 0, 'M150,642 C138,660 134,700 144,738 C150,752 158,758 164,756 L164,652 C160,645 156,642 150,642 Z M168,646 C176,642 186,650 190,670 C196,700 192,735 180,760 C174,766 168,764 166,758 L166,652 Z'),
      T('M146,742 C154,758 162,764 172,766 C176,766 179,764 181,760 L171,792 L161,792 Z', 0, 'Aponeurosis del gastrocnemio'),
      PIE
    ],
    prof: [
      N('Esplenio', 30, 'M196,102 C190,112 186,124 184,136 L196,150 Z'),
      M('Elevador de la escápula', 25, 'M184,112 L192,116 C186,146 172,172 164,192 L156,188 C166,162 178,138 184,112 Z'),
      M('Serrato posterior sup. e inf.', 60, 'M196,176 L196,206 C184,208 172,212 162,216 L160,204 C172,196 184,186 196,176 Z', 'Serrato posterior superior'),
      M('Iliocostal', 0, 'M160,276 C157,320 158,362 164,404 L176,410 C175,370 175,322 176,276 Z'),
      M('Erectores de la espina', 0, 'M176,232 C176,300 178,360 180,412 L189,414 C189,360 189,300 189,232 Z', 'Longísimo (erector de la espina)'),
      M('Espinal', 0, 'M189,210 C189,260 190,300 191,344 L197,344 L197,210 Z'),
      M('Multífidos', -20, 'M186,372 C186,396 188,420 192,444 L197,444 L197,372 Z'),
      M('Cuadrado lumbar', 10, 'M146,344 C144,364 144,382 148,398 L164,400 C162,380 162,362 164,344 Z'),
      B('M162,186 L164,274 C150,264 134,244 124,214 C132,202 146,192 162,186 Z', 'Escápula'),
      B(circ(116, 196, 10), 'Cabeza del húmero'),
      M('Supraespinoso (ABD)', 80, 'M162,186 C148,184 134,186 122,188 C116,192 116,200 120,204 C134,202 148,202 162,206 Z'),
      B('M162,203 C146,201 128,194 110,180 L108,186 C126,200 146,208 162,209 Z', 'Espina de la escápula'),
      M('Infraespinoso (rot. lateral)', -60, 'M162,210 L164,262 C150,258 136,246 126,230 C122,220 124,212 128,208 C142,210 152,210 162,210 Z'),
      M('Redondo menor (rot. lateral)', -70, 'M126,232 C134,246 146,258 158,266 L154,274 C140,268 128,256 120,244 Z'),
      M('Romboides', 60, 'M196,200 L196,276 L164,272 L161,210 Z'),
      TRICEPS_POST, TEND_TRICEPS, EXTENSORES, BRAQUIORRAD_P, ANCONEO, MANO, DEDOS,
      B('M144,398 C156,392 176,392 190,400 L188,406 C176,398 158,398 146,404 Z', 'Cresta ilíaca'),
      M('Glúteo menor', 20, 'M150,404 C136,410 126,426 126,446 L134,448 C146,432 162,420 180,414 C172,406 162,404 150,404 Z'),
      M('Piriforme', 80, 'M190,428 C170,428 150,436 132,448 L134,456 C152,448 170,444 190,442 Z'),
      M('Gemelos sup. e inf.', 90, 'M188,447 C170,449 152,453 134,459 L134,462 C152,457 170,453 188,451 Z'),
      M('Obturador interno', 90, 'M188,452 C170,454 152,458 134,463 L134,467 C152,462 170,458 188,457 Z', 'Obturador interno (tendón)'),
      M('Gemelos sup. e inf.', 90, 'M188,458 C170,460 152,464 134,468 L134,471 C152,467 170,463 188,462 Z'),
      M('Cuadrado femoral', 90, 'M184,476 C168,476 152,478 138,482 L138,494 C152,490 168,490 184,490 Z'),
      H('Obturador externo', 'M184,468 C170,470 156,472 142,474 L142,478 C156,476 170,474 184,472 Z', 'Obturador externo (bajo el cuadrado femoral)'),
      B(circ(128, 462, 9), 'Trocánter mayor'),
      CINTILLA_P, VASTO_LAT_P,
      M('Aductor mayor', 15, 'M186,494 C194,530 192,570 182,600 L170,590 C174,560 174,524 170,500 Z'),
      M('Semimembranoso', 0, 'M166,540 C168,576 176,606 184,630 L176,632 C168,606 160,576 158,546 Z'),
      M('Bíceps femoral', 10, 'M146,502 C138,540 140,590 148,630 L156,630 C154,590 156,548 160,506 Z', 'Bíceps femoral (cabezas larga y corta)'),
      N('Poplíteo', 60, 'M150,650 C160,646 172,650 180,660 L178,668 C168,662 156,660 150,660 Z'),
      PERONEO_P,
      M('Peroneo corto', 0, 'M140,760 C140,784 144,800 148,812 L152,810 C148,796 146,780 146,762 Z'),
      M('Sóleo (rodilla flexionada)', 0, 'M140,668 C134,706 138,760 154,800 L172,800 C186,760 190,706 184,668 C172,676 152,676 140,668 Z'),
      H('Tibial posterior', 'M160,700 C158,740 162,780 168,814 L174,812 C170,780 168,740 168,700 Z', 'Tibial posterior (bajo el sóleo)'),
      AQUILES, PIE
    ],
    centro: [
      CABEZA, OREJAS,
      ...Array.from({ length: 17 }, (_, i) => { const y = 148 + i * 15; return B(`M200,${y} C203,${y} 203.5,${y + 2} 203,${y + 5} C202.5,${y + 7} 197.5,${y + 7} 197,${y + 5} C196.5,${y + 2} 197,${y} 200,${y} Z`, 'Apófisis espinosa'); }),
      B('M188,408 L212,408 L207,452 L200,462 L193,452 Z', 'Sacro')
    ]
  };

  const VISTAS = { frente: FRENTE, espalda: ESPALDA };

  /* región(es) de cada forma, deducida de los nombres de REGIONES */
  const regionesDe = nombres => REGIONES.filter(r => r.grupos.some(g => g.m.some(x => nombres.includes(x)))).map(r => r.id);

  /* índice: cada forma recibe un id estable por vista */
  const FORMAS = {};
  for (const [v, capas] of Object.entries(VISTAS)) {
    FORMAS[v] = [];
    for (const capa of ['sup', 'prof', 'centro']) capas[capa].forEach(f => {
      FORMAS[v].push({ ...f, capa, id: `${v[0]}${FORMAS[v].length}`, r: f.m ? regionesDe(f.m) : [], nom: f.n || (f.m && f.m[0]) || '' });
    });
  }

  /* ---------- dibujo ---------- */
  const PAL = {
    m: ['#6e1a15', '#b5463b', '#d8705f'], n: ['#661d18', '#a54339', '#c7685a'],
    t: ['#9c8866', '#d6c7a8', '#e6dac0'], b: ['#bcaa86', '#ece1c8', '#faf4e6'],
    g: ['#6b4a45', '#a47e76', '#b99088'], h: ['#b5463b', '#b5463b', '#b5463b']
  };
  const refId = (v, f) => `${v}_${f.k}${String(f.a).replace('-', 'n')}`;
  function defs(v) {
    const angs = new Set();
    FORMAS[v].forEach(f => angs.add(`${f.k}|${f.a}`));
    let s = '';
    for (const ka of angs) {
      const [k, a] = ka.split('|'), c = PAL[k], id = refId(v, { k, a });
      s += `<linearGradient id="g_${id}" gradientTransform="rotate(${a} .5 .5)">
        <stop offset="0" stop-color="${c[0]}"/><stop offset=".45" stop-color="${c[2]}"/><stop offset=".6" stop-color="${c[1]}"/><stop offset="1" stop-color="${c[0]}"/></linearGradient>`;
      if (k === 'm' || k === 'n' || k === 't')
        s += `<pattern id="p_${id}" width="3.2" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(${a})">
          <line x1="0" y1="0" x2="0" y2="6" stroke="${k === 't' ? 'rgba(140,115,80,.4)' : 'rgba(45,5,3,.32)'}" stroke-width="${k === 't' ? .6 : .9}"/></pattern>`;
    }
    s += `<radialGradient id="luz_${v}" cx=".38" cy=".3" r=".8"><stop offset="0" stop-color="#fff" stop-opacity=".16"/><stop offset="1" stop-color="#000" stop-opacity=".22"/></radialGradient>`;
    return s;
  }
  function forma(v, f) {
    const id = refId(v, f), tex = (f.k === 'm' || f.k === 'n' || f.k === 't') ? `<path d="${f.d}" fill="url(#p_${id})" class="tex"/>` : '';
    const toca = f.k === 'm' || f.k === 'n' || f.k === 'h';
    return `<g class="f k-${f.k}" data-id="${f.id}"${toca ? ` data-toca="1"` : ''}><path d="${f.d}" fill="url(#g_${id})" class="piel"/>${tex}</g>`;
  }
  const ESPEJO = 'matrix(-1 0 0 1 400 0)';
  function svg(v) {
    const fs = FORMAS[v];
    const capa = c => fs.filter(f => f.capa === c).map(f => forma(v, f)).join('');
    return `<svg viewBox="0 0 400 890" class="lamina" role="img" aria-label="Lámina muscular, vista ${v === 'frente' ? 'anterior' : 'posterior'}">
      <defs>${defs(v)}
        <clipPath id="sil_${v}"><path d="${SIL}"/><path d="${SIL}" transform="${ESPEJO}"/></clipPath>
        <filter id="sombra_${v}" x="-10%" y="-5%" width="120%" height="110%"><feDropShadow dx="0" dy="4" stdDeviation="5" flood-opacity=".35"/></filter>
      </defs>
      <g filter="url(#sombra_${v})"><path d="${SIL}" class="sil-base"/><path d="${SIL}" transform="${ESPEJO}" class="sil-base"/></g>
      <g clip-path="url(#sil_${v})">
        <rect x="0" y="0" width="400" height="890" fill="url(#p_${v}_m0)" pointer-events="none"/>
        <g class="capa sup">${capa('sup')}</g>
        <g class="capa prof" transform="${ESPEJO}">${capa('prof')}</g>
        <g class="capa centro">${capa('centro')}</g>
        <rect x="0" y="0" width="400" height="890" fill="url(#luz_${v})" pointer-events="none"/>
      </g>
      <path d="${SIL_ABIERTA}" class="sil-borde"/><path d="${SIL_ABIERTA}" transform="${ESPEJO}" class="sil-borde"/>
      <text x="${v === 'frente' ? 60 : 60}" y="884" class="lam-rot">superficial</text>
      <text x="340" y="884" class="lam-rot" text-anchor="end">profundo</text>
    </svg>`;
  }

  const buscar = (v, id) => FORMAS[v].find(f => f.id === id);
  const conNombre = nom => Object.entries(FORMAS).flatMap(([v, fs]) => fs.filter(f => f.m && f.m.includes(nom)).map(f => ({ v, f })));
  return { svg, buscar, conNombre, FORMAS };
})();
