/**
 * Agent Launcher Widget - User-Friendly Agent Creation Interface
 * Provides a comprehensive UI for launching new agents with proper validation and feedback
 */

class AgentLauncherWidget {
    constructor(container, options = {}) {
        this.container = container;
        this.options = {
            apiEndpoint: 'http://localhost:3001/api/agents',
            ...options
        };
        
        this.eventBus = window.eventBus || new EventBus();
        this.isLaunching = false;
        
        // Agent role definitions with descriptions and capabilities
        this.agentRoles = {
            'frontend-architect': {
                name: 'Frontend Architect',
                description: 'Designs UI/UX architecture, component systems, and frontend workflows',
                capabilities: ['React/Vue architecture', 'Component design', 'State management', 'UI/UX planning'],
                icon: '🏗️',
                color: '#3B82F6'
            },
            'ui-developer': {
                name: 'UI Developer',
                description: 'Implements visual components, styling, and responsive layouts',
                capabilities: ['HTML/CSS/JS', 'Component implementation', 'Responsive design', 'Visual debugging'],
                icon: '🎨',
                color: '#8B5CF6'
            },
            'integration-specialist': {
                name: 'Integration Specialist', 
                description: 'Handles API connections, third-party integrations, and data flows',
                capabilities: ['API integration', 'MCP servers', 'Database connections', 'External services'],
                icon: '🔗',
                color: '#10B981'
            },
            'qa-specialist': {
                name: 'QA Specialist',
                description: 'Performs testing, validation, and quality assurance across the system',
                capabilities: ['Automated testing', 'Manual QA', 'Bug tracking', 'Performance testing'],
                icon: '🧪',
                color: '#F59E0B'
            },
            'server-agent': {
                name: 'Server Agent',
                description: 'Manages server operations, deployments, and infrastructure',
                capabilities: ['Server management', 'Deployment pipelines', 'Infrastructure', 'DevOps tasks'],
                icon: '🖥️',
                color: '#EF4444'
            },
            'backend-agent': {
                name: 'Backend Agent',
                description: 'Develops server-side logic, databases, and backend services',
                capabilities: ['API development', 'Database design', 'Backend logic', 'Security implementation'],
                icon: '⚙️',
                color: '#6366F1'
            },
            'devops-agent': {
                name: 'DevOps Agent',
                description: 'Handles CI/CD, monitoring, and deployment automation',
                capabilities: ['CI/CD pipelines', 'Monitoring setup', 'Automation scripts', 'Cloud services'],
                icon: '🚀',
                color: '#14B8A6'
            }
        };
        
        this.init();
    }

    init() {
        this.render();
        this.setupEventListeners();
        console.log('Agent Launcher Widget initialized');
    }

    render() {
        this.container.innerHTML = `
            <div class="agent-launcher-widget">
                <div class="launcher-header">
                    <h2 class="launcher-title">
                        <span class="launcher-icon">🚀</span>
                        Launch New Agent
                    </h2>
                    <p class="launcher-subtitle">Create specialized agents for task automation and coordination</p>
                </div>
                
                <div class="launch-form-container">
                    <form id="agent-launch-form" class="agent-launch-form">
                        <!-- Agent Basic Info -->
                        <div class="form-section">
                            <h3 class="section-title">Agent Details</h3>
                            
                            <div class="form-group">
                                <label for="agent-name" class="form-label">Agent Name <span class="required">*</span></label>
                                <input 
                                    type="text" 
                                    id="agent-name" 
                                    name="name" 
                                    class="form-input" 
                                    placeholder="e.g., frontend-specialist-alpha"
                                    required
                                >
                                <small class="form-help">Choose a unique identifier for your agent</small>
                            </div>
                            
                            <div class="form-group">
                                <label for="agent-description" class="form-label">Description</label>
                                <textarea 
                                    id="agent-description" 
                                    name="description" 
                                    class="form-textarea" 
                                    placeholder="Brief description of this agent's specific purpose..."
                                    rows="3"
                                ></textarea>
                            </div>
                        </div>

                        <!-- Role Selection -->
                        <div class="form-section">
                            <h3 class="section-title">Role Selection <span class="required">*</span></h3>
                            <div class="role-selection-grid" id="role-selection-grid">
                                ${this.renderRoleOptions()}
                            </div>
                        </div>

                        <!-- Advanced Options -->
                        <div class="form-section">
                            <h3 class="section-title">Advanced Options</h3>
                            
                            <div class="form-group">
                                <label for="agent-priority" class="form-label">Priority Level</label>
                                <select id="agent-priority" name="priority" class="form-select">
                                    <option value="1">High Priority (1)</option>
                                    <option value="2">Medium-High Priority (2)</option>
                                    <option value="3" selected>Medium Priority (3)</option>
                                    <option value="4">Medium-Low Priority (4)</option>
                                    <option value="5">Low Priority (5)</option>
                                </select>
                                <small class="form-help">Lower numbers = higher priority in task assignment</small>
                            </div>
                        </div>

                        <!-- Launch Button -->
                        <div class="form-actions">
                            <button type="submit" class="launch-btn" id="launch-btn">
                                <span class="btn-icon">🚀</span>
                                <span class="btn-text">Launch Agent</span>
                                <span class="btn-loading" style="display: none;">⏳ Launching...</span>
                            </button>
                            <button type="button" class="cancel-btn" id="cancel-btn">
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>

                <!-- Launch Status -->
                <div class="launch-status" id="launch-status" style="display: none;">
                    <!-- Status messages will appear here -->
                </div>

                <!-- Recent Launches -->
                <div class="recent-launches" id="recent-launches">
                    <h3 class="section-title">Recent Agent Launches</h3>
                    <div class="launches-list" id="launches-list">
                        <div class="no-launches">No agents launched yet</div>
                    </div>
                </div>
            </div>
        `;
    }

    renderRoleOptions() {
        return Object.entries(this.agentRoles).map(([roleKey, role]) => `
            <div class="role-option" data-role="${roleKey}">
                <div class="role-header">
                    <span class="role-icon" style="color: ${role.color}">${role.icon}</span>
                    <span class="role-name">${role.name}</span>
                </div>
                <div class="role-description">${role.description}</div>
                <div class="role-capabilities">
                    ${role.capabilities.map(cap => `<span class="capability-tag">${cap}</span>`).join('')}
                </div>
                <input type="radio" name="role" value="${roleKey}" class="role-radio" required>
            </div>
        `).join('');
    }

    setupEventListeners() {
        // Form submission
        const form = this.container.querySelector('#agent-launch-form');
        form.addEventListener('submit', (e) => this.handleFormSubmit(e));

        // Cancel button
        const cancelBtn = this.container.querySelector('#cancel-btn');
        cancelBtn.addEventListener('click', () => this.resetForm());

        // Role selection
        const roleOptions = this.container.querySelectorAll('.role-option');
        roleOptions.forEach(option => {
            option.addEventListener('click', () => {
                // Remove previous selection
                roleOptions.forEach(opt => opt.classList.remove('selected'));
                // Select current option
                option.classList.add('selected');
                // Check the radio button
                const radio = option.querySelector('.role-radio');
                radio.checked = true;
                
                // Update description if empty
                this.updateDescriptionFromRole(option.dataset.role);
            });
        });

        // Auto-generate agent name based on role and timestamp
        const nameInput = this.container.querySelector('#agent-name');
        nameInput.addEventListener('focus', () => {
            if (!nameInput.value) {
                const selectedRole = this.container.querySelector('.role-option.selected');
                if (selectedRole) {
                    const roleKey = selectedRole.dataset.role;
                    const timestamp = new Date().toISOString().slice(0, 10);
                    nameInput.value = `${roleKey}-${timestamp}`;
                }
            }
        });
    }

    updateDescriptionFromRole(roleKey) {
        const descriptionField = this.container.querySelector('#agent-description');
        if (!descriptionField.value && this.agentRoles[roleKey]) {
            descriptionField.value = this.agentRoles[roleKey].description;
        }
    }

    async handleFormSubmit(event) {
        event.preventDefault();
        
        if (this.isLaunching) return;
        
        const formData = new FormData(event.target);
        const agentData = {
            name: formData.get('name').trim(),
            description: formData.get('description').trim(),
            role: formData.get('role'),
            priority: parseInt(formData.get('priority'))
        };

        // Validation
        if (!agentData.name || !agentData.role) {
            this.showStatus('error', 'Agent name and role are required');
            return;
        }

        // Sanitize agent name
        agentData.name = agentData.name.toLowerCase().replace(/[^a-z0-9-]/g, '-');

        try {
            this.setLaunchingState(true);
            this.showStatus('loading', 'Launching agent...');

            const response = await fetch(this.options.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(agentData)
            });

            const result = await response.json();

            if (result.success) {
                this.showStatus('success', `Agent "${agentData.name}" launched successfully!`);
                this.addToRecentLaunches(result.agent);
                this.resetForm();
                
                // Emit event for other widgets
                this.eventBus.emit('agent:launched', result.agent);
                
                // Refresh agent registry if available
                this.eventBus.emit('agents:refresh');
            } else {
                this.showStatus('error', result.message || 'Failed to launch agent');
            }

        } catch (error) {
            console.error('❌ Agent launch failed:', error);
            this.showStatus('error', 'Network error: Could not connect to server');
        } finally {
            this.setLaunchingState(false);
        }
    }

    setLaunchingState(isLaunching) {
        this.isLaunching = isLaunching;
        const launchBtn = this.container.querySelector('#launch-btn');
        const btnText = launchBtn.querySelector('.btn-text');
        const btnLoading = launchBtn.querySelector('.btn-loading');
        
        if (isLaunching) {
            launchBtn.disabled = true;
            btnText.style.display = 'none';
            btnLoading.style.display = 'inline';
        } else {
            launchBtn.disabled = false;
            btnText.style.display = 'inline';
            btnLoading.style.display = 'none';
        }
    }

    showStatus(type, message) {
        const statusContainer = this.container.querySelector('#launch-status');
        const icons = {
            success: '✅',
            error: '❌',
            loading: '⏳',
            info: 'ℹ️'
        };

        statusContainer.innerHTML = `
            <div class="status-message status-${type}">
                <span class="status-icon">${icons[type] || icons.info}</span>
                <span class="status-text">${message}</span>
            </div>
        `;
        
        statusContainer.style.display = 'block';

        // Auto-hide success/error messages after 5 seconds
        if (type === 'success' || type === 'error') {
            setTimeout(() => {
                statusContainer.style.display = 'none';
            }, 5000);
        }
    }

    addToRecentLaunches(agent) {
        const launchesList = this.container.querySelector('#launches-list');
        const noLaunches = launchesList.querySelector('.no-launches');
        
        if (noLaunches) {
            noLaunches.remove();
        }

        const role = this.agentRoles[agent.role];
        const launchItem = document.createElement('div');
        launchItem.className = 'launch-item';
        launchItem.innerHTML = `
            <div class="launch-info">
                <div class="launch-name">
                    <span class="launch-icon" style="color: ${role?.color || '#6B7280'}">${role?.icon || '🤖'}</span>
                    ${agent.name}
                </div>
                <div class="launch-role">${role?.name || agent.role}</div>
                <div class="launch-time">${new Date(agent.createdAt).toLocaleString()}</div>
            </div>
            <div class="launch-status-badge status-${agent.status}">${agent.status}</div>
        `;

        launchesList.insertBefore(launchItem, launchesList.firstChild);

        // Limit to 5 recent launches
        const launches = launchesList.querySelectorAll('.launch-item');
        if (launches.length > 5) {
            launches[launches.length - 1].remove();
        }
    }

    resetForm() {
        const form = this.container.querySelector('#agent-launch-form');
        form.reset();
        
        // Clear role selections
        const roleOptions = this.container.querySelectorAll('.role-option');
        roleOptions.forEach(option => option.classList.remove('selected'));
        
        // Hide status
        const statusContainer = this.container.querySelector('#launch-status');
        statusContainer.style.display = 'none';
    }

    destroy() {
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
        }
        console.log('Agent Launcher Widget destroyed');
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AgentLauncherWidget;
}

// Global registration for direct HTML usage
window.AgentLauncherWidget = AgentLauncherWidget;