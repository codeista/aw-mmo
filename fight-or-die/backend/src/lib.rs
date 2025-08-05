use spacetimedb::{spacetimedb, Identity, ReducerContext};

// ===== ENUMS =====

/// Terrain types that affect combat defense values
#[derive(SpacetimeType, Debug, Clone, Copy, PartialEq)]
pub enum TerrainType {
    Plains,    // No defense bonus
    Forest,    // -10 damage taken
    Mountain,  // -20 damage taken
}

/// Game state tracking
#[derive(SpacetimeType, Debug, Clone, Copy, PartialEq)]
pub enum GameStatus {
    WaitingForPlayers,
    InProgress,
    Finished,
}

// ===== TABLES =====

/// Player information stored in the database
#[spacetimedb(table)]
pub struct Player {
    #[primary_key]
    pub id: Identity,
    pub username: String,
    pub created_at: u64,
}

/// Game session tracking - manages matches between two players
#[spacetimedb(table)]
pub struct Game {
    #[primary_key]
    #[autoinc]
    pub id: u32,
    pub player1: Identity,
    pub player2: Option<Identity>,
    pub current_turn: Identity,
    pub status: GameStatus,
    pub winner: Option<Identity>,
    pub created_at: u64,
}

/// 5x5 game board with terrain data
#[spacetimedb(table)]
pub struct Board {
    #[primary_key]
    pub game_id: u32,
    // Terrain stored as string: P=Plains, F=Forest, M=Mountain
    // 25 characters representing 5x5 grid left-to-right, top-to-bottom
    pub terrain_data: String,
}

/// Combat unit - one per player in Phase 1
#[spacetimedb(table)]
pub struct Unit {
    #[primary_key]
    #[autoinc]
    pub id: u32,
    pub game_id: u32,
    pub owner: Identity,
    pub x: u8,              // 0-4 board position
    pub y: u8,              // 0-4 board position
    pub hp: i32,            // Health points (max 100)
    pub movement_left: u8,  // Movement points this turn (max 3)
    pub has_attacked: bool, // Can only attack once per turn
}

/// Log of all game actions for replay/debugging
#[spacetimedb(table)]
pub struct GameAction {
    #[primary_key]
    #[autoinc]
    pub id: u32,
    pub game_id: u32,
    pub player: Identity,
    pub action_type: String, // "move" or "attack"
    pub details: String,     // JSON with action specifics
    pub timestamp: u64,
}

// ===== HELPER FUNCTIONS =====

/// Convert terrain type to defense value (damage reduction)
fn get_terrain_defense(terrain: TerrainType) -> i32 {
    match terrain {
        TerrainType::Plains => 0,
        TerrainType::Forest => 1,
        TerrainType::Mountain => 2,
    }
}

/// Generate a 5x5 board with strategic terrain placement
fn generate_random_board() -> Vec<Vec<TerrainType>> {
    let mut board = vec![vec![TerrainType::Plains; 5]; 5];
    
    // Add forests for medium defense positions
    board[1][1] = TerrainType::Forest;
    board[3][3] = TerrainType::Forest;
    board[2][1] = TerrainType::Forest;
    board[1][3] = TerrainType::Forest;
    board[3][1] = TerrainType::Forest;
    
    // Center mountain provides strategic high ground
    board[2][2] = TerrainType::Mountain;
    
    board
}

fn serialize_board(board: &Vec<Vec<TerrainType>>) -> String {
    // Simple serialization for MVP
    let mut result = String::new();
    for row in board {
        for terrain in row {
            match terrain {
                TerrainType::Plains => result.push('P'),
                TerrainType::Forest => result.push('F'),
                TerrainType::Mountain => result.push('M'),
            }
        }
    }
    result
}

fn deserialize_board(data: &str) -> Vec<Vec<TerrainType>> {
    let mut board = vec![vec![TerrainType::Plains; 5]; 5];
    let chars: Vec<char> = data.chars().collect();
    
    for i in 0..5 {
        for j in 0..5 {
            let idx = i * 5 + j;
            if idx < chars.len() {
                board[i][j] = match chars[idx] {
                    'F' => TerrainType::Forest,
                    'M' => TerrainType::Mountain,
                    _ => TerrainType::Plains,
                };
            }
        }
    }
    
    board
}

/// Check if two positions are adjacent (no diagonal)
fn is_adjacent(x1: u8, y1: u8, x2: u8, y2: u8) -> bool {
    let dx = (x1 as i32 - x2 as i32).abs();
    let dy = (y1 as i32 - y2 as i32).abs();
    (dx == 1 && dy == 0) || (dx == 0 && dy == 1)
}

/// Calculate Manhattan distance for movement
fn calculate_distance(x1: u8, y1: u8, x2: u8, y2: u8) -> u8 {
    ((x1 as i32 - x2 as i32).abs() + (y1 as i32 - y2 as i32).abs()) as u8
}

// ===== REDUCERS =====

/// Create a new player account
#[spacetimedb(reducer)]
pub fn create_player(ctx: ReducerContext, username: String) {
    // Check if player already exists
    if Player::filter_by_id(&ctx.sender).is_some() {
        log::info!("Player already exists: {:?}", ctx.sender);
        return;
    }
    
    let player = Player {
        id: ctx.sender,
        username,
        created_at: spacetimedb::timestamp(),
    };
    Player::insert(player);
    log::info!("Player created: {:?}", ctx.sender);
}

/// Create a new game session - player becomes player1
#[spacetimedb(reducer)]
pub fn create_game(ctx: ReducerContext) {
    // Check if player exists
    if Player::filter_by_id(&ctx.sender).is_none() {
        log::error!("Player not found: {:?}", ctx.sender);
        return;
    }
    
    // Create new game
    let game = Game {
        id: 0, // autoinc
        player1: ctx.sender,
        player2: None,
        current_turn: ctx.sender,
        status: GameStatus::WaitingForPlayers,
        winner: None,
        created_at: spacetimedb::timestamp(),
    };
    Game::insert(game).unwrap();
    
    // Get the created game
    let created_game = Game::filter_by_player1(&ctx.sender)
        .find(|g| g.status == GameStatus::WaitingForPlayers)
        .unwrap();
    
    // Create board
    let board_data = serialize_board(&generate_random_board());
    let board = Board {
        game_id: created_game.id,
        terrain_data: board_data,
    };
    Board::insert(board);
    
    // Create player 1's unit at corner (0,0)
    let unit1 = Unit {
        id: 0, // autoinc
        game_id: created_game.id,
        owner: ctx.sender,
        x: 0,
        y: 0,
        hp: 100,
        movement_left: 3,
        has_attacked: false,
    };
    Unit::insert(unit1);
    
    log::info!("Game created: {}", created_game.id);
}

/// Join an existing game as player2
#[spacetimedb(reducer)]
pub fn join_game(ctx: ReducerContext, game_id: u32) {
    // Check if player exists
    if Player::filter_by_id(&ctx.sender).is_none() {
        log::error!("Player not found: {:?}", ctx.sender);
        return;
    }
    
    // Get game
    let mut game = match Game::filter_by_id(&game_id) {
        Some(g) => g,
        None => {
            log::error!("Game not found: {}", game_id);
            return;
        }
    };
    
    // Check if game is waiting for players
    if game.status != GameStatus::WaitingForPlayers {
        log::error!("Game not accepting players: {}", game_id);
        return;
    }
    
    // Check if player is already in game
    if game.player1 == ctx.sender {
        log::error!("Player already in game: {:?}", ctx.sender);
        return;
    }
    
    // Join as player 2
    game.player2 = Some(ctx.sender);
    game.status = GameStatus::InProgress;
    Game::update_by_id(&game_id, game);
    
    // Create player 2's unit at opposite corner (4,4)
    let unit2 = Unit {
        id: 0, // autoinc
        game_id: game_id,
        owner: ctx.sender,
        x: 4,
        y: 4,
        hp: 100,
        movement_left: 3,
        has_attacked: false,
    };
    Unit::insert(unit2);
    
    log::info!("Player {:?} joined game {}", ctx.sender, game_id);
}

/// Move a unit to a new position (costs movement points)
#[spacetimedb(reducer)]
pub fn move_unit(ctx: ReducerContext, game_id: u32, unit_id: u32, new_x: u8, new_y: u8) {
    // Validate game and turn
    let game = match Game::filter_by_id(&game_id) {
        Some(g) => g,
        None => {
            log::error!("Game not found: {}", game_id);
            return;
        }
    };
    
    if game.status != GameStatus::InProgress {
        log::error!("Game not in progress: {}", game_id);
        return;
    }
    
    if game.current_turn != ctx.sender {
        log::error!("Not player's turn: {:?}", ctx.sender);
        return;
    }
    
    // Get unit
    let mut unit = match Unit::filter_by_id(&unit_id) {
        Some(u) => u,
        None => {
            log::error!("Unit not found: {}", unit_id);
            return;
        }
    };
    
    if unit.owner != ctx.sender {
        log::error!("Unit not owned by player: {}", unit_id);
        return;
    }
    
    if unit.game_id != game_id {
        log::error!("Unit not in this game: {}", unit_id);
        return;
    }
    
    // Validate move
    if new_x >= 5 || new_y >= 5 {
        log::error!("Invalid position: {},{}", new_x, new_y);
        return;
    }
    
    let distance = calculate_distance(unit.x, unit.y, new_x, new_y);
    if distance > unit.movement_left {
        log::error!("Not enough movement: {} > {}", distance, unit.movement_left);
        return;
    }
    
    // Check if destination is occupied
    if let Some(_) = Unit::iter()
        .find(|u| u.game_id == game_id && u.x == new_x && u.y == new_y && u.hp > 0) {
        log::error!("Destination occupied: {},{}", new_x, new_y);
        return;
    }
    
    // Move unit
    unit.x = new_x;
    unit.y = new_y;
    unit.movement_left -= distance;
    Unit::update_by_id(&unit_id, unit);
    
    // Log action
    let action = GameAction {
        id: 0, // autoinc
        game_id,
        player: ctx.sender,
        action_type: "move".to_string(),
        details: format!("{{\"unit_id\":{},\"to\":[{},{}]}}", unit_id, new_x, new_y),
        timestamp: spacetimedb::timestamp(),
    };
    GameAction::insert(action);
    
    log::info!("Unit {} moved to {},{}", unit_id, new_x, new_y);
}

/// Attack an adjacent enemy unit
#[spacetimedb(reducer)]
pub fn attack_unit(ctx: ReducerContext, game_id: u32, attacker_id: u32, target_id: u32) {
    // Validate game and turn
    let game = match Game::filter_by_id(&game_id) {
        Some(g) => g,
        None => {
            log::error!("Game not found: {}", game_id);
            return;
        }
    };
    
    if game.status != GameStatus::InProgress {
        log::error!("Game not in progress: {}", game_id);
        return;
    }
    
    if game.current_turn != ctx.sender {
        log::error!("Not player's turn: {:?}", ctx.sender);
        return;
    }
    
    // Get units
    let mut attacker = match Unit::filter_by_id(&attacker_id) {
        Some(u) => u,
        None => {
            log::error!("Attacker not found: {}", attacker_id);
            return;
        }
    };
    
    let mut target = match Unit::filter_by_id(&target_id) {
        Some(u) => u,
        None => {
            log::error!("Target not found: {}", target_id);
            return;
        }
    };
    
    // Validate attack
    if attacker.owner != ctx.sender {
        log::error!("Attacker not owned by player: {}", attacker_id);
        return;
    }
    
    if attacker.game_id != game_id || target.game_id != game_id {
        log::error!("Units not in this game");
        return;
    }
    
    if attacker.has_attacked {
        log::error!("Unit already attacked: {}", attacker_id);
        return;
    }
    
    if target.hp <= 0 {
        log::error!("Target already dead: {}", target_id);
        return;
    }
    
    if !is_adjacent(attacker.x, attacker.y, target.x, target.y) {
        log::error!("Target not adjacent");
        return;
    }
    
    // Get terrain defense
    let board = Board::filter_by_game_id(&game_id).unwrap();
    let terrain_map = deserialize_board(&board.terrain_data);
    let target_terrain = terrain_map[target.y as usize][target.x as usize];
    let defense = get_terrain_defense(target_terrain);
    
    // Calculate damage
    let base_damage = 30;
    let final_damage = base_damage - (defense * 10);
    
    // Apply damage
    target.hp -= final_damage;
    if target.hp < 0 {
        target.hp = 0;
    }
    Unit::update_by_id(&target_id, target);
    
    // Mark attacker as having attacked
    attacker.has_attacked = true;
    Unit::update_by_id(&attacker_id, attacker);
    
    // Log action
    let action = GameAction {
        id: 0, // autoinc
        game_id,
        player: ctx.sender,
        action_type: "attack".to_string(),
        details: format!("{{\"attacker_id\":{},\"target_id\":{},\"damage\":{}}}", 
                        attacker_id, target_id, final_damage),
        timestamp: spacetimedb::timestamp(),
    };
    GameAction::insert(action);
    
    // Check for victory
    if target.hp == 0 {
        let mut game_update = game;
        game_update.status = GameStatus::Finished;
        game_update.winner = Some(ctx.sender);
        Game::update_by_id(&game_id, game_update);
        log::info!("Game {} won by {:?}", game_id, ctx.sender);
    }
    
    log::info!("Unit {} attacked unit {} for {} damage", attacker_id, target_id, final_damage);
}

/// End current player's turn and switch to opponent
#[spacetimedb(reducer)]
pub fn end_turn(ctx: ReducerContext, game_id: u32) {
    // Get game
    let mut game = match Game::filter_by_id(&game_id) {
        Some(g) => g,
        None => {
            log::error!("Game not found: {}", game_id);
            return;
        }
    };
    
    if game.status != GameStatus::InProgress {
        log::error!("Game not in progress: {}", game_id);
        return;
    }
    
    if game.current_turn != ctx.sender {
        log::error!("Not player's turn: {:?}", ctx.sender);
        return;
    }
    
    // Switch turn
    let player2 = game.player2.unwrap();
    game.current_turn = if game.current_turn == game.player1 {
        player2
    } else {
        game.player1
    };
    Game::update_by_id(&game_id, game);
    
    // Reset units for next player
    for mut unit in Unit::iter().filter(|u| u.game_id == game_id && u.owner == game.current_turn) {
        unit.movement_left = 3;
        unit.has_attacked = false;
        Unit::update_by_id(&unit.id, unit);
    }
    
    log::info!("Turn ended. Now {:?}'s turn", game.current_turn);
}

#[spacetimedb(init)]
pub fn init() {
    log::info!("Game module initialized");
}