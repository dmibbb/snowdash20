import './style.css';
import { TICK_MS, CANVAS_WIDTH, CANVAS_HEIGHT } from './config';
import { initInput, getDirection, consumeConfirm, consumePause } from './input/input';
import { Game } from './game/game';
import { ModeMachine } from './game/modeMachine';
import { render as renderGame } from './render/renderer';
import { drawPauseOverlay } from './render/overlays';
import { createMenu } from './modes/menu';
import { createHelp } from './modes/help';

const canvas = document.getElementById('game') as HTMLCanvasElement;

function getContext(): CanvasRenderingContext2D {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context is not available');
  return ctx;
}

const ctx = getContext();
ctx.imageSmoothingEnabled = false;

initInput(canvas, CANVAS_WIDTH, CANVAS_HEIGHT);

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

  const machine = new ModeMachine();

  let game: Game | null = null;
  let startingGame = false;

  async function startGame(): Promise<void> {
    if (startingGame) return;
    startingGame = true;
    try {
      game = new Game(levelPaths, loadLevelFile);
      await game.start();
      machine.setMode('playing');
    } finally {
      startingGame = false;
    }
  }

  let paused = false;

  machine.register('playing', {
    onEnter: () => {
      paused = false;
      consumePause();
    },
    onExit: () => {
      paused = false;
    },
    tick: () => {
      if (consumePause()) {
        paused = !paused;
        return;
      }
      if (paused) return;
      game?.tick(getDirection());
    },
    render: (c) => {
      if (game) renderGame(c, game);
      if (paused) drawPauseOverlay(c);
    },
  });

  // Intro — placeholder; press Enter to go to Menu (8.6 will replace with animation)
  machine.register('intro', {
    tick: () => {
      if (consumeConfirm()) {
        machine.setMode('menu');
      }
    },
    render: (c) => {
      c.fillStyle = '#000';
      c.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      c.fillStyle = '#ecf0f1';
      c.font = 'bold 24px monospace';
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillText('SNOWDASH — PRESS ENTER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    },
  });

  machine.register(
    'menu',
    createMenu({
      onStart: () => {
        void startGame();
      },
      onHelp: () => {
        machine.setMode('help');
      },
    }),
  );

  machine.register(
    'help',
    createHelp({
      onBack: () => {
        machine.setMode('menu');
      },
    }),
  );

  machine.register('gameover', {});

  machine.setMode('intro');

  let lastTime = performance.now();
  let accumulator = 0;

  function loop(now: number): void {
    const dt = Math.min(now - lastTime, 250);
    lastTime = now;
    accumulator += dt;

    while (accumulator >= TICK_MS) {
      machine.tick();
      accumulator -= TICK_MS;
    }

    machine.render(ctx);
    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
}

main().catch((e) => {
  console.error('Failed to start:', e);
});
