import type { ModeHooks } from '../game/modeMachine';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../config';
import { consumeAnyKey, consumeClick } from '../input/input';

interface IntroElement {
  label: string;
  fontSize: number;
  color: string;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  speed: number;
}

// Start positions match the original Snow Dash.cpp; speeds are ×2 to keep
// total animation ~7.7s instead of ~15.4s (user didn't want to wait 15s).
const ELEMENTS_DEF: IntroElement[] = [
  {
    label: 'R',
    fontSize: 110,
    color: '#e74c3c',
    startX: -480,
    startY: 40,
    targetX: 200,
    targetY: 40,
    speed: 10,
  },
  {
    label: 'G',
    fontSize: 110,
    color: '#2ecc71',
    startX: 323,
    startY: -380,
    targetX: 323,
    targetY: 40,
    speed: 6,
  },
  {
    label: 'B',
    fontSize: 110,
    color: '#3498db',
    startX: 1100,
    startY: 40,
    targetX: 480,
    targetY: 40,
    speed: 10,
  },
  {
    label: 'Team',
    fontSize: 72,
    color: '#ecf0f1',
    startX: 275,
    startY: 1000,
    targetX: 275,
    targetY: 450,
    speed: 6,
  },
  {
    label: 'Presents',
    fontSize: 40,
    color: '#f39c12',
    startX: 2300,
    startY: 300,
    targetX: 150,
    targetY: 300,
    speed: 14,
  },
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
  const SETTLE_DELAY_TICKS = 10; // 500ms

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
      // Placeholder background — will be replaced with PNG in phase 10
      const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
      grad.addColorStop(0, '#0a0a20');
      grad.addColorStop(1, '#000010');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      for (const el of elements) {
        ctx.font = `bold ${el.fontSize}px monospace`;
        ctx.fillStyle = el.color;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(el.label, el.x, el.y);
      }

      // Skip hint
      ctx.fillStyle = 'rgba(236, 240, 241, 0.45)';
      ctx.font = '14px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText('Press any key to skip', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 12);
    },
  };
}
