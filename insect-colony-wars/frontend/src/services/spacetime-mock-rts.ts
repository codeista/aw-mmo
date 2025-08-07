// Mock SpacetimeDB service for RTS development
import { AntType, ResourceType, ChamberType, TaskType, AntTrait, ResourceNode } from '../main';

interface MockData {
  Player: any[];
  Colony: any[];
  Ant: any[];
  Tunnel: any[];
  Chamber: any[];
  ResourceNode: any[];
  Pheromone: any[];
  Battle: any[];
  ExploredTerritory: any[];
  DiscoveredResource: any[];
  Obstacle: any[];
  Prey: any[];
  Predator: any[];
  Larva: any[];
}

export class MockSpacetimeService {
  public identity: string;
  private listeners: Map<string, ((data: any) => void)[]> = new Map();
  private spawnSettings = {
    predators: true,
    prey: true
  };
  private data: MockData = {
    Player: [],
    Colony: [],
    Ant: [],
    Tunnel: [],
    Chamber: [],
    ResourceNode: [],
    Pheromone: [],
    Battle: [],
    ExploredTerritory: [],
    DiscoveredResource: [],
    Obstacle: [],
    Prey: [],
    Predator: [],
    Larva: []
  };
  private nextId = {
    colony: 1,
    ant: 1,
    tunnel: 1,
    chamber: 1,
    pheromone: 1,
    battle: 1,
    explored: 1,
    discovered: 1,
    obstacle: 1,
    prey: 1,
    predator: 1,
    larva: 1,
    resource: 1
  };
  private queenDigTracking: Map<number, { startTime: number, x: number, y: number, colonyId: number }> = new Map();
  private gameUpdateInterval: number | null = null;

  constructor() {
    // Generate unique identity per tab
    this.identity = sessionStorage.getItem('mockIdentity') || 
                    `player_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('mockIdentity', this.identity);
    
    // Initialize resource nodes
    this.initializeResources();
    
    // Initialize surface entities
    this.initializeSurfaceEntities();
  }

  private initializeResources() {
    this.data.ResourceNode = [
      // All resources on surface (z = 0)
      // Food resources
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
        resource_type: ResourceType.Food,
        x: 150,
        y: 75,
        z: 0,
        amount: 1500,
        max_amount: 1500,
        regeneration_rate: 2
      },
      {
        id: 4,
        resource_type: ResourceType.Food,
        x: -120,
        y: 60,
        z: 0,
        amount: 800,
        max_amount: 800,
        regeneration_rate: 1
      },
      // Water resources (puddles, dew drops)
      {
        id: 5,
        resource_type: ResourceType.Water,
        x: 80,
        y: -40,
        z: 0,
        amount: 1200,
        max_amount: 1200,
        regeneration_rate: 2
      },
      {
        id: 6,
        resource_type: ResourceType.Water,
        x: -100,
        y: 100,
        z: 0,
        amount: 1500,
        max_amount: 1500,
        regeneration_rate: 3
      },
      {
        id: 7,
        resource_type: ResourceType.Water,
        x: 0,
        y: -150,
        z: 0,
        amount: 2000,
        max_amount: 2000,
        regeneration_rate: 4
      },
      // Note: Minerals now come from digging underground
    ];
  }
  
  private generateNewWorld() {
    // Clear ID counters for new world
    this.nextId.obstacle = 1;
    this.nextId.prey = 1;
    this.nextId.predator = 1;
    
    // Generate new resources
    this.generateResources();
    
    // Generate new surface entities
    this.generateSurfaceEntities();
    
    // Emit all the new world data
    this.emit('ResourceNode', this.data.ResourceNode);
    this.emit('Obstacle', this.data.Obstacle);
    this.emit('Prey', this.data.Prey);
    this.emit('Predator', this.data.Predator);
  }
  
  private generateResources() {
    // Generate random resource distribution
    const numFoodSources = 8 + Math.floor(Math.random() * 5); // 8-12 food sources
    const numWaterSources = 4 + Math.floor(Math.random() * 3); // 4-6 water sources
    
    for (let i = 0; i < numFoodSources; i++) {
      const x = (Math.random() - 0.5) * 600;
      const y = (Math.random() - 0.5) * 600;
      this.data.ResourceNode.push({
        id: i + 1,
        resource_type: ResourceType.Food,
        x,
        y,
        z: 0,
        amount: 500 + Math.random() * 1500,
        max_amount: 2000,
        regeneration_rate: 1 + Math.random() * 2
      });
    }
    
    for (let i = 0; i < numWaterSources; i++) {
      const x = (Math.random() - 0.5) * 600;
      const y = (Math.random() - 0.5) * 600;
      this.data.ResourceNode.push({
        id: numFoodSources + i + 1,
        resource_type: ResourceType.Water,
        x,
        y,
        z: 0,
        amount: 300 + Math.random() * 700,
        max_amount: 1000,
        regeneration_rate: 0.5 + Math.random()
      });
    }
  }
  
  private generateSurfaceEntities() {
    // Generate obstacles
    const numObstacles = 15 + Math.floor(Math.random() * 20); // 15-35 obstacles
    for (let i = 0; i < numObstacles; i++) {
      const types = ['rock', 'plant', 'log', 'leaf'];
      const type = types[Math.floor(Math.random() * types.length)];
      
      this.data.Obstacle.push({
        id: this.nextId.obstacle++,
        obstacle_type: type,
        x: (Math.random() - 0.5) * 800,
        y: (Math.random() - 0.5) * 800,
        width: 10 + Math.random() * 30,
        height: 10 + Math.random() * 30,
        blocks_movement: type === 'rock' || type === 'log'
      });
    }
    
    // Generate prey only if spawn setting allows
    if (this.spawnSettings.prey) {
      const numPrey = 10 + Math.floor(Math.random() * 15); // 10-25 prey
      for (let i = 0; i < numPrey; i++) {
        const types = ['aphid', 'caterpillar', 'termite'];
        const type = types[Math.floor(Math.random() * types.length)];
        
        const stats = {
          aphid: { health: 20, speed: 1, food: 30 },
          caterpillar: { health: 40, speed: 0.5, food: 60 },
          termite: { health: 30, speed: 1.5, food: 40 }
        };
        
        const stat = stats[type as keyof typeof stats];
        
        this.data.Prey.push({
          id: this.nextId.prey++,
          prey_type: type,
          x: (Math.random() - 0.5) * 600,
          y: (Math.random() - 0.5) * 600,
          health: stat.health,
          max_health: stat.health,
          speed: stat.speed,
          food_value: stat.food,
          flee_distance: 30
        });
      }
    }
    
    // Generate predators only if spawn setting allows
    if (this.spawnSettings.predators) {
      const numPredators = 3 + Math.floor(Math.random() * 3); // 3-5 predators initially
      for (let i = 0; i < numPredators; i++) {
        const types = ['spider', 'bird', 'beetle'];
        const type = types[Math.floor(Math.random() * types.length)];
        
        const stats = {
          spider: { health: 100, speed: 2, damage: 25 },
          bird: { health: 80, speed: 4, damage: 30 },
          beetle: { health: 120, speed: 1.5, damage: 20 }
        };
        
        const stat = stats[type as keyof typeof stats];
        
        this.data.Predator.push({
          id: this.nextId.predator++,
          predator_type: type,
          x: (Math.random() - 0.5) * 800,
          y: (Math.random() - 0.5) * 800,
          health: stat.health,
          max_health: stat.health,
          speed: stat.speed,
          attack_damage: stat.damage,
          hunt_radius: 50 + Math.random() * 50,
          target_ant_id: null
        });
      }
    }
  }
  
  private initializeSurfaceEntities() {
    // Add obstacles
    this.data.Obstacle = [
      // Rocks
      {
        id: 1,
        obstacle_type: 'rock',
        x: 30,
        y: -20,
        width: 20,
        height: 20,
        blocks_movement: true
      },
      {
        id: 2,
        obstacle_type: 'rock',
        x: -60,
        y: 40,
        width: 25,
        height: 25,
        blocks_movement: true
      },
      // Plants
      {
        id: 3,
        obstacle_type: 'plant',
        x: 100,
        y: 20,
        width: 15,
        height: 30,
        blocks_movement: false
      },
      {
        id: 4,
        obstacle_type: 'plant',
        x: -80,
        y: -30,
        width: 20,
        height: 35,
        blocks_movement: false
      },
      // Logs
      {
        id: 5,
        obstacle_type: 'log',
        x: 0,
        y: 80,
        width: 40,
        height: 10,
        blocks_movement: true
      },
      // Leaves
      {
        id: 6,
        obstacle_type: 'leaf',
        x: -40,
        y: -80,
        width: 30,
        height: 20,
        blocks_movement: false
      }
    ];
    
    // Add prey
    this.data.Prey = [
      {
        id: 1,
        prey_type: 'aphid',
        x: 70,
        y: 30,
        health: 10,
        max_health: 10,
        speed: 0.5,
        food_value: 15,
        flee_distance: 30
      },
      {
        id: 2,
        prey_type: 'aphid',
        x: -50,
        y: 20,
        health: 10,
        max_health: 10,
        speed: 0.5,
        food_value: 15,
        flee_distance: 30
      },
      {
        id: 3,
        prey_type: 'caterpillar',
        x: 120,
        y: -40,
        health: 20,
        max_health: 20,
        speed: 0.3,
        food_value: 30,
        flee_distance: 40
      },
      {
        id: 4,
        prey_type: 'termite',
        x: -90,
        y: 70,
        health: 15,
        max_health: 15,
        speed: 0.8,
        food_value: 20,
        flee_distance: 35
      }
    ];
    
    // Add predators
    this.data.Predator = [
      {
        id: 1,
        predator_type: 'spider',
        x: 150,
        y: 100,
        health: 50,
        max_health: 50,
        speed: 1.2,
        attack_damage: 15,
        hunt_radius: 60,
        target_ant_id: null
      },
      {
        id: 2,
        predator_type: 'beetle',
        x: -130,
        y: -90,
        health: 40,
        max_health: 40,
        speed: 1.0,
        attack_damage: 10,
        hunt_radius: 50,
        target_ant_id: null
      }
    ];
    
    // Emit initial data
    this.emit('Obstacle', this.data.Obstacle);
    this.emit('Prey', this.data.Prey);
    this.emit('Predator', this.data.Predator);
  }
  
  private generateRandomTraitForType(antType: AntType): AntTrait | undefined {
    // No traits for RoyalWorker or base Queen
    if (antType === AntType.RoyalWorker || antType === AntType.Queen) {
      return undefined;
    }
    
    const random = Math.random() * 100;
    
    // Different trait pools for different ant types
    switch (antType) {
      case AntType.YoungQueen:
        const queenTraits = [AntTrait.Fertile, AntTrait.Matriarch, AntTrait.Survivor];
        return queenTraits[Math.floor(Math.random() * queenTraits.length)];
        
      case AntType.Worker:
        const workerTraits = [AntTrait.Strong, AntTrait.Swift, AntTrait.Efficient, AntTrait.Industrious, AntTrait.Pheromone];
        return workerTraits[Math.floor(Math.random() * workerTraits.length)];
        
      case AntType.Soldier:
      case AntType.Major:
        const combatTraits = [AntTrait.AcidSpray, AntTrait.Venomous, AntTrait.Armored, AntTrait.Regenerator];
        return combatTraits[Math.floor(Math.random() * combatTraits.length)];
        
      case AntType.Scout:
        const scoutTraits = [AntTrait.Swift, AntTrait.Scout, AntTrait.Climber, AntTrait.Pheromone];
        return scoutTraits[Math.floor(Math.random() * scoutTraits.length)];
        
      default:
        return undefined;
    }
  }

  async connect(): Promise<void> {
    console.log('Mock SpacetimeDB connected');
    
    // Load saved state from localStorage
    this.loadState();
    
    // Clean up dead colonies and orphaned ants
    this.cleanupDeadData();
    
    // Create player if it doesn't exist for this identity
    const existingPlayer = this.data.Player.find(p => p.id === this.identity);
    if (!existingPlayer) {
      console.log('Creating new player for identity:', this.identity);
      this.createPlayer('Queen');
    }
    
    // Start game update loop
    this.startGameLoop();
    
    // Emit initial data
    setTimeout(() => {
      this.emit('Player', this.data.Player);
      this.emit('Colony', this.data.Colony);
      this.emit('Ant', this.data.Ant);
      this.emit('Chamber', this.data.Chamber);
      this.emit('ResourceNode', this.data.ResourceNode);
      this.emit('ExploredTerritory', this.data.ExploredTerritory);
      this.emit('DiscoveredResource', this.data.DiscoveredResource);
      this.emit('Larva', this.data.Larva);
      this.emit('Tunnel', this.data.Tunnel);
      this.emit('Obstacle', this.data.Obstacle);
      this.emit('Prey', this.data.Prey);
      this.emit('Predator', this.data.Predator);
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
    // Enhanced logging with timestamp and formatted output
    const timestamp = new Date().toLocaleTimeString();
    console.group(`🎮 [${timestamp}] User Action: ${method}`);
    console.log('📊 Arguments:', args);
    
    // Log specific details based on action type
    switch (method) {
      case 'spawn_larva':
        console.log('🥚 Queen spawning larva');
        break;
      case 'feed_larva':
        console.log(`🐜 Creating ${args.ant_type} from larva`);
        break;
      case 'command_ants':
        console.log(`📍 Moving ${args.ant_ids.length} ants to (${Math.round(args.target_x)}, ${Math.round(args.target_y)})`);
        break;
      case 'build_chamber':
        console.log(`🏗️ Building ${args.chamber_type}`);
        break;
      case 'respawn_as_queen':
        console.log(`👑 Respawning at (${Math.round(args.x)}, ${Math.round(args.y)})`);
        break;
    }
    console.groupEnd();
    
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
      case 'spawn_larva':
        this.spawnLarva(args.queen_id);
        break;
      case 'feed_larva':
        this.feedLarva(args.colony_id, args.ant_type, args.x, args.y, args.z);
        break;
      case 'produce_jelly':
        this.produceJelly(args.ant_id);
        break;
      case 'command_ants':
        this.commandAnts(args.ant_ids, args.target_x, args.target_y, args.target_z, args.task_override);
        break;
      case 'build_chamber':
        this.buildChamber(args.ant_id, args.chamber_type, args.x, args.y, args.z);
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
      case 'hive_command_gather':
        this.hiveCommandGather(args.colony_id);
        break;
      case 'hive_command_defend':
        this.hiveCommandDefend(args.colony_id);
        break;
      case 'hive_command_hunt':
        this.hiveCommandHunt(args.colony_id, args.target_x, args.target_y, args.target_z);
        break;
      case 'respawn_as_queen':
        this.respawnAsQueen(args.x, args.y);
        break;
      case 'dig_at_location':
        this.digAtLocation(args.ant_ids, args.target_x, args.target_y, args.target_z);
        break;
      case 'nuptial_flight':
        this.nuptialFlight(args.queen_id);
        break;
      case 'kill_predator':
        this.killPredator(args.predator_id);
        break;
      case 'kill_prey':
        this.killPrey(args.prey_id);
        break;
      case 'set_spawn_settings':
        this.setSpawnSettings(args.spawn_predators, args.spawn_prey);
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
      food: 0,
      water: 0,
      minerals: 0,
      larvae: 0,
      queen_jelly: 20, // Start with minimal jelly
      population: 1,
      territory_radius: 30,
      created_at: Date.now(),
      ai_enabled: false
    };
    
    this.data.Colony.push(colony);
    
    // Create queen on surface
    const queenId = this.nextId.ant++;
    const queen = {
      id: queenId,
      colony_id: colonyId,
      ant_type: AntType.Queen,
      x,
      y,
      z: 0, // Start on surface
      health: 200,
      max_health: 200,
      carrying_resource: null,
      carrying_amount: 0,
      task: TaskType.Building, // Queen starts digging
      target_x: x,
      target_y: y,
      target_z: -5,
      speed: 0.5,
      attack_damage: 50,
      jelly_consumption_rate: 0,
      last_fed_at: Date.now()
    };
    
    this.data.Ant.push(queen);
    colony.queen_id = queenId;
    
    console.log(`Queen ${queenId} is digging the initial burrow at (${x}, ${y})...`);
    
    // Schedule burrow creation after dig time
    setTimeout(() => {
      const queenAnt = this.data.Ant.find(a => a.id === queenId);
      const col = this.data.Colony.find(c => c.id === colonyId);
      if (!queenAnt || !col) return;
      
      // Create the initial burrow
      const burrowId = this.nextId.chamber++;
      const burrow = {
        id: burrowId,
        colony_id: colonyId,
        chamber_type: ChamberType.Burrow,
        x,
        y,
        z: -5,
        level: 1,
        capacity: 20 // Increased initial capacity from 10 to 20 for more starting space
      };
      
      this.data.Chamber.push(burrow);
      
      // Move queen underground
      queenAnt.x = x;
      queenAnt.y = y;
      queenAnt.z = -5;
      queenAnt.task = TaskType.Idle;
      queenAnt.target_x = null;
      queenAnt.target_y = null;
      queenAnt.target_z = null;
      
      // Queen lays first larva
      col.larvae = 1;
      col.queen_jelly -= 0.5;
      
      console.log('Burrow complete! Queen laid first larva. Space for 4 more larvae.');
      
      this.emit('Chamber', this.data.Chamber);
      this.emit('Ant', this.data.Ant);
      this.emit('Colony', this.data.Colony);
    }, 5000); // 5 seconds to dig initial burrow
    
    player.total_colonies++;
    
    this.emit('Player', this.data.Player);
    this.emit('Colony', this.data.Colony);
    this.emit('Ant', this.data.Ant);
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
      [AntType.Queen]: { food: 999, minerals: 999, larvae: 999, jelly: 999 }, // Can't spawn
      [AntType.YoungQueen]: { food: 100, minerals: 100, larvae: 1, jelly: 50 },
      [AntType.RoyalWorker]: { food: 30, minerals: 0, larvae: 1, jelly: 5 }
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
      [AntType.Queen]: { health: 200, speed: 0.5, damage: 50 },
      [AntType.YoungQueen]: { health: 150, speed: 4, damage: 15 },
      [AntType.Worker]: { health: 50, speed: 4, damage: 5 },
      [AntType.RoyalWorker]: { health: 40, speed: 0.5, damage: 0 },
      [AntType.Soldier]: { health: 100, speed: 3, damage: 20 },
      [AntType.Scout]: { health: 30, speed: 6, damage: 10 },
      [AntType.Major]: { health: 150, speed: 2, damage: 30 }
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
      attack_damage: stat.damage,
      jelly_consumption_rate: this.getJellyConsumptionRate(antType),
      last_fed_at: Date.now(),
      maturation_time: antType === AntType.YoungQueen ? Date.now() + 300000 : undefined
    };
    
    this.data.Ant.push(ant);
    colony.population++;
    
    this.emit('Colony', this.data.Colony);
    this.emit('Ant', this.data.Ant);
  }

  private commandAnts(antIds: number[], targetX: number, targetY: number, targetZ: number, taskOverride?: string) {
    // Calculate total jelly cost
    let totalJellyCost = 0;
    const validAnts: any[] = [];
    
    antIds.forEach(antId => {
      const ant = this.data.Ant.find(a => a.id === antId);
      if (!ant) return;
      
      const colony = this.data.Colony.find(c => c.id === ant.colony_id);
      if (!colony || colony.player_id !== this.identity) return;
      
      // Calculate distance and jelly cost (0.01 jelly per unit distance)
      const distance = Math.sqrt(
        Math.pow(targetX - ant.x, 2) +
        Math.pow(targetY - ant.y, 2) +
        Math.pow(targetZ - ant.z, 2)
      );
      const jellyCost = distance * 0.01;
      totalJellyCost += jellyCost;
      validAnts.push({ ant, colony });
    });
    
    // Check if colony has enough jelly
    if (validAnts.length > 0) {
      const colony = validAnts[0].colony;
      if (colony.queen_jelly < totalJellyCost) {
        console.warn('Not enough queen jelly for movement. Need', totalJellyCost, 'have', colony.queen_jelly);
        return;
      }
      
      // Deduct jelly
      colony.queen_jelly -= totalJellyCost;
      
      // Move ants with proper underground navigation
      antIds.forEach(antId => {
        const ant = this.data.Ant.find(a => a.id === antId);
        if (!ant) return;
        
        // Check if ant needs to enter/exit burrow for underground movement
        const isUnderground = ant.z < -5;
        const targetIsOnSurface = targetZ >= 0;
        
        console.log(`🔍 Ant ${ant.id} routing: z=${ant.z} -> targetZ=${targetZ}, underground=${isUnderground}, targetSurface=${targetIsOnSurface}`);
        
        if (!isUnderground && targetZ < -5) {
          // Need to find nearest burrow entrance to go underground
          const burrows = this.data.Chamber.filter(ch => 
            ch.colony_id === ant.colony_id && 
            ch.chamber_type === ChamberType.Burrow
          );
          
          if (burrows.length > 0) {
            // Find nearest burrow
            const nearestBurrow = burrows.sort((a, b) => {
              const distA = Math.sqrt(Math.pow(a.x - ant.x, 2) + Math.pow(a.y - ant.y, 2));
              const distB = Math.sqrt(Math.pow(b.x - ant.x, 2) + Math.pow(b.y - ant.y, 2));
              return distA - distB;
            })[0];
            
            // First go to burrow entrance on surface
            ant.target_x = nearestBurrow.x;
            ant.target_y = nearestBurrow.y;
            ant.target_z = 0; // Surface entrance
            ant.task = TaskType.Entering;
            
            // Store final destination for later
            (ant as any).final_target_x = targetX;
            (ant as any).final_target_y = targetY;
            (ant as any).final_target_z = targetZ;
            (ant as any).final_task = taskOverride || TaskType.Idle;
            return;
          }
        } else if (isUnderground && targetIsOnSurface) {
          // Need to exit through burrow to go to surface
          const burrows = this.data.Chamber.filter(ch => 
            ch.colony_id === ant.colony_id && 
            ch.chamber_type === ChamberType.Burrow
          );
          
          console.log(`🚪 Ant ${ant.id} needs to exit. Found ${burrows.length} burrows for colony ${ant.colony_id}`);
          
          if (burrows.length > 0) {
            // Find the deep burrow chamber (not the entrance) closest to ant
            const deepBurrows = burrows.filter(b => !b.is_entrance && b.z < -5);
            if (deepBurrows.length === 0) {
              console.log(`⚠️ No deep burrow chamber found for exiting`);
              return;
            }
            
            const nearestBurrow = deepBurrows.sort((a, b) => {
              const distA = Math.sqrt(Math.pow(a.x - ant.x, 2) + Math.pow(a.y - ant.y, 2) + Math.pow(a.z - ant.z, 2));
              const distB = Math.sqrt(Math.pow(b.x - ant.x, 2) + Math.pow(b.y - ant.y, 2) + Math.pow(b.z - ant.z, 2));
              return distA - distB;
            })[0];
            
            console.log(`📍 Routing ant ${ant.id} through burrow at (${nearestBurrow.x}, ${nearestBurrow.y}, ${nearestBurrow.z})`);
            
            // First go to burrow underground chamber
            ant.target_x = nearestBurrow.x;
            ant.target_y = nearestBurrow.y;
            ant.target_z = nearestBurrow.z;
            ant.task = TaskType.Exiting;
            
            // Store final destination
            (ant as any).final_target_x = targetX;
            (ant as any).final_target_y = targetY;
            (ant as any).final_target_z = targetZ;
            (ant as any).final_task = taskOverride || TaskType.Idle;
            return;
          }
        }
        
        // Direct movement if already in correct layer or no burrow available
        ant.target_x = targetX;
        ant.target_y = targetY;
        ant.target_z = targetZ;
        
        // Set task based on override or context
        if (taskOverride) {
          switch (taskOverride) {
            case 'gather':
              ant.task = TaskType.Gathering;
              break;
            case 'scout':
              ant.task = TaskType.Exploring;
              break;
            case 'guard':
              ant.task = TaskType.Idle; // Guards stay in place
              break;
            case 'hunt':
              ant.task = TaskType.Fighting;
              break;
            case 'idle':
              ant.task = TaskType.Idle;
              break;
            default:
              ant.task = TaskType.Exploring;
          }
        } else {
          ant.task = TaskType.Exploring;
        }
      });
      
      this.emit('Colony', this.data.Colony);
      this.emit('Ant', this.data.Ant);
    }
  }

  private spawnLarva(queenId: number) {
    const queen = this.data.Ant.find(a => a.id === queenId);
    if (!queen || queen.ant_type !== AntType.Queen) return;
    
    const colony = this.data.Colony.find(c => c.id === queen.colony_id);
    if (!colony || colony.player_id !== this.identity) return;
    
    // Check if queen has energy (jelly) to produce larva
    if (colony.queen_jelly < 0.5) {
      console.log('Not enough queen jelly to spawn larva');
      return;
    }
    
    // Check if queen is already laying
    if ((queen as any).laying_start_time) {
      console.log('Queen is already laying an egg');
      return;
    }
    
    // Check larvae capacity in queen's chamber
    const queenChamber = this.data.Chamber.find(ch => 
      ch.colony_id === colony.id && 
      ch.x === queen.x && 
      ch.y === queen.y && 
      ch.z === queen.z
    );
    
    if (queenChamber) {
      // Initialize larvae tracking if not present
      if (queenChamber.larvae_count === undefined) {
        queenChamber.larvae_count = 0;
      }
      if (queenChamber.larvae_capacity === undefined) {
        queenChamber.larvae_capacity = 5;
      }
      
      // Check if chamber has reached larvae capacity
      if (queenChamber.larvae_count >= queenChamber.larvae_capacity) {
        console.log(`Chamber at capacity! ${queenChamber.larvae_count}/${queenChamber.larvae_capacity} larvae`);
        return;
      }
    }
    
    // Start laying process
    (queen as any).laying_start_time = Date.now();
    queen.task = TaskType.Depositing; // Use depositing as "laying" status
    colony.queen_jelly -= 0.5; // Deduct jelly immediately
    
    this.emit('Ant', this.data.Ant);
    this.emit('Colony', this.data.Colony);
    console.log(`Queen started laying an egg`);
  }
  
  private feedLarva(colonyId: number, antType: AntType, x: number, y: number, z: number) {
    const colony = this.data.Colony.find(c => c.id === colonyId);
    if (!colony || colony.player_id !== this.identity) return;
    
    if (colony.larvae < 1) {
      console.log('No larvae available');
      return;
    }
    
    // Check population capacity
    const currentPop = this.calculateColonyPopulation(colonyId);
    const maxPop = this.calculateColonyCapacity(colonyId);
    const unitCost = this.getUnitPopulationCost(antType);
    
    if (currentPop + unitCost > maxPop) {
      console.log(`Population cap reached! ${currentPop}/${maxPop} used. Need ${unitCost} points for ${antType}`);
      alert(`Population cap reached! Build more barracks to increase capacity.\nCurrent: ${currentPop}/${maxPop} points`);
      return;
    }
    
    // Check if young queen requires throne room
    if (antType === AntType.YoungQueen && !this.hasRoyalChamber(colonyId)) {
      console.log('Young queens require a Throne Room!');
      alert('You need a Throne Room to produce Young Queens!');
      return;
    }
    
    // Calculate jelly cost for transformation
    const jellyCost = {
      [AntType.Worker]: 2,
      [AntType.RoyalWorker]: 5,
      [AntType.Soldier]: 3,
      [AntType.Scout]: 2.5,
      [AntType.Major]: 5,
      [AntType.Queen]: 999, // Cannot transform into queen
      [AntType.YoungQueen]: 50 // Expensive to create new queens
    };
    
    const cost = jellyCost[antType];
    if (!cost || cost > 100) {
      console.log('Cannot transform larva into', antType);
      return;
    }
    
    // Special handling for first worker
    const isFirstWorker = colony.population === 1 && antType === AntType.Worker;
    const actualCost = isFirstWorker ? 1 : cost;
    
    if (colony.queen_jelly < actualCost) {
      console.log('Not enough queen jelly to transform larva');
      return;
    }
    
    // Young queens also need food and water
    if (antType === AntType.YoungQueen) {
      if (colony.food < 50 || colony.water < 20) {
        console.log('Not enough resources for young queen (need 50 food, 20 water)');
        return;
      }
      colony.food -= 50;
      colony.water -= 20;
    }
    
    colony.queen_jelly -= actualCost;
    colony.larvae -= 1;
    
    // Find and remove the closest larva
    const larvaeInChamber = this.data.Larva.filter(l => 
      l.colony_id === colonyId &&
      Math.abs(l.x - x) < 30 &&
      Math.abs(l.y - y) < 30 &&
      l.z === z
    );
    
    if (larvaeInChamber.length > 0) {
      // Remove the oldest larva
      const oldestLarva = larvaeInChamber.reduce((oldest, current) => 
        current.created_at < oldest.created_at ? current : oldest
      );
      
      this.data.Larva = this.data.Larva.filter(l => l.id !== oldestLarva.id);
      this.emit('Larva', this.data.Larva);
    }
    
    // Decrease larvae count in the chamber
    const chamber = this.data.Chamber.find(ch => 
      ch.colony_id === colonyId && 
      ch.x === x && 
      ch.y === y && 
      ch.z === z
    );
    
    if (chamber && chamber.larvae_count && chamber.larvae_count > 0) {
      chamber.larvae_count -= 1;
      this.emit('Chamber', this.data.Chamber);
    }
    
    // Create the ant
    const stats = {
      [AntType.Queen]: { health: 200, speed: 0.5, damage: 50 },
      [AntType.YoungQueen]: { health: 150, speed: 4, damage: 15 },
      [AntType.Worker]: { health: 50, speed: 4, damage: 5 },
      [AntType.RoyalWorker]: { health: 40, speed: 0.5, damage: 0 },
      [AntType.Soldier]: { health: 100, speed: 3, damage: 20 },
      [AntType.Scout]: { health: 30, speed: 6, damage: 10 },
      [AntType.Major]: { health: 150, speed: 2, damage: 30 }
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
      attack_damage: stat.damage,
      jelly_consumption_rate: this.getJellyConsumptionRate(antType),
      last_fed_at: Date.now(),
      maturation_time: antType === AntType.YoungQueen ? Date.now() + 300000 : undefined
    };
    
    // Add trait for all ants except RoyalWorker and base Queen
    const trait = this.generateRandomTraitForType(antType);
    if (trait) {
      (ant as any).trait_type = trait;
    }
    
    this.data.Ant.push(ant);
    colony.population++;
    
    this.emit('Colony', this.data.Colony);
    this.emit('Ant', this.data.Ant);
    console.log('Larva transformed into', antType);
  }
  
  private produceJelly(antId: number) {
    const ant = this.data.Ant.find(a => a.id === antId);
    if (!ant || ant.ant_type !== AntType.RoyalWorker) return;
    
    const colony = this.data.Colony.find(c => c.id === ant.colony_id);
    if (!colony || colony.player_id !== this.identity) return;
    
    // Check if in burrow
    const inBurrow = this.data.Chamber.some(ch => 
      ch.colony_id === colony.id && 
      ch.chamber_type === ChamberType.Burrow &&
      Math.sqrt(Math.pow(ant.x - ch.x, 2) + Math.pow(ant.y - ch.y, 2) + Math.pow(ant.z - ch.z, 2)) < 10
    );
    
    if (!inBurrow) {
      console.log('Royal workers must be in a burrow to produce jelly');
      return;
    }
    
    // Check if has food and water to convert
    if (colony.food < 5 || colony.water < 2) {
      console.log('Not enough resources to produce jelly (need 5 food and 2 water)');
      return;
    }
    
    // Convert food and water to jelly
    colony.food -= 5;
    colony.water -= 2;
    colony.queen_jelly += 3; // Better conversion with water
    
    this.emit('Colony', this.data.Colony);
    console.log('Royal worker produced 3 jelly from 5 food and 2 water');
  }
  
  private buildChamber(antId: number, chamberType: ChamberType, x: number, y: number, z: number) {
    const ant = this.data.Ant.find(a => a.id === antId);
    if (!ant) return;
    
    const colony = this.data.Colony.find(c => c.id === ant.colony_id);
    if (!colony || colony.player_id !== this.identity) return;
    
    // Check ant permissions
    if (ant.ant_type === AntType.Queen) {
      if (chamberType !== ChamberType.Burrow) {
        console.log('Queens can only build burrows');
        return;
      }
      // Check if colony already has a burrow
      const hasBurrow = this.data.Chamber.some(ch => 
        ch.colony_id === colony.id && ch.chamber_type === ChamberType.Burrow
      );
      if (hasBurrow) {
        console.log('Colony already has a burrow. Only one burrow allowed.');
        return;
      }
    } else if (ant.ant_type === AntType.Worker) {
      if (chamberType === ChamberType.Burrow) {
        console.log('Workers cannot build burrows, only queens can');
        return;
      }
      
      // Smart positioning: suggest building near existing chambers for connectivity
      const existingChambers = this.data.Chamber.filter(ch => 
        ch.colony_id === colony.id && Math.abs(ch.z - z) < 10
      );
      
      if (existingChambers.length > 0) {
        // Find nearest chamber
        const nearestChamber = existingChambers.sort((a, b) => {
          const distA = Math.sqrt(Math.pow(a.x - x, 2) + Math.pow(a.y - y, 2));
          const distB = Math.sqrt(Math.pow(b.x - x, 2) + Math.pow(b.y - y, 2));
          return distA - distB;
        })[0];
        
        const dist = Math.sqrt(Math.pow(nearestChamber.x - x, 2) + Math.pow(nearestChamber.y - y, 2));
        
        // Suggest optimal distance for expansion (80-120 units apart)
        if (dist < 60) {
          console.log('⚠️ Too close to existing chamber! Build at least 60 units away for better spacing.');
          // Auto-adjust position
          const angle = Math.atan2(y - nearestChamber.y, x - nearestChamber.x);
          x = nearestChamber.x + Math.cos(angle) * 100;
          y = nearestChamber.y + Math.sin(angle) * 100;
          console.log(`📍 Adjusted to (${Math.round(x)}, ${Math.round(y)}) for better spacing`);
        } else if (dist > 150) {
          console.log('⚠️ Warning: >150 units from nearest chamber - won\'t auto-connect with tunnels');
        }
      }
    } else {
      console.log('Only queens and workers can build');
      return;
    }
    
    // Check resources (now uses minerals from digging and water)
    const costs = {
      [ChamberType.Nursery]: { minerals: 10, water: 5, jelly: 0 },
      [ChamberType.Storage]: { minerals: 20, water: 10, jelly: 0 },
      [ChamberType.Barracks]: { minerals: 50, water: 20, jelly: 0 },
      [ChamberType.ThroneRoom]: { minerals: 100, water: 50, jelly: 0 },
      [ChamberType.Burrow]: { minerals: 5, water: 5, jelly: 10 }
    };
    
    const cost = costs[chamberType];
    if (colony.minerals < cost.minerals || colony.water < cost.water || colony.queen_jelly < cost.jelly) {
      console.log('Not enough resources for chamber (need minerals from digging)');
      return;
    }
    
    // Deduct resources
    colony.minerals -= cost.minerals;
    colony.water -= cost.water;
    colony.queen_jelly -= cost.jelly;
    
    // Create chamber
    const chamberId = this.nextId.chamber++;
    const chamber = {
      id: chamberId,
      colony_id: colony.id,
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
  
  private hiveCommandGather(colonyId: number) {
    const colony = this.data.Colony.find(c => c.id === colonyId);
    if (!colony || colony.player_id !== this.identity) return;
    
    // Find all workers and scouts
    const ants = this.data.Ant.filter(a => 
      a.colony_id === colonyId && 
      (a.ant_type === AntType.Worker || a.ant_type === AntType.Scout)
    );
    
    // Find resource nodes
    const resources = this.data.ResourceNode.filter(r => r.amount > 0);
    
    // Assign each ant to nearest resource
    ants.forEach(ant => {
      const nearest = resources.sort((a, b) => {
        const distA = Math.sqrt(Math.pow(a.x - ant.x, 2) + Math.pow(a.y - ant.y, 2) + Math.pow(a.z - ant.z, 2));
        const distB = Math.sqrt(Math.pow(b.x - ant.x, 2) + Math.pow(b.y - ant.y, 2) + Math.pow(b.z - ant.z, 2));
        return distA - distB;
      })[0];
      
      if (nearest) {
        ant.target_x = nearest.x;
        ant.target_y = nearest.y;
        ant.target_z = nearest.z;
        ant.task = TaskType.Gathering;
      }
    });
    
    this.emit('Ant', this.data.Ant);
  }
  
  private hiveCommandDefend(colonyId: number) {
    const colony = this.data.Colony.find(c => c.id === colonyId);
    if (!colony || colony.player_id !== this.identity) return;
    
    // Find the main burrow (or any chamber underground)
    const chambers = this.data.Chamber.filter(ch => ch.colony_id === colonyId);
    const burrow = chambers.find(ch => ch.chamber_type === ChamberType.Burrow);
    const underground = chambers.find(ch => ch.z < -5) || burrow;
    
    if (!underground) {
      console.log('No underground chambers found for defense!');
      return;
    }
    
    // Command all ants to retreat underground
    const ants = this.data.Ant.filter(a => a.colony_id === colonyId);
    
    ants.forEach((ant) => {
      // Different defensive positions based on ant type
      if (ant.ant_type === AntType.Queen) {
        // Queen stays deep underground in the safest chamber
        const safeRoom = chambers.find(ch => ch.chamber_type === ChamberType.ThroneRoom) || 
                         underground;
        ant.target_x = safeRoom.x;
        ant.target_y = safeRoom.y;
        ant.target_z = safeRoom.z;
        ant.task = TaskType.Returning;
      } else if (ant.ant_type === AntType.Soldier || ant.ant_type === AntType.Major) {
        // Soldiers defend near the burrow entrance underground
        const defenseRadius = 20;
        const angle = Math.random() * Math.PI * 2;
        ant.target_x = underground.x + Math.cos(angle) * defenseRadius;
        ant.target_y = underground.y + Math.sin(angle) * defenseRadius;
        ant.target_z = underground.z;
        ant.task = TaskType.Returning;
      } else if (ant.ant_type === AntType.RoyalWorker) {
        // Royal workers stay deep with the queen
        ant.target_x = underground.x + (Math.random() - 0.5) * 10;
        ant.target_y = underground.y + (Math.random() - 0.5) * 10;
        ant.target_z = underground.z;
        ant.task = TaskType.Returning;
      } else {
        // Other ants spread out underground
        const spreadRadius = 30;
        const angle = Math.random() * Math.PI * 2;
        ant.target_x = underground.x + Math.cos(angle) * spreadRadius;
        ant.target_y = underground.y + Math.sin(angle) * spreadRadius;
        ant.target_z = underground.z;
        ant.task = TaskType.Returning;
      }
    });
    
    console.log(`Colony ${colonyId} retreating to burrow defense! All units going underground.`);
    this.emit('Ant', this.data.Ant);
  }
  
  private hiveCommandHunt(colonyId: number, targetX: number, targetY: number, targetZ: number) {
    const colony = this.data.Colony.find(c => c.id === colonyId);
    if (!colony || colony.player_id !== this.identity) return;
    
    // Send all soldiers and majors
    const huntingParty = this.data.Ant.filter(a => 
      a.colony_id === colonyId && 
      (a.ant_type === AntType.Soldier || a.ant_type === AntType.Major)
    );
    
    // Send one scout ahead
    const scout = this.data.Ant.find(a => 
      a.colony_id === colonyId && a.ant_type === AntType.Scout
    );
    
    [...huntingParty, scout].filter(Boolean).forEach(ant => {
      ant!.target_x = targetX;
      ant!.target_y = targetY;
      ant!.target_z = targetZ;
      ant!.task = ant!.ant_type === AntType.Scout ? TaskType.Exploring : TaskType.Fighting;
    });
    
    this.emit('Ant', this.data.Ant);
  }
  
  private nuptialFlight(queenId: number) {
    const queen = this.data.Ant.find(a => a.id === queenId);
    if (!queen || queen.ant_type !== AntType.YoungQueen) return;
    
    const colony = this.data.Colony.find(c => c.id === queen.colony_id);
    if (!colony || colony.player_id !== this.identity) return;
    
    // Store the trait for the new colony
    const queenTrait = (queen as any).trait_type || AntTrait.Survivor;
    
    // Update player stats
    const player = this.data.Player.find(p => p.id === this.identity);
    if (player) {
      player.queens_produced = (player.queens_produced || 0) + 1;
      player.generations_survived = (player.generations_survived || 0) + 1;
      
      // Calculate colony score based on resources gathered, population, etc.
      const colonyScore = Math.floor(
        colony.food + colony.water + colony.minerals * 2 + 
        colony.population * 10 + 
        colony.queen_jelly * 5
      );
      
      if (colonyScore > (player.best_colony_score || 0)) {
        player.best_colony_score = colonyScore;
      }
      
      this.emit('Player', this.data.Player);
    }
    
    // Remove the young queen
    this.data.Ant = this.data.Ant.filter(a => a.id !== queenId);
    colony.population--;
    
    // Show success message
    console.log(`Young queen has flown away! Generation ${player?.generations_survived || 1} complete!`);
    alert(`Success! Your young queen has flown away to start generation ${(player?.generations_survived || 0) + 1}!`);
    
    // Emit updates
    this.emit('Ant', this.data.Ant);
    this.emit('Colony', this.data.Colony);
    
    // Emit placement mode event to trigger the "New World Generated" popup
    this.emit('PlacementMode', { enabled: true });
    
    // Automatically start new generation with the young queen after a delay
    setTimeout(() => {
      this.respawnAsQueenWithTrait(
        (Math.random() - 0.5) * 300, 
        (Math.random() - 0.5) * 300,
        queenTrait
      );
    }, 1000);
  }
  
  private killPredator(predatorId: number) {
    // Remove the predator from the game
    this.data.Predator = this.data.Predator.filter(p => p.id !== predatorId);
    this.emit('Predator', this.data.Predator);
    console.log(`🔫 Killed predator ${predatorId}`);
  }
  
  private killPrey(preyId: number) {
    // Remove the prey from the game
    this.data.Prey = this.data.Prey.filter(p => p.id !== preyId);
    this.emit('Prey', this.data.Prey);
    console.log(`🔫 Killed prey ${preyId}`);
  }
  
  private setSpawnSettings(spawnPredators: boolean, spawnPrey: boolean) {
    // Update spawn settings
    this.spawnSettings.predators = spawnPredators;
    this.spawnSettings.prey = spawnPrey;
    console.log(`🎮 Spawn settings updated - Predators: ${spawnPredators}, Prey: ${spawnPrey}`);
  }
  
  private setWorkerToGather(workerId: number) {
    const worker = this.data.Ant.find(a => a.id === workerId);
    if (!worker || worker.ant_type !== AntType.Worker) return;
    
    console.log(`🐜 Setting worker ${workerId} to gather. Current position: (${worker.x}, ${worker.y}, ${worker.z})`);
    
    // Find nearest discovered food resource
    const colony = this.data.Colony.find(c => c.id === worker.colony_id);
    if (!colony) return;
    
    const discoveredResources = this.data.DiscoveredResource.filter(dr => dr.colony_id === colony.id);
    const foodResources = discoveredResources
      .map(dr => this.data.ResourceNode.find(r => r.id === dr.resource_id))
      .filter(r => r && r.resource_type === ResourceType.Food && r.amount > 0);
    
    console.log(`Found ${foodResources.length} discovered food resources`);
    
    if (foodResources.length > 0) {
      // Find closest food resource
      let closest = foodResources[0];
      let minDist = Infinity;
      foodResources.forEach(r => {
        if (r) {
          const dist = Math.sqrt(
            Math.pow(r.x - worker.x, 2) + 
            Math.pow(r.y - worker.y, 2) + 
            Math.pow(r.z - worker.z, 2)
          );
          if (dist < minDist) {
            minDist = dist;
            closest = r;
          }
        }
      });
      
      if (closest) {
        console.log(`🐜 Worker ${workerId} at z=${worker.z} assigned to gather from food at (${closest.x}, ${closest.y}, ${closest.z})`);
        console.log(`Worker is underground: ${worker.z < -5}, Target is surface: ${closest.z >= 0}`);
        // Use commandAnts which handles burrow navigation
        this.commandAnts([workerId], closest.x, closest.y, closest.z, 'gather');
      }
    } else {
      console.log(`🔍 No discovered food resources. Worker will idle until scout discovers some.`);
    }
  }

  private digAtLocation(antIds: number[], targetX: number, targetY: number, targetZ: number) {
    // Command workers to dig at location
    antIds.forEach(antId => {
      const ant = this.data.Ant.find(a => a.id === antId);
      if (!ant || ant.ant_type !== AntType.Worker) return;
      
      const colony = this.data.Colony.find(c => c.id === ant.colony_id);
      if (!colony || colony.player_id !== this.identity) return;
      
      // Set ant to digging task
      ant.task = TaskType.Digging;
      ant.target_x = targetX;
      ant.target_y = targetY;
      ant.target_z = targetZ;
      
      // Create underground resources after a delay (simulating digging)
      setTimeout(() => {
        // Check if ant is still digging
        const stillDigging = this.data.Ant.find(a => a.id === antId && a.task === TaskType.Digging);
        if (stillDigging) {
          // Chance to find water or minerals underground
          const chance = Math.random();
          if (chance < 0.3) {
            // Found water!
            const waterNode: ResourceNode = {
              id: this.nextId.resource++,
              resource_type: ResourceType.Water,
              x: targetX + (Math.random() - 0.5) * 20,
              y: targetY + (Math.random() - 0.5) * 20,
              z: targetZ,
              amount: 50 + Math.random() * 50,
              max_amount: 100,
              regeneration_rate: 0.1
            };
            this.data.ResourceNode.push(waterNode);
            this.emit('ResourceNode', this.data.ResourceNode);
            
            // Auto-discover for the colony
            this.data.DiscoveredResource.push({
              colony_id: colony.id,
              resource_id: waterNode.id
            });
            this.emit('DiscoveredResource', this.data.DiscoveredResource);
          } else if (chance < 0.6) {
            // Found minerals!
            const mineralNode: ResourceNode = {
              id: this.nextId.resource++,
              resource_type: ResourceType.Minerals,
              x: targetX + (Math.random() - 0.5) * 20,
              y: targetY + (Math.random() - 0.5) * 20,
              z: targetZ,
              amount: 30 + Math.random() * 40,
              max_amount: 70,
              regeneration_rate: 0
            };
            this.data.ResourceNode.push(mineralNode);
            this.emit('ResourceNode', this.data.ResourceNode);
            
            // Auto-discover for the colony
            this.data.DiscoveredResource.push({
              colony_id: colony.id,
              resource_id: mineralNode.id
            });
            this.emit('DiscoveredResource', this.data.DiscoveredResource);
            
            // Also give immediate minerals to the colony
            colony.minerals += 5;
            this.emit('Colony', this.data.Colony);
          }
          
          // Ant finishes digging
          stillDigging.task = TaskType.Idle;
          this.emit('Ant', this.data.Ant);
        }
      }, 3000); // 3 seconds to dig
    });
    
    this.emit('Ant', this.data.Ant);
  }
  
  private respawnAsQueen(x: number, y: number) {
    this.respawnAsQueenWithTrait(x, y, undefined);
  }
  
  private respawnAsQueenWithTrait(x: number, y: number, trait?: AntTrait) {
    const player = this.data.Player.find(p => p.id === this.identity);
    if (!player) {
      // Create player if doesn't exist
      const newPlayer = {
        id: this.identity,
        username: 'Queen',
        created_at: Date.now(),
        total_colonies: 0,
        resources_gathered: 0
      };
      this.data.Player.push(newPlayer);
    }
    
    // Clear ALL world data (not just player's) to regenerate map
    console.log('Regenerating entire world...');
    
    // Clear all entities
    this.data.ResourceNode = [];
    this.data.Obstacle = [];
    this.data.Prey = [];
    this.data.Predator = [];
    
    // Regenerate world with new layout
    this.generateNewWorld();
    
    // Find all colonies belonging to this player
    const playerColonyIds = this.data.Colony
      .filter(c => c.player_id === this.identity)
      .map(c => c.id);
    
    console.log('Respawning: Found player colonies:', playerColonyIds);
    console.log('Before filtering: Ants:', this.data.Ant.length, 'Colonies:', this.data.Colony.length);
    
    // Delete all entities belonging to player's colonies
    this.data.Ant = this.data.Ant.filter(a => !playerColonyIds.includes(a.colony_id));
    this.data.Chamber = this.data.Chamber.filter(ch => !playerColonyIds.includes(ch.colony_id));
    this.data.ExploredTerritory = this.data.ExploredTerritory.filter(et => !playerColonyIds.includes(et.colony_id));
    this.data.DiscoveredResource = this.data.DiscoveredResource.filter(dr => !playerColonyIds.includes(dr.colony_id));
    
    // Delete the colonies themselves
    this.data.Colony = this.data.Colony.filter(c => c.player_id !== this.identity);
    
    console.log('After filtering: Ants:', this.data.Ant.length, 'Colonies:', this.data.Colony.length);
    
    // Save the filtered state to localStorage immediately
    this.saveState();
    
    // Force a complete refresh by emitting empty arrays first
    this.emit('Ant', []);
    this.emit('Chamber', []);
    this.emit('Colony', []);
    this.emit('ExploredTerritory', []);
    this.emit('DiscoveredResource', []);
    
    // Then emit the actual filtered data
    setTimeout(() => {
      this.emit('Ant', this.data.Ant);
      this.emit('Chamber', this.data.Chamber);
      this.emit('Colony', this.data.Colony);
      this.emit('ExploredTerritory', this.data.ExploredTerritory);
      this.emit('DiscoveredResource', this.data.DiscoveredResource);
    }, 50);
    
    // Create new minimal colony with generation bonuses
    const currentPlayer = this.data.Player.find(p => p.id === this.identity);
    const generations = currentPlayer?.generations_survived || 0;
    
    // Bonus resources based on generations survived
    const bonusJelly = Math.min(generations * 5, 50); // +5 jelly per generation, max 50
    const bonusWater = Math.min(generations * 2, 20); // +2 water per generation, max 20
    
    // Apply trait bonuses
    let baseJelly = 20;
    let baseFood = 0;
    let baseWater = 5;
    let baseHealth = 200;
    let baseLarvae = 0;
    
    if (trait) {
      switch (trait) {
        case AntTrait.Fertile:
          baseLarvae = 1; // Start with 1 extra larva
          break;
        case AntTrait.Matriarch:
          baseLarvae = 2; // Start with 2 extra larvae
          break;
        case AntTrait.Survivor:
          baseJelly += 10; // +50% starting jelly
          break;
        default:
          // Other traits don't affect starting resources
          break;
      }
      
      console.log(`Young queen with ${trait} trait starting new colony!`);
    }
    
    const colonyId = this.nextId.colony++;
    const colony = {
      id: colonyId,
      player_id: this.identity,
      queen_id: null,
      food: baseFood,
      water: baseWater + bonusWater,
      minerals: 0,
      larvae: baseLarvae,
      queen_jelly: baseJelly + bonusJelly,
      population: 2,
      territory_radius: 30,
      created_at: Date.now(),
      ai_enabled: false,
      queen_trait: trait
    };
    
    console.log(`Starting generation ${generations + 1} with ${colony.queen_jelly} jelly and ${colony.water} water`);
    
    this.data.Colony.push(colony);
    
    // Create queen - starts on surface and will dig initial burrow
    const queenId = this.nextId.ant++;
    const queen = {
      id: queenId,
      colony_id: colonyId,
      ant_type: AntType.Queen,
      x,
      y,
      z: 0, // Start on surface
      health: baseHealth,
      max_health: baseHealth,
      carrying_resource: null,
      carrying_amount: 0,
      task: TaskType.Building, // Queen starts digging
      target_x: x,
      target_y: y,
      target_z: -5,
      speed: 1,
      attack_damage: 0,
      jelly_consumption_rate: 0,
      last_fed_at: Date.now(),
      trait_type: trait,
      dig_start_time: Date.now() // Track when digging started
    };
    
    this.data.Ant.push(queen);
    colony.queen_id = queenId;
    
    // Track the queen's digging start time
    this.queenDigTracking.set(queenId, {
      startTime: Date.now(),
      x: x,
      y: y,
      colonyId: colonyId
    });
    
    console.log(`Queen ${queenId} started digging at (${x}, ${y}). Task: ${queen.task}`);
    
    // Don't create burrow yet - queen will dig it
    // We'll create it in the tick when digging completes
    
    // Don't create worker yet - queen will lay first larva after digging
    // Update population to just queen
    colony.population = 1;
    
    // Update player stats
    const updatedPlayer = this.data.Player.find(p => p.id === this.identity);
    if (updatedPlayer) {
      updatedPlayer.total_colonies = (updatedPlayer.total_colonies || 0) + 1;
    }
    
    // Emit all updates
    this.emit('Player', this.data.Player);
    this.emit('Colony', this.data.Colony);
    this.emit('Ant', this.data.Ant);
    this.emit('Chamber', this.data.Chamber);
  }
  
  private updateGame() {
    let antsChanged = false;
    let coloniesChanged = false;
    let resourcesChanged = false;
    
    // First, clean up orphaned ants (ants without valid colonies)
    const validColonyIds = this.data.Colony.map(c => c.id);
    const orphanedAnts = this.data.Ant.filter(a => !validColonyIds.includes(a.colony_id));
    if (orphanedAnts.length > 0) {
      console.log(`Removing ${orphanedAnts.length} orphaned ants`);
      this.data.Ant = this.data.Ant.filter(a => validColonyIds.includes(a.colony_id));
      antsChanged = true;
    }
    
    // Update ant energy levels and check for starvation
    const now = Date.now();
    this.data.Ant.forEach(ant => {
      const timeSinceFeeding = now - ant.last_fed_at;
      const minutesSinceFeeding = timeSinceFeeding / 60000; // Convert to minutes
      
      // Calculate energy based on time since feeding and location
      // Surface ants lose energy faster (exposed to elements)
      const energyDrainMultiplier = ant.z >= 0 ? 1.5 : 1.0; // 50% faster drain on surface
      const effectiveMinutes = minutesSinceFeeding * energyDrainMultiplier;
      
      // Calculate energy percentage (100% at 0 minutes, 0% at 20 minutes)
      const maxMinutesBeforeStarvation = 20;
      const energyPercent = Math.max(0, 100 - (effectiveMinutes / maxMinutesBeforeStarvation * 100));
      
      // Store energy level on ant for rendering
      (ant as any).energy = energyPercent;
      
      // Check if ant needs to return to base (25% energy)
      if (energyPercent <= 25 && energyPercent > 0 && ant.z >= 0) {
        // Only force return if not already returning or in combat
        if (ant.task !== TaskType.Returning && ant.task !== TaskType.Fighting && ant.task !== TaskType.Entering) {
          const burrowEntrance = this.data.Chamber.find(ch => 
            ch.colony_id === ant.colony_id && 
            ch.z === -1 && 
            ch.is_entrance
          );
          
          if (burrowEntrance) {
            // Store current task to resume after feeding
            (ant as any).task_before_hunger = ant.task;
            (ant as any).returning_for_food = true;
            
            console.log(`🍽️ Ant ${ant.id} (${ant.ant_type}) is hungry! Returning to base (${energyPercent.toFixed(0)}% energy)`);
            ant.task = TaskType.Entering;
            ant.target_x = burrowEntrance.x;
            ant.target_y = burrowEntrance.y;
            ant.target_z = burrowEntrance.z;
            antsChanged = true;
          }
        }
      }
      
      // Check for starvation (0% energy)
      if (energyPercent <= 0) {
        console.log(`💀 Ant ${ant.id} (${ant.ant_type}) starved to death!`);
        
        // Remove starved ant
        this.data.Ant = this.data.Ant.filter(a => a.id !== ant.id);
        antsChanged = true;
        
        // Update colony population
        const colony = this.data.Colony.find(c => c.id === ant.colony_id);
        if (colony) {
          colony.population--;
          coloniesChanged = true;
          
          // Check if this was the queen
          if (ant.ant_type === AntType.Queen) {
            console.log(`👑💀 GAME OVER! Queen of colony ${colony.id} has died!`);
            (colony as any).game_over = true;
            
            // TODO: Trigger game over for this colony
          }
        }
      }
    });
    
    // Check for queens completing digging
    this.queenDigTracking.forEach((digInfo, queenId) => {
      const queen = this.data.Ant.find(a => a.id === queenId);
      if (!queen) {
        this.queenDigTracking.delete(queenId);
        return;
      }
      
      const digDuration = 5000; // 5 seconds to dig initial burrow
      if (now - digInfo.startTime >= digDuration) {
        // Queen has finished digging!
        console.group(`⛏️ Queen Digging Complete`);
        console.log(`Queen ID: ${queenId}`);
        console.log(`Location: (${digInfo.x}, ${digInfo.y})`);
        console.log(`Burrow created at depth: -10 with entrance tunnel`);
        console.groupEnd();
        
        // Create the surface entrance (marks the hole)
        const entranceId = this.nextId.chamber++;
        const entrance = {
          id: entranceId,
          colony_id: digInfo.colonyId,
          chamber_type: ChamberType.Burrow,
          x: digInfo.x,
          y: digInfo.y,
          z: -1, // Just below surface to mark entrance
          level: 1,
          capacity: 0, // Entrance doesn't provide capacity
          is_entrance: true
        };
        
        // Create the actual burrow chamber deeper underground
        const burrowId = this.nextId.chamber++;
        const burrow = {
          id: burrowId,
          colony_id: digInfo.colonyId,
          chamber_type: ChamberType.Burrow,
          x: digInfo.x,
          y: digInfo.y,
          z: -10, // Deeper underground
          level: 1,
          capacity: 10, // Provides 10 population points
          larvae_count: 0,
          larvae_capacity: 5 // Queen can only have 5 larvae at a time
        };
        
        this.data.Chamber.push(entrance);
        this.data.Chamber.push(burrow);
        
        // Create a tunnel connecting entrance to burrow
        const tunnelId = this.nextId.tunnel++;
        const tunnel = {
          id: tunnelId,
          colony_id: digInfo.colonyId,
          start_x: digInfo.x,
          start_y: digInfo.y,
          start_z: -1,
          end_x: digInfo.x,
          end_y: digInfo.y,
          end_z: -10
        };
        this.data.Tunnel.push(tunnel);
        this.emit('Tunnel', this.data.Tunnel);
        
        // Move queen to the deep burrow chamber
        queen.z = -10;
        queen.task = TaskType.Idle;
        queen.target_x = null;
        queen.target_y = null;
        queen.target_z = null;
        
        // Queen lays first larva and it automatically becomes a worker
        const colony = this.data.Colony.find(c => c.id === digInfo.colonyId);
        if (colony && colony.queen_jelly >= 2.5) { // Need jelly for larva + worker transformation
          // Create first larva entity
          const larvaId = this.nextId.larva++;
          const larva = {
            id: larvaId,
            colony_id: digInfo.colonyId,
            x: digInfo.x + (Math.random() - 0.5) * 20,
            y: digInfo.y + (Math.random() - 0.5) * 20,
            z: -10, // At chamber depth
            age: 0,
            created_at: Date.now()
          };
          
          this.data.Larva.push(larva);
          this.emit('Larva', this.data.Larva);
          
          colony.larvae += 1;
          colony.queen_jelly -= 0.5;
          coloniesChanged = true;
          console.log(`Queen laid first larva. Automatically transforming to worker...`);
          
          // Automatically transform to worker after 2 seconds
          setTimeout(() => {
            if (colony.queen_jelly >= 2) {
              // Remove larva
              this.data.Larva = this.data.Larva.filter(l => l.id !== larvaId);
              colony.larvae -= 1;
              colony.queen_jelly -= 2;
              
              // Update chamber larvae count
              if (burrow && burrow.larvae_count !== undefined && burrow.larvae_count > 0) {
                burrow.larvae_count -= 1;
                this.emit('Chamber', this.data.Chamber);
              }
              
              // Create worker
              const workerId = this.nextId.ant++;
              const worker = {
                id: workerId,
                colony_id: digInfo.colonyId,
                ant_type: AntType.Worker,
                x: larva.x,
                y: larva.y,
                z: larva.z,
                health: 50,
                max_health: 50,
                speed: 2.0,
                task: TaskType.Idle,
                target_x: null,
                target_y: null,
                target_z: null,
                carrying_resource: null,
                carrying_amount: 0
              };
              
              this.data.Ant.push(worker);
              colony.population += 1;
              
              console.log(`First worker created! Starting automatic resource gathering.`);
              
              // Set worker to gather automatically
              setTimeout(() => {
                this.setWorkerToGather(workerId);
              }, 1000);
              
              this.emit('Ant', this.data.Ant);
              this.emit('Colony', this.data.Colony);
              this.emit('Larva', this.data.Larva);
            }
          }, 2000);
        }
        
        // Clean up tracking
        this.queenDigTracking.delete(queenId);
        antsChanged = true;
        
        // Auto-discover nearby surface resources for initial colony
        const nearbyResources = this.data.ResourceNode.filter(r => {
          const dist = Math.sqrt(
            Math.pow(r.x - digInfo.x, 2) + 
            Math.pow(r.y - digInfo.y, 2)
          );
          return dist < 150 && r.z === 0; // Surface resources within 150 units
        });
        
        nearbyResources.slice(0, 3).forEach(resource => { // Discover up to 3 nearby resources
          const alreadyDiscovered = this.data.DiscoveredResource.some(dr => 
            dr.colony_id === digInfo.colonyId && dr.resource_id === resource.id
          );
          
          if (!alreadyDiscovered) {
            this.data.DiscoveredResource.push({
              id: this.nextId.discovered++,
              colony_id: digInfo.colonyId,
              resource_id: resource.id,
              discovered_at: Date.now()
            });
            console.log(`🔍 Auto-discovered ${resource.resource_type} resource at (${resource.x}, ${resource.y}) for new colony`);
          }
        });
        
        this.emit('DiscoveredResource', this.data.DiscoveredResource);
      }
    });
    
    // Check for queens completing egg laying
    const layingQueens = this.data.Ant.filter(a => 
      a.ant_type === AntType.Queen && (a as any).laying_start_time
    );
    
    layingQueens.forEach(queen => {
      const layDuration = 3000; // 3 seconds to lay an egg
      if (now - (queen as any).laying_start_time >= layDuration) {
        // Queen has finished laying!
        const colony = this.data.Colony.find(c => c.id === queen.colony_id);
        if (colony) {
          // Create larva entity at a random position in the chamber
          const larvaId = this.nextId.larva++;
          const offsetX = (Math.random() - 0.5) * 20;
          const offsetY = (Math.random() - 0.5) * 20;
          
          const larva = {
            id: larvaId,
            colony_id: queen.colony_id,
            x: queen.x + offsetX,
            y: queen.y + offsetY,
            z: queen.z,
            age: 0,
            created_at: Date.now()
          };
          
          this.data.Larva.push(larva);
          colony.larvae += 1;
          
          // Update chamber count
          const chamber = this.data.Chamber.find(ch => 
            ch.colony_id === colony.id && 
            Math.abs(ch.x - queen.x) < 30 && 
            Math.abs(ch.y - queen.y) < 30 && 
            ch.z === queen.z
          );
          
          if (chamber && chamber.larvae_count !== undefined) {
            chamber.larvae_count += 1;
            this.emit('Chamber', this.data.Chamber);
          }
          
          console.log(`Queen laid an egg! Colony now has ${colony.larvae} larvae`);
          coloniesChanged = true;
        }
        
        // Reset queen state
        delete (queen as any).laying_start_time;
        queen.task = TaskType.Idle;
        antsChanged = true;
        
        this.emit('Larva', this.data.Larva);
      }
    });
    
    // Check for mature young queens
    const youngQueens = this.data.Ant.filter(a => a.ant_type === AntType.YoungQueen);
    youngQueens.forEach(queen => {
      if (queen.maturation_time && now >= queen.maturation_time) {
        // Time to fly!
        console.log(`Young queen ${queen.id} has matured and is flying away!`);
        this.nuptialFlight(queen.id);
      }
    });
    
    // Update ant movements
    this.data.Ant.forEach(ant => {
      // Check if ant is waiting at entrance and should retry exiting
      if ((ant as any).waiting_at_entrance && ant.task === TaskType.Idle) {
        // Periodically check if coast is clear
        if (Math.random() < 0.1) { // Check 10% of the time
          const burrowEntrance = this.data.Chamber.find(ch => 
            ch.colony_id === ant.colony_id && 
            ch.z === -1 && 
            ch.is_entrance &&
            Math.abs(ch.x - ant.x) < 5 &&
            Math.abs(ch.y - ant.y) < 5
          );
          
          if (burrowEntrance) {
            const sightDistance = 80;
            const nearbyPredators = this.data.Predator.filter(pred => {
              const dist = Math.sqrt(
                Math.pow(pred.x - burrowEntrance.x, 2) + 
                Math.pow(pred.y - burrowEntrance.y, 2)
              );
              return dist < sightDistance;
            });
            
            if (nearbyPredators.length === 0 && (ant as any).final_target_x !== undefined) {
              console.log(`✅ Coast is now clear for ant ${ant.id} to exit!`);
              ant.task = TaskType.Exiting;
              antsChanged = true;
            }
          }
        }
      }
      
      // Check if wounded ant should retreat
      if ((ant as any).wounded && ant.health < ant.max_health * 0.3 && ant.z === 0) {
        // Find nearest burrow entrance to retreat to
        const burrowEntrance = this.data.Chamber.find(ch => 
          ch.colony_id === ant.colony_id && 
          ch.z === -1 && 
          ch.is_entrance
        );
        
        if (burrowEntrance && ant.task !== TaskType.Entering) {
          console.log(`🏃 Wounded ant ${ant.id} retreating to burrow!`);
          ant.task = TaskType.Entering;
          ant.target_x = burrowEntrance.x;
          ant.target_y = burrowEntrance.y;
          ant.target_z = burrowEntrance.z;
        }
      }
      
      // Heal wounded ants slowly when underground
      if ((ant as any).wounded && ant.z < 0 && Math.random() < 0.05) {
        ant.health = Math.min(ant.max_health, ant.health + 5);
        if (ant.health === ant.max_health) {
          delete (ant as any).wounded;
          delete (ant as any).wounded_at;
          // Restore normal speed
          ant.speed = this.getAntStats(ant.ant_type).speed;
          console.log(`💚 Ant ${ant.id} fully healed!`);
        }
        antsChanged = true;
      }
      
      if (ant.target_x !== null && ant.target_y !== null && ant.target_z !== null) {
        const dx = ant.target_x - ant.x;
        const dy = ant.target_y - ant.y;
        const dz = ant.target_z - ant.z;
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
        
        if (distance > 1) {
          // Move towards target
          const moveDistance = ant.speed * 0.2; // Doubled speed per frame
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
          
          // Handle entering burrow
          if (ant.task === TaskType.Entering) {
            // Teleport to underground entrance
            ant.z = -10; // Move to underground level
            console.log(`🚪 Ant ${ant.id} entered burrow underground`);
            
            // Now go underground to final destination
            const finalX = (ant as any).final_target_x;
            const finalY = (ant as any).final_target_y;
            const finalZ = (ant as any).final_target_z;
            const finalTask = (ant as any).final_task;
            
            if (finalX !== undefined && finalY !== undefined && finalZ !== undefined) {
              ant.target_x = finalX;
              ant.target_y = finalY;
              ant.target_z = finalZ;
              ant.task = finalTask || TaskType.Idle;
              
              // Clear temporary data
              delete (ant as any).final_target_x;
              delete (ant as any).final_target_y;
              delete (ant as any).final_target_z;
              delete (ant as any).final_task;
            } else {
              ant.task = TaskType.Idle;
              
              // Check if ant was returning for food
              if ((ant as any).returning_for_food) {
                console.log(`🍽️ Ant ${ant.id} is back in burrow to feed`);
                delete (ant as any).returning_for_food;
              }
            }
            antsChanged = true;
          }
          // Handle exiting burrow
          else if (ant.task === TaskType.Exiting) {
            // Check if we're at the burrow entrance (should be at z=-1)
            const burrowEntrance = this.data.Chamber.find(ch => 
              ch.colony_id === ant.colony_id && 
              ch.chamber_type === ChamberType.Burrow &&
              ch.is_entrance === true
            );
            
            if (burrowEntrance) {
              // First move to entrance if not there yet
              if (Math.abs(ant.z - burrowEntrance.z) > 0.5) {
                console.log(`🚶 Ant ${ant.id} moving to burrow entrance at z=${burrowEntrance.z}`);
                ant.target_x = burrowEntrance.x;
                ant.target_y = burrowEntrance.y;
                ant.target_z = burrowEntrance.z;
              } else {
                // Now at entrance, check for predators before exiting
                const sightDistance = 80; // Ants can see this far from burrow entrance
                const nearbyPredators = this.data.Predator.filter(pred => {
                  const dist = Math.sqrt(
                    Math.pow(pred.x - burrowEntrance.x, 2) + 
                    Math.pow(pred.y - burrowEntrance.y, 2)
                  );
                  return dist < sightDistance;
                });
                
                if (nearbyPredators.length > 0) {
                  // Danger! Don't exit, wait at entrance
                  console.log(`⚠️ Ant ${ant.id} sees ${nearbyPredators.length} predator(s) near entrance! Waiting...`);
                  ant.task = TaskType.Idle;
                  ant.target_x = null;
                  ant.target_y = null;
                  ant.target_z = null;
                  
                  // Keep the final destination stored for later
                  (ant as any).waiting_at_entrance = true;
                  (ant as any).wait_counter = (ant as any).wait_counter || 0;
                  (ant as any).wait_counter += 1;
                  
                  // After waiting too long, might risk it or give up
                  if ((ant as any).wait_counter > 100) {
                    console.log(`😤 Ant ${ant.id} has waited too long, giving up on exit.`);
                    delete (ant as any).final_target_x;
                    delete (ant as any).final_target_y;
                    delete (ant as any).final_target_z;
                    delete (ant as any).final_task;
                    delete (ant as any).waiting_at_entrance;
                    delete (ant as any).wait_counter;
                  }
                } else {
                  // Coast is clear, exit to surface
                  ant.z = 0; // Move to surface
                  console.log(`🚪 Ant ${ant.id} exited burrow to surface (coast clear)`);
                  
                  // Clean up waiting status
                  delete (ant as any).waiting_at_entrance;
                  delete (ant as any).wait_counter;
                  
                  // Now go to surface final destination
                  const finalX = (ant as any).final_target_x;
                  const finalY = (ant as any).final_target_y;
                  const finalZ = (ant as any).final_target_z;
                  const finalTask = (ant as any).final_task;
                  
                  if (finalX !== undefined && finalY !== undefined && finalZ !== undefined) {
                    ant.target_x = finalX;
                    ant.target_y = finalY;
                    ant.target_z = finalZ;
                    ant.task = finalTask || TaskType.Idle;
                    
                    // Clear temporary data
                    delete (ant as any).final_target_x;
                    delete (ant as any).final_target_y;
                    delete (ant as any).final_target_z;
                    delete (ant as any).final_task;
                  } else {
                    ant.task = TaskType.Idle;
                  }
                }
              }
            } else {
              console.log(`⚠️ No burrow entrance found for ant ${ant.id} to exit!`);
              ant.task = TaskType.Idle;
            }
            antsChanged = true;
          }
          // Handle digging
          else if (ant.task === TaskType.Digging && ant.ant_type === AntType.Worker) {
            const colony = this.data.Colony.find(c => c.id === ant.colony_id);
            if (colony && ant.z < -5) { // Must be underground to dig
              // Generate resources from digging
              const waterFound = Math.random() * 2; // 0-2 water per dig
              const mineralsFound = Math.random() * 3; // 0-3 minerals per dig
              
              colony.water += waterFound;
              colony.minerals += mineralsFound;
              coloniesChanged = true;
              
              console.log(`Worker ${ant.id} found ${waterFound.toFixed(1)} water and ${mineralsFound.toFixed(1)} minerals while digging`);
              
              // Set ant to return with materials
              ant.carrying_resource = Math.random() > 0.5 ? ResourceType.Water : ResourceType.Minerals;
              ant.carrying_amount = Math.random() > 0.5 ? waterFound : mineralsFound;
              ant.task = TaskType.Returning;
              
              // Set target to colony throne room or burrow
              const chambers = this.data.Chamber.filter(ch => ch.colony_id === colony.id);
              const throne = chambers.find(ch => ch.chamber_type === ChamberType.ThroneRoom);
              const burrow = chambers.find(ch => ch.chamber_type === ChamberType.Burrow);
              const target = throne || burrow;
              
              if (target) {
                ant.target_x = target.x;
                ant.target_y = target.y;
                ant.target_z = target.z;
              }
            } else if (ant.z >= -5) {
              // Not underground, need to go down first
              ant.target_z = -15;
              ant.target_x = ant.x;
              ant.target_y = ant.y;
            }
          }
          // Check if near prey (for soldiers)
          else if ((ant.ant_type === AntType.Soldier || ant.ant_type === AntType.Major) && ant.z === 0) {
            const nearbyPrey = this.data.Prey.find(p => {
              const dist = Math.sqrt(
                Math.pow(p.x - ant.x, 2) +
                Math.pow(p.y - ant.y, 2)
              );
              return dist < 10;
            });
            
            if (nearbyPrey) {
              ant.task = TaskType.Fighting;
              
              // Check if this is a group hunt target
              const isGroupHunt = (nearbyPrey as any).group_hunt_target;
              const otherHunters = this.data.Ant.filter(a => 
                a.id !== ant.id && 
                (a as any).hunt_target_id === nearbyPrey.id &&
                Math.sqrt(Math.pow(a.x - nearbyPrey.x, 2) + Math.pow(a.y - nearbyPrey.y, 2)) < 15
              );
              
              // Calculate damage based on group size
              let damage = ant.attack_damage;
              if (isGroupHunt && otherHunters.length > 0) {
                // Group bonus: +20% damage per additional ant
                damage = Math.floor(damage * (1 + 0.2 * otherHunters.length));
                
                // Check if prey is pinned (surrounded)
                const isPinned = otherHunters.length >= ((nearbyPrey as any).required_hunters || 2) - 1;
                if (isPinned) {
                  damage *= 1.5; // 50% damage bonus when pinned
                  (nearbyPrey as any).pinned = true;
                  console.log(`🎯 Prey is pinned by ${otherHunters.length + 1} ants!`);
                }
              }
              
              // Apply damage
              nearbyPrey.health -= damage;
              
              // Chance of ant getting wounded in combat
              if (Math.random() < 0.1) { // 10% chance per attack
                const woundDamage = Math.floor(nearbyPrey.attack_damage * 0.5);
                ant.health = Math.max(1, ant.health - woundDamage);
                (ant as any).wounded = true;
                (ant as any).wounded_at = Date.now();
                console.log(`⚠️ Ant ${ant.id} was wounded! Health: ${ant.health}/${ant.max_health}`);
                
                // Wounded ants move slower
                ant.speed = ant.speed * 0.5;
              }
              
              if (nearbyPrey.health <= 0) {
                // Convert to food resource
                const foodValue = nearbyPrey.food_value * (isGroupHunt ? 1.5 : 1); // Bonus food for group hunts
                const foodId = this.nextId.ant++;
                this.data.ResourceNode.push({
                  id: foodId,
                  resource_type: ResourceType.Food,
                  x: nearbyPrey.x,
                  y: nearbyPrey.y,
                  z: 0,
                  amount: Math.floor(foodValue),
                  max_amount: Math.floor(foodValue),
                  regeneration_rate: 0
                });
                
                // Remove prey
                this.data.Prey = this.data.Prey.filter(p => p.id !== nearbyPrey.id);
                preyChanged = true;
                resourcesChanged = true;
                
                const hunters = otherHunters.length + 1;
                console.log(`🏆 ${hunters} ant(s) killed ${nearbyPrey.prey_type}! Food value: ${foodValue}`);
                
                // Clear hunt target from all ants
                this.data.Ant.forEach(a => {
                  if ((a as any).hunt_target_id === nearbyPrey.id) {
                    delete (a as any).hunt_target_id;
                    a.task = TaskType.Idle;
                  }
                });
              }
              antsChanged = true;
            }
          }
          // Check if near resource
          else if (ant.ant_type === AntType.Worker && !ant.carrying_resource) {
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
              
              // Set target to storage chamber, or burrow if no storage exists
              const colony = this.data.Colony.find(c => c.id === ant.colony_id);
              if (colony) {
                const chambers = this.data.Chamber.filter(ch => ch.colony_id === colony.id);
                const storage = chambers.find(ch => ch.chamber_type === ChamberType.Storage);
                const burrow = chambers.find(ch => ch.chamber_type === ChamberType.Burrow);
                const target = storage || burrow;
                
                if (target) {
                  // If on surface and target is underground, need to enter burrow first
                  if (ant.z >= -5 && target.z < -5) {
                    const surfaceBurrow = chambers.find(ch => ch.chamber_type === ChamberType.Burrow);
                    if (surfaceBurrow) {
                      ant.target_x = surfaceBurrow.x;
                      ant.target_y = surfaceBurrow.y;
                      ant.target_z = 0;
                      ant.task = TaskType.Entering;
                      
                      (ant as any).final_target_x = target.x;
                      (ant as any).final_target_y = target.y;
                      (ant as any).final_target_z = target.z;
                      (ant as any).final_task = TaskType.Depositing;
                    }
                  } else {
                    ant.target_x = target.x;
                    ant.target_y = target.y;
                    ant.target_z = target.z;
                    ant.task = TaskType.Depositing;
                  }
                }
              }
              
              resourcesChanged = true;
              antsChanged = true;
            }
          } else if (ant.carrying_resource && (ant.task === TaskType.Returning || ant.task === TaskType.Depositing)) {
            // Check if at storage location
            const colony = this.data.Colony.find(c => c.id === ant.colony_id);
            if (colony) {
              const chambers = this.data.Chamber.filter(ch => ch.colony_id === colony.id);
              const storage = chambers.find(ch => ch.chamber_type === ChamberType.Storage);
              const burrow = chambers.find(ch => ch.chamber_type === ChamberType.Burrow);
              const depositLocation = storage || burrow;
              
              if (depositLocation) {
                const dist = Math.sqrt(
                  Math.pow(depositLocation.x - ant.x, 2) +
                  Math.pow(depositLocation.y - ant.y, 2) +
                  Math.pow(depositLocation.z - ant.z, 2)
                );
                
                if (dist < 10) {
                  // Deposit resources
                  if (ant.carrying_resource === ResourceType.Food) {
                    colony.food += ant.carrying_amount;
                  } else if (ant.carrying_resource === ResourceType.Water) {
                    colony.water += ant.carrying_amount;
                  } else if (ant.carrying_resource === ResourceType.Minerals) {
                    colony.minerals += ant.carrying_amount;
                  }
                  
                  console.log(`Worker ${ant.id} deposited ${ant.carrying_amount} ${ant.carrying_resource} at ${depositLocation.chamber_type}`);
                  
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
      
      // Scout discovery
      if (ant.ant_type === AntType.Scout) {
        const colony = this.data.Colony.find(c => c.id === ant.colony_id);
        if (colony) {
          // Find nearby resources within scout vision (50 units)
          const scoutVision = 50;
          this.data.ResourceNode.forEach(resource => {
            const dist = Math.sqrt(
              Math.pow(resource.x - ant.x, 2) +
              Math.pow(resource.y - ant.y, 2) +
              Math.pow(resource.z - ant.z, 2)
            );
            
            if (dist <= scoutVision) {
              // Check if already discovered
              const alreadyDiscovered = this.data.DiscoveredResource.some(dr => 
                dr.colony_id === colony.id && dr.resource_id === resource.id
              );
              
              if (!alreadyDiscovered) {
                const discoveredId = this.nextId.discovered++;
                const discovered = {
                  id: discoveredId,
                  colony_id: colony.id,
                  resource_id: resource.id,
                  discovered_at: Date.now()
                };
                this.data.DiscoveredResource.push(discovered);
                console.log(`Colony ${colony.id} discovered resource ${resource.id} at (${resource.x}, ${resource.y})`);
                this.emit('DiscoveredResource', this.data.DiscoveredResource);
              }
            }
          });
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
    
    // Process feeding for idle ants underground
    this.data.Ant.forEach(ant => {
      // Check if ant is idle underground and needs feeding
      if (ant.task === TaskType.Idle && ant.z < -5) {
        const energy = (ant as any).energy || 100;
        
        // Feed ant if energy is below 90% and colony has jelly
        if (energy < 90) {
          const colony = this.data.Colony.find(c => c.id === ant.colony_id);
          if (colony && colony.queen_jelly > 0) {
            // Calculate jelly needed based on consumption rate
            const jellyNeeded = ant.jelly_consumption_rate * 0.1; // Feed in small increments
            
            if (colony.queen_jelly >= jellyNeeded) {
              // Consume jelly and reset feeding timer
              colony.queen_jelly -= jellyNeeded;
              ant.last_fed_at = Date.now();
              coloniesChanged = true;
              
              console.log(`🍯 Ant ${ant.id} (${ant.ant_type}) fed! Energy restored to 100%`);
              
              // Resume previous task if ant was returning for food
              if ((ant as any).task_before_hunger) {
                const previousTask = (ant as any).task_before_hunger;
                delete (ant as any).task_before_hunger;
                
                // Resume previous activity
                if (previousTask === TaskType.Gathering && ant.ant_type === AntType.Worker) {
                  console.log(`✅ Ant ${ant.id} resuming resource gathering after feeding`);
                  this.setWorkerToGather(ant.id);
                } else if (previousTask === TaskType.Exploring && ant.ant_type === AntType.Scout) {
                  console.log(`✅ Scout ${ant.id} resuming exploration after feeding`);
                  // Set random exploration target
                  const angle = Math.random() * Math.PI * 2;
                  const distance = 50 + Math.random() * 150;
                  ant.target_x = ant.x + Math.cos(angle) * distance;
                  ant.target_y = ant.y + Math.sin(angle) * distance;
                  ant.target_z = 0;
                  ant.task = TaskType.Exiting;
                }
                antsChanged = true;
              }
            } else {
              console.log(`⚠️ Not enough jelly to feed ant ${ant.id}! Colony jelly: ${colony.queen_jelly.toFixed(1)}`);
            }
          }
        }
      }
    });
    
    // Update colonies
    this.data.Colony.forEach(colony => {
      // Sync larvae count with actual larvae entities
      const actualLarvae = this.data.Larva.filter(l => l.colony_id === colony.id).length;
      if (colony.larvae !== actualLarvae) {
        console.log(`🔄 Syncing larvae count for colony ${colony.id}: ${colony.larvae} -> ${actualLarvae}`);
        colony.larvae = actualLarvae;
        coloniesChanged = true;
      }
      
      // Also sync chamber larvae counts
      const chambers = this.data.Chamber.filter(ch => ch.colony_id === colony.id);
      chambers.forEach(chamber => {
        if (chamber.larvae_count !== undefined) {
          const larvaeInChamber = this.data.Larva.filter(l => 
            l.colony_id === colony.id &&
            Math.abs(l.x - chamber.x) < 30 &&
            Math.abs(l.y - chamber.y) < 30 &&
            l.z === chamber.z
          ).length;
          
          if (chamber.larvae_count !== larvaeInChamber) {
            console.log(`🏠 Syncing chamber larvae: ${chamber.larvae_count} -> ${larvaeInChamber}`);
            chamber.larvae_count = larvaeInChamber;
            this.emit('Chamber', this.data.Chamber);
          }
        }
      });
      
      // Deplete queen jelly over time
      if (colony.queen_jelly > 0) {
        colony.queen_jelly = Math.max(0, colony.queen_jelly - 0.02);
        coloniesChanged = true;
      }
      
      // Enhanced Colony AI - Only run if enabled
      if (colony.ai_enabled === undefined) {
        colony.ai_enabled = true; // Default to true for new colonies
      }
      
      const colonyAnts = this.data.Ant.filter(a => a.colony_id === colony.id);
      const workers = colonyAnts.filter(a => a.ant_type === AntType.Worker);
      const scouts = colonyAnts.filter(a => a.ant_type === AntType.Scout);
      const soldiers = colonyAnts.filter(a => a.ant_type === AntType.Soldier);
      const royalWorkers = colonyAnts.filter(a => a.ant_type === AntType.RoyalWorker);
      const queen = colonyAnts.find(a => a.ant_type === AntType.Queen);
      
      // Skip AI logic if disabled
      if (!colony.ai_enabled) {
        return; // Skip this iteration in forEach
      }
      
      // Check for general retreat order
      if ((colony as any).general_retreat) {
        console.log(`📯 Colony ${colony.id} is in GENERAL RETREAT mode!`);
        
        // Clear retreat after some time
        if (Date.now() - ((colony as any).last_death_time || 0) > 30000) { // 30 seconds
          delete (colony as any).general_retreat;
          (colony as any).casualties = Math.max(0, ((colony as any).casualties || 0) - 1);
          console.log(`✅ Colony ${colony.id} ending general retreat.`);
        }
      }
      
      // Check for dangerous predators near colony
      const surfaceAnts = colonyAnts.filter(a => a.z >= 0);
      const dangerousPredators = this.data.Predator.filter(pred => {
        // Birds are too dangerous to fight
        if (pred.predator_type === 'bird' && pred.health > 50) {
          // Check if any surface ants are within bird's hunt radius
          return surfaceAnts.some(ant => {
            const dist = Math.sqrt(
              Math.pow(pred.x - ant.x, 2) + 
              Math.pow(pred.y - ant.y, 2)
            );
            return dist < pred.hunt_radius + 50; // Extra safety margin
          });
        }
        return false;
      });
      
      // If dangerous predators detected OR general retreat, retreat all surface ants
      if (dangerousPredators.length > 0 || (colony as any).general_retreat) {
        const reason = (colony as any).general_retreat ? "GENERAL RETREAT" : `${dangerousPredators.length} dangerous predator(s) detected`;
        console.log(`🚨 DANGER! ${reason}! All ants retreating to burrows!`);
        
        // Find burrow entrances
        const burrowEntrances = this.data.Chamber.filter(ch => 
          ch.colony_id === colony.id && 
          ch.chamber_type === ChamberType.Burrow &&
          ch.is_entrance === true
        );
        
        if (burrowEntrances.length > 0) {
          surfaceAnts.forEach(ant => {
            if (ant.task !== TaskType.Entering && ant.task !== TaskType.Building) {
              // Find nearest burrow entrance
              const nearestEntrance = burrowEntrances.sort((a, b) => {
                const distA = Math.sqrt(Math.pow(a.x - ant.x, 2) + Math.pow(a.y - ant.y, 2));
                const distB = Math.sqrt(Math.pow(b.x - ant.x, 2) + Math.pow(b.y - ant.y, 2));
                return distA - distB;
              })[0];
              
              // Store previous task to resume later
              (ant as any).task_before_retreat = ant.task;
              (ant as any).retreating_from_predator = true;
              
              // Command ant to retreat
              ant.task = TaskType.Entering;
              ant.target_x = nearestEntrance.x;
              ant.target_y = nearestEntrance.y;
              ant.target_z = nearestEntrance.z;
              
              console.log(`🏃 Ant ${ant.id} retreating to burrow!`);
            }
          });
          antsChanged = true;
        }
      } else {
        // No danger, resume normal activities for ants that were retreating
        colonyAnts.forEach(ant => {
          if ((ant as any).retreating_from_predator && ant.z < 0) {
            delete (ant as any).retreating_from_predator;
            const previousTask = (ant as any).task_before_retreat;
            delete (ant as any).task_before_retreat;
            
            if (previousTask && ant.task === TaskType.Idle) {
              console.log(`✅ Danger passed. Ant ${ant.id} resuming previous activities.`);
              // Resume previous task
              if (previousTask === TaskType.Gathering && ant.ant_type === AntType.Worker) {
                this.setWorkerToGather(ant.id);
              }
            }
          }
        });
      }
      
      // Target composition: 2 workers, 1 scout, 2 soldiers, then expand
      const targetWorkers = 2;
      const targetScouts = 1;
      const targetSoldiers = 2;
      
      // Phase 1: Build basic colony
      if (queen && colony.larvae > 0 && colony.queen_jelly >= 2) {
        let spawned = false;
        
        // First priority: Workers for resource gathering
        if (workers.length < targetWorkers) {
          this.feedLarva(colony.id, AntType.Worker, 
            queen.x + (Math.random() - 0.5) * 20,
            queen.y + (Math.random() - 0.5) * 20, 
            queen.z);
          console.log(`🐜 Colony building: Worker ${workers.length + 1}/${targetWorkers}`);
          spawned = true;
        }
        // Second priority: Scout for exploration
        else if (scouts.length < targetScouts && colony.queen_jelly >= 2.5) {
          this.feedLarva(colony.id, AntType.Scout, 
            queen.x + (Math.random() - 0.5) * 20,
            queen.y + (Math.random() - 0.5) * 20, 
            queen.z);
          console.log(`🔍 Colony building: Scout ${scouts.length + 1}/${targetScouts}`);
          spawned = true;
        }
        // Third priority: Soldiers for defense
        else if (soldiers.length < targetSoldiers && colony.queen_jelly >= 3) {
          this.feedLarva(colony.id, AntType.Soldier, 
            queen.x + (Math.random() - 0.5) * 20,
            queen.y + (Math.random() - 0.5) * 20, 
            queen.z);
          console.log(`⚔️ Colony building: Soldier ${soldiers.length + 1}/${targetSoldiers}`);
          spawned = true;
        }
        // After basic composition, add royal worker
        else if (workers.length >= targetWorkers && royalWorkers.length === 0 && colony.queen_jelly >= 5) {
          this.feedLarva(colony.id, AntType.RoyalWorker, queen.x, queen.y, queen.z);
          console.log(`👑 Colony building: Royal Worker for jelly production`);
          spawned = true;
        }
      }
      
      // Queen continues laying eggs
      if (queen && colony.queen_jelly >= 0.5 && Math.random() < 0.05) {
        // Find the queen's chamber
        const queenChamber = this.data.Chamber.find(ch => 
          ch.colony_id === colony.id && 
          Math.abs(ch.x - queen.x) < 30 && 
          Math.abs(ch.y - queen.y) < 30 && 
          ch.z === queen.z
        );
        
        if (queenChamber) {
          // Check chamber's larvae capacity
          const currentLarvaeCount = queenChamber.larvae_count || 0;
          const larvaeCapacity = queenChamber.larvae_capacity || 5;
          
          if (currentLarvaeCount < larvaeCapacity) {
            this.spawnLarva(queen.id);
          } else {
            console.log(`🏠 Queen's chamber is full: ${currentLarvaeCount}/${larvaeCapacity} larvae`);
          }
        }
      }
      
      // Royal workers produce jelly automatically
      royalWorkers.forEach(royal => {
        if (colony.food >= 5 && colony.minerals >= 2 && Math.random() < 0.1) {
          colony.food -= 5;
          colony.minerals -= 2;
          colony.queen_jelly += 5;
          coloniesChanged = true;
          console.log(`🍯 Royal worker produced queen jelly (total: ${colony.queen_jelly.toFixed(1)})`);
        }
      });
      
      // Worker AI - Automatic resource gathering
      workers.forEach(worker => {
        if (worker.task === TaskType.Idle && Math.random() < 0.3) {
          this.setWorkerToGather(worker.id);
        }
      });
      
      // Scout AI - Exploration and threat detection
      scouts.forEach(scout => {
        if (scout.task === TaskType.Idle && Math.random() < 0.2) {
          // Explore in expanding circles around colony
          const angle = Math.random() * Math.PI * 2;
          const distance = 50 + Math.random() * 150;
          const targetX = queen ? queen.x + Math.cos(angle) * distance : scout.x + Math.cos(angle) * distance;
          const targetY = queen ? queen.y + Math.sin(angle) * distance : scout.y + Math.sin(angle) * distance;
          
          this.commandAnts([scout.id], targetX, targetY, 0, 'scout');
        }
        
        // Threat detection when on surface
        if (scout.z === 0) {
          // Detect predators
          const threats = this.data.Predator.filter(pred => {
            const dist = Math.sqrt(Math.pow(pred.x - scout.x, 2) + Math.pow(pred.y - scout.y, 2));
            return dist < 100;
          });
          
          if (threats.length > 0 && Math.random() < 0.5) {
            console.log(`⚠️ Scout detected ${threats.length} predators!`);
            // Mark area as dangerous
            threats.forEach(threat => {
              (threat as any).detected_by_scout = true;
              (threat as any).detected_at = Date.now();
            });
          }
          
          // Detect large prey for group hunting
          const largePrey = this.data.Prey.filter(prey => {
            const dist = Math.sqrt(Math.pow(prey.x - scout.x, 2) + Math.pow(prey.y - scout.y, 2));
            return dist < 80 && prey.health > 50;
          });
          
          if (largePrey.length > 0 && soldiers.length >= 2) {
            const target = largePrey[0];
            console.log(`🎯 Scout found large prey! Sending soldiers for group hunt.`);
            
            // Send multiple soldiers to hunt large prey
            const availableSoldiers = soldiers.filter(s => s.task === TaskType.Idle && s.z === 0);
            if (availableSoldiers.length >= 2) {
              // Mark prey as group hunt target
              (target as any).group_hunt_target = true;
              (target as any).required_hunters = Math.ceil(target.health / 30); // Need more ants for bigger prey
              
              // Send soldiers
              availableSoldiers.slice(0, Math.min(3, availableSoldiers.length)).forEach(soldier => {
                soldier.task = TaskType.Fighting;
                soldier.target_x = target.x;
                soldier.target_y = target.y;
                soldier.target_z = 0;
                (soldier as any).hunt_target_id = target.id;
                console.log(`⚔️ Soldier ${soldier.id} joining group hunt`);
              });
              antsChanged = true;
            }
            
            // Send available soldiers
            soldiers.filter(s => s.task === TaskType.Idle).forEach(soldier => {
              this.commandAnts([soldier.id], target.x, target.y, target.z, 'hunt');
            });
          }
        }
      });
      
      // Emergency jelly production
      if (colony.queen_jelly < 10 && colony.food >= 20) {
        colony.food -= 10;
        colony.queen_jelly += 5;
        coloniesChanged = true;
        console.log(`⚠️ Emergency jelly production! (${colony.queen_jelly.toFixed(1)} jelly)`);
      }
    });
    
    // Update prey movement
    let preyChanged = false;
    this.data.Prey.forEach(prey => {
      // Check for nearby ants
      let closestAnt: any = null;
      let closestDistance = Infinity;
      
      this.data.Ant.forEach(ant => {
        if (ant.z === 0) { // Only surface ants
          const dist = Math.sqrt(
            Math.pow(ant.x - prey.x, 2) + 
            Math.pow(ant.y - prey.y, 2)
          );
          if (dist < prey.flee_distance && dist < closestDistance) {
            closestDistance = dist;
            closestAnt = ant;
          }
        }
      });
      
      // Flee from ants
      if (closestAnt) {
        const dx = prey.x - closestAnt.x;
        const dy = prey.y - closestAnt.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > 0) {
          prey.x += (dx / dist) * prey.speed;
          prey.y += (dy / dist) * prey.speed;
          preyChanged = true;
        }
      } else {
        // Random movement when not fleeing
        if (Math.random() < 0.1) {
          prey.x += (Math.random() - 0.5) * prey.speed * 2;
          prey.y += (Math.random() - 0.5) * prey.speed * 2;
          preyChanged = true;
        }
      }
    });
    
    // Update predator behavior
    let predatorChanged = false;
    this.data.Predator.forEach(predator => {
      // Find closest ant to hunt
      let targetAnt: any = null;
      let closestDistance = predator.hunt_radius;
      
      this.data.Ant.forEach(ant => {
        if (ant.z === 0) { // Only hunt surface ants
          const dist = Math.sqrt(
            Math.pow(ant.x - predator.x, 2) + 
            Math.pow(ant.y - predator.y, 2)
          );
          if (dist < closestDistance) {
            closestDistance = dist;
            targetAnt = ant;
          }
        }
      });
      
      if (targetAnt) {
        predator.target_ant_id = targetAnt.id;
        
        // Reset boredom when prey found
        if (predator.predator_type === 'bird') {
          (predator as any).boredom = 0;
        }
        
        // Move towards target
        const dx = targetAnt.x - predator.x;
        const dy = targetAnt.y - predator.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > 5) {
          predator.x += (dx / dist) * predator.speed;
          predator.y += (dy / dist) * predator.speed;
          predatorChanged = true;
        } else {
          // Attack!
          const damage = predator.attack_damage;
          targetAnt.health -= damage;
          
          // Mark ant as wounded
          if (targetAnt.health > 0) {
            (targetAnt as any).wounded = true;
            (targetAnt as any).wounded_at = Date.now();
            targetAnt.speed = targetAnt.speed * 0.5; // Slow down wounded ant
            console.log(`🕷️ Predator attacks ant ${targetAnt.id}! Health: ${targetAnt.health}/${targetAnt.max_health}`);
            
            // HIVE ALERT: Ant under attack!
            const colony = this.data.Colony.find(c => c.id === targetAnt.colony_id);
            if (colony) {
              console.log(`🚨 HIVE ALERT: ${targetAnt.ant_type} under attack at (${Math.round(targetAnt.x)}, ${Math.round(targetAnt.y)})!`);
              
              // Mark colony as under threat
              (colony as any).threat_detected = true;
              (colony as any).threat_location_x = targetAnt.x;
              (colony as any).threat_location_y = targetAnt.y;
              (colony as any).threat_time = Date.now();
              
              // Alert nearby soldiers and majors
              const soldiers = this.data.Ant.filter(a => 
                a.colony_id === targetAnt.colony_id && 
                (a.ant_type === AntType.Soldier || a.ant_type === AntType.Major) &&
                a.task === TaskType.Idle
              );
              
              // Send closest soldiers to help
              const helpersToSend = Math.min(3, soldiers.length);
              if (helpersToSend > 0) {
                const closestSoldiers = soldiers.sort((a, b) => {
                  const distA = Math.sqrt(Math.pow(a.x - targetAnt.x, 2) + Math.pow(a.y - targetAnt.y, 2));
                  const distB = Math.sqrt(Math.pow(b.x - targetAnt.x, 2) + Math.pow(b.y - targetAnt.y, 2));
                  return distA - distB;
                }).slice(0, helpersToSend);
                
                closestSoldiers.forEach(soldier => {
                  console.log(`⚔️ Soldier ${soldier.id} responding to threat!`);
                  soldier.task = TaskType.Fighting;
                  soldier.target_x = targetAnt.x;
                  soldier.target_y = targetAnt.y;
                  soldier.target_z = targetAnt.z;
                  (soldier as any).responding_to_alert = true;
                });
              }
            }
          }
          
          if (targetAnt.health <= 0) {
            // HIVE ALERT: Ant killed!
            const colony = this.data.Colony.find(c => c.id === targetAnt.colony_id);
            if (colony) {
              console.log(`💀 HIVE ALERT: ${targetAnt.ant_type} KILLED at (${Math.round(targetAnt.x)}, ${Math.round(targetAnt.y)})!`);
              console.log(`⚰️ Colony ${colony.id} casualties: ${(colony as any).casualties || 0} → ${((colony as any).casualties || 0) + 1}`);
              
              (colony as any).casualties = ((colony as any).casualties || 0) + 1;
              (colony as any).last_death_time = Date.now();
              (colony as any).threat_detected = true;
              (colony as any).threat_location_x = targetAnt.x;
              (colony as any).threat_location_y = targetAnt.y;
              
              // If too many casualties, sound general retreat
              if ((colony as any).casualties > 3 && Math.random() < 0.5) {
                console.log(`📯 GENERAL RETREAT! Too many casualties!`);
                (colony as any).general_retreat = true;
              }
              
              colony.population--;
              coloniesChanged = true;
            }
            
            // Remove dead ant
            this.data.Ant = this.data.Ant.filter(a => a.id !== targetAnt.id);
            predator.target_ant_id = null;
            antsChanged = true;
          }
        }
      } else {
        predator.target_ant_id = null;
        
        // Track boredom for birds
        if (predator.predator_type === 'bird') {
          // Initialize boredom counter
          if ((predator as any).boredom === undefined) {
            (predator as any).boredom = 0;
          }
          
          // Increase boredom when no prey found
          (predator as any).boredom += 1;
          
          // Birds get bored after ~30 seconds (300 ticks) of no prey
          if ((predator as any).boredom > 300) {
            console.log(`🦅 Bird got bored and is flying away!`);
            // Mark for removal
            (predator as any).flying_away = true;
            
            // Fly up and away
            predator.y -= predator.speed * 5;
            predatorChanged = true;
            
            // Remove when off screen
            if (Math.abs(predator.y) > 500) {
              this.data.Predator = this.data.Predator.filter(p => p.id !== predator.id);
              console.log(`🦅 Bird has left the area.`);
            }
          } else if ((predator as any).boredom > 200) {
            // Getting bored, search more actively
            console.log(`🦅 Bird is getting bored... (${(predator as any).boredom}/300)`);
            predator.x += (Math.random() - 0.5) * predator.speed * 5;
            predator.y += (Math.random() - 0.5) * predator.speed * 5;
            predatorChanged = true;
          } else {
            // Normal patrol
            if (Math.random() < 0.05) {
              predator.x += (Math.random() - 0.5) * predator.speed * 3;
              predator.y += (Math.random() - 0.5) * predator.speed * 3;
              predatorChanged = true;
            }
          }
        } else {
          // Non-bird predators just patrol normally
          if (Math.random() < 0.05) {
            predator.x += (Math.random() - 0.5) * predator.speed * 3;
            predator.y += (Math.random() - 0.5) * predator.speed * 3;
            predatorChanged = true;
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
    if (preyChanged) this.emit('Prey', this.data.Prey);
    if (predatorChanged) this.emit('Predator', this.data.Predator);
  }

  private cleanupDeadData() {
    console.log('🧹 Cleaning up dead colonies and orphaned ants...');
    
    // Get active colony IDs
    const activeColonyIds = new Set(this.data.Colony.map(c => c.id));
    
    // Also check for colonies without queens and mark them for removal
    const coloniesWithQueens = new Set<number>();
    this.data.Colony.forEach(colony => {
      if (colony.queen_id) {
        // Check if the queen actually exists
        const queenExists = this.data.Ant.some(ant => ant.id === colony.queen_id);
        if (queenExists) {
          coloniesWithQueens.add(colony.id);
        }
      }
    });
    
    // Remove colonies without queens
    const beforeColonyCount = this.data.Colony.length;
    this.data.Colony = this.data.Colony.filter(colony => coloniesWithQueens.has(colony.id));
    const removedColonies = beforeColonyCount - this.data.Colony.length;
    
    // Update active colony IDs after removing dead colonies
    const finalActiveColonyIds = new Set(this.data.Colony.map(c => c.id));
    
    // Log remaining colonies
    console.log(`📊 Active colonies after queen check: ${this.data.Colony.length}`);
    this.data.Colony.forEach(colony => {
      const antCount = this.data.Ant.filter(ant => ant.colony_id === colony.id).length;
      console.log(`   Colony #${colony.id}: ${antCount} ants, Player: ${colony.player_id}`);
    });
    
    // Remove ants from dead colonies
    const beforeAntCount = this.data.Ant.length;
    this.data.Ant = this.data.Ant.filter(ant => finalActiveColonyIds.has(ant.colony_id));
    const removedAnts = beforeAntCount - this.data.Ant.length;
    
    // Remove chambers from dead colonies
    const beforeChamberCount = this.data.Chamber.length;
    this.data.Chamber = this.data.Chamber.filter(chamber => finalActiveColonyIds.has(chamber.colony_id));
    const removedChambers = beforeChamberCount - this.data.Chamber.length;
    
    // Remove larvae from dead colonies
    const beforeLarvaeCount = this.data.Larva.length;
    this.data.Larva = this.data.Larva.filter(larva => finalActiveColonyIds.has(larva.colony_id));
    const removedLarvae = beforeLarvaeCount - this.data.Larva.length;
    
    // Remove explored territories from dead colonies
    const beforeExploredCount = this.data.ExploredTerritory.length;
    this.data.ExploredTerritory = this.data.ExploredTerritory.filter(
      territory => finalActiveColonyIds.has(territory.colony_id)
    );
    const removedExplored = beforeExploredCount - this.data.ExploredTerritory.length;
    
    // Remove discovered resources from dead colonies
    const beforeDiscoveredCount = this.data.DiscoveredResource.length;
    this.data.DiscoveredResource = this.data.DiscoveredResource.filter(
      resource => finalActiveColonyIds.has(resource.colony_id)
    );
    const removedDiscovered = beforeDiscoveredCount - this.data.DiscoveredResource.length;
    
    if (removedColonies > 0 || removedAnts > 0 || removedChambers > 0 || removedLarvae > 0) {
      console.log(`✅ Cleaned up: ${removedColonies} dead colonies, ${removedAnts} ants, ${removedChambers} chambers, ${removedLarvae} larvae`);
      console.log(`   Also removed: ${removedExplored} territories, ${removedDiscovered} discovered resources`);
      console.log(`   Remaining: ${finalActiveColonyIds.size} active colonies with ${this.data.Ant.length} total ants`);
    }
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
        
        // Load world data (resources, obstacles, etc)
        this.data.ResourceNode = state.data.ResourceNode || [];
        this.data.Obstacle = state.data.Obstacle || [];
        this.data.Prey = state.data.Prey || [];
        this.data.Predator = state.data.Predator || [];
        
        // Only load player-specific data for the current identity
        this.data.Player = (state.data.Player || []).filter((p: any) => p.id === this.identity);
        this.data.Colony = (state.data.Colony || []).filter((c: any) => c.player_id === this.identity);
        
        // Get colonies belonging to this player
        const myColonyIds = this.data.Colony.map((c: any) => c.id);
        
        // Only load entities belonging to player's colonies
        this.data.Ant = (state.data.Ant || []).filter((a: any) => myColonyIds.includes(a.colony_id));
        this.data.Chamber = (state.data.Chamber || []).filter((ch: any) => myColonyIds.includes(ch.colony_id));
        this.data.ExploredTerritory = (state.data.ExploredTerritory || []).filter((et: any) => myColonyIds.includes(et.colony_id));
        this.data.DiscoveredResource = (state.data.DiscoveredResource || []).filter((dr: any) => myColonyIds.includes(dr.colony_id));
        
        // Load other shared data
        this.data.Tunnel = state.data.Tunnel || [];
        this.data.Pheromone = state.data.Pheromone || [];
        this.data.Battle = state.data.Battle || [];
        
        this.nextId = state.nextId;
        
        console.log(`Loaded state for player ${this.identity}: ${this.data.Colony.length} colonies, ${this.data.Ant.length} ants`);
      } catch (e) {
        console.error('Failed to load state:', e);
      }
    }
  }

  private getJellyConsumptionRate(antType: AntType): number {
    // Jelly consumed per minute
    switch (antType) {
      case AntType.Queen: return 0; // Queens don't consume jelly
      case AntType.YoungQueen: return 0.1; // Young queens consume some jelly
      case AntType.Worker: return 0.1;
      case AntType.RoyalWorker: return 0.05; // Less consumption, produces jelly
      case AntType.Soldier: return 0.15;
      case AntType.Scout: return 0.08;
      case AntType.Major: return 0.2;
      default: return 0.1;
    }
  }
  
  private getUnitPopulationCost(antType: AntType): number {
    // Population points required for each unit type
    switch (antType) {
      case AntType.Queen: return 0; // Queens don't count towards population
      case AntType.Worker: return 1;
      case AntType.Scout: return 1;
      case AntType.Soldier: return 2;
      case AntType.RoyalWorker: return 5;
      case AntType.Major: return 5;
      case AntType.YoungQueen: return 10;
      default: return 1;
    }
  }
  
  public calculateColonyCapacity(colonyId: number): number {
    let capacity = 0;
    
    // Add capacity from chambers
    const chambers = this.data.Chamber.filter(ch => ch.colony_id === colonyId);
    chambers.forEach(chamber => {
      switch (chamber.chamber_type) {
        case ChamberType.Burrow:
          capacity += 20; // Increased: Each burrow provides 20 population points
          break;
        case ChamberType.Barracks:
          capacity += 30; // Increased: Each barracks adds 30 population points
          break;
        case ChamberType.Nursery:
          capacity += 10; // Increased: Nurseries add 10 capacity
          break;
        case ChamberType.Storage:
          capacity += 15; // Increased: Storage adds moderate capacity
          break;
      }
    });
    
    return capacity;
  }
  
  public calculateColonyPopulation(colonyId: number): number {
    // Calculate current population usage
    const ants = this.data.Ant.filter(a => a.colony_id === colonyId);
    let populationUsed = 0;
    
    ants.forEach(ant => {
      populationUsed += this.getUnitPopulationCost(ant.ant_type);
    });
    
    return populationUsed;
  }
  
  private hasRoyalChamber(colonyId: number): boolean {
    // Check if colony has a throne room (royal chamber)
    return this.data.Chamber.some(ch => 
      ch.colony_id === colonyId && ch.chamber_type === ChamberType.ThroneRoom
    );
  }
  
  private getAntStats(antType: AntType): { health: number; speed: number; damage: number } {
    const stats = {
      [AntType.Queen]: { health: 200, speed: 0.5, damage: 50 },
      [AntType.YoungQueen]: { health: 150, speed: 4, damage: 15 },
      [AntType.Worker]: { health: 50, speed: 4, damage: 5 },
      [AntType.RoyalWorker]: { health: 40, speed: 0.5, damage: 0 },
      [AntType.Soldier]: { health: 100, speed: 3, damage: 20 },
      [AntType.Scout]: { health: 30, speed: 6, damage: 10 },
      [AntType.Major]: { health: 150, speed: 2, damage: 30 }
    };
    
    return stats[antType];
  }
  
  disconnect() {
    if (this.gameUpdateInterval) {
      clearInterval(this.gameUpdateInterval);
    }
  }
}