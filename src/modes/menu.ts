import type { ModeHooks } from '../game/modeMachine';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../config';
import { drawButton, isPointInRect, type ButtonRect } from '../render/button';
import { drawAboutOverlay, drawExitOverlay } from '../render/overlays';
import { getMousePosition, consumeClick, consumeConfirm, consumePause } from '../input/input';
import { audio } from '../audio/audio';
import { assets } from '../assets/loader';

const BUTTONS = {
  start: { x: 175, y: 510, w: 100, h: 50 },
  about: { x: 315, y: 510, w: 100, h: 50 },
  help: { x: 455, y: 510, w: 100, h: 50 },
  exit: { x: 595, y: 510, w: 100, h: 50 },
} as const satisfies Record<string, ButtonRect>;

type ButtonKey = keyof typeof BUTTONS;

export interface MenuCallbacks {
  onStart: () => void;
  onHelp: () => void;
  onExit?: () => void;
}

export function createMenu(callbacks: MenuCallbacks): ModeHooks {
  let hovered: ButtonKey | null = null;
  let modal: 'none' | 'about' | 'exit' = 'none';

  function findHoveredButton(p: { x: number; y: number }): ButtonKey | null {
    if (isPointInRect(p, BUTTONS.start)) return 'start';
    if (isPointInRect(p, BUTTONS.about)) return 'about';
    if (isPointInRect(p, BUTTONS.help)) return 'help';
    if (isPointInRect(p, BUTTONS.exit)) return 'exit';
    return null;
  }

  return {
    onEnter: () => {
      hovered = null;
      modal = 'none';
      consumeClick();
      consumeConfirm();
      consumePause();
    },
    tick: () => {
      const mouse = getMousePosition();
      hovered = mouse ? findHoveredButton(mouse) : null;

      const click = consumeClick();
      const confirm = consumeConfirm();
      const pause = consumePause();

      if (modal !== 'none') {
        if (click || confirm || pause) {
          const wasExit = modal === 'exit';
          modal = 'none';
          if (wasExit) {
            callbacks.onExit?.();
          } else {
            audio.playSfx(31);
          }
        }
        return;
      }

      if (confirm) {
        audio.playSfx(31);
        callbacks.onStart();
        return;
      }

      if (click) {
        const btn = findHoveredButton(click);
        if (btn) {
          audio.playSfx(31);
          if (btn === 'start') callbacks.onStart();
          else if (btn === 'about') modal = 'about';
          else if (btn === 'help') callbacks.onHelp();
          else if (btn === 'exit') {
            audio.stopMusic();
            audio.playSfxForDuration(29, 7930);
            modal = 'exit';
          }
        }
      }
    },
    render: (ctx) => {
      // Background
      const bg = assets.get('back_menu');
      if (bg) {
        ctx.drawImage(bg, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      } else {
        drawMenuBackground(ctx);
      }

      // Buttons with real sprites (normal + hover)
      drawImageButton(ctx, BUTTONS.start, 'Lets_go', 'Lets_go_2', hovered === 'start');
      drawImageButton(ctx, BUTTONS.about, 'about', 'about_2', hovered === 'about');
      drawImageButton(ctx, BUTTONS.help, 'help', 'help_2', hovered === 'help');
      drawImageButton(ctx, BUTTONS.exit, 'exit', 'exit_2', hovered === 'exit');

      if (modal === 'about') drawAboutOverlay(ctx);
      else if (modal === 'exit') drawExitOverlay(ctx);
    },
  };
}

// Helper to draw sprite button with fallback
function drawImageButton(
  ctx: CanvasRenderingContext2D,
  rect: ButtonRect,
  normalKey: string,
  hoverKey: string,
  hover: boolean,
) {
  const key = hover ? hoverKey : normalKey;
  const img = assets.get(key);
  if (img) {
    ctx.drawImage(img, rect.x, rect.y, rect.w, rect.h);
  } else {
    drawButton(ctx, rect, normalKey, hover);
  }
}

function drawMenuBackground(ctx: CanvasRenderingContext2D): void {
  const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
  grad.addColorStop(0, '#0a1830');
  grad.addColorStop(0.6, '#1e3a5f');
  grad.addColorStop(1, '#8ba9c4');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
}
