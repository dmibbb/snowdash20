import { describe, it, expect } from 'vitest';
import { parseLevel } from './parser';

const VALID_LEVEL = [
  'BBBBBBBBBBBBBBBBBBBB',
  'B..................B',
  'B..................B',
  'B..................B',
  'B..................B',
  'B..................B',
  'B..................B',
  'B.......P..........B',
  'B..................B',
  'B..................B',
  'B..................B',
  'B..................B',
  'BBBBBBBBBBBBBBBBBBBB',
].join('\n');

describe('parseLevel', () => {
  it('parses a valid level', () => {
    const r = parseLevel(VALID_LEVEL);
    expect(r.grid.length).toBe(13);
    expect(r.grid[0].length).toBe(20);
    expect(r.start).toEqual({ col: 8, row: 7 });
    expect(r.chestsCount).toBe(0);
    expect(r.grid[0][0]).toBe('wall');
    expect(r.grid[1][1]).toBe('empty');
  });

  it('counts chests', () => {
    const lines = VALID_LEVEL.split('\n');
    lines[7] = 'B...C...P...C......B';
    const r = parseLevel(lines.join('\n'));
    expect(r.chestsCount).toBe(2);
    expect(r.grid[7][4]).toBe('chest');
    expect(r.grid[7][12]).toBe('chest');
  });

  it('throws on wrong row count', () => {
    const bad = VALID_LEVEL.split('\n').slice(0, 12).join('\n');
    expect(() => parseLevel(bad)).toThrow(/Expected 13 rows/);
  });

  it('throws on no P marker', () => {
    const bad = VALID_LEVEL.replace('P', '.');
    expect(() => parseLevel(bad)).toThrow(/No P marker/);
  });

  it('throws on multiple P markers', () => {
    const lines = VALID_LEVEL.split('\n');
    lines[3] = 'B..P...............B';
    expect(() => parseLevel(lines.join('\n'))).toThrow(/Multiple P/);
  });

  it('throws on short line (no silent padding)', () => {
    const lines = VALID_LEVEL.split('\n');
    lines[1] = 'B';
    expect(() => parseLevel(lines.join('\n'))).toThrow(/Row 1: expected 20 chars, got 1/);
  });

  it('throws on 19-char line (original 2006 files were 19 wide)', () => {
    const lines = VALID_LEVEL.split('\n');
    lines[1] = 'B'.repeat(19);
    expect(() => parseLevel(lines.join('\n'))).toThrow(/Row 1: expected 20 chars, got 19/);
  });

  it('throws on long line', () => {
    const lines = VALID_LEVEL.split('\n');
    lines[1] = 'B' + '.'.repeat(20) + 'B'; // 22 chars
    expect(() => parseLevel(lines.join('\n'))).toThrow(/Row 1: expected 20 chars, got 22/);
  });

  it('collects stone starts', () => {
    const lines = VALID_LEVEL.split('\n');
    lines[3] = 'B...K..K...........B';
    const r = parseLevel(lines.join('\n'));
    expect(r.stoneStarts).toEqual([
      { col: 4, row: 3 },
      { col: 7, row: 3 },
    ]);
    expect(r.grid[3][4]).toBe('empty');
    expect(r.grid[3][7]).toBe('empty');
  });

  it('collects monster starts', () => {
    const lines = VALID_LEVEL.split('\n');
    lines[3] = 'B...M..U...........B';
    const r = parseLevel(lines.join('\n'));
    expect(r.monsterStarts).toEqual([
      { col: 4, row: 3, model: 1 },
      { col: 7, row: 3, model: 2 },
    ]);
    expect(r.grid[3][4]).toBe('empty');
    expect(r.grid[3][7]).toBe('empty');
  });

  it('accepts original lowercase + hyphen format', () => {
    const lines = VALID_LEVEL.split('\n').map((l) => l.toLowerCase().replace(/\./g, '-'));
    const r = parseLevel(lines.join('\n'));
    expect(r.grid.length).toBe(13);
    expect(r.grid[0][0]).toBe('wall');
    expect(r.grid[1][1]).toBe('empty');
    expect(r.start).toEqual({ col: 8, row: 7 });
  });

  it('parses optional level name from ":Name" first line', () => {
    const withName = ':First Easy Step\n' + VALID_LEVEL;
    const r = parseLevel(withName);
    expect(r.name).toBe('First Easy Step');
    expect(r.grid.length).toBe(13);
  });

  it('returns null name when no ":Name" line', () => {
    const r = parseLevel(VALID_LEVEL);
    expect(r.name).toBeNull();
  });

  it('treats ":   " (whitespace only) as null name', () => {
    const withEmpty = ':   \n' + VALID_LEVEL;
    const r = parseLevel(withEmpty);
    expect(r.name).toBeNull();
  });

  it('trims trailing whitespace from lines', () => {
    const lines = VALID_LEVEL.split('\n');
    // Each row gets 3 trailing spaces — should NOT trigger "too long"
    const padded = lines.map((l) => l + '   ').join('\n');
    const r = parseLevel(padded);
    expect(r.grid.length).toBe(13);
    expect(r.grid[0].length).toBe(20);
    expect(r.grid[0][19]).toBe('wall');
  });

  it('trims trailing tab / mixed whitespace', () => {
    const lines = VALID_LEVEL.split('\n');
    lines[1] = lines[1] + '\t  \t';
    const r = parseLevel(lines.join('\n'));
    expect(r.grid[1].length).toBe(20);
  });

  it('does not trim leading spaces (they are valid empty cells)', () => {
    const lines = VALID_LEVEL.split('\n');
    lines[1] = ' ' + lines[1].substring(1); // replace col 0 wall with space
    const r = parseLevel(lines.join('\n'));
    // After trim, col 0 remains ' ' → parsed as empty (no wall enforcement)
    expect(r.grid[1].length).toBe(20);
    expect(r.grid[1][0]).toBe('empty');
  });
});
