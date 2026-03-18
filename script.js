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

const normalizePath = (pathname) => {
  if (!pathname || pathname === "/") {
    return "/index.html";
  }

  return pathname.endsWith("/") ? `${pathname}index.html` : pathname;
};

const markCurrentLinks = () => {
  const currentPath = normalizePath(window.location.pathname);

  document.querySelectorAll(".header-nav a, .footer-nav a").forEach((link) => {
    const href = link.getAttribute("href");

    if (!href || href.includes("#") || href.startsWith("mailto:") || href.startsWith("tel:")) {
      return;
    }

    const url = new URL(href, window.location.href);
    const linkPath = normalizePath(url.pathname);

    if (linkPath !== currentPath) {
      return;
    }

    if (link.classList.contains("header-cta")) {
      return;
    }

    link.classList.add("is-current");
  });
};

const createScrollProgress = () => {
  const progress = document.createElement("div");
  const bar = document.createElement("div");

  progress.className = "scroll-progress";
  bar.className = "scroll-progress__bar";

  progress.append(bar);
  body.prepend(progress);

  return { progress, bar };
};

const { progress: scrollProgress, bar: scrollProgressBar } = createScrollProgress();

const syncHeader = () => {
  header?.classList.toggle("is-scrolled", window.scrollY > 12);
};

const syncScrollProgress = () => {
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  const progress = maxScroll > 0 ? Math.min(window.scrollY / maxScroll, 1) : 0;

  scrollProgress.hidden = maxScroll < 80;
  scrollProgressBar.style.transform = `scaleX(${progress})`;
};

let scrollFrame = null;

const handleScroll = () => {
  if (scrollFrame) {
    return;
  }

  scrollFrame = window.requestAnimationFrame(() => {
    syncHeader();
    syncScrollProgress();
    scrollFrame = null;
  });
};

const shouldAnimatePageLink = (event, link) => {
  if (prefersReducedMotion.matches) {
    return false;
  }

  if (
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  ) {
    return false;
  }

  const href = link.getAttribute("href");

  if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) {
    return false;
  }

  if (link.hasAttribute("download") || (link.target && link.target !== "_self")) {
    return false;
  }

  const url = new URL(link.href, window.location.href);

  if (url.origin !== window.location.origin) {
    return false;
  }

  if (url.pathname === window.location.pathname && url.hash) {
    return false;
  }

  return true;
};

const enhanceCardSpotlights = () => {
  document.querySelectorAll(".service-panel, .contact-card, .inner-hero-card").forEach((node) => {
    node.addEventListener("pointermove", (event) => {
      const rect = node.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 100;
      const y = ((event.clientY - rect.top) / rect.height) * 100;

      node.style.setProperty("--spotlight-x", `${x}%`);
      node.style.setProperty("--spotlight-y", `${y}%`);
    });

    node.addEventListener("pointerleave", () => {
      node.style.removeProperty("--spotlight-x");
      node.style.removeProperty("--spotlight-y");
    });
  });
};

syncHeader();
syncScrollProgress();
markCurrentLinks();
window.addEventListener("scroll", handleScroll, { passive: true });
window.addEventListener("resize", syncScrollProgress);
window.addEventListener("pageshow", () => {
  body.classList.remove("is-leaving");
  syncScrollProgress();
});

menuToggle?.addEventListener("click", () => {
  const isOpen = body.classList.toggle("menu-open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
});

menu?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    closeMenu();
  });
});

document.querySelectorAll("a[href]").forEach((link) => {
  link.addEventListener("click", (event) => {
    if (!shouldAnimatePageLink(event, link)) {
      return;
    }

    event.preventDefault();
    closeMenu();
    body.classList.add("is-leaving");

    window.setTimeout(() => {
      window.location.href = link.href;
    }, 260);
  });
});

document.querySelectorAll(".faq-item").forEach((item) => {
  const list = item.closest(".faq-list");
  const button = item.querySelector(".faq-question");

  button?.addEventListener("click", () => {
    const willOpen = !item.classList.contains("is-open");

    list?.querySelectorAll(".faq-item").forEach((node) => {
      node.classList.remove("is-open");
    });

    if (willOpen) {
      item.classList.add("is-open");
    }
  });
});

const testimonialsTrack = document.querySelector("[data-testimonials-track]");
const testimonialsPrev = document.querySelector("[data-testimonials-prev]");
const testimonialsNext = document.querySelector("[data-testimonials-next]");

const scrollTestimonials = (direction) => {
  if (!testimonialsTrack) {
    return;
  }

  const firstCard = testimonialsTrack.querySelector(".testimonial-slide");
  const step = firstCard ? firstCard.getBoundingClientRect().width + 18 : 320;

  testimonialsTrack.scrollBy({
    left: direction * step,
    behavior: prefersReducedMotion.matches ? "auto" : "smooth",
  });
};

testimonialsPrev?.addEventListener("click", () => scrollTestimonials(-1));
testimonialsNext?.addEventListener("click", () => scrollTestimonials(1));

revealNodes.forEach((node) => {
  const delay = node.getAttribute("data-delay");

  if (delay) {
    node.style.setProperty("--reveal-delay", delay);
  }
});

if (prefersReducedMotion.matches) {
  revealNodes.forEach((node) => {
    node.classList.add("is-visible");
  });
} else {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    {
      threshold: 0.01,
      rootMargin: "0px 0px 60% 0px",
    }
  );

  revealNodes.forEach((node) => {
    revealObserver.observe(node);
  });
}

enhanceCardSpotlights();
