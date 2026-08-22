// Builds index.html and work/*.html from content/site.json + content/cases/*.json.
// Run after editing content by hand, or automatically on every Decap CMS commit
// (this is the Netlify build command — see README.md).
const fs = require('fs');
const path = require('path');

const root = __dirname;
const site = JSON.parse(fs.readFileSync(path.join(root, 'content', 'site.json'), 'utf8'));

const casesDir = path.join(root, 'content', 'cases');
const cases = fs
  .readdirSync(casesDir)
  .filter(f => f.endsWith('.json'))
  .map(f => JSON.parse(fs.readFileSync(path.join(casesDir, f), 'utf8')))
  .sort((a, b) => (a.order || 0) - (b.order || 0));

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

const FONT_LINKS = `<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@600;700;900&family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600&display=swap" rel="stylesheet">`;

const FAVICON = `<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='6' fill='%230B0C0E'/%3E%3Ctext x='16' y='22' font-family='Georgia,serif' font-size='17' font-weight='700' fill='%23FF7A45' text-anchor='middle'%3EVB%3C/text%3E%3C/svg%3E">`;

// Loaded on every page so a Netlify Identity invite/recovery link (which lands
// on the homepage) redirects straight into the CMS at /admin/.
const IDENTITY_SNIPPET = `<script src="https://identity.netlify.com/v1/netlify-identity-widget.js"></script>
<script>
  if (window.netlifyIdentity) {
    window.netlifyIdentity.on("init", user => {
      if (!user) {
        window.netlifyIdentity.on("login", () => {
          document.location.href = "/admin/";
        });
      }
    });
  }
</script>`;

function gsapScripts() {
  return `<script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/ScrollTrigger.min.js"></script>`;
}

function header(prefix) {
  return `<header class="site-header" data-header${prefix ? ' id="top"' : ''}>
  <div class="wrap header-inner">
    <a class="logo" href="${prefix}index.html#top" aria-label="Vitaly Bogdel — home">VB<span>.</span></a>

    <nav class="nav" aria-label="Primary">
      <a href="${prefix}index.html#work">Work</a>
      <a href="${prefix}index.html#about">About</a>
      <a href="${prefix}index.html#contact">Contact</a>
    </nav>

    <a class="btn btn-ghost header-cta" href="${prefix}index.html#contact">Let's talk</a>

    <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="mobile-nav" data-nav-toggle>
      <span></span><span></span><span></span>
      <span class="sr-only">Menu</span>
    </button>
  </div>
</header>

<div class="mobile-nav" id="mobile-nav" data-mobile-nav>
  <nav aria-label="Mobile">
    <a href="${prefix}index.html#work">Work</a>
    <a href="${prefix}index.html#about">About</a>
    <a href="${prefix}index.html#contact">Contact</a>
  </nav>
  <a class="btn btn-primary" href="${prefix}index.html#contact">Let's talk</a>
</div>`;
}

function footer() {
  return `<footer class="site-footer">
  <div class="wrap footer-inner">
    <p>© <span data-year></span> Vitaly Bogdel. All rights reserved.</p>
    <a href="#top">Back to top ↑</a>
  </div>
</footer>`;
}

// ---------------------------------------------------------------------------
// index.html
// ---------------------------------------------------------------------------

function renderWorkCard(c, i) {
  const isFeature = i === 0;
  const indexLabel = `${String(c.order).padStart(2, '0')} / ${String(cases.length).padStart(2, '0')}`;
  return `        <a class="work-card${isFeature ? ' work-card--feature' : ''}" data-reveal href="work/${c.slug}.html" aria-label="View case study: ${esc(c.title)}">
          <div class="work-media">
            <img src="${c.cover.image}" alt="${esc(c.cover.alt)}" width="1400" height="933" loading="lazy">
          </div>
          <div class="work-info">
            <span class="work-index">${indexLabel}</span>
            <p class="work-tag">${esc(c.category)}</p>
            <h3>${esc(c.title)}</h3>
            <p>${esc(c.cardSummary)}</p>
            <span class="work-cta">View case study →</span>
          </div>
        </a>`;
}

function renderCapability(cap, i) {
  return `        <li data-reveal>
          <span class="cap-index">${String(i + 1).padStart(2, '0')}</span>
          <h3>${esc(cap.title)}</h3>
          <p>${esc(cap.text)}</p>
        </li>`;
}

function buildIndex() {
  const marqueeItems = site.skills.map(s => `<span>${esc(s)}</span><span>·</span>`).join('\n        ');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Vitaly Bogdel — UX/UI &amp; Product Designer</title>
<meta name="description" content="Vitaly Bogdel is a UX/UI and product designer with 5+ years of experience shipping interfaces for fintech, insurance, logistics and e-commerce products.">

${FONT_LINKS}

<link rel="stylesheet" href="css/style.css">
${FAVICON}
</head>
<body>

<a class="skip-link" href="#main">Skip to content</a>

<div class="grain" aria-hidden="true"></div>

${header('')}

<main id="main">

  <!-- HERO -->
  <section class="hero" id="top">
    <div class="wrap hero-grid">
      <div class="hero-copy">
        <p class="eyebrow" data-reveal>${esc(site.heroEyebrow)}</p>
        <h1 class="hero-title" data-hero-title>
          <span class="hero-line">${esc(site.heroLine1)}</span>
          <span class="hero-line">${esc(site.heroLine2)}</span>
        </h1>
        <p class="hero-sub" data-reveal>
          ${esc(site.heroSub)}
        </p>

        <div class="hero-actions" data-reveal>
          <a class="btn btn-primary" href="#work">${esc(site.ctaPrimary)}</a>
          <a class="btn btn-ghost" href="#contact">${esc(site.ctaSecondary)}</a>
        </div>

        <dl class="hero-meta" data-reveal>
          <div><dt>Experience</dt><dd>${esc(site.metaExperience)}</dd></div>
          <div><dt>Shipped</dt><dd>${esc(site.metaShipped)}</dd></div>
          <div><dt>Focus</dt><dd>${esc(site.metaFocus)}</dd></div>
        </dl>
      </div>

      <div class="hero-portrait" data-reveal>
        <div class="portrait-frame">
          <img src="${site.portraitImage}" alt="${esc(site.portraitAlt)}" width="606" height="810" fetchpriority="high">
        </div>
        <p class="portrait-caption">${esc(site.portraitCaption)}</p>
      </div>
    </div>
  </section>

  <!-- MARQUEE -->
  <section class="marquee-section" aria-label="Core skills">
    <div class="marquee" data-marquee>
      <div class="marquee-track">
        ${marqueeItems}
      </div>
      <div class="marquee-track" aria-hidden="true">
        ${marqueeItems}
      </div>
    </div>
  </section>

  <!-- WORK -->
  <section class="work" id="work">
    <div class="wrap">
      <div class="section-head" data-reveal>
        <p class="eyebrow">${esc(site.workEyebrow)} — 01–${String(cases.length).padStart(2, '0')}</p>
        <h2>${esc(site.workHeading)}</h2>
      </div>

      <div class="work-list">

${cases.map(renderWorkCard).join('\n\n')}

      </div>
    </div>
  </section>

  <!-- ABOUT / CAPABILITIES -->
  <section class="about" id="about">
    <div class="wrap about-grid">
      <div class="about-intro" data-reveal>
        <p class="eyebrow">${esc(site.aboutEyebrow)}</p>
        <h2>${esc(site.aboutHeading)}</h2>
${site.aboutParagraphs.map(p => `        <p>\n          ${esc(p)}\n        </p>`).join('\n')}
      </div>

      <ul class="capabilities">
${site.capabilities.map(renderCapability).join('\n')}
      </ul>
    </div>
  </section>

  <!-- CONTACT -->
  <section class="contact" id="contact">
    <div class="wrap">
      <div class="contact-inner" data-reveal>
        <p class="eyebrow">${esc(site.contactEyebrow)}</p>
        <h2>${esc(site.contactHeadingLine1)}<br>${esc(site.contactHeadingLine2)}</h2>
        <p class="contact-sub">${esc(site.contactSub)}</p>
        <a class="contact-email" href="mailto:${esc(site.email)}">${esc(site.email)}</a>

        <div class="social-row">
          <a href="${esc(site.linkedin)}" target="_blank" rel="noopener noreferrer" aria-label="Vitaly Bogdel on LinkedIn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6.94 8.5H3.56V20.5H6.94V8.5Z" fill="currentColor"/><path d="M5.25 7.03C6.35 7.03 7.25 6.13 7.25 5.02C7.25 3.9 6.35 3 5.25 3C4.14 3 3.25 3.9 3.25 5.02C3.25 6.13 4.14 7.03 5.25 7.03Z" fill="currentColor"/><path d="M13.28 8.5H10.05V20.5H13.43V14.32C13.43 12.61 13.75 10.96 15.87 10.96C17.96 10.96 17.99 12.91 17.99 14.43V20.5H21.37V13.76C21.37 10.84 20.74 8.2 17.34 8.2C15.71 8.2 14.62 9.1 14.17 9.95H14.12L13.28 8.5Z" fill="currentColor"/></svg>
          </a>
          <a href="${esc(site.instagram)}" target="_blank" rel="noopener noreferrer" aria-label="Vitaly Bogdel on Instagram">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" stroke-width="1.6"/><circle cx="12" cy="12" r="4.2" stroke="currentColor" stroke-width="1.6"/><circle cx="17.15" cy="6.85" r="1.15" fill="currentColor"/></svg>
          </a>
        </div>
      </div>
    </div>
  </section>

</main>

${footer()}

${gsapScripts()}
<script src="js/main.js"></script>
${IDENTITY_SNIPPET}
</body>
</html>
`;

  fs.writeFileSync(path.join(root, 'index.html'), html);
  console.log('wrote index.html');
}

// ---------------------------------------------------------------------------
// work/<slug>.html
// ---------------------------------------------------------------------------

function renderSection(s) {
  const paras = (s.paragraphs || []).map(t => `        <p>${esc(t)}</p>`).join('\n');
  const list =
    s.list && s.list.length
      ? `\n        <ul>\n${s.list.map(li => `          <li>${esc(li)}</li>`).join('\n')}\n        </ul>`
      : '';
  return `      <div class="case-section" data-reveal>
        <h2>${esc(s.heading)}</h2>
        <div class="case-section-copy">
${paras}${list}
        </div>
      </div>`;
}

function renderGallery(gallery) {
  if (!gallery || !gallery.length) return '';
  const imgs = gallery
    .map((src, i) => {
      const span = gallery.length % 2 === 1 && i === gallery.length - 1 ? ' data-span-2' : '';
      return `        <img src="${src}" alt="" loading="lazy"${span}>`;
    })
    .join('\n');
  return `
      <div class="case-gallery" data-reveal>
${imgs}
      </div>`;
}

function renderResult(result) {
  if (!result) return '';
  return `

      <div class="case-section case-section--result" data-reveal>
        <h2>Result</h2>
        <div class="case-section-copy">
          <p>${esc(result)}</p>
        </div>
      </div>`;
}

function renderCase(c, next) {
  const indexLabel = `${String(c.order).padStart(2, '0')} / ${String(cases.length).padStart(2, '0')}`;
  const metaChips = c.meta.map(m => `<span>${esc(m)}</span>`).join('');
  const sectionsHtml = c.sections.map(renderSection).join('\n\n');
  const galleryHtml = renderGallery(c.gallery);
  const resultHtml = renderResult(c.result);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(c.title)} — Case Study — Vitaly Bogdel</title>
<meta name="description" content="${esc(c.sub)}">

${FONT_LINKS}

<link rel="stylesheet" href="../css/style.css">
${FAVICON}
</head>
<body>

<a class="skip-link" href="#main">Skip to content</a>

<div class="grain" aria-hidden="true"></div>

${header('../')}

<main id="main">
  <div class="wrap">
    <a class="case-back" href="../index.html#work">&larr; All work</a>
  </div>

  <section class="case-hero">
    <div class="wrap">
      <p class="eyebrow" data-reveal>${esc(c.category)} — ${indexLabel}</p>
      <h1 data-reveal>${esc(c.title)}</h1>
      <p class="case-sub" data-reveal>${esc(c.sub)}</p>
      <div class="case-meta" data-reveal>${metaChips}</div>
      <div class="case-cover" data-reveal>
        <img src="${c.cover.image}" alt="${esc(c.cover.alt)}" width="1400" height="933" fetchpriority="high">
      </div>
    </div>
  </section>

  <section>
    <div class="wrap case-body">
${sectionsHtml}${galleryHtml}${resultHtml}
    </div>
  </section>

  <section class="case-next">
    <div class="wrap">
      <p class="eyebrow case-next-label" data-reveal>Next case</p>
      <a class="case-next-card" href="${next.slug}.html" data-reveal>
        <div>
          <p class="work-tag">${esc(next.category)}</p>
          <h3>${esc(next.title)}</h3>
        </div>
        <span class="btn btn-ghost">View case →</span>
      </a>
    </div>
  </section>
</main>

${footer()}

${gsapScripts()}
<script src="../js/main.js"></script>
</body>
</html>
`;

  return html;
}

function buildCases() {
  const outDir = path.join(root, 'work');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

  const existing = new Set(fs.readdirSync(outDir).filter(f => f.endsWith('.html')));
  const expected = new Set(cases.map(c => `${c.slug}.html`));

  cases.forEach((c, i) => {
    const next = cases[(i + 1) % cases.length];
    fs.writeFileSync(path.join(outDir, `${c.slug}.html`), renderCase(c, next));
    console.log('wrote work/' + c.slug + '.html');
  });

  // Remove stale pages for cases that were deleted from content/cases.
  for (const file of existing) {
    if (!expected.has(file)) {
      fs.unlinkSync(path.join(outDir, file));
      console.log('removed stale work/' + file);
    }
  }
}

buildIndex();
buildCases();
