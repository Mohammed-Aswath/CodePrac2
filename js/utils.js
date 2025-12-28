/**
 * Utility Functions - Reusable helpers
 */

const Utils = {
    /**
     * Safely escape HTML to prevent XSS
     */
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    /**
     * Validate email format
     */
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },

    /**
     * Validate password strength (min 8 chars, at least one letter and one number)
     */
    isValidPassword(password) {
        return password && password.length >= 8 && /[a-zA-Z]/.test(password) && /[0-9]/.test(password);
    },

    /**
     * Validate non-empty string
     */
    isValidString(str, minLength = 1) {
        return str && str.trim().length >= minLength;
    },

    /**
     * Show alert message in UI
     */
    showMessage(elementId, message, type = 'info') {
        const element = document.getElementById(elementId);
        if (!element) return;

        const alertClass = type === 'error' ? 'alert-error' : type === 'success' ? 'alert-success' : 'alert-info';
        element.innerHTML = `<div class="alert ${alertClass}">${message}</div>`;

        // Auto-clear after 5 seconds
        setTimeout(() => {
            if (element.innerHTML.includes(message)) {
                element.innerHTML = '';
            }
        }, 5000);
    },

    /**
     * Get stored auth token
     */
    getToken() {
        return localStorage.getItem(Config.STORAGE_KEYS.TOKEN);
    },

    /**
     * Get current user from storage
     */
    getUser() {
        const userStr = localStorage.getItem(Config.STORAGE_KEYS.USER);
        return userStr ? JSON.parse(userStr) : null;
    },

    /**
     * Save auth token and user
     */
    saveAuth(token, user) {
        localStorage.setItem(Config.STORAGE_KEYS.TOKEN, token);
        localStorage.setItem(Config.STORAGE_KEYS.USER, JSON.stringify(user));
    },

    /**
     * Clear auth data
     */
    clearAuth() {
        localStorage.removeItem(Config.STORAGE_KEYS.TOKEN);
        localStorage.removeItem(Config.STORAGE_KEYS.USER);
    },

    /**
     * Make API request with auth header
     */
    async apiRequest(endpoint, options = {}) {
        const url = `${Config.API_BASE}${endpoint}`;
        const token = this.getToken();

        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        try {
            const response = await fetch(url, {
                ...options,
                headers
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Request failed');
            }

            return data;
        } catch (error) {
            if (!options.silent) {
                console.error(`API Error [${endpoint}]:`, error);
            }
            throw error;
        }
    },

    /**
     * Format date for display
     */
    formatDate(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    },

    /**
     * Debounce function
     */
    debounce(func, delay) {
        let timeoutId;
        return function (...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    },

    /**
     * Confirm dialog
     */
    confirm(message) {
        return window.confirm(message);
    },

    /**
     * Alert dialog
     */
    alert(message) {
        window.alert(message);
    },

    /**
     * Show loading state in a container
     */
    showLoading(containerId, message = 'Loading...') {
        const container = document.getElementById(containerId);
        if (!container) return;
        container.innerHTML = `
            <div class="loading-state">
                <div class="spinner"></div>
                ${message ? `<div class="loading-message">${message}</div>` : ''}
            </div>
        `;
    },

    /**
     * Show full screen loading overlay
     */
    showLoadingOverlay(message = 'processing...') {
        let overlay = document.getElementById('global-loading-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'global-loading-overlay';
            overlay.className = 'loading-overlay';
            document.body.appendChild(overlay);
        }
        overlay.innerHTML = `
            <div class="loading-content">
                <div class="spinner-large"></div>
                <div class="loading-text">${message}</div>
            </div>
        `;
        overlay.style.display = 'flex';
    },

    /**
     * Hide full screen loading overlay
     */
    hideLoadingOverlay() {
        const overlay = document.getElementById('global-loading-overlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    },

    /**
     * Show error state in a container
     */
    showError(containerId, message, retryCallback) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <div class="error-state">
                <div class="error-icon">!</div>
                <div class="error-message">${this.escapeHtml(message || 'Something went wrong')}</div>
                ${retryCallback ? `<button class="btn btn-secondary btn-sm mt-3 retry-btn">Try Again</button>` : ''}
            </div>
        `;

        if (retryCallback) {
            container.querySelector('.retry-btn').onclick = retryCallback;
        }
    }
};
