/* ===================================================================
   UTILS.JS — Shared Utilities
   =================================================================== */

/**
 * Draws a grid and base background for stadium maps.
 * @param {CanvasRenderingContext2D} ctx - The canvas 2D context.
 * @param {number} width - Canvas width.
 * @param {number} height - Canvas height.
 * @param {number} gridSize - The spacing of the grid lines.
 */
// eslint-disable-next-line no-unused-vars
function drawBaseGrid(ctx, width, height, gridSize) {
  ctx.fillStyle = '#0D1424';
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = 'rgba(255,255,255,0.03)';
  ctx.lineWidth = 0.5;
  for (let x = 0; x < width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y < height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
}
