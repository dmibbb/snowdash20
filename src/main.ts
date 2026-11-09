import './style.css';
import { TICK_MS } from './config';
import { initInput, getDirection } from './input/input';
import { render } from './render/renderer';
import { Game } from './game/game';

const canvas = document.getElementById('game') as HTMLCanvasElement;

function getContext(): CanvasRenderingContext2D {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context is not available');
  return ctx;
}

const ctx = getContext();
ctx.imageSmoothingEnabled = false;

initInput();

async function loadLevelFile(path: string): Promise<string> {
  const res = await fetch(path);
  if (!res.ok) {
    throw new Error(`Failed to load ${path}: HTTP ${res.status}`);
  }
  const text = await res.text();
  if (text.trimStart().startsWith('<!DOCTYPE') || text.trimStart().startsWith('<html')) {
    throw new Error(
      `File ${path} not found (Vite returned index.html). ` +
        `Make sure it exists at public${path} and restart the dev server.`,
    );
  }
  return text;
}

async function main(): Promise<void> {
  const listText = await loadLevelFile('/levels/level_list.txt');
  const levelPaths = listText
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((p) => `/${p}`);

  const game = new Game(levelPaths, loadLevelFile);
  await game.start();

  let lastTime = performance.now();
  let accumulator = 0;

  function tick(): void {
    game.tick(getDirection());
  }

  function loop(now: number): void {
    const dt = Math.min(now - lastTime, 250);
    lastTime = now;
    accumulator += dt;

    while (accumulator >= TICK_MS) {
      tick();
      accumulator -= TICK_MS;
    }

    render(ctx, game);
    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
}

main().catch((e) => {
  console.error('Failed to start:', e);
});
