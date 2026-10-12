# Vitaly Bogdel — portfolio

Static portfolio site: plain HTML/CSS/JS plus GSAP (CDN). No framework, no bundler.

## Structure

- `index.html` — home page (hero, selected work, why work with me, capabilities, FAQ, contact)
- `work/*.html` — case study pages, **generated** from `content/cases/*.json`
- `content/cases/*.json` — the text and images of each case study
- `build-cases.js` — regenerates `work/*.html` (`node build-cases.js`, no dependencies)
- `css/style.css`, `js/main.js` (home), `js/case.js` (case pages)
- `assets/images/` — photos and project images

## Editing a case study

1. Edit `content/cases/<slug>.json` (title, text, gallery, result …).
2. Run `node build-cases.js`.
3. Commit and push — Netlify also runs the script on every deploy.

Home page copy is edited directly in `index.html`.

## Previous version

The earlier design (with the Decap CMS admin) lives on the `old-design` branch.
