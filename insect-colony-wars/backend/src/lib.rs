use spacetimedb::{spacetimedb, Identity, ReducerContext};

// ===== ENUMS =====

#[derive(SpacetimeType, Debug, Clone, Copy, PartialEq)]
pub enum AntType {
    Queen,
    YoungQueen, // Can fly away to start new colony
    Worker,
    RoyalWorker, // Produces queen jelly, never leaves burrow
    Soldier,
    Scout,
    Major,
}

#[derive(SpacetimeType, Debug, Clone, Copy, PartialEq)]
pub enum ResourceType {
    Food,
    Water,
    Minerals,
    Larvae,
}

#[derive(SpacetimeType, Debug, Clone, Copy, PartialEq)]
pub enum ChamberType {
    Nursery,
    Storage,
    Barracks,
    ThroneRoom,
    Burrow, // Resource outpost
}

#[derive(SpacetimeType, Debug, Clone, Copy, PartialEq)]
pub enum TaskType {
    Idle,
    Gathering,
    Building,
    Fighting,
    Exploring,
    Returning,
    Digging,
}

#[derive(SpacetimeType, Debug, Clone, Copy, PartialEq)]
pub enum AntTrait {
    // Combat traits
    AcidSpray,    // +50% damage, damage over time
    Venomous,     // Attacks slow enemies
    Armored,      // +25% health, -10% speed
    
    // Movement traits  
    Swift,        // +50% movement speed
    Climber,      // Can traverse obstacles
    Tunneler,     // +50% digging speed
    
    // Work traits
    Strong,       // +50% carrying capacity
    Efficient,    // -25% jelly consumption
    Industrious,  // +25% work speed
    
    // Special traits
    Pheromone,    // Mimics colony scent, tricks enemy scouts/defenders
    Regenerator,  // Slowly heals over time
    Scout,        // +50% vision range
    
    // Queen-specific traits (for young queens)
    Fertile,      // +50% larvae production
    Matriarch,    // Colony starts with bonus population
    Survivor,     // Start with +50% extra jelly
}

// ===== TABLES =====

/// Player account information
#[spacetimedb(table)]
pub struct Player {
    #[primary_key]
    pub id: Identity,
    pub username: String,
    pub created_at: u64,
    pub total_colonies: u32,
    pub resources_gathered: u64,
    pub generations_survived: u32,
    pub queens_produced: u32,
    pub best_colony_score: u64,
}

/// Colony owned by a player
#[spacetimedb(table)]
pub struct Colony {
    #[primary_key]
    #[autoinc]
    pub id: u32,
    pub player_id: Identity,
    pub queen_id: Option<u32>, // Reference to queen ant
    pub food: f32,
    pub water: f32,
    pub minerals: f32,
    pub larvae: u32,
    pub queen_jelly: f32, // Queen's life force
    pub population: u32,
    pub territory_radius: f32,
    pub created_at: u64,
    pub ai_enabled: bool, // Auto-management toggle
    pub queen_trait: Option<AntTrait>, // Inherited from founding queen
}

/// Individual ant unit
#[spacetimedb(table)]
pub struct Ant {
    #[primary_key]
    #[autoinc]
    pub id: u32,
    pub colony_id: u32,
    pub ant_type: AntType,
    pub x: f32,
    pub y: f32,
    pub z: f32, // Depth underground
    pub health: u32,
    pub max_health: u32,
    pub carrying_resource: Option<ResourceType>,
    pub carrying_amount: f32,
    pub task: TaskType,
    pub target_x: Option<f32>,
    pub target_y: Option<f32>,
    pub target_z: Option<f32>,
    pub speed: f32,
    pub attack_damage: u32,
    pub jelly_consumption_rate: f32, // Jelly consumed per tick
    pub last_fed_at: u64, // Timestamp of last feeding
    pub trait_type: Option<AntTrait>, // Not for RoyalWorker or base Queen
    pub maturation_time: Option<u64>, // For YoungQueen: timestamp when they can fly
}

/// Underground tunnel network
#[spacetimedb(table)]
pub struct Tunnel {
    #[primary_key]
    #[autoinc]
    pub id: u32,
    pub colony_id: u32,
    pub start_x: f32,
    pub start_y: f32,
    pub start_z: f32,
    pub end_x: f32,
    pub end_y: f32,
    pub end_z: f32,
    pub width: f32, // Determines how many ants can pass
}

/// Specialized rooms in the colony
#[spacetimedb(table)]
pub struct Chamber {
    #[primary_key]
    #[autoinc]
    pub id: u32,
    pub colony_id: u32,
    pub chamber_type: ChamberType,
    pub x: f32,
    pub y: f32,
    pub z: f32,
    pub level: u32,
    pub capacity: u32,
}

/// Resource nodes on the map
#[spacetimedb(table)]
pub struct ResourceNode {
    #[primary_key]
    #[autoinc]
    pub id: u32,
    pub resource_type: ResourceType,
    pub x: f32,
    pub y: f32,
    pub z: f32,
    pub amount: f32,
    pub max_amount: f32,
    pub regeneration_rate: f32,
}

/// Pheromone trails for ant navigation
#[spacetimedb(table)]
pub struct Pheromone {
    #[primary_key]
    #[autoinc]
    pub id: u32,
    pub colony_id: u32,
    pub x: f32,
    pub y: f32,
    pub z: f32,
    pub strength: f32,
    pub pheromone_type: String, // "food", "danger", "home"
    pub created_at: u64,
}

/// Combat events for visualization
#[spacetimedb(table)]
pub struct Battle {
    #[primary_key]
    #[autoinc]
    pub id: u32,
    pub attacker_ant_id: u32,
    pub defender_ant_id: u32,
    pub x: f32,
    pub y: f32,
    pub z: f32,
    pub damage_dealt: u32,
    pub timestamp: u64,
}

/// Explored territory data
#[spacetimedb(table)]
pub struct ExploredTerritory {
    #[primary_key]
    #[autoinc]
    pub id: u32,
    pub colony_id: u32,
    pub x: f32,
    pub y: f32,
    pub z: f32,
    pub discovered_at: u64,
    pub has_resources: bool,
    pub has_threats: bool,
    pub threat_level: u32,
}

/// Discovered resource nodes per colony
#[spacetimedb(table)]
pub struct DiscoveredResource {
    #[primary_key]
    #[autoinc]
    pub id: u32,
    pub colony_id: u32,
    pub resource_id: u32,
    pub discovered_at: u64,
}

/// Surface obstacles (rocks, plants, logs)
#[spacetimedb(table)]
pub struct Obstacle {
    #[primary_key]
    #[autoinc]
    pub id: u32,
    pub obstacle_type: String, // "rock", "plant", "log", "leaf"
    pub x: f32,
    pub y: f32,
    pub width: f32,
    pub height: f32,
    pub blocks_movement: bool,
}

/// Prey animals that ants can hunt
#[spacetimedb(table)]
pub struct Prey {
    #[primary_key]
    #[autoinc]
    pub id: u32,
    pub prey_type: String, // "aphid", "caterpillar", "termite"
    pub x: f32,
    pub y: f32,
    pub health: u32,
    pub max_health: u32,
    pub speed: f32,
    pub food_value: f32,
    pub flee_distance: f32,
}

/// Predators that hunt ants
#[spacetimedb(table)]
pub struct Predator {
    #[primary_key]
    #[autoinc]
    pub id: u32,
    pub predator_type: String, // "spider", "bird", "beetle"
    pub x: f32,
    pub y: f32,
    pub health: u32,
    pub max_health: u32,
    pub speed: f32,
    pub attack_damage: u32,
    pub hunt_radius: f32,
    pub target_ant_id: Option<u32>,
}

// ===== HELPER FUNCTIONS =====

fn get_ant_stats(ant_type: AntType) -> (u32, f32, u32) {
    // Returns (max_health, speed, attack_damage)
    match ant_type {
        AntType::Queen => (200, 0.5, 50), // Very slow but powerful bite for defense
        AntType::YoungQueen => (150, 4.0, 15), // Can fly! Fast and can defend herself
        AntType::Worker => (50, 4.0, 5),
        AntType::RoyalWorker => (40, 0.5, 0), // Slow, no attack, stays in burrow
        AntType::Soldier => (100, 3.0, 20),
        AntType::Scout => (30, 6.0, 10),
        AntType::Major => (150, 2.0, 30),
    }
}

fn generate_random_trait_for_type(ant_type: AntType) -> Option<AntTrait> {
    // No traits for RoyalWorker or base Queen
    if ant_type == AntType::RoyalWorker || ant_type == AntType::Queen {
        return None;
    }
    
    let timestamp = spacetimedb::timestamp();
    let random = (timestamp % 100) as u32;
    
    // Different trait pools for different ant types
    match ant_type {
        AntType::YoungQueen => {
            match random % 3 {
                0 => Some(AntTrait::Fertile),
                1 => Some(AntTrait::Matriarch),
                _ => Some(AntTrait::Survivor),
            }
        },
        AntType::Worker => {
            match random % 5 {
                0 => Some(AntTrait::Strong),
                1 => Some(AntTrait::Swift),
                2 => Some(AntTrait::Efficient),
                3 => Some(AntTrait::Industrious),
                _ => Some(AntTrait::Pheromone),
            }
        },
        AntType::Soldier | AntType::Major => {
            match random % 4 {
                0 => Some(AntTrait::AcidSpray),
                1 => Some(AntTrait::Venomous),
                2 => Some(AntTrait::Armored),
                _ => Some(AntTrait::Regenerator),
            }
        },
        AntType::Scout => {
            match random % 4 {
                0 => Some(AntTrait::Swift),
                1 => Some(AntTrait::Scout),
                2 => Some(AntTrait::Climber),
                _ => Some(AntTrait::Pheromone),
            }
        },
        _ => None,
    }
}

fn distance_3d(x1: f32, y1: f32, z1: f32, x2: f32, y2: f32, z2: f32) -> f32 {
    ((x2 - x1).powi(2) + (y2 - y1).powi(2) + (z2 - z1).powi(2)).sqrt()
}

fn get_jelly_consumption_rate(ant_type: AntType) -> f32 {
    // Jelly consumed per minute
    match ant_type {
        AntType::Queen => 0.0, // Queens don't consume jelly
        AntType::YoungQueen => 0.1, // Consumes jelly while preparing to fly
        AntType::Worker => 0.1,
        AntType::RoyalWorker => 0.05, // Less consumption, produces jelly
        AntType::Soldier => 0.15,
        AntType::Scout => 0.08,
        AntType::Major => 0.2,
    }
}

fn can_afford_ant(colony: &Colony, ant_type: AntType) -> bool {
    let jelly_cost = match ant_type {
        AntType::Worker => 2.0,
        AntType::RoyalWorker => 5.0, // More expensive, produces jelly
        AntType::Soldier => 3.0,
        AntType::Scout => 2.5,
        AntType::Major => 5.0,
        AntType::YoungQueen => 50.0, // Very expensive
        AntType::Queen => 999.0, // Can't spawn queens
    };
    
    colony.queen_jelly >= jelly_cost && match ant_type {
        AntType::Worker => colony.food >= 10.0 && colony.larvae >= 1,
        AntType::RoyalWorker => colony.food >= 20.0 && colony.larvae >= 1,
        AntType::Soldier => colony.food >= 20.0 && colony.larvae >= 1,
        AntType::Scout => colony.food >= 15.0 && colony.larvae >= 1,
        AntType::Major => colony.food >= 50.0 && colony.minerals >= 10.0 && colony.larvae >= 2,
        AntType::YoungQueen => colony.food >= 50.0 && colony.water >= 20.0 && colony.larvae >= 1,
        AntType::Queen => false,
    }
}

// ===== REDUCERS =====

/// Create a new player account
#[spacetimedb(reducer)]
pub fn create_player(ctx: ReducerContext, username: String) {
    if Player::filter_by_id(&ctx.sender).is_some() {
        log::info!("Player already exists: {:?}", ctx.sender);
        return;
    }
    
    let player = Player {
        id: ctx.sender,
        username,
        created_at: spacetimedb::timestamp(),
        total_colonies: 0,
        resources_gathered: 0,
    };
    Player::insert(player);
    log::info!("Player created: {:?}", ctx.sender);
}

/// Respawn as a new queen with minimal resources
#[spacetimedb(reducer)]
pub fn respawn_as_queen(ctx: ReducerContext, x: f32, y: f32) {
    let player = match Player::filter_by_id(&ctx.sender) {
        Some(p) => p,
        None => {
            log::error!("Player not found: {:?}", ctx.sender);
            return;
        }
    };
    
    // Delete old colonies and ants
    for colony in Colony::iter().filter(|c| c.player_id == ctx.sender) {
        // Delete all ants from this colony
        for ant in Ant::iter().filter(|a| a.colony_id == colony.id) {
            Ant::delete_by_id(&ant.id);
        }
        // Delete all chambers
        for chamber in Chamber::iter().filter(|ch| ch.colony_id == colony.id) {
            Chamber::delete_by_id(&chamber.id);
        }
        // Delete colony
        Colony::delete_by_id(&colony.id);
    }
    
    // Create minimal colony
    let colony = Colony {
        id: 0, // autoinc
        player_id: ctx.sender,
        queen_id: None,
        food: 0.0, // Start with nothing
        water: 10.0, // Minimal water
        minerals: 0.0,
        larvae: 0, // No larvae
        queen_jelly: 20.0, // Just enough to spawn 1 worker
        population: 1,
        territory_radius: 30.0, // Smaller territory
        created_at: spacetimedb::timestamp(),
        ai_enabled: false, // Manual control for survival
        queen_trait: None, // Regular respawn has no trait
    };
    let colony_id = Colony::insert(colony).unwrap().id;
    
    // Create queen ant
    let (health, speed, damage) = get_ant_stats(AntType::Queen);
    let queen = Ant {
        id: 0, // autoinc
        colony_id,
        ant_type: AntType::Queen,
        x,
        y,
        z: -5.0, // Closer to surface
        health,
        max_health: health,
        carrying_resource: None,
        carrying_amount: 0.0,
        task: TaskType::Idle,
        target_x: None,
        target_y: None,
        target_z: None,
        speed,
        attack_damage: damage,
        jelly_consumption_rate: get_jelly_consumption_rate(AntType::Queen),
        last_fed_at: spacetimedb::timestamp(),
        trait_type: None, // Regular queens don't have traits
        maturation_time: None,
    };
    let queen_id = Ant::insert(queen).unwrap().id;
    
    // Update colony with queen reference
    let mut colony_update = Colony::filter_by_id(&colony_id).unwrap();
    colony_update.queen_id = Some(queen_id);
    Colony::update_by_id(&colony_id, colony_update);
    
    // Create minimal throne room
    let throne = Chamber {
        id: 0, // autoinc
        colony_id,
        chamber_type: ChamberType::ThroneRoom,
        x,
        y,
        z: -5.0,
        level: 1,
        capacity: 1,
    };
    Chamber::insert(throne);
    
    // Create one worker to start
    let (worker_health, worker_speed, worker_damage) = get_ant_stats(AntType::Worker);
    let worker = Ant {
        id: 0, // autoinc
        colony_id,
        ant_type: AntType::Worker,
        x: x + 5.0,
        y: y + 5.0,
        z: -5.0,
        health: worker_health,
        max_health: worker_health,
        carrying_resource: None,
        carrying_amount: 0.0,
        task: TaskType::Idle,
        target_x: None,
        target_y: None,
        target_z: None,
        speed: worker_speed,
        attack_damage: worker_damage,
        jelly_consumption_rate: get_jelly_consumption_rate(AntType::Worker),
        last_fed_at: spacetimedb::timestamp(),
        trait_type: generate_random_trait_for_type(AntType::Worker),
        maturation_time: None,
    };
    Ant::insert(worker);
    
    // Update colony population
    let mut final_colony = Colony::filter_by_id(&colony_id).unwrap();
    final_colony.population = 2; // Queen + 1 worker
    final_colony.queen_jelly = 18.0; // Deduct worker cost
    Colony::update_by_id(&colony_id, final_colony);
    
    // Update player stats
    let mut player_update = player;
    player_update.total_colonies += 1;
    Player::update_by_id(&ctx.sender, player_update);
    
    log::info!("Player {:?} respawned as queen at ({}, {})", ctx.sender, x, y);
}

/// Start a new colony with a queen
#[spacetimedb(reducer)]
pub fn create_colony(ctx: ReducerContext, x: f32, y: f32) {
    let player = match Player::filter_by_id(&ctx.sender) {
        Some(p) => p,
        None => {
            log::error!("Player not found: {:?}", ctx.sender);
            return;
        }
    };
    
    // Create colony with standard resources
    let colony = Colony {
        id: 0, // autoinc
        player_id: ctx.sender,
        queen_id: None,
        food: 100.0,
        water: 50.0, // Starting water
        minerals: 0.0,
        larvae: 5,
        queen_jelly: 100.0, // Starting queen jelly
        population: 1,
        territory_radius: 50.0,
        created_at: spacetimedb::timestamp(),
        ai_enabled: true, // AI enabled by default
        queen_trait: None, // Will be set if queen has trait
    };
    let colony_id = Colony::insert(colony).unwrap().id;
    
    // Create queen ant
    let (health, speed, damage) = get_ant_stats(AntType::Queen);
    let queen = Ant {
        id: 0, // autoinc
        colony_id,
        ant_type: AntType::Queen,
        x,
        y,
        z: -10.0, // Underground
        health,
        max_health: health,
        carrying_resource: None,
        carrying_amount: 0.0,
        task: TaskType::Idle,
        target_x: None,
        target_y: None,
        target_z: None,
        speed,
        attack_damage: damage,
        jelly_consumption_rate: get_jelly_consumption_rate(AntType::Queen),
        last_fed_at: spacetimedb::timestamp(),
        trait_type: None, // Regular queens don't have traits
        maturation_time: None,
    };
    let queen_id = Ant::insert(queen).unwrap().id;
    
    // Update colony with queen reference
    let mut colony_update = Colony::filter_by_id(&colony_id).unwrap();
    colony_update.queen_id = Some(queen_id);
    Colony::update_by_id(&colony_id, colony_update);
    
    // Create initial throne room
    let throne = Chamber {
        id: 0, // autoinc
        colony_id,
        chamber_type: ChamberType::ThroneRoom,
        x,
        y,
        z: -10.0,
        level: 1,
        capacity: 1,
    };
    Chamber::insert(throne);
    
    // Create 5 initial worker ants
    for i in 0..5 {
        let (health, speed, damage) = get_ant_stats(AntType::Worker);
        let worker = Ant {
            id: 0, // autoinc
            colony_id,
            ant_type: AntType::Worker,
            x: x + (i as f32 * 2.0) - 4.0,
            y: y + (i as f32 * 2.0) - 4.0,
            z: -10.0,
            health,
            max_health: health,
            carrying_resource: None,
            carrying_amount: 0.0,
            task: TaskType::Idle,
            target_x: None,
            target_y: None,
            target_z: None,
            speed,
            attack_damage: damage,
            jelly_consumption_rate: get_jelly_consumption_rate(AntType::Worker),
            last_fed_at: spacetimedb::timestamp(),
            trait_type: generate_random_trait_for_type(AntType::Worker),
        };
        Ant::insert(worker);
    }
    
    // Update player stats
    let mut player_update = player;
    player_update.total_colonies += 1;
    Player::update_by_id(&ctx.sender, player_update);
    
    log::info!("Colony {} created for player {:?}", colony_id, ctx.sender);
}

/// Spawn a new ant from larvae
#[spacetimedb(reducer)]
pub fn spawn_ant(ctx: ReducerContext, colony_id: u32, ant_type: AntType, x: f32, y: f32, z: f32) {
    // Verify colony ownership
    let mut colony = match Colony::filter_by_id(&colony_id) {
        Some(c) => c,
        None => {
            log::error!("Colony not found: {}", colony_id);
            return;
        }
    };
    
    if colony.player_id != ctx.sender {
        log::error!("Colony not owned by player");
        return;
    }
    
    // Check resources
    if !can_afford_ant(&colony, ant_type) {
        log::error!("Cannot afford ant type: {:?}", ant_type);
        return;
    }
    
    // Only workers can spawn other ant types from larvae
    if ant_type != AntType::Worker {
        log::error!("Use feed_larva to transform larvae into other ant types");
        return;
    }
    
    // First larva is always a worker (costs less)
    let is_first_worker = colony.population == 1; // Only queen exists
    let jelly_cost = if is_first_worker { 1.0 } else { 2.0 };
    
    colony.queen_jelly -= jelly_cost;
    
    match ant_type {
        AntType::Worker => {
            colony.food -= 10.0;
            colony.larvae -= 1;
        }
        AntType::Soldier => {
            colony.food -= 20.0;
            colony.larvae -= 1;
        }
        AntType::Scout => {
            colony.food -= 15.0;
            colony.larvae -= 1;
        }
        AntType::Major => {
            colony.food -= 50.0;
            colony.minerals -= 10.0;
            colony.larvae -= 2;
        }
        AntType::Queen => return,
    }
    
    // Create ant
    let (health, speed, damage) = get_ant_stats(ant_type);
    let ant = Ant {
        id: 0, // autoinc
        colony_id,
        ant_type,
        x,
        y,
        z,
        health,
        max_health: health,
        carrying_resource: None,
        carrying_amount: 0.0,
        task: TaskType::Idle,
        target_x: None,
        target_y: None,
        target_z: None,
        speed,
        attack_damage: damage,
        jelly_consumption_rate: get_jelly_consumption_rate(ant_type),
        last_fed_at: spacetimedb::timestamp(),
        trait_type: generate_random_trait_for_type(ant_type),
        maturation_time: None,
    };
    Ant::insert(ant);
    
    // Update colony
    colony.population += 1;
    Colony::update_by_id(&colony_id, colony);
    
    log::info!("Spawned {:?} ant for colony {}", ant_type, colony_id);
}

/// Command ants to move to a location
#[spacetimedb(reducer)]
pub fn command_ants(ctx: ReducerContext, ant_ids: Vec<u32>, target_x: f32, target_y: f32, target_z: f32) {
    // First check total jelly cost
    let mut total_jelly_cost = 0.0;
    let mut valid_ants = Vec::new();
    
    for ant_id in &ant_ids {
        let ant = match Ant::filter_by_id(ant_id) {
            Some(a) => a,
            None => continue,
        };
        
        // Verify ownership
        let colony = Colony::filter_by_id(&ant.colony_id).unwrap();
        if colony.player_id != ctx.sender {
            continue;
        }
        
        // Calculate distance and jelly cost (0.01 jelly per unit distance)
        let distance = distance_3d(ant.x, ant.y, ant.z, target_x, target_y, target_z);
        let jelly_cost = distance * 0.01;
        total_jelly_cost += jelly_cost;
        
        valid_ants.push((ant_id, ant.colony_id, jelly_cost));
    }
    
    // Check if colony has enough jelly
    if let Some((_, colony_id, _)) = valid_ants.first() {
        let mut colony = Colony::filter_by_id(colony_id).unwrap();
        if colony.queen_jelly < total_jelly_cost {
            log::warn!("Not enough queen jelly for movement. Need {}, have {}", total_jelly_cost, colony.queen_jelly);
            return;
        }
        
        // Deduct jelly and move ants
        colony.queen_jelly -= total_jelly_cost;
        Colony::update_by_id(colony_id, colony);
        
        // Update ant positions
        for ant_id in ant_ids {
            let mut ant = match Ant::filter_by_id(&ant_id) {
                Some(a) => a,
                None => continue,
            };
            
            // Set movement target
            ant.target_x = Some(target_x);
            ant.target_y = Some(target_y);
            ant.target_z = Some(target_z);
            ant.task = TaskType::Exploring;
            
            Ant::update_by_id(&ant_id, ant);
        }
    }
}

/// Dig a tunnel between two points
#[spacetimedb(reducer)]
pub fn dig_tunnel(ctx: ReducerContext, colony_id: u32, start_x: f32, start_y: f32, start_z: f32, end_x: f32, end_y: f32, end_z: f32) {
    // Verify colony ownership
    let colony = match Colony::filter_by_id(&colony_id) {
        Some(c) => c,
        None => {
            log::error!("Colony not found: {}", colony_id);
            return;
        }
    };
    
    if colony.player_id != ctx.sender {
        log::error!("Colony not owned by player");
        return;
    }
    
    // Check if there are workers nearby to dig
    let workers_nearby = Ant::iter()
        .filter(|a| {
            a.colony_id == colony_id && 
            a.ant_type == AntType::Worker &&
            distance_3d(a.x, a.y, a.z, start_x, start_y, start_z) < 10.0
        })
        .count();
    
    if workers_nearby == 0 {
        log::error!("No workers nearby to dig tunnel");
        return;
    }
    
    // Create tunnel
    let tunnel = Tunnel {
        id: 0, // autoinc
        colony_id,
        start_x,
        start_y,
        start_z,
        end_x,
        end_y,
        end_z,
        width: 2.0, // Standard tunnel width
    };
    Tunnel::insert(tunnel);
    
    log::info!("Tunnel created for colony {}", colony_id);
}

/// Build a chamber (workers build chambers, queens only build burrows)
#[spacetimedb(reducer)]
pub fn build_chamber(ctx: ReducerContext, ant_id: u32, chamber_type: ChamberType, x: f32, y: f32, z: f32) {
    // Get the ant that's building
    let ant = match Ant::filter_by_id(&ant_id) {
        Some(a) => a,
        None => {
            log::error!("Ant not found: {}", ant_id);
            return;
        }
    };
    
    // Verify colony ownership
    let mut colony = match Colony::filter_by_id(&ant.colony_id) {
        Some(c) => c,
        None => {
            log::error!("Colony not found: {}", ant.colony_id);
            return;
        }
    };
    
    if colony.player_id != ctx.sender {
        log::error!("Colony not owned by player");
        return;
    }
    
    // Check ant permissions
    match ant.ant_type {
        AntType::Queen => {
            if chamber_type != ChamberType::Burrow {
                log::error!("Queens can only build burrows");
                return;
            }
        }
        AntType::Worker => {
            if chamber_type == ChamberType::Burrow {
                log::error!("Workers cannot build burrows, only queens can");
                return;
            }
        }
        _ => {
            log::error!("Only queens and workers can build");
            return;
        }
    }
    
    // Check resources for chamber
    let (food_cost, mineral_cost, jelly_cost) = match chamber_type {
        ChamberType::Nursery => (50.0, 10.0, 0.0),
        ChamberType::Storage => (30.0, 20.0, 0.0),
        ChamberType::Barracks => (100.0, 50.0, 0.0),
        ChamberType::ThroneRoom => (200.0, 100.0, 0.0),
        ChamberType::Burrow => (20.0, 5.0, 10.0), // Burrows cost jelly to establish
    };
    
    if colony.food < food_cost || colony.minerals < mineral_cost || colony.queen_jelly < jelly_cost {
        log::error!("Insufficient resources for chamber");
        return;
    }
    
    // Deduct resources
    colony.food -= food_cost;
    colony.minerals -= mineral_cost;
    colony.queen_jelly -= jelly_cost;
    Colony::update_by_id(&colony_id, colony);
    
    // Create chamber
    let chamber = Chamber {
        id: 0, // autoinc
        colony_id,
        chamber_type,
        x,
        y,
        z,
        level: 1,
        capacity: match chamber_type {
            ChamberType::Nursery => 20,
            ChamberType::Storage => 100,
            ChamberType::Barracks => 50,
            ChamberType::ThroneRoom => 1,
        },
    };
    Chamber::insert(chamber);
    
    log::info!("Chamber {:?} built for colony {}", chamber_type, colony_id);
}

/// Queen spawns a larva (queens can only make larvae and burrows)
#[spacetimedb(reducer)]
pub fn spawn_larva(ctx: ReducerContext, queen_id: u32) {
    let queen = match Ant::filter_by_id(&queen_id) {
        Some(q) => q,
        None => {
            log::error!("Queen not found: {}", queen_id);
            return;
        }
    };
    
    if queen.ant_type != AntType::Queen {
        log::error!("Only queens can spawn larvae");
        return;
    }
    
    let mut colony = Colony::filter_by_id(&queen.colony_id).unwrap();
    if colony.player_id != ctx.sender {
        log::error!("Queen not owned by player");
        return;
    }
    
    // Check if queen has energy (jelly) to produce larva
    if colony.queen_jelly < 0.5 {
        log::error!("Not enough queen jelly to spawn larva");
        return;
    }
    
    // Spawn larva (costs minimal jelly)
    colony.queen_jelly -= 0.5;
    colony.larvae += 1;
    Colony::update_by_id(&colony.id, colony);
    
    log::info!("Queen {} spawned a larva", queen_id);
}

/// Feed a larva to transform it into an ant type
#[spacetimedb(reducer)]
pub fn feed_larva(ctx: ReducerContext, colony_id: u32, ant_type: AntType, x: f32, y: f32, z: f32) {
    let mut colony = match Colony::filter_by_id(&colony_id) {
        Some(c) => c,
        None => {
            log::error!("Colony not found: {}", colony_id);
            return;
        }
    };
    
    if colony.player_id != ctx.sender {
        log::error!("Colony not owned by player");
        return;
    }
    
    if colony.larvae < 1 {
        log::error!("No larvae available");
        return;
    }
    
    // Calculate jelly cost for transformation
    let jelly_cost = match ant_type {
        AntType::Worker => 2.0,
        AntType::RoyalWorker => 5.0,
        AntType::Soldier => 3.0,
        AntType::Scout => 2.5,
        AntType::Major => 5.0,
        AntType::YoungQueen => 50.0,
        AntType::Queen => {
            log::error!("Cannot transform larva into queen");
            return;
        }
    };
    
    if colony.queen_jelly < jelly_cost {
        log::error!("Not enough queen jelly to transform larva");
        return;
    }
    
    // Special handling for first worker
    let is_first_worker = colony.population == 1 && ant_type == AntType::Worker;
    if is_first_worker {
        // First worker costs only 1 jelly
        colony.queen_jelly -= 1.0;
    } else {
        colony.queen_jelly -= jelly_cost;
    }
    
    colony.larvae -= 1;
    
    // Create the ant
    let (health, speed, damage) = get_ant_stats(ant_type);
    let current_time = spacetimedb::timestamp();
    
    // Set maturation time for young queens (5 minutes from now)
    let maturation_time = if ant_type == AntType::YoungQueen {
        Some(current_time + 300_000) // 5 minutes in milliseconds
    } else {
        None
    };
    
    let ant = Ant {
        id: 0, // autoinc
        colony_id,
        ant_type,
        x,
        y,
        z,
        health,
        max_health: health,
        carrying_resource: None,
        carrying_amount: 0.0,
        task: TaskType::Idle,
        target_x: None,
        target_y: None,
        target_z: None,
        speed,
        attack_damage: damage,
        jelly_consumption_rate: get_jelly_consumption_rate(ant_type),
        last_fed_at: current_time,
        trait_type: generate_random_trait_for_type(ant_type),
        maturation_time,
    };
    Ant::insert(ant);
    
    colony.population += 1;
    Colony::update_by_id(&colony_id, colony);
    
    log::info!("Larva transformed into {:?}", ant_type);
}

/// Royal workers produce queen jelly
#[spacetimedb(reducer)]
pub fn produce_jelly(ctx: ReducerContext, ant_id: u32) {
    let ant = match Ant::filter_by_id(&ant_id) {
        Some(a) => a,
        None => {
            log::error!("Ant not found: {}", ant_id);
            return;
        }
    };
    
    if ant.ant_type != AntType::RoyalWorker {
        log::error!("Only royal workers can produce jelly");
        return;
    }
    
    let mut colony = Colony::filter_by_id(&ant.colony_id).unwrap();
    if colony.player_id != ctx.sender {
        log::error!("Ant not owned by player");
        return;
    }
    
    // Check if in burrow
    let in_burrow = Chamber::iter()
        .any(|ch| ch.colony_id == colony.id && 
             ch.chamber_type == ChamberType::Burrow &&
             distance_3d(ant.x, ant.y, ant.z, ch.x, ch.y, ch.z) < 10.0);
    
    if !in_burrow {
        log::error!("Royal workers must be in a burrow to produce jelly");
        return;
    }
    
    // Check if has food to convert
    if colony.food < 5.0 {
        log::error!("Not enough food to convert to jelly");
        return;
    }
    
    // Convert food to jelly
    colony.food -= 5.0;
    colony.queen_jelly += 2.5; // 50% conversion rate
    Colony::update_by_id(&colony.id, colony);
    
    log::info!("Royal worker {} produced jelly", ant_id);
}

/// Deposit resources at storage
#[spacetimedb(reducer)]
pub fn deposit_resources(ctx: ReducerContext, ant_id: u32) {
    let mut ant = match Ant::filter_by_id(&ant_id) {
        Some(a) => a,
        None => {
            log::error!("Ant not found: {}", ant_id);
            return;
        }
    };
    
    // Verify ownership
    let mut colony = Colony::filter_by_id(&ant.colony_id).unwrap();
    if colony.player_id != ctx.sender {
        log::error!("Ant not owned by player");
        return;
    }
    
    // Check if ant is carrying resources
    if let Some(resource_type) = ant.carrying_resource {
        match resource_type {
            ResourceType::Food => colony.food += ant.carrying_amount,
            ResourceType::Minerals => colony.minerals += ant.carrying_amount,
            ResourceType::Larvae => colony.larvae += ant.carrying_amount as u32,
        }
        
        // Update player stats
        let mut player = Player::filter_by_id(&ctx.sender).unwrap();
        player.resources_gathered += ant.carrying_amount as u64;
        Player::update_by_id(&ctx.sender, player);
        
        // Clear ant's carrying
        ant.carrying_resource = None;
        ant.carrying_amount = 0.0;
        ant.task = TaskType::Idle;
        Ant::update_by_id(&ant_id, ant);
        
        Colony::update_by_id(&colony.id, colony);
        
        log::info!("Ant {} deposited resources", ant_id);
    }
}

/// Attack command for combat
#[spacetimedb(reducer)]
pub fn attack_target(ctx: ReducerContext, attacker_id: u32, target_id: u32) {
    let attacker = match Ant::filter_by_id(&attacker_id) {
        Some(a) => a,
        None => {
            log::error!("Attacker not found: {}", attacker_id);
            return;
        }
    };
    
    let mut target = match Ant::filter_by_id(&target_id) {
        Some(t) => t,
        None => {
            log::error!("Target not found: {}", target_id);
            return;
        }
    };
    
    // Verify ownership of attacker
    let attacker_colony = Colony::filter_by_id(&attacker.colony_id).unwrap();
    if attacker_colony.player_id != ctx.sender {
        log::error!("Attacker not owned by player");
        return;
    }
    
    // Check if in range (adjacent for melee)
    let distance = distance_3d(attacker.x, attacker.y, attacker.z, target.x, target.y, target.z);
    if distance > 5.0 {
        log::error!("Target out of range");
        return;
    }
    
    // Apply damage
    let damage = attacker.attack_damage;
    target.health = target.health.saturating_sub(damage);
    
    // Create battle event
    let battle = Battle {
        id: 0, // autoinc
        attacker_ant_id: attacker_id,
        defender_ant_id: target_id,
        x: target.x,
        y: target.y,
        z: target.z,
        damage_dealt: damage,
        timestamp: spacetimedb::timestamp(),
    };
    Battle::insert(battle);
    
    // Check if target died
    if target.health == 0 {
        // Remove ant
        Ant::delete_by_id(&target_id);
        
        // Update colony population
        let mut target_colony = Colony::filter_by_id(&target.colony_id).unwrap();
        target_colony.population = target_colony.population.saturating_sub(1);
        Colony::update_by_id(&target.colony_id, target_colony);
        
        log::info!("Ant {} killed ant {}", attacker_id, target_id);
    } else {
        Ant::update_by_id(&target_id, target);
        log::info!("Ant {} attacked ant {} for {} damage", attacker_id, target_id, damage);
    }
}

/// Lay pheromone trail
#[spacetimedb(reducer)]
pub fn lay_pheromone(ctx: ReducerContext, colony_id: u32, x: f32, y: f32, z: f32, pheromone_type: String) {
    // Verify colony ownership
    let colony = match Colony::filter_by_id(&colony_id) {
        Some(c) => c,
        None => {
            log::error!("Colony not found: {}", colony_id);
            return;
        }
    };
    
    if colony.player_id != ctx.sender {
        log::error!("Colony not owned by player");
        return;
    }
    
    let pheromone = Pheromone {
        id: 0, // autoinc
        colony_id,
        x,
        y,
        z,
        strength: 100.0,
        pheromone_type,
        created_at: spacetimedb::timestamp(),
    };
    Pheromone::insert(pheromone);
}

/// Toggle AI for a colony
#[spacetimedb(reducer)]
pub fn toggle_colony_ai(ctx: ReducerContext, colony_id: u32) {
    let mut colony = match Colony::filter_by_id(&colony_id) {
        Some(c) => c,
        None => {
            log::error!("Colony not found: {}", colony_id);
            return;
        }
    };
    
    if colony.player_id != ctx.sender {
        log::error!("Colony not owned by player");
        return;
    }
    
    colony.ai_enabled = !colony.ai_enabled;
    Colony::update_by_id(&colony_id, colony);
    
    log::info!("Colony {} AI toggled to: {}", colony_id, colony.ai_enabled);
}

/// Discover resources when scout explores
#[spacetimedb(reducer)]
pub fn discover_resources(ctx: ReducerContext, ant_id: u32) {
    let ant = match Ant::filter_by_id(&ant_id) {
        Some(a) => a,
        None => {
            log::error!("Ant not found: {}", ant_id);
            return;
        }
    };
    
    // Verify ownership
    let colony = Colony::filter_by_id(&ant.colony_id).unwrap();
    if colony.player_id != ctx.sender {
        log::error!("Ant not owned by player");
        return;
    }
    
    // Only scouts can discover resources
    if ant.ant_type != AntType::Scout {
        log::error!("Only scouts can discover resources");
        return;
    }
    
    // Find nearby resources within scout vision range (50 units)
    let scout_vision = 50.0;
    for resource in ResourceNode::iter() {
        let distance = distance_3d(ant.x, ant.y, ant.z, resource.x, resource.y, resource.z);
        if distance <= scout_vision {
            // Check if already discovered
            let already_discovered = DiscoveredResource::iter()
                .any(|dr| dr.colony_id == colony.id && dr.resource_id == resource.id);
            
            if !already_discovered {
                let discovered = DiscoveredResource {
                    id: 0, // autoinc
                    colony_id: colony.id,
                    resource_id: resource.id,
                    discovered_at: spacetimedb::timestamp(),
                };
                DiscoveredResource::insert(discovered);
                
                log::info!("Colony {} discovered resource {} at ({}, {}, {})", 
                    colony.id, resource.id, resource.x, resource.y, resource.z);
            }
        }
    }
    
    // Mark territory as explored
    let explored = ExploredTerritory {
        id: 0, // autoinc
        colony_id: colony.id,
        x: ant.x,
        y: ant.y,
        z: ant.z,
        discovered_at: spacetimedb::timestamp(),
        has_resources: ResourceNode::iter()
            .any(|r| distance_3d(ant.x, ant.y, ant.z, r.x, r.y, r.z) <= scout_vision),
        has_threats: false, // TODO: Check for enemy ants
        threat_level: 0,
    };
    ExploredTerritory::insert(explored);
}

/// Hive mind command: All units gather resources
#[spacetimedb(reducer)]
pub fn hive_command_gather(ctx: ReducerContext, colony_id: u32) {
    let colony = match Colony::filter_by_id(&colony_id) {
        Some(c) => c,
        None => {
            log::error!("Colony not found: {}", colony_id);
            return;
        }
    };
    
    if colony.player_id != ctx.sender {
        log::error!("Colony not owned by player");
        return;
    }
    
    // Find all workers and scouts
    let ants: Vec<Ant> = Ant::iter()
        .filter(|a| a.colony_id == colony_id && 
               (a.ant_type == AntType::Worker || a.ant_type == AntType::Scout))
        .collect();
    
    // Find nearest resource nodes
    let resource_nodes: Vec<ResourceNode> = ResourceNode::iter()
        .filter(|r| r.amount > 0.0)
        .collect();
    
    // Assign ants to nearest resources
    for ant in ants {
        if let Some(nearest_resource) = resource_nodes.iter()
            .min_by_key(|r| distance_3d(r.x, r.y, r.z, ant.x, ant.y, ant.z) as i32) {
            
            let mut ant_update = ant;
            ant_update.target_x = Some(nearest_resource.x);
            ant_update.target_y = Some(nearest_resource.y);
            ant_update.target_z = Some(nearest_resource.z);
            ant_update.task = TaskType::Gathering;
            Ant::update_by_id(&ant_update.id, ant_update);
        }
    }
    
    log::info!("Colony {} commanded to gather resources", colony_id);
}

/// Hive mind command: All units return to defend
#[spacetimedb(reducer)]
pub fn hive_command_defend(ctx: ReducerContext, colony_id: u32) {
    let colony = match Colony::filter_by_id(&colony_id) {
        Some(c) => c,
        None => {
            log::error!("Colony not found: {}", colony_id);
            return;
        }
    };
    
    if colony.player_id != ctx.sender {
        log::error!("Colony not owned by player");
        return;
    }
    
    // Find queen position
    let queen_pos = match colony.queen_id.and_then(|id| Ant::filter_by_id(&id)) {
        Some(queen) => (queen.x, queen.y, queen.z),
        None => {
            log::error!("No queen found for colony");
            return;
        }
    };
    
    // Command all ants to return to queen
    let ants: Vec<Ant> = Ant::iter()
        .filter(|a| a.colony_id == colony_id)
        .collect();
    
    for ant in ants {
        if ant.ant_type != AntType::Queen {
            let mut ant_update = ant;
            // Form defensive circle around queen
            let angle = (ant.id as f32) * 0.5;
            let radius = match ant.ant_type {
                AntType::Soldier | AntType::Major => 15.0,
                _ => 25.0,
            };
            ant_update.target_x = Some(queen_pos.0 + angle.cos() * radius);
            ant_update.target_y = Some(queen_pos.1 + angle.sin() * radius);
            ant_update.target_z = Some(queen_pos.2);
            ant_update.task = TaskType::Returning;
            Ant::update_by_id(&ant_update.id, ant_update);
        }
    }
    
    log::info!("Colony {} commanded to defend", colony_id);
}

/// Hive mind command: Send hunting party
#[spacetimedb(reducer)]
pub fn hive_command_hunt(ctx: ReducerContext, colony_id: u32, target_x: f32, target_y: f32, target_z: f32) {
    let colony = match Colony::filter_by_id(&colony_id) {
        Some(c) => c,
        None => {
            log::error!("Colony not found: {}", colony_id);
            return;
        }
    };
    
    if colony.player_id != ctx.sender {
        log::error!("Colony not owned by player");
        return;
    }
    
    // Select soldiers and majors for hunting party
    let hunting_party: Vec<Ant> = Ant::iter()
        .filter(|a| a.colony_id == colony_id && 
               (a.ant_type == AntType::Soldier || a.ant_type == AntType::Major))
        .collect();
    
    // Command hunting party to target location
    for ant in hunting_party {
        let mut ant_update = ant;
        ant_update.target_x = Some(target_x);
        ant_update.target_y = Some(target_y);
        ant_update.target_z = Some(target_z);
        ant_update.task = TaskType::Fighting;
        Ant::update_by_id(&ant_update.id, ant_update);
    }
    
    // Send one scout ahead
    if let Some(scout) = Ant::iter()
        .find(|a| a.colony_id == colony_id && a.ant_type == AntType::Scout) {
        
        let mut scout_update = scout;
        scout_update.target_x = Some(target_x);
        scout_update.target_y = Some(target_y);
        scout_update.target_z = Some(target_z);
        scout_update.task = TaskType::Exploring;
        Ant::update_by_id(&scout_update.id, scout_update);
    }
    
    log::info!("Colony {} hunting party dispatched to ({}, {}, {})", colony_id, target_x, target_y, target_z);
}

/// AI decision making - called periodically by the system
#[spacetimedb(reducer)]
pub fn colony_ai_tick(_ctx: ReducerContext) {
    let current_time = spacetimedb::timestamp();
    
    // Check for mature young queens
    for young_queen in Ant::iter().filter(|a| a.ant_type == AntType::YoungQueen) {
        if let Some(maturation_time) = young_queen.maturation_time {
            if current_time >= maturation_time {
                // Time to fly!
                log::info!("Young queen {} has matured and is flying away!", young_queen.id);
                
                // Get colony for player info
                if let Some(colony) = Colony::filter_by_id(&young_queen.colony_id) {
                    // Manually trigger nuptial flight for this queen
                    let ctx = ReducerContext {
                        sender: colony.player_id,
                        timestamp: current_time,
                    };
                    nuptial_flight(ctx, young_queen.id);
                }
            }
        }
    }
    
    // Process each colony with AI enabled
    for colony in Colony::iter().filter(|c| c.ai_enabled) {
        // Check queen health
        if let Some(queen_id) = colony.queen_id {
            if let Some(queen) = Ant::filter_by_id(&queen_id) {
                // Queen jelly depletes over time
                let mut colony_update = colony.clone();
                colony_update.queen_jelly = (colony_update.queen_jelly - 0.1).max(0.0);
                
                // If queen jelly is low, prioritize food gathering
                if colony_update.queen_jelly < 20.0 {
                    // Find idle workers and send them to gather food
                    let idle_workers: Vec<Ant> = Ant::iter()
                        .filter(|a| a.colony_id == colony.id && 
                                   a.ant_type == AntType::Worker && 
                                   a.task == TaskType::Idle)
                        .collect();
                    
                    // Find nearest food source
                    if let Some(food_node) = ResourceNode::iter()
                        .filter(|r| r.resource_type == ResourceType::Food && r.amount > 0.0)
                        .min_by_key(|r| distance_3d(r.x, r.y, r.z, queen.x, queen.y, queen.z) as i32) {
                        
                        // Send workers to gather
                        for worker in idle_workers.iter().take(3) {
                            let mut worker_update = worker.clone();
                            worker_update.target_x = Some(food_node.x);
                            worker_update.target_y = Some(food_node.y);
                            worker_update.target_z = Some(food_node.z);
                            worker_update.task = TaskType::Gathering;
                            Ant::update_by_id(&worker.id, worker_update);
                        }
                    }
                }
                
                // Scout for new territory
                let scout_count = Ant::iter()
                    .filter(|a| a.colony_id == colony.id && a.ant_type == AntType::Scout)
                    .count();
                
                if scout_count < 2 && colony_update.food >= 15.0 && colony_update.larvae >= 1 && colony_update.queen_jelly >= 2.5 {
                    // Spawn a scout
                    spawn_scout_at_colony(&colony);
                }
                
                // Replace dead workers
                let worker_count = Ant::iter()
                    .filter(|a| a.colony_id == colony.id && a.ant_type == AntType::Worker)
                    .count();
                
                if worker_count < 5 && colony_update.food >= 10.0 && colony_update.larvae >= 1 && colony_update.queen_jelly >= 2.0 {
                    // Spawn a worker
                    spawn_worker_at_colony(&colony);
                }
                
                // Convert queen jelly from food if needed
                if colony_update.queen_jelly < 50.0 && colony_update.food >= 20.0 {
                    colony_update.food -= 10.0;
                    colony_update.queen_jelly += 5.0;
                }
                
                Colony::update_by_id(&colony.id, colony_update);
            }
        }
    }
}

// Helper function to spawn scout
fn spawn_scout_at_colony(colony: &Colony) {
    if let Some(queen) = colony.queen_id.and_then(|id| Ant::filter_by_id(&id)) {
        let (health, speed, damage) = get_ant_stats(AntType::Scout);
        let scout = Ant {
            id: 0,
            colony_id: colony.id,
            ant_type: AntType::Scout,
            x: queen.x + 5.0,
            y: queen.y + 5.0,
            z: queen.z,
            health,
            max_health: health,
            carrying_resource: None,
            carrying_amount: 0.0,
            task: TaskType::Exploring,
            target_x: Some(queen.x + 100.0 * ((spacetimedb::timestamp() % 1000) as f32 / 1000.0 - 0.5)),
            target_y: Some(queen.y + 100.0 * ((spacetimedb::timestamp() % 1337) as f32 / 1337.0 - 0.5)),
            target_z: Some(queen.z),
            speed,
            attack_damage: damage,
            jelly_consumption_rate: get_jelly_consumption_rate(AntType::Scout),
            last_fed_at: spacetimedb::timestamp(),
            trait_type: generate_random_trait_for_type(AntType::Scout),
            maturation_time: None,
        };
        Ant::insert(scout);
    }
}

// Helper function to spawn worker
fn spawn_worker_at_colony(colony: &Colony) {
    if let Some(queen) = colony.queen_id.and_then(|id| Ant::filter_by_id(&id)) {
        let (health, speed, damage) = get_ant_stats(AntType::Worker);
        let worker = Ant {
            id: 0,
            colony_id: colony.id,
            ant_type: AntType::Worker,
            x: queen.x + 3.0,
            y: queen.y + 3.0,
            z: queen.z,
            health,
            max_health: health,
            carrying_resource: None,
            carrying_amount: 0.0,
            task: TaskType::Idle,
            target_x: None,
            target_y: None,
            target_z: None,
            speed,
            attack_damage: damage,
            jelly_consumption_rate: get_jelly_consumption_rate(AntType::Worker),
            last_fed_at: spacetimedb::timestamp(),
            trait_type: generate_random_trait_for_type(AntType::Worker),
        };
        Ant::insert(worker);
    }
}

/// Young queen flies away to start a new colony
#[spacetimedb(reducer)]
pub fn nuptial_flight(ctx: ReducerContext, queen_id: u32) {
    let young_queen = match Ant::filter_by_id(&queen_id) {
        Some(q) => q,
        None => {
            log::error!("Young queen not found: {}", queen_id);
            return;
        }
    };
    
    // Verify ownership and type
    let old_colony = Colony::filter_by_id(&young_queen.colony_id).unwrap();
    if old_colony.player_id != ctx.sender {
        log::error!("Young queen not owned by player");
        return;
    }
    
    if young_queen.ant_type != AntType::YoungQueen {
        log::error!("Only young queens can fly away");
        return;
    }
    
    // Update player stats
    let mut player = Player::filter_by_id(&ctx.sender).unwrap();
    player.queens_produced += 1;
    player.generations_survived += 1;
    
    // Calculate colony score for legacy bonus
    let colony_score = old_colony.food + old_colony.water + old_colony.minerals * 2.0 + 
                      old_colony.queen_jelly * 5.0 + (old_colony.population as f32) * 10.0;
    
    if colony_score > player.best_colony_score as f32 {
        player.best_colony_score = colony_score as u64;
    }
    
    Player::update_by_id(&ctx.sender, player);
    
    // Delete the young queen
    Ant::delete_by_id(&queen_id);
    
    // Update old colony population
    let mut colony_update = old_colony;
    colony_update.population -= 1;
    Colony::update_by_id(&colony_update.id, colony_update);
    
    // Create new colony at random location
    let timestamp = spacetimedb::timestamp();
    let new_x = ((timestamp % 1000) as f32 / 1000.0 - 0.5) * 300.0;
    let new_y = ((timestamp % 1337) as f32 / 1337.0 - 0.5) * 300.0;
    
    // Apply trait bonuses based on the young queen's trait
    let trait_bonus = young_queen.trait_type.unwrap_or(AntTrait::Survivor);
    
    let base_jelly = 20.0;
    let base_food = 20.0;
    let base_water = 10.0;
    let base_health = 200;
    
    let (jelly_bonus, food_bonus, water_bonus, health_bonus, larvae_bonus) = match trait_bonus {
        AntTrait::Fertile => (base_jelly * 1.2, base_food, base_water, base_health, 1),
        AntTrait::Matriarch => (base_jelly, base_food, base_water, base_health, 2), // Start with extra larvae
        AntTrait::Survivor => (base_jelly * 1.5, base_food, base_water, base_health, 0),
        _ => (base_jelly, base_food, base_water, base_health, 0), // Other traits don't affect starting resources
    };
    
    // Add generation bonus (5% per generation)
    let gen_multiplier = 1.0 + (player.generations_survived as f32 * 0.05);
    
    // Create new colony with trait bonuses
    let new_colony = Colony {
        id: 0, // autoinc
        player_id: ctx.sender,
        queen_id: None,
        food: food_bonus * gen_multiplier,
        water: water_bonus * gen_multiplier,
        minerals: 0.0,
        larvae: 1 + larvae_bonus, // Start with bonus larvae based on trait
        queen_jelly: jelly_bonus * gen_multiplier,
        population: 1,
        territory_radius: 30.0,
        created_at: spacetimedb::timestamp(),
        ai_enabled: false,
        queen_trait: Some(trait_bonus),
    };
    let new_colony_id = Colony::insert(new_colony).unwrap().id;
    
    // Create new queen (transformed from young queen)
    let (_, speed, damage) = get_ant_stats(AntType::Queen);
    let new_queen = Ant {
        id: 0, // autoinc
        colony_id: new_colony_id,
        ant_type: AntType::Queen,
        x: new_x,
        y: new_y,
        z: -5.0,
        health: health_bonus,
        max_health: health_bonus,
        carrying_resource: None,
        carrying_amount: 0.0,
        task: TaskType::Idle,
        target_x: None,
        target_y: None,
        target_z: None,
        speed,
        attack_damage: damage,
        jelly_consumption_rate: 0.0, // Queens don't consume jelly
        last_fed_at: spacetimedb::timestamp(),
        trait_type: Some(trait_bonus), // Keep the trait
        maturation_time: None,
    };
    let new_queen_id = Ant::insert(new_queen).unwrap().id;
    
    // Update colony with queen reference
    let mut new_colony_update = Colony::filter_by_id(&new_colony_id).unwrap();
    new_colony_update.queen_id = Some(new_queen_id);
    Colony::update_by_id(&new_colony_id, new_colony_update);
    
    // Create initial throne room
    let throne = Chamber {
        id: 0, // autoinc
        colony_id: new_colony_id,
        chamber_type: ChamberType::ThroneRoom,
        x: new_x,
        y: new_y,
        z: -5.0,
        level: 1,
        capacity: 1,
    };
    Chamber::insert(throne);
    
    log::info!("Young queen {} flew away and started new colony {} with trait {:?} (Generation {})", 
        queen_id, new_colony_id, trait_bonus, player.generations_survived);
}

#[spacetimedb(init)]
pub fn init() {
    // Create initial resource nodes
    let resource_positions = vec![
        (50.0, 50.0, 0.0, ResourceType::Food),
        (-50.0, -50.0, 0.0, ResourceType::Food),
        (100.0, -100.0, -20.0, ResourceType::Minerals),
        (-100.0, 100.0, -20.0, ResourceType::Minerals),
    ];
    
    for (x, y, z, resource_type) in resource_positions {
        let node = ResourceNode {
            id: 0, // autoinc
            resource_type,
            x,
            y,
            z,
            amount: 1000.0,
            max_amount: 1000.0,
            regeneration_rate: 1.0,
        };
        ResourceNode::insert(node);
    }
    
    log::info!("Insect Colony Wars initialized");
}