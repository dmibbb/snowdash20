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
let pendingNextTrack = false;
let pendingRestart = false;
let pendingAnyKey = false;
let pendingClick: { x: number; y: number } | null = null;
let mousePos: { x: number; y: number } | null = null;

let canvasEl: HTMLCanvasElement | null = null;
let logicalW = 800;
let logicalH = 560;
let touchDirection: Direction | null = null;

export function initInput(canvas: HTMLCanvasElement, w = logicalW, h = logicalH): void {
  canvasEl = canvas;
  logicalW = w;
  logicalH = h;

  window.addEventListener('keydown', (e) => {
    if (e.repeat) return;
    pendingAnyKey = true;

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
    } else if (e.code === 'KeyN') {
      pendingNextTrack = true;
    } else if (e.code === 'KeyR') {
      pendingRestart = true;
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

  canvas.addEventListener('pointerdown', (e) => {
    if (!canvasEl) return;
    const rect = canvasEl.getBoundingClientRect();
    const scaleX = logicalW / rect.width;
    const scaleY = logicalH / rect.height;
    pendingClick = {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  });

  canvas.addEventListener('pointermove', (e) => {
    if (!canvasEl) return;
    const rect = canvasEl.getBoundingClientRect();
    const scaleX = logicalW / rect.width;
    const scaleY = logicalH / rect.height;
    mousePos = {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  });

  canvas.addEventListener('pointerleave', () => {
    mousePos = null;
  });

  const dpadButtons = document.querySelectorAll('.dpad-btn');
  dpadButtons.forEach((btn) => {
    const dir = btn.getAttribute('data-dir') as Direction;

    btn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      touchDirection = dir;
    });

    const clearDir = (e: Event) => {
      e.preventDefault();
      if (touchDirection === dir) touchDirection = null;
    };
    btn.addEventListener('pointerup', clearDir);
    btn.addEventListener('pointerleave', clearDir);
    btn.addEventListener('pointercancel', clearDir);
  });

  const actionButtons = document.querySelectorAll('.action-btn');
  actionButtons.forEach((btn) => {
    const action = btn.getAttribute('data-action');
    btn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (action === 'pause') pendingPause = true;
      else if (action === 'restart') pendingRestart = true;
      else if (action === 'mute') pendingMute = true;
      else if (action === 'next') pendingNextTrack = true;
    });
  });
}

export function getDirection(): Direction | null {
  // D-pad has priority
  if (touchDirection) return touchDirection;

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

export function consumeNextTrack(): boolean {
  const v = pendingNextTrack;
  pendingNextTrack = false;
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

export function consumeAnyKey(): boolean {
  const v = pendingAnyKey;
  pendingAnyKey = false;
  return v;
}

export function consumeRestart(): boolean {
  const v = pendingRestart;
  pendingRestart = false;
  return v;
}
