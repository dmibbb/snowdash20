import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../audio/audio', () => ({
  audio: {
    playSfx: vi.fn(),
    playSfxCyclic: vi.fn(),
    stopAllSfx: vi.fn(),
  },
}));

import { Stone } from './stone';
import { Player } from './player';
import { Level } from '../level/level';
import { parseLevel } from '../level/parser';

const EMPTY_LEVEL = [
  'BBBBBBBBBBBBBBBBBBBB',
  'B..................B',
  'B..................B',
  'B..................B',
  'B..............P...B',
  'B..................B',
  'B..................B',
  'B..................B',
  'B..................B',
  'B..................B',
  'B..................B',
  'B..................B',
  'BBBBBBBBBBBBBBBBBBBB',
].join('\n');

const WALL_BELOW_LEVEL = [
  'BBBBBBBBBBBBBBBBBBBB',
  'B..................B',
  'B..................B',
  'B..................B',
  'B..B...........P...B', // wall at (3,4)
  'B..................B',
  'B..................B',
  'B..................B',
  'B..................B',
  'B..................B',
  'B..................B',
  'B..................B',
  'BBBBBBBBBBBBBBBBBBBB',
].join('\n');

const WALL_RIGHT_LEVEL = [
  'BBBBBBBBBBBBBBBBBBBB',
  'B..................B',
  'B..................B',
  'B..BB..........P...B', // walls at (3,3) and (4,3)
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

function makeLevel(text = EMPTY_LEVEL): Level {
  return new Level(parseLevel(text));
}

describe('Stone', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initial state is idle', () => {
    const s = new Stone(3, 3);
    expect(s.state).toBe('idle');
    expect(s.getCell()).toEqual({ col: 3, row: 3 });
  });

  it('reset returns to original position', () => {
    const s = new Stone(3, 3);
    s.x = 200;
    s.y = 300;
    s.state = 'pushed';
    s.reset();
    expect(s.x).toBe(120);
    expect(s.y).toBe(120);
    expect(s.state).toBe('idle');
  });

  it('does not fall when wall below', () => {
    const s = new Stone(3, 3);
    const level = makeLevel(WALL_BELOW_LEVEL);
    s.update(level, [s], null);
    expect(s.state).toBe('idle');
    expect(s.y).toBe(120);
  });

  it('starts falling when cell below is empty', () => {
    const s = new Stone(3, 3);
    const level = makeLevel();
    s.update(level, [s], null);
    expect(s.state).toBe('falling');
  });

  it('falls one cell in 5 ticks then idles', () => {
    const s = new Stone(3, 3);
    const level = makeLevel();
    for (let i = 0; i < 5; i++) s.update(level, [s], null);
    expect(s.y).toBe(160); // arrived at row 4
    expect(s.state).toBe('idle');
  });

  it('tryPush success on empty target', () => {
    const s = new Stone(3, 3);
    const level = makeLevel();
    const result = s.tryPush('right', level, [s]);
    expect(result).toBe(true);
    expect(s.state).toBe('pushed');
  });

  it('tryPush fails when wall behind', () => {
    const s = new Stone(3, 3);
    const level = makeLevel(WALL_RIGHT_LEVEL);
    const result = s.tryPush('right', level, [s]);
    expect(result).toBe(false);
    expect(s.state).toBe('idle');
  });

  it('tryPush fails for vertical direction', () => {
    const s = new Stone(3, 3);
    const level = makeLevel();
    expect(s.tryPush('up', level, [s])).toBe(false);
    expect(s.tryPush('down', level, [s])).toBe(false);
  });

  it('tryPush fails when another stone in the way', () => {
    const a = new Stone(3, 3);
    const b = new Stone(4, 3);
    const level = makeLevel();
    expect(a.tryPush('right', level, [a, b])).toBe(false);
  });

  it('rolls off ledge when stone below and side is free', () => {
    const a = new Stone(3, 3);
    const b = new Stone(3, 4);
    const level = makeLevel();
    a.update(level, [a, b], null);
    expect(a.state).toBe('pushed');
    expect(a.x).toBeLessThan(3 * 40);
  });

  it('does not start falling when player is directly below', () => {
    const s = new Stone(3, 3);
    const level = makeLevel();
    const player = new Player(3, 4);

    s.update(level, [s], player);

    expect(s.state).toBe('idle');
    expect(s.y).toBe(120); // did not move
  });

  it('starts falling after player moves away from below', () => {
    const s = new Stone(3, 3);
    const level = makeLevel();
    const player = new Player(3, 4);

    s.update(level, [s], player);
    expect(s.state).toBe('idle');

    // Simulate player stepping aside
    player.x = 5 * 40;
    player.y = 4 * 40;

    s.update(level, [s], player);
    expect(s.state).toBe('falling');
  });

  it('keeps stone idle while player is mid-step leaving the cell below', () => {
    const s = new Stone(3, 3);
    const level = makeLevel();
    const player = new Player(3, 4);
    player.x = 3 * 40 + 20; // half-way out to the right, AABB still overlaps (3,4)

    s.update(level, [s], player);

    expect(s.state).toBe('idle');
    expect(s.y).toBe(120);
  });

  it('starts falling once player has fully left the cell below', () => {
    const s = new Stone(3, 3);
    const level = makeLevel();
    const player = new Player(3, 4);
    player.x = 4 * 40; // fully in next cell — no AABB overlap with (3,4)

    s.update(level, [s], player);

    expect(s.state).toBe('falling');
  });

  it('keeps falling even if player is directly below (chase, not safety)', () => {
    const s = new Stone(3, 3);
    const level = makeLevel();
    const player = new Player(5, 3);
    s.update(level, [s], player); // A stone starts failing → isPursuing = true
    player.x = 3 * 40;
    player.y = 5 * 40; // Player is under the stone
    s.update(level, [s], player);
    expect(s.state).toBe('falling');
  });
});
