import { TerrainType, Position } from '../types/game';

/**
 * GameBoard class handles the visual representation of the 5x5 game grid
 * Manages terrain display, unit positioning, and player interactions
 */
export class GameBoard {
  private boardElement: HTMLElement;
  private tiles: HTMLElement[][] = [];
  private onTileClick: (x: number, y: number) => void;

  constructor(boardElement: HTMLElement, onTileClick: (x: number, y: number) => void) {
    this.boardElement = boardElement;
    this.onTileClick = onTileClick;
    this.initializeBoard();
  }

  /**
   * Creates the 5x5 grid of tile elements
   */
  private initializeBoard() {
    this.boardElement.innerHTML = '';
    
    for (let y = 0; y < 5; y++) {
      this.tiles[y] = [];
      for (let x = 0; x < 5; x++) {
        const tile = document.createElement('div');
        tile.className = 'tile plains';
        tile.dataset.x = x.toString();
        tile.dataset.y = y.toString();
        
        tile.addEventListener('click', () => {
          this.onTileClick(x, y);
        });
        
        this.boardElement.appendChild(tile);
        this.tiles[y][x] = tile;
      }
    }
  }

  /**
   * Updates board tiles with terrain types from backend
   * @param terrainData - 25-character string representing 5x5 terrain grid
   */
  updateTerrain(terrainData: string) {
    const terrainMap: Record<string, TerrainType> = {
      'P': TerrainType.Plains,
      'F': TerrainType.Forest,
      'M': TerrainType.Mountain
    };

    for (let y = 0; y < 5; y++) {
      for (let x = 0; x < 5; x++) {
        const idx = y * 5 + x;
        const terrainChar = terrainData[idx] || 'P';
        const terrain = terrainMap[terrainChar];
        
        const tile = this.tiles[y][x];
        tile.className = `tile ${terrain.toLowerCase()}`;
        
        // Add terrain label
        const label = document.createElement('div');
        label.className = 'terrain-label';
        label.textContent = terrain[0];
        tile.appendChild(label);
      }
    }
  }

  clearSelection() {
    document.querySelectorAll('.tile').forEach(tile => {
      tile.classList.remove('selected', 'valid-move', 'valid-attack');
    });
  }

  selectTile(x: number, y: number) {
    this.clearSelection();
    if (x >= 0 && x < 5 && y >= 0 && y < 5) {
      this.tiles[y][x].classList.add('selected');
    }
  }

  /**
   * Highlights tiles where the selected unit can move
   */
  showValidMoves(positions: Position[]) {
    positions.forEach(pos => {
      if (pos.x >= 0 && pos.x < 5 && pos.y >= 0 && pos.y < 5) {
        this.tiles[pos.y][pos.x].classList.add('valid-move');
      }
    });
  }

  /**
   * Highlights tiles containing enemies that can be attacked
   */
  showValidAttacks(positions: Position[]) {
    positions.forEach(pos => {
      if (pos.x >= 0 && pos.x < 5 && pos.y >= 0 && pos.y < 5) {
        this.tiles[pos.y][pos.x].classList.add('valid-attack');
      }
    });
  }

  clearUnits() {
    document.querySelectorAll('.unit').forEach(unit => unit.remove());
  }

  /**
   * Adds a unit sprite to the board at the specified position
   * @param x - Board x coordinate (0-4)
   * @param y - Board y coordinate (0-4)
   * @param playerId - 'player1' (blue) or 'player2' (red)
   * @param hp - Current health points
   * @param maxHp - Maximum health points
   * @param isCurrentTurn - Whether this unit's owner has the current turn
   */
  addUnit(x: number, y: number, playerId: string, hp: number, maxHp: number, isCurrentTurn: boolean) {
    if (x >= 0 && x < 5 && y >= 0 && y < 5) {
      const tile = this.tiles[y][x];
      
      const unit = document.createElement('div');
      unit.className = `unit ${playerId}`;
      if (isCurrentTurn) {
        unit.classList.add('current-turn');
      }
      
      const hpPercent = (hp / maxHp) * 100;
      unit.innerHTML = `
        ${hp}
        <div class="hp-bar">
          <div class="hp-fill" style="width: ${hpPercent}%"></div>
        </div>
      `;
      
      tile.appendChild(unit);
    }
  }
}