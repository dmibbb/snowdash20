import { CANVAS_WIDTH, CANVAS_HEIGHT, GRID_ROWS, TILE_SIZE } from '../config';
import type { Game } from '../game/game';
import { getRating } from '../game/rating';
import { assets } from '../assets/loader';
import { drawButton, type ButtonRect } from './button';

export const PAUSE_MENU_BUTTON: ButtonRect = {
  x: CANVAS_WIDTH / 2 - 75,
  y: (GRID_ROWS * TILE_SIZE) / 2 + 175,
  w: 150,
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
  ctx.fillText('Press Esc or P to resume', CANVAS_WIDTH / 2, centerY + 35);
  ctx.fillText('Press R to restart (−200 pts)', CANVAS_WIDTH / 2, centerY + 58);

  const btnImg = assets.get(hoveredMenuBtn ? 'main_menu_2' : 'main_menu');

  if (btnImg) {
    ctx.drawImage(
      btnImg,
      PAUSE_MENU_BUTTON.x,
      PAUSE_MENU_BUTTON.y,
      PAUSE_MENU_BUTTON.w,
      PAUSE_MENU_BUTTON.h,
    );
  } else {
    drawButton(ctx, PAUSE_MENU_BUTTON, '[ Back to Main Menu ]', hoveredMenuBtn, 20);
  }
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

function drawHintText(ctx: CanvasRenderingContext2D, text: string, cx: number, cy: number): void {
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 18px monospace';
  ctx.lineJoin = 'round';

  // Single thin cyan outline — barely there, just enough to lift the text off the dark modal
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#00aaff';
  ctx.strokeText(text, cx, cy);

  // Deep navy fill
  ctx.fillStyle = '#0a0a8a';
  ctx.fillText(text, cx, cy);

  ctx.restore();
}

interface TextSegment {
  text: string;
  color: string;
  strokeColor?: string;
  strokeWidth?: number;
}

// Draws a sequence of colored text segments centered horizontally at `cx`
function drawCenteredSegments(
  ctx: CanvasRenderingContext2D,
  segments: TextSegment[],
  cx: number,
  y: number,
): void {
  const savedAlign = ctx.textAlign;
  ctx.textAlign = 'left';

  let totalWidth = 0;
  for (const seg of segments) {
    totalWidth += ctx.measureText(seg.text).width;
  }

  let x = cx - totalWidth / 2;
  for (const seg of segments) {
    if (seg.strokeColor && seg.strokeWidth) {
      ctx.lineWidth = seg.strokeWidth;
      ctx.strokeStyle = seg.strokeColor;
      ctx.lineJoin = 'round';
      ctx.miterLimit = 2;
      ctx.strokeText(seg.text, x, y);
    }
    ctx.fillStyle = seg.color;
    ctx.fillText(seg.text, x, y);
    x += ctx.measureText(seg.text).width;
  }

  ctx.textAlign = savedAlign;
}

export function drawAboutOverlay(ctx: CanvasRenderingContext2D): void {
  drawModalFrame(ctx);

  ctx.textBaseline = 'middle';
  const cx = CANVAS_WIDTH / 2;

  ctx.textAlign = 'center';
  ctx.fillStyle = '#ecf0f1';
  ctx.font = 'bold 24px monospace';
  ctx.fillText('SnowDash v1.0', cx, 155);

  ctx.font = '16px monospace';
  ctx.fillText('...2 Dash or not 2 Dash?', cx, 175);

  ctx.font = 'bold 20px monospace';
  drawCenteredSegments(
    ctx,
    [
      { text: 'Created by ', color: '#ecf0f1' },
      { text: 'R', color: '#ff0000' },
      { text: 'G', color: '#00ff00' },
      { text: 'B', color: '#0000ff' },
      { text: ' ', color: '#ecf0f1' },
      {
        text: 'Team',
        color: '#0a0a0a',
        strokeColor: '#ecf0f1',
        strokeWidth: 2,
      },
      { text: ' (c) 2006, 2008', color: '#ecf0f1' },
    ],
    cx,
    270,
  );

  ctx.font = '20px monospace';
  drawCenteredSegments(
    ctx,
    [
      { text: 'Web edition created by ', color: '#ecf0f1' },
      { text: 'Димасик', color: '#0000ff' },
      { text: ' in 2026', color: '#ecf0f1' },
    ],
    cx,
    300,
  );

  ctx.textAlign = 'center';
  drawHintText(ctx, '[ OK — click or press Enter ]', cx, 390);
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

  drawHintText(ctx, '[ Quit — click or press Enter ]', cx, cy + 90);
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
    ctx.fillStyle = game.victory ? '#ffd700' : '#e74c3c';
    ctx.font = 'bold 64px monospace';
    ctx.fillText(game.victory ? 'CONGRATULATIONS!' : 'GAME OVER', cx, cy - 80);
  }

  if (game.victory) {
    drawGlowingText(ctx, 'Well done, Mr. Snejok!', cx, cy, 28);
  }

  // Stats
  const scoreY = game.victory ? cy + 50 : cy + 20;
  const ratingY = game.victory ? cy + 90 : cy + 60;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ecf0f1';
  ctx.font = '24px monospace';
  ctx.fillText(`Score: ${game.score}`, cx, scoreY);
  ctx.fillText(`Rating: ${getRating(game.levelIndex)}`, cx, ratingY);
}

export function drawLevelCompleteOverlay(ctx: CanvasRenderingContext2D, game: Game): void {
  const fieldHeight = GRID_ROWS * TILE_SIZE;
  const cx = CANVAS_WIDTH / 2;
  const cy = fieldHeight / 2;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
  ctx.fillRect(0, 0, CANVAS_WIDTH, fieldHeight);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  drawGlowingText(ctx, 'Congratulations!', cx, cy - 90, 36);

  ctx.fillStyle = '#ecf0f1';
  ctx.font = 'bold 28px monospace';
  ctx.fillText(`LEVEL ${game.levelIndex + 1} DONE!`, cx, cy - 30);

  ctx.font = '22px monospace';
  ctx.fillText(`Your score: ${game.score}`, cx, cy + 20);

  // Hint
  ctx.font = 'bold 16px monospace';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(
    game.isLastLevel() ? 'Press any key to finish' : 'Press any key to continue',
    cx,
    fieldHeight - 30,
  );
}

export function drawLevelTitleOverlay(ctx: CanvasRenderingContext2D, game: Game): void {
  if (!game.level) return;

  const fieldHeight = GRID_ROWS * TILE_SIZE;
  const cx = CANVAS_WIDTH / 2;
  const cy = fieldHeight / 2;

  // Semi-transparent band across the middle
  ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
  ctx.fillRect(0, cy - 55, CANVAS_WIDTH, 110);

  const levelNum = game.levelIndex + 1;
  const title = game.level.name ? `LEVEL ${levelNum}: ${game.level.name}` : `LEVEL ${levelNum}`;

  drawGlowingText(ctx, title, cx, cy, 32);
}

// Deep-navy fill with cyan outer glow
export function drawGlowingText(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  cy: number,
  fontSize: number,
): void {
  const savedFont = ctx.font;
  const savedAlign = ctx.textAlign;
  const savedBaseline = ctx.textBaseline;

  ctx.font = `bold ${fontSize}px Impact, 'Arial Black', 'Segoe UI Black', sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.miterLimit = 2;

  // Outer dim cyan halo
  ctx.lineWidth = 8;
  ctx.strokeStyle = 'rgba(0, 170, 255, 0.35)';
  ctx.strokeText(text, cx, cy);

  // Mid cyan halo
  ctx.lineWidth = 4;
  ctx.strokeStyle = 'rgba(0, 221, 255, 0.65)';
  ctx.strokeText(text, cx, cy);

  // Tight bright cyan rim
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#00ffff';
  ctx.strokeText(text, cx, cy);

  // Deep navy fill
  ctx.fillStyle = '#0a0a8a';
  ctx.fillText(text, cx, cy);

  ctx.font = savedFont;
  ctx.textAlign = savedAlign;
  ctx.textBaseline = savedBaseline;
}
