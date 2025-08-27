/**
 * Interactive Help Hints System for Agent Dashboard
 * UI Developer implementation for Task 8.3
 */

class InteractiveHints {
    constructor() {
        this.hints = new Map();
        this.activeHint = null;
        this.userActions = new Set();
        this.hintQueue = [];
        this.settings = {
            showHints: true,
            hintDelay: 2000,
            maxHintsPerSession: 5,
            hintsShownCount: 0
        };
        
        this.init();
    }

    init() {
        this.loadSettings();
        this.defineHints();
        this.injectStyles();
        this.setupEventListeners();
        this.startActionTracking();
        console.log('💡 Interactive hints system initialized');
    }

    loadSettings() {
        const saved = localStorage.getItem('dashboard-hint-settings');
        if (saved) {
            this.settings = { ...this.settings, ...JSON.parse(saved) };
        }
    }

    saveSettings() {
        localStorage.setItem('dashboard-hint-settings', JSON.stringify(this.settings));
    }

    defineHints() {
        // Context-aware hints based on user behavior
        this.hints.set('first-visit', {
            trigger: 'page-load',
            condition: () => !localStorage.getItem('dashboard-visited'),
            title: 'Welcome to the Dashboard!',
            content: 'This is your first time here. Click the "?" button in the bottom-right to start a guided tour.',
            position: 'center',
            priority: 10,
            icon: '👋'
        });

        this.hints.set('no-tasks-visible', {
            trigger: 'task-load-empty',
            condition: () => document.querySelectorAll('.task-item').length === 0,
            title: 'No Tasks Available',
            content: 'It looks like there are no tasks to display. Try refreshing the data or check if the TaskMaster API is running.',
            position: 'task-container',
            priority: 8,
            icon: '📋',
            actions: [
                { text: 'Refresh Data', action: () => window.eventBus.emit('dashboard:refresh:all') },
                { text: 'Check API Status', action: () => window.open('/api/health', '_blank') }
            ]
        });

        this.hints.set('long-hover-task', {
            trigger: 'hover-duration',
            condition: () => true,
            title: 'Try Drag & Drop!',
            content: 'You can drag tasks to agents to assign them. Or use the Auto Assign button for bulk assignment.',
            position: 'mouse',
            priority: 6,
            icon: '🎯'
        });

        this.hints.set('multiple-clicks-refresh', {
            trigger: 'repeated-action',
            condition: () => true,
            title: 'Tip: Auto-Refresh Available',
            content: 'Clicking refresh multiple times? You can enable auto-refresh mode for real-time updates.',
            position: 'refresh-button',
            priority: 5,
            icon: '🔄'
        });

        this.hints.set('agent-overload', {
            trigger: 'agent-capacity',
            condition: () => true,
            title: 'Agent Overloaded',
            content: 'This agent has reached maximum capacity. Consider redistributing tasks or using auto-assignment for better balance.',
            position: 'agent-column',
            priority: 9,
            icon: '⚠️'
        });

        this.hints.set('idle-user', {
            trigger: 'idle-time',
            condition: () => true,
            title: 'Need Help?',
            content: 'You\'ve been idle for a while. Use the help button (?) for a guided tour or check the tooltips by hovering over elements.',
            position: 'center',
            priority: 3,
            icon: '❓'
        });

        this.hints.set('error-recovery', {
            trigger: 'api-error',
            condition: () => true,
            title: 'Connection Issue',
            content: 'Having trouble connecting to TaskMaster? Check the API status or try refreshing the page.',
            position: 'center',
            priority: 10,
            icon: '🚨',
            actions: [
                { text: 'Check API', action: () => window.open('/api/health', '_blank') },
                { text: 'Refresh Page', action: () => location.reload() }
            ]
        });

        this.hints.set('keyboard-shortcut', {
            trigger: 'keyboard-pattern',
            condition: () => true,
            title: 'Keyboard Shortcuts Available',
            content: 'Press Ctrl+R to refresh or Ctrl+A for auto-assign. Hover over buttons to see more shortcuts.',
            position: 'center',
            priority: 4,
            icon: '⌨️'
        });
    }

    injectStyles() {
        const styleSheet = document.createElement('style');
        styleSheet.innerHTML = `
            .hint-popup {
                position: fixed;
                background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
                color: white;
                padding: 0;
                border-radius: 12px;
                box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
                z-index: 15000;
                max-width: 320px;
                min-width: 280px;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                overflow: hidden;
                opacity: 0;
                transform: scale(0.9) translateY(10px);
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            }
            
            .hint-popup.show {
                opacity: 1;
                transform: scale(1) translateY(0);
            }
            
            .hint-popup.center {
                left: 50%;
                top: 50%;
                transform: translate(-50%, -50%) scale(0.9);
            }
            
            .hint-popup.center.show {
                transform: translate(-50%, -50%) scale(1);
            }
            
            .hint-header {
                padding: 16px 20px;
                background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
                display: flex;
                align-items: center;
                gap: 12px;
            }
            
            .hint-icon {
                font-size: 20px;
                line-height: 1;
            }
            
            .hint-title {
                font-size: 16px;
                font-weight: 600;
                margin: 0;
                flex: 1;
            }
            
            .hint-close {
                background: none;
                border: none;
                color: white;
                font-size: 18px;
                cursor: pointer;
                padding: 0;
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 4px;
                transition: background 0.2s ease;
            }
            
            .hint-close:hover {
                background: rgba(255, 255, 255, 0.2);
            }
            
            .hint-content {
                padding: 20px;
                line-height: 1.5;
                font-size: 14px;
                color: #e2e8f0;
            }
            
            .hint-actions {
                padding: 16px 20px;
                background: rgba(0, 0, 0, 0.2);
                display: flex;
                gap: 8px;
                justify-content: flex-end;
                border-top: 1px solid rgba(255, 255, 255, 0.1);
            }
            
            .hint-action-btn {
                padding: 8px 16px;
                border: none;
                border-radius: 6px;
                font-size: 13px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s ease;
            }
            
            .hint-action-primary {
                background: #3b82f6;
                color: white;
            }
            
            .hint-action-primary:hover {
                background: #2563eb;
            }
            
            .hint-action-secondary {
                background: transparent;
                color: #cbd5e1;
                border: 1px solid #475569;
            }
            
            .hint-action-secondary:hover {
                background: rgba(255, 255, 255, 0.1);
                color: white;
            }
            
            .hint-dismiss {
                padding: 12px 20px;
                background: rgba(0, 0, 0, 0.1);
                border-top: 1px solid rgba(255, 255, 255, 0.1);
                text-align: center;
            }
            
            .hint-dismiss-btn {
                background: none;
                border: none;
                color: #94a3b8;
                font-size: 12px;
                cursor: pointer;
                text-decoration: underline;
            }
            
            .hint-dismiss-btn:hover {
                color: #cbd5e1;
            }
            
            .hint-pulse {
                animation: hintPulse 2s ease-in-out infinite;
            }
            
            @keyframes hintPulse {
                0%, 100% { 
                    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3), 0 0 0 0 rgba(59, 130, 246, 0.4);
                }
                50% { 
                    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3), 0 0 0 10px rgba(59, 130, 246, 0);
                }
            }
            
            .hint-progress {
                position: absolute;
                bottom: 0;
                left: 0;
                height: 3px;
                background: #3b82f6;
                transition: width 0.1s linear;
            }
        `;
        document.head.appendChild(styleSheet);
    }

    setupEventListeners() {
        // Track user interactions for contextual hints
        document.addEventListener('click', this.handleClick.bind(this));
        document.addEventListener('mouseover', this.handleMouseOver.bind(this));
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        
        // Listen for custom events
        window.addEventListener('beforeunload', () => {
            this.userActions.add('page-unload');
        });
        
        // API error detection
        window.addEventListener('error', (e) => {
            if (e.message.includes('fetch') || e.message.includes('API')) {
                this.triggerHint('error-recovery');
            }
        });
    }

    startActionTracking() {
        // Check for first visit
        if (!localStorage.getItem('dashboard-visited')) {
            localStorage.setItem('dashboard-visited', 'true');
            this.triggerHint('first-visit');
        }

        // Check for empty task list
        setTimeout(() => {
            this.checkTaskAvailability();
        }, 3000);

        // Track idle time
        this.setupIdleTracking();
    }

    checkTaskAvailability() {
        const taskContainer = document.getElementById('tasks-container');
        if (taskContainer) {
            const hasVisibleTasks = taskContainer.querySelectorAll('.task-item, .tag-section').length > 0;
            const isLoadingComplete = !taskContainer.textContent.includes('Loading');
            
            if (!hasVisibleTasks && isLoadingComplete) {
                this.triggerHint('no-tasks-visible');
            }
        }
    }

    setupIdleTracking() {
        let idleTimer;
        const resetIdleTimer = () => {
            clearTimeout(idleTimer);
            idleTimer = setTimeout(() => {
                if (this.settings.hintsShownCount < 3) {
                    this.triggerHint('idle-user');
                }
            }, 120000); // 2 minutes of inactivity
        };

        ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
            document.addEventListener(event, resetIdleTimer, true);
        });

        resetIdleTimer();
    }

    handleClick(e) {
        const target = e.target;
        
        // Track refresh button clicks
        if (target.id === 'refresh-all') {
            this.userActions.add('refresh-click');
            const refreshCount = (this.userActions.get('refresh-count') || 0) + 1;
            this.userActions.set('refresh-count', refreshCount);
            
            if (refreshCount >= 3) {
                setTimeout(() => this.triggerHint('multiple-clicks-refresh'), 1000);
            }
        }

        // Track keyboard shortcut usage
        if (e.ctrlKey) {
            this.userActions.add('keyboard-shortcut-used');
            if (!this.userActions.has('keyboard-hint-shown')) {
                setTimeout(() => this.triggerHint('keyboard-shortcut'), 2000);
            }
        }
    }

    handleMouseOver(e) {
        const target = e.target;
        
        // Track long hover on tasks
        if (target.closest('.task-item') || target.closest('.tag-section')) {
            clearTimeout(this.hoverTimer);
            this.hoverTimer = setTimeout(() => {
                if (!this.userActions.has('drag-hint-shown')) {
                    this.triggerHint('long-hover-task', { x: e.clientX, y: e.clientY });
                    this.userActions.add('drag-hint-shown');
                }
            }, 3000);
        } else {
            clearTimeout(this.hoverTimer);
        }
    }

    handleKeyDown(e) {
        // Track keyboard patterns
        if (e.ctrlKey && (e.key === 'r' || e.key === 'a')) {
            this.userActions.add('keyboard-pattern');
            if (!this.userActions.has('keyboard-hint-shown')) {
                setTimeout(() => {
                    this.triggerHint('keyboard-shortcut');
                    this.userActions.add('keyboard-hint-shown');
                }, 1000);
            }
        }
    }

    triggerHint(hintId, position = null) {
        if (!this.settings.showHints) return;
        if (this.settings.hintsShownCount >= this.settings.maxHintsPerSession) return;
        if (this.activeHint) return; // Don't show multiple hints
        
        const hint = this.hints.get(hintId);
        if (!hint || !hint.condition()) return;
        
        // Check if this hint was recently dismissed
        const dismissedHints = JSON.parse(localStorage.getItem('dismissed-hints') || '[]');
        if (dismissedHints.includes(hintId)) return;
        
        this.showHint(hint, hintId, position);
        this.settings.hintsShownCount++;
        this.saveSettings();
    }

    showHint(hint, hintId, position = null) {
        this.activeHint = this.createHintElement(hint, hintId);
        document.body.appendChild(this.activeHint);
        
        // Position the hint
        this.positionHint(this.activeHint, hint.position, position);
        
        // Show with animation
        setTimeout(() => {
            this.activeHint.classList.add('show');
        }, 10);
        
        // Auto-dismiss after delay (unless it has actions)
        if (!hint.actions) {
            setTimeout(() => {
                this.dismissActiveHint();
            }, 8000);
        }
    }

    createHintElement(hint, hintId) {
        const hintElement = document.createElement('div');
        hintElement.className = `hint-popup ${hint.position === 'center' ? 'center' : ''}`;
        
        let actionsHTML = '';
        if (hint.actions) {
            actionsHTML = `
                <div class="hint-actions">
                    ${hint.actions.map((action, index) => `
                        <button class="hint-action-btn ${index === 0 ? 'hint-action-primary' : 'hint-action-secondary'}"
                                onclick="window.interactiveHints.handleAction('${hintId}', ${index})">
                            ${action.text}
                        </button>
                    `).join('')}
                </div>
            `;
        }
        
        hintElement.innerHTML = `
            <div class="hint-header">
                <span class="hint-icon">${hint.icon}</span>
                <h4 class="hint-title">${hint.title}</h4>
                <button class="hint-close" onclick="window.interactiveHints.dismissActiveHint()">×</button>
            </div>
            <div class="hint-content">${hint.content}</div>
            ${actionsHTML}
            <div class="hint-dismiss">
                <button class="hint-dismiss-btn" onclick="window.interactiveHints.dismissHint('${hintId}')">
                    Don't show this again
                </button>
            </div>
        `;
        
        return hintElement;
    }

    positionHint(hintElement, position, mousePosition = null) {
        if (position === 'center') {
            return; // CSS handles center positioning
        }
        
        if (position === 'mouse' && mousePosition) {
            hintElement.style.left = `${mousePosition.x + 20}px`;
            hintElement.style.top = `${mousePosition.y - 50}px`;
            return;
        }
        
        // Position relative to target element
        let targetElement;
        switch (position) {
            case 'task-container':
                targetElement = document.getElementById('tasks-container');
                break;
            case 'refresh-button':
                targetElement = document.getElementById('refresh-all');
                break;
            case 'agent-column':
                targetElement = document.querySelector('.agent-column');
                break;
            default:
                targetElement = document.querySelector(`.${position}`);
        }
        
        if (targetElement) {
            const rect = targetElement.getBoundingClientRect();
            hintElement.style.left = `${rect.left + rect.width / 2 - 150}px`;
            hintElement.style.top = `${rect.bottom + 10}px`;
        }
    }

    handleAction(hintId, actionIndex) {
        const hint = this.hints.get(hintId);
        if (hint && hint.actions && hint.actions[actionIndex]) {
            hint.actions[actionIndex].action();
        }
        this.dismissActiveHint();
    }

    dismissActiveHint() {
        if (this.activeHint) {
            this.activeHint.classList.remove('show');
            setTimeout(() => {
                if (this.activeHint && this.activeHint.parentNode) {
                    this.activeHint.parentNode.removeChild(this.activeHint);
                }
                this.activeHint = null;
            }, 300);
        }
    }

    dismissHint(hintId) {
        const dismissedHints = JSON.parse(localStorage.getItem('dismissed-hints') || '[]');
        dismissedHints.push(hintId);
        localStorage.setItem('dismissed-hints', JSON.stringify(dismissedHints));
        this.dismissActiveHint();
    }

    // Public API
    enableHints() {
        this.settings.showHints = true;
        this.saveSettings();
    }

    disableHints() {
        this.settings.showHints = false;
        this.dismissActiveHint();
        this.saveSettings();
    }

    resetHints() {
        localStorage.removeItem('dismissed-hints');
        this.settings.hintsShownCount = 0;
        this.saveSettings();
    }

    forceHint(hintId) {
        if (this.hints.has(hintId)) {
            this.triggerHint(hintId);
        }
    }
}

// Initialize interactive hints system when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.interactiveHints = new InteractiveHints();
    });
} else {
    window.interactiveHints = new InteractiveHints();
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = InteractiveHints;
}