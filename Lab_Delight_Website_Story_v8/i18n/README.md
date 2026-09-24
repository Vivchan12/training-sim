# Translations

`index.html` is the only copy of the markup. Every translatable block carries a
`data-i18n` key; each locale's copy lives in `<locale>.json`, which also holds
that locale's meta tags and the strings `script.js` renders at runtime.

```
node build-i18n.mjs
```

regenerates `zh-CN/index.html` and `zh-HK/index.html`.

**Edit the English page and the JSON, then rebuild.** Hand-edits to `zh-CN/` or
`zh-HK/` are overwritten on the next run.

Adding copy to `index.html`? Give the element a `data-i18n="section.some-key"`,
add the same key to all three JSON files, and rebuild. The build reports any
key that falls back to English and exits non-zero, so a missed translation
fails loudly rather than shipping in the wrong language.

`_translations.cjs` is the authoring source — one row per key holding both
Chinese variants side by side — and `assemble` in the git history shows how the
locale files were produced from it.

## Which Chinese

- `zh-CN` — Simplified, Mainland vocabulary (信息, 邮箱, 优先次序)
- `zh-HK` — Traditional, Hong Kong vocabulary (資訊, 電郵, 質素, 私隱)

They are authored separately rather than converted between scripts, because the
two differ in word choice as well as characters.

## Insights

Posts are Markdown in `content/insights/`, with front matter:

```
---
title: ...
description: ...   # used as the dek, the meta description and the OG description
kicker: Insight 01  # optional
date: 2026-09-24
slug: url-slug
---
```

```
node build-insights.mjs
```

generates `/insights`, each `/insights/<slug>`, `/insights/rss.xml`, and the
sitemap entries. It throws if front matter is incomplete rather than publishing
a post with a missing title.

Posts are English only for now, and the nav link appears on the English page
alone — sending a Chinese reader into an English article unannounced is worse
than not linking it yet. When a post is worth translating, add it as a locale
variant and link it from the Chinese nav.
