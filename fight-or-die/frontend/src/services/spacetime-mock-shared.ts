/**
 * Mock implementation of SpacetimeDB for local development
 * Uses localStorage to share game state between browser tabs
 * Each tab gets its own identity via sessionStorage
 */
export class SpacetimeMockService {
  private subscribers: Map<string, Set<Function>> = new Map();
  public identity: string;
  private syncInterval: number | null = null;
  private lastSyncTime: number = 0;

  constructor() {
    // Each tab gets its own unique identity
    this.identity = 'mock-' + Math.random().toString(36).substr(2, 9);
    
    // Store identity in session storage (per-tab) instead of localStorage
    sessionStorage.setItem('mock-identity', this.identity);
    
    // Initialize shared data if not exists
    if (!localStorage.getItem('mock-data')) {
      this.initializeData();
    }
  }

  private initializeData() {
    const initialData = {
      players: {},
      games: {},
      boards: {},
      units: {},
      gameIdCounter: 1,
      unitIdCounter: 1,
      lastUpdate: Date.now()
    };
    localStorage.setItem('mock-data', JSON.stringify(initialData));
  }

  private getData() {
    try {
      return JSON.parse(localStorage.getItem('mock-data') || '{}');
    } catch {
      this.initializeData();
      return JSON.parse(localStorage.getItem('mock-data')!);
    }
  }

  private setData(data: any) {
    data.lastUpdate = Date.now();
    localStorage.setItem('mock-data', JSON.stringify(data));
  }

  async connect() {
    console.log('Mock SpacetimeDB connected (shared mode)');
    
    // Start syncing
    this.startSync();
    
    return this;
  }

  /**
   * Sets up cross-tab synchronization using storage events
   */
  private startSync() {
    // Listen for storage events from other tabs
    window.addEventListener('storage', (e) => {
      if (e.key === 'mock-data' && e.newValue) {
        this.handleSync();
      }
    });

    // Poll for changes (backup for same-tab updates)
    this.syncInterval = window.setInterval(() => {
      this.handleSync();
    }, 100);
  }

  /**
   * Checks for data changes and emits updates to subscribers
   */
  private handleSync() {
    const data = this.getData();
    if (data.lastUpdate > this.lastSyncTime) {
      this.lastSyncTime = data.lastUpdate;
      
      // Emit updates for all tables
      Object.entries(data.games || {}).forEach(([id, game]) => {
        this.emit('Game', 'sync', game);
      });
      Object.entries(data.units || {}).forEach(([id, unit]) => {
        this.emit('Unit', 'sync', unit);
      });
      Object.entries(data.boards || {}).forEach(([id, board]) => {
        this.emit('Board', 'sync', board);
      });
    }
  }

  disconnect() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    window.removeEventListener('storage', this.handleSync);
  }

  private emit(table: string, event: string, data: any) {
    // Emit for all event types when syncing
    if (event === 'sync') {
      ['insert', 'update'].forEach(evt => {
        const key = `${table}.${evt}`;
        const subs = this.subscribers.get(key) || new Set();
        subs.forEach(callback => {
          if (evt === 'update') {
            callback(data, data); // For update, pass same data twice
          } else {
            callback(data);
          }
        });
      });
    } else {
      const key = `${table}.${event}`;
      const subs = this.subscribers.get(key) || new Set();
      subs.forEach(callback => callback(data));
    }
  }

  private subscribe(table: string, event: string, callback: Function) {
    const key = `${table}.${event}`;
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set());
    }
    this.subscribers.get(key)!.add(callback);
  }

  /**
   * Mock database interface matching SpacetimeDB SDK
   */
  get db() {
    const self = this;
    return {
      Player: {
        all: () => {
          const data = self.getData();
          return Object.values(data.players || {});
        },
        onInsert: (cb: Function) => self.subscribe('Player', 'insert', cb)
      },
      Game: {
        all: () => {
          const data = self.getData();
          return Object.values(data.games || {});
        },
        onInsert: (cb: Function) => self.subscribe('Game', 'insert', cb),
        onUpdate: (cb: Function) => self.subscribe('Game', 'update', cb)
      },
      Board: {
        all: () => {
          const data = self.getData();
          return Object.values(data.boards || {});
        },
        onInsert: (cb: Function) => self.subscribe('Board', 'insert', cb)
      },
      Unit: {
        all: () => {
          const data = self.getData();
          return Object.values(data.units || {});
        },
        onInsert: (cb: Function) => self.subscribe('Unit', 'insert', cb),
        onUpdate: (cb: Function) => self.subscribe('Unit', 'update', cb)
      }
    };
  }

  /**
   * Mock reducer functions matching SpacetimeDB backend
   */
  get reducers() {
    const self = this;
    return {
      create_player: async (username: string) => {
        const data = self.getData();
        const player = {
          id: self.identity,
          username,
          created_at: Date.now()
        };
        data.players[player.id] = player;
        self.setData(data);
        self.emit('Player', 'insert', player);
      },

      create_game: async () => {
        const data = self.getData();
        const gameId = data.gameIdCounter++;
        const game = {
          id: gameId,
          player1: self.identity,
          player2: null,
          current_turn: self.identity,
          status: 'WaitingForPlayers',
          winner: null,
          created_at: Date.now()
        };
        data.games[gameId] = game;
        
        // Create board
        const board = {
          game_id: gameId,
          terrain_data: 'PPPPPFPPPPFPMFFPPPFPPPPP' // 5x5 with some terrain
        };
        data.boards[gameId] = board;
        
        // Create player 1 unit
        const unit = {
          id: data.unitIdCounter++,
          game_id: gameId,
          owner: self.identity,
          x: 0,
          y: 0,
          hp: 100,
          movement_left: 3,
          has_attacked: false
        };
        data.units[unit.id] = unit;
        
        self.setData(data);
        self.emit('Game', 'insert', game);
        self.emit('Board', 'insert', board);
        self.emit('Unit', 'insert', unit);
      },

      join_game: async (gameId: number) => {
        const data = self.getData();
        const game = data.games[gameId];
        if (!game || game.status !== 'WaitingForPlayers') {
          throw new Error('Cannot join game');
        }

        const oldGame = { ...game };
        game.player2 = self.identity;
        game.status = 'InProgress';
        data.games[gameId] = game;
        
        // Create player 2 unit
        const unit = {
          id: data.unitIdCounter++,
          game_id: gameId,
          owner: self.identity,
          x: 4,
          y: 4,
          hp: 100,
          movement_left: 3,
          has_attacked: false
        };
        data.units[unit.id] = unit;
        
        self.setData(data);
        self.emit('Game', 'update', [oldGame, game]);
        self.emit('Unit', 'insert', unit);
      },

      move_unit: async (gameId: number, unitId: number, x: number, y: number) => {
        const data = self.getData();
        const unit = data.units[unitId];
        if (!unit) throw new Error('Unit not found');

        const oldUnit = { ...unit };
        const distance = Math.abs(x - unit.x) + Math.abs(y - unit.y);
        unit.x = x;
        unit.y = y;
        unit.movement_left -= distance;
        data.units[unitId] = unit;
        
        self.setData(data);
        self.emit('Unit', 'update', [oldUnit, unit]);
      },

      attack_unit: async (gameId: number, attackerId: number, targetId: number) => {
        const data = self.getData();
        const attacker = data.units[attackerId];
        const target = data.units[targetId];
        if (!attacker || !target) throw new Error('Units not found');

        const oldAttacker = { ...attacker };
        const oldTarget = { ...target };
        
        // Simple damage calculation (no terrain defense in mock for simplicity)
        const damage = 30;
        target.hp = Math.max(0, target.hp - damage);
        attacker.has_attacked = true;
        
        data.units[attackerId] = attacker;
        data.units[targetId] = target;

        // Check victory
        if (target.hp === 0) {
          const game = data.games[gameId];
          if (game) {
            const oldGame = { ...game };
            game.status = 'Finished';
            game.winner = self.identity;
            data.games[gameId] = game;
            self.setData(data);
            self.emit('Game', 'update', [oldGame, game]);
          }
        } else {
          self.setData(data);
        }

        self.emit('Unit', 'update', [oldAttacker, attacker]);
        self.emit('Unit', 'update', [oldTarget, target]);
      },

      end_turn: async (gameId: number) => {
        const data = self.getData();
        const game = data.games[gameId];
        if (!game) throw new Error('Game not found');

        const oldGame = { ...game };
        game.current_turn = game.current_turn === game.player1 ? game.player2 : game.player1;
        data.games[gameId] = game;

        // Reset units for next player
        Object.values(data.units).forEach((unit: any) => {
          if (unit.game_id === gameId && unit.owner === game.current_turn) {
            const oldUnit = { ...unit };
            unit.movement_left = 3;
            unit.has_attacked = false;
            data.units[unit.id] = unit;
            self.emit('Unit', 'update', [oldUnit, unit]);
          }
        });
        
        self.setData(data);
        self.emit('Game', 'update', [oldGame, game]);
      }
    };
  }
}