import type { Player } from '../entities/player';
import type { Stone } from '../entities/stone';
import type { Monster } from '../entities/monster';
import type { Level } from '../level/level';

export class Game {
  score = 0;
  visibleChests = 0;
  stones: Stone[] = [];
  monsters: Monster[] = [];

  onPlayerHit(player: Player, level: Level): void {
    // Full lives/GameOver system lands in phase 7. For now just reset positions.
    console.warn('[Game] Player hit! Resetting positions.');
    player.resetToStart();
    for (const s of this.stones) s.reset();
    for (const m of this.monsters) m.reset();
    level.reset();
    this.visibleChests = level.chestsCount;
  }
}
