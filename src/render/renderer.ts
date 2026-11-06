import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  TILE_SIZE,
  GRID_COLS,
  GRID_ROWS,
  HUD_HEIGHT,
} from '../config';
import { Player } from '../entities/player';

const FIELD_HEIGHT = GRID_ROWS * TILE_SIZE; // 520

export function render(ctx: CanvasRenderingContext2D, player: Player): void {
  // Background
  ctx.fillStyle = '#2c3e50';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Visual cell grid
  // TODO: to be removed in final release
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 1;

  for (let col = 0; col <= GRID_COLS; col++) {
    const x = col * TILE_SIZE + 0.5;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, FIELD_HEIGHT);
    ctx.stroke();
  }

  for (let row = 0; row <= GRID_ROWS; row++) {
    const y = row * TILE_SIZE + 0.5;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(CANVAS_WIDTH, y);
    ctx.stroke();
  }

  // HUD area
  ctx.fillStyle = '#4a4a4a';
  ctx.fillRect(0, FIELD_HEIGHT, CANVAS_WIDTH, HUD_HEIGHT);

  ctx.strokeStyle = '#ecf0f1';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, FIELD_HEIGHT + 1);
  ctx.lineTo(CANVAS_WIDTH, FIELD_HEIGHT + 1);
  ctx.stroke();

  // Player
  ctx.fillStyle = '#3498db';
  ctx.fillRect(player.x, player.y, TILE_SIZE, TILE_SIZE);
}
