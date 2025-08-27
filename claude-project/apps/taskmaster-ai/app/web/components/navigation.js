/**
 * TaskMaster AI - Navigation Component
 * Provides unified navigation across all interfaces
 */
class TaskMasterNavigation {
    constructor() {
        this.routes = {
            '/': { name: 'Home', icon: '🏠' },
            '/tasks': { name: 'Tasks', icon: '📋' },
            '/agents': { name: 'Agents', icon: '🤖' },
            '/developer-interface': { name: 'Developer', icon: '⚙️' }
        };
        this.currentPath = window.location.pathname;
    }

    /**
     * Generate navigation HTML structure
     */
    generateHTML() {
        const breadcrumb = this.generateBreadcrumb();
        
        return `
            <header class="tm-header">
                <div class="tm-header-content">
                    <a href="/" class="tm-logo">
                        🤖 TaskMaster AI
                    </a>
                    <div class="tm-header-info">
                        <span id="tm-system-status" class="tm-status tm-status-online">
                            <span class="tm-spinner" style="display: none;"></span>
                            System Online
                        </span>
                    </div>
                </div>
            </header>
            
            <nav class="tm-nav">
                <div class="tm-nav-content">
                    <ul class="tm-nav-links">
                        ${this.generateNavLinks()}
                    </ul>
                    <div class="tm-breadcrumb">${breadcrumb}</div>
                </div>
            </nav>
        `;
    }

    /**
     * Generate navigation links
     */
    generateNavLinks() {
        return Object.entries(this.routes).map(([path, config]) => {
            const isActive = this.currentPath === path || 
                           (path !== '/' && this.currentPath.startsWith(path));
            const activeClass = isActive ? 'active' : '';
            
            return `
                <li>
                    <a href="${path}" class="tm-nav-link ${activeClass}">
                        ${config.icon} ${config.name}
                    </a>
                </li>
            `;
        }).join('');
    }

    /**
     * Generate breadcrumb navigation
     */
    generateBreadcrumb() {
        const pathParts = this.currentPath.split('/').filter(Boolean);
        
        if (pathParts.length === 0) {
            return 'Home';
        }

        const breadcrumbs = ['<a href="/">Home</a>'];
        let currentPath = '';
        
        pathParts.forEach((part, index) => {
            currentPath += '/' + part;
            const route = this.routes[currentPath];
            
            if (route) {
                if (index === pathParts.length - 1) {
                    breadcrumbs.push(route.name);
                } else {
                    breadcrumbs.push(`<a href="${currentPath}">${route.name}</a>`);
                }
            } else {
                // Fallback for unknown routes
                const displayName = part.charAt(0).toUpperCase() + part.slice(1);
                if (index === pathParts.length - 1) {
                    breadcrumbs.push(displayName);
                } else {
                    breadcrumbs.push(`<a href="${currentPath}">${displayName}</a>`);
                }
            }
        });

        return breadcrumbs.join(' › ');
    }

    /**
     * Initialize navigation component
     */
    init() {
        // Add navigation to page
        document.body.insertAdjacentHTML('afterbegin', this.generateHTML());
        
        // Initialize system status monitoring
        this.initSystemStatus();
        
        // Add event listeners
        this.addEventListeners();
    }

    /**
     * Initialize system status monitoring
     */
    async initSystemStatus() {
        const statusElement = document.getElementById('tm-system-status');
        const spinner = statusElement.querySelector('.tm-spinner');
        
        try {
            spinner.style.display = 'inline-block';
            statusElement.className = 'tm-status tm-status-warning';
            statusElement.innerHTML = '<span class="tm-spinner"></span> Checking...';
            
            const response = await fetch('/api/health');
            const health = await response.json();
            
            spinner.style.display = 'none';
            
            if (health.status === 'healthy') {
                statusElement.className = 'tm-status tm-status-online';
                statusElement.textContent = 'System Healthy';
            } else if (health.status === 'warning') {
                statusElement.className = 'tm-status tm-status-warning';
                statusElement.textContent = 'System Warning';
            } else {
                statusElement.className = 'tm-status tm-status-offline';
                statusElement.textContent = 'System Degraded';
            }
        } catch (error) {
            spinner.style.display = 'none';
            statusElement.className = 'tm-status tm-status-offline';
            statusElement.textContent = 'System Offline';
        }
    }

    /**
     * Add event listeners for navigation
     */
    addEventListeners() {
        // Handle link clicks for SPA-like behavior (optional)
        document.addEventListener('click', (e) => {
            if (e.target.matches('.tm-nav-link')) {
                // Could add SPA navigation here if needed
                // For now, let default behavior handle it
            }
        });

        // Update system status periodically
        setInterval(() => {
            this.initSystemStatus();
        }, 30000); // Check every 30 seconds
    }

    /**
     * Update active navigation item (for dynamic routing)
     */
    updateActive(newPath) {
        this.currentPath = newPath;
        
        // Update active classes
        document.querySelectorAll('.tm-nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === newPath || 
                (newPath !== '/' && newPath.startsWith(link.getAttribute('href')))) {
                link.classList.add('active');
            }
        });

        // Update breadcrumb
        const breadcrumbElement = document.querySelector('.tm-breadcrumb');
        if (breadcrumbElement) {
            breadcrumbElement.innerHTML = this.generateBreadcrumb();
        }
    }
}

// Auto-initialize if DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.tmNav = new TaskMasterNavigation();
        window.tmNav.init();
    });
} else {
    window.tmNav = new TaskMasterNavigation();
    window.tmNav.init();
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TaskMasterNavigation;
}