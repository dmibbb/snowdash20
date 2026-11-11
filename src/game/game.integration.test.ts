import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Monster } from '../entities/monster';

vi.mock('../audio/audio', () => ({
  audio: {
    playSfx: vi.fn(),
    playSfxCyclic: vi.fn(),
    stopAllSfx: vi.fn(),
    playMusic: vi.fn(),
    stopMusic: vi.fn(),
    setPaused: vi.fn(),
  },
}));

import { Game } from './game';
import { audio } from '../audio/audio';

// Player at (4,4), snow at (5,4), chest at (6,4).
// Walking right: (4,4) → (5,4) → (6,4). Snow eaten on arrival at (5,4),
// chest eaten on arrival at (6,4). Chest consumed → level complete.
const LEVEL_ONE = [
  'BBBBBBBBBBBBBBBBBBBB',
  'B..................B',
  'B..................B',
  'B..................B',
  'B...PSC............B',
  'B..................B',
  'B..................B',
  'B..................B',
  'B..................B',
  'B..................B',
  'B..................B',
  'B..................B',
  'BBBBBBBBBBBBBBBBBBBB',
].join('\n');

// Simple one-chest level for the second stage.
const LEVEL_TWO = [
  'BBBBBBBBBBBBBBBBBBBB',
  'B..................B',
  'B..................B',
  'B..................B',
  'B..P.C.............B', // Player at (3,4), chest at (5,4)
  'B..................B',
  'B..................B',
  'B..................B',
  'B..................B',
  'B..................B',
  'B..................B',
  'B..................B',
  'BBBBBBBBBBBBBBBBBBBB',
].join('\n');

function makeFetcher(levels: string[]): (path: string) => Promise<string> {
  return async (path: string) => {
    const idx = Number(path.match(/(\d+)/)?.[1] ?? 1) - 1;
    const level = levels[idx];
    if (!level) throw new Error(`No level at ${path}`);
    return level;
  };
}

// Walk right one full cell (8 ticks at PLAYER_SPEED=5 → 40px).
// Then one more tick in idle so consumeCurrentTile fires on arrival.
function walkRight(game: Game): void {
  for (let i = 0; i < 8; i++) {
    game.tick('right');
  }
  game.tick(null); // idle tick → consume
}

describe('Game integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('walks through level 1 → eats snow → collects chest → advances to level 2', async () => {
    const game = new Game(['/1', '/2'], makeFetcher([LEVEL_ONE, LEVEL_TWO]));
    await game.start();

    expect(game.levelIndex).toBe(0);
    expect(game.visibleChests).toBe(1);
    expect(game.level!.getCell(5, 4)).toBe('snow');
    expect(game.level!.getCell(6, 4)).toBe('chest');

    // Walk to (5,4) — snow
    walkRight(game);

    expect(game.player!.getCell()).toEqual({ col: 5, row: 4 });
    expect(game.level!.getCell(5, 4)).toBe('empty');
    expect(audio.playSfxCyclic).toHaveBeenCalledWith(33, 34);

    // Walk to (6,4) — chest
    walkRight(game);

    expect(game.player!.getCell()).toEqual({ col: 6, row: 4 });
    expect(game.level!.getCell(6, 4)).toBe('empty');
    expect(game.visibleChests).toBe(0);
    // Last chest → "eat chest" SFX is skipped, Level Done (30) plays instead
    expect(audio.playSfxCyclic).not.toHaveBeenCalledWith(12, 19);

    // Level complete fires in the SAME tick as chest consumption:
    // score = 30 (chest) + 50 (bonus) = 80, level stays on 1 until Continue
    expect(game.score).toBe(80);
    expect(game.pendingLevelComplete).toBe(true);
    expect(game.levelIndex).toBe(0);
    expect(audio.playSfx).toHaveBeenCalledWith(30); // Level Done

    await game.advanceToNextLevel();

    expect(game.pendingLevelComplete).toBe(false);
    expect(game.levelIndex).toBe(1);
    expect(game.visibleChests).toBe(1);
  });

  it('passes the last level → GameOver on advance', async () => {
    const game = new Game(['/1'], makeFetcher([LEVEL_ONE]));
    await game.start();

    walkRight(game); // snow
    walkRight(game); // chest + level complete

    expect(game.score).toBe(80);
    expect(game.pendingLevelComplete).toBe(true);
    expect(game.isGameOver).toBe(false);

    await game.advanceToNextLevel();

    expect(game.isGameOver).toBe(true);
    expect(game.victory).toBe(true);
  });

  it('walks into a monster → loses life, pendingHeroDeath', async () => {
    const game = new Game(['/1'], makeFetcher([LEVEL_ONE]));
    await game.start();

    const monster = new Monster(5, 4, 1);
    game.monsters.push(monster);

    const initialLives = game.lives;

    game.tick('right');

    expect(game.lives).toBe(initialLives - 1);
    expect(game.pendingHeroDeath).toBe(true);
    expect(game.player!.getCell()).toEqual({ col: 4, row: 4 }); // didn't move
  });
});
