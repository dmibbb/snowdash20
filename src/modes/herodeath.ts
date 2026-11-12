import type { ModeHooks } from '../game/modeMachine';
import type { Game } from '../game/game';
import { CANVAS_WIDTH, GRID_ROWS, TILE_SIZE, HUD_HEIGHT } from '../config';
import { render as renderGame } from '../render/renderer';
import { assets } from '../assets/loader';
import {
  consumeAnyKey,
  consumeClick,
  consumeConfirm,
  consumePause,
  consumeNextTrack,
} from '../input/input';
import { audio } from '../audio/audio';

const FIELD_HEIGHT = GRID_ROWS * TILE_SIZE;

// Auto-dismiss after ~10-12 s. Player can skip with any input.
const RIP_AUTO_DISMISS_TICKS = 670;

export interface HeroDeathCallbacks {
  getGame: () => Game | null;
  onDone: () => void;
}

export function createHeroDeath(callbacks: HeroDeathCallbacks): ModeHooks {
  let timer = 0;
  let resolved = false;

  function resolve(): void {
    if (resolved) return;
    resolved = true;
    audio.stopAllSfx();
    const game = callbacks.getGame();
    game?.resolveHeroDeath();
    if (!game?.isGameOver) {
      audio.resumeMusic();
    }
    callbacks.onDone();
  }

  return {
    onEnter: () => {
      timer = 0;
      resolved = false;
      consumeClick();
      consumeConfirm();
      consumePause();
      consumeAnyKey();
      consumeNextTrack();
      audio.pauseMusic(); // Gameplay music is muted during RIP — death SFX plays alone.
    },
    tick: () => {
      if (resolved) return;

      // Skip on any key press / click
      if (consumeAnyKey() || consumeClick() || consumeConfirm() || consumePause()) {
        resolve();
        return;
      }

      timer += 1;
      if (timer >= RIP_AUTO_DISMISS_TICKS) {
        resolve();
      }
    },
    render: (ctx) => {
      const game = callbacks.getGame();
      if (game) renderGame(ctx, game);

      // Dim field so RIP stands out from the frozen scene
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, FIELD_HEIGHT);

      const rip = assets.get('hero_die');
      const cx = CANVAS_WIDTH / 2;

      if (rip) {
        const w = rip.width;
        const h = rip.height;
        const x = cx - w / 2;
        const y = (FIELD_HEIGHT - h) / 2;
        ctx.drawImage(rip, x, y, w, h);
      } else {
        // Fallback
        ctx.fillStyle = '#e74c3c';
        ctx.font = 'bold 48px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('R.I.P.', cx, FIELD_HEIGHT / 2);
      }

      // Hint below the picture — same style as splash/intro
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = 'bold 16px monospace';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('Press any key to continue', cx, FIELD_HEIGHT - 30);

      // Keep HUD visible on top (lives count already decremented)
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.fillRect(0, FIELD_HEIGHT, CANVAS_WIDTH, HUD_HEIGHT);
    },
  };
}
