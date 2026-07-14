/* ===================================================================
   MAP.JS — Interactive Wayfinding Map with Origin Points,
   Live Rerouting Simulation, and Step-by-Step Directions
   =================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initWayfindingMap();
});

function initWayfindingMap() {
  const canvas = document.getElementById('wayfinding-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const container = canvas.parentElement;
  
  // UI Elements
  const originButtons = container.querySelectorAll('.wayfinding__origin-btn');
  const etaValue = document.getElementById('wayfinding-eta-value');
  const rerouteBtn = document.getElementById('wayfinding-reroute-btn');
  const tooltip = document.getElementById('wayfinding-tooltip');
  const tooltipTitle = document.getElementById('wayfinding-tooltip-title');
  const tooltipDesc = document.getElementById('wayfinding-tooltip-desc');
  const stepsPanel = document.getElementById('wayfinding-steps');

  let width, height, animProgress = 0, animId;
  let activeOrigin = 'parkingC';
  let isRerouted = false;

  // Origin-specific route data
  const origins = {
    parkingC: {
      color: '#00A3FF',
      label: 'Parking Lot C → Sec 214',
      eta: '9 min',
      etaRerouted: '11 min',
      startLabel: 'LOT C',
      // Standard path through main concourse
      points: [
        [0.12, 0.85], [0.12, 0.70], [0.18, 0.62], [0.25, 0.55],
        [0.35, 0.48], [0.42, 0.42], [0.50, 0.38], [0.55, 0.32],
        [0.60, 0.28], [0.65, 0.25]
      ],
      // Alternate path around the outside when congested
      pointsRerouted: [
        [0.12, 0.85], [0.12, 0.70], [0.15, 0.58], [0.15, 0.45],
        [0.22, 0.35], [0.32, 0.28], [0.45, 0.22], [0.55, 0.23],
        [0.65, 0.25]
      ],
      blockagePoint: [0.35, 0.48], // Where the congestion is on the standard path
      dest: 'Sec 214',
      steps: ['Enter Gate A', 'Proceed to Ramp 3', 'Arrive at Sec 214'],
      stepsRerouted: ['Enter Gate A', 'Rerouted via Outer Loop', 'Arrive at Sec 214']
    },
    metro: {
      color: '#FFB800',
      label: 'Metro Exit → Sec 214',
      eta: '12 min',
      etaRerouted: '14 min',
      startLabel: '🚇 METRO',
      points: [
        [0.50, 0.95], [0.50, 0.85], [0.48, 0.75], [0.45, 0.65],
        [0.40, 0.55], [0.35, 0.45], [0.32, 0.38], [0.30, 0.30],
        [0.35, 0.26], [0.42, 0.24], [0.55, 0.23], [0.65, 0.25]
      ],
      pointsRerouted: [
        [0.50, 0.95], [0.60, 0.88], [0.70, 0.78], [0.75, 0.65],
        [0.72, 0.50], [0.70, 0.35], [0.68, 0.30], [0.65, 0.25]
      ],
      blockagePoint: [0.40, 0.55],
      dest: 'Sec 214',
      steps: ['Exit Metro Station', 'Cross South Plaza', 'Arrive at Sec 214'],
      stepsRerouted: ['Exit Metro Station', 'Rerouted to East Gate', 'Arrive at Sec 214']
    },
    accessible: {
      color: '#00E676',
      label: 'Accessible Drop-off → Sec 214',
      eta: '7 min',
      etaRerouted: '8 min',
      startLabel: '♿ DROP-OFF',
      points: [
        [0.88, 0.80], [0.85, 0.72], [0.80, 0.65], [0.75, 0.58],
        [0.72, 0.48], [0.72, 0.40], [0.70, 0.35], [0.68, 0.30],
        [0.65, 0.25]
      ],
      pointsRerouted: [
        [0.88, 0.80], [0.90, 0.70], [0.92, 0.60], [0.90, 0.50],
        [0.85, 0.40], [0.75, 0.32], [0.68, 0.28], [0.65, 0.25]
      ],
      blockagePoint: [0.72, 0.48],
      dest: 'Sec 214',
      steps: ['Use East Drop-off', 'Take Elevator B', 'Arrive at Sec 214 (Level Entry)'],
      stepsRerouted: ['Use East Drop-off', 'Elevator B busy. Take Elevator C', 'Arrive at Sec 214 (Level Entry)']
    }
  };

  // Clickable POIs for canvas hover tooltips
  const pois = [
    { cx: 0.12, cy: 0.88, r: 0.05, title: 'Gate A', desc: 'Main Entry / Parking Lot C' },
    { cx: 0.50, cy: 0.97, r: 0.05, title: 'Metro Station', desc: 'Direct transit access line' },
    { cx: 0.88, cy: 0.83, r: 0.05, title: 'Accessible Drop-off', desc: 'Level entry & elevators' },
    { cx: 0.20, cy: 0.45, r: 0.04, title: 'Restroom (Concourse A)', desc: 'Current wait: 2 min' },
    { cx: 0.80, cy: 0.45, r: 0.04, title: 'Restroom (Concourse B)', desc: 'Current wait: 4 min' },
    { cx: 0.30, cy: 0.40, r: 0.05, title: 'Food Court West', desc: 'Pickup orders available' },
    { cx: 0.70, cy: 0.40, r: 0.05, title: 'Food Court East', desc: 'High volume predicted' },
    { cx: 0.65, cy: 0.25, r: 0.06, title: 'Section 214', desc: 'Target Destination' },
  ];

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function drawStadium() {
    drawBaseGrid(ctx, width, height, 30);

    const cx = width * 0.5;
    const cy = height * 0.45;
    const rx = width * 0.38;
    const ry = height * 0.35;

    // Rings
    ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.lineWidth = 2; ctx.stroke();

    ctx.beginPath(); ctx.ellipse(cx, cy, rx * 0.75, ry * 0.75, 0, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.lineWidth = 1.5; ctx.stroke();

    ctx.beginPath(); ctx.ellipse(cx, cy, rx * 0.52, ry * 0.50, 0, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 1; ctx.stroke();

    // Pitch
    ctx.beginPath(); ctx.ellipse(cx, cy, rx * 0.30, ry * 0.28, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 210, 106, 0.06)'; ctx.fill();
    ctx.strokeStyle = 'rgba(0, 210, 106, 0.15)'; ctx.lineWidth = 1; ctx.stroke();

    ctx.font = '10px Inter, sans-serif';
    ctx.fillStyle = 'rgba(0, 210, 106, 0.4)';
    ctx.textAlign = 'center';
    ctx.fillText('PITCH', cx, cy + 4);

    // Section labels
    const sections = [
      { label: 'SEC 214', angle: -0.8, dist: 0.63 },
      { label: 'SEC 108', angle: 0.5, dist: 0.63 },
      { label: 'SEC 322', angle: -1.8, dist: 0.63 },
      { label: 'SEC 415', angle: 2.3, dist: 0.63 },
    ];
    ctx.font = '9px Inter, sans-serif';
    ctx.fillStyle = 'rgba(148, 163, 184, 0.5)';
    sections.forEach(s => {
      const sx = cx + Math.cos(s.angle) * rx * s.dist;
      const sy = cy + Math.sin(s.angle) * ry * s.dist;
      ctx.fillText(s.label, sx, sy);
    });

    // Origin markers
    const allOrigins = [
      { label: 'LOT C', x: 0.12, y: 0.88, key: 'parkingC' },
      { label: '🚇 METRO', x: 0.50, y: 0.97, key: 'metro' },
      { label: '♿ DROP-OFF', x: 0.88, y: 0.83, key: 'accessible' },
    ];
    ctx.font = 'bold 10px Inter, sans-serif';
    ctx.textAlign = 'center';
    allOrigins.forEach(g => {
      const isActive = g.key === activeOrigin;
      ctx.fillStyle = isActive ? origins[g.key].color : 'rgba(148, 163, 184, 0.3)';
      ctx.fillText(g.label, g.x * width, g.y * height);
      if (!isActive) {
        ctx.beginPath(); ctx.arc(g.x * width, g.y * height - 12, 3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(148, 163, 184, 0.2)'; ctx.fill();
      }
    });

    // Draw POI faint indicators for tooltips (optional visual hint)
    pois.forEach(poi => {
      ctx.beginPath();
      ctx.arc(poi.cx * width, poi.cy * height, poi.r * width, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.01)';
      ctx.fill();
    });
  }

  function updateStepsUI(drawProg, data) {
    if (!stepsPanel) return;
    
    // Determine active step based on progress (0-33%, 33-66%, 66-100%)
    let activeStepIdx = 0;
    if (drawProg > 0.33) activeStepIdx = 1;
    if (drawProg > 0.66) activeStepIdx = 2;

    const steps = isRerouted ? data.stepsRerouted : data.steps;

    // Update panel HTML if steps changed (e.g., origin switched or rerouted toggled)
    const currentDesc = stepsPanel.querySelector(`[data-step="0"] .wayfinding__step-desc`);
    if (currentDesc && currentDesc.textContent !== steps[0]) {
      stepsPanel.innerHTML = steps.map((s, i) => `
        <div class="wayfinding__step ${i === activeStepIdx ? 'active' : ''}" data-step="${i}">
          <div class="wayfinding__step-num">0${i+1}</div>
          <div class="wayfinding__step-desc">${s}</div>
        </div>
      `).join('');
    } else {
      // Just update active class
      const stepEls = stepsPanel.querySelectorAll('.wayfinding__step');
      stepEls.forEach((el, i) => {
        if (i === activeStepIdx) {
          el.classList.add('active');
        } else {
          el.classList.remove('active');
        }
      });
    }
  }

  function drawRoute() {
    const route = origins[activeOrigin];
    if (!route) return;

    const rawPts = isRerouted ? route.pointsRerouted : route.points;
    const pts = rawPts.map(p => ({ x: p[0] * width, y: p[1] * height }));

    // Animated progress
    animProgress = Math.min(animProgress + 0.005, 1.0);
    const drawProg = animProgress;

    // Sync steps UI
    updateStepsUI(drawProg, route);

    // Draw path trail
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Full path (dim)
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) {
      const cp1x = pts[i-1].x + (pts[i].x - pts[i-1].x) * 0.5;
      const cp1y = pts[i-1].y;
      const cp2x = pts[i-1].x + (pts[i].x - pts[i-1].x) * 0.5;
      const cp2y = pts[i].y;
      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, pts[i].x, pts[i].y);
    }
    ctx.strokeStyle = route.color + '20';
    ctx.stroke();

    // Animated path (bright)
    if (drawProg > 0) {
      const totalSegments = pts.length - 1;
      const segsToDraw = Math.floor(drawProg * totalSegments);
      const segFrac = (drawProg * totalSegments) - segsToDraw;

      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i <= segsToDraw && i < pts.length; i++) {
        const cp1x = pts[i-1].x + (pts[i].x - pts[i-1].x) * 0.5;
        const cp1y = pts[i-1].y;
        const cp2x = pts[i-1].x + (pts[i].x - pts[i-1].x) * 0.5;
        const cp2y = pts[i].y;
        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, pts[i].x, pts[i].y);
      }

      if (segsToDraw < totalSegments) {
        const i = segsToDraw + 1;
        const prevX = pts[i-1].x;
        const prevY = pts[i-1].y;
        const nextX = pts[i].x;
        const nextY = pts[i].y;
        const interpX = prevX + (nextX - prevX) * segFrac;
        const interpY = prevY + (nextY - prevY) * segFrac;
        ctx.lineTo(interpX, interpY);

        ctx.strokeStyle = route.color + 'CC';
        ctx.stroke();

        // Moving dot
        ctx.beginPath(); ctx.arc(interpX, interpY, 5, 0, Math.PI * 2);
        ctx.fillStyle = route.color; ctx.fill();

        // Glow
        const glow = ctx.createRadialGradient(interpX, interpY, 0, interpX, interpY, 20);
        glow.addColorStop(0, route.color + '40');
        glow.addColorStop(1, route.color + '00');
        ctx.beginPath(); ctx.arc(interpX, interpY, 20, 0, Math.PI * 2);
        ctx.fillStyle = glow; ctx.fill();
      } else {
        ctx.strokeStyle = route.color + 'CC';
        ctx.stroke();
      }
    }

    // Start/End pins
    ctx.beginPath(); ctx.arc(pts[0].x, pts[0].y, 6, 0, Math.PI * 2);
    ctx.fillStyle = route.color; ctx.fill();
    ctx.strokeStyle = '#0D1424'; ctx.lineWidth = 2; ctx.stroke();

    const lastPt = pts[pts.length - 1];
    ctx.beginPath(); ctx.arc(lastPt.x, lastPt.y, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#0D1424'; ctx.fill();
    ctx.strokeStyle = route.color; ctx.lineWidth = 2; ctx.stroke();

    if (drawProg >= 1) {
      ctx.font = 'bold 11px Inter, sans-serif';
      ctx.fillStyle = route.color;
      ctx.textAlign = 'left';
      ctx.fillText('📍 ' + route.dest, lastPt.x + 12, lastPt.y + 4);
    }

    // Draw the Obstruction if Rerouted
    if (isRerouted) {
      const blockX = route.blockagePoint[0] * width;
      const blockY = route.blockagePoint[1] * height;
      
      // Static red dot instead of continuous pulsing
      const pulse = 0.5;
      ctx.beginPath();
      ctx.arc(blockX, blockY, 4 + pulse * 4, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 82, 116, ${1 - pulse})`;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(blockX, blockY, 4, 0, Math.PI * 2);
      ctx.fillStyle = 'var(--color-red)';
      ctx.fill();

      // Small X mark
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(blockX - 2, blockY - 2); ctx.lineTo(blockX + 2, blockY + 2);
      ctx.moveTo(blockX + 2, blockY - 2); ctx.lineTo(blockX - 2, blockY + 2);
      ctx.stroke();
    }
  }

  function animate() {
    drawStadium();
    drawRoute();
    if (animProgress < 1.0) {
      animId = requestAnimationFrame(animate);
    }
  }

  // Handle Origin Switching
  originButtons.forEach(btn => {
    const handler = () => {
      originButtons.forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-pressed', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-pressed', 'true');
      activeOrigin = btn.getAttribute('data-origin');
      animProgress = 0;
      
      // Turn off rerouting when switching origins by default
      isRerouted = false;
      rerouteBtn.classList.remove('active');
      rerouteBtn.setAttribute('aria-pressed', 'false');
      rerouteBtn.innerHTML = '<span aria-hidden="true">⚠</span> Simulate Congestion';
      
      if (etaValue) etaValue.textContent = origins[activeOrigin].eta;
      cancelAnimationFrame(animId);
      requestAnimationFrame(animate);
    };
    btn.addEventListener('click', handler);
    btn.addEventListener('touchend', (e) => { e.preventDefault(); handler(); });
  });

  // Handle "Simulate Congestion" toggle
  if (rerouteBtn) {
    const toggleReroute = () => {
      isRerouted = !isRerouted;
      animProgress = 0; // Restart animation on the new path
      
      if (isRerouted) {
        rerouteBtn.classList.add('active');
        rerouteBtn.setAttribute('aria-pressed', 'true');
        rerouteBtn.innerHTML = '<span aria-hidden="true">🔄</span> Clear Congestion';
        if (etaValue) etaValue.textContent = origins[activeOrigin].etaRerouted;
      } else {
        rerouteBtn.classList.remove('active');
        rerouteBtn.setAttribute('aria-pressed', 'false');
        rerouteBtn.innerHTML = '<span aria-hidden="true">⚠</span> Simulate Congestion';
        if (etaValue) etaValue.textContent = origins[activeOrigin].eta;
      }
      cancelAnimationFrame(animId);
      requestAnimationFrame(animate);
    };
    rerouteBtn.addEventListener('click', toggleReroute);
    rerouteBtn.addEventListener('touchend', (e) => { e.preventDefault(); toggleReroute(); });
  }

  // Handle Canvas Hover (Tooltips)
  function handleHover(e) {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const mx = (clientX - rect.left) / rect.width;
    const my = (clientY - rect.top) / rect.height;

    let hoveredPoi = null;

    pois.forEach(poi => {
      const dx = (mx - poi.cx) / poi.r; // scale distance by radius
      const dy = (my - poi.cy) / poi.r;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 1) { // inside normalized radius
        hoveredPoi = poi;
      }
    });

    if (hoveredPoi && tooltip) {
      tooltipTitle.textContent = hoveredPoi.title;
      tooltipDesc.textContent = hoveredPoi.desc;
      tooltip.style.left = (clientX - rect.left) + 'px';
      tooltip.style.top = (clientY - rect.top - 20) + 'px';
      tooltip.classList.add('visible');
      document.body.style.cursor = 'pointer'; // Fallback cursor
    } else if (tooltip) {
      tooltip.classList.remove('visible');
      document.body.style.cursor = 'none';
    }
  }

  canvas.addEventListener('mousemove', handleHover);
  canvas.addEventListener('touchmove', handleHover, { passive: true });
  canvas.addEventListener('mouseleave', () => {
    if (tooltip) tooltip.classList.remove('visible');
  });

  // Start when in view
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        resize();
        requestAnimationFrame(animate);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2 });

  observer.observe(container);
  window.addEventListener('resize', () => {
    resize();
    cancelAnimationFrame(animId);
    requestAnimationFrame(animate);
  });
}
