/* Generates index.html from content/site.json (edited in the /admin panel).
   Run after changing the file by hand:  node build-home.js     (no dependencies — plain Node.)
   Everything that is not text (hero pictures, menu, header, scripts) lives here in the template. */
const fs = require("fs");
const path = require("path");

const root = __dirname;
const site = JSON.parse(fs.readFileSync(path.join(root, "content", "site.json"), "utf8"));

// Absolute address of the published site: social networks need full URLs for link previews.
const SITE_URL = "https://vitaly-portfolio.netlify.app";
const OG_IMAGE = SITE_URL + "/assets/og/home-v3.jpg";

const esc = (s) => String(s == null ? "" : s)
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
// "/assets/images/x.webp" (site-absolute, as stored in the JSON) -> "assets/images/x.webp" (relative to the site root)
const rel = (p) => String(p || "").replace(/^\/+/, "");
const arr = (v) => (Array.isArray(v) ? v : []);

const ARROW = '<svg viewBox="0 0 34 32" width="34" height="32" aria-hidden="true"><rect x="0.5" y="0.5" width="33" height="31" fill="none" stroke="currentColor"/><path d="M21.3536 16.3536C21.5488 16.1583 21.5488 15.8417 21.3536 15.6464L18.1716 12.4645C17.9763 12.2692 17.6597 12.2692 17.4645 12.4645C17.2692 12.6597 17.2692 12.9763 17.4645 13.1716L20.2929 16L17.4645 18.8284C17.2692 19.0237 17.2692 19.3403 17.4645 19.5355C17.6597 19.7308 17.9763 19.7308 18.1716 19.5355L21.3536 16.3536ZM13 16L13 16.5L21 16.5L21 16L21 15.5L13 15.5L13 16Z" fill="currentColor"/></svg>';

// The "item" fields come from the CMS list widgets, which store plain strings
const text = (v) => (v && typeof v === "object" ? (v.item || v.tag || v.value || "") : v);

const tagList = (hidden) =>
  `        <ul class="tags-set"${hidden ? ' aria-hidden="true"' : ""}>\n          ${arr(site.tags).map((t) => `<li>${esc(text(t))}</li>`).join("")}\n        </ul>`;

const workRows = arr(site.works).map((w, i) => `        <li><a class="work-row" href="work/${esc(w.caseSlug)}.html" data-preview="${esc(rel(w.image))}">
          <span class="work-num">${String(i + 1).padStart(2, "0")}</span><span class="work-title">${esc(w.title)}</span><span class="work-cat">${esc(w.category)}</span><span class="work-arrow">${ARROW}</span>
        </a></li>`).join("\n");

const workSlides = arr(site.works).map((w) => `        <img src="${esc(rel(w.image))}" alt="" data-slide>`).join("\n");

const cards = arr(site.cards).map((c) => `          <article class="svc-card">
            <h3>${esc(c.title)}</h3>
            <ul>${arr(c.items).map((it) => `<li>${esc(text(it))}</li>`).join("")}</ul>
          </article>`).join("\n");

const faq = arr(site.faq).map((f, i) => {
  const n = i + 1, open = i === 0;
  return `        <div class="faq-item${open ? " is-open" : ""}" data-reveal>
          <h3><button type="button" class="faq-q" aria-expanded="${open}" aria-controls="faq-a${n}" id="faq-q${n}"><span class="faq-q-text">${esc(f.question)}</span><span class="faq-btn" aria-hidden="true"></span></button></h3>
          <div class="faq-a" id="faq-a${n}" role="region" aria-labelledby="faq-q${n}"><div><p>${esc(f.answer)}</p></div></div>
        </div>`;
}).join("\n");

const introNote = arr(site.introNote).map((p) => `          <p>${esc(text(p))}</p>`).join("\n");

const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(site.seoTitle)}</title>
  <meta name="description" content="${esc(site.seoDescription)}">
  <link rel="canonical" href="${SITE_URL}/">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Vitaly Bogdel">
  <meta property="og:title" content="${esc(site.seoTitle)}">
  <meta property="og:description" content="${esc(site.seoDescription)}">
  <meta property="og:url" content="${SITE_URL}/">
  <meta property="og:image" content="${OG_IMAGE}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="${esc(site.ogImageAlt)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="theme-color" content="#070707">
  <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' fill='%23070707'/%3E%3Ctext x='16' y='22' font-family='Arial' font-size='15' font-weight='700' fill='%23ff5800' text-anchor='middle'%3EVB%3C/text%3E%3C/svg%3E">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Bruno+Ace+SC&family=IBM+Plex+Mono:wght@300;400;500&family=IBM+Plex+Sans:wght@400;500&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="css/style.css">
  <script src="js/scale.js"></script>
</head>
<body>
  <a class="skip-link" href="#work">Skip to work</a>

  <header class="site-header" data-header>
    <a class="logo" href="#top" aria-label="V. Bogdel — home"><span>V</span><span class="logo-dot">.</span><span> BOGDEL</span><span class="logo-dot">.</span></a>
    <nav class="tabs" aria-label="Main">
      <a class="tab" href="#top"><span class="tab-name">Home</span><span class="tab-num">01</span></a>
      <a class="tab" href="#work"><span class="tab-name">Work</span><span class="tab-num">02</span></a>
      <a class="tab" href="#about"><span class="tab-name">About</span><span class="tab-num">03</span></a>
      <a class="tab" href="#contact"><span class="tab-name">Contact</span><span class="tab-num">04</span></a>
    </nav>
    <a class="btn-outline" href="#contact">Let's talk</a>
    <button class="burger" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="mobile-nav" data-nav-toggle><span></span><span></span><span></span></button>
  </header>

  <div class="mobile-nav" id="mobile-nav" data-mobile-nav aria-hidden="true">
    <nav aria-label="Mobile">
      <a href="#top"><span>Home</span><sup>01</sup></a>
      <a href="#work"><span>Work</span><sup>02</sup></a>
      <a href="#about"><span>About</span><sup>03</sup></a>
      <a href="#contact"><span>Contact</span><sup>04</sup></a>
    </nav>
    <a class="btn-outline" href="#contact">Let's talk</a>
  </div>

  <main>
    <!-- Hero -->
    <section class="hero" id="top">
      <div class="hero-bg" role="img" aria-label="Portrait of Vitaly Bogdel"></div>
      <div class="hero-bottom">
        <h1 class="hero-title"><img class="wordmark-std" src="assets/hero/product-designer.svg" alt="Vitaly Bogdel — Product Designer" width="1880" height="310"><img class="wordmark-wide" src="assets/hero/product-designer-wide.svg" alt="Vitaly Bogdel — Product Designer" width="3400" height="128"></h1>
        <div class="hero-meta">
          <p class="hero-desc">${esc(site.heroDescription)}</p>
          <p class="hero-role">${esc(site.heroRole)}</p>
        </div>
      </div>
    </section>

    <!-- Tags -->
    <section class="tags" aria-label="Disciplines">
      <div class="tags-track" data-tags>
${tagList(false)}
${tagList(true)}
      </div>
    </section>

    <!-- Selected work -->
    <section class="intro-light" aria-labelledby="work-title">
      <div class="head-grid">
        <h2 class="display" id="work-title" data-reveal>${esc(site.introHeading)} <span class="grad">${esc(site.introHeadingAccent)}</span></h2>
        <div class="head-note" data-reveal data-delay="0.1">
${introNote}
        </div>
      </div>
    </section>

    <section class="works" id="work" aria-label="Selected work">
      <ol class="works-list" data-works>
${workRows}
      </ol>
      <!-- Floating preview that follows the hovered row (desktop with a mouse only) -->
      <div class="work-preview" data-work-preview aria-hidden="true">
${workSlides}
      </div>
    </section>

    <!-- About / what I do -->
    <section class="trust" id="about" aria-labelledby="trust-title">
      <div class="head-grid head-grid--dark">
        <h2 class="display" id="trust-title" data-reveal><span class="grad">${esc(site.trustHeadingAccent)}</span> ${esc(site.trustHeading)}</h2>
        <p class="head-note" data-reveal data-delay="0.1">${esc(site.trustNote)}</p>
      </div>
    </section>

    <section class="cards" data-cards aria-label="What I do">
      <div class="cards-enter" data-cards-enter>
        <div class="cards-track" data-cards-track>
${cards}
        </div>
      </div>
    </section>

    <!-- FAQ -->
    <section class="faq-head" aria-labelledby="faq-title">
      <h2 class="faq-title" id="faq-title" data-reveal>${esc(site.faqTitle)}</h2>
    </section>
    <section class="faq" aria-label="Questions and answers">
      <div class="faq-list" data-faq>
${faq}
      </div>
    </section>
  </main>

  <!-- Footer / contact -->
  <footer class="footer" id="contact">
    <div class="footer-card">
      <div class="footer-brand"><span>VITALY</span><span class="footer-brand-dim">BOGDEL</span></div>
      <div class="footer-cta">
        <h2 class="footer-heading">${esc(site.footerHeadingLine1)}<br>${esc(site.footerHeadingLine2)}</h2>
        <a class="pill" href="mailto:${esc(site.email)}"><span class="pill-dot" aria-hidden="true"></span>${esc(site.footerButton)}</a>
      </div>
      <div class="footer-reach">
        <p class="footer-reach-label">REACH OUT</p>
        <a href="mailto:${esc(site.email)}">${esc(site.email)}</a>
      </div>
      <div class="footer-social">
        <a href="${esc(site.linkedin)}" target="_blank" rel="noopener" aria-label="LinkedIn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg></a>
        <a href="${esc(site.instagram)}" target="_blank" rel="noopener" aria-label="Instagram"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg></a>
      </div>
    </div>
    <div class="footer-bottom">
      <span>Copyright © Vitaly Bogdel <span data-year>2026</span></span>
      <a href="#top">Back to top ↑</a>
    </div>
  </footer>

  <script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/ScrollTrigger.min.js"></script>
  <script src="js/main.js"></script>
  <script src="https://identity.netlify.com/v1/netlify-identity-widget.js"></script>
  <script>
    /* An invite / password-recovery link from Netlify Identity lands on this page: send the user into the CMS */
    if (window.netlifyIdentity) {
      window.netlifyIdentity.on("init", function (user) {
        if (!user) window.netlifyIdentity.on("login", function () { document.location.href = "/admin/"; });
      });
    }
  </script>
</body>
</html>
`;

fs.writeFileSync(path.join(root, "index.html"), html);
console.log("built index.html");
