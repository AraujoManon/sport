// Petits graphiques SVG sans dépendance : courbes (axe temps) et barres.
// Règles : traits 2px, points ≥ 8px avec anneau, grille fine, info-bulle au toucher,
// tableau des valeurs pour ne jamais dépendre de la couleur ni du survol.
const Charts = (() => {
  const NS = 'http://www.w3.org/2000/svg';
  const el = (tag, attrs = {}, parent) => {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  };
  const fmtNum = (v, d = 1) => (Math.round(v * 10 ** d) / 10 ** d).toLocaleString('fr-FR');
  const dayMs = 864e5;
  const parse = s => new Date(s + 'T12:00:00').getTime();
  const shortDate = t => new Date(t).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });

  function niceTicks(min, max, count = 4) {
    if (min === max) { min -= 1; max += 1; }
    const span = max - min;
    const step0 = span / count;
    const mag = 10 ** Math.floor(Math.log10(step0));
    const step = [1, 2, 2.5, 5, 10].map(m => m * mag).find(s => s >= step0);
    const lo = Math.floor(min / step) * step, hi = Math.ceil(max / step) * step;
    const ticks = [];
    for (let v = lo; v <= hi + step / 2; v += step) ticks.push(+v.toFixed(6));
    return ticks;
  }

  function frame(container, height) {
    container.innerHTML = '';
    container.classList.add('chart');
    const W = Math.max(280, container.clientWidth || 320), H = height;
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img' }, container);
    const tip = document.createElement('div');
    tip.className = 'tooltip'; tip.hidden = true;
    container.appendChild(tip);
    return { svg, tip, W, H };
  }

  function table(container, head, rows) {
    const d = document.createElement('details');
    d.className = 'table-toggle';
    const s = document.createElement('summary');
    s.textContent = 'Voir les valeurs';
    d.appendChild(s);
    const t = document.createElement('table');
    const tr0 = t.insertRow();
    head.forEach(h => { const c = tr0.insertCell(); c.textContent = h; c.style.color = 'var(--muted)'; });
    rows.slice().reverse().forEach(r => { const tr = t.insertRow(); r.forEach(v => { tr.insertCell().textContent = v; }); });
    d.appendChild(t);
    container.appendChild(d);
  }

  function legend(container, items) {
    const lg = document.createElement('div');
    lg.className = 'chart-legend';
    items.forEach(it => {
      const s = document.createElement('span');
      const k = document.createElement('i');
      k.className = it.dot ? 'kd' : 'k';
      k.style.background = it.color;
      s.append(k, document.createTextNode(it.name));
      lg.appendChild(s);
    });
    container.appendChild(lg);
  }

  /**
   * Courbe sur axe temps.
   * opts: { series:[{name,color,points:[{date:'YYYY-MM-DD',y}],line=true,dots=false,area=false}],
   *         goal:{y,label}, unit:'kg', decimals:1, height:200, title }
   */
  function line(container, opts) {
    const series = opts.series.filter(s => s.points.length);
    const all = series.flatMap(s => s.points);
    if (all.length < 2) {
      container.innerHTML = `<p class="empty">${opts.empty || 'Il faut au moins deux mesures pour tracer la courbe.'}</p>`;
      return;
    }
    const dec = opts.decimals ?? 1, unit = opts.unit || '';
    container.innerHTML = '';
    if (series.length > 1) legend(container, series.map(s => ({ name: s.name, color: s.color, dot: !s.line })));
    const holder = document.createElement('div');
    container.appendChild(holder);
    const { svg, tip, W, H } = frame(holder, opts.height || 200);
    svg.setAttribute('aria-label', opts.title || series.map(s => s.name).join(', '));
    const pad = { l: 36, r: 46, t: 12, b: 24 };
    const xs = all.map(p => parse(p.date));
    const x0 = Math.min(...xs), x1 = Math.max(...xs) === x0 ? x0 + dayMs : Math.max(...xs);
    let ys = all.map(p => p.y);
    if (opts.goal) ys = ys.concat(opts.goal.y);
    const ticks = niceTicks(Math.min(...ys), Math.max(...ys), 4);
    const y0 = ticks[0], y1 = ticks[ticks.length - 1];
    const X = t => pad.l + (t - x0) / (x1 - x0) * (W - pad.l - pad.r);
    const Y = v => H - pad.b - (v - y0) / (y1 - y0) * (H - pad.t - pad.b);

    ticks.forEach(v => {
      el('line', { class: 'grid', x1: pad.l, x2: W - pad.r, y1: Y(v), y2: Y(v) }, svg);
      el('text', { class: 'axis', x: pad.l - 6, y: Y(v) + 4, 'text-anchor': 'end' }, svg).textContent = fmtNum(v, Number.isInteger(v) ? 0 : 1);
    });
    const span = (x1 - x0) / dayMs;
    const nx = Math.min(4, Math.max(2, Math.round(span / 7)));
    for (let i = 0; i <= nx; i++) {
      const t = x0 + (x1 - x0) * i / nx;
      el('text', { class: 'axis', x: X(t), y: H - 6, 'text-anchor': i === 0 ? 'start' : i === nx ? 'end' : 'middle' }, svg).textContent = shortDate(t);
    }
    if (opts.goal) {
      el('line', { class: 'goal', x1: pad.l, x2: W - pad.r, y1: Y(opts.goal.y), y2: Y(opts.goal.y) }, svg);
      el('text', { class: 'goal-l', x: W - pad.r + 4, y: Y(opts.goal.y) + 4 }, svg).textContent = opts.goal.label;
    }

    series.forEach(s => {
      const pts = s.points.map(p => [X(parse(p.date)), Y(p.y)]);
      const d = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('');
      if (s.area && pts.length > 1) el('path', { class: 'area', fill: s.color, d: d + `L${pts.at(-1)[0]} ${H - pad.b}L${pts[0][0]} ${H - pad.b}Z` }, svg);
      if (s.line !== false && pts.length > 1) el('path', { class: 'line', stroke: s.color, d }, svg);
      if (s.dots) pts.forEach(p => el('circle', { class: 'dot', cx: p[0], cy: p[1], r: 4, fill: s.color }, svg));
      const last = pts.at(-1), lastV = s.points.at(-1).y;
      el('circle', { class: 'dot', cx: last[0], cy: last[1], r: 5, fill: s.color }, svg);
      if (s.endLabel !== false && s.line !== false)
        el('text', { class: 'end-l', x: last[0] + 8, y: last[1] + 4 }, svg).textContent = fmtNum(lastV, dec);
    });

    // Réticule + info-bulle (toutes les séries à la date la plus proche)
    const dates = [...new Set(all.map(p => p.date))].sort();
    const xh = el('line', { class: 'xhair', y1: pad.t, y2: H - pad.b, visibility: 'hidden' }, svg);
    const hit = el('rect', { x: pad.l, y: 0, width: W - pad.l - pad.r, height: H, fill: 'transparent' }, svg);
    const show = ev => {
      const r = svg.getBoundingClientRect();
      const px = (ev.clientX - r.left) * (W / r.width);
      let best = dates[0], bd = Infinity;
      dates.forEach(dt => { const dd = Math.abs(X(parse(dt)) - px); if (dd < bd) { bd = dd; best = dt; } });
      const cx = X(parse(best));
      xh.setAttribute('x1', cx); xh.setAttribute('x2', cx); xh.setAttribute('visibility', 'visible');
      tip.replaceChildren();
      const head = document.createElement('div');
      head.textContent = shortDate(parse(best));
      head.style.opacity = '.75';
      tip.appendChild(head);
      series.forEach(s => {
        const p = s.points.find(q => q.date === best);
        if (!p) return;
        const row = document.createElement('div');
        const k = document.createElement('i'); k.className = 'k'; k.style.background = s.color;
        const b = document.createElement('b'); b.textContent = fmtNum(p.y, dec) + (unit ? ' ' + unit : '');
        row.append(k, b, document.createTextNode(series.length > 1 ? '  ' + s.name : ''));
        tip.appendChild(row);
      });
      tip.hidden = false;
      const left = cx / W * r.width;
      tip.style.left = Math.min(Math.max(left, 60), r.width - 60) + 'px';
    };
    const hide = () => { tip.hidden = true; xh.setAttribute('visibility', 'hidden'); };
    hit.addEventListener('pointermove', show);
    hit.addEventListener('pointerdown', show);
    hit.addEventListener('pointerleave', hide);

    if (opts.table === false) return;
    const head = ['Date', ...series.map(s => s.name)];
    table(container, head, dates.map(dt => [shortDate(parse(dt)), ...series.map(s => {
      const p = s.points.find(q => q.date === dt); return p ? fmtNum(p.y, dec) + (unit ? ' ' + unit : '') : '—';
    })]));
  }

  /**
   * Barres verticales.
   * opts: { bars:[{label, value, full?:bool}], color, goal:{y,label}, unit, height }
   */
  function bars(container, opts) {
    container.innerHTML = '';
    if (!opts.bars.length || opts.bars.every(b => !b.value)) {
      container.innerHTML = `<p class="empty">${opts.empty || 'Pas encore de données.'}</p>`;
      return;
    }
    const holder = document.createElement('div');
    container.appendChild(holder);
    const { svg, tip, W, H } = frame(holder, opts.height || 180);
    svg.setAttribute('aria-label', opts.title || 'Graphique en barres');
    const pad = { l: 36, r: opts.goal ? 46 : 8, t: 18, b: 24 };
    const max = Math.max(...opts.bars.map(b => b.value), opts.goal?.y || 0);
    const ticks = niceTicks(0, max, 3);
    const top = ticks.at(-1);
    const Y = v => H - pad.b - v / top * (H - pad.t - pad.b);
    ticks.forEach(v => {
      el('line', { class: 'grid', x1: pad.l, x2: W - pad.r, y1: Y(v), y2: Y(v) }, svg);
      el('text', { class: 'axis', x: pad.l - 6, y: Y(v) + 4, 'text-anchor': 'end' }, svg).textContent = v >= 1000 ? fmtNum(v / 1000, 1) + 'k' : fmtNum(v, 0);
    });
    const n = opts.bars.length, band = (W - pad.l - pad.r) / n;
    const bw = Math.min(24, band - 4);
    const every = Math.ceil(n / 7);
    opts.bars.forEach((b, i) => {
      const cx = pad.l + band * i + band / 2;
      const h = Math.max(0, H - pad.b - Y(b.value));
      const x = cx - bw / 2, y = Y(b.value), r = Math.min(4, h);
      const color = b.full === false ? 'color-mix(in srgb,' + opts.color + ' 45%, transparent)' : opts.color;
      if (h > 0) el('path', {
        class: 'bar', fill: color,
        d: `M${x} ${y + h}V${y + r}Q${x} ${y} ${x + r} ${y}H${x + bw - r}Q${x + bw} ${y} ${x + bw} ${y + r}V${y + h}Z`
      }, svg);
      if (i % every === 0 || i === n - 1)
        el('text', { class: 'axis', x: cx, y: H - 6, 'text-anchor': 'middle' }, svg).textContent = b.label;
      const hit = el('rect', { x: pad.l + band * i, y: pad.t, width: band, height: H - pad.t - pad.b, fill: 'transparent', tabindex: 0 }, svg);
      const show = () => {
        tip.replaceChildren();
        const d = document.createElement('div'); d.textContent = b.tipLabel || b.label; d.style.opacity = '.75';
        const v = document.createElement('b'); v.textContent = fmtNum(b.value, opts.decimals ?? 0) + (opts.unit ? ' ' + opts.unit : '');
        tip.append(d, v);
        tip.hidden = false;
        const r = svg.getBoundingClientRect();
        tip.style.left = Math.min(Math.max(cx / W * r.width, 50), r.width - 50) + 'px';
      };
      hit.addEventListener('pointerenter', show);
      hit.addEventListener('pointerdown', show);
      hit.addEventListener('focus', show);
      hit.addEventListener('pointerleave', () => { tip.hidden = true; });
      hit.addEventListener('blur', () => { tip.hidden = true; });
    });
    if (opts.goal) {
      el('line', { class: 'goal', x1: pad.l, x2: W - pad.r, y1: Y(opts.goal.y), y2: Y(opts.goal.y) }, svg);
      el('text', { class: 'goal-l', x: W - pad.r + 4, y: Y(opts.goal.y) + 4 }, svg).textContent = opts.goal.label;
    }
    table(container, [opts.labelHead || 'Période', opts.valueHead || 'Valeur'],
      opts.bars.map(b => [b.tipLabel || b.label, fmtNum(b.value, opts.decimals ?? 0) + (opts.unit ? ' ' + opts.unit : '')]));
  }

  return { line, bars, fmtNum };
})();
