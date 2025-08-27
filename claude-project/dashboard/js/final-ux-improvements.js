/**
 * Final UX improvements based on testing results
 * Addresses remaining issues from accessibility and user testing
 */

document.addEventListener('DOMContentLoaded', function() {
    // Fix priority visibility issue
    addPriorityIndicators();
    
    // Fix button clarity issues
    improveButtonLabels();
    
    // Enhance keyboard navigation
    enhanceKeyboardNavigation();
    
    // Add comprehensive stats
    addDashboardStats();
    
    console.log('🎯 Final UX improvements applied');
});

function addPriorityIndicators() {
    // Add priority section headers and visual indicators
    const widgetGrid = document.querySelector('.widget-grid');
    if (widgetGrid) {
        // Create priority sections if they don't exist
        const prioritySections = [
            { id: 'urgent-section', title: '🚨 Urgent Tasks', class: 'priority-urgent' },
            { id: 'important-section', title: '⚠️ Important Tasks', class: 'priority-important' },
            { id: 'normal-section', title: '✅ Normal Tasks', class: 'priority-normal' }
        ];
        
        prioritySections.forEach(section => {
            if (!document.getElementById(section.id)) {
                const sectionDiv = document.createElement('div');
                sectionDiv.id = section.id;
                sectionDiv.className = `priority-section ${section.class}`;
                sectionDiv.innerHTML = `
                    <h2 class="section-title">${section.title}</h2>
                    <div class="priority-widgets"></div>
                `;
                widgetGrid.appendChild(sectionDiv);
            }
        });
        
        // Move existing widgets to appropriate sections
        const widgets = document.querySelectorAll('.widget');
        widgets.forEach((widget, index) => {
            const title = widget.querySelector('.widget-title, h2, h3, h4')?.textContent || '';
            let targetSection = 'normal-section';
            
            if (title.toLowerCase().includes('status') || title.toLowerCase().includes('dns')) {
                targetSection = 'urgent-section';
                widget.classList.add('priority-urgent');
            } else if (title.toLowerCase().includes('profile') || title.toLowerCase().includes('analytics')) {
                targetSection = 'important-section';
                widget.classList.add('priority-important');
            } else {
                targetSection = 'normal-section';
                widget.classList.add('priority-normal');
            }
            
            const section = document.querySelector(`#${targetSection} .priority-widgets`);
            if (section && widget.parentNode !== section) {
                section.appendChild(widget);
            }
        });
    }
}

function improveButtonLabels() {
    // Replace technical jargon with user-friendly labels
    const buttonMappings = {
        'Test Configuration': 'Test Settings',
        'DNS Configuration': 'DNS Settings',
        'API Configuration': 'API Settings',
        'Advanced Settings': 'More Options',
        'Debug Mode': 'Troubleshoot',
        'Reset Configuration': 'Reset Settings',
        'Export Configuration': 'Export Settings',
        'Import Configuration': 'Import Settings'
    };
    
    const buttons = document.querySelectorAll('button, .btn, .nav-button');
    buttons.forEach(button => {
        const text = button.textContent.trim();
        if (buttonMappings[text]) {
            button.innerHTML = button.innerHTML.replace(text, buttonMappings[text]);
        }
        
        // Add aria-label for better accessibility
        if (!button.getAttribute('aria-label')) {
            button.setAttribute('aria-label', button.textContent.trim());
        }
    });
}

function enhanceKeyboardNavigation() {
    // Ensure all interactive elements are keyboard accessible
    const interactiveElements = document.querySelectorAll('button, .btn, .nav-button, .widget-refresh, .widget-settings, a, input, select, textarea');
    
    interactiveElements.forEach((element, index) => {
        // Ensure tabindex is set for keyboard navigation
        if (!element.hasAttribute('tabindex')) {
            element.setAttribute('tabindex', '0');
        }
        
        // Add keyboard event handlers
        element.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                element.click();
            }
        });
        
        // Improve focus visibility
        element.addEventListener('focus', function() {
            element.style.outline = '3px solid #007bff';
            element.style.outlineOffset = '2px';
        });
        
        element.addEventListener('blur', function() {
            element.style.outline = '';
            element.style.outlineOffset = '';
        });
    });
    
    // Add skip links functionality
    const skipLink = document.querySelector('.skip-link');
    if (skipLink) {
        skipLink.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(skipLink.getAttribute('href'));
            if (target) {
                target.focus();
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }
}

function addDashboardStats() {
    // Add comprehensive stats to show progress and activity
    const header = document.querySelector('.dashboard-header');
    if (header && !document.querySelector('.dashboard-stats')) {
        const stats = document.createElement('div');
        stats.className = 'dashboard-stats';
        stats.innerHTML = `
            <div class="stats-grid">
                <div class="stat-item">
                    <div class="stat-value" id="active-widgets">0</div>
                    <div class="stat-label">Active Widgets</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value" id="system-status">Online</div>
                    <div class="stat-label">System Status</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value" id="last-update">Just now</div>
                    <div class="stat-label">Last Update</div>
                </div>
            </div>
        `;
        
        header.appendChild(stats);
        
        // Update stats
        updateDashboardStats();
        
        // Update stats every 30 seconds
        setInterval(updateDashboardStats, 30000);
    }
}

function updateDashboardStats() {
    const activeWidgets = document.querySelectorAll('.widget').length;
    const systemStatus = 'Online';
    const lastUpdate = new Date().toLocaleTimeString();
    
    const activeWidgetsEl = document.getElementById('active-widgets');
    const systemStatusEl = document.getElementById('system-status');
    const lastUpdateEl = document.getElementById('last-update');
    
    if (activeWidgetsEl) activeWidgetsEl.textContent = activeWidgets;
    if (systemStatusEl) systemStatusEl.textContent = systemStatus;
    if (lastUpdateEl) lastUpdateEl.textContent = lastUpdate;
}

// Add CSS for new elements
const style = document.createElement('style');
style.textContent = `
    .priority-section {
        margin-bottom: 2rem;
        padding: 1rem;
        border-radius: 8px;
        background: #f8f9fa;
    }
    
    .priority-section.priority-urgent {
        border-left: 4px solid #dc3545;
        background: #fff5f5;
    }
    
    .priority-section.priority-important {
        border-left: 4px solid #ffc107;
        background: #fffdf5;
    }
    
    .priority-section.priority-normal {
        border-left: 4px solid #28a745;
        background: #f8fff8;
    }
    
    .section-title {
        font-size: 1.125rem;
        font-weight: 600;
        margin-bottom: 1rem;
        color: #1a1a1a;
    }
    
    .priority-widgets {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 1rem;
    }
    
    .dashboard-stats {
        margin-top: 1rem;
        padding: 1rem;
        background: #ffffff;
        border-radius: 6px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
        gap: 1rem;
    }
    
    .stat-item {
        text-align: center;
        padding: 0.5rem;
    }
    
    .stat-value {
        font-size: 1.25rem;
        font-weight: 700;
        color: #007bff;
        margin-bottom: 0.25rem;
    }
    
    .stat-label {
        font-size: 0.75rem;
        color: #6c757d;
        text-transform: uppercase;
        font-weight: 500;
    }
    
    @media (max-width: 768px) {
        .priority-widgets {
            grid-template-columns: 1fr;
        }
        
        .stats-grid {
            grid-template-columns: repeat(3, 1fr);
        }
    }
`;
document.head.appendChild(style);