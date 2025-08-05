# Fight or Die - Frontend

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Make sure the backend is running:
   ```bash
   cd ../backend
   spacetime dev
   ```

3. Generate TypeScript bindings (from project root):
   ```bash
   cd ..
   spacetime generate --lang typescript --out-dir frontend/src/module_bindings --project-path backend
   ```

4. Start the frontend dev server:
   ```bash
   npm run dev
   ```

5. Open http://localhost:5173 in your browser

## How to Play

1. Enter your username and click "Join Battle"
2. Create a new game or join an existing one
3. Player 1 (blue) starts at top-left, Player 2 (red) at bottom-right
4. On your turn:
   - Click your unit to select it
   - Green tiles = valid moves (up to 3 tiles)
   - Red tiles = valid attacks (adjacent enemies)
   - Click a green tile to move
   - Click a red tile to attack
5. After moving, you can attack if an enemy is adjacent
6. Click "End Turn" when done
7. Reduce enemy HP to 0 to win!

## Terrain Effects
- **P**lains: No defense (30 damage)
- **F**orest: 1 defense (20 damage)
- **M**ountain: 2 defense (10 damage)