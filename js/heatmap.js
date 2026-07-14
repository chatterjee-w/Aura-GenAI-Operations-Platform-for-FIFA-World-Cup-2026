/* ===================================================================
   HEATMAP.JS — Crowd Density Heatmap with Draggable Time Scrubber
   & Zone Click Tooltips
   =================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initHeatmap();
});

function initHeatmap() {
  const canvas = document.getElementById('heatmap-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const container = canvas.parentElement;
  const timeDisplay = document.getElementById('heatmap-time');
  const scrubber = document.getElementById('heatmap-scrubber');
  const scrubberTime = document.getElementById('heatmap-scrubber-time');
  const tooltip = document.getElementById('heatmap-zone-tooltip');
  const tooltipDensity = document.getElementById('tooltip-density');
  const tooltipZoneName = document.getElementById('tooltip-zone-name');
  const tooltipSuggestion = document.getElementById('tooltip-suggestion');

  let width, height, animId, startTime = null;
  let isPaused = false;
  let manualPhase = -1;
  let scrubberValue = 0; // 0-500 range
  let isScrubbing = false;

  // Stadium zones with density data over time (6 phases)
  const zones = [
    { cx: 0.15, cy: 0.82, rx: 0.10, ry: 0.08, densities: [0.8, 0.9, 0.6, 0.3, 0.2, 0.85], label: 'Gate A', suggestion: 'Redirect overflow to Gate C via Lot J path. AI signage updated.' },
    { cx: 0.85, cy: 0.82, rx: 0.10, ry: 0.08, densities: [0.7, 0.85, 0.5, 0.2, 0.15, 0.9], label: 'Gate B', suggestion: 'Open auxiliary Gate B-2 to distribute entry flow. Staff notified.' },
    { cx: 0.50, cy: 0.92, rx: 0.08, ry: 0.06, densities: [0.6, 0.75, 0.4, 0.15, 0.1, 0.7], label: 'Metro', suggestion: 'Extend platform barriers. Push "use Gate A" notification to metro arrivals.' },
    { cx: 0.25, cy: 0.55, rx: 0.12, ry: 0.10, densities: [0.3, 0.6, 0.8, 0.4, 0.6, 0.5], label: 'Conc. A', suggestion: 'Reroute 34% of traffic via Ramp 4. Digital signage redirecting now.' },
    { cx: 0.75, cy: 0.55, rx: 0.12, ry: 0.10, densities: [0.2, 0.5, 0.7, 0.35, 0.65, 0.4], label: 'Conc. B', suggestion: 'Open cross-concourse shortcut B→C. Volunteers positioned at junction.' },
    { cx: 0.50, cy: 0.38, rx: 0.14, ry: 0.10, densities: [0.15, 0.4, 0.5, 0.3, 0.5, 0.35], label: 'Conc. C', suggestion: 'Flow normal. Monitoring for halftime surge in 8 minutes.' },
    { cx: 0.30, cy: 0.40, rx: 0.07, ry: 0.06, densities: [0.1, 0.3, 0.45, 0.85, 0.4, 0.15], label: 'Food Ct.', suggestion: 'Queue exceeds 8 min. Push mobile ordering notification to Sections 200-216.' },
    { cx: 0.70, cy: 0.40, rx: 0.07, ry: 0.06, densities: [0.1, 0.25, 0.4, 0.9, 0.35, 0.1], label: 'Food Ct.', suggestion: 'Activate overflow vendor Stand 48. Estimated wait drops to 3 min.' },
    { cx: 0.20, cy: 0.45, rx: 0.05, ry: 0.04, densities: [0.1, 0.2, 0.35, 0.95, 0.3, 0.1], label: 'WC', suggestion: 'Restroom at Conc. C-14 at capacity. Redirect to C-18 (2 min wait).' },
    { cx: 0.80, cy: 0.45, rx: 0.05, ry: 0.04, densities: [0.1, 0.2, 0.3, 0.9, 0.25, 0.1], label: 'WC', suggestion: 'High queue detected. Open temporary facilities at Section 110 corridor.' },
    { cx: 0.50, cy: 0.28, rx: 0.20, ry: 0.12, densities: [0.2, 0.6, 0.9, 0.5, 0.92, 0.3], label: 'Bowl', suggestion: 'Seating bowl near capacity. Late arrivals routed via upper concourse.' },
    { cx: 0.15, cy: 0.70, rx: 0.06, ry: 0.06, densities: [0.1, 0.15, 0.1, 0.1, 0.1, 0.85], label: 'Exit 1', suggestion: 'Post-match surge predicted. Stagger section-by-section exit starting Sec 100.' },
    { cx: 0.85, cy: 0.70, rx: 0.06, ry: 0.06, densities: [0.1, 0.1, 0.1, 0.1, 0.1, 0.9], label: 'Exit 2', suggestion: 'Rideshare geofence at Exit 2. Stage 40 additional vehicles in Lot K.' },
  ];

  const timePhases = [
    'T-45:00 — Gates Open',
    'T-15:00 — Pre-Match Rush',
    'KO +25\' — First Half',
    'HT — Halftime Break',
    'KO +70\' — Second Half',
    'FT +5\' — Post-Match Exit'
  ];

  // Scrubber: maps 0-500 linearly through all 6 phases
  // 0-83 = phase 0, 83-166 = phase 1, etc.
  function scrubberToPhase(val) {
    const normalized = val / 500; // 0-1
    const continuous = normalized * 5; // 0-5
    const phaseIndex = Math.min(Math.floor(continuous), 4);
    const phaseFrac = continuous - phaseIndex;
    const nextPhase = Math.min(phaseIndex + 1, 5);
    return { phaseIndex, phaseFrac, nextPhase };
  }

  function scrubberToTimeLabel(val) {
    const { phaseIndex, phaseFrac } = scrubberToPhase(val);
    // Interpolate between phase labels for the time display
    const t = phaseFrac;
    if (t < 0.1) return timePhases[phaseIndex];
    // Show interpolated time between phases
    return timePhases[phaseIndex];
  }

  // Phase selector button handlers
  const phaseBtns = document.querySelectorAll('.heatmap__phase-btn:not(.heatmap__phase-btn--resume)');
  const resumeBtn = document.getElementById('heatmap-resume');

  phaseBtns.forEach(btn => {
    const handler = () => {
      const phase = parseInt(btn.getAttribute('data-phase'), 10);
      if (isNaN(phase)) return;

      isPaused = true;
      manualPhase = phase;
      isScrubbing = false;

      phaseBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      if (resumeBtn) resumeBtn.style.display = '';
      if (timeDisplay) timeDisplay.textContent = timePhases[phase];

      // Sync scrubber position
      if (scrubber) {
        scrubber.value = Math.round((phase / 5) * 500);
      }
      if (scrubberTime) {
        scrubberTime.textContent = timePhases[phase].split(' — ')[0];
      }
      cancelAnimationFrame(animId);
      requestAnimationFrame(draw);
    };
    btn.addEventListener('click', handler);
    btn.addEventListener('touchend', (e) => { e.preventDefault(); handler(); });
  });

  if (resumeBtn) {
    resumeBtn.addEventListener('click', () => {
      isPaused = false;
      manualPhase = -1;
      isScrubbing = false;
      startTime = null;
      resumeBtn.style.display = 'none';
      phaseBtns.forEach(b => b.classList.remove('active'));
      cancelAnimationFrame(animId);
      requestAnimationFrame(draw);
    });
  }

  // Scrubber input handler (draggable timeline)
  if (scrubber) {
    const handleScrub = () => {
      isScrubbing = true;
      isPaused = true;
      manualPhase = -1; // Use continuous scrubber instead
      scrubberValue = parseInt(scrubber.value, 10);

      const { phaseIndex } = scrubberToPhase(scrubberValue);
      
      // Update phase buttons
      phaseBtns.forEach((btn, i) => {
        btn.classList.toggle('active', i === phaseIndex);
      });

      if (resumeBtn) resumeBtn.style.display = '';
      
      const label = scrubberToTimeLabel(scrubberValue);
      if (timeDisplay) timeDisplay.textContent = label;
      if (scrubberTime) scrubberTime.textContent = label.split(' — ')[0] || label;
      
      cancelAnimationFrame(animId);
      requestAnimationFrame(draw);
    };

    scrubber.addEventListener('input', handleScrub);
    // Touch support for mobile
    scrubber.addEventListener('touchstart', () => { isScrubbing = true; }, { passive: true });
    scrubber.addEventListener('touchmove', handleScrub, { passive: true });
    scrubber.addEventListener('touchend', handleScrub);
  }

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    width = rect.width;
    height = rect.height || width * 0.75;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function densityColor(d) {
    if (d < 0.4) {
      const t = d / 0.4;
      return { r: Math.round(t * 80), g: Math.round(210 - t * 60), b: Math.round(106 - t * 50) };
    } else if (d < 0.7) {
      const t = (d - 0.4) / 0.3;
      return { r: Math.round(80 + t * 175), g: Math.round(150 + t * 34), b: Math.round(56 - t * 56) };
    } else {
      const t = (d - 0.7) / 0.3;
      return { r: 255, g: Math.round(184 - t * 107), b: Math.round(t * 106) };
    }
  }

  function lerp(a, b, t) { return a + (b - a) * t; }

  function draw(time) {
    if (!startTime) startTime = time;
    const elapsed = (time - startTime) / 1000;

    let phaseIndex, phaseFrac, nextPhase;

    if (isScrubbing) {
      // Use scrubber value for continuous positioning
      const sp = scrubberToPhase(scrubberValue);
      phaseIndex = sp.phaseIndex;
      phaseFrac = sp.phaseFrac;
      nextPhase = sp.nextPhase;
    } else if (isPaused && manualPhase >= 0) {
      phaseIndex = manualPhase;
      nextPhase = manualPhase;
      phaseFrac = 0;
    } else {
      // Auto-cycle through phases every 3 seconds
      const cycleDuration = 3;
      const totalCycle = cycleDuration * timePhases.length;
      const cyclePos = (elapsed % totalCycle);
      phaseIndex = Math.floor(cyclePos / cycleDuration);
      phaseFrac = (cyclePos / cycleDuration) - phaseIndex;
      nextPhase = (phaseIndex + 1) % timePhases.length;

      phaseBtns.forEach((btn, i) => {
        btn.classList.toggle('active', i === phaseIndex);
      });

      // Sync scrubber during auto-play
      if (scrubber) {
        scrubber.value = Math.round(((phaseIndex + phaseFrac) / 5) * 500);
      }
    }

    // Update time label
    if (timeDisplay && !isScrubbing) {
      timeDisplay.textContent = timePhases[phaseIndex];
    }
    if (scrubberTime && !isScrubbing) {
      scrubberTime.textContent = timePhases[phaseIndex].split(' — ')[0] || timePhases[phaseIndex];
    }

    // Clear & Grid
    drawBaseGrid(ctx, width, height, 25);

    // Stadium outline
    const scx = width * 0.5, scy = height * 0.45;
    const srx = width * 0.4, sry = height * 0.38;

    ctx.beginPath();
    ctx.ellipse(scx, scy, srx, sry, 0, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.beginPath();
    ctx.ellipse(scx, scy, srx * 0.5, sry * 0.5, 0, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Draw density zones
    zones.forEach(zone => {
      const d = lerp(zone.densities[phaseIndex], zone.densities[nextPhase], phaseFrac);
      const color = densityColor(d);
      const x = zone.cx * width;
      const y = zone.cy * height;
      const rx = zone.rx * width;
      const ry = zone.ry * height;

      const grad = ctx.createRadialGradient(x, y, 0, x, y, Math.max(rx, ry));
      grad.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, ${0.5 * d + 0.1})`);
      grad.addColorStop(0.6, `rgba(${color.r}, ${color.g}, ${color.b}, ${0.15 * d})`);
      grad.addColorStop(1, `rgba(${color.r}, ${color.g}, ${color.b}, 0)`);

      ctx.beginPath();
      ctx.ellipse(x, y, rx * 1.5, ry * 1.5, 0, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      if (width > 500) {
        ctx.font = '9px Inter, sans-serif';
        ctx.fillStyle = `rgba(255,255,255, ${0.3 + d * 0.3})`;
        ctx.textAlign = 'center';
        ctx.fillText(zone.label, x, y - ry * 0.3);
        ctx.font = 'bold 11px Space Grotesk, sans-serif';
        ctx.fillText(Math.round(d * 100) + '%', x, y + 5);
      }
    });

    // AI rerouting indicator
    const highDensityZones = zones.filter(z => {
      const d = lerp(z.densities[phaseIndex], z.densities[nextPhase], phaseFrac);
      return d > 0.7;
    });

    if (highDensityZones.length > 0) {
      ctx.font = 'bold 10px Inter, sans-serif';
      ctx.fillStyle = 'rgba(255, 184, 0, 0.8)';
      ctx.textAlign = 'left';
      const pulseAlpha = 0.5 + 0.5 * Math.sin(elapsed * 3);
      ctx.globalAlpha = pulseAlpha;
      ctx.fillText('⚠ AI REROUTING ACTIVE', 12, 20);
      ctx.globalAlpha = 1;
    }

    if (isPaused || isScrubbing) {
      ctx.font = 'bold 10px Inter, sans-serif';
      ctx.fillStyle = 'rgba(0, 163, 255, 0.7)';
      ctx.textAlign = 'right';
      ctx.fillText(isScrubbing ? '⏸ SCRUBBING' : '⏸ PAUSED', width - 12, 20);
    }

    if (!isPaused || isScrubbing) {
      animId = requestAnimationFrame(draw);
    }
  }

  // Start when in view
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        resize();
        requestAnimationFrame(draw);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  observer.observe(container);
  window.addEventListener('resize', () => {
    resize();
    cancelAnimationFrame(animId);
    requestAnimationFrame(draw);
  });

  // Handle clicks/taps on zones to show tooltip with AI suggestion
  const overlay = document.getElementById('heatmap-overlay');
  const overlayClose = overlay?.querySelector('.crowd__reroute-close');

  function getPhaseState() {
    let phaseIndex, phaseFrac, nextPhase;
    if (isScrubbing) {
      const sp = scrubberToPhase(scrubberValue);
      phaseIndex = sp.phaseIndex; phaseFrac = sp.phaseFrac; nextPhase = sp.nextPhase;
    } else if (isPaused && manualPhase >= 0) {
      phaseIndex = manualPhase; nextPhase = manualPhase; phaseFrac = 0;
    } else {
      const elapsed = (performance.now() - startTime) / 1000;
      const cycleDuration = 3;
      const totalCycle = cycleDuration * timePhases.length;
      const cyclePos = (elapsed % totalCycle);
      phaseIndex = Math.floor(cyclePos / cycleDuration);
      phaseFrac = (cyclePos / cycleDuration) - phaseIndex;
      nextPhase = (phaseIndex + 1) % timePhases.length;
    }
    return { phaseIndex, phaseFrac, nextPhase };
  }

  function findClickedZone(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const mx = (clientX - rect.left) / rect.width;
    const my = (clientY - rect.top) / rect.height;
    
    let closest = null;
    let closestDist = Infinity;

    zones.forEach(zone => {
      const dx = (mx - zone.cx) / zone.rx;
      const dy = (my - zone.cy) / zone.ry;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 2 && dist < closestDist) {
        closest = zone;
        closestDist = dist;
      }
    });

    return closest;
  }

  function showZoneTooltip(zone, clientX, clientY) {
    if (!tooltip) return;

    const { phaseIndex, phaseFrac, nextPhase } = getPhaseState();
    const d = lerp(zone.densities[phaseIndex], zone.densities[nextPhase], phaseFrac);
    const density = Math.round(d * 100);

    if (tooltipDensity) tooltipDensity.textContent = density + '%';
    if (tooltipZoneName) tooltipZoneName.textContent = zone.label;
    if (tooltipSuggestion) tooltipSuggestion.textContent = '💡 ' + zone.suggestion;

    // Position tooltip near click
    const rect = container.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    tooltip.style.left = x + 'px';
    tooltip.style.top = y + 'px';
    tooltip.classList.add('visible');

    // Auto-hide after 3s
    clearTimeout(tooltip._hideTimer);
    tooltip._hideTimer = setTimeout(() => {
      tooltip.classList.remove('visible');
    }, 3000);
  }

  // Canvas click handler
  function handleCanvasInteraction(e) {
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    const zone = findClickedZone(clientX, clientY);
    if (zone) {
      showZoneTooltip(zone, clientX, clientY);
      
      // Also update the reroute overlay for high-density zones
      if (overlay) {
        const { phaseIndex, phaseFrac, nextPhase } = getPhaseState();
        const d = lerp(zone.densities[phaseIndex], zone.densities[nextPhase], phaseFrac);
        const text = document.getElementById('heatmap-overlay-text');
        if (text) {
          if (d > 0.7) {
            text.textContent = `High density (${Math.round(d * 100)}%) in ${zone.label}. ${zone.suggestion}`;
          } else {
            text.textContent = `${zone.label} at ${Math.round(d * 100)}% capacity. ${zone.suggestion}`;
          }
        }
        overlay.classList.add('visible');
      }
    } else {
      // Hide tooltip if clicking empty area
      if (tooltip) tooltip.classList.remove('visible');
    }
  }

  canvas.addEventListener('click', handleCanvasInteraction);
  canvas.addEventListener('touchend', (e) => {
    if (e.changedTouches && e.changedTouches.length > 0) {
      const touch = e.changedTouches[0];
      handleCanvasInteraction({ clientX: touch.clientX, clientY: touch.clientY });
    }
  });

  if (overlayClose) {
    overlayClose.addEventListener('click', () => overlay.classList.remove('visible'));
  }
}
