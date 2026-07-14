/* ===================================================================
   MAIN.JS — Navigation, Scroll Animations, Animated Counters,
   Hero BG, Custom Cursor, Section Transitions
   =================================================================== */

/**
 * Throttles a function to only execute once every `limit` milliseconds.
 * @param {Function} func - The function to throttle.
 * @param {number} limit - The time limit in milliseconds.
 * @returns {Function} - The throttled function.
 */
function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Debounces a function to only execute after `delay` milliseconds of inactivity.
 * @param {Function} func - The function to debounce.
 * @param {number} delay - The delay in milliseconds.
 * @returns {Function} - The debounced function.
 */
function debounce(func, delay) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), delay);
  };
}

document.addEventListener('DOMContentLoaded', () => {
  initNav();
  initScrollReveal();
  initCounters();
  initHeroBg();
  initSustainabilityRings();
  initTransportBars();
  initCustomCursor();
  initSectionTransitions();
});

/* -------------------------------------------------------------------
   NAVIGATION
   ------------------------------------------------------------------- */
/**
 * Initializes mobile navigation toggle, scroll-based background, and active link highlighting.
 */
function initNav() {
  const toggle = document.getElementById('nav-toggle');
  const links = document.getElementById('nav-links');
  const nav = document.getElementById('main-nav');
  const navLinks = document.querySelectorAll('.nav__link');

  // Mobile toggle
  toggle.addEventListener('click', () => {
    const isOpen = links.classList.toggle('open');
    toggle.classList.toggle('active');
    toggle.setAttribute('aria-expanded', isOpen);
  });

  // Close mobile nav on link click
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      links.classList.remove('open');
      toggle.classList.remove('active');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });

  // Active link highlighting on scroll
  const sections = document.querySelectorAll('.section[id]');
  const observerOptions = { rootMargin: '-20% 0px -70% 0px' };

  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        navLinks.forEach(l => l.classList.remove('nav__link--active'));
        const activeLink = document.querySelector(`.nav__link[href="#${entry.target.id}"]`);
        if (activeLink) activeLink.classList.add('nav__link--active');
      }
    });
  }, observerOptions);

  sections.forEach(s => sectionObserver.observe(s));

  // Nav background on scroll
  window.addEventListener('scroll', throttle(() => {
    if (window.scrollY > 100) {
      nav.style.background = 'rgba(10, 15, 28, 0.9)';
    } else {
      nav.style.background = 'rgba(17, 24, 39, 0.45)';
    }
  }, 100), { passive: true });

  // Hero parallax
  const heroContent = document.querySelector('.hero__content');
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  if (heroContent && !prefersReduced) {
    window.addEventListener('scroll', throttle(() => {
      const scrolled = window.scrollY;
      if (scrolled < window.innerHeight) {
        heroContent.style.transform = `translateY(${scrolled * 0.4}px)`;
        heroContent.style.opacity = 1 - (scrolled / window.innerHeight) * 1.2;
      }
    }, 16), { passive: true });
  }
}

/* -------------------------------------------------------------------
   SCROLL REVEAL (IntersectionObserver)
   ------------------------------------------------------------------- */
/**
 * Initializes IntersectionObserver to trigger reveal animations when elements scroll into view.
 */
function initScrollReveal() {
  const reveals = document.querySelectorAll('.reveal');
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReduced) {
    reveals.forEach(el => el.classList.add('visible'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

  reveals.forEach(el => observer.observe(el));
}

/* -------------------------------------------------------------------
   ANIMATED COUNTERS
   ------------------------------------------------------------------- */
/**
 * Observes counter elements and starts their animation when visible.
 */
function initCounters() {
  const counters = document.querySelectorAll('[data-count]');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(c => observer.observe(c));
}

/**
 * Animates a numerical counter element from 0 to its target value.
 * @param {HTMLElement} el - The DOM element containing the data-count attribute.
 */
function animateCounter(el) {
  const target = parseInt(el.getAttribute('data-count'), 10);
  const suffix = el.getAttribute('data-suffix') || '';
  const duration = 1800;
  const start = performance.now();

  function update(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    // Ease out cubic
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.round(target * eased);
    el.textContent = current.toLocaleString() + (progress >= 1 ? suffix : '');
    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }

  requestAnimationFrame(update);
}

/* -------------------------------------------------------------------
   HERO BACKGROUND (Animated node network)
   ------------------------------------------------------------------- */
/**
 * Initializes and animates the hero background canvas network representing host cities.
 */
function initHeroBg() {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let width, height, nodes, animId;

  // 16 host cities as nodes
  const cityData = [
    { name: 'New York/NJ', x: 0.78, y: 0.30 },
    { name: 'Los Angeles',  x: 0.12, y: 0.55 },
    { name: 'Dallas',       x: 0.42, y: 0.65 },
    { name: 'Miami',        x: 0.72, y: 0.80 },
    { name: 'Houston',      x: 0.45, y: 0.75 },
    { name: 'Atlanta',      x: 0.65, y: 0.58 },
    { name: 'Philadelphia', x: 0.77, y: 0.33 },
    { name: 'Seattle',      x: 0.10, y: 0.18 },
    { name: 'San Francisco',x: 0.08, y: 0.38 },
    { name: 'Kansas City',  x: 0.45, y: 0.45 },
    { name: 'Boston',       x: 0.82, y: 0.22 },
    { name: 'Guadalajara',  x: 0.28, y: 0.82 },
    { name: 'Mexico City',  x: 0.33, y: 0.88 },
    { name: 'Monterrey',    x: 0.35, y: 0.78 },
    { name: 'Toronto',      x: 0.72, y: 0.15 },
    { name: 'Vancouver',    x: 0.12, y: 0.12 },
  ];

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.parentElement.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    nodes = cityData.map((c) => ({
      x: c.x * width,
      y: c.y * height,
      name: c.name,
      radius: 3 + Math.random() * 2,
      phase: Math.random() * Math.PI * 2,
      pulseSpeed: 0.5 + Math.random() * 1.5,
    }));
  }

  function draw(time) {
    ctx.clearRect(0, 0, width, height);
    const t = time / 1000;

    // Draw connections
    ctx.lineWidth = 0.5;
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[j].x - nodes[i].x;
        const dy = nodes[j].y - nodes[i].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxDist = Math.min(width, height) * 0.45;
        if (dist < maxDist) {
          const alpha = (1 - dist / maxDist) * 0.15;
          ctx.strokeStyle = `rgba(0, 163, 255, ${alpha})`;
          ctx.beginPath();
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(nodes[j].x, nodes[j].y);
          ctx.stroke();

          // Traveling pulse along some edges
          if ((i + j) % 3 === 0) {
            const pulse = (t * 0.3 + i * 0.1) % 1;
            const px = nodes[i].x + dx * pulse;
            const py = nodes[i].y + dy * pulse;
            ctx.beginPath();
            ctx.arc(px, py, 2, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(0, 210, 106, ${alpha * 3})`;
            ctx.fill();
          }
        }
      }
    }

    // Draw nodes
    nodes.forEach((node, i) => {
      const pulse = Math.sin(t * node.pulseSpeed + node.phase) * 0.4 + 0.6;
      const r = node.radius * pulse + 2;

      // Glow
      const gradient = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, r * 6);
      gradient.addColorStop(0, 'rgba(0, 210, 106, 0.15)');
      gradient.addColorStop(1, 'rgba(0, 210, 106, 0)');
      ctx.beginPath();
      ctx.arc(node.x, node.y, r * 6, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      // Core dot
      ctx.beginPath();
      ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
      ctx.fillStyle = i < 11 ? '#00D26A' : '#00A3FF'; // stadiums green, other cities blue
      ctx.fill();

      // City label (only on larger screens)
      if (width > 768) {
        ctx.font = '10px Inter, sans-serif';
        ctx.fillStyle = 'rgba(148, 163, 184, 0.6)';
        ctx.textAlign = 'center';
        ctx.fillText(node.name, node.x, node.y + r + 14);
      }
    });

    animId = requestAnimationFrame(draw);
  }

  resize();
  requestAnimationFrame(draw);
  window.addEventListener('resize', debounce(() => {
    cancelAnimationFrame(animId);
    resize();
    requestAnimationFrame(draw);
  }, 150));
}

/* -------------------------------------------------------------------
   SUSTAINABILITY RINGS (Animate on scroll)
   ------------------------------------------------------------------- */
/**
 * Animates SVG circular progress rings when they enter the viewport.
 */
function initSustainabilityRings() {
  const rings = document.querySelectorAll('.ring-fill');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const target = parseFloat(entry.target.getAttribute('data-target'));
        entry.target.style.strokeDashoffset = target;
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });

  rings.forEach(r => observer.observe(r));
}

/* -------------------------------------------------------------------
   TRANSPORT BARS (Animate fill widths on scroll)
   ------------------------------------------------------------------- */
/**
 * Animates horizontal progress bars for transit metrics when they become visible.
 */
function initTransportBars() {
  const bars = document.querySelectorAll('.transport__line-bar-fill');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const targetWidth = entry.target.getAttribute('data-width');
        entry.target.style.width = targetWidth;
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });

  bars.forEach(b => observer.observe(b));
}

/* -------------------------------------------------------------------
   CUSTOM CURSOR — Glowing dot/ring with interactive hover states
   ------------------------------------------------------------------- */
/**
 * Initializes a custom trailing cursor effect that reacts to interactive elements.
 */
function initCustomCursor() {
  const cursor = document.getElementById('aura-cursor');
  if (!cursor) return;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouchDevice = window.matchMedia('(hover: none)').matches;
  const isSmallScreen = window.matchMedia('(max-width: 768px)').matches;

  if (prefersReduced || isTouchDevice || isSmallScreen) {
    cursor.style.display = 'none';
    document.body.style.cursor = 'auto';
    return;
  }

  let mouseX = 0, mouseY = 0;
  let cursorX = 0, cursorY = 0;

  // Smooth follow with lerp
  function updateCursor() {
    cursorX += (mouseX - cursorX) * 0.15;
    cursorY += (mouseY - cursorY) * 0.15;
    cursor.style.left = cursorX + 'px';
    cursor.style.top = cursorY + 'px';
    requestAnimationFrame(updateCursor);
  }

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    if (!cursor.classList.contains('visible')) {
      cursor.classList.add('visible');
    }
  });

  document.addEventListener('mouseleave', () => {
    cursor.classList.remove('visible');
  });

  document.addEventListener('mouseenter', () => {
    cursor.classList.add('visible');
  });

  // Click state
  document.addEventListener('mousedown', () => {
    cursor.classList.add('aura-cursor--click');
  });
  document.addEventListener('mouseup', () => {
    cursor.classList.remove('aura-cursor--click');
  });

  // Interactive element hover detection
  const interactiveSelectors = [
    'button', 'a', 'input[type="range"]',
    '.wayfinding__map-btn', '.wayfinding__origin-btn',
    '.dashboard__toggle-btn', '.dashboard__alert-action',
    '.chat__input', '.chat__send-btn', '.chat__quick-prompt',
    '.heatmap__phase-btn', '.heatmap__scrubber-input',
    '.impact__slider-input',
    '#heatmap-canvas', '#wayfinding-canvas',
    '.nav__link', '.nav__mobile-toggle',
    '.transport__line', '.accessibility__demo-btn',
    '.hero__cta-btn', '.impact__toggle-btn'
  ].join(', ');

  document.addEventListener('mouseover', (e) => {
    if (e.target.closest(interactiveSelectors)) {
      cursor.classList.add('aura-cursor--interactive');
    }
  });

  document.addEventListener('mouseout', (e) => {
    if (e.target.closest(interactiveSelectors)) {
      cursor.classList.remove('aura-cursor--interactive');
    }
  });

  requestAnimationFrame(updateCursor);
}

/* -------------------------------------------------------------------
   SECTION TRANSITIONS — Layered scroll entrance
   Brief (200-300ms) layered transition: grid-overlay shifts
   opacity/position. Respects prefers-reduced-motion.
   ------------------------------------------------------------------- */
/**
 * Adds subtle layered parallax and opacity transitions to page sections on scroll.
 */
function initSectionTransitions() {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return;

  const sections = document.querySelectorAll('.section:not(#hero)');

  // Use IntersectionObserver to add a subtle parallax/shift effect
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const section = entry.target;
      const pulseLine = section.querySelector('.pulse-line');

      if (entry.isIntersecting) {
        // Layered entrance: slight upward shift + opacity fade-in on grid bg
        section.classList.add('section--transitioning');
        
        // Animate pulse line brightness as section enters
        if (pulseLine) {
          pulseLine.style.transition = 'opacity 0.3s ease-out';
          pulseLine.style.opacity = '1';
        }
      } else {
        // Dim pulse line when section leaves viewport
        if (pulseLine) {
          pulseLine.style.opacity = '0.3';
        }
      }
    });
  }, {
    threshold: [0, 0.1, 0.3],
    rootMargin: '-5% 0px -5% 0px'
  });

  sections.forEach(s => {
    // Initialize pulse lines as dim
    const pulseLine = s.querySelector('.pulse-line');
    if (pulseLine) {
      pulseLine.style.opacity = '0.3';
    }
    observer.observe(s);
  });

  // Parallax-style grid shift on scroll for sections in view
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      sections.forEach(section => {
        const rect = section.getBoundingClientRect();
        const vh = window.innerHeight;
        
        // Only process sections partially in viewport
        if (rect.top < vh && rect.bottom > 0) {
          const progress = (vh - rect.top) / (vh + rect.height);
          const shift = (progress - 0.5) * 8; // subtle ±4px shift
          
          // Apply subtle transform to the section's internal grid-like elements
          const gridBg = section.querySelector('.grid-bg');
          if (gridBg) {
            gridBg.style.transform = `translateY(${shift}px)`;
            gridBg.style.transition = 'transform 0.3s ease-out';
          }
        }
      });
      ticking = false;
    });
  }, { passive: true });
}
