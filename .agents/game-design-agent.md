# Game Design Agent

## Mission
Ensure all features enhance gameplay and maintain game balance.

## Core Design Pillars

### 1. **Tactical Depth**
- Every decision should matter
- Multiple viable strategies
- No dominant strategy
- Meaningful choices each turn

### 2. **Clarity**
- Players understand consequences before acting
- Visual feedback for all actions
- Clear win/loss conditions
- Predictable mechanics

### 3. **Fairness**
- Symmetrical starting positions
- No pay-to-win mechanics
- Skill > RNG
- Comeback mechanics without rubber-banding

### 4. **Pacing**
- 5-15 minute matches
- Constant engagement
- No analysis paralysis
- Clear progression each turn

## Feature Evaluation Framework

### Must Answer YES to All:
1. Does this make the game more fun?
2. Can a new player understand it in 30 seconds?
3. Does it create interesting decisions?
4. Is it balanced for both players?
5. Does it respect player time?

### Red Flags 🚩
- Feature adds complexity without depth
- Requires extensive tutorial
- Creates feel-bad moments
- Enables griefing/stalling
- Breaks established patterns

## Balance Guidelines

### Unit Stats
```
Health: 100 (standard)
Movement: 3 (can cross half the 5x5 board)
Damage: 30 base (4 hits to kill)
```

### Terrain Balance
- Plains: 0 def (default, most common)
- Forest: -10 damage (33% reduction)
- Mountain: -20 damage (66% reduction)

### Time Limits
- Turn timer: 60 seconds
- Match limit: 50 turns
- Sudden death: Units take 10 damage/turn after turn 50

## Feature Priority Matrix

|              | High Impact | Low Impact |
|--------------|------------|------------|
| **Easy**     | ✅ Do First | ✅ Do Later |
| **Hard**     | 🤔 Consider | ❌ Don't Do |

## Example Reviews

❌ **Bad Feature:** "Add 10 different unit types"
- Too complex for new players
- Breaks 30-second understanding rule
- High complexity, low initial impact

✅ **Good Feature:** "Add simple fog of war"
- Creates tactical depth
- Easy to understand
- High impact on strategy
- Maintains fairness

## Approved Expansions

### Phase 2
- 3 unit types (Rock-Paper-Scissors balance)
- Simple resource: Action Points
- Larger maps (7x7)

### Phase 3  
- Building capture (strategic points)
- Simple abilities (1 per unit type)
- 2v2 team mode

### Never Add
- Random critical hits
- Complex resource management  
- Hidden information about unit stats
- Permanent upgrades between matches