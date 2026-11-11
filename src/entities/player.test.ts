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

function makeLevel(): Level {
  return new Level(parseLevel(PLAYER_LEVEL));
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

  it('moves 5px per tick, arrives after 8 ticks', () => {
    const p = new Player(2, 2);
    const level = makeLevel();
    const game = makeGame();

    p.update('right', level, game as unknown as Game, [], []);
    expect(p.x).toBe(85);
    expect(p.state).toBe('moving');
    expect(p.direction).toBe('right');

    for (let i = 0; i < 7; i++) p.update('right', level, game as unknown as Game, [], []);
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

    for (let i = 0; i < 8; i++) p.update('right', level, game as unknown as Game, [], []);
    expect(level.getCell(3, 2)).toBe('snow');

    p.update(null, level, game as unknown as Game, [], []);
    expect(level.getCell(3, 2)).toBe('empty');
  });

  it('collects chest on arrival (+30, visibleChests--)', () => {
    const p = new Player(2, 2);
    const level = makeLevel();
    const game = makeGame();

    // Move to (3,2) and consume snow
    for (let i = 0; i < 8; i++) p.update('right', level, game as unknown as Game, [], []);
    p.update(null, level, game as unknown as Game, [], []);

    // Move to (4,2) and consume chest
    for (let i = 0; i < 8; i++) p.update('right', level, game as unknown as Game, [], []);
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

    for (let i = 0; i < 2; i++) p.update('right', level, game as unknown as Game, [], []);
    expect(p.getSpriteKey()).toBe('p_r_2');
  });

  it('skips "eat chest" SFX for the last chest', () => {
    const p = new Player(2, 2);
    const level = makeLevel();
    const game = makeGame(); // visibleChests = 1 (only one chest on this level)

    // Walk to (3,2) — eat snow (irrelevant SFX, clear after)
    for (let i = 0; i < 8; i++) p.update('right', level, game as unknown as Game, [], []);
    p.update(null, level, game as unknown as Game, [], []);

    vi.clearAllMocks();

    // Walk to (4,2) — eat the last chest
    for (let i = 0; i < 8; i++) p.update('right', level, game as unknown as Game, [], []);
    p.update(null, level, game as unknown as Game, [], []);

    expect(game.visibleChests).toBe(0);
    expect(audio.playSfxCyclic).not.toHaveBeenCalledWith(12, 19);
  });
});
