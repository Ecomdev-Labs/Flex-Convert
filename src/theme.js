// Theme switcher for all pages
(function() {
    const THEME_KEY = 'flex-convert-theme';
    const htmlElement = document.documentElement;
    
    // Initialize theme from localStorage or system preference
    function initTheme() {
        const saved = localStorage.getItem(THEME_KEY);
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const isDark = saved ? saved === 'dark' : prefersDark;
        
        setTheme(isDark ? 'dark' : 'light');
    }
    
    // Set theme
    function setTheme(theme) {
        const isDark = theme === 'dark';
        
        if (isDark) {
            htmlElement.setAttribute('data-theme', 'dark');
            document.body.style.backgroundColor = 'var(--bg)';
        } else {
            htmlElement.removeAttribute('data-theme');
            document.body.style.backgroundColor = 'var(--bg)';
        }
        
        localStorage.setItem(THEME_KEY, theme);
        updateToggleButtons(isDark);
    }
    
    // Update all toggle buttons
    function updateToggleButtons(isDark) {
        const buttons = document.querySelectorAll('[data-theme-toggle]');
        buttons.forEach(btn => {
            btn.setAttribute('aria-pressed', isDark);
            const icon = btn.querySelector('[data-theme-icon]');
            const label = btn.querySelector('[data-theme-label]');
            if (icon) icon.textContent = isDark ? '☀️' : '◐';
            if (label) label.textContent = isDark ? 'Свет' : 'Тема';
        });
    }
    
    // Toggle theme
    function toggleTheme() {
        const currentTheme = htmlElement.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
    }
    
    // Initialize on DOM ready
    function onReady() {
        initTheme();
        
        // Setup click handlers for all theme toggle buttons
        document.querySelectorAll('[data-theme-toggle]').forEach(btn => {
            btn.addEventListener('click', toggleTheme);
        });
        
        // Listen for system theme changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (!localStorage.getItem(THEME_KEY)) {
                setTheme(e.matches ? 'dark' : 'light');
            }
        });
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', onReady);
    } else {
        onReady();
    }
    
    // Expose for manual use
    window.FlexConvertTheme = { toggle: toggleTheme, set: setTheme };
})();
