import type { ModeHooks } from '../game/modeMachine';
import type { Game } from '../game/game';
import { CANVAS_WIDTH, CANVAS_HEIGHT, GRID_ROWS, TILE_SIZE, HUD_HEIGHT } from '../config';
import { drawGameOverOverlay } from '../render/overlays';
import { render as renderGame } from '../render/renderer';
import { drawButton, isPointInRect, type ButtonRect } from '../render/button';
import { getMousePosition, consumeClick, consumeConfirm, consumePause } from '../input/input';
import { audio } from '../audio/audio';
import { assets } from '../assets/loader';

const FIELD_HEIGHT = GRID_ROWS * TILE_SIZE;

const BACK_BUTTON: ButtonRect = {
  x: CANVAS_WIDTH / 2 - 75,
  y: FIELD_HEIGHT / 2 + 110,
  w: 150,
  h: 50,
};

export interface GameOverCallbacks {
  getGame: () => Game | null;
  onBack: () => void;
}

export function createGameOver(callbacks: GameOverCallbacks): ModeHooks {
  let hovered = false;

  return {
    onEnter: () => {
      hovered = false;
      consumeClick();
      consumeConfirm();
      consumePause();
      audio.stopAllSfx();
      audio.stopMusic();
      if (callbacks.getGame()?.victory) {
        audio.playSfx(38); // Your Score
      }
    },
    tick: () => {
      const mouse = getMousePosition();
      hovered = mouse ? isPointInRect(mouse, BACK_BUTTON) : false;

      if (consumeConfirm() || consumePause()) {
        audio.stopAllSfx();
        audio.playSfx(31);
        callbacks.onBack();
        return;
      }

      const click = consumeClick();
      if (click && isPointInRect(click, BACK_BUTTON)) {
        audio.stopAllSfx();
        audio.playSfx(31);
        callbacks.onBack();
      }
    },
    render: (ctx) => {
      // Base scene: field + HUD
      const game = callbacks.getGame();
      if (game) {
        renderGame(ctx, game);
        drawGameOverOverlay(ctx, game);
      } else {
        ctx.fillStyle = '#2c3e50';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      }

      // HUD strip placeholder background so button doesn't clash
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.fillRect(0, FIELD_HEIGHT, CANVAS_WIDTH, HUD_HEIGHT);

      const btnImg = assets.get(hovered ? 'main_menu_2' : 'main_menu');
      if (btnImg) {
        ctx.drawImage(btnImg, BACK_BUTTON.x, BACK_BUTTON.y, BACK_BUTTON.w, BACK_BUTTON.h);
      } else {
        drawButton(ctx, BACK_BUTTON, '[ Back to Main Menu ]', hovered, 20);
      }
    },
  };
}
