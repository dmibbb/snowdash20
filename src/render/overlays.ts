import { CANVAS_WIDTH, CANVAS_HEIGHT, GRID_ROWS, TILE_SIZE } from '../config';
import type { Game } from '../game/game';
import { getRating } from '../game/rating';

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

function drawModalFrame(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  const boxW = 500;
  const boxH = 400;
  const boxX = (CANVAS_WIDTH - boxW) / 2;
  const boxY = (CANVAS_HEIGHT - boxH) / 2;

  ctx.fillStyle = '#1e1e2e';
  ctx.fillRect(boxX, boxY, boxW, boxH);

  ctx.strokeStyle = '#4a8ed8';
  ctx.lineWidth = 3;
  ctx.strokeRect(boxX + 1.5, boxY + 1.5, boxW - 3, boxH - 3);
}

export function drawAboutOverlay(ctx: CanvasRenderingContext2D): void {
  drawModalFrame(ctx);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const cx = CANVAS_WIDTH / 2;
  let y = 170;

  ctx.fillStyle = '#ecf0f1';
  ctx.font = 'bold 24px monospace';
  ctx.fillText('RGB Team', cx, y);

  y += 28;
  ctx.fillStyle = 'rgba(236, 240, 241, 0.5)';
  ctx.font = '16px monospace';
  ctx.fillText('---------------------------', cx, y);

  y += 30;
  ctx.fillStyle = '#ecf0f1';
  ctx.font = 'bold 22px monospace';
  ctx.fillText('SnowDash v1.0', cx, y);

  y += 30;
  ctx.font = '18px monospace';
  ctx.fillText('...2 Dash or not 2 Dash?', cx, y);

  y += 40;
  ctx.fillText('Created by RGB Team', cx, y);

  y += 40;
  ctx.fillStyle = 'rgba(236, 240, 241, 0.7)';
  ctx.fillText('(c) 2006', cx, y);

  y += 70;
  ctx.fillStyle = '#ffd700';
  ctx.font = '18px monospace';
  ctx.fillText('[ OK — click or press Enter ]', cx, y);
}

export function drawExitOverlay(ctx: CanvasRenderingContext2D): void {
  drawModalFrame(ctx);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const cx = CANVAS_WIDTH / 2;
  const cy = CANVAS_HEIGHT / 2;

  ctx.fillStyle = '#ecf0f1';
  ctx.font = 'bold 32px monospace';
  ctx.fillText('Thanks for playing!', cx, cy - 20);

  ctx.font = '18px monospace';
  ctx.fillText('See you in the next SnowDash', cx, cy + 30);

  ctx.fillStyle = 'rgba(236, 240, 241, 0.7)';
  ctx.font = '16px monospace';
  ctx.fillText('[ OK — click or press Enter ]', cx, cy + 90);
}

export function drawGameOverOverlay(ctx: CanvasRenderingContext2D, game: Game): void {
  // Field-only dim (HUD stays visible — we're a full mode, not overlay)
  const fieldHeight = GRID_ROWS * TILE_SIZE;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
  ctx.fillRect(0, 0, CANVAS_WIDTH, fieldHeight);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const cx = CANVAS_WIDTH / 2;
  const cy = fieldHeight / 2;

  ctx.fillStyle = '#e74c3c';
  ctx.font = 'bold 64px monospace';
  ctx.fillText('GAME OVER', cx, cy - 80);

  ctx.fillStyle = '#ecf0f1';
  ctx.font = '28px monospace';
  ctx.fillText(`Score: ${game.score}`, cx, cy);
  ctx.fillText(`Rating: ${getRating(game.levelIndex)}`, cx, cy + 50);
}
