import type { CellCoords, Direction } from '../types';
import type { Level } from '../level/level';
import type { Stone } from './stone';
import { TILE_SIZE, MONSTER_SPEED } from '../config';

export type MonsterModel = 1 | 2;

const DIRECTIONS_ALL: Direction[] = ['up', 'down', 'left', 'right'];
const DIRECTIONS_HORIZONTAL: Direction[] = ['left', 'right'];

export class Monster {
  x: number;
  y: number;
  state: 'idle' | 'moving' = 'idle';
  direction: Direction = 'down';
  readonly model: MonsterModel;
  killed = false;
  private animTick = 0;
  private lastH = 'l';
  private reservedCell: CellCoords | null = null;

  private readonly startCol: number;
  private readonly startRow: number;
  private targetX: number;
  private targetY: number;

  constructor(col: number, row: number, model: MonsterModel) {
    this.startCol = col;
    this.startRow = row;
    this.model = model;
    this.x = col * TILE_SIZE;
    this.y = row * TILE_SIZE;
    this.targetX = this.x;
    this.targetY = this.y;
    this.direction = this.pickInitialDirection();
    this.lastH = this.direction === 'right' ? 'r' : 'l';
  }

  reset(): void {
    this.x = this.startCol * TILE_SIZE;
    this.y = this.startRow * TILE_SIZE;
    this.targetX = this.x;
    this.targetY = this.y;
    this.state = 'idle';
    this.direction = this.pickInitialDirection();
    this.killed = false;
    this.animTick = 0;
    this.lastH = this.direction === 'right' ? 'r' : 'l';
    this.reservedCell = null;
  }

  getCell(): CellCoords {
    return {
      col: Math.floor(this.x / TILE_SIZE),
      row: Math.floor(this.y / TILE_SIZE),
    };
  }

  update(level: Level, stones: Stone[], monsters: Monster[]): void {
    if (this.killed) return;

    if (this.state === 'idle') {
      // Keep current direction if possible; otherwise pick a random available one.
      if (!this.canMove(this.direction, level, stones, monsters)) {
        const dirs = this.model === 2 ? DIRECTIONS_HORIZONTAL : DIRECTIONS_ALL;
        const available = dirs.filter((d) => this.canMove(d, level, stones, monsters));
        if (available.length === 0) return;
        this.direction = available[Math.floor(Math.random() * available.length)];
      }

      const cell = this.getCell();
      const delta = this.deltaOf(this.direction);
      this.targetX = (cell.col + delta.dc) * TILE_SIZE;
      this.targetY = (cell.row + delta.dr) * TILE_SIZE;
      this.reservedCell = { col: cell.col + delta.dc, row: cell.row + delta.dr };
      this.state = 'moving';
    }

    if (this.state === 'moving') {
      const dx = Math.sign(this.targetX - this.x);
      const dy = Math.sign(this.targetY - this.y);

      this.x += dx * MONSTER_SPEED;
      this.y += dy * MONSTER_SPEED;

      if (dx > 0 && this.x >= this.targetX) this.x = this.targetX;
      if (dx < 0 && this.x <= this.targetX) this.x = this.targetX;
      if (dy > 0 && this.y >= this.targetY) this.y = this.targetY;
      if (dy < 0 && this.y <= this.targetY) this.y = this.targetY;

      if (this.x === this.targetX && this.y === this.targetY) {
        this.state = 'idle';
        this.reservedCell = null;
      }

      if (this.direction === 'left') this.lastH = 'l';
      if (this.direction === 'right') this.lastH = 'r';

      if (this.state === 'moving') {
        this.animTick += 1;
      } else {
        this.animTick = 0;
      }
    }
  }

  private pickInitialDirection(): Direction {
    const pool = this.model === 2 ? DIRECTIONS_HORIZONTAL : DIRECTIONS_ALL;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  private canMove(
    direction: Direction,
    level: Level,
    stones: Stone[],
    monsters: Monster[],
  ): boolean {
    if (direction === 'stop') return false;
    const cell = this.getCell();
    const delta = this.deltaOf(direction);
    const col = cell.col + delta.dc;
    const row = cell.row + delta.dr;

    if (level.getCell(col, row) !== 'empty') return false;

    for (const s of stones) {
      const sc = s.getCell();
      if (sc.col === col && sc.row === row) return false;
    }

    for (const m of monsters) {
      if (m === this || m.killed) continue;
      const mc = m.getCell();
      if (mc.col === col && mc.row === row) return false;
      // Another monster has already committed to moving into this cell.
      // Without this, two monsters walking toward each other would both
      // target the same middle cell and pass through each other.
      if (m.reservedCell && m.reservedCell.col === col && m.reservedCell.row === row) {
        return false;
      }
    }

    return true;
  }

  getSpriteKey(): string {
    const frame = this.state === 'moving' ? (Math.floor(this.animTick / 9) % 2) + 1 : 1;

    if (this.model === 1) {
      const d = this.direction === 'stop' ? 'd' : this.direction[0];
      return `ameba_${d}_${frame}`;
    }
    return `spiker_${this.lastH}_${frame}`;
  }

  private deltaOf(direction: Direction): { dc: number; dr: number } {
    switch (direction) {
      case 'up':
        return { dc: 0, dr: -1 };
      case 'down':
        return { dc: 0, dr: 1 };
      case 'left':
        return { dc: -1, dr: 0 };
      case 'right':
        return { dc: 1, dr: 0 };
      default:
        return { dc: 0, dr: 0 };
    }
  }
}
