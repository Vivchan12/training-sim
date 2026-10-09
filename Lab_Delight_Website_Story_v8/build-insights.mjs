// Builds the Insights section from content/insights/*.md, in every locale.
//
//   node build-insights.mjs
//
// English posts live at content/insights/<slug>.md and publish to /insights.
// A translation lives at content/insights/<locale>/<slug>.md and publishes to
// /<locale>/insights. A post appears in a locale only when that file exists —
// there is no machine fallback, because silently serving English prose under a
// Chinese heading is worse than not listing the post at all. The hreflang set
// and the "also in" links are built from whatever actually exists.
//
// Chrome copy comes from i18n/<locale>.json, the same bundles the homepage
// uses, so the nav and footer cannot drift between the two sections.

import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'fs';
import { createHash } from 'crypto';
import { renderMarkdown, parseFrontMatter } from './lib/md.mjs';
import { checkHtml } from './lib/checkHtml.mjs';

const SITE = 'https://www.labdelight.co';
const DIR = 'content/insights';
const LOCALES = ['en', 'zh-CN', 'zh-HK'];

// Locale -> URL prefix, html lang, and the hreflang the alternates use.
const META = {
  'en':    { prefix: '',        lang: 'en',          hreflang: 'en' },
  'zh-CN': { prefix: '/zh-CN',  lang: 'zh-Hans',     hreflang: 'zh-Hans' },
  'zh-HK': { prefix: '/zh-HK',  lang: 'zh-Hant-HK',  hreflang: 'zh-Hant-HK' },
};
const NAMES = { 'en': 'English', 'zh-CN': '简体中文', 'zh-HK': '繁體中文' };

const rev = f => createHash('sha1').update(readFileSync(f)).digest('hex').slice(0, 8);
const ASSETS = { css: rev('styles.css'), js: rev('script.js') };
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const DICT = Object.fromEntries(LOCALES.map(l => [l, JSON.parse(readFileSync(`i18n/${l}.json`, 'utf8'))]));
const T = (loc, key) => DICT[loc].__insights[key];
const NAV = (loc, key) => DICT[loc][key] || DICT.en[key];

const fmtDate = (d, loc) =>
  new Date(d + 'T00:00:00Z').toLocaleDateString(T(loc, 'dateLocale'),
    { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

function chrome(opts) { const out = page(opts); checkHtml(out, opts.canonical); return out; }
function page({ loc, title, description, canonical, body, isPost, alternates }) {
  const m = META[loc], p = m.prefix;
  const alts = alternates.map(a =>
    `  <link rel="alternate" hreflang="${META[a.loc].hreflang}" href="${a.url}" />`).join('\n');
  return `<!doctype html>
<html lang="${m.lang}" data-locale="${loc}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="description" content="${esc(description)}" />
  <title>${esc(title)}</title>
  <link rel="canonical" href="${canonical}" />
${alts}
  <link rel="alternate" type="application/rss+xml" title="${esc(T(loc, 'rssTitle'))}" href="${SITE}${p}/insights/rss.xml" />

  <meta property="og:type" content="${isPost ? 'article' : 'website'}" />
  <meta property="og:site_name" content="Lab Delight" />
  <meta property="og:url" content="${canonical}" />
  <meta property="og:locale" content="${loc.replace('-', '_')}" />
  <meta property="og:title" content="${esc(title)}" />
  <meta property="og:description" content="${esc(description)}" />
  <meta property="og:image" content="${SITE}/assets/og-image.png" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${esc(title)}" />
  <meta name="twitter:description" content="${esc(description)}" />
  <meta name="twitter:image" content="${SITE}/assets/og-image.png" />

  <link rel="icon" type="image/png" href="/assets/logo.png" />
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/vendor/lenis-1.3.26.css" />
  <link rel="stylesheet" href="/styles.css?v=${ASSETS.css}" />
</head>
<body class="insights-body">
  <a class="skip-link" href="#content">${esc(T(loc, 'skip'))}</a>
  <div class="progress" aria-hidden="true"><span id="scrollProgress"></span></div>
  <header class="site-header is-solid" id="siteHeader">
    <a href="${p}/" class="brand" aria-label="${esc(T(loc, 'home'))}">
      <img src="/assets/logo.png" alt="" />
      <span>LAB DELIGHT</span>
    </a>
    <button class="menu-toggle" aria-label="${esc(T(loc, 'openNav'))}" aria-expanded="false"><span></span><span></span></button>
    <nav class="site-nav" aria-label="${esc(T(loc, 'mainNav'))}">
      <a href="${p}/#perspective">${esc(NAV(loc, 'top.perspective'))}</a>
      <a href="${p}/#how-we-help">${esc(NAV(loc, 'top.how-we-help'))}</a>
      <a href="${p}/#strategy">${esc(NAV(loc, 'top.transformation'))}</a>
      <a href="${p}/insights"${isPost ? '' : ' aria-current="page"'}>${esc(NAV(loc, 'top.insights'))}</a>
      <a href="${p}/#contact" class="nav-cta">${esc(NAV(loc, 'top.start-a-conversation'))}</a>
    </nav>

    <div class="lang-switch">
      <button type="button" class="lang-toggle" id="langToggle" aria-haspopup="true" aria-expanded="false" aria-label="Choose language / 选择语言">
        <span class="lang-current">${NAMES[loc]}</span>
        <svg viewBox="0 0 10 6" aria-hidden="true"><path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
      </button>
      <ul class="lang-menu" id="langMenu" aria-label="Language">
        <li><a href="/" hreflang="en" lang="en">English</a></li>
        <li><a href="/zh-HK/" hreflang="zh-Hant-HK" lang="zh-Hant-HK">繁體中文</a></li>
        <li><a href="/zh-CN/" hreflang="zh-Hans" lang="zh-Hans">简体中文</a></li>
      </ul>
    </div>
  </header>
  <main class="insights-main" id="content" tabindex="-1">
${body}
  </main>
  <!-- The privacy statement is English-only and lives at the root, so every
       locale links to /privacy. Localising this path 404s. -->
  <footer class="site-footer">
    <div class="footer-brand"><img src="/assets/logo.png" alt="" /><div><strong>LAB DELIGHT</strong><span>${esc(T(loc, 'footerTag'))}</span></div></div>
    <p>© <span id="year"></span> Lab Delight · <a href="/privacy">${esc(T(loc, 'privacy'))}</a></p>
  </footer>
  <script src="/vendor/lenis-1.3.26.min.js"></script>
  <script src="/script.js?v=${ASSETS.js}"></script>
</body>
</html>`;
}

// A line of its own reading {{figure:name}} splices in a hand-authored figure.
// A locale gets its own copy at figures/<locale>/name.html when one exists; a
// carousel is mostly text, so an English one on a Chinese page is a miss worth
// failing loudly about rather than falling back.
function renderBody(md, loc) {
  return md.split(/^\{\{figure:([a-z0-9-]+)\}\}\s*$/m).map((part, i) => {
    if (i % 2 === 0) return renderMarkdown(part);
    const file = loc === 'en' ? `${DIR}/figures/${part}.html` : `${DIR}/figures/${loc}/${part}.html`;
    if (!existsSync(file)) throw new Error(`${loc}: post references {{figure:${part}}} but ${file} is missing`);
    return readFileSync(file, 'utf8');
  }).join('\n');
}

function load(loc) {
  const dir = loc === 'en' ? DIR : `${DIR}/${loc}`;
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter(f => f.endsWith('.md')).map(f => {
    const { meta, body } = parseFrontMatter(readFileSync(`${dir}/${f}`, 'utf8'));
    for (const k of ['title', 'description', 'date', 'slug']) {
      if (!meta[k]) throw new Error(`${dir}/${f}: front matter is missing "${k}"`);
    }
    return { ...meta, html: renderBody(body, loc), file: f, loc };
  }).sort((a, b) => b.date.localeCompare(a.date) || (b.kicker || '').localeCompare(a.kicker || ''));
}

const BY_LOCALE = Object.fromEntries(LOCALES.map(l => [l, load(l)]));
// English is the source of truth for which slugs exist at all.
const SLUGS = new Set(BY_LOCALE.en.map(p => p.slug));
for (const l of LOCALES.filter(l => l !== 'en')) {
  for (const p of BY_LOCALE[l]) {
    if (!SLUGS.has(p.slug)) throw new Error(`${l}/${p.file}: slug "${p.slug}" has no English original`);
  }
}
const url = (loc, slug) => `${SITE}${META[loc].prefix}/insights${slug ? '/' + slug : ''}`;
const localesWith = slug => LOCALES.filter(l => BY_LOCALE[l].some(p => p.slug === slug));

const allPaths = [];

for (const loc of LOCALES) {
  const posts = BY_LOCALE[loc];
  if (!posts.length) continue;
  const prefix = META[loc].prefix.replace(/^\//, '');
  const dirOf = s => (prefix ? `${prefix}/insights/${s}` : `insights/${s}`);

  for (const p of posts) {
    const canonical = url(loc, p.slug);
    const others = localesWith(p.slug).filter(l => l !== loc);
    const schema = {
      '@context': 'https://schema.org', '@type': 'Article',
      headline: p.title, description: p.description, datePublished: p.date,
      inLanguage: META[loc].lang,
      author: { '@type': 'Organization', name: 'Lab Delight' },
      publisher: { '@type': 'Organization', name: 'Lab Delight' },
      mainEntityOfPage: canonical, image: `${SITE}/assets/og-image.png`,
    };
    const alsoIn = others.length ? `
      <p class="post-alt">${esc(T(loc, 'alsoIn'))}: ${others.map(l =>
        `<a href="${META[l].prefix}/insights/${p.slug}" hreflang="${META[l].hreflang}" lang="${META[l].lang}">${NAMES[l]}</a>`).join(' · ')}</p>` : '';
    const body = `    <article class="post">
      <a href="${META[loc].prefix}/insights" class="post-back">${esc(T(loc, 'back'))}</a>
      ${p.kicker ? `<p class="post-kicker">${esc(p.kicker)}</p>` : ''}
      <h1 class="post-title">${esc(p.title)}</h1>
      <p class="post-dek">${esc(p.description)}</p>
      <p class="post-date"><time datetime="${p.date}">${fmtDate(p.date, loc)}</time></p>${alsoIn}
      <div class="post-body">
${p.html}
      </div>
      <aside class="post-cta">
        <p class="eyebrow">${esc(T(loc, 'ctaEyebrow'))}</p>
        <h2>${esc(T(loc, 'ctaTitle'))}</h2>
        <p>${esc(T(loc, 'ctaBody'))}</p>
        <a href="${META[loc].prefix}/#contact" class="button button-dark">${esc(T(loc, 'ctaBtn'))}</a>
      </aside>
    </article>
    <script type="application/ld+json">${JSON.stringify(schema)}</script>`;
    mkdirSync(dirOf(p.slug), { recursive: true });
    writeFileSync(`${dirOf(p.slug)}/index.html`, chrome({
      loc, title: `${p.title} | Lab Delight`, description: p.description, canonical, body, isPost: true,
      alternates: localesWith(p.slug).map(l => ({ loc: l, url: url(l, p.slug) })),
    }));
    allPaths.push(canonical);
    console.log(`  ${META[loc].prefix}/insights/${p.slug}`);
  }

  const list = posts.map(p => `        <li class="insight-card">
          <a href="${META[loc].prefix}/insights/${p.slug}">
            ${p.kicker ? `<span class="post-kicker">${esc(p.kicker)}</span>` : ''}
            <h2>${esc(p.title)}</h2>
            <p>${esc(p.description)}</p>
            <time datetime="${p.date}">${fmtDate(p.date, loc)}</time>
          </a>
        </li>`).join('\n');

  const indexDir = prefix ? `${prefix}/insights` : 'insights';
  mkdirSync(indexDir, { recursive: true });
  writeFileSync(`${indexDir}/index.html`, chrome({
    loc, title: T(loc, 'indexTitle'), description: T(loc, 'indexDesc'), canonical: url(loc),
    alternates: LOCALES.filter(l => BY_LOCALE[l].length).map(l => ({ loc: l, url: url(l) })),
    body: `    <div class="insights-head">
      <h1 class="insights-label">${esc(T(loc, 'label'))}</h1>
    </div>
    <ul class="insight-list">
${list}
    </ul>`,
  }));
  allPaths.push(url(loc));
  console.log(`  ${META[loc].prefix}/insights (${posts.length} post${posts.length === 1 ? '' : 's'})`);

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel>
  <title>${esc(T(loc, 'rssTitle'))}</title>
  <link>${url(loc)}</link>
  <description>${esc(T(loc, 'rssDesc'))}</description>
  <language>${META[loc].hreflang}</language>
${posts.map(p => `  <item>
    <title>${esc(p.title)}</title>
    <link>${url(loc, p.slug)}</link>
    <guid>${url(loc, p.slug)}</guid>
    <pubDate>${new Date(p.date + 'T00:00:00Z').toUTCString()}</pubDate>
    <description>${esc(p.description)}</description>
  </item>`).join('\n')}
</channel></rss>`;
  writeFileSync(`${indexDir}/rss.xml`, rss);
  console.log(`  ${META[loc].prefix}/insights/rss.xml`);
}

// Sitemap entries for the section, merged into the existing sitemap
if (existsSync('sitemap.xml')) {
  let sm = readFileSync('sitemap.xml', 'utf8').replace(/\s*<!-- insights -->[\s\S]*?<!-- \/insights -->/, '');
  const lastmod = BY_LOCALE.en[0].date;
  const entries = allPaths.map(u =>
    `  <url><loc>${u}</loc><lastmod>${lastmod}</lastmod><changefreq>monthly</changefreq><priority>0.7</priority></url>`).join('\n');
  sm = sm.replace('</urlset>', `  <!-- insights -->\n${entries}\n  <!-- /insights -->\n</urlset>`);
  writeFileSync('sitemap.xml', sm);
  console.log(`  sitemap updated (${allPaths.length} entries)`);
}
