/* ============================================================
   AnatoApp — música, sonidos y efectos visuales

   Todo el audio se sintetiza en el navegador (Web Audio API): no
   hay archivos de música, funciona sin internet, no agranda la app
   y no hay derechos de terceros.

   Decisiones de diseño:
     · Música instrumental, sin letra y a volumen bajo: el habla y la
       letra compiten con la memoria de trabajo mientras se estudia.
       Es opcional y se apaga con un toque (🎵).
     · La música baja sola cuando suena una retroalimentación, para
       que el acierto o el error se escuchen claros.
     · El sonido de error es suave, nunca punitivo: equivocarse es
       parte del aprendizaje.
     · Los efectos visuales duran menos de un segundo y no tapan el
       contenido. Con "movimiento reducido" del sistema, o el ajuste
       "Suaves", se desactivan partículas, sacudidas y confeti.
   ============================================================ */
'use strict';

const midi = m => 440 * Math.pow(2, (m - 69) / 12);

/* ---------------- motor de audio ---------------- */

const AUD = (() => {
  let ctx = null, comp, busM, busS, rev, ruidoBuf;

  function impulso(seg, caida) {
    const len = Math.floor(ctx.sampleRate * seg), b = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = b.getChannelData(ch);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, caida);
    }
    return b;
  }

  function iniciar() {
    /* iOS usa además el estado 'interrupted' (llamada, pantalla bloqueada) */
    if (ctx) { if (ctx.state !== 'running') ctx.resume().catch(() => {}); return ctx; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try { ctx = new AC(); } catch (e) { return null; }
    comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16; comp.ratio.value = 3; comp.attack.value = 0.01; comp.release.value = 0.2;
    comp.connect(ctx.destination);
    const master = ctx.createGain(); master.gain.value = 2.5;
    master.connect(comp);
    busM = ctx.createGain(); busS = ctx.createGain();
    busM.connect(master); busS.connect(master);
    rev = ctx.createConvolver(); rev.buffer = impulso(2.6, 2.4);
    const salidaRev = ctx.createGain(); salidaRev.gain.value = 0.32;
    rev.connect(salidaRev); salidaRev.connect(master);
    ruidoBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = ruidoBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    volumenes();
    return ctx;
  }

  const volMusica = () => (S.cfg.musica ? S.cfg.volMusica * 0.8 : 0);
  function volumenes() {
    if (!ctx) return;
    const t = ctx.currentTime;
    busM.gain.cancelScheduledValues(t); busM.gain.setTargetAtTime(volMusica(), t, 0.08);
    busS.gain.cancelScheduledValues(t); busS.gain.setTargetAtTime(S.cfg.sonido ? S.cfg.volSonido : 0, t, 0.02);
  }
  /* "ducking": la música baja un momento para que la retroalimentación se escuche */
  function agachar(seg = 0.9) {
    if (!ctx || !S.cfg.musica) return;
    const g = busM.gain, t = ctx.currentTime, v = volMusica();
    g.cancelScheduledValues(t);
    g.setValueAtTime(g.value, t);
    g.linearRampToValueAtTime(v * 0.35, t + 0.05);
    g.linearRampToValueAtTime(v, t + seg);
  }

  /* un oscilador con envolvente */
  function voz({ f, t, dur, tipo = 'sine', vol = 0.2, ataque = 0.005, bus, reverb = 0, filtro, glide, detune = 0, pan = 0 }) {
    if (!ctx) return;
    t = Math.max(t, ctx.currentTime);
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = tipo; o.frequency.setValueAtTime(f, t); o.detune.value = detune;
    if (glide) o.frequency.exponentialRampToValueAtTime(glide, t + dur * 0.9);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t + ataque);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    let n = o;
    if (filtro) { const fl = ctx.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = filtro; o.connect(fl); n = fl; }
    if (pan && ctx.createStereoPanner) { const p = ctx.createStereoPanner(); p.pan.value = pan; n.connect(p); n = p; }
    n.connect(g); g.connect(bus || busS);
    if (reverb) { const s = ctx.createGain(); s.gain.value = reverb; g.connect(s); s.connect(rev); }
    o.start(t); o.stop(t + dur + 0.05);
  }
  /* un golpe de ruido filtrado (percusión, brisa, crujido) */
  function ruido({ t, dur, vol = 0.1, bus, pasaAltos = 0, pasaBanda = 0, pasaBajos = 0, reverb = 0, barrido }) {
    if (!ctx) return;
    t = Math.max(t, ctx.currentTime);
    const s = ctx.createBufferSource(), g = ctx.createGain();
    s.buffer = ruidoBuf; s.loop = true;
    let n = s;
    const filtro = (tipo, f) => { const fl = ctx.createBiquadFilter(); fl.type = tipo; fl.frequency.value = f; n.connect(fl); n = fl; return fl; };
    if (pasaAltos) filtro('highpass', pasaAltos);
    if (pasaBanda) { const fl = filtro('bandpass', pasaBanda); fl.Q.value = 1.2; if (barrido) fl.frequency.exponentialRampToValueAtTime(barrido, t + dur); }
    if (pasaBajos) filtro('lowpass', pasaBajos);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    n.connect(g); g.connect(bus || busS);
    if (reverb) { const r = ctx.createGain(); r.gain.value = reverb; g.connect(r); r.connect(rev); }
    s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.05);
  }

  return { iniciar, volumenes, agachar, voz, ruido,
    get ctx() { return ctx; }, get busM() { return busM; }, get busS() { return busS; } };
})();

/* ---------------- efectos de sonido ---------------- */

function sonar(fn) {
  if (!S.cfg.sonido) return;
  const c = AUD.iniciar();
  if (!c) return;
  try { fn(c.currentTime + 0.01); } catch (e) {}
}
const { voz, ruido } = AUD;

const SND = {
  toque: () => sonar(t => voz({ f: 1100, glide: 850, t, dur: 0.05, vol: 0.09 })),
  agarrar: () => sonar(t => voz({ f: 480, glide: 760, t, dur: 0.08, vol: 0.07, tipo: 'triangle' })),
  soltar: () => sonar(t => { voz({ f: 760, glide: 430, t, dur: 0.09, vol: 0.08, tipo: 'triangle' }); ruido({ t, dur: 0.03, vol: 0.02, pasaAltos: 3000 }); }),
  /* el acierto sube de tono con el combo: la racha se escucha */
  bien: (combo = 1) => sonar(t => {
    AUD.agachar();
    const base = 72 + Math.min(12, Math.max(0, combo - 1));
    [0, 4, 7, 12].forEach((iv, i) => {
      voz({ f: midi(base + iv), t: t + i * 0.055, dur: 0.55, vol: 0.09, tipo: 'triangle', reverb: 0.35, pan: (i - 1.5) * 0.2 });
      voz({ f: midi(base + iv + 12), t: t + i * 0.055, dur: 0.35, vol: 0.03, reverb: 0.4 });
    });
  }),
  /* error: grave y corto, sin estridencia */
  mal: () => sonar(t => {
    AUD.agachar(1.1);
    voz({ f: 233, glide: 175, t, dur: 0.26, vol: 0.12, tipo: 'triangle', filtro: 900 });
    voz({ f: 175, glide: 140, t: t + 0.12, dur: 0.3, vol: 0.09, tipo: 'sine' });
  }),
  par: () => sonar(t => { voz({ f: midi(79), t, dur: 0.18, vol: 0.07, tipo: 'triangle', reverb: 0.3 }); voz({ f: midi(84), t: t + 0.07, dur: 0.3, vol: 0.07, tipo: 'triangle', reverb: 0.3 }); }),
  parMal: () => sonar(t => voz({ f: 200, glide: 160, t, dur: 0.16, vol: 0.08, tipo: 'triangle', filtro: 800 })),
  flip: () => sonar(t => { ruido({ t, dur: 0.22, vol: 0.3, pasaBanda: 600, barrido: 3500 }); voz({ f: 520, glide: 780, t: t + 0.08, dur: 0.14, vol: 0.04, tipo: 'triangle' }); }),
  abrir: () => sonar(t => ruido({ t, dur: 0.18, vol: 0.15, pasaBanda: 1200, barrido: 2400 })),
  xp: () => sonar(t => { voz({ f: midi(88), t, dur: 0.08, vol: 0.04, tipo: 'square', filtro: 3000 }); voz({ f: midi(95), t: t + 0.06, dur: 0.18, vol: 0.04, tipo: 'square', filtro: 3000 }); }),
  combo: n => sonar(t => {
    AUD.agachar(1.4);
    const escala = [72, 74, 76, 79, 81, 84, 86, 88];
    escala.forEach((m, i) => voz({ f: midi(m + Math.min(7, n / 5)), t: t + i * 0.045, dur: 0.3, vol: 0.05, tipo: 'triangle', reverb: 0.4 }));
    ruido({ t, dur: 0.5, vol: 0.03, pasaBanda: 2000, barrido: 8000, reverb: 0.3 });
  }),
  fin: () => sonar(t => {
    AUD.agachar(2.4);
    [72, 76, 79, 84].forEach((m, i) => voz({ f: midi(m), t: t + i * 0.11, dur: 0.5, vol: 0.09, tipo: 'triangle', reverb: 0.4 }));
    [60, 64, 67, 72, 76].forEach(m => voz({ f: midi(m), t: t + 0.45, dur: 1.6, vol: 0.05, tipo: 'sine', ataque: 0.05, reverb: 0.5 }));
  }),
  logro: () => sonar(t => {
    AUD.agachar(1.6);
    [84, 88, 91, 96, 100].forEach((m, i) => voz({ f: midi(m), t: t + i * 0.06, dur: 0.6, vol: 0.05, reverb: 0.6, pan: (i - 2) * 0.25 }));
    ruido({ t, dur: 0.7, vol: 0.02, pasaAltos: 6000, reverb: 0.5 });
  }),
  nivel: () => sonar(t => {
    AUD.agachar(2.8);
    [[60, 0], [64, 0.14], [67, 0.28], [72, 0.42], [76, 0.62], [79, 0.62], [84, 0.62]].forEach(([m, d]) =>
      voz({ f: midi(m), t: t + d, dur: d > 0.5 ? 1.6 : 0.3, vol: 0.07, tipo: 'sawtooth', filtro: 2200, reverb: 0.45 }));
    ruido({ t: t + 0.62, dur: 1.2, vol: 0.03, pasaAltos: 5000, reverb: 0.6 });
  }),
  tic: (k = 0) => sonar(t => voz({ f: 900 + 700 * k, t, dur: 0.035, vol: 0.025, tipo: 'square', filtro: 2500 })),
  racha: () => sonar(t => {
    ruido({ t, dur: 0.45, vol: 0.06, pasaBanda: 300, barrido: 3000 });
    [67, 71, 74].forEach((m, i) => voz({ f: midi(m), t: t + 0.15 + i * 0.06, dur: 0.4, vol: 0.05, tipo: 'triangle', reverb: 0.3 }));
  })
};

/* El navegador solo permite vibrar después de un toque real. */
const vibrar = p => {
  try {
    const ua = navigator.userActivation;
    if (S.cfg.vibracion && navigator.vibrate && (!ua || ua.hasBeenActive)) navigator.vibrate(p);
  } catch (e) {}
};

/* ---------------- música generativa ----------------
   Secuenciador de semicorcheas con programación anticipada: las notas
   se agendan en el reloj del audio, no en el de JavaScript, para que el
   ritmo no tropiece. Cada vuelta improvisa una melodía distinta. */

const ESTILOS = {
  calma: {
    nom: 'Calma', bpm: 66,
    prog: [[53, 57, 60, 64], [52, 55, 59, 62], [50, 53, 57, 60], [48, 52, 55, 59]],   // Fmaj7 Em7 Dm7 Cmaj7
    escala: [72, 74, 76, 79, 81, 84]
  },
  lofi: {
    nom: 'Lo-fi', bpm: 76, swing: 0.14,
    prog: [[50, 53, 57, 60], [55, 59, 62, 65], [48, 52, 55, 59], [57, 60, 64, 67]],   // Dm7 G7 Cmaj7 Am7
    escala: [69, 72, 74, 76, 79, 81]
  },
  energia: {
    nom: 'Energía', bpm: 108,
    prog: [[55, 59, 62], [62, 66, 69], [64, 67, 71], [60, 64, 67]],                    // G D Em C
    escala: [74, 76, 78, 79, 81, 83, 86]
  }
};

const MUSICA = (() => {
  let activa = false, reloj = null, paso = 0, compas = 0, proximo = 0;
  const bus = () => AUD.busM;
  const prob = p => Math.random() < p;

  function pad(notas, t, dur, vol = 0.028) {
    notas.forEach(m => [-7, 7].forEach(dt =>
      voz({ f: midi(m), t, dur, vol, tipo: 'sawtooth', ataque: dur * 0.3, filtro: 750, detune: dt, bus: bus(), reverb: 0.5 })));
  }
  function bajo(m, t, dur, vol = 0.13, tipo = 'triangle') { voz({ f: midi(m), t, dur, vol, tipo, filtro: 420, bus: bus() }); }
  function bombo(t, vol = 0.32) { voz({ f: 120, glide: 42, t, dur: 0.22, vol, bus: bus() }); }
  function caja(t, vol = 0.06) { ruido({ t, dur: 0.14, vol, pasaBanda: 1800, bus: bus(), reverb: 0.15 }); }
  function platillo(t, vol = 0.025) { ruido({ t, dur: 0.04, vol, pasaAltos: 7500, bus: bus() }); }
  function campana(m, t, vol = 0.05, dur = 1.3) {
    voz({ f: midi(m), t, dur, vol, bus: bus(), reverb: 0.7 });
    voz({ f: midi(m + 12), t, dur: dur * 0.5, vol: vol * 0.25, bus: bus(), reverb: 0.7 });
  }
  function melodia(e, acorde) {
    /* prefiere notas del acorde: suena consonante sin repetirse */
    const delAcorde = e.escala.filter(m => acorde.some(a => (a - m) % 12 === 0));
    return prob(0.6) && delAcorde.length ? azar(delAcorde) : azar(e.escala);
  }

  function tocar(e, p, t, s16) {
    const acorde = e.prog[compas % e.prog.length], raiz = acorde[0];
    if (e === ESTILOS.calma) {
      if (p === 0) { pad(acorde, t, s16 * 17); bajo(raiz - 12, t, s16 * 16, 0.1, 'sine'); }
      if ((p === 0 || p === 6 || p === 10) && prob(0.55)) campana(melodia(e, acorde), t, 0.045);
      if (p === 12 && prob(0.25)) campana(melodia(e, acorde) + 12, t, 0.025, 2);
    } else if (e === ESTILOS.lofi) {
      if (p === 0 || p === 7) acorde.forEach((m, i) =>
        voz({ f: midi(m + 12), t: t + i * 0.014, dur: 0.9, vol: 0.035, tipo: 'triangle', filtro: 1700, bus: bus(), reverb: 0.25 }));
      if (p === 0 || p === 8 || (p === 6 && prob(0.5)) || (p === 11 && prob(0.4))) bajo(raiz - 12, t, s16 * 2.5, 0.14);
      if (p === 0 || p === 8 || (p === 10 && prob(0.3))) bombo(t, 0.28);
      if (p === 4 || p === 12) caja(t, 0.05);
      if (p % 2 === 0) platillo(t, p % 4 === 2 ? 0.022 : 0.014);
      if ((p === 2 || p === 14) && prob(0.35)) campana(melodia(e, acorde), t, 0.03, 0.9);
      if (prob(0.3)) ruido({ t, dur: 0.012, vol: 0.012, pasaAltos: 3500, bus: bus() });   // crujido de vinilo
    } else {
      const arp = [...acorde, acorde[0] + 12];
      voz({ f: midi(arp[p % arp.length] + 12), t, dur: s16 * 0.9, vol: 0.028, tipo: 'square', filtro: 2400, bus: bus(), reverb: 0.15 });
      if (p % 4 === 0) bombo(t, 0.3);
      if (p === 4 || p === 12) caja(t, 0.06);
      if (p % 4 === 2) platillo(t, 0.028);
      if (p % 2 === 0) bajo(raiz - 12, t, s16 * 1.6, 0.09, 'sawtooth');
      if (p === 0) pad(acorde, t, s16 * 16, 0.015);
    }
  }

  function programar() {
    const c = AUD.ctx;
    if (!activa || !c) return;
    const e = ESTILOS[S.cfg.estiloMusica] || ESTILOS.lofi;
    const s16 = 60 / e.bpm / 4;
    while (proximo < c.currentTime + 0.3) {
      try { tocar(e, paso, proximo, s16); } catch (x) {}
      let dur = s16;
      if (e.swing) dur *= paso % 2 === 0 ? 1 + e.swing : 1 - e.swing;
      proximo += dur;
      paso = (paso + 1) % 16;
      if (paso === 0) compas++;
    }
  }
  function iniciar() {
    if (activa || !S.cfg.musica || document.hidden) return;
    const c = AUD.iniciar();
    if (!c) return;
    activa = true; paso = 0; compas = 0;
    proximo = c.currentTime + 0.15;
    programar();
    reloj = setInterval(programar, 60);
    AUD.volumenes();
  }
  function detener() { activa = false; clearInterval(reloj); reloj = null; }
  function reiniciar() { detener(); iniciar(); }
  return { iniciar, detener, reiniciar, get activa() { return activa; } };
})();

/* ---------------- desbloqueo del audio (sobre todo iPhone) ----------------
   · Safari solo habilita el audio en eventos que cuentan como "gesto":
     al LEVANTAR el dedo (touchend / pointerup / click), no al apoyarlo.
     El desbloqueo reproduce un sonido vacío dentro de ese gesto.
   · En iOS el audio web respeta el interruptor de silencio del costado,
     aunque el volumen esté alto. Declarar la sesión como "playback"
     (lo que hace un reproductor de música) hace que suene igual, pero
     WebKit ignora ese ajuste dentro de un iframe sin permiso de micrófono,
     como la versión web publicada en claude.ai. Por eso en iPhone y iPad
     también suena siempre un <audio> en silencio y en bucle, que pasa el
     audio al canal de reproducción. Va en 48 kHz, 16 bits y estéreo:
     iOS mezcla la música con la calidad de ese <audio>. */
const esIOS = /iP(hone|ad|od)|Macintosh/.test(navigator.userAgent) && 'ontouchend' in document;
let audioSilencioso = null;
function wavSilencio() {
  const sr = 48000, n = 1024 * 4, v = new DataView(new ArrayBuffer(44 + n));
  const w = (o, t) => [...t].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
  w(0, 'RIFF'); v.setUint32(4, 36 + n, true); w(8, 'WAVE'); w(12, 'fmt ');
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 2, true);
  v.setUint32(24, sr, true); v.setUint32(28, sr * 4, true); v.setUint16(32, 4, true); v.setUint16(34, 16, true);
  w(36, 'data'); v.setUint32(40, n, true);
  return v.buffer;
}
function sesionReproduccion() {
  try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) {}
  if (!esIOS) return;
  try {
    if (!audioSilencioso) {
      const a = audioSilencioso = document.createElement('audio');
      a.loop = true; a.preload = 'auto'; a.disableRemotePlayback = true;
      a.setAttribute('playsinline', '');
      a.setAttribute('x-webkit-airplay', 'deny');
      /* si la página no admite audio "data:" (política de contenido), prueba con "blob:";
         el próximo toque lo reproduce */
      a.onerror = () => {
        if (a.src.startsWith('data:')) a.src = URL.createObjectURL(new Blob([wavSilencio()], { type: 'audio/wav' }));
      };
      let bin = '';
      new Uint8Array(wavSilencio()).forEach(b => { bin += String.fromCharCode(b); });
      a.src = 'data:audio/wav;base64,' + btoa(bin);
    }
    if (audioSilencioso.paused) audioSilencioso.play().catch(() => {});
  } catch (e) {}
}
function desbloquearAudio() {
  if (!S || !(S.cfg.musica || S.cfg.sonido)) return;
  sesionReproduccion();
  const c = AUD.iniciar();
  if (!c) return;
  try {
    const src = c.createBufferSource();
    src.buffer = c.createBuffer(1, 1, 22050);
    src.connect(c.destination);
    src.start(0);
  } catch (e) {}
  if (S.cfg.musica) MUSICA.iniciar();
}
['touchend', 'pointerup', 'click', 'keydown'].forEach(ev =>
  document.addEventListener(ev, desbloquearAudio, { capture: true, passive: true }));
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    MUSICA.detener();
    if (audioSilencioso) audioSilencioso.pause();
  } else if (S && S.cfg.musica && AUD.ctx) {
    AUD.iniciar();
    MUSICA.iniciar();
  }
});

function alternarMusica() {
  S.cfg.musica = !S.cfg.musica;
  AUD.iniciar();
  if (S.cfg.musica) MUSICA.iniciar(); else MUSICA.detener();
  AUD.volumenes();
  guardar();
  $$('.btn-musica').forEach(b => { b.classList.toggle('off', !S.cfg.musica); b.setAttribute('aria-pressed', S.cfg.musica); });
  toast(S.cfg.musica ? `🎵 Música: ${ESTILOS[S.cfg.estiloMusica].nom}` : '🔇 Música apagada', 'toast-suave');
  if (vista === 'perfil') { const y = scrollY; vPerfil(); scrollTo(0, y); }
}

/* botón 🎵 (encabezado y lección) */
function botonMusica(clase = '') {
  return `<button type="button" class="btn-musica ${clase} ${S.cfg.musica ? '' : 'off'}" aria-pressed="${S.cfg.musica}"
    aria-label="Música de fondo" title="Música de fondo (M)"><span class="nota-on">🎵</span><span class="nota-off">🔇</span></button>`;
}
function conectarMusica(raiz = document) { $$('.btn-musica', raiz).forEach(b => { b.onclick = alternarMusica; }); }

/* ---------------- efectos visuales ---------------- */

const menosMovimiento = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const fxCompletos = () => S.cfg.efectos === 'completos' && !menosMovimiento();

const FX = {
  /* partículas que salen de un punto (acierto, par, logro) */
  chispas(x, y, { n = 16, colores = ['#22c55e', '#f59e0b', '#2dd4bf', '#60a5fa', '#e879f9'], dist = 80, tam = 8 } = {}) {
    if (!fxCompletos()) return;
    const capa = document.createElement('div');
    capa.className = 'fx-capa';
    for (let i = 0; i < n; i++) {
      const s = document.createElement('i');
      const a = (Math.PI * 2 * i) / n + Math.random() * 0.5, d = dist * (0.55 + Math.random() * 0.6);
      s.className = 'chispa' + (Math.random() < 0.35 ? ' estrella' : '');
      s.style.cssText = `left:${x}px;top:${y}px;--dx:${Math.cos(a) * d}px;--dy:${Math.sin(a) * d}px;` +
        `--c:${azar(colores)};--t:${tam * (0.6 + Math.random() * 0.8)}px;--r:${Math.random() * 360}deg`;
      capa.appendChild(s);
    }
    document.body.appendChild(capa);
    setTimeout(() => capa.remove(), 900);
  },
  chispasEn(el, op) {
    if (!el) return;
    const r = el.getBoundingClientRect();
    FX.chispas(r.left + r.width / 2, r.top + r.height / 2, op);
  },
  /* un texto que sube y se desvanece ("+10 XP") */
  flota(el, texto, clase = '') {
    if (!el || S.cfg.efectos === 'ninguno') return;
    const r = el.getBoundingClientRect(), f = document.createElement('div');
    f.className = 'flota ' + clase;
    f.textContent = texto;
    f.style.left = (r.left + r.width / 2) + 'px';
    f.style.top = (r.top) + 'px';
    document.body.appendChild(f);
    setTimeout(() => f.remove(), 1200);
  },
  /* resplandor verde o sacudida suave sobre el ejercicio */
  marcar(el, tipo) {
    if (!el) return;
    const c = tipo === 'ok' ? 'fx-ok' : 'fx-mal';
    el.classList.remove('fx-ok', 'fx-mal');
    void el.offsetWidth;
    el.classList.add(c);
    setTimeout(() => el.classList.remove(c), 800);
  },
  /* cartel central para los combos */
  cartel(html, clase = '') {
    if (S.cfg.efectos === 'ninguno') return;
    const b = document.createElement('div');
    b.className = 'cartel ' + clase + (fxCompletos() ? '' : ' quieto');
    b.innerHTML = html;
    document.body.appendChild(b);
    setTimeout(() => b.remove(), 1300);
  },
  /* número que cuenta desde 0 (pantalla de cierre) */
  contar(el, hasta, ms = 900, sufijo = '', prefijo = '') {
    if (!el) return;
    if (!fxCompletos()) { el.textContent = prefijo + hasta + sufijo; return; }
    const t0 = performance.now();
    let ultimo = -1;
    (function paso(t) {
      const k = Math.min(1, (t - t0) / ms), e = 1 - Math.pow(1 - k, 3), v = Math.round(hasta * e);
      el.textContent = prefijo + v + sufijo;
      if (v !== ultimo && v % Math.max(1, Math.ceil(hasta / 8)) === 0 && hasta > 0) SND.tic(k);
      ultimo = v;
      if (k < 1) requestAnimationFrame(paso);
      else { el.classList.add('fx-pum'); setTimeout(() => el.classList.remove('fx-pum'), 400); }
    })(t0);
    /* si la pestaña no pinta cuadros, el número final igual queda */
    setTimeout(() => { el.textContent = prefijo + hasta + sufijo; }, ms + 150);
  },
  /* celebración de nivel nuevo */
  nivel(n, nombre) {
    SND.nivel(); vibrar([30, 60, 30, 60, 90]);
    const m = document.createElement('div');
    m.className = 'sube-nivel';
    m.innerHTML = `<div class="sube-in">
      <div class="sube-rayos"></div>
      <div class="sube-badge">${n}</div>
      <p class="sube-t">¡Subiste de nivel!</p>
      <p class="sube-n">${esc(nombre)}</p>
      <p class="sube-toca">tocá para seguir</p></div>`;
    document.body.appendChild(m);
    confeti(160);
    const cerrar = () => { m.classList.add('saliendo'); setTimeout(() => m.remove(), 300); };
    m.addEventListener('click', cerrar);
    setTimeout(() => { if (m.isConnected) cerrar(); }, 4200);
  }
};

/* confeti con cintas y círculos, desde el centro y los costados */
function confeti(n = 110) {
  if (!fxCompletos()) return;
  const c = document.createElement('canvas');
  c.className = 'confeti';
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  c.width = innerWidth * dpr; c.height = innerHeight * dpr;
  document.body.appendChild(c);
  const x = c.getContext('2d');
  x.scale(dpr, dpr);
  const cols = ['#16a34a', '#f59e0b', '#e11d48', '#c026d3', '#2563eb', '#0d9488', '#facc15'];
  const origenes = [[innerWidth / 2, innerHeight * 0.32, 0], [0, innerHeight * 0.7, 1], [innerWidth, innerHeight * 0.7, -1]];
  const ps = Array.from({ length: n }, (_, i) => {
    const [ox, oy, lado] = origenes[i % 3];
    return {
      x: ox, y: oy,
      vx: lado ? lado * (6 + Math.random() * 9) : (Math.random() - 0.5) * 14,
      vy: -Math.random() * 13 - (lado ? 8 : 4),
      r: Math.random() * 6 + 5, c: azar(cols), a: Math.random() * 6, va: (Math.random() - 0.5) * 0.35,
      forma: Math.random() < 0.3 ? 'o' : 'c', osc: Math.random() * 6
    };
  });
  const t0 = performance.now();
  (function paso(t) {
    const dt = t - t0;
    x.clearRect(0, 0, innerWidth, innerHeight);
    for (const p of ps) {
      p.vy += 0.32; p.x += p.vx + Math.sin(dt / 180 + p.osc) * 0.6; p.y += p.vy; p.vx *= 0.985; p.a += p.va;
      x.save(); x.translate(p.x, p.y); x.rotate(p.a);
      x.globalAlpha = Math.max(0, 1 - dt / 2300); x.fillStyle = p.c;
      if (p.forma === 'o') { x.beginPath(); x.arc(0, 0, p.r / 2.4, 0, Math.PI * 2); x.fill(); }
      else x.fillRect(-p.r / 2, -p.r / 5, p.r, (p.r / 2.5) * Math.abs(Math.cos(dt / 120 + p.osc)) + 1);
      x.restore();
    }
    if (dt < 2300) requestAnimationFrame(paso); else c.remove();
  })(t0);
}
