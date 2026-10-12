/* Keeps the interface the same physical size whatever the Windows display scaling is.

   Windows "scale and layout" (125 %, 150 % …) makes the browser report a narrower viewport and a larger
   devicePixelRatio, so a page designed for 1920px simply grows. Here we measure that OS factor and fold it
   into --ui (the unit every size in style.css is built from), so the site looks as it does at 100 %.

   - Browser zoom (Ctrl +/−) is NOT cancelled: it is measured separately (outerWidth / innerWidth) and left alone.
   - Only Windows desktops are corrected. Phones, tablets and Macs have hardware pixel density, not a scaling
     setting, so they are never touched.
   - Above 1920 physical pixels the interface is enlarged 1.5x (same as a 150 % browser zoom); the CSS fallback
     in style.css applies the same rule when JavaScript is off. */
(function () {
  "use strict";

  var root = document.documentElement;
  var WIDE_FROM = 2560; // physical width from which the wide (ultrawide) hero picture and the one-line wordmark are used
  var ZOOM_LEVELS = [0.25, 0.33, 0.5, 0.67, 0.75, 0.8, 0.9, 1, 1.1, 1.25, 1.5, 1.75, 2, 2.5, 3, 4, 5]; // Chrome / Edge steps
  var isWindows = /Windows/i.test(navigator.userAgent);

  function osScale() {
    if (!isWindows || !window.outerWidth || !window.innerWidth) return 1;
    var ratio = window.outerWidth / window.innerWidth; // ≈ browser zoom
    var zoom = ZOOM_LEVELS.reduce(function (best, z) { return Math.abs(z - ratio) < Math.abs(best - ratio) ? z : best; }, 1);
    if (Math.abs(zoom - ratio) > 0.07) return 1; // ratio is off (DevTools docked, odd window chrome): don't guess
    var os = (window.devicePixelRatio || 1) / zoom;
    os = Math.round(os * 4) / 4; // Windows scale steps are multiples of 25 %
    return os >= 1.2 && os <= 3.5 ? os : 1;
  }

  function apply() {
    var cssWidth = window.innerWidth;
    var os = osScale();
    // Only desktop-width layouts are corrected; below that the layout is the tablet/phone one and must keep its size
    if (cssWidth < 1024) os = 1;
    var physicalWidth = cssWidth * os;
    var base = physicalWidth > 1920 ? 1.5 : 1;
    root.style.setProperty("--ui", String(+(base / os).toFixed(4)));
    // Which hero picture to use: chosen by physical width, not CSS width, so Windows scaling does not pick a smaller crop
    root.setAttribute("data-hero", physicalWidth >= WIDE_FROM ? "3424" : physicalWidth >= 1600 ? "1920" : physicalWidth >= 1024 ? "1440" : physicalWidth >= 640 ? "768" : "375");
  }

  apply();
  window.addEventListener("resize", apply);
})();
