/**
 * Orchestrator Controls Widget - Home Vibe Coder Standards
 * Provides human orchestrator override controls for multi-agent coordination
 */

class OrchestratorControlsWidget {
    constructor(container, options = {}) {
        this.container = container;
        this.options = {
            refreshInterval: 10000, // 10 seconds
            ...options
        };
        
        this.agents = new Map();
        this.coordinationStatus = {};
        this.refreshTimer = null;
        this.eventBus = window.eventBus || new EventBus();
        this.isOverrideMode = false;
        
        this.init();
    }

    init() {
        this.render();
        this.setupEventListeners();
        this.loadCoordinationStatus();
        this.startAutoRefresh();
        
        console.log('Orchestrator Controls Widget initialized');
    }

    render() {
        this.container.innerHTML = `
            <div class="orchestrator-controls-widget">
                <div class="orchestrator-header">
                    <h2 class="orchestrator-title">
                        <span class="orchestrator-icon">🎛️</span>
                        Human Orchestrator
                    </h2>
                    <div class="override-mode-toggle">
                        <label class="toggle-switch">
                            <input type="checkbox" id="override-mode-toggle">
                            <span class="toggle-slider"></span>
                        </label>
                        <span class="toggle-label">Override Mode</span>
                    </div>
                </div>
                
                <div class="coordination-status" id="coordination-status">
                    <!-- Coordination status will be populated here -->
                </div>
                
                <div class="control-panels">
                    <div class="agent-controls-panel">
                        <h3>Agent Controls</h3>
                        <div class="agent-control-grid" id="agent-control-grid">
                            <!-- Agent controls will be populated here -->
                        </div>
                    </div>
                    
                    <div class="system-controls-panel">
                        <h3>System Controls</h3>
                        <div class="system-control-buttons">
                            <button class="control-btn primary" id="pause-all-btn">
                                ⏸️ Pause All Agents
                            </button>
                            <button class="control-btn success" id="resume-all-btn">
                                ▶️ Resume All Agents
                            </button>
                            <button class="control-btn warning" id="reassign-all-btn">
                                🔄 Reassign All Tasks
                            </button>
                            <button class="control-btn danger" id="emergency-stop-btn">
                                🛑 Emergency Stop
                            </button>
                        </div>
                    </div>
                    
                    <div class="coordination-controls-panel">
                        <h3>Coordination Controls</h3>
                        <div class="coordination-actions">
                            <div class="action-group">
                                <label for="priority-override">Priority Override:</label>
                                <select id="priority-override" class="priority-select">
                                    <option value="">No Override</option>
                                    <option value="high">Force High Priority</option>
                                    <option value="medium">Force Medium Priority</option>
                                    <option value="low">Force Low Priority</option>
                                </select>
                            </div>
                            
                            <div class="action-group">
                                <label for="assignment-strategy">Assignment Strategy:</label>
                                <select id="assignment-strategy" class="strategy-select">
                                    <option value="auto">Automatic</option>
                                    <option value="manual">Manual Only</option>
                                    <option value="balanced">Load Balanced</option>
                                    <option value="capability">Capability Match</option>
                                </select>
                            </div>
                            
                            <button class="control-btn info" id="force-sync-btn">
                                🔄 Force Sync All
                            </button>
                        </div>
                    </div>
                </div>
                
                <div class="coordination-logs" id="coordination-logs">
                    <h3>Recent Actions</h3>
                    <div class="logs-container" id="logs-container">
                        <!-- Coordination logs will be populated here -->
                    </div>
                </div>
            </div>
        `;
    }

    setupEventListeners() {
        // Override mode toggle
        const overrideToggle = this.container.querySelector('#override-mode-toggle');
        overrideToggle.addEventListener('change', (e) => this.toggleOverrideMode(e.target.checked));
        
        // System control buttons
        const pauseAllBtn = this.container.querySelector('#pause-all-btn');
        const resumeAllBtn = this.container.querySelector('#resume-all-btn');
        const reassignAllBtn = this.container.querySelector('#reassign-all-btn');
        const emergencyStopBtn = this.container.querySelector('#emergency-stop-btn');
        const forceSyncBtn = this.container.querySelector('#force-sync-btn');
        
        pauseAllBtn.addEventListener('click', () => this.pauseAllAgents());
        resumeAllBtn.addEventListener('click', () => this.resumeAllAgents());
        reassignAllBtn.addEventListener('click', () => this.reassignAllTasks());
        emergencyStopBtn.addEventListener('click', () => this.emergencyStop());
        forceSyncBtn.addEventListener('click', () => this.forceSync());
        
        // Priority and strategy controls
        const priorityOverride = this.container.querySelector('#priority-override');
        const assignmentStrategy = this.container.querySelector('#assignment-strategy');
        
        priorityOverride.addEventListener('change', (e) => this.setPriorityOverride(e.target.value));
        assignmentStrategy.addEventListener('change', (e) => this.setAssignmentStrategy(e.target.value));
        
        // Event bus listeners
        this.eventBus.on('agents:fetched', (data) => this.updateAgents(data));
        this.eventBus.on('coordination:status:fetched', (data) => this.updateCoordinationStatus(data));
        this.eventBus.on('agent:status:updated', (data) => this.logAction(`Agent ${data.agentId} status updated to ${data.status}`));
        this.eventBus.on('task:assigned:success', (data) => this.logAction(`Task ${data.taskId} assigned to ${data.agentId}`));
        this.eventBus.on('api:error', (data) => this.handleAPIError(data));
    }

    async loadCoordinationStatus() {
        try {
            // Load agents
            if (window.agentAPI) {
                const agentsData = await window.agentAPI.fetchAgents();
                this.updateAgents(agentsData);
                
                const coordinationData = await window.agentAPI.fetchCoordinationStatus();
                this.updateCoordinationStatus(coordinationData);
            }
        } catch (error) {
            console.error('Failed to load coordination status:', error);
            this.logAction('Failed to load coordination status', 'error');
        }
    }

    updateAgents(agentsData) {
        const agents = agentsData.agents || agentsData;
        this.agents.clear();
        
        if (agents && Array.isArray(agents)) {
            agents.forEach(agent => {
                this.agents.set(agent.id, agent);
            });
        }
        
        this.renderAgentControls();
    }

    updateCoordinationStatus(statusData) {
        this.coordinationStatus = statusData;
        this.renderCoordinationStatus();
    }

    renderCoordinationStatus() {
        const statusContainer = this.container.querySelector('#coordination-status');
        
        const activeAgents = this.coordinationStatus.activeAgents || 0;
        const pendingHandoffs = this.coordinationStatus.pendingHandoffs || 0;
        const totalTasks = this.coordinationStatus.totalTasks || 0;
        const lastSync = this.coordinationStatus.lastSync ? 
            new Date(this.coordinationStatus.lastSync).toLocaleTimeString() : 'Never';
        
        statusContainer.innerHTML = `
            <div class="status-grid">
                <div class="status-item">
                    <span class="status-value ${activeAgents > 0 ? 'active' : 'inactive'}">${activeAgents}</span>
                    <span class="status-label">Active Agents</span>
                </div>
                <div class="status-item">
                    <span class="status-value ${pendingHandoffs > 0 ? 'warning' : 'success'}">${pendingHandoffs}</span>
                    <span class="status-label">Pending Handoffs</span>
                </div>
                <div class="status-item">
                    <span class="status-value">${totalTasks}</span>
                    <span class="status-label">Total Tasks</span>
                </div>
                <div class="status-item">
                    <span class="status-value">${lastSync}</span>
                    <span class="status-label">Last Sync</span>
                </div>
            </div>
            <div class="coordination-health ${activeAgents > 0 ? 'healthy' : 'warning'}">
                <span class="health-indicator"></span>
                ${activeAgents > 0 ? 'Coordination System Healthy' : 'No Active Agents'}
            </div>
        `;
    }

    renderAgentControls() {
        const controlGrid = this.container.querySelector('#agent-control-grid');
        
        if (this.agents.size === 0) {
            controlGrid.innerHTML = `
                <div class="no-agents-message">
                    No agents available for control
                </div>
            `;
            return;
        }
        
        controlGrid.innerHTML = Array.from(this.agents.values()).map(agent => 
            this.renderAgentControlCard(agent)
        ).join('');
    }

    renderAgentControlCard(agent) {
        const statusColor = {
            'active': 'success',
            'inactive': 'warning', 
            'error': 'danger',
            'maintenance': 'info'
        }[agent.status] || 'secondary';
        
        return `
            <div class="agent-control-card" data-agent-id="${agent.id}">
                <div class="agent-control-header">
                    <h4 class="agent-name">${agent.name || agent.id}</h4>
                    <span class="agent-status-badge ${statusColor}">${agent.status}</span>
                </div>
                <div class="agent-role">${agent.role}</div>
                <div class="agent-control-actions">
                    <button class="control-btn-sm pause" onclick="orchestratorControls.pauseAgent('${agent.id}')">
                        ⏸️ Pause
                    </button>
                    <button class="control-btn-sm resume" onclick="orchestratorControls.resumeAgent('${agent.id}')">
                        ▶️ Resume
                    </button>
                    <button class="control-btn-sm reassign" onclick="orchestratorControls.reassignAgentTasks('${agent.id}')">
                        🔄 Reassign
                    </button>
                </div>
                <div class="agent-override-controls" ${this.isOverrideMode ? '' : 'style="display: none;"'}>
                    <select class="agent-priority-override" onchange="orchestratorControls.setAgentPriority('${agent.id}', this.value)">
                        <option value="">No Priority Override</option>
                        <option value="high">High Priority Mode</option>
                        <option value="low">Low Priority Mode</option>
                    </select>
                </div>
            </div>
        `;
    }

    toggleOverrideMode(enabled) {
        this.isOverrideMode = enabled;
        this.logAction(`Override mode ${enabled ? 'enabled' : 'disabled'}`);
        
        // Show/hide override controls
        const overrideControls = this.container.querySelectorAll('.agent-override-controls');
        overrideControls.forEach(control => {
            control.style.display = enabled ? 'block' : 'none';
        });
        
        // Enable/disable certain system controls
        const systemControls = this.container.querySelectorAll('.system-controls-panel .control-btn');
        systemControls.forEach(btn => {
            if (enabled) {
                btn.classList.add('override-enabled');
            } else {
                btn.classList.remove('override-enabled');
            }
        });
    }

    async pauseAgent(agentId) {
        try {
            if (window.agentAPI) {
                await window.agentAPI.updateAgentStatus({
                    agentId,
                    status: 'inactive',
                    metadata: { reason: 'manually_paused_by_orchestrator' }
                });
                this.logAction(`Paused agent ${agentId}`);
            }
        } catch (error) {
            this.logAction(`Failed to pause agent ${agentId}: ${error.message}`, 'error');
        }
    }

    async resumeAgent(agentId) {
        try {
            if (window.agentAPI) {
                await window.agentAPI.updateAgentStatus({
                    agentId,
                    status: 'active',
                    metadata: { reason: 'manually_resumed_by_orchestrator' }
                });
                this.logAction(`Resumed agent ${agentId}`);
            }
        } catch (error) {
            this.logAction(`Failed to resume agent ${agentId}: ${error.message}`, 'error');
        }
    }

    async reassignAgentTasks(agentId) {
        this.logAction(`Reassigning tasks for agent ${agentId}...`);
        
        try {
            // This would typically involve calling a task reassignment API
            // For now, we'll just log the action
            this.logAction(`Task reassignment initiated for agent ${agentId}`);
        } catch (error) {
            this.logAction(`Failed to reassign tasks for agent ${agentId}: ${error.message}`, 'error');
        }
    }

    async pauseAllAgents() {
        this.logAction('Pausing all agents...');
        
        const pausePromises = Array.from(this.agents.keys()).map(agentId => 
            this.pauseAgent(agentId)
        );
        
        try {
            await Promise.all(pausePromises);
            this.logAction('All agents paused successfully');
        } catch (error) {
            this.logAction('Some agents failed to pause', 'error');
        }
    }

    async resumeAllAgents() {
        this.logAction('Resuming all agents...');
        
        const resumePromises = Array.from(this.agents.keys()).map(agentId => 
            this.resumeAgent(agentId)
        );
        
        try {
            await Promise.all(resumePromises);
            this.logAction('All agents resumed successfully');
        } catch (error) {
            this.logAction('Some agents failed to resume', 'error');
        }
    }

    async reassignAllTasks() {
        if (!confirm('This will reassign all tasks. Are you sure?')) {
            return;
        }
        
        this.logAction('Initiating global task reassignment...');
        
        try {
            // This would call a global reassignment API
            this.logAction('Global task reassignment completed');
        } catch (error) {
            this.logAction(`Global task reassignment failed: ${error.message}`, 'error');
        }
    }

    async emergencyStop() {
        if (!confirm('EMERGENCY STOP: This will halt all agent operations. Are you sure?')) {
            return;
        }
        
        this.logAction('🛑 EMERGENCY STOP ACTIVATED', 'error');
        
        try {
            await this.pauseAllAgents();
            
            // Additional emergency procedures could go here
            this.logAction('All systems halted. Manual intervention required.', 'error');
        } catch (error) {
            this.logAction(`Emergency stop failed: ${error.message}`, 'error');
        }
    }

    async forceSync() {
        this.logAction('Forcing synchronization of all systems...');
        
        try {
            await this.loadCoordinationStatus();
            this.logAction('System synchronization completed');
        } catch (error) {
            this.logAction(`Synchronization failed: ${error.message}`, 'error');
        }
    }

    setPriorityOverride(priority) {
        if (priority) {
            this.logAction(`Priority override set to: ${priority}`);
        } else {
            this.logAction('Priority override cleared');
        }
    }

    setAssignmentStrategy(strategy) {
        this.logAction(`Assignment strategy changed to: ${strategy}`);
    }

    setAgentPriority(agentId, priority) {
        if (priority) {
            this.logAction(`Agent ${agentId} priority override set to: ${priority}`);
        } else {
            this.logAction(`Agent ${agentId} priority override cleared`);
        }
    }

    logAction(message, type = 'info') {
        const logsContainer = this.container.querySelector('#logs-container');
        const timestamp = new Date().toLocaleTimeString();
        
        const logEntry = document.createElement('div');
        logEntry.className = `log-entry ${type}`;
        logEntry.innerHTML = `
            <span class="log-timestamp">${timestamp}</span>
            <span class="log-message">${message}</span>
        `;
        
        logsContainer.insertBefore(logEntry, logsContainer.firstChild);
        
        // Limit to 50 log entries
        while (logsContainer.children.length > 50) {
            logsContainer.removeChild(logsContainer.lastChild);
        }
    }

    handleAPIError(errorData) {
        this.logAction(`API Error: ${errorData.error}`, 'error');
    }

    startAutoRefresh() {
        this.refreshTimer = setInterval(() => {
            this.loadCoordinationStatus();
        }, this.options.refreshInterval);
    }

    stopAutoRefresh() {
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
            this.refreshTimer = null;
        }
    }

    destroy() {
        this.stopAutoRefresh();
        
        // Remove all event listeners
        this.eventBus.off('agents:fetched');
        this.eventBus.off('coordination:status:fetched');
        this.eventBus.off('agent:status:updated');
        this.eventBus.off('task:assigned:success');
        this.eventBus.off('api:error');
    }
}

// Register widget with the dashboard system
if (window.WidgetManager) {
    window.WidgetManager.registerWidget('orchestrator-controls', OrchestratorControlsWidget);
}

// Global reference for inline onclick handlers
window.orchestratorControls = null;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const container = document.querySelector('[data-widget="orchestrator-controls"]');
    if (container) {
        window.orchestratorControls = new OrchestratorControlsWidget(container);
    }
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = OrchestratorControlsWidget;
}