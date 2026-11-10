import './style.css';
import { TICK_MS, CANVAS_WIDTH, CANVAS_HEIGHT } from './config';
import { initInput, getDirection, consumePause, consumeMute } from './input/input';
import { Game } from './game/game';
import { ModeMachine } from './game/modeMachine';
import { render as renderGame } from './render/renderer';
import { drawPauseOverlay } from './render/overlays';
import { createMenu } from './modes/menu';
import { createHelp } from './modes/help';
import { createIntro } from './modes/intro';
import { createGameOver } from './modes/gameover';
import { audio } from './audio/audio';

const canvas = document.getElementById('game') as HTMLCanvasElement;

function getContext(): CanvasRenderingContext2D {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context is not available');
  return ctx;
}

const ctx = getContext();
ctx.imageSmoothingEnabled = false;

initInput(canvas, CANVAS_WIDTH, CANVAS_HEIGHT);

// Unlock autoplay on first user gesture (keydown, mouse, touch)
const unlockAudio = (): void => {
  void audio.unlock();
  window.removeEventListener('keydown', unlockAudio);
  canvas.removeEventListener('mousedown', unlockAudio);
  canvas.removeEventListener('touchstart', unlockAudio);
};

window.addEventListener('keydown', unlockAudio);
canvas.addEventListener('mousedown', unlockAudio);
canvas.addEventListener('touchstart', unlockAudio);

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
  // Fire-and-forget audio preload — files load while Intro runs.
  // Intentionally NOT awaited: no progress bar yet, and autoplay is
  // blocked until user interacts anyway.
  void audio.preload();

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
      audio.playMusic(2);
    },
    onExit: () => {
      paused = false;
      audio.stopMusic();
    },
    tick: () => {
      if (consumePause()) {
        paused = !paused;
        audio.setPaused(paused);
        return;
      }
      if (paused) return;
      game?.tick(getDirection());
      if (game?.isGameOver) {
        machine.setMode('gameover');
      }
    },
    render: (c) => {
      if (game) renderGame(c, game);
      if (paused) drawPauseOverlay(c);
    },
  });

  machine.register(
    'intro',
    createIntro({
      onDone: () => {
        machine.setMode('menu');
      },
    }),
  );

  const menuBase = createMenu({
    onStart: () => {
      void startGame();
    },
    onHelp: () => {
      machine.setMode('help');
    },
  });
  machine.register('menu', {
    ...menuBase,
    onEnter: () => {
      menuBase.onEnter?.();
      audio.playMusic(1);
    },
  });

  machine.register(
    'help',
    createHelp({
      onBack: () => {
        machine.setMode('menu');
      },
    }),
  );

  const gameoverBase = createGameOver({
    getGame: () => game,
    onBack: () => {
      machine.setMode('menu');
    },
  });
  machine.register('gameover', {
    ...gameoverBase,
    onEnter: () => {
      gameoverBase.onEnter?.();
      audio.playMusic(1);
    },
  });

  machine.setMode('intro');

  let lastTime = performance.now();
  let accumulator = 0;

  function loop(now: number): void {
    const dt = Math.min(now - lastTime, 250);
    lastTime = now;
    accumulator += dt;

    while (accumulator >= TICK_MS) {
      if (consumeMute()) {
        audio.toggleMute();
      }
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
