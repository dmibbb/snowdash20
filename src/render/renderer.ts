import type { TileType } from '../types';
import type { Player } from '../entities/player';
import type { Level } from '../level/level';
import type { Game } from '../game/game';
import { CANVAS_WIDTH, TILE_SIZE, GRID_ROWS, HUD_HEIGHT, DEBUG_TILE_LABELS } from '../config';

const FIELD_HEIGHT = GRID_ROWS * TILE_SIZE;

const TILE_COLORS: Record<TileType, string> = {
  wall: '#7f8c8d',
  snow: '#ecf0f1',
  chest: '#f1c40f',
  empty: '#2c3e50',
};

const TILE_LETTERS: Record<TileType, string> = {
  wall: 'B',
  snow: 'S',
  chest: 'C',
  empty: '',
};

const MONSTER_COLORS: Record<number, string> = {
  1: '#e74c3c', // Amoeba
  2: '#e67e22', // Spiker
};

const MONSTER_LETTERS: Record<number, string> = {
  1: 'M',
  2: 'U',
};

function drawLabel(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  cy: number,
  color = '#fff',
): void {
  ctx.font = 'bold 16px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#000';
  ctx.fillStyle = color;
  ctx.strokeText(text, cx, cy);
  ctx.fillText(text, cx, cy);
}

export function render(
  ctx: CanvasRenderingContext2D,
  level: Level,
  player: Player,
  game: Game,
): void {
  // Background
  ctx.fillStyle = '#2c3e50';
  ctx.fillRect(0, 0, CANVAS_WIDTH, FIELD_HEIGHT);

  // Visual cell grid — TODO: remove in final release
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
  ctx.lineWidth = 1;

  for (let col = 0; col <= level.cols; col++) {
    const x = col * TILE_SIZE + 0.5;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, FIELD_HEIGHT);
    ctx.stroke();
  }

  for (let row = 0; row <= level.rows; row++) {
    const y = row * TILE_SIZE + 0.5;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(CANVAS_WIDTH, y);
    ctx.stroke();
  }

  // Tiles
  for (let row = 0; row < level.rows; row++) {
    for (let col = 0; col < level.cols; col++) {
      const tile = level.getCell(col, row);
      if (tile === 'empty') continue;

      ctx.fillStyle = TILE_COLORS[tile];
      ctx.fillRect(col * TILE_SIZE, row * TILE_SIZE, TILE_SIZE, TILE_SIZE);

      if (DEBUG_TILE_LABELS) {
        const letter = TILE_LETTERS[tile];
        if (letter) {
          drawLabel(ctx, letter, col * TILE_SIZE + TILE_SIZE / 2, row * TILE_SIZE + TILE_SIZE / 2);
        }
      }
    }
  }

  // Stones
  for (const stone of game.stones) {
    ctx.fillStyle = '#34495e';
    ctx.fillRect(stone.x, stone.y, TILE_SIZE, TILE_SIZE);

    if (DEBUG_TILE_LABELS) {
      drawLabel(
        ctx,
        'K',
        stone.x + TILE_SIZE / 2,
        stone.y + TILE_SIZE / 2,
        stone.state === 'idle' ? '#fff' : '#f39c12',
      );
    }
  }

  // Monsters
  for (const monster of game.monsters) {
    if (monster.killed) continue;

    ctx.fillStyle = MONSTER_COLORS[monster.model];
    ctx.fillRect(monster.x, monster.y, TILE_SIZE, TILE_SIZE);

    if (DEBUG_TILE_LABELS) {
      drawLabel(
        ctx,
        MONSTER_LETTERS[monster.model],
        monster.x + TILE_SIZE / 2,
        monster.y + TILE_SIZE / 2,
      );
    }
  }

  // HUD
  ctx.fillStyle = '#4a4a4a';
  ctx.fillRect(0, FIELD_HEIGHT, CANVAS_WIDTH, HUD_HEIGHT);
  ctx.strokeStyle = '#ecf0f1';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, FIELD_HEIGHT + 1);
  ctx.lineTo(CANVAS_WIDTH, FIELD_HEIGHT + 1);
  ctx.stroke();

  // HUD text — placeholder for phase 8 (real sprites)
  ctx.fillStyle = '#ecf0f1';
  ctx.font = '20px monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(`Score: ${game.score}`, 20, FIELD_HEIGHT + HUD_HEIGHT / 2);
  ctx.fillText(`Chests: ${game.visibleChests}`, CANVAS_WIDTH - 180, FIELD_HEIGHT + HUD_HEIGHT / 2);

  // Player
  ctx.fillStyle = '#3498db';
  ctx.fillRect(player.x, player.y, TILE_SIZE, TILE_SIZE);

  if (DEBUG_TILE_LABELS) {
    drawLabel(ctx, 'P', player.x + TILE_SIZE / 2, player.y + TILE_SIZE / 2);
  }
}
