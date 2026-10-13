/* Generates work/<slug>.html from content/cases/*.json.
   Run after changing a case:  node build-cases.js
   (No dependencies — plain Node.) */
const fs = require("fs");
const path = require("path");

const root = __dirname;
// Absolute address of the published site: social networks need full URLs for link previews.
// Change it if the site moves to its own domain.
const SITE_URL = "https://vitaly-portfolio.netlify.app";
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

// The order of the project list on the home page (content/site.json → works, reorderable in /admin) decides
// the order of cases everywhere (the "More cases" block). Cases missing from that list go last, by their own order.
try {
  const site = JSON.parse(fs.readFileSync(path.join(root, "content", "site.json"), "utf8"));
  const rank = (slug) => { const i = (site.works || []).findIndex((w) => w.caseSlug === slug); return i < 0 ? 1e6 : i; };
  cases.sort((a, b) => rank(a.slug) - rank(b.slug) || a.order - b.order);
} catch (e) { /* no site.json: keep the order numbers */ }

const arrow = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9"/></svg>';

// Pixel size of a local picture (PNG, JPEG or WebP) read from its file header; null if unknown.
function imgSize(p) {
  try {
    const buf = fs.readFileSync(path.join(root, String(p).replace(/^\/+/, "")));
    if (buf.toString("ascii", 1, 4) === "PNG") return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
    if (buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") {
      const k = buf.toString("ascii", 12, 16);
      if (k === "VP8X") return { w: 1 + buf.readUIntLE(24, 3), h: 1 + buf.readUIntLE(27, 3) };
      if (k === "VP8 ") return { w: buf.readUInt16LE(26) & 0x3fff, h: buf.readUInt16LE(28) & 0x3fff };
      if (k === "VP8L") { const v = buf.readUInt32LE(21); return { w: 1 + (v & 0x3fff), h: 1 + ((v >> 14) & 0x3fff) }; }
    }
    if (buf[0] === 0xff && buf[1] === 0xd8) {
      let i = 2;
      while (i < buf.length) {
        if (buf[i] !== 0xff) { i++; continue; }
        const m = buf[i + 1];
        if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) return { w: buf.readUInt16BE(i + 7), h: buf.readUInt16BE(i + 5) };
        i += 2 + buf.readUInt16BE(i + 2);
      }
    }
  } catch (e) { /* fall through */ }
  return null;
}

// Rows of pictures inside a section (content/cases/*.json → sections[].shots[].images).
// Every row is as wide as its pictures allow, they all get the same height; a lone picture is not stretched.
const SHOT_H = 640; // tallest a row may get, in px (before --u scaling); a row can ask for more with its "height" field
function shots(s, c) {
  const rows = (s.shots || []).map((r) => ({ imgs: (r && r.images ? r.images : []).filter(Boolean), h: Number(r && r.height) || SHOT_H })).filter((r) => r.imgs.length);
  if (!rows.length) return "";
  let n = 0;
  return rows.map(({ imgs, h }) => {
    const ratios = imgs.map((src) => { const d = imgSize(src); return d ? d.w / d.h : 0.5; });
    const sum = ratios.reduce((a, b) => a + b, 0);
    const figs = imgs.map((src, i) => {
      n++;
      const d = imgSize(src);
      const dims = d ? ` width="${d.w}" height="${d.h}"` : "";
      return `<figure class="case-screen" style="flex:${ratios[i].toFixed(4)} 1 0"><img src="${esc(rel(src))}" alt="${esc(c.title)} — ${esc(s.heading)}, screen ${n}"${dims} loading="lazy"></figure>`;
    }).join("");
    return `\n        <div class="case-shots" style="--shots-max: calc(${sum.toFixed(4)} * ${h} * var(--u) + ${imgs.length - 1} * var(--shots-gap))">${figs}</div>`;
  }).join("");
}

function section(s, c) {
  const paras = (s.paragraphs || []).map((p) => `<p>${esc(p)}</p>`).join("\n          ");
  const list = (s.list && s.list.length)
    ? `\n          <ul>${s.list.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>` : "";
  return `      <section class="case-section" data-reveal>
        <h2 class="case-section-title">${esc(s.heading)}</h2>
        <div class="case-section-copy">
          ${paras}${list}
        </div>${shots(s, c)}
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
  // three other cases: the ones that follow this one in the list (wrapping around)
  const others = [];
  for (let k = 1; k < cases.length && others.length < 3; k++) others.push(cases[(i + k) % cases.length]);
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
  <link rel="canonical" href="${SITE_URL}/work/${esc(c.slug)}.html">
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="Vitaly Bogdel">
  <meta property="og:title" content="${esc(c.title)} — Vitaly Bogdel">
  <meta property="og:description" content="${esc(c.sub)}">
  <meta property="og:url" content="${SITE_URL}/work/${esc(c.slug)}.html">
  <meta property="og:image" content="${SITE_URL}/assets/og/${esc(c.slug)}.jpg">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="${esc(c.cover.alt || c.title)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="theme-color" content="#070707">
  <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' fill='%23070707'/%3E%3Ctext x='16' y='22' font-family='Arial' font-size='15' font-weight='700' fill='%23ff5800' text-anchor='middle'%3EVB%3C/text%3E%3C/svg%3E">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Bruno+Ace+SC&family=Host+Grotesk:wght@300;400;500&family=IBM+Plex+Mono:wght@300;400;500&family=IBM+Plex+Sans:wght@400;500&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="../css/style.css">
  <script src="../js/scale.js"></script>
</head>
<body class="case-page" id="top">
  <header class="site-header" data-header>
    <a class="logo" href="../index.html#top" aria-label="V. Bogdel — home"><span>V</span><span class="logo-dot">.</span><span> BOGDEL</span><span class="logo-dot">.</span></a>
    <nav class="tabs" aria-label="Main">
      <a class="tab" href="../index.html#top"><span class="tab-name">Home</span><span class="tab-num">01</span></a>
      <a class="tab" href="../index.html#work"><span class="tab-name">Work</span><span class="tab-num">02</span></a>
      <a class="tab" href="../index.html#about"><span class="tab-name">About</span><span class="tab-num">03</span></a>
      <a class="tab" href="#contact"><span class="tab-name">Contact</span><span class="tab-num">04</span></a>
    </nav>
    <a class="btn-outline" href="#contact">Let's talk</a>
    <button class="burger" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="mobile-nav" data-nav-toggle><span></span><span></span><span></span></button>
  </header>

  <div class="mobile-nav" id="mobile-nav" data-mobile-nav aria-hidden="true">
    <nav aria-label="Mobile">
      <a href="../index.html#top"><span>Home</span><sup>01</sup></a>
      <a href="../index.html#work"><span>Work</span><sup>02</sup></a>
      <a href="../index.html#about"><span>About</span><sup>03</sup></a>
      <a href="#contact"><span>Contact</span><sup>04</sup></a>
    </nav>
    <a class="btn-outline" href="#contact">Let's talk</a>
  </div>

  <main>
    <section class="case-hero">
      <a class="case-back" href="../index.html#work" data-reveal><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>All work</a>
      <p class="case-eyebrow" data-reveal>${esc(c.category)}</p>
      <h1 class="case-title${c.title.length > 22 ? " case-title--long" : ""}" data-reveal>${esc(c.title)}</h1>
      <p class="case-sub" data-reveal>${esc(c.sub)}</p>
      <div class="case-chips" data-reveal>${chips}</div>
      <figure class="case-cover" data-reveal><img src="${esc(rel(c.cover.image))}" alt="${esc(c.cover.alt || c.title)}" fetchpriority="high"></figure>
    </section>

    <div class="case-body">
${(c.sections || []).map((s) => section(s, c)).join("\n")}
${gallery(c)}
${result}
    </div>

    <section class="case-next">
      <p class="case-eyebrow" data-reveal>More cases</p>
      <div class="case-next-list">
${others.map((o) => `        <a class="case-next-card" href="${esc(o.slug)}.html" data-reveal>
          <span class="case-next-text">
            <span class="case-next-cat">${esc(o.category)}</span>
            <span class="case-next-title">${esc(o.title)}</span>
          </span>
          <span class="case-next-btn">View case ${arrow}</span>
        </a>`).join("\n")}
      </div>
    </section>
  </main>

  <footer class="footer" id="contact">
    <div class="footer-card">
      <div class="footer-brand"><span>VITALY</span><span class="footer-brand-dim">BOGDEL</span></div>
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
