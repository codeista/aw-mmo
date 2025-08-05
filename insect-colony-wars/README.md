# Insect Colony Wars

A real-time strategy MMO where players control ant colonies, gathering resources and waging underground wars. Built with SpacetimeDB and TypeScript.

## 🐜 Game Overview

Control your ant colony in a persistent underground world. Gather resources, expand your tunnel network, breed specialized ant units, and compete with other colonies for dominance.

### Key Features
- **5 Ant Types**: Queen, Worker, Soldier, Scout, Major - each with unique stats and roles
- **3D Underground System**: Build tunnels and chambers in a true 3D space
- **Resource Management**: Gather food, minerals, and manage larvae population
- **Real-time Combat**: Command your ants in battles against rival colonies
- **Pheromone System**: Leave trails to guide your colony's behavior
- **Chamber Building**: Construct specialized rooms (Nursery, Storage, Barracks, Throne Room)

## 🎮 Gameplay Mechanics

### Ant Types
- **Queen** (200 HP, 0.5 speed): The heart of your colony, lays eggs
- **Worker** (50 HP, 2.0 speed): Gathers resources, builds tunnels
- **Soldier** (100 HP, 1.5 speed): Main combat unit
- **Scout** (30 HP, 3.0 speed): Fast exploration unit
- **Major** (150 HP, 1.0 speed): Heavy assault unit

### Resources
- **Food**: Basic resource for spawning ants
- **Minerals**: Advanced resource for buildings and Major ants
- **Larvae**: Population cap, produced by Queen

### Chamber Types
- **Throne Room**: Houses the Queen
- **Nursery**: Increases larvae production
- **Storage**: Increases resource capacity
- **Barracks**: Enables faster military unit production

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- SpacetimeDB CLI (optional - mock mode available)

### Installation

1. Install dependencies:
```bash
cd frontend
npm install
```

2. Run the game:

**With SpacetimeDB:**
```bash
# Terminal 1: Backend
cd backend
spacetime dev

# Terminal 2: Frontend
cd frontend
npm run dev
```

**Mock Mode (no SpacetimeDB required):**
```bash
cd frontend
npm run dev:mock
```

## 🎯 How to Play

1. **Start Your Colony**: Create a new colony at a strategic location
2. **Gather Resources**: Send workers to nearby resource nodes
3. **Expand Underground**: Dig tunnels and build chambers
4. **Build Your Army**: Spawn soldiers and scouts for defense and offense
5. **Wage War**: Attack enemy colonies and defend your territory

### Controls
- Click on ants to select them
- Right-click to command movement
- Use the UI buttons to spawn units and build structures
- Drag to pan the underground view
- Scroll to zoom in/out

## 🛠️ Development

### Project Structure
```
insect-colony-wars/
├── backend/           # SpacetimeDB Rust module
│   ├── src/
│   │   └── lib.rs    # Game logic (680 lines)
│   └── Cargo.toml
├── frontend/          # TypeScript client
│   ├── src/
│   │   ├── main.ts
│   │   ├── services/
│   │   └── components/
│   └── package.json
└── README.md
```

### Backend Tables
- `Player`: User accounts and stats
- `Colony`: Colony state and resources
- `Ant`: Individual ant units
- `Tunnel`: Underground pathways
- `Chamber`: Specialized rooms
- `ResourceNode`: Harvestable resources
- `Pheromone`: Navigation markers
- `Battle`: Combat events

### Key Reducers
- `create_colony`: Initialize new colony with queen
- `spawn_ant`: Create new ant units
- `command_ants`: Direct ant movement
- `dig_tunnel`: Create underground paths
- `build_chamber`: Construct specialized rooms
- `deposit_resources`: Store gathered resources
- `attack_target`: Initiate combat

## 🎨 Technical Features

- Real-time synchronization with SpacetimeDB
- 3D spatial queries for underground navigation
- Efficient colony-wide updates
- Mock service for offline development
- Cross-tab synchronization in mock mode

## 🐛 Known Issues

- Mock mode uses simplified pathfinding
- Some visual effects not yet implemented
- Performance optimization needed for large colonies

## 📈 Future Enhancements

- Surface raids and weather effects
- Specialized ant evolution paths
- Alliance and diplomacy systems
- Seasonal events and challenges
- Advanced pheromone behaviors
- Queen abilities and upgrades

## 🤝 Contributing

This is part of the aw-mmo experimental game collection. Feel free to fork and experiment!

---

Built with SpacetimeDB and TypeScript 🐜⚔️