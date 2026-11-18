(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Partículas del hero */
  const cv = $('#fx'), ctx = cv.getContext('2d'), hero = $('.hero');
  const cols = ['#00e5ff', '#ff2e93', '#39ff88'];
  let W, H, pts = [], mouse = { x: -999, y: -999 }, visible = true;

  function size() {
    const r = cv.getBoundingClientRect(), d = Math.min(devicePixelRatio || 1, 2);
    W = r.width; H = r.height;
    cv.width = W * d; cv.height = H * d;
    ctx.setTransform(d, 0, 0, d, 0, 0);
    pts = Array.from({ length: Math.round(W * H / 16000) }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - .5) * .35, vy: (Math.random() - .5) * .35,
      c: cols[Math.random() * 3 | 0], r: Math.random() * 1.6 + .7
    }));
  }

  function frame() {
    requestAnimationFrame(frame);
    if (!visible || document.hidden) return;
    ctx.clearRect(0, 0, W, H);
    for (const p of pts) {
      if (!calm) {
        p.x += p.vx; p.y += p.vy;
        const dx = p.x - mouse.x, dy = p.y - mouse.y;
        if (dx * dx + dy * dy < 14000) { p.x += dx * .02; p.y += dy * .02; }
        if (p.x < 0) p.x = W; else if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H; else if (p.y > H) p.y = 0;
      }
      ctx.globalAlpha = .85; ctx.fillStyle = p.c;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fill();
    }
    ctx.lineWidth = 1;
    for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
      const a = pts[i], b = pts[j], dx = a.x - b.x, dy = a.y - b.y, d = dx * dx + dy * dy;
      if (d < 12100) {
        ctx.globalAlpha = (1 - d / 12100) * .35; ctx.strokeStyle = a.c;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      }
    }
  }
  size(); frame();
  addEventListener('resize', size);
  hero.addEventListener('pointermove', e => { const r = cv.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; });
  hero.addEventListener('pointerleave', () => { mouse.x = mouse.y = -999; });
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(hero);

  /* Aparición al hacer scroll */
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { threshold: .15 });
  $$('.rv').forEach((el, i) => { el.style.transitionDelay = (i % 3) * 90 + 'ms'; io.observe(el); });

  /* Inclinación 3D y brillo que sigue al ratón */
  $$('.card').forEach(c => {
    c.addEventListener('pointermove', e => {
      if (e.pointerType !== 'mouse' || calm) return;
      const r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      c.style.setProperty('--mx', x * 100 + '%'); c.style.setProperty('--my', y * 100 + '%');
      c.style.setProperty('--ry', (x - .5) * 9 + 'deg'); c.style.setProperty('--rx', (.5 - y) * 9 + 'deg');
    });
    c.addEventListener('pointerleave', () => { c.style.setProperty('--rx', '0deg'); c.style.setProperty('--ry', '0deg'); });
  });

  /* Modal de instrucciones (edita textos y teclas de cada juego aquí) */
  const GAMES = {
    1: { name: 'Neon Dash', tip: 'En el móvil: desliza para cambiar de carril y toca la pantalla para saltar.',
         keys: [['← →  /  A D', 'Cambiar de carril'], ['Espacio', 'Saltar'], ['Shift', 'Impulso, se recarga solo'], ['P', 'Pausa']] },
    2: { name: 'Void Arena', tip: 'En el móvil: joystick a la izquierda para moverte, botones a la derecha para disparar.',
         keys: [['W A S D', 'Moverte'], ['Ratón', 'Apuntar'], ['Clic izq.', 'Disparar'], ['Q', 'Activar escudo'], ['Esc', 'Pausa']] }
  };
  const modal = $('#modal');
  $$('.card').forEach(card => {
    $('.info', card).addEventListener('click', () => {
      const g = GAMES[card.dataset.game];
      $('#m-title').textContent = 'Cómo se juega ' + g.name;
      $('#m-tip').textContent = g.tip;
      $('#m-keys').innerHTML = g.keys.map(k => `<dt>${k[0]}</dt><dd>${k[1]}</dd>`).join('');
      const go = $('#m-go'); go.href = $('.play', card).getAttribute('href');
      go.className = 'btn' + (card.dataset.game === '2' ? ' mg' : '');
      modal.showModal();
    });
  });
  $('#m-close').addEventListener('click', () => modal.close());
  modal.addEventListener('click', e => { if (e.target === modal) modal.close(); });

  /* Suscripción (conecta aquí tu servicio de correo cuando lo tengas) */
  $('#sub').addEventListener('submit', e => {
    e.preventDefault();
    $('#ok').textContent = 'Listo, te avisaremos a ' + e.target.email.value + '.';
    e.target.reset();
  });
})();

/* ===== Neon Dash (añadido): juego de tres carriles ===== */
(() => {
  const $ = s => document.querySelector(s);
  const cv = $('#game'), g = cv.getContext('2d');
  const W = 480, H = 720, PY = 600, LX = [100, 240, 380];
  const FONT = "700 44px 'Chakra Petch',system-ui,sans-serif";
  let s, raf = 0, hi = 0, shift = false, px = 0;
  try { hi = +localStorage.getItem('nd-hi') || 0; } catch (e) {}

  const hud = () => {
    $('#sc').textContent = s.sc | 0; $('#hi').textContent = hi | 0; $('#bs').textContent = Math.round(s.bo);
  };

  function reset() {
    s = { on: false, over: false, pause: false, lane: 1, x: LX[1], z: 0, vz: 0, bo: 100, sp: 5, sc: 0, t: 0, o: [], c: [] };
    hud(); draw();
  }
  function start() {
    if (s.on && !s.over) return;
    reset(); s.on = true; $('#start').blur();
    cancelAnimationFrame(raf); loop();
  }
  const move = d => { if (s.on && !s.over && !s.pause) s.lane = Math.max(0, Math.min(2, s.lane + d)); };
  const jump = () => { if (s.on && !s.over && !s.pause && s.z === 0) s.vz = 11; };
  const pause = on => { if (s.on && !s.over) { s.pause = on === undefined ? !s.pause : on; draw(); } };

  function die() {
    s.over = true; hi = Math.max(hi, s.sc | 0);
    try { localStorage.setItem('nd-hi', hi); } catch (e) {}
    hud(); draw(); cancelAnimationFrame(raf);
  }

  function update() {
    s.t++;
    const boosting = shift && s.bo > 0;
    s.bo = Math.max(0, Math.min(100, s.bo + (boosting ? -1.2 : .25)));
    s.sp = 5 + s.t / 900;
    const v = s.sp * (boosting ? 1.8 : 1);
    s.x += (LX[s.lane] - s.x) * .25;
    s.z += s.vz; s.vz -= .8;
    if (s.z <= 0) s.z = s.vz = 0;

    if (s.t % Math.max(18, 55 - (s.t / 60 | 0)) === 0) {
      const l = Math.random() * 3 | 0;
      s.o.push({ l, y: -40, low: Math.random() < .45 });
      if (Math.random() < .7) s.c.push({ l: (l + 1 + (Math.random() * 2 | 0)) % 3, y: -40 });
    }
    for (const o of s.o) {
      o.y += v;
      if (o.l === s.lane && Math.abs(o.y - PY) < 30 && !(o.low && s.z > 36)) return die();
    }
    for (const c of s.c) {
      c.y += v;
      if (c.l === s.lane && Math.abs(c.y - PY) < 30 && s.z < 40) { c.got = true; s.sc += 50; }
    }
    s.o = s.o.filter(o => o.y < H + 40);
    s.c = s.c.filter(c => !c.got && c.y < H + 40);
    s.sc += v * .05; hud();
  }

  function msg(a, b) {
    g.fillStyle = 'rgba(10,10,15,.72)'; g.fillRect(0, 0, W, H);
    g.textAlign = 'center'; g.fillStyle = '#e9ecf5'; g.font = FONT; g.fillText(a, W / 2, H / 2 - 8);
    g.fillStyle = '#98a0b8'; g.font = "400 20px Barlow,system-ui,sans-serif"; g.fillText(b, W / 2, H / 2 + 30);
  }

  function draw() {
    g.clearRect(0, 0, W, H); g.fillStyle = '#0a0a0f'; g.fillRect(0, 0, W, H);
    g.strokeStyle = 'rgba(255,255,255,.14)'; g.lineWidth = 2;
    const off = (s.t * s.sp) % 60;
    for (let i = -1; i < 13; i++) for (const x of [170, 310]) {
      g.beginPath(); g.moveTo(x, i * 60 + off); g.lineTo(x, i * 60 + off + 30); g.stroke();
    }
    g.shadowBlur = 16;
    for (const c of s.c) {
      g.fillStyle = g.shadowColor = '#39ff88';
      g.beginPath(); g.arc(LX[c.l], c.y, 10, 0, 6.283); g.fill();
    }
    g.lineWidth = 3;
    for (const o of s.o) {
      g.fillStyle = g.strokeStyle = g.shadowColor = '#ff2e93';
      if (o.low) g.strokeRect(LX[o.l] - 50, o.y - 8, 100, 16);
      else g.fillRect(LX[o.l] - 30, o.y - 30, 60, 60);
    }
    g.shadowBlur = 0; g.fillStyle = '#00e5ff';
    g.globalAlpha = .3; g.beginPath(); g.ellipse(s.x, PY + 26, 22, 7, 0, 0, 6.283); g.fill(); g.globalAlpha = 1;
    g.shadowBlur = 20; g.shadowColor = '#00e5ff';
    const k = 26 + s.z / 6, y = PY - s.z;
    g.beginPath(); g.moveTo(s.x, y - k); g.lineTo(s.x + k * .8, y + k * .8); g.lineTo(s.x - k * .8, y + k * .8); g.closePath(); g.fill();
    g.shadowBlur = 0;
    if (!s.on) msg('Neon Dash', 'Toca aquí o pulsa Jugar');
    else if (s.over) msg('Fin del juego', 'Puntos ' + (s.sc | 0) + '. Toca o pulsa Espacio');
    else if (s.pause) msg('Pausa', 'Pulsa P o toca para seguir');
  }

  function loop() {
    raf = requestAnimationFrame(loop);
    if (s.pause) return;
    update();
    if (!s.over) draw();
  }

  addEventListener('keydown', e => {
    shift = e.shiftKey;
    if (e.repeat || e.target.closest('input,dialog')) return;
    const k = e.key.toLowerCase();
    if (k === 'arrowleft' || k === 'a') move(-1);
    else if (k === 'arrowright' || k === 'd') move(1);
    else if (k === 'p') pause();
    else if (k === ' ' && s.on && !s.over) { e.preventDefault(); jump(); }
    else if (k === ' ' && s.over) { e.preventDefault(); start(); }
  });
  addEventListener('keyup', e => { shift = e.shiftKey; });
  addEventListener('blur', () => { shift = false; pause(true); });

  cv.addEventListener('pointerdown', e => { px = e.clientX; });
  cv.addEventListener('pointerup', e => {
    const dx = e.clientX - px;
    if (!s.on || s.over) return start();
    if (s.pause) return pause(false);
    if (Math.abs(dx) > 30) move(dx > 0 ? 1 : -1); else jump();
  });
  $('#start').addEventListener('click', start);
  $('#m-go').addEventListener('click', () => $('#modal').close());
  new IntersectionObserver(([e]) => { if (!e.isIntersecting) pause(true); }, { threshold: .3 }).observe(cv);

  reset();
})();
