# Insect Colony Wars - Game Flow Guide

## 🎮 Game Overview
A roguelike RTS where you control an ant colony. Your goal: produce a young queen that matures and flies away to safety before your colony dies.

## 🐜 Game Start Flow

### 1. Initial Spawn (Automatic)
- **What happens**: Game auto-spawns your first queen on the surface
- **Location**: Random position on surface (z = 0)
- **Resources**: Colony starts with 20 queen jelly
- **View**: Game starts in underground view

### 2. Queen Digs Burrow (5 seconds)
- **Action**: Queen automatically starts digging when spawned
- **Visual**: Queen shows "Building" status
- **Duration**: 5 seconds
- **Result**: Creates:
  - Surface entrance at z = -1 (tunnel entrance)
  - Burrow chamber at z = -10 (deep underground)
  - Vertical tunnel connecting them

### 3. Queen Moves Underground
- **Location**: Queen moves to z = -10 (burrow chamber)
- **Action**: Queen lays first egg automatically
- **Cost**: 0.5 queen jelly (now at 19.5)
- **Visual**: Egg appears in burrow chamber
- **Auto-Discovery**: 3 nearby surface resources are discovered

### 4. Automated Colony Start
- **First Egg**: Automatically transforms to worker after 2 seconds
- **Worker Behavior**: Automatically assigned to gather resources
- **Resource Discovery**: Colony starts with 3 discovered food resources nearby

## 🎯 Basic Actions

### Automated Colony Building
The colony AI automatically builds to this composition:
1. **2 Workers** - For resource gathering
2. **1 Scout** - For exploration and threat detection
3. **2 Soldiers** - For defense and hunting
4. **1 Royal Worker** - For jelly production (after basics)

### Manual Control (Optional)
1. **Select any ant** to see available actions
2. **Override AI** by assigning specific tasks
3. **Build chambers** manually with workers

### Resource Gathering Flow
**Automated**:
- Workers automatically gather from discovered resources
- Scouts discover new resources while exploring
- Workers navigate through burrows automatically

**Manual**:
1. Select worker ant
2. Click "🍎 Gather Food" button
3. Worker automatically:
   - Moves to burrow chamber (z = -10)
   - Navigates to entrance (z = -1)
   - Exits to surface (z = 0)
   - Gathers from nearest resource
   - Returns through same path

## 📍 View System

### Surface View
- **Shows**: 
  - Resources (food on plants)
  - Prey (aphids, caterpillars)
  - Predators (spiders, birds)
  - Burrow entrances (dark holes)
- **Doesn't show**: Underground ants or chambers

### Underground View  
- **Shows**:
  - All chambers
  - Underground ants
  - Larvae/eggs
  - Tunnel connections
- **Doesn't show**: Surface resources or creatures

## 🏗️ Building System

### Available Structures
1. **Burrow** (Queen only) - Entry/exit point + 10 population
2. **Storage** (Workers) - Stores resources + 5 population
3. **Nursery** (Workers) - Larvae development + 5 population
4. **Barracks** (Workers) - Military operations + 20 population
5. **Throne Room** (Workers) - Required for queen
6. **Royal Chamber** (Workers) - Required for young queens

### Building Process
1. Select a worker
2. Click chamber type button
3. Worker builds at current location (underground)

## 🎮 Controls

### Basic Controls
- **Left Click**: Select units/objects
- **Right Click**: Move selected units
- **Mouse Wheel**: Zoom in/out
- **Drag**: Pan camera
- **Tab**: Switch between surface/underground views

### Unit Selection
- Click unit to select
- Shift+Click to add to selection
- Ctrl+A to select all units
- ESC to clear selection

### Task Assignment
1. Select an ant
2. Task panel appears
3. Click task button to assign

## 🐜 Ant Types & Roles

### Queen (Start Unit)
- **Role**: Digs initial burrow, lays eggs
- **Health**: 200 HP
- **Location**: Stays underground unless defending

### Worker (Basic Unit)
- **Role**: Gather resources, build chambers
- **Health**: 50 HP
- **Tasks**: Gather, Scout, Dig, Build

### Royal Worker (Jelly Producer)
- **Role**: Produces queen jelly from resources
- **Health**: 50 HP
- **Location**: Never leaves burrow

### Soldier (Combat Unit)
- **Role**: Defend colony, hunt prey
- **Health**: 100 HP
- **Can have traits**: Acid, Speed, Strength

### Scout (Explorer)
- **Role**: Discover new resources
- **Health**: 30 HP
- **Speed**: Fastest unit

### Major (Heavy Combat)
- **Role**: Elite defender
- **Health**: 150 HP
- **Can have traits**: Special abilities

### Young Queen (Victory Unit)
- **Role**: Matures and flies away to win
- **Health**: 100 HP
- **Requirement**: Royal Chamber to create

## 🎯 Victory Condition

1. Build a Royal Chamber
2. Create a Young Queen (costs 5 jelly + 10 population)
3. Protect her while she matures (timer shown in UI)
4. When mature, she flies away = Victory!
5. Next game starts with inherited trait

## 🎮 Combat System

### Group Hunting
- Large prey require multiple ants to defeat
- Scouts detect prey and coordinate group hunts
- Group combat bonuses:
  - +20% damage per additional ant
  - +50% damage when prey is "pinned" (surrounded)
  - +50% food bonus for successful group hunts

### Health & Wounding
- Ants have health bars (green when healthy, yellow when wounded)
- 10% chance to be wounded in combat
- Wounded ants:
  - Move at 50% speed
  - Show red overlay with pulse effect
  - Auto-retreat to burrow when health < 30%
  - Heal slowly when underground

## ⚠️ Known Limitations

### Visual Clarity
- Tunnel connections between chambers not clearly visible
- Task status indicators could be improved
- Chamber larvae count only visible when clicked

## 💡 Tips for Testing

### Console Commands
- `showGameState()` - View current game state
- `game.showAnts()` - List all ants with locations
- `game.showChambers()` - List all chambers
- `game.showColonies()` - List all colonies
- `clearGameData()` - Reset game data

### Debug Mode
- Press Shift+D to toggle debug overlay
- Shows unit influence and resource discovery

## 🔧 Technical Notes

### Z-Levels
- z = 0: Surface level
- z = -1: Burrow entrance (just below surface)
- z = -5 to -10: Underground chambers
- z = -10: Default chamber depth

### Movement States
- **Idle**: Not moving
- **Exploring**: Moving to location
- **Gathering**: Collecting resources
- **Returning**: Bringing resources back
- **Entering**: Going into burrow
- **Exiting**: Leaving burrow
- **Building**: Constructing chamber
- **Fighting**: In combat

### Resource System
- **Queen Jelly**: Vital resource all ants consume
- **Food**: Found on surface from plants
- **Water**: Found underground by digging (30% chance)
- **Minerals**: Found underground by digging (30% chance)
- **Larvae**: Population potential