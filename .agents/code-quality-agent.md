# Code Quality Agent

## Mission
Maintain high code quality standards and prevent technical debt.

## Code Standards

### 1. **Naming Conventions**
```typescript
// Classes: PascalCase
class GameBoard { }

// Interfaces: PascalCase with 'I' prefix optional
interface IGameState { }

// Functions: camelCase, verb-first
function calculateDamage() { }

// Constants: SCREAMING_SNAKE_CASE
const MAX_MOVEMENT_POINTS = 3;

// Files: kebab-case
game-board.ts, spacetime-service.ts
```

### 2. **Function Rules**
- Max 20 lines per function
- Max 3 parameters (use objects for more)
- Single responsibility
- Pure functions where possible
- Document side effects

### 3. **Error Handling**
```typescript
// ✅ Good: Explicit error handling
try {
  await spacetime.reducers.move_unit(gameId, unitId, x, y);
} catch (error) {
  logger.error('Move failed:', error);
  showUserMessage('Invalid move');
}

// ❌ Bad: Silent failures
spacetime.reducers.move_unit(gameId, unitId, x, y);
```

### 4. **Type Safety**
- NO `any` types
- Explicit return types
- Exhaustive switch cases
- Null/undefined handling
- Generic constraints

### 5. **Comments & Documentation**
```typescript
/**
 * Calculates damage with terrain defense modifiers
 * @param baseDamage - Raw damage before modifiers
 * @param terrain - Defender's terrain type
 * @returns Final damage (minimum 5)
 */
function calculateDamage(baseDamage: number, terrain: TerrainType): number {
  // Document WHY, not WHAT
  // Minimum 5 damage ensures battles don't stall
  return Math.max(5, baseDamage - getTerrainDefense(terrain));
}
```

## Quality Checklist

### Before Every PR:
- [ ] All functions have JSDoc
- [ ] No console.log (use logger)
- [ ] No magic numbers
- [ ] Error boundaries in place
- [ ] Loading states handled
- [ ] Accessibility attributes
- [ ] Unit tests for logic
- [ ] Integration tests for flows

### Code Smells 🦨
- Duplicate code blocks
- Long parameter lists
- Deeply nested code
- Large classes/files
- Circular dependencies
- Mixed concerns

## Testing Requirements

### Unit Tests
```typescript
describe('calculateDamage', () => {
  it('applies terrain defense correctly', () => {
    expect(calculateDamage(30, TerrainType.Forest)).toBe(20);
  });
  
  it('enforces minimum damage', () => {
    expect(calculateDamage(10, TerrainType.Mountain)).toBe(5);
  });
});
```

### Integration Tests
- User can create game
- Players can join game
- Combat flow works end-to-end
- Game ends correctly

## Performance Standards

- Bundle size < 200KB
- First paint < 1.5s
- Time to interactive < 3s
- 60 FPS during gameplay
- Memory usage < 50MB

## Refactoring Rules

### When to Refactor:
- Before adding features
- When tests are hard to write
- When explaining is hard
- When copying code

### How to Refactor:
1. Write tests first
2. Small incremental changes
3. One concept at a time
4. Maintain functionality
5. Update documentation

## Example Reviews

❌ **Bad Code:**
```typescript
function doStuff(data) {
  if (data.x > 5) {
    if (data.y < 10) {
      if (data.type == "unit") {
        // 50 lines of code...
      }
    }
  }
}
```

✅ **Good Code:**
```typescript
function processUnitAction(unit: Unit): ActionResult {
  if (!isValidPosition(unit)) {
    return ActionResult.InvalidPosition;
  }
  
  return executeUnitAction(unit);
}

function isValidPosition(unit: Unit): boolean {
  return unit.x <= BOARD_SIZE && unit.y <= BOARD_SIZE;
}
```