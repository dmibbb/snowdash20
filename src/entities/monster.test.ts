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
    expect(m.direction).toBe('down');
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
    expect(m.getSpriteKey()).toBe('ameba_d_1');
  });

  it('getSpriteKey for model 2 uses horizontal direction', () => {
    const m = new Monster(5, 5, 2);
    // Initially lastH = 'l'
    expect(m.getSpriteKey()).toBe('spiker_l_1');
  });
});
