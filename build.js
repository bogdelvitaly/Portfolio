/* One command builds the whole site:  node build.js
   - index.html        from content/site.json
   - work/*.html       from content/cases/*.json
   - assets/hero/*.webp from the hero photo chosen in /admin (skipped when none is chosen)
   Netlify runs this on every deploy (see netlify.toml), including after a save in /admin. */
require("./build-hero.js");
require("./build-home.js");
require("./build-cases.js");
