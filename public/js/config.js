// Application Configuration
const CONFIG = {
    API_BASE_URL: window.location.origin + '/api',
    SOCKET_URL: window.location.origin,
    
    // Pagination
    DEFAULT_PAGE_SIZE: 10,
    MAX_PAGE_SIZE: 50,
    
    // Poll Configuration
    MIN_POLL_OPTIONS: 2,
    MAX_POLL_OPTIONS: 10,
    MAX_POLL_TITLE_LENGTH: 200,
    MAX_POLL_DESCRIPTION_LENGTH: 1000,
    MAX_OPTION_LENGTH: 200,
    
    // User Configuration
    MIN_USERNAME_LENGTH: 3,
    MAX_USERNAME_LENGTH: 30,
    MIN_PASSWORD_LENGTH: 6,
    
    // UI Configuration
    NOTIFICATION_DURATION: 5000,
    DEBOUNCE_DELAY: 300,
    ANIMATION_DURATION: 300,
    
    // Categories
    POLL_CATEGORIES: [
        { value: 'general', label: 'General' },
        { value: 'politics', label: 'Politics' },
        { value: 'entertainment', label: 'Entertainment' },
        { value: 'sports', label: 'Sports' },
        { value: 'technology', label: 'Technology' },
        { value: 'education', label: 'Education' },
        { value: 'business', label: 'Business' },
        { value: 'other', label: 'Other' }
    ],
    
    // Chart Colors
    CHART_COLORS: [
        '#4f46e5', '#06b6d4', '#10b981', '#f59e0b',
        '#ef4444', '#8b5cf6', '#f97316', '#84cc16',
        '#06b6d4', '#ec4899'
    ],
    
    // Local Storage Keys
    STORAGE_KEYS: {
        AUTH_TOKEN: 'votehub_auth_token',
        USER_DATA: 'votehub_user_data',
        THEME: 'votehub_theme',
        LANGUAGE: 'votehub_language'
    },
    
    // Error Messages
    ERROR_MESSAGES: {
        NETWORK_ERROR: 'Network error. Please check your connection.',
        UNAUTHORIZED: 'You are not authorized to perform this action.',
        FORBIDDEN: 'Access denied.',
        NOT_FOUND: 'Resource not found.',
        SERVER_ERROR: 'Server error. Please try again later.',
        VALIDATION_ERROR: 'Please check your input and try again.',
        POLL_NOT_FOUND: 'Poll not found or no longer available.',
        ALREADY_VOTED: 'You have already voted on this poll.',
        POLL_EXPIRED: 'This poll has expired.',
        POLL_INACTIVE: 'This poll is not currently active.'
    },
    
    // Success Messages
    SUCCESS_MESSAGES: {
        POLL_CREATED: 'Poll created successfully!',
        VOTE_CAST: 'Your vote has been recorded!',
        POLL_UPDATED: 'Poll updated successfully!',
        POLL_DELETED: 'Poll deleted successfully!',
        PROFILE_UPDATED: 'Profile updated successfully!',
        PASSWORD_CHANGED: 'Password changed successfully!',
        LOGIN_SUCCESS: 'Welcome back!',
        REGISTER_SUCCESS: 'Account created successfully!',
        LOGOUT_SUCCESS: 'You have been logged out.'
    }
};

// Utility Functions
const Utils = {
    // Debounce function
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
    
    // Throttle function
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
    },
    
    // Format date
    formatDate(date, options = {}) {
        const defaultOptions = {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        return new Date(date).toLocaleDateString('en-US', { ...defaultOptions, ...options });
    },
    
    // Format relative time
    formatRelativeTime(date) {
        const now = new Date();
        const diff = now - new Date(date);
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
        if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
        return 'Just now';
    },
    
    // Format number with commas
    formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    },
    
    // Sanitize HTML
    sanitizeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    },
    
    // Generate unique ID
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },
    
    // Validate email
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },
    
    // Validate password strength
    validatePassword(password) {
        const minLength = password.length >= CONFIG.MIN_PASSWORD_LENGTH;
        const hasUpper = /[A-Z]/.test(password);
        const hasLower = /[a-z]/.test(password);
        const hasNumber = /\d/.test(password);
        const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
        
        return {
            isValid: minLength && hasLower,
            strength: [minLength, hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length,
            requirements: {
                minLength,
                hasUpper,
                hasLower,
                hasNumber,
                hasSpecial
            }
        };
    },
    
    // Copy to clipboard
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (err) {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            return true;
        }
    },
    
    // Get URL parameters
    getUrlParams() {
        const params = new URLSearchParams(window.location.search);
        const result = {};
        for (const [key, value] of params) {
            result[key] = value;
        }
        return result;
    },
    
    // Update URL without reload
    updateUrl(params) {
        const url = new URL(window.location);
        Object.keys(params).forEach(key => {
            if (params[key] !== null && params[key] !== undefined) {
                url.searchParams.set(key, params[key]);
            } else {
                url.searchParams.delete(key);
            }
        });
        window.history.pushState({}, '', url);
    },
    
    // Local storage helpers
    storage: {
        set(key, value) {
            try {
                localStorage.setItem(key, JSON.stringify(value));
                return true;
            } catch (e) {
                console.error('Error saving to localStorage:', e);
                return false;
            }
        },
        
        get(key, defaultValue = null) {
            try {
                const item = localStorage.getItem(key);
                return item ? JSON.parse(item) : defaultValue;
            } catch (e) {
                console.error('Error reading from localStorage:', e);
                return defaultValue;
            }
        },
        
        remove(key) {
            try {
                localStorage.removeItem(key);
                return true;
            } catch (e) {
                console.error('Error removing from localStorage:', e);
                return false;
            }
        },
        
        clear() {
            try {
                localStorage.clear();
                return true;
            } catch (e) {
                console.error('Error clearing localStorage:', e);
                return false;
            }
        }
    }
};

// Export for use in other files
window.CONFIG = CONFIG;
window.Utils = Utils;
