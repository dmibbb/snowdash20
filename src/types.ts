export type Direction = 'up' | 'down' | 'left' | 'right' | 'stop';

export type GameMode = 'splash' | 'intro' | 'menu' | 'help' | 'playing' | 'gameover';

export type TileType = 'wall' | 'snow' | 'chest' | 'empty';

export interface Point {
  x: number;
  y: number;
}

export interface CellCoords {
  col: number;
  row: number;
}
