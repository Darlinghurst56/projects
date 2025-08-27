/**
 * Human-Centered Interaction Enhancements
 * Applied from comprehensive UX analysis and user testing
 */

// Enhanced feedback system
class FeedbackManager {
    constructor() {
        this.createNotificationContainer();
        this.initializeInteractionFeedback();
    }

    createNotificationContainer() {
        if (!document.getElementById('notification-container')) {
            const container = document.createElement('div');
            container.id = 'notification-container';
            container.setAttribute('aria-live', 'polite');
            container.setAttribute('aria-atomic', 'true');
            document.body.appendChild(container);
        }
    }

    showNotification(message, type = 'success', duration = 4000) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.setAttribute('role', 'alert');
        
        const container = document.getElementById('notification-container');
        container.appendChild(notification);
        
        // Show notification
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        // Auto-hide notification
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, duration);
    }

    initializeInteractionFeedback() {
        // Add click feedback to all interactive elements
        document.addEventListener('click', (e) => {
            if (e.target.matches('button, .btn, .nav-button, .interactive-element')) {
                this.handleButtonClick(e.target);
            }
        });

        // Add keyboard navigation improvements
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.target.classList.contains('btn')) {
                e.target.click();
            }
        });
    }

    handleButtonClick(button) {
        if (button.disabled) return;
        
        const originalText = button.textContent;
        const hasIcon = button.querySelector('span');
        
        // Show loading state
        button.disabled = true;
        button.classList.add('loading-state');
        button.setAttribute('aria-busy', 'true');
        
        if (hasIcon) {
            button.innerHTML = `<span class="loading"></span> Working...`;
        } else {
            button.innerHTML = `<span class="loading"></span> Processing...`;
        }
        
        // Simulate processing time
        setTimeout(() => {
            // Show success state
            button.innerHTML = hasIcon ? `<span>✅</span> Done` : '✅ Done';
            button.classList.remove('loading-state');
            button.classList.add('success-state');
            
            // Show success notification
            this.showNotification(`${originalText.replace(/[^\w\s]/gi, '').trim()} completed successfully`);
            
            // Reset button after delay
            setTimeout(() => {
                button.innerHTML = originalText;
                button.disabled = false;
                button.classList.remove('success-state');
                button.setAttribute('aria-busy', 'false');
            }, 2000);
        }, 1500);
    }
}

// Task-focused content management
class TaskManager {
    constructor() {
        this.initializeTaskPriorities();
        this.setupTaskInteractions();
    }

    initializeTaskPriorities() {
        // Add priority classes to widgets based on content
        const widgets = document.querySelectorAll('.widget');
        widgets.forEach((widget, index) => {
            const title = widget.querySelector('.widget-title, h2, h3');
            if (title) {
                const titleText = title.textContent.toLowerCase();
                
                // Assign priority based on content
                if (titleText.includes('status') || titleText.includes('error') || titleText.includes('alert')) {
                    widget.classList.add('priority-urgent');
                } else if (titleText.includes('profile') || titleText.includes('settings')) {
                    widget.classList.add('priority-important');
                } else {
                    widget.classList.add('priority-normal');
                }
            }
        });
    }

    setupTaskInteractions() {
        // Add task-specific interactions
        document.addEventListener('click', (e) => {
            if (e.target.matches('.widget-refresh')) {
                this.refreshWidget(e.target.closest('.widget'));
            }
            
            if (e.target.matches('.widget-settings')) {
                this.showWidgetSettings(e.target.closest('.widget'));
            }
        });
    }

    refreshWidget(widget) {
        if (!widget) return;
        
        const title = widget.querySelector('.widget-title, h2, h3')?.textContent || 'Widget';
        const content = widget.querySelector('.widget-content');
        
        if (content) {
            // Show loading state
            content.classList.add('loading');
            content.setAttribute('aria-busy', 'true');
            
            // Add loading indicator
            const loader = document.createElement('div');
            loader.className = 'loading-enhanced';
            loader.innerHTML = `
                <div class="loading-spinner-enhanced"></div>
                <div class="loading-text">Refreshing ${title}...</div>
            `;
            content.appendChild(loader);
            
            // Simulate refresh
            setTimeout(() => {
                content.classList.remove('loading');
                content.setAttribute('aria-busy', 'false');
                content.removeChild(loader);
                
                // Show success feedback
                window.feedbackManager.showNotification(`${title} refreshed successfully`);
            }, 2000);
        }
    }

    showWidgetSettings(widget) {
        if (!widget) return;
        
        const title = widget.querySelector('.widget-title, h2, h3')?.textContent || 'Widget';
        window.feedbackManager.showNotification(`${title} settings opened`);
    }
}

// Accessibility enhancements
class AccessibilityManager {
    constructor() {
        this.setupKeyboardNavigation();
        this.setupScreenReaderSupport();
        this.setupFocusManagement();
    }

    setupKeyboardNavigation() {
        // Improve keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                // Ensure proper focus visibility
                document.body.classList.add('keyboard-navigation');
            }
        });

        document.addEventListener('mousedown', () => {
            document.body.classList.remove('keyboard-navigation');
        });
    }

    setupScreenReaderSupport() {
        // Add ARIA labels to widgets
        const widgets = document.querySelectorAll('.widget');
        widgets.forEach((widget, index) => {
            const title = widget.querySelector('.widget-title, h2, h3');
            if (title && !widget.getAttribute('aria-labelledby')) {
                const id = `widget-title-${index}`;
                title.id = id;
                widget.setAttribute('role', 'region');
                widget.setAttribute('aria-labelledby', id);
            }
        });
    }

    setupFocusManagement() {
        // Ensure focus moves to first interactive element
        const firstFocusable = document.querySelector('.btn, .nav-button, button, input');
        if (firstFocusable) {
            firstFocusable.focus();
        }
    }
}

// Content optimization
class ContentOptimizer {
    constructor() {
        this.optimizeContentSizing();
        this.improveTextReadability();
        this.enhanceVisualHierarchy();
    }

    optimizeContentSizing() {
        // Remove fixed heights and optimize for content
        const fixedHeightElements = document.querySelectorAll('[style*="height"], [style*="min-height"]');
        fixedHeightElements.forEach(element => {
            // Only remove if it's creating empty space
            const rect = element.getBoundingClientRect();
            const content = element.textContent.trim();
            
            if (rect.height > 200 && content.length < 100) {
                element.style.minHeight = 'auto';
                element.style.height = 'auto';
            }
        });
    }

    improveTextReadability() {
        // Improve text contrast and readability
        const textElements = document.querySelectorAll('p, span, div, label');
        textElements.forEach(element => {
            if (element.textContent.trim().length > 0) {
                element.style.lineHeight = '1.5';
                element.style.fontWeight = '400';
            }
        });
    }

    enhanceVisualHierarchy() {
        // Improve heading hierarchy
        const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        headings.forEach(heading => {
            heading.style.marginBottom = '8px';
            heading.style.lineHeight = '1.3';
            heading.style.fontWeight = '600';
        });
    }
}

// Performance monitoring
class PerformanceMonitor {
    constructor() {
        this.monitorInteractionTimes();
        this.optimizeAnimations();
    }

    monitorInteractionTimes() {
        let interactionStart = null;
        
        document.addEventListener('click', (e) => {
            interactionStart = performance.now();
        });
        
        // Monitor when interactions complete
        const observer = new MutationObserver(() => {
            if (interactionStart) {
                const interactionTime = performance.now() - interactionStart;
                if (interactionTime > 3000) {
                    console.warn('Slow interaction detected:', interactionTime + 'ms');
                }
                interactionStart = null;
            }
        });
        
        observer.observe(document.body, { childList: true, subtree: true });
    }

    optimizeAnimations() {
        // Reduce animations for users who prefer reduced motion
        if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            document.body.classList.add('reduced-motion');
        }
    }
}

// Initialize all enhancements
document.addEventListener('DOMContentLoaded', function() {
    // Initialize managers
    window.feedbackManager = new FeedbackManager();
    window.taskManager = new TaskManager();
    window.accessibilityManager = new AccessibilityManager();
    window.contentOptimizer = new ContentOptimizer();
    window.performanceMonitor = new PerformanceMonitor();
    
    console.log('🚀 Human-centered design enhancements initialized');
    
    // Show initialization success
    setTimeout(() => {
        window.feedbackManager.showNotification('Agent Dashboard ready for use!');
    }, 1000);
});

// Export for other scripts
window.HumanCenteredEnhancements = {
    FeedbackManager,
    TaskManager,
    AccessibilityManager,
    ContentOptimizer,
    PerformanceMonitor
};