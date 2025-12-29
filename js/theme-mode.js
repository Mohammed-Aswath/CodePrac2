// theme-mode.js - Dark/Bright Mode Toggle with Local Storage

class ThemeManager {
    constructor() {
        this.modeToggle = document.getElementById('modeToggle');
        this.sunIcon = document.getElementById('sunIcon');
        this.moonIcon = document.getElementById('moonIcon');
        
        this.init();
    }
    
    init() {
        // Check for saved theme preference or prefer-color-scheme
        const savedTheme = localStorage.getItem('codeprac-theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        if (savedTheme === 'light' || (!savedTheme && !prefersDark)) {
            this.enableLightMode();
        } else {
            this.enableDarkMode();
        }
        
        // Add event listener
        this.modeToggle.addEventListener('click', () => this.toggleMode());
        
        // Listen for system theme changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (!localStorage.getItem('codeprac-theme')) {
                e.matches ? this.enableDarkMode() : this.enableLightMode();
            }
        });
    }
    
    toggleMode() {
        if (document.body.classList.contains('light-mode')) {
            this.enableDarkMode();
        } else {
            this.enableLightMode();
        }
    }
    
    enableDarkMode() {
        document.body.classList.remove('light-mode');
        this.sunIcon.classList.add('hidden');
        this.moonIcon.classList.remove('hidden');
        localStorage.setItem('codeprac-theme', 'dark');
        
        // Add transition class for smooth transition
        document.body.classList.add('theme-transition');
        setTimeout(() => document.body.classList.remove('theme-transition'), 300);
        
        // Dispatch event for other components
        document.dispatchEvent(new CustomEvent('themeChanged', { detail: { mode: 'dark' } }));
    }
    
    enableLightMode() {
        document.body.classList.add('light-mode');
        this.sunIcon.classList.remove('hidden');
        this.moonIcon.classList.add('hidden');
        localStorage.setItem('codeprac-theme', 'light');
        
        // Add transition class for smooth transition
        document.body.classList.add('theme-transition');
        setTimeout(() => document.body.classList.remove('theme-transition'), 300);
        
        // Dispatch event for other components
        document.dispatchEvent(new CustomEvent('themeChanged', { detail: { mode: 'light' } }));
    }
    
    // Get current theme
    getCurrentTheme() {
        return document.body.classList.contains('light-mode') ? 'light' : 'dark';
    }
    
    // Apply theme to specific elements (for dynamic content)
    applyThemeToElement(element) {
        if (this.getCurrentTheme() === 'light') {
            element.classList.add('light-mode');
        } else {
            element.classList.remove('light-mode');
        }
    }
}

// Initialize theme manager
document.addEventListener('DOMContentLoaded', () => {
    window.themeManager = new ThemeManager();
});





// there is multi loading problem in batch section in admin panel
// generate testcase test case not visible


// in view hidden test case test case is not completely visible


// sample test case as open test case in code editor (bug in displaying)

// change UID to name

// drive to drive/ repo

