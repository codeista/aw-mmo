# Insect Colony Wars

A roguelike real-time strategy MMO where players control ant colonies in a harsh survival environment. Your goal: keep your colony alive long enough to produce a young queen that matures and flies away to safety. Built with SpacetimeDB and TypeScript.

## 🐜 Game Overview

Start as a queen ant landing in a dangerous world filled with predators, hostile colonies, and environmental threats. Build your colony while managing complex resource economies and the critical queen jelly that keeps your ants alive. This is a roguelike survival game where each successful cycle makes your next queen stronger.

### Key Features
- **Roguelike Progression**: Each successful young queen that escapes carries bonus traits to the next generation
- **Trait System**: All ants (except base queens and royal workers) can have special traits like acid attacks, speed boosts, or pheromone abilities
- **Realistic Ant Lifecycle**: Queens spawn larvae that must be fed queen jelly to transform into specialized ants
- **Queen Jelly Economy**: Critical resource that depletes over time and must be constantly produced
- **7 Ant Types**: Queen, Young Queen, Worker, Royal Worker, Soldier, Scout, Major - each with unique roles
- **Surface Ecosystem**: Prey animals, predators, obstacles, and resources create a living world
- **Population Caps**: Colony size limited by infrastructure - build barracks and chambers to support more ants
- **Maturation Timer**: Young queens must survive long enough to mature and fly away
- **Autonomous AI**: Colonies can self-organize with intelligent task prioritization
- **Dynamic World**: Each respawn regenerates the map with new challenges

## 🎮 Gameplay Mechanics

### Energy System
- **Energy Depletion**: Ants lose energy over time (faster on surface)
- **Auto-Return**: Ants automatically return to burrow when energy < 20%
- **Recovery**: Ants regain energy when resting in burrows
- **Death**: Ants die if energy reaches 0

### Ant Types & Lifecycle
- **Queen** (200 HP, 0.5 speed): Powerful bite, spawns larvae, builds initial burrow
- **Young Queen** (100 HP, 2.0 speed): Royal offspring that matures over time then flies away
- **Larvae**: Baby ants that must be fed jelly to transform into other types
- **Worker** (50 HP, 2.0 speed): Gathers resources, builds chambers, can dig for underground resources
- **Royal Worker** (50 HP, 1.0 speed): Produces queen jelly, never leaves burrow
- **Soldier** (100 HP, 1.5 speed): Main combat unit, can have traits
- **Scout** (30 HP, 3.0 speed): Fast exploration, discovers resources, can have traits
- **Major** (150 HP, 1.0 speed): Heavy assault unit, can have traits

### Trait System
- **Acid**: Deals damage over time to enemies (visual: green droplets)
- **Speed**: +50% movement speed (visual: blue motion lines)
- **Strength**: +50% damage and carrying capacity (visual: red pulsing aura)
- **Pheromone**: Leaves trails that disarm enemies and trick scouts/defenders (visual: purple clouds)
- Traits are inherited from parent queens and randomly assigned to new units

### Visual Features
- **Animated Ant Sprites**: 
  - Realistic 3-segment bodies with 6 animated legs
  - Walking animations with alternating tripod gait
  - Antennae that wave, heads that bob
  - Soldiers/Majors have animated mandibles
  - Size and color variations by ant type
- **Enhanced Underground View**:
  - 2.5D carved chamber effect with depth layers
  - Textured soil background with depth gradient
  - Automatic tunnel connections between chambers
  - Chambers glow based on their type
  - Completely separate from surface view

### Resources & Environment
- **Surface Resources**:
  - **Food**: Found from plants and hunted prey animals
  - Only visible on surface view
- **Underground Resources**:
  - **Water**: Found by digging (30% chance)
  - **Minerals**: Found by digging (30% chance)
  - Only visible in underground view
- **Queen Jelly**: Vital resource consumed by all ants, produced by royal workers
- **Larvae**: Population potential, spawned by queens

### Surface Ecosystem
- **Prey Animals**: Aphids, caterpillars, termites that can be hunted for food
- **Predators**: Spiders, birds, beetles that hunt your ants
- **Obstacles**: Rocks, logs, plants, leaves that block movement
- **Fog of War**: Resources hidden until discovered by scouts

### Underground System
- **Digging Mechanics**: Workers can dig to find water/minerals (3 second dig time)
- **Chamber Network**: Connected by automatic tunnels
- **Resource Nodes**: Permanent water/mineral deposits created by digging
- **Separate View**: Completely different from surface with its own resources

### Queen Jelly Mechanics
- All ants consume jelly continuously (0.01-0.05 per tick based on type)
- Queens spawn larvae for 0.5 jelly
- Feeding larvae costs 2-5 jelly depending on target ant type
- Royal workers produce jelly from food/minerals in burrows
- Colony dies when jelly runs out!

### Chamber Types & Population
- **Burrow**: Entry point and resource outpost (provides 10 population)
- **Throne Room**: Houses the Queen (required for young queen production)
- **Royal Chamber**: Required for producing young queens
- **Nursery**: Larvae development (+5 population)
- **Storage**: Increases resource capacity (+5 population)
- **Barracks**: Military operations (+20 population)

### Population System
- Unit costs: Worker/Scout (1), Soldier (2), Royal/Major (5), Young Queen (10)
- Build more chambers to increase population capacity
- Strategic planning required to balance infrastructure and army size

### Hive Mind Commands
- **Gather All**: All workers focus on resource collection
- **Defend Queen**: All units protect the queen
- **Hunt Mode**: Send assault force to target location

### Victory Condition
- Produce a young queen (requires Royal Chamber)
- Keep the colony alive while she matures (timer shown in UI)
- When mature, she automatically flies away to safety
- Next game starts with her bonus trait!

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
npm run dev
# Or navigate to http://localhost:3000?mock
```

## 🎯 How to Play

1. **Spawn as Queen**: Click on map to place your queen with 20 starting jelly
2. **Build Initial Burrow**: Queen spawns a larvae (0.5 jelly)
3. **Create First Worker**: Feed larva 2 jelly to transform into worker
4. **Scout for Resources**: Workers explore to find food/minerals (costs jelly to move!)
5. **Establish Outposts**: Build burrows near resources
6. **Create Royal Workers**: Essential for jelly production (5 jelly to create)
7. **Expand Underground**: Workers build chambers for your growing colony
8. **Toggle Views**: Switch between surface and underground views

### Controls
- **Left Click**: Select units or click any game object for information
- **Right Click**: Command movement or confirm task location
- **Shift+Click**: Add to selection
- **Ctrl+A**: Select all units
- **ESC**: Clear selection
- **Mouse Wheel**: Zoom in/out
- **Drag**: Pan camera
- **Tab**: Cycle through action categories
- **Shift+D**: Toggle debug overlay (shows unit influence, resource discovery)
- **Surface/Underground Buttons**: Switch view layers

### UI Features
- **Compact Top Bar**: Colony info, resources, and view controls
- **Expandable Left Panel**: 
  - Colony Overview with spawn toggles
  - Production rates display
  - Construction options
  - Tasks & Units with ant selection
- **Unit Info Window**: Detailed ant stats when selected
- **Command Queue**: Automated task management with priorities

### Individual Unit Control
- Select single unit to see task panel
- Available tasks vary by ant type:
  - **🍎 Gather Food**: Auto-finds nearest discovered resource
  - **🔍 Scout Area**: Explores in random direction
  - **🛡️ Guard Position**: Defends current location
  - **⛏️ Dig Here**: Workers dig for underground resources
  - **🎯 Hunt Prey**: Attack nearest prey animal
  - **💤 Stand Idle**: Stop current task

### Clickable Objects
- **Enemy Ants**: Shows type, health, task, traits
- **Resources**: Shows type, amount, regeneration, discovery status
- **Predators**: Shows type, health, damage, hunting status
- **Prey**: Shows type, health, food value, speed
- **Chambers**: Shows type, colony, level, capacity

### Strategic Tips
- Population management is key - plan your infrastructure before spawning units
- Rush for royal workers to maintain jelly production
- Build a Royal Chamber early to start young queen production
- Use pheromone trait ants to infiltrate enemy colonies
- Click on any game object to see detailed information
- Watch the maturation timer - protect your young queen at all costs
- Each successful escape makes your next generation stronger

## 🛠️ Development

### Project Structure
```
insect-colony-wars/
├── backend/           # SpacetimeDB Rust module
│   ├── src/
│   │   └── lib.rs    # Complete game logic
│   └── Cargo.toml
├── frontend/          # TypeScript client
│   ├── src/
│   │   ├── main.ts   # Game client with view system
│   │   └── services/
│   │       └── spacetime-mock-rts.ts  # Mock service
│   └── package.json
└── README.md
```

### Backend Features
- Complete ant lifecycle system
- Jelly production and consumption
- Fog of war resource discovery
- Multi-level Z-axis support
- Autonomous AI colony management

### Frontend Features
- Surface/Underground view toggle with smooth transitions
- Fog of war rendering
- Depth-based visual effects
- Real-time unit selection and commands
- Cross-tab synchronization in mock mode

## 🎨 Visual Features

- **Surface View**: Green terrain with burrow entrances
- **Underground View**: Dark caverns with chambers
- **Fog of War**: Unexplored areas shrouded in darkness
- **Depth Effects**: Ants fade with distance from camera
- **Pulsing Burrows**: Animated entrance indicators

## 🐛 Current State

The game is fully playable with:
- Complete roguelike progression system
- Trait inheritance and combat effects
- Population cap infrastructure system
- Young queen maturation mechanics
- Dynamic world regeneration on respawn
- Surface ecosystem with prey and predators
- Clickable objects for detailed information
- Compact expandable UI with command queue
- Energy system forcing strategic surface/underground balance
- Unit info windows with direct control
- Spawn toggles for predators/prey
- Debug overlay (Shift+D) showing unit influence

## 📈 Planned Features

- Individual ant movement with formations
- Increased predator aggression during maturation
- Environmental threats (weather, floods, poison)
- Hostile ant colony AI opponents
- Territory control mechanics
- Enhanced trait visual effects
- Success metrics and scoring system
- Multiplayer colony alliances

## 🤝 Contributing

This is part of the aw-mmo experimental game collection. Feel free to fork and experiment!

---

Built with SpacetimeDB and TypeScript 🐜⚔️👑