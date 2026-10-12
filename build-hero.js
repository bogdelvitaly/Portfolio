/* Cuts the hero photo chosen in /admin ("Home Page → Hero photo") into the five pictures the site uses.

   Source:  content/site.json → heroImage (a landscape picture, ideally 3440×1440 or larger, ratio about 2.4 : 1)
   Output:  assets/hero/hero-3424.webp   ultrawide (from 2560 px of screen width): the whole frame
            assets/hero/hero-1920.webp   desktop 1600–2559 px:  2560 px wide
            assets/hero/hero-1440.webp   desktop 1024–1599 px:  1920 px wide
            assets/hero/hero-768.webp    tablet:  portrait crop around the face
            assets/hero/hero-375.webp    phone:   narrower portrait crop around the face

   heroFocusX (0–100, % from the left) is where the face is; the portrait crops are centred on it.
   If heroImage is empty or the file is missing, nothing is changed and the pictures already in assets/hero are kept.
   Runs on every Netlify deploy (see build.js). Needs the "sharp" package (npm install). */
const fs = require("fs");
const path = require("path");

const root = __dirname;
const outDir = path.join(root, "assets", "hero");
const BACKGROUND = "#070707"; // page colour, used behind any transparent pixels
const QUALITY = 88;

(async function () {
  let site;
  try { site = JSON.parse(fs.readFileSync(path.join(root, "content", "site.json"), "utf8")); }
  catch (e) { return; }

  const rel = String(site.heroImage || "").replace(/^\/+/, "");
  if (!rel) { console.log("hero: no custom photo chosen, keeping the current pictures"); return; }
  const src = path.join(root, rel);
  if (!fs.existsSync(src)) { console.log("hero: " + rel + " not found, keeping the current pictures"); return; }

  let sharp;
  try { sharp = require("sharp"); }
  catch (e) { console.warn("hero: the 'sharp' package is not installed (run npm install), keeping the current pictures"); return; }

  const meta = await sharp(src).metadata();
  const W = meta.width, H = meta.height;
  if (!W || !H) { console.warn("hero: cannot read " + rel); return; }
  if (W / H < 1.8) console.warn("hero: " + rel + " is not very wide (" + W + "×" + H + "); the ultrawide version will be cropped a lot");

  const focus = Math.min(100, Math.max(0, Number(site.heroFocusX))) || 52;
  const cx = Math.round((W * focus) / 100);
  const base = () => sharp(src).flatten({ background: BACKGROUND });
  fs.mkdirSync(outDir, { recursive: true });

  const save = async (name, pipeline) => {
    await pipeline.webp({ quality: QUALITY, effort: 5 }).toFile(path.join(outDir, name));
    const m = await sharp(path.join(outDir, name)).metadata();
    console.log("hero: " + name + " " + m.width + "×" + m.height);
  };
  // never enlarge: if the photo is smaller than a target, the target is simply as large as the photo
  const wide = (w) => base().resize({ width: Math.min(w, W), withoutEnlargement: true, kernel: "lanczos3" });
  // portrait crop of a given width/height ratio, full height, centred on the face and kept inside the photo
  const portrait = (ratio) => {
    const cw = Math.min(W, Math.round(H * ratio));
    const left = Math.min(W - cw, Math.max(0, cx - Math.round(cw / 2)));
    return base().extract({ left, top: 0, width: cw, height: H });
  };

  await save("hero-3424.webp", base());
  await save("hero-1920.webp", wide(2560));
  await save("hero-1440.webp", wide(1920));
  await save("hero-768.webp", portrait(1100 / 1440));
  await save("hero-375.webp", portrait(760 / 1440));
})().catch((e) => { console.warn("hero: skipped (" + e.message + ")"); });
