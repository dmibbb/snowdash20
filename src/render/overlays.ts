import { CANVAS_WIDTH, GRID_ROWS, TILE_SIZE } from '../config';

const FIELD_HEIGHT = GRID_ROWS * TILE_SIZE;

export function drawPauseOverlay(ctx: CanvasRenderingContext2D): void {
  // Dim field
  ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
  ctx.fillRect(0, 0, CANVAS_WIDTH, FIELD_HEIGHT);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const cx = CANVAS_WIDTH / 2;
  const cy = FIELD_HEIGHT / 2;

  // Shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
  ctx.font = 'bold 64px monospace';
  ctx.fillText('PAUSE', cx + 3, cy + 3);

  // Main text
  ctx.fillStyle = '#ecf0f1';
  ctx.fillText('PAUSE', cx, cy);

  // Hint
  ctx.fillStyle = 'rgba(236, 240, 241, 0.7)';
  ctx.font = '16px monospace';
  ctx.fillText('Press Esc or P to resume', cx, cy + 70);
}
