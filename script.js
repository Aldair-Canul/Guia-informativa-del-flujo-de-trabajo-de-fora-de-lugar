/* ==========================================================
   fora/commit — interactividad en JavaScript 

   Contenido del archivo:
     1. Utilidades (selectores, escape de HTML, avisos, copiar)
     2. Comportamiento general (progreso de lectura, aparición, navegación)
     3. Terminal animada del inicio
     4. Buscador de comandos de Git
     5. Simulador de ramas
     6. Pestañas de .gitignore / .gitattributes
     7. Checklist de progreso (guarda en localStorage)

   Todo vive dentro de una función que se ejecuta sola, para no
   crear variables globales.
   ========================================================== */
(() => {
  'use strict';

  /* ==========================================================
     1. UTILIDADES
     ========================================================== */

  /** Devuelve el primer elemento que coincide con el selector CSS. */
  const seleccionar = (selector, raiz = document) => raiz.querySelector(selector);

  /** Devuelve un arreglo con todos los elementos que coinciden con el selector. */
  const seleccionarTodos = (selector, raiz = document) => [...raiz.querySelectorAll(selector)];

  /** True si la persona pidió menos animaciones en su sistema operativo. */
  const reducirMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Esta clase permite que el CSS oculte elementos que se animan al aparecer
  // solo cuando JavaScript sí está funcionando.
  document.documentElement.classList.add('js');

  /** Escapa caracteres especiales para insertar texto de forma segura dentro de HTML. */
  const escaparHtml = (texto) => texto.replace(/[&<>"']/g, (caracter) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[caracter]));

  const avisoEl = seleccionar('#toast');
  let temporizadorAviso;

  /** Muestra un mensaje breve en la parte inferior de la pantalla. */
  function mostrarAviso(mensaje) {
    avisoEl.textContent = mensaje;
    avisoEl.classList.add('show');
    clearTimeout(temporizadorAviso);
    temporizadorAviso = setTimeout(() => avisoEl.classList.remove('show'), 1800);
  }

  /**
   * Copia texto al portapapeles.
   * Si el navegador no permite la API moderna, usa un método antiguo de respaldo.
   * @returns {Promise<boolean>} true si se pudo copiar.
   */
  async function copiarTexto(texto) {
    try {
      await navigator.clipboard.writeText(texto);
      return true;
    } catch (_) {
      const areaTemporal = document.createElement('textarea');
      areaTemporal.value = texto;
      areaTemporal.className = 'copia-temporal';
      document.body.appendChild(areaTemporal);
      areaTemporal.select();
      let copiado = false;
      try { copiado = document.execCommand('copy'); } catch (_) { /* el navegador no lo permite */ }
      areaTemporal.remove();
      return copiado;
    }
  }

  // Botones "Copiar" de cada bloque de código
  seleccionarTodos('.code .copy').forEach((boton) => {
    boton.addEventListener('click', async () => {
      const codigo = seleccionar('code', boton.parentElement).innerText;
      const copiado = await copiarTexto(codigo);
      boton.textContent = copiado ? '¡Copiado!' : 'Error';
      boton.classList.toggle('ok', copiado);
      setTimeout(() => { boton.textContent = 'Copiar'; boton.classList.remove('ok'); }, 1500);
    });
  });

  /* ==========================================================
     2. COMPORTAMIENTO GENERAL
     ========================================================== */

  // --- Barra de progreso de lectura y botón de volver arriba ---
  const barraProgreso = seleccionar('.progress');
  const botonSubir = seleccionar('#to-top');

  /** Actualiza la barra de progreso y muestra el botón de subir pasados 600 px. */
  function alDesplazar() {
    const documento = document.documentElement;
    const recorridoMaximo = documento.scrollHeight - documento.clientHeight;
    const avance = recorridoMaximo > 0 ? documento.scrollTop / recorridoMaximo : 0;
    barraProgreso.style.transform = `scaleX(${avance})`;
    botonSubir.classList.toggle('show', documento.scrollTop > 600);
  }
  window.addEventListener('scroll', alDesplazar, { passive: true });
  alDesplazar();
  botonSubir.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: reducirMovimiento ? 'auto' : 'smooth' });
  });

  // --- Aparición de elementos al llegar a ellos con el scroll ---
  // Si el navegador es muy viejo y no tiene IntersectionObserver, se muestran todos de una vez.
  const elementosAnimados = '.reveal, .bars';
  if ('IntersectionObserver' in window) {
    const observadorAparicion = new IntersectionObserver((entradas) => {
      entradas.forEach((entrada) => {
        if (entrada.isIntersecting) {
          entrada.target.classList.add('in');
          observadorAparicion.unobserve(entrada.target);
        }
      });
    }, { threshold: 0.12 });
    seleccionarTodos(elementosAnimados).forEach((elemento) => observadorAparicion.observe(elemento));
  } else {
    seleccionarTodos(elementosAnimados).forEach((elemento) => elemento.classList.add('in'));
  }

  // --- Navegación: resalta el enlace de la sección que se está leyendo ---
  const enlacesNav = seleccionarTodos('.nav nav a');
  const enlacePorSeccion = new Map(
    enlacesNav.map((enlace) => [enlace.getAttribute('href').slice(1), enlace])
  );
  if ('IntersectionObserver' in window) {
    const observadorSecciones = new IntersectionObserver((entradas) => {
      entradas.forEach((entrada) => {
        if (!entrada.isIntersecting) return;
        enlacesNav.forEach((enlace) => enlace.classList.remove('active'));
        const enlaceActual = enlacePorSeccion.get(entrada.target.id);
        if (enlaceActual) enlaceActual.classList.add('active');
      });
    }, { rootMargin: '-45% 0px -50% 0px' }); // la sección cuenta como "actual" al cruzar el centro de la pantalla
    enlacePorSeccion.forEach((_, idSeccion) => {
      const seccion = document.getElementById(idSeccion);
      if (seccion) observadorSecciones.observe(seccion);
    });
  }

  /* ==========================================================
     3. TERMINAL ANIMADA DEL INICIO
     Escribe una secuencia de comandos letra por letra y reinicia.
     ========================================================== */
  (function terminalDelInicio() {
    const terminalEl = seleccionar('#hero-term');
    if (!terminalEl) return;

    // Cada paso tiene el comando que se "teclea" y la respuesta que muestra Git
    const guion = [
      { comando: 'git switch -c fix/cinematicas', salida: "Switched to a new branch 'fix/cinematicas'" },
      { comando: 'git add .', salida: '' },
      { comando: 'git commit -m ":bug: fix: Videos optimizados"', salida: '[fix/cinematicas 0160fbc] :bug: fix: Videos optimizados' },
      { comando: 'git push -u origin fix/cinematicas', salida: 'Branch fix/cinematicas set up to track origin.' },
      { comando: '# ahora abres el Pull Request en GitHub', salida: '' }
    ];

    /** Devuelve el HTML de un paso ya terminado: comando más su respuesta. */
    const lineaCompleta = (paso) =>
      `<span class="p">$</span> ${escaparHtml(paso.comando)}\n` +
      (paso.salida ? `<span class="o">${escaparHtml(paso.salida)}</span>\n` : '');

    // Con "menos movimiento" se muestra todo de golpe, sin animación
    if (reducirMovimiento) {
      terminalEl.innerHTML = guion.map(lineaCompleta).join('');
      return;
    }

    let htmlAcumulado = '';
    let pasoActual = 0;

    /** Teclea el comando del paso actual y pasa al siguiente. */
    function escribirPaso() {
      if (pasoActual >= guion.length) {
        // Al terminar, espera un momento y vuelve a empezar
        setTimeout(() => {
          htmlAcumulado = '';
          pasoActual = 0;
          terminalEl.innerHTML = '';
          escribirPaso();
        }, 3500);
        return;
      }
      const paso = guion[pasoActual];
      const prompt = htmlAcumulado + '<span class="p">$</span> ';
      let letrasEscritas = 0;

      (function teclear() {
        terminalEl.innerHTML = `${prompt}${escaparHtml(paso.comando.slice(0, letrasEscritas))}<span class="c"></span>`;
        if (letrasEscritas++ < paso.comando.length) {
          setTimeout(teclear, 28 + Math.random() * 40); // velocidad irregular, como una persona
          return;
        }
        htmlAcumulado += lineaCompleta(paso);
        terminalEl.innerHTML = htmlAcumulado;
        pasoActual++;
        setTimeout(escribirPaso, 650);
      })();
    }
    escribirPaso();
  })();

  /* ==========================================================
     4. BUSCADOR DE COMANDOS DE GIT
     ========================================================== */
  const COMANDOS = [
    { comando: 'git init', descripcion: 'Crea un repositorio nuevo en la carpeta actual.', categoria: 'Inicio' },
    { comando: 'git clone <url>', descripcion: 'Descarga un repositorio remoto a tu computadora.', categoria: 'Inicio' },
    { comando: 'git config --global user.name "Nombre"', descripcion: 'Define tu nombre para firmar commits.', categoria: 'Inicio' },
    { comando: 'git config --global user.email "correo"', descripcion: 'Define tu correo para los commits.', categoria: 'Inicio' },
    { comando: 'git status', descripcion: 'Muestra qué archivos cambiaron y cuáles están listos para commit.', categoria: 'Día a día' },
    { comando: 'git add .', descripcion: 'Prepara todos los cambios para el siguiente commit.', categoria: 'Día a día' },
    { comando: 'git add <archivo>', descripcion: 'Prepara solo un archivo.', categoria: 'Día a día' },
    { comando: 'git commit -m "mensaje"', descripcion: 'Guarda una foto de lo preparado con un mensaje claro.', categoria: 'Día a día' },
    { comando: 'git diff', descripcion: 'Muestra línea por línea qué cambió y aún no se ha preparado.', categoria: 'Día a día' },
    { comando: 'git log --oneline --graph', descripcion: 'Historial compacto con dibujo de ramas.', categoria: 'Día a día' },
    { comando: 'git branch', descripcion: 'Lista tus ramas locales.', categoria: 'Ramas' },
    { comando: 'git switch -c <rama>', descripcion: 'Crea una rama nueva y te cambia a ella.', categoria: 'Ramas' },
    { comando: 'git switch <rama>', descripcion: 'Cambia a una rama existente.', categoria: 'Ramas' },
    { comando: 'git merge <rama>', descripcion: 'Fusiona esa rama en la que tienes activa.', categoria: 'Ramas' },
    { comando: 'git branch -d <rama>', descripcion: 'Borra una rama ya fusionada.', categoria: 'Ramas' },
    { comando: 'git tag v0.1.0', descripcion: 'Marca un commit como versión.', categoria: 'Ramas' },
    { comando: 'git remote add origin <url>', descripcion: 'Conecta tu repo local con uno en GitHub.', categoria: 'Remoto' },
    { comando: 'git push -u origin main', descripcion: 'Sube tu rama y recuerda el destino para las siguientes veces.', categoria: 'Remoto' },
    { comando: 'git push', descripcion: 'Sube tus commits nuevos.', categoria: 'Remoto' },
    { comando: 'git pull', descripcion: 'Trae y fusiona los cambios del remoto.', categoria: 'Remoto' },
    { comando: 'git fetch', descripcion: 'Trae información del remoto sin fusionar nada.', categoria: 'Remoto' },
    { comando: 'git restore <archivo>', descripcion: 'Descarta cambios sin guardar de un archivo.', categoria: 'Deshacer' },
    { comando: 'git restore --staged <archivo>', descripcion: 'Saca un archivo de los preparados (no borra tus cambios).', categoria: 'Deshacer' },
    { comando: 'git reset --soft HEAD~1', descripcion: 'Deshace el último commit conservando tus cambios.', categoria: 'Deshacer' },
    { comando: 'git revert <id>', descripcion: 'Crea un commit que cancela otro. Seguro para historial compartido.', categoria: 'Deshacer' },
    { comando: 'git merge --abort', descripcion: 'Cancela una fusión con conflictos y vuelve al estado anterior.', categoria: 'Deshacer' },
    { comando: 'git rm -r --cached .godot', descripcion: 'Deja de rastrear una carpeta sin borrarla del disco.', categoria: 'Deshacer' }
  ];

  const CATEGORIA_TODAS = 'Todos';
  const categorias = [CATEGORIA_TODAS, ...new Set(COMANDOS.map((item) => item.categoria))];
  const listaComandosEl = seleccionar('#cmd-list');
  const sinResultadosEl = seleccionar('#cmd-empty');
  const buscadorEl = seleccionar('#cmd-search');
  const filtrosEl = seleccionar('#cmd-chips');
  let categoriaActiva = CATEGORIA_TODAS;

  // Botones de filtro por categoría
  filtrosEl.innerHTML = categorias.map((categoria) =>
    `<button type="button" class="chip${categoria === categoriaActiva ? ' active' : ''}" data-cat="${escaparHtml(categoria)}">${escaparHtml(categoria)}</button>`
  ).join('');

  /** Dibuja la lista de comandos aplicando el texto buscado y la categoría elegida. */
  function mostrarComandos() {
    const textoBuscado = buscadorEl.value.trim().toLowerCase();
    const coincidencias = COMANDOS.filter((item) =>
      (categoriaActiva === CATEGORIA_TODAS || item.categoria === categoriaActiva) &&
      (!textoBuscado || `${item.comando} ${item.descripcion} ${item.categoria}`.toLowerCase().includes(textoBuscado))
    );
    listaComandosEl.innerHTML = coincidencias.map((item) =>
      `<button type="button" class="cmd" data-cmd="${escaparHtml(item.comando)}"><small>${escaparHtml(item.categoria)}</small><code>${escaparHtml(item.comando)}</code><span>${escaparHtml(item.descripcion)}</span></button>`
    ).join('');
    sinResultadosEl.hidden = coincidencias.length > 0;
  }

  filtrosEl.addEventListener('click', (evento) => {
    const filtro = evento.target.closest('.chip');
    if (!filtro) return;
    categoriaActiva = filtro.dataset.cat;
    seleccionarTodos('.chip', filtrosEl).forEach((otro) => otro.classList.toggle('active', otro === filtro));
    mostrarComandos();
  });
  buscadorEl.addEventListener('input', mostrarComandos);
  listaComandosEl.addEventListener('click', async (evento) => {
    const tarjeta = evento.target.closest('.cmd');
    if (!tarjeta) return;
    const copiado = await copiarTexto(tarjeta.dataset.cmd);
    mostrarAviso(copiado ? 'Comando copiado' : 'No se pudo copiar');
  });
  mostrarComandos();

  /* ==========================================================
     5. SIMULADOR DE RAMAS
     Dibuja un grafo de commits en SVG. Cada rama ocupa un "carril"
     (una fila horizontal) y cada commit es un círculo en ese carril.
     ========================================================== */
  (function simuladorDeRamas() {
    const grafoEl = seleccionar('#sim-graph');
    const registroEl = seleccionar('#sim-log');
    const ramasEl = seleccionar('#sim-branches');
    if (!grafoEl) return;

    const COLORES_CARRIL = ['#ff5a1f', '#ebe8e1', '#8fb89a', '#c9a96a'];
    const MAX_RAMAS = 4;
    const MAX_LINEAS_REGISTRO = 8;
    // Medidas del dibujo, en píxeles: margen lateral, separación entre commits (X) y entre carriles (Y),
    // margen inferior y alto de cada nivel de etiquetas
    const MARGEN_X = 44, SEPARACION_X = 58, SEPARACION_Y = 76, MARGEN_INFERIOR = 50, ALTO_ETIQUETA = 22;

    /**
     * estado.commits: lista de commits { id, padres: [ids], carril }
     * estado.ramas:   nombre de rama -> id del commit donde está apuntando
     * estado.orden:   nombres de las ramas, en el orden de sus carriles
     * estado.actual:  rama en la que estamos parados (HEAD)
     */
    let estado;
    let contadorRamas;
    let lineasRegistro;

    /** Genera un identificador corto parecido al de un commit real. */
    const generarId = () => Math.floor(Math.random() * 0xfffffff).toString(16).padStart(7, '0');

    /** Devuelve el número de carril (fila) que le toca a una rama. */
    const carrilDe = (nombreRama) => estado.orden.indexOf(nombreRama);

    /** True si el commit "idAncestro" ya forma parte del historial de "idDescendiente". */
    function esAncestro(idAncestro, idDescendiente) {
      const pendientes = [idDescendiente];
      const vistos = new Set();
      while (pendientes.length) {
        const id = pendientes.pop();
        if (id === idAncestro) return true;
        if (vistos.has(id)) continue;
        vistos.add(id);
        const commit = estado.commits.find((c) => c.id === id);
        pendientes.push(...commit.padres);
      }
      return false;
    }

    /** Agrega una línea al registro de la terminal simulada. */
    function agregarLineaRegistro(html) {
      lineasRegistro.push(html);
      if (lineasRegistro.length > MAX_LINEAS_REGISTRO) lineasRegistro.shift();
      registroEl.innerHTML = lineasRegistro.join('\n');
      registroEl.scrollTop = registroEl.scrollHeight;
    }
    const registrarComando = (comando) => agregarLineaRegistro(`<span class="p">$</span> ${escaparHtml(comando)}`);
    const registrarNota = (texto) => agregarLineaRegistro(`<span class="o">${escaparHtml(texto)}</span>`);

    /** Vuelve al estado inicial: una sola rama (main) con un commit. */
    function reiniciar() {
      const primerCommit = { id: generarId(), padres: [], carril: 0 };
      estado = { commits: [primerCommit], ramas: { main: primerCommit.id }, orden: ['main'], actual: 'main' };
      contadorRamas = 0;
      lineasRegistro = [];
      registrarComando('git init && git commit -m "Commit inicial"');
      dibujar();
    }

    /** git commit: agrega un commit al final de la rama actual. */
    function hacerCommit() {
      const commit = {
        id: generarId(),
        padres: [estado.ramas[estado.actual]],
        carril: carrilDe(estado.actual)
      };
      estado.commits.push(commit);
      estado.ramas[estado.actual] = commit.id;
      registrarComando(`git commit -m "cambio ${estado.commits.length - 1}"`);
      dibujar();
    }

    /** git switch -c: crea una rama nueva desde donde estamos y se cambia a ella. */
    function crearRama() {
      if (estado.orden.length >= MAX_RAMAS) {
        mostrarAviso(`Máximo ${MAX_RAMAS} ramas en el simulador`);
        return;
      }
      contadorRamas++;
      const nombre = `feature-${contadorRamas}`;
      estado.ramas[nombre] = estado.ramas[estado.actual];
      estado.orden.push(nombre);
      estado.actual = nombre;
      registrarComando(`git switch -c ${nombre}`);
      dibujar();
    }

    /** git switch: cambia a otra rama existente. */
    function cambiarARama(nombre) {
      if (nombre === estado.actual) return;
      estado.actual = nombre;
      registrarComando(`git switch ${nombre}`);
      dibujar();
    }

    /** git merge: fusiona la rama actual en main con un commit de dos padres. */
    function fusionarEnMain() {
      if (estado.actual === 'main') {
        registrarNota('# Cámbiate primero a una rama feature para fusionarla en main');
        mostrarAviso('Elige una rama feature');
        return;
      }
      const ramaOrigen = estado.actual;
      if (esAncestro(estado.ramas[ramaOrigen], estado.ramas.main)) {
        registrarComando(`git switch main && git merge ${ramaOrigen}`);
        registrarNota('Already up to date. (haz un commit en la rama antes de fusionar)');
        estado.actual = 'main';
        mostrarAviso('Esa rama no tiene commits nuevos');
        dibujar();
        return;
      }
      const commitFusion = {
        id: generarId(),
        padres: [estado.ramas.main, estado.ramas[ramaOrigen]],
        carril: 0
      };
      estado.commits.push(commitFusion);
      estado.ramas.main = commitFusion.id;
      estado.actual = 'main';
      registrarComando(`git switch main && git merge --no-ff ${ramaOrigen}`);
      dibujar();
    }

    /** Redibuja los botones de rama y el grafo SVG completo a partir del estado. */
    function dibujar() {
      // Botones de rama; data-carril permite colorear su borde desde el CSS
      ramasEl.innerHTML = estado.orden.map((nombre, carril) =>
        `<button type="button" class="chip${nombre === estado.actual ? ' active' : ''}" data-carril="${carril}" data-branch="${escaparHtml(nombre)}">${escaparHtml(nombre)}</button>`
      ).join('');

      const posicionDeCommit = new Map(estado.commits.map((commit, posicion) => [commit.id, posicion]));
      const xDe = (commit) => MARGEN_X + posicionDeCommit.get(commit.id) * SEPARACION_X;

      // 1) Etiquetas de rama: se decide primero en qué "nivel" (altura) va cada una.
      //    Si dos etiquetas del mismo carril se taparían, la segunda sube un nivel.
      const etiquetas = [];
      estado.orden.forEach((nombre, carril) => {
        const ultimoCommit = estado.commits[posicionDeCommit.get(estado.ramas[nombre])];
        const esActual = nombre === estado.actual;
        const texto = (esActual ? 'HEAD → ' : '') + nombre;
        const anchoEtiqueta = texto.length * 6.6 + 18;
        const x = xDe(ultimoCommit);
        const izquierda = x - anchoEtiqueta / 2;
        const derecha = x + anchoEtiqueta / 2;
        let nivel = 0;
        while (etiquetas.some((otra) =>
          otra.carrilDelCommit === ultimoCommit.carril && otra.nivel === nivel &&
          izquierda < otra.derecha + 6 && derecha > otra.izquierda - 6)) {
          nivel++;
        }
        etiquetas.push({ carril, carrilDelCommit: ultimoCommit.carril, texto, anchoEtiqueta, x, izquierda, derecha, nivel, esActual });
      });

      // El margen superior crece según los niveles de etiquetas que haya que apilar
      const nivelMaximo = Math.max(...etiquetas.map((etiqueta) => etiqueta.nivel));
      const margenY = 46 + nivelMaximo * ALTO_ETIQUETA;
      const coordenadas = (commit) => ({ x: xDe(commit), y: margenY + commit.carril * SEPARACION_Y });
      const ancho = Math.max(560, MARGEN_X * 2 + (estado.commits.length - 1) * SEPARACION_X + 40);
      // Solo se reserva espacio para los carriles que ya tienen commits
      const carrilMaximo = Math.max(...estado.commits.map((commit) => commit.carril));
      const alto = margenY + carrilMaximo * SEPARACION_Y + MARGEN_INFERIOR;

      let lineas = '', circulos = '', textoEtiquetas = '';

      // 2) Líneas que unen cada commit con su(s) padre(s)
      for (const commit of estado.commits) {
        const destino = coordenadas(commit);
        for (const idPadre of commit.padres) {
          const padre = estado.commits[posicionDeCommit.get(idPadre)];
          const origen = coordenadas(padre);
          if (origen.y === destino.y) {
            // Mismo carril: línea recta
            lineas += `<line x1="${origen.x}" y1="${origen.y}" x2="${destino.x}" y2="${destino.y}" stroke="${COLORES_CARRIL[commit.carril]}" stroke-width="3" stroke-linecap="round" opacity=".85"/>`;
          } else {
            // Cambia de carril (nueva rama o merge): curva suave
            const mitadX = (origen.x + destino.x) / 2;
            const color = COLORES_CARRIL[Math.max(padre.carril, commit.carril)];
            lineas += `<path d="M${origen.x},${origen.y} C${mitadX},${origen.y} ${mitadX},${destino.y} ${destino.x},${destino.y}" fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round" opacity=".85"/>`;
          }
        }
      }

      // 3) Círculos de los commits (los merges llevan un punto en el centro)
      for (const commit of estado.commits) {
        const { x, y } = coordenadas(commit);
        const color = COLORES_CARRIL[commit.carril];
        const esMerge = commit.padres.length > 1;
        circulos += `<g><circle cx="${x}" cy="${y}" r="${esMerge ? 11 : 9}" fill="#000" stroke="${color}" stroke-width="3"/>` +
          (esMerge ? `<circle cx="${x}" cy="${y}" r="4" fill="${color}"/>` : '') +
          `<text x="${x}" y="${y + 30}" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="10" fill="#86827a">${commit.id.slice(0, 5)}</text></g>`;
      }

      // 4) Dibujo de las etiquetas, ya con su nivel calculado
      for (const etiqueta of etiquetas) {
        const y = margenY + etiqueta.carrilDelCommit * SEPARACION_Y - 30 - etiqueta.nivel * ALTO_ETIQUETA;
        const color = COLORES_CARRIL[etiqueta.carril];
        textoEtiquetas += `<g><rect x="${etiqueta.izquierda}" y="${y - 12}" width="${etiqueta.anchoEtiqueta}" height="19" rx="9.5" fill="${etiqueta.esActual ? color : '#000'}" stroke="${color}" stroke-width="1.2"/>` +
          `<text x="${etiqueta.x}" y="${y + 1.5}" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="10.5" font-weight="600" fill="${etiqueta.esActual ? '#000' : color}">${escaparHtml(etiqueta.texto)}</text></g>`;
      }

      grafoEl.innerHTML = `<svg viewBox="0 0 ${ancho} ${alto}" width="${ancho}" height="${alto}" xmlns="http://www.w3.org/2000/svg">${lineas}${circulos}${textoEtiquetas}</svg>`;
      // Mantiene visible el commit más reciente cuando el grafo crece hacia la derecha
      const contenedor = grafoEl.parentElement;
      contenedor.scrollLeft = contenedor.scrollWidth;
    }

    seleccionar('#sim-commit').addEventListener('click', hacerCommit);
    seleccionar('#sim-branch').addEventListener('click', crearRama);
    seleccionar('#sim-merge').addEventListener('click', fusionarEnMain);
    seleccionar('#sim-reset').addEventListener('click', reiniciar);
    ramasEl.addEventListener('click', (evento) => {
      const boton = evento.target.closest('[data-branch]');
      if (boton) cambiarARama(boton.dataset.branch);
    });
    reiniciar();
  })();

  /* ==========================================================
     6. PESTAÑAS (.gitignore / .gitattributes)
     ========================================================== */
  seleccionarTodos('.tab').forEach((pestana) => {
    pestana.addEventListener('click', () => {
      // Marca como activa solo la pestaña pulsada
      seleccionarTodos('.tab').forEach((otra) => {
        otra.classList.toggle('active', otra === pestana);
        otra.setAttribute('aria-selected', String(otra === pestana));
      });
      // Muestra solo el panel que corresponde a esa pestaña
      seleccionarTodos('.tabpanel').forEach((panel) => {
        const esElPanel = panel.id === `tab-${pestana.dataset.tab}`;
        panel.classList.toggle('active', esElPanel);
        panel.hidden = !esElPanel;
      });
    });
  });

  /* ==========================================================
     7. CHECKLIST DE PROGRESO
     Guarda lo marcado en localStorage para que no se pierda al recargar.
     ========================================================== */
  (function checklist() {
    const CLAVE_ALMACENAMIENTO = 'fora-commit-checklist-v1';
    const casillas = seleccionarTodos('#checklist-items input[type="checkbox"]');
    const porcentajeEl = seleccionar('#check-pct');
    const barraEl = seleccionar('#check-bar');

    // Recupera lo guardado. Si localStorage no está disponible, empieza vacío.
    let guardado = {};
    try { guardado = JSON.parse(localStorage.getItem(CLAVE_ALMACENAMIENTO) || '{}') || {}; } catch (_) { guardado = {}; }
    casillas.forEach((casilla) => { casilla.checked = Boolean(guardado[casilla.dataset.key]); });

    /**
     * Recalcula el porcentaje y actualiza la barra.
     * @param {boolean} guardar si es true, también guarda el estado en localStorage.
     * @returns {number} porcentaje completado (0 a 100).
     */
    function actualizar(guardar) {
      const hechas = casillas.filter((casilla) => casilla.checked).length;
      const porcentaje = Math.round((hechas / casillas.length) * 100);
      porcentajeEl.textContent = `${porcentaje}%`;
      barraEl.style.width = `${porcentaje}%`;
      if (guardar) {
        const estadoCasillas = {};
        casillas.forEach((casilla) => { estadoCasillas[casilla.dataset.key] = casilla.checked; });
        try { localStorage.setItem(CLAVE_ALMACENAMIENTO, JSON.stringify(estadoCasillas)); } catch (_) { /* almacenamiento no disponible */ }
      }
      return porcentaje;
    }

    casillas.forEach((casilla) => casilla.addEventListener('change', () => {
      if (actualizar(true) === 100 && casilla.checked) mostrarAviso('Ruta completa');
    }));
    seleccionar('#check-reset').addEventListener('click', () => {
      casillas.forEach((casilla) => { casilla.checked = false; });
      actualizar(true);
    });
    actualizar(false);
  })();
})();