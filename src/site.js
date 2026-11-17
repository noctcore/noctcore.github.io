// noctcore.github.io: theme switch, copy buttons and the drawing set.
(() => {
  const doc = document.documentElement;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const store = {
    get: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
    set: (k, v) => { try { v ? localStorage.setItem(k, v) : localStorage.removeItem(k); } catch { /* storage blocked */ } },
  };

  /* Theme: auto, light, dark. */
  const toggle = document.querySelector('[data-theme-toggle]');
  const modes = ['auto', 'light', 'dark'];
  const labels = { auto: 'Auto', light: 'Light', dark: 'Dark' };
  const applyTheme = (mode) => {
    if (mode === 'auto') delete doc.dataset.theme; else doc.dataset.theme = mode;
    if (toggle) {
      toggle.dataset.mode = mode;
      toggle.querySelector('.theme-label').textContent = labels[mode];
      toggle.setAttribute('aria-label', `Colour theme: ${mode === 'auto' ? 'system' : mode}. Change theme`);
    }
  };
  let mode = store.get('nc-theme') || 'auto';
  applyTheme(mode);
  toggle?.addEventListener('click', () => {
    mode = modes[(modes.indexOf(mode) + 1) % modes.length];
    store.set('nc-theme', mode === 'auto' ? '' : mode);
    applyTheme(mode);
  });

  /* Copy buttons. */
  document.addEventListener('click', async (event) => {
    const button = event.target.closest('.copy');
    if (!button) return;
    const value = button.dataset.copy;
    try {
      await navigator.clipboard.writeText(value);
      button.textContent = 'Copied';
    } catch {
      const range = document.createRange();
      range.selectNodeContents(button.previousElementSibling);
      const selection = getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      button.textContent = 'Selected';
    }
    button.classList.add('is-done');
    setTimeout(() => { button.textContent = 'Copy'; button.classList.remove('is-done'); }, 1800);
  });

  /* The drawing set. */
  const set = document.querySelector('[data-set]');
  if (!set) return;
  const sheets = [...set.querySelectorAll('.sheet')];
  const tabs = [...set.querySelectorAll('.tab')];
  const frame = set.querySelector('.sheetframe');
  set.style.setProperty('--sheets', sheets.length);
  let current = -1;

  const show = (index) => {
    if (index === current && sheets[index].classList.contains('is-on')) return;
    current = index;
    sheets.forEach((sheet, i) => {
      sheet.classList.toggle('is-on', i === index);
      sheet.setAttribute('aria-hidden', String(i !== index));
      sheet.toggleAttribute('inert', i !== index);
    });
    tabs.forEach((tab, i) => {
      tab.setAttribute('aria-selected', String(i === index));
      tab.tabIndex = i === index ? 0 : -1;
    });
    flow.reset();
  };

  /* Scroll-driven on wide, tall screens; plain tabs everywhere else. */
  const scrubQuery = window.matchMedia('(min-width: 1101px) and (min-height: 700px)');
  const scrubbing = () => scrubQuery.matches && !reduce.matches;
  const setMode = () => {
    set.classList.toggle('is-scrub', scrubbing());
    onScroll();
  };
  const progress = () => {
    const rect = set.getBoundingClientRect();
    const span = set.offsetHeight - frame.offsetHeight - 40;
    return Math.min(1, Math.max(0, -rect.top / Math.max(1, span)));
  };
  let ticking = false;
  function onScroll() {
    if (!set.classList.contains('is-scrub') || ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      const p = progress();
      frame.style.setProperty('--p', p.toFixed(4));
      show(Math.min(sheets.length - 1, Math.floor(p * sheets.length * 0.999)));
    });
  }
  const scrollToSheet = (index) => {
    if (!set.classList.contains('is-scrub')) return show(index);
    const span = set.offsetHeight - frame.offsetHeight - 40;
    const top = set.getBoundingClientRect().top + scrollY + span * ((index + 0.5) / sheets.length);
    window.scrollTo({ top, behavior: reduce.matches ? 'auto' : 'smooth' });
    show(index);
  };
  tabs.forEach((tab, i) => {
    tab.addEventListener('click', (event) => { event.preventDefault(); scrollToSheet(i); });
    tab.addEventListener('keydown', (event) => {
      const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
      if (!step) return;
      event.preventDefault();
      const next = (i + step + tabs.length) % tabs.length;
      scrollToSheet(next);
      tabs[next].focus();
    });
  });
  addEventListener('scroll', onScroll, { passive: true });
  scrubQuery.addEventListener('change', setMode);
  reduce.addEventListener('change', setMode);

  /* Focus a gate from the title block or from the drawing itself. */
  sheets.forEach((sheet) => {
    const draws = sheet.querySelectorAll('.draw');
    const items = sheet.querySelectorAll('.gate');
    const focus = (gate) => {
      draws.forEach((d) => (gate == null ? d.removeAttribute('data-focus') : d.setAttribute('data-focus', gate)));
      items.forEach((it) => it.classList.toggle('is-hot', gate != null && it.dataset.gate === String(gate)));
    };
    items.forEach((it) => {
      it.addEventListener('mouseenter', () => focus(it.dataset.gate));
      it.addEventListener('focus', () => focus(it.dataset.gate));
      it.addEventListener('mouseleave', () => focus(null));
      it.addEventListener('blur', () => focus(null));
    });
    sheet.querySelectorAll('.d-block, .d-name').forEach((el) => {
      el.addEventListener('mouseenter', () => focus(el.dataset.gate));
      el.addEventListener('mouseleave', () => focus(null));
    });
  });

  /*
   * Work in flight: small squares travel the route of the sheet on screen.
   * Now and then one is held at a step that stops something; it turns copper
   * at the block and that step's leader marches. Paused off screen, in a
   * hidden tab and under reduced motion.
   */
  const NS = 'http://www.w3.org/2000/svg';
  const flow = (() => {
    let tokens = [];
    let last = 0;
    let spawnAt = 0;
    let count = 0;
    let visible = false;
    let raf = 0;
    const layer = () => {
      const sheet = sheets[current];
      const svg = [...sheet.querySelectorAll('.draw')].find((d) => d.getClientRects().length);
      return svg?.querySelector('.d-tokens') ?? null;
    };
    const clear = () => { tokens.forEach((t) => t.el.remove()); tokens = []; };
    const spawn = (g, now) => {
      const [x0, y0, x1, y1] = g.dataset.route.split(',').map(Number);
      const gates = g.dataset.gates.split(',').map(Number);
      const sizes = g.dataset.sizes.split(',').map(Number);
      const stops = g.dataset.stops.split(',').map(Number);
      const stopping = stops.map((s, i) => (s ? i : -1)).filter((i) => i >= 0);
      let holdAt = -1;
      count += 1;
      if (stopping.length && count % 3 === 0) holdAt = stopping[(count / 3) % stopping.length];
      const el = document.createElementNS(NS, 'rect');
      el.setAttribute('class', 'tok');
      el.setAttribute('width', '12');
      el.setAttribute('height', '12');
      el.setAttribute('x', '-6');
      el.setAttribute('y', '-6');
      g.appendChild(el);
      const angle = (Math.atan2(y1 - y0, x1 - x0) * 180) / Math.PI;
      const endX = holdAt >= 0 ? gates[holdAt] - sizes[holdAt] * 0.42 : x1;
      tokens.push({ el, g, x0, y0, x1, y1, angle, x: x0, endX, holdAt, start: now, held: 0 });
    };
    const frameFn = (now) => {
      raf = 0;
      if (!visible || document.hidden || reduce.matches) return;
      const g = layer();
      if (!g) return;
      const dt = Math.min(64, now - (last || now));
      last = now;
      if (now >= spawnAt && sheets[current].classList.contains('is-on') && sheets[current].dataset.form === 'passage') {
        spawn(g, now);
        spawnAt = now + 1500;
      }
      const speed = 0.16; // drawing units per millisecond
      tokens = tokens.filter((t) => {
        if (t.held) {
          if (now - t.held > 1100) { t.el.remove(); return false; }
          t.el.style.opacity = String(Math.max(0, 1 - (now - t.held - 500) / 600));
          return true;
        }
        t.x = Math.min(t.endX, t.x + speed * dt);
        const y = t.y0 + ((t.y1 - t.y0) * (t.x - t.x0)) / (t.x1 - t.x0);
        t.el.setAttribute('transform', `translate(${t.x.toFixed(1)} ${y.toFixed(1)}) rotate(${t.angle.toFixed(1)})`);
        if (t.x >= t.endX) {
          if (t.holdAt < 0) { t.el.remove(); return false; }
          t.held = now;
          t.el.classList.add('is-stopped');
          const sheet = sheets[current];
          sheet.querySelectorAll(`.d-branch[data-gate="${t.holdAt}"], .d-label[data-gate="${t.holdAt}"]`).forEach((el) => {
            el.classList.remove('is-hit');
            void el.getBoundingClientRect();
            el.classList.add('is-hit');
            setTimeout(() => el.classList.remove('is-hit'), 1900);
          });
        }
        return true;
      });
      raf = requestAnimationFrame(frameFn);
    };
    const run = () => { if (!raf && visible && !document.hidden && !reduce.matches) { last = 0; raf = requestAnimationFrame(frameFn); } };
    const io = new IntersectionObserver((entries) => {
      visible = entries.some((e) => e.isIntersecting);
      if (visible) run(); else if (raf) { cancelAnimationFrame(raf); raf = 0; }
    });
    io.observe(frame);
    document.addEventListener('visibilitychange', run);
    return {
      reset() { clear(); count = 0; spawnAt = performance.now() + 1300; run(); },
    };
  })();

  show(0);
  setMode();
})();
