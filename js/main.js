(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  // UI scale from the CSS (1, or 1.75 above 1920px wide): pixel constants below are multiplied by it
  var ui = function () { return parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--ui")) || 1; };
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  var yearEl = $("[data-year]");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Header: transparent at the top, blurred once scrolling ---------- */
  var header = $("[data-header]");
  var onScroll = function () {
    if (header) header.setAttribute("data-scrolled", window.scrollY > 8 ? "true" : "false");
  };
  document.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile menu ---------- */
  var navToggle = $("[data-nav-toggle]");
  var mobileNav = $("[data-mobile-nav]");
  if (navToggle && mobileNav) {
    var setNav = function (open) {
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
      navToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      mobileNav.classList.toggle("is-open", open);
      mobileNav.setAttribute("aria-hidden", open ? "false" : "true");
      document.body.style.overflow = open ? "hidden" : "";
    };
    navToggle.addEventListener("click", function () { setNav(navToggle.getAttribute("aria-expanded") !== "true"); });
    $$("a", mobileNav).forEach(function (a) { a.addEventListener("click", function () { setNav(false); }); });
    window.addEventListener("keydown", function (e) { if (e.key === "Escape") setNav(false); });
    window.addEventListener("resize", function () { if (window.innerWidth >= 1024) setNav(false); });
  }

  /* ---------- FAQ accordion (one open at a time; the + button morphs into −) ---------- */
  var faqItems = $$(".faq-item");
  faqItems.forEach(function (item) {
    $(".faq-q", item).addEventListener("click", function () {
      var willOpen = !item.classList.contains("is-open");
      faqItems.forEach(function (other) {
        var open = other === item && willOpen;
        other.classList.toggle("is-open", open);
        $(".faq-q", other).setAttribute("aria-expanded", open ? "true" : "false");
      });
      if (window.ScrollTrigger) setTimeout(function () { ScrollTrigger.refresh(); }, 500);
    });
  });

  /* ---------- Selected work: a tilted preview follows the hovered row (desktop with a mouse) ---------- */
  var worksList = $("[data-works]");
  var preview = $("[data-work-preview]");
  if (worksList && preview) {
    var canHover = window.matchMedia("(hover: hover) and (min-width: 1024px)");
    var slides = $$("[data-slide]", preview);
    var rows = $$(".work-row", worksList);
    var host = preview.offsetParent || worksList;

    var showPreview = function (i, row) {
      if (!canHover.matches) return;
      host = preview.offsetParent || worksList;
      var top = row.getBoundingClientRect().top - host.getBoundingClientRect().top + row.offsetHeight / 2 + 10 * ui();
      if (!preview.classList.contains("is-on")) {
        // first appearance: jump to the row without sliding in from wherever it was last
        preview.classList.add("is-instant");
        preview.style.setProperty("--py", top + "px");
        void preview.offsetWidth;
        preview.classList.remove("is-instant");
      } else {
        preview.style.setProperty("--py", top + "px");
      }
      slides.forEach(function (s, k) { s.classList.toggle("is-active", k === i); });
      preview.classList.add("is-on");
    };
    var hidePreview = function () { preview.classList.remove("is-on"); };

    rows.forEach(function (row, i) {
      row.addEventListener("pointerenter", function () { showPreview(i, row); });
      row.addEventListener("focus", function () { showPreview(i, row); });
      row.addEventListener("blur", hidePreview);
    });
    worksList.addEventListener("pointerleave", hidePreview);
  }

  if (reduceMotion || typeof window.gsap === "undefined" || typeof window.ScrollTrigger === "undefined") {
    // No animation: the card strip is a plain scrollable row, everything is simply visible
    document.documentElement.classList.add("no-pin");
    return;
  }

  gsap.registerPlugin(ScrollTrigger);
  document.documentElement.classList.add("js-anim");

  /* ---------- Hero entrance ---------- */
  gsap.timeline({ defaults: { ease: "power3.out" } })
    .fromTo(".hero-title img", { y: 60, opacity: 0 }, { y: 0, opacity: 1, duration: 1.1 })
    .fromTo(".hero-meta > *", { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, stagger: 0.12 }, "-=0.6");

  var mm = gsap.matchMedia();

  /* ---------- Desktop: cards slide in from the right, then travel sideways while pinned ---------- */
  mm.add("(min-width: 900px)", function () {
    var section = $("[data-cards]");
    var track = $("[data-cards-track]");
    var enter = $("[data-cards-enter]");
    var dist = function () { return Math.max(0, track.scrollWidth - window.innerWidth); };

    // Keep the cards a small gap below the real (variable-height) header; they fill the rest.
    function measure() {
      var gap = Math.max(16 * ui(), Math.min(28 * ui(), window.innerHeight * 0.025));
      section.style.setProperty("--cards-top", Math.round(header.offsetHeight + gap) + "px");
    }
    measure();
    ScrollTrigger.addEventListener("refreshInit", measure);

    // 1) While the heading above scrolls, the whole strip slides in from the right edge
    //    and arrives exactly when the strip pins.
    gsap.fromTo(
      enter,
      { x: function () { return window.innerWidth; } },
      {
        x: 0,
        ease: "power1.out",
        scrollTrigger: {
          trigger: $(".trust"),
          start: "top 55%",
          endTrigger: section,
          end: "top top",
          scrub: 0.5,
          invalidateOnRefresh: true
        }
      }
    );

    // 2) Then, pinned, the strip travels sideways (1 px of scroll = 1 px of movement)
    gsap.to(track, {
      x: function () { return -dist(); },
      ease: "none",
      scrollTrigger: {
        trigger: section,
        start: "top top",
        end: function () { return "+=" + dist(); },
        pin: true,
        scrub: 0.3,
        invalidateOnRefresh: true
      }
    });

    return function () {
      ScrollTrigger.removeEventListener("refreshInit", measure);
      section.style.removeProperty("--cards-top");
      gsap.set([track, enter], { clearProps: "transform" });
    };
  });

  /* ---------- Scroll reveals ---------- */
  $$("[data-reveal]").forEach(function (el) {
    gsap.fromTo(
      el,
      { y: 30, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.8,
        delay: parseFloat(el.dataset.delay) || 0,
        ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 88%", once: true }
      }
    );
  });

  ScrollTrigger.sort();

  // Fonts and images shift layout after the first measurement — recompute pin points.
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
  }
  window.addEventListener("load", function () { ScrollTrigger.refresh(); });
})();
