import './style.css';
import { CANVAS_WIDTH, CANVAS_HEIGHT, TICK_MS } from './config';

const canvas = document.getElementById('game') as HTMLCanvasElement;

function getContext(): CanvasRenderingContext2D {
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D context is not available');
  }
  return ctx;
}

const ctx = getContext();
ctx.imageSmoothingEnabled = false;

let lastTime = performance.now();
let accumulator = 0;

function tick(): void {
  // Phase 1: пусто. Логика появится в следующих фазах.
}

function render(): void {
  ctx.fillStyle = '#2c3e50';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
}

function loop(now: number): void {
  const dt = Math.min(now - lastTime, 250);
  lastTime = now;
  accumulator += dt;

  while (accumulator >= TICK_MS) {
    tick();
    accumulator -= TICK_MS;
  }

  render();
  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
