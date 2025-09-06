// Main Application Controller
class VotingApp {
    constructor() {
        this.currentSection = 'home';
        this.isInitialized = false;
        
        this.init();
    }
    
    async init() {
        if (this.isInitialized) return;
        
        try {
            // Wait for DOM to be ready
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.start());
            } else {
                this.start();
            }
        } catch (error) {
            console.error('Failed to initialize app:', error);
            UI.showNotification('Failed to initialize application', 'error');
        }
    }
    
    start() {
        this.bindEvents();
        this.loadInitialSection();
        this.loadHomeStatistics();
        this.isInitialized = true;
        
        console.log('VoteHub application initialized successfully');
    }
    
    bindEvents() {
        // Navigation
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('nav-link')) {
                e.preventDefault();
                const section = e.target.dataset.section;
                if (section) {
                    this.loadSection(section);
                }
            }
        });
        
        // Mobile navigation toggle
        const navToggle = document.getElementById('nav-toggle');
        const navMenu = document.getElementById('nav-menu');
        
        if (navToggle && navMenu) {
            navToggle.addEventListener('click', () => {
                navToggle.classList.toggle('active');
                navMenu.classList.toggle('active');
            });
        }
        
        // Close mobile menu when clicking outside
        document.addEventListener('click', (e) => {
            if (navMenu && navMenu.classList.contains('active') && 
                !navMenu.contains(e.target) && !navToggle.contains(e.target)) {
                navToggle.classList.remove('active');
                navMenu.classList.remove('active');
            }
        });
        
        // Hero action buttons
        const getStartedBtn = document.getElementById('get-started-btn');
        const explorePollsBtn = document.getElementById('explore-polls-btn');
        const createNewPollBtn = document.getElementById('create-new-poll-btn');
        
        if (getStartedBtn) {
            getStartedBtn.addEventListener('click', () => {
                if (Auth.isAuthenticated) {
                    this.loadSection('create');
                } else {
                    Auth.showRegisterModal();
                }
            });
        }
        
        if (explorePollsBtn) {
            explorePollsBtn.addEventListener('click', () => {
                this.loadSection('polls');
            });
        }
        
        if (createNewPollBtn) {
            createNewPollBtn.addEventListener('click', () => {
                this.loadSection('create');
            });
        }
        
        // Handle browser back/forward
        window.addEventListener('popstate', (e) => {
            const section = this.getSectionFromUrl();
            this.loadSection(section, false);
        });
    }
    
    loadInitialSection() {
        const section = this.getSectionFromUrl();
        this.loadSection(section, false);
    }
    
    getSectionFromUrl() {
        const hash = window.location.hash.slice(1);
        const validSections = ['home', 'polls', 'create', 'my-polls', 'admin'];
        return validSections.includes(hash) ? hash : 'home';
    }
    
    async loadSection(sectionName, updateUrl = true) {
        // Validate section access
        if (!this.canAccessSection(sectionName)) {
            if (['my-polls', 'admin'].includes(sectionName)) {
                Auth.showLoginModal();
                return;
            }
        }
        
        // Update URL
        if (updateUrl) {
            window.history.pushState({}, '', `#${sectionName}`);
        }
        
        // Update navigation
        this.updateNavigation(sectionName);
        
        // Show section
        this.showSection(sectionName);
        
        // Load section content
        await this.loadSectionContent(sectionName);
        
        // Close mobile menu if open
        const navToggle = document.getElementById('nav-toggle');
        const navMenu = document.getElementById('nav-menu');
        if (navToggle && navMenu) {
            navToggle.classList.remove('active');
            navMenu.classList.remove('active');
        }
        
        this.currentSection = sectionName;
    }
    
    canAccessSection(sectionName) {
        switch (sectionName) {
            case 'my-polls':
                return Auth.isAuthenticated;
            case 'admin':
                return Auth.isAuthenticated && Auth.user && Auth.user.role === 'admin';
            default:
                return true;
        }
    }
    
    updateNavigation(sectionName) {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.dataset.section === sectionName) {
                link.classList.add('active');
            }
        });
    }
    
    showSection(sectionName) {
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });
        
        const targetSection = document.getElementById(`${sectionName}-section`);
        if (targetSection) {
            targetSection.classList.add('active');
        }
    }
    
    async loadSectionContent(sectionName) {
        try {
            switch (sectionName) {
                case 'home':
                    await this.loadHomeContent();
                    break;
                case 'polls':
                    await PollManager.loadPolls('polls');
                    break;
                case 'create':
                    this.loadCreateContent();
                    break;
                case 'my-polls':
                    if (Auth.isAuthenticated) {
                        await PollManager.loadPolls('my-polls');
                    }
                    break;
                case 'admin':
                    if (Auth.isAuthenticated && Auth.user.role === 'admin') {
                        await AdminManager.loadAdminDashboard();
                        AdminManager.switchTab('users');
                    }
                    break;
            }
        } catch (error) {
            console.error(`Error loading section ${sectionName}:`, error);
            UI.showNotification(`Failed to load ${sectionName} section`, 'error');
        }
    }
    
    async loadHomeContent() {
        // Load featured polls
        await PollManager.loadFeaturedPolls();
        
        // Update statistics
        await this.loadHomeStatistics();
    }
    
    async loadHomeStatistics() {
        try {
            // In a real implementation, you might have a dedicated endpoint for statistics
            // For now, we'll use the polls endpoint to get some basic stats
            const response = await API.getPolls({ limit: 1 });
            
            if (response.success && response.data.pagination) {
                const totalPolls = response.data.pagination.total;
                const totalPollsElement = document.getElementById('total-polls');
                if (totalPollsElement) {
                    totalPollsElement.textContent = Utils.formatNumber(totalPolls);
                }
            }
            
            // Simulate other statistics (in a real app, these would come from the API)
            const totalVotesElement = document.getElementById('total-votes');
            const activeUsersElement = document.getElementById('active-users');
            
            if (totalVotesElement) {
                // This would be fetched from the API
                totalVotesElement.textContent = Utils.formatNumber(Math.floor(Math.random() * 10000) + 5000);
            }
            
            if (activeUsersElement) {
                // This would be fetched from the API
                activeUsersElement.textContent = Utils.formatNumber(Math.floor(Math.random() * 1000) + 500);
            }
        } catch (error) {
            console.error('Error loading home statistics:', error);
        }
    }
    
    loadCreateContent() {
        // Reset form if it exists
        const createForm = document.getElementById('create-poll-form');
        if (createForm) {
            createForm.reset();
            PollManager.resetPollOptions();
        }
        
        // Set minimum date for end date input
        const endDateInput = document.getElementById('poll-end-date');
        if (endDateInput) {
            const now = new Date();
            now.setMinutes(now.getMinutes() + 30); // Minimum 30 minutes from now
            endDateInput.min = now.toISOString().slice(0, 16);
        }
    }
    
    // Utility methods
    refreshCurrentSection() {
        this.loadSectionContent(this.currentSection);
    }
    
    showNotification(message, type = 'info') {
        UI.showNotification(message, type);
    }
    
    // Error handling
    handleError(error, context = '') {
        console.error(`Error in ${context}:`, error);
        
        let message = 'An unexpected error occurred';
        if (error.message) {
            message = error.message;
        } else if (typeof error === 'string') {
            message = error;
        }
        
        UI.showNotification(message, 'error');
    }
    
    // Service Worker registration for PWA
    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js');
                console.log('Service Worker registered successfully:', registration);
                
                // Listen for updates
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            UI.showNotification('App updated! Refresh to get the latest version.', 'info', 10000);
                        }
                    });
                });
            } catch (error) {
                console.error('Service Worker registration failed:', error);
            }
        }
    }
    
    // Install prompt for PWA
    handleInstallPrompt() {
        let deferredPrompt;
        
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            
            // Show install button or notification
            UI.showNotification('Install VoteHub as an app for better experience!', 'info', 8000);
        });
        
        // Handle install button click (if you add one)
        document.addEventListener('click', async (e) => {
            if (e.target.id === 'install-app-btn' && deferredPrompt) {
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                
                if (outcome === 'accepted') {
                    UI.showNotification('Thanks for installing VoteHub!', 'success');
                }
                
                deferredPrompt = null;
            }
        });
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    window.app = new VotingApp();
    
    // Register service worker for PWA functionality
    if (window.app.registerServiceWorker) {
        window.app.registerServiceWorker();
    }
    
    // Handle install prompt
    if (window.app.handleInstallPrompt) {
        window.app.handleInstallPrompt();
    }
});
