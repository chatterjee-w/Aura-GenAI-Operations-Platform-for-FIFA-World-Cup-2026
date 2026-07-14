/* ===================================================================
   INTERACTIONS.JS — Toast System, Dashboard Actions, Transport Expand,
   Accessibility Demos, Impact Toggle, Hero CTA
   =================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initDashboardActions();
  initTransportExpand();
  initAccessibilityDemos();
  initHeroCTA();
});

/* ===================================================================
   1. TOAST NOTIFICATION SYSTEM
   =================================================================== */

function showToast(message, type = 'success', duration = 3500) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;

  const icons = { success: '✓', info: 'ℹ', warning: '⚠' };
  toast.innerHTML = `
    <span class="toast__icon">${icons[type] || icons.success}</span>
    <span class="toast__message">${message}</span>
    <button class="toast__close" aria-label="Close notification">×</button>
  `;

  container.appendChild(toast);

  // Trigger entrance animation
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      toast.classList.add('toast--visible');
    });
  });

  // Close button
  toast.querySelector('.toast__close').addEventListener('click', () => dismissToast(toast));

  // Auto-dismiss
  setTimeout(() => dismissToast(toast), duration);
}

function dismissToast(toast) {
  if (toast.classList.contains('toast--dismissed')) return;
  toast.classList.add('toast--dismissed');
  toast.classList.remove('toast--visible');
  setTimeout(() => toast.remove(), 400);
}

/* ===================================================================
   2. DASHBOARD ALERT ACTION BUTTONS
   =================================================================== */
function initDashboardActions() {
  const actions = document.querySelectorAll('.dashboard__alert-action');
  if (!actions.length) return;

  const actionResponses = {
    'Order ahead →': { done: '✓ Order placed', toast: 'Order placed — Concourse C, Stand 47. Pick up in ~4 min.' },
    'View route →': { done: '✓ Route loaded', toast: 'Route to Gate E → NJ Transit loaded. Follow the green path on your device.' },
    'Acknowledge & navigate →': { done: '✓ Acknowledged', toast: 'Medical alert acknowledged. Navigation to Section 215 Row M activated.' },
    'View photo & details →': { done: '✓ Details viewed', toast: 'Lost child alert details loaded. Photo shared to your device.' },
    'Mark resolved →': { done: '✓ Resolved', toast: 'Spill cleanup at Concourse C-16 marked as resolved.' },
    'View response plan →': { done: '✓ Plan loaded', toast: 'Heat advisory response plan loaded for AT&T Stadium & SoFi Stadium.' },
    'View distribution model →': { done: '✓ Model loaded', toast: 'Post-match exit distribution model for MetLife Stadium displayed.' },
    'Apply recommendation →': { done: '✓ Applied', toast: 'HVAC strategy from Lumen Field applied to BMO Field schedule.' },
  };

  actions.forEach(action => {
    // Convert from div to button if needed
    action.style.cursor = 'pointer';
    action.setAttribute('role', 'button');
    action.setAttribute('tabindex', '0');

    const handleClick = () => {
      if (action.classList.contains('dashboard__alert-action--done')) return;

      const text = action.textContent.trim();
      const response = actionResponses[text] || {
        done: '✓ Done',
        toast: 'Action completed successfully.'
      };

      // Animate the action button
      action.classList.add('dashboard__alert-action--done');
      action.textContent = response.done;

      // Flash the parent alert card
      const alertCard = action.closest('.dashboard__alert');
      if (alertCard) {
        alertCard.classList.add('dashboard__alert--actioned');
      }

      showToast(response.toast, 'success');
    };

    action.addEventListener('click', handleClick);
    action.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleClick();
      }
    });
  });
}

/* ===================================================================
   3. TRANSPORT ROUTE EXPAND/COLLAPSE
   =================================================================== */
function initTransportExpand() {
  const lines = document.querySelectorAll('.transport__line');
  if (!lines.length) return;

  const detailsData = [
    {
      nextDepartures: ['18:42', '18:54', '19:06', '19:12'],
      travelTime: '22 min',
      status: 'On Time',
      statusColor: 'var(--color-green)',
      frequency: 'Every 8 min (surge mode)',
      capacity: '1,200 passengers/train'
    },
    {
      nextDepartures: ['18:35', '18:50', '19:05', '19:20'],
      travelTime: '35 min',
      status: 'On Time',
      statusColor: 'var(--color-green)',
      frequency: 'Every 15 min + shuttle connection',
      capacity: '800 passengers/train'
    },
    {
      nextDepartures: ['18:30', '18:38', '18:46', '18:54'],
      travelTime: '28 min',
      status: '3 min delay',
      statusColor: 'var(--color-gold)',
      frequency: 'Every 8 min',
      capacity: '1,500 passengers/train'
    },
    {
      nextDepartures: ['18:45', '19:00', '19:15', '19:30'],
      travelTime: '18 min',
      status: 'On Time',
      statusColor: 'var(--color-green)',
      frequency: 'Every 15 min + express shuttle',
      capacity: '900 passengers/train'
    }
  ];

  lines.forEach((line, index) => {
    const data = detailsData[index];
    if (!data) return;

    // Add chevron indicator
    const chevron = document.createElement('div');
    chevron.className = 'transport__line-chevron';
    chevron.innerHTML = '▾';
    chevron.setAttribute('aria-hidden', 'true');
    line.appendChild(chevron);

    // Create expandable detail panel
    const details = document.createElement('div');
    details.className = 'transport__line-details';
    details.innerHTML = `
      <div class="transport__detail-grid">
        <div class="transport__detail-item">
          <div class="transport__detail-label">Next Departures</div>
          <div class="transport__detail-value">${data.nextDepartures.join(' · ')}</div>
        </div>
        <div class="transport__detail-item">
          <div class="transport__detail-label">Travel Time</div>
          <div class="transport__detail-value">${data.travelTime}</div>
        </div>
        <div class="transport__detail-item">
          <div class="transport__detail-label">Status</div>
          <div class="transport__detail-value" style="color:${data.statusColor}">${data.status}</div>
        </div>
        <div class="transport__detail-item">
          <div class="transport__detail-label">Frequency</div>
          <div class="transport__detail-value">${data.frequency}</div>
        </div>
      </div>
    `;

    // Insert after the line
    line.parentElement.insertBefore(details, line.nextSibling);

    // Click handler
    line.style.cursor = 'pointer';
    line.setAttribute('role', 'button');
    line.setAttribute('tabindex', '0');
    line.setAttribute('aria-expanded', 'false');

    const toggle = () => {
      const isExpanded = details.classList.toggle('transport__line-details--open');
      chevron.classList.toggle('transport__line-chevron--open');
      line.setAttribute('aria-expanded', isExpanded);

      // Close other panels
      lines.forEach((otherLine, otherIndex) => {
        if (otherIndex !== index) {
          const otherDetails = otherLine.parentElement.querySelector(`.transport__line-details:nth-child(${otherIndex * 2 + 2})`);
          const otherChevron = otherLine.querySelector('.transport__line-chevron');
          if (otherDetails) otherDetails.classList.remove('transport__line-details--open');
          if (otherChevron) otherChevron.classList.remove('transport__line-chevron--open');
          otherLine.setAttribute('aria-expanded', 'false');
        }
      });
    };

    line.addEventListener('click', toggle);
    line.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggle();
      }
    });
  });
}

/* ===================================================================
   4. ACCESSIBILITY DEMO SIMULATIONS
   =================================================================== */
function initAccessibilityDemos() {
  const demoButtons = document.querySelectorAll('.accessibility__demo-btn');
  if (!demoButtons.length) return;

  demoButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const demoType = btn.getAttribute('data-demo');
      const card = btn.closest('.accessibility__card');
      if (!card) return;

      // Check if demo is already running
      const existingDemo = card.querySelector('.accessibility__demo-panel');
      if (existingDemo) {
        existingDemo.remove();
        btn.textContent = '▶ Try Demo';
        btn.classList.remove('accessibility__demo-btn--active');
        return;
      }

      btn.textContent = '■ Stop Demo';
      btn.classList.add('accessibility__demo-btn--active');

      const panel = document.createElement('div');
      panel.className = 'accessibility__demo-panel';

      if (demoType === 'audio') {
        panel.innerHTML = `
          <div class="demo-audio">
            <div class="demo-audio__header">
              <span class="demo-audio__live-dot"></span>
              Live Audio Description — 67th minute
            </div>
            <div class="demo-audio__waveform" aria-hidden="true">
              ${Array.from({length: 24}, () => `<div class="demo-audio__bar"></div>`).join('')}
            </div>
            <div class="demo-audio__text" id="demo-audio-text"></div>
          </div>
        `;
        card.appendChild(panel);
        requestAnimationFrame(() => panel.classList.add('accessibility__demo-panel--visible'));
        simulateAudioDescription(panel.querySelector('#demo-audio-text'));

      } else if (demoType === 'sign') {
        panel.innerHTML = `
          <div class="demo-sign">
            <div class="demo-sign__header">
              <span class="demo-audio__live-dot"></span>
              Sign Language Avatar — ASL
            </div>
            <div class="demo-sign__avatar" aria-label="Animated sign language avatar">
              <div class="demo-sign__figure">
                <div class="demo-sign__head"></div>
                <div class="demo-sign__body"></div>
                <div class="demo-sign__arm demo-sign__arm--left"></div>
                <div class="demo-sign__arm demo-sign__arm--right"></div>
              </div>
            </div>
            <div class="demo-sign__caption">Signing: "Attention please — the match will begin in 10 minutes."</div>
          </div>
        `;
        card.appendChild(panel);
        requestAnimationFrame(() => panel.classList.add('accessibility__demo-panel--visible'));

      } else if (demoType === 'wayfinding') {
        panel.innerHTML = `
          <div class="demo-wayfinding">
            <div class="demo-wayfinding__header">Route Comparison</div>
            <div class="demo-wayfinding__routes">
              <div class="demo-wayfinding__route">
                <div class="demo-wayfinding__route-label">Standard Route</div>
                <div class="demo-wayfinding__route-bar">
                  <div class="demo-wayfinding__route-fill demo-wayfinding__route-fill--standard" style="width:0%"></div>
                </div>
                <div class="demo-wayfinding__route-time">14 min · Stairs, Concourse B</div>
              </div>
              <div class="demo-wayfinding__route">
                <div class="demo-wayfinding__route-label" style="color:var(--color-green)">♿ Accessible Route</div>
                <div class="demo-wayfinding__route-bar">
                  <div class="demo-wayfinding__route-fill demo-wayfinding__route-fill--accessible" style="width:0%"></div>
                </div>
                <div class="demo-wayfinding__route-time">16 min · Elevator, Ramp 2A, Level entry</div>
              </div>
            </div>
            <div class="demo-wayfinding__note">✓ Only 2 min longer · Avoids all stairs · Service animal relief at waypoint 3</div>
          </div>
        `;
        card.appendChild(panel);
        requestAnimationFrame(() => {
          panel.classList.add('accessibility__demo-panel--visible');
          // Animate the route bars
          setTimeout(() => {
            const standardBar = panel.querySelector('.demo-wayfinding__route-fill--standard');
            const accessibleBar = panel.querySelector('.demo-wayfinding__route-fill--accessible');
            if (standardBar) standardBar.style.width = '70%';
            if (accessibleBar) accessibleBar.style.width = '80%';
          }, 200);
        });
      }
    });
  });
}

function simulateAudioDescription(textEl) {
  if (!textEl) return;
  const narration = [
    "Vinícius receives the ball on the left wing, ",
    "cuts inside past the defender at the edge of the box... ",
    "shifts it to his right foot — ",
    "fires a curling shot towards the far post! ",
    "The keeper dives full stretch — ",
    "pushes it wide for a corner. ",
    "The Brazilian fans in Sections 102 through 108 are on their feet."
  ];

  let index = 0;
  let charIndex = 0;
  let fullText = '';

  function typeNext() {
    if (!document.contains(textEl)) return; // Stop if panel removed

    if (index < narration.length) {
      if (charIndex < narration[index].length) {
        fullText += narration[index][charIndex];
        textEl.textContent = fullText;
        textEl.scrollTop = textEl.scrollHeight;
        charIndex++;
        setTimeout(typeNext, 30 + Math.random() * 20);
      } else {
        index++;
        charIndex = 0;
        setTimeout(typeNext, 300);
      }
    }
  }

  setTimeout(typeNext, 500);
}


/* ===================================================================
   6. HERO CTA BUTTON
   =================================================================== */
function initHeroCTA() {
  const ctaBtn = document.getElementById('hero-cta');
  if (!ctaBtn) return;

  ctaBtn.addEventListener('click', () => {
    const opsSection = document.getElementById('ops');
    if (opsSection) {
      opsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // Flash the dashboard when it comes into view
      setTimeout(() => {
        const dashboard = document.querySelector('.dashboard__container');
        if (dashboard) {
          dashboard.classList.add('dashboard__container--flash');
          setTimeout(() => dashboard.classList.remove('dashboard__container--flash'), 1500);
        }
      }, 800);
    }
    showToast('Welcome to the Ops Center — try switching between Fan, Staff, and Organizer views!', 'info');
  });
}
