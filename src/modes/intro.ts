import type { ModeHooks } from '../game/modeMachine';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../config';
import { consumeAnyKey, consumeClick } from '../input/input';
import { assets } from '../assets/loader';

interface IntroElement {
  key: string;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  speed: number;
}

const ELEMENTS_DEF: IntroElement[] = [
  { key: 'R', startX: -480, startY: 65, targetX: 200, targetY: 65, speed: 5 },
  { key: 'G', startX: 323, startY: -400, targetX: 323, targetY: 65, speed: 3 },
  { key: 'B', startX: 1100, startY: 65, targetX: 480, targetY: 65, speed: 5 },
  { key: 'team', startX: 275, startY: 980, targetX: 275, targetY: 430, speed: 3 },
  { key: 'prezents', startX: 2300, startY: 280, targetX: 150, targetY: 280, speed: 7 },
];

interface RuntimeElement extends IntroElement {
  x: number;
  y: number;
  settled: boolean;
}

export interface IntroCallbacks {
  onDone: () => void;
}

export function createIntro(callbacks: IntroCallbacks): ModeHooks {
  const elements: RuntimeElement[] = ELEMENTS_DEF.map((def) => ({
    ...def,
    x: def.startX,
    y: def.startY,
    settled: false,
  }));
  let settledTicks = 0;
  const SETTLE_DELAY_TICKS = 10; // 500ms pause after all elements land

  function reset(): void {
    for (let i = 0; i < elements.length; i++) {
      const el = elements[i];
      const def = ELEMENTS_DEF[i];
      el.x = def.startX;
      el.y = def.startY;
      el.settled = false;
    }
    settledTicks = 0;
  }

  return {
    onEnter: () => {
      reset();
      consumeAnyKey();
      consumeClick();
    },
    tick: () => {
      if (consumeAnyKey() || consumeClick()) {
        callbacks.onDone();
        return;
      }

      let allSettled = true;
      for (const el of elements) {
        if (el.settled) continue;
        allSettled = false;

        const dx = Math.sign(el.targetX - el.x);
        const dy = Math.sign(el.targetY - el.y);

        if (dx !== 0) el.x += dx * el.speed;
        if (dy !== 0) el.y += dy * el.speed;

        if (dx > 0 && el.x >= el.targetX) el.x = el.targetX;
        if (dx < 0 && el.x <= el.targetX) el.x = el.targetX;
        if (dy > 0 && el.y >= el.targetY) el.y = el.targetY;
        if (dy < 0 && el.y <= el.targetY) el.y = el.targetY;

        if (el.x === el.targetX && el.y === el.targetY) {
          el.settled = true;
        }
      }

      if (allSettled) {
        settledTicks += 1;
        if (settledTicks >= SETTLE_DELAY_TICKS) {
          callbacks.onDone();
        }
      }
    },
    render: (ctx) => {
      // Background
      const bg = assets.get('intro');
      if (bg) {
        ctx.drawImage(bg, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      } else {
        const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
        grad.addColorStop(0, '#0a0a20');
        grad.addColorStop(1, '#000010');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      }

      // Elements (R, G, B, Team, Presents)
      for (const el of elements) {
        const img = assets.get(el.key);
        if (img) {
          ctx.drawImage(img, el.x, el.y);
        }
      }

      // Skip hint
      ctx.fillStyle = '#0000FF';
      ctx.font = 'bold 16px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText('Press any key to skip', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 12);
    },
  };
}
