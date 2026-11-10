import type { ModeHooks } from '../game/modeMachine';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../config';
import { drawButton, isPointInRect, type ButtonRect } from '../render/button';
import { getMousePosition, consumeClick, consumeConfirm, consumePause } from '../input/input';
import { audio } from '../audio/audio';
import { assets } from '../assets/loader';

const BACK_BUTTON: ButtonRect = { x: 0, y: 510, w: 100, h: 50 };

export interface HelpCallbacks {
  onBack: () => void;
}

export function createHelp(callbacks: HelpCallbacks): ModeHooks {
  let hovered = false;

  return {
    onEnter: () => {
      hovered = false;
      consumeClick();
      consumeConfirm();
      consumePause();
    },
    tick: () => {
      const mouse = getMousePosition();
      hovered = mouse ? isPointInRect(mouse, BACK_BUTTON) : false;

      if (consumeConfirm() || consumePause()) {
        audio.playSfx(31);
        callbacks.onBack();
        return;
      }

      const click = consumeClick();
      if (click && isPointInRect(click, BACK_BUTTON)) {
        audio.playSfx(31);
        callbacks.onBack();
      }
    },
    render: (ctx) => {
      const bg = assets.get('Help_back');
      if (bg) {
        ctx.drawImage(bg, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      } else {
        drawBackground(ctx);
        drawTitle(ctx);
        drawWrappedText(ctx, 'Help text placeholder...', 40, 130, CANVAS_WIDTH - 80, 22);
      }

      const btnImg = assets.get(hovered ? 'main_menu_2' : 'main_menu');
      if (btnImg) {
        ctx.drawImage(btnImg, BACK_BUTTON.x, BACK_BUTTON.y, BACK_BUTTON.w, BACK_BUTTON.h);
      } else {
        drawButton(ctx, BACK_BUTTON, 'Main Menu', hovered, 16);
      }
    },
  };
}

function drawBackground(ctx: CanvasRenderingContext2D): void {
  const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
  grad.addColorStop(0, '#1a1a1a');
  grad.addColorStop(1, '#0a0a0a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
}

function drawTitle(ctx: CanvasRenderingContext2D): void {
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.fillStyle = 'rgba(0, 100, 200, 0.4)';
  ctx.font = 'bold 60px monospace';
  ctx.fillText('Help!', CANVAS_WIDTH / 2 + 3, 73);

  ctx.fillStyle = '#4a8ed8';
  ctx.fillText('Help!', CANVAS_WIDTH / 2, 70);
}

function drawWrappedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
): void {
  ctx.font = '16px monospace';
  ctx.fillStyle = '#ecf0f1';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';

  const words = text.split(/\s+/);
  let line = '';
  let curY = y;

  for (const word of words) {
    const test = line ? line + ' ' + word : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, curY);
      line = word;
      curY += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) {
    ctx.fillText(line, x, curY);
  }
}
