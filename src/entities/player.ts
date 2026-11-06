import type { Direction, CellCoords } from '../types';
import { TILE_SIZE, PLAYER_SPEED, GRID_COLS, GRID_ROWS } from '../config';

export class Player {
  x: number;
  y: number;
  state: 'idle' | 'moving' = 'idle';
  direction: Direction = 'down';

  private targetX: number;
  private targetY: number;

  constructor(col: number, row: number) {
    this.x = col * TILE_SIZE;
    this.y = row * TILE_SIZE;
    this.targetX = this.x;
    this.targetY = this.y;
  }

  getCell(): CellCoords {
    return {
      col: Math.round(this.x / TILE_SIZE),
      row: Math.round(this.y / TILE_SIZE),
    };
  }

  update(inputDirection: Direction | null): void {
    if (this.state === 'idle') {
      if (inputDirection === null || inputDirection === 'stop') return;

      this.direction = inputDirection;
      const next = this.nextCell();

      if (next.col < 0 || next.col >= GRID_COLS || next.row < 0 || next.row >= GRID_ROWS) {
        return;
      }

      this.targetX = next.col * TILE_SIZE;
      this.targetY = next.row * TILE_SIZE;
      this.state = 'moving';
    }

    if (this.state === 'moving') {
      const dx = Math.sign(this.targetX - this.x);
      const dy = Math.sign(this.targetY - this.y);

      this.x += dx * PLAYER_SPEED;
      this.y += dy * PLAYER_SPEED;

      if (dx > 0 && this.x >= this.targetX) this.x = this.targetX;
      if (dx < 0 && this.x <= this.targetX) this.x = this.targetX;
      if (dy > 0 && this.y >= this.targetY) this.y = this.targetY;
      if (dy < 0 && this.y <= this.targetY) this.y = this.targetY;

      if (this.x === this.targetX && this.y === this.targetY) {
        this.state = 'idle';
      }
    }
  }

  private nextCell(): CellCoords {
    const c = this.getCell();
    switch (this.direction) {
      case 'up':
        return { col: c.col, row: c.row - 1 };
      case 'down':
        return { col: c.col, row: c.row + 1 };
      case 'left':
        return { col: c.col - 1, row: c.row };
      case 'right':
        return { col: c.col + 1, row: c.row };
      default:
        return c;
    }
  }
}
