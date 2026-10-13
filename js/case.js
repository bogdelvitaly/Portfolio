(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };

  var yearEl = document.querySelector("[data-year]");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Header: transparent at the top, blurred once scrolling
  var header = document.querySelector("[data-header]");
  var onScroll = function () {
    if (header) header.setAttribute("data-scrolled", window.scrollY > 8 ? "true" : "false");
  };
  document.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // Mobile menu (same behaviour as the home page)
  var navToggle = document.querySelector("[data-nav-toggle]");
  var mobileNav = document.querySelector("[data-mobile-nav]");
  if (navToggle && mobileNav) {
    var setNav = function (open) {
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
      navToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      mobileNav.classList.toggle("is-open", open);
      mobileNav.setAttribute("aria-hidden", open ? "false" : "true");
      document.body.style.overflow = open ? "hidden" : "";
    };
    navToggle.addEventListener("click", function () { setNav(navToggle.getAttribute("aria-expanded") !== "true"); });
    Array.prototype.forEach.call(mobileNav.querySelectorAll("a"), function (a) { a.addEventListener("click", function () { setNav(false); }); });
    window.addEventListener("keydown", function (e) { if (e.key === "Escape") setNav(false); });
    window.addEventListener("resize", function () { if (window.innerWidth >= 1024) setNav(false); });
  }

  // Pictures open large on click (arrows / swipe through the case's pictures, Esc or a click closes)
  var shots = $$(".case-screen img, .case-shot img");
  if (shots.length) {
    var box = document.createElement("div");
    box.className = "lightbox";
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-modal", "true");
    box.setAttribute("aria-hidden", "true");
    var arrow = function (d) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + d + '"/></svg>'; };
    box.innerHTML = '<img alt="">' +
      '<button class="lightbox-btn lightbox-close" type="button" aria-label="Close">' + arrow("M6 6l12 12M18 6 6 18") + '</button>' +
      '<button class="lightbox-btn lightbox-prev" type="button" aria-label="Previous">' + arrow("M15 5l-7 7 7 7") + '</button>' +
      '<button class="lightbox-btn lightbox-next" type="button" aria-label="Next">' + arrow("M9 5l7 7-7 7") + '</button>';
    document.body.appendChild(box);
    var big = box.querySelector("img");
    var cur = 0;
    var show = function (i) {
      cur = (i + shots.length) % shots.length;
      big.src = shots[cur].currentSrc || shots[cur].src;
      big.alt = shots[cur].alt;
    };
    var open = function (i) {
      show(i);
      box.classList.add("is-open");
      box.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
    };
    var close = function () {
      box.classList.remove("is-open");
      box.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
    };
    shots.forEach(function (img, i) { img.addEventListener("click", function () { open(i); }); });
    box.addEventListener("click", function (e) { if (e.target === box || e.target === big || e.target.closest(".lightbox-close")) close(); });
    box.querySelector(".lightbox-prev").addEventListener("click", function () { show(cur - 1); });
    box.querySelector(".lightbox-next").addEventListener("click", function () { show(cur + 1); });
    window.addEventListener("keydown", function (e) {
      if (!box.classList.contains("is-open")) return;
      if (e.key === "Escape") close();
      else if (e.key === "ArrowLeft") show(cur - 1);
      else if (e.key === "ArrowRight") show(cur + 1);
    });
  }

  if (reduceMotion || typeof window.gsap === "undefined" || typeof window.ScrollTrigger === "undefined") return;

  gsap.registerPlugin(ScrollTrigger);
  document.documentElement.classList.add("js-anim");

  // The hero block (back link → cover) plays in sequence on load; everything below reveals on scroll.
  var heroEls = $$(".case-hero [data-reveal]");
  gsap.fromTo(
    heroEls,
    { y: 30, opacity: 0 },
    { y: 0, opacity: 1, duration: 0.8, ease: "power3.out", stagger: 0.09, delay: 0.1 }
  );

  $$("[data-reveal]").forEach(function (el) {
    if (heroEls.indexOf(el) !== -1) return;
    gsap.fromTo(
      el,
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 88%", once: true } }
    );
  });

  // Images shift the layout once they decode — recompute trigger points
  window.addEventListener("load", function () { ScrollTrigger.refresh(); });
})();
