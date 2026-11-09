import type { ModeHooks } from '../game/modeMachine';
import type { Game } from '../game/game';
import { CANVAS_WIDTH, CANVAS_HEIGHT, GRID_ROWS, TILE_SIZE, HUD_HEIGHT } from '../config';
import { drawGameOverOverlay } from '../render/overlays';
import { render as renderGame } from '../render/renderer';
import { drawButton, isPointInRect, type ButtonRect } from '../render/button';
import { getMousePosition, consumeClick, consumeConfirm, consumePause } from '../input/input';

const FIELD_HEIGHT = GRID_ROWS * TILE_SIZE;

const BACK_BUTTON: ButtonRect = {
  x: CANVAS_WIDTH / 2 - 130,
  y: FIELD_HEIGHT / 2 + 120,
  w: 260,
  h: 56,
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
    },
    tick: () => {
      const mouse = getMousePosition();
      hovered = mouse ? isPointInRect(mouse, BACK_BUTTON) : false;

      if (consumeConfirm() || consumePause()) {
        callbacks.onBack();
        return;
      }

      const click = consumeClick();
      if (click && isPointInRect(click, BACK_BUTTON)) {
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

      drawButton(ctx, BACK_BUTTON, 'Back to Menu', hovered, 20);
    },
  };
}
