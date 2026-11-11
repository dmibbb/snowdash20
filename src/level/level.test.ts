import { describe, it, expect } from 'vitest';
import { Level } from './level';
import { parseLevel } from './parser';

const SIMPLE = [
  'BBBBBBBBBBBBBBBBBBBB',
  'B..................B',
  'B..S...............B',
  'B..................B',
  'B..................B',
  'B..................B',
  'B.......C..........B',
  'B.......P..........B',
  'B..................B',
  'B..................B',
  'B..................B',
  'B..................B',
  'BBBBBBBBBBBBBBBBBBBB',
].join('\n');

function makeLevel(text = SIMPLE): Level {
  return new Level(parseLevel(text));
}

describe('Level', () => {
  it('initializes from parsed data', () => {
    const level = makeLevel();
    expect(level.cols).toBe(20);
    expect(level.rows).toBe(13);
    expect(level.start).toEqual({ col: 8, row: 7 });
    expect(level.chestsCount).toBe(1);
  });

  it('getCell returns tile inside bounds', () => {
    const level = makeLevel();
    expect(level.getCell(0, 0)).toBe('wall');
    expect(level.getCell(3, 2)).toBe('snow');
    expect(level.getCell(8, 6)).toBe('chest');
    expect(level.getCell(1, 1)).toBe('empty');
  });

  it('getCell returns wall for out-of-bounds', () => {
    const level = makeLevel();
    expect(level.getCell(-1, 0)).toBe('wall');
    expect(level.getCell(0, -1)).toBe('wall');
    expect(level.getCell(20, 0)).toBe('wall');
    expect(level.getCell(0, 13)).toBe('wall');
  });

  it('setCell updates tile', () => {
    const level = makeLevel();
    level.setCell(2, 2, 'empty');
    expect(level.getCell(2, 2)).toBe('empty');
  });

  it('setCell is no-op for out-of-bounds', () => {
    const level = makeLevel();
    level.setCell(-1, 0, 'empty');
    level.setCell(20, 0, 'empty');
    expect(level.getCell(0, 0)).toBe('wall');
  });

  it('isPassable: false only for wall', () => {
    const level = makeLevel();
    expect(level.isPassable(0, 0)).toBe(false); // wall
    expect(level.isPassable(2, 2)).toBe(true); // snow
    expect(level.isPassable(8, 6)).toBe(true); // chest
    expect(level.isPassable(1, 1)).toBe(true); // empty
  });

  it('reset restores initial grid and chestsCount', () => {
    const level = makeLevel();
    level.setCell(3, 2, 'empty');
    level.setCell(8, 6, 'empty');
    level.chestsCount = 0;

    level.reset();

    expect(level.getCell(3, 2)).toBe('snow');
    expect(level.getCell(8, 6)).toBe('chest');
    expect(level.chestsCount).toBe(1);
  });
});
