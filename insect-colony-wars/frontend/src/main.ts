import './style.css';

// Types matching the backend
export enum AntType {
  Queen = 'Queen',
  Worker = 'Worker',
  Soldier = 'Soldier',
  Scout = 'Scout',
  Major = 'Major'
}

export enum ResourceType {
  Food = 'Food',
  Minerals = 'Minerals',
  Larvae = 'Larvae'
}

export enum ChamberType {
  Nursery = 'Nursery',
  Storage = 'Storage',
  Barracks = 'Barracks',
  ThroneRoom = 'ThroneRoom'
}

export enum TaskType {
  Idle = 'Idle',
  Gathering = 'Gathering',
  Building = 'Building',
  Fighting = 'Fighting',
  Exploring = 'Exploring',
  Returning = 'Returning'
}

interface Player {
  id: string;
  username: string;
  created_at: number;
  total_colonies: number;
  resources_gathered: number;
}

interface Colony {
  id: number;
  player_id: string;
  queen_id: number | null;
  food: number;
  minerals: number;
  larvae: number;
  queen_jelly: number;
  population: number;
  territory_radius: number;
  created_at: number;
  ai_enabled: boolean;
}

interface Ant {
  id: number;
  colony_id: number;
  ant_type: AntType;
  x: number;
  y: number;
  z: number;
  health: number;
  max_health: number;
  carrying_resource: ResourceType | null;
  carrying_amount: number;
  task: TaskType;
  target_x: number | null;
  target_y: number | null;
  target_z: number | null;
  speed: number;
  attack_damage: number;
}

interface Chamber {
  id: number;
  colony_id: number;
  chamber_type: ChamberType;
  x: number;
  y: number;
  z: number;
  level: number;
  capacity: number;
}

interface ResourceNode {
  id: number;
  resource_type: ResourceType;
  x: number;
  y: number;
  z: number;
  amount: number;
  max_amount: number;
  regeneration_rate: number;
}

// 3D Viewport for underground visualization
class UndergroundViewport {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private cameraX: number = 0;
  private cameraY: number = 0;
  public cameraZ: number = -10;
  private zoom: number = 1;
  private selectedAnts: Set<number> = new Set();
  private isDragging: boolean = false;
  private lastMouseX: number = 0;
  private lastMouseY: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.setupEventListeners();
    this.resize();
  }

  private setupEventListeners() {
    window.addEventListener('resize', () => this.resize());
    
    this.canvas.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
    });

    this.canvas.addEventListener('mousemove', (e) => {
      if (this.isDragging) {
        const dx = e.clientX - this.lastMouseX;
        const dy = e.clientY - this.lastMouseY;
        this.cameraX -= dx / this.zoom;
        this.cameraY -= dy / this.zoom;
        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;
      }
    });

    this.canvas.addEventListener('mouseup', () => {
      this.isDragging = false;
    });

    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      this.zoom *= delta;
      this.zoom = Math.max(0.5, Math.min(3, this.zoom));
    });

    this.canvas.addEventListener('click', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left - this.canvas.width / 2) / this.zoom + this.cameraX;
      const y = (e.clientY - rect.top - this.canvas.height / 2) / this.zoom + this.cameraY;
      this.handleClick(x, y);
    });

    this.canvas.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      const rect = this.canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left - this.canvas.width / 2) / this.zoom + this.cameraX;
      const y = (e.clientY - rect.top - this.canvas.height / 2) / this.zoom + this.cameraY;
      this.handleRightClick(x, y);
    });
  }

  private resize() {
    this.canvas.width = this.canvas.offsetWidth || 800;
    this.canvas.height = this.canvas.offsetHeight || 600;
    console.log('Canvas resized to:', this.canvas.width, 'x', this.canvas.height);
  }

  private worldToScreen(x: number, y: number, z: number): [number, number] {
    const screenX = (x - this.cameraX) * this.zoom + this.canvas.width / 2;
    const screenY = (y - this.cameraY) * this.zoom + this.canvas.height / 2;
    // Add depth effect
    const depthScale = 1 + (z - this.cameraZ) * 0.01;
    return [screenX, screenY * depthScale];
  }

  render(ants: Ant[], colonies: Colony[], chambers: Chamber[], resources: ResourceNode[]) {
    if (!this.canvas.width || !this.canvas.height) {
      this.resize();
    }
    
    // Clear canvas
    this.ctx.fillStyle = '#1a1a1a';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw grid
    this.drawGrid();

    // Draw resources
    resources.forEach(resource => {
      const [x, y] = this.worldToScreen(resource.x, resource.y, resource.z);
      const size = 20 * this.zoom;
      
      if (resource.resource_type === ResourceType.Food) {
        this.ctx.fillStyle = '#4CAF50';
      } else if (resource.resource_type === ResourceType.Minerals) {
        this.ctx.fillStyle = '#2196F3';
      }
      
      this.ctx.beginPath();
      this.ctx.arc(x, y, size / 2, 0, Math.PI * 2);
      this.ctx.fill();
      
      // Draw amount
      this.ctx.fillStyle = 'white';
      this.ctx.font = `${10 * this.zoom}px Arial`;
      this.ctx.textAlign = 'center';
      this.ctx.fillText(Math.floor(resource.amount).toString(), x, y);
    });

    // Draw chambers
    chambers.forEach(chamber => {
      const [x, y] = this.worldToScreen(chamber.x, chamber.y, chamber.z);
      const size = 40 * this.zoom;
      
      // Chamber color based on type
      switch (chamber.chamber_type) {
        case ChamberType.ThroneRoom:
          this.ctx.fillStyle = '#FFD700';
          break;
        case ChamberType.Nursery:
          this.ctx.fillStyle = '#FF69B4';
          break;
        case ChamberType.Storage:
          this.ctx.fillStyle = '#8B4513';
          break;
        case ChamberType.Barracks:
          this.ctx.fillStyle = '#DC143C';
          break;
      }
      
      this.ctx.fillRect(x - size / 2, y - size / 2, size, size);
      
      // Draw chamber type icon
      this.ctx.fillStyle = 'white';
      this.ctx.font = `${12 * this.zoom}px Arial`;
      this.ctx.textAlign = 'center';
      this.ctx.fillText(chamber.chamber_type[0], x, y + 4 * this.zoom);
    });

    // Draw ants
    ants.forEach(ant => {
      const [x, y] = this.worldToScreen(ant.x, ant.y, ant.z);
      const size = this.getAntSize(ant.ant_type) * this.zoom;
      
      // Ant color based on type
      switch (ant.ant_type) {
        case AntType.Queen:
          this.ctx.fillStyle = '#FFD700';
          break;
        case AntType.Worker:
          this.ctx.fillStyle = '#8B4513';
          break;
        case AntType.Soldier:
          this.ctx.fillStyle = '#DC143C';
          break;
        case AntType.Scout:
          this.ctx.fillStyle = '#4169E1';
          break;
        case AntType.Major:
          this.ctx.fillStyle = '#8B0000';
          break;
      }
      
      // Draw selection ring if selected
      if (this.selectedAnts.has(ant.id)) {
        this.ctx.strokeStyle = '#00FF00';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(x, y, size / 2 + 5, 0, Math.PI * 2);
        this.ctx.stroke();
      }
      
      // Draw ant
      this.ctx.beginPath();
      this.ctx.arc(x, y, size / 2, 0, Math.PI * 2);
      this.ctx.fill();
      
      // Draw health bar
      const healthPercent = ant.health / ant.max_health;
      const barWidth = size;
      const barHeight = 4 * this.zoom;
      this.ctx.fillStyle = 'red';
      this.ctx.fillRect(x - barWidth / 2, y - size / 2 - 10, barWidth, barHeight);
      this.ctx.fillStyle = 'green';
      this.ctx.fillRect(x - barWidth / 2, y - size / 2 - 10, barWidth * healthPercent, barHeight);
      
      // Draw carrying indicator
      if (ant.carrying_resource) {
        this.ctx.fillStyle = ant.carrying_resource === ResourceType.Food ? '#4CAF50' : '#2196F3';
        this.ctx.beginPath();
        this.ctx.arc(x + size / 3, y - size / 3, 4 * this.zoom, 0, Math.PI * 2);
        this.ctx.fill();
      }
    });
  }

  private drawGrid() {
    this.ctx.strokeStyle = '#333';
    this.ctx.lineWidth = 1;
    
    const gridSize = 50;
    const startX = Math.floor((this.cameraX - this.canvas.width / (2 * this.zoom)) / gridSize) * gridSize;
    const endX = Math.ceil((this.cameraX + this.canvas.width / (2 * this.zoom)) / gridSize) * gridSize;
    const startY = Math.floor((this.cameraY - this.canvas.height / (2 * this.zoom)) / gridSize) * gridSize;
    const endY = Math.ceil((this.cameraY + this.canvas.height / (2 * this.zoom)) / gridSize) * gridSize;
    
    for (let x = startX; x <= endX; x += gridSize) {
      const [screenX] = this.worldToScreen(x, 0, this.cameraZ);
      this.ctx.beginPath();
      this.ctx.moveTo(screenX, 0);
      this.ctx.lineTo(screenX, this.canvas.height);
      this.ctx.stroke();
    }
    
    for (let y = startY; y <= endY; y += gridSize) {
      const [, screenY] = this.worldToScreen(0, y, this.cameraZ);
      this.ctx.beginPath();
      this.ctx.moveTo(0, screenY);
      this.ctx.lineTo(this.canvas.width, screenY);
      this.ctx.stroke();
    }
  }

  private getAntSize(antType: AntType): number {
    switch (antType) {
      case AntType.Queen: return 20;
      case AntType.Major: return 16;
      case AntType.Soldier: return 12;
      case AntType.Worker: return 10;
      case AntType.Scout: return 8;
    }
  }

  private handleClick(x: number, y: number) {
    // Will be implemented to select ants
    if (window.game) {
      window.game.handleMapClick(x, y, false);
    }
  }

  private handleRightClick(x: number, y: number) {
    // Will be implemented to command ants
    if (window.game) {
      window.game.handleMapClick(x, y, true);
    }
  }

  selectAnts(antIds: number[]) {
    this.selectedAnts = new Set(antIds);
  }

  clearSelection() {
    this.selectedAnts.clear();
  }

  focusOnPosition(x: number, y: number, z: number) {
    this.cameraX = x;
    this.cameraY = y;
    this.cameraZ = z;
  }
}

// Main game class
class InsectColonyWarsGame {
  private viewport: UndergroundViewport;
  private currentPlayer: Player | null = null;
  private currentColony: Colony | null = null;
  private ants: Map<number, Ant> = new Map();
  private colonies: Map<number, Colony> = new Map();
  private chambers: Map<number, Chamber> = new Map();
  private resources: Map<number, ResourceNode> = new Map();
  private selectedAntIds: number[] = [];
  private service: any; // Will be SpacetimeService or MockService
  private huntMode: boolean = false;

  constructor() {
    this.setupUI();
    const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    this.viewport = new UndergroundViewport(canvas);
    this.startRenderLoop();
  }

  async connect(service: any) {
    this.service = service;
    await service.connect();
    
    // Subscribe to tables
    service.on('Player', (players: Player[]) => {
      const myPlayer = players.find(p => p.id === service.identity);
      if (myPlayer) {
        this.currentPlayer = myPlayer;
        this.updateUI();
      }
    });

    service.on('Colony', (colonies: Colony[]) => {
      this.colonies.clear();
      colonies.forEach(colony => {
        this.colonies.set(colony.id, colony);
        if (colony.player_id === service.identity) {
          this.currentColony = colony;
        }
      });
      this.updateUI();
    });

    service.on('Ant', (ants: Ant[]) => {
      this.ants.clear();
      ants.forEach(ant => this.ants.set(ant.id, ant));
      this.updateUnitPanel();
    });

    service.on('Chamber', (chambers: Chamber[]) => {
      this.chambers.clear();
      chambers.forEach(chamber => this.chambers.set(chamber.id, chamber));
    });

    service.on('ResourceNode', (resources: ResourceNode[]) => {
      this.resources.clear();
      resources.forEach(resource => this.resources.set(resource.id, resource));
    });
  }

  private setupUI() {
    // Add keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        // Clear selection
        this.selectedAntIds = [];
        this.viewport.clearSelection();
        this.updateUI();
      } else if (e.key === 'a' && (e.ctrlKey || e.metaKey)) {
        // Select all units
        e.preventDefault();
        if (this.currentColony) {
          this.selectedAntIds = [];
          this.ants.forEach(ant => {
            if (ant.colony_id === this.currentColony!.id) {
              this.selectedAntIds.push(ant.id);
            }
          });
          this.viewport.selectAnts(this.selectedAntIds);
          this.updateUI();
        }
      }
    });
    
    const app = document.getElementById('app')!;
    app.innerHTML = `
      <div id="gameContainer">
        <canvas id="gameCanvas"></canvas>
        
        <div id="topBar" class="ui-panel">
          <div id="playerInfo">
            <span id="playerName">Not connected</span>
            <span id="colonyStats">No colony</span>
          </div>
          <div id="resources">
            <span class="resource">🍎 Food: <span id="food">0</span></span>
            <span class="resource">💎 Minerals: <span id="minerals">0</span></span>
            <span class="resource">🥚 Larvae: <span id="larvae">0</span></span>
            <span class="resource">👑 Jelly: <span id="queenJelly">0</span></span>
            <span class="resource">🐜 Population: <span id="population">0</span></span>
          </div>
        </div>
        
        <div id="bottomBar" class="ui-panel">
          <div id="actions">
            <button id="createColonyBtn" class="action-btn">Create Colony</button>
            <div id="colonyActions" style="display: none;">
              <div id="spawnButtons">
                <button class="spawn-btn" data-ant="Worker">Spawn Worker (10🍎 2👑)</button>
                <button class="spawn-btn" data-ant="Soldier">Spawn Soldier (20🍎 3👑)</button>
                <button class="spawn-btn" data-ant="Scout">Spawn Scout (15🍎 2.5👑)</button>
                <button class="spawn-btn" data-ant="Major">Spawn Major (50🍎 10💎 5👑)</button>
              </div>
              <div id="buildButtons">
                <button class="chamber-btn" data-chamber="Nursery">Build Nursery (50🍎 10💎)</button>
                <button class="chamber-btn" data-chamber="Storage">Build Storage (30🍎 20💎)</button>
                <button class="chamber-btn" data-chamber="Barracks">Build Barracks (100🍎 50💎)</button>
              </div>
              <div id="commandButtons">
                <button id="gatherBtn" class="command-btn">⚒️ Gather All</button>
                <button id="defendBtn" class="command-btn">🛡️ Defend Queen</button>
                <button id="huntBtn" class="command-btn">⚔️ Hunt Mode</button>
                <button id="toggleAI" class="action-btn">🤖 AI: <span id="aiStatus">ON</span></button>
              </div>
            </div>
          </div>
          <div id="selection">
            <div id="selectedInfo">No selection</div>
          </div>
        </div>
        
        <div id="chat" class="ui-panel">
          <div id="chatMessages"></div>
          <input type="text" id="chatInput" placeholder="Type to chat..." />
        </div>
        
        <div id="unitPanel" class="ui-panel">
          <h3>Units</h3>
          <div id="unitList"></div>
          <div style="margin-top: 10px; font-size: 11px; color: #666;">
            ESC: Clear • Ctrl+A: Select All<br>
            Click: Select • Shift+Click: Add
          </div>
        </div>
      </div>
    `;

    // Setup event listeners
    document.getElementById('createColonyBtn')!.addEventListener('click', () => {
      this.createColony();
    });

    document.querySelectorAll('.spawn-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const antType = (e.target as HTMLElement).dataset.ant as AntType;
        this.spawnAnt(antType);
      });
    });

    document.querySelectorAll('.chamber-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const chamberType = (e.target as HTMLElement).dataset.chamber as ChamberType;
        this.buildChamber(chamberType);
      });
    });

    document.getElementById('chatInput')!.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const input = e.target as HTMLInputElement;
        if (input.value.trim()) {
          // Chat will be implemented later
          input.value = '';
        }
      }
    });
    
    document.getElementById('toggleAI')?.addEventListener('click', () => {
      if (this.currentColony) {
        this.service.call('toggle_colony_ai', { colony_id: this.currentColony.id });
      }
    });
    
    document.getElementById('gatherBtn')?.addEventListener('click', () => {
      if (this.currentColony) {
        this.service.call('hive_command_gather', { colony_id: this.currentColony.id });
      }
    });
    
    document.getElementById('defendBtn')?.addEventListener('click', () => {
      if (this.currentColony) {
        this.service.call('hive_command_defend', { colony_id: this.currentColony.id });
      }
    });
    
    document.getElementById('huntBtn')?.addEventListener('click', () => {
      if (this.currentColony) {
        // Toggle hunt mode
        const btn = document.getElementById('huntBtn')!;
        btn.classList.toggle('active');
        this.huntMode = btn.classList.contains('active');
        btn.textContent = this.huntMode ? '⚔️ Cancel Hunt' : '⚔️ Hunt Mode';
      }
    });
  }

  private updateUI() {
    if (this.currentPlayer) {
      document.getElementById('playerName')!.textContent = this.currentPlayer.username;
    }

    if (this.currentColony) {
      document.getElementById('colonyStats')!.textContent = `Colony #${this.currentColony.id}`;
      document.getElementById('food')!.textContent = Math.floor(this.currentColony.food).toString();
      document.getElementById('minerals')!.textContent = Math.floor(this.currentColony.minerals).toString();
      document.getElementById('larvae')!.textContent = this.currentColony.larvae.toString();
      document.getElementById('queenJelly')!.textContent = Math.floor(this.currentColony.queen_jelly || 0).toString();
      document.getElementById('population')!.textContent = this.currentColony.population.toString();
      
      // Update AI status
      const aiStatus = document.getElementById('aiStatus');
      if (aiStatus) {
        aiStatus.textContent = this.currentColony.ai_enabled ? 'ON' : 'OFF';
      }
      
      document.getElementById('createColonyBtn')!.style.display = 'none';
      document.getElementById('colonyActions')!.style.display = 'flex';
    } else {
      document.getElementById('createColonyBtn')!.style.display = 'block';
      document.getElementById('colonyActions')!.style.display = 'none';
    }

    // Update selection info
    if (this.selectedAntIds.length > 0) {
      const ants = this.selectedAntIds.map(id => this.ants.get(id)).filter(a => a);
      if (ants.length > 0) {
        const types = new Map<AntType, number>();
        ants.forEach(ant => {
          types.set(ant!.ant_type, (types.get(ant!.ant_type) || 0) + 1);
        });
        const info = Array.from(types.entries())
          .map(([type, count]) => `${count} ${type}`)
          .join(', ');
        document.getElementById('selectedInfo')!.textContent = `Selected: ${info}`;
      }
    } else {
      document.getElementById('selectedInfo')!.textContent = 'No selection';
    }
    
    // Update unit panel
    this.updateUnitPanel();
  }

  private startRenderLoop() {
    const render = () => {
      const antsArray = Array.from(this.ants.values());
      const coloniesArray = Array.from(this.colonies.values());
      const chambersArray = Array.from(this.chambers.values());
      const resourcesArray = Array.from(this.resources.values());
      
      this.viewport.render(antsArray, coloniesArray, chambersArray, resourcesArray);
      requestAnimationFrame(render);
    };
    render();
  }

  async createColony() {
    const username = prompt('Enter your username:');
    if (!username) return;

    await this.service.call('create_player', { username });
    
    // Create colony at a random position
    const x = (Math.random() - 0.5) * 200;
    const y = (Math.random() - 0.5) * 200;
    await this.service.call('create_colony', { x, y });
    
    // Focus camera on new colony
    this.viewport.focusOnPosition(x, y, -10);
  }

  async spawnAnt(antType: AntType) {
    if (!this.currentColony) return;
    
    // Spawn near the queen
    const queen = Array.from(this.ants.values())
      .find(ant => ant.colony_id === this.currentColony!.id && ant.ant_type === AntType.Queen);
    
    if (!queen) return;
    
    const x = queen.x + (Math.random() - 0.5) * 20;
    const y = queen.y + (Math.random() - 0.5) * 20;
    const z = queen.z;
    
    await this.service.call('spawn_ant', {
      colony_id: this.currentColony.id,
      ant_type: antType,
      x, y, z
    });
  }

  async buildChamber(chamberType: ChamberType) {
    if (!this.currentColony) return;
    
    // For now, build near the throne room
    const throneRoom = Array.from(this.chambers.values())
      .find(chamber => chamber.colony_id === this.currentColony!.id && chamber.chamber_type === ChamberType.ThroneRoom);
    
    if (!throneRoom) return;
    
    const angle = Math.random() * Math.PI * 2;
    const distance = 50;
    const x = throneRoom.x + Math.cos(angle) * distance;
    const y = throneRoom.y + Math.sin(angle) * distance;
    const z = throneRoom.z;
    
    await this.service.call('build_chamber', {
      colony_id: this.currentColony.id,
      chamber_type: chamberType,
      x, y, z
    });
  }

  handleMapClick(x: number, y: number, isRightClick: boolean) {
    if (this.huntMode && isRightClick) {
      // Send hunting party to location
      this.service.call('hive_command_hunt', {
        colony_id: this.currentColony!.id,
        target_x: x,
        target_y: y,
        target_z: this.viewport.cameraZ
      });
      // Exit hunt mode
      this.huntMode = false;
      const btn = document.getElementById('huntBtn')!;
      btn.classList.remove('active');
      btn.textContent = '⚔️ Hunt Mode';
    } else if (isRightClick && this.selectedAntIds.length > 0) {
      // Command selected ants
      this.service.call('command_ants', {
        ant_ids: this.selectedAntIds,
        target_x: x,
        target_y: y,
        target_z: this.viewport.cameraZ
      });
    } else {
      // Select ants at this position
      const clickRadius = 20;
      const clickedAnts: number[] = [];
      
      this.ants.forEach(ant => {
        const distance = Math.sqrt((ant.x - x) ** 2 + (ant.y - y) ** 2);
        if (distance < clickRadius && ant.colony_id === this.currentColony?.id) {
          clickedAnts.push(ant.id);
        }
      });
      
      if (clickedAnts.length > 0) {
        this.selectedAntIds = clickedAnts;
        this.viewport.selectAnts(clickedAnts);
      } else {
        this.selectedAntIds = [];
        this.viewport.clearSelection();
      }
      
      this.updateUI();
    }
  }
  
  private updateUnitPanel() {
    const unitList = document.getElementById('unitList');
    if (!unitList || !this.currentColony) return;
    
    // Group ants by type
    const antsByType = new Map<AntType, Ant[]>();
    this.ants.forEach(ant => {
      if (ant.colony_id === this.currentColony!.id) {
        if (!antsByType.has(ant.ant_type)) {
          antsByType.set(ant.ant_type, []);
        }
        antsByType.get(ant.ant_type)!.push(ant);
      }
    });
    
    // Generate HTML
    let html = '';
    const typeOrder = [AntType.Queen, AntType.Worker, AntType.Soldier, AntType.Scout, AntType.Major];
    
    typeOrder.forEach(type => {
      const ants = antsByType.get(type) || [];
      if (ants.length === 0) return;
      
      html += `
        <div class="unit-group expanded" data-type="${type}">
          <div class="unit-group-header">
            <span>${type}s</span>
            <span class="unit-group-count">${ants.length}</span>
          </div>
          <div class="unit-items">
      `;
      
      ants.forEach(ant => {
        const isSelected = this.selectedAntIds.includes(ant.id);
        const healthPercent = (ant.health / ant.max_health) * 100;
        let status = '';
        let statusClass = '';
        
        if (ant.task === TaskType.Gathering) {
          status = 'Gathering';
          statusClass = 'gathering';
        } else if (ant.task === TaskType.Fighting) {
          status = 'Fighting';
          statusClass = 'fighting';
        } else if (ant.task === TaskType.Returning) {
          status = 'Returning';
          statusClass = 'returning';
        } else if (ant.task === TaskType.Exploring) {
          status = 'Moving';
        }
        
        const icon = type === AntType.Queen ? '👑' :
                     type === AntType.Worker ? '⚒️' :
                     type === AntType.Soldier ? '⚔️' :
                     type === AntType.Scout ? '🔍' :
                     type === AntType.Major ? '🛡️' : '';
        
        html += `
          <div class="unit-item ${isSelected ? 'selected' : ''}" data-id="${ant.id}">
            <span>${icon} #${ant.id}</span>
            <div class="unit-health">
              <div class="health-bar">
                <div class="health-fill" style="width: ${healthPercent}%"></div>
              </div>
              ${status ? `<span class="unit-status ${statusClass}">${status}</span>` : ''}
            </div>
          </div>
        `;
      });
      
      html += `
          </div>
        </div>
      `;
    });
    
    unitList.innerHTML = html;
    
    // Add event listeners
    unitList.querySelectorAll('.unit-group-header').forEach(header => {
      header.addEventListener('click', (e) => {
        e.stopPropagation();
        const group = (e.currentTarget as HTMLElement).parentElement!;
        const wasExpanded = group.classList.contains('expanded');
        
        // Toggle expansion
        group.classList.toggle('expanded');
        
        // Only select all if we're expanding
        if (!wasExpanded) {
          const type = group.dataset.type as AntType;
          const ants = antsByType.get(type) || [];
          if (ants.length > 0) {
            this.selectedAntIds = ants.map(a => a.id);
            this.viewport.selectAnts(this.selectedAntIds);
            this.updateUI();
          }
        }
      });
    });
    
    unitList.querySelectorAll('.unit-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        const antId = parseInt((e.currentTarget as HTMLElement).dataset.id!);
        const ant = this.ants.get(antId);
        if (!ant) return;
        
        if (e.shiftKey || e.ctrlKey || e.metaKey) {
          // Add/remove from selection
          const index = this.selectedAntIds.indexOf(antId);
          if (index >= 0) {
            this.selectedAntIds.splice(index, 1);
          } else {
            this.selectedAntIds.push(antId);
          }
        } else {
          // Single selection
          this.selectedAntIds = [antId];
          // Focus camera on ant
          this.viewport.focusOnPosition(ant.x, ant.y, ant.z);
        }
        
        this.viewport.selectAnts(this.selectedAntIds);
        this.updateUI();
      });
    });
  }
}

// Initialize game
declare global {
  interface Window {
    game: InsectColonyWarsGame;
  }
}

async function init() {
  // Check if we should use mock mode
  const useMock = new URLSearchParams(window.location.search).has('mock') || 
                  window.location.hostname === 'localhost';
  
  let service;
  if (useMock) {
    console.log('Using mock SpacetimeDB service...');
    const { MockSpacetimeService } = await import('./services/spacetime-mock-rts');
    service = new MockSpacetimeService();
  } else {
    console.log('Connecting to SpacetimeDB...');
    const { SpacetimeService } = await import('./services/spacetime');
    service = new SpacetimeService();
  }
  
  const game = new InsectColonyWarsGame();
  window.game = game;
  
  await game.connect(service);
  console.log('Game initialized!');
}

init().catch(console.error);