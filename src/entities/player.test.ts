import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../audio/audio', () => ({
  audio: {
    playSfx: vi.fn(),
    playSfxCyclic: vi.fn(),
    stopAllSfx: vi.fn(),
  },
}));

import { Player } from './player';
import { Level } from '../level/level';
import { parseLevel } from '../level/parser';
import { Monster } from './monster';
import { Stone } from './stone';
import type { Game } from '../game/game';
import { audio } from '../audio/audio';

// Player at (2,2), snow at (3,2), chest at (4,2), wall at (6,2)
const PLAYER_LEVEL = [
  'BBBBBBBBBBBBBBBBBBBB',
  'B..................B',
  'B.PSC.B............B',
  'B..................B',
  'B..................B',
  'B..................B',
  'B..................B',
  'B..................B',
  'B..................B',
  'B..................B',
  'B..................B',
  'B..................B',
  'BBBBBBBBBBBBBBBBBBBB',
].join('\n');

const BLOCKED_BY_STONE_LEVEL = [
  'BBBBBBBBBBBBBBBBBBBB',
  'B..................B',
  'B..................B',
  'B..................B',
  'B...P.B............B',
  'B..................B',
  'B..................B',
  'B..................B',
  'B..................B',
  'B..................B',
  'B..................B',
  'B..................B',
  'BBBBBBBBBBBBBBBBBBBB',
].join('\n');

function makeLevel(text: string = PLAYER_LEVEL): Level {
  return new Level(parseLevel(text));
}

function makeGame() {
  return {
    score: 0,
    visibleChests: 1,
    onPlayerHit: vi.fn(),
  };
}

describe('Player', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initial state', () => {
    const p = new Player(2, 2);
    expect(p.getCell()).toEqual({ col: 2, row: 2 });
    expect(p.state).toBe('idle');
    expect(p.direction).toBe('down');
    expect(p.getSpriteKey()).toBe('p_d_1');
  });

  it('resetToStart returns to start cell', () => {
    const p = new Player(2, 2);
    const level = makeLevel();
    const game = makeGame();

    for (let i = 0; i < 4; i++) p.update('right', level, game as unknown as Game, [], []);
    expect(p.x).toBeGreaterThan(80);

    p.resetToStart();
    expect(p.x).toBe(80);
    expect(p.y).toBe(80);
    expect(p.state).toBe('idle');
    expect(p.direction).toBe('down');
  });

  it('no input → stays idle', () => {
    const p = new Player(2, 2);
    p.update(null, makeLevel(), makeGame() as unknown as Game, [], []);
    expect(p.x).toBe(80);
    expect(p.state).toBe('idle');
  });

  it('moves ~2.13px per tick, arrives after 19 ticks', () => {
    const p = new Player(2, 2);
    const level = makeLevel();
    const game = makeGame();

    p.update('right', level, game as unknown as Game, [], []);
    expect(p.x).toBeCloseTo(82.13, 1);
    expect(p.state).toBe('moving');
    expect(p.direction).toBe('right');

    for (let i = 0; i < 18; i++) p.update('right', level, game as unknown as Game, [], []);
    expect(p.x).toBe(120);
    expect(p.state).toBe('idle');
  });

  it('blocked by wall → stays idle', () => {
    const p = new Player(5, 2); // wall at (6,2)
    const level = makeLevel();
    p.update('right', level, makeGame() as unknown as Game, [], []);
    expect(p.x).toBe(200);
    expect(p.state).toBe('idle');
  });

  it('consumes snow on arrival', () => {
    const p = new Player(2, 2);
    const level = makeLevel();
    const game = makeGame();

    for (let i = 0; i < 19; i++) p.update('right', level, game as unknown as Game, [], []);
    expect(level.getCell(3, 2)).toBe('snow');

    p.update(null, level, game as unknown as Game, [], []);
    expect(level.getCell(3, 2)).toBe('empty');
  });

  it('collects chest on arrival (+30, visibleChests--)', () => {
    const p = new Player(2, 2);
    const level = makeLevel();
    const game = makeGame();

    // Move to (3,2) and consume snow
    for (let i = 0; i < 19; i++) p.update('right', level, game as unknown as Game, [], []);
    p.update(null, level, game as unknown as Game, [], []);

    // Move to (4,2) and consume chest
    for (let i = 0; i < 19; i++) p.update('right', level, game as unknown as Game, [], []);
    p.update(null, level, game as unknown as Game, [], []);

    expect(level.getCell(4, 2)).toBe('empty');
    expect(game.score).toBe(30);
    expect(game.visibleChests).toBe(0);
  });

  it('blocked by monster → onPlayerHit', () => {
    const p = new Player(2, 2);
    const level = makeLevel();
    const game = makeGame();
    const monster = new Monster(3, 2, 1);

    p.update('right', level, game as unknown as Game, [], [monster]);
    expect(game.onPlayerHit).toHaveBeenCalledTimes(1);
    expect(p.state).toBe('idle');
    expect(p.x).toBe(80);
  });

  it('blocked by falling stone overlapped with target cell', () => {
    const p = new Player(2, 2);
    const level = makeLevel();
    const game = makeGame();

    const stone = new Stone(3, 2);
    stone.state = 'falling';
    stone.y = 81; // mid-fall, AABB still overlaps (3,2)

    p.update('right', level, game as unknown as Game, [stone], []);
    expect(p.x).toBe(80);
    expect(p.state).toBe('idle');
  });

  it('getSpriteKey changes with direction and animation', () => {
    const p = new Player(2, 2);
    const level = makeLevel();
    const game = makeGame();

    p.update('right', level, game as unknown as Game, [], []);
    expect(p.getSpriteKey()).toBe('p_r_1');

    for (let i = 0; i < 8; i++) p.update('right', level, game as unknown as Game, [], []);
    expect(p.getSpriteKey()).toBe('p_r_2');
  });

  it('skips "eat chest" SFX for the last chest', () => {
    const p = new Player(2, 2);
    const level = makeLevel();
    const game = makeGame(); // visibleChests = 1 (only one chest on this level)

    // Walk to (3,2) — eat snow (irrelevant SFX, clear after)
    for (let i = 0; i < 19; i++) p.update('right', level, game as unknown as Game, [], []);
    p.update(null, level, game as unknown as Game, [], []);

    vi.clearAllMocks();

    // Walk to (4,2) — eat the last chest
    for (let i = 0; i < 19; i++) p.update('right', level, game as unknown as Game, [], []);
    p.update(null, level, game as unknown as Game, [], []);

    expect(game.visibleChests).toBe(0);
    expect(audio.playSfxCyclic).not.toHaveBeenCalledWith(12, 19);
  });

  it('blocked by idle stone that cannot be pushed', () => {
    const level = makeLevel(BLOCKED_BY_STONE_LEVEL);
    const game = makeGame();
    const stone = new Stone(5, 4);
    const p = new Player(4, 4);

    p.update('right', level, game as unknown as Game, [stone], []);

    expect(p.x).toBe(4 * 40); // did not move
    expect(p.y).toBe(4 * 40);
    expect(p.state).toBe('idle');
    expect(stone.state).toBe('idle'); // push was rejected
  });

  it('follows a stone when push succeeds', () => {
    const level = makeLevel();
    const game = makeGame();
    const stone = new Stone(5, 4);
    const p = new Player(4, 4);

    p.update('right', level, game as unknown as Game, [stone], []);

    expect(p.state).toBe('moving'); // started walking into (5,4)
    expect(stone.state).toBe('pushed'); // and pushed the stone toward (6,4)
  });

  it('getCell returns correct cell at midpoint of movement', () => {
    const p = new Player(2, 2);
    const level = makeLevel();
    const game = makeGame();

    // Start moving right
    p.update('right', level, game as unknown as Game, [], []);

    // After 9 ticks, player should be at x ≈ 101 (midpoint between 80 and 120)
    for (let i = 0; i < 9; i++) p.update('right', level, game as unknown as Game, [], []);

    // Player is physically in cell 2 (x=80..119), not cell 3
    expect(p.getCell()).toEqual({ col: 2, row: 2 });

    // Even if x is exactly 100 (midpoint), should still be cell 2
    p.x = 100;
    expect(p.getCell()).toEqual({ col: 2, row: 2 });
  });

  it('getCell handles exact midpoint coordinates', () => {
    const p = new Player(0, 0);

    // Test all midpoints
    p.x = 20;
    p.y = 20;
    expect(p.getCell()).toEqual({ col: 0, row: 0 });

    p.x = 60;
    p.y = 60;
    expect(p.getCell()).toEqual({ col: 1, row: 1 });

    p.x = 100;
    p.y = 100;
    expect(p.getCell()).toEqual({ col: 2, row: 2 });
  });
});
