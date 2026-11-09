import type { Direction } from '../types';

const gameKeys = new Set([
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'KeyW',
  'KeyS',
  'KeyA',
  'KeyD',
]);

const pressed = new Set<string>();

// Edge-triggered actions — set on keydown, consumed by the current mode
let pendingConfirm = false;
let pendingPause = false;
let pendingMute = false;
let pendingClick: { x: number; y: number } | null = null;
let mousePos: { x: number; y: number } | null = null;

let canvasEl: HTMLCanvasElement | null = null;
let logicalW = 800;
let logicalH = 600;

export function initInput(canvas: HTMLCanvasElement, w = 800, h = 600): void {
  canvasEl = canvas;
  logicalW = w;
  logicalH = h;

  window.addEventListener('keydown', (e) => {
    if (e.repeat) return;

    if (gameKeys.has(e.code)) {
      e.preventDefault();
      pressed.add(e.code);
      return;
    }

    if (e.code === 'Enter' || e.code === 'Space') {
      e.preventDefault();
      pendingConfirm = true;
    } else if (e.code === 'Escape' || e.code === 'KeyP') {
      e.preventDefault();
      pendingPause = true;
    } else if (e.code === 'KeyM') {
      pendingMute = true;
    }
  });

  window.addEventListener('keyup', (e) => {
    if (gameKeys.has(e.code)) {
      e.preventDefault();
      pressed.delete(e.code);
    }
  });

  window.addEventListener('blur', () => {
    pressed.clear();
  });

  canvas.addEventListener('mousedown', (e) => {
    if (!canvasEl) return;
    const rect = canvasEl.getBoundingClientRect();
    const scaleX = logicalW / rect.width;
    const scaleY = logicalH / rect.height;
    pendingClick = {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  });

  canvas.addEventListener('mousemove', (e) => {
    if (!canvasEl) return;
    const rect = canvasEl.getBoundingClientRect();
    const scaleX = logicalW / rect.width;
    const scaleY = logicalH / rect.height;
    mousePos = {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  });

  canvas.addEventListener('mouseleave', () => {
    mousePos = null;
  });
}

export function getDirection(): Direction | null {
  if (pressed.has('ArrowUp') || pressed.has('KeyW')) return 'up';
  if (pressed.has('ArrowDown') || pressed.has('KeyS')) return 'down';
  if (pressed.has('ArrowLeft') || pressed.has('KeyA')) return 'left';
  if (pressed.has('ArrowRight') || pressed.has('KeyD')) return 'right';
  return null;
}

export function consumeConfirm(): boolean {
  const v = pendingConfirm;
  pendingConfirm = false;
  return v;
}

export function consumePause(): boolean {
  const v = pendingPause;
  pendingPause = false;
  return v;
}

export function consumeMute(): boolean {
  const v = pendingMute;
  pendingMute = false;
  return v;
}

export function consumeClick(): { x: number; y: number } | null {
  const v = pendingClick;
  pendingClick = null;
  return v;
}

export function getMousePosition(): { x: number; y: number } | null {
  return mousePos;
}
