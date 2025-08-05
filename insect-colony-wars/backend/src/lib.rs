use spacetimedb::{spacetimedb, Identity, ReducerContext};

// ===== ENUMS =====

#[derive(SpacetimeType, Debug, Clone, Copy, PartialEq)]
pub enum AntType {
    Queen,
    Worker,
    Soldier,
    Scout,
    Major,
}

#[derive(SpacetimeType, Debug, Clone, Copy, PartialEq)]
pub enum ResourceType {
    Food,
    Minerals,
    Larvae,
}

#[derive(SpacetimeType, Debug, Clone, Copy, PartialEq)]
pub enum ChamberType {
    Nursery,
    Storage,
    Barracks,
    ThroneRoom,
}

#[derive(SpacetimeType, Debug, Clone, Copy, PartialEq)]
pub enum TaskType {
    Idle,
    Gathering,
    Building,
    Fighting,
    Exploring,
    Returning,
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
    pub minerals: f32,
    pub larvae: u32,
    pub queen_jelly: f32, // Queen's life force
    pub population: u32,
    pub territory_radius: f32,
    pub created_at: u64,
    pub ai_enabled: bool, // Auto-management toggle
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

// ===== HELPER FUNCTIONS =====

fn get_ant_stats(ant_type: AntType) -> (u32, f32, u32) {
    // Returns (max_health, speed, attack_damage)
    match ant_type {
        AntType::Queen => (200, 0.5, 0),
        AntType::Worker => (50, 2.0, 5),
        AntType::Soldier => (100, 1.5, 20),
        AntType::Scout => (30, 3.0, 10),
        AntType::Major => (150, 1.0, 30),
    }
}

fn distance_3d(x1: f32, y1: f32, z1: f32, x2: f32, y2: f32, z2: f32) -> f32 {
    ((x2 - x1).powi(2) + (y2 - y1).powi(2) + (z2 - z1).powi(2)).sqrt()
}

fn can_afford_ant(colony: &Colony, ant_type: AntType) -> bool {
    let jelly_cost = match ant_type {
        AntType::Worker => 2.0,
        AntType::Soldier => 3.0,
        AntType::Scout => 2.5,
        AntType::Major => 5.0,
        AntType::Queen => 999.0, // Can't spawn queens
    };
    
    colony.queen_jelly >= jelly_cost && match ant_type {
        AntType::Worker => colony.food >= 10.0 && colony.larvae >= 1,
        AntType::Soldier => colony.food >= 20.0 && colony.larvae >= 1,
        AntType::Scout => colony.food >= 15.0 && colony.larvae >= 1,
        AntType::Major => colony.food >= 50.0 && colony.minerals >= 10.0 && colony.larvae >= 2,
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
    
    // Create colony
    let colony = Colony {
        id: 0, // autoinc
        player_id: ctx.sender,
        queen_id: None,
        food: 100.0,
        minerals: 0.0,
        larvae: 5,
        queen_jelly: 100.0, // Starting queen jelly
        population: 1,
        territory_radius: 50.0,
        created_at: spacetimedb::timestamp(),
        ai_enabled: true, // AI enabled by default
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
    
    // Deduct resources
    let jelly_cost = match ant_type {
        AntType::Worker => 2.0,
        AntType::Soldier => 3.0,
        AntType::Scout => 2.5,
        AntType::Major => 5.0,
        AntType::Queen => return, // Can't spawn queens
    };
    
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
    for ant_id in ant_ids {
        let mut ant = match Ant::filter_by_id(&ant_id) {
            Some(a) => a,
            None => continue,
        };
        
        // Verify ownership
        let colony = Colony::filter_by_id(&ant.colony_id).unwrap();
        if colony.player_id != ctx.sender {
            continue;
        }
        
        // Set movement target
        ant.target_x = Some(target_x);
        ant.target_y = Some(target_y);
        ant.target_z = Some(target_z);
        ant.task = TaskType::Exploring;
        
        Ant::update_by_id(&ant_id, ant);
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

/// Build a chamber
#[spacetimedb(reducer)]
pub fn build_chamber(ctx: ReducerContext, colony_id: u32, chamber_type: ChamberType, x: f32, y: f32, z: f32) {
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
    
    // Check resources for chamber
    let (food_cost, mineral_cost) = match chamber_type {
        ChamberType::Nursery => (50.0, 10.0),
        ChamberType::Storage => (30.0, 20.0),
        ChamberType::Barracks => (100.0, 50.0),
        ChamberType::ThroneRoom => (200.0, 100.0),
    };
    
    if colony.food < food_cost || colony.minerals < mineral_cost {
        log::error!("Insufficient resources for chamber");
        return;
    }
    
    // Deduct resources
    colony.food -= food_cost;
    colony.minerals -= mineral_cost;
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

/// AI decision making - called periodically by the system
#[spacetimedb(reducer)]
pub fn colony_ai_tick(_ctx: ReducerContext) {
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
        };
        Ant::insert(worker);
    }
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