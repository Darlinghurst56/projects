/**
 * Utility Functions for Agent Dashboard
 * Common helper functions used across the dashboard
 */

// Date and time utilities
const DateUtils = {
    formatTime(date) {
        return date.toLocaleTimeString();
    },
    
    formatDate(date) {
        return date.toLocaleDateString();
    },
    
    getRelativeTime(date) {
        const now = new Date();
        const diff = now - date;
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        
        if (seconds < 60) return 'just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return date.toLocaleDateString();
    }
};

// String utilities
const StringUtils = {
    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    },
    
    camelCase(str) {
        return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
    },
    
    kebabCase(str) {
        return str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
    },
    
    truncate(str, length = 50) {
        return str.length > length ? str.substring(0, length) + '...' : str;
    }
};

// Number utilities
const NumberUtils = {
    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    },
    
    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },
    
    formatPercent(value, total) {
        return total > 0 ? Math.round((value / total) * 100) : 0;
    }
};

// DOM utilities
const DOMUtils = {
    createElement(tag, className, content) {
        const element = document.createElement(tag);
        if (className) element.className = className;
        if (content) element.textContent = content;
        return element;
    },
    
    removeAllChildren(element) {
        while (element.firstChild) {
            element.removeChild(element.firstChild);
        }
    },
    
    isVisible(element) {
        return element.offsetParent !== null;
    },
    
    scrollToElement(element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
};

// Color utilities
const ColorUtils = {
    getStatusColor(status) {
        const colors = {
            'active': '#4CAF50',
            'inactive': '#9E9E9E',
            'pending': '#FF9800',
            'error': '#F44336',
            'success': '#4CAF50',
            'warning': '#FF9800',
            'info': '#2196F3'
        };
        return colors[status] || '#9E9E9E';
    },
    
    hexToRgba(hex, alpha = 1) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
};

// Validation utilities
const ValidationUtils = {
    isEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },
    
    isUrl(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    },
    
    isEmpty(value) {
        return value === null || value === undefined || value === '';
    },
    
    isValidId(id) {
        return /^[a-zA-Z0-9_-]+$/.test(id);
    }
};

// Storage utilities
const StorageUtils = {
    get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch {
            return defaultValue;
        }
    },
    
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch {
            return false;
        }
    },
    
    remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch {
            return false;
        }
    },
    
    clear() {
        try {
            localStorage.clear();
            return true;
        } catch {
            return false;
        }
    }
};

// Event utilities
const EventUtils = {
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    
    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
};

// Export utilities
if (typeof window !== 'undefined') {
    window.DateUtils = DateUtils;
    window.StringUtils = StringUtils;
    window.NumberUtils = NumberUtils;
    window.DOMUtils = DOMUtils;
    window.ColorUtils = ColorUtils;
    window.ValidationUtils = ValidationUtils;
    window.StorageUtils = StorageUtils;
    window.EventUtils = EventUtils;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        DateUtils,
        StringUtils,
        NumberUtils,
        DOMUtils,
        ColorUtils,
        ValidationUtils,
        StorageUtils,
        EventUtils
    };
}