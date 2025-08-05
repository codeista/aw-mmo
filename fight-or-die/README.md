# Fight or Die - Tactical Combat Game

A turn-based tactical combat game inspired by Advance Wars, built with SpacetimeDB (backend) and TypeScript (frontend).

## 🎮 Game Features

- **5x5 tactical grid** with terrain effects
- **Turn-based combat** with movement and attack phases
- **Terrain types**: Plains, Forest, Mountain (different defense bonuses)
- **Real-time multiplayer** powered by SpacetimeDB
- **Simple rules**: Move up to 3 tiles, attack adjacent enemies

## 🚀 Quick Start

### Option 1: Mock Mode (No Installation Required!)
```bash
# Just run the development script
./run-dev.sh
```
This runs the game with a mock backend - perfect for testing without installing SpacetimeDB.

### Option 2: Docker (Full Environment)
```bash
# Make sure Docker is installed, then:
docker-compose up
```

### Option 3: Local Installation
**Prerequisites:**
- Node.js 18+
- [SpacetimeDB CLI](https://spacetimedb.com/install)

1. **Start the backend:**
   ```bash
   cd backend
   spacetime dev
   ```

2. **In a new terminal, start the frontend:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

3. **Open two browser windows** at http://localhost:5173
   - Player 1: Enter name, click "Create New Game"
   - Player 2: Enter name, click "Join Game" (enter game ID)

## 🎯 How to Play

1. **Blue player** starts at top-left, **Red player** at bottom-right
2. On your turn:
   - Click your unit to select it
   - **Green tiles** = valid moves
   - **Red tiles** = valid attacks
   - Move then attack, or just attack
3. **Terrain matters:**
   - Plains (P): No defense
   - Forest (F): -10 damage taken
   - Mountain (M): -20 damage taken
4. Win by reducing enemy to 0 HP!

## 📁 Project Structure

```
fight-or-die/
├── backend/          # SpacetimeDB game logic (Rust)
│   └── src/
│       └── lib.rs   # Game tables, reducers, combat logic
├── frontend/         # TypeScript client
│   ├── src/
│   │   ├── main.ts          # Game client
│   │   ├── components/      # UI components
│   │   ├── services/        # SpacetimeDB connection
│   │   └── types/           # TypeScript types
│   └── index.html
└── combat-design.md  # Detailed game design

```

## 🛠️ Development

### Generate TypeScript Bindings
After modifying the backend:
```bash
spacetime generate --lang typescript --out-dir frontend/src/module_bindings --project-path backend
```

### Backend (SpacetimeDB)
- Tables: Player, Game, Board, Unit, GameAction
- Reducers: create_player, create_game, join_game, move_unit, attack_unit, end_turn

### Frontend (TypeScript)
- Real-time subscriptions to game state
- Canvas-based game board rendering
- Turn-based input handling

## 🔧 Troubleshooting

- **Can't connect**: Make sure `spacetime dev` is running
- **No games showing**: Create a new game first
- **Can't move/attack**: Check if it's your turn
- **Unit won't move**: Check movement points remaining

## 🚧 Future Enhancements

- Multiple units per player
- Different unit types
- Larger maps
- Counter-attacks
- Special abilities
- Matchmaking system

---

Built with [SpacetimeDB](https://spacetimedb.com) - the database built for multiplayer games!