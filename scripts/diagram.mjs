// The blueprint diagrams for the site, drawn as live SVG. The geometry follows
// the brand generator (noctcore/.github, brand/generator/brand.mjs): the same
// 1040 x 640 drawing space, the same rising route, solid marks as blocks and
// dashed, capped branches for what a step stops. Unlike the banners, lettering
// stays as text (the page loads the brand fonts anyway) and colours come from
// CSS custom properties, so one drawing serves night and paper.

export const marks = {
  noctcore: [[12, 12, 40, 8], [12, 20, 8, 4], [44, 20, 8, 4], [12, 44, 40, 8], [12, 40, 8, 4], [44, 40, 8, 4], [28, 28, 8, 8]],
  auth: [[12, 12, 28, 8], [12, 20, 8, 20], [24, 44, 28, 8], [44, 24, 8, 20], [28, 28, 8, 8]],
  harness: [[12, 12, 16, 8], [12, 20, 8, 24], [12, 44, 16, 8], [36, 12, 16, 8], [44, 20, 8, 24], [36, 44, 16, 8], [28, 28, 8, 8]],
  'eslint-plugins': [[12, 12, 40, 8], [12, 28, 12, 8], [28, 28, 8, 8], [40, 28, 12, 8], [24, 44, 16, 8]],
  'showcase-kit': [
    [12, 12, 16, 8], [12, 20, 8, 8], [36, 12, 16, 8], [44, 20, 8, 8],
    [12, 44, 16, 8], [12, 36, 8, 8], [36, 44, 16, 8], [44, 36, 8, 8], [28, 28, 8, 8],
  ],
  jobs: [[12, 28, 8, 8], [24, 12, 28, 8], [44, 20, 8, 24], [24, 44, 28, 8], [32, 28, 8, 8]],
};

const DEPTH = 7;
const r = (v) => Number(v.toFixed(2));
const esc = (s) => String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');
/** DM Mono has a fixed 0.6 em advance, so mono labels can be measured exactly. */
const mono = (text, size) => text.length * 0.6 * size;

const rectPath = (rects, dy = 0) => rects.map(([x, y, w, h]) => `M${x} ${y + dy}h${w}v${h}h${-w}z`).join('');

function topEdges(rects) {
  let d = '';
  for (const [x, y, w] of rects) {
    const covered = rects
      .filter(([, oy, , oh]) => oy + oh === y)
      .map(([ox, , ow]) => [Math.max(ox, x), Math.min(ox + ow, x + w)])
      .filter(([a, b]) => b > a)
      .sort((a, b) => a[0] - b[0]);
    let cursor = x;
    for (const [a, b] of covered) {
      if (a > cursor) d += `M${cursor} ${y}H${a}`;
      cursor = Math.max(cursor, b);
    }
    if (cursor < x + w) d += `M${cursor} ${y}H${x + w}`;
  }
  return d;
}

/** A mark as a flat shape, for lockups and indexes. */
export function flatMark(name, size = 24, cls = 'mk') {
  return `<svg class="${cls}" viewBox="12 12 40 40" width="${size}" height="${size}" aria-hidden="true" focusable="false"><path d="${rectPath(marks[name])}"/></svg>`;
}

/** The mark made solid: side faces, the face, a hairline on the upper edges. */
export function block(rects, cx, cy, size) {
  return (
    `<g transform="translate(${r(cx - size / 2)} ${r(cy - size / 2)}) scale(${r(size / 64)})">` +
    `<path class="f-side" d="${rectPath(rects, DEPTH)}"/>` +
    `<path class="f-face" d="${rectPath(rects)}"/>` +
    `<path class="s-hair" d="${topEdges(rects)}"/>` +
    '</g>'
  );
}

const markTop = (rects) => Math.min(...rects.map(([, y]) => y));

function stopped(path, capX, capY) {
  return (
    `<path class="s-stop-dash" d="${path}"/>` +
    `<path class="s-stop-cap" d="M${r(capX - 9)} ${r(capY)}h18"/>` +
    `<circle class="f-stop" cx="${r(capX)}" cy="${r(capY)}" r="3"/>`
  );
}

function tick(x, y, angle) {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  const p = (dx, dy) => `${r(x + dx * c - dy * s)} ${r(y + dx * s + dy * c)}`;
  return `<path class="s-tick" d="M${p(-4, -5)}L${p(3, 0)}L${p(-4, 5)}"/>`;
}

const text = (value, x, y, cls, size) =>
  `<text class="${cls}" x="${r(x)}" y="${r(y)}" font-size="${size}">${esc(value)}</text>`;

/**
 * The passage. `scale` sets the lettering: the wide form uses the generator's
 * sizes, the narrow form enlarges them so a 390 px screen still reads them.
 */
export function passage(spec, markName, { label = 32, name = 36, end = 26, rowGap = 45, pairTop = null, numbers = true } = {}) {
  const rects = marks[markName];
  const { gates, start } = spec;
  const x0 = 76, y0 = 501, x1 = 950, y1 = 161;
  const slope = (y1 - y0) / (x1 - x0);
  const at = (x) => y0 + slope * (x - x0);
  const angle = Math.atan2(y1 - y0, x1 - x0);
  const xs = { 2: [290, 690], 3: [220, 500, 780], 4: [196, 400, 604, 808] }[gates.length];
  const sizes = { 2: [128, 128], 3: [120, 138, 120], 4: [112, 112, 112, 112] }[gates.length];
  let out = '';
  out += `<g class="d-bed">`;
  out += `<g opacity=".55"><path class="s-line" fill="none" d="M80 551L965 207M80 575L965 231"/><path class="s-grid" d="${xs.map((x) => `M${x} ${Math.round(at(x) - 330)}v430`).join('')}"/></g>`;
  out += `<path class="f-shadow" d="M76 512L950 172v28L76 540z"/>`;
  out += `<path class="f-raised s-line" d="M76 488L950 148v24L76 512z"/>`;
  out += `</g>`;
  out += `<path class="d-route s-route" pathLength="1" d="M${x0} ${y0}L${x1} ${y1}"/>`;
  const ticks = [x0 + 36, ...xs.slice(0, -1).map((x, i) => (x + xs[i + 1]) / 2), x1 - 26];
  out += `<g class="d-ticks">${ticks.map((x) => tick(x, at(x), angle)).join('')}</g>`;
  out += `<g class="d-tokens" data-route="${x0},${y0},${x1},${y1}" data-gates="${xs.join(',')}" data-sizes="${sizes.join(',')}" data-stops="${gates.map((g) => (g.stops?.length ? 1 : 0)).join(',')}"></g>`;
  const labels = [];
  const branches = [];
  gates.forEach((gate, index) => {
    const stops = gate.stops ?? [];
    if (!stops.length) return;
    const x = xs[index];
    const size = sizes[index];
    const capY = at(x) - size / 2 + (markTop(rects) * size) / 64;
    const last = index === gates.length - 1;
    const widths = stops.map((s) => mono(s, label));
    if (stops.length === 1) {
      const side = last ? 1 : -1;
      const sx = x + side * 76;
      const labelY = Math.max(56 + (gates.length - 1 - index) * rowGap, capY - 252);
      let lx = side < 0 ? sx - widths[0] * 0.5 : sx - widths[0] * 0.35;
      lx = Math.max(8, Math.min(lx, 1036 - widths[0]));
      const sy = labelY + 31 * (label / 32);
      const bend = Math.max(sy + 24, (sy + capY) / 2 - 30);
      const land = bend + 76 * 0.55;
      branches.push(`<g class="d-branch" data-gate="${index}" style="--i:${index}">${stopped(`M${r(sx)} ${r(sy)}V${r(bend)}L${r(x)} ${r(land)}V${r(capY)}`, x, capY)}</g>`);
      labels.push(`<g class="d-label" data-gate="${index}" style="--i:${index}">${text(stops[0], lx, labelY, 't-stop', label)}</g>`);
      return;
    }
    const widest = Math.max(...widths);
    const side = x - 76 - 18 - widest >= 0 ? -1 : 1;
    const jx = x + side * 76;
    const firstY = pairTop == null ? Math.max(56 + (gates.length - 1 - index) * rowGap, capY - 270) : Math.max(pairTop, capY - 300);
    const ys = [firstY, firstY + label * 1.44];
    let join = '';
    let lettering = '';
    stops.forEach((s, order) => {
      const ly = ys[order];
      const lx = side < 0 ? jx - 18 - widths[order] : jx + 18;
      lettering += text(s, lx, ly, 't-stop', label);
      const mid = ly - label * 0.31;
      const from = side < 0 ? lx + widths[order] + 8 : lx - 8;
      join += `M${r(from)} ${r(mid)}H${r(jx)}`;
    });
    const top = ys[0] - label * 0.31;
    const bottom = ys[1] - label * 0.31;
    const bend = Math.max(bottom + 30, (bottom + capY) / 2 - 20);
    const land = bend + 76 * 0.55;
    labels.push(`<g class="d-label" data-gate="${index}" style="--i:${index}">${lettering}</g>`);
    branches.push(
      `<g class="d-branch" data-gate="${index}" style="--i:${index}"><path class="s-stop-dash" d="${join}M${r(jx)} ${r(top)}V${r(bottom)}"/>` +
        `${stopped(`M${r(jx)} ${r(bottom)}V${r(bend)}L${r(x)} ${r(land)}V${r(capY)}`, x, capY)}</g>`,
    );
  });
  out += labels.join('');
  gates.forEach((gate, index) => {
    out += `<g class="d-block" data-gate="${index}" style="--i:${index}">${block(rects, xs[index], at(xs[index]), sizes[index])}</g>`;
  });
  out += branches.join('');
  gates.forEach((gate, index) => {
    const x = xs[index];
    const y = at(x);
    out += `<g class="d-name" data-gate="${index}" style="--i:${index}"><path class="s-line" fill="none" d="M${x} ${r(y + 65)}v39h20"/>${numbers ? text(String(index + 1).padStart(2, '0'), x + 27, y + 104 + name * 0.22, 't-num', Math.round(name * 0.62)) : ''}${text(gate.name, x - 39, y + 104 + name * 1.19, 't-name', name)}</g>`;
  });
  out += `<g class="d-ends">`;
  out += `<circle class="f-bg s-route" cx="${x0}" cy="${y0}" r="7"/>`;
  out += `<circle class="f-acc" cx="${x1}" cy="${y1}" r="9"/>`;
  out += `<circle class="s-line" fill="none" cx="${x1}" cy="${y1}" r="16"/>`;
  out += text(start, Math.max(8, Math.min(51, 196 - mono(start, end))), 547 + (end - 26) * 1.2, 't-end', end);
  out += text(spec.end, Math.min(906, 1036 - mono(spec.end, end)), 117, 't-end', end);
  out += `</g>`;
  return out;
}

/**
 * The ledger: one run of `harness check`. One spine, one track per check, each
 * ending in a verdict. Passing tracks land on a core square; stopped ones are
 * dashed copper and end in a cap.
 */
export function ledger(rows, { name = 30, detail = 22, verdict = 22, footer = 21, num = 18, stacked = false, width = 1040 } = {}) {
  // Wide: name and track share a row. Stacked (phones): the track runs under
  // the name, in a narrower space, so the lettering scales up on screen.
  const spine = stacked ? 22 : 62;
  const top = stacked ? 70 : 92;
  const gap = stacked ? name + detail + verdict + 74 : 104;
  const lx = stacked ? spine + 58 : spine + 66;
  const t0 = stacked ? lx : 640;
  const t1 = width - (stacked ? 24 : 60);
  const trackDy = stacked ? detail + 34 : 0;
  let out = `<g class="d-bed"><path class="s-line" fill="none" d="M${spine} ${top - 26}V${top + gap * (rows.length - 1) + 40}"/></g>`;
  out += text('.noctcore/harness.json', spine + 26, top - (stacked ? 34 : 40), 't-end', stacked ? 20 : 22);
  rows.forEach((row, i) => {
    const y = top + i * gap + 30;
    const ty = y + trackDy;
    const passed = row.verdict === 'passed';
    out += `<g class="d-name" data-gate="${i}" style="--i:${i}">`;
    out += `<rect class="${passed ? 'f-acc' : 'f-bg s-stop-solid'}" x="${spine - 7}" y="${y - 7}" width="14" height="14"/>`;
    out += `<path class="s-line" fill="none" d="M${spine + 7} ${y}h14"/>`;
    out += text(String(i + 1).padStart(2, '0'), spine + 26, stacked ? y + 7 : y - 10, 't-num', num);
    out += text(row.name, lx, y - 4 + (stacked ? 12 : 0), 't-name', name);
    out += text(row.detail, lx, y + 30 + (stacked ? 10 : 0), 't-detail', detail);
    out += `</g>`;
    const vy = ty + verdict + 20;
    if (passed) {
      out += `<g class="d-block" data-gate="${i}" style="--i:${i}"><path class="s-route" d="M${t0} ${ty}H${t1 - 16}"/>`;
      const span = t1 - 16 - t0;
      for (const f of [0.2, 0.5, 0.8]) out += tick(t0 + span * f, ty, 0);
      out += `<rect class="f-acc" x="${t1 - 16}" y="${ty - 10}" width="20" height="20"/>`;
      out += text('passed', t1 + 4 - mono('passed', verdict), vy, 't-acc', verdict);
      out += `</g>`;
    } else {
      // A failed check ran part of the way; a blocked one stopped before it could run.
      const endX = t0 + (t1 - t0) * (row.verdict === 'failed' ? 0.62 : 0.34);
      out += `<g class="d-branch" data-gate="${i}" style="--i:${i}"><path class="s-stop-dash" d="M${t0} ${ty}H${r(endX)}"/>`;
      out += `<path class="s-stop-cap" d="M${r(endX)} ${ty - 12}v24"/><circle class="f-stop" cx="${r(endX)}" cy="${ty}" r="3.5"/></g>`;
      out += `<g class="d-label" data-gate="${i}" style="--i:${i}">${text(row.verdict, t1 + 4 - mono(row.verdict, verdict), vy, 't-stop', verdict)}</g>`;
    }
  });
  const fy = top + gap * (rows.length - 1) + 30 + trackDy + verdict + (stacked ? 60 : 54);
  out += `<g class="d-ends"><rect class="f-stop" x="${spine - 8}" y="${fy - 12}" width="16" height="16"/>`;
  out += text('exit 1: every check ran, both stops are listed', spine + 26, fy + 2, 't-stop', footer);
  out += `</g>`;
  return out;
}

/** The noctcore mark as a dimensioned drawing, for the hero. */
export function markDrawing() {
  const rects = marks.noctcore;
  // Drawn on a 64 unit grid at 7 px per unit, in a 560 x 560 space.
  const u = 7;
  const ox = 56;
  const oy = 72;
  const P = (v) => r(v * u);
  let face = '';
  let side = '';
  for (const [x, y, w, h] of rects) {
    face += `M${P(x)} ${P(y)}h${P(w)}v${P(h)}h${-P(w)}z`;
    side += `M${P(x)} ${P(y) + 18}h${P(w)}v${P(h)}h${-P(w)}z`;
  }
  let out = `<g transform="translate(${ox} ${oy})">`;
  // Construction: the 64 unit canvas and its 4 unit grid.
  let grid = '';
  for (let i = 0; i <= 64; i += 4) grid += `M${P(i)} 0V${P(64)}M0 ${P(i)}H${P(64)}`;
  out += `<path class="s-grid-strong" d="${grid}"/>`;
  out += `<path class="s-line" fill="none" d="M0 0H${P(64)}V${P(64)}H0z"/>`;
  out += `<path class="s-line-dash" d="M${P(12)} ${P(12)}H${P(52)}V${P(52)}H${P(12)}z"/>`;
  out += `<path class="hm-route s-route" d="M${P(-6)} ${P(32)}H${P(70)}"/>`;
  // A way around the core: closed by the bar above, so it stops in copper.
  out += `<g class="hm-stop"><path class="s-stop-dash" d="M${P(4)} ${P(32) - 6}V${P(10)}H${P(20)}V${P(12) - 1}"/><path class="s-stop-cap" d="M${P(20) - 9} ${P(12) - 1}h18"/><circle class="f-stop" cx="${P(20)}" cy="${P(12) - 1}" r="3"/>${text('around the core', P(1), P(7), 't-stop', 18)}</g>`;
  out += `<g class="hm-solid"><path class="f-side" d="${side}"/><path class="f-face" d="${face}"/><path class="s-hair-thick" d="${topEdges(rects).replace(/-?\d+(\.\d+)?/g, (n) => P(Number(n)))}"/></g>`;
  // The passage through the core: one route, in on the left, out on the right.
  out += `<circle class="f-bg s-route" cx="${P(-6)}" cy="${P(32)}" r="6"/>`;
  out += `<circle class="f-acc" cx="${P(70)}" cy="${P(32)}" r="7"/>`;
  // Dimension lines.
  const dim = (x1, y1, x2, y2) => `<path class="s-dim" d="M${x1} ${y1}L${x2} ${y2}"/>`;
  const capV = (x, y) => `<path class="s-dim" d="M${x - 6} ${y}h12"/>`;
  const capH = (x, y) => `<path class="s-dim" d="M${x} ${y - 6}v12"/>`;
  // Stroke width, 8 units, on the right.
  const sx = P(64) + 26;
  out += dim(sx, P(12), sx, P(20)) + capV(sx, P(12)) + capV(sx, P(20));
  out += `<path class="s-dim-lead" d="M${P(52)} ${P(12)}H${sx + 6}M${P(52)} ${P(20)}H${sx + 6}"/>`;
  out += text('8u stroke', sx + 12, P(16) + 6, 't-dim', 18);
  // Core, 8 units, under the drawing.
  const cy = P(64) + 30;
  out += dim(P(28), cy, P(36), cy) + capH(P(28), cy) + capH(P(36), cy);
  out += `<path class="s-dim-lead" d="M${P(28)} ${P(52) + 26}V${cy + 6}M${P(36)} ${P(52) + 26}V${cy + 6}"/>`;
  out += text('1 core, 8u', P(28) - 22, cy + 28, 't-dim', 18);
  // Parts, called out on the right under the stroke: the lugs and the bars.
  out += `<path class="s-dim-lead" d="M${P(52)} ${P(42)}H${sx + 6}M${P(52)} ${P(50)}H${sx + 6}"/>`;
  out += `<circle class="f-acc" cx="${P(52)}" cy="${P(42)}" r="3"/><circle class="f-acc" cx="${P(52)}" cy="${P(50)}" r="3"/>`;
  out += text('4 lugs, 8x4u', sx + 12, P(42) + 5, 't-dim', 18);
  out += text('2 bars, 40x8u', sx + 12, P(50) + 5, 't-dim', 18);
  // Canvas, 64 units, above.
  const ty = -24;
  out += dim(0, ty, P(64), ty) + capH(0, ty) + capH(P(64), ty);
  out += text('64u canvas, 4u grid', 0, ty - 12, 't-dim', 18);
  out += `</g>`;
  return out;
}

/**
 * The passage drawn for phones. Same angle, route, blocks, ticks and capped
 * copper branches, but in a 600 x 380 space so it scales up about 1.7 times on
 * a 390 px screen. To make that room, the copper labels stack in rows above
 * the route (the last step highest) and the steps carry their numbers instead
 * of their names; the title block right under the drawing names each number.
 */
export function passageNarrow(spec, markName, { label = 26, end = 22, num = 26 } = {}) {
  const rects = marks[markName];
  const { gates, start } = spec;
  const W = 600;
  const x0 = 30, x1 = 570;
  const slope = Math.tan((21.3 * Math.PI) / 180);
  const y0 = 330;
  const y1 = y0 - (x1 - x0) * slope;
  const at = (x) => y0 - (x - x0) * slope;
  const angle = Math.atan2(y1 - y0, x1 - x0);
  const xs = { 2: [170, 400], 3: [120, 270, 420], 4: [110, 215, 320, 425] }[gates.length];
  const sizes = { 2: [80, 80], 3: [72, 84, 72], 4: [64, 64, 64, 64] }[gates.length];
  let out = `<g class="d-bed">`;
  out += `<g opacity=".55"><path class="s-line" fill="none" d="M${x0 + 4} ${r(y0 + 30)}L${x1 + 6} ${r(y1 + 30)}M${x0 + 4} ${r(y0 + 44)}L${x1 + 6} ${r(y1 + 44)}"/></g>`;
  out += `<path class="f-shadow" d="M${x0} ${y0 + 7}L${x1} ${r(y1 + 7)}v17L${x0} ${y0 + 24}z"/>`;
  out += `<path class="f-raised s-line" d="M${x0} ${y0 - 7}L${x1} ${r(y1 - 7)}v14L${x0} ${y0 + 7}z"/>`;
  out += `</g>`;
  out += `<path class="d-route s-route" pathLength="1" d="M${x0} ${y0}L${x1} ${r(y1)}"/>`;
  const ticks = [x0 + 26, ...xs.slice(0, -1).map((x, i) => (x + xs[i + 1]) / 2), x1 - 20];
  out += `<g class="d-ticks">${ticks.map((x) => tick(x, at(x), angle)).join('')}</g>`;
  out += `<g class="d-tokens" data-route="${x0},${y0},${x1},${r(y1)}" data-gates="${xs.join(',')}" data-sizes="${sizes.join(',')}" data-stops="${gates.map((g) => (g.stops?.length ? 1 : 0)).join(',')}"></g>`;
  // Label rows: the last stopping step takes the top row.
  const rows = [];
  [...gates.keys()].reverse().forEach((i) => (gates[i].stops ?? []).forEach((s, k) => rows.push({ i, s, k })));
  const rowY = (n) => 34 + n * (label + 10);
  const labels = [];
  const branches = [];
  gates.forEach((gate, i) => {
    const stops = gate.stops ?? [];
    if (!stops.length) return;
    const x = xs[i];
    const size = sizes[i];
    const capY = at(x) - size / 2 + (markTop(rects) * size) / 64;
    const mine = rows.map((row, n) => ({ ...row, n })).filter((row) => row.i === i);
    const widths = mine.map((row) => mono(row.s, label));
    const widest = Math.max(...widths);
    // A lone label centres over its step; a pair sits to the right of it so
    // their joined leader can drop straight onto the block.
    const lx = mine.length === 1
      ? Math.max(8, Math.min(x - widest / 2, W - 8 - widest))
      : Math.max(8, Math.min(x + 18, W - 8 - widest));
    let lettering = '';
    mine.forEach((row) => (lettering += text(row.s, lx, rowY(row.n), 't-stop', label)));
    labels.push(`<g class="d-label" data-gate="${i}" style="--i:${i}">${lettering}</g>`);
    const lastY = rowY(mine[mine.length - 1].n);
    const bend = capY - 30;
    let path;
    if (mine.length === 1) {
      const ax = Math.max(lx + 10, Math.min(x, lx + widest - 10));
      path = `M${r(ax)} ${r(lastY + 9)}V${r(bend)}L${r(x)} ${r(bend + 16)}V${r(capY)}`;
      branches.push(`<g class="d-branch" data-gate="${i}" style="--i:${i}">${stopped(path, x, capY)}</g>`);
    } else {
      // Two causes, one stop: ticks from each label join one leader on the right.
      const jx = lx - 12;
      const join = mine.map((row) => `M${r(lx - 6)} ${r(rowY(row.n) - label * 0.31)}H${r(jx)}`).join('');
      const top = rowY(mine[0].n) - label * 0.31;
      path = `M${r(jx)} ${r(top)}V${r(bend)}L${r(x)} ${r(bend + 16)}V${r(capY)}`;
      branches.push(`<g class="d-branch" data-gate="${i}" style="--i:${i}"><path class="s-stop-dash" d="${join}"/>${stopped(path, x, capY)}</g>`);
    }
  });
  out += labels.join('');
  gates.forEach((gate, i) => {
    out += `<g class="d-block" data-gate="${i}" style="--i:${i}">${block(rects, xs[i], at(xs[i]), sizes[i])}</g>`;
  });
  out += branches.join('');
  gates.forEach((gate, i) => {
    const x = xs[i];
    const y = at(x);
    out += `<g class="d-name" data-gate="${i}" style="--i:${i}">${text(String(i + 1).padStart(2, '0'), x + sizes[i] / 2 + 6, y + sizes[i] / 2 + 2, 't-num', num)}</g>`;
  });
  out += `<g class="d-ends">`;
  out += `<circle class="f-bg s-route" cx="${x0}" cy="${y0}" r="6"/>`;
  out += `<circle class="f-acc" cx="${x1}" cy="${r(y1)}" r="7"/>`;
  out += `<circle class="s-line" fill="none" cx="${x1}" cy="${r(y1)}" r="13"/>`;
  out += text(start, 8, y0 + 40, 't-end', end);
  out += text(spec.end, W - 4 - mono(spec.end, end), r(y1 - 24), 't-end', end);
  out += `</g>`;
  return out;
}
