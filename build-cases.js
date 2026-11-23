/* Generates work/<slug>.html from content/cases/*.json.
   Run after changing a case:  node build-cases.js
   (No dependencies – plain Node.) */
const fs = require("fs");
const path = require("path");

const root = __dirname;
const UI = JSON.parse(fs.readFileSync(path.join(root, "content", "ui.json"), "utf8"));
// Absolute address of the published site: social networks need full URLs for link previews.
// Change it if the site moves to its own domain.
const SITE_URL = "https://vitaly-portfolio.netlify.app";
const ruCasesDir = path.join(root, "content", "ru", "cases");
const ruSlugs = new Set(fs.existsSync(ruCasesDir) ? fs.readdirSync(ruCasesDir).filter((f) => f.endsWith(".json")).map((f) => f.replace(/\.json$/, "")) : []);

function buildCases(LANG) {
const RU = LANG === "ru";
const ui = UI[LANG];
const P = RU ? "../../" : "../"; // from /work (or /ru/work) back to the site root
const casesDir = RU ? ruCasesDir : path.join(root, "content", "cases");
const outDir = path.join(root, RU ? "ru/work" : "work");
if (!fs.existsSync(casesDir)) return;
const siteFile = RU && fs.existsSync(path.join(root, "content", "ru", "site.json")) ? path.join(root, "content", "ru", "site.json") : path.join(root, "content", "site.json");
const site = JSON.parse(fs.readFileSync(siteFile, "utf8"));
const loadCases = (dir) => fs.readdirSync(dir).filter((f) => f.endsWith(".json")).map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"))).sort((a, b) => a.order - b.order);
const rankOf = (slug) => { const i = (site.works || []).findIndex((w) => w.caseSlug === slug); return i < 0 ? 1e6 : i; };
const langSwitchFor = (slug) => {
  const enHref = RU ? "/work/" + slug + ".html" : "/work/" + slug + ".html";
  const ruHref = ruSlugs.has(slug) ? "/ru/work/" + slug + ".html" : "/ru/";
  return `<div class="lang" role="group" aria-label="${ui.langLabel}"><a href="${enHref}" hreflang="en" lang="en"${RU ? "" : ' aria-current="true"'}>EN</a><a href="${ruHref}" hreflang="ru" lang="ru"${RU ? ' aria-current="true"' : ""}>RU</a></div>`;
};

const esc = (s) => String(s == null ? "" : s)
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// "/assets/images/x.webp" (site-absolute, as stored in the JSON) -> "../assets/images/x.webp" (relative to /work)
const rel = (p) => P + String(p || "").replace(/^\/+/, "");

const cases = loadCases(casesDir);
// the Russian "More cases" block follows the English list (so it always has other cases to show); translated ones link to their Russian page
const enCases = RU ? loadCases(path.join(root, "content", "cases")).sort((a, b) => rankOf(a.slug) - rankOf(b.slug) || a.order - b.order) : null;
const ruBySlug = {};
cases.forEach((c) => { ruBySlug[c.slug] = c; });

// The order of the project list on the home page (content/site.json → works, reorderable in /admin) decides
// the order of cases everywhere (the "More cases" block). Cases missing from that list go last, by their own order.
cases.sort((a, b) => rankOf(a.slug) - rankOf(b.slug) || a.order - b.order);

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
      return `<figure class="case-screen" style="flex:${ratios[i].toFixed(4)} 1 0"><img src="${esc(rel(src))}" alt="${esc(c.title)} – ${esc(s.heading)}, ${ui.screen} ${n}"${dims} loading="lazy"></figure>`;
    }).join("");
    return `\n        <div class="case-shots" style="--shots-max: calc(${sum.toFixed(4)} * ${h} * var(--u) + ${imgs.length - 1} * var(--shots-gap))">${figs}</div>`;
  }).join("");
}

const stepsHtml = (steps) => {
  const list = (steps || []).filter((x) => x && (x.title || x.text));
  if (!list.length) return "";
  return `
        <ol class="cs-steps cs-steps--${list.length}">${list.map((x, i) => `<li><span class="cs-step-n">${String(i + 1).padStart(2, "0")}</span>${x.title ? `<h3>${esc(x.title)}</h3>` : ""}${x.text ? `<p>${esc(x.text)}</p>` : ""}</li>`).join("")}</ol>`;
};

function storySection(s, c) {
  const paras = (s.paragraphs || []).map((p) => `<p>${esc(p)}</p>`).join("");
  const list = (s.list && s.list.length) ? `<ul>${s.list.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>` : "";
  return `      <section class="cs" data-reveal>
        <p class="cs-eyebrow">${esc(s.eyebrow || s.heading)}</p>
        <div class="cs-top">
          <h2 class="cs-headline">${esc(s.headline)}</h2>
          <div class="cs-copy">${paras}${list}</div>
        </div>${stepsHtml(s.steps)}${shots(s, c)}
      </section>`;
}

function section(s, c) {
  if (s.headline) return storySection(s, c);
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
    return `        <figure class="case-shot${full ? " case-shot--full" : ""}" data-reveal><img src="${esc(rel(src))}" alt="${esc(c.title)} – ${ui.screen} ${i + 1}"></figure>`;
  }).join("\n");
  return `      <div class="case-gallery">\n${items}\n      </div>`;
}

function page(c, i) {
  // three other cases: the ones that follow this one in the list (wrapping around)
  const pool = RU ? enCases : cases;
  const at = pool.findIndex((x) => x.slug === c.slug);
  const others = [];
  for (let k = 1; k < pool.length && others.length < 3; k++) {
    const o = pool[(at + k) % pool.length];
    const tr = RU ? ruBySlug[o.slug] : null;
    others.push({ data: tr || o, href: RU && !tr ? "../../work/" + o.slug + ".html" : o.slug + ".html" });
  }
  const chips = (c.meta || []).map((m) => `<span class="chip">${esc(m)}</span>`).join("");
  const facts = (c.facts || []).filter((f) => f && f.label && f.value);
  const factsHtml = facts.length
    ? `      <dl class="case-facts" data-reveal>${facts.map((f) => `<div><dt>${esc(f.label)}</dt><dd>${esc(f.value)}</dd></div>`).join("")}</dl>\n` : "";
  const light = c.theme === "light";
  const accent = /^#[0-9a-fA-F]{3,8}$/.test(String(c.accent || "")) ? c.accent : "";
  const designed = c.designed && (c.designed.text || (c.designed.tags || []).length)
    ? `      <section class="case-designed" data-reveal>
        <h2 class="cs-eyebrow">${esc(c.designed.label || ui.designed)}</h2>
        <div class="case-designed-in">
          ${(c.designed.tags || []).length ? `<ul class="case-designed-tags">${c.designed.tags.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>` : ""}
          ${c.designed.text ? `<p>${esc(c.designed.text)}</p>` : ""}
        </div>
      </section>` : "";
  const result = c.result
    ? `      <section class="case-result" data-reveal>
        <h2 class="case-section-title">${ui.result}</h2>
        <p>${esc(c.result)}</p>
      </section>` : "";

  return `<!doctype html>
<html lang="${LANG}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(c.title)} – ${ui.siteName}</title>
  <meta name="description" content="${esc(c.sub)}">
  <link rel="canonical" href="${SITE_URL}${RU ? "/ru" : ""}/work/${esc(c.slug)}.html">
  ${ruSlugs.has(c.slug) ? `<link rel="alternate" hreflang="en" href="${SITE_URL}/work/${esc(c.slug)}.html">\n  <link rel="alternate" hreflang="ru" href="${SITE_URL}/ru/work/${esc(c.slug)}.html">\n  <link rel="alternate" hreflang="x-default" href="${SITE_URL}/work/${esc(c.slug)}.html">` : ""}
  <meta property="og:type" content="article">
  <meta property="og:locale" content="${RU ? "ru_RU" : "en_US"}">
  <meta property="og:site_name" content="${ui.siteName}">
  <meta property="og:title" content="${esc(c.title)} – ${ui.siteName}">
  <meta property="og:description" content="${esc(c.sub)}">
  <meta property="og:url" content="${SITE_URL}${RU ? "/ru" : ""}/work/${esc(c.slug)}.html">
  <meta property="og:image" content="${SITE_URL}/assets/og/${esc(c.slug)}.jpg">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="${esc(c.cover.alt || c.title)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="theme-color" content="#070707">
  <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' fill='%23070707'/%3E%3Ctext x='16' y='22' font-family='Arial' font-size='15' font-weight='700' fill='%23ff5800' text-anchor='middle'%3EVB%3C/text%3E%3C/svg%3E">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Bruno+Ace+SC&family=Host+Grotesk:wght@300;400;500&family=IBM+Plex+Mono:wght@300;400;500&family=IBM+Plex+Sans:wght@400;500${RU ? "&family=Tektur:wght@400;500&family=Onest:wght@300;400;500" : ""}&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="${P}css/style.css">
  <script src="${P}js/scale.js"></script>
</head>
<body class="case-page${light ? " case-page--light" : ""}" id="top"${accent ? ` style="--case-accent:${accent}"` : ""}>
  <header class="site-header" data-header>
    <a class="logo" href="../index.html#top" aria-label="${ui.homeAria}"><span>V</span><span class="logo-dot">.</span><span> BOGDEL</span><span class="logo-dot">.</span></a>
    <nav class="tabs" aria-label="${ui.mainNav}">
      <a class="tab" href="../index.html#top"><span class="tab-name">${ui.navHome}</span><span class="tab-num">01</span></a>
      <a class="tab" href="../index.html#work"><span class="tab-name">${ui.navWork}</span><span class="tab-num">02</span></a>
      <a class="tab" href="../index.html#about"><span class="tab-name">${ui.navAbout}</span><span class="tab-num">03</span></a>
      <a class="tab" href="#contact"><span class="tab-name">${ui.navContact}</span><span class="tab-num">04</span></a>
    </nav>
    <div class="head-right">
      ${langSwitchFor(c.slug)}
      <a class="btn-outline" href="#contact">${ui.talk}</a>
    </div>
    <button class="burger" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="mobile-nav" data-nav-toggle><span></span><span></span><span></span></button>
  </header>

  <div class="mobile-nav" id="mobile-nav" data-mobile-nav aria-hidden="true">
    <nav aria-label="${ui.mobileNav}">
      <a href="../index.html#top"><span>${ui.navHome}</span><sup>01</sup></a>
      <a href="../index.html#work"><span>${ui.navWork}</span><sup>02</sup></a>
      <a href="../index.html#about"><span>${ui.navAbout}</span><sup>03</sup></a>
      <a href="#contact"><span>${ui.navContact}</span><sup>04</sup></a>
    </nav>
    <div class="mobile-nav-foot">
      <a class="btn-outline" href="#contact">${ui.talk}</a>
      ${langSwitchFor(c.slug)}
    </div>
  </div>

  <main>
    <section class="case-hero">
      <a class="case-back" href="../index.html#work" data-reveal><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>${ui.allWork}</a>
      <p class="case-eyebrow" data-reveal>${esc(c.category)}</p>
      <h1 class="case-title${c.title.length > 22 ? " case-title--long" : ""}" data-reveal>${esc(c.title)}</h1>
      <p class="case-sub" data-reveal>${esc(c.sub)}</p>
${factsHtml}      <div class="case-chips${facts.length ? " case-chips--after-facts" : ""}" data-reveal>${chips}</div>
      <figure class="case-cover" data-reveal><img src="${esc(rel(c.cover.image))}" alt="${esc(c.cover.alt || c.title)}" fetchpriority="high"></figure>
    </section>

    <div class="case-body">
${(c.sections || []).map((s) => section(s, c)).join("\n")}
${gallery(c)}
${result}
${designed}
    </div>

    <section class="case-next">
      <p class="case-eyebrow" data-reveal>${ui.moreCases}</p>
      <div class="case-next-list">
${others.map((o) => `        <a class="case-next-card" href="${esc(o.href)}" data-reveal>
          <span class="case-next-text">
            <span class="case-next-cat">${esc(o.data.category)}</span>
            <span class="case-next-title">${esc(o.data.title)}</span>
          </span>
          <span class="case-next-btn">${ui.viewCase} ${arrow}</span>
        </a>`).join("\n")}
      </div>
    </section>
  </main>

  <footer class="footer" id="contact">
    <div class="footer-card">
      <div class="footer-brand"><span>VITALY</span><span class="footer-brand-dim">BOGDEL</span></div>
      <div class="footer-cta">
        <h2 class="footer-heading">${esc(site.footerHeadingLine1)}<br>${esc(site.footerHeadingLine2)}</h2>
        <a class="pill" href="mailto:bogdelvitaly@gmail.com"><span class="pill-dot" aria-hidden="true"></span>${esc(site.footerButton)}</a>
      </div>
      <div class="footer-reach">
        <p class="footer-reach-label">${ui.reach}</p>
        <a href="mailto:bogdelvitaly@gmail.com">bogdelvitaly@gmail.com</a>
      </div>
      <div class="footer-social">
        <a href="https://www.linkedin.com/in/vitaly-bogdel-211036164/" target="_blank" rel="noopener" aria-label="LinkedIn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg></a>
        <a href="https://www.instagram.com/vitaly_bogdel/" target="_blank" rel="noopener" aria-label="Instagram"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg></a>
      </div>
    </div>
    <div class="footer-bottom">
      <span>${ui.copyright} <span data-year>2026</span></span>
      <a href="#top">${ui.toTop}</a>
    </div>
  </footer>

  <script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/ScrollTrigger.min.js"></script>
  <script src="${P}js/case.js"></script>
</body>
</html>
`;
}

fs.mkdirSync(outDir, { recursive: true });
cases.forEach((c, i) => {
  fs.writeFileSync(path.join(outDir, c.slug + ".html"), page(c, i));
  console.log("built " + (RU ? "ru/" : "") + "work/" + c.slug + ".html");
});
}

buildCases("en");
buildCases("ru");
