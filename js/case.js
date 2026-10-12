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
