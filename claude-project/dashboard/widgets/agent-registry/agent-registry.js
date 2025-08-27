/**
 * Agent Registry Widget - Home Vibe Coder Standards
 * Displays active agents, their capabilities, and current status
 */

class AgentRegistryWidget {
    constructor(container, options = {}) {
        this.container = container;
        this.options = {
            refreshInterval: 30000, // 30 seconds
            maxAgents: 20,
            ...options
        };
        
        this.agents = new Map();
        this.refreshTimer = null;
        this.eventBus = window.eventBus || new EventBus();
        
        this.init();
    }

    init() {
        this.render();
        this.setupEventListeners();
        this.startAutoRefresh();
        this.startRealTimeUpdates();
        this.loadAgents();
        
        console.log('Agent Registry Widget initialized with API integration');
    }

    render() {
        this.container.innerHTML = `
            <div class="agent-registry-widget">
                <div class="agent-registry-header">
                    <h2 class="agent-registry-title">Agent Registry</h2>
                    <div class="agent-status-indicator">
                        <span class="status-dot active"></span>
                        <span id="active-agents-count">0 Active</span>
                    </div>
                </div>
                
                <div class="agents-grid" id="agents-grid">
                    <!-- Agent cards will be populated here -->
                </div>
                
                <button class="refresh-agents-btn" id="refresh-agents-btn">
                    Refresh Agents
                </button>
            </div>
        `;
    }

    setupEventListeners() {
        // Refresh button
        const refreshBtn = this.container.querySelector('#refresh-agents-btn');
        refreshBtn.addEventListener('click', () => this.refreshAgents());
        
        // Event bus listeners for widget updates
        this.eventBus.on('agent:status:changed', (data) => this.updateAgentStatus(data));
        this.eventBus.on('agent:registered', (data) => this.addAgent(data));
        this.eventBus.on('agent:unregistered', (data) => this.removeAgent(data));
        this.eventBus.on('task:assigned', (data) => this.updateAgentTask(data));
        
        // API integration event listeners
        this.eventBus.on('agents:fetched', (data) => this.updateAgentsDisplay(data.agents || data));
        this.eventBus.on('agent:status:updated', (data) => this.updateAgentStatus(data));
        this.eventBus.on('agent:registered:success', (data) => this.loadAgents());
        this.eventBus.on('api:error', (data) => this.handleAPIError(data));
    }

    async loadAgents() {
        try {
            // Use the global API integration if available
            if (window.agentAPI) {
                const agentsData = await window.agentAPI.fetchAgents();
                this.updateAgentsDisplay(agentsData.agents || agentsData);
            } else {
                // Use TaskMaster Dashboard API
                const response = await fetch('http://localhost:3001/api/agents');
                if (!response.ok) throw new Error('API error');
                const agentsData = await response.json();
                this.updateAgentsDisplay(agentsData.agents || agentsData);
            }
        } catch (error) {
            console.error('Failed to load agents:', error);
            this.showNoAgentsMessage('Failed to load agents - API unavailable');
        }
    }

    async fetchAgents() {
        try {
            if (window.agentAPI) {
                return await window.agentAPI.fetchAgents();
            } else {
                const response = await fetch('http://localhost:3001/api/agents');
                if (!response.ok) throw new Error('API error');
                return await response.json();
            }
        } catch (error) {
            console.error('Failed to fetch agents:', error);
            this.showNoAgentsMessage('Agent data unavailable. Please check TaskMaster API connection.');
            return { agents: [] };
        }
    }

    updateAgentsDisplay(agentsData) {
        const grid = this.container.querySelector('#agents-grid');
        
        if (!agentsData || agentsData.length === 0) {
            this.showNoAgentsMessage();
            return;
        }

        // Clear existing agents and rebuild
        this.agents.clear();
        grid.innerHTML = '';

        agentsData.forEach(agent => {
            // Use agent.name as the identifier since that's what the API provides
            const agentId = agent.agentId || agent.name;
            this.agents.set(agentId, agent);
            this.renderAgentCard(agent, grid);
        });

        this.updateStatusIndicator();
        
        // Animate new cards
        setTimeout(() => {
            grid.querySelectorAll('.agent-card').forEach(card => {
                card.classList.add('new');
            });
        }, 100);
    }

    renderAgentCard(agent, container) {
        const card = document.createElement('div');
        const agentId = agent.agentId || agent.name;
        const agentStatus = agent.status || (agent.isCurrent ? 'active' : 'inactive');
        const agentRole = agent.role || 'general';
        
        card.className = `agent-card ${agentStatus}`;
        card.id = `agent-${agentId}`;
        
        const uptime = this.formatUptime(agent.uptime);
        const lastSeen = this.formatLastSeen(agent.lastSeen || agent.createdAt);
        
        card.innerHTML = `
            <div class="agent-card-header">
                <div>
                    <h3 class="agent-name">${agent.name}</h3>
                    <p class="agent-role">${agentRole}</p>
                </div>
                <span class="agent-status-badge ${agentStatus}">${agentStatus}</span>
            </div>
            
            <div class="agent-description">
                <p class="description-text">${agent.description || 'No description available'}</p>
            </div>
            
            <div class="agent-metrics">
                <div class="metric">
                    <span class="metric-value">${agent.completedTasks || 0}</span>
                    <span class="metric-label">Tasks Done</span>
                </div>
                <div class="metric">
                    <span class="metric-value">${agent.taskCount || 0}</span>
                    <span class="metric-label">Total Tasks</span>
                </div>
                <div class="metric">
                    <span class="metric-value">${agent.priority || 'N/A'}</span>
                    <span class="metric-label">Priority</span>
                </div>
            </div>
            
            ${agent.statusBreakdown ? `
                <div class="status-breakdown">
                    <div class="status-item">
                        <span class="status-count">${agent.statusBreakdown.done || 0}</span>
                        <span class="status-label">Done</span>
                    </div>
                    <div class="status-item">
                        <span class="status-count">${agent.statusBreakdown['in-progress'] || 0}</span>
                        <span class="status-label">In Progress</span>
                    </div>
                    <div class="status-item">
                        <span class="status-count">${agent.statusBreakdown.pending || 0}</span>
                        <span class="status-label">Pending</span>
                    </div>
                </div>
            ` : ''}
            
            <div class="agent-actions">
                <button class="agent-action-btn" onclick="window.agentRegistry.viewAgentDetails('${agentId}')">
                    Details
                </button>
                <button class="agent-action-btn" onclick="window.agentRegistry.assignTask('${agentId}')">
                    Assign Task
                </button>
                ${agentStatus === 'active' ? 
                    `<button class="agent-action-btn" onclick="window.agentRegistry.pauseAgent('${agentId}')">Pause</button>` :
                    `<button class="agent-action-btn primary" onclick="window.agentRegistry.activateAgent('${agentId}')">Activate</button>`
                }
            </div>
            
            <div style="margin-top: 8px; font-size: 0.75rem; color: var(--text-secondary);">
                Last seen: ${lastSeen}
            </div>
        `;
        
        container.appendChild(card);
    }

    showNoAgentsMessage(message = 'No agents found') {
        const grid = this.container.querySelector('#agents-grid');
        grid.innerHTML = `
            <div class="no-agents-message">
                ${message}
                <br><small>Agents will appear here once they register with the coordination system</small>
            </div>
        `;
    }

    updateStatusIndicator() {
        const activeCount = Array.from(this.agents.values()).filter(a => {
            const status = a.status || (a.isCurrent ? 'active' : 'inactive');
            return status === 'active';
        }).length;
        
        const indicator = this.container.querySelector('#active-agents-count');
        if (indicator) {
            indicator.textContent = `${activeCount} Active`;
        }
        
        const dot = this.container.querySelector('.status-dot');
        if (dot) {
            dot.className = `status-dot ${activeCount > 0 ? 'active' : 'offline'}`;
        }
    }

    updateAgentStatus(data) {
        const agent = this.agents.get(data.agentId);
        if (agent) {
            agent.status = data.status;
            agent.lastSeen = Date.now();
            
            const card = this.container.querySelector(`#agent-${data.agentId}`);
            if (card) {
                card.className = `agent-card ${data.status}`;
                const badge = card.querySelector('.agent-status-badge');
                badge.textContent = data.status;
                badge.className = `agent-status-badge ${data.status}`;
            }
            
            this.updateStatusIndicator();
        }
    }

    addAgent(agentData) {
        this.agents.set(agentData.id, agentData);
        const grid = this.container.querySelector('#agents-grid');
        this.renderAgentCard(agentData, grid);
        this.updateStatusIndicator();
        
        console.log(`Agent ${agentData.id} added to registry`);
    }

    removeAgent(data) {
        this.agents.delete(data.agentId);
        const card = this.container.querySelector(`#agent-${data.agentId}`);
        if (card) {
            card.remove();
        }
        this.updateStatusIndicator();
        
        console.log(`Agent ${data.agentId} removed from registry`);
    }

    updateAgentTask(data) {
        const agent = this.agents.get(data.agentId);
        if (agent) {
            agent.currentTask = data.taskDescription;
            agent.tasksCompleted += (data.completed ? 1 : 0);
            
            const card = this.container.querySelector(`#agent-${data.agentId}`);
            if (card) {
                const taskElement = card.querySelector('.current-task');
                if (taskElement) {
                    taskElement.innerHTML = `<strong>Current Task:</strong> ${data.taskDescription}`;
                }
                
                const tasksCount = card.querySelector('.metric-value');
                if (tasksCount) {
                    tasksCount.textContent = agent.tasksCompleted;
                }
            }
        }
    }

    formatUptime(startTime) {
        if (!startTime || startTime === 0) return 'Offline';
        
        const uptime = Date.now() - startTime;
        const hours = Math.floor(uptime / (1000 * 60 * 60));
        const minutes = Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60));
        
        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        } else {
            return `${minutes}m`;
        }
    }

    formatLastSeen(timestamp) {
        const diff = Date.now() - timestamp;
        const minutes = Math.floor(diff / (1000 * 60));
        
        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    }

    async refreshAgents() {
        const btn = this.container.querySelector('#refresh-agents-btn');
        btn.textContent = 'Refreshing...';
        btn.disabled = true;
        
        try {
            await this.loadAgents();
        } finally {
            btn.textContent = 'Refresh Agents';
            btn.disabled = false;
        }
    }

    startAutoRefresh() {
        this.refreshTimer = setInterval(() => {
            this.loadAgents();
        }, this.options.refreshInterval);
    }

    stopAutoRefresh() {
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
            this.refreshTimer = null;
        }
    }

    // Agent action methods (to be implemented based on coordination API)
    viewAgentDetails(agentId) {
        const agent = this.agents.get(agentId);
        if (agent) {
            // In real implementation, open a modal or navigate to details page
            console.log('Viewing details for agent:', agent);
            this.eventBus.emit('agent:details:requested', { agentId, agent });
        }
    }

    async assignTask(agentId) {
        console.log('Assigning task to agent:', agentId);
        
        // Emit event for task assignment UI
        this.eventBus.emit('task:assignment:requested', { agentId });
        
        // TODO: Integrate with drag-drop task assignment when implemented
        // For now, just show available tasks
        if (window.agentAPI) {
            try {
                const tasks = await window.agentAPI.fetchTasks({ status: 'pending', unassigned: true });
                this.eventBus.emit('tasks:available:for:assignment', { 
                    agentId, 
                    tasks: tasks.tasks || []
                });
            } catch (error) {
                console.error('Failed to fetch available tasks:', error);
            }
        }
    }

    async pauseAgent(agentId) {
        console.log('Pausing agent:', agentId);
        
        if (window.agentAPI) {
            try {
                await window.agentAPI.updateAgentStatus({
                    agentId,
                    status: 'inactive',
                    metadata: { reason: 'manually_paused' }
                });
            } catch (error) {
                console.error('Failed to pause agent:', error);
                this.handleAPIError({ type: 'pause_agent', error: error.message });
            }
        } else {
            // Fallback for demo purposes
            this.updateAgentStatus({ agentId, status: 'inactive' });
        }
    }

    async activateAgent(agentId) {
        console.log('Activating agent:', agentId);
        
        if (window.agentAPI) {
            try {
                await window.agentAPI.updateAgentStatus({
                    agentId,
                    status: 'active',
                    metadata: { reason: 'manually_activated' }
                });
            } catch (error) {
                console.error('Failed to activate agent:', error);
                this.handleAPIError({ type: 'activate_agent', error: error.message });
            }
        } else {
            // Fallback for demo purposes
            this.updateAgentStatus({ agentId, status: 'active' });
        }
    }

    handleAPIError(errorData) {
        console.error('API Error:', errorData);
        
        const errorMessages = {
            'fetch_agents': 'Failed to load agent data',
            'update_status': 'Failed to update agent status',
            'pause_agent': 'Failed to pause agent',
            'activate_agent': 'Failed to activate agent'
        };
        
        const message = errorMessages[errorData.type] || 'API operation failed';
        this.showNoAgentsMessage(`${message}: ${errorData.error}`);
    }

    startRealTimeUpdates() {
        // Start polling for real-time updates if API integration is available
        if (window.agentAPI && typeof window.agentAPI.startPolling === 'function') {
            window.agentAPI.startPolling();
        }
    }

    stopRealTimeUpdates() {
        // Stop polling when widget is destroyed
        if (window.agentAPI && typeof window.agentAPI.stopPolling === 'function') {
            window.agentAPI.stopPolling();
        }
    }

    destroy() {
        this.stopAutoRefresh();
        this.stopRealTimeUpdates();
        
        // Remove all event listeners
        this.eventBus.off('agent:status:changed');
        this.eventBus.off('agent:registered');
        this.eventBus.off('agent:unregistered');
        this.eventBus.off('task:assigned');
        this.eventBus.off('agents:fetched');
        this.eventBus.off('agent:status:updated');
        this.eventBus.off('agent:registered:success');
        this.eventBus.off('api:error');
    }
}

// Register widget with the dashboard system
if (window.WidgetManager) {
    window.WidgetManager.registerWidget('agent-registry', AgentRegistryWidget);
}

// Global reference for inline onclick handlers
window.agentRegistry = null;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const container = document.querySelector('[data-widget="agent-registry"]');
    if (container) {
        window.agentRegistry = new AgentRegistryWidget(container);
    }
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AgentRegistryWidget;
}