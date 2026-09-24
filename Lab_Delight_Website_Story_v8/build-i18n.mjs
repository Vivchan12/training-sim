// Generates the Chinese pages from the English source.
//
// index.html is the only copy of the markup. Every translatable block carries
// a data-i18n key; i18n/<locale>.json holds that locale's copy, the meta tags,
// and the strings script.js renders at runtime. Editing the English page and
// re-running this keeps all three in step — hand-editing zh-CN/ or zh-HK/ does
// not, and will be overwritten.
//
//   node build-i18n.mjs

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { createHash } from 'crypto';

// Content hash for styles.css and script.js.
//
// Without this, a returning visitor keeps the stylesheet and script they
// already have: the language switcher renders unstyled and the hero rotator
// still cycles English phrases on a Chinese page, because the cached script
// predates the locale bundle. Stamping the URL makes a changed asset a
// different URL.
const rev = f => createHash('sha1').update(readFileSync(f)).digest('hex').slice(0, 8);
const ASSET_REV = { 'styles.css': rev('styles.css'), 'script.js': rev('script.js') };
const stamp = html => html
  .replace(/(href|src)="((?:\.\.\/)?)(styles\.css|script\.js)"/g,
           (m, attr, up, file) => `${attr}="${up}${file}?v=${ASSET_REV[file]}"`);

const SITE = 'https://www.labdelight.co';
const LOCALES = ['zh-CN', 'zh-HK'];

const source = readFileSync('index.html', 'utf8');
const en = JSON.parse(readFileSync('i18n/en.json', 'utf8'));

const escapeAttr = s => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;');

function build(locale) {
  const dict = JSON.parse(readFileSync(`i18n/${locale}.json`, 'utf8'));
  const meta = dict.__meta;
  let html = source;
  let translated = 0, fellBack = 0;

  // Replace the inner HTML of every keyed element.
  html = html.replace(
    /<([a-z0-9]+)([^>]*?)\sdata-i18n="([^"]+)"([^>]*)>([\s\S]*?)<\/\1>/g,
    (full, tag, before, key, after, inner) => {
      const value = dict[key];
      if (value === undefined) { fellBack++; return full; }
      translated++;
      return `<${tag}${before} data-i18n="${key}"${after}>${value}</${tag}>`;
    }
  );

  // Document language and per-locale meta.
  html = html.replace(/<html lang="[^"]*"/, `<html lang="${meta.lang}" data-locale="${locale}"`);
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${meta.title}</title>`);
  html = html.replace(/(<meta name="description" content=")[^"]*(")/, `$1${escapeAttr(meta.description)}$2`);
  html = html.replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${escapeAttr(meta.ogTitle)}$2`);
  html = html.replace(/(<meta name="twitter:title" content=")[^"]*(")/, `$1${escapeAttr(meta.ogTitle)}$2`);
  html = html.replace(/(<meta property="og:description" content=")[^"]*(")/, `$1${escapeAttr(meta.ogDescription)}$2`);
  html = html.replace(/(<meta name="twitter:description" content=")[^"]*(")/, `$1${escapeAttr(meta.ogDescription)}$2`);
  html = html.replace(/(<meta property="og:image:alt" content=")[^"]*(")/, `$1${escapeAttr(meta.ogImageAlt)}$2`);
  html = html.replace(/(<meta property="og:locale" content=")[^"]*(")/, `$1${meta.ogLocale}$2`);
  html = html.replace(/(<meta property="og:url" content=")[^"]*(")/, `$1${SITE}/${locale}/$2`);
  html = html.replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${SITE}/${locale}/$2`);

  // Assets and internal links resolve from the locale directory.
  html = html.replace(/(href|src|poster)="(assets\/|styles\.css|script\.js)/g, '$1="../$2');

  // The strings script.js renders at runtime, inlined before it loads.
  const payload = JSON.stringify(dict.__js).replace(/</g, '\\u003c');
  html = stamp(html);
  html = html.replace(`<script src="../script.js?v=${ASSET_REV['script.js']}"></script>`,
    `<script>window.__I18N__=${payload};</script>\n  <script src="../script.js?v=${ASSET_REV['script.js']}"></script>`);

  mkdirSync(locale, { recursive: true });
  writeFileSync(`${locale}/index.html`, html);
  console.log(`${locale}/index.html — ${translated} blocks translated${fellBack ? `, ${fellBack} fell back to English` : ''}`);
  if (fellBack) process.exitCode = 1;
}

// The English page declares its own locale so the switcher can mark it active.
writeFileSync('index.html', stamp(source.replace(/<html lang="en"(?! data-locale)/, '<html lang="en" data-locale="en"')));
LOCALES.forEach(build);
console.log('done');
