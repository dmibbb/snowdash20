import type { TileType, CellCoords } from '../types';
import { TILE_SIZE } from '../config';
import type { ParsedLevel } from './parser';

export class Level {
  readonly cols: number;
  readonly rows: number;
  readonly tileSize = TILE_SIZE;
  readonly start: CellCoords;
  chestsCount: number;

  private grid: TileType[][];

  constructor(parsed: ParsedLevel) {
    this.grid = parsed.grid;
    this.rows = parsed.grid.length;
    this.cols = parsed.grid[0].length;
    this.start = parsed.start;
    this.chestsCount = parsed.chestsCount;
  }

  getCell(col: number, row: number): TileType {
    if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) {
      return 'wall'; // borders
    }
    return this.grid[row][col];
  }

  setCell(col: number, row: number, type: TileType): void {
    if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) return;
    this.grid[row][col] = type;
  }

  isPassable(col: number, row: number): boolean {
    return this.getCell(col, row) !== 'wall';
  }
}
