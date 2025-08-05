#!/usr/bin/env node

import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';

interface GameConfig {
  name: string;
  type: 'realtime-multiplayer' | 'turn-based' | 'single-player-connected';
  genre: string;
  description: string;
  features: string[];
}

interface ProjectStructure {
  backend: {
    language: 'rust' | 'csharp';
    moduleName: string;
  };
  frontend: {
    framework: 'vanilla' | 'react' | 'vue' | 'phaser';
    buildTool: 'vite' | 'webpack' | 'parcel';
  };
}

class SpacetimeDBGameAgent {
  private projectPath: string;
  private gameConfig: GameConfig | null = null;
  private projectStructure: ProjectStructure | null = null;

  constructor(projectPath: string = process.cwd()) {
    this.projectPath = projectPath;
  }

  async init() {
    console.log(chalk.blue.bold('\n🎮 SpacetimeDB Game Development Agent 🎮\n'));
    console.log(chalk.gray('This agent will help you plan and create a proof of concept game'));
    console.log(chalk.gray('using SpacetimeDB as backend and TypeScript as frontend.\n'));

    const action = await this.selectAction();
    
    switch (action) {
      case 'new':
        await this.createNewProject();
        break;
      case 'plan':
        await this.planGame();
        break;
      case 'generate':
        await this.generateCode();
        break;
      case 'help':
        this.showHelp();
        break;
    }
  }

  private async selectAction() {
    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'What would you like to do?',
        choices: [
          { name: '🚀 Create new game project', value: 'new' },
          { name: '📋 Plan game concept and features', value: 'plan' },
          { name: '⚙️  Generate boilerplate code', value: 'generate' },
          { name: '❓ Show help and best practices', value: 'help' }
        ]
      }
    ]);
    return action;
  }

  private async planGame() {
    console.log(chalk.yellow('\n📋 Game Planning Phase\n'));

    // Game type selection
    const { gameType } = await inquirer.prompt([
      {
        type: 'list',
        name: 'gameType',
        message: 'What type of game are you building?',
        choices: [
          {
            name: '🔄 Real-time Multiplayer (e.g., .io games, battle arena)',
            value: 'realtime-multiplayer'
          },
          {
            name: '♟️  Turn-based Multiplayer (e.g., chess, card games)',
            value: 'turn-based'
          },
          {
            name: '🎯 Single Player with Online Features (e.g., leaderboards)',
            value: 'single-player-connected'
          }
        ]
      }
    ]);

    // Genre selection
    const { genre } = await inquirer.prompt([
      {
        type: 'list',
        name: 'genre',
        message: 'What genre best describes your game?',
        choices: [
          'Action', 'Strategy', 'Puzzle', 'Casual', 'RPG', 'Simulation', 'Other'
        ]
      }
    ]);

    // Basic info
    const { name, description } = await inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        message: 'What is your game called?',
        default: 'MySpacetimeGame'
      },
      {
        type: 'input',
        name: 'description',
        message: 'Briefly describe your game concept:',
        default: 'A multiplayer game powered by SpacetimeDB'
      }
    ]);

    // Feature selection
    const { features } = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'features',
        message: 'Select core features for your proof of concept:',
        choices: this.getFeaturesByType(gameType)
      }
    ]);

    this.gameConfig = {
      name,
      type: gameType,
      genre,
      description,
      features
    };

    // Show game plan
    console.log(chalk.green('\n✅ Game Concept Defined:\n'));
    console.log(chalk.white(`Name: ${chalk.bold(name)}`));
    console.log(chalk.white(`Type: ${gameType}`));
    console.log(chalk.white(`Genre: ${genre}`));
    console.log(chalk.white(`Description: ${description}`));
    console.log(chalk.white(`Core Features:`));
    features.forEach((f: string) => console.log(chalk.white(`  - ${f}`)));

    // Generate architecture recommendations
    this.generateArchitectureRecommendations();

    // Save plan
    await this.savePlan();
  }

  private getFeaturesByType(gameType: string): Array<{name: string, value: string}> {
    const commonFeatures = [
      { name: '👤 Player Authentication', value: 'auth' },
      { name: '📊 Leaderboards', value: 'leaderboards' },
      { name: '💬 Chat System', value: 'chat' },
      { name: '🏆 Achievements', value: 'achievements' },
      { name: '📈 Player Statistics', value: 'stats' }
    ];

    const realtimeFeatures = [
      { name: '🎮 Real-time Movement', value: 'movement' },
      { name: '⚔️  Combat System', value: 'combat' },
      { name: '🗺️  Spatial Indexing', value: 'spatial' },
      { name: '👥 Matchmaking', value: 'matchmaking' },
      { name: '🔄 State Synchronization', value: 'state-sync' }
    ];

    const turnBasedFeatures = [
      { name: '🎲 Turn Management', value: 'turns' },
      { name: '🃏 Game State Validation', value: 'validation' },
      { name: '⏱️  Turn Timers', value: 'timers' },
      { name: '🤖 AI Opponents', value: 'ai' },
      { name: '📱 Async Play', value: 'async-play' }
    ];

    switch (gameType) {
      case 'realtime-multiplayer':
        return [...commonFeatures, ...realtimeFeatures];
      case 'turn-based':
        return [...commonFeatures, ...turnBasedFeatures];
      default:
        return commonFeatures;
    }
  }

  private generateArchitectureRecommendations() {
    if (!this.gameConfig) return;

    console.log(chalk.blue('\n🏗️  Architecture Recommendations:\n'));

    // Backend recommendations
    console.log(chalk.yellow('Backend (SpacetimeDB Module):'));
    console.log('  - Language: Rust (recommended for performance)');
    console.log('  - Tables:');
    
    if (this.gameConfig.features.includes('auth')) {
      console.log('    • Player (id, username, created_at)');
    }
    if (this.gameConfig.features.includes('movement')) {
      console.log('    • Position (player_id, x, y, z, timestamp)');
    }
    if (this.gameConfig.features.includes('leaderboards')) {
      console.log('    • Score (player_id, score, timestamp)');
    }
    if (this.gameConfig.features.includes('chat')) {
      console.log('    • Message (id, player_id, content, timestamp)');
    }
    
    console.log('  - Reducers:');
    const reducers = this.getReducersByFeatures(this.gameConfig.features);
    reducers.forEach(r => console.log(`    • ${r}`));

    // Frontend recommendations
    console.log(chalk.yellow('\nFrontend (TypeScript):'));
    if (this.gameConfig.type === 'realtime-multiplayer') {
      console.log('  - Framework: Phaser.js or PixiJS for game rendering');
      console.log('  - State Management: MobX or custom event system');
      console.log('  - UI: React for menus, HUD overlays');
    } else {
      console.log('  - Framework: React/Vue for UI');
      console.log('  - State Management: Redux/Pinia');
      console.log('  - Styling: TailwindCSS');
    }
  }

  private getReducersByFeatures(features: string[]): string[] {
    const reducerMap: Record<string, string[]> = {
      'auth': ['create_player', 'update_username'],
      'movement': ['update_position', 'teleport_player'],
      'combat': ['attack', 'take_damage', 'respawn'],
      'chat': ['send_message', 'delete_message'],
      'leaderboards': ['update_score', 'reset_leaderboard'],
      'matchmaking': ['join_queue', 'leave_queue', 'create_match'],
      'turns': ['start_turn', 'end_turn', 'make_move']
    };

    const reducers: string[] = [];
    features.forEach(f => {
      if (reducerMap[f]) {
        reducers.push(...reducerMap[f]);
      }
    });
    return [...new Set(reducers)];
  }

  private async savePlan() {
    const planPath = path.join(this.projectPath, 'game-plan.json');
    await fs.writeFile(planPath, JSON.stringify(this.gameConfig, null, 2));
    console.log(chalk.green(`\n✅ Game plan saved to: ${planPath}`));
  }

  private async createNewProject() {
    console.log(chalk.yellow('\n🚀 Creating New SpacetimeDB Game Project\n'));

    // Check if plan exists
    try {
      const planPath = path.join(this.projectPath, 'game-plan.json');
      const planData = await fs.readFile(planPath, 'utf-8');
      this.gameConfig = JSON.parse(planData);
      console.log(chalk.green('✅ Found existing game plan'));
    } catch {
      console.log(chalk.yellow('No game plan found. Let\'s create one first.'));
      await this.planGame();
    }

    if (!this.gameConfig) return;

    // Project structure questions
    const { backendLang, frontendFramework } = await inquirer.prompt([
      {
        type: 'list',
        name: 'backendLang',
        message: 'Choose backend language for SpacetimeDB module:',
        choices: [
          { name: '🦀 Rust (recommended)', value: 'rust' },
          { name: '🔷 C#', value: 'csharp' }
        ]
      },
      {
        type: 'list',
        name: 'frontendFramework',
        message: 'Choose frontend framework:',
        choices: this.getFrontendChoices()
      }
    ]);

    this.projectStructure = {
      backend: {
        language: backendLang,
        moduleName: this.gameConfig.name.toLowerCase().replace(/\s+/g, '-')
      },
      frontend: {
        framework: frontendFramework,
        buildTool: 'vite'
      }
    };

    // Create project structure
    await this.scaffoldProject();
  }

  private getFrontendChoices() {
    if (!this.gameConfig) return [];
    
    if (this.gameConfig.type === 'realtime-multiplayer') {
      return [
        { name: '🎮 Phaser.js (2D game engine)', value: 'phaser' },
        { name: '🎨 Vanilla TS + Canvas', value: 'vanilla' },
        { name: '⚛️  React + Canvas/WebGL', value: 'react' }
      ];
    } else {
      return [
        { name: '⚛️  React', value: 'react' },
        { name: '💚 Vue 3', value: 'vue' },
        { name: '🟨 Vanilla TypeScript', value: 'vanilla' }
      ];
    }
  }

  private async scaffoldProject() {
    console.log(chalk.blue('\n🔨 Scaffolding project structure...\n'));

    const projectName = this.gameConfig!.name.toLowerCase().replace(/\s+/g, '-');
    const projectDir = path.join(this.projectPath, projectName);

    // Create directory structure
    const dirs = [
      projectDir,
      path.join(projectDir, 'backend'),
      path.join(projectDir, 'frontend'),
      path.join(projectDir, 'frontend', 'src'),
      path.join(projectDir, 'frontend', 'src', 'components'),
      path.join(projectDir, 'frontend', 'src', 'services'),
      path.join(projectDir, 'frontend', 'src', 'types'),
      path.join(projectDir, 'docs'),
      path.join(projectDir, 'scripts')
    ];

    for (const dir of dirs) {
      await fs.mkdir(dir, { recursive: true });
      console.log(chalk.gray(`Created: ${dir}`));
    }

    // Generate files based on config
    await this.generateProjectFiles(projectDir);

    console.log(chalk.green('\n✅ Project structure created successfully!'));
    console.log(chalk.blue('\nNext steps:'));
    console.log(chalk.white('1. cd ' + projectName));
    console.log(chalk.white('2. Install SpacetimeDB CLI: https://spacetimedb.com/install'));
    console.log(chalk.white('3. Run: npm run setup'));
    console.log(chalk.white('4. Start developing your game!'));
  }

  private async generateProjectFiles(projectDir: string) {
    // Package.json
    const packageJson = {
      name: this.gameConfig!.name.toLowerCase().replace(/\s+/g, '-'),
      version: "0.1.0",
      description: this.gameConfig!.description,
      scripts: {
        "setup": "npm install && cd frontend && npm install",
        "dev": "concurrently \"npm run dev:backend\" \"npm run dev:frontend\"",
        "dev:backend": "cd backend && spacetime dev",
        "dev:frontend": "cd frontend && npm run dev",
        "generate": "spacetime generate --lang typescript --out-dir frontend/src/module_bindings --project-path backend",
        "build": "cd frontend && npm run build"
      },
      devDependencies: {
        "concurrently": "^7.6.0"
      }
    };

    await fs.writeFile(
      path.join(projectDir, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );

    // Frontend package.json
    const frontendPackage = this.generateFrontendPackageJson();
    await fs.writeFile(
      path.join(projectDir, 'frontend', 'package.json'),
      JSON.stringify(frontendPackage, null, 2)
    );

    // README
    const readme = this.generateReadme();
    await fs.writeFile(path.join(projectDir, 'README.md'), readme);

    // Backend module files
    await this.generateBackendFiles(projectDir);

    // Frontend files
    await this.generateFrontendFiles(projectDir);
  }

  private generateFrontendPackageJson() {
    const base = {
      name: this.gameConfig!.name.toLowerCase().replace(/\s+/g, '-') + '-frontend',
      version: "0.1.0",
      type: "module",
      scripts: {
        "dev": "vite",
        "build": "tsc && vite build",
        "preview": "vite preview"
      },
      dependencies: {
        "@clockworklabs/spacetimedb-sdk": "^0.1.0"
      },
      devDependencies: {
        "@types/node": "^20.0.0",
        "typescript": "^5.0.0",
        "vite": "^5.0.0"
      }
    };

    // Add framework-specific dependencies
    if (this.projectStructure!.frontend.framework === 'react') {
      base.dependencies['react'] = "^18.2.0";
      base.dependencies['react-dom'] = "^18.2.0";
      base.devDependencies['@types/react'] = "^18.2.0";
      base.devDependencies['@types/react-dom'] = "^18.2.0";
      base.devDependencies['@vitejs/plugin-react'] = "^4.0.0";
    } else if (this.projectStructure!.frontend.framework === 'phaser') {
      base.dependencies['phaser'] = "^3.70.0";
    }

    return base;
  }

  private generateReadme(): string {
    return `# ${this.gameConfig!.name}

${this.gameConfig!.description}

## Game Type
- Type: ${this.gameConfig!.type}
- Genre: ${this.gameConfig!.genre}

## Features
${this.gameConfig!.features.map(f => `- ${f}`).join('\n')}

## Tech Stack
- Backend: SpacetimeDB (${this.projectStructure!.backend.language})
- Frontend: TypeScript + ${this.projectStructure!.frontend.framework}

## Getting Started

### Prerequisites
- Node.js 18+
- SpacetimeDB CLI: https://spacetimedb.com/install

### Setup
\`\`\`bash
# Install dependencies
npm run setup

# Generate TypeScript bindings
npm run generate

# Start development servers
npm run dev
\`\`\`

## Project Structure
\`\`\`
.
├── backend/          # SpacetimeDB module
├── frontend/         # TypeScript client
│   ├── src/
│   │   ├── components/
│   │   ├── services/
│   │   └── types/
├── docs/            # Documentation
└── scripts/         # Build scripts
\`\`\`
`;
  }

  private async generateBackendFiles(projectDir: string) {
    const backendDir = path.join(projectDir, 'backend');
    
    if (this.projectStructure!.backend.language === 'rust') {
      // Cargo.toml
      const cargoToml = `[package]
name = "${this.projectStructure!.backend.moduleName}"
version = "0.1.0"
edition = "2021"

[dependencies]
spacetimedb = "0.1"
`;
      await fs.writeFile(path.join(backendDir, 'Cargo.toml'), cargoToml);

      // src/lib.rs
      const libRs = this.generateRustBackend();
      await fs.mkdir(path.join(backendDir, 'src'), { recursive: true });
      await fs.writeFile(path.join(backendDir, 'src', 'lib.rs'), libRs);
    }
  }

  private generateRustBackend(): string {
    let code = `use spacetimedb::{spacetimedb, SpacetimeType, ReducerContext, Identity};

#[spacetimedb(table)]
pub struct Player {
    #[primary_key]
    pub id: Identity,
    pub username: String,
    pub created_at: u64,
}
`;

    if (this.gameConfig!.features.includes('movement')) {
      code += `
#[spacetimedb(table)]
pub struct Position {
    #[primary_key]
    pub player_id: Identity,
    pub x: f32,
    pub y: f32,
    pub timestamp: u64,
}
`;
    }

    if (this.gameConfig!.features.includes('chat')) {
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
`;
    }

    // Add basic reducers
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
`;

    return code;
  }

  private async generateFrontendFiles(projectDir: string) {
    const frontendDir = path.join(projectDir, 'frontend');
    
    // index.html
    const indexHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${this.gameConfig!.name}</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
`;
    await fs.writeFile(path.join(frontendDir, 'index.html'), indexHtml);

    // TypeScript config
    const tsConfig = {
      compilerOptions: {
        target: "ES2020",
        useDefineForClassFields: true,
        module: "ESNext",
        lib: ["ES2020", "DOM", "DOM.Iterable"],
        skipLibCheck: true,
        moduleResolution: "bundler",
        allowImportingTsExtensions: true,
        resolveJsonModule: true,
        isolatedModules: true,
        noEmit: true,
        jsx: "react-jsx",
        strict: true,
        noUnusedLocals: true,
        noUnusedParameters: true,
        noFallthroughCasesInSwitch: true
      },
      include: ["src"],
      references: [{ path: "./tsconfig.node.json" }]
    };
    await fs.writeFile(
      path.join(frontendDir, 'tsconfig.json'),
      JSON.stringify(tsConfig, null, 2)
    );

    // Main entry file
    const mainTs = this.generateMainTs();
    await fs.writeFile(path.join(frontendDir, 'src', 'main.ts'), mainTs);

    // SpacetimeDB connection service
    const connectionService = this.generateConnectionService();
    await fs.writeFile(
      path.join(frontendDir, 'src', 'services', 'spacetime.ts'),
      connectionService
    );
  }

  private generateMainTs(): string {
    if (this.projectStructure!.frontend.framework === 'react') {
      return `import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('app')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
`;
    } else {
      return `import { SpacetimeService } from './services/spacetime';

// Initialize SpacetimeDB connection
const spacetime = new SpacetimeService();

async function init() {
  console.log('Initializing ${this.gameConfig!.name}...');
  
  try {
    await spacetime.connect();
    console.log('Connected to SpacetimeDB!');
    
    // Initialize your game here
    startGame();
  } catch (error) {
    console.error('Failed to connect:', error);
  }
}

function startGame() {
  // Your game initialization code
  console.log('Game started!');
}

// Start the application
init();
`;
    }
  }

  private generateConnectionService(): string {
    return `import { DbConnection } from '@clockworklabs/spacetimedb-sdk';

export class SpacetimeService {
  private connection: DbConnection | null = null;
  
  async connect() {
    const host = import.meta.env.VITE_SPACETIME_HOST || 'http://localhost:3000';
    const module = import.meta.env.VITE_MODULE_NAME || '${this.projectStructure!.backend.moduleName}';
    
    this.connection = await DbConnection.builder()
      .withUri(host)
      .withModuleName(module)
      .onConnect((ctx, identity, token) => {
        console.log('Connected with identity:', identity);
        // Store token for reconnection
        localStorage.setItem('spacetime_token', token);
      })
      .onConnectError((error) => {
        console.error('Connection error:', error);
      })
      .build();
      
    return this.connection;
  }
  
  get db() {
    if (!this.connection) {
      throw new Error('Not connected to SpacetimeDB');
    }
    return this.connection.db;
  }
  
  get reducers() {
    if (!this.connection) {
      throw new Error('Not connected to SpacetimeDB');
    }
    return this.connection.reducers;
  }
}
`;
  }

  private async generateCode() {
    console.log(chalk.yellow('\n⚙️  Generating Additional Code\n'));
    
    // Check for existing project
    const hasGamePlan = await this.checkForGamePlan();
    if (!hasGamePlan) {
      console.log(chalk.red('No game plan found. Please run "plan" first.'));
      return;
    }

    const { codeType } = await inquirer.prompt([
      {
        type: 'list',
        name: 'codeType',
        message: 'What code would you like to generate?',
        choices: [
          { name: '🎮 Game Components', value: 'components' },
          { name: '🔧 SpacetimeDB Reducers', value: 'reducers' },
          { name: '📊 State Management', value: 'state' },
          { name: '🎨 UI Templates', value: 'ui' },
          { name: '🧪 Example Tests', value: 'tests' }
        ]
      }
    ]);

    // Generate based on selection
    console.log(chalk.blue(`\nGenerating ${codeType} code...`));
    console.log(chalk.gray('(This would generate specific code based on your game plan)'));
  }

  private async checkForGamePlan(): Promise<boolean> {
    try {
      const planPath = path.join(this.projectPath, 'game-plan.json');
      await fs.access(planPath);
      return true;
    } catch {
      return false;
    }
  }

  private showHelp() {
    console.log(chalk.blue('\n📚 SpacetimeDB Game Development Guide\n'));
    
    console.log(chalk.yellow('Key Concepts:'));
    console.log('1. SpacetimeDB combines database + server in one');
    console.log('2. Write game logic as "reducers" (like stored procedures)');
    console.log('3. Clients connect directly and get real-time updates');
    console.log('4. Perfect for multiplayer games with shared state\n');

    console.log(chalk.yellow('Best Practices:'));
    console.log('✓ Keep reducers small and focused');
    console.log('✓ Use proper indexing for performance');
    console.log('✓ Validate all client inputs server-side');
    console.log('✓ Design tables for efficient queries');
    console.log('✓ Use TypeScript for type safety\n');

    console.log(chalk.yellow('Common Patterns:'));
    console.log('• ECS: Tables as components, entities as IDs');
    console.log('• Events: Store game events in time-series tables');
    console.log('• Spatial: Use indexes for position queries');
    console.log('• Sessions: Track active players and matches\n');

    console.log(chalk.yellow('Resources:'));
    console.log('📖 Docs: https://spacetimedb.com/docs');
    console.log('💬 Discord: https://discord.gg/spacetimedb');
    console.log('🐙 GitHub: https://github.com/clockworklabs/SpacetimeDB');
  }
}

// CLI Entry Point
const program = new Command();

program
  .name('spacetime-game-agent')
  .description('Agent for planning and creating SpacetimeDB games')
  .version('1.0.0');

program
  .command('start')
  .description('Start the interactive agent')
  .action(async () => {
    const agent = new SpacetimeDBGameAgent();
    await agent.init();
  });

program.parse(process.argv);

// If no command provided, start interactive mode
if (!process.argv.slice(2).length) {
  const agent = new SpacetimeDBGameAgent();
  agent.init();
}