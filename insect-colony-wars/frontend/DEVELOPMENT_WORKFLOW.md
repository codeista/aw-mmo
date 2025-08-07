# Development Workflow & Quality Control Process

## 🛡️ Quality Assurance Protocol

All changes to the Insect Colony Wars codebase must follow this workflow to ensure quality, consistency, and alignment with the game's design vision.

### 1. Pre-Development Checklist ✅

Before implementing any feature or fix:

- [ ] **Consult Design Documents**: Review GAME_FLOW.md, README.md, and existing documentation
- [ ] **Check Architecture**: Ensure changes align with current system architecture
- [ ] **Impact Analysis**: Identify all components that will be affected
- [ ] **User Approval**: Get explicit approval for:
  - New features
  - Major refactors
  - UI/UX changes
  - Game mechanics modifications
  - Performance optimizations that change behavior

### 2. Development Process 🔧

#### A. Code Implementation
1. Create a new branch for the feature/fix
2. Write clean, documented code following existing patterns
3. Add appropriate TypeScript types
4. Include error handling

#### B. Testing Requirements
- [ ] **TypeScript Compilation**: `npx tsc --noEmit` must pass
- [ ] **Manual Testing**: Test all affected features in-game
- [ ] **Edge Cases**: Test boundary conditions and error scenarios
- [ ] **Performance**: Verify no performance degradation

### 3. Multi-Agent Review Process 🤖

Each change must be reviewed by specialized agents:

#### A. System Architect Review
- Code structure and patterns
- Integration with existing systems
- Scalability considerations
- Database schema impacts

#### B. Quality Assurance Review
- Functionality testing
- Bug identification
- Edge case analysis
- User experience flow

#### C. Game Designer Review
- Game balance impacts
- Player experience
- Feature alignment with game vision
- Fun factor assessment

#### D. Performance Analyst Review
- Rendering performance
- Memory usage
- Network efficiency (for multiplayer)
- Optimization opportunities

### 4. Documentation Requirements 📚

All changes must include:
- [ ] **Code Comments**: Explain complex logic
- [ ] **README Updates**: If adding new features
- [ ] **GAME_FLOW Updates**: If changing game mechanics
- [ ] **Commit Messages**: Clear, descriptive messages

### 5. Approval Gates 🚦

#### Minor Changes (Bug fixes, small UI tweaks)
1. Developer implements
2. QA agent reviews
3. Auto-merge if tests pass

#### Medium Changes (New features, refactors)
1. Developer proposes change
2. System Architect reviews design
3. User approves approach
4. Implementation
5. Full agent review
6. User final approval

#### Major Changes (Core mechanics, architecture)
1. Written proposal with:
   - Problem statement
   - Proposed solution
   - Impact analysis
   - Alternative approaches
2. User approval of proposal
3. Prototype/POC if needed
4. Full implementation
5. Comprehensive agent review
6. User testing and final approval

### 6. Post-Implementation Checklist ✓

After changes are approved:
- [ ] **Update Documentation**: All relevant docs updated
- [ ] **Create Tests**: Add test cases for new functionality
- [ ] **Performance Baseline**: Record performance metrics
- [ ] **Deployment Notes**: Document any special deployment steps

## 🚨 Red Flags - Require Immediate User Consultation

- Changes to core game loop
- Modifications to player progression
- Economy/resource balance changes
- Multiplayer/networking changes
- Data persistence modifications
- Third-party service integrations
- Security-related changes
- Performance optimizations that alter gameplay

## 📋 Change Request Template

```markdown
## Change Request: [Title]

### Category
[ ] Bug Fix [ ] Feature [ ] Refactor [ ] Performance [ ] UI/UX

### Priority
[ ] Critical [ ] High [ ] Medium [ ] Low

### Description
[Detailed description of the change]

### Rationale
[Why this change is needed]

### Impact Analysis
- Affected Systems: [List all affected components]
- User Experience: [How this changes the player experience]
- Performance: [Expected performance impact]
- Breaking Changes: [Any backward compatibility issues]

### Implementation Plan
1. [Step 1]
2. [Step 2]
3. [etc.]

### Testing Plan
- [ ] Unit tests
- [ ] Integration tests
- [ ] Manual testing scenarios
- [ ] Performance testing

### Rollback Plan
[How to revert if issues arise]
```

## 🔄 Continuous Improvement

This workflow is a living document. Suggestions for improvements should be:
1. Documented with rationale
2. Reviewed by all agents
3. Approved by user
4. Implemented incrementally

---

**Last Updated**: 2025-08-07
**Version**: 1.0.0