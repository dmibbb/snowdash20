import type { TileType } from '../types';
import type { Game } from '../game/game';
import { CANVAS_WIDTH, CANVAS_HEIGHT, TILE_SIZE, GRID_ROWS, DEBUG_TILE_LABELS } from '../config';
import { renderHud } from './hud';
import { assets } from '../assets/loader';

const FIELD_HEIGHT = GRID_ROWS * TILE_SIZE;

const TILE_COLORS: Record<TileType, string> = {
  wall: '#7f8c8d',
  snow: '#ecf0f1',
  chest: '#f1c40f',
  empty: '#2c3e50',
};

const TILE_SPRITE_KEY: Record<TileType, string | null> = {
  wall: 'block',
  snow: 'snow',
  chest: 'chest',
  empty: null,
};

let bgPattern: CanvasPattern | null = null;

const TILE_LETTERS: Record<TileType, string> = {
  wall: 'B',
  snow: 'S',
  chest: 'C',
  empty: '',
};

const MONSTER_COLORS: Record<number, string> = {
  1: '#e74c3c',
  2: '#e67e22',
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

export function render(ctx: CanvasRenderingContext2D, game: Game): void {
  ctx.fillStyle = '#2c3e50';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  if (!game.level || !game.player) {
    ctx.fillStyle = '#ecf0f1';
    ctx.font = '24px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Loading...', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    return;
  }

  // Tiled background over the field
  const bg = assets.get('background');
  if (bg) {
    if (!bgPattern) bgPattern = ctx.createPattern(bg, 'repeat');
    if (bgPattern) {
      ctx.fillStyle = bgPattern;
      ctx.fillRect(0, 0, CANVAS_WIDTH, FIELD_HEIGHT);
    }
  }

  // Visual cell grid — TODO: remove in final release
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
  ctx.lineWidth = 1;
  for (let col = 0; col <= game.level.cols; col++) {
    const x = col * TILE_SIZE + 0.5;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, FIELD_HEIGHT);
    ctx.stroke();
  }
  for (let row = 0; row <= game.level.rows; row++) {
    const y = row * TILE_SIZE + 0.5;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(CANVAS_WIDTH, y);
    ctx.stroke();
  }

  // Tiles
  for (let row = 0; row < game.level.rows; row++) {
    for (let col = 0; col < game.level.cols; col++) {
      const tile = game.level.getCell(col, row);
      if (tile === 'empty') continue;

      const key = TILE_SPRITE_KEY[tile];
      const sprite = key ? assets.get(key) : undefined;
      if (sprite) {
        ctx.drawImage(sprite, col * TILE_SIZE, row * TILE_SIZE, TILE_SIZE, TILE_SIZE);
      } else {
        ctx.fillStyle = TILE_COLORS[tile];
        ctx.fillRect(col * TILE_SIZE, row * TILE_SIZE, TILE_SIZE, TILE_SIZE);
      }

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
    const stoneSprite = assets.get('snowball');
    if (stoneSprite) {
      ctx.drawImage(stoneSprite, stone.x, stone.y, TILE_SIZE, TILE_SIZE);
    } else {
      ctx.fillStyle = '#34495e';
      ctx.fillRect(stone.x, stone.y, TILE_SIZE, TILE_SIZE);
    }

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

    const sprite = assets.get(monster.getSpriteKey());
    if (sprite) {
      ctx.drawImage(sprite, monster.x, monster.y, TILE_SIZE, TILE_SIZE);
    } else {
      ctx.fillStyle = MONSTER_COLORS[monster.model];
      ctx.fillRect(monster.x, monster.y, TILE_SIZE, TILE_SIZE);
    }
    if (DEBUG_TILE_LABELS) {
      drawLabel(
        ctx,
        MONSTER_LETTERS[monster.model],
        monster.x + TILE_SIZE / 2,
        monster.y + TILE_SIZE / 2,
      );
    }
  }

  renderHud(ctx, game);

  // Player
  const playerSprite = assets.get(game.player.getSpriteKey());
  if (playerSprite) {
    ctx.drawImage(playerSprite, game.player.x, game.player.y, TILE_SIZE, TILE_SIZE);
  } else {
    ctx.fillStyle = '#3498db';
    ctx.fillRect(game.player.x, game.player.y, TILE_SIZE, TILE_SIZE);
  }
  if (DEBUG_TILE_LABELS) {
    drawLabel(ctx, 'P', game.player.x + TILE_SIZE / 2, game.player.y + TILE_SIZE / 2);
  }
}
