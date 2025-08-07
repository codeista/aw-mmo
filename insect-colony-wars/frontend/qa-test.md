# QA Testing Report - Insect Colony Wars

## TypeScript Compilation Issues

### Critical Errors:
1. **Property 'discovered' does not exist on ResourceNode** (lines 2921)
   - Impact: Will cause runtime errors when checking resource discovery
   - Fix needed: Remove direct property access, use discoveredResources map

2. **Property 'resource_carried' does not exist on Ant** (lines 3920-3921)
   - Impact: Unit info window will show errors for carrying status
   - Fix needed: Remove or add proper type definition

3. **Property 'generation' does not exist on Colony** (lines 3527, 3578)
   - Impact: Generation tracking features will fail
   - Fix needed: Add generation property or remove references

### Type Warnings:
- Multiple unused variables (can be cleaned up later)
- Event listener type mismatches (lines 4276, 4298)

## Game Mechanics Testing

### Energy System:
✅ Ants lose energy over time
✅ Surface ants lose energy 50% faster
✅ Auto-return to base at 25% energy
✅ Death at 0% energy
❓ Need to verify feeding mechanics in burrow

### Colony Management:
✅ AI toggle functionality
✅ Spawn toggles for predators/prey
✅ Colony collapse when queen dies
❓ Queen jelly depletion rate might be too fast (0.02 per tick)

### UI/UX:
✅ Expandable panels work correctly
✅ Command queue displays properly
✅ Unit selection syncs between views
⚠️ Dashboard can get stuck minimized (user reported)

### Performance Concerns:
- Multiple forEach loops in updateGame() could be optimized
- Frequent localStorage saves might impact performance
- Many console.log statements in production

## Edge Cases to Test:

1. **Multiple colonies spawning simultaneously**
   - What happens if player spawns queen while one exists?

2. **Resource discovery race conditions**
   - Multiple scouts discovering same resource

3. **Command queue overflow**
   - What happens with 100+ queued commands?

4. **Spawn toggle edge cases**
   - Toggling rapidly during spawn
   - Turning off while entities are mid-spawn

5. **Energy system edge cases**
   - Ant starving while in combat
   - Ant starving while carrying resources
   - Multiple ants returning simultaneously

## Recommended Fixes Priority:

1. **HIGH**: Fix ResourceNode.discovered property access
2. **HIGH**: Fix Ant.resource_carried property access 
3. **HIGH**: Fix Colony.generation property access
4. **MEDIUM**: Fix event listener type issues
5. **LOW**: Clean up unused variables
6. **LOW**: Reduce console.log statements

## Console Commands to Test:

```javascript
// Test energy system
game.ants.forEach(ant => console.log(`Ant ${ant.id}: ${ant.energy}% energy`));

// Test spawn controls
clearMockState();
game.spawnPredators = false;
game.spawnPrey = false;

// Test colony collapse
game.service.call('kill_ant', {ant_id: game.currentColony.queen_id});

// Check discovered resources
console.log('Discovered:', Array.from(game.discoveredResources.values()).length);
```

## Performance Metrics:
- Game loop runs at 10 FPS (100ms interval)
- Render loop targets 60 FPS
- Mock service saves state every action (could be throttled)

## Security Considerations:
- localStorage is cleared on dev start (good)
- No input validation on coordinates (could cause issues)
- No limits on entity spawning (memory concerns)