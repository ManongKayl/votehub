// Admin Management
class AdminManager {
    constructor() {
        this.currentTab = 'users';
        this.currentPage = { users: 1, polls: 1 };
        this.currentFilters = { users: {}, polls: {} };
        
        this.init();
    }
    
    init() {
        this.bindEvents();
    }
    
    bindEvents() {
        // Tab switching
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('tab-btn')) {
                const tab = e.target.dataset.tab;
                if (tab) {
                    this.switchTab(tab);
                }
            }
        });
        
        // Admin actions
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('admin-action-btn')) {
                const action = e.target.dataset.action;
                const targetId = e.target.dataset.targetId;
                const targetType = e.target.dataset.targetType;
                
                this.handleAdminAction(action, targetType, targetId, e.target);
            }
        });
    }
    
    async loadAdminDashboard() {
        if (!Auth.requireAdmin()) return;
        
        try {
            const response = await API.getAdminDashboard();
            
            if (response.success) {
                this.renderDashboardStats(response.data.statistics);
                this.renderRecentActivity(response.data.recentActivity);
                this.renderPopularPolls(response.data.popularPolls);
                this.renderCategoryStats(response.data.categoryStats);
            }
        } catch (error) {
            UI.showNotification(error.message || 'Failed to load dashboard', 'error');
        }
    }
    
    renderDashboardStats(stats) {
        const container = document.getElementById('dashboard-stats');
        if (!container) return;
        
        container.innerHTML = `
            <div class="dashboard-stat">
                <div class="stat-icon">
                    <i class="fas fa-users"></i>
                </div>
                <div class="stat-value">${Utils.formatNumber(stats.totalUsers)}</div>
                <div class="stat-label">Total Users</div>
            </div>
            
            <div class="dashboard-stat success">
                <div class="stat-icon">
                    <i class="fas fa-poll"></i>
                </div>
                <div class="stat-value">${Utils.formatNumber(stats.totalPolls)}</div>
                <div class="stat-label">Total Polls</div>
            </div>
            
            <div class="dashboard-stat info">
                <div class="stat-icon">
                    <i class="fas fa-vote-yea"></i>
                </div>
                <div class="stat-value">${Utils.formatNumber(stats.totalVotes)}</div>
                <div class="stat-label">Total Votes</div>
            </div>
            
            <div class="dashboard-stat warning">
                <div class="stat-icon">
                    <i class="fas fa-chart-line"></i>
                </div>
                <div class="stat-value">${Utils.formatNumber(stats.activePolls)}</div>
                <div class="stat-label">Active Polls</div>
            </div>
        `;
    }
    
    renderRecentActivity(activity) {
        // This would render recent polls and users in the dashboard
        // Implementation depends on the specific dashboard layout
    }
    
    renderPopularPolls(polls) {
        // This would render popular polls in the dashboard
        // Implementation depends on the specific dashboard layout
    }
    
    renderCategoryStats(stats) {
        // This would render category statistics chart
        // Implementation depends on the specific dashboard layout
    }
    
    switchTab(tab) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
        
        // Update tab panes
        document.querySelectorAll('.tab-pane').forEach(pane => {
            pane.classList.remove('active');
        });
        document.getElementById(`${tab}-tab`).classList.add('active');
        
        this.currentTab = tab;
        
        // Load tab content
        switch (tab) {
            case 'users':
                this.loadUsers();
                break;
            case 'polls':
                this.loadAdminPolls();
                break;
            case 'analytics':
                this.loadAnalytics();
                break;
        }
    }
    
    async loadUsers(page = 1) {
        if (!Auth.requireAdmin()) return;
        
        const container = document.getElementById('users-tab');
        if (!container) return;
        
        try {
            UI.createSkeletonLoader(container, 'table');
            
            const params = {
                page,
                limit: 20,
                ...this.currentFilters.users
            };
            
            const response = await API.getAdminUsers(params);
            
            if (response.success) {
                this.renderUsersTable(container, response.data.users, response.data.pagination);
                this.currentPage.users = page;
            }
        } catch (error) {
            UI.createEmptyState(
                container,
                'fas fa-exclamation-triangle',
                'Error Loading Users',
                error.message || 'Failed to load users',
                'Retry',
                () => this.loadUsers(page)
            );
        }
    }
    
    renderUsersTable(container, users, pagination) {
        container.innerHTML = `
            <div class="admin-section-header">
                <h3>User Management</h3>
                <div class="admin-filters">
                    <input type="text" id="users-search" placeholder="Search users..." class="search-input">
                    <select id="users-status-filter">
                        <option value="">All Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>
                </div>
            </div>
            
            <div class="data-table">
                <table>
                    <thead>
                        <tr>
                            <th>Username</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Status</th>
                            <th>Created</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${users.map(user => `
                            <tr>
                                <td>${Utils.sanitizeHtml(user.username)}</td>
                                <td>${Utils.sanitizeHtml(user.email)}</td>
                                <td>
                                    <select class="role-select" data-user-id="${user._id}" data-current-role="${user.role}">
                                        <option value="user" ${user.role === 'user' ? 'selected' : ''}>User</option>
                                        <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option>
                                    </select>
                                </td>
                                <td>
                                    <span class="status-badge ${user.isActive ? 'active' : 'inactive'}">
                                        ${user.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td>${Utils.formatDate(user.createdAt)}</td>
                                <td>
                                    <div class="action-buttons">
                                        <button class="btn btn-small admin-action-btn ${user.isActive ? 'btn-warning' : 'btn-success'}" 
                                                data-action="${user.isActive ? 'deactivate' : 'activate'}" 
                                                data-target-type="user" 
                                                data-target-id="${user._id}">
                                            ${user.isActive ? 'Deactivate' : 'Activate'}
                                        </button>
                                        <button class="btn btn-small btn-error admin-action-btn" 
                                                data-action="delete" 
                                                data-target-type="user" 
                                                data-target-id="${user._id}">
                                            Delete
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            
            <div class="pagination-container" id="users-pagination"></div>
        `;
        
        // Bind events
        this.bindUserTableEvents();
        
        // Create pagination
        const paginationContainer = container.querySelector('#users-pagination');
        if (paginationContainer && pagination) {
            UI.createPagination(
                paginationContainer,
                pagination.current,
                pagination.pages,
                (newPage) => this.loadUsers(newPage)
            );
        }
    }
    
    bindUserTableEvents() {
        // Search
        const searchInput = document.getElementById('users-search');
        if (searchInput) {
            searchInput.addEventListener('input', Utils.debounce(() => {
                this.currentFilters.users.search = searchInput.value.trim();
                this.loadUsers(1);
            }, CONFIG.DEBOUNCE_DELAY));
        }
        
        // Status filter
        const statusFilter = document.getElementById('users-status-filter');
        if (statusFilter) {
            statusFilter.addEventListener('change', () => {
                this.currentFilters.users.status = statusFilter.value;
                this.loadUsers(1);
            });
        }
        
        // Role changes
        document.querySelectorAll('.role-select').forEach(select => {
            select.addEventListener('change', async (e) => {
                const userId = e.target.dataset.userId;
                const currentRole = e.target.dataset.currentRole;
                const newRole = e.target.value;
                
                if (newRole !== currentRole) {
                    await this.updateUserRole(userId, newRole, e.target);
                }
            });
        });
    }
    
    async loadAdminPolls(page = 1) {
        if (!Auth.requireAdmin()) return;
        
        const container = document.getElementById('polls-tab');
        if (!container) return;
        
        try {
            UI.createSkeletonLoader(container, 'table');
            
            const params = {
                page,
                limit: 20,
                ...this.currentFilters.polls
            };
            
            const response = await API.getAdminPolls(params);
            
            if (response.success) {
                this.renderPollsTable(container, response.data.polls, response.data.pagination);
                this.currentPage.polls = page;
            }
        } catch (error) {
            UI.createEmptyState(
                container,
                'fas fa-exclamation-triangle',
                'Error Loading Polls',
                error.message || 'Failed to load polls',
                'Retry',
                () => this.loadAdminPolls(page)
            );
        }
    }
    
    renderPollsTable(container, polls, pagination) {
        container.innerHTML = `
            <div class="admin-section-header">
                <h3>Poll Management</h3>
                <div class="admin-filters">
                    <input type="text" id="polls-search" placeholder="Search polls..." class="search-input">
                    <select id="polls-status-filter">
                        <option value="">All Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>
                    <select id="polls-category-filter">
                        <option value="">All Categories</option>
                        ${CONFIG.POLL_CATEGORIES.map(cat => 
                            `<option value="${cat.value}">${cat.label}</option>`
                        ).join('')}
                    </select>
                </div>
            </div>
            
            <div class="data-table">
                <table>
                    <thead>
                        <tr>
                            <th>Title</th>
                            <th>Creator</th>
                            <th>Category</th>
                            <th>Votes</th>
                            <th>Status</th>
                            <th>Created</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${polls.map(poll => `
                            <tr>
                                <td>
                                    <div class="poll-title-cell">
                                        <strong>${Utils.sanitizeHtml(poll.title)}</strong>
                                        ${!poll.isPublic ? '<span class="badge">Private</span>' : ''}
                                    </div>
                                </td>
                                <td>${Utils.sanitizeHtml(poll.creator.username)}</td>
                                <td>
                                    <span class="category-badge">${poll.category || 'General'}</span>
                                </td>
                                <td>${Utils.formatNumber(poll.totalVotes || 0)}</td>
                                <td>
                                    <span class="status-badge ${poll.isActive ? 'active' : 'inactive'}">
                                        ${poll.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td>${Utils.formatDate(poll.createdAt)}</td>
                                <td>
                                    <div class="action-buttons">
                                        <button class="btn btn-small btn-outline" 
                                                onclick="PollManager.showPollDetail('${poll._id}')">
                                            View
                                        </button>
                                        <button class="btn btn-small admin-action-btn ${poll.isActive ? 'btn-warning' : 'btn-success'}" 
                                                data-action="${poll.isActive ? 'deactivate' : 'activate'}" 
                                                data-target-type="poll" 
                                                data-target-id="${poll._id}">
                                            ${poll.isActive ? 'Deactivate' : 'Activate'}
                                        </button>
                                        <button class="btn btn-small btn-error admin-action-btn" 
                                                data-action="delete" 
                                                data-target-type="poll" 
                                                data-target-id="${poll._id}">
                                            Delete
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            
            <div class="pagination-container" id="polls-pagination"></div>
        `;
        
        // Bind events
        this.bindPollTableEvents();
        
        // Create pagination
        const paginationContainer = container.querySelector('#polls-pagination');
        if (paginationContainer && pagination) {
            UI.createPagination(
                paginationContainer,
                pagination.current,
                pagination.pages,
                (newPage) => this.loadAdminPolls(newPage)
            );
        }
    }
    
    bindPollTableEvents() {
        // Search
        const searchInput = document.getElementById('polls-search');
        if (searchInput) {
            searchInput.addEventListener('input', Utils.debounce(() => {
                this.currentFilters.polls.search = searchInput.value.trim();
                this.loadAdminPolls(1);
            }, CONFIG.DEBOUNCE_DELAY));
        }
        
        // Status filter
        const statusFilter = document.getElementById('polls-status-filter');
        if (statusFilter) {
            statusFilter.addEventListener('change', () => {
                this.currentFilters.polls.status = statusFilter.value;
                this.loadAdminPolls(1);
            });
        }
        
        // Category filter
        const categoryFilter = document.getElementById('polls-category-filter');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', () => {
                this.currentFilters.polls.category = categoryFilter.value;
                this.loadAdminPolls(1);
            });
        }
    }
    
    async loadAnalytics() {
        if (!Auth.requireAdmin()) return;
        
        const container = document.getElementById('analytics-tab');
        if (!container) return;
        
        try {
            container.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Loading analytics...</div>';
            
            const response = await API.getAnalytics({ period: '7d' });
            
            if (response.success) {
                this.renderAnalytics(container, response.data);
            }
        } catch (error) {
            UI.createEmptyState(
                container,
                'fas fa-chart-bar',
                'Error Loading Analytics',
                error.message || 'Failed to load analytics',
                'Retry',
                () => this.loadAnalytics()
            );
        }
    }
    
    renderAnalytics(container, data) {
        container.innerHTML = `
            <div class="analytics-section">
                <h3>Analytics Dashboard</h3>
                
                <div class="analytics-period">
                    <label>Time Period:</label>
                    <select id="analytics-period">
                        <option value="24h">Last 24 Hours</option>
                        <option value="7d" selected>Last 7 Days</option>
                        <option value="30d">Last 30 Days</option>
                    </select>
                </div>
                
                <div class="analytics-charts">
                    <div class="chart-container">
                        <h4 class="chart-title">User Registrations</h4>
                        <div class="chart-wrapper">
                            <canvas id="user-registrations-chart"></canvas>
                        </div>
                    </div>
                    
                    <div class="chart-container">
                        <h4 class="chart-title">Poll Creations</h4>
                        <div class="chart-wrapper">
                            <canvas id="poll-creations-chart"></canvas>
                        </div>
                    </div>
                    
                    <div class="chart-container">
                        <h4 class="chart-title">Voting Activity</h4>
                        <div class="chart-wrapper">
                            <canvas id="voting-activity-chart"></canvas>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Create charts
        this.createAnalyticsCharts(data);
        
        // Bind period change
        const periodSelect = document.getElementById('analytics-period');
        if (periodSelect) {
            periodSelect.addEventListener('change', async () => {
                const period = periodSelect.value;
                try {
                    const response = await API.getAnalytics({ period });
                    if (response.success) {
                        this.createAnalyticsCharts(response.data);
                    }
                } catch (error) {
                    UI.showNotification('Failed to load analytics', 'error');
                }
            });
        }
    }
    
    createAnalyticsCharts(data) {
        // User Registrations Chart
        const userCtx = document.getElementById('user-registrations-chart');
        if (userCtx) {
            new Chart(userCtx, {
                type: 'line',
                data: {
                    labels: data.userRegistrations.map(item => item._id),
                    datasets: [{
                        label: 'User Registrations',
                        data: data.userRegistrations.map(item => item.count),
                        borderColor: CONFIG.CHART_COLORS[0],
                        backgroundColor: CONFIG.CHART_COLORS[0] + '20',
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    }
                }
            });
        }
        
        // Poll Creations Chart
        const pollCtx = document.getElementById('poll-creations-chart');
        if (pollCtx) {
            new Chart(pollCtx, {
                type: 'bar',
                data: {
                    labels: data.pollCreations.map(item => item._id),
                    datasets: [{
                        label: 'Poll Creations',
                        data: data.pollCreations.map(item => item.count),
                        backgroundColor: CONFIG.CHART_COLORS[1]
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    }
                }
            });
        }
        
        // Voting Activity Chart
        const voteCtx = document.getElementById('voting-activity-chart');
        if (voteCtx) {
            new Chart(voteCtx, {
                type: 'line',
                data: {
                    labels: data.votingActivity.map(item => item._id),
                    datasets: [{
                        label: 'Votes Cast',
                        data: data.votingActivity.map(item => item.count),
                        borderColor: CONFIG.CHART_COLORS[2],
                        backgroundColor: CONFIG.CHART_COLORS[2] + '20',
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    }
                }
            });
        }
    }
    
    async handleAdminAction(action, targetType, targetId, button) {
        if (!Auth.requireAdmin()) return;
        
        const actionMap = {
            activate: { method: 'activate', confirmTitle: 'Activate', confirmMessage: 'activate' },
            deactivate: { method: 'deactivate', confirmTitle: 'Deactivate', confirmMessage: 'deactivate' },
            delete: { method: 'delete', confirmTitle: 'Delete', confirmMessage: 'delete' }
        };
        
        const actionConfig = actionMap[action];
        if (!actionConfig) return;
        
        const itemType = targetType === 'user' ? 'user' : 'poll';
        
        UI.showConfirmDialog(
            `${actionConfig.confirmTitle} ${itemType}`,
            `Are you sure you want to ${actionConfig.confirmMessage} this ${itemType}?`,
            async () => {
                try {
                    UI.showLoading(button);
                    
                    let response;
                    if (targetType === 'user') {
                        if (action === 'delete') {
                            response = await API.deleteUser(targetId);
                        } else {
                            response = await API.updateUser(targetId, {
                                isActive: action === 'activate'
                            });
                        }
                    } else {
                        if (action === 'delete') {
                            response = await API.deletePollAdmin(targetId);
                        } else {
                            response = await API.updatePollAdmin(targetId, {
                                isActive: action === 'activate'
                            });
                        }
                    }
                    
                    if (response.success) {
                        UI.showNotification(`${itemType} ${actionConfig.confirmMessage}d successfully`, 'success');
                        
                        // Reload current tab
                        if (targetType === 'user') {
                            this.loadUsers(this.currentPage.users);
                        } else {
                            this.loadAdminPolls(this.currentPage.polls);
                        }
                    }
                } catch (error) {
                    UI.showNotification(error.message || `Failed to ${actionConfig.confirmMessage} ${itemType}`, 'error');
                } finally {
                    UI.hideLoading(button);
                }
            }
        );
    }
    
    async updateUserRole(userId, newRole, selectElement) {
        try {
            const response = await API.updateUser(userId, { role: newRole });
            
            if (response.success) {
                UI.showNotification('User role updated successfully', 'success');
                selectElement.dataset.currentRole = newRole;
            }
        } catch (error) {
            UI.showNotification(error.message || 'Failed to update user role', 'error');
            // Revert select value
            selectElement.value = selectElement.dataset.currentRole;
        }
    }
}

// Initialize admin manager
window.AdminManager = new AdminManager();
