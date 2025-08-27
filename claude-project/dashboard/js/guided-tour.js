/**
 * Guided Tour System for Agent Dashboard
 * UI Developer implementation for Task 8.2
 */

class GuidedTour {
    constructor() {
        this.steps = [];
        this.currentStepIndex = 0;
        this.isActive = false;
        this.overlay = null;
        this.tourPopup = null;
        this.spotlightElement = null;
        this.eventListeners = [];
        
        this.init();
    }

    init() {
        this.createTourSteps();
        this.injectStyles();
        this.setupEventListeners();
        console.log('🗺️ Guided tour system initialized');
    }

    createTourSteps() {
        this.steps = [
            {
                target: '.dashboard-header',
                title: 'Welcome to Agent Coordination Dashboard!',
                content: 'This dashboard helps you manage tasks and coordinate AI agents. Let\'s take a quick tour to get you started.',
                position: 'bottom',
                highlight: true,
                buttons: ['Next', 'Skip Tour']
            },
            {
                target: '.nav-buttons',
                title: 'Navigation Controls',
                content: 'Use these buttons to refresh data, toggle auto-assignment mode, access settings, or switch to other dashboards.',
                position: 'bottom',
                highlight: true,
                buttons: ['Previous', 'Next', 'Skip Tour']
            },
            {
                target: '.task-assignment-container',
                title: 'Task Assignment Hub',
                content: 'This is where the magic happens! View all tasks, see their status, and assign them to agents. You can filter by different contexts and track progress.',
                position: 'left',
                highlight: true,
                buttons: ['Previous', 'Next', 'Skip Tour']
            },
            {
                target: '#task-context-filter',
                title: 'Context Filtering',
                content: 'Switch between different task contexts (like agent roles) to focus on specific areas of work.',
                position: 'bottom',
                highlight: true,
                buttons: ['Previous', 'Next', 'Skip Tour']
            },
            {
                target: '.task-summary',
                title: 'Task Overview',
                content: 'Get a quick snapshot of all tasks: total count, completed tasks, work in progress, and pending items.',
                position: 'bottom',
                highlight: true,
                buttons: ['Previous', 'Next', 'Skip Tour']
            },
            {
                target: '.agent-registry-container',
                title: 'Agent Registry',
                content: 'View and manage all available agents in your system. Each agent has specific capabilities and can handle different types of tasks.',
                position: 'right',
                highlight: true,
                buttons: ['Previous', 'Next', 'Skip Tour']
            },
            {
                target: '.status-monitor-container',
                title: 'Agent Status Monitor',
                content: 'Monitor real-time agent performance, status updates, and receive alerts about agent activities.',
                position: 'left',
                highlight: true,
                buttons: ['Previous', 'Next', 'Skip Tour']
            },
            {
                target: '.capability-matrix-container',
                title: 'Capability Matrix',
                content: 'Visualize agent capabilities and task compatibility. This helps you understand which agents are best suited for specific tasks.',
                position: 'top',
                highlight: true,
                buttons: ['Previous', 'Next', 'Skip Tour']
            },
            {
                target: '.system-status',
                title: 'System Status',
                content: 'Keep an eye on the overall system health and connection status. The green indicator shows everything is working properly.',
                position: 'left',
                highlight: true,
                buttons: ['Previous', 'Finish Tour']
            }
        ];
    }

    injectStyles() {
        const styleSheet = document.createElement('style');
        styleSheet.innerHTML = `
            .tour-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.7);
                z-index: 20000;
                transition: opacity 0.3s ease;
            }
            
            .tour-spotlight {
                position: absolute;
                background: transparent;
                border: 3px solid #3b82f6;
                border-radius: 8px;
                box-shadow: 0 0 0 5000px rgba(0, 0, 0, 0.7);
                transition: all 0.3s ease;
                pointer-events: none;
                z-index: 20001;
            }
            
            .tour-spotlight.pulse {
                animation: tourPulse 2s infinite;
            }
            
            @keyframes tourPulse {
                0%, 100% { 
                    border-color: #3b82f6;
                    box-shadow: 0 0 0 5000px rgba(0, 0, 0, 0.7), 0 0 10px #3b82f6;
                }
                50% { 
                    border-color: #60a5fa;
                    box-shadow: 0 0 0 5000px rgba(0, 0, 0, 0.7), 0 0 20px #60a5fa;
                }
            }
            
            .tour-popup {
                position: fixed;
                background: white;
                border-radius: 12px;
                box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
                z-index: 20002;
                max-width: 350px;
                min-width: 280px;
                padding: 0;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                overflow: hidden;
            }
            
            .tour-popup-header {
                background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
                color: white;
                padding: 16px 20px;
                margin: 0;
            }
            
            .tour-popup-title {
                font-size: 18px;
                font-weight: 600;
                margin: 0;
                line-height: 1.3;
            }
            
            .tour-popup-content {
                padding: 20px;
                color: #374151;
                line-height: 1.5;
                font-size: 14px;
            }
            
            .tour-popup-footer {
                padding: 16px 20px;
                background: #f9fafb;
                border-top: 1px solid #e5e7eb;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .tour-step-counter {
                font-size: 12px;
                color: #6b7280;
                font-weight: 500;
            }
            
            .tour-buttons {
                display: flex;
                gap: 8px;
            }
            
            .tour-btn {
                padding: 8px 16px;
                border: none;
                border-radius: 6px;
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s ease;
            }
            
            .tour-btn-primary {
                background: #3b82f6;
                color: white;
            }
            
            .tour-btn-primary:hover {
                background: #2563eb;
            }
            
            .tour-btn-secondary {
                background: #e5e7eb;
                color: #374151;
            }
            
            .tour-btn-secondary:hover {
                background: #d1d5db;
            }
            
            .tour-btn-skip {
                background: transparent;
                color: #6b7280;
                text-decoration: underline;
            }
            
            .tour-btn-skip:hover {
                color: #374151;
            }
            
            .tour-popup::before {
                content: '';
                position: absolute;
                width: 16px;
                height: 16px;
                background: white;
                transform: rotate(45deg);
            }
            
            .tour-popup.top::before {
                bottom: -8px;
                left: 50%;
                margin-left: -8px;
            }
            
            .tour-popup.bottom::before {
                top: -8px;
                left: 50%;
                margin-left: -8px;
            }
            
            .tour-popup.left::before {
                right: -8px;
                top: 50%;
                margin-top: -8px;
            }
            
            .tour-popup.right::before {
                left: -8px;
                top: 50%;
                margin-top: -8px;
            }
            
            .tour-help-trigger {
                position: fixed;
                bottom: 20px;
                right: 20px;
                width: 60px;
                height: 60px;
                background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
                border: none;
                border-radius: 50%;
                color: white;
                font-size: 24px;
                cursor: pointer;
                box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
                z-index: 1000;
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .tour-help-trigger:hover {
                transform: scale(1.1);
                box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
            }
            
            .tour-help-trigger.pulse {
                animation: helpPulse 2s infinite;
            }
            
            @keyframes helpPulse {
                0%, 100% { 
                    transform: scale(1);
                    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
                }
                50% { 
                    transform: scale(1.05);
                    box-shadow: 0 8px 25px rgba(59, 130, 246, 0.5);
                }
            }
        `;
        document.head.appendChild(styleSheet);
    }

    setupEventListeners() {
        // Create help button
        this.createHelpButton();
        
        // Listen for escape key
        const escListener = (e) => {
            if (e.key === 'Escape' && this.isActive) {
                this.endTour();
            }
        };
        document.addEventListener('keydown', escListener);
        this.eventListeners.push({ element: document, event: 'keydown', listener: escListener });
    }

    createHelpButton() {
        const helpButton = document.createElement('button');
        helpButton.className = 'tour-help-trigger';
        helpButton.innerHTML = '?';
        helpButton.title = 'Help & Tutorial Options';
        
        helpButton.addEventListener('click', (e) => {
            this.showHelpMenu(e);
        });
        
        document.body.appendChild(helpButton);
        
        // Add pulse animation for first-time users
        if (!localStorage.getItem('dashboard-tour-completed')) {
            helpButton.classList.add('pulse');
        }
    }

    showHelpMenu(e) {
        e.stopPropagation();
        
        // Remove existing menu
        const existingMenu = document.querySelector('.help-menu-overlay');
        if (existingMenu) {
            existingMenu.remove();
            return;
        }
        
        const helpMenu = document.createElement('div');
        helpMenu.className = 'help-menu-overlay';
        helpMenu.innerHTML = `
            <div style="position: fixed; bottom: 90px; right: 20px; background: white; border-radius: 12px; 
                        box-shadow: 0 10px 25px rgba(0,0,0,0.3); z-index: 21000; min-width: 250px; overflow: hidden;">
                <div style="padding: 16px 20px; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white;">
                    <h3 style="margin: 0; font-size: 16px; font-weight: 600;">📚 Help & Tutorials</h3>
                </div>
                <div style="padding: 8px;">
                    <button onclick="window.guidedTour.startTour(); document.querySelector('.help-menu-overlay').remove();" 
                            style="width: 100%; padding: 12px 16px; background: none; border: none; text-align: left; 
                                   border-radius: 6px; cursor: pointer; margin-bottom: 4px; display: flex; align-items: center; gap: 12px;
                                   transition: background 0.2s ease;"
                            onmouseover="this.style.background='#f1f5f9'" 
                            onmouseout="this.style.background='none'">
                        <span style="font-size: 18px;">🗺️</span>
                        <div>
                            <div style="font-weight: 500; color: #374151;">Start Guided Tour</div>
                            <div style="font-size: 12px; color: #6b7280;">Step-by-step walkthrough</div>
                        </div>
                    </button>
                    
                    <button onclick="window.interactiveHints.forceHint('first-visit'); document.querySelector('.help-menu-overlay').remove();" 
                            style="width: 100%; padding: 12px 16px; background: none; border: none; text-align: left; 
                                   border-radius: 6px; cursor: pointer; margin-bottom: 4px; display: flex; align-items: center; gap: 12px;
                                   transition: background 0.2s ease;"
                            onmouseover="this.style.background='#f1f5f9'" 
                            onmouseout="this.style.background='none'">
                        <span style="font-size: 18px;">💡</span>
                        <div>
                            <div style="font-weight: 500; color: #374151;">Show Hint</div>
                            <div style="font-size: 12px; color: #6b7280;">Context-aware help</div>
                        </div>
                    </button>
                    
                    <button onclick="alert('Tooltips: Hover over any dashboard element to see helpful information and keyboard shortcuts.'); document.querySelector('.help-menu-overlay').remove();" 
                            style="width: 100%; padding: 12px 16px; background: none; border: none; text-align: left; 
                                   border-radius: 6px; cursor: pointer; margin-bottom: 4px; display: flex; align-items: center; gap: 12px;
                                   transition: background 0.2s ease;"
                            onmouseover="this.style.background='#f1f5f9'" 
                            onmouseout="this.style.background='none'">
                        <span style="font-size: 18px;">📋</span>
                        <div>
                            <div style="font-weight: 500; color: #374151;">About Tooltips</div>
                            <div style="font-size: 12px; color: #6b7280;">Hover help information</div>
                        </div>
                    </button>
                    
                    <hr style="margin: 8px 0; border: none; border-top: 1px solid #e5e7eb;">
                    
                    <button onclick="window.open('/api/health', '_blank'); document.querySelector('.help-menu-overlay').remove();" 
                            style="width: 100%; padding: 12px 16px; background: none; border: none; text-align: left; 
                                   border-radius: 6px; cursor: pointer; margin-bottom: 4px; display: flex; align-items: center; gap: 12px;
                                   transition: background 0.2s ease;"
                            onmouseover="this.style.background='#f1f5f9'" 
                            onmouseout="this.style.background='none'">
                        <span style="font-size: 18px;">🔧</span>
                        <div>
                            <div style="font-weight: 500; color: #374151;">API Status</div>
                            <div style="font-size: 12px; color: #6b7280;">Check system health</div>
                        </div>
                    </button>
                </div>
                <div style="padding: 12px 16px; background: #f8f9fa; border-top: 1px solid #e5e7eb; text-align: center;">
                    <button onclick="document.querySelector('.help-menu-overlay').remove();" 
                            style="padding: 6px 12px; background: #e5e7eb; color: #374151; border: none; 
                                   border-radius: 4px; cursor: pointer; font-size: 12px;">
                        Close
                    </button>
                </div>
            </div>
            <div onclick="this.remove();" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 20999;"></div>
        `;
        
        document.body.appendChild(helpMenu);
    }

    startTour() {
        if (this.isActive) return;
        
        this.isActive = true;
        this.currentStepIndex = 0;
        this.createOverlay();
        this.showStep(0);
        
        // Remove pulse from help button
        const helpButton = document.querySelector('.tour-help-trigger');
        if (helpButton) {
            helpButton.classList.remove('pulse');
        }
    }

    createOverlay() {
        this.overlay = document.createElement('div');
        this.overlay.className = 'tour-overlay';
        document.body.appendChild(this.overlay);
    }

    showStep(stepIndex) {
        if (stepIndex < 0 || stepIndex >= this.steps.length) return;
        
        this.currentStepIndex = stepIndex;
        const step = this.steps[stepIndex];
        
        // Remove existing elements
        this.removeSpotlight();
        this.removePopup();
        
        // Create spotlight
        if (step.highlight) {
            this.createSpotlight(step.target);
        }
        
        // Create popup
        this.createPopup(step);
        
        // Scroll to target if needed
        this.scrollToTarget(step.target);
    }

    createSpotlight(targetSelector) {
        const targetElement = document.querySelector(targetSelector);
        if (!targetElement) return;
        
        const rect = targetElement.getBoundingClientRect();
        
        this.spotlightElement = document.createElement('div');
        this.spotlightElement.className = 'tour-spotlight pulse';
        this.spotlightElement.style.left = `${rect.left - 10}px`;
        this.spotlightElement.style.top = `${rect.top - 10}px`;
        this.spotlightElement.style.width = `${rect.width + 20}px`;
        this.spotlightElement.style.height = `${rect.height + 20}px`;
        
        document.body.appendChild(this.spotlightElement);
    }

    createPopup(step) {
        this.tourPopup = document.createElement('div');
        this.tourPopup.className = `tour-popup ${step.position}`;
        
        const stepCounter = `${this.currentStepIndex + 1} of ${this.steps.length}`;
        
        this.tourPopup.innerHTML = `
            <div class="tour-popup-header">
                <h3 class="tour-popup-title">${step.title}</h3>
            </div>
            <div class="tour-popup-content">
                ${step.content}
            </div>
            <div class="tour-popup-footer">
                <div class="tour-step-counter">Step ${stepCounter}</div>
                <div class="tour-buttons">
                    ${this.createStepButtons(step.buttons)}
                </div>
            </div>
        `;
        
        document.body.appendChild(this.tourPopup);
        this.positionPopup(step.target, step.position);
    }

    createStepButtons(buttons) {
        return buttons.map(buttonText => {
            const buttonClass = buttonText.toLowerCase().includes('next') || buttonText.toLowerCase().includes('finish') 
                ? 'tour-btn tour-btn-primary'
                : buttonText.toLowerCase().includes('skip')
                ? 'tour-btn tour-btn-skip'
                : 'tour-btn tour-btn-secondary';
            
            return `<button class="${buttonClass}" onclick="window.guidedTour.handleButtonClick('${buttonText}')">${buttonText}</button>`;
        }).join('');
    }

    handleButtonClick(buttonText) {
        switch (buttonText.toLowerCase()) {
            case 'next':
                this.nextStep();
                break;
            case 'previous':
                this.previousStep();
                break;
            case 'skip tour':
                this.endTour();
                break;
            case 'finish tour':
                this.completeTour();
                break;
        }
    }

    nextStep() {
        if (this.currentStepIndex < this.steps.length - 1) {
            this.showStep(this.currentStepIndex + 1);
        } else {
            this.completeTour();
        }
    }

    previousStep() {
        if (this.currentStepIndex > 0) {
            this.showStep(this.currentStepIndex - 1);
        }
    }

    positionPopup(targetSelector, position) {
        const targetElement = document.querySelector(targetSelector);
        if (!targetElement || !this.tourPopup) return;
        
        const targetRect = targetElement.getBoundingClientRect();
        const popupRect = this.tourPopup.getBoundingClientRect();
        
        let left, top;
        
        switch (position) {
            case 'top':
                left = targetRect.left + (targetRect.width / 2) - (popupRect.width / 2);
                top = targetRect.top - popupRect.height - 20;
                break;
            case 'bottom':
                left = targetRect.left + (targetRect.width / 2) - (popupRect.width / 2);
                top = targetRect.bottom + 20;
                break;
            case 'left':
                left = targetRect.left - popupRect.width - 20;
                top = targetRect.top + (targetRect.height / 2) - (popupRect.height / 2);
                break;
            case 'right':
                left = targetRect.right + 20;
                top = targetRect.top + (targetRect.height / 2) - (popupRect.height / 2);
                break;
        }
        
        // Keep popup within viewport
        const padding = 10;
        left = Math.max(padding, Math.min(left, window.innerWidth - popupRect.width - padding));
        top = Math.max(padding, Math.min(top, window.innerHeight - popupRect.height - padding));
        
        this.tourPopup.style.left = `${left}px`;
        this.tourPopup.style.top = `${top}px`;
    }

    scrollToTarget(targetSelector) {
        const targetElement = document.querySelector(targetSelector);
        if (targetElement) {
            targetElement.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center' 
            });
        }
    }

    removeSpotlight() {
        if (this.spotlightElement) {
            this.spotlightElement.remove();
            this.spotlightElement = null;
        }
    }

    removePopup() {
        if (this.tourPopup) {
            this.tourPopup.remove();
            this.tourPopup = null;
        }
    }

    completeTour() {
        localStorage.setItem('dashboard-tour-completed', 'true');
        this.endTour();
        
        // Show completion message
        setTimeout(() => {
            alert('🎉 Tour completed! You\'re all set to manage your agents and tasks effectively.');
        }, 300);
    }

    endTour() {
        this.isActive = false;
        this.removeSpotlight();
        this.removePopup();
        
        if (this.overlay) {
            this.overlay.remove();
            this.overlay = null;
        }
    }

    // Public API
    restart() {
        this.endTour();
        setTimeout(() => this.startTour(), 100);
    }

    destroy() {
        this.endTour();
        
        // Remove help button
        const helpButton = document.querySelector('.tour-help-trigger');
        if (helpButton) {
            helpButton.remove();
        }
        
        // Remove event listeners
        this.eventListeners.forEach(({ element, event, listener }) => {
            element.removeEventListener(event, listener);
        });
    }
}

// Initialize guided tour system when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.guidedTour = new GuidedTour();
    });
} else {
    window.guidedTour = new GuidedTour();
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GuidedTour;
}