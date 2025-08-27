/**
 * Dashboard Manager
 * Manages widget loading, initialization, and coordination
 */

class DashboardManager {
    constructor() {
        this.widgets = new Map();
        this.apiClient = new TaskMasterApiClient();
        this.refreshInterval = null;
        this.refreshRate = 30000; // 30 seconds
    }

    async init() {
        console.log('🚀 Initializing TaskMaster Dashboard...');
        
        try {
            // Load dashboard data
            await this.loadDashboardData();
            
            // Initialize widgets
            await this.initializeWidgets();
            
            // Set up refresh interval
            this.startAutoRefresh();
            
            // Set up event listeners
            this.setupEventListeners();
            
            console.log('✅ Dashboard initialized successfully');
        } catch (error) {
            console.error('❌ Dashboard initialization failed:', error);
            this.showError('Dashboard initialization failed');
        }
    }

    async loadDashboardData() {
        try {
            const data = await this.apiClient.getDashboardData();
            this.dashboardData = data;
            this.updateDashboardHeader(data);
            return data;
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
            this.dashboardData = this.apiClient.getEmptyDashboardData();
            return this.dashboardData;
        }
    }

    updateDashboardHeader(data) {
        const header = document.querySelector('.dashboard-header h1');
        if (header) {
            header.textContent = `TaskMaster Dashboard (${data.stats.total} tasks, ${data.agents.length} agents)`;
        }
    }

    async initializeWidgets() {
        const widgetGrid = document.getElementById('widget-grid');
        if (!widgetGrid) {
            throw new Error('Widget grid container not found');
        }

        // Clear existing widgets
        widgetGrid.innerHTML = '';

        // Create widget containers
        const widgets = [
            { id: 'task-summary', title: 'Task Summary', type: 'task-summary' },
            { id: 'agent-status', title: 'Agent Status', type: 'agent-status' },
            { id: 'recent-tasks', title: 'Recent Tasks', type: 'recent-tasks' },
            { id: 'coordination', title: 'Coordination Status', type: 'coordination' }
        ];

        for (const widget of widgets) {
            const container = this.createWidgetContainer(widget);
            widgetGrid.appendChild(container);
            await this.initializeWidget(widget.type, container);
        }
    }

    createWidgetContainer(widget) {
        const container = document.createElement('div');
        container.className = 'widget-container';
        container.id = `widget-${widget.id}`;
        container.innerHTML = `
            <div class="widget-header">
                <h3>${widget.title}</h3>
                <button class="widget-refresh" data-widget="${widget.type}">↻</button>
            </div>
            <div class="widget-content" data-widget-type="${widget.type}">
                <div class="loading">Loading...</div>
            </div>
        `;
        return container;
    }

    async initializeWidget(type, container) {
        try {
            const content = container.querySelector('.widget-content');
            
            switch (type) {
                case 'task-summary':
                    await this.renderTaskSummary(content);
                    break;
                case 'agent-status':
                    await this.renderAgentStatus(content);
                    break;
                case 'recent-tasks':
                    await this.renderRecentTasks(content);
                    break;
                case 'coordination':
                    await this.renderCoordination(content);
                    break;
                default:
                    content.innerHTML = `<p>Unknown widget type: ${type}</p>`;
            }

            this.widgets.set(type, { container, lastUpdate: Date.now() });
        } catch (error) {
            console.error(`Failed to initialize widget ${type}:`, error);
            const content = container.querySelector('.widget-content');
            content.innerHTML = `<p class="error">Failed to load widget</p>`;
        }
    }

    async renderTaskSummary(content) {
        const data = this.dashboardData;
        content.innerHTML = `
            <div class="stats-grid">
                <div class="stat-item">
                    <div class="stat-value">${data.stats.total}</div>
                    <div class="stat-label">Total Tasks</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${data.stats.completed}</div>
                    <div class="stat-label">Completed</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${data.stats.inProgress}</div>
                    <div class="stat-label">In Progress</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${data.stats.pending}</div>
                    <div class="stat-label">Pending</div>
                </div>
            </div>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${data.stats.completionPercentage || 0}%"></div>
            </div>
            <div class="progress-text">${data.stats.completionPercentage || 0}% Complete</div>
        `;
    }

    async renderAgentStatus(content) {
        const agents = this.dashboardData.agents;
        content.innerHTML = `
            <div class="agent-list">
                ${agents.map(agent => `
                    <div class="agent-item ${agent.isCurrent ? 'current' : ''}">
                        <div class="agent-name">${agent.name}</div>
                        <div class="agent-stats">
                            <span class="task-count">${agent.taskCount} tasks</span>
                            <span class="completed-count">${agent.completedTasks} completed</span>
                        </div>
                        <div class="agent-status ${agent.isCurrent ? 'active' : 'idle'}">
                            ${agent.isCurrent ? '🟢 Active' : '⚪ Idle'}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    async renderRecentTasks(content) {
        const tasks = this.dashboardData.tasks.slice(0, 5);
        content.innerHTML = `
            <div class="task-list">
                ${tasks.map(task => `
                    <div class="task-item">
                        <div class="task-header">
                            <span class="task-id">#${task.id}</span>
                            <span class="task-status status-${task.status}">${task.status}</span>
                        </div>
                        <div class="task-title">${task.title}</div>
                        <div class="task-meta">
                            <span class="task-agent">${task.assignedAgent}</span>
                            ${task.subtasks ? `<span class="task-subtasks">${task.subtasks.length} subtasks</span>` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    async renderCoordination(content) {
        const coordination = this.dashboardData.coordination;
        content.innerHTML = `
            <div class="coordination-stats">
                <div class="coord-item">
                    <div class="coord-label">Total Agents</div>
                    <div class="coord-value">${coordination.totalAgents || 0}</div>
                </div>
                <div class="coord-item">
                    <div class="coord-label">Available</div>
                    <div class="coord-value">${coordination.availableAgents || 0}</div>
                </div>
                <div class="coord-item">
                    <div class="coord-label">Busy</div>
                    <div class="coord-value">${coordination.busyAgents || 0}</div>
                </div>
            </div>
            <div class="sync-controls">
                <button id="trigger-sync" class="sync-button">🔄 Sync with TaskMaster</button>
            </div>
        `;

        // Add sync button listener
        const syncButton = content.querySelector('#trigger-sync');
        if (syncButton) {
            syncButton.addEventListener('click', () => this.triggerSync());
        }
    }

    async triggerSync() {
        try {
            const syncButton = document.querySelector('#trigger-sync');
            if (syncButton) {
                syncButton.textContent = '🔄 Syncing...';
                syncButton.disabled = true;
            }

            await this.apiClient.triggerSync();
            await this.refreshDashboard();

            if (syncButton) {
                syncButton.textContent = '✅ Synced';
                setTimeout(() => {
                    syncButton.textContent = '🔄 Sync with TaskMaster';
                    syncButton.disabled = false;
                }, 2000);
            }
        } catch (error) {
            console.error('Sync failed:', error);
            const syncButton = document.querySelector('#trigger-sync');
            if (syncButton) {
                syncButton.textContent = '❌ Sync Failed';
                setTimeout(() => {
                    syncButton.textContent = '🔄 Sync with TaskMaster';
                    syncButton.disabled = false;
                }, 2000);
            }
        }
    }

    setupEventListeners() {
        // Refresh all button
        const refreshButton = document.getElementById('refresh-all');
        if (refreshButton) {
            refreshButton.addEventListener('click', () => this.refreshDashboard());
        }

        // Individual widget refresh buttons
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('widget-refresh')) {
                const widgetType = e.target.dataset.widget;
                this.refreshWidget(widgetType);
            }
        });
    }

    async refreshWidget(type) {
        const widget = this.widgets.get(type);
        if (widget) {
            await this.initializeWidget(type, widget.container);
        }
    }

    async refreshDashboard() {
        console.log('🔄 Refreshing dashboard...');
        this.apiClient.clearCache();
        await this.loadDashboardData();
        await this.initializeWidgets();
    }

    startAutoRefresh() {
        this.refreshInterval = setInterval(() => {
            this.refreshDashboard();
        }, this.refreshRate);
    }

    stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }

    showError(message) {
        const widgetGrid = document.getElementById('widget-grid');
        if (widgetGrid) {
            widgetGrid.innerHTML = `
                <div class="error-container">
                    <h3>⚠️ Error</h3>
                    <p>${message}</p>
                    <button onclick="location.reload()">Reload Page</button>
                </div>
            `;
        }
    }
}

// Make available globally
window.DashboardManager = DashboardManager;
window.WidgetManager = DashboardManager; // Backward compatibility

// Export for ES6 modules
export default DashboardManager;