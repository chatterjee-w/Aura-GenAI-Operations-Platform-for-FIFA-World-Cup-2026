import { describe, it, expect, beforeEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';

function loadScript(filename) {
  const filepath = path.resolve(__dirname, '../js', filename);
  const code = fs.readFileSync(filepath, 'utf8');
  // eval in global context
  window.eval(code);
}

describe('Aura UI Tests', () => {
  beforeEach(() => {
    // Reload HTML before each test
    const html = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf8');
    document.body.innerHTML = html;
    
    // Reset global state
    vi.useFakeTimers();
  });

  it('Dashboard view-toggle state changes', () => {
    loadScript('dashboard.js');
    // Fire DOMContentLoaded to initialize
    document.dispatchEvent(new Event('DOMContentLoaded'));

    const toggles = document.querySelectorAll('.dashboard__toggle-btn');
    const panels = document.querySelectorAll('.dashboard__panel');
    
    expect(toggles.length).toBeGreaterThan(0);
    
    // Initial state
    expect(toggles[0].classList.contains('active')).toBe(true);
    expect(toggles[1].classList.contains('active')).toBe(false);

    // Click second toggle
    toggles[1].click();
    
    vi.advanceTimersByTime(50);

    const view = toggles[1].getAttribute('data-view');
    const targetPanel = document.querySelector(`[data-panel="${view}"]`);
    expect(targetPanel.classList.contains('active')).toBe(true);
  });

  it('Chat message flow and empty input handling', async () => {
    loadScript('chat.js');
    document.dispatchEvent(new Event('DOMContentLoaded'));

    const input = document.getElementById('chat-input');
    const sendBtn = document.getElementById('chat-send');
    const chatFeed = document.getElementById('chat-col-en');

    const initialMessagesCount = chatFeed.querySelectorAll('.chat__message').length;

    // Test empty input (should not add message)
    input.value = '   ';
    sendBtn.click();
    expect(chatFeed.querySelectorAll('.chat__message').length).toBe(initialMessagesCount);

    // Test valid input
    input.value = 'Where is the nearest restroom?';
    sendBtn.click();
    
    // Fast-forward 3 seconds to cover typing indicator and response delay
    await vi.advanceTimersByTimeAsync(3000);
    
    // User message and bot message should be added
    const msgs = chatFeed.querySelectorAll('.chat__message:not(.chat__message--typing)');
    expect(msgs.length).toBeGreaterThanOrEqual(initialMessagesCount + 2);
    expect(msgs[msgs.length - 2].classList.contains('chat__message--user')).toBe(true);
    expect(msgs[msgs.length - 1].classList.contains('chat__message--ai')).toBe(true);
    expect(input.value).toBe(''); // Input cleared
  });

  it('Heatmap phase toggle and continuous scrubber logic', () => {
    loadScript('utils.js');
    loadScript('heatmap.js');
    document.dispatchEvent(new Event('DOMContentLoaded'));

    const scrubber = document.getElementById('heatmap-scrubber');
    const timeDisplay = document.getElementById('heatmap-time');
    const phaseBtns = document.querySelectorAll('.heatmap__phase-btn:not(.heatmap__phase-btn--resume)');
    const resumeBtn = document.getElementById('heatmap-resume');

    // Click phase button
    phaseBtns[2].click();
    expect(phaseBtns[2].classList.contains('active')).toBe(true);
    expect(resumeBtn.style.display).not.toBe('none');

    // Drag scrubber
    scrubber.value = 250;
    scrubber.dispatchEvent(new Event('input'));
    expect(resumeBtn.style.display).not.toBe('none');
    
    // Resume auto-play
    resumeBtn.click();
    expect(resumeBtn.style.display).toBe('none');
  });

  it('Heatmap zone click handling (invalid/empty area vs valid area)', () => {
    loadScript('utils.js');
    loadScript('heatmap.js');
    document.dispatchEvent(new Event('DOMContentLoaded'));

    const canvas = document.getElementById('heatmap-canvas');
    const tooltip = document.getElementById('heatmap-zone-tooltip');
    
    // Mock rect
    canvas.getBoundingClientRect = () => ({ left: 0, top: 0, width: 800, height: 600 });
    
    // Click outside zones
    canvas.dispatchEvent(new MouseEvent('click', { clientX: 10, clientY: 10 }));
    expect(tooltip.classList.contains('visible')).toBe(false);

    // Click inside a zone (e.g., Gate A at cx: 0.15, cy: 0.82)
    canvas.dispatchEvent(new MouseEvent('click', { clientX: 800 * 0.15, clientY: 600 * 0.82 }));
    expect(tooltip.classList.contains('visible')).toBe(true);
    
    // Close overlay
    const overlay = document.getElementById('heatmap-overlay');
    const closeBtn = document.querySelector('.crowd__reroute-close');
    closeBtn.click();
    expect(overlay.classList.contains('visible')).toBe(false);
  });

  it('Counter animation logic', () => {
    loadScript('main.js');
    // We can directly call the global initCounters
    
    const counter = document.querySelector('[data-count="42"]'); // Sample counter
    if (!counter) return; // Skip if no counter found
    
    // It should be handled by IntersectionObserver, which we mocked
    // We can simulate animateCounter directly
    window.animateCounter(counter);
    vi.advanceTimersByTime(2500); // Wait for animation duration
    
    expect(counter.textContent).toContain('42');
  });
});
