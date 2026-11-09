import type { Direction, CellCoords } from '../types';
import type { Level } from '../level/level';
import type { Game } from '../game/game';
import type { Stone } from './stone';
import { TILE_SIZE, PLAYER_SPEED, CHEST_POINTS } from '../config';

export class Player {
  x: number;
  y: number;
  state: 'idle' | 'moving' = 'idle';
  direction: Direction = 'down';

  private readonly startCol: number;
  private readonly startRow: number;
  private targetX: number;
  private targetY: number;

  constructor(col: number, row: number) {
    this.startCol = col;
    this.startRow = row;
    this.x = col * TILE_SIZE;
    this.y = row * TILE_SIZE;
    this.targetX = this.x;
    this.targetY = this.y;
  }

  resetToStart(): void {
    this.x = this.startCol * TILE_SIZE;
    this.y = this.startRow * TILE_SIZE;
    this.targetX = this.x;
    this.targetY = this.y;
    this.state = 'idle';
    this.direction = 'down';
  }

  getCell(): CellCoords {
    return {
      col: Math.round(this.x / TILE_SIZE),
      row: Math.round(this.y / TILE_SIZE),
    };
  }

  update(inputDirection: Direction | null, level: Level, game: Game, stones: Stone[]): void {
    if (this.state === 'idle') {
      // Consume snow/chest on current cell — every idle tick, regardless of input.
      this.consumeCurrentTile(level, game);

      if (inputDirection === null || inputDirection === 'stop') return;

      this.direction = inputDirection;
      const next = this.nextCell();

      if (!level.isPassable(next.col, next.row)) return;

      // Check for stone in target cell
      const stone = this.findStoneAt(stones, next.col, next.row);
      if (stone && stone.state === 'idle') {
        // Try to push; if push fails, player is blocked.
        const pushed = stone.tryPush(this.direction, level, stones);
        if (!pushed) return;
        // If push succeeded, stone is now 'pushed' — fall through and let player move too.
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

  private consumeCurrentTile(level: Level, game: Game): void {
    const cell = this.getCell();
    const tile = level.getCell(cell.col, cell.row);

    if (tile === 'snow') {
      level.setCell(cell.col, cell.row, 'empty');
    } else if (tile === 'chest') {
      level.setCell(cell.col, cell.row, 'empty');
      game.score += CHEST_POINTS;
      game.visibleChests -= 1;
    }
  }

  private findStoneAt(stones: Stone[], col: number, row: number): Stone | undefined {
    return stones.find((s) => {
      const sc = s.getCell();
      return sc.col === col && sc.row === row;
    });
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
