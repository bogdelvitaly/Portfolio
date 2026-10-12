/* Generates work/<slug>.html from content/cases/*.json.
   Run after changing a case:  node build-cases.js
   (No dependencies — plain Node.) */
const fs = require("fs");
const path = require("path");

const root = __dirname;
const casesDir = path.join(root, "content", "cases");
const outDir = path.join(root, "work");

const esc = (s) => String(s == null ? "" : s)
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// "/assets/images/x.webp" (site-absolute, as stored in the JSON) -> "../assets/images/x.webp" (relative to /work)
const rel = (p) => "../" + String(p || "").replace(/^\/+/, "");

const cases = fs.readdirSync(casesDir)
  .filter((f) => f.endsWith(".json"))
  .map((f) => JSON.parse(fs.readFileSync(path.join(casesDir, f), "utf8")))
  .sort((a, b) => a.order - b.order);

const arrow = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9"/></svg>';

function section(s) {
  const paras = (s.paragraphs || []).map((p) => `<p>${esc(p)}</p>`).join("\n          ");
  const list = (s.list && s.list.length)
    ? `\n          <ul>${s.list.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>` : "";
  return `      <section class="case-section" data-reveal>
        <h2 class="case-section-title">${esc(s.heading)}</h2>
        <div class="case-section-copy">
          ${paras}${list}
        </div>
      </section>`;
}

function gallery(c) {
  const imgs = c.gallery || [];
  if (!imgs.length) return "";
  const items = imgs.map((src, i) => {
    // an odd last image spans the full width
    const full = imgs.length % 2 === 1 && i === imgs.length - 1;
    return `        <figure class="case-shot${full ? " case-shot--full" : ""}" data-reveal><img src="${esc(rel(src))}" alt="${esc(c.title)} — screen ${i + 1}"></figure>`;
  }).join("\n");
  return `      <div class="case-gallery">\n${items}\n      </div>`;
}

function page(c, i) {
  const next = cases[(i + 1) % cases.length];
  const chips = (c.meta || []).map((m) => `<span class="chip">${esc(m)}</span>`).join("");
  const result = c.result
    ? `      <section class="case-result" data-reveal>
        <h2 class="case-section-title">Result</h2>
        <p>${esc(c.result)}</p>
      </section>` : "";

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(c.title)} — Vitaly Bogdel</title>
  <meta name="description" content="${esc(c.sub)}">
  <meta name="theme-color" content="#070707">
  <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='8' fill='%23070707'/%3E%3Ctext x='16' y='22' font-family='Arial' font-size='15' font-weight='700' fill='%23f26b0f' text-anchor='middle'%3EVB%3C/text%3E%3C/svg%3E">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Host+Grotesk:wght@300;400;500&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="../css/style.css">
</head>
<body class="case-page" id="top">
  <header class="site-header" data-header>
    <a class="brand" href="../index.html" aria-label="Vitaly Bogdel — home"><span>VITALY</span><span class="brand-dim">BOGDEL</span></a>
    <a class="pill" href="../index.html#contact"><span class="pill-dot" aria-hidden="true"></span>Get in Touch</a>
  </header>

  <main>
    <section class="case-hero">
      <a class="case-back" href="../index.html#work" data-reveal><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>All work</a>
      <p class="case-eyebrow" data-reveal>${esc(c.category)}</p>
      <h1 class="case-title" data-reveal>${esc(c.title)}</h1>
      <p class="case-sub" data-reveal>${esc(c.sub)}</p>
      <div class="case-chips" data-reveal>${chips}</div>
      <figure class="case-cover" data-reveal><img src="${esc(rel(c.cover.image))}" alt="${esc(c.cover.alt || c.title)}" fetchpriority="high"></figure>
    </section>

    <div class="case-body">
${(c.sections || []).map(section).join("\n")}
${gallery(c)}
${result}
    </div>

    <section class="case-next">
      <p class="case-eyebrow" data-reveal>Next case</p>
      <a class="case-next-card" href="${esc(next.slug)}.html" data-reveal>
        <span class="case-next-text">
          <span class="case-next-cat">${esc(next.category)}</span>
          <span class="case-next-title">${esc(next.title)}</span>
        </span>
        <span class="case-next-btn">View case ${arrow}</span>
      </a>
    </section>
  </main>

  <footer class="footer" id="contact">
    <div class="footer-card">
      <div class="footer-brand brand brand--xl"><span>VITALY</span><span class="brand-dim">BOGDEL</span></div>
      <div class="footer-cta">
        <h2 class="footer-heading">Let's build something<br>worth using.</h2>
        <a class="pill" href="mailto:bogdelvitaly@gmail.com"><span class="pill-dot" aria-hidden="true"></span>Get in Touch</a>
      </div>
      <div class="footer-reach">
        <p class="footer-reach-label">REACH OUT</p>
        <a href="mailto:bogdelvitaly@gmail.com">bogdelvitaly@gmail.com</a>
      </div>
      <div class="footer-social">
        <a href="https://www.linkedin.com/in/vitaly-bogdel-211036164/" target="_blank" rel="noopener" aria-label="LinkedIn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg></a>
        <a href="https://www.instagram.com/vitaly_bogdel/" target="_blank" rel="noopener" aria-label="Instagram"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg></a>
      </div>
    </div>
    <div class="footer-bottom">
      <span>Copyright © Vitaly Bogdel <span data-year>2026</span></span>
      <a href="#top">Back to top ↑</a>
    </div>
  </footer>

  <script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/ScrollTrigger.min.js"></script>
  <script src="../js/case.js"></script>
</body>
</html>
`;
}

fs.mkdirSync(outDir, { recursive: true });
cases.forEach((c, i) => {
  fs.writeFileSync(path.join(outDir, c.slug + ".html"), page(c, i));
  console.log("built work/" + c.slug + ".html");
});
