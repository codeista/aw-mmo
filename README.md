# SpacetimeDB Game Development Toolkit

A comprehensive toolkit for planning and creating proof of concept games using SpacetimeDB as the backend and TypeScript as the frontend.

## 🚀 Quick Start

```bash
# Make the agent executable
chmod +x game-planning-agent.js

# Run the planning agent
./game-planning-agent.js
```

## 📦 What's Included

### 1. Game Planning Agent (`game-planning-agent.js`)
A simple, interactive CLI tool that helps you:
- Define your game concept and features
- Generate project structure automatically
- Create boilerplate code for SpacetimeDB and TypeScript
- View examples and best practices

### 2. Advanced Agent (`spacetimedb-game-agent.ts`)
A more sophisticated TypeScript-based agent with additional features (requires npm dependencies).

## 🎮 Supported Game Types

- **Real-time Multiplayer**: .io games, battle arenas, real-time strategy
- **Turn-based Multiplayer**: Chess, card games, board games
- **Single Player with Online Features**: Leaderboards, achievements, cloud saves

## 🛠️ Prerequisites

- Node.js 18+
- [SpacetimeDB CLI](https://spacetimedb.com/install)
- Basic knowledge of Rust or C# (for backend)
- TypeScript/JavaScript knowledge (for frontend)

## 📚 Example Workflow

1. **Plan Your Game**
   ```bash
   ./game-planning-agent.js
   # Choose option 1: Create game concept
   ```

2. **Generate Project Structure**
   ```bash
   ./game-planning-agent.js
   # Choose option 2: Generate project structure
   ```

3. **Start Development**
   ```bash
   cd your-game-name
   # Terminal 1: Run SpacetimeDB
   cd backend && spacetime dev
   
   # Terminal 2: Run frontend
   cd frontend && npm install && npm run dev
   ```

## 🏗️ Project Structure

Generated projects follow this structure:
```
your-game/
├── backend/           # SpacetimeDB module (Rust/C#)
│   ├── Cargo.toml
│   └── src/
│       └── lib.rs
├── frontend/          # TypeScript client
│   ├── package.json
│   ├── src/
│   │   ├── main.ts
│   │   ├── services/
│   │   │   └── spacetime.ts
│   │   ├── components/
│   │   └── types/
│   └── index.html
├── package.json
└── README.md
```

## 🔥 Key Features Support

The agent can generate boilerplate for:
- Player authentication
- Real-time movement/position tracking
- Chat systems
- Leaderboards
- Matchmaking
- Inventory systems
- Turn-based game logic

## 💡 Best Practices

1. **Start Small**: Begin with core mechanics before adding features
2. **Server Authority**: Validate all game logic server-side
3. **Optimize Early**: Use proper indexes and efficient queries
4. **Test Multiplayer**: Test with multiple clients from the start
5. **Handle Disconnects**: Implement reconnection logic

## 🤝 Contributing

Feel free to extend the agents with:
- Additional game templates
- More sophisticated code generation
- Integration with game engines (Phaser, PixiJS)
- Testing utilities
- Deployment scripts

## 📖 Resources

- [SpacetimeDB Documentation](https://spacetimedb.com/docs)
- [SpacetimeDB TypeScript SDK](https://github.com/clockworklabs/spacetimedb-typescript-sdk)
- [SpacetimeDB Discord](https://discord.gg/spacetimedb)

## 🎯 Example Games You Can Build

- **Multiplayer Snake**: Real-time movement, collision detection, leaderboards
- **Chess/Checkers**: Turn-based logic, game state validation, matchmaking
- **Battle Royale**: Spatial queries, real-time combat, shrinking zones
- **Trading Card Game**: Deck building, turn management, card effects
- **Collaborative Drawing**: Real-time canvas updates, room management

---

Happy game building! 🎮✨