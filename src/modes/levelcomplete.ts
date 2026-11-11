import type { ModeHooks } from '../game/modeMachine';
import type { Game } from '../game/game';
import { CANVAS_WIDTH, GRID_ROWS, TILE_SIZE, HUD_HEIGHT } from '../config';
import { render as renderGame } from '../render/renderer';
import { drawLevelCompleteOverlay } from '../render/overlays';
import { drawButton, isPointInRect, type ButtonRect } from '../render/button';
import { getMousePosition, consumeClick, consumeConfirm, consumePause } from '../input/input';
import { audio } from '../audio/audio';

const FIELD_HEIGHT = GRID_ROWS * TILE_SIZE;

const CONTINUE_BUTTON: ButtonRect = {
  x: CANVAS_WIDTH / 2 - 130,
  y: FIELD_HEIGHT / 2 + 110,
  w: 260,
  h: 56,
};

export interface LevelCompleteCallbacks {
  getGame: () => Game | null;
  onContinue: () => void;
}

export function createLevelComplete(callbacks: LevelCompleteCallbacks): ModeHooks {
  let hovered = false;
  let buttonLabel = 'Continue';

  function triggerContinue(): void {
    audio.playSfx(31);
    callbacks.onContinue();
  }

  return {
    onEnter: () => {
      hovered = false;
      consumeClick();
      consumeConfirm();
      consumePause();
      const game = callbacks.getGame();
      buttonLabel = game && game.isLastLevel() ? 'OK' : 'Continue';
    },
    tick: () => {
      const mouse = getMousePosition();
      hovered = mouse ? isPointInRect(mouse, CONTINUE_BUTTON) : false;

      if (consumeConfirm() || consumePause()) {
        triggerContinue();
        return;
      }

      const click = consumeClick();
      if (click && isPointInRect(click, CONTINUE_BUTTON)) {
        triggerContinue();
      }
    },
    render: (ctx) => {
      const game = callbacks.getGame();
      if (game) {
        renderGame(ctx, game);
        drawLevelCompleteOverlay(ctx, game);
      } else {
        ctx.fillStyle = '#2c3e50';
        ctx.fillRect(0, 0, CANVAS_WIDTH, FIELD_HEIGHT + HUD_HEIGHT);
      }

      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.fillRect(0, FIELD_HEIGHT, CANVAS_WIDTH, HUD_HEIGHT);

      drawButton(ctx, CONTINUE_BUTTON, buttonLabel, hovered, 20);
    },
  };
}
