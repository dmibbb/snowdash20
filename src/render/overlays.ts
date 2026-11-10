import { CANVAS_WIDTH, CANVAS_HEIGHT, GRID_ROWS, TILE_SIZE } from '../config';
import type { Game } from '../game/game';
import { getRating } from '../game/rating';
import { assets } from '../assets/loader';
import { drawButton, type ButtonRect } from './button';

export const PAUSE_MENU_BUTTON: ButtonRect = {
  x: CANVAS_WIDTH / 2 - 100,
  y: (GRID_ROWS * TILE_SIZE) / 2 + 80,
  w: 200,
  h: 50,
};

export function drawPauseOverlay(ctx: CanvasRenderingContext2D, hoveredMenuBtn: boolean): void {
  const fieldHeight = GRID_ROWS * TILE_SIZE;
  const centerY = fieldHeight / 2;

  // Dim field
  ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
  ctx.fillRect(0, 0, CANVAS_WIDTH, fieldHeight);

  // "PAUSE" image (shifted up slightly)
  const pauseImg = assets.get('pause');
  if (pauseImg) {
    const w = 320;
    const h = 100;
    ctx.drawImage(pauseImg, (CANVAS_WIDTH - w) / 2, centerY - h / 2 - 30, w, h);
  } else {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ecf0f1';
    ctx.font = 'bold 64px monospace';
    ctx.fillText('PAUSE', CANVAS_WIDTH / 2, centerY - 30);
  }

  // Hint text
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(236, 240, 241, 0.7)';
  ctx.font = '16px monospace';
  ctx.fillText('Press Esc or P to resume', CANVAS_WIDTH / 2, centerY + 40);

  // Main Menu button
  drawButton(ctx, PAUSE_MENU_BUTTON, 'Back to Menu', hoveredMenuBtn, 20);
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
  const fieldHeight = GRID_ROWS * TILE_SIZE;
  const cx = CANVAS_WIDTH / 2;
  const cy = fieldHeight / 2;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
  ctx.fillRect(0, 0, CANVAS_WIDTH, fieldHeight);

  // Draw "GAME OVER" image
  const goImg = assets.get('gameover');
  if (goImg) {
    const w = goImg.width;
    const h = goImg.height;
    ctx.drawImage(goImg, cx - w / 2, cy - h / 2 - 60, w, h);
  } else {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#e74c3c';
    ctx.font = 'bold 64px monospace';
    ctx.fillText('GAME OVER', cx, cy - 80);
  }

  // Draw text stats
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ecf0f1';
  ctx.font = '24px monospace';
  ctx.fillText(`Score: ${game.score}`, cx, cy + 20);
  ctx.fillText(`Rating: ${getRating(game.levelIndex)}`, cx, cy + 60);
}
