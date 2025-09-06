// Authentication Management
class AuthManager {
    constructor() {
        this.token = Utils.storage.get(CONFIG.STORAGE_KEYS.AUTH_TOKEN);
        this.user = Utils.storage.get(CONFIG.STORAGE_KEYS.USER_DATA);
        this.isAuthenticated = !!this.token;
        
        this.init();
    }
    
    init() {
        this.updateUI();
        this.bindEvents();
        
        // Check token validity on page load
        if (this.token) {
            this.validateToken();
        }
    }
    
    bindEvents() {
        // Login form
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }
        
        // Register form
        const registerForm = document.getElementById('register-form');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => this.handleRegister(e));
        }
        
        // Auth buttons
        const loginBtn = document.getElementById('login-btn');
        const registerBtn = document.getElementById('register-btn');
        const logoutBtn = document.getElementById('logout-btn');
        
        if (loginBtn) {
            loginBtn.addEventListener('click', () => this.showLoginModal());
        }
        
        if (registerBtn) {
            registerBtn.addEventListener('click', () => this.showRegisterModal());
        }
        
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }
        
        // Modal switches
        const switchToRegister = document.getElementById('switch-to-register');
        const switchToLogin = document.getElementById('switch-to-login');
        
        if (switchToRegister) {
            switchToRegister.addEventListener('click', (e) => {
                e.preventDefault();
                this.hideLoginModal();
                this.showRegisterModal();
            });
        }
        
        if (switchToLogin) {
            switchToLogin.addEventListener('click', (e) => {
                e.preventDefault();
                this.hideRegisterModal();
                this.showLoginModal();
            });
        }
    }
    
    async handleLogin(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const email = formData.get('email');
        const password = formData.get('password');
        
        if (!email || !password) {
            UI.showNotification('Please fill in all fields', 'error');
            return;
        }
        
        if (!Utils.isValidEmail(email)) {
            UI.showNotification('Please enter a valid email address', 'error');
            return;
        }
        
        try {
            UI.showLoading(e.target);
            
            const response = await API.post('/auth/login', { email, password });
            
            if (response.success) {
                this.setAuth(response.token, response.data.user);
                this.hideLoginModal();
                UI.showNotification(CONFIG.SUCCESS_MESSAGES.LOGIN_SUCCESS, 'success');
                
                // Refresh current section
                if (window.app && window.app.currentSection) {
                    window.app.loadSection(window.app.currentSection);
                }
            }
        } catch (error) {
            UI.showNotification(error.message || 'Login failed', 'error');
        } finally {
            UI.hideLoading(e.target);
        }
    }
    
    async handleRegister(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const username = formData.get('username');
        const email = formData.get('email');
        const password = formData.get('password');
        const confirmPassword = formData.get('confirmPassword');
        
        if (!username || !email || !password || !confirmPassword) {
            UI.showNotification('Please fill in all fields', 'error');
            return;
        }
        
        if (username.length < CONFIG.MIN_USERNAME_LENGTH || username.length > CONFIG.MAX_USERNAME_LENGTH) {
            UI.showNotification(`Username must be between ${CONFIG.MIN_USERNAME_LENGTH} and ${CONFIG.MAX_USERNAME_LENGTH} characters`, 'error');
            return;
        }
        
        if (!Utils.isValidEmail(email)) {
            UI.showNotification('Please enter a valid email address', 'error');
            return;
        }
        
        const passwordValidation = Utils.validatePassword(password);
        if (!passwordValidation.isValid) {
            UI.showNotification(`Password must be at least ${CONFIG.MIN_PASSWORD_LENGTH} characters long`, 'error');
            return;
        }
        
        if (password !== confirmPassword) {
            UI.showNotification('Passwords do not match', 'error');
            return;
        }
        
        try {
            UI.showLoading(e.target);
            
            const response = await API.post('/auth/register', {
                username,
                email,
                password
            });
            
            if (response.success) {
                this.setAuth(response.token, response.data.user);
                this.hideRegisterModal();
                UI.showNotification(CONFIG.SUCCESS_MESSAGES.REGISTER_SUCCESS, 'success');
                
                // Refresh current section
                if (window.app && window.app.currentSection) {
                    window.app.loadSection(window.app.currentSection);
                }
            }
        } catch (error) {
            UI.showNotification(error.message || 'Registration failed', 'error');
        } finally {
            UI.hideLoading(e.target);
        }
    }
    
    async validateToken() {
        try {
            const response = await API.get('/auth/me');
            if (response.success) {
                this.user = response.data.user;
                Utils.storage.set(CONFIG.STORAGE_KEYS.USER_DATA, this.user);
                this.updateUI();
            }
        } catch (error) {
            // Token is invalid, clear auth
            this.clearAuth();
        }
    }
    
    setAuth(token, user) {
        this.token = token;
        this.user = user;
        this.isAuthenticated = true;
        
        Utils.storage.set(CONFIG.STORAGE_KEYS.AUTH_TOKEN, token);
        Utils.storage.set(CONFIG.STORAGE_KEYS.USER_DATA, user);
        
        this.updateUI();
    }
    
    clearAuth() {
        this.token = null;
        this.user = null;
        this.isAuthenticated = false;
        
        Utils.storage.remove(CONFIG.STORAGE_KEYS.AUTH_TOKEN);
        Utils.storage.remove(CONFIG.STORAGE_KEYS.USER_DATA);
        
        this.updateUI();
    }
    
    logout() {
        this.clearAuth();
        UI.showNotification(CONFIG.SUCCESS_MESSAGES.LOGOUT_SUCCESS, 'info');
        
        // Redirect to home if on protected page
        if (window.app && ['my-polls', 'admin'].includes(window.app.currentSection)) {
            window.app.loadSection('home');
        }
    }
    
    updateUI() {
        const authButtons = document.getElementById('auth-buttons');
        const userMenu = document.getElementById('user-menu');
        const userName = document.getElementById('user-name');
        const body = document.body;
        
        if (this.isAuthenticated && this.user) {
            // Show user menu, hide auth buttons
            if (authButtons) authButtons.style.display = 'none';
            if (userMenu) userMenu.style.display = 'block';
            if (userName) userName.textContent = this.user.username;
            
            // Add authentication classes
            body.classList.add('user-authenticated');
            if (this.user.role === 'admin') {
                body.classList.add('user-admin');
            } else {
                body.classList.remove('user-admin');
            }
        } else {
            // Show auth buttons, hide user menu
            if (authButtons) authButtons.style.display = 'flex';
            if (userMenu) userMenu.style.display = 'none';
            
            // Remove authentication classes
            body.classList.remove('user-authenticated', 'user-admin');
        }
    }
    
    showLoginModal() {
        const modal = document.getElementById('login-modal');
        if (modal) {
            modal.classList.add('active');
            const emailInput = document.getElementById('login-email');
            if (emailInput) emailInput.focus();
        }
    }
    
    hideLoginModal() {
        const modal = document.getElementById('login-modal');
        if (modal) {
            modal.classList.remove('active');
            const form = document.getElementById('login-form');
            if (form) form.reset();
        }
    }
    
    showRegisterModal() {
        const modal = document.getElementById('register-modal');
        if (modal) {
            modal.classList.add('active');
            const usernameInput = document.getElementById('register-username');
            if (usernameInput) usernameInput.focus();
        }
    }
    
    hideRegisterModal() {
        const modal = document.getElementById('register-modal');
        if (modal) {
            modal.classList.remove('active');
            const form = document.getElementById('register-form');
            if (form) form.reset();
        }
    }
    
    getAuthHeaders() {
        return this.token ? { Authorization: `Bearer ${this.token}` } : {};
    }
    
    requireAuth() {
        if (!this.isAuthenticated) {
            this.showLoginModal();
            return false;
        }
        return true;
    }
    
    requireAdmin() {
        if (!this.isAuthenticated) {
            this.showLoginModal();
            return false;
        }
        
        if (this.user.role !== 'admin') {
            UI.showNotification('Admin access required', 'error');
            return false;
        }
        
        return true;
    }
}

// Initialize auth manager
window.Auth = new AuthManager();
