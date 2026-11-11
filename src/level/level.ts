import type { TileType, CellCoords } from '../types';
import { TILE_SIZE } from '../config';
import type { ParsedLevel } from './parser';

export class Level {
  readonly cols: number;
  readonly rows: number;
  readonly tileSize = TILE_SIZE;
  readonly name: string | null;
  readonly start: CellCoords;
  chestsCount: number;

  private grid: TileType[][];
  private readonly initialGrid: TileType[][];
  private readonly initialChestsCount: number;

  constructor(parsed: ParsedLevel) {
    this.initialGrid = parsed.grid.map((row) => [...row]);
    this.initialChestsCount = parsed.chestsCount;
    this.grid = parsed.grid;
    this.rows = parsed.grid.length;
    this.cols = parsed.grid[0].length;
    this.name = parsed.name;
    this.start = parsed.start;
    this.chestsCount = parsed.chestsCount;
  }

  reset(): void {
    this.grid = this.initialGrid.map((row) => [...row]);
    this.chestsCount = this.initialChestsCount;
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
