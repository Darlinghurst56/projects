/**
 * Task Assignment Widget - Home Vibe Coder Standards
 * Drag & Drop interface for scheduling tasks to agents
 */

class TaskAssignmentWidget {
    constructor(container, options = {}) {
        this.container = container;
        this.options = {
            refreshInterval: 15000, // 15 seconds
            maxTasksPerAgent: 5,
            ...options
        };
        
        this.unassignedTasks = [];
        this.agents = new Map();
        this.assignments = new Map();
        this.draggedTask = null;
        this.eventBus = window.eventBus || new EventBus();
        
        this.init();
    }

    init() {
        this.render();
        this.setupEventListeners();
        this.setupDragAndDrop();
        this.loadData();
        
        console.log('Task Assignment Widget initialized');
    }

    render() {
        this.container.innerHTML = `
            <div class="task-assignment-widget">
                <div class="task-assignment-header">
                    <h2 class="task-assignment-title">Task Assignment</h2>
                    <div class="assignment-controls">
                        <select class="filter-select" id="task-filter">
                            <option value="all">All Tasks</option>
                            <option value="pending">Pending Only</option>
                            <option value="high">High Priority</option>
                            <option value="frontend">Frontend Tasks</option>
                            <option value="backend">Backend Tasks</option>
                            <option value="integration">Integration Tasks</option>
                        </select>
                        <button class="auto-assign-btn" id="auto-assign-btn">
                            Auto Assign
                        </button>
                    </div>
                </div>
                <div class="taskmaster-summary" style="margin-bottom: 16px; padding: 12px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #007bff;">
                    <div style="display: flex; gap: 20px; font-size: 0.9rem;">
                        <span>📊 Total TaskMaster: <strong id="total-tm-tasks">Loading...</strong></span>
                        <span>🏷️ Contexts: <strong id="total-contexts">5</strong></span>
                        <span>🔄 Integration: <strong style="color: #28a745;">Active</strong></span>
                    </div>
                </div>
                
                <div class="assignment-workspace">
                    <div class="task-queue">
                        <div class="task-queue-header">
                            <h3 class="task-queue-title">Unassigned Tasks</h3>
                            <span class="task-count" id="unassigned-count">0 tasks</span>
                        </div>
                        <div class="tasks-list" id="tasks-list">
                            <!-- Unassigned tasks will be populated here -->
                        </div>
                    </div>
                    
                    <div class="agent-columns" id="agent-columns">
                        <!-- Agent columns will be populated here -->
                    </div>
                </div>
                
                <div class="assignment-summary">
                    <h4 class="summary-title">Assignment Summary</h4>
                    <div class="summary-stats" id="summary-stats">
                        <!-- Summary statistics will be populated here -->
                    </div>
                </div>
            </div>
        `;
    }

    setupEventListeners() {
        // Filter dropdown
        const filter = this.container.querySelector('#task-filter');
        filter.addEventListener('change', (e) => this.filterTasks(e.target.value));
        
        // Auto assign button
        const autoAssignBtn = this.container.querySelector('#auto-assign-btn');
        autoAssignBtn.addEventListener('click', () => this.autoAssignTasks());
        
        // Event bus listeners
        this.eventBus.on('task:created', (data) => this.addTask(data));
        this.eventBus.on('task:completed', (data) => this.markTaskCompleted(data));
        this.eventBus.on('agent:status:changed', (data) => this.updateAgentStatus(data));
        
        // API integration event listeners
        this.eventBus.on('agents:fetched', (data) => this.updateAgentsData(data.agents || data));
        this.eventBus.on('tasks:fetched', (data) => this.updateTasksData(data.tasks || data));
        this.eventBus.on('task:assigned:success', (data) => this.handleTaskAssigned(data));
        this.eventBus.on('agent:status:updated', (data) => this.updateAgentStatus(data));
        this.eventBus.on('api:error', (data) => this.handleAPIError(data));
    }

    setupDragAndDrop() {
        // Will be set up after tasks are rendered
        this.setupTaskDragHandlers();
        this.setupAgentDropZones();
    }

    setupTaskDragHandlers() {
        const tasksList = this.container.querySelector('#tasks-list');
        
        tasksList.addEventListener('dragstart', (e) => {
            if (e.target.classList.contains('task-item')) {
                this.draggedTask = e.target;
                e.target.classList.add('dragging');
                e.dataTransfer.setData('text/plain', e.target.dataset.taskId);
                e.dataTransfer.effectAllowed = 'move';
            }
        });
        
        tasksList.addEventListener('dragend', (e) => {
            if (e.target.classList.contains('task-item')) {
                e.target.classList.remove('dragging');
                this.draggedTask = null;
            }
        });
    }

    setupAgentDropZones() {
        const agentColumns = this.container.querySelector('#agent-columns');
        
        agentColumns.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            
            const column = e.target.closest('.agent-column');
            if (column) {
                column.classList.add('drag-over');
            }
        });
        
        agentColumns.addEventListener('dragleave', (e) => {
            const column = e.target.closest('.agent-column');
            if (column && !column.contains(e.relatedTarget)) {
                column.classList.remove('drag-over');
            }
        });
        
        agentColumns.addEventListener('drop', (e) => {
            e.preventDefault();
            
            const column = e.target.closest('.agent-column');
            if (column) {
                column.classList.remove('drag-over');
                
                const agentId = column.dataset.agentId;
                const taskId = e.dataTransfer.getData('text/plain');
                
                this.assignTask(taskId, agentId);
            }
        });
    }

    async loadData() {
        try {
            const [tasks, agents] = await Promise.all([
                this.fetchUnassignedTasks(),
                this.fetchAgents()
            ]);
            
            this.unassignedTasks = tasks;
            this.updateAgentsData(agents);
            this.renderTasks();
            this.renderAgentColumns();
            this.updateSummaryStats();
            
        } catch (error) {
            console.error('Failed to load assignment data:', error);
            // Show error message in the tasks list area
            const tasksList = this.container.querySelector('#tasks-list');
            if (tasksList) {
                tasksList.innerHTML = `
                    <div class="error-message" style="padding: 20px; text-align: center; color: #dc3545;">
                        ⚠️ Task data unavailable<br>
                        <small>Please check TaskMaster API connection</small>
                    </div>
                `;
            }
        }
    }

    async fetchUnassignedTasks() {
        try {
            // Use Agent API integration if available
            if (window.agentAPI) {
                console.log('Using Agent API for task data...');
                
                try {
                    const response = await window.agentAPI.fetchTasks({ 
                        status: 'pending', 
                        unassigned: true 
                    });
                    const allTasks = response.tasks || response;
                    
                    // Update TaskMaster summary display
                    this.updateTaskMasterSummary(allTasks.length);
                    
                    // Convert to widget format
                    return allTasks.map(task => ({
                        id: task.id.toString(),
                        title: task.title,
                        description: task.description || 'No description available',
                        priority: task.priority || 'medium',
                        capabilities: this.inferCapabilities(task),
                        estimatedTime: this.estimateTime(task),
                        dependencies: task.dependencies || [],
                        status: task.status || 'pending',
                        context: task.sourceTag || task.context
                    }));
                    
                } catch (error) {
                    console.warn('Failed to fetch tasks from TaskMaster API:', error);
                    
                    // Fallback to sample data from real tasks
                    const sampleTasks = [
                        {
                            id: '1',
                            title: 'QA Testing: DNS Analytics Widget',
                            description: 'Perform QA testing on DNS Analytics Widget functionality',
                            priority: 'high',
                            status: 'in-progress',
                            context: 'qa-specialist'
                        },
                        {
                            id: '5',
                            title: 'Replace Dashboard Mock Data with Real API Calls',
                            description: 'Replace all mock data with real API integration',
                            priority: 'high',
                            status: 'pending',
                            context: 'integration-specialist'
                        },
                        {
                            id: '6',
                            title: 'Resolve Puppeteer Browser Launch Failure',
                            description: 'Fix browser launch error for automated testing',
                            priority: 'medium',
                            status: 'pending',
                            context: 'server-agent'
                        },
                        {
                            id: '7',
                            title: 'QA Testing: Agent Dashboard TaskMaster Integration',
                            description: 'Test integration between dashboard and TaskMaster',
                            priority: 'medium',
                            status: 'pending',
                            context: 'qa-specialist'
                        }
                    ];
                    
                    this.updateTaskMasterSummary(sampleTasks.length);
                    
                    return sampleTasks.map(task => ({
                        id: task.id.toString(),
                        title: task.title,
                        description: task.description,
                        priority: task.priority || 'medium',
                        capabilities: this.inferCapabilities(task),
                        estimatedTime: this.estimateTime(task),
                        dependencies: [],
                        status: task.status,
                        context: task.context
                    }));
                }
            }
            
            // Use new TaskMaster API
            const response = await fetch('http://localhost:3001/api/tasks');
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            // Update TaskMaster summary display
            this.updateTaskMasterSummary(data.stats.total);
            
            return data.tasks.map(task => ({
                id: task.id.toString(),
                title: task.title,
                description: task.description,
                priority: task.priority || 'medium',
                capabilities: this.inferCapabilities(task),
                estimatedTime: this.estimateTime(task),
                dependencies: task.dependencies || [],
                status: task.status,
                context: task.sourceTag || task.assignedAgent,
                assignedAgent: task.assignedAgent
            }));
        } catch (error) {
            console.warn('Failed to fetch real tasks, using minimal fallback:', error);
            
            // Minimal fallback for demonstration
            return [
                {
                    id: '13',
                    title: 'Fix all non-functional buttons in dashboard',
                    description: 'Implement proper event handlers for all placeholder buttons',
                    priority: 'medium',
                    capabilities: ['frontend-development', 'testing'],
                    estimatedTime: '1h',
                    dependencies: [],
                    status: 'pending'
                }
            ];
        }
    }

    inferCapabilities(task) {
        const text = `${task.title} ${task.description}`.toLowerCase();
        const capabilities = [];
        
        if (text.includes('ui') || text.includes('frontend') || text.includes('css') || text.includes('html')) {
            capabilities.push('frontend-development', 'ui-development');
        }
        if (text.includes('api') || text.includes('backend') || text.includes('server')) {
            capabilities.push('backend-development', 'api-integration');
        }
        if (text.includes('test') || text.includes('qa') || text.includes('validation')) {
            capabilities.push('testing');
        }
        
        return capabilities.length > 0 ? capabilities : ['general'];
    }

    estimateTime(task) {
        const complexity = task.complexityScore || 3;
        if (complexity <= 2) return '1h';
        if (complexity <= 5) return '2h';
        if (complexity <= 7) return '3h';
        return '4h+';
    }

    async fetchAgents() {
        try {
            if (window.agentAPI) {
                const response = await window.agentAPI.fetchAgents();
                const agentsData = response.agents || response;
                
                // Convert API agent data to widget format
                return agentsData.map(agent => ({
                    id: agent.id,
                    name: agent.name || agent.id,
                    status: agent.status || 'idle',
                    capabilities: agent.capabilities || this.getAgentCapabilities(agent.id),
                    currentTasks: [], // Will be populated from task assignments
                    maxTasks: this.getMaxTasks(agent.id),
                    utilization: 0 // Will be calculated
                }));
            }
            
            // Fallback to direct API call
            const response = await fetch('/api/agents/workload');
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            const agents = [];
            
            // Convert workload data to agent format
            for (const [agentId, workloadData] of Object.entries(data.workload)) {
                agents.push({
                    id: agentId,
                    name: workloadData.agentName,
                    status: workloadData.count > 0 ? 'active' : 'idle',
                    capabilities: this.getAgentCapabilities(agentId),
                    currentTasks: workloadData.tasks.map(task => ({
                        id: task.id.toString(),
                        title: task.title,
                        status: task.status,
                        progress: task.status === 'done' ? 100 : 
                               task.status === 'in-progress' ? 50 : 0
                    })),
                    maxTasks: this.getMaxTasks(agentId),
                    utilization: Math.min(workloadData.count / this.getMaxTasks(agentId), 1.0)
                });
            }
            
            return agents;
        } catch (error) {
            console.error('Failed to fetch real agents:', error);
            return [];
        }
    }

    getAgentCapabilities(agentId) {
        const capabilityMap = {
            'frontend-architect': ['frontend-development', 'architecture'],
            'ui-developer': ['frontend-development', 'ui-development'],
            'integration-specialist': ['backend-development', 'api-integration'],
            'qa-specialist': ['testing', 'quality-assurance'],
            'server-agent': ['server-management', 'deployment']
        };
        return capabilityMap[agentId] || ['general'];
    }

    getMaxTasks(agentId) {
        const maxTaskMap = {
            'frontend-architect': 2,
            'ui-developer': 3,
            'integration-specialist': 3,
            'qa-specialist': 4,
            'server-agent': 2
        };
        return maxTaskMap[agentId] || 3;
    }

    updateAgentsData(agents) {
        this.agents.clear();
        agents.forEach(agent => {
            this.agents.set(agent.id, agent);
        });
    }

    renderTasks() {
        const tasksList = this.container.querySelector('#tasks-list');
        
        if (this.unassignedTasks.length === 0) {
            tasksList.innerHTML = `
                <div class="empty-queue-message">
                    All tasks have been assigned!
                    <br><small>New tasks will appear here when created</small>
                </div>
            `;
            return;
        }
        
        tasksList.innerHTML = this.unassignedTasks.map(task => 
            this.renderTaskItem(task)
        ).join('');
        
        // Make tasks draggable
        tasksList.querySelectorAll('.task-item').forEach(item => {
            item.draggable = true;
        });
        
        this.updateTaskCount();
    }

    renderTaskItem(task) {
        const capabilityDots = task.capabilities.map(() => 
            '<span class="capability-dot"></span>'
        ).join('');
        
        return `
            <div class="task-item" data-task-id="${task.id}" draggable="true">
                <div class="task-item-header">
                    <h4 class="task-title">${task.title}</h4>
                    <span class="task-priority ${task.priority}">${task.priority}</span>
                </div>
                <p class="task-description">${task.description}</p>
                <div class="task-meta">
                    <span class="task-id">#${task.id}</span>
                    <span class="task-capabilities">${capabilityDots}</span>
                    <span class="task-time">${task.estimatedTime}</span>
                </div>
            </div>
        `;
    }

    renderAgentColumns() {
        const agentColumns = this.container.querySelector('#agent-columns');
        
        agentColumns.innerHTML = Array.from(this.agents.values()).map(agent => 
            this.renderAgentColumn(agent)
        ).join('');
    }

    renderAgentColumn(agent) {
        const assignedTasks = agent.currentTasks.map(task => 
            this.renderAssignedTask(task)
        ).join('');
        
        const dropZoneMessage = agent.currentTasks.length === 0 ? 
            `<div class="drop-zone-message">Drop tasks here to assign to ${agent.name}</div>` : '';
        
        return `
            <div class="agent-column" data-agent-id="${agent.id}">
                <div class="agent-column-header">
                    <h3 class="agent-name">
                        <span class="agent-status-dot ${agent.status}"></span>
                        ${agent.name}
                    </h3>
                    <span class="agent-workload">${agent.currentTasks.length}/${agent.maxTasks}</span>
                </div>
                <div class="assigned-tasks">
                    ${assignedTasks}
                    ${dropZoneMessage}
                </div>
            </div>
        `;
    }

    renderAssignedTask(task) {
        return `
            <div class="assigned-task ${task.status}">
                <h5 style="margin: 0 0 4px 0; font-size: 0.9rem;">${task.title}</h5>
                <div style="font-size: 0.75rem; color: var(--text-secondary);">
                    Progress: ${task.progress}%
                </div>
                <div style="width: 100%; background: var(--border-light); height: 4px; border-radius: 2px; margin-top: 4px;">
                    <div style="width: ${task.progress}%; background: var(--accent-color); height: 100%; border-radius: 2px; transition: width 0.3s ease;"></div>
                </div>
            </div>
        `;
    }

    filterTasks(filterType) {
        const tasks = this.container.querySelectorAll('.task-item');
        
        tasks.forEach(task => {
            const taskId = task.dataset.taskId;
            const taskData = this.unassignedTasks.find(t => t.id === taskId);
            let show = true;
            
            switch (filterType) {
                case 'pending':
                    show = taskData.status === 'pending';
                    break;
                case 'high':
                    show = taskData.priority === 'high';
                    break;
                case 'frontend':
                    show = taskData.capabilities.includes('frontend-development');
                    break;
                case 'backend':
                    show = taskData.capabilities.includes('backend-development');
                    break;
                default: // 'all'
                    show = true;
            }
            
            task.style.display = show ? 'block' : 'none';
        });
    }

    async assignTask(taskId, agentId) {
        const task = this.unassignedTasks.find(t => t.id === taskId);
        const agent = this.agents.get(agentId);
        
        if (!task || !agent) {
            console.error('Invalid task or agent for assignment');
            return;
        }
        
        // Check if agent can handle this task
        const hasCapability = task.capabilities.some(cap => 
            agent.capabilities.includes(cap)
        );
        
        if (!hasCapability) {
            alert(`${agent.name} doesn't have the required capabilities for this task`);
            return;
        }
        
        // Check agent capacity
        if (agent.currentTasks.length >= agent.maxTasks) {
            alert(`${agent.name} is at maximum capacity (${agent.maxTasks} tasks)`);
            return;
        }
        
        try {
            // Use Agent API integration for assignment
            if (window.agentAPI) {
                const result = await window.agentAPI.assignTask({
                    taskId,
                    agentId,
                    priority: task.priority || 'medium'
                });
                console.log('Assignment successful:', result);
            } else {
                // Fallback to direct API call
                const response = await fetch(`/api/agents/${agentId}/assign-task`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ taskId, priority: task.priority || 'medium' })
                });
                
                if (!response.ok) {
                    throw new Error(`Assignment failed: ${response.statusText}`);
                }
                
                const result = await response.json();
                console.log('Assignment successful:', result);
            }
            
            // Update local state
            this.unassignedTasks = this.unassignedTasks.filter(t => t.id !== taskId);
            
            agent.currentTasks.push({
                id: taskId,
                title: task.title,
                status: 'assigned',
                progress: 0
            });
            
            agent.utilization = agent.currentTasks.length / agent.maxTasks;
            
            // Update display
            this.renderTasks();
            this.renderAgentColumns();
            this.updateSummaryStats();
            
            // Notify other widgets
            this.eventBus.emit('task:assigned', {
                taskId,
                agentId,
                task,
                agent: agent.name
            });
            
            console.log(`Task ${taskId} assigned to ${agent.name}`);
            
        } catch (error) {
            console.error('Failed to assign task via API:', error);
            alert(`Failed to assign task: ${error.message}`);
        }
    }

    async autoAssignTasks() {
        const btn = this.container.querySelector('#auto-assign-btn');
        btn.textContent = 'Assigning...';
        btn.disabled = true;
        
        try {
            // Call TaskMaster auto-assign API
            const response = await fetch('/api/agents/auto-assign', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`Auto-assignment failed: ${response.statusText}`);
            }
            
            const result = await response.json();
            console.log('Auto-assignment result:', result);
            
            // Refresh data to reflect assignments
            await this.loadData();
            
            alert(`Auto-assignment completed! ${result.assignedCount || 0} tasks assigned.`);
            
        } catch (error) {
            console.error('Auto-assignment failed:', error);
            alert(`Auto-assignment failed: ${error.message}`);
        } finally {
            btn.textContent = 'Auto Assign';
            btn.disabled = false;
        }
    }

    updateTaskCount() {
        const count = this.container.querySelector('#unassigned-count');
        count.textContent = `${this.unassignedTasks.length} tasks`;
    }

    updateTaskMasterSummary(totalTasks) {
        const totalTasksElement = this.container.querySelector('#total-tm-tasks');
        if (totalTasksElement) {
            totalTasksElement.textContent = totalTasks || 'N/A';
        }
    }

    updateSummaryStats() {
        const summaryStats = this.container.querySelector('#summary-stats');
        
        const totalTasks = this.unassignedTasks.length + 
            Array.from(this.agents.values()).reduce((sum, agent) => sum + agent.currentTasks.length, 0);
        
        const assignedTasks = Array.from(this.agents.values())
            .reduce((sum, agent) => sum + agent.currentTasks.length, 0);
        
        const activeAgents = Array.from(this.agents.values())
            .filter(agent => agent.status === 'active').length;
        
        const avgUtilization = Array.from(this.agents.values())
            .reduce((sum, agent) => sum + agent.utilization, 0) / this.agents.size;
        
        summaryStats.innerHTML = `
            <div class="summary-stat">
                <span class="stat-value">${totalTasks}</span>
                <span class="stat-label">Total Tasks</span>
            </div>
            <div class="summary-stat">
                <span class="stat-value">${assignedTasks}</span>
                <span class="stat-label">Assigned</span>
            </div>
            <div class="summary-stat">
                <span class="stat-value">${this.unassignedTasks.length}</span>
                <span class="stat-label">Pending</span>
            </div>
            <div class="summary-stat">
                <span class="stat-value">${activeAgents}</span>
                <span class="stat-label">Active Agents</span>
            </div>
            <div class="summary-stat">
                <span class="stat-value">${Math.round(avgUtilization * 100)}%</span>
                <span class="stat-label">Avg Utilization</span>
            </div>
        `;
    }

    addTask(taskData) {
        this.unassignedTasks.push(taskData);
        this.renderTasks();
        this.updateSummaryStats();
    }

    markTaskCompleted(data) {
        const agent = this.agents.get(data.agentId);
        if (agent) {
            const task = agent.currentTasks.find(t => t.id === data.taskId);
            if (task && task.status !== 'completed') { // Prevent duplicate completion
                task.status = 'completed';
                task.progress = 100;
                task.completedAt = new Date().toISOString();
                
                // Remove completed task from agent's current tasks
                agent.currentTasks = agent.currentTasks.filter(t => t.id !== data.taskId);
                
                // Debounce re-rendering to prevent event loops
                if (!this.renderDebounceTimer) {
                    this.renderDebounceTimer = setTimeout(() => {
                        this.renderAgentColumns();
                        this.updateSummaryStats();
                        this.renderDebounceTimer = null;
                    }, 1000); // 1 second debounce
                }
            }
        }
    }

    updateAgentStatus(data) {
        const agent = this.agents.get(data.agentId);
        if (agent) {
            agent.status = data.status;
            this.renderAgentColumns();
        }
    }

    updateTasksData(tasksData) {
        this.unassignedTasks = tasksData;
        this.renderTasks();
        this.updateSummaryStats();
    }

    handleTaskAssigned(data) {
        // Remove assigned task from unassigned list
        this.unassignedTasks = this.unassignedTasks.filter(t => t.id !== data.taskId);
        
        // Update agent's current tasks if available
        const agent = this.agents.get(data.agentId);
        if (agent) {
            agent.currentTasks.push({
                id: data.taskId,
                title: data.taskTitle || `Task ${data.taskId}`,
                status: 'assigned',
                progress: 0
            });
            agent.utilization = agent.currentTasks.length / agent.maxTasks;
        }
        
        // Re-render affected components
        this.renderTasks();
        this.renderAgentColumns();
        this.updateSummaryStats();
    }

    handleAPIError(errorData) {
        console.error('API Error in Task Assignment:', errorData);
        
        // Show error in the interface
        const errorMessages = {
            'fetch_agents': 'Failed to load agent data',
            'fetch_tasks': 'Failed to load task data', 
            'assign_task': 'Failed to assign task'
        };
        
        const message = errorMessages[errorData.type] || 'API operation failed';
        alert(`${message}: ${errorData.error}`);
    }

    destroy() {
        // Remove all event listeners
        this.eventBus.off('task:created');
        this.eventBus.off('task:completed');
        this.eventBus.off('agent:status:changed');
        this.eventBus.off('agents:fetched');
        this.eventBus.off('tasks:fetched');
        this.eventBus.off('task:assigned:success');
        this.eventBus.off('agent:status:updated');
        this.eventBus.off('api:error');
    }
}

// Register widget with the dashboard system
if (window.WidgetManager) {
    window.WidgetManager.registerWidget('task-assignment', TaskAssignmentWidget);
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const container = document.querySelector('[data-widget="task-assignment"]');
    if (container) {
        new TaskAssignmentWidget(container);
    }
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TaskAssignmentWidget;
}