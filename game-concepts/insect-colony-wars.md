# Insect Colony Wars - Game Design Document

## 🐜 Core Concept
A real-time strategy MMO where players control ant colonies, gathering resources, expanding territory, and waging underground wars for supremacy.

## 🎮 Core Gameplay Loop

### 1. **Establish** (Early Game - 5 mins)
- Start with a queen and 5 workers
- Dig initial chambers
- Find first food source
- Lay first eggs

### 2. **Expand** (Mid Game - 15 mins)
- Branch tunnel networks
- Discover resource nodes
- Breed specialized ants
- Scout enemy colonies

### 3. **Dominate** (Late Game - 20+ mins)
- Wage territorial wars
- Raid enemy supplies
- Control key resources
- Achieve victory conditions

## 🏗️ Game Systems

### Resources
1. **Food** 🍃
   - Required for all units
   - Found on surface
   - Spoils over time
   - Must be stored underground

2. **Minerals** 💎
   - Used for chamber upgrades
   - Found deeper underground
   - Limited deposits
   - Creates conflict points

3. **Larvae** 🥚
   - Produced by queen
   - Requires food
   - Can be specialized
   - Your population cap

### Ant Types
1. **Queen** 👑
   - One per colony
   - Produces eggs
   - Must be protected
   - Can relocate if threatened

2. **Workers** 🔨
   - Gather resources
   - Dig tunnels
   - Build chambers
   - Maintain colony

3. **Soldiers** ⚔️
   - Combat units
   - Patrol territory
   - Raid enemies
   - Defend queen

4. **Scouts** 👁️
   - Fast movement
   - Explore map
   - Mark resources
   - Spy on enemies

5. **Majors** 🛡️ (Late game)
   - Tank units
   - Slow but strong
   - Break enemy defenses
   - Guard key points

### Territory System
- **Pheromone Trails**: Mark paths for workers
- **Territory Markers**: Claim resource areas
- **Tunnel Network**: Underground connections
- **Surface Access**: Strategic entry/exit points

### Combat Mechanics
- **Numbers Advantage**: More ants = stronger
- **Positioning**: Surround for bonus damage
- **Tunnel Warfare**: Collapse tunnels on enemies
- **Resource Raiding**: Steal enemy supplies

## 🗺️ Map Design

### Three Layers
1. **Surface**
   - Food sources
   - Weather effects
   - Predator threats
   - Entry points

2. **Underground**
   - Main tunnel networks
   - Colony chambers
   - Resource deposits
   - Combat zones

3. **Deep Earth**
   - Rare minerals
   - Ancient chambers
   - Boss creatures
   - End-game content

### Dynamic World
- Seasons affect food availability
- Rain floods tunnels
- Predators attack surface workers
- Resources deplete and respawn

## 🏆 Victory Conditions

### Domination
- Control 60% of map
- Eliminate all queens
- Time limit: 45 mins

### Economic
- Gather 10,000 resources
- Build mega-colony
- Trade supremacy

### Survival
- Survive wave events
- Protect the queen
- Last colony standing

## 🔄 Multiplayer Design

### Server Architecture
- 10-100 players per world
- Persistent colonies
- Async gameplay supported
- Alliance system

### Session Types
1. **Quick Match** (20-30 mins)
   - 4-8 players
   - Small map
   - Fast resources

2. **Standard** (45-60 mins)
   - 10-20 players
   - Medium map
   - Normal pace

3. **Mega Colony** (2-4 hours)
   - 50-100 players
   - Huge map
   - Alliance warfare

## 📊 Technical Considerations

### SpacetimeDB Tables
```rust
Colony { id, player_id, queen_pos, food, minerals }
Ant { id, colony_id, type, position, health, task }
Tunnel { id, colony_id, start_pos, end_pos }
Chamber { id, colony_id, type, position, level }
Resource { id, type, position, amount }
Pheromone { id, colony_id, position, type, strength }
```

### Performance Targets
- 1000+ ants per colony
- 100+ colonies per server
- 60 FPS with full view
- < 100ms action latency

### Scalability Solutions
- Area of Interest (AOI) system
- Ant batching for same tasks
- Simplified pathfinding
- Level-of-detail rendering

## 🎨 Visual Style
- Top-down 2D view
- Cross-section underground view
- Minimalist ant sprites
- Pheromone trail effects
- Digging animations

## 🎵 Audio Design
- Ambient colony sounds
- Digging/scratching effects
- Battle chittering
- Queen commands
- Seasonal ambience

## 💰 Monetization (Optional)
- Cosmetic ant skins
- Colony banners
- Speed boosts (PvE only)
- Additional maps
- No pay-to-win

## 🚀 Development Phases

### Phase 1: Core Colony (4 weeks)
- Basic ants (Queen, Worker)
- Simple tunneling
- Food gathering
- Basic UI

### Phase 2: Warfare (4 weeks)
- Soldier ants
- Combat system
- Territory claiming
- Multiplayer sync

### Phase 3: Full Systems (6 weeks)
- All ant types
- Resource variety
- Chamber upgrades
- Alliance system

### Phase 4: Polish (4 weeks)
- Balance tuning
- Visual effects
- Sound design
- Tutorial system

## 🤔 Open Design Questions

1. **Vertical vs Horizontal**: Should colonies expand more up/down or sideways?
2. **PvE Elements**: How much environmental threat vs player threat?
3. **Persistence**: Should colonies survive between sessions?
4. **Scale**: Maximum ants per colony for performance?
5. **Accessibility**: How to make RTS approachable for new players?

---

*"From tiny ants, mighty colonies grow"*