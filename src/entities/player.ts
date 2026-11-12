import type { Direction, CellCoords } from '../types';
import type { Level } from '../level/level';
import type { Game } from '../game/game';
import type { Stone } from './stone';
import type { Monster } from './monster';
import { TILE_SIZE, PLAYER_SPEED, CHEST_POINTS } from '../config';
import { audio } from '../audio/audio';

export class Player {
  x: number;
  y: number;
  state: 'idle' | 'moving' = 'idle';
  direction: Direction = 'down';
  private animTick = 0;

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
    this.animTick = 0;
  }

  getCell(): CellCoords {
    return {
      col: Math.round(this.x / TILE_SIZE),
      row: Math.round(this.y / TILE_SIZE),
    };
  }

  update(
    inputDirection: Direction | null,
    level: Level,
    game: Game,
    stones: Stone[],
    monsters: Monster[],
  ): void {
    if (this.state === 'idle') {
      // Consume snow/chest on current cell — every idle tick, regardless of input.
      this.consumeCurrentTile(level, game);

      if (inputDirection === null || inputDirection === 'stop') return;

      this.direction = inputDirection;
      const next = this.nextCell();

      if (!level.isPassable(next.col, next.row)) return;

      // Walking into a living monster = death (SPEC 9)
      const monster = this.findMonsterAt(monsters, next.col, next.row);
      if (monster) {
        game.onPlayerHit();
        return;
      }

      // Block entry into any cell still overlapped by a falling stone.
      // getCell() rounds, so a mid-fall stone may report the next cell up
      // while its pixels still occupy the target cell — walking in would kill.
      const targetX = next.col * TILE_SIZE;
      const targetY = next.row * TILE_SIZE;
      for (const s of stones) {
        if (s.state !== 'falling') continue;
        if (
          s.x < targetX + TILE_SIZE &&
          s.x + TILE_SIZE > targetX &&
          s.y < targetY + TILE_SIZE &&
          s.y + TILE_SIZE > targetY
        ) {
          return;
        }
      }

      // Check for idle stone to push in the target cell
      const stone = this.findStoneAt(stones, next.col, next.row);
      if (stone && stone.state === 'idle') {
        const pushed = stone.tryPush(this.direction, level, stones);
        if (!pushed) return;
      }
      // Pushed stone → fall through: player follows.

      this.targetX = targetX;
      this.targetY = targetY;
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

    if (this.state === 'moving') {
      this.animTick += 1;
    } else {
      this.animTick = 0;
    }
  }

  private consumeCurrentTile(level: Level, game: Game): void {
    const cell = this.getCell();
    const tile = level.getCell(cell.col, cell.row);

    if (tile === 'snow') {
      level.setCell(cell.col, cell.row, 'empty');
      audio.playSfxCyclic(33, 34);
    } else if (tile === 'chest') {
      level.setCell(cell.col, cell.row, 'empty');
      game.score += CHEST_POINTS;
      game.visibleChests -= 1;
      if (game.visibleChests > 0) {
        audio.playSfxCyclic(12, 19);
      }
    }
  }

  private findStoneAt(stones: Stone[], col: number, row: number): Stone | undefined {
    return stones.find((s) => {
      const sc = s.getCell();
      return sc.col === col && sc.row === row;
    });
  }

  private findMonsterAt(monsters: Monster[], col: number, row: number): Monster | undefined {
    return monsters.find((m) => {
      if (m.killed) return false;
      const mc = m.getCell();
      return mc.col === col && mc.row === row;
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

  getSpriteKey(): string {
    const dir = this.direction === 'stop' ? 'd' : this.direction[0];
    if (this.state === 'moving') {
      const frame = (Math.floor(this.animTick / 9) % 3) + 1;
      return `p_${dir}_${frame}`;
    }
    return `p_${dir}_1`;
  }
}
