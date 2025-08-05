export enum TerrainType {
  Plains = 'Plains',
  Forest = 'Forest',
  Mountain = 'Mountain'
}

export enum GameStatus {
  WaitingForPlayers = 'WaitingForPlayers',
  InProgress = 'InProgress',
  Finished = 'Finished'
}

export interface Position {
  x: number;
  y: number;
}

export interface GameState {
  currentGameId: number | null;
  selectedUnit: number | null;
  selectedTile: Position | null;
  validMoves: Position[];
  validAttacks: Position[];
  isMyTurn: boolean;
}