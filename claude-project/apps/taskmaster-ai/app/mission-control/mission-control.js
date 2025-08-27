/**
 * TaskMaster Mission Control - JavaScript Interface
 * Provides dynamic functionality for the Mission Control dashboard
 */

class MissionControl {
    constructor() {
        this.apiBase = '/api/v2';
        this.agents = [];
        this.tasks = [];
        this.refreshInterval = null;
        
        this.init();
    }

    /**
     * Initialize the Mission Control interface
     */
    async init() {
        this.bindEvents();
        this.startRefreshTimer();
        await this.loadInitialData();
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Quick action buttons
        document.getElementById('create-task-btn').addEventListener('click', () => this.showCreateTaskModal());
        document.getElementById('refresh-btn').addEventListener('click', () => this.refreshData());
        
        // Modal controls
        document.getElementById('cancel-task-btn').addEventListener('click', () => this.hideCreateTaskModal());
        document.getElementById('submit-task-btn').addEventListener('click', () => this.createTask());
        
        // Close modal on backdrop click
        document.getElementById('create-task-modal').addEventListener('click', (e) => {
            if (e.target.id === 'create-task-modal') {
                this.hideCreateTaskModal();
            }
        });

        // Navigation buttons
        document.getElementById('agent-overview-btn').addEventListener('click', () => this.showAgentOverview());
        document.getElementById('task-board-btn').addEventListener('click', () => this.showTaskBoard());
        document.getElementById('system-health-btn').addEventListener('click', () => this.showSystemHealth());
    }

    /**
     * Load initial data from API
     */
    async loadInitialData() {
        try {
            this.updateSystemStatus('warning');
            
            await Promise.all([
                this.loadAgents(),
                this.loadTasks(),
                this.loadSystemMetrics()
            ]);
            
            this.renderAgentStatus();
            this.renderTaskWorkflow();
            this.renderRecentActivity();
            this.updateSystemStatus('online');
            
            console.log('Data loaded - Agents:', this.agents.length, 'Tasks:', this.tasks.length);
        } catch (error) {
            console.error('Failed to load initial data:', error);
            this.updateSystemStatus('error');
            this.showError('Failed to connect to TaskMaster API');
        }
    }

    /**
     * Load agents from API
     */
    async loadAgents() {
        try {
            const response = await fetch(`${this.apiBase}/agents`);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const data = await response.json();
            this.agents = data.agents || [];
        } catch (error) {
            console.error('Failed to load agents:', error);
            // Fallback to mock data for demo
            this.agents = this.getMockAgents();
        }
    }

    /**
     * Load tasks from API
     */
    async loadTasks() {
        try {
            const response = await fetch(`${this.apiBase}/tasks`);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const data = await response.json();
            this.tasks = data.tasks || [];
            console.log('Loaded tasks:', this.tasks.length);
        } catch (error) {
            console.error('Failed to load tasks:', error);
            // Fallback to mock data for demo
            this.tasks = this.getMockTasks();
        }
    }

    /**
     * Load system metrics
     */
    async loadSystemMetrics() {
        try {
            const response = await fetch(`${this.apiBase}/status`);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const data = await response.json();
            this.updateMetrics(data);
        } catch (error) {
            console.error('Failed to load system metrics:', error);
            // Fallback to calculated metrics
            this.updateMetrics(this.calculateMetrics());
        }
    }

    /**
     * Render agent status cards
     */
    renderAgentStatus() {
        const container = document.getElementById('agent-status-list');
        container.innerHTML = '';

        this.agents.forEach(agent => {
            const agentCard = this.createAgentCard(agent);
            container.appendChild(agentCard);
        });
    }

    /**
     * Create agent status card element
     */
    createAgentCard(agent) {
        const card = document.createElement('div');
        card.className = 'flex items-center p-3 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors cursor-pointer';
        
        const statusColor = this.getAgentStatusColor(agent.status);
        const taskCount = agent.assignedTasks ? agent.assignedTasks.length : 0;
        
        // Get agent capabilities from config
        const capabilities = agent.capabilities ? agent.capabilities.slice(0, 2).join(', ') : '';
        
        card.innerHTML = `
            <div class="flex-shrink-0 w-10 h-10 ${statusColor} rounded-lg flex items-center justify-center text-white font-semibold">
                ${agent.name.charAt(0).toUpperCase()}
            </div>
            <div class="ml-3 flex-1 min-w-0">
                <p class="text-sm font-medium text-slate-900 truncate">${agent.name}</p>
                <p class="text-xs text-slate-500">${taskCount} active tasks</p>
                ${capabilities ? `<p class="text-xs text-slate-400">${capabilities}</p>` : ''}
            </div>
            <div class="flex-shrink-0">
                <div class="w-2 h-2 ${statusColor} rounded-full"></div>
            </div>
        `;
        
        card.addEventListener('click', () => this.showAgentDetails(agent));
        return card;
    }

    /**
     * Render task workflow board
     */
    renderTaskWorkflow() {
        const statuses = ['pending', 'in_progress', 'review', 'done'];
        
        statuses.forEach(status => {
            const container = document.getElementById(`${status.replace('_', '-')}-tasks`);
            if (!container) return;
            
            container.innerHTML = '';
            
            // Map API status to display status
            let statusTasks = [];
            if (status === 'in_progress') {
                statusTasks = this.tasks.filter(task => task.status === 'in-progress');
            } else {
                statusTasks = this.tasks.filter(task => task.status === status);
            }
            
            if (statusTasks.length === 0) {
                container.innerHTML = '<p class="text-sm text-slate-500 text-center py-4">No tasks</p>';
                return;
            }
            
            statusTasks.forEach(task => {
                const taskCard = this.createTaskCard(task);
                container.appendChild(taskCard);
            });
        });
    }

    /**
     * Create task card element
     */
    createTaskCard(task) {
        const card = document.createElement('div');
        card.className = 'bg-white p-3 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors cursor-pointer';
        
        const priorityColor = this.getPriorityColor(task.priority);
        const agent = this.agents.find(a => a.id === task.assignedTo);
        
        card.innerHTML = `
            <div class="flex items-start justify-between mb-2">
                <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-slate-900 truncate">${task.title || 'Untitled Task'}</p>
                    <p class="text-xs text-slate-500 mt-1">${task.description || ''}</p>
                </div>
                <div class="flex-shrink-0 ml-2">
                    <span class="inline-block w-3 h-3 ${priorityColor} rounded-full"></span>
                </div>
            </div>
            ${agent ? `
                <div class="flex items-center text-xs text-slate-500">
                    <span class="truncate">${agent.name}</span>
                </div>
            ` : ''}
        `;
        
        card.addEventListener('click', () => this.showTaskDetails(task));
        return card;
    }

    /**
     * Render recent activity
     */
    renderRecentActivity() {
        const container = document.getElementById('recent-activity');
        const activities = this.generateRecentActivities();
        
        container.innerHTML = '';
        
        activities.forEach(activity => {
            const activityItem = document.createElement('div');
            activityItem.className = 'flex items-start space-x-3 p-2 rounded-lg hover:bg-slate-50 transition-colors';
            
            activityItem.innerHTML = `
                <div class="flex-shrink-0 w-6 h-6 ${activity.color} rounded-full flex items-center justify-center">
                    <span class="text-xs text-white">${activity.icon}</span>
                </div>
                <div class="flex-1 min-w-0">
                    <p class="text-sm text-slate-900">${activity.message}</p>
                    <p class="text-xs text-slate-500">${activity.time}</p>
                </div>
            `;
            
            container.appendChild(activityItem);
        });
    }

    /**
     * Update system metrics display
     */
    updateMetrics(metrics) {
        document.getElementById('active-tasks-count').textContent = metrics.activeTasks || 0;
        document.getElementById('agents-online-count').textContent = metrics.agentsOnline || 0;
        document.getElementById('tasks-today-count').textContent = metrics.tasksToday || 0;
    }

    /**
     * Show create task modal
     */
    showCreateTaskModal() {
        document.getElementById('create-task-modal').classList.remove('hidden');
        document.getElementById('task-description').focus();
    }

    /**
     * Hide create task modal
     */
    hideCreateTaskModal() {
        document.getElementById('create-task-modal').classList.add('hidden');
        document.getElementById('create-task-form').reset();
    }

    /**
     * Create new task
     */
    async createTask() {
        const description = document.getElementById('task-description').value.trim();
        const priority = document.getElementById('task-priority').value;
        const suggestedAgent = document.getElementById('suggested-agent').value;
        
        if (!description) {
            this.showError('Please enter a task description');
            return;
        }
        
        // Show loading state
        const submitBtn = document.getElementById('submit-task-btn');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Creating...';
        submitBtn.disabled = true;
        
        try {
            // Create task via API
            const taskData = {
                title: description.substring(0, 50),
                description,
                priority,
                status: 'pending',
                assignedTo: suggestedAgent || null
            };
            
            // For MVP, add to local array and refresh data
            const newTask = {
                id: Date.now(),
                ...taskData,
                created: new Date().toISOString()
            };
            
            this.tasks.unshift(newTask);
            
            // If agent was selected, assign the task
            if (suggestedAgent) {
                await this.assignTaskToAgent(newTask.id, suggestedAgent);
            }
            
            // Refresh all data to show changes
            await this.refreshData();
            
            this.hideCreateTaskModal();
            this.showSuccess(`Task created${suggestedAgent ? ` and assigned to ${suggestedAgent}` : ''}`);
            
        } catch (error) {
            console.error('Failed to create task:', error);
            this.showError('Failed to create task');
        } finally {
            // Reset button state
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    }

    /**
     * Assign task to agent
     */
    async assignTaskToAgent(taskId, agentId) {
        try {
            const response = await fetch(`${this.apiBase}/tasks/${taskId}/assign`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    agentId: agentId,
                    workspace: 'master',
                    reasoning: 'Assigned via Mission Control'
                })
            });
            
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            // Update local data
            const task = this.tasks.find(t => t.id == taskId);
            if (task) {
                task.assignedTo = agentId;
            }
            
            const agent = this.agents.find(a => a.id === agentId);
            if (agent) {
                if (!agent.assignedTasks) agent.assignedTasks = [];
                if (!agent.assignedTasks.includes(String(taskId))) {
                    agent.assignedTasks.push(String(taskId));
                }
                agent.status = 'working';
            }
            
            return true;
        } catch (error) {
            console.error('Failed to assign task:', error);
            throw error;
        }
    }

    /**
     * Refresh all data
     */
    async refreshData() {
        const refreshBtn = document.getElementById('refresh-btn');
        refreshBtn.classList.add('animate-spin');
        
        try {
            await this.loadInitialData();
            this.showSuccess('Data refreshed');
        } catch (error) {
            this.showError('Failed to refresh data');
        } finally {
            refreshBtn.classList.remove('animate-spin');
        }
    }

    /**
     * Start auto-refresh timer
     */
    startRefreshTimer() {
        // Refresh every 30 seconds
        this.refreshInterval = setInterval(() => {
            this.loadSystemMetrics();
        }, 30000);
    }

    /**
     * Update system status indicator
     */
    updateSystemStatus(status) {
        const indicator = document.getElementById('system-status');
        const statusText = indicator.nextElementSibling;
        
        switch (status) {
            case 'online':
                indicator.className = 'w-3 h-3 bg-green-400 rounded-full pulse-success';
                statusText.textContent = 'System Online';
                break;
            case 'warning':
                indicator.className = 'w-3 h-3 bg-yellow-400 rounded-full';
                statusText.textContent = 'System Warning';
                break;
            case 'error':
                indicator.className = 'w-3 h-3 bg-red-400 rounded-full';
                statusText.textContent = 'System Error';
                break;
        }
    }

    /**
     * Show success message
     */
    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    /**
     * Show error message
     */
    showError(message) {
        this.showNotification(message, 'error');
    }

    /**
     * Show notification
     */
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 transform translate-x-full transition-transform duration-300 ${
            type === 'success' ? 'bg-green-600 text-white' :
            type === 'error' ? 'bg-red-600 text-white' :
            'bg-blue-600 text-white'
        }`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Slide in
        setTimeout(() => {
            notification.classList.remove('translate-x-full');
        }, 100);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.classList.add('translate-x-full');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    /**
     * Utility methods
     */
    getAgentStatusColor(status) {
        switch (status) {
            case 'active': return 'bg-green-500';
            case 'busy': return 'bg-blue-500';
            case 'idle': return 'bg-yellow-500';
            case 'offline': return 'bg-slate-400';
            default: return 'bg-slate-400';
        }
    }

    getPriorityColor(priority) {
        switch (priority) {
            case 'urgent': return 'bg-red-500';
            case 'high': return 'bg-orange-500';
            case 'medium': return 'bg-yellow-500';
            case 'low': return 'bg-blue-500';
            default: return 'bg-slate-400';
        }
    }

    calculateMetrics() {
        return {
            activeTasks: this.tasks.filter(t => t.status !== 'done' && t.status !== 'cancelled').length,
            agentsOnline: this.agents.filter(a => a.status !== 'offline').length,
            tasksToday: this.tasks.filter(t => {
                if (!t.created) return false;
                const today = new Date().toDateString();
                return new Date(t.created).toDateString() === today;
            }).length
        };
    }

    generateRecentActivities() {
        const activities = [];
        const now = new Date();
        
        // Add some sample activities based on current data
        this.tasks.slice(0, 3).forEach((task, index) => {
            const agent = this.agents.find(a => a.id === task.assignedTo);
            activities.push({
                icon: '📋',
                color: 'bg-blue-500',
                message: `Task "${task.title || 'Untitled'}" ${task.status === 'done' ? 'completed' : 'updated'}`,
                time: `${index + 1} min ago`
            });
        });
        
        return activities;
    }

    /**
     * Mock data for demonstration
     */
    getMockAgents() {
        return [
            { id: 'frontend-agent', name: 'Frontend Agent', status: 'active', capabilities: ['react', 'css', 'ui'] },
            { id: 'backend-agent', name: 'Backend Agent', status: 'busy', capabilities: ['node', 'api', 'database'] },
            { id: 'qa-specialist', name: 'QA Specialist', status: 'active', capabilities: ['testing', 'quality'] },
            { id: 'orchestrator-agent', name: 'Orchestrator', status: 'active', capabilities: ['coordination', 'planning'] },
            { id: 'documentation-agent', name: 'Documentation Agent', status: 'idle', capabilities: ['docs', 'writing'] }
        ];
    }

    getMockTasks() {
        return [
            {
                id: '1',
                title: 'Update homepage design',
                description: 'Refresh the main landing page with new branding',
                priority: 'high',
                status: 'in_progress',
                assignedTo: 'frontend-agent',
                created: new Date().toISOString()
            },
            {
                id: '2',
                title: 'API performance optimization',
                description: 'Optimize database queries for better response times',
                priority: 'medium',
                status: 'pending',
                assignedTo: 'backend-agent',
                created: new Date().toISOString()
            },
            {
                id: '3',
                title: 'Write user documentation',
                description: 'Create comprehensive user guide for new features',
                priority: 'low',
                status: 'review',
                assignedTo: 'documentation-agent',
                created: new Date().toISOString()
            }
        ];
    }

    /**
     * Navigation methods (placeholders for future implementation)
     */
    showAgentOverview() {
        this.showNotification('Agent overview feature coming soon');
    }

    showTaskBoard() {
        this.showNotification('Detailed task board feature coming soon');
    }

    showSystemHealth() {
        this.showNotification('System health dashboard coming soon');
    }

    async showAgentDetails(agent) {
        // Fetch agent configuration details
        try {
            const response = await fetch('/agent-roles.json');
            const agentRoles = await response.json();
            const agentConfig = agentRoles.agents[agent.id];
            
            // Create modal for agent details
            const modal = document.createElement('div');
            modal.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm z-50';
            modal.innerHTML = `
                <div class="flex items-center justify-center min-h-screen p-4">
                    <div class="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                        <div class="p-6 border-b border-slate-200">
                            <h3 class="text-lg font-semibold text-slate-900">${agent.name} Configuration</h3>
                        </div>
                        <div class="p-6 space-y-4">
                            <div>
                                <h4 class="font-medium text-slate-700 mb-2">Status</h4>
                                <p class="text-sm text-slate-600">
                                    Status: <span class="${this.getAgentStatusColor(agent.status)} text-white px-2 py-1 rounded text-xs">${agent.status}</span>
                                </p>
                                <p class="text-sm text-slate-600 mt-1">Assigned Tasks: ${agent.assignedTasks?.length || 0}</p>
                            </div>
                            
                            ${agentConfig ? `
                                <div>
                                    <h4 class="font-medium text-slate-700 mb-2">Description</h4>
                                    <p class="text-sm text-slate-600">${agentConfig.description}</p>
                                </div>
                                
                                <div>
                                    <h4 class="font-medium text-slate-700 mb-2">Capabilities</h4>
                                    <div class="flex flex-wrap gap-2">
                                        ${agentConfig.capabilities.map(cap => 
                                            `<span class="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">${cap}</span>`
                                        ).join('')}
                                    </div>
                                </div>
                                
                                <div>
                                    <h4 class="font-medium text-slate-700 mb-2">Keywords</h4>
                                    <div class="flex flex-wrap gap-1">
                                        ${agentConfig.keywords.map(kw => 
                                            `<span class="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs">${kw}</span>`
                                        ).join('')}
                                    </div>
                                </div>
                                
                                <div>
                                    <h4 class="font-medium text-slate-700 mb-2">MCP Tools</h4>
                                    <div class="text-sm text-slate-600 font-mono bg-slate-50 p-3 rounded">
                                        ${agentConfig.tools.slice(0, 5).join(', ')}${agentConfig.tools.length > 5 ? ` + ${agentConfig.tools.length - 5} more` : ''}
                                    </div>
                                </div>
                                
                                ${agentConfig.exclusive ? `
                                    <div class="p-3 bg-yellow-50 border border-yellow-200 rounded">
                                        <p class="text-sm text-yellow-800">
                                            <strong>Exclusive Agent:</strong> ${agentConfig.exclusivePermissions || 'Special permissions'}
                                        </p>
                                    </div>
                                ` : ''}
                            ` : `
                                <p class="text-sm text-slate-500">Configuration details not available</p>
                            `}
                        </div>
                        <div class="p-6 border-t border-slate-200 flex justify-end">
                            <button class="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors">Close</button>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            // Close on click
            modal.addEventListener('click', (e) => {
                if (e.target === modal || e.target.textContent === 'Close') {
                    document.body.removeChild(modal);
                }
            });
            
        } catch (error) {
            console.error('Failed to load agent configuration:', error);
            this.showNotification(`Agent details for ${agent.name} - Error loading configuration`);
        }
    }

    showTaskDetails(task) {
        this.showNotification(`Task details for "${task.title}" coming soon`);
    }
}

// Initialize Mission Control when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.missionControl = new MissionControl();
});

// Handle page visibility changes to pause/resume refreshing
document.addEventListener('visibilitychange', () => {
    if (window.missionControl) {
        if (document.hidden) {
            if (window.missionControl.refreshInterval) {
                clearInterval(window.missionControl.refreshInterval);
            }
        } else {
            window.missionControl.startRefreshTimer();
        }
    }
});