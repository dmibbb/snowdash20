import type { ModeHooks } from '../game/modeMachine';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../config';
import { audio } from '../audio/audio';
import { assets } from '../assets/loader';
import { drawGlowingText } from '../render/overlays';

export interface SplashCallbacks {
  canvas: HTMLCanvasElement;
  onStart: () => void;
}

export function createSplash(callbacks: SplashCallbacks): ModeHooks {
  let resolved = false;
  let unlocking = false;

  function cleanup(): void {
    window.removeEventListener('keydown', handleGesture);
    window.removeEventListener('mousedown', handleGesture);
    window.removeEventListener('touchstart', handleGesture);
  }

  function handleGesture(): void {
    if (resolved || unlocking) return;
    unlocking = true;

    // unlock() must be invoked synchronously inside the gesture handler —
    // otherwise browsers reject play() as "not in user gesture".
    void audio.unlock().then((ok) => {
      unlocking = false;
      if (ok && !resolved) {
        resolved = true;
        cleanup();
        callbacks.onStart();
      }
      // If unlock failed — stay on splash. Next gesture retries.
    });
  }

  return {
    onEnter: () => {
      resolved = false;
      unlocking = false;

      audio.stopMusic();
      audio.stopAllSfx();
      audio.setPaused(false);

      window.addEventListener('keydown', handleGesture);
      callbacks.canvas.addEventListener('mousedown', handleGesture);
      callbacks.canvas.addEventListener('touchstart', handleGesture);
    },
    onExit: () => {
      cleanup();
    },
    render: (ctx) => {
      const bg = assets.get('intro');
      if (bg) {
        ctx.drawImage(bg, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      } else {
        ctx.fillStyle = '#0a0a20';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      }

      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, CANVAS_HEIGHT / 2 - 45, CANVAS_WIDTH, 90);

      drawGlowingText(ctx, 'Press any key to start', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, 32);
    },
  };
}
