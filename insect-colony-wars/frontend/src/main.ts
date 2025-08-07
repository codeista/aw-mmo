import './style.css';
import { createImprovedUI, updateThreatLevel, addAlert, updateUnitBreakdown } from './ui-redesign';

// Command Queue Interface
interface CommandQueueItem {
  id: string;
  antIds: number[];
  command: string;
  targetX?: number;
  targetY?: number;
  targetZ?: number;
  priority: 'low' | 'normal' | 'high';
  repeat: boolean;
  status: 'pending' | 'executing' | 'completed';
  createdAt: number;
}

// Types matching the backend
export enum AntType {
  Queen = 'Queen',
  YoungQueen = 'YoungQueen',
  Worker = 'Worker',
  RoyalWorker = 'RoyalWorker',
  Soldier = 'Soldier',
  Scout = 'Scout',
  Major = 'Major'
}

export enum ResourceType {
  Food = 'Food',
  Water = 'Water',
  Minerals = 'Minerals',
  Larvae = 'Larvae'
}

export enum ChamberType {
  Nursery = 'Nursery',
  Storage = 'Storage',
  Barracks = 'Barracks',
  ThroneRoom = 'ThroneRoom',
  Burrow = 'Burrow'
}

export enum TaskType {
  Idle = 'Idle',
  Gathering = 'Gathering',
  Building = 'Building',
  Fighting = 'Fighting',
  Exploring = 'Exploring',
  Returning = 'Returning',
  Digging = 'Digging',
  Entering = 'Entering',
  Exiting = 'Exiting',
  Depositing = 'Depositing'
}

export enum AntTrait {
  // Combat traits
  AcidSpray = 'AcidSpray',      // +50% damage, damage over time
  Venomous = 'Venomous',        // Attacks slow enemies
  Armored = 'Armored',          // +25% health, -10% speed
  
  // Movement traits  
  Swift = 'Swift',              // +50% movement speed
  Climber = 'Climber',          // Can traverse obstacles
  Tunneler = 'Tunneler',        // +50% digging speed
  
  // Work traits
  Strong = 'Strong',            // +50% carrying capacity
  Efficient = 'Efficient',      // -25% jelly consumption
  Industrious = 'Industrious',  // +25% work speed
  
  // Special traits
  Pheromone = 'Pheromone',      // Mimics colony scent, tricks enemy scouts/defenders
  Regenerator = 'Regenerator',  // Slowly heals over time
  Scout = 'Scout',              // +50% vision range
  
  // Queen-specific traits (for young queens)
  Fertile = 'Fertile',          // +50% larvae production
  Matriarch = 'Matriarch',      // Colony starts with bonus population
  Survivor = 'Survivor'         // Start with +50% extra jelly
}

interface Player {
  id: string;
  username: string;
  created_at: number;
  total_colonies: number;
  resources_gathered: number;
  generations_survived: number;
  queens_produced: number;
  best_colony_score: number;
}

interface Colony {
  id: number;
  player_id: string;
  queen_id: number | null;
  food: number;
  water: number;
  minerals: number;
  larvae: number;
  queen_jelly: number;
  population: number;
  territory_radius: number;
  created_at: number;
  ai_enabled: boolean;
  queen_trait?: AntTrait;
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
  jelly_consumption_rate: number;
  last_fed_at: number;
  trait_type?: AntTrait;
  maturation_time?: number;
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

export interface ResourceNode {
  id: number;
  resource_type: ResourceType;
  x: number;
  y: number;
  z: number;
  amount: number;
  max_amount: number;
  regeneration_rate: number;
}

interface ExploredTerritory {
  id: number;
  colony_id: number;
  x: number;
  y: number;
  z: number;
  discovered_at: number;
  has_resources: boolean;
  has_threats: boolean;
  threat_level: number;
}

interface DiscoveredResource {
  id: number;
  colony_id: number;
  resource_id: number;
  discovered_at: number;
}

interface Obstacle {
  id: number;
  obstacle_type: string; // "rock", "plant", "log", "leaf"
  x: number;
  y: number;
  width: number;
  height: number;
  blocks_movement: boolean;
}

interface Prey {
  id: number;
  prey_type: string; // "aphid", "caterpillar", "termite"
  x: number;
  y: number;
  health: number;
  max_health: number;
  speed: number;
  food_value: number;
  flee_distance: number;
}

interface Predator {
  id: number;
  predator_type: string; // "spider", "bird", "beetle"
  x: number;
  y: number;
  health: number;
  max_health: number;
  speed: number;
  attack_damage: number;
  hunt_radius: number;
  target_ant_id: number | null;
}

interface Larva {
  id: number;
  colony_id: number;
  x: number;
  y: number;
  z: number;
  age: number;
  created_at: number;
}

interface Tunnel {
  id: number;
  colony_id: number;
  start_x: number;
  start_y: number;
  start_z: number;
  end_x: number;
  end_y: number;
  end_z: number;
}

// 3D Viewport for underground visualization
class UndergroundViewport {
  public canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  public cameraX: number = 0;
  public cameraY: number = 0;
  public cameraZ: number = -10;
  public zoom: number = 1;
  private selectedAnts: Set<number> = new Set();
  private isDragging: boolean = false;
  private lastMouseX: number = 0;
  private lastMouseY: number = 0;
  
  // Performance metrics
  private frameCount: number = 0;
  private lastFpsUpdate: number = Date.now();
  private currentFps: number = 0;
  private entitiesRendered: number = 0;
  private entitiesCulled: number = 0;
  private showPerformanceMetrics: boolean = false;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.setupEventListeners();
    this.resize();
  }

  private setupEventListeners() {
    window.addEventListener('resize', () => this.resize());
    
    // Keyboard shortcuts
    window.addEventListener('keydown', (e) => {
      if (e.key === 'p' || e.key === 'P') {
        this.showPerformanceMetrics = !this.showPerformanceMetrics;
      }
    });
    
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
      e.preventDefault();
      e.stopPropagation();
      const rect = this.canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left - this.canvas.width / 2) / this.zoom + this.cameraX;
      const y = (e.clientY - rect.top - this.canvas.height / 2) / this.zoom + this.cameraY;
      this.handleClick(x, y);
    });

    this.canvas.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      e.stopPropagation();
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

  private getViewportBounds(): { left: number, right: number, top: number, bottom: number } {
    const halfWidth = this.canvas.width / (2 * this.zoom);
    const halfHeight = this.canvas.height / (2 * this.zoom);
    return {
      left: this.cameraX - halfWidth - 50, // Add 50 unit buffer
      right: this.cameraX + halfWidth + 50,
      top: this.cameraY - halfHeight - 50,
      bottom: this.cameraY + halfHeight + 50
    };
  }

  private isInViewport(x: number, y: number): boolean {
    const bounds = this.getViewportBounds();
    return x >= bounds.left && x <= bounds.right && 
           y >= bounds.top && y <= bounds.bottom;
  }

  render(ants: Ant[], colonies: Colony[], chambers: Chamber[], resources: ResourceNode[], 
         obstacles: Obstacle[], prey: Prey[], predators: Predator[], larvae: Larva[],
         placementMode: boolean = false, previewX: number = 0, previewY: number = 0,
         debugMode: boolean = false) {
    if (!this.canvas.width || !this.canvas.height) {
      this.resize();
    }
    
    // Reset performance counters
    this.entitiesRendered = 0;
    this.entitiesCulled = 0;
    
    // Update FPS
    this.frameCount++;
    const now = Date.now();
    if (now - this.lastFpsUpdate > 1000) {
      this.currentFps = Math.round(this.frameCount * 1000 / (now - this.lastFpsUpdate));
      this.frameCount = 0;
      this.lastFpsUpdate = now;
    }
    
    // Render environment based on surface/underground
    if (this.cameraZ >= -5) {
      this.renderSurfaceEnvironment();
    } else {
      this.renderUndergroundEnvironment();
    }

    // Draw subtle grid overlay (optional)
    // this.drawGrid();
    
    // Filter entities based on current camera Z level
    const zRange = 15; // How far above/below current level we can see
    const isUnderground = this.cameraZ < -5;
    
    // Draw surface features only on surface
    if (!isUnderground) {
      // Draw obstacles on surface
      obstacles.forEach(obstacle => {
        // Viewport culling
        if (!this.isInViewport(obstacle.x, obstacle.y)) {
          this.entitiesCulled++;
          return;
        }
        this.entitiesRendered++;
        
        const [x, y] = this.worldToScreen(obstacle.x, obstacle.y, 0);
        
        this.ctx.save();
        
        // Set style based on obstacle type
        switch (obstacle.obstacle_type) {
          case 'rock':
            this.ctx.fillStyle = '#5a5a5a';
            this.ctx.strokeStyle = '#3a3a3a';
            break;
          case 'plant':
            this.ctx.fillStyle = '#228b22';
            this.ctx.strokeStyle = '#006400';
            break;
          case 'log':
            this.ctx.fillStyle = '#8B4513';
            this.ctx.strokeStyle = '#654321';
            break;
          case 'leaf':
            this.ctx.fillStyle = '#90EE90';
            this.ctx.strokeStyle = '#228B22';
            break;
        }
        
        const width = obstacle.width * this.zoom;
        const height = obstacle.height * this.zoom;
        
        // Draw obstacle with specific shapes
        this.drawObstacle(x, y, width, height, obstacle.obstacle_type);
        
        this.ctx.restore();
      });
    }

    // Draw fog of war effect first
    this.drawFogOfWar(ants, colonies, chambers);
    
    // Draw resources based on view
    if (!isUnderground) {
      // Surface resources (food sources)
      resources.forEach(resource => {
        // Only show surface resources (z >= 0)
        if (resource.z < 0) return;
        // Viewport culling
        if (!this.isInViewport(resource.x, resource.y)) return;
        
        // Check if this resource is discovered by the current colony
        if (window.game && window.game.currentColony) {
          const isDiscovered = Array.from(window.game.discoveredResources.values())
            .some(dr => dr.colony_id === window.game.currentColony!.id && dr.resource_id === resource.id);
          
          if (!isDiscovered) {
            return; // Skip undiscovered resources
          }
        }
        
        const [x, y] = this.worldToScreen(resource.x, resource.y, resource.z);
        const size = 20 * this.zoom;
        
        if (resource.resource_type === ResourceType.Food) {
          this.ctx.fillStyle = '#4CAF50'; // Green for food
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
    } else {
      // Underground resources (water, minerals from digging)
      resources.forEach(resource => {
        // Only show underground resources
        if (resource.z >= 0) return;
        if (Math.abs(resource.z - this.cameraZ) > zRange) return;
        // Viewport culling
        if (!this.isInViewport(resource.x, resource.y)) return;
        
        const [x, y] = this.worldToScreen(resource.x, resource.y, resource.z);
        const size = 20 * this.zoom;
        
        if (resource.resource_type === ResourceType.Water) {
          this.ctx.fillStyle = '#00BCD4'; // Cyan for water
        } else if (resource.resource_type === ResourceType.Minerals) {
          this.ctx.fillStyle = '#FF9800'; // Orange for minerals
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
    }
    
    // Draw prey on surface only
    if (!isUnderground) {
      prey.forEach(p => {
        // Viewport culling
        if (!this.isInViewport(p.x, p.y)) return;
        
        const [x, y] = this.worldToScreen(p.x, p.y, 0);
        
        this.ctx.save();
        
        // Set color based on prey type
        switch (p.prey_type) {
          case 'aphid':
            this.ctx.fillStyle = '#90EE90'; // Light green
            break;
          case 'caterpillar':
            this.ctx.fillStyle = '#32CD32'; // Lime green
            break;
          case 'termite':
            this.ctx.fillStyle = '#DEB887'; // Burlywood
            break;
        }
        
        // Draw prey with specific shapes
        const size = 8 * this.zoom;
        this.drawPrey(x, y, size, p.prey_type);
        
        // Draw health bar
        const healthPercent = p.health / p.max_health;
        const barWidth = size * 2;
        const barHeight = 3 * this.zoom;
        this.ctx.fillStyle = 'red';
        this.ctx.fillRect(x - barWidth / 2, y - size - 8, barWidth, barHeight);
        this.ctx.fillStyle = 'green';
        this.ctx.fillRect(x - barWidth / 2, y - size - 8, barWidth * healthPercent, barHeight);
        
        this.ctx.restore();
      });
    }
    
    // Draw predators on surface
    if (!isUnderground) {
      predators.forEach(pred => {
        // Viewport culling
        if (!this.isInViewport(pred.x, pred.y)) return;
        
        const [x, y] = this.worldToScreen(pred.x, pred.y, 0);
        
        this.ctx.save();
        
        // Set color based on predator type
        switch (pred.predator_type) {
          case 'spider':
            this.ctx.fillStyle = '#4B0082'; // Indigo
            break;
          case 'bird':
            this.ctx.fillStyle = '#8B4513'; // Saddle brown
            break;
          case 'beetle':
            this.ctx.fillStyle = '#2F4F4F'; // Dark slate gray
            break;
        }
        
        // Draw predator with specific shapes
        const size = 15 * this.zoom;
        this.drawPredator(x, y, size, pred.predator_type);
        
        // Draw danger indicator
        if (pred.target_ant_id) {
          this.ctx.strokeStyle = 'red';
          this.ctx.lineWidth = 2;
          this.ctx.beginPath();
          this.ctx.arc(x, y, size * 1.5, 0, Math.PI * 2);
          this.ctx.stroke();
        }
        
        // Bird-specific indicators
        if (pred.predator_type === 'bird') {
          const boredom = (pred as any).boredom || 0;
          
          // Show boredom level
          if (boredom > 200) {
            // Getting bored - show question marks
            this.ctx.font = 'bold 16px Arial';
            this.ctx.fillStyle = 'yellow';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('?', x - size, y - size * 2);
            this.ctx.fillText('?', x + size, y - size * 2);
          }
          
          // Flying away animation
          if ((pred as any).flying_away) {
            this.ctx.save();
            this.ctx.globalAlpha = 0.5;
            // Draw upward motion lines
            this.ctx.strokeStyle = 'white';
            this.ctx.lineWidth = 2;
            for (let i = 0; i < 3; i++) {
              this.ctx.beginPath();
              this.ctx.moveTo(x - size + i * size, y + size);
              this.ctx.lineTo(x - size + i * size, y + size * 2);
              this.ctx.stroke();
            }
            this.ctx.restore();
          }
          
          // Show circling behavior when searching
          if (!pred.target_ant_id && boredom < 200) {
            const circleRadius = size * 3;
            this.ctx.save();
            this.ctx.strokeStyle = 'rgba(139, 69, 19, 0.3)';
            this.ctx.lineWidth = 1;
            this.ctx.setLineDash([5, 5]);
            this.ctx.beginPath();
            this.ctx.arc(x, y, circleRadius, 0, Math.PI * 2);
            this.ctx.stroke();
            this.ctx.restore();
          }
        }
        
        this.ctx.restore();
      });
    }

    // Draw tunnel connections between chambers (underground only)
    if (isUnderground) {
      // Group chambers by colony
      const chambersByColony = new Map<number, Chamber[]>();
      chambers.forEach(c => {
        if (Math.abs(c.z - this.cameraZ) <= zRange) {
          if (!chambersByColony.has(c.colony_id)) {
            chambersByColony.set(c.colony_id, []);
          }
          chambersByColony.get(c.colony_id)!.push(c);
        }
      });
      
      // Draw tunnels between chambers of the same colony
      this.ctx.save();
      chambersByColony.forEach(colonyChambers => {
        for (let i = 0; i < colonyChambers.length; i++) {
          for (let j = i + 1; j < colonyChambers.length; j++) {
            const c1 = colonyChambers[i];
            const c2 = colonyChambers[j];
            
            // Only connect chambers that are close enough
            const dist = Math.sqrt((c1.x - c2.x) ** 2 + (c1.y - c2.y) ** 2);
            if (dist < 150 && Math.abs(c1.z - c2.z) < 5) {
            const [x1, y1] = this.worldToScreen(c1.x, c1.y, c1.z);
            const [x2, y2] = this.worldToScreen(c2.x, c2.y, c2.z);
            
            // Draw tunnel
            this.ctx.strokeStyle = '#654321';
            this.ctx.lineWidth = 15 * this.zoom;
            this.ctx.lineCap = 'round';
            this.ctx.beginPath();
            this.ctx.moveTo(x1, y1);
            this.ctx.lineTo(x2, y2);
            this.ctx.stroke();
            
            // Draw inner tunnel
            this.ctx.strokeStyle = '#1a1a1a';
            this.ctx.lineWidth = 10 * this.zoom;
            this.ctx.beginPath();
            this.ctx.moveTo(x1, y1);
            this.ctx.lineTo(x2, y2);
            this.ctx.stroke();
            }
          }
        }
      });
      this.ctx.restore();
    }
    
    // Draw tunnels between chambers first (underground only)
    if (isUnderground) {
      this.drawChamberConnections(chambers);
    }
    
    // Draw chambers based on view
    chambers.forEach(chamber => {
      // Viewport culling
      if (!this.isInViewport(chamber.x, chamber.y)) return;
      
      // Burrows: Show entrance on surface, show as chamber underground
      if (chamber.chamber_type === ChamberType.Burrow) {
        const isEntrance = (chamber as any).is_entrance;
        
        if (!isUnderground && isEntrance) {
          // Surface view - show entrance hole only for entrance markers
          const [x, y] = this.worldToScreen(chamber.x, chamber.y, 0);
          const size = 25 * this.zoom;
          
          // Draw burrow entrance with depth effect
          const pulse = Math.sin(Date.now() * 0.002) * 0.05 + 1;
          
          // Dirt mound around entrance
          this.ctx.fillStyle = '#8B6914';
          this.ctx.beginPath();
          this.ctx.ellipse(x, y, size * 1.2 * pulse, size * pulse, 0, 0, Math.PI * 2);
          this.ctx.fill();
          
          // Dark tunnel entrance with gradient for depth
          const holeGradient = this.ctx.createRadialGradient(x, y - size * 0.1, 0, x, y, size * 0.8);
          holeGradient.addColorStop(0, '#000000');
          holeGradient.addColorStop(0.5, '#0a0a0a');
          holeGradient.addColorStop(0.8, '#1a1a1a');
          holeGradient.addColorStop(1, '#2a2a2a');
          this.ctx.fillStyle = holeGradient;
          this.ctx.beginPath();
          this.ctx.ellipse(x, y, size * 0.7 * pulse, size * 0.5 * pulse, 0, 0, Math.PI * 2);
          this.ctx.fill();
          
          // Inner tunnel depth
          this.ctx.strokeStyle = '#000000';
          this.ctx.lineWidth = 2;
          this.ctx.beginPath();
          this.ctx.ellipse(x, y + size * 0.05, size * 0.4, size * 0.3, 0, 0, Math.PI * 2);
          this.ctx.stroke();
          
          // Small label
          this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
          this.ctx.font = `${10 * this.zoom}px Arial`;
          this.ctx.textAlign = 'center';
          this.ctx.fillText('Tunnel', x, y + size * 1.3);
        } else if (isUnderground && !isEntrance) {
          // Underground view - show actual burrow chamber only
          if (Math.abs(chamber.z - this.cameraZ) > zRange) return;
          this.drawUndergroundChamber(chamber);
        }
        return;
      }
      
      // Other chambers - only show underground
      if (!isUnderground) return;
      if (Math.abs(chamber.z - this.cameraZ) > zRange) return;
      
      this.drawUndergroundChamber(chamber);
    });
    
    // Draw larvae in underground view
    if (isUnderground) {
      const visibleLarvae = larvae.filter(
        larva => Math.abs(larva.z - this.cameraZ) < zRange
      );
      
      visibleLarvae.forEach(larva => {
        const [x, y] = this.worldToScreen(larva.x, larva.y, larva.z);
        const age = (Date.now() - larva.created_at) / 1000; // Age in seconds
        const size = (8 + Math.min(age * 0.5, 4)) * this.zoom; // Grow over time
        
        // Draw larva/egg
        this.ctx.save();
        
        // Egg gradient
        const eggGradient = this.ctx.createRadialGradient(
          x - size * 0.3, y - size * 0.3, 0,
          x, y, size
        );
        eggGradient.addColorStop(0, '#FFF8DC'); // Cream color
        eggGradient.addColorStop(0.7, '#F0E68C'); // Khaki
        eggGradient.addColorStop(1, '#DEB887'); // Burlywood
        
        this.ctx.fillStyle = eggGradient;
        this.ctx.beginPath();
        this.ctx.ellipse(x, y, size * 0.7, size, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Egg highlight
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        this.ctx.beginPath();
        this.ctx.ellipse(x - size * 0.2, y - size * 0.3, size * 0.3, size * 0.4, -Math.PI / 4, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Show slight movement for older larvae
        if (age > 10) {
          const wiggle = Math.sin(Date.now() * 0.01 + larva.id) * 2;
          this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
          this.ctx.lineWidth = 1;
          this.ctx.beginPath();
          this.ctx.arc(x + wiggle, y, size * 1.1, 0, Math.PI * 2);
          this.ctx.stroke();
        }
        
        this.ctx.restore();
      });
    }
    
    // Draw ants based on view
    ants.forEach(ant => {
      // Surface view: only show ants on surface (z >= 0)
      // Underground view: only show ants underground (z < 0)
      if (!isUnderground && ant.z < 0) return; // Don't show underground ants in surface view
      if (isUnderground && ant.z >= 0) return; // Don't show surface ants in underground view
      
      // Viewport culling - critical for performance with many ants
      if (!this.isInViewport(ant.x, ant.y)) {
        this.entitiesCulled++;
        return;
      }
      this.entitiesRendered++;
      
      const [x, y] = this.worldToScreen(ant.x, ant.y, ant.z);
      const size = this.getAntSize(ant.ant_type) * this.zoom;
      
      // Draw selection ring if selected
      if (this.selectedAnts.has(ant.id)) {
        this.ctx.strokeStyle = '#00FF00';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(x, y, size / 2 + 5, 0, Math.PI * 2);
        this.ctx.stroke();
      }
      
      // Draw ant with depth fade
      const depthDiff = Math.abs(ant.z - this.cameraZ);
      const opacity = Math.max(0.3, 1 - (depthDiff / 30));
      this.ctx.save();
      this.ctx.globalAlpha = opacity;
      
      // Level of Detail based on zoom
      if (this.zoom < 0.7) {
        // Far away - just dots
        this.drawAntDot(x, y, ant, size);
      } else if (this.zoom < 1.5) {
        // Medium distance - simple shapes
        this.drawSimpleAnt(x, y, ant, size);
      } else {
        // Close up - full animated detail
        this.drawAnimatedAnt(x, y, ant, size);
      }
      
      // Simple carrying indicator
      if (ant.carrying_resource && ant.carrying_amount > 0) {
        const resourceColors: Record<string, string> = {
          'Food': '#4CAF50',
          'Water': '#2196F3',
          'Minerals': '#FF9800',
          'Larvae': '#E91E63'
        };
        
        const resourceColor = resourceColors[ant.carrying_resource] || '#999';
        
        // Draw resource dot above ant with subtle bobbing
        const bobOffset = Math.sin(Date.now() * 0.003 + ant.id) * 1;
        this.ctx.fillStyle = resourceColor;
        this.ctx.globalAlpha = 0.9;
        this.ctx.beginPath();
        this.ctx.arc(x, y - size * 0.7 + bobOffset, 3 * this.zoom, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Add small outline for visibility
        this.ctx.strokeStyle = 'white';
        this.ctx.lineWidth = 0.5;
        this.ctx.stroke();
      }
      
      // Draw digging animation for queens building
      if (ant.ant_type === AntType.Queen && ant.task === TaskType.Building) {
        const time = Date.now() * 0.001;
        const pulse = Math.sin(time * 4) * 0.5 + 0.5;
        
        // Draw dirt particles
        this.ctx.fillStyle = `rgba(139, 69, 19, ${pulse * 0.7})`;
        for (let i = 0; i < 5; i++) {
          const angle = (i / 5) * Math.PI * 2 + time;
          const dist = 15 + pulse * 10;
          const px = x + Math.cos(angle) * dist;
          const py = y + Math.sin(angle) * dist;
          this.ctx.beginPath();
          this.ctx.arc(px, py, 3, 0, Math.PI * 2);
          this.ctx.fill();
        }
        
        // Draw "DIGGING" text
        this.ctx.fillStyle = '#FFD700';
        this.ctx.font = 'bold 12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('DIGGING', x, y - size);
      }
      
      // Draw laying animation for queens depositing (laying eggs)
      if (ant.ant_type === AntType.Queen && ant.task === TaskType.Depositing) {
        const time = Date.now() * 0.001;
        const pulse = Math.sin(time * 3) * 0.5 + 0.5;
        
        // Draw glowing effect
        this.ctx.fillStyle = `rgba(255, 215, 0, ${pulse * 0.3})`;
        this.ctx.beginPath();
        this.ctx.arc(x, y + size * 0.5, size * pulse, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Draw "LAYING" text
        this.ctx.fillStyle = '#FFD700';
        this.ctx.font = 'bold 12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('LAYING', x, y - size);
      }
      
      this.ctx.restore();
      
      // Draw health bar
      const healthPercent = ant.health / ant.max_health;
      const barWidth = size;
      const barHeight = 4 * this.zoom;
      this.ctx.fillStyle = 'red';
      this.ctx.fillRect(x - barWidth / 2, y - size / 2 - 10, barWidth, barHeight);
      this.ctx.fillStyle = healthPercent > 0.3 ? 'green' : 'yellow';
      this.ctx.fillRect(x - barWidth / 2, y - size / 2 - 10, barWidth * healthPercent, barHeight);
      
      // Draw energy bar (hunger indicator)
      const energy = (ant as any).energy || 100;
      const energyPercent = energy / 100;
      const energyBarY = y - size / 2 - 16; // Place above health bar
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      this.ctx.fillRect(x - barWidth / 2, energyBarY, barWidth, barHeight);
      
      // Color based on energy level
      if (energyPercent > 0.5) {
        this.ctx.fillStyle = '#2196F3'; // Blue when well-fed
      } else if (energyPercent > 0.25) {
        this.ctx.fillStyle = '#FF9800'; // Orange when hungry
      } else {
        this.ctx.fillStyle = '#F44336'; // Red when starving
      }
      this.ctx.fillRect(x - barWidth / 2, energyBarY, barWidth * energyPercent, barHeight);
      
      // Draw hunger warning icon if energy < 25%
      if (energyPercent <= 0.25 && energyPercent > 0) {
        this.ctx.fillStyle = '#F44336';
        this.ctx.font = `${10 * this.zoom}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.fillText('!', x + size / 2 + 5, y - size / 2);
      }
      
      // Draw wounded indicator
      if ((ant as any).wounded) {
        this.ctx.save();
        this.ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
        this.ctx.beginPath();
        this.ctx.arc(x, y, size * 0.7, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Pulse effect for critical health
        if (healthPercent < 0.3) {
          const pulse = Math.sin(Date.now() * 0.01) * 0.5 + 0.5;
          this.ctx.fillStyle = `rgba(255, 0, 0, ${pulse * 0.5})`;
          this.ctx.beginPath();
          this.ctx.arc(x, y, size * 1.2, 0, Math.PI * 2);
          this.ctx.fill();
        }
        this.ctx.restore();
      }
      
      // Draw carrying indicator
      if (ant.carrying_resource) {
        if (ant.carrying_resource === ResourceType.Food) {
          this.ctx.fillStyle = '#4CAF50';
        } else if (ant.carrying_resource === ResourceType.Water) {
          this.ctx.fillStyle = '#00BCD4';
        } else if (ant.carrying_resource === ResourceType.Minerals) {
          this.ctx.fillStyle = '#FF9800';
        }
        this.ctx.beginPath();
        this.ctx.arc(x + size / 3, y - size / 3, 4 * this.zoom, 0, Math.PI * 2);
        this.ctx.fill();
      }
    });
    
    // Draw placement preview
    if (placementMode) {
      const [x, y] = this.worldToScreen(previewX, previewY, -5);
      const size = this.getAntSize(AntType.Queen) * this.zoom;
      
      // Draw semi-transparent queen preview
      this.ctx.fillStyle = 'rgba(255, 215, 0, 0.5)'; // Gold with 50% opacity
      this.ctx.strokeStyle = '#FFD700';
      this.ctx.lineWidth = 2;
      
      // Draw preview circle
      this.ctx.beginPath();
      this.ctx.arc(x, y, size / 2, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.stroke();
      
      // Draw placement indicator
      this.ctx.strokeStyle = 'rgba(255, 215, 0, 0.8)';
      this.ctx.setLineDash([5, 5]);
      this.ctx.beginPath();
      this.ctx.arc(x, y, size * 2, 0, Math.PI * 2);
      this.ctx.stroke();
      this.ctx.setLineDash([]);
    }
    
    // Draw debug overlay
    if (debugMode) {
      this.drawDebugOverlay(ants, resources, colonies);
    }
    
    // Draw performance metrics (toggle with P key)
    if (this.showPerformanceMetrics || debugMode) {
      this.drawPerformanceMetrics();
    }
  }
  
  private drawPerformanceMetrics() {
    const metrics = [
      `FPS: ${this.currentFps}`,
      `Zoom: ${this.zoom.toFixed(2)}x`,
      `Rendered: ${this.entitiesRendered}`,
      `Culled: ${this.entitiesCulled}`,
      `Camera: (${Math.round(this.cameraX)}, ${Math.round(this.cameraY)}, ${Math.round(this.cameraZ)})`
    ];
    
    // Background
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(10, 10, 150, metrics.length * 20 + 10);
    
    // Text
    this.ctx.fillStyle = '#00FF00';
    this.ctx.font = '12px monospace';
    this.ctx.textAlign = 'left';
    metrics.forEach((metric, i) => {
      this.ctx.fillText(metric, 15, 25 + i * 20);
    });
  }
  
  private drawChamberConnections(chambers: Chamber[]) {
    // Group chambers by colony and Z level
    const chambersByColony = new Map<number, Chamber[]>();
    chambers.forEach(chamber => {
      // Only connect underground chambers
      if (chamber.z >= 0) return;
      if (!this.isInViewport(chamber.x, chamber.y)) return;
      
      if (!chambersByColony.has(chamber.colony_id)) {
        chambersByColony.set(chamber.colony_id, []);
      }
      chambersByColony.get(chamber.colony_id)!.push(chamber);
    });
    
    // Draw tunnels between chambers of same colony
    chambersByColony.forEach((colonyChambers, colonyId) => {
      // Connect each chamber to nearby chambers
      for (let i = 0; i < colonyChambers.length; i++) {
        for (let j = i + 1; j < colonyChambers.length; j++) {
          const chamber1 = colonyChambers[i];
          const chamber2 = colonyChambers[j];
          
          // Only connect chambers on same Z level or within 10 units vertically
          if (Math.abs(chamber1.z - chamber2.z) > 10) continue;
          
          // Calculate distance
          const dist = Math.sqrt(
            Math.pow(chamber1.x - chamber2.x, 2) + 
            Math.pow(chamber1.y - chamber2.y, 2)
          );
          
          // Only connect if within reasonable distance (150 units)
          if (dist > 150) continue;
          
          // Draw tunnel
          const [x1, y1] = this.worldToScreen(chamber1.x, chamber1.y, chamber1.z);
          const [x2, y2] = this.worldToScreen(chamber2.x, chamber2.y, chamber2.z);
          
          // Tunnel style
          this.ctx.save();
          this.ctx.strokeStyle = '#2a1a0a';
          this.ctx.lineWidth = 15 * this.zoom;
          this.ctx.lineCap = 'round';
          
          // Draw tunnel background (carved earth)
          this.ctx.beginPath();
          this.ctx.moveTo(x1, y1);
          this.ctx.lineTo(x2, y2);
          this.ctx.stroke();
          
          // Draw tunnel interior
          this.ctx.strokeStyle = '#1a1a1a';
          this.ctx.lineWidth = 12 * this.zoom;
          this.ctx.beginPath();
          this.ctx.moveTo(x1, y1);
          this.ctx.lineTo(x2, y2);
          this.ctx.stroke();
          
          // Add slight gradient for depth
          const gradient = this.ctx.createLinearGradient(x1, y1, x2, y2);
          gradient.addColorStop(0, 'rgba(0, 0, 0, 0.3)');
          gradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.1)');
          gradient.addColorStop(1, 'rgba(0, 0, 0, 0.3)');
          this.ctx.strokeStyle = gradient;
          this.ctx.lineWidth = 10 * this.zoom;
          this.ctx.beginPath();
          this.ctx.moveTo(x1, y1);
          this.ctx.lineTo(x2, y2);
          this.ctx.stroke();
          
          this.ctx.restore();
        }
      }
    });
  }
  
  private drawUndergroundChamber(chamber: Chamber) {
    const [x, y] = this.worldToScreen(chamber.x, chamber.y, chamber.z);
    // Much larger chambers for more space
    let size = 80 * this.zoom; // Base size increased from 50 to 80
    
    // Different sizes for different chamber types
    switch (chamber.chamber_type) {
      case ChamberType.ThroneRoom:
        size = 100 * this.zoom; // Largest for the queen
        break;
      case ChamberType.Burrow:
        size = 90 * this.zoom; // Main entrance needs space
        break;
      case ChamberType.Barracks:
        size = 120 * this.zoom; // Barracks need lots of space for soldiers
        break;
      case ChamberType.Storage:
        size = 70 * this.zoom; // Storage can be smaller
        break;
      case ChamberType.Nursery:
        size = 85 * this.zoom; // Nursery needs room for larvae
        break;
    }
    
    // Enhanced 2.5D carved chamber visualization
    this.ctx.save();
    
    // Draw carved-out effect with depth layers
    const depthLayers = 3;
    for (let i = depthLayers; i >= 0; i--) {
      const layerOffset = i * 2 * this.zoom;
      const layerSize = size + i * 4 * this.zoom;
      
      // Earth/soil color gets darker with depth
      const darkness = 0.7 - (i * 0.1);
      this.ctx.fillStyle = `rgb(${Math.floor(101 * darkness)}, ${Math.floor(67 * darkness)}, ${Math.floor(33 * darkness)})`;
      
      // Draw rounded rectangle for organic feel
      this.roundRect(
        x - layerSize / 2 - layerOffset,
        y - layerSize / 2 - layerOffset,
        layerSize + layerOffset * 2,
        layerSize + layerOffset * 2,
        8 * this.zoom
      );
      this.ctx.fill();
    }
    
    // Draw inner chamber space
    let chamberColor = '#1a1a1a'; // Dark chamber interior
    let glowColor = 'rgba(255, 255, 255, 0.1)'; // Default glow
    
    // Special colors for chamber types
    switch (chamber.chamber_type) {
      case ChamberType.ThroneRoom:
        glowColor = 'rgba(255, 215, 0, 0.3)'; // Gold glow
        break;
      case ChamberType.Nursery:
        glowColor = 'rgba(255, 105, 180, 0.3)'; // Pink glow
        break;
      case ChamberType.Storage:
        glowColor = 'rgba(139, 69, 19, 0.3)'; // Brown glow
        break;
      case ChamberType.Barracks:
        glowColor = 'rgba(220, 20, 60, 0.3)'; // Crimson glow
        break;
    }
    
    // Chamber interior with gradient for depth
    const centerGradient = this.ctx.createRadialGradient(x, y, 0, x, y, size / 2);
    centerGradient.addColorStop(0, chamberColor);
    centerGradient.addColorStop(0.7, '#0a0a0a');
    centerGradient.addColorStop(1, '#000000');
    this.ctx.fillStyle = centerGradient;
    this.roundRect(x - size / 2, y - size / 2, size, size, 6 * this.zoom);
    this.ctx.fill();
    
    // Add ambient glow for chamber type
    const glowGradient = this.ctx.createRadialGradient(x, y, size / 4, x, y, size / 2);
    glowGradient.addColorStop(0, glowColor);
    glowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    this.ctx.fillStyle = glowGradient;
    this.roundRect(x - size / 2, y - size / 2, size, size, 6 * this.zoom);
    this.ctx.fill();
    
    // Draw chamber type icon with better styling
    this.ctx.fillStyle = 'white';
    this.ctx.font = `bold ${14 * this.zoom}px Arial`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    
    let icon = '';
    switch (chamber.chamber_type) {
      case ChamberType.ThroneRoom:
        icon = '👑';
        break;
      case ChamberType.Nursery:
        icon = '🥚';
        break;
      case ChamberType.Storage:
        icon = '📦';
        break;
      case ChamberType.Barracks:
        icon = '⚔️';
        break;
      default:
        icon = chamber.chamber_type[0];
    }
    
    this.ctx.fillText(icon, x, y);
    
    // Add subtle shadows for 3D effect
    this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
    this.ctx.lineWidth = 2 * this.zoom;
    this.roundRect(x - size / 2, y - size / 2, size, size, 6 * this.zoom);
    this.ctx.stroke();
    
    this.ctx.restore();
  }
  
  private drawDebugOverlay(ants: Ant[], resources: ResourceNode[], colonies: Colony[]) {
    // Draw vision ranges for scouts
    ants.filter(ant => ant.ant_type === AntType.Scout).forEach(scout => {
      const [x, y] = this.worldToScreen(scout.x, scout.y, scout.z);
      const visionRange = 50 * this.zoom; // Scout vision range
      
      this.ctx.strokeStyle = 'rgba(0, 255, 0, 0.2)';
      this.ctx.lineWidth = 1;
      this.ctx.beginPath();
      this.ctx.arc(x, y, visionRange, 0, Math.PI * 2);
      this.ctx.stroke();
    });
    
    // Draw territory influence for colonies
    colonies.forEach(colony => {
      if (colony.queen_id) {
        const queen = ants.find(a => a.id === colony.queen_id);
        if (queen) {
          const [x, y] = this.worldToScreen(queen.x, queen.y, queen.z);
          const territoryRadius = colony.territory_radius * this.zoom;
          
          this.ctx.strokeStyle = 'rgba(255, 215, 0, 0.3)';
          this.ctx.lineWidth = 2;
          this.ctx.setLineDash([10, 5]);
          this.ctx.beginPath();
          this.ctx.arc(x, y, territoryRadius, 0, Math.PI * 2);
          this.ctx.stroke();
          this.ctx.setLineDash([]);
        }
      }
    });
    
    // Show resource amounts and discovery status
    resources.forEach(resource => {
      const [x, y] = this.worldToScreen(resource.x, resource.y, resource.z);
      
      // Check if discovered
      const isDiscovered = window.game && window.game.discoveredResources && 
        Array.from(window.game.discoveredResources.values()).some(dr => dr.resource_id === resource.id);
      
      this.ctx.fillStyle = isDiscovered ? 'rgba(0, 255, 0, 0.8)' : 'rgba(255, 0, 0, 0.8)';
      this.ctx.font = `${10 * this.zoom}px Arial`;
      this.ctx.textAlign = 'center';
      this.ctx.fillText(
        `${resource.resource_type}: ${Math.floor(resource.amount)}/${resource.max_amount}`,
        x, y - 20 * this.zoom
      );
    });
    
    // Draw ant paths and targets
    ants.forEach(ant => {
      if (ant.target_x !== null && ant.target_y !== null) {
        const [sx, sy] = this.worldToScreen(ant.x, ant.y, ant.z);
        const [tx, ty] = this.worldToScreen(ant.target_x, ant.target_y, ant.target_z || ant.z);
        
        this.ctx.strokeStyle = 'rgba(255, 255, 0, 0.3)';
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([3, 3]);
        this.ctx.beginPath();
        this.ctx.moveTo(sx, sy);
        this.ctx.lineTo(tx, ty);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
        
        // Draw target marker
        this.ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
        this.ctx.beginPath();
        this.ctx.arc(tx, ty, 3 * this.zoom, 0, Math.PI * 2);
        this.ctx.fill();
      }
    });
    
    // Game state info overlay
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(10, 10, 300, 150);
    
    this.ctx.fillStyle = '#00FF00';
    this.ctx.font = '14px monospace';
    this.ctx.textAlign = 'left';
    
    const totalAnts = ants.length;
    const workers = ants.filter(a => a.ant_type === AntType.Worker).length;
    const scouts = ants.filter(a => a.ant_type === AntType.Scout).length;
    const soldiers = ants.filter(a => a.ant_type === AntType.Soldier).length;
    const discoveredResources = window.game ? 
      Array.from(window.game.discoveredResources.values()).length : 0;
    const totalResources = resources.length;
    
    this.ctx.fillText(`Debug Mode (Shift+D to toggle)`, 20, 30);
    this.ctx.fillText(`Total Ants: ${totalAnts}`, 20, 50);
    this.ctx.fillText(`Workers: ${workers} | Scouts: ${scouts} | Soldiers: ${soldiers}`, 20, 70);
    this.ctx.fillText(`Resources: ${discoveredResources}/${totalResources} discovered`, 20, 90);
    this.ctx.fillText(`Camera: (${Math.floor(this.cameraX)}, ${Math.floor(this.cameraY)}, ${Math.floor(this.cameraZ)})`, 20, 110);
    this.ctx.fillText(`Zoom: ${this.zoom.toFixed(2)}x`, 20, 130);
  }

  private drawFogOfWar(ants: Ant[], colonies: Colony[], chambers: Chamber[]) {
    if (!window.game || !window.game.currentColony) return;
    
    const fogRadius = 80; // Vision radius around friendly units
    const colonyId = window.game.currentColony.id;
    
    // Create a fog layer
    this.ctx.save();
    this.ctx.globalCompositeOperation = 'multiply';
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'; // Dark fog
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Clear fog around friendly units
    this.ctx.globalCompositeOperation = 'destination-out';
    
    ants.forEach(ant => {
      if (ant.colony_id === colonyId && Math.abs(ant.z - this.cameraZ) < 15) {
        const [x, y] = this.worldToScreen(ant.x, ant.y, ant.z);
        const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, fogRadius * this.zoom);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.5)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(x, y, fogRadius * this.zoom, 0, Math.PI * 2);
        this.ctx.fill();
      }
    });
    
    // Clear fog around friendly chambers
    chambers.forEach(chamber => {
      if (chamber.colony_id === colonyId && Math.abs(chamber.z - this.cameraZ) < 15) {
        const [x, y] = this.worldToScreen(chamber.x, chamber.y, chamber.z);
        const chamberRadius = chamber.chamber_type === ChamberType.Burrow ? 100 : 60;
        
        const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, chamberRadius * this.zoom);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.5)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(x, y, chamberRadius * this.zoom, 0, Math.PI * 2);
        this.ctx.fill();
      }
    });
    
    this.ctx.restore();
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
      case AntType.YoungQueen: return 18;
      case AntType.Major: return 16;
      case AntType.Soldier: return 12;
      case AntType.Worker: return 10;
      case AntType.RoyalWorker: return 12;
      case AntType.Scout: return 8;
    }
  }
  
  private roundRect(x: number, y: number, width: number, height: number, radius: number) {
    this.ctx.beginPath();
    this.ctx.moveTo(x + radius, y);
    this.ctx.lineTo(x + width - radius, y);
    this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    this.ctx.lineTo(x + width, y + height - radius);
    this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    this.ctx.lineTo(x + radius, y + height);
    this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    this.ctx.lineTo(x, y + radius);
    this.ctx.quadraticCurveTo(x, y, x + radius, y);
    this.ctx.closePath();
  }
  
  private drawSimpleAnt(x: number, y: number, ant: Ant, size: number) {
    // Medium detail - basic shapes without complex animations
    const antColor = this.getAntColor(ant.ant_type);
    
    // Simple body segments
    this.ctx.fillStyle = antColor;
    this.ctx.strokeStyle = this.darkenColor(antColor, 0.7);
    this.ctx.lineWidth = 0.5;
    
    // Calculate direction if moving
    let direction = 0;
    if (ant.target_x !== null && ant.target_y !== null) {
      const dx = ant.target_x - ant.x;
      const dy = ant.target_y - ant.y;
      direction = Math.atan2(dy, dx);
    }
    
    this.ctx.save();
    this.ctx.translate(x, y);
    this.ctx.rotate(direction);
    
    // Abdomen
    this.ctx.beginPath();
    this.ctx.ellipse(-3, 0, size * 0.4, size * 0.3, 0, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Thorax
    this.ctx.beginPath();
    this.ctx.ellipse(0, 0, size * 0.3, size * 0.25, 0, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Head
    this.ctx.beginPath();
    this.ctx.ellipse(3, 0, size * 0.25, size * 0.2, 0, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Simple trait indicator
    if (ant.trait_type) {
      this.ctx.fillStyle = this.getTraitColor(ant.trait_type);
      this.ctx.beginPath();
      this.ctx.arc(0, -size * 0.4, 2, 0, Math.PI * 2);
      this.ctx.fill();
    }
    
    this.ctx.restore();
  }
  
  private drawAntDot(x: number, y: number, ant: Ant, size: number) {
    // Minimal detail - just a colored dot
    const antColor = this.getAntColor(ant.ant_type);
    this.ctx.fillStyle = antColor;
    this.ctx.beginPath();
    this.ctx.arc(x, y, Math.max(2, size * 0.15), 0, Math.PI * 2);
    this.ctx.fill();
    
    // Tiny trait indicator
    if (ant.trait_type) {
      this.ctx.fillStyle = this.getTraitColor(ant.trait_type);
      this.ctx.beginPath();
      this.ctx.arc(x, y - 3, 1, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }
  
  private getTraitColor(trait: string): string {
    switch(trait) {
      case 'acid': return '#00FF00';
      case 'speed': return '#00FFFF';
      case 'strength': return '#FF0000';
      case 'pheromone': return '#FF00FF';
      default: return '#FFFF00';
    }
  }
  
  private drawAnimatedAnt(x: number, y: number, ant: Ant, size: number) {
    const time = Date.now() * 0.001;
    const moving = ant.task === TaskType.Exploring || ant.task === TaskType.Returning || 
                   ant.task === TaskType.Gathering || ant.task === TaskType.Fighting ||
                   ant.task === TaskType.Entering || ant.task === TaskType.Exiting;
    
    // Calculate ant direction and speed based on movement
    let direction = 0;
    let moveSpeed = 0;
    if (ant.target_x !== null && ant.target_y !== null) {
      const dx = ant.target_x - ant.x;
      const dy = ant.target_y - ant.y;
      direction = Math.atan2(dy, dx);
      // Calculate actual movement speed
      moveSpeed = Math.sqrt(dx * dx + dy * dy) > 0.5 ? (ant.speed || 1) : 0;
    }
    
    // Body oscillation for realistic movement
    const bodyBounce = moving ? Math.sin(time * moveSpeed * 12) * 0.5 : 0;
    
    this.ctx.save();
    this.ctx.translate(x, y + bodyBounce);
    this.ctx.rotate(direction);
    
    // Scale based on ant type
    const scale = size / 20; // Base size is 20
    this.ctx.scale(scale, scale);
    
    // Shadow for depth
    this.ctx.save();
    this.ctx.globalAlpha = 0.3;
    this.ctx.fillStyle = 'black';
    this.ctx.beginPath();
    this.ctx.ellipse(0, 8, 8, 3, 0, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.restore();
    
    // Get ant color
    const antColor = this.getAntColor(ant.ant_type);
    this.ctx.fillStyle = antColor;
    this.ctx.strokeStyle = this.darkenColor(antColor, 0.7);
    this.ctx.lineWidth = 0.5;
    
    // Legs animation (drawn before body for proper layering)
    // Tripod gait: alternating sets of 3 legs
    this.ctx.strokeStyle = this.darkenColor(antColor, 0.8);
    this.ctx.lineWidth = 0.8;
    this.ctx.lineCap = 'round';
    
    for (let i = 0; i < 3; i++) {
      const legX = i * 3 - 4;
      // Tripod gait: legs 0,2,4 move together, legs 1,3,5 move together
      const legSet = i % 2;
      const legPhase = moving ? time * moveSpeed * 10 + legSet * Math.PI : 0;
      
      // Calculate realistic leg positions
      const stepCycle = Math.sin(legPhase);
      const liftCycle = Math.max(0, Math.sin(legPhase * 2)) * (moving ? 1 : 0);
      
      // Forward/backward movement
      const legReach = stepCycle * 3 * (moving ? 1 : 0.3);
      // Vertical lift during step
      const legLift = liftCycle * 2;
      
      // Upper legs (left side)
      this.ctx.beginPath();
      this.ctx.moveTo(legX, -3);
      const upperKneeX = legX + legReach;
      const upperKneeY = -5 + legLift;
      const upperFootX = upperKneeX + stepCycle * 2;
      const upperFootY = -7 + legLift * 0.5;
      
      // Draw with bezier for smooth joints
      this.ctx.quadraticCurveTo(upperKneeX, upperKneeY, upperFootX, upperFootY);
      this.ctx.stroke();
      
      // Lower legs (right side) - opposite phase
      const lowerPhase = legPhase + Math.PI;
      const lowerStepCycle = Math.sin(lowerPhase);
      const lowerLiftCycle = Math.max(0, Math.sin(lowerPhase * 2)) * (moving ? 1 : 0);
      const lowerReach = lowerStepCycle * 3 * (moving ? 1 : 0.3);
      const lowerLift = lowerLiftCycle * 2;
      
      this.ctx.beginPath();
      this.ctx.moveTo(legX, 3);
      const lowerKneeX = legX + lowerReach;
      const lowerKneeY = 5 - lowerLift;
      const lowerFootX = lowerKneeX + lowerStepCycle * 2;
      const lowerFootY = 7 - lowerLift * 0.5;
      
      this.ctx.quadraticCurveTo(lowerKneeX, lowerKneeY, lowerFootX, lowerFootY);
      this.ctx.stroke();
    }
    
    // Abdomen (back segment) with breathing animation
    const breathe = Math.sin(time * 3 + ant.id) * 0.1 + 1;
    const abdomenWiggle = moving ? Math.sin(time * moveSpeed * 8 + ant.id) * 0.1 : 0;
    this.ctx.save();
    this.ctx.translate(-6, 0);
    this.ctx.rotate(abdomenWiggle);
    
    // Gradient for abdomen
    const abdomenGradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, 6);
    abdomenGradient.addColorStop(0, antColor);
    abdomenGradient.addColorStop(1, this.darkenColor(antColor, 0.8));
    this.ctx.fillStyle = abdomenGradient;
    
    this.ctx.beginPath();
    this.ctx.ellipse(0, 0, 6 * breathe, 4 * breathe, 0, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.stroke();
    
    // Abdominal segments
    this.ctx.strokeStyle = this.darkenColor(antColor, 0.6);
    this.ctx.lineWidth = 0.3;
    for (let i = 1; i <= 2; i++) {
      this.ctx.beginPath();
      this.ctx.arc(0, 0, 6 * breathe - i * 1.5, -Math.PI * 0.6, Math.PI * 0.6);
      this.ctx.stroke();
    }
    this.ctx.restore();
    
    // Thorax (middle segment) with gradient
    const thoraxGradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, 4);
    thoraxGradient.addColorStop(0, antColor);
    thoraxGradient.addColorStop(1, this.darkenColor(antColor, 0.7));
    this.ctx.fillStyle = thoraxGradient;
    
    this.ctx.beginPath();
    this.ctx.ellipse(0, 0, 4, 3, 0, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.stroke();
    
    // Head (front segment) with nodding animation
    const headBob = moving ? Math.sin(time * moveSpeed * 10 + ant.id) * 0.08 : 0;
    this.ctx.save();
    this.ctx.translate(4, 0);
    this.ctx.rotate(headBob);
    
    // Head gradient
    const headGradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, 3);
    headGradient.addColorStop(0, antColor);
    headGradient.addColorStop(1, this.darkenColor(antColor, 0.7));
    this.ctx.fillStyle = headGradient;
    
    this.ctx.beginPath();
    this.ctx.ellipse(0, 0, 3, 2.5, 0, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.stroke();
    
    // Compound eyes with shine
    this.ctx.fillStyle = 'black';
    this.ctx.beginPath();
    this.ctx.ellipse(1, -1.2, 0.8, 0.6, -Math.PI * 0.2, 0, Math.PI * 2);
    this.ctx.ellipse(1, 1.2, 0.8, 0.6, Math.PI * 0.2, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Eye shine
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    this.ctx.beginPath();
    this.ctx.arc(1.2, -1, 0.2, 0, Math.PI * 2);
    this.ctx.arc(1.2, 1, 0.2, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Animated antennae with sensing movement
    this.ctx.strokeStyle = this.darkenColor(antColor, 0.6);
    this.ctx.lineWidth = 0.4;
    this.ctx.lineCap = 'round';
    
    const antennaSense = Math.sin(time * 5 + ant.id) * 0.15;
    const antennaTwitch = Math.sin(time * 15 + ant.id * 2) * 0.1;
    
    // Left antenna
    this.ctx.beginPath();
    this.ctx.moveTo(2, -1);
    this.ctx.quadraticCurveTo(
      3.5, -2 + antennaSense,
      5 + antennaTwitch, -1.5 + antennaSense
    );
    this.ctx.stroke();
    
    // Right antenna
    this.ctx.beginPath();
    this.ctx.moveTo(2, 1);
    this.ctx.quadraticCurveTo(
      3.5, 2 - antennaSense,
      5 - antennaTwitch, 1.5 - antennaSense
    );
    this.ctx.stroke();
    
    // Mandibles for soldiers and majors (animated)
    if (ant.ant_type === AntType.Soldier || ant.ant_type === AntType.Major) {
      const mandibleOpen = ant.task === TaskType.Fighting ? 
        Math.abs(Math.sin(time * 8)) * 0.8 : 0.2;
      
      this.ctx.fillStyle = this.darkenColor(antColor, 0.5);
      this.ctx.strokeStyle = this.darkenColor(antColor, 0.7);
      this.ctx.lineWidth = 0.5;
      
      // Upper mandible
      this.ctx.save();
      this.ctx.translate(3, -1);
      this.ctx.rotate(-mandibleOpen);
      this.ctx.beginPath();
      this.ctx.moveTo(0, 0);
      this.ctx.lineTo(2, -0.5);
      this.ctx.lineTo(1.5, 0.5);
      this.ctx.closePath();
      this.ctx.fill();
      this.ctx.stroke();
      this.ctx.restore();
      
      // Lower mandible
      this.ctx.save();
      this.ctx.translate(3, 1);
      this.ctx.rotate(mandibleOpen);
      this.ctx.beginPath();
      this.ctx.moveTo(0, 0);
      this.ctx.lineTo(2, 0.5);
      this.ctx.lineTo(1.5, -0.5);
      this.ctx.closePath();
      this.ctx.fill();
      this.ctx.stroke();
      this.ctx.restore();
    }
    
    this.ctx.restore(); // Restore from head transform
    
    // Wings for young queens (animated)
    if (ant.ant_type === AntType.YoungQueen) {
      const wingBeat = Math.sin(time * 15) * 0.3 + 0.2;
      const wingShimmer = Math.abs(Math.sin(time * 20));
      
      this.ctx.save();
      this.ctx.globalAlpha = 0.4 + wingShimmer * 0.2;
      this.ctx.fillStyle = 'white';
      this.ctx.strokeStyle = 'rgba(200, 200, 200, 0.5)';
      this.ctx.lineWidth = 0.2;
      
      // Left wing
      this.ctx.save();
      this.ctx.translate(-2, -2);
      this.ctx.rotate(-wingBeat);
      this.ctx.beginPath();
      this.ctx.moveTo(0, 0);
      this.ctx.quadraticCurveTo(-8, -4, -10, 0);
      this.ctx.quadraticCurveTo(-8, 1, 0, 0);
      this.ctx.fill();
      this.ctx.stroke();
      this.ctx.restore();
      
      // Right wing
      this.ctx.save();
      this.ctx.translate(-2, 2);
      this.ctx.rotate(wingBeat);
      this.ctx.beginPath();
      this.ctx.moveTo(0, 0);
      this.ctx.quadraticCurveTo(-8, 4, -10, 0);
      this.ctx.quadraticCurveTo(-8, -1, 0, 0);
      this.ctx.fill();
      this.ctx.stroke();
      this.ctx.restore();
      
      this.ctx.restore();
    }
    
    // Trait effects
    if (ant.trait_type) {
      this.drawTraitEffect(0, 0, ant.trait_type, time + ant.id);
    }
    
    // Queen crown (animated)
    if (ant.ant_type === AntType.Queen || ant.ant_type === AntType.YoungQueen) {
      this.ctx.save();
      this.ctx.translate(4, 0);
      this.ctx.rotate(Math.sin(time * 2) * 0.05);
      
      const crownGradient = this.ctx.createLinearGradient(2, -5, 5, -3);
      crownGradient.addColorStop(0, '#FFD700');
      crownGradient.addColorStop(0.5, '#FFA500');
      crownGradient.addColorStop(1, '#FFD700');
      
      this.ctx.fillStyle = crownGradient;
      this.ctx.strokeStyle = '#FFA500';
      this.ctx.lineWidth = 0.3;
      this.ctx.beginPath();
      this.ctx.moveTo(-1, -2);
      this.ctx.lineTo(-2, -4);
      this.ctx.lineTo(-0.5, -3.5);
      this.ctx.lineTo(0.5, -5);
      this.ctx.lineTo(1.5, -3.5);
      this.ctx.lineTo(3, -4);
      this.ctx.lineTo(2, -2);
      this.ctx.closePath();
      this.ctx.fill();
      this.ctx.stroke();
      
      // Crown jewel
      this.ctx.fillStyle = '#FF1493';
      this.ctx.beginPath();
      this.ctx.arc(0.5, -3.5, 0.5, 0, Math.PI * 2);
      this.ctx.fill();
      
      this.ctx.restore();
    }
    
    this.ctx.restore();
  }
  
  private drawPrey(x: number, y: number, size: number, preyType: string) {
    this.ctx.save();
    
    switch (preyType) {
      case 'aphid':
        // Aphid: Small oval body with tiny legs
        this.ctx.fillStyle = '#90EE90';
        this.ctx.beginPath();
        this.ctx.ellipse(x, y, size * 0.8, size * 0.6, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Tiny black dots for eyes
        this.ctx.fillStyle = 'black';
        this.ctx.beginPath();
        this.ctx.arc(x - size * 0.3, y - size * 0.2, size * 0.1, 0, Math.PI * 2);
        this.ctx.arc(x + size * 0.3, y - size * 0.2, size * 0.1, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Tiny legs
        this.ctx.strokeStyle = '#4CAF50';
        this.ctx.lineWidth = 1;
        for (let i = 0; i < 3; i++) {
          const legX = x + (i - 1) * size * 0.4;
          this.ctx.beginPath();
          this.ctx.moveTo(legX, y);
          this.ctx.lineTo(legX - size * 0.1, y + size * 0.5);
          this.ctx.moveTo(legX, y);
          this.ctx.lineTo(legX + size * 0.1, y + size * 0.5);
          this.ctx.stroke();
        }
        break;
        
      case 'caterpillar':
        // Caterpillar: Segmented body
        this.ctx.fillStyle = '#32CD32';
        const segments = 4;
        for (let i = 0; i < segments; i++) {
          const segX = x + (i - segments/2) * size * 0.5;
          const segSize = size * 0.7 * (1 - i * 0.05); // Taper
          this.ctx.beginPath();
          this.ctx.arc(segX, y, segSize, 0, Math.PI * 2);
          this.ctx.fill();
        }
        
        // Head
        this.ctx.fillStyle = '#228B22';
        this.ctx.beginPath();
        this.ctx.arc(x - segments * size * 0.25, y, size * 0.8, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Eyes
        this.ctx.fillStyle = 'black';
        this.ctx.beginPath();
        this.ctx.arc(x - segments * size * 0.25 - size * 0.3, y - size * 0.2, size * 0.15, 0, Math.PI * 2);
        this.ctx.arc(x - segments * size * 0.25 + size * 0.1, y - size * 0.2, size * 0.15, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Tiny legs on each segment
        this.ctx.strokeStyle = '#228B22';
        this.ctx.lineWidth = 1;
        for (let i = 0; i < segments; i++) {
          const segX = x + (i - segments/2) * size * 0.5;
          this.ctx.beginPath();
          this.ctx.moveTo(segX, y + size * 0.5);
          this.ctx.lineTo(segX - size * 0.2, y + size * 0.8);
          this.ctx.moveTo(segX, y + size * 0.5);
          this.ctx.lineTo(segX + size * 0.2, y + size * 0.8);
          this.ctx.stroke();
        }
        break;
        
      case 'termite':
        // Termite: White/beige elongated body with visible segments
        this.ctx.fillStyle = '#DEB887';
        
        // Abdomen
        this.ctx.beginPath();
        this.ctx.ellipse(x, y + size * 0.2, size * 0.9, size * 0.6, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Thorax
        this.ctx.fillStyle = '#D2B48C';
        this.ctx.beginPath();
        this.ctx.arc(x, y - size * 0.3, size * 0.5, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Head
        this.ctx.fillStyle = '#CD853F';
        this.ctx.beginPath();
        this.ctx.arc(x, y - size * 0.7, size * 0.4, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Mandibles
        this.ctx.strokeStyle = '#8B4513';
        this.ctx.lineWidth = 1.5;
        this.ctx.beginPath();
        this.ctx.moveTo(x - size * 0.2, y - size * 0.8);
        this.ctx.lineTo(x - size * 0.4, y - size);
        this.ctx.moveTo(x + size * 0.2, y - size * 0.8);
        this.ctx.lineTo(x + size * 0.4, y - size);
        this.ctx.stroke();
        
        // Legs
        this.ctx.strokeStyle = '#D2B48C';
        this.ctx.lineWidth = 1;
        for (let i = 0; i < 3; i++) {
          const legY = y - size * 0.3 + i * size * 0.3;
          this.ctx.beginPath();
          this.ctx.moveTo(x - size * 0.4, legY);
          this.ctx.lineTo(x - size * 0.7, legY + size * 0.2);
          this.ctx.moveTo(x + size * 0.4, legY);
          this.ctx.lineTo(x + size * 0.7, legY + size * 0.2);
          this.ctx.stroke();
        }
        break;
    }
    
    this.ctx.restore();
  }
  
  private drawPredator(x: number, y: number, size: number, predatorType: string) {
    this.ctx.save();
    
    switch (predatorType) {
      case 'spider':
        // Spider body (cephalothorax and abdomen)
        this.ctx.fillStyle = '#4B0082';
        this.ctx.beginPath();
        this.ctx.arc(x, y, size * 0.8, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Abdomen
        this.ctx.fillStyle = '#483D8B';
        this.ctx.beginPath();
        this.ctx.ellipse(x, y + size * 0.8, size * 1.2, size * 0.9, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Pattern on abdomen
        this.ctx.strokeStyle = '#191970';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(x, y + size * 0.3);
        this.ctx.lineTo(x - size * 0.3, y + size);
        this.ctx.moveTo(x, y + size * 0.3);
        this.ctx.lineTo(x + size * 0.3, y + size);
        this.ctx.stroke();
        
        // Eyes (multiple)
        this.ctx.fillStyle = 'red';
        const eyePositions = [
          [-0.3, -0.3], [0.3, -0.3],
          [-0.2, -0.4], [0.2, -0.4],
          [-0.4, -0.2], [0.4, -0.2]
        ];
        eyePositions.forEach(([ex, ey]) => {
          this.ctx.beginPath();
          this.ctx.arc(x + ex * size, y + ey * size, size * 0.08, 0, Math.PI * 2);
          this.ctx.fill();
        });
        
        // Legs (8 legs with joints)
        this.ctx.strokeStyle = '#4B0082';
        this.ctx.lineWidth = 2;
        this.ctx.lineCap = 'round';
        for (let i = 0; i < 8; i++) {
          const angle = (i / 8) * Math.PI * 2 - Math.PI / 2;
          const legBaseX = x + Math.cos(angle) * size * 0.6;
          const legBaseY = y + Math.sin(angle) * size * 0.6;
          const legMidX = x + Math.cos(angle) * size * 1.5;
          const legMidY = y + Math.sin(angle) * size * 1.5;
          const legEndX = x + Math.cos(angle) * size * 2;
          const legEndY = y + Math.sin(angle) * size * 2 + size * 0.3;
          
          this.ctx.beginPath();
          this.ctx.moveTo(legBaseX, legBaseY);
          this.ctx.lineTo(legMidX, legMidY);
          this.ctx.lineTo(legEndX, legEndY);
          this.ctx.stroke();
          
          // Leg joint
          this.ctx.fillStyle = '#4B0082';
          this.ctx.beginPath();
          this.ctx.arc(legMidX, legMidY, size * 0.1, 0, Math.PI * 2);
          this.ctx.fill();
        }
        
        // Fangs
        this.ctx.fillStyle = '#DC143C';
        this.ctx.beginPath();
        this.ctx.moveTo(x - size * 0.3, y);
        this.ctx.lineTo(x - size * 0.2, y + size * 0.3);
        this.ctx.lineTo(x - size * 0.1, y);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.moveTo(x + size * 0.3, y);
        this.ctx.lineTo(x + size * 0.2, y + size * 0.3);
        this.ctx.lineTo(x + size * 0.1, y);
        this.ctx.closePath();
        this.ctx.fill();
        break;
        
      case 'bird':
        // Bird body
        this.ctx.fillStyle = '#8B4513';
        this.ctx.beginPath();
        this.ctx.ellipse(x, y, size * 1.2, size * 0.8, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Head
        this.ctx.fillStyle = '#A0522D';
        this.ctx.beginPath();
        this.ctx.arc(x + size * 0.8, y - size * 0.3, size * 0.6, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Beak
        this.ctx.fillStyle = '#FFD700';
        this.ctx.beginPath();
        this.ctx.moveTo(x + size * 1.3, y - size * 0.3);
        this.ctx.lineTo(x + size * 1.8, y - size * 0.2);
        this.ctx.lineTo(x + size * 1.3, y - size * 0.1);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Eye
        this.ctx.fillStyle = 'white';
        this.ctx.beginPath();
        this.ctx.arc(x + size * 0.9, y - size * 0.4, size * 0.2, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillStyle = 'black';
        this.ctx.beginPath();
        this.ctx.arc(x + size * 0.95, y - size * 0.4, size * 0.1, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Wings
        this.ctx.fillStyle = 'rgba(139, 69, 19, 0.7)';
        // Left wing
        this.ctx.beginPath();
        this.ctx.moveTo(x - size * 0.5, y);
        this.ctx.quadraticCurveTo(x - size * 1.8, y - size * 0.8, x - size * 1.5, y + size * 0.5);
        this.ctx.quadraticCurveTo(x - size * 1.2, y + size * 0.3, x - size * 0.5, y);
        this.ctx.fill();
        // Right wing
        this.ctx.beginPath();
        this.ctx.moveTo(x + size * 0.5, y);
        this.ctx.quadraticCurveTo(x + size * 1.8, y - size * 0.8, x + size * 1.5, y + size * 0.5);
        this.ctx.quadraticCurveTo(x + size * 1.2, y + size * 0.3, x + size * 0.5, y);
        this.ctx.fill();
        
        // Tail
        this.ctx.fillStyle = '#A0522D';
        this.ctx.beginPath();
        this.ctx.moveTo(x - size * 1.2, y);
        this.ctx.lineTo(x - size * 1.8, y - size * 0.3);
        this.ctx.lineTo(x - size * 1.6, y + size * 0.3);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Legs
        this.ctx.strokeStyle = '#FFD700';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(x - size * 0.3, y + size * 0.6);
        this.ctx.lineTo(x - size * 0.3, y + size);
        this.ctx.lineTo(x - size * 0.5, y + size * 1.2);
        this.ctx.moveTo(x - size * 0.3, y + size);
        this.ctx.lineTo(x - size * 0.1, y + size * 1.2);
        this.ctx.moveTo(x + size * 0.3, y + size * 0.6);
        this.ctx.lineTo(x + size * 0.3, y + size);
        this.ctx.lineTo(x + size * 0.1, y + size * 1.2);
        this.ctx.moveTo(x + size * 0.3, y + size);
        this.ctx.lineTo(x + size * 0.5, y + size * 1.2);
        this.ctx.stroke();
        break;
        
      case 'beetle':
        // Beetle body (elytra)
        this.ctx.fillStyle = '#2F4F4F';
        this.ctx.beginPath();
        this.ctx.ellipse(x, y, size * 1.1, size * 0.8, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Head
        this.ctx.fillStyle = '#1C1C1C';
        this.ctx.beginPath();
        this.ctx.arc(x + size * 0.9, y, size * 0.5, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Elytra shine
        this.ctx.strokeStyle = '#708090';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(x, y - size * 0.7);
        this.ctx.lineTo(x, y + size * 0.7);
        this.ctx.stroke();
        
        // Horn
        this.ctx.strokeStyle = '#1C1C1C';
        this.ctx.lineWidth = 3;
        this.ctx.lineCap = 'round';
        this.ctx.beginPath();
        this.ctx.moveTo(x + size * 1.2, y);
        this.ctx.quadraticCurveTo(x + size * 1.6, y - size * 0.5, x + size * 1.4, y - size * 0.8);
        this.ctx.stroke();
        
        // Eyes
        this.ctx.fillStyle = '#8B0000';
        this.ctx.beginPath();
        this.ctx.arc(x + size * 0.8, y - size * 0.2, size * 0.15, 0, Math.PI * 2);
        this.ctx.arc(x + size * 0.8, y + size * 0.2, size * 0.15, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Legs (6 sturdy legs)
        this.ctx.strokeStyle = '#1C1C1C';
        this.ctx.lineWidth = 2.5;
        for (let i = 0; i < 3; i++) {
          const legX = x + (i - 1) * size * 0.6;
          // Upper legs
          this.ctx.beginPath();
          this.ctx.moveTo(legX, y - size * 0.7);
          this.ctx.lineTo(legX - size * 0.4, y - size * 1.1);
          this.ctx.lineTo(legX - size * 0.6, y - size * 0.9);
          this.ctx.stroke();
          // Lower legs
          this.ctx.beginPath();
          this.ctx.moveTo(legX, y + size * 0.7);
          this.ctx.lineTo(legX - size * 0.4, y + size * 1.1);
          this.ctx.lineTo(legX - size * 0.6, y + size * 0.9);
          this.ctx.stroke();
        }
        
        // Mandibles
        this.ctx.fillStyle = '#1C1C1C';
        this.ctx.beginPath();
        this.ctx.moveTo(x + size * 1.3, y - size * 0.2);
        this.ctx.lineTo(x + size * 1.6, y - size * 0.1);
        this.ctx.lineTo(x + size * 1.4, y);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.moveTo(x + size * 1.3, y + size * 0.2);
        this.ctx.lineTo(x + size * 1.6, y + size * 0.1);
        this.ctx.lineTo(x + size * 1.4, y);
        this.ctx.closePath();
        this.ctx.fill();
        break;
    }
    
    this.ctx.restore();
  }
  
  private renderSurfaceEnvironment() {
    // Base ground color with variation
    this.ctx.fillStyle = '#3a5f3a'; // Medium green base
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Add a subtle gradient overlay for depth
    const groundGradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    groundGradient.addColorStop(0, 'rgba(74, 124, 74, 0.3)'); // Lighter at top
    groundGradient.addColorStop(1, 'rgba(42, 74, 42, 0.5)'); // Darker at bottom
    this.ctx.fillStyle = groundGradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Add grass texture
    this.ctx.save();
    
    // Create grass pattern
    const grassPattern = this.ctx.createPattern(this.createGrassTexture(), 'repeat');
    if (grassPattern) {
      this.ctx.globalAlpha = 0.7;
      this.ctx.fillStyle = grassPattern;
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.globalAlpha = 1;
    }
    
    // Add random grass blades with stable positions
    this.ctx.strokeStyle = '#4a5f4a';
    this.ctx.lineWidth = 1;
    const grassDensity = 100;
    
    // Use deterministic positions based on canvas size
    for (let i = 0; i < grassDensity; i++) {
      // Generate stable positions using modulo
      const seed = i * 137; // Prime number for better distribution
      const x = (seed * 7) % this.canvas.width;
      const y = (seed * 11) % this.canvas.height;
      const height = ((seed * 13) % 10) + 5;
      const sway = Math.sin(Date.now() * 0.001 + i) * 2;
      
      this.ctx.beginPath();
      this.ctx.moveTo(x, y);
      this.ctx.quadraticCurveTo(x + sway, y - height/2, x + sway * 2, y - height);
      this.ctx.stroke();
    }
    
    // Add dirt patches with stable positions
    this.ctx.globalAlpha = 0.3;
    for (let i = 0; i < 20; i++) {
      const seed = i * 239;
      const x = (seed * 17) % this.canvas.width;
      const y = (seed * 19) % this.canvas.height;
      const size = ((seed * 23) % 30) + 20;
      
      const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, size);
      gradient.addColorStop(0, '#654321');
      gradient.addColorStop(0.5, '#8B7355');
      gradient.addColorStop(1, 'transparent');
      
      this.ctx.fillStyle = gradient;
      this.ctx.beginPath();
      this.ctx.arc(x, y, size, 0, Math.PI * 2);
      this.ctx.fill();
    }
    
    // Add shadows from imaginary trees/leaves above with stable positions
    this.ctx.globalAlpha = 0.1;
    this.ctx.fillStyle = '#1a1a1a';
    for (let i = 0; i < 10; i++) {
      const seed = i * 311;
      const x = (seed * 29) % this.canvas.width;
      const y = (seed * 31) % this.canvas.height;
      const width = ((seed * 37) % 100) + 100;
      const height = ((seed * 41) % 75) + 75;
      const rotation = ((seed * 43) % 628) / 100; // 0 to 2π
      
      this.ctx.save();
      this.ctx.translate(x, y);
      this.ctx.rotate(rotation);
      this.ctx.beginPath();
      this.ctx.ellipse(0, 0, width/2, height/2, 0, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    }
    
    // Ambient lighting effect
    const sunGradient = this.ctx.createRadialGradient(
      this.canvas.width * 0.7, 
      this.canvas.height * 0.3, 
      0,
      this.canvas.width * 0.7, 
      this.canvas.height * 0.3, 
      this.canvas.width * 0.8
    );
    sunGradient.addColorStop(0, 'rgba(255, 255, 200, 0.1)');
    sunGradient.addColorStop(0.5, 'rgba(255, 255, 150, 0.05)');
    sunGradient.addColorStop(1, 'transparent');
    
    this.ctx.globalAlpha = 1;
    this.ctx.fillStyle = sunGradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.restore();
  }
  
  private renderUndergroundEnvironment() {
    // Dark brown underground base
    this.ctx.fillStyle = '#2a1a0a';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Add base soil gradient
    const soilGradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    soilGradient.addColorStop(0, 'rgba(101, 67, 33, 0.3)'); // Lighter brown at top
    soilGradient.addColorStop(0.5, 'rgba(66, 44, 22, 0.4)'); // Medium brown
    soilGradient.addColorStop(1, 'rgba(42, 26, 10, 0.5)'); // Dark brown at bottom
    this.ctx.fillStyle = soilGradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Add layered soil texture
    this.ctx.save();
    
    // Create depth layers
    const layers = 3;
    for (let layer = 0; layer < layers; layer++) {
      this.ctx.globalAlpha = 0.3 - layer * 0.1;
      
      // Soil particles with stable positions
      for (let i = 0; i < 100; i++) {
        const seed = (layer * 1000 + i) * 149;
        const x = (seed * 47) % this.canvas.width;
        const y = (seed * 53) % this.canvas.height;
        const size = ((seed * 59) % (30 - layer * 5)) + 10;
        const darkness = ((seed * 61) % 30) / 100 + 0.2;
        
        const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, size);
        const brown = 101 - layer * 20;
        const green = 67 - layer * 15;
        const blue = 33 - layer * 10;
        gradient.addColorStop(0, `rgba(${brown}, ${green}, ${blue}, ${darkness})`);
        gradient.addColorStop(1, 'transparent');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(x - size, y - size, size * 2, size * 2);
      }
    }
    
    // Rock formations with stable positions
    this.ctx.globalAlpha = 0.4;
    for (let i = 0; i < 30; i++) {
      const seed = i * 163;
      const x = (seed * 67) % this.canvas.width;
      const y = (seed * 71) % this.canvas.height;
      const width = ((seed * 73) % 20) + 20;
      const height = ((seed * 79) % 15) + 15;
      
      this.ctx.fillStyle = '#2a2a2a';
      this.ctx.strokeStyle = '#1a1a1a';
      this.ctx.lineWidth = 2;
      
      this.ctx.beginPath();
      this.ctx.moveTo(x - width/2, y);
      this.ctx.lineTo(x - width/3, y - height);
      this.ctx.lineTo(x + width/3, y - height * 0.8);
      this.ctx.lineTo(x + width/2, y);
      this.ctx.closePath();
      this.ctx.fill();
      this.ctx.stroke();
    }
    
    // Root systems from surface with stable positions
    this.ctx.globalAlpha = 0.2;
    this.ctx.strokeStyle = '#3a2a1a';
    this.ctx.lineWidth = 3;
    for (let i = 0; i < 10; i++) {
      const seed = i * 197;
      const startX = (seed * 83) % this.canvas.width;
      const startY = 0;
      let x = startX;
      let y = startY;
      
      this.ctx.beginPath();
      this.ctx.moveTo(x, y);
      
      // Draw branching root with deterministic pattern
      for (let j = 0; j < 10; j++) {
        const branchSeed = seed + j * 89;
        x += ((branchSeed % 60) - 30) * 1;
        y += ((branchSeed % 10) + 10) * 1;
        this.ctx.lineTo(x, y);
        
        // Occasional branch
        if ((branchSeed % 10) < 3) {
          const branchX = x + ((branchSeed * 97) % 80) - 40;
          const branchY = y + ((branchSeed * 101) % 30);
          this.ctx.moveTo(x, y);
          this.ctx.lineTo(branchX, branchY);
          this.ctx.moveTo(x, y);
        }
      }
      this.ctx.stroke();
    }
    
    // Depth gradient overlay
    const depthGradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    depthGradient.addColorStop(0, 'rgba(0, 0, 0, 0.2)');
    depthGradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.4)');
    depthGradient.addColorStop(1, 'rgba(0, 0, 0, 0.7)');
    
    this.ctx.globalAlpha = 1;
    this.ctx.fillStyle = depthGradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Underground glow from chambers (will be drawn over this)
    this.ctx.globalAlpha = 0.1;
    const glowGradient = this.ctx.createRadialGradient(
      this.canvas.width / 2,
      this.canvas.height / 2,
      0,
      this.canvas.width / 2,
      this.canvas.height / 2,
      Math.max(this.canvas.width, this.canvas.height) / 2
    );
    glowGradient.addColorStop(0, 'rgba(255, 200, 100, 0.2)');
    glowGradient.addColorStop(1, 'transparent');
    
    this.ctx.fillStyle = glowGradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.restore();
  }
  
  private createGrassTexture(): HTMLCanvasElement {
    const textureCanvas = document.createElement('canvas');
    textureCanvas.width = 64;
    textureCanvas.height = 64;
    const ctx = textureCanvas.getContext('2d')!;
    
    // Fill with base grass color
    ctx.fillStyle = '#4a6f4a';
    ctx.fillRect(0, 0, 64, 64);
    
    // Add larger patches of grass variation
    for (let i = 0; i < 30; i++) {
      const seed = i * 13;
      const x = (seed * 7) % 64;
      const y = (seed * 11) % 64;
      const size = ((seed * 5) % 4) + 2;
      const brightness = ((seed * 17) % 30) - 15;
      
      ctx.fillStyle = `rgb(${74 + brightness}, ${111 + brightness}, ${74 + brightness})`;
      ctx.fillRect(x, y, size, size);
    }
    
    // Add darker spots
    for (let i = 0; i < 20; i++) {
      const seed = i * 17;
      const x = (seed * 13) % 64;
      const y = (seed * 19) % 64;
      const brightness = -((seed * 23) % 20) - 10;
      
      ctx.fillStyle = `rgb(${74 + brightness}, ${111 + brightness}, ${74 + brightness})`;
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Add small grass blades with stable pattern
    ctx.strokeStyle = '#4a5f4a';
    ctx.lineWidth = 1;
    for (let i = 0; i < 20; i++) {
      const seed = i * 23;
      const x = (seed * 5) % 64;
      const y = (seed * 7) % 64;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + ((seed * 11) % 4) - 2, y - ((seed * 13) % 6));
      ctx.stroke();
    }
    
    return textureCanvas;
  }
  
  private drawObstacle(x: number, y: number, width: number, height: number, type: string) {
    this.ctx.save();
    
    switch (type) {
      case 'rock':
        // Realistic rock with texture
        this.ctx.fillStyle = '#5a5a5a';
        this.ctx.strokeStyle = '#3a3a3a';
        this.ctx.lineWidth = 2;
        
        // Irregular rock shape
        this.ctx.beginPath();
        const angles = 8;
        for (let i = 0; i < angles; i++) {
          const angle = (i / angles) * Math.PI * 2;
          const radius = (width / 2) * (0.8 + Math.random() * 0.4);
          const px = x + Math.cos(angle) * radius;
          const py = y + Math.sin(angle) * radius;
          
          if (i === 0) {
            this.ctx.moveTo(px, py);
          } else {
            this.ctx.lineTo(px, py);
          }
        }
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();
        
        // Add texture
        this.ctx.globalAlpha = 0.3;
        this.ctx.fillStyle = '#4a4a4a';
        for (let i = 0; i < 5; i++) {
          const tx = x + (Math.random() - 0.5) * width * 0.6;
          const ty = y + (Math.random() - 0.5) * height * 0.6;
          const ts = Math.random() * 10 + 5;
          this.ctx.beginPath();
          this.ctx.arc(tx, ty, ts, 0, Math.PI * 2);
          this.ctx.fill();
        }
        break;
        
      case 'plant':
        // Plant with leaves
        // Stem
        this.ctx.strokeStyle = '#2d5016';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(x, y + height / 2);
        this.ctx.quadraticCurveTo(x + width * 0.1, y, x, y - height / 2);
        this.ctx.stroke();
        
        // Leaves
        this.ctx.fillStyle = '#228b22';
        this.ctx.strokeStyle = '#006400';
        this.ctx.lineWidth = 1;
        
        const leafCount = 5;
        for (let i = 0; i < leafCount; i++) {
          const leafY = y - height / 2 + (i / leafCount) * height;
          const side = i % 2 === 0 ? 1 : -1;
          const leafX = x + side * width * 0.3;
          const leafSize = width * 0.3 * (1 - i / leafCount * 0.5);
          
          this.ctx.beginPath();
          this.ctx.moveTo(x, leafY);
          this.ctx.quadraticCurveTo(
            leafX, leafY - leafSize * 0.5,
            leafX, leafY
          );
          this.ctx.quadraticCurveTo(
            leafX, leafY + leafSize * 0.5,
            x, leafY
          );
          this.ctx.fill();
          this.ctx.stroke();
        }
        break;
        
      case 'log':
        // Fallen log with bark texture
        this.ctx.fillStyle = '#8B4513';
        this.ctx.strokeStyle = '#654321';
        this.ctx.lineWidth = 2;
        
        // Main log body
        this.ctx.beginPath();
        this.ctx.moveTo(x - width / 2, y - height / 3);
        this.ctx.lineTo(x + width / 2, y - height / 3);
        this.ctx.lineTo(x + width / 2, y + height / 3);
        this.ctx.lineTo(x - width / 2, y + height / 3);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();
        
        // End caps (circular)
        this.ctx.beginPath();
        this.ctx.ellipse(x - width / 2, y, height / 3, height / 2, 0, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();
        
        this.ctx.beginPath();
        this.ctx.ellipse(x + width / 2, y, height / 3, height / 2, 0, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();
        
        // Bark lines
        this.ctx.strokeStyle = '#5C4033';
        this.ctx.lineWidth = 1;
        for (let i = 0; i < 8; i++) {
          const lineX = x - width / 2 + (i / 7) * width;
          this.ctx.beginPath();
          this.ctx.moveTo(lineX, y - height / 3);
          this.ctx.lineTo(lineX, y + height / 3);
          this.ctx.stroke();
        }
        
        // Tree rings on end
        this.ctx.strokeStyle = '#654321';
        for (let i = 0; i < 3; i++) {
          const ringSize = (height / 3) * (1 - i * 0.3);
          this.ctx.beginPath();
          this.ctx.ellipse(x + width / 2, y, ringSize * 0.8, ringSize, 0, 0, Math.PI * 2);
          this.ctx.stroke();
        }
        break;
        
      case 'leaf':
        // Fallen leaf with veins
        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.rotate(Math.PI / 6); // Slight rotation
        
        // Leaf shape
        this.ctx.fillStyle = '#90EE90';
        this.ctx.strokeStyle = '#228B22';
        this.ctx.lineWidth = 2;
        
        this.ctx.beginPath();
        this.ctx.moveTo(0, -height / 2);
        this.ctx.quadraticCurveTo(-width / 2, -height / 4, -width / 2, 0);
        this.ctx.quadraticCurveTo(-width / 2, height / 4, 0, height / 2);
        this.ctx.quadraticCurveTo(width / 2, height / 4, width / 2, 0);
        this.ctx.quadraticCurveTo(width / 2, -height / 4, 0, -height / 2);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();
        
        // Central vein
        this.ctx.strokeStyle = '#006400';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(0, -height / 2);
        this.ctx.lineTo(0, height / 2);
        this.ctx.stroke();
        
        // Side veins
        this.ctx.lineWidth = 1;
        for (let i = 0; i < 4; i++) {
          const veinY = -height / 2 + (i + 1) * height / 5;
          this.ctx.beginPath();
          this.ctx.moveTo(0, veinY);
          this.ctx.lineTo(-width / 3, veinY - height / 10);
          this.ctx.moveTo(0, veinY);
          this.ctx.lineTo(width / 3, veinY - height / 10);
          this.ctx.stroke();
        }
        
        this.ctx.restore();
        break;
    }
    
    this.ctx.restore();
  }
  
  private drawTraitEffect(x: number, y: number, trait: string, time: number) {
    this.ctx.save();
    
    switch (trait) {
      case 'acid':
        // Acid droplets
        this.ctx.fillStyle = 'rgba(0, 255, 0, 0.6)';
        for (let i = 0; i < 3; i++) {
          const dropTime = time * 3 + i;
          const dropY = (dropTime % 2) * 10 - 5;
          this.ctx.beginPath();
          this.ctx.arc(x - 8 + i * 3, y + dropY, 1, 0, Math.PI * 2);
          this.ctx.fill();
        }
        break;
        
      case 'speed':
        // Speed lines
        this.ctx.strokeStyle = 'rgba(100, 200, 255, 0.5)';
        this.ctx.lineWidth = 0.5;
        for (let i = 0; i < 3; i++) {
          this.ctx.beginPath();
          this.ctx.moveTo(x - 10, y - 3 + i * 3);
          this.ctx.lineTo(x - 15 - i * 2, y - 3 + i * 3);
          this.ctx.stroke();
        }
        break;
        
      case 'strength':
        // Muscle flex effect
        const flex = Math.sin(time * 5) * 0.2 + 1;
        this.ctx.strokeStyle = 'rgba(255, 100, 100, 0.5)';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(x, y, 8 * flex, 0, Math.PI * 2);
        this.ctx.stroke();
        break;
        
      case 'pheromone':
        // Pheromone trail
        this.ctx.fillStyle = 'rgba(255, 0, 255, 0.3)';
        for (let i = 0; i < 3; i++) {
          const trailTime = time * 2 + i * 0.5;
          const alpha = 0.3 - i * 0.1;
          this.ctx.globalAlpha = alpha;
          this.ctx.beginPath();
          this.ctx.arc(x - 10 - i * 5, y, 3 + i, 0, Math.PI * 2);
          this.ctx.fill();
        }
        break;
    }
    
    this.ctx.restore();
  }
  
  private getAntColor(antType: AntType): string {
    switch (antType) {
      case AntType.Queen: return '#FFD700';
      case AntType.YoungQueen: return '#FF69B4';
      case AntType.Worker: return '#8B4513';
      case AntType.RoyalWorker: return '#DA70D6';
      case AntType.Soldier: return '#DC143C';
      case AntType.Scout: return '#4169E1';
      case AntType.Major: return '#8B0000';
      default: return '#8B4513';
    }
  }
  
  private darkenColor(color: string, factor: number): string {
    // Simple color darkening
    if (color.startsWith('#')) {
      const num = parseInt(color.slice(1), 16);
      const r = Math.floor((num >> 16) * factor);
      const g = Math.floor(((num >> 8) & 0x00FF) * factor);
      const b = Math.floor((num & 0x0000FF) * factor);
      return `rgb(${r}, ${g}, ${b})`;
    }
    return color;
  }

  private handleClick(x: number, y: number) {
    // Check what was clicked
    if (window.game) {
      // Check if we clicked on any game object
      const clickedObject = this.findObjectAtPosition(x, y);
      if (clickedObject) {
        window.game.handleObjectClick(clickedObject);
      } else {
        window.game.handleMapClick(x, y, false);
      }
    }
  }
  
  private findObjectAtPosition(x: number, y: number): any {
    // Search radius for clicking
    const clickRadius = 15;
    
    // Check all game objects in order of priority
    const game = window.game;
    if (!game) return null;
    
    // Check ants first (highest priority)
    for (const ant of game.ants.values()) {
      const dist = Math.sqrt(Math.pow(ant.x - x, 2) + Math.pow(ant.y - y, 2));
      if (dist <= clickRadius && Math.abs(ant.z - this.cameraZ) < 5) {
        return { type: 'ant', object: ant };
      }
    }
    
    // Check predators
    for (const predator of game.predators.values()) {
      const dist = Math.sqrt(Math.pow(predator.x - x, 2) + Math.pow(predator.y - y, 2));
      if (dist <= clickRadius && this.cameraZ >= -5) { // Surface only
        return { type: 'predator', object: predator };
      }
    }
    
    // Check prey
    for (const prey of game.prey.values()) {
      const dist = Math.sqrt(Math.pow(prey.x - x, 2) + Math.pow(prey.y - y, 2));
      if (dist <= clickRadius && this.cameraZ >= -5) { // Surface only
        return { type: 'prey', object: prey };
      }
    }
    
    // Check resources
    for (const resource of game.resources.values()) {
      const dist = Math.sqrt(Math.pow(resource.x - x, 2) + Math.pow(resource.y - y, 2));
      if (dist <= clickRadius && Math.abs(resource.z - this.cameraZ) < 5) {
        return { type: 'resource', object: resource };
      }
    }
    
    // Check chambers
    for (const chamber of game.chambers.values()) {
      const dist = Math.sqrt(Math.pow(chamber.x - x, 2) + Math.pow(chamber.y - y, 2));
      if (dist <= clickRadius && Math.abs(chamber.z - this.cameraZ) < 5) {
        return { type: 'chamber', object: chamber };
      }
    }
    
    return null;
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
  public currentPlayer: Player | null = null;
  public currentColony: Colony | null = null;
  public ants: Map<number, Ant> = new Map();
  public colonies: Map<number, Colony> = new Map();
  public chambers: Map<number, Chamber> = new Map();
  public resources: Map<number, ResourceNode> = new Map();
  public isInitialized: boolean = false;
  private exploredTerritories: Map<number, ExploredTerritory> = new Map();
  public discoveredResources: Map<number, DiscoveredResource> = new Map();
  private obstacles: Map<number, Obstacle> = new Map();
  public prey: Map<number, Prey> = new Map();
  public predators: Map<number, Predator> = new Map();
  public larvae: Map<number, Larva> = new Map();
  public tunnels: Map<number, Tunnel> = new Map();
  private selectedAntIds: number[] = [];
  private service: any; // Will be SpacetimeService or MockService
  private huntMode: boolean = false;
  private digMode: boolean = false;
  private placementMode: boolean = false;
  
  // Command Queue System
  private commandQueue: CommandQueueItem[] = [];
  private selectedAntsInPanel: Set<number> = new Set();
  private spawnPredators: boolean = true;
  private spawnPrey: boolean = true;
  private currentAntTypeFilter: string = 'all';
  private gameStartTime: number = 0;
  private isGameOver: boolean = false;
  private runStats: any = {
    duration: 0,
    queensProduced: 0,
    antsSpawned: 0,
    enemiesKilled: 0,
    resourcesGathered: 0,
    chambersBuilt: 0,
    maxPopulation: 0
  };
  private placementPreviewX: number = 0;
  private placementPreviewY: number = 0;
  private autoSpawnMode: boolean = true; // Disable manual spawn selection by default
  private currentView: 'surface' | 'underground' = 'underground';
  private debugMode: boolean = false;
  private isSpawning: boolean = false; // Prevent multiple spawn attempts

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
          if (!this.currentColony) {
            console.log('🏰 Colony created! ID:', colony.id);
            this.isSpawning = false; // Reset spawning flag when colony is created
          }
          this.currentColony = colony;
        }
      });
      this.updateUI();
    });

    service.on('Ant', (ants: Ant[]) => {
      console.log('Received ants update:', ants.length, 'ants');
      
      // Clear selection if ants are removed
      if (ants.length === 0) {
        this.selectedAntIds = [];
        this.viewport.clearSelection();
      }
      
      // Check for queen death
      const hasQueen = ants.some(ant => ant.ant_type === AntType.Queen && ant.colony_id === this.currentColony?.id);
      if (this.currentColony && !hasQueen && !this.isGameOver) {
        // Kill all colony ants when queen dies
        const colonyAnts = ants.filter(ant => ant.colony_id === this.currentColony?.id);
        if (colonyAnts.length > 0) {
          this.logActivity('💀', 'Colony collapses without queen!');
          
          // Kill all remaining ants
          colonyAnts.forEach(ant => {
            this.service.call('kill_ant', { ant_id: ant.id });
          });
        }
        
        this.triggerGameOver('Your queen has died - the colony collapsed');
      }
      
      // Track new ants
      ants.forEach(ant => {
        const existing = this.ants.get(ant.id);
        if (!existing && ant.colony_id === this.currentColony?.id) {
          this.logActivity('🐜', `${ant.ant_type} hatched`);
          this.runStats.antsSpawned++;
        }
      });
      
      this.ants.clear();
      ants.forEach(ant => this.ants.set(ant.id, ant));
      this.updateAntList();
      this.updateUnitPanel();
    });

    service.on('Chamber', (chambers: Chamber[]) => {
      // Track new chambers
      chambers.forEach(chamber => {
        const existing = this.chambers.get(chamber.id);
        if (!existing && chamber.colony_id === this.currentColony?.id) {
          this.logActivity('🏗️', `Built ${chamber.chamber_type}`);
          this.runStats.chambersBuilt++;
        }
      });
      
      this.chambers.clear();
      chambers.forEach(chamber => this.chambers.set(chamber.id, chamber));
    });

    service.on('ResourceNode', (resources: ResourceNode[]) => {
      // Track newly discovered resources
      resources.forEach(resource => {
        const existing = this.resources.get(resource.id);
        if (!existing?.discovered && resource.discovered) {
          this.logActivity('🔍', `Found ${resource.resource_type}`);
        }
      });
      
      this.resources.clear();
      resources.forEach(resource => this.resources.set(resource.id, resource));
    });

    service.on('ExploredTerritory', (territories: ExploredTerritory[]) => {
      this.exploredTerritories.clear();
      territories.forEach(territory => this.exploredTerritories.set(territory.id, territory));
    });

    service.on('DiscoveredResource', (discovered: DiscoveredResource[]) => {
      this.discoveredResources.clear();
      discovered.forEach(disc => this.discoveredResources.set(disc.id, disc));
    });

    service.on('Obstacle', (obstacles: Obstacle[]) => {
      this.obstacles.clear();
      obstacles.forEach(obstacle => this.obstacles.set(obstacle.id, obstacle));
    });

    service.on('Prey', (preyList: Prey[]) => {
      this.prey.clear();
      preyList.forEach(p => this.prey.set(p.id, p));
    });

    service.on('Predator', (predatorList: Predator[]) => {
      this.predators.clear();
      predatorList.forEach(pred => this.predators.set(pred.id, pred));
    });
    
    service.on('Larva', (larvaeList: Larva[]) => {
      this.larvae.clear();
      larvaeList.forEach(larva => this.larvae.set(larva.id, larva));
    });

    service.on('Tunnel', (tunnels: Tunnel[]) => {
      this.tunnels.clear();
      tunnels.forEach(tunnel => this.tunnels.set(tunnel.id, tunnel));
    });

    service.on('PlacementMode', (data: any) => {
      if (data.enabled) {
        console.log('Entering placement mode from service event');
        if (this.autoSpawnMode) {
          // Auto spawn randomly instead of showing placement UI
          console.log('Auto-spawn mode enabled - spawning randomly');
          const x = (Math.random() - 0.5) * 400;
          const y = (Math.random() - 0.5) * 400;
          setTimeout(() => {
            this.service.call('respawn_as_queen', { x, y });
          }, 100);
        } else {
          this.enterPlacementMode();
        }
      } else {
        this.exitPlacementMode();
      }
    });
    
    // Mark as initialized after all subscriptions are set up
    this.isInitialized = true;
    console.log('✅ Game fully initialized');
  }

  private setupUI() {
    // Add keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        // Clear selection
        this.selectedAntIds = [];
        this.viewport.clearSelection();
        this.updateUI();
        // Hide unit info window
        const infoWindow = document.getElementById('unitInfoWindow');
        if (infoWindow) infoWindow.style.display = 'none';
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
      } else if (e.key === 'd' && e.shiftKey) {
        // Toggle debug mode
        e.preventDefault();
        this.debugMode = !this.debugMode;
        console.log('Debug mode:', this.debugMode);
      } else if (e.key === 'g' && e.shiftKey && e.ctrlKey) {
        // Debug: Trigger game over
        e.preventDefault();
        if (this.currentColony && !this.isGameOver) {
          this.triggerGameOver('Manual game over (debug)');
        }
      } else if (e.key === 'l' && e.shiftKey) {
        // Toggle verbose logging
        e.preventDefault();
        (window as any).verboseLogging = !(window as any).verboseLogging;
        console.log('🔊 Verbose logging:', (window as any).verboseLogging ? 'ON' : 'OFF');
        if ((window as any).verboseLogging) {
          console.log('📋 Action logs will show detailed information');
        }
      } else if (e.key === 'Delete' && e.shiftKey && e.ctrlKey) {
        // Clear all localStorage data
        if (confirm('Clear all saved game data? This will reset everything!')) {
          localStorage.removeItem('insectColonyWarsState');
          location.reload();
        }
      }
    });
    
    const app = document.getElementById('app')!;
    app.innerHTML = createImprovedUI();

    // Setup colony management panel
    this.setupColonyManagement();
    
    // Setup spawn toggles
    this.setupSpawnToggles();
    
    // Setup colony dashboard
    this.setupColonyDashboard();

    // Setup event listeners
    document.getElementById('createColonyBtn')?.addEventListener('click', () => {
      this.createColony();
    });
    
    // Task button listeners
    document.querySelectorAll('.task-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const task = (e.currentTarget as HTMLElement).getAttribute('data-task');
        if (task && this.selectedAntIds.length === 1) {
          this.assignTask(this.selectedAntIds[0], task);
        }
      });
    });
    
    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tabName = (e.target as HTMLElement).dataset.tab!;
        
        // Update active tab
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        (e.target as HTMLElement).classList.add('active');
        
        // Show corresponding content
        document.querySelectorAll('.tab-content').forEach(content => {
          content.setAttribute('style', 'display: none;');
        });
        const tabContent = document.getElementById(`${tabName}Tab`);
        if (tabContent) tabContent.style.display = 'flex';
      });
    });

    document.querySelectorAll('.spawn-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        let target = e.target as HTMLElement;
        // Handle clicks on child elements (icon or small text)
        while (target && !target.dataset.ant) {
          target = target.parentElement as HTMLElement;
        }
        if (target && target.dataset.ant) {
          const antType = target.dataset.ant as AntType;
          this.spawnAnt(antType);
        }
      });
    });

    document.querySelectorAll('.chamber-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        let target = e.target as HTMLElement;
        // Handle clicks on child elements (icon or small text)
        while (target && !target.dataset.chamber) {
          target = target.parentElement as HTMLElement;
        }
        if (target && target.dataset.chamber) {
          const chamberType = target.dataset.chamber as ChamberType;
          this.buildChamber(chamberType);
        }
      });
    });

    // Chat removed in new UI design
    
    const aiToggle = document.getElementById('toggleAI');
    if (aiToggle) {
      aiToggle.addEventListener('click', async () => {
        if (this.currentColony) {
          await this.service.call('toggle_colony_ai', { colony_id: this.currentColony.id });
          // Update button state will happen when colony update is received
        }
      });
    }

    document.getElementById('autoSpawnToggle')?.addEventListener('click', () => {
      this.autoSpawnMode = !this.autoSpawnMode;
      // Auto spawn UI removed in new design
      console.log(`Auto-spawn mode ${this.autoSpawnMode ? 'enabled' : 'disabled'}`);
    });
    
    document.getElementById('spawnLarvaBtn')?.addEventListener('click', () => {
      console.log('Spawn larva clicked');
      if (this.currentColony) {
        // Find the queen
        const queen = Array.from(this.ants.values())
          .find(ant => ant.colony_id === this.currentColony!.id && ant.ant_type === AntType.Queen);
        if (queen) {
          console.log('Found queen, spawning larva');
          this.service.call('spawn_larva', { queen_id: queen.id });
        } else {
          console.log('No queen found for colony', this.currentColony.id);
        }
      } else {
        console.log('No current colony');
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
        const btn = document.getElementById('huntBtn');
        if (!btn) return;
        btn.classList.toggle('active');
        this.huntMode = btn.classList.contains('active');
        btn.textContent = this.huntMode ? '⚔️ Cancel Hunt' : '⚔️ Hunt Mode';
        // Disable dig mode if enabling hunt mode
        if (this.huntMode) {
          this.digMode = false;
          const digBtn = document.getElementById('digBtn');
          if (digBtn) {
            digBtn.classList.remove('active');
            digBtn.textContent = '⛏️ Dig Mode';
          }
        }
      }
    });
    
    document.getElementById('digBtn')?.addEventListener('click', () => {
      if (this.currentColony) {
        // Toggle dig mode
        const btn = document.getElementById('digBtn');
        if (!btn) return;
        btn.classList.toggle('active');
        this.digMode = btn.classList.contains('active');
        btn.textContent = this.digMode ? '⛏️ Cancel Dig' : '⛏️ Dig Mode';
        // Disable hunt mode if enabling dig mode
        if (this.digMode) {
          this.huntMode = false;
          const huntBtn = document.getElementById('huntBtn');
          if (huntBtn) {
            huntBtn.classList.remove('active');
            huntBtn.textContent = '⚔️ Hunt Mode';
          }
        }
      }
    });
    
    document.getElementById('respawnBtn')?.addEventListener('click', () => {
      if (confirm('Respawn as a new queen? This will delete your current colony!')) {
        // Spawn at random location
        const x = (Math.random() - 0.5) * 400;
        const y = (Math.random() - 0.5) * 400;
        this.service.call('respawn_as_queen', { x, y });
      }
    });
    
    document.getElementById('produceJellyBtn')?.addEventListener('click', () => {
      if (this.selectedAntIds.length > 0) {
        const selectedAnt = this.ants.get(this.selectedAntIds[0]);
        if (selectedAnt && selectedAnt.ant_type === AntType.RoyalWorker) {
          this.service.call('produce_jelly', { ant_id: selectedAnt.id });
        } else {
          alert('Select a Royal Worker to produce jelly');
        }
      } else {
        alert('Select a Royal Worker to produce jelly');
      }
    });
    
    document.getElementById('flyAwayBtn')?.addEventListener('click', () => {
      if (this.selectedAntIds.length > 0) {
        const selectedAnt = this.ants.get(this.selectedAntIds[0]);
        if (selectedAnt && selectedAnt.ant_type === AntType.YoungQueen) {
          if (confirm('Send this young queen on her nuptial flight? She will leave to start a new colony!')) {
            this.service.call('nuptial_flight', { queen_id: selectedAnt.id });
          }
        } else {
          alert('Select a Young Queen for nuptial flight');
        }
      } else {
        alert('Select a Young Queen for nuptial flight');
      }
    });
    
    document.getElementById('cancelPlacement')?.addEventListener('click', () => {
      this.exitPlacementMode();
    });
    
    document.getElementById('surfaceBtn')?.addEventListener('click', () => {
      this.switchView('surface');
    });
    
    document.getElementById('undergroundBtn')?.addEventListener('click', () => {
      this.switchView('underground');
    });
    
    const placementOverlay = document.getElementById('placementMode');
    placementOverlay?.addEventListener('click', (e) => {
      // Check if clicked on the overlay (not info box)
      if (e.target === e.currentTarget) {
        const rect = this.viewport.canvas.getBoundingClientRect();
        const canvasX = e.clientX - rect.left;
        const canvasY = e.clientY - rect.top;
        
        // Only process if click is within canvas bounds
        if (canvasX >= 0 && canvasX <= rect.width && canvasY >= 0 && canvasY <= rect.height) {
          const x = (canvasX - this.viewport.canvas.width / 2) / this.viewport.zoom + this.viewport.cameraX;
          const y = (canvasY - this.viewport.canvas.height / 2) / this.viewport.zoom + this.viewport.cameraY;
          
          this.service.call('respawn_as_queen', { x, y });
          this.exitPlacementMode();
        }
      }
    });
    
    // Show preview on mouse move
    placementOverlay?.addEventListener('mousemove', (e) => {
      if (this.placementMode && e.target === e.currentTarget) {
        const rect = this.viewport.canvas.getBoundingClientRect();
        const canvasX = e.clientX - rect.left;
        const canvasY = e.clientY - rect.top;
        
        if (canvasX >= 0 && canvasX <= rect.width && canvasY >= 0 && canvasY <= rect.height) {
          this.placementPreviewX = (canvasX - this.viewport.canvas.width / 2) / this.viewport.zoom + this.viewport.cameraX;
          this.placementPreviewY = (canvasY - this.viewport.canvas.height / 2) / this.viewport.zoom + this.viewport.cameraY;
        }
      }
    });
  }

  private updateUI() {
    if (this.currentPlayer) {
      const playerNameEl = document.getElementById('playerName');
      const generationEl = document.getElementById('generation');
      const queensProducedEl = document.getElementById('queensProduced');
      
      if (playerNameEl) playerNameEl.textContent = this.currentPlayer.username;
      if (generationEl) generationEl.textContent = this.currentPlayer.generations_survived?.toString() || '0';
      if (queensProducedEl) queensProducedEl.textContent = this.currentPlayer.queens_produced?.toString() || '0';
    }
    
    // Update threat monitoring
    const predators = this.service?.data?.Predator || [];
    const threats = predators.length;
    updateThreatLevel(threats);

    if (this.currentColony) {
      // Update colony info
      const colonyIdEl = document.getElementById('colonyId');
      const colonyTraitEl = document.getElementById('colonyTrait');
      
      if (colonyIdEl) colonyIdEl.textContent = this.currentColony.id.toString();
      if (colonyTraitEl && this.currentColony.queen_trait) {
        colonyTraitEl.textContent = this.currentColony.queen_trait;
        colonyTraitEl.style.display = 'inline-block';
      }
      
      // Update compact resources
      const foodEl = document.getElementById('foodAmount');
      const waterEl = document.getElementById('waterAmount');
      const mineralsEl = document.getElementById('mineralsAmount');
      const jellyEl = document.getElementById('jellyAmount');
      const larvaeEl = document.getElementById('larvaeAmount');
      const popEl = document.getElementById('populationAmount');
      const popCapEl = document.getElementById('populationCapacity');
      
      if (foodEl) foodEl.textContent = Math.floor(this.currentColony.food).toString();
      if (waterEl) waterEl.textContent = Math.floor(this.currentColony.water).toString();
      if (mineralsEl) mineralsEl.textContent = Math.floor(this.currentColony.minerals).toString();
      if (jellyEl) jellyEl.textContent = Math.floor(this.currentColony.queen_jelly).toString();
      if (larvaeEl) larvaeEl.textContent = this.currentColony.larvae.toString();
      if (popEl) popEl.textContent = this.currentColony.population.toString();
      if (popCapEl) popCapEl.textContent = (this.currentColony as any).population_capacity?.toString() || '20';
      
      // Update colony overview
      const queenStatus = document.getElementById('queenStatus');
      const chamberCount = document.getElementById('chamberCount');
      const queen = this.currentColony.queen_id ? this.ants.get(this.currentColony.queen_id) : null;
      
      if (queenStatus) {
        if (queen) {
          // Calculate queen energy from last_fed_at
          const now = Date.now();
          const timeSinceFeeding = now - queen.last_fed_at;
          const minutesSinceFeeding = timeSinceFeeding / 60000;
          const energy = Math.max(0, 100 - (minutesSinceFeeding / 20 * 100));
          
          queenStatus.textContent = energy > 50 ? 'Healthy' : energy > 25 ? 'Hungry' : 'Starving';
          queenStatus.className = energy > 50 ? 'threat-safe' : energy > 25 ? 'threat-medium' : 'threat-high';
        } else {
          queenStatus.textContent = 'No Queen!';
          queenStatus.className = 'threat-high';
        }
      }
      
      // Update AI toggle button state
      const aiToggle = document.getElementById('toggleAI');
      if (aiToggle && this.currentColony) {
        const isAIEnabled = this.currentColony.ai_enabled !== false; // Default to true if undefined
        aiToggle.textContent = isAIEnabled ? 'ON' : 'OFF';
        aiToggle.classList.toggle('active', isAIEnabled);
      }
      
      if (chamberCount) {
        const chambers = Array.from(this.chambers.values()).filter(ch => ch.colony_id === this.currentColony!.id);
        chamberCount.textContent = chambers.length.toString();
      }
      
      // Update tasks badge
      const tasksBadge = document.getElementById('tasksBadge');
      if (tasksBadge) {
        const activeAnts = Array.from(this.ants.values()).filter(ant => 
          ant.colony_id === this.currentColony!.id && ant.task !== TaskType.Idle
        );
        const selectedCount = this.selectedAntIds.length;
        
        if (selectedCount > 0) {
          tasksBadge.textContent = `${selectedCount} selected`;
        } else {
          tasksBadge.textContent = `${activeAnts.length} active`;
        }
      }
      
      // Resources are now updated in the compact display above
      // No need for duplicate updates
      
      // Update AI status
      const aiStatus = document.getElementById('aiStatus');
      if (aiStatus) {
        aiStatus.textContent = this.currentColony.ai_enabled ? 'ON' : 'OFF';
      }
      
      const noColonyPanel = document.getElementById('noColonyPanel');
      if (noColonyPanel) noColonyPanel.style.display = 'none';
    } else {
      const noColonyPanel = document.getElementById('noColonyPanel');
      if (noColonyPanel) noColonyPanel.style.display = 'block';
      
      // Auto-spawn for brand new players only (never had a colony)
      if (this.currentPlayer && !this.placementMode && !this.isSpawning && this.currentPlayer.total_colonies === 0) {
        console.log('Auto-spawning new player...');
        this.isSpawning = true;
        const x = (Math.random() - 0.5) * 400;
        const y = (Math.random() - 0.5) * 400;
        this.service.call('respawn_as_queen', { x, y });
      } else if (this.currentPlayer && !this.placementMode && !this.isSpawning && this.currentPlayer.total_colonies > 0) {
        // Experienced player without a colony
        if (this.autoSpawnMode) {
          console.log('Experienced player needs to respawn - auto spawning');
          this.isSpawning = true;
          const x = (Math.random() - 0.5) * 400;
          const y = (Math.random() - 0.5) * 400;
          this.service.call('respawn_as_queen', { x, y });
        } else {
          console.log('Experienced player needs to respawn - entering placement mode');
          this.enterPlacementMode();
        }
      }
    }

    // Update selection info
    if (this.selectedAntIds.length > 0) {
      const ants = this.selectedAntIds.map(id => this.ants.get(id)).filter(a => a);
      if (ants.length > 0) {
        const types = new Map<AntType, number>();
        let youngQueenTrait = '';
        let maturationInfo = '';
        
        ants.forEach(ant => {
          types.set(ant!.ant_type, (types.get(ant!.ant_type) || 0) + 1);
          // Check for ant trait
          if (ant!.trait_type) {
            youngQueenTrait = ` [Trait: ${ant!.trait_type}]`;
          }
          // Check for young queen maturation
          if (ant!.ant_type === AntType.YoungQueen && ant!.maturation_time) {
            const now = Date.now();
            const timeLeft = Math.max(0, ant!.maturation_time - now);
            if (timeLeft > 0) {
              const minutes = Math.floor(timeLeft / 60000);
              const seconds = Math.floor((timeLeft % 60000) / 1000);
              maturationInfo = ` ⏱️ Matures in ${minutes}:${seconds.toString().padStart(2, '0')}`;
            } else {
              maturationInfo = ' ✈️ Ready to fly!';
            }
          }
        });
        
        const info = Array.from(types.entries())
          .map(([type, count]) => `${count} ${type}`)
          .join(', ');
        // Selection info handled by new UI
      }
    } else {
      // No selection
    }
    
    // Update unit panel
    this.updateUnitPanel();
    
    // Update task panel
    this.updateTaskPanel();
  }

  private startRenderLoop() {
    const render = () => {
      const antsArray = Array.from(this.ants.values());
      const coloniesArray = Array.from(this.colonies.values());
      const chambersArray = Array.from(this.chambers.values());
      const resourcesArray = Array.from(this.resources.values());
      const obstaclesArray = Array.from(this.obstacles.values());
      const preyArray = Array.from(this.prey.values());
      const predatorsArray = Array.from(this.predators.values());
      const larvaeArray = Array.from(this.larvae.values());
      
      this.viewport.render(antsArray, coloniesArray, chambersArray, resourcesArray, 
                          obstaclesArray, preyArray, predatorsArray, larvaeArray,
                          this.placementMode, this.placementPreviewX, this.placementPreviewY,
                          this.debugMode);
      requestAnimationFrame(render);
    };
    render();
  }

  private triggerGameOver(reason: string) {
    if (this.isGameOver) return;
    
    this.isGameOver = true;
    
    // Calculate final stats
    this.runStats.duration = Date.now() - this.gameStartTime;
    this.runStats.maxPopulation = Math.max(this.runStats.maxPopulation, this.currentColony?.population || 0);
    
    // Add dramatic effect for queen death
    if (reason.includes('queen')) {
      addAlert('👑💀 The Queen is dead! The colony collapses!', 'danger');
      
      // Visual effect - fade out all ants
      const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
      if (canvas) {
        canvas.style.transition = 'opacity 2s';
        canvas.style.opacity = '0.3';
      }
    }
    
    // Save run to history
    this.saveRunToHistory();
    
    // Show game over screen
    const gameOverScreen = document.getElementById('gameOverScreen');
    const gameOverReason = document.getElementById('gameOverReason');
    const runStatsEl = document.getElementById('runStats');
    
    if (gameOverScreen) gameOverScreen.style.display = 'flex';
    if (gameOverReason) gameOverReason.textContent = reason;
    
    if (runStatsEl) {
      const formatTime = (ms: number) => {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        if (hours > 0) return `${hours}h ${minutes % 60}m`;
        if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
        return `${seconds}s`;
      };
      
      runStatsEl.innerHTML = `
        <div class="stat-item">
          <span class="stat-label">Survival Time:</span>
          <span class="stat-value">${formatTime(this.runStats.duration)}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Generation:</span>
          <span class="stat-value">${this.currentColony?.generation || 0}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Queens Produced:</span>
          <span class="stat-value">${this.runStats.queensProduced}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Max Population:</span>
          <span class="stat-value">${this.runStats.maxPopulation}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Ants Spawned:</span>
          <span class="stat-value">${this.runStats.antsSpawned}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Chambers Built:</span>
          <span class="stat-value">${this.runStats.chambersBuilt}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Resources Gathered:</span>
          <span class="stat-value">${this.runStats.resourcesGathered}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Enemies Killed:</span>
          <span class="stat-value">${this.runStats.enemiesKilled}</span>
        </div>
      `;
    }
    
    // Setup new run button
    const newRunBtn = document.getElementById('newRunBtn');
    if (newRunBtn) {
      newRunBtn.onclick = () => {
        this.startNewRun();
      };
    }
    
    // Setup view stats button
    const viewStatsBtn = document.getElementById('viewStatsBtn');
    if (viewStatsBtn) {
      viewStatsBtn.onclick = () => {
        this.showRunHistory();
      };
    }
  }
  
  private saveRunToHistory() {
    const history = JSON.parse(localStorage.getItem('colonyRunHistory') || '[]');
    history.push({
      date: new Date().toISOString(),
      ...this.runStats,
      generation: this.currentColony?.generation || 0
    });
    
    // Keep only last 100 runs
    if (history.length > 100) {
      history.shift();
    }
    
    localStorage.setItem('colonyRunHistory', JSON.stringify(history));
  }
  
  private startNewRun() {
    // Clear all game state
    localStorage.removeItem('mock-game-state');
    localStorage.removeItem('mock-sync-state');
    
    // Reset game
    this.isGameOver = false;
    this.currentColony = null;
    this.gameStartTime = Date.now();
    this.runStats = {
      duration: 0,
      queensProduced: 0,
      antsSpawned: 0,
      enemiesKilled: 0,
      resourcesGathered: 0,
      chambersBuilt: 0,
      maxPopulation: 0
    };
    
    // Clear all entities
    this.ants.clear();
    this.chambers.clear();
    this.resources.clear();
    this.predators.clear();
    this.prey.clear();
    this.larvae.clear();
    
    // Hide game over screen
    const gameOverScreen = document.getElementById('gameOverScreen');
    if (gameOverScreen) gameOverScreen.style.display = 'none';
    
    // Reset canvas opacity
    const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    if (canvas) {
      canvas.style.opacity = '1';
    }
    
    // Reload the page for a fresh start
    location.reload();
  }
  
  private showRunHistory() {
    const history = JSON.parse(localStorage.getItem('colonyRunHistory') || '[]');
    console.log('Run History:', history);
    // TODO: Create a proper UI for viewing run history
    alert(`You have ${history.length} previous runs. Check console for details.`);
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
    
    // Start tracking the run
    this.gameStartTime = Date.now();
    this.isGameOver = false;
  }

  async spawnAnt(antType: AntType) {
    if (!this.currentColony) return;
    
    // Feed larva to transform into ant type
    const queen = Array.from(this.ants.values())
      .find(ant => ant.colony_id === this.currentColony!.id && ant.ant_type === AntType.Queen);
    
    if (!queen) return;
    
    const x = queen.x + (Math.random() - 0.5) * 20;
    const y = queen.y + (Math.random() - 0.5) * 20;
    const z = queen.z;
    
    await this.service.call('feed_larva', {
      colony_id: this.currentColony.id,
      ant_type: antType,
      x, y, z
    });
  }

  async buildChamber(chamberType: ChamberType) {
    if (!this.currentColony) return;
    
    // Check if queen is selected for burrows, or worker for other chambers
    const selectedAnt = this.selectedAntIds.length > 0 
      ? this.ants.get(this.selectedAntIds[0])
      : null;
      
    if (!selectedAnt) {
      alert(chamberType === ChamberType.Burrow 
        ? 'Select a queen to build a burrow' 
        : 'Select a worker to build chambers');
      return;
    }
    
    if (chamberType === ChamberType.Burrow && selectedAnt.ant_type !== AntType.Queen) {
      alert('Only queens can build burrows');
      return;
    }
    
    if (chamberType !== ChamberType.Burrow && selectedAnt.ant_type !== AntType.Worker) {
      alert('Only workers can build chambers');
      return;
    }
    
    const x = selectedAnt.x + (Math.random() - 0.5) * 20;
    const y = selectedAnt.y + (Math.random() - 0.5) * 20;
    const z = selectedAnt.z;
    
    await this.service.call('build_chamber', {
      ant_id: selectedAnt.id,
      chamber_type: chamberType,
      x, y, z
    });
  }
  
  async assignTask(antId: number, task: string) {
    const ant = this.ants.get(antId);
    if (!ant || ant.colony_id !== this.currentColony?.id) return;
    
    switch (task) {
      case 'gather':
        // Find nearest discovered resource
        const resources = Array.from(this.discoveredResources.values())
          .filter(dr => dr.colony_id === this.currentColony!.id)
          .map(dr => this.resources.get(dr.resource_id))
          .filter(r => r && r.amount > 0);
        
        if (resources.length > 0) {
          // Find closest resource
          let closest = resources[0];
          let minDist = Number.MAX_VALUE;
          resources.forEach(r => {
            const dist = Math.sqrt((r!.x - ant.x) ** 2 + (r!.y - ant.y) ** 2);
            if (dist < minDist) {
              minDist = dist;
              closest = r;
            }
          });
          
          // Check if ant is underground and needs to exit first
          const antIsUnderground = ant.z < -5;
          const resourceIsOnSurface = closest!.z >= -5;
          
          if (antIsUnderground && resourceIsOnSurface) {
            console.log(`🐜 Worker needs to exit burrow first to reach surface resource`);
            // Find nearest burrow to exit through
            const burrows = Array.from(this.chambers.values())
              .filter(ch => ch.colony_id === ant.colony_id && 
                           ch.chamber_type === ChamberType.Burrow);
            
            if (burrows.length > 0) {
              // Find closest burrow
              let closestBurrow = burrows[0];
              let minBurrowDist = Number.MAX_VALUE;
              burrows.forEach(b => {
                const dist = Math.sqrt((b.x - ant.x) ** 2 + (b.y - ant.y) ** 2);
                if (dist < minBurrowDist) {
                  minBurrowDist = dist;
                  closestBurrow = b;
                }
              });
              
              // Send to the resource location - the movement system will handle burrow navigation
              await this.service.call('command_ants', {
                ant_ids: [antId],
                target_x: closest!.x,
                target_y: closest!.y,
                target_z: closest!.z,
                task_override: 'gather'
              });
              console.log(`🚪 Worker will navigate through burrow at (${closestBurrow.x}, ${closestBurrow.y}) to reach surface resource`);
            } else {
              alert('No burrow to exit through! Build a burrow first.');
            }
          } else {
            // Direct path is possible (same layer)
            await this.service.call('command_ants', {
              ant_ids: [antId],
              target_x: closest!.x,
              target_y: closest!.y,
              target_z: closest!.z,
              task_override: 'gather'
            });
          }
        } else {
          alert('No discovered resources to gather from!');
        }
        break;
        
      case 'scout':
        // Send ant to explore undiscovered areas
        const angle = Math.random() * Math.PI * 2;
        const distance = 100 + Math.random() * 100;
        const targetX = ant.x + Math.cos(angle) * distance;
        const targetY = ant.y + Math.sin(angle) * distance;
        
        await this.service.call('command_ants', {
          ant_ids: [antId],
          target_x: targetX,
          target_y: targetY,
          target_z: ant.z,
          task_override: 'scout'
        });
        break;
        
      case 'guard':
        // Set ant to guard current position
        await this.service.call('command_ants', {
          ant_ids: [antId],
          target_x: ant.x,
          target_y: ant.y,
          target_z: ant.z,
          task_override: 'guard'
        });
        break;
        
      case 'patrol':
        // TODO: Implement patrol routes
        alert('Patrol routes coming soon! For now, use manual movement.');
        break;
        
      case 'dig':
        // Dig at current location
        await this.service.call('dig_at_location', {
          ant_ids: [antId],
          target_x: ant.x,
          target_y: ant.y,
          target_z: ant.z - 5
        });
        break;
        
      case 'hunt':
        // Find nearest prey
        const prey = Array.from(this.prey.values())
          .filter(p => p.health > 0);
        
        if (prey.length > 0) {
          // Find closest prey
          let closestPrey = prey[0];
          let minPreyDist = Number.MAX_VALUE;
          prey.forEach(p => {
            const dist = Math.sqrt((p.x - ant.x) ** 2 + (p.y - ant.y) ** 2);
            if (dist < minPreyDist) {
              minPreyDist = dist;
              closestPrey = p;
            }
          });
          
          await this.service.call('command_ants', {
            ant_ids: [antId],
            target_x: closestPrey.x,
            target_y: closestPrey.y,
            target_z: 0, // Prey are on surface
            task_override: 'hunt'
          });
        } else {
          alert('No prey in sight!');
        }
        break;
        
      case 'follow':
        // TODO: Implement follow mode
        alert('Click on another ant to follow (coming soon!)');
        break;
        
      case 'idle':
        // Set ant to idle
        await this.service.call('command_ants', {
          ant_ids: [antId],
          target_x: ant.x,
          target_y: ant.y,
          target_z: ant.z,
          task_override: 'idle'
        });
        break;
    }
    
    // Update UI to show new task
    this.updateUI();
  }

  private showUnitInfo(ant: Ant) {
    const infoWindow = document.getElementById('unitInfoWindow');
    if (!infoWindow) return;
    
    // Show the window
    infoWindow.style.display = 'block';
    
    // Update header
    const typeEl = document.getElementById('unitInfoType');
    if (typeEl) typeEl.textContent = `${ant.ant_type} Ant`;
    
    // Update basic info
    const idEl = document.getElementById('unitInfoId');
    if (idEl) idEl.textContent = `#${ant.id}`;
    
    const roleEl = document.getElementById('unitInfoRole');
    if (roleEl) roleEl.textContent = ant.trait_type || ant.ant_type;
    
    // Update energy
    const now = Date.now();
    const timeSinceFeeding = now - ant.last_fed_at;
    const minutesSinceFeeding = timeSinceFeeding / (60 * 1000);
    const energyDrainMultiplier = ant.z >= 0 ? 1.5 : 1.0;
    const effectiveMinutes = minutesSinceFeeding * energyDrainMultiplier;
    const energy = Math.max(0, 100 - (effectiveMinutes / 20 * 100));
    
    const energyFill = document.getElementById('unitEnergyFill') as HTMLElement;
    const energyText = document.getElementById('unitEnergyText');
    if (energyFill) energyFill.style.width = `${energy}%`;
    if (energyText) energyText.textContent = `${Math.round(energy)}%`;
    
    // Update location
    const locationEl = document.getElementById('unitInfoLocation');
    if (locationEl) locationEl.textContent = `(${Math.round(ant.x)}, ${Math.round(ant.y)}, ${ant.z})`;
    
    // Update task
    const taskEl = document.getElementById('unitInfoTask');
    if (taskEl) taskEl.textContent = ant.task || 'Idle';
    
    // Update carrying
    const carryingEl = document.getElementById('unitInfoCarrying');
    if (carryingEl) {
      if (ant.resource_carried && ant.resource_carried > 0) {
        carryingEl.textContent = `${ant.resource_carried} Food`;
      } else {
        carryingEl.textContent = 'Nothing';
      }
    }
    
    // Setup close button
    const closeBtn = document.getElementById('closeUnitInfo');
    if (closeBtn) {
      closeBtn.onclick = () => {
        infoWindow.style.display = 'none';
      };
    }
    
    // Setup action buttons
    const followBtn = document.getElementById('followUnit');
    if (followBtn) {
      followBtn.onclick = () => {
        this.viewport.focusOnPosition(ant.x, ant.y, ant.z);
      };
    }
    
    const returnBtn = document.getElementById('returnToBase');
    if (returnBtn) {
      returnBtn.onclick = async () => {
        await this.service.call('command_ants', {
          ant_ids: [ant.id],
          target_x: 0,
          target_y: 0,
          target_z: -10,
          task_override: 'return'
        });
        this.updateUI();
      };
    }
  }

  handleObjectClick(clickedObject: { type: string, object: any }) {
    const { type, object } = clickedObject;
    
    console.log(`🖱️ Clicked ${type}:`, object);
    
    // Clear ant selection when clicking other objects
    this.selectedAntIds = [];
    this.viewport.clearSelection();
    
    let info = '';
    
    switch (type) {
      case 'ant':
        const ant = object as Ant;
        const colony = this.colonies.get(ant.colony_id);
        const isOwn = colony?.player_id === this.service.identity;
        
        if (isOwn) {
          // Select own ant
          this.selectedAntIds = [ant.id];
          this.viewport.selectAnts(this.selectedAntIds);
          console.log(`✅ Selected ${ant.ant_type} #${ant.id}`);
          this.showUnitInfo(ant);
        } else {
          // Show info for enemy ant
          const ownerName = colony ? `Colony #${colony.id}` : 'Unknown';
          info = `Enemy ${ant.ant_type} - ${ownerName}\n` +
                 `Health: ${ant.health}/${ant.max_health}\n` +
                 `Task: ${ant.task}`;
          if (ant.trait_type) {
            info += `\nTrait: ${ant.trait_type}`;
          }
        }
        break;
        
      case 'resource':
        const resource = object as ResourceNode;
        const discovered = Array.from(this.discoveredResources.values())
          .some(dr => dr.resource_id === resource.id && dr.colony_id === this.currentColony?.id);
        
        info = `${resource.resource_type} Source\n` +
               `Amount: ${Math.floor(resource.amount)}/${resource.max_amount}\n` +
               `Regen: ${resource.regeneration_rate}/tick\n` +
               `Status: ${discovered ? 'Discovered' : 'Undiscovered'}`;
        break;
        
      case 'predator':
        const predator = object as Predator;
        info = `${predator.predator_type.charAt(0).toUpperCase() + predator.predator_type.slice(1)}\n` +
               `Health: ${predator.health}/${predator.max_health}\n` +
               `Damage: ${predator.attack_damage}\n` +
               `Status: ${predator.target_ant_id ? 'Hunting' : 'Patrolling'}`;
        break;
        
      case 'prey':
        const prey = object as Prey;
        info = `${prey.prey_type.charAt(0).toUpperCase() + prey.prey_type.slice(1)}\n` +
               `Health: ${prey.health}/${prey.max_health}\n` +
               `Food Value: ${prey.food_value}\n` +
               `Speed: ${prey.speed}`;
        break;
        
      case 'chamber':
        const chamber = object as Chamber;
        const chamberColony = this.colonies.get(chamber.colony_id);
        const isOwnChamber = chamberColony?.player_id === this.service.identity;
        
        info = `${chamber.chamber_type}${isOwnChamber ? '' : ' (Enemy)'}\n` +
               `Colony: #${chamber.colony_id}\n` +
               `Level: ${chamber.level}\n` +
               `Capacity: ${chamber.capacity}`;
        
        // Show larvae count for chambers that have it
        if ((chamber as any).larvae_count !== undefined && (chamber as any).larvae_capacity !== undefined) {
          info += `\nLarvae: ${(chamber as any).larvae_count}/${(chamber as any).larvae_capacity}`;
        }
        break;
    }
    
    if (info) {
      // Selection info handled by new UI
    }
    
    this.updateUI();
  }
  
  handleMapClick(x: number, y: number, isRightClick: boolean) {
    // Don't handle clicks if in placement mode
    if (this.placementMode) return;
    
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
      const btn = document.getElementById('huntBtn');
      if (btn) {
        btn.classList.remove('active');
        btn.textContent = '⚔️ Hunt Mode';
      }
    } else if (this.digMode && isRightClick) {
      // Command selected workers to dig at location
      if (this.selectedAntIds.length > 0) {
        // Check if selected ants are workers
        const selectedWorkers = this.selectedAntIds.filter(id => {
          const ant = this.ants.get(id);
          return ant && ant.ant_type === AntType.Worker;
        });
        
        if (selectedWorkers.length > 0) {
          this.service.call('dig_at_location', {
            ant_ids: selectedWorkers,
            target_x: x,
            target_y: y,
            target_z: this.viewport.cameraZ
          });
        } else {
          alert('Select workers to dig!');
        }
      }
      // Exit dig mode
      this.digMode = false;
      const btn = document.getElementById('digBtn');
      if (btn) {
        btn.classList.remove('active');
        btn.textContent = '⛏️ Dig Mode';
      }
    } else if (isRightClick && this.selectedAntIds.length > 0) {
      // Command selected ants
      this.service.call('command_ants', {
        ant_ids: this.selectedAntIds,
        target_x: x,
        target_y: y,
        target_z: this.viewport.cameraZ
      });
    } else if (!isRightClick) {
      // Left click - select ants at this position
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
  
  private updateTaskPanel() {
    const taskPanel = document.getElementById('taskPanel');
    const selectedUnitInfo = document.getElementById('selectedUnitInfo');
    if (!taskPanel || !selectedUnitInfo) return;
    
    // Only show task panel for single unit selection
    if (this.selectedAntIds.length === 1) {
      const ant = this.ants.get(this.selectedAntIds[0]);
      if (ant && ant.colony_id === this.currentColony?.id) {
        taskPanel.style.display = 'block';
        
        // Update unit info
        selectedUnitInfo.innerHTML = `
          <strong>${ant.ant_type}</strong> #${ant.id}<br>
          Health: ${Math.floor(ant.health)}/${ant.max_health}<br>
          Task: ${ant.task}<br>
          ${ant.trait_type ? `Trait: ${ant.trait_type}` : ''}
        `;
        
        // Show/hide task buttons based on ant type
        const taskButtons = taskPanel.querySelectorAll('.task-btn');
        taskButtons.forEach(btn => {
          const task = btn.getAttribute('data-task');
          let show = true;
          
          // Disable certain tasks for certain ant types
          if (ant.ant_type === AntType.Queen) {
            if (task !== 'idle' && task !== 'guard') show = false;
          } else if (ant.ant_type === AntType.RoyalWorker) {
            if (task !== 'idle') show = false; // Royal workers stay in burrows
          }
          
          (btn as HTMLElement).style.display = show ? 'block' : 'none';
        });
      } else {
        taskPanel.style.display = 'none';
      }
    } else {
      taskPanel.style.display = 'none';
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
    const typeOrder = [AntType.Queen, AntType.YoungQueen, AntType.Worker, AntType.RoyalWorker, AntType.Soldier, AntType.Scout, AntType.Major];
    
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
        } else if (ant.task === TaskType.Digging) {
          status = 'Digging';
          statusClass = 'digging';
        } else if (ant.task === TaskType.Building) {
          status = 'Building';
          statusClass = 'digging'; // Use same style as digging
        } else if (ant.task === TaskType.Entering) {
          status = 'Entering';
          statusClass = 'entering';
        } else if (ant.task === TaskType.Exiting) {
          status = 'Exiting';
          statusClass = 'exiting';
        } else if (ant.task === TaskType.Depositing) {
          status = ant.ant_type === AntType.Queen ? 'Laying' : 'Depositing';
          statusClass = 'depositing';
        }
        
        // Check maturation for young queens
        if (ant.ant_type === AntType.YoungQueen && ant.maturation_time) {
          const now = Date.now();
          const timeLeft = Math.max(0, ant.maturation_time - now);
          if (timeLeft > 0) {
            const minutes = Math.floor(timeLeft / 60000);
            const seconds = Math.floor((timeLeft % 60000) / 1000);
            status = `⏱️ ${minutes}:${seconds.toString().padStart(2, '0')}`;
            statusClass = 'maturing';
          } else {
            status = '✈️ Ready!';
            statusClass = 'ready';
          }
        }
        
        const icon = type === AntType.Queen ? '👑' :
                     type === AntType.YoungQueen ? '👸' :
                     type === AntType.Worker ? '⚒️' :
                     type === AntType.RoyalWorker ? '🍯' :
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
      header.addEventListener('click', (e: MouseEvent) => {
        e.stopPropagation();
        const group = (e.currentTarget as HTMLElement).parentElement!;
        const wasExpanded = group.classList.contains('expanded');
        
        // Always toggle expansion
        group.classList.toggle('expanded');
        
        // Double click to select all of this type
        if (e.detail === 2) {
          const type = group.dataset.type as AntType;
          const ants = antsByType.get(type) || [];
          if (ants.length > 0) {
            this.selectedAntIds = ants.map(a => a.id);
            this.viewport.selectAnts(this.selectedAntIds);
            setTimeout(() => this.updateUI(), 0);
          }
        }
      });
    });
    
    unitList.querySelectorAll('.unit-item').forEach(item => {
      item.addEventListener('click', (e: MouseEvent) => {
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
          // Single selection - clear others first
          this.selectedAntIds = [antId];
          // Focus camera on ant
          this.viewport.focusOnPosition(ant.x, ant.y, ant.z);
          // Show unit info window
          this.showUnitInfo(ant);
        }
        
        this.viewport.selectAnts(this.selectedAntIds);
        // Update UI immediately to reflect selection
        setTimeout(() => this.updateUI(), 0);
      });
    });
  }
  
  private enterPlacementMode() {
    this.placementMode = true;
    const placementMode = document.getElementById('placementMode');
    if (placementMode) placementMode.style.display = 'flex';
    // Clear any selections
    this.selectedAntIds = [];
    this.viewport.clearSelection();
    this.huntMode = false;
  }
  
  private exitPlacementMode() {
    this.placementMode = false;
    const placementMode = document.getElementById('placementMode');
    if (placementMode) placementMode.style.display = 'none';
  }

  // Auto spawn UI method removed
  
  private switchToSurface() {
    this.currentView = 'surface';
    this.animateZTransition(0);
    this.updateViewButtons();
  }
  
  private switchToUnderground() {
    this.currentView = 'underground';
    this.animateZTransition(-10);
    this.updateViewButtons();
  }
  
  private animateZTransition(targetZ: number) {
    const startZ = this.viewport.cameraZ;
    const duration = 500; // 500ms transition
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease-in-out animation
      const eased = progress < 0.5
        ? 2 * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;
      
      this.viewport.cameraZ = startZ + (targetZ - startZ) * eased;
      this.updateZLevelDisplay();
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    animate();
  }
  
  private updateViewButtons() {
    const surfaceBtn = document.getElementById('surfaceBtn');
    const undergroundBtn = document.getElementById('undergroundBtn');
    if (surfaceBtn) surfaceBtn.classList.toggle('active', this.currentView === 'surface');
    if (undergroundBtn) undergroundBtn.classList.toggle('active', this.currentView === 'underground');
  }
  
  private updateZLevelDisplay() {
    const zLevel = document.getElementById('zLevel');
    if (zLevel) {
      zLevel.textContent = this.viewport.cameraZ.toFixed(0);
    }
  }
  
  private switchView(view: 'surface' | 'underground') {
    this.currentView = view;
    
    // Update button states
    const surfaceBtn = document.getElementById('surfaceBtn');
    const undergroundBtn = document.getElementById('undergroundBtn');
    if (surfaceBtn) surfaceBtn.classList.toggle('active', view === 'surface');
    if (undergroundBtn) undergroundBtn.classList.toggle('active', view === 'underground');
    
    // Update camera Z level
    if (view === 'surface') {
      this.viewport.cameraZ = 0; // Surface level
    } else {
      this.viewport.cameraZ = -10; // Underground level
    }
    
    // Update Z level display
    const zLevelEl = document.getElementById('zLevel');
    if (zLevelEl) zLevelEl.textContent = this.viewport.cameraZ.toString();
    
    // Update what's visible based on view
    this.updateVisibility();
  }
  
  private updateVisibility() {
    // This will filter what's shown based on current view
    // Surface view: show surface resources, threats, ant entrances
    // Underground view: show chambers, tunnels, underground ants
  }
  
  // Console helper methods
  public showAnts() {
    console.group('🐜 All Ants');
    const antsByColony = new Map<number, Ant[]>();
    
    this.ants.forEach(ant => {
      if (!antsByColony.has(ant.colony_id)) {
        antsByColony.set(ant.colony_id, []);
      }
      antsByColony.get(ant.colony_id)!.push(ant);
    });
    
    antsByColony.forEach((ants, colonyId) => {
      console.group(`Colony ${colonyId} (${ants.length} ants)`);
      ants.forEach(ant => {
        const trait = ant.trait_type ? ` [${ant.trait_type}]` : '';
        const task = ant.task ? ` - ${ant.task}` : '';
        const location = `(${Math.round(ant.x)}, ${Math.round(ant.y)}, ${ant.z})`;
        console.log(`${ant.ant_type} #${ant.id}${trait} at ${location}${task} - HP: ${ant.health}/${ant.max_health}`);
      });
      console.groupEnd();
    });
    console.groupEnd();
  }
  
  public showChambers() {
    console.group('🏰 All Chambers');
    const chambersByColony = new Map<number, Chamber[]>();
    
    this.chambers.forEach(chamber => {
      if (!chambersByColony.has(chamber.colony_id)) {
        chambersByColony.set(chamber.colony_id, []);
      }
      chambersByColony.get(chamber.colony_id)!.push(chamber);
    });
    
    chambersByColony.forEach((chambers, colonyId) => {
      console.group(`Colony ${colonyId} (${chambers.length} chambers)`);
      chambers.forEach(chamber => {
        const location = `(${Math.round(chamber.x)}, ${Math.round(chamber.y)}, ${chamber.z})`;
        console.log(`${chamber.chamber_type} at ${location} - Level ${chamber.level}`);
      });
      console.groupEnd();
    });
    console.groupEnd();
  }
  
  public showColonies() {
    console.group('🏛️ All Colonies');
    console.log(`Total colonies: ${this.colonies.size}`);
    
    this.colonies.forEach(colony => {
      const antCount = Array.from(this.ants.values()).filter(ant => ant.colony_id === colony.id).length;
      const queenAnt = Array.from(this.ants.values()).find(ant => ant.id === colony.queen_id);
      const hasQueen = queenAnt ? `Queen #${colony.queen_id} (${queenAnt.health}/${queenAnt.max_health} HP)` : 'No Queen';
      
      console.group(`Colony #${colony.id} - Player: ${colony.player_id}`);
      console.log(`Ants: ${antCount}`);
      console.log(`Queen: ${hasQueen}`);
      console.log(`Resources: Food: ${Math.floor(colony.food)}, Water: ${Math.floor(colony.water)}, Minerals: ${Math.floor(colony.minerals)}`);
      console.log(`Queen Jelly: ${Math.floor(colony.queen_jelly)}`);
      console.log(`Created: ${new Date(colony.created_at).toLocaleString()}`);
      console.groupEnd();
    });
    console.groupEnd();
  }

  // Colony Management Methods
  private setupSpawnToggles() {
    const predatorToggle = document.getElementById('togglePredators');
    const preyToggle = document.getElementById('togglePrey');
    
    if (predatorToggle) {
      predatorToggle.addEventListener('click', () => {
        this.spawnPredators = !this.spawnPredators;
        predatorToggle.textContent = this.spawnPredators ? 'ON' : 'OFF';
        predatorToggle.classList.toggle('active', this.spawnPredators);
        console.log('Predator spawning:', this.spawnPredators ? 'enabled' : 'disabled');
        
        // Kill all predators when disabled
        if (!this.spawnPredators) {
          const predatorIds = Array.from(this.predators.keys());
          predatorIds.forEach(id => {
            this.service.call('kill_predator', { predator_id: id });
          });
          this.logActivity('🚫', 'All predators removed');
          addAlert('All predators have been removed', 'info');
        }
        
        // Store preference
        localStorage.setItem('spawnPredators', this.spawnPredators.toString());
        
        // Update mock service
        if (this.service.setSpawnSettings) {
          this.service.setSpawnSettings({ spawnPredators: this.spawnPredators });
        }
      });
      
      // Load saved preference
      const saved = localStorage.getItem('spawnPredators');
      if (saved !== null) {
        this.spawnPredators = saved === 'true';
        predatorToggle.textContent = this.spawnPredators ? 'ON' : 'OFF';
        predatorToggle.classList.toggle('active', this.spawnPredators);
      }
    }
    
    if (preyToggle) {
      preyToggle.addEventListener('click', () => {
        this.spawnPrey = !this.spawnPrey;
        preyToggle.textContent = this.spawnPrey ? 'ON' : 'OFF';
        preyToggle.classList.toggle('active', this.spawnPrey);
        console.log('Prey spawning:', this.spawnPrey ? 'enabled' : 'disabled');
        
        // Kill all prey when disabled
        if (!this.spawnPrey) {
          const preyIds = Array.from(this.prey.keys());
          preyIds.forEach(id => {
            this.service.call('kill_prey', { prey_id: id });
          });
          this.logActivity('🚫', 'All prey removed');
          addAlert('All prey have been removed', 'info');
        }
        
        // Store preference
        localStorage.setItem('spawnPrey', this.spawnPrey.toString());
        
        // Update mock service
        if (this.service.setSpawnSettings) {
          this.service.setSpawnSettings({ spawnPrey: this.spawnPrey });
        }
      });
      
      // Load saved preference
      const saved = localStorage.getItem('spawnPrey');
      if (saved !== null) {
        this.spawnPrey = saved === 'true';
        preyToggle.textContent = this.spawnPrey ? 'ON' : 'OFF';
        preyToggle.classList.toggle('active', this.spawnPrey);
      }
    }
    
    // Set initial spawn settings
    if (this.service.setSpawnSettings) {
      this.service.setSpawnSettings({ 
        spawnPredators: this.spawnPredators,
        spawnPrey: this.spawnPrey 
      });
    }
  }

  private setupColonyDashboard() {
    // Toggle dashboard
    const toggleBtn = document.getElementById('toggleDashboard');
    const dashboard = document.getElementById('colonyDashboard');
    
    if (toggleBtn && dashboard) {
      toggleBtn.addEventListener('click', () => {
        dashboard.classList.toggle('collapsed');
        toggleBtn.textContent = dashboard.classList.contains('collapsed') ? '▶' : '◀';
      });
    }
    
    // Update dashboard every second
    setInterval(() => this.updateColonyDashboard(), 1000);
  }
  
  private updateColonyDashboard() {
    if (!this.currentColony) return;
    
    // Define colony phases
    const getPhase = () => {
      const workerCount = Array.from(this.ants.values()).filter(a => 
        a.colony_id === this.currentColony!.id && a.ant_type === AntType.Worker
      ).length;
      
      const soldierCount = Array.from(this.ants.values()).filter(a => 
        a.colony_id === this.currentColony!.id && a.ant_type === AntType.Soldier
      ).length;
      
      const chambers = Array.from(this.chambers.values()).filter(c => 
        c.colony_id === this.currentColony!.id
      );
      
      if (workerCount === 0) return 'Founding';
      if (workerCount < 3) return 'Early Colony';
      if (soldierCount === 0) return 'Expansion';
      if (chambers.length < 3) return 'Infrastructure';
      return 'Established';
    };
    
    // Update phase
    const phase = getPhase();
    const phaseEl = document.getElementById('currentPhase');
    if (phaseEl) phaseEl.textContent = phase;
    
    // Update progress bar
    const progressBar = document.getElementById('phaseProgressBar');
    if (progressBar) {
      const progress = {
        'Founding': 20,
        'Early Colony': 40,
        'Expansion': 60,
        'Infrastructure': 80,
        'Established': 100
      };
      progressBar.style.width = `${progress[phase] || 0}%`;
    }
    
    // Update setup tasks
    this.updateSetupTasks();
    
    // Update health indicators
    this.updateHealthIndicators();
    
    // Update activity monitor
    this.updateActivityMonitor();
  }
  
  private updateSetupTasks() {
    const tasksEl = document.getElementById('setupTasks');
    if (!tasksEl || !this.currentColony) return;
    
    const tasks = [
      {
        id: 'spawn-workers',
        label: 'Spawn 3 Workers',
        hint: 'Feed larvae to create workers',
        check: () => {
          const workers = Array.from(this.ants.values()).filter(a => 
            a.colony_id === this.currentColony!.id && a.ant_type === AntType.Worker
          ).length;
          return workers >= 3;
        }
      },
      {
        id: 'find-resources',
        label: 'Discover Food Source',
        hint: 'Send scouts to explore',
        check: () => {
          return Array.from(this.resources.values()).some(r => r.discovered);
        }
      },
      {
        id: 'create-royal',
        label: 'Create Royal Worker',
        hint: 'Essential for jelly production',
        check: () => {
          return Array.from(this.ants.values()).some(a => 
            a.colony_id === this.currentColony!.id && a.ant_type === AntType.RoyalWorker
          );
        }
      },
      {
        id: 'build-chamber',
        label: 'Build First Chamber',
        hint: 'Nursery or Storage recommended',
        check: () => {
          const chambers = Array.from(this.chambers.values()).filter(c => 
            c.colony_id === this.currentColony!.id && c.chamber_type !== ChamberType.Burrow
          );
          return chambers.length > 0;
        }
      },
      {
        id: 'spawn-soldiers',
        label: 'Create Defense Force',
        hint: 'Spawn at least 2 soldiers',
        check: () => {
          const soldiers = Array.from(this.ants.values()).filter(a => 
            a.colony_id === this.currentColony!.id && a.ant_type === AntType.Soldier
          ).length;
          return soldiers >= 2;
        }
      }
    ];
    
    tasksEl.innerHTML = tasks.map(task => {
      const completed = task.check();
      return `
        <div class="task-item ${completed ? 'completed' : ''}" data-task-id="${task.id}">
          <div class="task-checkbox">${completed ? '✓' : ''}</div>
          <div>
            <div class="task-label">${task.label}</div>
            ${!completed ? `<div class="task-hint">${task.hint}</div>` : ''}
          </div>
        </div>
      `;
    }).join('');
  }
  
  private updateHealthIndicators() {
    if (!this.currentColony) return;
    
    // Food indicator
    const foodFill = document.querySelector('.food-fill') as HTMLElement;
    if (foodFill) {
      const foodPercent = Math.min(100, (this.currentColony.food / 100) * 100);
      foodFill.style.width = `${foodPercent}%`;
      foodFill.style.background = foodPercent < 20 ? '#f44336' : '#FFA726';
    }
    
    // Jelly indicator
    const jellyFill = document.querySelector('.jelly-fill') as HTMLElement;
    if (jellyFill) {
      const jellyPercent = Math.min(100, (this.currentColony.queen_jelly / 50) * 100);
      jellyFill.style.width = `${jellyPercent}%`;
      jellyFill.style.background = jellyPercent < 20 ? '#f44336' : '#FFD54F';
    }
    
    // Defense indicator
    const defenseFill = document.querySelector('.defense-fill') as HTMLElement;
    if (defenseFill) {
      const soldiers = Array.from(this.ants.values()).filter(a => 
        a.colony_id === this.currentColony!.id && 
        (a.ant_type === AntType.Soldier || a.ant_type === AntType.Major)
      ).length;
      const defensePercent = Math.min(100, (soldiers / 10) * 100);
      defenseFill.style.width = `${defensePercent}%`;
      defenseFill.style.background = defensePercent < 20 ? '#f44336' : '#66BB6A';
    }
  }
  
  private activityLog: Array<{icon: string, text: string, timestamp: number}> = [];
  
  private updateActivityMonitor() {
    const activityList = document.getElementById('activityList');
    if (!activityList) return;
    
    // Keep only recent activities (last 30 seconds)
    const now = Date.now();
    this.activityLog = this.activityLog.filter(a => now - a.timestamp < 30000);
    
    // Display recent activities
    activityList.innerHTML = this.activityLog.slice(-5).reverse().map(activity => {
      const timeAgo = Math.floor((now - activity.timestamp) / 1000);
      return `
        <div class="activity-item">
          <span class="activity-icon">${activity.icon}</span>
          <span>${activity.text}</span>
          <span class="activity-timestamp">${timeAgo}s ago</span>
        </div>
      `;
    }).join('');
  }
  
  private logActivity(icon: string, text: string) {
    this.activityLog.push({
      icon,
      text,
      timestamp: Date.now()
    });
    this.updateActivityMonitor();
  }

  private setupColonyManagement() {
    // Setup expandable sections
    const sectionHeaders = document.querySelectorAll('.section-header');
    sectionHeaders.forEach(header => {
      header.addEventListener('click', () => {
        const section = header.getAttribute('data-section');
        const content = document.getElementById(`${section}Content`);
        const icon = header.querySelector('.expand-icon');
        
        if (content && icon) {
          if (content.classList.contains('collapsed')) {
            content.classList.remove('collapsed');
            content.classList.add('expanded');
            icon.textContent = '▼';
            
            // Update ant list when tasks section is expanded
            if (section === 'tasks') {
              this.updateAntList();
            }
          } else {
            content.classList.remove('expanded');
            content.classList.add('collapsed');
            icon.textContent = '▶';
          }
        }
      });
    });

    // Tab switching
    const tabs = document.querySelectorAll('.ant-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.currentAntTypeFilter = tab.getAttribute('data-type') || 'all';
        this.updateAntList();
      });
    });

    // Command buttons
    const commandButtons = document.querySelectorAll('.cmd-btn');
    commandButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const command = btn.getAttribute('data-cmd');
        if (command && this.selectedAntsInPanel.size > 0) {
          this.queueCommand(command);
        }
      });
    });

    // Build buttons
    const buildButtons = document.querySelectorAll('.build-btn');
    buildButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const chamber = btn.getAttribute('data-chamber');
        if (chamber && this.currentColony) {
          // TODO: Implement chamber building
          console.log(`Building ${chamber}...`);
        }
      });
    });

    // Clear alerts on click
    const alertIcon = document.getElementById('alertIcon');
    alertIcon?.addEventListener('click', () => {
      const alertList = document.getElementById('alertList');
      const alertCount = document.getElementById('alertCount');
      if (alertList) alertList.innerHTML = '';
      if (alertCount) alertCount.textContent = '0';
    });
    
    // Clear queue button
    const clearQueueBtn = document.getElementById('clearQueue');
    clearQueueBtn?.addEventListener('click', () => {
      this.commandQueue = [];
      this.updateCommandQueue();
    });

    // Process command queue periodically
    setInterval(() => this.processCommandQueue(), 1000);
    
    // Update production rates periodically
    setInterval(() => this.updateProductionRates(), 5000);
  }

  private updateAntList() {
    const antList = document.getElementById('antList');
    if (!antList || !this.currentColony) return;

    const filteredAnts = Array.from(this.ants.values()).filter(ant => {
      if (ant.colony_id !== this.currentColony!.id) return false;
      if (this.currentAntTypeFilter === 'all') return true;
      return ant.ant_type === this.currentAntTypeFilter;
    });
    
    // Sync selectedAntsInPanel with selectedAntIds
    this.selectedAntsInPanel.clear();
    this.selectedAntIds.forEach(id => this.selectedAntsInPanel.add(id));

    antList.innerHTML = filteredAnts.map(ant => {
      // Calculate energy from last_fed_at timestamp
      const now = Date.now();
      const timeSinceFeeding = now - ant.last_fed_at;
      const minutesSinceFeeding = timeSinceFeeding / 60000;
      const energyDrainMultiplier = ant.z >= 0 ? 1.5 : 1.0;
      const effectiveMinutes = minutesSinceFeeding * energyDrainMultiplier;
      const energy = Math.max(0, 100 - (effectiveMinutes / 20 * 100));
      
      const energyClass = energy > 50 ? 'high' : energy > 25 ? 'medium' : 'low';
      const isSelected = this.selectedAntsInPanel.has(ant.id);
      const trait = ant.trait_type ? `[${ant.trait_type}]` : '';
      
      return `
        <div class="ant-entry ${isSelected ? 'selected' : ''}" data-ant-id="${ant.id}">
          <div class="ant-info">
            <span>${this.getAntIcon(ant.ant_type)} #${ant.id}</span>
            <span class="trait">${trait}</span>
          </div>
          <div class="ant-status">
            <span>${ant.task}</span>
            <div class="energy-indicator">
              <div class="energy-bar ${energyClass}" style="width: ${energy}%"></div>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Add click handlers
    antList.querySelectorAll('.ant-entry').forEach(entry => {
      entry.addEventListener('click', (e) => {
        const antId = parseInt(entry.getAttribute('data-ant-id') || '0');
        const ant = this.ants.get(antId);
        if (!ant) return;
        
        if (e.shiftKey || e.ctrlKey) {
          // Multi-select
          if (this.selectedAntsInPanel.has(antId)) {
            this.selectedAntsInPanel.delete(antId);
            // Remove from main selection too
            const index = this.selectedAntIds.indexOf(antId);
            if (index >= 0) {
              this.selectedAntIds.splice(index, 1);
            }
          } else {
            this.selectedAntsInPanel.add(antId);
            this.selectedAntIds.push(antId);
          }
        } else {
          // Single select
          this.selectedAntsInPanel.clear();
          this.selectedAntsInPanel.add(antId);
          this.selectedAntIds = [antId];
          
          // Show unit info window
          this.showUnitInfo(ant);
          // Focus camera on ant
          this.viewport.focusOnPosition(ant.x, ant.y, ant.z);
        }
        
        // Update viewport selection
        this.viewport.selectAnts(this.selectedAntIds);
        this.updateAntList();
        this.updateUI();
      });
    });
  }

  private getAntIcon(antType: AntType): string {
    switch (antType) {
      case AntType.Queen: return '👑';
      case AntType.Worker: return '⚒️';
      case AntType.Scout: return '🔍';
      case AntType.Soldier: return '⚔️';
      case AntType.Major: return '🛡️';
      case AntType.RoyalWorker: return '🍯';
      case AntType.YoungQueen: return '👸';
      default: return '🐜';
    }
  }

  private queueCommand(command: string) {
    const repeat = (document.getElementById('repeatCommand') as HTMLInputElement)?.checked || false;
    const priority = (document.getElementById('commandPriority') as HTMLSelectElement)?.value as 'low' | 'normal' | 'high' || 'normal';
    
    const queueItem: CommandQueueItem = {
      id: `cmd-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      antIds: Array.from(this.selectedAntsInPanel),
      command,
      priority,
      repeat,
      status: 'pending',
      createdAt: Date.now()
    };

    this.commandQueue.push(queueItem);
    this.commandQueue.sort((a, b) => {
      const priorityOrder = { high: 0, normal: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    this.updateCommandQueue();
  }

  private updateCommandQueue() {
    const queueList = document.getElementById('commandQueueList');
    if (!queueList) return;

    if (this.commandQueue.length === 0) {
      queueList.innerHTML = '<div class="queue-empty">No queued commands</div>';
      return;
    }

    queueList.innerHTML = this.commandQueue.map(item => {
      const antCount = item.antIds.length;
      const repeatIcon = item.repeat ? '🔁' : '';
      const statusClass = item.status === 'executing' ? 'executing' : '';
      
      return `
        <div class="queue-item ${statusClass}">
          <div class="queue-item-info">
            <div>${this.getCommandIcon(item.command)} ${item.command}</div>
            <div class="queue-item-status">${antCount} ants ${repeatIcon} [${item.priority}]</div>
          </div>
          <div class="queue-item-actions">
            <button class="queue-item-btn" data-queue-id="${item.id}" title="Remove">×</button>
          </div>
        </div>
      `;
    }).join('');

    // Add remove handlers
    queueList.querySelectorAll('.queue-item-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const queueId = btn.getAttribute('data-queue-id');
        this.commandQueue = this.commandQueue.filter(item => item.id !== queueId);
        this.updateCommandQueue();
      });
    });
  }

  private getCommandIcon(command: string): string {
    const icons: Record<string, string> = {
      gather: '🌾',
      scout: '🔍',
      guard: '🛡️',
      dig: '⛏️',
      return: '🏠',
      attack: '⚔️'
    };
    return icons[command] || '📋';
  }

  private processCommandQueue() {
    if (!this.service || this.commandQueue.length === 0) return;

    // Find next pending command
    const nextCommand = this.commandQueue.find(cmd => cmd.status === 'pending');
    if (!nextCommand) return;

    // Mark as executing
    nextCommand.status = 'executing';

    try {
      // Execute command based on type
      switch (nextCommand.command) {
      case 'gather':
        this.service.call('hive_command', {
          colony_id: this.currentColony?.id,
          command: 'gather'
        });
        break;
      
      case 'return':
        nextCommand.antIds.forEach(antId => {
          const ant = this.ants.get(antId);
          if (ant) {
            const chambers = Array.from(this.chambers.values())
              .filter(ch => ch.colony_id === ant.colony_id);
            const target = chambers.find(ch => ch.chamber_type === ChamberType.ThroneRoom) || chambers[0];
            
            if (target) {
              this.service.call('command_ants', {
                ant_ids: [antId],
                target_x: target.x,
                target_y: target.y,
                target_z: target.z
              });
            }
          }
        });
        break;
      
      case 'scout':
        nextCommand.antIds.forEach(antId => {
          const ant = this.ants.get(antId);
          if (ant) {
            // Send to random location
            const angle = Math.random() * Math.PI * 2;
            const distance = 100 + Math.random() * 200;
            const targetX = ant.x + Math.cos(angle) * distance;
            const targetY = ant.y + Math.sin(angle) * distance;
            
            this.service.call('command_ants', {
              ant_ids: [antId],
              target_x: targetX,
              target_y: targetY,
              target_z: 0,
              task_override: 'scout'
            });
          }
        });
        break;
      
      // Add more command implementations as needed
      }
      
      // Mark as completed
      nextCommand.status = 'completed';
      
      // Handle repeat or remove
      if (nextCommand.repeat) {
        nextCommand.status = 'pending';
        // Move to end of same priority group
        const samePriority = this.commandQueue.filter(cmd => cmd.priority === nextCommand.priority);
        const index = samePriority.indexOf(nextCommand);
        if (index < samePriority.length - 1) {
          this.commandQueue = this.commandQueue.filter(cmd => cmd.id !== nextCommand.id);
          this.commandQueue.push(nextCommand);
        }
      } else {
        this.commandQueue = this.commandQueue.filter(cmd => cmd.id !== nextCommand.id);
      }

      this.updateCommandQueue();
    } catch (error) {
      console.error('Command execution failed:', error);
      // Remove failed command
      this.commandQueue = this.commandQueue.filter(cmd => cmd.id !== nextCommand.id);
      this.updateCommandQueue();
      
      // Show error to user
      addAlert(`Command failed: ${nextCommand.command}`, 'danger');
    }
  }

  private updateProductionRates() {
    if (!this.currentColony) return;
    
    // Calculate production rates based on active workers
    const workers = Array.from(this.ants.values()).filter(ant => 
      ant.colony_id === this.currentColony!.id && 
      ant.ant_type === AntType.Worker &&
      ant.task === TaskType.Gathering
    );
    
    const royalWorkers = Array.from(this.ants.values()).filter(ant => 
      ant.colony_id === this.currentColony!.id && 
      ant.ant_type === AntType.RoyalWorker
    );
    
    // Estimate production rates (simplified)
    const foodRate = workers.filter(w => w.carrying_resource === ResourceType.Food).length * 2;
    const waterRate = workers.filter(w => w.carrying_resource === ResourceType.Water).length * 1.5;
    const mineralsRate = workers.filter(w => w.carrying_resource === ResourceType.Minerals).length * 1;
    const jellyRate = royalWorkers.length * 0.5;
    
    // Update UI
    const foodRateEl = document.getElementById('foodRate');
    const waterRateEl = document.getElementById('waterRate');
    const mineralsRateEl = document.getElementById('mineralsRate');
    const jellyRateEl = document.getElementById('jellyRate');
    const productionBadge = document.getElementById('productionBadge');
    
    if (foodRateEl) foodRateEl.textContent = foodRate.toFixed(1);
    if (waterRateEl) waterRateEl.textContent = waterRate.toFixed(1);
    if (mineralsRateEl) mineralsRateEl.textContent = mineralsRate.toFixed(1);
    if (jellyRateEl) jellyRateEl.textContent = jellyRate.toFixed(1);
    
    const totalRate = foodRate + waterRate + mineralsRate + jellyRate;
    if (productionBadge) productionBadge.textContent = `+${totalRate.toFixed(0)}/min`;
  }
}

// Initialize game
declare global {
  interface Window {
    game: InsectColonyWarsGame;
    showGameState: () => void;
    showActions: () => void;
    clearGameData: () => void;
  }
}

// Add console helper functions immediately
window.showGameState = () => {
  if (!window.game) {
    console.log('⚠️ Game not initialized yet. Please wait...');
    return;
  }
  if (!window.game.isInitialized) {
    console.log('⚠️ Game is connecting... Please wait.');
    return;
  }
  console.group('🎮 Current Game State');
  console.log('Player:', window.game.currentPlayer);
  console.log('Colony:', window.game.currentColony);
  console.log(`Ants: ${window.game.ants.size} total`);
  console.log(`Chambers: ${window.game.chambers.size} total`);
  console.log(`Resources: ${window.game.resources.size} nodes`);
  console.log(`Larvae: ${window.game.larvae.size} total`);
  console.log(`Selected Ants:`, window.game.selectedAntIds);
  console.groupEnd();
};

window.showActions = () => {
  console.group('🎯 Available Actions');
  console.log('Keyboard Shortcuts:');
  console.log('  Shift+D: Toggle debug overlay');
  console.log('  Shift+L: Toggle verbose logging');
  console.log('  Ctrl+A: Select all units');
  console.log('  ESC: Clear selection');
  console.log('  Delete: Clear localStorage (with Ctrl+Shift)');
  console.log('');
  console.log('Console Commands:');
  console.log('  showGameState() - Display current game state');
  console.log('  showActions() - Show this help');
  console.log('  clearGameData() - Clear all saved game data and reload');
  console.log('  game.showAnts() - List all ants with details');
  console.log('  game.showChambers() - List all chambers');
  console.log('  game.showColonies() - List all colonies with details');
  console.log('  game.service.call(method, args) - Call service methods directly');
  console.log('');
  console.log('Direct Actions (when game is loaded):');
  console.log('  game.service.call("spawn_larva", {queen_id: 1})');
  console.log('  game.service.call("command_ants", {ant_ids: [1], target_x: 0, target_y: 0, target_z: -5})');
  console.groupEnd();
};

window.clearGameData = () => {
  const confirmed = confirm('This will delete all saved game data. Are you sure?');
  if (confirmed) {
    console.log('🗑️ Clearing all game data...');
    localStorage.clear();
    sessionStorage.clear();
    console.log('✅ Game data cleared. Reloading...');
    window.location.reload();
  }
};

async function init() {
  try {
    console.log('🚀 Starting game initialization...');
    
    // Check if we should use mock mode
    const useMock = new URLSearchParams(window.location.search).has('mock') || 
                    window.location.hostname === 'localhost';
    
    let service;
    if (useMock) {
      console.log('📦 Using mock SpacetimeDB service...');
      const { MockSpacetimeService } = await import('./services/spacetime-mock-rts');
      service = new MockSpacetimeService();
    } else {
      console.log('🌐 Connecting to SpacetimeDB...');
      const { SpacetimeService } = await import('./services/spacetime');
      service = new SpacetimeService();
    }
    
    console.log('🎯 Creating game instance...');
    const game = new InsectColonyWarsGame();
    window.game = game;
    
    console.log('🔌 Connecting to service...');
    await game.connect(service);
    console.log('🎮 Game initialized successfully!');
    console.log('💡 Type showActions() in console for help');
  } catch (error) {
    console.error('❌ Failed to initialize game:', error);
    console.error('Stack trace:', (error as Error).stack);
    
    // Show user-friendly error message
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: #ff4444;
      color: white;
      padding: 20px;
      border-radius: 8px;
      font-family: monospace;
      z-index: 9999;
    `;
    errorDiv.innerHTML = `
      <h3>Failed to initialize game</h3>
      <p>${(error as Error).message}</p>
      <p style="font-size: 12px;">Check console for details</p>
    `;
    document.body.appendChild(errorDiv);
  }
}

init();