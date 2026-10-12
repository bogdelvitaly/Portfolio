# Vitaly Bogdel — portfolio

Static portfolio site: plain HTML/CSS/JS plus GSAP (CDN). No framework, no bundler.

## Editing content in the browser (recommended)

Open **`/admin`** on the live site (for example `https://vitaly-portfolio.netlify.app/admin/`) and log in.

- **Home Page** — every text on the home page: hero text, the tags line, headings, the project list
  (name, category, link, hover picture), capability cards, FAQ, footer, contact links.
- **Case Studies** — each case page: title, texts, tags, cover, gallery, result.

**Hero photo:** **Home Page → Hero — main photo**. Upload ONE wide picture (best 3440×1440 or larger, JPG/PNG/WebP, ratio about 2.4:1) and set **face position** (% from the left edge) so the phone and tablet crops stay on the face. On the next deploy `build-hero.js` cuts it into the five WebP files the site uses (ultrawide, two desktop sizes, tablet, phone) — it needs the `sharp` package, which Netlify installs from `package.json`. Leave the field empty to keep the current pictures.

**Order of cases:** drag the ≡ handle in **Home Page → Selected Work — project list**. That one order is used for the list on the home page and for the "More cases" block under every case. A new case must be created in *Case Studies* first and then added to that list (its "Case page address" is the case slug).

Press **Publish → Publish now**. The change is saved to the repository, Netlify rebuilds the site and it is live in 1–2 minutes.

Login uses Netlify Identity (invite-only). To invite someone: Netlify → Site → **Identity → Invite users**.
It needs **Identity** and **Git Gateway** to be enabled for the site.

## How it is built

| What | Source of truth | Generated file |
| --- | --- | --- |
| Home page texts | `content/site.json` | `index.html` (by `build-home.js`) |
| Case pages | `content/cases/*.json` | `work/*.html` (by `build-cases.js`) |

`node build.js` runs both (plain Node, no dependencies). Netlify runs it on every deploy (`netlify.toml`).
**Do not edit `index.html` or `work/*.html` by hand** — they are overwritten on the next build.
Page structure, menu, header, footer layout and the hero pictures live in `build-home.js` / `build-cases.js`.

Other files: `build-hero.js` (cuts the hero photo), `css/style.css`, `js/main.js` (home), `js/case.js` (case pages), `js/scale.js` (display-scaling
correction), `assets/images`, `assets/hero`, `assets/og` (link-preview covers).

## Editing from the code

1. Change `content/site.json` or `content/cases/<slug>.json`.
2. Run `node build.js`.
3. Commit and push to `main`.

Because the admin commits straight to `main`, run `git pull` before working locally again.

## Previous version

The earlier design (and its first admin) lives on the `old-design` branch.
