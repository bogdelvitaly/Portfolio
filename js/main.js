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

  /* ---------- Custom cursor + hero dot-grid spotlight ---------- */
  /* Fine-pointer desktops only — touch devices never get `cursor:none`,
     and reduced-motion users keep the native cursor entirely. */
  if (!reduceMotion && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    var cursorDot = document.createElement("div");
    cursorDot.className = "cursor-dot";
    var cursorRing = document.createElement("div");
    cursorRing.className = "cursor-ring";
    document.body.appendChild(cursorDot);
    document.body.appendChild(cursorRing);
    document.documentElement.classList.add("has-custom-cursor");

    var curX = 0;
    var curY = 0;
    var ringX = 0;
    var ringY = 0;
    var ringStarted = false;

    window.addEventListener("pointermove", function (e) {
      curX = e.clientX;
      curY = e.clientY;
      cursorDot.style.transform = "translate(" + curX + "px, " + curY + "px) translate(-50%, -50%)";
      if (!ringStarted) {
        ringX = curX;
        ringY = curY;
        ringStarted = true;
        cursorRing.style.transform = "translate(" + ringX + "px, " + ringY + "px) translate(-50%, -50%)";
      }
    });

    (function tickCursorRing() {
      ringX += (curX - ringX) * 0.18;
      ringY += (curY - ringY) * 0.18;
      cursorRing.style.transform = "translate(" + ringX + "px, " + ringY + "px) translate(-50%, -50%)";
      requestAnimationFrame(tickCursorRing);
    })();

    document.addEventListener("mouseout", function (e) {
      if (!e.relatedTarget) {
        cursorDot.style.opacity = "0";
        cursorRing.style.opacity = "0";
      }
    });
    document.addEventListener("mouseover", function () {
      cursorDot.style.opacity = "";
      cursorRing.style.opacity = "";
    });

    document.querySelectorAll("a, button").forEach(function (el) {
      el.addEventListener("mouseenter", function () {
        cursorDot.setAttribute("data-hover", "true");
        cursorRing.setAttribute("data-hover", "true");
      });
      el.addEventListener("mouseleave", function () {
        cursorDot.removeAttribute("data-hover");
        cursorRing.removeAttribute("data-hover");
      });
    });

    var spotlight = document.querySelector("[data-spotlight]");
    var orb = document.querySelector("[data-orb]");
    var spotlightHost = document.querySelector(".hero");
    if (spotlight && spotlightHost) {
      var orbIdleTimer = null;

      spotlightHost.addEventListener("pointermove", function (e) {
        var rect = spotlightHost.getBoundingClientRect();
        var x = e.clientX - rect.left;
        var y = e.clientY - rect.top;

        spotlight.style.setProperty("--sx", x + "px");
        spotlight.style.setProperty("--sy", y + "px");
        spotlight.classList.add("is-active");

        if (orb) {
          orb.style.transform = "translate(" + x + "px, " + y + "px) translate(-50%, -50%)";
          orb.classList.add("is-active");
          orb.classList.remove("is-idle");
          clearTimeout(orbIdleTimer);
          orbIdleTimer = setTimeout(function () {
            orb.classList.add("is-idle");
          }, 150);
        }
      });
      spotlightHost.addEventListener("pointerleave", function () {
        spotlight.classList.remove("is-active");
        if (orb) {
          orb.classList.remove("is-active");
          clearTimeout(orbIdleTimer);
        }
      });
    }
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

    /* ---------- Hero pin + zoom-out, covered by Work scrolling over it ----------
       Desktop only: the pin/cover distance is one viewport tall, which only
       lines up with the hero's actual height when hero-copy and the portrait
       sit side by side. On mobile they stack into a much taller block, so
       the same distance would leave a gap before Work catches up to it. */
    var heroViewport = document.querySelector(".hero-viewport");
    var workSection = document.querySelector(".work");
    if (heroViewport && workSection) {
      var heroPinMM = gsap.matchMedia();
      heroPinMM.add("(min-width: 900px)", function () {
        var pinEnd = function () {
          return "+=" + window.innerHeight;
        };

        // Work is pulled up to start exactly where the pin begins, so it
        // slides over the hero as it shrinks instead of appearing after a
        // blank spacer. Applied via JS (not CSS) so reduced-motion / no-JS
        // visitors, and mobile, keep plain, non-overlapping document flow.
        workSection.style.marginTop = "-100dvh";

        gsap.to(heroViewport, {
          scale: 0.82,
          ease: "none",
          scrollTrigger: {
            trigger: heroViewport,
            start: "top top",
            end: pinEnd,
            pin: true,
            scrub: true,
            invalidateOnRefresh: true,
          },
        });

        return function () {
          workSection.style.marginTop = "";
        };
      });
    }

    // Web fonts (and late-loading images) swap in after ScrollTrigger's
    // first measurement, shifting every section's real position — recompute
    // once things settle so pinning/reveal points land correctly.
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () {
        ScrollTrigger.refresh();
      });
    }
    window.addEventListener("load", function () {
      ScrollTrigger.refresh();
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
