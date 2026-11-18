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