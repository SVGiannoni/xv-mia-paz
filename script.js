/* =========================================================
   CONFIGURACIÓN — editá sólo este bloque
   ========================================================= */
const CONFIG = {
  nombre: 'Mía Paz',
  tituloEvento: 'XV de Mía Paz',                 // título en Google Calendar

  // Fecha y hora con offset de Argentina (-03:00): funciona desde cualquier zona horaria
  fechaEvento: '2026-12-26T21:00:00-03:00',
  duracionHoras: 6,                               // para el evento del calendario
  zonaHoraria: 'America/Argentina/Buenos_Aires',

  lugar: {
    nombre: 'Eventos Los Tres Hermanos',
    direccion: 'Balbastro 1448, Merlo, Buenos Aires',
    mapa: 'https://share.google/KwmaiojpbRXfyTquH',
  },

  alias: 'priscila.ppz',

  // Número en formato internacional, sólo dígitos y sin "+". Ej: '5491112345678'
  // Si queda vacío, el botón de confirmar se oculta.
  whatsapp: '',
  mensajeWhatsapp: '¡Hola! Confirmo mi asistencia a los XV de Mía Paz 🎉',

  // Fecha límite para confirmar (AAAA-MM-DD). Vacío = no se muestra.
  confirmarAntesDe: '2026-12-12',

  // Ruta de la canción. Si el archivo no existe, el botón de música no aparece.
  musica: 'assets/musica.mp3',
};

/* ========================================================= */

(function () {
  'use strict';

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const TZ = CONFIG.zonaHoraria;
  const eventDate = new Date(CONFIG.fechaEvento);

  const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

  function dateParts(date, opts) {
    const out = {};
    new Intl.DateTimeFormat('es-AR', { timeZone: TZ, ...opts })
      .formatToParts(date)
      .forEach((p) => { out[p.type] = p.value; });
    return out;
  }

  /* ---------- Textos desde CONFIG ---------- */
  function bindTexts() {
    const p = dateParts(eventDate, {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
    });
    const monthNum = dateParts(eventDate, { month: '2-digit' }).month;
    const mesCorto = p.month.slice(0, 3).toUpperCase();
    const horaCorta = p.minute === '00' ? `${Number(p.hour)} HS` : `${Number(p.hour)}:${p.minute} HS`;
    const horaLarga = `${p.hour}:${p.minute} hs`;
    const fechaLarga = `${capitalize(p.weekday)} ${p.day} de ${p.month} de ${p.year}`;

    let confirmar = '';
    if (CONFIG.confirmarAntesDe) {
      const d = new Date(`${CONFIG.confirmarAntesDe}T12:00:00-03:00`);
      if (!isNaN(d)) {
        const c = dateParts(d, { weekday: 'long', day: 'numeric', month: 'long' });
        confirmar = `${c.weekday} ${c.day} de ${c.month}`;
      }
    }

    const values = {
      'nombre': CONFIG.nombre,
      'fecha-corta': `${p.day} · ${mesCorto} · ${p.year} · ${horaCorta}`,
      'fecha-larga-hora': `${fechaLarga} · ${horaLarga}`,
      'fecha-numerica': `${p.day} · ${monthNum} · ${p.year}`,
      'lugar-nombre': CONFIG.lugar.nombre,
      'lugar-direccion': CONFIG.lugar.direccion,
      'alias': CONFIG.alias,
      'confirmar-fecha': confirmar,
    };

    $$('[data-bind]').forEach((el) => {
      const v = values[el.dataset.bind];
      if (v) el.textContent = v;
    });

    const deadline = $('#rsvp-deadline');
    if (deadline && !confirmar) deadline.hidden = true;
  }

  /* ---------- Links (mapa, calendario, WhatsApp) ---------- */
  function setupLinks() {
    const mapa = $('#btn-mapa');
    if (mapa && CONFIG.lugar.mapa) mapa.href = CONFIG.lugar.mapa;

    const cal = $('#btn-calendario');
    if (cal) {
      const toGCal = (d) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
      const end = new Date(eventDate.getTime() + CONFIG.duracionHoras * 3600 * 1000);
      const params = new URLSearchParams({
        action: 'TEMPLATE',
        text: CONFIG.tituloEvento,
        dates: `${toGCal(eventDate)}/${toGCal(end)}`,
        details: `¡Te espero para celebrar mis XV! — ${CONFIG.nombre}\nCómo llegar: ${CONFIG.lugar.mapa}`,
        location: `${CONFIG.lugar.nombre}, ${CONFIG.lugar.direccion}`,
        ctz: TZ,
      });
      cal.href = `https://calendar.google.com/calendar/render?${params.toString()}`;
    }

    const wa = $('#btn-whatsapp');
    const numero = String(CONFIG.whatsapp || '').replace(/\D/g, '');
    if (wa) {
      if (numero) {
        wa.href = `https://wa.me/${numero}?text=${encodeURIComponent(CONFIG.mensajeWhatsapp)}`;
        wa.hidden = false;
      } else {
        wa.hidden = true;
      }
    }
  }

  /* ---------- Cuenta regresiva ---------- */
  function setupCountdown() {
    const units = $('#countdown-units');
    const done = $('#countdown-done');
    const sr = $('#countdown-sr');
    if (!units) return;

    const els = {
      days: $('[data-unit="days"]', units),
      hours: $('[data-unit="hours"]', units),
      minutes: $('[data-unit="minutes"]', units),
      seconds: $('[data-unit="seconds"]', units),
    };
    const pad = (n) => String(n).padStart(2, '0');
    let lastSr = '';

    function tick() {
      const diff = eventDate.getTime() - Date.now();
      if (diff <= 0) {
        units.hidden = true;
        done.hidden = false;
        if (sr) sr.textContent = '';
        return false;
      }
      const total = Math.floor(diff / 1000);
      const d = Math.floor(total / 86400);
      const h = Math.floor((total % 86400) / 3600);
      const m = Math.floor((total % 3600) / 60);
      const s = total % 60;

      els.days.textContent = pad(d);
      els.hours.textContent = pad(h);
      els.minutes.textContent = pad(m);
      els.seconds.textContent = pad(s);

      const txt = `Faltan ${d} días, ${h} horas y ${m} minutos`;
      if (sr && txt !== lastSr) { sr.textContent = txt; lastSr = txt; }
      return true;
    }

    (function loop() {
      if (tick()) setTimeout(loop, 1000 - (Date.now() % 1000) + 15);
    })();
  }

  /* ---------- Música (nunca autoplay) ---------- */
  function setupMusic() {
    const btn = $('#music-toggle');
    const audio = $('#bg-music');
    if (!btn || !audio || !CONFIG.musica) return;

    const setState = (playing) => {
      btn.setAttribute('aria-pressed', String(playing));
      btn.setAttribute('aria-label', playing ? 'Pausar música' : 'Reproducir música');
    };
    const hide = () => { btn.hidden = true; audio.pause(); };

    // Sólo mostramos el botón si el archivo existe
    fetch(CONFIG.musica, { method: 'HEAD', cache: 'no-store' })
      .then((r) => {
        const type = r.headers.get('content-type') || '';
        if (r.ok && !type.includes('text/html')) {
          audio.src = CONFIG.musica;
          audio.volume = 0.6;
          btn.hidden = false;
        }
      })
      .catch(() => { /* sin archivo o sin servidor: el botón queda oculto */ });

    audio.addEventListener('error', hide);
    audio.addEventListener('play', () => setState(true));
    audio.addEventListener('pause', () => setState(false));

    btn.addEventListener('click', () => {
      if (audio.paused) {
        audio.play().catch(() => { if (audio.error) hide(); });
      } else {
        audio.pause();
      }
    });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden && !audio.paused) audio.pause();
    });
  }

  /* ---------- Copiar alias ---------- */
  let toastTimer;
  function showToast(msg) {
    const toast = $('#toast');
    if (!toast) return;
    toast.textContent = msg;
    requestAnimationFrame(() => toast.classList.add('is-visible'));
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.remove('is-visible');
      setTimeout(() => { toast.textContent = ''; }, 400);
    }, 2400);
  }

  async function copyText(text) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch (e) { /* probamos el método alternativo */ }
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;';
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    ta.remove();
    return ok;
  }

  function setupCopy() {
    const btn = $('#btn-copiar');
    if (!btn) return;
    btn.addEventListener('click', async () => {
      const ok = await copyText(CONFIG.alias);
      showToast(ok ? '¡Alias copiado!' : 'No se pudo copiar. Mantené presionado el alias.');
    });
  }

  /* ---------- Animaciones al hacer scroll ---------- */
  function setupReveal() {
    const items = $$('.reveal');
    if (reduceMotion || !('IntersectionObserver' in window)) {
      items.forEach((el) => el.classList.add('is-visible'));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    items.forEach((el) => io.observe(el));
  }

  /* ---------- Brillos y pétalos (canvas liviano) ---------- */
  function setupSparkles() {
    const canvas = $('#sparkles');
    const ctx = canvas && canvas.getContext('2d');
    if (!ctx) return;

    const GOLD = ['241,220,174', '216,184,120', '255,244,214'];
    const PETAL = ['163,40,58', '120,22,40'];
    const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
    let w = 0, h = 0, particles = [], raf = null, last = 0;

    function make(randomY) {
      const petal = Math.random() < 0.1;
      return {
        x: Math.random() * w,
        y: randomY ? Math.random() * h : -12,
        r: petal ? 3 + Math.random() * 2.5 : 0.6 + Math.random() * 1.5,
        vy: petal ? 0.3 + Math.random() * 0.3 : 0.12 + Math.random() * 0.3,
        phase: Math.random() * Math.PI * 2,
        swaySpeed: 0.006 + Math.random() * 0.01,
        swayAmp: 0.15 + Math.random() * 0.45,
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.02,
        tw: Math.random() * Math.PI * 2,
        star: !petal && Math.random() < 0.16,
        petal,
        color: petal ? pick(PETAL) : pick(GOLD),
      };
    }

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const widthChanged = window.innerWidth !== w;
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (widthChanged || !particles.length) {
        const count = Math.round(Math.min(55, Math.max(22, (w * h) / 16000)));
        particles = Array.from({ length: count }, () => make(true));
      }
    }

    function draw(p) {
      if (p.petal) {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = `rgba(${p.color},0.55)`;
        ctx.beginPath();
        ctx.ellipse(0, 0, p.r, p.r * 0.55, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        return;
      }
      const a = 0.25 + 0.75 * Math.abs(Math.sin(p.tw));
      ctx.fillStyle = `rgba(${p.color},${a.toFixed(3)})`;
      if (p.star) {
        const s = p.r * 3.2;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y - s);
        ctx.quadraticCurveTo(p.x, p.y, p.x + s, p.y);
        ctx.quadraticCurveTo(p.x, p.y, p.x, p.y + s);
        ctx.quadraticCurveTo(p.x, p.y, p.x - s, p.y);
        ctx.quadraticCurveTo(p.x, p.y, p.x, p.y - s);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function frame(t) {
      const dt = Math.min(3, last ? (t - last) / 16.67 : 1);
      last = t;
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.phase += p.swaySpeed * dt;
        p.y += p.vy * dt;
        p.x += Math.sin(p.phase) * p.swayAmp * dt;
        p.rot += p.vr * dt;
        p.tw += 0.03 * dt;
        if (p.y > h + 12 || p.x < -20 || p.x > w + 20) particles[i] = make(false);
        draw(p);
      }
      raf = requestAnimationFrame(frame);
    }

    function start() { if (!raf) { last = 0; raf = requestAnimationFrame(frame); } }
    function stop() { if (raf) cancelAnimationFrame(raf); raf = null; }

    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        resize();
        if (reduceMotion) { ctx.clearRect(0, 0, w, h); particles.forEach(draw); }
      }, 150);
    });

    resize();
    if (reduceMotion) {
      particles.forEach(draw); // cuadro estático, sin movimiento
      return;
    }
    document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
    start();
  }

  /* ---------- Inicio ---------- */
  function init() {
    bindTexts();
    setupLinks();
    setupCountdown();
    setupMusic();
    setupCopy();
    setupReveal();
    setupSparkles();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
