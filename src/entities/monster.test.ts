import { describe, it, expect } from 'vitest';

import { Monster } from './monster';
import { Stone } from './stone';
import { Level } from '../level/level';
import { parseLevel } from '../level/parser';

const OPEN_LEVEL = [
  'BBBBBBBBBBBBBBBBBBBB',
  'B..................B',
  'B..................B',
  'B..................B',
  'B..................B',
  'B..................B',
  'B..............P...B',
  'B..................B',
  'B..................B',
  'B..................B',
  'B..................B',
  'B..................B',
  'BBBBBBBBBBBBBBBBBBBB',
].join('\n');

const ENCLOSED_LEVEL = [
  'BBBBBBBBBBBBBBBBBBBB',
  'B..................B',
  'B..................B',
  'B..................B',
  'B...BBB............B',
  'B...B.B............B', // monster at (5,5), surrounded by walls
  'B...BBB........P...B',
  'B..................B',
  'B..................B',
  'B..................B',
  'B..................B',
  'B..................B',
  'BBBBBBBBBBBBBBBBBBBB',
].join('\n');

function makeLevel(text = OPEN_LEVEL): Level {
  return new Level(parseLevel(text));
}

describe('Monster', () => {
  it('initial state', () => {
    const m = new Monster(5, 5, 1);
    expect(m.getCell()).toEqual({ col: 5, row: 5 });
    expect(m.state).toBe('idle');
    expect(['up', 'down', 'left', 'right']).toContain(m.direction);
    expect(m.killed).toBe(false);
    expect(m.model).toBe(1);
  });

  it('reset returns to start', () => {
    const m = new Monster(5, 5, 2);
    m.x = 999;
    m.killed = true;
    m.reset();
    expect(m.x).toBe(200);
    expect(m.y).toBe(200);
    expect(m.killed).toBe(false);
    expect(m.state).toBe('idle');
  });

  it('moves when path is free', () => {
    const m = new Monster(5, 5, 1);
    m.direction = 'down';
    const level = makeLevel();
    const monsters = [m];
    m.update(level, [], monsters);
    expect(m.state).toBe('moving');
    expect(m.direction).toBe('down');
    expect(m.y).toBeGreaterThan(200);
  });

  it('stays idle when all directions blocked', () => {
    const m = new Monster(5, 5, 1);
    const level = makeLevel(ENCLOSED_LEVEL);
    const monsters = [m];
    m.update(level, [], monsters);
    expect(m.state).toBe('idle');
    expect(m.y).toBe(200);
  });

  it('does not walk onto a stone', () => {
    const m = new Monster(5, 5, 1);
    m.direction = 'down';
    const stone = new Stone(5, 6);
    const level = makeLevel();
    const monsters = [m];
    // Direction is down → stone is exactly there → will pick alternate
    m.update(level, [stone], monsters);
    // Should not be at (5,6) — moved to some other direction, or idle
    expect(m.getCell()).not.toEqual({ col: 5, row: 6 });
  });

  it('does not walk onto another monster', () => {
    const a = new Monster(5, 5, 1);
    a.direction = 'down';
    const b = new Monster(5, 6, 1);
    const level = makeLevel();
    const monsters = [a, b];
    a.update(level, [], monsters);
    expect(a.getCell()).not.toEqual({ col: 5, row: 6 });
  });

  it('killed monster does not update', () => {
    const m = new Monster(5, 5, 1);
    m.killed = true;
    const level = makeLevel();
    m.update(level, [], [m]);
    expect(m.state).toBe('idle');
    expect(m.x).toBe(200);
  });

  it('getSpriteKey for model 1', () => {
    const m = new Monster(5, 5, 1);
    m.direction = 'down'; // force deterministic
    expect(m.getSpriteKey()).toBe('ameba_d_1');
  });

  it('getSpriteKey for model 2 uses initial direction', () => {
    const m = new Monster(5, 5, 2);
    const expected = m.direction === 'right' ? 'spiker_r_1' : 'spiker_l_1';
    expect(m.getSpriteKey()).toBe(expected);
  });

  it('model 2 (spiker) starts with horizontal direction', () => {
    const m = new Monster(5, 5, 2);
    expect(['left', 'right']).toContain(m.direction);
  });

  it('model 2 (spiker) only moves horizontally', () => {
    const m = new Monster(5, 5, 2);
    const level = makeLevel();
    const monsters = [m];

    // After many ticks, direction must never be up or down
    for (let i = 0; i < 50; i++) {
      m.update(level, [], monsters);
      expect(['left', 'right']).toContain(m.direction);
    }
  });

  it('two monsters cannot target the same cell in the same tick', () => {
    const level = makeLevel();
    const a = new Monster(5, 5, 1);
    const b = new Monster(7, 5, 1);
    // Force both to want to move toward (6, 5)
    a.direction = 'right';
    b.direction = 'left';
    const monsters = [a, b];

    a.update(level, [], monsters); // A reserves (6, 5)
    b.update(level, [], monsters); // B sees reservation, picks another direction

    expect(a.direction).toBe('right');
    expect(b.direction).not.toBe('left');
  });

  it('releases reservation after arriving at target', () => {
    const level = makeLevel();
    const a = new Monster(5, 5, 1);
    a.direction = 'right';
    const monsters = [a];

    // Tick 1: A reserves (6,5) and starts moving
    a.update(level, [], monsters);
    // Private field access — TS strict; cast through `unknown` for the test only.
    expect((a as unknown as { reservedCell: unknown }).reservedCell).toEqual({ col: 6, row: 5 });

    // Move exactly to the target: 40 px / 1 px per tick = 40 ticks total.
    // (1 already done above, so 39 more.)
    for (let i = 0; i < 39; i++) a.update(level, [], monsters);

    expect(a.getCell()).toEqual({ col: 6, row: 5 });
    expect(a.state).toBe('idle');
    expect((a as unknown as { reservedCell: unknown }).reservedCell).toBeNull();
  });

  it('initial direction is randomized per monster type', () => {
    // Amoeba — all 4 directions must appear over 50 instances.
    const amebaDirs = new Set<string>();
    for (let i = 0; i < 50; i++) amebaDirs.add(new Monster(5, 5, 1).direction);
    expect(amebaDirs.size).toBeGreaterThan(1);

    // Spiker — only left/right.
    const spikerDirs = new Set<string>();
    for (let i = 0; i < 50; i++) spikerDirs.add(new Monster(5, 5, 2).direction);
    expect(spikerDirs.size).toBeGreaterThan(1);
    expect(spikerDirs.has('up')).toBe(false);
    expect(spikerDirs.has('down')).toBe(false);
  });

  it('getCell returns correct cell at midpoint of movement', () => {
    const m = new Monster(5, 5, 1);
    const level = makeLevel();

    // Start moving down
    m.direction = 'down';
    m.update(level, [], [m]);
    expect(m.state).toBe('moving');

    // Simulate midpoint
    m.y = 220; // midpoint between 200 and 240

    // Monster is physically in row 5 (y=200..239), not row 6
    expect(m.getCell()).toEqual({ col: 5, row: 5 });
  });

  it('getCell handles exact midpoint coordinates', () => {
    const m = new Monster(0, 0, 1);

    // Test all midpoints
    m.x = 20;
    m.y = 20;
    expect(m.getCell()).toEqual({ col: 0, row: 0 });

    m.x = 60;
    m.y = 60;
    expect(m.getCell()).toEqual({ col: 1, row: 1 });
  });
});
