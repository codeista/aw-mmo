# Manual QA Checklist for Insect Colony Wars

## 🎮 Test Instructions
Open the game at http://localhost:3000?mock and use the browser console to monitor logs.

## ✅ Core Features to Test

### 1. Colony Initialization
- [ ] Queen spawns on surface at clicked location
- [ ] Queen automatically starts digging (shows "Building" status)
- [ ] After 5 seconds, burrow is created with entrance at z=-1 and chamber at z=-10
- [ ] Queen moves underground and lays first egg
- [ ] Console shows: "Auto-discovered X resource" messages

### 2. Automated Colony Building
- [ ] First egg automatically becomes worker after 2 seconds
- [ ] Console shows: "First worker created! Starting automatic resource gathering."
- [ ] Worker is automatically assigned to gather
- [ ] Colony builds to target: 2 workers, 1 scout, 2 soldiers
- [ ] Console shows: "Colony building: Worker 2/2", etc.

### 3. Worker Surface Navigation
- [ ] Worker attempting to gather shows: "Worker is underground: true, Target is surface: true"
- [ ] Console shows routing through burrow: "Ant X needs to exit"
- [ ] Worker moves to burrow, then entrance, then surface
- [ ] Worker visible on surface view when gathering

### 4. Predator Threat Detection
**Test Setup**: Wait for some ants to be on surface, then check if a bird spawns naturally

- [ ] When bird appears near colony, console shows: "DANGER! X dangerous predator(s) detected!"
- [ ] All surface ants retreat to burrows
- [ ] Console shows: "Ant X retreating to burrow!"
- [ ] Ants resume activities when bird leaves

### 5. Burrow Exit Safety
**Test**: Watch workers trying to exit when predators are nearby

- [ ] Console shows: "Ant X sees Y predator(s) near entrance! Waiting..."
- [ ] Ant waits at entrance (z=-1) instead of exiting
- [ ] When coast clears: "Coast is now clear for ant X to exit!"
- [ ] After long wait: "Ant X has waited too long, giving up on exit."

### 6. Bird Boredom System
**Test**: Keep all ants underground and watch bird behavior

- [ ] After ~20 seconds: "Bird is getting bored... (X/300)"
- [ ] Bird shows "?" indicators above it (visual check)
- [ ] After ~30 seconds: "Bird got bored and is flying away!"
- [ ] Bird shows upward motion lines and fades out

### 7. Hive Alert System
**Test**: Let predator attack an ant

- [ ] Attack alert: "HIVE ALERT: [ant type] under attack at (X, Y)!"
- [ ] Nearby soldiers respond: "Soldier X responding to threat!"
- [ ] Death alert: "HIVE ALERT: [ant type] KILLED at (X, Y)!"
- [ ] Casualty tracking: "Colony X casualties: Y → Z"
- [ ] After 3+ deaths: "GENERAL RETREAT! Too many casualties!"

### 8. Combat System
- [ ] Group hunts: "Scout found large prey! Sending soldiers for group hunt."
- [ ] Multiple ants coordinate: "Soldier X joining group hunt"
- [ ] Wounded ants show red overlay and move slower
- [ ] Critical health (<30%) shows pulsing red effect
- [ ] Wounded ants retreat: "Wounded ant X retreating to burrow!"
- [ ] Underground healing: "Ant X fully healed!"

### 9. Visual Indicators
- [ ] Health bars: Green (healthy), Yellow (wounded <30%)
- [ ] Wounded ants: Red overlay circle
- [ ] Critical health: Pulsing red effect
- [ ] Birds searching: Dotted circle around them
- [ ] Birds bored: Yellow "?" above them
- [ ] Birds leaving: White motion lines going up

### 10. Larvae Management
- [ ] Queen's chamber shows larvae count when clicked: "Larvae: X/5"
- [ ] Queen stops laying when full: "Queen's chamber is full: 5/5 larvae"
- [ ] Larvae count syncs properly when transformed

## 🐛 Common Issues to Check

### Console Errors
Monitor console for:
- [ ] No "undefined" or "null" errors
- [ ] No "Cannot read property" errors
- [ ] No infinite loops or excessive logging

### Performance
- [ ] Game runs smoothly with 10+ ants
- [ ] No visual stuttering or lag
- [ ] Ant movements are fluid

### Game Flow
- [ ] Resources regenerate properly
- [ ] Ants find paths correctly
- [ ] No ants getting stuck
- [ ] Colony AI makes sensible decisions

## 📝 Bug Report Template

If you find an issue:

**Bug Description**:
[What happened?]

**Steps to Reproduce**:
1. [First step]
2. [Second step]
3. [etc.]

**Expected Behavior**:
[What should happen?]

**Console Logs**:
```
[Paste relevant console output]
```

**Game State**:
- Colony population: X
- Surface/Underground view: 
- Time since game start:

## 🎯 Quick Console Commands

Use these in browser console to help testing:

```javascript
// Show game state
showGameState()

// Show all ants with positions
game.showAnts()

// Show chambers
game.showChambers()

// Clear and restart
clearGameData()
location.reload()
```