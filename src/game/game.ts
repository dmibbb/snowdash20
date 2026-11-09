import type { Player } from '../entities/player';
import type { Stone } from '../entities/stone';
import type { Level } from '../level/level';

export class Game {
  score = 0;
  visibleChests = 0;
  stones: Stone[] = [];

  onPlayerHit(player: Player, level: Level): void {
    console.warn('[Game] Player hit! Resetting positions.');
    player.resetToStart();
    for (const s of this.stones) {
      s.reset();
    }
    level.reset();
    this.visibleChests = level.chestsCount;
  }
}
