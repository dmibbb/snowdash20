import type { CellCoords, Direction } from '../types';
import type { Level } from '../level/level';
import type { Player } from './player';
import { TILE_SIZE, STONE_FALL_ACCEL, STONE_FALL_MAX_SPEED, STONE_PUSH_SPEED } from '../config';
import { audio } from '../audio/audio';

export type StoneState = 'idle' | 'falling' | 'pushed';

export class Stone {
  x: number;
  y: number;
  state: StoneState = 'idle';
  private isPursuing = false;
  private fallVelocity = 0;

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
    this.isPursuing = false;
    this.fallVelocity = 0;
  }

  getCell(): CellCoords {
    return {
      col: Math.floor(this.x / TILE_SIZE),
      row: Math.floor(this.y / TILE_SIZE),
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

    // Do NOT check canFall here — pushed stones keep rolling horizontally
    // until the player releases the key; gravity resumes afterwards.
    const cell = this.getCell();
    const dc = direction === 'left' ? -1 : 1;
    const targetCol = cell.col + dc;
    const targetRow = cell.row;

    if (!this.isCellFree(level, stones, targetCol, targetRow)) return false;

    this.state = 'pushed';
    this.targetX = targetCol * TILE_SIZE;
    this.targetY = targetRow * TILE_SIZE;
    this.isPursuing = false;
    this.fallVelocity = 0;
    audio.playSfx(32);
    return true;
  }

  private tryStartFallingOrRolling(level: Level, stones: Stone[], player: Player | null): void {
    const cell = this.getCell();
    const canFallNow = this.canFall(level, stones);
    const playerBelow = !!(player && this.playerOverlapsCell(player, cell.col, cell.row + 1));

    // Safety: don't start a FRESH fall if the player is directly below.
    // Once pursuing (isPursuing), we chase and ignore this check — matching
    // the original KillMode behavior.
    if (canFallNow && playerBelow && !this.isPursuing) {
      return;
    }

    // End of a falling/rolling sequence. The original was silent here (bug);
    // we play Stone Falled (35) once on the real landing.
    if (this.isPursuing && !canFallNow) {
      audio.playSfx(35); // Stone Falled
      this.isPursuing = false;
      this.fallVelocity = 0;
    }

    // Fall straight down
    if (canFallNow) {
      audio.playSfx(36); // Stone Falling
      this.state = 'falling';
      this.targetX = this.x;
      this.targetY = this.y + TILE_SIZE;
      this.isPursuing = true;
      return;
    }

    // Roll off ONLY if there's another stone below (matching original Stone::Move).
    if (!this.hasStoneAt(stones, cell.col, cell.row + 1)) return;
    //Don't roll if something sits directly on top
    if (this.hasStoneAt(stones, cell.col, cell.row - 1)) return;

    for (const dc of [-1, 1]) {
      const sideCol = cell.col + dc;
      const sideRow = cell.row;
      const belowSideCol = sideCol;
      const belowSideRow = sideRow + 1;

      if (!this.isCellFree(level, stones, sideCol, sideRow)) continue;
      if (!this.isCellFree(level, stones, belowSideCol, belowSideRow)) continue;

      // Don't roll onto the player (AABB) or onto the cell right above them
      if (player) {
        if (this.playerOverlapsCell(player, sideCol, sideRow)) continue;
        if (this.playerOverlapsCell(player, sideCol, sideRow + 1)) continue;
      }

      this.state = 'pushed';
      this.targetX = sideCol * TILE_SIZE;
      this.targetY = sideRow * TILE_SIZE;
      this.isPursuing = true;
      return;
    }

    if (this.state === 'idle') {
      this.isPursuing = false;
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

  // Returns true if the player's AABB overlaps the given grid cell.
  // Used instead of player.getCell() because getCell rounds mid-step
  // positions — the player may visually still be in the cell they just left.
  private playerOverlapsCell(player: Player, col: number, row: number): boolean {
    const px = col * TILE_SIZE;
    const py = row * TILE_SIZE;
    return (
      player.x < px + TILE_SIZE &&
      player.x + TILE_SIZE > px &&
      player.y < py + TILE_SIZE &&
      player.y + TILE_SIZE > py
    );
  }

  private moveTowardTarget(): void {
    if (this.state === 'falling') {
      this.fallVelocity = Math.min(this.fallVelocity + STONE_FALL_ACCEL, STONE_FALL_MAX_SPEED);
    }
    const speed = this.state === 'falling' ? this.fallVelocity : STONE_PUSH_SPEED;

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
