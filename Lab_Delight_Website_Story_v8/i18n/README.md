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

## Translating a post

Put the translation at `content/insights/<locale>/<slug>.md`, keeping the same
`slug` and `date` as the English original. Translate `title`, `description` and
`kicker`; leave `slug` alone, since it is what ties the three versions together
for hreflang and the "also in" links.

A post appears in a locale **only when that file exists**. There is no machine
fallback: serving English prose under a Chinese heading reads worse than simply
not listing the post. The same rule applies to a `{{figure:name}}` — a locale
needs its own `content/insights/figures/<locale>/name.html`, and the build fails
loudly rather than dropping English cards into a Chinese page.

Section chrome (nav, back link, CTA, footer, RSS titles) lives under
`__insights` in each `i18n/<locale>.json`, so it cannot drift from the homepage.
Dates format from `__insights.dateLocale`.

Terminology, matching the homepage: **数字化** for zh-CN, **數碼** for zh-HK, and
Hong Kong vocabulary in the Traditional set (軟件, 數據, 質素, 持份者).

Translations to date were drafted by Claude and have not had a native-speaker
review. Editing the `.md` and re-running the build is all that is needed.
