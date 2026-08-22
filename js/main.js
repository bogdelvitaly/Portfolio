(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var yearEl = document.querySelector("[data-year]");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Header scroll state ---------- */
  var header = document.querySelector("[data-header]");
  var onScroll = function () {
    if (!header) return;
    header.setAttribute("data-scrolled", window.scrollY > 8 ? "true" : "false");
  };
  document.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile nav ---------- */
  var navToggle = document.querySelector("[data-nav-toggle]");
  var mobileNav = document.querySelector("[data-mobile-nav]");

  if (navToggle && mobileNav) {
    var closeNav = function () {
      navToggle.setAttribute("aria-expanded", "false");
      mobileNav.setAttribute("data-open", "false");
      document.body.style.overflow = "";
    };
    var openNav = function () {
      navToggle.setAttribute("aria-expanded", "true");
      mobileNav.setAttribute("data-open", "true");
      document.body.style.overflow = "hidden";
    };

    navToggle.addEventListener("click", function () {
      var isOpen = navToggle.getAttribute("aria-expanded") === "true";
      if (isOpen) {
        closeNav();
      } else {
        openNav();
      }
    });

    mobileNav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", closeNav);
    });

    window.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeNav();
    });
  }

  /* ---------- Cursor-reactive ember gradient on hero name ---------- */
  var heroTitle = document.querySelector("[data-hero-title]");
  if (heroTitle && !reduceMotion && window.matchMedia("(hover: hover)").matches) {
    var lines = heroTitle.querySelectorAll(".hero-line");
    var handleMove = function (e) {
      var rect = heroTitle.getBoundingClientRect();
      var x = ((e.clientX - rect.left) / rect.width) * 100;
      var y = ((e.clientY - rect.top) / rect.height) * 100;
      lines.forEach(function (line) {
        line.style.setProperty("--mx", x + "%");
        line.style.setProperty("--my", y + "%");
      });
    };
    heroTitle.addEventListener("pointermove", handleMove);
    heroTitle.addEventListener("pointerleave", function () {
      lines.forEach(function (line) {
        line.style.setProperty("--mx", "50%");
        line.style.setProperty("--my", "50%");
      });
    });
  }

  /* ---------- Animation: GSAP if available, else plain IntersectionObserver ---------- */
  var hasGSAP = typeof window.gsap !== "undefined";

  if (reduceMotion) {
    document.querySelectorAll("[data-reveal]").forEach(function (el) {
      el.classList.add("is-visible");
    });
    return;
  }

  if (hasGSAP) {
    gsap.registerPlugin(ScrollTrigger);
    gsap.set("[data-reveal]", { clearProps: "opacity,transform" });

    var heroLines = gsap.utils.toArray(".hero-line");
    if (heroLines.length) {
      var heroEls = gsap.utils.toArray(".hero [data-reveal]");
      gsap.timeline({ defaults: { ease: "power3.out" } })
        .fromTo(heroLines, { yPercent: 110, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.9, stagger: 0.1 })
        .fromTo(heroEls, { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, stagger: 0.12 }, "-=0.35");
    }

    var scrollEls = gsap.utils.toArray("section:not(.hero) [data-reveal]:not(.work-card)");
    scrollEls.forEach(function (el) {
      gsap.fromTo(
        el,
        { y: 24, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.7,
          ease: "power3.out",
          scrollTrigger: {
            trigger: el,
            start: "top 88%",
            once: true,
          },
        }
      );
    });

    gsap.utils.toArray(".work-card").forEach(function (card) {
      gsap.fromTo(
        card,
        { y: 32, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.7,
          ease: "power3.out",
          scrollTrigger: {
            trigger: card,
            start: "top 85%",
            once: true,
          },
        }
      );
    });
  } else {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
    );
    document.querySelectorAll("[data-reveal]").forEach(function (el) {
      io.observe(el);
    });
  }
})();
