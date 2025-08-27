/**
 * Tooltip System for Agent Dashboard
 * UI Developer implementation for Task 8.1
 */

class TooltipSystem {
    constructor() {
        this.tooltips = new Map();
        this.activeTooltip = null;
        this.styles = null;
        this.init();
    }

    init() {
        this.injectStyles();
        this.setupEventListeners();
        console.log('📋 Tooltip system initialized');
    }

    injectStyles() {
        const styleSheet = document.createElement('style');
        styleSheet.innerHTML = `
            .tooltip {
                position: absolute;
                background: var(--color-bg-primary, #1a1a1a);
                color: var(--color-text-primary, #ffffff);
                padding: 12px 16px;
                border-radius: 8px;
                font-size: 14px;
                line-height: 1.4;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
                border: 1px solid var(--color-border, #333333);
                z-index: 10000;
                max-width: 280px;
                opacity: 0;
                visibility: hidden;
                transition: all 0.2s ease;
                pointer-events: none;
            }
            
            .tooltip.show {
                opacity: 1;
                visibility: visible;
            }
            
            .tooltip::before {
                content: '';
                position: absolute;
                width: 8px;
                height: 8px;
                background: var(--color-bg-primary, #1a1a1a);
                border: 1px solid var(--color-border, #333333);
                transform: rotate(45deg);
            }
            
            .tooltip.top::before {
                bottom: -5px;
                left: 50%;
                margin-left: -4px;
                border-top: none;
                border-left: none;
            }
            
            .tooltip.bottom::before {
                top: -5px;
                left: 50%;
                margin-left: -4px;
                border-bottom: none;
                border-right: none;
            }
            
            .tooltip.left::before {
                right: -5px;
                top: 50%;
                margin-top: -4px;
                border-left: none;
                border-bottom: none;
            }
            
            .tooltip.right::before {
                left: -5px;
                top: 50%;
                margin-top: -4px;
                border-right: none;
                border-top: none;
            }

            .tooltip-title {
                font-weight: 600;
                margin-bottom: 4px;
                color: var(--color-primary, #3b82f6);
            }

            .tooltip-content {
                color: var(--color-text-secondary, #cccccc);
            }

            .tooltip-shortcut {
                display: inline-block;
                background: var(--color-bg-secondary, #2a2a2a);
                padding: 2px 6px;
                border-radius: 4px;
                font-size: 12px;
                margin-top: 6px;
                border: 1px solid var(--color-border, #444444);
            }
            
            [data-tooltip] {
                position: relative;
                cursor: help;
            }
        `;
        document.head.appendChild(styleSheet);
        this.styles = styleSheet;
    }

    setupEventListeners() {
        document.addEventListener('mouseenter', this.handleMouseEnter.bind(this), true);
        document.addEventListener('mouseleave', this.handleMouseLeave.bind(this), true);
        document.addEventListener('click', this.handleClick.bind(this));
        window.addEventListener('resize', this.handleResize.bind(this));
        document.addEventListener('scroll', this.handleScroll.bind(this));
    }

    handleMouseEnter(e) {
        const element = e.target.closest('[data-tooltip]');
        if (element) {
            const delay = parseInt(element.dataset.tooltipDelay) || 500;
            this.showTooltipTimer = setTimeout(() => {
                this.showTooltip(element);
            }, delay);
        }
    }

    handleMouseLeave(e) {
        const element = e.target.closest('[data-tooltip]');
        if (element) {
            clearTimeout(this.showTooltipTimer);
            this.hideTooltip();
        }
    }

    handleClick(e) {
        // Hide tooltip on click outside
        if (!e.target.closest('[data-tooltip]')) {
            this.hideTooltip();
        }
    }

    handleResize() {
        if (this.activeTooltip) {
            this.hideTooltip();
        }
    }

    handleScroll() {
        if (this.activeTooltip) {
            this.updateTooltipPosition();
        }
    }

    showTooltip(element) {
        this.hideTooltip(); // Hide any existing tooltip

        const content = element.dataset.tooltip;
        const title = element.dataset.tooltipTitle;
        const position = element.dataset.tooltipPosition || 'top';
        const shortcut = element.dataset.tooltipShortcut;
        
        if (!content) return;

        // Create tooltip element
        const tooltip = document.createElement('div');
        tooltip.className = `tooltip ${position}`;
        
        let tooltipHTML = '';
        if (title) {
            tooltipHTML += `<div class="tooltip-title">${title}</div>`;
        }
        tooltipHTML += `<div class="tooltip-content">${content}</div>`;
        if (shortcut) {
            tooltipHTML += `<div class="tooltip-shortcut">Shortcut: ${shortcut}</div>`;
        }
        
        tooltip.innerHTML = tooltipHTML;
        document.body.appendChild(tooltip);

        // Position tooltip
        this.positionTooltip(tooltip, element, position);

        // Show tooltip
        setTimeout(() => {
            tooltip.classList.add('show');
        }, 10);

        this.activeTooltip = tooltip;
    }

    positionTooltip(tooltip, element, position) {
        const elementRect = element.getBoundingClientRect();
        const tooltipRect = tooltip.getBoundingClientRect();
        
        let left, top;

        switch (position) {
            case 'top':
                left = elementRect.left + (elementRect.width / 2) - (tooltipRect.width / 2);
                top = elementRect.top - tooltipRect.height - 10;
                break;
            case 'bottom':
                left = elementRect.left + (elementRect.width / 2) - (tooltipRect.width / 2);
                top = elementRect.bottom + 10;
                break;
            case 'left':
                left = elementRect.left - tooltipRect.width - 10;
                top = elementRect.top + (elementRect.height / 2) - (tooltipRect.height / 2);
                break;
            case 'right':
                left = elementRect.right + 10;
                top = elementRect.top + (elementRect.height / 2) - (tooltipRect.height / 2);
                break;
        }

        // Keep tooltip within viewport
        const padding = 10;
        left = Math.max(padding, Math.min(left, window.innerWidth - tooltipRect.width - padding));
        top = Math.max(padding, Math.min(top, window.innerHeight - tooltipRect.height - padding));

        tooltip.style.left = `${left}px`;
        tooltip.style.top = `${top}px`;
    }

    updateTooltipPosition() {
        if (this.activeTooltip && this.activeTooltip.targetElement) {
            const position = this.activeTooltip.targetElement.dataset.tooltipPosition || 'top';
            this.positionTooltip(this.activeTooltip, this.activeTooltip.targetElement, position);
        }
    }

    hideTooltip() {
        if (this.activeTooltip) {
            this.activeTooltip.classList.remove('show');
            setTimeout(() => {
                if (this.activeTooltip && this.activeTooltip.parentNode) {
                    this.activeTooltip.parentNode.removeChild(this.activeTooltip);
                }
                this.activeTooltip = null;
            }, 200);
        }
    }

    // Public API for manual tooltip management
    addTooltip(elementSelector, content, options = {}) {
        const elements = document.querySelectorAll(elementSelector);
        elements.forEach(element => {
            element.dataset.tooltip = content;
            if (options.title) element.dataset.tooltipTitle = options.title;
            if (options.position) element.dataset.tooltipPosition = options.position;
            if (options.shortcut) element.dataset.tooltipShortcut = options.shortcut;
            if (options.delay) element.dataset.tooltipDelay = options.delay;
        });
    }

    removeTooltip(elementSelector) {
        const elements = document.querySelectorAll(elementSelector);
        elements.forEach(element => {
            delete element.dataset.tooltip;
            delete element.dataset.tooltipTitle;
            delete element.dataset.tooltipPosition;
            delete element.dataset.tooltipShortcut;
            delete element.dataset.tooltipDelay;
        });
    }

    destroy() {
        this.hideTooltip();
        if (this.styles && this.styles.parentNode) {
            this.styles.parentNode.removeChild(this.styles);
        }
        document.removeEventListener('mouseenter', this.handleMouseEnter, true);
        document.removeEventListener('mouseleave', this.handleMouseLeave, true);
        document.removeEventListener('click', this.handleClick);
        window.removeEventListener('resize', this.handleResize);
        document.removeEventListener('scroll', this.handleScroll);
    }
}

// Initialize tooltip system when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.tooltipSystem = new TooltipSystem();
    });
} else {
    window.tooltipSystem = new TooltipSystem();
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TooltipSystem;
}