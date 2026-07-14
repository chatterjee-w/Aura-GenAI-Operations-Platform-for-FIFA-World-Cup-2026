/* ===================================================================
   DASHBOARD.JS — Ops Dashboard with View Toggle (Interactive Demo)
   =================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initDashboard();
});

function initDashboard() {
  const toggleBtns = document.querySelectorAll('.dashboard__toggle-btn');
  const panels = document.querySelectorAll('.dashboard__panel');

  if (!toggleBtns.length || !panels.length) return;

  toggleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const view = btn.getAttribute('data-view');

      // Update toggle buttons
      toggleBtns.forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');

      // Switch panels with animation
      panels.forEach(panel => {
        panel.classList.remove('active');
      });

      // Small delay for animation
      requestAnimationFrame(() => {
        const targetPanel = document.querySelector(`[data-panel="${view}"]`);
        if (targetPanel) {
          targetPanel.classList.add('active');
          // Re-trigger animation
          targetPanel.style.animation = 'none';
          targetPanel.offsetHeight; // Force reflow
          targetPanel.style.animation = '';
        }
      });
    });

    // Keyboard support
    btn.addEventListener('keydown', (e) => {
      const btnsArray = Array.from(toggleBtns);
      const currentIndex = btnsArray.indexOf(btn);

      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        const nextIndex = (currentIndex + 1) % btnsArray.length;
        btnsArray[nextIndex].focus();
        btnsArray[nextIndex].click();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        const prevIndex = (currentIndex - 1 + btnsArray.length) % btnsArray.length;
        btnsArray[prevIndex].focus();
        btnsArray[prevIndex].click();
      }
    });
  });

  // Simulate live updates on alert timestamps
  initLiveTimestamps();

  // Pulse animation for metric values
  initMetricPulse();
}

/* -------------------------------------------------------------------
   LIVE TIMESTAMPS — Update alert times to feel real
   ------------------------------------------------------------------- */
function initLiveTimestamps() {
  const activePanel = document.querySelector('.dashboard__panel.active');
  if (!activePanel) return;

  // Store initial relative times and increment them
  const timeElements = document.querySelectorAll('.dashboard__alert-time');
  const initialTimes = [];

  timeElements.forEach((el) => {
    const text = el.textContent.trim();
    let seconds = 0;

    if (text.includes('Just now')) seconds = 0;
    else if (text.includes('sec')) seconds = parseInt(text);
    else if (text.includes('min')) seconds = parseInt(text) * 60;

    initialTimes.push({ el, baseSeconds: seconds, startTime: Date.now() });
  });

  setInterval(() => {
    initialTimes.forEach(item => {
      const elapsed = Math.floor((Date.now() - item.startTime) / 1000);
      const totalSec = item.baseSeconds + elapsed;

      if (totalSec < 60) {
        item.el.textContent = totalSec < 5 ? 'Just now' : totalSec + ' sec ago';
      } else {
        const mins = Math.floor(totalSec / 60);
        item.el.textContent = mins + ' min ago';
      }
    });
  }, 5000);
}

/* -------------------------------------------------------------------
   METRIC PULSE — Subtle value updates to feel live
   ------------------------------------------------------------------- */
function initMetricPulse() {
  // Only do subtle updates on the fan view score clock
  const fanPanel = document.querySelector('[data-panel="fan"]');
  if (!fanPanel) return;

  const matchCard = fanPanel.querySelector('.dashboard__card-value');
  if (!matchCard) return;

  let minute = 67;
  setInterval(() => {
    minute += 1;
    if (minute > 90) minute = 90;
    matchCard.textContent = minute >= 90 ? '2nd Half — 90\'+2' : `2nd Half — ${minute}'`;
    matchCard.style.transition = 'color 0.3s';
    matchCard.style.color = '#FFB800';
    setTimeout(() => {
      matchCard.style.color = '';
    }, 600);
  }, 12000);
}
