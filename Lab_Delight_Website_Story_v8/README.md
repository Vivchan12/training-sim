# Lab Delight Website Story v8

Updates in this version:

- Hero rotating outcome line now uses a single text element with a clean fade + slight lift transition.
  This removes the partial-letter / dot artifacts caused by stacked phrases.
- The rotating phrase area reserves enough height for two-line outcomes without exposing the next phrase.
- "Before the Build" is now an interactive question explorer.
- Visitors can select:
  - Can we build it?
  - Should we?
  - What problem matters?
  - Who is it for?
  - How should the work change?
  - What remains human?
  - Will people use it?
  - What would success look like?
- Selecting a question updates the large headline and shows a short educational explanation.
- Responsive and reduced-motion behaviour is preserved.

Open `index.html` locally or serve the folder with:

    python -m http.server 8899

Then visit:

    http://localhost:8899/
