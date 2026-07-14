/* ===================================================================
   SLIDER.JS — Enhanced Draggable Before/After Impact Slider
   Cross-fades metrics live as user drags, with card state changes
   =================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initSlider();
});

function initSlider() {
  const slider = document.getElementById('impact-slider');
  if (!slider) return;

  const metrics = [
    { el: document.getElementById('metric-seat'), bar: null },
    { el: document.getElementById('metric-transit'), bar: null },
    { el: document.getElementById('metric-response'), bar: null },
    { el: document.getElementById('metric-waste'), bar: null }
  ];

  // Safely get bar elements
  metrics.forEach(m => {
    if (m.el) {
      const barContainer = m.el.closest('.impact__metric-card')?.querySelector('.impact__metric-bar-fill');
      m.bar = barContainer;
      m.card = m.el.closest('.impact__metric-card');
    }
  });

  const summary = document.getElementById('impact-summary');
  const avgText = document.getElementById('impact-avg-improvement');
  const hint = document.querySelector('.impact__slider-hint');

  // Track if user has interacted
  let hasInteracted = false;

  function updateMetrics(val) {
    const t = val / 100; // 0 = Before, 1 = After

    metrics.forEach(m => {
      if (!m.el) return;
      const before = parseFloat(m.el.getAttribute('data-before'));
      const after = parseFloat(m.el.getAttribute('data-after'));
      const suffix = m.el.getAttribute('data-suffix') || '';
      
      const current = before + (after - before) * t;
      m.el.textContent = Math.round(current) + suffix;

      // Color transitions based on position
      if (t > 0.5) {
        m.el.classList.add('improved');
      } else {
        m.el.classList.remove('improved');
      }

      // Card state classes for visual feedback
      if (m.card) {
        m.card.classList.remove('impact__metric-card--before', 'impact__metric-card--after');
        if (t < 0.3) {
          m.card.classList.add('impact__metric-card--before');
        } else if (t > 0.7) {
          m.card.classList.add('impact__metric-card--after');
        }
      }

      // Bar fill
      if (m.bar) {
        const max = Math.max(before, after);
        const barPct = (current / max) * 100;
        m.bar.style.width = barPct + '%';
        
        // Cross-fade bar color
        if (t < 0.3) {
          m.bar.style.background = 'linear-gradient(90deg, rgba(255,82,116,0.6), rgba(255,82,116,0.3))';
        } else if (t > 0.7) {
          m.bar.style.background = 'var(--gradient-green-blue)';
        } else {
          m.bar.style.background = 'linear-gradient(90deg, rgba(255,215,64,0.5), rgba(0,176,255,0.5))';
        }
      }
    });

    // Update the average improvement text
    const avg = Math.round(52 * t);
    if (avgText) {
      avgText.textContent = avg + '% improvement';
      if (summary) {
        summary.style.opacity = 0.4 + (0.6 * t);
      }
    }

    // Hide hint once user interacts
    if (!hasInteracted && hint) {
      hasInteracted = true;
      hint.style.transition = 'opacity 0.5s';
      hint.style.opacity = '0';
      setTimeout(() => { hint.style.display = 'none'; }, 500);
    }
  }

  // Standard input event (works for mouse drag and touch drag on range inputs)
  slider.addEventListener('input', (e) => {
    updateMetrics(e.target.value);
  });

  // Touch support — range inputs natively support touch,
  // but we add explicit touchmove for any edge cases
  slider.addEventListener('touchstart', () => {
    slider.classList.add('active');
  }, { passive: true });

  slider.addEventListener('touchend', () => {
    slider.classList.remove('active');
  }, { passive: true });

  // Initial call
  updateMetrics(slider.value);
}
