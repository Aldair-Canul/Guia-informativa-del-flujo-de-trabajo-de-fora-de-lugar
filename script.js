/* ==========================================================
   fora/commit — interactividad en JavaScript puro
   ========================================================== */
(() => {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.documentElement.classList.add('js');
  const esc = (s) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ---------- Toast ---------- */
  const toastEl = $('#toast');
  let toastTimer;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), 1800);
  }

  /* ---------- Copiar al portapapeles ---------- */
  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (_) {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      let ok = false;
      try { ok = document.execCommand('copy'); } catch (_) { /* sin soporte */ }
      ta.remove();
      return ok;
    }
  }

  $$('.code .copy').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const code = $('code', btn.parentElement).innerText;
      const ok = await copyText(code);
      btn.textContent = ok ? '¡Copiado!' : 'Error';
      btn.classList.toggle('ok', ok);
      setTimeout(() => { btn.textContent = 'Copiar'; btn.classList.remove('ok'); }, 1500);
    });
  });

  /* ---------- Barra de progreso, volver arriba ---------- */
  const bar = $('.progress');
  const toTop = $('#to-top');
  function onScroll() {
    const h = document.documentElement;
    const max = h.scrollHeight - h.clientHeight;
    bar.style.transform = `scaleX(${max > 0 ? h.scrollTop / max : 0})`;
    toTop.classList.toggle('show', h.scrollTop > 600);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }));

  /* ---------- Aparición al hacer scroll ---------- */
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12 });
    $$('.reveal, .bars').forEach((el) => io.observe(el));
  } else {
    $$('.reveal, .bars').forEach((el) => el.classList.add('in'));
  }

  /* ---------- Navegación: sección activa ---------- */
  const navLinks = $$('.nav nav a');
  const sectionMap = new Map(navLinks.map((a) => [a.getAttribute('href').slice(1), a]));
  if ('IntersectionObserver' in window) {
    const so = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          navLinks.forEach((a) => a.classList.remove('active'));
          const link = sectionMap.get(e.target.id);
          if (link) link.classList.add('active');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sectionMap.forEach((_, id) => { const s = document.getElementById(id); if (s) so.observe(s); });
  }

  /* ---------- Hero: terminal que "escribe" ---------- */
  (function heroTerminal() {
    const el = $('#hero-term');
    if (!el) return;
    const script = [
      { t: 'git switch -c fix/cinematicas', out: "Switched to a new branch 'fix/cinematicas'" },
      { t: 'git add .', out: '' },
      { t: 'git commit -m ":bug: fix: Videos optimizados"', out: '[fix/cinematicas 0160fbc] :bug: fix: Videos optimizados' },
      { t: 'git push -u origin fix/cinematicas', out: 'Branch fix/cinematicas set up to track origin.' },
      { t: '# ahora abres el Pull Request en GitHub', out: '' }
    ];
    if (reduceMotion) {
      el.innerHTML = script.map((s) => `<span class="p">$</span> ${esc(s.t)}\n${s.out ? `<span class="o">${esc(s.out)}</span>\n` : ''}`).join('');
      return;
    }
    let html = '';
    let line = 0;
    function typeLine() {
      if (line >= script.length) {
        setTimeout(() => { html = ''; line = 0; el.innerHTML = ''; typeLine(); }, 3500);
        return;
      }
      const { t, out } = script[line];
      let i = 0;
      const base = html + '<span class="p">$</span> ';
      (function tick() {
        el.innerHTML = `${base}${esc(t.slice(0, i))}<span class="c"></span>`;
        if (i++ < t.length) { setTimeout(tick, 28 + Math.random() * 40); return; }
        html = `${base}${esc(t)}\n${out ? `<span class="o">${esc(out)}</span>\n` : ''}`;
        el.innerHTML = html;
        line++;
        setTimeout(typeLine, 650);
      })();
    }
    typeLine();
  })();

  /* ---------- Comandos: búsqueda y filtros ---------- */
  const COMMANDS = [
    { cmd: 'git init', desc: 'Crea un repositorio nuevo en la carpeta actual.', cat: 'Inicio' },
    { cmd: 'git clone <url>', desc: 'Descarga un repositorio remoto a tu computadora.', cat: 'Inicio' },
    { cmd: 'git config --global user.name "Nombre"', desc: 'Define tu nombre para firmar commits.', cat: 'Inicio' },
    { cmd: 'git config --global user.email "correo"', desc: 'Define tu correo para los commits.', cat: 'Inicio' },
    { cmd: 'git status', desc: 'Muestra qué archivos cambiaron y cuáles están listos para commit.', cat: 'Día a día' },
    { cmd: 'git add .', desc: 'Prepara todos los cambios para el siguiente commit.', cat: 'Día a día' },
    { cmd: 'git add <archivo>', desc: 'Prepara solo un archivo.', cat: 'Día a día' },
    { cmd: 'git commit -m "mensaje"', desc: 'Guarda una foto de lo preparado con un mensaje claro.', cat: 'Día a día' },
    { cmd: 'git diff', desc: 'Muestra línea por línea qué cambió y aún no se ha preparado.', cat: 'Día a día' },
    { cmd: 'git log --oneline --graph', desc: 'Historial compacto con dibujo de ramas.', cat: 'Día a día' },
    { cmd: 'git branch', desc: 'Lista tus ramas locales.', cat: 'Ramas' },
    { cmd: 'git switch -c <rama>', desc: 'Crea una rama nueva y te cambia a ella.', cat: 'Ramas' },
    { cmd: 'git switch <rama>', desc: 'Cambia a una rama existente.', cat: 'Ramas' },
    { cmd: 'git merge <rama>', desc: 'Fusiona esa rama en la que tienes activa.', cat: 'Ramas' },
    { cmd: 'git branch -d <rama>', desc: 'Borra una rama ya fusionada.', cat: 'Ramas' },
    { cmd: 'git tag v0.1.0', desc: 'Marca un commit como versión.', cat: 'Ramas' },
    { cmd: 'git remote add origin <url>', desc: 'Conecta tu repo local con uno en GitHub.', cat: 'Remoto' },
    { cmd: 'git push -u origin main', desc: 'Sube tu rama y recuerda el destino para siguientes veces.', cat: 'Remoto' },
    { cmd: 'git push', desc: 'Sube tus commits nuevos.', cat: 'Remoto' },
    { cmd: 'git pull', desc: 'Trae y fusiona los cambios del remoto.', cat: 'Remoto' },
    { cmd: 'git fetch', desc: 'Trae información del remoto sin fusionar nada.', cat: 'Remoto' },
    { cmd: 'git restore <archivo>', desc: 'Descarta cambios sin guardar de un archivo.', cat: 'Deshacer' },
    { cmd: 'git restore --staged <archivo>', desc: 'Saca un archivo de los preparados (no borra tus cambios).', cat: 'Deshacer' },
    { cmd: 'git reset --soft HEAD~1', desc: 'Deshace el último commit conservando tus cambios.', cat: 'Deshacer' },
    { cmd: 'git revert <id>', desc: 'Crea un commit que cancela otro. Seguro para historial compartido.', cat: 'Deshacer' },
    { cmd: 'git merge --abort', desc: 'Cancela una fusión con conflictos y vuelve al estado anterior.', cat: 'Deshacer' },
    { cmd: 'git rm -r --cached .godot', desc: 'Deja de rastrear una carpeta sin borrarla del disco.', cat: 'Deshacer' }
  ];
  const cats = ['Todos', ...new Set(COMMANDS.map((c) => c.cat))];
  const listEl = $('#cmd-list');
  const emptyEl = $('#cmd-empty');
  const searchEl = $('#cmd-search');
  const chipsEl = $('#cmd-chips');
  let activeCat = 'Todos';

  chipsEl.innerHTML = cats.map((c) => `<button type="button" class="chip${c === activeCat ? ' active' : ''}" data-cat="${esc(c)}">${esc(c)}</button>`).join('');

  function renderCommands() {
    const q = searchEl.value.trim().toLowerCase();
    const rows = COMMANDS.filter((c) =>
      (activeCat === 'Todos' || c.cat === activeCat) &&
      (!q || `${c.cmd} ${c.desc} ${c.cat}`.toLowerCase().includes(q))
    );
    listEl.innerHTML = rows.map((c) =>
      `<button type="button" class="cmd" data-cmd="${esc(c.cmd)}"><small>${esc(c.cat)}</small><code>${esc(c.cmd)}</code><span>${esc(c.desc)}</span></button>`
    ).join('');
    emptyEl.hidden = rows.length > 0;
  }
  chipsEl.addEventListener('click', (e) => {
    const b = e.target.closest('.chip');
    if (!b) return;
    activeCat = b.dataset.cat;
    $$('.chip', chipsEl).forEach((x) => x.classList.toggle('active', x === b));
    renderCommands();
  });
  searchEl.addEventListener('input', renderCommands);
  listEl.addEventListener('click', async (e) => {
    const b = e.target.closest('.cmd');
    if (!b) return;
    toast((await copyText(b.dataset.cmd)) ? 'Comando copiado' : 'No se pudo copiar');
  });
  renderCommands();

  /* ---------- Simulador de ramas ---------- */
  (function simulator() {
    const graphEl = $('#sim-graph');
    const logEl = $('#sim-log');
    const branchesEl = $('#sim-branches');
    if (!graphEl) return;

    const LANE_COLORS = ['#ff5a1f', '#ebe8e1', '#8fb89a', '#c9a96a'];
    const MAX_BRANCHES = 4;
    const X0 = 44, DX = 58, Y0 = 56, DY = 56;
    let sim, featureCount, logLines;

    const hex = () => Math.floor(Math.random() * 0xfffffff).toString(16).padStart(7, '0');
    const lane = (name) => sim.order.indexOf(name);

    function say(cmd) {
      logLines.push(`<span class="p">$</span> ${esc(cmd)}`);
      if (logLines.length > 8) logLines.shift();
      logEl.innerHTML = logLines.join('\n');
      logEl.scrollTop = logEl.scrollHeight;
    }
    function note(text) {
      logLines.push(`<span class="o">${esc(text)}</span>`);
      if (logLines.length > 8) logLines.shift();
      logEl.innerHTML = logLines.join('\n');
      logEl.scrollTop = logEl.scrollHeight;
    }

    function reset() {
      const first = { id: hex(), parents: [], lane: 0 };
      sim = { commits: [first], branches: { main: first.id }, order: ['main'], current: 'main' };
      featureCount = 0;
      logLines = [];
      say('git init && git commit -m "Commit inicial"');
      render();
    }

    function addCommit() {
      const c = { id: hex(), parents: [sim.branches[sim.current]], lane: lane(sim.current) };
      sim.commits.push(c);
      sim.branches[sim.current] = c.id;
      say(`git commit -m "cambio ${sim.commits.length - 1}"`);
      render();
    }

    function addBranch() {
      if (sim.order.length >= MAX_BRANCHES) { toast('Máximo 4 ramas en el simulador'); return; }
      featureCount++;
      const name = `feature-${featureCount}`;
      sim.branches[name] = sim.branches[sim.current];
      sim.order.push(name);
      sim.current = name;
      say(`git switch -c ${name}`);
      render();
    }

    function switchTo(name) {
      if (name === sim.current) return;
      sim.current = name;
      say(`git switch ${name}`);
      render();
    }

    function mergeToMain() {
      if (sim.current === 'main') {
        note('# Cámbiate primero a una rama feature para fusionarla en main');
        toast('Elige una rama feature');
        return;
      }
      const from = sim.current;
      const c = { id: hex(), parents: [sim.branches.main, sim.branches[from]], lane: 0 };
      sim.commits.push(c);
      sim.branches.main = c.id;
      sim.current = 'main';
      say(`git switch main && git merge --no-ff ${from}`);
      render();
    }

    function render() {
      // chips de ramas
      branchesEl.innerHTML = sim.order.map((b, i) =>
        `<button type="button" class="chip${b === sim.current ? ' active' : ''}" data-branch="${esc(b)}" style="${b === sim.current ? '' : `border-color:${LANE_COLORS[i]}55`}">${esc(b)}</button>`
      ).join('');

      const idx = new Map(sim.commits.map((c, i) => [c.id, i]));
      const pos = (c) => ({ x: X0 + idx.get(c.id) * DX, y: Y0 + c.lane * DY });
      const width = Math.max(560, X0 * 2 + (sim.commits.length - 1) * DX + 40);
      const height = Y0 + (MAX_BRANCHES - 1) * DY + 40;

      let edges = '', nodes = '', labels = '';
      for (const c of sim.commits) {
        const p = pos(c);
        for (const pid of c.parents) {
          const parent = sim.commits[idx.get(pid)];
          const q = pos(parent);
          const color = LANE_COLORS[c.lane];
          if (q.y === p.y) {
            edges += `<line x1="${q.x}" y1="${q.y}" x2="${p.x}" y2="${p.y}" stroke="${color}" stroke-width="3" stroke-linecap="round" opacity=".85"/>`;
          } else {
            const mx = (q.x + p.x) / 2;
            const edgeColor = LANE_COLORS[Math.max(parent.lane, c.lane)];
            edges += `<path d="M${q.x},${q.y} C${mx},${q.y} ${mx},${p.y} ${p.x},${p.y}" fill="none" stroke="${edgeColor}" stroke-width="3" stroke-linecap="round" opacity=".85"/>`;
          }
        }
      }
      for (const c of sim.commits) {
        const p = pos(c);
        const color = LANE_COLORS[c.lane];
        const merge = c.parents.length > 1;
        nodes += `<g><circle cx="${p.x}" cy="${p.y}" r="${merge ? 11 : 9}" fill="#000" stroke="${color}" stroke-width="3"/>` +
          (merge ? `<circle cx="${p.x}" cy="${p.y}" r="4" fill="${color}"/>` : '') +
          `<text x="${p.x}" y="${p.y + 30}" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="10" fill="#86827a">${c.id.slice(0, 5)}</text></g>`;
      }
      const stack = {};
      sim.order.forEach((b, i) => {
        const head = sim.commits[idx.get(sim.branches[b])];
        const p = pos(head);
        const k = stack[head.id] = (stack[head.id] || 0);
        stack[head.id]++;
        const isCur = b === sim.current;
        const text = (isCur ? 'HEAD → ' : '') + b;
        const w = text.length * 6.6 + 18;
        const y = p.y - 30 - k * 22;
        labels += `<g><rect x="${p.x - w / 2}" y="${y - 12}" width="${w}" height="19" rx="9.5" fill="${isCur ? LANE_COLORS[i] : '#000'}" stroke="${LANE_COLORS[i]}" stroke-width="1.2"/>` +
          `<text x="${p.x}" y="${y + 1.5}" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="10.5" font-weight="600" fill="${isCur ? '#000' : LANE_COLORS[i]}">${esc(text)}</text></g>`;
      });

      graphEl.innerHTML = `<svg viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">${edges}${nodes}${labels}</svg>`;
      const wrap = graphEl.parentElement;
      wrap.scrollLeft = wrap.scrollWidth;
    }

    $('#sim-commit').addEventListener('click', addCommit);
    $('#sim-branch').addEventListener('click', addBranch);
    $('#sim-merge').addEventListener('click', mergeToMain);
    $('#sim-reset').addEventListener('click', reset);
    branchesEl.addEventListener('click', (e) => {
      const b = e.target.closest('[data-branch]');
      if (b) switchTo(b.dataset.branch);
    });
    reset();
  })();

  /* ---------- Pestañas (.gitignore / .gitattributes) ---------- */
  $$('.tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      $$('.tab').forEach((t) => { t.classList.toggle('active', t === tab); t.setAttribute('aria-selected', String(t === tab)); });
      $$('.tabpanel').forEach((p) => {
        const on = p.id === `tab-${tab.dataset.tab}`;
        p.classList.toggle('active', on);
        p.hidden = !on;
      });
    });
  });

  /* ---------- Checklist con localStorage ---------- */
  (function checklist() {
    const KEY = 'fora-commit-checklist-v1';
    const boxes = $$('#checklist-items input[type="checkbox"]');
    const pctEl = $('#check-pct');
    const barEl = $('#check-bar');

    let saved = {};
    try { saved = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (_) { saved = {}; }
    boxes.forEach((b) => { b.checked = !!saved[b.dataset.key]; });

    function update(persist) {
      const done = boxes.filter((b) => b.checked).length;
      const pct = Math.round((done / boxes.length) * 100);
      pctEl.textContent = `${pct}%`;
      barEl.style.width = `${pct}%`;
      if (persist) {
        const state = {};
        boxes.forEach((b) => { state[b.dataset.key] = b.checked; });
        try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (_) { /* almacenamiento no disponible */ }
      }
      return pct;
    }
    boxes.forEach((b) => b.addEventListener('change', () => {
      if (update(true) === 100 && b.checked) toast('Ruta completa');
    }));
    $('#check-reset').addEventListener('click', () => {
      boxes.forEach((b) => { b.checked = false; });
      update(true);
    });
    update(false);
  })();
})();