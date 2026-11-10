import type { Game } from '../game/game';
import { CANVAS_WIDTH, GRID_ROWS, TILE_SIZE, HUD_HEIGHT } from '../config';
import { assets } from '../assets/loader';

const FIELD_HEIGHT = GRID_ROWS * TILE_SIZE;

export function renderHud(ctx: CanvasRenderingContext2D, game: Game): void {
  const y = FIELD_HEIGHT;

  // 1. HUD background (score_bar) — includes RGB Team logo
  const scoreBar = assets.get('score_bar');
  if (scoreBar) {
    ctx.drawImage(scoreBar, 0, y, CANVAS_WIDTH, HUD_HEIGHT);
  } else {
    ctx.fillStyle = '#4a4a4a';
    ctx.fillRect(0, y, CANVAS_WIDTH, HUD_HEIGHT);
  }

  // 2. Life icons (p_d_1). Original code uses delta=20.
  const lifeSprite = assets.get('p_d_1');
  if (lifeSprite) {
    for (let i = 0; i < game.lives; i++) {
      ctx.drawImage(lifeSprite, 100 + i * 20, y, 40, 40);
    }
  }

  // 3. "Score" label at x=300
  const scoreLabel = assets.get('gamescore');
  if (scoreLabel) {
    ctx.drawImage(scoreLabel, 300, y);
  }

  // 4. Score digits at x=450
  drawNumber(ctx, game.score, 450, y);

  // 5. "Level" label at x=620
  const levelLabel = assets.get('Level');
  if (levelLabel) {
    ctx.drawImage(levelLabel, 620, y);
  }

  // 6. Level digit at x=720
  drawNumber(ctx, game.levelIndex + 1, 720, y);
}

function drawNumber(ctx: CanvasRenderingContext2D, num: number, x: number, y: number): void {
  const str = num.toString();
  let curX = x;
  for (const char of str) {
    const sprite = assets.get(char);
    if (sprite) {
      // Original code uses 40x40 images and delta=40 for digits
      ctx.drawImage(sprite, curX, y, 40, 40);
      curX += 40;
    }
  }
}
