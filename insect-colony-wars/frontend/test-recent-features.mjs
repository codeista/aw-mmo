#!/usr/bin/env node

/**
 * Test recent features: predator threats, hive alerts, burrow safety
 */

import { MockSpacetimeService } from './src/services/spacetime-mock-rts.js';

const service = new MockSpacetimeService();
service.identity = 'test-player';

// Track logs
const logs = [];
const originalLog = console.log;
console.log = (...args) => {
  const message = args.join(' ');
  logs.push({ time: Date.now(), message });
  originalLog(`[${new Date().toISOString().substr(11, 8)}]`, ...args);
};

async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testRecentFeatures() {
  console.log('🧪 Testing Recent Features\n');
  
  // Initialize
  await service.call('init', {});
  await service.call('respawn_as_queen', { x: 0, y: 0 });
  
  console.log('⏳ Waiting for colony setup (8s)...\n');
  await wait(8000);
  
  const data = service.data;
  
  // Status report
  console.log('📊 Colony Status:');
  console.log(`- Ants: ${data.Ant.length}`);
  console.log(`- Workers: ${data.Ant.filter(a => a.ant_type === 'Worker').length}`);
  console.log(`- Surface ants: ${data.Ant.filter(a => a.z >= 0).length}`);
  console.log(`- Underground ants: ${data.Ant.filter(a => a.z < 0).length}`);
  console.log(`- Discovered resources: ${data.DiscoveredResource.length}`);
  
  // Test 1: Bird threat detection
  console.log('\n🦅 Test 1: Adding bird predator near colony...');
  const queen = data.Ant.find(a => a.ant_type === 'Queen');
  
  data.Predator.push({
    id: 1001,
    predator_type: 'bird',
    x: queen.x + 60,
    y: queen.y,
    health: 80,
    max_health: 80,
    speed: 4,
    attack_damage: 30,
    hunt_radius: 100,
    target_ant_id: null
  });
  
  await wait(3000);
  
  // Check retreat logs
  const retreatLogs = logs.filter(l => 
    l.message.includes('DANGER!') || 
    l.message.includes('retreating to burrow')
  );
  console.log(`\n✅ Found ${retreatLogs.length} retreat logs`);
  
  // Test 2: Worker exit safety
  console.log('\n👁️ Test 2: Worker checking exit safety...');
  
  // Force a worker to try exiting
  const worker = data.Ant.find(a => a.ant_type === 'Worker' && a.z < 0);
  if (worker) {
    worker.task = 'Exiting';
    worker.final_target_x = 100;
    worker.final_target_y = 100;
    worker.final_target_z = 0;
    console.log(`Worker ${worker.id} attempting to exit...`);
  }
  
  await wait(3000);
  
  const safetyLogs = logs.filter(l => 
    l.message.includes('sees') && l.message.includes('predator') ||
    l.message.includes('Waiting...')
  );
  console.log(`✅ Found ${safetyLogs.length} safety check logs`);
  
  // Test 3: Attack and hive alert
  console.log('\n🚨 Test 3: Simulating attack on surface ant...');
  
  // Move bird away first
  const bird = data.Predator.find(p => p.predator_type === 'bird');
  if (bird) {
    bird.x = -500;
    bird.y = -500;
  }
  
  // Create soldier on surface
  await service.call('spawn_ant', {
    colony_id: data.Colony[0].id,
    ant_type: 'Soldier',
    x: 50,
    y: 50,
    z: 0
  });
  
  // Add spider near soldier
  data.Predator.push({
    id: 1002,
    predator_type: 'spider',
    x: 55,
    y: 55,
    health: 100,
    max_health: 100,
    speed: 2,
    attack_damage: 25,
    hunt_radius: 50,
    target_ant_id: null
  });
  
  await wait(3000);
  
  const alertLogs = logs.filter(l => 
    l.message.includes('HIVE ALERT') ||
    l.message.includes('responding to threat')
  );
  console.log(`✅ Found ${alertLogs.length} hive alert logs`);
  
  // Test 4: Bird boredom
  console.log('\n😴 Test 4: Testing bird boredom (all ants underground)...');
  
  // Move all ants underground
  data.Ant.forEach(ant => {
    if (ant.z >= 0) {
      ant.z = -10;
      ant.task = 'Idle';
    }
  });
  
  // Move bird back
  if (bird) {
    bird.x = 0;
    bird.y = 0;
    bird.boredom = 250; // Speed up test
  }
  
  console.log('Bird boredom starting at 250/300...');
  await wait(10000);
  
  const boredomLogs = logs.filter(l => 
    l.message.includes('getting bored') ||
    l.message.includes('flying away')
  );
  console.log(`✅ Found ${boredomLogs.length} boredom logs`);
  
  // Test 5: General retreat
  console.log('\n📯 Test 5: Testing general retreat after casualties...');
  
  const colony = data.Colony[0];
  if (colony) {
    colony.casualties = 4;
    colony.general_retreat = true;
    colony.last_death_time = Date.now();
  }
  
  await wait(2000);
  
  const generalRetreatLogs = logs.filter(l => 
    l.message.includes('GENERAL RETREAT')
  );
  console.log(`✅ Found ${generalRetreatLogs.length} general retreat logs`);
  
  // Analyze all logs for issues
  console.log('\n🔍 Analyzing logs for issues...');
  
  const issues = logs.filter(l => 
    l.message.includes('undefined') ||
    l.message.includes('null') ||
    l.message.includes('NaN') ||
    l.message.includes('Error') ||
    l.message.includes('Cannot read')
  );
  
  if (issues.length > 0) {
    console.log(`\n⚠️ Found ${issues.length} potential issues:`);
    issues.forEach(issue => {
      console.log(`  - ${issue.message}`);
    });
  } else {
    console.log('✅ No obvious issues found in logs');
  }
  
  // Final summary
  console.log('\n📈 Final Summary:');
  console.log(`- Total logs: ${logs.length}`);
  console.log(`- Retreat events: ${retreatLogs.length}`);
  console.log(`- Safety checks: ${safetyLogs.length}`);
  console.log(`- Hive alerts: ${alertLogs.length}`);
  console.log(`- Boredom events: ${boredomLogs.length}`);
  console.log(`- Issues found: ${issues.length}`);
  
  // Check key features
  const features = {
    'Auto worker creation': logs.some(l => l.message.includes('First worker created')),
    'Resource discovery': logs.some(l => l.message.includes('Auto-discovered')),
    'Threat detection': logs.some(l => l.message.includes('dangerous predator')),
    'Exit safety': logs.some(l => l.message.includes('sees') && l.message.includes('predator')),
    'Hive alerts': logs.some(l => l.message.includes('HIVE ALERT')),
    'Bird boredom': logs.some(l => l.message.includes('getting bored')),
    'Group combat': logs.some(l => l.message.includes('group hunt')),
    'Wounded retreat': logs.some(l => l.message.includes('Wounded ant') && l.message.includes('retreating'))
  };
  
  console.log('\n✅ Feature Status:');
  Object.entries(features).forEach(([feature, working]) => {
    console.log(`- ${feature}: ${working ? '✅ Working' : '❌ Not detected'}`);
  });
}

testRecentFeatures().catch(console.error);