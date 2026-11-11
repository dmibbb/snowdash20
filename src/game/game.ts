import type { Direction } from '../types';
import { Player } from '../entities/player';
import { Stone } from '../entities/stone';
import { Monster } from '../entities/monster';
import { Level } from '../level/level';
import { parseLevel } from '../level/parser';
import { TILE_SIZE, START_LIVES, LEVEL_BONUS, MONSTER1_POINTS, MONSTER2_POINTS } from '../config';
import { audio } from '../audio/audio';

export type LevelFetcher = (path: string) => Promise<string>;

export class Game {
  score = 0;
  lives = START_LIVES;
  levelIndex = 0;
  visibleChests = 0;
  level: Level | null = null;
  player: Player | null = null;
  stones: Stone[] = [];
  monsters: Monster[] = [];
  isGameOver = false;
  pendingLevelComplete = false;
  pendingHeroDeath = false;
  victory = false;

  private loading = false;
  private nextMilestone = 250;
  private scoreAtLevelStart = 0;
  private readonly levelPaths: string[];
  private readonly fetchLevel: LevelFetcher;

  constructor(levelPaths: string[], fetchLevel: LevelFetcher) {
    this.levelPaths = levelPaths;
    this.fetchLevel = fetchLevel;
  }

  async start(): Promise<void> {
    await this.loadLevel(0);
  }

  async loadLevel(index: number): Promise<void> {
    if (index < 0 || index >= this.levelPaths.length) {
      this.isGameOver = true;
      return;
    }

    this.loading = true;
    try {
      const text = await this.fetchLevel(this.levelPaths[index]);
      const parsed = parseLevel(text);
      this.level = new Level(parsed);
      this.player = new Player(parsed.start.col, parsed.start.row);
      this.stones = parsed.stoneStarts.map((s) => new Stone(s.col, s.row));
      this.monsters = parsed.monsterStarts.map((m) => new Monster(m.col, m.row, m.model));
      this.visibleChests = parsed.chestsCount;
      this.levelIndex = index;
      this.scoreAtLevelStart = this.score;
    } catch (err) {
      console.error('[Game] Failed to load level', index, err);
      this.pendingLevelComplete = false;
      this.isGameOver = true;
    } finally {
      this.loading = false;
    }
  }

  tick(input: Direction | null): void {
    if (this.isGameOver || this.loading || this.pendingLevelComplete || this.pendingHeroDeath)
      return;
    if (!this.level || !this.player) return;

    this.player.update(input, this.level, this, this.stones, this.monsters);

    for (const m of this.monsters) {
      m.update(this.level, this.stones, this.monsters);
    }

    for (const s of this.stones) {
      s.update(this.level, this.stones, this.player);
    }

    // Stone → player (only when moving)
    for (const s of this.stones) {
      if (s.state === 'idle') continue;
      if (this.overlaps(s, this.player)) {
        this.onPlayerHit();
        return;
      }
    }

    // Monster → player
    for (const m of this.monsters) {
      if (m.killed) continue;
      if (this.overlaps(m, this.player)) {
        this.onPlayerHit();
        return;
      }
    }

    // Stone → monster (only when moving)
    for (const s of this.stones) {
      if (s.state === 'idle') continue;
      for (const m of this.monsters) {
        if (m.killed) continue;
        if (this.overlaps(s, m)) {
          m.killed = true;
          this.score += m.model === 1 ? MONSTER1_POINTS : MONSTER2_POINTS;
          audio.playSfxCyclic(20, 23); // Enemy Die
        }
      }
    }

    // 250-points milestone — plays once per crossing
    while (this.score >= this.nextMilestone) {
      audio.playSfx(11); // 250 Points
      this.nextMilestone += 250;
    }

    if (this.visibleChests === 0) {
      this.onLevelComplete();
    }
  }

  // Called externally (from Player when it walks into a monster, and internally).
  onPlayerHit(): void {
    this.lives -= 1;
    if (this.lives <= 0) {
      // Final death: no hero die jingle — GameOver plays "Your Score" instead
      this.isGameOver = true;
      return;
    }
    audio.playSfxCyclic(26, 29);
    this.pendingHeroDeath = true;
  }

  // Called from HeroDeath mode after the RIP pause. Resets the level or
  // ends the game depending on remaining lives.
  resolveHeroDeath(): void {
    if (!this.pendingHeroDeath) return;
    this.pendingHeroDeath = false;
    this.resetLevel();
  }

  restartLevel(): void {
    this.score = this.scoreAtLevelStart;
    this.nextMilestone = Math.max(250, Math.ceil(this.score / 250) * 250 || 250);
    this.resetLevel();
  }

  private onLevelComplete(): void {
    audio.playSfx(30); // Level Done
    this.score += LEVEL_BONUS;
    this.pendingLevelComplete = true;
  }

  // Called from LevelComplete mode's Continue/OK button.
  async advanceToNextLevel(): Promise<void> {
    this.pendingLevelComplete = false;
    const nextIndex = this.levelIndex + 1;
    if (nextIndex >= this.levelPaths.length) {
      this.victory = true;
      this.isGameOver = true;
      return;
    }
    await this.loadLevel(nextIndex);
  }

  isLastLevel(): boolean {
    return this.levelIndex >= this.levelPaths.length - 1;
  }

  private resetLevel(): void {
    if (!this.level || !this.player) return;
    this.player.resetToStart();
    for (const s of this.stones) s.reset();
    for (const m of this.monsters) m.reset();
    this.level.reset();
    this.visibleChests = this.level.chestsCount;
  }

  private overlaps(a: { x: number; y: number }, b: { x: number; y: number }): boolean {
    return Math.abs(a.x - b.x) < TILE_SIZE && Math.abs(a.y - b.y) < TILE_SIZE;
  }
}
