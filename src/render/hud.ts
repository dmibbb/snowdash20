import type { Game } from '../game/game';
import { CANVAS_WIDTH, GRID_ROWS, TILE_SIZE, HUD_HEIGHT } from '../config';

const FIELD_HEIGHT = GRID_ROWS * TILE_SIZE;
const HUD_Y = FIELD_HEIGHT + HUD_HEIGHT / 2;

// Slot x positions — SPEC 12
const LIVES_X = 100;
const SCORE_X = 300;
const LEVEL_X = 620;

export function renderHud(ctx: CanvasRenderingContext2D, game: Game): void {
  // HUD background strip
  ctx.fillStyle = '#4a4a4a';
  ctx.fillRect(0, FIELD_HEIGHT, CANVAS_WIDTH, HUD_HEIGHT);

  // Separator line
  ctx.strokeStyle = '#ecf0f1';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, FIELD_HEIGHT + 1);
  ctx.lineTo(CANVAS_WIDTH, FIELD_HEIGHT + 1);
  ctx.stroke();

  // Text HUD — will be replaced with sprites in phase 10
  ctx.fillStyle = '#ecf0f1';
  ctx.font = '20px monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';

  ctx.fillText(`Lives: ${game.lives}`, LIVES_X - 80, HUD_Y);
  ctx.fillText(`Score: ${game.score}`, SCORE_X, HUD_Y);
  ctx.fillText(`Level: ${game.levelIndex + 1}`, LEVEL_X, HUD_Y);
}
