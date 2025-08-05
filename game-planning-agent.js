#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

class GamePlanningAgent {
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    this.gameConfig = null;
    this.projectPath = process.cwd();
  }

  async start() {
    console.log('\n🎮 SpacetimeDB Game Planning Agent 🎮\n');
    console.log('This agent will help you plan a proof of concept game');
    console.log('using SpacetimeDB (backend) and TypeScript (frontend)\n');

    const action = await this.prompt(
      'What would you like to do?\n' +
      '1. Create game concept\n' +
      '2. Generate project structure\n' +
      '3. Show example code\n' +
      '4. View best practices\n' +
      'Enter choice (1-4): '
    );

    switch (action) {
      case '1':
        await this.planGameConcept();
        break;
      case '2':
        await this.generateProjectStructure();
        break;
      case '3':
        await this.showExampleCode();
        break;
      case '4':
        this.showBestPractices();
        break;
      default:
        console.log('Invalid choice');
    }

    this.rl.close();
  }

  prompt(question) {
    return new Promise(resolve => {
      this.rl.question(question, resolve);
    });
  }

  async planGameConcept() {
    console.log('\n📋 Let\'s define your game concept:\n');

    const gameType = await this.prompt(
      'Game type:\n' +
      '1. Real-time multiplayer (e.g., .io games)\n' +
      '2. Turn-based multiplayer (e.g., chess, cards)\n' +
      '3. Single player with online features\n' +
      'Choose (1-3): '
    );

    const name = await this.prompt('Game name: ');
    const description = await this.prompt('Brief description: ');

    console.log('\nSelect features (comma-separated numbers):');
    console.log('1. Player authentication');
    console.log('2. Real-time movement');
    console.log('3. Chat system');
    console.log('4. Leaderboards');
    console.log('5. Matchmaking');
    console.log('6. Inventory system');
    const featuresInput = await this.prompt('Features: ');
    
    const featureMap = {
      '1': 'authentication',
      '2': 'movement',
      '3': 'chat',
      '4': 'leaderboards',
      '5': 'matchmaking',
      '6': 'inventory'
    };

    const features = featuresInput.split(',').map(f => featureMap[f.trim()]).filter(Boolean);

    this.gameConfig = {
      name,
      description,
      type: ['', 'realtime', 'turnbased', 'singleplayer'][parseInt(gameType)],
      features
    };

    // Generate recommendations
    console.log('\n✅ Game Concept Defined!\n');
    this.generateRecommendations();

    // Save plan
    const planPath = path.join(this.projectPath, 'game-plan.json');
    fs.writeFileSync(planPath, JSON.stringify(this.gameConfig, null, 2));
    console.log(`\nPlan saved to: ${planPath}`);
  }

  generateRecommendations() {
    console.log('🏗️  Architecture Recommendations:\n');
    
    console.log('Backend (SpacetimeDB):');
    console.log('- Language: Rust (recommended for performance)');
    console.log('- Core Tables:');
    
    if (this.gameConfig.features.includes('authentication')) {
      console.log('  • Player (id, username, created_at)');
    }
    if (this.gameConfig.features.includes('movement')) {
      console.log('  • Position (player_id, x, y, timestamp)');
    }
    if (this.gameConfig.features.includes('chat')) {
      console.log('  • Message (id, player_id, content, timestamp)');
    }
    if (this.gameConfig.features.includes('leaderboards')) {
      console.log('  • Score (player_id, score, timestamp)');
    }

    console.log('\nFrontend (TypeScript):');
    if (this.gameConfig.type === 'realtime') {
      console.log('- Game Engine: Phaser.js or PixiJS');
      console.log('- State: Real-time sync with SpacetimeDB');
    } else {
      console.log('- Framework: React or Vue');
      console.log('- State: Redux/Pinia + SpacetimeDB sync');
    }
  }

  async generateProjectStructure() {
    console.log('\n🔨 Generating project structure...\n');

    // Load existing plan or create new
    try {
      const planPath = path.join(this.projectPath, 'game-plan.json');
      this.gameConfig = JSON.parse(fs.readFileSync(planPath, 'utf-8'));
    } catch {
      console.log('No game plan found. Create one first (option 1).');
      return;
    }

    const projectName = this.gameConfig.name.toLowerCase().replace(/\s+/g, '-');
    const projectDir = path.join(this.projectPath, projectName);

    // Create directories
    const dirs = [
      projectDir,
      path.join(projectDir, 'backend'),
      path.join(projectDir, 'backend', 'src'),
      path.join(projectDir, 'frontend'),
      path.join(projectDir, 'frontend', 'src'),
      path.join(projectDir, 'frontend', 'src', 'services'),
      path.join(projectDir, 'frontend', 'src', 'components'),
      path.join(projectDir, 'frontend', 'src', 'types'),
    ];

    dirs.forEach(dir => {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`Created: ${dir}`);
    });

    // Generate files
    this.generateFiles(projectDir);
    
    console.log('\n✅ Project structure created!');
    console.log('\nNext steps:');
    console.log(`1. cd ${projectName}`);
    console.log('2. Install SpacetimeDB CLI');
    console.log('3. npm install (in both frontend and backend)');
    console.log('4. Start developing!');
  }

  generateFiles(projectDir) {
    const projectName = this.gameConfig.name.toLowerCase().replace(/\s+/g, '-');

    // Root package.json
    const rootPackage = {
      name: projectName,
      version: "0.1.0",
      scripts: {
        "dev": "echo 'Run spacetime dev in backend/ and npm run dev in frontend/'",
        "generate": "spacetime generate --lang typescript --out-dir frontend/src/module_bindings --project-path backend"
      }
    };
    fs.writeFileSync(
      path.join(projectDir, 'package.json'),
      JSON.stringify(rootPackage, null, 2)
    );

    // Backend Cargo.toml
    const cargoToml = `[package]
name = "${projectName}"
version = "0.1.0"
edition = "2021"

[dependencies]
spacetimedb = "0.10"
`;
    fs.writeFileSync(path.join(projectDir, 'backend', 'Cargo.toml'), cargoToml);

    // Backend lib.rs
    const libRs = this.generateRustCode();
    fs.writeFileSync(path.join(projectDir, 'backend', 'src', 'lib.rs'), libRs);

    // Frontend package.json
    const frontendPackage = {
      name: projectName + "-frontend",
      version: "0.1.0",
      type: "module",
      scripts: {
        "dev": "vite",
        "build": "tsc && vite build"
      },
      dependencies: {
        "@clockworklabs/spacetimedb-sdk": "^0.10.0"
      },
      devDependencies: {
        "typescript": "^5.0.0",
        "vite": "^5.0.0"
      }
    };
    fs.writeFileSync(
      path.join(projectDir, 'frontend', 'package.json'),
      JSON.stringify(frontendPackage, null, 2)
    );

    // Frontend main.ts
    const mainTs = `import { SpacetimeService } from './services/spacetime';

const spacetime = new SpacetimeService();

async function init() {
  console.log('Connecting to SpacetimeDB...');
  await spacetime.connect();
  console.log('Connected! Starting ${this.gameConfig.name}...');
  
  // Your game initialization here
}

init().catch(console.error);
`;
    fs.writeFileSync(path.join(projectDir, 'frontend', 'src', 'main.ts'), mainTs);

    // SpacetimeDB service
    const spacetimeService = this.generateSpacetimeService();
    fs.writeFileSync(
      path.join(projectDir, 'frontend', 'src', 'services', 'spacetime.ts'),
      spacetimeService
    );

    // README
    const readme = `# ${this.gameConfig.name}

${this.gameConfig.description}

## Features
${this.gameConfig.features.map(f => `- ${f}`).join('\n')}

## Setup
1. Install SpacetimeDB CLI
2. \`cd backend && spacetime dev\`
3. \`cd frontend && npm install && npm run dev\`

## Architecture
- Backend: SpacetimeDB (Rust)
- Frontend: TypeScript + Vite
`;
    fs.writeFileSync(path.join(projectDir, 'README.md'), readme);
  }

  generateRustCode() {
    let code = `use spacetimedb::{spacetimedb, Identity, ReducerContext};

#[spacetimedb(table)]
pub struct Player {
    #[primary_key]
    pub id: Identity,
    pub username: String,
    pub created_at: u64,
}
`;

    if (this.gameConfig.features.includes('movement')) {
      code += `
#[spacetimedb(table)]
pub struct Position {
    #[primary_key]
    pub player_id: Identity,
    pub x: f32,
    pub y: f32,
    pub timestamp: u64,
}

#[spacetimedb(reducer)]
pub fn update_position(ctx: ReducerContext, x: f32, y: f32) {
    let position = Position {
        player_id: ctx.sender,
        x,
        y,
        timestamp: spacetimedb::timestamp(),
    };
    Position::insert(position);
}
`;
    }

    if (this.gameConfig.features.includes('chat')) {
      code += `
#[spacetimedb(table)]
pub struct Message {
    #[primary_key]
    #[autoinc]
    pub id: u32,
    pub player_id: Identity,
    pub content: String,
    pub timestamp: u64,
}

#[spacetimedb(reducer)]
pub fn send_message(ctx: ReducerContext, content: String) {
    let message = Message {
        id: 0, // autoinc
        player_id: ctx.sender,
        content,
        timestamp: spacetimedb::timestamp(),
    };
    Message::insert(message);
}
`;
    }

    code += `
#[spacetimedb(reducer)]
pub fn create_player(ctx: ReducerContext, username: String) {
    let player = Player {
        id: ctx.sender,
        username,
        created_at: spacetimedb::timestamp(),
    };
    Player::insert(player);
}

#[spacetimedb(init)]
pub fn init() {
    // Initialize your game state here
}
`;

    return code;
  }

  generateSpacetimeService() {
    return `import { DbConnection } from '@clockworklabs/spacetimedb-sdk';

export class SpacetimeService {
  private connection: DbConnection | null = null;
  
  async connect() {
    const host = 'http://localhost:3000';
    const module = '${this.gameConfig.name.toLowerCase().replace(/\s+/g, '-')}';
    
    this.connection = await DbConnection.builder()
      .withUri(host)
      .withModuleName(module)
      .onConnect((ctx, identity, token) => {
        console.log('Connected!', { identity });
        localStorage.setItem('spacetime_token', token);
      })
      .build();
      
    return this.connection;
  }
  
  get db() {
    if (!this.connection) throw new Error('Not connected');
    return this.connection.db;
  }
  
  get reducers() {
    if (!this.connection) throw new Error('Not connected');
    return this.connection.reducers;
  }
}
`;
  }

  async showExampleCode() {
    console.log('\n📄 Example Code Snippets:\n');
    
    console.log('1. Basic Multiplayer Movement (Rust backend):');
    console.log(`
#[spacetimedb(reducer)]
pub fn move_player(ctx: ReducerContext, x: f32, y: f32) {
    if let Some(mut pos) = Position::filter_by_player_id(ctx.sender) {
        pos.x = x;
        pos.y = y;
        pos.timestamp = spacetimedb::timestamp();
        Position::update_by_player_id(ctx.sender, pos);
    }
}
`);

    console.log('\n2. TypeScript Client Subscription:');
    console.log(`
// Subscribe to player positions
spacetime.db.Position.onInsert((position) => {
  console.log('Player moved:', position);
  updatePlayerOnScreen(position.player_id, position.x, position.y);
});

// Call reducer
await spacetime.reducers.move_player(100, 200);
`);

    console.log('\n3. Real-time Chat:');
    console.log(`
// Backend
#[spacetimedb(reducer)]
pub fn send_chat(ctx: ReducerContext, text: String) {
    Message::insert(Message {
        id: 0,
        sender: ctx.sender,
        text,
        timestamp: spacetimedb::timestamp(),
    });
}

// Frontend
spacetime.db.Message.onInsert((msg) => {
  addChatMessage(msg.sender, msg.text);
});
`);
  }

  showBestPractices() {
    console.log('\n📚 SpacetimeDB Game Development Best Practices:\n');
    
    console.log('1. Architecture:');
    console.log('   - Keep reducers small and focused');
    console.log('   - Use tables for game state, not complex objects');
    console.log('   - Design for eventual consistency');
    console.log('   - Validate everything server-side\n');

    console.log('2. Performance:');
    console.log('   - Use indexes for frequent queries');
    console.log('   - Batch updates when possible');
    console.log('   - Minimize table scans');
    console.log('   - Consider spatial indexing for position queries\n');

    console.log('3. Real-time Features:');
    console.log('   - Use subscriptions for live updates');
    console.log('   - Handle connection loss gracefully');
    console.log('   - Implement client-side prediction');
    console.log('   - Add interpolation for smooth movement\n');

    console.log('4. Security:');
    console.log('   - Never trust client input');
    console.log('   - Validate all moves server-side');
    console.log('   - Rate limit actions');
    console.log('   - Use identity system for auth\n');

    console.log('5. Development Workflow:');
    console.log('   - Start with core game loop');
    console.log('   - Add features incrementally');
    console.log('   - Test with multiple clients early');
    console.log('   - Monitor performance from the start');
  }
}

// Run the agent
const agent = new GamePlanningAgent();
agent.start().catch(console.error);