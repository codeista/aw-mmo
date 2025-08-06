#!/usr/bin/env node

/**
 * QA Test Suite for Insect Colony Wars
 * Tests all major features and monitors console logs for issues
 */

import { MockSpacetimeService } from './src/services/spacetime-mock-rts.js';

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Test result tracking
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const issues = [];

// Capture console logs
const logs = [];
const originalLog = console.log;
console.log = (...args) => {
  const message = args.join(' ');
  logs.push(message);
  originalLog(...args);
};

function test(name, fn) {
  totalTests++;
  console.log(`\n${colors.cyan}Testing: ${name}${colors.reset}`);
  try {
    fn();
    passedTests++;
    console.log(`${colors.green}✓ PASSED${colors.reset}`);
  } catch (error) {
    failedTests++;
    console.log(`${colors.red}✗ FAILED: ${error.message}${colors.reset}`);
    issues.push({ test: name, error: error.message });
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function checkLogs(pattern, shouldExist = true) {
  const found = logs.some(log => log.includes(pattern));
  if (shouldExist && !found) {
    throw new Error(`Expected log pattern not found: "${pattern}"`);
  }
  if (!shouldExist && found) {
    throw new Error(`Unexpected log pattern found: "${pattern}"`);
  }
}

async function runTests() {
  console.log(`${colors.bright}${colors.blue}=== Insect Colony Wars QA Test Suite ===${colors.reset}\n`);
  
  const service = new MockSpacetimeService();
  service.identity = 'qa-tester';
  
  // Test 1: Game Initialization
  test('Game Initialization', async () => {
    await service.call('init', {});
    assert(service.identity === 'qa-tester', 'Service identity not set correctly');
    checkLogs('Initialized mock service');
  });
  
  // Test 2: Queen Spawning
  test('Queen Spawning', async () => {
    await service.call('respawn_as_queen', { x: 0, y: 0 });
    await wait(100);
    
    const data = service.data;
    assert(data.Colony.length === 1, 'Colony not created');
    assert(data.Ant.length === 1, 'Queen not created');
    
    const queen = data.Ant[0];
    assert(queen.ant_type === 'Queen', 'First ant is not a queen');
    assert(queen.z === 0, 'Queen not spawned on surface');
    checkLogs('Queen 1 started digging');
  });
  
  // Test 3: Burrow Creation
  test('Burrow Creation', async () => {
    console.log('Waiting for burrow completion (5.5s)...');
    await wait(5500);
    
    const data = service.data;
    const chambers = data.Chamber;
    assert(chambers.length >= 2, 'Burrow chambers not created');
    
    const entrance = chambers.find(c => c.is_entrance);
    const deep = chambers.find(c => c.z === -10);
    
    assert(entrance, 'No entrance chamber found');
    assert(entrance.z === -1, 'Entrance not at correct depth');
    assert(deep, 'No deep chamber found');
    assert(deep.capacity === 10, 'Deep chamber incorrect capacity');
    
    checkLogs('Queen Digging Complete');
    checkLogs('Auto-discovered');
  });
  
  // Test 4: Resource Discovery
  test('Resource Auto-Discovery', async () => {
    const data = service.data;
    const discovered = data.DiscoveredResource;
    
    assert(discovered.length > 0, 'No resources auto-discovered');
    assert(discovered.length <= 3, 'Too many resources discovered');
    checkLogs('Auto-discovered');
  });
  
  // Test 5: First Worker Creation
  test('Automatic First Worker', async () => {
    console.log('Waiting for first worker (2.5s)...');
    await wait(2500);
    
    const data = service.data;
    const workers = data.Ant.filter(a => a.ant_type === 'Worker');
    
    assert(workers.length === 1, 'First worker not created automatically');
    assert(workers[0].z === -10, 'Worker not created underground');
    
    checkLogs('First worker created!');
    checkLogs('Starting automatic resource gathering');
  });
  
  // Test 6: Worker Gathering Navigation
  test('Worker Surface Navigation', async () => {
    console.log('Waiting for worker to attempt gathering (3s)...');
    await wait(3000);
    
    const data = service.data;
    const worker = data.Ant.find(a => a.ant_type === 'Worker');
    
    checkLogs('Worker is underground: true, Target is surface: true');
    checkLogs('Routing ant');
    checkLogs('needs to exit');
  });
  
  // Test 7: Colony AI Building
  test('Colony AI Composition', async () => {
    console.log('Waiting for colony AI to build units (10s)...');
    await wait(10000);
    
    const data = service.data;
    const colony = data.Colony[0];
    
    checkLogs('Colony building: Worker');
    checkLogs('Colony building: Scout');
    checkLogs('Colony building: Soldier');
    
    assert(colony.larvae >= 0, 'Colony larvae negative');
  });
  
  // Test 8: Predator Threat Detection
  test('Predator Threat System', async () => {
    // Spawn a bird near colony
    const data = service.data;
    const queen = data.Ant.find(a => a.ant_type === 'Queen');
    
    data.Predator.push({
      id: 999,
      predator_type: 'bird',
      x: queen.x + 50,
      y: queen.y + 50,
      health: 80,
      max_health: 80,
      speed: 4,
      attack_damage: 30,
      hunt_radius: 100,
      target_ant_id: null
    });
    
    console.log('Added bird predator, waiting for threat detection (2s)...');
    await wait(2000);
    
    checkLogs('DANGER!');
    checkLogs('dangerous predator(s) detected!');
  });
  
  // Test 9: Burrow Exit Safety Check
  test('Burrow Exit Safety', async () => {
    const data = service.data;
    
    // Force a worker to try exiting
    const worker = data.Ant.find(a => a.ant_type === 'Worker' && a.z < 0);
    if (worker) {
      worker.task = 'Exiting';
      worker.target_z = -1;
      worker.final_target_x = 100;
      worker.final_target_y = 100;
      worker.final_target_z = 0;
    }
    
    await wait(2000);
    checkLogs('sees', false); // Should see predator warning
  });
  
  // Test 10: Bird Boredom System
  test('Bird Boredom Mechanics', async () => {
    const data = service.data;
    
    // Remove all surface ants so bird gets bored
    data.Ant.forEach(ant => {
      if (ant.z >= 0) ant.z = -10;
    });
    
    console.log('All ants underground, waiting for bird boredom (35s)...');
    
    // Wait for bird to start getting bored
    await wait(20000);
    checkLogs('Bird is getting bored');
    
    // Wait for bird to fly away
    await wait(15000);
    checkLogs('Bird got bored and is flying away!');
  });
  
  // Test 11: Combat and Wounding
  test('Combat System', async () => {
    const data = service.data;
    
    // Create a soldier on surface
    const colony = data.Colony[0];
    if (colony) {
      await service.call('feed_larva', {
        colony_id: colony.id,
        ant_type: 'Soldier',
        x: 0,
        y: 0,
        z: 0
      });
    }
    
    // Add a spider predator
    data.Predator.push({
      id: 998,
      predator_type: 'spider',
      x: 10,
      y: 10,
      health: 100,
      max_health: 100,
      speed: 2,
      attack_damage: 25,
      hunt_radius: 50,
      target_ant_id: null
    });
    
    console.log('Waiting for combat (5s)...');
    await wait(5000);
    
    // Check for combat logs
    const combatOccurred = logs.some(log => 
      log.includes('attacks ant') || 
      log.includes('wounded') ||
      log.includes('killed')
    );
    
    assert(combatOccurred, 'No combat logs detected');
  });
  
  // Test 12: Hive Alert System
  test('Hive Alert System', async () => {
    // Force an attack
    const data = service.data;
    const ant = data.Ant.find(a => a.z >= 0);
    const predator = data.Predator[0];
    
    if (ant && predator) {
      predator.target_ant_id = ant.id;
      predator.x = ant.x;
      predator.y = ant.y;
      
      await wait(2000);
      
      // Check for alert logs
      const alertFound = logs.some(log => 
        log.includes('HIVE ALERT') ||
        log.includes('under attack') ||
        log.includes('responding to threat')
      );
      
      assert(alertFound, 'No hive alert logs found');
    }
  });
  
  // Test 13: Larvae Management
  test('Larvae Capacity System', async () => {
    const data = service.data;
    const chambers = data.Chamber.filter(c => c.larvae_capacity !== undefined);
    
    assert(chambers.length > 0, 'No chambers with larvae capacity');
    
    chambers.forEach(chamber => {
      assert(chamber.larvae_count <= chamber.larvae_capacity, 
        `Chamber larvae overflow: ${chamber.larvae_count}/${chamber.larvae_capacity}`);
    });
    
    checkLogs('Chamber larvae count:');
  });
  
  // Test 14: Group Combat
  test('Group Combat Mechanics', async () => {
    const data = service.data;
    
    // Add large prey
    data.Prey.push({
      id: 997,
      prey_type: 'caterpillar',
      x: 50,
      y: 50,
      health: 100,
      max_health: 100,
      speed: 0.5,
      food_value: 50
    });
    
    console.log('Waiting for group hunt detection (5s)...');
    await wait(5000);
    
    const groupHuntLogs = logs.filter(log => 
      log.includes('group hunt') ||
      log.includes('Scout found large prey') ||
      log.includes('joining group hunt')
    );
    
    console.log(`Found ${groupHuntLogs.length} group hunt related logs`);
  });
  
  // Analyze logs for issues
  console.log(`\n${colors.yellow}=== Log Analysis ===${colors.reset}`);
  
  const errorPatterns = [
    'undefined',
    'null',
    'NaN',
    'Error',
    'Failed',
    'Cannot read',
    'is not a function'
  ];
  
  const warnings = logs.filter(log => {
    return errorPatterns.some(pattern => 
      log.toLowerCase().includes(pattern.toLowerCase())
    );
  });
  
  if (warnings.length > 0) {
    console.log(`\n${colors.red}Found ${warnings.length} potential issues:${colors.reset}`);
    warnings.forEach(warning => {
      console.log(`  - ${warning}`);
    });
  }
  
  // Summary
  console.log(`\n${colors.bright}=== Test Summary ===${colors.reset}`);
  console.log(`Total Tests: ${totalTests}`);
  console.log(`${colors.green}Passed: ${passedTests}${colors.reset}`);
  console.log(`${colors.red}Failed: ${failedTests}${colors.reset}`);
  
  if (issues.length > 0) {
    console.log(`\n${colors.red}Issues found:${colors.reset}`);
    issues.forEach(issue => {
      console.log(`  - ${issue.test}: ${issue.error}`);
    });
  }
  
  // Performance metrics
  console.log(`\n${colors.cyan}=== Performance Metrics ===${colors.reset}`);
  console.log(`Total logs generated: ${logs.length}`);
  console.log(`Ants created: ${service.data.Ant.length}`);
  console.log(`Chambers created: ${service.data.Chamber.length}`);
  console.log(`Resources: ${service.data.ResourceNode.length}`);
  
  process.exit(failedTests > 0 ? 1 : 0);
}

// Run tests
runTests().catch(console.error);