import type { CellCoords, Direction } from '../types';
import type { Level } from '../level/level';
import type { Player } from './player';
import { TILE_SIZE, STONE_FALL_SPEED, STONE_PUSH_SPEED } from '../config';
import { audio } from '../audio/audio';

export type StoneState = 'idle' | 'falling' | 'pushed';

export class Stone {
  x: number;
  y: number;
  state: StoneState = 'idle';
  private hasFallSoundPlayed = false;

  private targetX: number;
  private targetY: number;
  private readonly startX: number;
  private readonly startY: number;

  constructor(col: number, row: number) {
    this.x = this.startX = col * TILE_SIZE;
    this.y = this.startY = row * TILE_SIZE;
    this.targetX = this.x;
    this.targetY = this.y;
  }

  reset(): void {
    this.x = this.startX;
    this.y = this.startY;
    this.targetX = this.startX;
    this.targetY = this.startY;
    this.state = 'idle';
    this.hasFallSoundPlayed = false;
  }

  getCell(): CellCoords {
    return {
      col: Math.round(this.x / TILE_SIZE),
      row: Math.round(this.y / TILE_SIZE),
    };
  }

  update(level: Level, stones: Stone[], player: Player | null): void {
    if (this.state === 'idle') {
      this.tryStartFallingOrRolling(level, stones, player);
    }

    if (this.state !== 'idle') {
      this.moveTowardTarget();
    }
  }

  // Called by Player when it tries to walk into this stone.
  // Only horizontal pushing (like the original). Returns true if push started.
  tryPush(direction: Direction, level: Level, stones: Stone[]): boolean {
    if (this.state !== 'idle') return false;
    if (direction !== 'left' && direction !== 'right') return false;

    // Do NOT check canFall here. In the original, an actively pushed stone
    // keeps rolling horizontally even if the cell below is empty — gravity
    // only kicks in once the player stops pushing. This prevents the "player
    // follows a falling stone and dies" bug.
    const cell = this.getCell();
    const dc = direction === 'left' ? -1 : 1;
    const targetCol = cell.col + dc;
    const targetRow = cell.row;

    if (!this.isCellFree(level, stones, targetCol, targetRow)) return false;

    this.state = 'pushed';
    this.targetX = targetCol * TILE_SIZE;
    this.targetY = targetRow * TILE_SIZE;
    this.hasFallSoundPlayed = false;
    audio.playSfx(32);
    return true;
  }

  private tryStartFallingOrRolling(level: Level, stones: Stone[], player: Player | null): void {
    const cell = this.getCell();
    const canFallNow = this.canFall(level, stones);

    // Detect the end of a continuous fall: we were falling, and now nothing's below.
    if (this.hasFallSoundPlayed && !canFallNow) {
      audio.playSfx(35); // Stone Falled
      this.hasFallSoundPlayed = false;
    }

    // 1. Fall straight down if the cell below is free
    if (canFallNow) {
      if (!this.hasFallSoundPlayed) {
        audio.playSfx(36); // Stone Falling
        this.hasFallSoundPlayed = true;
      }
      this.state = 'falling';
      this.targetX = this.x;
      this.targetY = this.y + TILE_SIZE;
      return;
    }

    // 2. Roll off ONLY if there's another stone below (matching original Stone::Move).
    //    A stone on a wall/floor/snow stays put — no auto-rolling off edges.
    if (!this.hasStoneAt(stones, cell.col, cell.row + 1)) return;

    // 3. Don't roll if something sits directly on top
    if (this.hasStoneAt(stones, cell.col, cell.row - 1)) return;

    for (const dc of [-1, 1]) {
      const sideCol = cell.col + dc;
      const sideRow = cell.row;
      const belowSideCol = sideCol;
      const belowSideRow = sideRow + 1;

      if (!this.isCellFree(level, stones, sideCol, sideRow)) continue;
      if (!this.isCellFree(level, stones, belowSideCol, belowSideRow)) continue;

      // 4. Don't roll onto the player or onto the cell right above them
      if (player) {
        const pc = player.getCell();
        if (pc.col === sideCol && pc.row === sideRow) continue;
        if (pc.col === sideCol && pc.row === sideRow - 1) continue;
      }

      this.state = 'pushed';
      this.targetX = sideCol * TILE_SIZE;
      this.targetY = sideRow * TILE_SIZE;
      return;
    }
  }

  private hasStoneAt(stones: Stone[], col: number, row: number): boolean {
    for (const s of stones) {
      if (s === this) continue;
      const sc = s.getCell();
      if (sc.col === col && sc.row === row) return true;
    }
    return false;
  }

  private moveTowardTarget(): void {
    const speed = this.state === 'falling' ? STONE_FALL_SPEED : STONE_PUSH_SPEED;
    const dx = Math.sign(this.targetX - this.x);
    const dy = Math.sign(this.targetY - this.y);

    this.x += dx * speed;
    this.y += dy * speed;

    if (dx > 0 && this.x >= this.targetX) this.x = this.targetX;
    if (dx < 0 && this.x <= this.targetX) this.x = this.targetX;
    if (dy > 0 && this.y >= this.targetY) this.y = this.targetY;
    if (dy < 0 && this.y <= this.targetY) this.y = this.targetY;

    if (this.x === this.targetX && this.y === this.targetY) {
      this.state = 'idle';
    }
  }

  private canFall(level: Level, stones: Stone[]): boolean {
    const cell = this.getCell();
    return this.isCellFree(level, stones, cell.col, cell.row + 1);
  }

  private isCellFree(level: Level, stones: Stone[], col: number, row: number): boolean {
    if (level.getCell(col, row) !== 'empty') return false;
    return !this.hasStoneAt(stones, col, row);
  }
}
