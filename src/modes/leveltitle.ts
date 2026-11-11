import type { ModeHooks } from '../game/modeMachine';
import type { Game } from '../game/game';
import { CANVAS_WIDTH, GRID_ROWS, TILE_SIZE, HUD_HEIGHT } from '../config';
import { render as renderGame } from '../render/renderer';
import { drawLevelTitleOverlay } from '../render/overlays';
import {
  consumeAnyKey,
  consumeClick,
  consumeConfirm,
  consumePause,
  consumeNextTrack,
} from '../input/input';
import { audio } from '../audio/audio';

const FIELD_HEIGHT = GRID_ROWS * TILE_SIZE;
const TITLE_DURATION_TICKS = 40; // 2 seconds at 20 Hz

export interface LevelTitleCallbacks {
  getGame: () => Game | null;
  onDone: () => void;
}

export function createLevelTitle(callbacks: LevelTitleCallbacks): ModeHooks {
  let timer = 0;
  let resolved = false;

  function resolve(): void {
    if (resolved) return;
    resolved = true;
    callbacks.onDone();
  }

  return {
    onEnter: () => {
      timer = 0;
      resolved = false;
      consumeAnyKey();
      consumeClick();
      consumeConfirm();
      consumePause();
      consumeNextTrack();
      // Start (or resume) gameplay music during the title screen so that
      // it's already playing when we transition to Playing.
      audio.enterGameplay();
    },
    tick: () => {
      if (resolved) return;

      // Drain all edge-triggered inputs every tick (avoids leaked events
      // like pendingConfirm from a key pressed during the title)
      const anyKey = consumeAnyKey();
      const click = consumeClick();
      const confirm = consumeConfirm();
      const pause = consumePause();
      consumeNextTrack();

      if (anyKey || click || confirm || pause) {
        resolve();
        return;
      }

      timer += 1;
      if (timer >= TITLE_DURATION_TICKS) {
        resolve();
      }
    },
    render: (ctx) => {
      const game = callbacks.getGame();
      if (game) {
        renderGame(ctx, game);
        drawLevelTitleOverlay(ctx, game);
      } else {
        ctx.fillStyle = '#2c3e50';
        ctx.fillRect(0, 0, CANVAS_WIDTH, FIELD_HEIGHT + HUD_HEIGHT);
      }
    },
  };
}
