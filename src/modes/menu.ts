import type { ModeHooks } from '../game/modeMachine';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../config';
import { drawButton, isPointInRect, type ButtonRect } from '../render/button';
import { drawAboutOverlay, drawExitOverlay } from '../render/overlays';
import { getMousePosition, consumeClick, consumeConfirm, consumePause } from '../input/input';
import { audio } from '../audio/audio';

const BUTTONS = {
  start: { x: 60, y: 505, w: 140, h: 65 },
  about: { x: 240, y: 505, w: 140, h: 65 },
  help: { x: 420, y: 505, w: 140, h: 65 },
  exit: { x: 600, y: 505, w: 140, h: 65 },
} as const satisfies Record<string, ButtonRect>;

type ButtonKey = keyof typeof BUTTONS;

export interface MenuCallbacks {
  onStart: () => void;
  onHelp: () => void;
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
      // Drop stale edge-triggered events from a previous mode
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
          audio.playSfx(31); // Menu click
          modal = 'none';
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
            audio.playSfx(29); // Hero Die 4 — farewell on Exit
            modal = 'exit';
          }
        }
      }
    },
    render: (ctx) => {
      drawMenuBackground(ctx);
      drawTitle(ctx);
      drawButtons(ctx, hovered);
      drawTeamLogo(ctx);

      if (modal === 'about') drawAboutOverlay(ctx);
      else if (modal === 'exit') drawExitOverlay(ctx);
    },
  };
}

function drawMenuBackground(ctx: CanvasRenderingContext2D): void {
  const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
  grad.addColorStop(0, '#0a1830');
  grad.addColorStop(0.6, '#1e3a5f');
  grad.addColorStop(1, '#8ba9c4');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
}

function drawTitle(ctx: CanvasRenderingContext2D): void {
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const cx = CANVAS_WIDTH / 2;

  ctx.fillStyle = 'rgba(0, 100, 200, 0.5)';
  ctx.font = 'bold 96px monospace';
  ctx.fillText('SnowDash', cx + 4, 124);

  ctx.fillStyle = '#4a8ed8';
  ctx.fillText('SnowDash', cx, 120);
}

function drawButtons(ctx: CanvasRenderingContext2D, hovered: ButtonKey | null): void {
  drawButton(ctx, BUTTONS.start, "Let's Go!", hovered === 'start');
  drawButton(ctx, BUTTONS.about, 'About', hovered === 'about');
  drawButton(ctx, BUTTONS.help, 'Help!', hovered === 'help');
  drawButton(ctx, BUTTONS.exit, 'Exit', hovered === 'exit');
}

function drawTeamLogo(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#ecf0f1';
  ctx.font = 'bold 20px monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('RGB Team', 20, CANVAS_HEIGHT - 22);
}
