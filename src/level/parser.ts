import type { TileType, CellCoords } from '../types';
import type { MonsterModel } from '../entities/monster';
import { GRID_COLS, GRID_ROWS } from '../config';

export interface MonsterStart {
  col: number;
  row: number;
  model: MonsterModel;
}

export interface ParsedLevel {
  grid: TileType[][];
  start: CellCoords;
  stoneStarts: CellCoords[];
  monsterStarts: MonsterStart[];
  chestsCount: number;
}

export function parseLevel(text: string): ParsedLevel {
  // Remove BOM for Win-saved files
  const clean = text.replace(/^\uFEFF/, '');

  // Split and clean lines
  const lines = clean
    .split('\n')
    .map((l) => l.replace(/\r$/, ''))
    .filter((l) => l.trim() !== '');

  if (lines.length !== GRID_ROWS) {
    const preview = lines.map((l, i) => `  ${i}: |${l}|`).join('\n');
    throw new Error(
      `Expected ${GRID_ROWS} rows, got ${lines.length}.\nLines seen by parser:\n${preview}`,
    );
  }

  const grid: TileType[][] = [];
  let start: CellCoords | null = null;
  const monsterStarts: MonsterStart[] = [];
  const stoneStarts: CellCoords[] = [];
  let chestsCount = 0;

  for (let row = 0; row < GRID_ROWS; row++) {
    const line = lines[row];
    if (line.length > GRID_COLS) {
      throw new Error(
        `Row ${row} too long: ${line.length} chars (expected ${GRID_COLS}): |${line}|`,
      );
    }

    const rowArr: TileType[] = [];
    for (let col = 0; col < GRID_COLS; col++) {
      const ch = line[col] ?? ' ';
      switch (ch) {
        case 'B':
          rowArr.push('wall');
          break;
        case 'S':
          rowArr.push('snow');
          break;
        case 'C':
          rowArr.push('chest');
          chestsCount++;
          break;
        case 'K':
          stoneStarts.push({ col, row });
          rowArr.push('empty');
          break;
        case 'P':
          if (start) throw new Error('Multiple P markers');
          start = { col, row };
          rowArr.push('empty');
          break;
        case 'M':
        case 'U':
          monsterStarts.push({ col, row, model: ch === 'M' ? 1 : 2 });
          rowArr.push('empty');
          break;
        case '.':
        case ' ':
          rowArr.push('empty');
          break;
        default:
          throw new Error(
            `Unknown symbol '${ch}' (code ${ch.charCodeAt(0)}) at (col=${col}, row=${row})`,
          );
      }
    }
    grid.push(rowArr);
  }

  if (!start) throw new Error('No P marker found');
  return { grid, start, stoneStarts, monsterStarts, chestsCount };
}
