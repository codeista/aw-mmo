# SpacetimeDB MMO Game Designs

This repository contains multiple game design experiments using SpacetimeDB as the backend.

## 🎮 Game Branches

### 1. Human War Tactics (`human-war-tactics` branch)
- **Genre**: Turn-based tactical combat
- **Inspiration**: Advance Wars, Fire Emblem
- **Current State**: Phase 1 Complete (basic combat)
- **Key Features**: 
  - Grid-based combat
  - Terrain effects
  - Unit types (planned)
  - Strategic positioning

### 2. Insect Colony Wars (`insect-colony-wars` branch) [PLANNED]
- **Genre**: Real-time strategy MMO
- **Inspiration**: StarCraft, Age of Empires, SimAnt
- **Key Features**:
  - Resource gathering (food, minerals)
  - Colony building
  - Unit spawning/breeding
  - Territory control
  - Pheromone trails
  - Underground tunnel networks
  - Multiple ant types (workers, soldiers, scouts)
  - Queen mechanics

### 3. [Future Game] (`branch-name`) [TEMPLATE]
- **Genre**: 
- **Inspiration**: 
- **Key Features**:

## 🔄 Branch Structure

```
master
├── human-war-tactics (Turn-based tactics)
├── insect-colony-wars (RTS MMO)
└── [future-game]
```

## 🚀 Starting a New Game Design

1. Create a new branch from master:
   ```bash
   git checkout master
   git checkout -b game-name
   ```

2. Create game-specific structure:
   ```
   game-name/
   ├── design-doc.md
   ├── backend/
   ├── frontend/
   └── assets/
   ```

3. Update this file with the new game entry

4. Push the branch:
   ```bash
   git push -u origin game-name
   ```

## 🎯 Shared Technologies

All games use:
- **Backend**: SpacetimeDB (Rust/C#)
- **Frontend**: TypeScript
- **Deployment**: Docker/Mock modes
- **Architecture**: Clean separation of concerns

## 📊 Comparison Matrix

| Feature | Human War Tactics | Insect Colony Wars |
|---------|-------------------|-------------------|
| Genre | Turn-based | Real-time |
| Players | 2-4 | 10-100 |
| Session | 5-15 min | 30-60 min |
| Units | 1-10 | 100-1000 |
| Resources | None | Multiple |
| Building | No | Yes |
| Territory | Fixed grid | Expandable |

## 🤝 Contributing

1. Pick a game branch
2. Follow the agent framework in `.agents/`
3. Keep shared code in master
4. Game-specific code in branches