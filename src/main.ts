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
  consumeNextTrack,
  getMousePosition,
} from './input/input';
import { isPointInRect } from './render/button';
import { Game } from './game/game';
import { ModeMachine } from './game/modeMachine';
import { render as renderGame } from './render/renderer';
import { drawPauseOverlay, PAUSE_MENU_BUTTON, PAUSE_RESTART_BUTTON } from './render/overlays';
import { createMenu } from './modes/menu';
import { createHelp } from './modes/help';
import { createIntro } from './modes/intro';
import { createGameOver } from './modes/gameover';
import { createSplash } from './modes/splash';
import { audio } from './audio/audio';
import { assets } from './assets/loader';
import { createLevelComplete } from './modes/levelcomplete';
import { createHeroDeath } from './modes/herodeath';
import { createLevelTitle } from './modes/leveltitle';

const canvas = document.getElementById('game') as HTMLCanvasElement;

function getContext(): CanvasRenderingContext2D {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context is not available');
  return ctx;
}

const ctx = getContext();
ctx.imageSmoothingEnabled = false;

initInput(canvas, CANVAS_WIDTH, CANVAS_HEIGHT);

function drawSplashLoading(): void {
  ctx.fillStyle = '#0a0a20';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.fillStyle = '#4a8ed8';
  ctx.font = 'bold 32px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Loading...', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
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

async function main(): Promise<void> {
  drawSplashLoading();

  try {
    await Promise.all([assets.loadAll(), audio.preload()]);
  } catch (err) {
    console.error('[Splash] Resource load failed:', err);
    drawSplashError('Failed to load resources. Check console.');
    return;
  }

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

  const machine = new ModeMachine();

  let game: Game | null = null;
  let startingGame = false;

  async function startGame(): Promise<void> {
    if (startingGame) return;
    startingGame = true;
    try {
      game = new Game(levelPaths, loadLevelFile);
      await game.start();
      if (game.isGameOver) {
        machine.setMode('gameover');
      } else {
        machine.setMode('leveltitle');
      }
    } finally {
      startingGame = false;
    }
  }

  let paused = false;
  let hoverPauseMenu = false;
  let hoverPauseRestart = false;

  machine.register('playing', {
    onEnter: () => {
      paused = false;
      hoverPauseMenu = false;
      hoverPauseRestart = false;
      consumePause();
      audio.enterGameplay();
    },
    onExit: () => {
      paused = false;
      hoverPauseMenu = false;
      hoverPauseRestart = false;
      audio.setPaused(false);
    },
    tick: () => {
      if (consumePause()) {
        paused = !paused;
        audio.setPaused(paused);
        return;
      }

      if (paused) {
        consumeNextTrack();
        const mouse = getMousePosition();
        hoverPauseRestart = mouse ? isPointInRect(mouse, PAUSE_RESTART_BUTTON) : false;
        hoverPauseMenu = mouse ? isPointInRect(mouse, PAUSE_MENU_BUTTON) : false;

        const click = consumeClick();

        if (click && isPointInRect(click, PAUSE_RESTART_BUTTON)) {
          audio.stopAllSfx();
          game?.restartLevel();
          paused = false;
          hoverPauseRestart = false;
          hoverPauseMenu = false;
          audio.setPaused(false);
          audio.playSfx(31); // click feedback after unpause
          return;
        }

        if (click && isPointInRect(click, PAUSE_MENU_BUTTON)) {
          audio.stopAllSfx();
          audio.playSfx(31);
          machine.setMode('menu');
        }
        return;
      }

      if (consumeNextTrack()) {
        audio.nextGameTrack();
      }

      game?.tick(getDirection());
      if (game?.isGameOver) {
        machine.setMode('gameover');
      } else if (game?.pendingLevelComplete) {
        machine.setMode('levelcomplete');
      } else if (game?.pendingHeroDeath) {
        machine.setMode('herodeath');
      }
    },
    render: (c) => {
      if (game) renderGame(c, game);
      if (paused) drawPauseOverlay(c, hoverPauseRestart, hoverPauseMenu);
    },
  });

  const introBase = createIntro({
    onDone: () => {
      machine.setMode('menu');
    },
  });
  machine.register('intro', {
    ...introBase,
    onEnter: () => {
      introBase.onEnter?.();
      consumeNextTrack();
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
    onExit: () => {
      machine.setMode('splash');
    },
  });
  machine.register('menu', {
    ...menuBase,
    onEnter: () => {
      menuBase.onEnter?.();
      consumeNextTrack();
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

  machine.register(
    'levelcomplete',
    createLevelComplete({
      getGame: () => game,
      onContinue: () => {
        void (async () => {
          if (!game) return;
          await game.advanceToNextLevel();
          if (game.isGameOver) {
            machine.setMode('gameover');
          } else {
            machine.setMode('leveltitle');
          }
        })();
      },
    }),
  );

  machine.register(
    'herodeath',
    createHeroDeath({
      getGame: () => game,
      onDone: () => {
        if (game?.isGameOver) {
          machine.setMode('gameover');
        } else {
          machine.setMode('playing');
        }
      },
    }),
  );

  machine.register(
    'leveltitle',
    createLevelTitle({
      getGame: () => game,
      onDone: () => {
        machine.setMode('playing');
      },
    }),
  );

  machine.register(
    'splash',
    createSplash({
      onStart: () => {
        consumeAnyKey();
        consumeConfirm();
        consumePause();
        consumeClick();
        consumeMute();
        consumeNextTrack();
        machine.setMode('intro');
      },
    }),
  );

  machine.setMode('splash');

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
