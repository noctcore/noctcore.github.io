// Builds the site with no dependencies: node scripts/build.mjs
// Writes dist/ (the Pages site) and preview.html (one self-contained file).
import { mkdirSync, readFileSync, writeFileSync, copyFileSync, rmSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { sheets } from './sheets.mjs';
import { flatMark, ledger, markDrawing, passage } from './diagram.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = (p) => join(root, 'src', p);
const data = JSON.parse(readFileSync(src('data.json'), 'utf8'));
const SITE = 'https://noctcore.github.io/';
const esc = (s) => String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const total = data.families.reduce((n, f) => n + f.packages.length, 0);

const ext = (href, label, cls = '') =>
  `<a${cls ? ` class="${cls}"` : ''} href="${esc(href)}">${label}</a>`;

/* ---------- sheets ---------- */
function sheetSvg(sheet, variant) {
  const narrow = variant === 'narrow';
  const body =
    sheet.form === 'ledger'
      ? ledger(sheet.rows, narrow ? { name: 42, detail: 30, verdict: 30, footer: 30, stacked: true } : {})
      : passage(sheet.diagram, sheet.mark, narrow ? { label: 40, name: 46, end: 38, rowGap: 60, pairTop: 50 } : { label: 23, name: 27, end: 21 });
  const box = narrow ? (sheet.form === 'ledger' ? '0 30 1040 1000' : '0 20 1040 640') : (sheet.form === 'ledger' ? '0 0 1040 640' : '0 24 1040 600');
  return `<svg class="draw draw-${variant}" viewBox="${box}" role="img" aria-labelledby="t-${sheet.id}-${variant}"><title id="t-${sheet.id}-${variant}">${esc(sheet.alt)}</title>${body}</svg>`;
}

function sheetMeta(sheet, i) {
  const items = sheet.detail
    .map(
      ([step, stop, pkg, rule, href], g) => `
        <li><a class="gate" href="${esc(href)}" data-gate="${g}">
          <span class="gate-n">${String(g + 1).padStart(2, '0')}</span>
          <span class="gate-step">${esc(step)}</span>
          ${stop ? `<span class="gate-stop"><span class="vh">stops </span>${esc(stop)}</span>` : '<span class="gate-pass">stops nothing</span>'}
          <span class="gate-where">${/\s/.test(rule) ? `<span class="gate-rule">${esc(rule)}</span>` : `<code>${esc(rule)}</code>`}<span>${esc(pkg)}</span></span>
        </a></li>`,
    )
    .join('');
  return `
      <div class="meta">
        <dl class="titleblock">
          <div><dt>Sheet</dt><dd>${String(i + 1).padStart(2, '0')} of ${String(sheets.length).padStart(2, '0')}</dd></div>
          <div><dt>Route</dt><dd>${esc(sheet.form === 'ledger' ? 'manifest to exit code' : `${sheet.diagram.start} to ${sheet.diagram.end}`)}</dd></div>
          <div class="tb-wide"><dt>Subject</dt><dd>${esc(sheet.subject)}</dd></div>
        </dl>
        <h3 class="sheet-title">${esc(sheet.title)}</h3>
        <p class="sheet-lead">${esc(sheet.lead)}</p>
        <ol class="gates">${items}</ol>
      </div>`;
}

const sheetTabs = sheets
  .map(
    (s, i) =>
      `<a class="tab" href="#sheet-${s.id}" data-index="${i}" role="tab" aria-controls="sheet-${s.id}"><span>${String(i + 1).padStart(2, '0')}</span> ${esc(s.tab)}</a>`,
  )
  .join('');

const sheetArticles = sheets
  .map(
    (s, i) => `
    <article class="sheet${i === 0 ? ' is-on' : ''}" id="sheet-${s.id}" data-index="${i}" data-form="${s.form}" role="tabpanel" aria-label="Sheet ${i + 1}: ${esc(s.tab)}">
      <div class="drawing">${sheetSvg(s, 'wide')}${sheetSvg(s, 'narrow')}</div>
      ${sheetMeta(s, i)}
    </article>`,
  )
  .join('');

/* ---------- apps ---------- */
const stateGlyph = (state) => `<span class="state state-${state}" aria-hidden="true"></span>`;
const apps = data.apps
  .map(
    (a) => `
    <article class="app app-${a.state}">
      <header class="app-head">
        <h3>${esc(a.name)}</h3>
        <p class="status">${stateGlyph(a.state)}${esc(a.status)}</p>
      </header>
      <p class="app-what">${esc(a.what)}</p>
      <p class="app-body">${esc(a.body)}</p>
      <p class="app-note">${esc(a.statusNote)}</p>
      <dl class="facts">${a.facts.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>
      <p class="links">${a.links.map(([l, h], i) => ext(h, esc(l), i === 0 ? 'btn btn-solid' : 'btn')).join('')}</p>
    </article>`,
  )
  .join('');

/* ---------- libraries ---------- */
const npm = (name) => `https://www.npmjs.com/package/@noctcore/${name}`;
const families = data.families
  .map((f, i) => {
    const rows = f.packages
      .map(
        ([name, version, what]) =>
          `<li><a href="${npm(name)}"><code>@noctcore/${esc(name)}</code></a><span class="ver">${esc(version)}</span><span class="pkg-what">${esc(what)}</span></li>`,
      )
      .join('');
    return `
    <article class="family fam-${f.id}" id="lib-${f.id}">
      <div class="fam-id">
        <p class="fam-n">${String(i + 1).padStart(2, '0')}</p>
        <h3>${flatMark(f.mark, 28)}<span>${esc(f.name)}</span></h3>
        <p class="fam-promise">${esc(f.promise)}</p>
        <p class="status">${stateGlyph(f.state)}${esc(f.status)}</p>
        <p class="fam-links">${f.links.map(([l, h]) => ext(h, esc(l))).join('')}<a href="https://www.npmjs.com/org/noctcore">npm</a></p>
      </div>
      <div class="fam-body">
        <p class="fam-what">${esc(f.what)}</p>
        <div class="cmd"><span class="cmd-p" aria-hidden="true">$</span><code>${esc(f.install)}</code><button class="copy" type="button" data-copy="${esc(f.install)}" aria-label="Copy: ${esc(f.install)}">Copy</button></div>
        <ul class="pkgs pkgs-${f.packages.length > 6 ? 'many' : f.packages.length > 1 ? 'some' : 'one'}">${rows}</ul>
        <p class="fam-note">${esc(f.note)}</p>
      </div>
    </article>`;
  })
  .join('');

/* ---------- head ---------- */
const title = 'noctcore: governed autonomy for software teams';
const description =
  'noctcore builds local-first, open source tools for working with coding agents: two desktop apps and 24 npm packages for lint rules, repo checks, authentication and showcase images. Agents write the code; structure, review gates and safety stay in human hands.';

const jsonld = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${SITE}#org`,
      name: 'noctcore',
      url: SITE,
      logo: `${SITE}icon-512.png`,
      email: 'support@shirone.dev',
      description,
      sameAs: ['https://github.com/noctcore', 'https://www.npmjs.com/org/noctcore'],
    },
    { '@type': 'WebSite', '@id': `${SITE}#site`, url: SITE, name: 'noctcore', publisher: { '@id': `${SITE}#org` } },
    {
      '@type': 'ItemList',
      name: 'noctcore projects',
      itemListElement: [
        ...data.apps.map((a) => ({
          '@type': 'SoftwareApplication',
          name: a.name,
          applicationCategory: 'DeveloperApplication',
          operatingSystem: a.name === 'Nightcore' ? 'macOS, Windows' : 'macOS, Windows, Linux',
          description: a.what,
          url: a.repo,
          license: 'https://opensource.org/licenses/MIT',
        })),
        ...data.families.map((f) => ({
          '@type': 'SoftwareSourceCode',
          name: `@noctcore/${f.packages[0][0]}`,
          description: f.what,
          codeRepository: `https://github.com/noctcore/${f.id}`,
          programmingLanguage: 'TypeScript',
          license: 'https://opensource.org/licenses/MIT',
        })),
      ].map((item, position) => ({ '@type': 'ListItem', position: position + 1, item })),
    },
  ],
};

function page({ css, js, fonts, icon, og, inline }) {
  const fontFace = `@font-face{font-family:"Manrope";src:url(${fonts.manrope}) format("woff2");font-weight:200 800;font-display:swap}@font-face{font-family:"DM Mono";src:url(${fonts.mono}) format("woff2");font-weight:400;font-display:swap}`;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${SITE}">
<meta name="color-scheme" content="dark light">
<meta name="theme-color" media="(prefers-color-scheme: dark)" content="#17212D">
<meta name="theme-color" media="(prefers-color-scheme: light)" content="#F6F5F1">
<link rel="icon" href="${icon.svg}" type="image/svg+xml">
${icon.apple ? `<link rel="apple-touch-icon" href="${icon.apple}">` : ''}
<meta property="og:type" content="website">
<meta property="og:site_name" content="noctcore">
<meta property="og:title" content="noctcore. Autonomy, governed.">
<meta property="og:description" content="Agents write the code. Every change still passes a gate. Local-first, open source tools: two apps and 24 npm packages.">
<meta property="og:url" content="${SITE}">
<meta property="og:image" content="${og}">
<meta property="og:image:width" content="1280">
<meta property="og:image:height" content="640">
<meta property="og:image:alt" content="noctcore. Autonomy, governed. Agents write the code. Every change still passes a gate.">
<meta name="twitter:card" content="summary_large_image">
${inline ? '' : `<link rel="preload" href="${fonts.manrope}" as="font" type="font/woff2" crossorigin>`}
<script>try{var t=localStorage.getItem('nc-theme');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t}catch(e){}document.documentElement.classList.add('js')</script>
<style>${fontFace}</style>
${inline ? `<style>${css}</style>` : `<link rel="stylesheet" href="${css}">`}
<script type="application/ld+json">${JSON.stringify(jsonld)}</script>
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<header class="top">
  <div class="wrap top-in">
    <a class="lockup" href="#top" aria-label="noctcore, back to top">${flatMark('noctcore', 26, 'mk mk-acc')}<span>noctcore</span></a>
    <nav aria-label="Sections">
      <a href="#gates">Gates</a><a href="#why">Why</a><a href="#apps">Apps</a><a href="#libraries">Libraries</a><a href="#principles">Principles</a>
    </nav>
    <div class="top-tools">
      <a class="icon-link" href="https://github.com/noctcore" aria-label="noctcore on GitHub"><svg viewBox="0 0 16 16" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z"/></svg></a>
      <button class="theme" type="button" aria-label="Colour theme: system" data-theme-toggle><span class="theme-ico" aria-hidden="true"></span><span class="theme-label">Auto</span></button>
    </div>
  </div>
</header>

<main id="main">
<section class="hero" id="top">
  <div class="wrap hero-grid">
    <div class="hero-copy">
      <p class="eyebrow">Local first / Open source / MIT</p>
      <h1>Autonomy,<br>governed.</h1>
      <p class="sub">Agents write the code. Every change still passes a gate.</p>
      <p class="lead">noctcore is a small family of open source developer tools for working with coding agents: two desktop apps and ${total} npm packages. Agents write most of the code; the structure, the review gates and the safety rules stay in human hands, on your machine, in files you can read.</p>
      <p class="cta"><a class="btn btn-solid" href="#libraries">Browse the libraries</a><a class="btn" href="#gates">Follow a change</a></p>
      <div class="cmd cmd-hero"><span class="cmd-p" aria-hidden="true">$</span><code>npx @noctcore/harness check</code><button class="copy" type="button" data-copy="npx @noctcore/harness check" aria-label="Copy: npx @noctcore/harness check">Copy</button></div>
      <p class="cmd-note">Run a repo's own checks in any CI. Zero runtime dependencies, no network, no account.</p>
    </div>
    <figure class="hero-mark" aria-label="The noctcore mark drawn as a dimensioned plan: a 64 unit canvas on a 4 unit grid, 8 unit strokes, closed above and below and open at the core. One route passes straight through the core; a dashed copper branch that tries to go around it stops on the closed bar.">
      <svg viewBox="0 6 660 600" role="img" aria-hidden="true">${markDrawing()}</svg>
      <figcaption><span>Held passage.</span> Work passes through the core; nothing passes around it.</figcaption>
    </figure>
  </div>
</section>

<section class="gates-sec" id="gates" aria-labelledby="gates-h">
  <div class="wrap"><div class="sec-head">
    <p class="eyebrow">The drawing set / ${sheets.length} sheets</p>
    <h2 id="gates-h">Follow one change through the gates.</h2>
    <p>Each sheet is drawn from a flow the code really runs, in its real order. Steps are named as the README names them; copper marks what a step stops, as an example of the class it addresses, not a promise to catch every case.</p>
  </div></div>
  <div class="set" data-set>
    <div class="stage">
      <div class="wrap stage-in">
        <div class="sheetframe">
          <div class="tabs" role="tablist" aria-label="Sheets">${sheetTabs}</div>
          <div class="sheets">${sheetArticles}</div>
          <div class="progress" aria-hidden="true"><span></span></div>
        </div>
      </div>
    </div>
  </div>
</section>

<section class="why" id="why" aria-labelledby="why-h">
  <div class="wrap why-grid">
    <div class="why-claim">
      <p class="eyebrow">Why it exists</p>
      <h2 id="why-h">Agents can write most of the code. They should not decide what ships.</h2>
      <dl class="hands">
        <div><dt>Structure</dt><dd>The project's own rules, committed: lint plugins, lint-meta registries, structure locks.</dd></div>
        <div><dt>Review</dt><dd>An independent reviewer and a merge you approve, never a merge on trust.</dd></div>
        <div><dt>Safety</dt><dd>Security rules in the linter, pinned workflow linters, auth defaults written down with their reasons.</dd></div>
      </dl>
    </div>
    <div class="why-body">
      <p>Coding agents are quick and tireless, and they optimise for done. Left alone they will skip the failing test, import across a layer or leave a secret where a CI job can read it. A rule that lives in a prompt is a suggestion.</p>
      <p>noctcore builds the other half: the rules a repo commits, the checks that run them, and the gates a change has to pass before it lands. The gates are enforced, not requested, and a check that could not run counts as a failure, never a pass.</p>
      <p>The tools are local-first and legible. There is no noctcore server and no account; the apps run on your machine and the libraries are small enough to read, with each rule naming the mistake it exists for.</p>
    </div>
  </div>
</section>

<section class="apps" id="apps" aria-labelledby="apps-h">
  <div class="wrap">
    <div class="sec-head sec-head-row">
      <p class="eyebrow">Apps</p>
      <h2 id="apps-h">Two desktop apps for running agents.</h2>
    </div>
    <div class="app-grid">${apps}</div>
  </div>
</section>

<section class="libs" id="libraries" aria-labelledby="libs-h">
  <div class="wrap">
    <div class="sec-head sec-head-row">
      <p class="eyebrow">Libraries and SDKs / ${total} packages</p>
      <h2 id="libs-h">The index.</h2>
      <p>Every package is MIT licensed and published to npm under <code>@noctcore</code> with provenance, through npm trusted publishing. Versions as of ${esc(new Date(data.checked).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }))}.</p>
    </div>
    <nav class="jump" aria-label="Jump to a family">${data.families.map((f) => `<a href="#lib-${f.id}">${flatMark(f.mark, 14)}<span>${esc(f.name)}</span><span class="jump-n">${f.packages.length}</span></a>`).join('')}</nav>
    <p class="legend" aria-label="Status key">${[['shipped', 'shipped'], ['active', 'active development'], ['preview', 'preview'], ['maintenance', 'maintenance']].map(([s, l]) => `<span class="item">${stateGlyph(s)}${l}</span>`).join('')}</p>
    <div class="families">${families}</div>
  </div>
</section>

<section class="principles" id="principles" aria-labelledby="pr-h">
  <div class="wrap">
    <div class="sec-head sec-head-row">
      <p class="eyebrow">Principles</p>
      <h2 id="pr-h">What every tool keeps to.</h2>
    </div>
    <div class="notes">
    <p class="notes-head"><span>General notes</span><span>Apply to every sheet</span></p>
    <ol class="pr-list">
      <li><span class="pr-n">01</span><h3>Local-first</h3><p>The tools run where your code already is. There is no noctcore server to send it to and no account to create.</p><p class="pr-proof"><span>Where it holds</span>Nightcore keeps per-project state in the project's <code>.nightcore/</code>; harness makes no network call.</p></li>
      <li><span class="pr-n">02</span><h3>Legible</h3><p>You can always see what a tool did and why. Commands are printed, rules name their mistake.</p><p class="pr-proof"><span>Where it holds</span>harness prints every command before it runs; each auth module opens with the attack it exists for.</p></li>
      <li><span class="pr-n">03</span><h3>Governed</h3><p>Agents move fast inside rules you define, not around them. Gates are enforced state, not advice.</p><p class="pr-proof"><span>Where it holds</span>Nightcore's gates are machine-enforced transitions; a harness check that could not run fails.</p></li>
      <li><span class="pr-n">04</span><h3>Zero runtime dependencies</h3><p>Where it can be done. Fewer things to trust, audit and pin.</p><p class="pr-proof"><span>Where it holds</span><code>@noctcore/harness</code> and the <code>@noctcore/auth</code> core install with no runtime dependencies.</p></li>
    </ol>
    </div>
  </div>
</section>
</main>

<footer class="foot">
  <div class="wrap foot-grid">
    <div class="foot-id">
      <a class="lockup" href="#top">${flatMark('noctcore', 26, 'mk mk-acc')}<span>noctcore</span></a>
      <p>Autonomy, governed.</p>
    </div>
    <nav class="foot-col" aria-label="Projects"><h2>Projects</h2>
      ${['nightcore', 'nysia', 'auth', 'harness', 'eslint-plugins', 'showcase-kit'].map((r) => ext(`https://github.com/noctcore/${r}`, r)).join('')}
    </nav>
    <nav class="foot-col" aria-label="Docs"><h2>Docs</h2>
      ${ext('https://noctcore.github.io/auth/', 'auth')}${ext('https://noctcore.github.io/harness/', 'harness')}${ext('https://noctcore.github.io/eslint-plugins/', 'eslint-plugins')}${ext('https://noctcore.github.io/showcase-kit/', 'showcase-kit')}
    </nav>
    <nav class="foot-col" aria-label="Elsewhere"><h2>Elsewhere</h2>
      ${ext('https://github.com/noctcore', 'GitHub')}${ext('https://www.npmjs.com/org/noctcore', 'npm')}${ext('mailto:support@shirone.dev', 'support@shirone.dev')}
    </nav>
  </div>
  <div class="wrap"><p class="foot-base">Open source under the MIT license. Set in Manrope and DM Mono (SIL Open Font License 1.1).</p></div>
</footer>
${inline ? `<script>${js}</script>` : `<script src="${js}" defer></script>`}
</body>
</html>
`;
}

/* ---------- favicon ---------- */
const markRects = [[12, 12, 40, 8], [12, 20, 8, 4], [44, 20, 8, 4], [12, 44, 40, 8], [12, 40, 8, 4], [44, 40, 8, 4], [28, 28, 8, 8]];
const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="#17212D"/><path fill="#AAC8E2" d="${markRects.map(([x, y, w, h]) => `M${x} ${y}h${w}v${h}h${-w}z`).join('')}"/></svg>`;

/* ---------- write ---------- */
const dist = join(root, 'dist');
rmSync(dist, { recursive: true, force: true });
mkdirSync(join(dist, 'assets'), { recursive: true });
const css = readFileSync(src('site.css'), 'utf8');
const js = readFileSync(src('site.js'), 'utf8');
writeFileSync(join(dist, 'assets/site.css'), css);
writeFileSync(join(dist, 'assets/site.js'), js);
for (const f of ['manrope-latin.woff2', 'dm-mono-latin.woff2']) copyFileSync(src(`fonts/${f}`), join(dist, 'assets', f));
writeFileSync(join(dist, 'favicon.svg'), favicon);
copyFileSync(src('brand/social-preview.png'), join(dist, 'og.png'));
for (const f of ['icon-512.png', 'apple-touch-icon.png']) if (existsSync(src(`brand/${f}`))) copyFileSync(src(`brand/${f}`), join(dist, f));
writeFileSync(join(dist, '.nojekyll'), '');
writeFileSync(join(dist, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${SITE}sitemap.xml\n`);
writeFileSync(
  join(dist, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${SITE}</loc><lastmod>${data.checked}</lastmod></url></urlset>\n`,
);
writeFileSync(
  join(dist, 'index.html'),
  page({
    css: 'assets/site.css',
    js: 'assets/site.js',
    fonts: { manrope: 'assets/manrope-latin.woff2', mono: 'assets/dm-mono-latin.woff2' },
    icon: { svg: 'favicon.svg', apple: existsSync(src('brand/apple-touch-icon.png')) ? 'apple-touch-icon.png' : '' },
    og: `${SITE}og.png`,
    inline: false,
  }),
);

const b64 = (p, type) => `data:${type};base64,${readFileSync(p).toString('base64')}`;
writeFileSync(
  join(root, 'preview.html'),
  page({
    css,
    js,
    fonts: { manrope: b64(src('fonts/manrope-latin.woff2'), 'font/woff2'), mono: b64(src('fonts/dm-mono-latin.woff2'), 'font/woff2') },
    icon: { svg: `data:image/svg+xml,${encodeURIComponent(favicon)}`, apple: '' },
    og: `${SITE}og.png`,
    inline: true,
  }),
);

// Copy rules: no em or en dashes anywhere in what ships.
for (const [name, body] of [['index.html', readFileSync(join(dist, 'index.html'), 'utf8')], ['site.css', css], ['site.js', js]]) {
  if (/[–—]/.test(body)) throw new Error(`${name} contains an em or en dash`);
}
console.log(`built dist/ and preview.html (${total} packages, ${sheets.length} sheets)`);
