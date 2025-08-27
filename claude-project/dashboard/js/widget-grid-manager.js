/**
 * Widget Grid Manager - Task 3
 * Dynamic width calculations and responsive grid management
 * Handles widget layout optimization and consistency
 */

class WidgetGridManager {
    constructor(gridSelector = '.widget-grid') {
        this.gridContainer = document.querySelector(gridSelector);
        this.widgets = [];
        this.resizeObserver = null;
        this.debounceTimer = null;
        
        this.init();
    }

    /**
     * Initialize the widget grid manager
     */
    init() {
        if (!this.gridContainer) {
            console.warn('Widget grid container not found');
            return;
        }

        this.setupResizeObserver();
        this.collectWidgets();
        this.calculateOptimalLayout();
        this.setupEventListeners();
        
        console.log('✅ WidgetGridManager initialized with', this.widgets.length, 'widgets');
    }

    /**
     * Setup resize observer for responsive adjustments
     */
    setupResizeObserver() {
        if ('ResizeObserver' in window) {
            this.resizeObserver = new ResizeObserver((entries) => {
                this.debounceLayoutCalculation();
            });
            
            this.resizeObserver.observe(this.gridContainer);
        } else {
            // Fallback for older browsers
            window.addEventListener('resize', () => {
                this.debounceLayoutCalculation();
            });
        }
    }

    /**
     * Debounce layout calculations to prevent excessive recalculations
     */
    debounceLayoutCalculation() {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => {
            this.calculateOptimalLayout();
        }, 150);
    }

    /**
     * Collect all widgets in the grid
     */
    collectWidgets() {
        this.widgets = Array.from(this.gridContainer.querySelectorAll('.widget'));
        
        // Add data attributes for tracking
        this.widgets.forEach((widget, index) => {
            widget.setAttribute('data-widget-index', index);
            widget.setAttribute('data-widget-id', this.generateWidgetId(widget));
        });
    }

    /**
     * Generate a unique ID for a widget based on its content
     */
    generateWidgetId(widget) {
        const title = widget.querySelector('.widget-title');
        const id = title ? title.textContent.toLowerCase().replace(/\s+/g, '-') : `widget-${Date.now()}`;
        return id.replace(/[^a-z0-9-]/g, '');
    }

    /**
     * Calculate optimal layout based on container size and widget count
     */
    calculateOptimalLayout() {
        const containerWidth = this.gridContainer.clientWidth;
        const availableHeight = this.gridContainer.clientHeight;
        const widgetCount = this.widgets.length;
        
        if (widgetCount === 0 || containerWidth === 0) return;

        // Calculate optimal grid configuration
        const layout = this.calculateGridDimensions(containerWidth, availableHeight, widgetCount);
        
        // Apply layout
        this.applyGridLayout(layout);
        
        // Handle widget content overflow
        this.handleContentOverflow();
        
        // Log layout information
        console.log(`📐 Layout calculated:`, {
            containerWidth,
            widgetCount,
            columns: layout.columns,
            minWidgetWidth: layout.minWidgetWidth,
            gap: layout.gap
        });
    }

    /**
     * Calculate optimal grid dimensions
     */
    calculateGridDimensions(containerWidth, availableHeight, widgetCount) {
        // Define breakpoints and optimal configurations
        const breakpoints = [
            { maxWidth: 479, columns: 1, minWidgetWidth: 280, gap: 16 },
            { maxWidth: 767, columns: 1, minWidgetWidth: 320, gap: 20 },
            { maxWidth: 1023, columns: 2, minWidgetWidth: 340, gap: 24 },
            { maxWidth: 1199, columns: 2, minWidgetWidth: 380, gap: 28 },
            { maxWidth: 1599, columns: 3, minWidgetWidth: 400, gap: 32 },
            { maxWidth: Infinity, columns: 4, minWidgetWidth: 420, gap: 32 }
        ];

        // Find appropriate breakpoint
        const breakpoint = breakpoints.find(bp => containerWidth <= bp.maxWidth);
        
        // Calculate actual columns based on available width
        const maxPossibleColumns = Math.floor(
            (containerWidth + breakpoint.gap) / (breakpoint.minWidgetWidth + breakpoint.gap)
        );
        
        // Don't exceed widget count or breakpoint max columns
        const actualColumns = Math.min(maxPossibleColumns, breakpoint.columns, widgetCount);
        
        // Calculate actual widget width
        const totalGapWidth = breakpoint.gap * (actualColumns - 1);
        const availableWidthForWidgets = containerWidth - totalGapWidth;
        const actualWidgetWidth = Math.floor(availableWidthForWidgets / actualColumns);

        return {
            columns: actualColumns,
            minWidgetWidth: Math.max(breakpoint.minWidgetWidth, actualWidgetWidth),
            gap: breakpoint.gap,
            widgetWidth: actualWidgetWidth
        };
    }

    /**
     * Apply calculated grid layout
     */
    applyGridLayout(layout) {
        // Apply CSS custom properties for dynamic styling
        this.gridContainer.style.setProperty('--dynamic-columns', layout.columns);
        this.gridContainer.style.setProperty('--dynamic-gap', `${layout.gap}px`);
        this.gridContainer.style.setProperty('--dynamic-widget-width', `${layout.widgetWidth}px`);
        this.gridContainer.style.setProperty('--dynamic-min-widget-width', `${layout.minWidgetWidth}px`);

        // Update grid template columns
        const gridColumns = `repeat(${layout.columns}, 1fr)`;
        this.gridContainer.style.gridTemplateColumns = gridColumns;
        this.gridContainer.style.gap = `${layout.gap}px`;

        // Add responsive class for additional styling
        this.updateResponsiveClasses(layout.columns);
    }

    /**
     * Update responsive classes based on column count
     */
    updateResponsiveClasses(columns) {
        // Remove existing responsive classes
        this.gridContainer.classList.remove('grid-1-col', 'grid-2-col', 'grid-3-col', 'grid-4-col');
        
        // Add current column class
        this.gridContainer.classList.add(`grid-${columns}-col`);
        
        // Add density class
        if (columns === 1) {
            this.gridContainer.classList.add('grid-sparse');
            this.gridContainer.classList.remove('grid-dense');
        } else {
            this.gridContainer.classList.add('grid-dense');
            this.gridContainer.classList.remove('grid-sparse');
        }
    }

    /**
     * Handle content overflow in widgets
     */
    handleContentOverflow() {
        this.widgets.forEach(widget => {
            this.handleWidgetOverflow(widget);
        });
    }

    /**
     * Handle overflow for a specific widget
     */
    handleWidgetOverflow(widget) {
        const content = widget.querySelector('.widget-content');
        if (!content) return;

        // Check for text overflow in titles
        const title = widget.querySelector('.widget-title');
        if (title) {
            this.handleTextOverflow(title);
        }

        // Handle content area overflow
        const contentHeight = content.scrollHeight;
        const availableHeight = content.clientHeight;
        
        if (contentHeight > availableHeight) {
            content.setAttribute('data-overflow', 'true');
            this.addScrollIndicators(content);
        } else {
            content.removeAttribute('data-overflow');
            this.removeScrollIndicators(content);
        }

        // Handle long text content
        const textElements = content.querySelectorAll('p, span, div:not(.scroll-indicator)');
        textElements.forEach(element => {
            this.handleTextOverflow(element);
        });
    }

    /**
     * Handle text overflow with ellipsis and tooltips
     */
    handleTextOverflow(element) {
        const isOverflowing = element.scrollWidth > element.clientWidth;
        
        if (isOverflowing) {
            element.setAttribute('data-text-overflow', 'true');
            element.setAttribute('title', element.textContent);
            element.style.overflow = 'hidden';
            element.style.textOverflow = 'ellipsis';
            element.style.whiteSpace = 'nowrap';
        } else {
            element.removeAttribute('data-text-overflow');
            element.removeAttribute('title');
        }
    }

    /**
     * Add scroll indicators to overflowing content
     */
    addScrollIndicators(content) {
        // Remove existing indicators
        this.removeScrollIndicators(content);
        
        // Create scroll indicator
        const indicator = document.createElement('div');
        indicator.className = 'scroll-indicator';
        indicator.innerHTML = '⇣ Scroll for more';
        indicator.style.cssText = `
            position: absolute;
            bottom: 8px;
            right: 8px;
            background: rgba(0, 0, 0, 0.7);
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.75rem;
            pointer-events: none;
            z-index: 10;
        `;
        
        // Position content container relatively
        const contentParent = content.parentElement;
        if (contentParent.style.position !== 'relative') {
            contentParent.style.position = 'relative';
        }
        
        contentParent.appendChild(indicator);
        
        // Hide indicator when scrolled to bottom
        content.addEventListener('scroll', () => {
            const isAtBottom = content.scrollTop + content.clientHeight >= content.scrollHeight - 5;
            indicator.style.opacity = isAtBottom ? '0' : '1';
        });
    }

    /**
     * Remove scroll indicators
     */
    removeScrollIndicators(content) {
        const parent = content.parentElement;
        const indicators = parent.querySelectorAll('.scroll-indicator');
        indicators.forEach(indicator => indicator.remove());
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Listen for widget additions/removals
        if ('MutationObserver' in window) {
            const observer = new MutationObserver((mutations) => {
                let widgetsChanged = false;
                
                mutations.forEach((mutation) => {
                    if (mutation.type === 'childList') {
                        const addedWidgets = Array.from(mutation.addedNodes)
                            .filter(node => node.classList && node.classList.contains('widget'));
                        const removedWidgets = Array.from(mutation.removedNodes)
                            .filter(node => node.classList && node.classList.contains('widget'));
                        
                        if (addedWidgets.length > 0 || removedWidgets.length > 0) {
                            widgetsChanged = true;
                        }
                    }
                });
                
                if (widgetsChanged) {
                    this.collectWidgets();
                    this.debounceLayoutCalculation();
                }
            });
            
            observer.observe(this.gridContainer, {
                childList: true,
                subtree: false
            });
        }

        // Listen for orientation changes on mobile
        window.addEventListener('orientationchange', () => {
            // Delay to allow for viewport changes
            setTimeout(() => {
                this.calculateOptimalLayout();
            }, 100);
        });

        // Listen for visibility changes (tab switching)
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.calculateOptimalLayout();
            }
        });
    }

    /**
     * Force layout recalculation (public method)
     */
    recalculateLayout() {
        this.collectWidgets();
        this.calculateOptimalLayout();
    }

    /**
     * Get current layout information
     */
    getLayoutInfo() {
        const containerWidth = this.gridContainer.clientWidth;
        const containerHeight = this.gridContainer.clientHeight;
        const computedStyle = window.getComputedStyle(this.gridContainer);
        
        return {
            containerWidth,
            containerHeight,
            widgetCount: this.widgets.length,
            currentColumns: computedStyle.gridTemplateColumns.split(' ').length,
            currentGap: computedStyle.gap,
            widgets: this.widgets.map(widget => ({
                id: widget.getAttribute('data-widget-id'),
                width: widget.clientWidth,
                height: widget.clientHeight,
                hasOverflow: widget.querySelector('[data-overflow="true"]') !== null
            }))
        };
    }

    /**
     * Cleanup resources
     */
    destroy() {
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }
        
        clearTimeout(this.debounceTimer);
        
        // Remove scroll indicators
        this.widgets.forEach(widget => {
            const content = widget.querySelector('.widget-content');
            if (content) {
                this.removeScrollIndicators(content);
            }
        });
        
        console.log('🧹 WidgetGridManager destroyed');
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WidgetGridManager;
}

// Auto-initialize if DOM is ready
if (typeof window !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.widgetGridManager = new WidgetGridManager();
        });
    } else {
        window.widgetGridManager = new WidgetGridManager();
    }
}