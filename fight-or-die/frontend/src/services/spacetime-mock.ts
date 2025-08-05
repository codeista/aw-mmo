// Mock SpacetimeDB service for local development without SpacetimeDB
export class SpacetimeMockService {
  private mockData: any = {
    players: new Map(),
    games: new Map(),
    boards: new Map(),
    units: new Map(),
    gameIdCounter: 1,
    unitIdCounter: 1
  };
  
  private subscribers: Map<string, Set<Function>> = new Map();
  public identity: string = 'mock-' + Math.random().toString(36).substr(2, 9);

  async connect() {
    console.log('Mock SpacetimeDB connected');
    return this;
  }

  private emit(table: string, event: string, data: any) {
    const key = `${table}.${event}`;
    const subs = this.subscribers.get(key) || new Set();
    subs.forEach(callback => callback(data));
  }

  private subscribe(table: string, event: string, callback: Function) {
    const key = `${table}.${event}`;
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set());
    }
    this.subscribers.get(key)!.add(callback);
  }

  get db() {
    const self = this;
    return {
      Player: {
        all: () => Array.from(self.mockData.players.values()),
        onInsert: (cb: Function) => self.subscribe('Player', 'insert', cb)
      },
      Game: {
        all: () => Array.from(self.mockData.games.values()),
        onInsert: (cb: Function) => self.subscribe('Game', 'insert', cb),
        onUpdate: (cb: Function) => self.subscribe('Game', 'update', cb)
      },
      Board: {
        all: () => Array.from(self.mockData.boards.values()),
        onInsert: (cb: Function) => self.subscribe('Board', 'insert', cb)
      },
      Unit: {
        all: () => Array.from(self.mockData.units.values()),
        onInsert: (cb: Function) => self.subscribe('Unit', 'insert', cb),
        onUpdate: (cb: Function) => self.subscribe('Unit', 'update', cb)
      }
    };
  }

  get reducers() {
    const self = this;
    return {
      create_player: async (username: string) => {
        const player = {
          id: self.identity,
          username,
          created_at: Date.now()
        };
        self.mockData.players.set(player.id, player);
        self.emit('Player', 'insert', player);
      },

      create_game: async () => {
        const gameId = self.mockData.gameIdCounter++;
        const game = {
          id: gameId,
          player1: self.identity,
          player2: null,
          current_turn: self.identity,
          status: 'WaitingForPlayers',
          winner: null,
          created_at: Date.now()
        };
        self.mockData.games.set(gameId, game);
        self.emit('Game', 'insert', game);

        // Create board
        const board = {
          game_id: gameId,
          terrain_data: 'PPPPPFPPPPFPMFFPPPFPPPPP' // 5x5 with some terrain
        };
        self.mockData.boards.set(gameId, board);
        self.emit('Board', 'insert', board);

        // Create player 1 unit
        const unit = {
          id: self.mockData.unitIdCounter++,
          game_id: gameId,
          owner: self.identity,
          x: 0,
          y: 0,
          hp: 100,
          movement_left: 3,
          has_attacked: false
        };
        self.mockData.units.set(unit.id, unit);
        self.emit('Unit', 'insert', unit);
      },

      join_game: async (gameId: number) => {
        const game = self.mockData.games.get(gameId);
        if (!game || game.status !== 'WaitingForPlayers') {
          throw new Error('Cannot join game');
        }

        const oldGame = { ...game };
        game.player2 = self.identity;
        game.status = 'InProgress';
        self.emit('Game', 'update', [oldGame, game]);

        // Create player 2 unit
        const unit = {
          id: self.mockData.unitIdCounter++,
          game_id: gameId,
          owner: self.identity,
          x: 4,
          y: 4,
          hp: 100,
          movement_left: 3,
          has_attacked: false
        };
        self.mockData.units.set(unit.id, unit);
        self.emit('Unit', 'insert', unit);
      },

      move_unit: async (gameId: number, unitId: number, x: number, y: number) => {
        const unit = self.mockData.units.get(unitId);
        if (!unit) throw new Error('Unit not found');

        const oldUnit = { ...unit };
        const distance = Math.abs(x - unit.x) + Math.abs(y - unit.y);
        unit.x = x;
        unit.y = y;
        unit.movement_left -= distance;
        self.emit('Unit', 'update', [oldUnit, unit]);
      },

      attack_unit: async (gameId: number, attackerId: number, targetId: number) => {
        const attacker = self.mockData.units.get(attackerId);
        const target = self.mockData.units.get(targetId);
        if (!attacker || !target) throw new Error('Units not found');

        const oldAttacker = { ...attacker };
        const oldTarget = { ...target };
        
        // Simple damage calculation
        const damage = 30; // Simplified - no terrain defense in mock
        target.hp = Math.max(0, target.hp - damage);
        attacker.has_attacked = true;

        self.emit('Unit', 'update', [oldAttacker, attacker]);
        self.emit('Unit', 'update', [oldTarget, target]);

        // Check victory
        if (target.hp === 0) {
          const game = self.mockData.games.get(gameId);
          if (game) {
            const oldGame = { ...game };
            game.status = 'Finished';
            game.winner = self.identity;
            self.emit('Game', 'update', [oldGame, game]);
          }
        }
      },

      end_turn: async (gameId: number) => {
        const game = self.mockData.games.get(gameId);
        if (!game) throw new Error('Game not found');

        const oldGame = { ...game };
        game.current_turn = game.current_turn === game.player1 ? game.player2 : game.player1;
        self.emit('Game', 'update', [oldGame, game]);

        // Reset units for next player
        Array.from(self.mockData.units.values())
          .filter(u => u.game_id === gameId && u.owner === game.current_turn)
          .forEach(unit => {
            const oldUnit = { ...unit };
            unit.movement_left = 3;
            unit.has_attacked = false;
            self.emit('Unit', 'update', [oldUnit, unit]);
          });
      }
    };
  }
}