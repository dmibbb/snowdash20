import './style.css';
import { TICK_MS, GRID_COLS, GRID_ROWS } from './config';
import { Player } from './entities/player';
import { initInput, getDirection } from './input/input';
import { render } from './render/renderer';

const canvas = document.getElementById('game') as HTMLCanvasElement;

function getContext(): CanvasRenderingContext2D {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context is not available');
  return ctx;
}

const ctx = getContext();
ctx.imageSmoothingEnabled = false;

initInput();

const player = new Player(Math.floor(GRID_COLS / 2), Math.floor(GRID_ROWS / 2));

let lastTime = performance.now();
let accumulator = 0;

function tick(): void {
  const dir = getDirection();
  player.update(dir);
}

function loop(now: number): void {
  const dt = Math.min(now - lastTime, 250);
  lastTime = now;
  accumulator += dt;

  while (accumulator >= TICK_MS) {
    tick();
    accumulator -= TICK_MS;
  }

  render(ctx, player);
  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
