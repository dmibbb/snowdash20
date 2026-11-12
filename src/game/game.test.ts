import { describe, it, expect, vi, beforeEach } from 'vitest';

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
import { Stone } from '../entities/stone';
import { Monster } from '../entities/monster';
import { audio } from '../audio/audio';

// Player at (4,4), chest at (12,4)
const LEVEL_WITH_CHEST = [
  'BBBBBBBBBBBBBBBBBBBB',
  'B..................B',
  'B..................B',
  'B..................B',
  'B...P.......C......B',
  'B..................B',
  'B..................B',
  'B..................B',
  'B..................B',
  'B..................B',
  'B..................B',
  'B..................B',
  'BBBBBBBBBBBBBBBBBBBB',
].join('\n');

// Player at (4,4), no chests → triggers level complete on first tick
const LEVEL_NO_CHEST = [
  'BBBBBBBBBBBBBBBBBBBB',
  'B..................B',
  'B..................B',
  'B..................B',
  'B...P..............B',
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

describe('Game', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initial state', () => {
    const game = new Game([], makeFetcher([]));
    expect(game.score).toBe(0);
    expect(game.lives).toBe(4);
    expect(game.levelIndex).toBe(0);
    expect(game.isGameOver).toBe(false);
    expect(game.level).toBeNull();
    expect(game.player).toBeNull();
  });

  it('start loads level 0', async () => {
    const game = new Game(['/1'], makeFetcher([LEVEL_WITH_CHEST]));
    await game.start();
    expect(game.levelIndex).toBe(0);
    expect(game.level).not.toBeNull();
    expect(game.player).not.toBeNull();
    expect(game.visibleChests).toBe(1);
  });

  it('loadLevel out of range → isGameOver', async () => {
    const game = new Game(['/1'], makeFetcher([LEVEL_WITH_CHEST]));
    await game.start();
    await game.loadLevel(5);
    expect(game.isGameOver).toBe(true);
  });

  it('loadLevel with fetch error → isGameOver', async () => {
    const game = new Game(['/1'], async () => {
      throw new Error('fetch failed');
    });
    await game.start();
    expect(game.isGameOver).toBe(true);
  });

  it('onPlayerHit with lives > 0 → lives--, pendingHeroDeath, reset on resolve', async () => {
    const game = new Game(['/1'], makeFetcher([LEVEL_WITH_CHEST]));
    await game.start();

    game.level!.setCell(12, 4, 'empty');
    game.visibleChests = 0;
    game.score = 30;

    game.onPlayerHit();

    expect(game.lives).toBe(3);
    expect(game.isGameOver).toBe(false);
    expect(game.pendingHeroDeath).toBe(true);
    expect(game.score).toBe(30);
    expect(game.level!.getCell(12, 4)).toBe('empty');

    game.resolveHeroDeath();

    expect(game.pendingHeroDeath).toBe(false);
    expect(game.isGameOver).toBe(false);
    expect(game.visibleChests).toBe(1);
    expect(game.level!.getCell(12, 4)).toBe('chest');
    expect(audio.playSfxCyclic).toHaveBeenCalledWith(26, 29);
  });

  it('onPlayerHit at 1 life → GameOver immediately (no RIP)', async () => {
    const game = new Game(['/1'], makeFetcher([LEVEL_WITH_CHEST]));
    await game.start();
    game.lives = 1;

    game.onPlayerHit();

    expect(game.lives).toBe(0);
    expect(game.isGameOver).toBe(true);
    expect(game.pendingHeroDeath).toBe(false);
  });

  it('level complete → +50, pendingLevelComplete, next level loaded after advance', async () => {
    const game = new Game(['/1', '/2'], makeFetcher([LEVEL_NO_CHEST, LEVEL_WITH_CHEST]));
    await game.start();
    expect(game.visibleChests).toBe(0);

    game.tick(null);

    expect(game.score).toBe(50);
    expect(game.pendingLevelComplete).toBe(true);
    expect(game.levelIndex).toBe(0); // still on level 1 — waiting for Continue
    expect(audio.playSfx).toHaveBeenCalledWith(30); // Level Done

    await game.advanceToNextLevel();

    expect(game.pendingLevelComplete).toBe(false);
    expect(game.levelIndex).toBe(1);
    expect(game.visibleChests).toBe(1);
  });

  it('last level complete → GameOver on advance', async () => {
    const game = new Game(['/1'], makeFetcher([LEVEL_NO_CHEST]));
    await game.start();

    game.tick(null);

    expect(game.score).toBe(50);
    expect(game.pendingLevelComplete).toBe(true);
    expect(game.isGameOver).toBe(false); // wait for Continue

    await game.advanceToNextLevel();

    expect(game.pendingLevelComplete).toBe(false);
    expect(game.isGameOver).toBe(true);
    expect(game.victory).toBe(true);
  });

  it('milestone 250 plays sfx 11 exactly once', async () => {
    const game = new Game(['/1'], makeFetcher([LEVEL_WITH_CHEST]));
    await game.start();

    game.score = 250;
    game.tick(null);
    expect(audio.playSfx).toHaveBeenCalledWith(11);
    expect(audio.playSfx).toHaveBeenCalledTimes(1);

    // Second tick — should not play again, nextMilestone advanced to 500
    game.tick(null);
    expect(audio.playSfx).toHaveBeenCalledTimes(1);
  });

  it('stone does not fall on player standing directly below', async () => {
    const game = new Game(['/1'], makeFetcher([LEVEL_WITH_CHEST]));
    await game.start();
    const initialLives = game.lives;

    // Stone one cell above player — must NOT fall (matches original KillMode logic)
    const stone = new Stone(4, 3);
    game.stones.push(stone);

    game.tick(null);

    expect(game.lives).toBe(initialLives); // player is safe
    expect(stone.state).toBe('idle'); // stone stayed put
    expect(stone.y).toBe(120);
  });

  it('monster on player → onPlayerHit via tick', async () => {
    const game = new Game(['/1'], makeFetcher([LEVEL_WITH_CHEST]));
    await game.start();
    const initialLives = game.lives;

    const monster = new Monster(4, 4, 1);
    monster.x = game.player!.x;
    monster.y = game.player!.y;
    game.monsters.push(monster);

    game.tick(null);

    expect(game.lives).toBe(initialLives - 1);
  });

  it('falling stone on monster → monster killed, score increased', async () => {
    const game = new Game(['/1'], makeFetcher([LEVEL_WITH_CHEST]));
    await game.start();

    // Stone one cell above the monster. Both start idle.
    // Tick: monster moves 3px down, stone falls 8px down, AABB overlaps.
    const monster = new Monster(8, 4, 1);
    const stone = new Stone(8, 3);
    game.monsters.push(monster);
    game.stones.push(stone);

    game.tick(null);

    expect(monster.killed).toBe(true);
    expect(game.score).toBe(35);
    expect(audio.playSfxCyclic).toHaveBeenCalledWith(20, 23);
  });

  it('tick is no-op after GameOver', async () => {
    const game = new Game(['/1'], makeFetcher([LEVEL_WITH_CHEST]));
    await game.start();
    game.isGameOver = true;

    const scoreBefore = game.score;
    game.tick(null);

    expect(game.score).toBe(scoreBefore);
  });

  it('tick is no-op while pendingLevelComplete', async () => {
    const game = new Game(['/1', '/2'], makeFetcher([LEVEL_NO_CHEST, LEVEL_WITH_CHEST]));
    await game.start();
    game.tick(null); // triggers onLevelComplete
    expect(game.pendingLevelComplete).toBe(true);

    const scoreBefore = game.score;
    game.tick(null); // should be no-op

    expect(game.score).toBe(scoreBefore);
    expect(game.levelIndex).toBe(0);
  });

  it('isLastLevel reflects current index', async () => {
    const game = new Game(['/1', '/2'], makeFetcher([LEVEL_WITH_CHEST, LEVEL_WITH_CHEST]));
    await game.start();
    expect(game.isLastLevel()).toBe(false);

    await game.loadLevel(1);
    expect(game.isLastLevel()).toBe(true);
  });

  it('advanceToNextLevel sets victory on last level', async () => {
    const game = new Game(['/1'], makeFetcher([LEVEL_NO_CHEST]));
    await game.start();
    game.tick(null); // pendingLevelComplete = true

    await game.advanceToNextLevel();

    expect(game.isGameOver).toBe(true);
    expect(game.victory).toBe(true);
  });

  it('player walks away under idle stone → stone falls safely, no collision', async () => {
    const game = new Game(['/1'], makeFetcher([LEVEL_WITH_CHEST]));
    await game.start();
    const initialLives = game.lives;

    // Stone one cell above player start position
    const stone = new Stone(4, 3);
    game.stones.push(stone);

    // Player walks right for 8 ticks (from x=160 to x=200, fully out of column 4)
    for (let i = 0; i < 8; i++) game.tick('right');

    // The column below is fully empty — stone falls all the way to row 11
    // (right above the bottom wall). 8 cells × 5 ticks/cell + safety margin.
    for (let i = 0; i < 60; i++) game.tick(null);

    expect(game.lives).toBe(initialLives); // survived the walk-away
    expect(stone.state).toBe('idle');
    expect(stone.y).toBe(11 * 40); // landed at row 11 (y=440)
  });

  it('restartLevel applies a flat −200 score penalty', async () => {
    const game = new Game(['/1'], makeFetcher([LEVEL_WITH_CHEST]));
    await game.start();
    game.score = 500;
    game.restartLevel();
    expect(game.score).toBe(300);
  });

  it('restartLevel floors score at 0', async () => {
    const game = new Game(['/1'], makeFetcher([LEVEL_WITH_CHEST]));
    await game.start();
    game.score = 100;
    game.restartLevel();
    expect(game.score).toBe(0);
  });

  it('restartLevel does not rewind the milestone tracker', async () => {
    const game = new Game(['/1'], makeFetcher([LEVEL_WITH_CHEST]));
    await game.start();

    game.score = 500;
    game.tick(null); // fires 250 + 500 milestones, tracker → 750
    vi.clearAllMocks();

    game.score = 600;
    game.restartLevel(); // → 400
    game.score = 500; // back above 250/500
    game.tick(null);

    expect(audio.playSfx).not.toHaveBeenCalledWith(11);
  });
});
