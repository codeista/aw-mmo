# Fight or Die - Combat Design Document

## 🎮 Core Concept
A turn-based tactical combat game inspired by Advance Wars where players command units on a battlefield.

## ⚔️ Combat System v1.0 - MVP

### Game Setup
```
Board: 5x5 grid
Players: 2 
Units per player: 1 (Phase 1)
Starting positions: Opposite corners
```

### Unit Stats
```
Health Points (HP): 100
Movement Points: 3 tiles per turn
Attack Range: 1 tile (adjacent only)
Base Attack Damage: 30
```

### Terrain Types
```
Plains: 0 defense bonus
Forest: 1 defense bonus (-10 damage taken)
Mountain: 2 defense bonus (-20 damage taken)
```

### Turn Structure
1. **Start of Turn**
   - Unit gets 3 movement points
   - Unit can act

2. **Action Phase**
   - Move up to 3 tiles (costs 1 point per tile)
   - Can attack AFTER moving if adjacent to enemy
   - Can attack without moving
   - Turn ends after attack OR using all movement

3. **End of Turn**
   - Pass to other player

### Combat Mechanics

#### Movement
- Costs 1 movement point per tile
- Can move in 4 directions (no diagonal)
- Can't move through enemy units
- Can't end on same tile as enemy

#### Attack
- Range: Adjacent tiles only (4 directions)
- Can attack after moving IF you have enemy in range
- Damage: 30 - (target's terrain defense × 10)
- One attack per turn

### Damage Calculation
```
Final Damage = 30 - (Terrain Defense × 10)

Examples:
- Target on Plains: 30 damage
- Target on Forest: 20 damage  
- Target on Mountain: 10 damage
```

### Strategic Decisions

**Movement Strategy:**
- Rush to good terrain before enemy
- Use all 3 movement to attack and retreat
- Position for next turn's attack

**Terrain Control:**
- Mountains = best defense but slow to reach
- Forests = balanced defense and accessibility  
- Control center tiles for map dominance

**Combat Tactics:**
- Attack from plains (you take more damage if countered later)
- Defend on mountains (force enemy to waste movement)
- Use movement to hit and run

### Match Flow Example
```
Turn 1 - Alice:
- Moves 3 tiles toward center forest
- Ends turn on forest tile

Turn 1 - Bob:  
- Moves 3 tiles toward Alice
- Can't reach for attack yet

Turn 2 - Alice:
- Moves 2 tiles to adjacent to Bob
- Attacks Bob on plains (30 damage)
- Bob HP: 100 → 70

Turn 2 - Bob:
- Already adjacent to Alice
- Attacks Alice on forest (20 damage)  
- Alice HP: 100 → 80

Current State:
- Alice: 80 HP on Forest
- Bob: 70 HP on Plains
```

### Victory Condition
- Reduce enemy unit to 0 HP
- Last unit standing wins
- Quick matches (5-10 turns)

## 🎯 Phase 1 Implementation Priority

### Must Have:
1. 5x5 grid board generation
2. Terrain system (Plains, Forest, Mountain)
3. Unit placement and movement
4. Movement validation (3 tiles max)
5. Attack range checking (adjacent only)
6. Damage calculation with terrain defense
7. Turn management
8. Victory condition

### Nice to Have:
1. Visual terrain indicators
2. Movement path preview
3. Attack preview (showing potential damage)
4. Turn timer

### Save for Phase 2:
1. Multiple units per player
2. Different unit types
3. Counter-attacks
4. Special abilities
5. Larger maps
6. More terrain types

## 🔮 Future Expansion Ideas

### Phase 2:
- Special abilities (unique per player?)
- Items/power-ups that spawn
- Environmental effects
- Team modes (2v2)

### Phase 3:
- Character classes (Tank, DPS, Support)
- Progression system
- Tournament brackets
- Replay system

## 💭 Design Questions to Consider

1. **Randomness**: How much RNG is fun?
   - Current: Damage ranges (15-25)
   - Alternative: Fixed damage, random crits?

2. **Match Length**: How long should matches last?
   - Current estimate: 10-20 turns
   - Too long? Add sudden death?

3. **Player Count**: Best experience?
   - 2 players: Pure duel
   - 3 players: Kingmaker problem
   - 4 players: Alliances?

4. **Comeback Mechanics**: Any needed?
   - Revenge bonus when low HP?
   - Underdog damage boost?

---

Would you like to adjust any of these mechanics before we implement?
