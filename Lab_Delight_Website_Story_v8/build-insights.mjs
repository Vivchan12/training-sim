// Builds the Insights section from content/insights/*.md
//
//   node build-insights.mjs
//
// Produces /insights (index), /insights/<slug> (each post) and /insights/rss.xml,
// reusing the site's existing stylesheet and header so posts look like the rest
// of the site rather than a bolted-on blog.
//
// Posts are English for now. The nav link is added to the English page only —
// sending a Chinese reader into an English article without warning is worse
// than not linking it yet.

import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'fs';
import { createHash } from 'crypto';
import { renderMarkdown, parseFrontMatter } from './lib/md.mjs';

const SITE = 'https://www.labdelight.co';
const DIR = 'content/insights';

const rev = f => createHash('sha1').update(readFileSync(f)).digest('hex').slice(0, 8);
const ASSETS = { css: rev('styles.css'), js: rev('script.js') };
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const fmtDate = d => new Date(d + 'T00:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

function chrome({ title, description, canonical, body, isPost }) {
  return `<!doctype html>
<html lang="en" data-locale="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="description" content="${esc(description)}" />
  <title>${esc(title)}</title>
  <link rel="canonical" href="${canonical}" />
  <link rel="alternate" type="application/rss+xml" title="Lab Delight Insights" href="${SITE}/insights/rss.xml" />

  <meta property="og:type" content="${isPost ? 'article' : 'website'}" />
  <meta property="og:site_name" content="Lab Delight" />
  <meta property="og:url" content="${canonical}" />
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
  <link rel="stylesheet" href="/styles.css?v=${ASSETS.css}" />
</head>
<body class="insights-body">
  <div class="progress" aria-hidden="true"><span id="scrollProgress"></span></div>
  <header class="site-header is-solid" id="siteHeader">
    <a href="/" class="brand" aria-label="Lab Delight home">
      <img src="/assets/logo.png" alt="" />
      <span>LAB DELIGHT</span>
    </a>
    <button class="menu-toggle" aria-label="Open navigation" aria-expanded="false"><span></span><span></span></button>
    <nav class="site-nav" aria-label="Main navigation">
      <a href="/#perspective">Perspective</a>
      <a href="/#how-we-help">How we help</a>
      <a href="/#strategy">Transformation</a>
      <a href="/insights" aria-current="page">Insights</a>
      <a href="/#contact" class="nav-cta">Start a conversation</a>
    </nav>

    <div class="lang-switch">
      <button type="button" class="lang-toggle" id="langToggle" aria-haspopup="listbox" aria-expanded="false" aria-label="Choose language / \u9009\u62e9\u8bed\u8a00">
        <span class="lang-current">English</span>
        <svg viewBox="0 0 10 6" aria-hidden="true"><path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
      </button>
      <ul class="lang-menu" id="langMenu" role="listbox">
        <li role="option"><a href="/" hreflang="en" lang="en">English</a></li>
        <li role="option"><a href="/zh-HK/" hreflang="zh-Hant-HK" lang="zh-Hant-HK">\u7e41\u9ad4\u4e2d\u6587</a></li>
        <li role="option"><a href="/zh-CN/" hreflang="zh-Hans" lang="zh-Hans">\u7b80\u4f53\u4e2d\u6587</a></li>
      </ul>
    </div>
  </header>
  <main class="insights-main">
${body}
  </main>
  <footer class="site-footer">
    <div class="footer-brand"><img src="/assets/logo.png" alt="" /><div><strong>LAB DELIGHT</strong><span>Leverage digital and AI for meaningful progress.</span></div></div>
    <p>© <span id="year"></span> Lab Delight · <a href="/privacy">Privacy</a></p>
  </footer>
  <script src="/script.js?v=${ASSETS.js}"></script>
</body>
</html>`;
}

const posts = readdirSync(DIR).filter(f => f.endsWith('.md')).map(f => {
  const { meta, body } = parseFrontMatter(readFileSync(`${DIR}/${f}`, 'utf8'));
  for (const k of ['title', 'description', 'date', 'slug']) {
    if (!meta[k]) throw new Error(`${f}: front matter is missing "${k}"`);
  }
  return { ...meta, html: renderMarkdown(body), file: f };
}).sort((a, b) => b.date.localeCompare(a.date) || (b.kicker || '').localeCompare(a.kicker || ''));

// Individual posts
for (const p of posts) {
  const url = `${SITE}/insights/${p.slug}`;
  const schema = {
    '@context': 'https://schema.org', '@type': 'Article',
    headline: p.title, description: p.description, datePublished: p.date,
    author: { '@type': 'Organization', name: 'Lab Delight' },
    publisher: { '@type': 'Organization', name: 'Lab Delight' },
    mainEntityOfPage: url, image: `${SITE}/assets/og-image.png`,
  };
  const body = `    <article class="post">
      <a href="/insights" class="post-back">← All insights</a>
      ${p.kicker ? `<p class="post-kicker">${esc(p.kicker)}</p>` : ''}
      <h1 class="post-title">${esc(p.title)}</h1>
      <p class="post-dek">${esc(p.description)}</p>
      <p class="post-date"><time datetime="${p.date}">${fmtDate(p.date)}</time></p>
      <div class="post-body">
${p.html}
      </div>
      <aside class="post-cta">
        <p class="eyebrow">Start with the problem</p>
        <h2>Where could digital or AI make a meaningful difference in your organisation?</h2>
        <p>You do not need a perfectly defined use case. Tell us what you are trying to improve.</p>
        <a href="/#contact" class="button button-dark">Start a conversation</a>
      </aside>
    </article>
    <script type="application/ld+json">${JSON.stringify(schema)}</script>`;
  mkdirSync(`insights/${p.slug}`, { recursive: true });
  writeFileSync(`insights/${p.slug}/index.html`, chrome({
    title: `${p.title} | Lab Delight`, description: p.description, canonical: url, body, isPost: true,
  }));
  console.log(`  /insights/${p.slug}`);
}

// Index
const list = posts.map(p => `        <li class="insight-card">
          <a href="/insights/${p.slug}">
            ${p.kicker ? `<span class="post-kicker">${esc(p.kicker)}</span>` : ''}
            <h2>${esc(p.title)}</h2>
            <p>${esc(p.description)}</p>
            <time datetime="${p.date}">${fmtDate(p.date)}</time>
          </a>
        </li>`).join('\n');

mkdirSync('insights', { recursive: true });
writeFileSync('insights/index.html', chrome({
  title: 'Insights | Lab Delight',
  description: 'Notes on digital and AI transformation — what actually changes, what usually goes wrong, and what to check before you build.',
  canonical: `${SITE}/insights`,
  body: `    <div class="insights-head">
      <h1 class="insights-label">Insights</h1>
    </div>
    <ul class="insight-list">
${list}
    </ul>`,
}));
console.log(`  /insights (${posts.length} post${posts.length === 1 ? '' : 's'})`);

// RSS
const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel>
  <title>Lab Delight Insights</title>
  <link>${SITE}/insights</link>
  <description>Notes on digital and AI transformation.</description>
  <language>en</language>
${posts.map(p => `  <item>
    <title>${esc(p.title)}</title>
    <link>${SITE}/insights/${p.slug}</link>
    <guid>${SITE}/insights/${p.slug}</guid>
    <pubDate>${new Date(p.date + 'T00:00:00Z').toUTCString()}</pubDate>
    <description>${esc(p.description)}</description>
  </item>`).join('\n')}
</channel></rss>`;
writeFileSync('insights/rss.xml', rss);
console.log('  /insights/rss.xml');

// Sitemap entries for the section, merged into the existing sitemap
if (existsSync('sitemap.xml')) {
  let sm = readFileSync('sitemap.xml', 'utf8').replace(/\s*<!-- insights -->[\s\S]*?<!-- \/insights -->/, '');
  const entries = [`${SITE}/insights`, ...posts.map(p => `${SITE}/insights/${p.slug}`)]
    .map(u => `  <url><loc>${u}</loc><lastmod>${posts[0].date}</lastmod><changefreq>monthly</changefreq><priority>0.7</priority></url>`).join('\n');
  sm = sm.replace('</urlset>', `  <!-- insights -->\n${entries}\n  <!-- /insights -->\n</urlset>`);
  writeFileSync('sitemap.xml', sm);
  console.log('  sitemap updated');
}
