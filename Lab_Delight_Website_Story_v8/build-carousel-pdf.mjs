// Renders an Insight carousel to a LinkedIn-ready PDF — one card per page at
// 1080x1350 (4:5), full bleed.
//
//   node build-carousel-pdf.mjs three-questions
//
// The cards are not re-laid out for print. The print page drops each one in at
// its design size and scales it, so the PDF is the same artwork the post shows
// rather than a second version that can drift from it.
//
// Needs the local static server running (the card background and stylesheet are
// served from it) and Google Chrome for the headless print.

import { readFileSync, writeFileSync, unlinkSync, mkdirSync } from 'fs';
import { execFileSync } from 'child_process';

const name = process.argv[2] || 'three-questions';
const out = process.argv[3] || `dist/${name}-carousel.pdf`;
const ORIGIN = process.env.ORIGIN || 'http://localhost:8899';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const CARD_W = 336, CARD_H = 420;          // the card's design size
const PAGE_W = 1080, PAGE_H = 1350;        // LinkedIn's 4:5 carousel page
const SCALE = PAGE_W / CARD_W;

const figure = readFileSync(`content/insights/figures/${name}.html`, 'utf8');
const slides = figure.match(/<article class="slide[\s\S]*?<\/article>/g);
if (!slides) throw new Error(`no slides found in content/insights/figures/${name}.html`);

const page = `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${ORIGIN}/styles.css">
<style>
  @page { size: ${PAGE_W}px ${PAGE_H}px; margin: 0 }
  /* body carries .carousel so the scoped card rules apply — but .carousel's
     own margin is (0,1,0) and beats a bare body rule, which pushed the
     content down and produced a ninth, blank page. */
  html, body.carousel { margin:0; padding:0; background:#fff }
  .pdf-page { width:${PAGE_W}px; height:${PAGE_H}px; overflow:hidden; page-break-after:always; break-after:page }
  .pdf-page:last-child { page-break-after:auto; break-after:auto }
  /* The card keeps its design size and is scaled up, so the PDF and the web
     carousel are the same artwork. Full bleed, so no rounded corners. */
  .carousel .slide { flex:none; width:${CARD_W}px; height:${CARD_H}px; min-height:0; aspect-ratio:auto;
                     border:0; border-radius:0; transform:scale(${SCALE}); transform-origin:top left }
</style></head>
<body class="carousel">
${slides.map(s => `<div class="pdf-page">${s}</div>`).join('\n')}
</body></html>`;

mkdirSync('dist', { recursive: true });
const tmp = `carousel-print-${name}.html`;          // served from the site root
writeFileSync(tmp, page);
try {
  execFileSync(CHROME, [
    '--headless', '--disable-gpu', '--no-sandbox',
    '--no-pdf-header-footer',
    '--virtual-time-budget=12000',           // let the font and the photo land
    `--print-to-pdf=${out}`,
    `${ORIGIN}/${tmp}`,
  ], { stdio: 'pipe' });
} finally {
  unlinkSync(tmp);
}
console.log(`  ${out} — ${slides.length} pages at ${PAGE_W}x${PAGE_H}`);
