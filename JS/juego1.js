(() => {
  /* ===== Reglas del juego: cambia estos números y todo se actualiza ===== */
  const CONFIG = {
    meta: 10,            // topos a golpear para ganar
    tiempo: 30,          // segundos
    intentos: 5,         // fallos permitidos
    visibleInicial: 1000,// ms que el topo se queda arriba al empezar
    visibleMin: 550,     // nunca baja de esto
    pasoVisible: 80,     // cuánto se acorta cada vez que sube la dificultad
    cadaAciertos: 3,     // cada cuántos aciertos sube la dificultad
    pausaEntre: 250,     // ms mínimos entre un topo y el siguiente
    aturdido: 400        // ms que se ve el topo aturdido
  };
  const IMG_TOPO = 'img/topo.png';
  const IMG_ATURDIDO = 'img/topo-aturdido.png';
  const CLAVE_MEJOR = 'topo-mejor-puntaje';

  const $ = (s, r = document) => r.querySelector(s);
  const casillas = [...document.querySelectorAll('.casilla')];
  const wrap = $('#tablero-wrap');
  const elPuntos = $('#puntos'), elTiempo = $('#tiempo'), elIntentos = $('#intentos');
  const overlay = $('#overlay'), ovTitulo = $('#ov-titulo'), ovTexto = $('#ov-texto'), ovMejor = $('#ov-mejor');
  const btnJugar = $('#btn-jugar');

  // Precarga para que el cambio de imagen no parpadee
  [IMG_TOPO, IMG_ATURDIDO, 'img/martillo.png', 'img/martillo-golpe.png'].forEach(src => { new Image().src = src; });

  let jugando = false, puntos = 0, intentos = 0, finTiempo = 0, visible = CONFIG.visibleInicial;
  let activa = -1, ultima = -1;
  let tOcultar = 0, tSiguiente = 0, tFin = 0, reloj = 0;

  /* ----- Marcador ----- */
  function pintar(segundos) {
    elPuntos.textContent = puntos + ' / ' + CONFIG.meta;
    elIntentos.textContent = intentos;
    elIntentos.parentElement.classList.toggle('bajo', jugando && intentos === 1);
    if (segundos !== undefined) {
      elTiempo.textContent = segundos;
      elTiempo.parentElement.classList.toggle('bajo', jugando && segundos <= 5);
    }
  }

  function mejorPuntaje() {
    try { return Number(localStorage.getItem(CLAVE_MEJOR)) || 0; } catch (e) { return 0; }
  }
  function guardarMejor(n) {
    try { localStorage.setItem(CLAVE_MEJOR, n); } catch (e) { /* sin almacenamiento: se ignora */ }
  }

  /* ----- Topos ----- */
  function limpiarTimers() {
    clearTimeout(tOcultar); clearTimeout(tSiguiente); clearTimeout(tFin); clearInterval(reloj);
  }

  function resetCasillas() {
    casillas.forEach(c => {
      c.classList.remove('activo', 'golpeado', 'acierto', 'fallo');
      $('.topo', c).src = IMG_TOPO;
    });
  }

  function ocultar(i) {
    casillas[i].classList.remove('activo', 'golpeado');
    if (activa === i) activa = -1;
  }

  function programarSiguiente() {
    if (!jugando) return;
    tSiguiente = setTimeout(mostrarTopo, CONFIG.pausaEntre + Math.random() * 300);
  }

  function mostrarTopo() {
    if (!jugando) return;
    let i;
    do { i = Math.floor(Math.random() * casillas.length); } while (i === ultima && casillas.length > 1);
    ultima = i; activa = i;
    const c = casillas[i];
    $('.topo', c).src = IMG_TOPO;
    c.classList.remove('golpeado');
    c.classList.add('activo');
    tOcultar = setTimeout(() => { ocultar(i); programarSiguiente(); }, visible);
  }

  function destello(c, clase) {
    c.classList.remove('acierto', 'fallo');
    void c.offsetWidth;            // reinicia la animación
    c.classList.add(clase);
  }

  /* ----- Golpe ----- */
  function golpear(i) {
    if (!jugando) return;
    const c = casillas[i];

    // Topo ya golpeado y aturdido: no cuenta ni como acierto ni como fallo
    if (i === activa && c.classList.contains('golpeado')) return;

    if (i === activa && c.classList.contains('activo')) {
      clearTimeout(tOcultar);
      c.classList.add('golpeado');
      $('.topo', c).src = IMG_ATURDIDO;
      destello(c, 'acierto');
      puntos++;
      if (puntos % CONFIG.cadaAciertos === 0) visible = Math.max(CONFIG.visibleMin, visible - CONFIG.pasoVisible);
      pintar();
      if (puntos >= CONFIG.meta) { terminar(true); return; }
      tOcultar = setTimeout(() => { ocultar(i); programarSiguiente(); }, CONFIG.aturdido);
    } else {
      intentos--;
      destello(c, 'fallo');
      pintar();
      if (intentos <= 0) terminar(false, 'Te quedaste sin intentos.');
    }
  }

  /* ----- Flujo ----- */
  function iniciar() {
    limpiarTimers();
    resetCasillas();
    jugando = true; puntos = 0; intentos = CONFIG.intentos; visible = CONFIG.visibleInicial;
    activa = -1; ultima = -1;
    finTiempo = Date.now() + CONFIG.tiempo * 1000;
    overlay.hidden = true;
    wrap.classList.add('jugando');
    pintar(CONFIG.tiempo);

    reloj = setInterval(() => {
      const resto = Math.max(0, Math.ceil((finTiempo - Date.now()) / 1000));
      pintar(resto);
      if (resto <= 0) terminar(false, 'Se acabó el tiempo.');
    }, 200);

    tSiguiente = setTimeout(mostrarTopo, 600);
  }

  function terminar(gano, motivo) {
    if (!jugando) return;
    jugando = false;
    limpiarTimers();
    wrap.classList.remove('jugando');
    pintar();

    const mejor = Math.max(mejorPuntaje(), puntos);
    guardarMejor(mejor);

    // Pequeña pausa para que se vea el último golpe antes de la pantalla final
    tFin = setTimeout(() => {
      resetCasillas();
      overlay.classList.remove('gana', 'pierde');
      overlay.classList.add(gano ? 'gana' : 'pierde');
      ovTitulo.textContent = gano ? '¡Ganaste!' : 'Game over';
      ovTexto.textContent = gano
        ? 'Golpeaste ' + puntos + ' topos y te sobraron ' + intentos + ' intentos.'
        : motivo + ' Golpeaste ' + puntos + ' de ' + CONFIG.meta + ' topos.';
      ovMejor.textContent = 'Mejor puntaje: ' + mejor;
      ovMejor.hidden = false;
      btnJugar.textContent = 'Jugar otra vez';
      overlay.hidden = false;
      btnJugar.focus({ preventScroll: true });
    }, gano ? 450 : 150);
  }

  /* ----- Eventos ----- */
  // Mouse y táctil: responde al presionar. Teclado (Enter/Espacio): llega como click con detail 0.
  $('#tablero').addEventListener('pointerdown', e => {
    const c = e.target.closest('.casilla');
    if (!c || (e.pointerType === 'mouse' && e.button !== 0)) return;
    golpear(casillas.indexOf(c));
  });
  $('#tablero').addEventListener('click', e => {
    const c = e.target.closest('.casilla');
    if (c && e.detail === 0) golpear(casillas.indexOf(c));
  });

  btnJugar.addEventListener('click', iniciar);
  $('#btn-reiniciar').addEventListener('click', iniciar);

  /* ----- Estado inicial ----- */
  intentos = CONFIG.intentos;
  pintar(CONFIG.tiempo);
  ovTexto.textContent = 'Golpea ' + CONFIG.meta + ' topos en ' + CONFIG.tiempo + ' segundos. Tienes ' + CONFIG.intentos + ' intentos.';
  const m = mejorPuntaje();
  if (m > 0) { ovMejor.textContent = 'Mejor puntaje: ' + m; ovMejor.hidden = false; }
})();