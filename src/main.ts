import './style.css';
import { TICK_MS, CANVAS_WIDTH, CANVAS_HEIGHT } from './config';
import {
  initInput,
  getDirection,
  consumePause,
  consumeMute,
  consumeAnyKey,
  consumeConfirm,
  consumeClick,
  getMousePosition,
} from './input/input';
import { isPointInRect } from './render/button';
import { Game } from './game/game';
import { ModeMachine } from './game/modeMachine';
import { render as renderGame } from './render/renderer';
import { drawPauseOverlay, PAUSE_MENU_BUTTON } from './render/overlays';
import { createMenu } from './modes/menu';
import { createHelp } from './modes/help';
import { createIntro } from './modes/intro';
import { createGameOver } from './modes/gameover';
import { audio } from './audio/audio';
import { assets } from './assets/loader';

const canvas = document.getElementById('game') as HTMLCanvasElement;

function getContext(): CanvasRenderingContext2D {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context is not available');
  return ctx;
}

const ctx = getContext();
ctx.imageSmoothingEnabled = false;

initInput(canvas, CANVAS_WIDTH, CANVAS_HEIGHT);

// === Splash helpers ===

function drawSplashLoading(): void {
  ctx.fillStyle = '#0a0a20';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.fillStyle = '#4a8ed8';
  ctx.font = 'bold 32px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Loading...', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
}

function drawSplashReady(): void {
  // Intro background is available now (assets are loaded)
  const bg = assets.get('intro');
  if (bg) {
    ctx.drawImage(bg, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  } else {
    ctx.fillStyle = '#0a0a20';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  }

  // Dim panel behind text so it's readable on any background
  ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
  ctx.fillRect(0, CANVAS_HEIGHT / 2 - 40, CANVAS_WIDTH, 80);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 28px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Press any key to start', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
}

function drawSplashError(message: string): void {
  ctx.fillStyle = '#1a0000';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.fillStyle = '#e74c3c';
  ctx.font = 'bold 20px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(message, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
}

// Wait for a user gesture (key/mouse/touch). On gesture, attempt audio unlock
// while still inside the gesture context — otherwise browsers reject play().
function waitForUserStart(): Promise<void> {
  return new Promise((resolve) => {
    const handler = (): void => {
      window.removeEventListener('keydown', handler);
      canvas.removeEventListener('mousedown', handler);
      canvas.removeEventListener('touchstart', handler);

      void audio.unlock().then((ok) => {
        if (!ok) console.warn('[Splash] Audio unlock failed — music may not play');
        resolve();
      });
    };

    window.addEventListener('keydown', handler);
    canvas.addEventListener('mousedown', handler);
    canvas.addEventListener('touchstart', handler);
  });
}

// === Level loader ===

async function loadLevelFile(path: string): Promise<string> {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to load ${path}: HTTP ${res.status}`);
  const text = await res.text();
  if (text.trimStart().startsWith('<!DOCTYPE') || text.trimStart().startsWith('<html')) {
    throw new Error(
      `File ${path} not found (Vite returned index.html). ` +
        `Make sure it exists at public${path} and restart the dev server.`,
    );
  }
  return text;
}

// === Main ===

async function main(): Promise<void> {
  // 1. Loading splash
  drawSplashLoading();

  // 2. Load assets + audio (await — DoD: "Загружаем все ассеты на этом экране")
  try {
    await Promise.all([assets.loadAll(), audio.preload()]);
  } catch (err) {
    console.error('[Splash] Resource load failed:', err);
    drawSplashError('Failed to load resources. Check console.');
    return;
  }

  // 3. Load level list
  let levelPaths: string[];
  try {
    const listText = await loadLevelFile('/levels/level_list.txt');
    levelPaths = listText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .map((p) => `/${p}`);
  } catch (err) {
    console.error('[Splash] Level list load failed:', err);
    drawSplashError('Failed to load levels. Check console.');
    return;
  }

  // 4. Ready splash — "Press any key"
  drawSplashReady();

  // 5. Wait for input + unlock audio
  await waitForUserStart();

  // 6. Clear stale edge-triggered events from the splash press
  consumeAnyKey();
  consumeConfirm();
  consumePause();
  consumeClick();
  consumeMute();

  // 7. Register all modes
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
  let hoverPauseMenu = false;

  machine.register('playing', {
    onEnter: () => {
      paused = false;
      hoverPauseMenu = false;
      consumePause();
      audio.playMusic(2);
    },
    onExit: () => {
      paused = false;
      audio.setPaused(false);
      audio.stopMusic();
    },
    tick: () => {
      if (consumePause()) {
        paused = !paused;
        audio.setPaused(paused);
        return;
      }

      if (paused) {
        const mouse = getMousePosition();
        hoverPauseMenu = mouse ? isPointInRect(mouse, PAUSE_MENU_BUTTON) : false;

        const click = consumeClick();
        if (click && isPointInRect(click, PAUSE_MENU_BUTTON)) {
          audio.stopAllSfx();
          audio.playSfx(31);
          machine.setMode('menu');
        }
        return;
      }

      game?.tick(getDirection());
      if (game?.isGameOver) {
        machine.setMode('gameover');
      }
    },
    render: (c) => {
      if (game) renderGame(c, game);
      if (paused) drawPauseOverlay(c, hoverPauseMenu);
    },
  });

  // Intro — play music 01 on enter (splash gate guarantees unlock succeeded)
  const introBase = createIntro({
    onDone: () => {
      machine.setMode('menu');
    },
  });
  machine.register('intro', {
    ...introBase,
    onEnter: () => {
      introBase.onEnter?.();
      audio.playMusic(1);
    },
  });

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

  machine.register(
    'gameover',
    createGameOver({
      getGame: () => game,
      onBack: () => {
        machine.setMode('menu');
      },
    }),
  );

  // 8. Start
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
