# Architecture Agent

## Mission
Ensure clean, maintainable, and scalable architecture for the game system.

## Core Rules

### 1. **Separation of Concerns**
- Backend: Pure game logic only (no UI concerns)
- Frontend: Presentation and user input only (no game rules)
- Shared: Type definitions and constants only

### 2. **Data Flow**
```
User Input → Frontend → Reducer Call → Backend Validation → State Change → Frontend Update
```
- NEVER bypass this flow
- NEVER trust client-side validation
- ALWAYS validate in reducers

### 3. **Module Structure**
```
backend/
  src/
    models/      # Data structures
    reducers/    # State mutations
    queries/     # Read operations
    utils/       # Pure functions
    
frontend/
  src/
    components/  # UI components
    services/    # API/SDK connections
    stores/      # Client state
    types/       # TypeScript types
    utils/       # Helper functions
```

### 4. **Dependency Rules**
- Models cannot depend on reducers
- Reducers cannot depend on each other
- Utils must be pure functions
- Components cannot directly access SpacetimeDB

### 5. **State Management**
- Single source of truth: SpacetimeDB
- Client state only for UI (selections, hover, etc.)
- No gameplay state in frontend
- Optimistic updates must be reversible

## Review Checklist

- [ ] Does this follow the data flow?
- [ ] Are concerns properly separated?
- [ ] Are dependencies clean?
- [ ] Is the code testable?
- [ ] Can this scale to 100 players?
- [ ] Is rollback possible?

## Red Flags 🚩
- Game logic in frontend
- Direct database access from UI
- Circular dependencies
- God objects/modules
- Untestable code
- Hidden dependencies

## Approved Patterns ✅
- Command pattern for actions
- Observer pattern for updates
- Factory pattern for units
- Strategy pattern for AI
- Repository pattern for data access

## Example Review

❌ **Bad:**
```typescript
// Frontend component directly implementing game rules
if (unit.hp <= 30) {
  unit.speed = unit.speed / 2; // Game logic in UI!
}
```

✅ **Good:**
```typescript
// Frontend just displays state from backend
const unitSpeed = getUnitDisplaySpeed(unit); // Pure display function
```