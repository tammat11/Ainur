(() => {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const scrollers = Array.from(document.querySelectorAll("[data-auto-scroll]"));

  if (!scrollers.length) return;
  if (document.body.classList.contains("trademark-redesign")) return;

  const visibleState = new WeakMap();
  const viewportObserver = "IntersectionObserver" in window
    ? new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          visibleState.set(entry.target, entry.isIntersecting);
          entry.target.dispatchEvent(new CustomEvent("auto-scroll-visibility"));
        });
      }, {
        threshold: 0.08
      })
    : null;

  const createAutoScroller = (element) => {
    const axis = element.dataset.autoScroll === "y" ? "y" : "x";
    const speed = Number(element.dataset.autoScrollSpeed || (axis === "y" ? 12 : 16));
    const mode = element.dataset.autoScrollMode === "cycle" ? "cycle" : "bounce";
    const scrollProp = axis === "y" ? "scrollTop" : "scrollLeft";
    const scrollSizeProp = axis === "y" ? "scrollHeight" : "scrollWidth";
    const clientSizeProp = axis === "y" ? "clientHeight" : "clientWidth";

    let rafId = 0;
    let lastTime = 0;
    let paused = prefersReducedMotion.matches;
    let direction = 1;
    let resumeTimer = 0;
    let dragging = false;
    let dragPointerId = null;
    let dragStart = 0;
    let dragScrollStart = 0;
    let dragMoved = false;
    let currentScroll = element[scrollProp];

    const isViewportVisible = () => viewportObserver ? visibleState.get(element) !== false : true;
    const canRun = () => !document.hidden && isViewportVisible();

    const getMax = () => Math.max(0, element[scrollSizeProp] - element[clientSizeProp]);
    const getLoopPoint = () => Math.max(1, element[scrollSizeProp] / 2);

    const stop = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = 0;
      lastTime = 0;
    };

    const tick = (now) => {
      if (paused || !canRun()) {
        stop();
        return;
      }

      const max = getMax();
      if (max <= 1) {
        stop();
        return;
      }

      if (!lastTime) lastTime = now;
      const delta = (now - lastTime) / 1000;
      lastTime = now;

      if (mode === "cycle") {
        currentScroll += speed * delta;
        const loopPoint = getLoopPoint();
        if (currentScroll >= loopPoint) {
          currentScroll -= loopPoint;
        }
      } else {
        currentScroll += direction * speed * delta;
        if (currentScroll <= 0) {
          currentScroll = 0;
          direction = 1;
        } else if (currentScroll >= max) {
          currentScroll = max;
          direction = -1;
        }
      }

      element[scrollProp] = currentScroll;

      rafId = requestAnimationFrame(tick);
    };

    const start = () => {
      if (prefersReducedMotion.matches || paused || rafId || !canRun()) return;
      if (getMax() <= 1) return;
      rafId = requestAnimationFrame(tick);
    };

    const pause = () => {
      paused = true;
      clearTimeout(resumeTimer);
      stop();
    };

    const resume = (delay = 700) => {
      clearTimeout(resumeTimer);
      resumeTimer = window.setTimeout(() => {
        paused = false;
        start();
      }, delay);
    };

    const pauseForInteraction = (delay = 1800) => {
      pause();
      resume(delay);
    };

    const getPointerAxisPosition = (event) => (axis === "y" ? event.clientY : event.clientX);

    element.addEventListener("pointerdown", (event) => {
      pauseForInteraction(2200);

      if (axis !== "x" || event.button !== 0) return;

      dragging = true;
      dragMoved = false;
      dragPointerId = event.pointerId;
      dragStart = getPointerAxisPosition(event);
      dragScrollStart = element[scrollProp];
      element.classList.add("is-dragging");
      if (typeof element.setPointerCapture === "function") {
        element.setPointerCapture(event.pointerId);
      }
    });

    element.addEventListener("pointermove", (event) => {
      if (!dragging || event.pointerId !== dragPointerId) return;

      const distance = getPointerAxisPosition(event) - dragStart;
      if (!dragMoved && Math.abs(distance) > 6) {
        dragMoved = true;
      }

      if (!dragMoved) return;

      element[scrollProp] = dragScrollStart - distance;
      currentScroll = element[scrollProp];
      event.preventDefault();
    });

    const stopDrag = (event) => {
      if (!dragging || event.pointerId !== dragPointerId) return;

      dragging = false;
      dragPointerId = null;
      element.classList.remove("is-dragging");
      if (typeof element.releasePointerCapture === "function") {
        try {
          element.releasePointerCapture(event.pointerId);
        } catch (_) {
          // Ignore release errors when capture was never acquired.
        }
      }
      resume(2200);
    };

    element.addEventListener("pointerup", stopDrag);
    element.addEventListener("pointercancel", stopDrag);
    element.addEventListener("wheel", () => pauseForInteraction(1800), { passive: true });
    element.addEventListener("touchstart", pause, { passive: true });
    element.addEventListener("touchend", () => resume(2200), { passive: true });
    element.addEventListener("focusin", pause);
    element.addEventListener("focusout", () => resume(700));
    window.addEventListener("resize", () => resume(250), { passive: true });
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        pause();
      } else {
        resume(150);
      }
    });
    element.addEventListener("auto-scroll-visibility", () => {
      if (isViewportVisible()) {
        resume(120);
      } else {
        pause();
      }
    });

    visibleState.set(element, true);
    viewportObserver?.observe(element);

    if (!prefersReducedMotion.matches) start();
  };

  scrollers.forEach(scroller => {
    if (scroller.dataset.autoScrollSmooth === "true") return;
    createAutoScroller(scroller);
  });
})();

/* --- Trust Section (Мои доверители) Custom Logic --- */
(() => {
  const horizontalScrollers = document.querySelectorAll('.trust-scroll, .cert-slider');
  
  horizontalScrollers.forEach(scroller => {
    const canScrollHorizontally = () => scroller.scrollWidth > scroller.clientWidth + 2;

    // Mouse wheel and trackpad should move the strip horizontally
    scroller.addEventListener('wheel', (e) => {
      if (!canScrollHorizontally()) return;

      // Map vertical scroll (Y) to horizontal (X)
      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      
      if (delta === 0) return;

      const maxScroll = scroller.scrollWidth - scroller.clientWidth;
      const currentScroll = scroller.scrollLeft;

      // Only prevent default if we're actually going to scroll the element
      // This allows the page to continue scrolling once the strip reaches its end
      if ((delta > 0 && currentScroll < maxScroll) || (delta < 0 && currentScroll > 0)) {
        e.preventDefault();
        scroller.scrollLeft = Math.max(0, Math.min(maxScroll, currentScroll + delta));
      }
    }, { passive: false });

    // Pointer-based dragging
    let isPointerDragging = false;
    let pointerId = null;
    let startX = 0;
    let startScrollLeft = 0;

    scroller.addEventListener('pointerdown', (event) => {
      if (!canScrollHorizontally() || event.button !== 0) return;

      isPointerDragging = true;
      pointerId = event.pointerId;
      startX = event.clientX;
      startScrollLeft = scroller.scrollLeft;
      scroller.classList.add('is-dragging');

      if (typeof scroller.setPointerCapture === 'function') {
        scroller.setPointerCapture(event.pointerId);
      }
    });

    scroller.addEventListener('pointermove', (event) => {
      if (!isPointerDragging || event.pointerId !== pointerId) return;

      const deltaX = event.clientX - startX;
      scroller.scrollLeft = startScrollLeft - deltaX;
    });

    const stopDragging = (event) => {
      if (!isPointerDragging || event.pointerId !== pointerId) return;

      isPointerDragging = false;
      pointerId = null;
      scroller.classList.remove('is-dragging');

      if (typeof scroller.releasePointerCapture === 'function') {
        try {
          scroller.releasePointerCapture(event.pointerId);
        } catch (_) {}
      }
    };

    scroller.addEventListener('pointerup', stopDragging);
    scroller.addEventListener('pointercancel', stopDragging);
  });
})();

(() => {
  const body = document.body;
  const burger = document.querySelector(".nav-burger");
  const panel = document.getElementById("mobile-nav-panel");

  if (!burger || !panel) return;

  const closeTargets = Array.from(panel.querySelectorAll("[data-mobile-nav-close], .mobile-nav-links a"));

  const openMenu = () => {
    panel.hidden = false;
    body.classList.add("mobile-nav-open");
    burger.setAttribute("aria-expanded", "true");
  };

  const closeMenu = () => {
    body.classList.remove("mobile-nav-open");
    burger.setAttribute("aria-expanded", "false");
    window.setTimeout(() => {
      if (!body.classList.contains("mobile-nav-open")) {
        panel.hidden = true;
      }
    }, 220);
  };

  burger.addEventListener("click", () => {
    const isOpen = body.classList.contains("mobile-nav-open");
    if (isOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  closeTargets.forEach((target) => {
    target.addEventListener("click", closeMenu);
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && body.classList.contains("mobile-nav-open")) {
      closeMenu();
    }
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 760 && body.classList.contains("mobile-nav-open")) {
      closeMenu();
    }
  }, { passive: true });
})();

(() => {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  const revealGroups = [
    { selector: ".hero-copy > *", step: 0.07, variant: "soft" },
    { selector: ".hero-stats .hero-stat", step: 0.06, variants: ["left", "soft", "right"] },
    { selector: ".about-copy > *, .about-centered > *", step: 0.05, variant: "soft" },
    { selector: ".about-media, .about-visual, .about-side, .about-image-stack > *", step: 0.06, variant: "right" },
    { selector: ".need-menu, .need-feature, .need-cta, .need-card, .service-card, .format-card, .pricing-card, .pricing-card-redesign, .pricing-cta-row, .faq-item, .contact-card, .contact-panel, .certificate-card", step: 0.05, variants: ["left", "soft", "right"] },
    { selector: ".trust-intro > *, .reviews-intro > *, .services-showcase-head > *", step: 0.06, variant: "soft" },
    { selector: ".trust-card, .review-panel, .service-showcase-card, .apple-display-panel, .apple-tab-btn, .apple-content-card, .service-detail-card, .service-process-card, .service-compare-table tbody tr", step: 0.04, variants: ["left", "soft", "right"] },
    { selector: ".footer-grid > *, .footer-bottom > *", step: 0.05, variant: "soft" }
  ];

  const observed = new WeakSet();
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-revealed");
      observer.unobserve(entry.target);
    });
  }, {
    threshold: 0.04,
    rootMargin: "0px 0px -40px 0px"
  });

  const applyReveal = (element, index, group) => {
    if (!element || observed.has(element)) return;

    const variants = group.variants;
    const variant = variants ? variants[index % variants.length] : group.variant || "soft";
    const delay = Math.min(index, 5) * (group.step ?? 0.05);

    observed.add(element);
    element.classList.add("reveal-on-scroll");
    element.dataset.revealVariant = variant;
    element.style.setProperty("--reveal-delay", `${delay.toFixed(2)}s`);

    if (prefersReducedMotion.matches) {
      element.classList.add("is-revealed");
      return;
    }

    observer.observe(element);
  };

  revealGroups.forEach((group) => {
    document.querySelectorAll(group.selector).forEach((element, index) => {
      applyReveal(element, index, group);
    });
  });
})();
