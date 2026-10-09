# vendor

Third-party code served from this site, pinned by filename.

## lenis-1.3.26

Smooth scroll. MIT, zero dependencies, 18.7 KB raw (~5.4 KB gzipped).
Upstream: https://github.com/darkroomengineering/lenis (Vivien's fork:
https://github.com/Vivchan12/lenis, an unmodified mirror of main).
Taken from the published release: https://unpkg.com/lenis@1.3.26/dist/

Vendored rather than loaded from a CDN for two reasons: the privacy
statement lists every third party that sees a visitor's IP, and adding
unpkg would mean adding it there; and the library makes no network calls
of its own, so serving it from our own origin keeps it that way.

The version is in the filename, so the file is immutable and needs no
cache-busting query. To upgrade, add the new file and change the three
references (index.html, build-insights.mjs, and script.js's guard).
