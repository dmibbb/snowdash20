import type { ModeHooks } from '../game/modeMachine';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../config';
import { drawButton, isPointInRect, type ButtonRect } from '../render/button';
import { getMousePosition, consumeClick, consumeConfirm, consumePause } from '../input/input';

const HELP_TEXT = [
  'Santa Claus has lost all his presents for children!',
  'You must collect all gifts with the help of snowball Mr. Snejok.',
  "All presents scattered on all vicinity around the Mr. Snejok's house.",
  'Your hero is able to break courses through snow to himself, forming after him an ice surface.',
  'Mr. Snejok can push ahead of himself huge snow boulders that help him on his way but only one!',
  'Be careful! There are spiteful monsters have penetrated on your territory.',
  'They will kill you on your meeting!',
  'Then your hero will lose all gifts and he should collect them again.',
  'There are huge boulders that can kill Mr. Snejok if they fall down.',
  'However you can kill dangerous monsters by pushing down huge boulders on them.',
].join(' ');

const BACK_BUTTON: ButtonRect = { x: 20, y: 540, w: 150, h: 42 };

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
        callbacks.onBack();
        return;
      }

      const click = consumeClick();
      if (click && isPointInRect(click, BACK_BUTTON)) {
        callbacks.onBack();
      }
    },
    render: (ctx) => {
      drawBackground(ctx);
      drawTitle(ctx);
      drawWrappedText(ctx, HELP_TEXT, 40, 130, CANVAS_WIDTH - 80, 22);
      drawButton(ctx, BACK_BUTTON, 'Main Menu', hovered, 16);
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
