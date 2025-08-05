# Fight or Die - Backend

## Running the Backend

1. Install SpacetimeDB CLI from https://spacetimedb.com/install

2. Start the development server:
   ```bash
   spacetime dev
   ```

## Game Flow

1. **Create Player**: `create_player(username: String)`
2. **Create Game**: `create_game()` - Creates a game and places your unit at (0,0)
3. **Join Game**: `join_game(game_id: u32)` - Join as player 2, unit placed at (4,4)
4. **Move Unit**: `move_unit(game_id: u32, unit_id: u32, new_x: u8, new_y: u8)`
5. **Attack Unit**: `attack_unit(game_id: u32, attacker_id: u32, target_id: u32)`
6. **End Turn**: `end_turn(game_id: u32)`

## Tables

- **Player**: Stores player info
- **Game**: Tracks game state and turn order
- **Board**: 5x5 grid with terrain (Plains, Forest, Mountain)
- **Unit**: Unit positions and stats
- **GameAction**: Log of all moves/attacks

## Terrain Defense

- Plains: 0 defense (30 damage)
- Forest: 1 defense (20 damage)
- Mountain: 2 defense (10 damage)