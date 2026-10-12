(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  // UI scale from the CSS (1, or 1.75 above 1920px wide): pixel constants below are multiplied by it
  var ui = function () { return parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--ui")) || 1; };
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  var yearEl = $("[data-year]");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Header: transparent at top, blur once scrolling ---------- */
  var header = $("[data-header]");
  var onScroll = function () {
    if (header) header.setAttribute("data-scrolled", window.scrollY > 8 ? "true" : "false");
  };
  document.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- FAQ accordion (one open at a time) ---------- */
  var faqItems = $$(".faq-item");
  faqItems.forEach(function (item) {
    var btn = $(".faq-q", item);
    btn.addEventListener("click", function () {
      var willOpen = !item.classList.contains("is-open");
      faqItems.forEach(function (other) {
        var open = other === item && willOpen;
        other.classList.toggle("is-open", open);
        $(".faq-q", other).setAttribute("aria-expanded", open ? "true" : "false");
      });
      if (window.ScrollTrigger) setTimeout(function () { ScrollTrigger.refresh(); }, 500);
    });
  });

  /* ---------- Cases: list <-> preview state ---------- */
  var caseItems = $$(".case-item");
  var slides = $$(".case-slide");
  var caseList = $("[data-cases-list]");
  var currentCase = 0;
  var scrollDriven = false; // true while the desktop pin drives the timeline fill continuously
  var dotY = [];

  /* Timeline line: measured from the real dot positions, filled via the --fill custom property (0 → 1). */
  function measureLine() {
    if (!caseList) return;
    dotY = caseItems.map(function (b) {
      return b.offsetTop + (parseFloat(getComputedStyle(b, "::before").top) || 0) + 6 * ui(); // + half the 12px dot
    });
    var len = Math.max(1, dotY[dotY.length - 1] - dotY[0]);
    caseList.style.setProperty("--line-top", dotY[0] + "px");
    caseList.style.setProperty("--line-len", len + "px");
    if (!scrollDriven) setFillToY(dotY[currentCase]);
  }
  function setFillToY(y) {
    if (!caseList || !dotY.length) return;
    var len = Math.max(1, dotY[dotY.length - 1] - dotY[0]);
    var ratio = Math.min(1, Math.max(0, (y - dotY[0]) / len));
    caseList.style.setProperty("--fill", ratio.toFixed(4));
  }
  // Continuous position between dots for a given scroll progress (dot i is reached mid-way through its slot)
  function fillForProgress(p) {
    var n = dotY.length;
    var f = Math.min(n - 1, Math.max(0, p * n - 0.5));
    var lo = Math.floor(f), hi = Math.min(n - 1, lo + 1);
    setFillToY(dotY[lo] + (dotY[hi] - dotY[lo]) * (f - lo));
  }

  function setCase(i) {
    if (i === currentCase) return;
    currentCase = i;
    caseItems.forEach(function (b, k) {
      b.classList.toggle("is-active", k === i);
      b.classList.toggle("is-passed", k < i);
      if (k === i) b.setAttribute("aria-current", "true"); else b.removeAttribute("aria-current");
    });
    slides.forEach(function (s, k) { s.classList.toggle("is-active", k === i); });
    if (!scrollDriven) setFillToY(dotY[i]);
  }
  measureLine();
  window.addEventListener("load", measureLine);
  window.addEventListener("resize", measureLine);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measureLine);
  function bindCaseClicks(handlerFor) {
    caseItems.forEach(function (b, i) { b.onclick = handlerFor(i); });
  }
  var defaultCaseClick = function (i) { return function () { setCase(i); }; };
  bindCaseClicks(defaultCaseClick);

  if (reduceMotion || typeof window.gsap === "undefined" || typeof window.ScrollTrigger === "undefined") {
    // No animation: static page, hero stays a plain full-screen card.
    $$(".tile").forEach(function (t) { t.style.display = "none"; });
    return;
  }

  gsap.registerPlugin(ScrollTrigger);
  document.documentElement.classList.add("js-anim");

  /* ---------- Hero entrance ---------- */
  gsap.timeline({ defaults: { ease: "power3.out" } })
    .fromTo(".hero-line > span", { yPercent: 110 }, { yPercent: 0, duration: 0.95, stagger: 0.1 })
    .fromTo(".hero-label", { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, stagger: 0.12 }, "-=0.45");

  var mm = gsap.matchMedia();

  /* ---------- Desktop: pinned hero shrinks into a collage, then dissolves into the dark work section ---------- */
  mm.add("(min-width: 900px)", function () {
    var stage = $("[data-stage]");
    var card = $("[data-hero-card]");
    var tiles = $$(".tile");

    // The work section overlaps the end of this pin (see .cases.is-sheet in the CSS)
    var sheet = $(".cases");
    sheet.classList.add("is-sheet");

    gsap.set(tiles, {
      autoAlpha: 0,
      scale: 1.18,
      x: function (i, el) { return (parseFloat(el.dataset.dx) || 0) * 70; },
      y: function (i, el) { return (parseFloat(el.dataset.dy) || 0) * 70; }
    });

    var tl = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: {
        trigger: stage,
        start: "top top",
        end: function () { return "+=" + window.innerHeight * 3; },
        pin: true,
        scrub: 0.6,
        anticipatePin: 1,
        invalidateOnRefresh: true
      }
    });

    // 0 → 0.4: hero card shrinks, project tiles settle around it
    tl.to(card, {
      width: function () { return window.innerWidth * 0.54; },
      height: function () { return window.innerHeight * 0.54; },
      borderRadius: 28,
      duration: 0.4,
      ease: "power2.inOut"
    }, 0);
    // The title shrinks with the card so it stays readable next to the person
    tl.to($(".hero-copy"), { scale: 0.58, duration: 0.4, ease: "power2.inOut" }, 0);
    tl.to(tiles, { autoAlpha: 1, scale: 1, x: 0, y: 0, duration: 0.35, stagger: 0.03, ease: "power2.out" }, 0.06);

    // 0.4 → 0.76: hold the collage at full brightness. The work section starts sliding up over it at ≈0.77
    // 0.76 → 1: the collage and the card zoom away underneath the incoming sheet
    tl.to(tiles, {
      scale: 1.25, autoAlpha: 0, duration: 0.2, stagger: 0.015,
      x: function (i, el) { return (parseFloat(el.dataset.dx) || 0) * 90; },
      y: function (i, el) { return (parseFloat(el.dataset.dy) || 0) * 90; }
    }, 0.78);
    tl.to(card, { scale: 0.8, autoAlpha: 0, duration: 0.2, ease: "power2.in" }, 0.8);
    tl.to({}, { duration: 0.02 }, 0.98);

    return function () {
      sheet.classList.remove("is-sheet");
      gsap.set([card, $(".hero-copy")].concat(tiles), { clearProps: "all" });
    };
  });

  /* ---------- Desktop + mouse: soft parallax — person, title and glow drift at different depths ---------- */
  mm.add("(min-width: 900px) and (hover: hover) and (pointer: fine)", function () {
    var person = $('[data-parallax="person"]');
    var copy = $('[data-parallax="copy"]');
    var glow = $('[data-parallax="glow"]');

    gsap.set(person, { scale: 1.04, transformOrigin: "50% 100%" });

    var opts = { duration: 1, ease: "power3.out" };
    var personX = gsap.quickTo(person, "x", opts);
    var personY = gsap.quickTo(person, "y", opts);
    var copyX = gsap.quickTo(copy, "x", opts);
    var glowX = gsap.quickTo(glow, "x", opts);
    var glowY = gsap.quickTo(glow, "y", opts);

    function apply(nx, ny) {
      personX(nx * 36 * ui());
      personY((ny + 0.5) * 14 * ui()); // only ever moves down, so the cropped bottom edge never shows a gap
      copyX(nx * -20 * ui());
      glowX(nx * -70 * ui());
      glowY(ny * -45 * ui());
    }
    function onMove(e) { apply(e.clientX / window.innerWidth - 0.5, e.clientY / window.innerHeight - 0.5); }
    function onLeave() { apply(0, 0); }

    // Window-level so the fixed header doesn't swallow pointer events over the top of the hero.
    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);

    return function () {
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      gsap.set([person, copy, glow], { clearProps: "transform" });
    };
  });

  /* ---------- Desktop: pin the work stage; scrolling moves the list and cycles the projects ---------- */
  mm.add("(min-width: 900px)", function () {
    var cases = $(".cases");
    var stage = $("[data-cases-stage]");
    var wrap = $(".cases-list-wrap");
    var list = $("[data-cases-list]");
    var n = caseItems.length;
    var dist = 0;

    // The header height varies with screen size, so keep the pinned content a small gap below it,
    // and work out how far the (taller) list has to travel to line up with the preview's bottom edge.
    function measure() {
      var gap = Math.max(16 * ui(), Math.min(28 * ui(), window.innerHeight * 0.025));
      cases.style.setProperty("--cases-top", Math.round(header.offsetHeight + gap) + "px");
      dist = Math.max(0, list.offsetHeight - wrap.clientHeight);
      measureLine();
    }
    scrollDriven = true;
    list.classList.add("is-scrubbed");
    measure();
    ScrollTrigger.addEventListener("refreshInit", measure);

    var st = ScrollTrigger.create({
      trigger: stage,
      start: "top top",
      end: function () { return "+=" + window.innerHeight * 0.6 * n; },
      pin: true,
      invalidateOnRefresh: true,
      onRefresh: function (self) { gsap.set(list, { y: -self.progress * dist }); fillForProgress(self.progress); },
      onUpdate: function (self) {
        gsap.set(list, { y: -self.progress * dist });
        setCase(Math.min(n - 1, Math.floor(self.progress * n)));
        fillForProgress(self.progress);
      }
    });

    bindCaseClicks(function (i) {
      return function () {
        var y = st.start + ((i + 0.5) / n) * (st.end - st.start);
        window.scrollTo({ top: y, behavior: "smooth" });
      };
    });

    return function () {
      ScrollTrigger.removeEventListener("refreshInit", measure);
      scrollDriven = false;
      list.classList.remove("is-scrubbed");
      setFillToY(dotY[currentCase]);
      cases.style.removeProperty("--cases-top");
      gsap.set(list, { clearProps: "transform" });
      bindCaseClicks(defaultCaseClick);
    };
  });

  /* ---------- Desktop: cards slide sideways while the section is pinned ---------- */
  mm.add("(min-width: 900px)", function () {
    var section = $("[data-cards]");
    var track = $("[data-cards-track]");
    var dist = function () { return Math.max(0, track.scrollWidth - window.innerWidth); };

    // Keep the cards a small gap below the real (variable-height) header; they stretch to fill the rest.
    function measure() {
      var gap = Math.max(16 * ui(), Math.min(28 * ui(), window.innerHeight * 0.025));
      section.style.setProperty("--cards-top", Math.round(header.offsetHeight + gap) + "px");
    }
    measure();
    ScrollTrigger.addEventListener("refreshInit", measure);

    // 1) While the block above (heading + text) scrolls, the whole strip slides in from the right edge
    //    and arrives exactly when the strip pins.
    var enter = $("[data-cards-enter]");
    gsap.fromTo(
      enter,
      { x: function () { return window.innerWidth; } },
      {
        x: 0,
        ease: "power1.out",
        scrollTrigger: {
          trigger: $(".intro"),
          start: "top 55%",
          endTrigger: section,
          end: "top top",
          scrub: 0.5,
          invalidateOnRefresh: true
        }
      }
    );

    // 2) Then, pinned, the strip travels sideways
    gsap.to(track, {
      x: function () { return -dist(); },
      ease: "none",
      scrollTrigger: {
        trigger: section,
        start: "top top",
        // 1:1 — one pixel of scrolling moves the strip one pixel, so the sideways travel is brisk
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
