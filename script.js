const body = document.body;
const header = document.querySelector("[data-header]");
const menuToggle = document.querySelector("[data-menu-toggle]");
const menu = document.querySelector("[data-menu]");
const revealNodes = document.querySelectorAll("[data-reveal]");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

const closeMenu = () => {
  body.classList.remove("menu-open");
  menuToggle?.setAttribute("aria-expanded", "false");
};

const normalizePath = (p) => {
  if (!p || p === "/") return "/index.html";
  return p.endsWith("/") ? p + "index.html" : p;
};

const markCurrentLinks = () => {
  const cur = normalizePath(window.location.pathname);
  document.querySelectorAll(".header-nav a, .footer-nav a").forEach((a) => {
    const h = a.getAttribute("href");
    if (!h || h.includes("#") || h.startsWith("mailto:") || h.startsWith("tel:")) return;
    const u = new URL(h, window.location.href);
    if (normalizePath(u.pathname) !== cur) return;
    if (a.classList.contains("header-cta")) return;
    a.classList.add("is-current");
  });
};

/* ── Scroll progress ─────────────────────────────────────────────── */
const progressBar = document.querySelector("[data-progress-bar]");

const syncProgress = () => {
  if (!progressBar) return;
  const max = document.documentElement.scrollHeight - window.innerHeight;
  progressBar.style.transform = `scaleX(${max > 0 ? Math.min(window.scrollY / max, 1) : 0})`;
};

const syncHeader = () => {
  header?.classList.toggle("is-scrolled", window.scrollY > 12);
};

/* ── Parallax ────────────────────────────────────────────────────── */
const parallaxEls = document.querySelectorAll("[data-parallax]");
const backToTopBtn = document.querySelector("[data-back-to-top]");
const isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;

const syncParallax = () => {
  if (isTouch) return;
  const wh = window.innerHeight;
  parallaxEls.forEach((el) => {
    const parent = el.parentElement;
    const rect = parent.getBoundingClientRect();
    if (rect.bottom < 0 || rect.top > wh) return;
    const center = rect.top + rect.height / 2;
    const offset = (center - wh / 2) * 0.25;
    el.style.transform = `translate3d(0, ${offset}px, 0)`;
  });

  /* About background letter parallax */
  const aboutBgLetter = document.querySelector(".about-bg-letter");
  if (aboutBgLetter) {
    const rect = aboutBgLetter.parentElement.getBoundingClientRect();
    if (rect.top < wh && rect.bottom > 0) {
      const offset = rect.top * 0.1;
      aboutBgLetter.style.transform = `translateY(${offset}px)`;
    }
  }

  /* About side label parallax */
  const sideLabel = document.querySelector("[data-parallax-side]");
  if (sideLabel) {
    const rect = sideLabel.parentElement.getBoundingClientRect();
    if (rect.top < wh && rect.bottom > 0) {
      const offset = rect.top * 0.05;
      sideLabel.style.transform = `translateY(calc(-50% + ${offset}px)) rotate(-180deg)`;
    }
  }

  /* Contacts side label parallax logic removed as element is gone */
};

const syncBackToTop = () => {
  backToTopBtn?.classList.toggle("is-visible", window.scrollY > 600);
};

let raf = null;
const onScroll = () => {
  if (raf) return;
  raf = requestAnimationFrame(() => {
    syncHeader();
    syncProgress();
    syncParallax();
    syncBackToTop();
    raf = null;
  });
};

const shouldAnimate = (e, a) => {
  if (prefersReducedMotion.matches) return false;
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return false;
  const h = a.getAttribute("href");
  if (!h || h.startsWith("#") || h.startsWith("mailto:") || h.startsWith("tel:")) return false;
  if (a.hasAttribute("download") || (a.target && a.target !== "_self")) return false;
  const u = new URL(a.href, window.location.href);
  if (u.origin !== window.location.origin) return false;
  if (u.pathname === window.location.pathname && u.hash) return false;
  return true;
};

/* ── Split text helper ───────────────────────────────────────────── */
function splitText(el) {
  const nodes = Array.from(el.childNodes);
  el.innerHTML = "";
  let idx = 0;
  nodes.forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      Array.from(node.textContent).forEach((ch) => {
        if (ch === " " || ch === "\u00A0") {
          el.appendChild(document.createTextNode(" "));
        } else {
          const span = document.createElement("span");
          span.className = "char";
          span.textContent = ch;
          span.style.setProperty("--i", idx++);
          el.appendChild(span);
        }
      });
    } else if (node.nodeName === "BR") {
      el.appendChild(document.createElement("br"));
    } else {
      el.appendChild(node.cloneNode(true));
    }
  });
}

/* ── Animated counters ───────────────────────────────────────────── */
function animateCounter(el) {
  const target = parseInt(el.dataset.countTo, 10);
  const prefix = el.dataset.countPrefix || "";
  const suffix = el.dataset.countSuffix || "";
  const duration = 1500;
  const start = performance.now();

  function easeOut(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function tick(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const current = Math.round(easeOut(progress) * target);
    el.textContent = prefix + current + suffix;
    if (progress < 1) requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
}

/* ── Intro loader ────────────────────────────────────────────────── */
const loader = document.querySelector("[data-loader]");
const heroName = document.querySelector(".hero-name[data-split]");
const heroInner = document.querySelector(".hero-inner");

if (heroName) splitText(heroName);

function finishLoader() {
  if (loader) {
    loader.classList.add("is-done");
    body.classList.remove("is-loading");
    setTimeout(() => loader.remove(), 700);
  }
  setTimeout(() => {
    if (heroName) heroName.classList.add("is-revealed");
    if (heroInner) heroInner.classList.add("is-revealed");
  }, loader ? 200 : 0);
}

if (loader && !prefersReducedMotion.matches) {
  setTimeout(finishLoader, 900);
} else {
  if (loader) loader.remove();
  body.classList.remove("is-loading");
  if (heroName) heroName.classList.add("is-revealed");
  if (heroInner) heroInner.classList.add("is-revealed");
}

/* ── Init ─────────────────────────────────────────────────────────── */
syncHeader();
syncProgress();
syncParallax();
markCurrentLinks();
window.addEventListener("scroll", onScroll, { passive: true });
window.addEventListener("resize", syncProgress);
window.addEventListener("pageshow", () => {
  body.classList.remove("is-leaving");
  syncProgress();
});

menuToggle?.addEventListener("click", () => {
  const open = body.classList.toggle("menu-open");
  menuToggle.setAttribute("aria-expanded", String(open));
});

menu?.querySelectorAll("a").forEach((a) => a.addEventListener("click", closeMenu));

backToTopBtn?.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: prefersReducedMotion.matches ? "auto" : "smooth" });
});

document.querySelectorAll("a[href]").forEach((a) => {
  a.addEventListener("click", (e) => {
    if (!shouldAnimate(e, a)) return;
    e.preventDefault();
    closeMenu();
    body.classList.add("is-leaving");
    setTimeout(() => { window.location.href = a.href; }, 240);
  });
});

/* ── FAQ accordion ────────────────────────────────────────────────── */
document.querySelectorAll(".faq-item").forEach((item) => {
  const btn = item.querySelector(".faq-btn");
  btn?.addEventListener("click", () => {
    const open = !item.classList.contains("is-open");
    item.closest(".faq-list")?.querySelectorAll(".faq-item.is-open").forEach((n) => n.classList.remove("is-open"));
    if (open) item.classList.add("is-open");
  });
});

/* ── Case accordion (dark section) ────────────────────────────────── */
document.querySelectorAll(".case-item").forEach((item) => {
  const btn = item.querySelector(".case-btn");
  btn?.addEventListener("click", () => {
    const open = !item.classList.contains("is-open");
    document.querySelectorAll(".case-item.is-open").forEach((n) => n.classList.remove("is-open"));
    if (open) item.classList.add("is-open");
  });
});

/* ── Service accordion (inner pages) ──────────────────────────────── */
document.querySelectorAll(".service-acc-item").forEach((item) => {
  const btn = item.querySelector(".service-acc-btn");
  btn?.addEventListener("click", () => {
    const open = !item.classList.contains("is-open");
    const parent = item.closest(".services-accordion");
    parent?.querySelectorAll(".service-acc-item.is-open").forEach((n) => n.classList.remove("is-open"));
    if (open) item.classList.add("is-open");
  });
});

/* ── Service tabs ─────────────────────────────────────────────────── */
const serviceTabs = document.querySelectorAll(".service-tab");
const servicePanels = document.querySelectorAll(".service-panel");

serviceTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    const idx = tab.dataset.tab;
    serviceTabs.forEach((t) => t.classList.remove("is-active"));
    servicePanels.forEach((p) => p.classList.remove("is-active"));
    tab.classList.add("is-active");
    const panel = document.querySelector(`.service-panel[data-panel="${idx}"]`);
    if (panel) panel.classList.add("is-active");
  });
});

/* ── Reviews carousel ─────────────────────────────────────────────── */
const reviewsTrack = document.querySelector("[data-reviews-track]");
const revPrev = document.getElementById("revPrev");
const revNext = document.getElementById("revNext");

const scrollReviews = (dir) => {
  if (!reviewsTrack) return;
  const card = reviewsTrack.querySelector(".review-card");
  const step = card ? card.getBoundingClientRect().width + 20 : 340;
  reviewsTrack.scrollBy({ left: dir * step, behavior: prefersReducedMotion.matches ? "auto" : "smooth" });
};

revPrev?.addEventListener("click", () => scrollReviews(-1));
revNext?.addEventListener("click", () => scrollReviews(1));

/* ── Scroll reveal ────────────────────────────────────────────────── */
const clipRevealNodes = [];
if (prefersReducedMotion.matches) {
  revealNodes.forEach((n) => n.classList.add("is-visible"));
} else {
  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add("is-visible");
        obs.unobserve(e.target);
      });
    },
    { threshold: 0.05, rootMargin: "0px 0px -40px 0px" }
  );
  revealNodes.forEach((n) => {
    if (n.dataset.reveal === "clip") {
      clipRevealNodes.push(n);
    } else {
      observer.observe(n);
    }
  });
  if (clipRevealNodes.length) {
    const clipObs = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          e.target.classList.add("is-visible");
          obs.unobserve(e.target);
        });
      },
      { threshold: 0, rootMargin: "0px 0px 0px 0px" }
    );
    clipRevealNodes.forEach((n) => clipObs.observe(n));
  }

  /* Fallback: scroll-based check for clip-reveal elements */
  const checkClipReveal = () => {
    clipRevealNodes.forEach((n) => {
      if (n.classList.contains("is-visible")) return;
      const r = n.getBoundingClientRect();
      if (r.bottom > 0 && r.top < window.innerHeight) {
        n.classList.add("is-visible");
      }
    });
  };
  window.addEventListener("scroll", checkClipReveal, { passive: true });
  setTimeout(checkClipReveal, 500);
}

/* ── Counter observer ─────────────────────────────────────────────── */
const counterEls = document.querySelectorAll("[data-count-to]");
if (counterEls.length) {
  if (prefersReducedMotion.matches) {
    counterEls.forEach((el) => {
      const prefix = el.dataset.countPrefix || "";
      const suffix = el.dataset.countSuffix || "";
      el.textContent = prefix + el.dataset.countTo + suffix;
    });
  } else {
    const counterObs = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          animateCounter(e.target);
          obs.unobserve(e.target);
        });
      },
      { threshold: 0.3 }
    );
    counterEls.forEach((el) => counterObs.observe(el));
  }
}
