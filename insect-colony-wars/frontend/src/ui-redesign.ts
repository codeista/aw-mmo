/**
 * UI Redesign for Insect Colony Wars
 * Clean, organized panels for colony management
 */

export function createImprovedUI(): string {
  return `
    <div id="gameContainer">
      <canvas id="gameCanvas"></canvas>
      
      <!-- Top Bar: Full width with clear sections -->
      <div id="topBar" class="ui-panel full-width">
        <!-- Colony Info -->
        <div id="colonySection">
          <span id="playerName">Not connected</span>
          <span class="divider">|</span>
          <span>Colony #<span id="colonyId">-</span></span>
          <span id="colonyTrait" class="trait-badge"></span>
        </div>
        
        <!-- Resources -->
        <div id="resourcesSection">
          <span class="resource-item">
            🍖 <span id="foodAmount">0</span>
          </span>
          <span class="resource-item">
            💧 <span id="waterAmount">0</span>
          </span>
          <span class="resource-item">
            ⛏️ <span id="mineralsAmount">0</span>
          </span>
          <span class="resource-item">
            🍯 <span id="jellyAmount">0</span>
          </span>
          <span class="resource-item">
            🥚 <span id="larvaeAmount">0</span>
          </span>
          <span class="resource-item">
            🐜 <span id="populationAmount">0</span>/<span id="populationCapacity">0</span>
          </span>
        </div>
        
        <!-- View Controls -->
        <div id="viewControls">
          <button id="surfaceBtn" class="view-btn">Surface</button>
          <button id="undergroundBtn" class="view-btn active">Underground</button>
          <span class="z-level">Z: <span id="zLevel">-10</span></span>
        </div>
      </div>
      
      <!-- Colony Status Dashboard -->
      <div id="colonyDashboard" class="colony-dashboard">
        <div class="dashboard-header">
          <span>🏰 Colony Status</span>
          <button id="toggleDashboard" class="dashboard-toggle">◀</button>
        </div>
        <div id="dashboardContent" class="dashboard-content">
          <!-- Phase Indicator -->
          <div class="phase-indicator">
            <div class="phase-label">Current Phase:</div>
            <div id="currentPhase" class="phase-name">Founding</div>
            <div id="phaseProgress" class="phase-progress">
              <div id="phaseProgressBar" class="phase-progress-bar"></div>
            </div>
          </div>
          
          <!-- Setup Checklist -->
          <div class="setup-checklist">
            <div class="checklist-header">📋 Setup Tasks</div>
            <div id="setupTasks" class="task-list">
              <!-- Tasks will be populated here -->
            </div>
          </div>
          
          <!-- Colony Health Indicators -->
          <div class="health-indicators">
            <div class="indicator" data-status="food">
              <span class="indicator-icon">🍖</span>
              <span class="indicator-label">Food</span>
              <div class="indicator-bar">
                <div class="indicator-fill food-fill"></div>
              </div>
            </div>
            <div class="indicator" data-status="jelly">
              <span class="indicator-icon">🍯</span>
              <span class="indicator-label">Jelly</span>
              <div class="indicator-bar">
                <div class="indicator-fill jelly-fill"></div>
              </div>
            </div>
            <div class="indicator" data-status="defense">
              <span class="indicator-icon">🛡️</span>
              <span class="indicator-label">Defense</span>
              <div class="indicator-bar">
                <div class="indicator-fill defense-fill"></div>
              </div>
            </div>
          </div>
          
          <!-- Activity Monitor -->
          <div class="activity-monitor">
            <div class="monitor-header">⚡ Current Activities</div>
            <div id="activityList" class="activity-list">
              <!-- Real-time activities -->
            </div>
          </div>
        </div>
      </div>
      
      <!-- Left Side Panel: Compact Multi-Function -->
      <div id="leftPanel" class="ui-panel side-panel left">
        <!-- Colony Overview Section -->
        <div class="expandable-section">
          <div class="section-header" data-section="overview">
            <span class="expand-icon">▼</span>
            <span>🏰 Colony Overview</span>
            <span class="section-badge" id="overviewBadge"></span>
          </div>
          <div id="overviewContent" class="section-content expanded">
            <div class="compact-stats">
              <div class="stat-row">
                <span>👑 Queen:</span>
                <span id="queenStatus">Healthy</span>
              </div>
              <div class="stat-row">
                <span>🏠 Chambers:</span>
                <span id="chamberCount">0</span>
              </div>
              <div class="stat-row">
                <span>⚡ Threat Level:</span>
                <span id="threatLevel" class="threat-low">Low</span>
              </div>
              <div class="stat-row">
                <span>🤖 AI:</span>
                <button id="toggleAI" class="mini-toggle active">ON</button>
              </div>
              <div class="stat-row">
                <span>🦅 Predators:</span>
                <button id="togglePredators" class="mini-toggle active">ON</button>
              </div>
              <div class="stat-row">
                <span>🦗 Prey:</span>
                <button id="togglePrey" class="mini-toggle active">ON</button>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Production Section -->
        <div class="expandable-section">
          <div class="section-header" data-section="production">
            <span class="expand-icon">▶</span>
            <span>🏭 Production</span>
            <span class="section-badge" id="productionBadge">+0/min</span>
          </div>
          <div id="productionContent" class="section-content collapsed">
            <div class="production-rates">
              <div class="rate-item">
                <span>🍖 Food:</span>
                <span class="rate-value">+<span id="foodRate">0</span>/min</span>
              </div>
              <div class="rate-item">
                <span>💧 Water:</span>
                <span class="rate-value">+<span id="waterRate">0</span>/min</span>
              </div>
              <div class="rate-item">
                <span>⛏️ Minerals:</span>
                <span class="rate-value">+<span id="mineralsRate">0</span>/min</span>
              </div>
              <div class="rate-item">
                <span>🍯 Jelly:</span>
                <span class="rate-value">+<span id="jellyRate">0</span>/min</span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Construction Section -->
        <div class="expandable-section">
          <div class="section-header" data-section="construction">
            <span class="expand-icon">▶</span>
            <span>🏗️ Construction</span>
            <span class="section-badge" id="constructionBadge"></span>
          </div>
          <div id="constructionContent" class="section-content collapsed">
            <div class="construction-options">
              <button class="build-btn" data-chamber="Nursery">🥚 Nursery (10💧 5⛏️)</button>
              <button class="build-btn" data-chamber="Storage">📦 Storage (15⛏️)</button>
              <button class="build-btn" data-chamber="Barracks">⚔️ Barracks (20⛏️ 10💧)</button>
              <button class="build-btn" data-chamber="ThroneRoom">👑 Throne (50⛏️ 30💧 20🍯)</button>
            </div>
          </div>
        </div>
        
        <!-- Tasks & Units Section -->
        <div class="expandable-section">
          <div class="section-header" data-section="tasks">
            <span class="expand-icon">▶</span>
            <span>📋 Tasks & Units</span>
            <span class="section-badge" id="tasksBadge">0 active</span>
          </div>
          <div id="tasksContent" class="section-content collapsed">
            <!-- Ant Type Tabs -->
            <div class="ant-type-tabs compact">
              <button class="ant-tab active" data-type="all">All</button>
              <button class="ant-tab" data-type="Worker">⚒️</button>
              <button class="ant-tab" data-type="Scout">🔍</button>
              <button class="ant-tab" data-type="Soldier">⚔️</button>
            </div>
            
            <!-- Ant List -->
            <div id="antListContainer" class="ant-list-container compact">
              <div id="antList" class="ant-list">
                <!-- Ant entries will be populated here -->
              </div>
            </div>
            
            <!-- Quick Commands -->
            <div class="quick-commands">
              <button class="cmd-btn" data-cmd="gather">🌾</button>
              <button class="cmd-btn" data-cmd="scout">🔍</button>
              <button class="cmd-btn" data-cmd="guard">🛡️</button>
              <button class="cmd-btn" data-cmd="return">🏠</button>
              <div class="cmd-options">
                <label title="Repeat command">
                  <input type="checkbox" id="repeatCommand"> 🔁
                </label>
              </div>
            </div>
            
            <!-- Active Tasks Summary -->
            <div id="activeTasksSummary" class="tasks-summary">
              <!-- Will show current task distribution -->
            </div>
            
            <!-- Command Queue -->
            <div class="command-queue-section">
              <div class="queue-header">
                <span>📋 Command Queue</span>
                <button id="clearQueue" class="mini-btn">Clear</button>
              </div>
              <div id="commandQueueList" class="queue-list">
                <!-- Queue items will be shown here -->
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Unit Info Window -->
      <div id="unitInfoWindow" class="info-window" style="display: none;">
        <div class="info-header">
          <span id="unitInfoType">Ant</span>
          <button id="closeUnitInfo" class="close-btn">×</button>
        </div>
        <div class="info-content">
          <div class="info-row">
            <span class="info-label">ID:</span>
            <span id="unitInfoId">-</span>
          </div>
          <div class="info-row">
            <span class="info-label">Role:</span>
            <span id="unitInfoRole">-</span>
          </div>
          <div class="info-row">
            <span class="info-label">Energy:</span>
            <div class="energy-bar">
              <div id="unitEnergyFill" class="energy-fill"></div>
              <span id="unitEnergyText">100%</span>
            </div>
          </div>
          <div class="info-row">
            <span class="info-label">Location:</span>
            <span id="unitInfoLocation">-</span>
          </div>
          <div class="info-row">
            <span class="info-label">Current Task:</span>
            <span id="unitInfoTask">-</span>
          </div>
          <div class="info-row">
            <span class="info-label">Carrying:</span>
            <span id="unitInfoCarrying">Nothing</span>
          </div>
        </div>
        <div class="info-actions">
          <button id="followUnit" class="info-btn">Follow</button>
          <button id="returnToBase" class="info-btn">Return to Base</button>
        </div>
      </div>
      
      <!-- Game Over Screen -->
      <div id="gameOverScreen" class="game-over-screen" style="display: none;">
        <div class="game-over-content">
          <h1>Colony Defeated</h1>
          <div id="gameOverReason" class="game-over-reason"></div>
          
          <div class="run-stats">
            <h3>Run Statistics</h3>
            <div id="runStats" class="stats-grid">
              <!-- Stats will be populated here -->
            </div>
          </div>
          
          <div class="game-over-actions">
            <button id="newRunBtn" class="primary-btn">Start New Colony</button>
            <button id="viewStatsBtn" class="secondary-btn">View All Runs</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

// Add alert to the alert panel
export function addAlert(message: string, type: 'info' | 'warning' | 'danger' | 'success' = 'info') {
  const alertList = document.getElementById('alertList');
  const alertCount = document.getElementById('alertCount');
  const latestAlert = document.getElementById('latestAlert');
  const alertIcon = document.getElementById('alertIcon');
  
  if (!alertList) return;
  
  const alert = document.createElement('div');
  alert.className = `alert alert-${type}`;
  alert.innerHTML = `
    <span class="alert-time">${new Date().toLocaleTimeString()}</span>
    <span class="alert-message">${message}</span>
  `;
  
  alertList.insertBefore(alert, alertList.firstChild);
  
  // Keep only last 5 alerts
  while (alertList.children.length > 5) {
    alertList.removeChild(alertList.lastChild);
  }
  
  // Update alert count and latest message
  if (alertCount) {
    const count = parseInt(alertCount.textContent || '0') + 1;
    alertCount.textContent = count.toString();
  }
  
  if (latestAlert) {
    latestAlert.textContent = message.substring(0, 30) + (message.length > 30 ? '...' : '');
  }
  
  // Flash alert icon
  if (alertIcon) {
    alertIcon.classList.add('flash');
    setTimeout(() => alertIcon.classList.remove('flash'), 1000);
  }
  
  // Auto-remove after 10 seconds
  setTimeout(() => {
    if (alert.parentNode) {
      alert.remove();
    }
  }, 10000);
}

// Update threat level display
export function updateThreatLevel(threats: number) {
  const threatLevel = document.getElementById('threatLevel');
  if (!threatLevel) return;
  
  let level = 'Low';
  let className = 'threat-low';
  
  if (threats === 0) {
    level = 'Safe';
    className = 'threat-safe';
  } else if (threats <= 2) {
    level = 'Low';
    className = 'threat-low';
  } else if (threats <= 5) {
    level = 'Medium';
    className = 'threat-medium';
  } else {
    level = 'High';
    className = 'threat-high';
  }
  
  threatLevel.textContent = level;
  threatLevel.className = className;
}

// Update unit breakdown (not used in new compact design)
export function updateUnitBreakdown(units: Map<string, number>) {
  // This function is kept for compatibility but not used in the new UI
}
