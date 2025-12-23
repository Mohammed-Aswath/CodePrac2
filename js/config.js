/**
 * Configuration - Central settings and constants
 */

const Config = {
    API_BASE: 'http://localhost:5000/api',
    API_BASE_URL: 'http://localhost:5000/api', // Alias for compatibility
    
    ROLES: {
        ADMIN: 'admin',
        COLLEGE: 'college',
        DEPARTMENT: 'department',
        BATCH: 'batch',
        STUDENT: 'student'
    },

    STORAGE_KEYS: {
        TOKEN: 'token',
        USER: 'user'
    },

    BATCH_REGEX: /^\d{4}-\d{4}$/,

    PAGES: {
        AUTH: 'auth',
        DASHBOARD: 'dashboard',
        ADMIN: 'admin',
        COLLEGE: 'college',
        DEPARTMENT: 'department',
        BATCH: 'batch',
        STUDENT: 'student'
    }
};

// Export to global scope for all modules
window.CONFIG = Config;
window.Config = Config;

Object.freeze(Config);
