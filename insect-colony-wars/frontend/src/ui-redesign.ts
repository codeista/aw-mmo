/**
 * UI Redesign for Insect Colony Wars
 * Clean, organized panels for colony management
 */

export function createImprovedUI(): string {
  return `
    <div id="gameContainer">
      <canvas id="gameCanvas"></canvas>
      
      <!-- Top Bar: Player Info and View Controls -->
      <div id="topBar" class="ui-panel">
        <div id="playerInfo">
          <span id="playerName">Not connected</span>
          <span id="colonyInfo">
            Colony #<span id="colonyId">-</span>
            <span id="colonyTrait" class="trait-badge"></span>
          </span>
          <span id="generationInfo" class="generation-info">
            Gen <span id="generation">0</span> | 
            Queens <span id="queensProduced">0</span>
          </span>
        </div>
        <div id="viewControls">
          <button id="surfaceBtn" class="view-btn">🌍 Surface</button>
          <button id="undergroundBtn" class="view-btn active">⛏️ Underground</button>
          <span id="zLevelDisplay" class="z-level">Z: <span id="zLevel">-10</span></span>
        </div>
      </div>
      
      <!-- Alert Panel: Real-time notifications -->
      <div id="alertPanel" class="ui-panel alert-panel">
        <div class="panel-header">
          <h3>🚨 Alerts</h3>
          <button id="clearAlerts" class="mini-btn">Clear</button>
        </div>
        <div id="alertList" class="alert-list">
          <!-- Alerts will be added here dynamically -->
        </div>
      </div>
      
      <!-- Colony Status Panel -->
      <div id="colonyPanel" class="ui-panel colony-panel">
        <div class="panel-header">
          <h3>📊 Colony Status</h3>
          <div class="ai-toggle">
            <span>AI:</span>
            <button id="toggleAI" class="toggle-btn active">ON</button>
          </div>
        </div>
        
        <!-- Resources Section -->
        <div class="status-section">
          <h4>Resources</h4>
          <div class="resource-grid">
            <div class="resource-item">
              <span class="resource-icon">🍎</span>
              <span class="resource-name">Food</span>
              <span class="resource-value" id="food">0</span>
            </div>
            <div class="resource-item">
              <span class="resource-icon">💧</span>
              <span class="resource-name">Water</span>
              <span class="resource-value" id="water">0</span>
            </div>
            <div class="resource-item">
              <span class="resource-icon">⛏️</span>
              <span class="resource-name">Minerals</span>
              <span class="resource-value" id="minerals">0</span>
            </div>
            <div class="resource-item highlight">
              <span class="resource-icon">👑</span>
              <span class="resource-name">Jelly</span>
              <span class="resource-value" id="queenJelly">0</span>
            </div>
          </div>
        </div>
        
        <!-- Population Section -->
        <div class="status-section">
          <h4>Population</h4>
          <div class="population-info">
            <div class="pop-item">
              <span>🥚 Larvae:</span>
              <span id="larvae">0</span>
            </div>
            <div class="pop-item">
              <span>🐜 Ants:</span>
              <span><span id="population">0</span>/<span id="popCapacity">0</span></span>
            </div>
            <div class="pop-item danger">
              <span>⚰️ Casualties:</span>
              <span id="casualties">0</span>
            </div>
          </div>
        </div>
        
        <!-- Threat Monitor -->
        <div class="status-section">
          <h4>Threat Monitor</h4>
          <div id="threatMonitor" class="threat-monitor">
            <div class="threat-item">
              <span class="threat-icon">🦅</span>
              <span class="threat-name">Birds</span>
              <span class="threat-count" id="birdCount">0</span>
            </div>
            <div class="threat-item">
              <span class="threat-icon">🕷️</span>
              <span class="threat-name">Spiders</span>
              <span class="threat-count" id="spiderCount">0</span>
            </div>
            <div class="threat-item">
              <span class="threat-icon">🪲</span>
              <span class="threat-name">Beetles</span>
              <span class="threat-count" id="beetleCount">0</span>
            </div>
          </div>
          <div class="threat-level-bar">
            <span>Threat Level:</span>
            <div class="threat-bar">
              <div id="threatBar" class="threat-fill low"></div>
            </div>
            <span id="threatLevel" class="threat-text">Low</span>
          </div>
        </div>
        
        <!-- Quick Actions -->
        <div class="quick-actions">
          <button id="respawnBtn" class="action-btn danger">🔄 New Colony</button>
        </div>
      </div>
      
      <!-- Troop Management Panel -->
      <div id="troopPanel" class="ui-panel troop-panel">
        <div class="panel-header">
          <h3>🐜 Troop Management</h3>
        </div>
        
        <!-- Unit Breakdown -->
        <div id="unitBreakdown" class="unit-breakdown">
          <div class="unit-type" data-type="Queen">
            <span class="unit-icon">👑</span>
            <span class="unit-count">0</span>
          </div>
          <div class="unit-type" data-type="Worker">
            <span class="unit-icon">⚒️</span>
            <span class="unit-count">0</span>
          </div>
          <div class="unit-type" data-type="Scout">
            <span class="unit-icon">🔍</span>
            <span class="unit-count">0</span>
          </div>
          <div class="unit-type" data-type="Soldier">
            <span class="unit-icon">⚔️</span>
            <span class="unit-count">0</span>
          </div>
          <div class="unit-type" data-type="Major">
            <span class="unit-icon">🛡️</span>
            <span class="unit-count">0</span>
          </div>
          <div class="unit-type" data-type="RoyalWorker">
            <span class="unit-icon">🍯</span>
            <span class="unit-count">0</span>
          </div>
          <div class="unit-type" data-type="YoungQueen">
            <span class="unit-icon">👸</span>
            <span class="unit-count">0</span>
          </div>
        </div>
        
        <!-- Production Controls -->
        <div class="production-section">
          <h4>Production</h4>
          <div class="production-controls">
            <button id="spawnLarvaBtn" class="prod-btn" title="Queen spawns larva (0.5 jelly)">
              <span class="prod-icon">🥚</span>
              <span class="prod-name">Larva</span>
              <span class="prod-cost">0.5👑</span>
            </button>
            
            <div class="prod-divider"></div>
            
            <button class="prod-btn spawn-btn" data-ant="Worker" title="Basic gatherer (1 pop)">
              <span class="prod-icon">⚒️</span>
              <span class="prod-name">Worker</span>
              <span class="prod-cost">2👑 1p</span>
            </button>
            <button class="prod-btn spawn-btn" data-ant="Scout" title="Explorer (1 pop)">
              <span class="prod-icon">🔍</span>
              <span class="prod-name">Scout</span>
              <span class="prod-cost">2.5👑 1p</span>
            </button>
            <button class="prod-btn spawn-btn" data-ant="Soldier" title="Fighter (2 pop)">
              <span class="prod-icon">⚔️</span>
              <span class="prod-name">Soldier</span>
              <span class="prod-cost">3👑 2p</span>
            </button>
            <button class="prod-btn spawn-btn" data-ant="RoyalWorker" title="Jelly producer (5 pop)">
              <span class="prod-icon">🍯</span>
              <span class="prod-name">Royal</span>
              <span class="prod-cost">5👑 5p</span>
            </button>
            <button class="prod-btn spawn-btn" data-ant="Major" title="Heavy fighter (5 pop)">
              <span class="prod-icon">🛡️</span>
              <span class="prod-name">Major</span>
              <span class="prod-cost">5👑 5p</span>
            </button>
            <button class="prod-btn spawn-btn special" data-ant="YoungQueen" title="Victory unit (10 pop + Throne)">
              <span class="prod-icon">👸</span>
              <span class="prod-name">Queen</span>
              <span class="prod-cost">50👑 10p</span>
            </button>
          </div>
        </div>
        
        <!-- Selection Info -->
        <div class="selection-section">
          <h4>Selection</h4>
          <div id="selectionInfo" class="selection-info">
            <p>No units selected</p>
          </div>
          <div class="selection-actions">
            <button id="selectAllBtn" class="select-btn">Select All</button>
            <button id="clearSelectionBtn" class="select-btn">Clear</button>
          </div>
        </div>
      </div>
      
      <!-- Command Panel -->
      <div id="commandPanel" class="ui-panel command-panel">
        <div class="panel-header">
          <h3>⚔️ Commands</h3>
        </div>
        
        <!-- Individual Unit Commands -->
        <div id="unitCommands" class="command-section">
          <h4>Unit Tasks</h4>
          <div class="task-grid">
            <button class="task-btn" data-task="gather">
              <span class="task-icon">🍎</span>
              <span class="task-name">Gather</span>
            </button>
            <button class="task-btn" data-task="scout">
              <span class="task-icon">🔍</span>
              <span class="task-name">Scout</span>
            </button>
            <button class="task-btn" data-task="guard">
              <span class="task-icon">🛡️</span>
              <span class="task-name">Guard</span>
            </button>
            <button class="task-btn" data-task="dig">
              <span class="task-icon">⛏️</span>
              <span class="task-name">Dig</span>
            </button>
            <button class="task-btn" data-task="hunt">
              <span class="task-icon">🎯</span>
              <span class="task-name">Hunt</span>
            </button>
            <button class="task-btn" data-task="idle">
              <span class="task-icon">💤</span>
              <span class="task-name">Idle</span>
            </button>
          </div>
        </div>
        
        <!-- Colony Commands -->
        <div class="command-section">
          <h4>Colony Orders</h4>
          <div class="colony-commands">
            <button id="gatherAllBtn" class="colony-btn">
              <span class="cmd-icon">⚒️</span>
              <span class="cmd-name">Gather All</span>
            </button>
            <button id="defendBtn" class="colony-btn">
              <span class="cmd-icon">🛡️</span>
              <span class="cmd-name">Defend Queen</span>
            </button>
            <button id="retreatBtn" class="colony-btn danger">
              <span class="cmd-icon">🏃</span>
              <span class="cmd-name">Retreat!</span>
            </button>
          </div>
        </div>
        
        <!-- Special Actions -->
        <div class="command-section">
          <h4>Special</h4>
          <div class="special-commands">
            <button id="produceJellyBtn" class="special-btn" title="Royal Worker only">
              <span>🍯 Produce Jelly</span>
            </button>
            <button id="flyAwayBtn" class="special-btn success" title="Young Queen only">
              <span>✈️ Nuptial Flight</span>
            </button>
          </div>
        </div>
      </div>
      
      <!-- Building Panel -->
      <div id="buildingPanel" class="ui-panel building-panel">
        <div class="panel-header">
          <h3>🏗️ Construction</h3>
        </div>
        
        <div class="building-grid">
          <button class="build-btn" data-chamber="Nursery">
            <span class="build-icon">🥚</span>
            <span class="build-name">Nursery</span>
            <span class="build-cost">10⛏️ 5💧</span>
            <span class="build-bonus">+5 pop</span>
          </button>
          <button class="build-btn" data-chamber="Storage">
            <span class="build-icon">📦</span>
            <span class="build-name">Storage</span>
            <span class="build-cost">20⛏️ 10💧</span>
            <span class="build-bonus">+5 pop</span>
          </button>
          <button class="build-btn" data-chamber="Barracks">
            <span class="build-icon">⚔️</span>
            <span class="build-name">Barracks</span>
            <span class="build-cost">50⛏️ 20💧</span>
            <span class="build-bonus">+20 pop</span>
          </button>
          <button class="build-btn special" data-chamber="ThroneRoom">
            <span class="build-icon">👑</span>
            <span class="build-name">Throne Room</span>
            <span class="build-cost">100⛏️ 50💧</span>
            <span class="build-bonus">Queens</span>
          </button>
        </div>
      </div>
      
      <!-- Placement Mode Overlay -->
      <div id="placementMode" class="placement-overlay" style="display: none;">
        <div class="placement-info">
          <h2>🌍 New World Generated!</h2>
          <p>Click anywhere on the map to land your queen</p>
          <button id="cancelPlacement" class="cancel-btn">Cancel</button>
        </div>
      </div>
      
      <!-- Create Colony Button (shown when no colony) -->
      <div id="noColonyPanel" class="ui-panel no-colony-panel">
        <button id="createColonyBtn" class="large-btn">🐜 Start New Colony</button>
      </div>
    </div>
  `;
}

// Alert system functions
export function addAlert(message: string, type: 'info' | 'warning' | 'danger' | 'success' = 'info') {
  const alertList = document.getElementById('alertList');
  if (!alertList) return;
  
  const alertItem = document.createElement('div');
  alertItem.className = `alert-item ${type}`;
  alertItem.innerHTML = `
    <span class="alert-time">${new Date().toLocaleTimeString()}</span>
    <span class="alert-message">${message}</span>
  `;
  
  alertList.insertBefore(alertItem, alertList.firstChild);
  
  // Keep only last 10 alerts
  while (alertList.children.length > 10) {
    alertList.removeChild(alertList.lastChild);
  }
  
  // Auto-remove after 30 seconds
  setTimeout(() => {
    if (alertItem.parentNode) {
      alertItem.classList.add('fade-out');
      setTimeout(() => alertItem.remove(), 500);
    }
  }, 30000);
}

// Update threat level
export function updateThreatLevel(threatCount: number) {
  const threatBar = document.getElementById('threatBar');
  const threatLevel = document.getElementById('threatLevel');
  
  if (!threatBar || !threatLevel) return;
  
  let level = 'low';
  let percentage = 0;
  
  if (threatCount === 0) {
    level = 'safe';
    percentage = 0;
  } else if (threatCount <= 2) {
    level = 'low';
    percentage = 25;
  } else if (threatCount <= 4) {
    level = 'medium';
    percentage = 50;
  } else if (threatCount <= 6) {
    level = 'high';
    percentage = 75;
  } else {
    level = 'critical';
    percentage = 100;
  }
  
  threatBar.className = `threat-fill ${level}`;
  threatBar.style.width = `${percentage}%`;
  threatLevel.textContent = level.charAt(0).toUpperCase() + level.slice(1);
  threatLevel.className = `threat-text ${level}`;
}

// Update unit breakdown
export function updateUnitBreakdown(units: Map<string, number>) {
  units.forEach((count, type) => {
    const element = document.querySelector(`.unit-type[data-type="${type}"] .unit-count`);
    if (element) {
      element.textContent = count.toString();
    }
  });
}