// Mock SpacetimeDB service for RTS development
import { AntType, ResourceType, ChamberType, TaskType } from '../main';

interface MockData {
  Player: any[];
  Colony: any[];
  Ant: any[];
  Tunnel: any[];
  Chamber: any[];
  ResourceNode: any[];
  Pheromone: any[];
  Battle: any[];
}

export class MockSpacetimeService {
  public identity: string;
  private listeners: Map<string, ((data: any) => void)[]> = new Map();
  private data: MockData = {
    Player: [],
    Colony: [],
    Ant: [],
    Tunnel: [],
    Chamber: [],
    ResourceNode: [],
    Pheromone: [],
    Battle: []
  };
  private nextId = {
    colony: 1,
    ant: 1,
    tunnel: 1,
    chamber: 1,
    pheromone: 1,
    battle: 1
  };
  private gameUpdateInterval: number | null = null;

  constructor() {
    // Generate unique identity per tab
    this.identity = sessionStorage.getItem('mockIdentity') || 
                    `player_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('mockIdentity', this.identity);
    
    // Initialize resource nodes
    this.initializeResources();
  }

  private initializeResources() {
    this.data.ResourceNode = [
      {
        id: 1,
        resource_type: ResourceType.Food,
        x: 50,
        y: 50,
        z: 0,
        amount: 1000,
        max_amount: 1000,
        regeneration_rate: 1
      },
      {
        id: 2,
        resource_type: ResourceType.Food,
        x: -50,
        y: -50,
        z: 0,
        amount: 1000,
        max_amount: 1000,
        regeneration_rate: 1
      },
      {
        id: 3,
        resource_type: ResourceType.Minerals,
        x: 100,
        y: -100,
        z: -20,
        amount: 1000,
        max_amount: 1000,
        regeneration_rate: 1
      },
      {
        id: 4,
        resource_type: ResourceType.Minerals,
        x: -100,
        y: 100,
        z: -20,
        amount: 1000,
        max_amount: 1000,
        regeneration_rate: 1
      }
    ];
  }

  async connect(): Promise<void> {
    console.log('Mock SpacetimeDB connected');
    
    // Load saved state from localStorage
    this.loadState();
    
    // Start game update loop
    this.startGameLoop();
    
    // Emit initial data
    setTimeout(() => {
      this.emit('Player', this.data.Player);
      this.emit('Colony', this.data.Colony);
      this.emit('Ant', this.data.Ant);
      this.emit('Chamber', this.data.Chamber);
      this.emit('ResourceNode', this.data.ResourceNode);
    }, 100);
  }

  on(event: string, callback: (data: any) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  private emit(event: string, data: any): void {
    const callbacks = this.listeners.get(event) || [];
    callbacks.forEach(cb => cb(data));
  }

  async call(method: string, args: any): Promise<void> {
    console.log(`Mock call: ${method}`, args);
    
    switch (method) {
      case 'create_player':
        this.createPlayer(args.username);
        break;
      case 'create_colony':
        this.createColony(args.x, args.y);
        break;
      case 'spawn_ant':
        this.spawnAnt(args.colony_id, args.ant_type, args.x, args.y, args.z);
        break;
      case 'command_ants':
        this.commandAnts(args.ant_ids, args.target_x, args.target_y, args.target_z);
        break;
      case 'build_chamber':
        this.buildChamber(args.colony_id, args.chamber_type, args.x, args.y, args.z);
        break;
      case 'dig_tunnel':
        this.digTunnel(args.colony_id, args.start_x, args.start_y, args.start_z, 
                      args.end_x, args.end_y, args.end_z);
        break;
      case 'attack_target':
        this.attackTarget(args.attacker_id, args.target_id);
        break;
      case 'toggle_colony_ai':
        this.toggleColonyAI(args.colony_id);
        break;
    }
    
    this.saveState();
  }

  private createPlayer(username: string) {
    const existing = this.data.Player.find(p => p.id === this.identity);
    if (existing) return;
    
    const player = {
      id: this.identity,
      username,
      created_at: Date.now(),
      total_colonies: 0,
      resources_gathered: 0
    };
    
    this.data.Player.push(player);
    this.emit('Player', this.data.Player);
  }

  private createColony(x: number, y: number) {
    const player = this.data.Player.find(p => p.id === this.identity);
    if (!player) return;
    
    const colonyId = this.nextId.colony++;
    const colony = {
      id: colonyId,
      player_id: this.identity,
      queen_id: null,
      food: 100,
      minerals: 0,
      larvae: 5,
      queen_jelly: 100,
      population: 1,
      territory_radius: 50,
      created_at: Date.now(),
      ai_enabled: true
    };
    
    this.data.Colony.push(colony);
    
    // Create queen
    const queenId = this.nextId.ant++;
    const queen = {
      id: queenId,
      colony_id: colonyId,
      ant_type: AntType.Queen,
      x,
      y,
      z: -10,
      health: 200,
      max_health: 200,
      carrying_resource: null,
      carrying_amount: 0,
      task: TaskType.Idle,
      target_x: null,
      target_y: null,
      target_z: null,
      speed: 0.5,
      attack_damage: 0
    };
    
    this.data.Ant.push(queen);
    colony.queen_id = queenId;
    
    // Create throne room
    const throneId = this.nextId.chamber++;
    const throne = {
      id: throneId,
      colony_id: colonyId,
      chamber_type: ChamberType.ThroneRoom,
      x,
      y,
      z: -10,
      level: 1,
      capacity: 1
    };
    
    this.data.Chamber.push(throne);
    
    // Create initial workers
    for (let i = 0; i < 5; i++) {
      const workerId = this.nextId.ant++;
      const worker = {
        id: workerId,
        colony_id: colonyId,
        ant_type: AntType.Worker,
        x: x + (i * 2 - 4),
        y: y + (i * 2 - 4),
        z: -10,
        health: 50,
        max_health: 50,
        carrying_resource: null,
        carrying_amount: 0,
        task: TaskType.Idle,
        target_x: null,
        target_y: null,
        target_z: null,
        speed: 2,
        attack_damage: 5
      };
      this.data.Ant.push(worker);
    }
    
    colony.population = 6;
    player.total_colonies++;
    
    this.emit('Player', this.data.Player);
    this.emit('Colony', this.data.Colony);
    this.emit('Ant', this.data.Ant);
    this.emit('Chamber', this.data.Chamber);
  }

  private spawnAnt(colonyId: number, antType: AntType, x: number, y: number, z: number) {
    const colony = this.data.Colony.find(c => c.id === colonyId);
    if (!colony || colony.player_id !== this.identity) return;
    
    // Check resources
    const costs = {
      [AntType.Worker]: { food: 10, minerals: 0, larvae: 1, jelly: 2 },
      [AntType.Soldier]: { food: 20, minerals: 0, larvae: 1, jelly: 3 },
      [AntType.Scout]: { food: 15, minerals: 0, larvae: 1, jelly: 2.5 },
      [AntType.Major]: { food: 50, minerals: 10, larvae: 2, jelly: 5 },
      [AntType.Queen]: { food: 999, minerals: 999, larvae: 999, jelly: 999 } // Can't spawn
    };
    
    const cost = costs[antType];
    if (colony.food < cost.food || colony.minerals < cost.minerals || 
        colony.larvae < cost.larvae || colony.queen_jelly < cost.jelly) {
      console.log('Not enough resources');
      return;
    }
    
    // Deduct resources
    colony.food -= cost.food;
    colony.minerals -= cost.minerals;
    colony.larvae -= cost.larvae;
    colony.queen_jelly -= cost.jelly;
    
    // Create ant
    const stats = {
      [AntType.Queen]: { health: 200, speed: 0.5, damage: 0 },
      [AntType.Worker]: { health: 50, speed: 2, damage: 5 },
      [AntType.Soldier]: { health: 100, speed: 1.5, damage: 20 },
      [AntType.Scout]: { health: 30, speed: 3, damage: 10 },
      [AntType.Major]: { health: 150, speed: 1, damage: 30 }
    };
    
    const stat = stats[antType];
    const antId = this.nextId.ant++;
    const ant = {
      id: antId,
      colony_id: colonyId,
      ant_type: antType,
      x,
      y,
      z,
      health: stat.health,
      max_health: stat.health,
      carrying_resource: null,
      carrying_amount: 0,
      task: TaskType.Idle,
      target_x: null,
      target_y: null,
      target_z: null,
      speed: stat.speed,
      attack_damage: stat.damage
    };
    
    this.data.Ant.push(ant);
    colony.population++;
    
    this.emit('Colony', this.data.Colony);
    this.emit('Ant', this.data.Ant);
  }

  private commandAnts(antIds: number[], targetX: number, targetY: number, targetZ: number) {
    antIds.forEach(antId => {
      const ant = this.data.Ant.find(a => a.id === antId);
      if (!ant) return;
      
      const colony = this.data.Colony.find(c => c.id === ant.colony_id);
      if (!colony || colony.player_id !== this.identity) return;
      
      ant.target_x = targetX;
      ant.target_y = targetY;
      ant.target_z = targetZ;
      ant.task = TaskType.Exploring;
    });
    
    this.emit('Ant', this.data.Ant);
  }

  private buildChamber(colonyId: number, chamberType: ChamberType, x: number, y: number, z: number) {
    const colony = this.data.Colony.find(c => c.id === colonyId);
    if (!colony || colony.player_id !== this.identity) return;
    
    // Check resources
    const costs = {
      [ChamberType.Nursery]: { food: 50, minerals: 10 },
      [ChamberType.Storage]: { food: 30, minerals: 20 },
      [ChamberType.Barracks]: { food: 100, minerals: 50 },
      [ChamberType.ThroneRoom]: { food: 200, minerals: 100 }
    };
    
    const cost = costs[chamberType];
    if (colony.food < cost.food || colony.minerals < cost.minerals) {
      console.log('Not enough resources for chamber');
      return;
    }
    
    // Deduct resources
    colony.food -= cost.food;
    colony.minerals -= cost.minerals;
    
    // Create chamber
    const chamberId = this.nextId.chamber++;
    const chamber = {
      id: chamberId,
      colony_id: colonyId,
      chamber_type: chamberType,
      x,
      y,
      z,
      level: 1,
      capacity: chamberType === ChamberType.Nursery ? 20 :
                chamberType === ChamberType.Storage ? 100 :
                chamberType === ChamberType.Barracks ? 50 : 1
    };
    
    this.data.Chamber.push(chamber);
    
    this.emit('Colony', this.data.Colony);
    this.emit('Chamber', this.data.Chamber);
  }

  private digTunnel(colonyId: number, startX: number, startY: number, startZ: number,
                   endX: number, endY: number, endZ: number) {
    const colony = this.data.Colony.find(c => c.id === colonyId);
    if (!colony || colony.player_id !== this.identity) return;
    
    const tunnelId = this.nextId.tunnel++;
    const tunnel = {
      id: tunnelId,
      colony_id: colonyId,
      start_x: startX,
      start_y: startY,
      start_z: startZ,
      end_x: endX,
      end_y: endY,
      end_z: endZ,
      width: 2
    };
    
    this.data.Tunnel.push(tunnel);
    this.emit('Tunnel', this.data.Tunnel);
  }

  private attackTarget(attackerId: number, targetId: number) {
    const attacker = this.data.Ant.find(a => a.id === attackerId);
    const target = this.data.Ant.find(a => a.id === targetId);
    
    if (!attacker || !target) return;
    
    const attackerColony = this.data.Colony.find(c => c.id === attacker.colony_id);
    if (!attackerColony || attackerColony.player_id !== this.identity) return;
    
    // Check range
    const distance = Math.sqrt(
      Math.pow(attacker.x - target.x, 2) +
      Math.pow(attacker.y - target.y, 2) +
      Math.pow(attacker.z - target.z, 2)
    );
    
    if (distance > 5) return;
    
    // Apply damage
    target.health = Math.max(0, target.health - attacker.attack_damage);
    
    // Create battle event
    const battleId = this.nextId.battle++;
    const battle = {
      id: battleId,
      attacker_ant_id: attackerId,
      defender_ant_id: targetId,
      x: target.x,
      y: target.y,
      z: target.z,
      damage_dealt: attacker.attack_damage,
      timestamp: Date.now()
    };
    
    this.data.Battle.push(battle);
    
    // Remove ant if dead
    if (target.health === 0) {
      const targetColony = this.data.Colony.find(c => c.id === target.colony_id);
      if (targetColony) {
        targetColony.population--;
      }
      this.data.Ant = this.data.Ant.filter(a => a.id !== targetId);
    }
    
    this.emit('Ant', this.data.Ant);
    this.emit('Battle', this.data.Battle);
    this.emit('Colony', this.data.Colony);
  }

  private startGameLoop() {
    if (this.gameUpdateInterval) {
      clearInterval(this.gameUpdateInterval);
    }
    
    this.gameUpdateInterval = window.setInterval(() => {
      this.updateGame();
    }, 100); // 10 FPS for smooth movement
  }

  private toggleColonyAI(colonyId: number) {
    const colony = this.data.Colony.find(c => c.id === colonyId);
    if (!colony || colony.player_id !== this.identity) return;
    
    colony.ai_enabled = !colony.ai_enabled;
    this.emit('Colony', this.data.Colony);
  }
  
  private updateGame() {
    let antsChanged = false;
    let coloniesChanged = false;
    let resourcesChanged = false;
    
    // Update ant movements
    this.data.Ant.forEach(ant => {
      if (ant.target_x !== null && ant.target_y !== null && ant.target_z !== null) {
        const dx = ant.target_x - ant.x;
        const dy = ant.target_y - ant.y;
        const dz = ant.target_z - ant.z;
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
        
        if (distance > 1) {
          // Move towards target
          const moveDistance = ant.speed * 0.1; // Speed per frame
          ant.x += (dx / distance) * moveDistance;
          ant.y += (dy / distance) * moveDistance;
          ant.z += (dz / distance) * moveDistance;
          antsChanged = true;
        } else {
          // Reached target
          ant.x = ant.target_x;
          ant.y = ant.target_y;
          ant.z = ant.target_z;
          ant.target_x = null;
          ant.target_y = null;
          ant.target_z = null;
          
          // Check if near resource
          if (ant.ant_type === AntType.Worker && !ant.carrying_resource) {
            const nearbyResource = this.data.ResourceNode.find(r => {
              const dist = Math.sqrt(
                Math.pow(r.x - ant.x, 2) +
                Math.pow(r.y - ant.y, 2) +
                Math.pow(r.z - ant.z, 2)
              );
              return dist < 10 && r.amount > 0;
            });
            
            if (nearbyResource) {
              // Gather resource
              const gatherAmount = Math.min(10, nearbyResource.amount);
              nearbyResource.amount -= gatherAmount;
              ant.carrying_resource = nearbyResource.resource_type;
              ant.carrying_amount = gatherAmount;
              ant.task = TaskType.Returning;
              
              // Set target to colony throne room
              const colony = this.data.Colony.find(c => c.id === ant.colony_id);
              if (colony) {
                const throne = this.data.Chamber.find(ch => 
                  ch.colony_id === colony.id && 
                  ch.chamber_type === ChamberType.ThroneRoom
                );
                if (throne) {
                  ant.target_x = throne.x;
                  ant.target_y = throne.y;
                  ant.target_z = throne.z;
                }
              }
              
              resourcesChanged = true;
              antsChanged = true;
            }
          } else if (ant.carrying_resource && ant.task === TaskType.Returning) {
            // Check if at colony
            const colony = this.data.Colony.find(c => c.id === ant.colony_id);
            if (colony) {
              const throne = this.data.Chamber.find(ch => 
                ch.colony_id === colony.id && 
                ch.chamber_type === ChamberType.ThroneRoom
              );
              if (throne) {
                const dist = Math.sqrt(
                  Math.pow(throne.x - ant.x, 2) +
                  Math.pow(throne.y - ant.y, 2) +
                  Math.pow(throne.z - ant.z, 2)
                );
                
                if (dist < 10) {
                  // Deposit resources
                  if (ant.carrying_resource === ResourceType.Food) {
                    colony.food += ant.carrying_amount;
                  } else if (ant.carrying_resource === ResourceType.Minerals) {
                    colony.minerals += ant.carrying_amount;
                  }
                  
                  ant.carrying_resource = null;
                  ant.carrying_amount = 0;
                  ant.task = TaskType.Idle;
                  coloniesChanged = true;
                  antsChanged = true;
                }
              }
            }
          } else {
            ant.task = TaskType.Idle;
            antsChanged = true;
          }
        }
      }
    });
    
    // Regenerate resources
    this.data.ResourceNode.forEach(resource => {
      if (resource.amount < resource.max_amount) {
        resource.amount = Math.min(
          resource.max_amount,
          resource.amount + resource.regeneration_rate * 0.1
        );
        resourcesChanged = true;
      }
    });
    
    // Update colonies
    this.data.Colony.forEach(colony => {
      // Generate larvae
      const nurseries = this.data.Chamber.filter(ch => 
        ch.colony_id === colony.id && 
        ch.chamber_type === ChamberType.Nursery
      ).length;
      
      if (Math.random() < 0.01 * (1 + nurseries)) {
        colony.larvae++;
        coloniesChanged = true;
      }
      
      // Deplete queen jelly over time
      if (colony.queen_jelly > 0) {
        colony.queen_jelly = Math.max(0, colony.queen_jelly - 0.02);
        coloniesChanged = true;
      }
      
      // AI behavior
      if (colony.ai_enabled && Math.random() < 0.1) { // 10% chance per tick
        // Find colony's ants
        const colonyAnts = this.data.Ant.filter(a => a.colony_id === colony.id);
        const workers = colonyAnts.filter(a => a.ant_type === AntType.Worker);
        const scouts = colonyAnts.filter(a => a.ant_type === AntType.Scout);
        const idleWorkers = workers.filter(a => a.task === TaskType.Idle);
        
        // Critical: Queen jelly running low
        if (colony.queen_jelly < 20 && idleWorkers.length > 0) {
          // Send all idle workers to nearest food
          const foodNodes = this.data.ResourceNode.filter(r => 
            r.resource_type === ResourceType.Food && r.amount > 0
          );
          
          if (foodNodes.length > 0) {
            const queen = colonyAnts.find(a => a.ant_type === AntType.Queen);
            if (queen) {
              const nearestFood = foodNodes.sort((a, b) => {
                const distA = Math.sqrt(Math.pow(a.x - queen.x, 2) + Math.pow(a.y - queen.y, 2));
                const distB = Math.sqrt(Math.pow(b.x - queen.x, 2) + Math.pow(b.y - queen.y, 2));
                return distA - distB;
              })[0];
              
              idleWorkers.forEach(worker => {
                worker.target_x = nearestFood.x;
                worker.target_y = nearestFood.y;
                worker.target_z = nearestFood.z;
                worker.task = TaskType.Exploring;
              });
              antsChanged = true;
            }
          }
        }
        
        // Convert food to queen jelly if needed
        if (colony.queen_jelly < 50 && colony.food >= 20) {
          colony.food -= 10;
          colony.queen_jelly += 5;
          coloniesChanged = true;
        }
        
        // Spawn scouts if needed
        if (scouts.length < 2 && colony.food >= 15 && colony.larvae >= 1 && colony.queen_jelly >= 2.5) {
          const queen = colonyAnts.find(a => a.ant_type === AntType.Queen);
          if (queen) {
            this.spawnAnt(colony.id, AntType.Scout, queen.x + 10, queen.y + 10, queen.z);
          }
        }
        
        // Replace dead workers
        if (workers.length < 5 && colony.food >= 10 && colony.larvae >= 1 && colony.queen_jelly >= 2) {
          const queen = colonyAnts.find(a => a.ant_type === AntType.Queen);
          if (queen) {
            this.spawnAnt(colony.id, AntType.Worker, queen.x + 5, queen.y + 5, queen.z);
          }
        }
      }
    });
    
    // Emit updates
    if (antsChanged) this.emit('Ant', this.data.Ant);
    if (coloniesChanged) {
      this.emit('Colony', this.data.Colony);
      this.saveState();
    }
    if (resourcesChanged) this.emit('ResourceNode', this.data.ResourceNode);
  }

  private saveState() {
    const state = {
      data: this.data,
      nextId: this.nextId
    };
    localStorage.setItem('insectColonyWarsState', JSON.stringify(state));
  }

  private loadState() {
    const saved = localStorage.getItem('insectColonyWarsState');
    if (saved) {
      try {
        const state = JSON.parse(saved);
        this.data = state.data;
        this.nextId = state.nextId;
      } catch (e) {
        console.error('Failed to load state:', e);
      }
    }
  }

  disconnect() {
    if (this.gameUpdateInterval) {
      clearInterval(this.gameUpdateInterval);
    }
  }
}