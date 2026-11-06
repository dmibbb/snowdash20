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

export function initInput(): void {
  window.addEventListener('keydown', (e) => {
    if (gameKeys.has(e.code)) {
      e.preventDefault();
      pressed.add(e.code);
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
}

export function getDirection(): Direction | null {
  if (pressed.has('ArrowUp') || pressed.has('KeyW')) return 'up';
  if (pressed.has('ArrowDown') || pressed.has('KeyS')) return 'down';
  if (pressed.has('ArrowLeft') || pressed.has('KeyA')) return 'left';
  if (pressed.has('ArrowRight') || pressed.has('KeyD')) return 'right';
  return null;
}
