import type { ModeHooks } from '../game/modeMachine';
import type { Game } from '../game/game';
import { CANVAS_WIDTH, GRID_ROWS, TILE_SIZE, HUD_HEIGHT } from '../config';
import { render as renderGame } from '../render/renderer';
import { drawLevelCompleteOverlay } from '../render/overlays';
import {
  consumeClick,
  consumeConfirm,
  consumePause,
  consumeAnyKey,
  consumeNextTrack,
} from '../input/input';

const FIELD_HEIGHT = GRID_ROWS * TILE_SIZE;

export interface LevelCompleteCallbacks {
  getGame: () => Game | null;
  onContinue: () => void;
}

export function createLevelComplete(callbacks: LevelCompleteCallbacks): ModeHooks {
  let resolved = false;

  function triggerContinue(): void {
    if (resolved) return;
    resolved = true;
    callbacks.onContinue();
  }

  return {
    onEnter: () => {
      resolved = false;
      // Drop stale input from the moment the level was completed
      consumeClick();
      consumeConfirm();
      consumePause();
      consumeAnyKey();
      consumeNextTrack();
    },
    tick: () => {
      if (resolved) return;
      if (consumeAnyKey() || consumeClick() || consumeConfirm() || consumePause()) {
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
    },
  };
}
