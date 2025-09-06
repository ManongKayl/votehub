// API Management
class APIManager {
    constructor() {
        this.baseURL = CONFIG.API_BASE_URL;
        this.defaultHeaders = {
            'Content-Type': 'application/json'
        };
    }
    
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: {
                ...this.defaultHeaders,
                ...options.headers,
                ...(window.Auth ? window.Auth.getAuthHeaders() : {})
            },
            ...options
        };
        
        try {
            const response = await fetch(url, config);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || this.getErrorMessage(response.status));
            }
            
            return data;
        } catch (error) {
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                throw new Error(CONFIG.ERROR_MESSAGES.NETWORK_ERROR);
            }
            throw error;
        }
    }
    
    async get(endpoint, params = {}) {
        const url = new URL(`${this.baseURL}${endpoint}`);
        Object.keys(params).forEach(key => {
            if (params[key] !== null && params[key] !== undefined) {
                url.searchParams.append(key, params[key]);
            }
        });
        
        return this.request(url.pathname + url.search, {
            method: 'GET'
        });
    }
    
    async post(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }
    
    async patch(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'PATCH',
            body: JSON.stringify(data)
        });
    }
    
    async delete(endpoint) {
        return this.request(endpoint, {
            method: 'DELETE'
        });
    }
    
    getErrorMessage(status) {
        switch (status) {
            case 401:
                return CONFIG.ERROR_MESSAGES.UNAUTHORIZED;
            case 403:
                return CONFIG.ERROR_MESSAGES.FORBIDDEN;
            case 404:
                return CONFIG.ERROR_MESSAGES.NOT_FOUND;
            case 422:
                return CONFIG.ERROR_MESSAGES.VALIDATION_ERROR;
            case 500:
                return CONFIG.ERROR_MESSAGES.SERVER_ERROR;
            default:
                return CONFIG.ERROR_MESSAGES.SERVER_ERROR;
        }
    }
    
    // Auth endpoints
    async login(credentials) {
        return this.post('/auth/login', credentials);
    }
    
    async register(userData) {
        return this.post('/auth/register', userData);
    }
    
    async getCurrentUser() {
        return this.get('/auth/me');
    }
    
    async updateProfile(data) {
        return this.patch('/auth/updateMe', data);
    }
    
    async updatePassword(data) {
        return this.patch('/auth/updatePassword', data);
    }
    
    // Poll endpoints
    async getPolls(params = {}) {
        return this.get('/polls', params);
    }
    
    async getPoll(id) {
        return this.get(`/polls/${id}`);
    }
    
    async createPoll(pollData) {
        return this.post('/polls', pollData);
    }
    
    async updatePoll(id, data) {
        return this.patch(`/polls/${id}`, data);
    }
    
    async deletePoll(id) {
        return this.delete(`/polls/${id}`);
    }
    
    async getMyPolls(params = {}) {
        return this.get('/polls/user/my-polls', params);
    }
    
    // Vote endpoints
    async castVote(voteData) {
        return this.post('/votes', voteData);
    }
    
    async getMyVotes(params = {}) {
        return this.get('/votes/my-votes', params);
    }
    
    async getPollVotes(pollId, params = {}) {
        return this.get(`/votes/poll/${pollId}`, params);
    }
    
    async deleteVote(voteId) {
        return this.delete(`/votes/${voteId}`);
    }
    
    // Admin endpoints
    async getAdminDashboard() {
        return this.get('/admin/dashboard');
    }
    
    async getAdminUsers(params = {}) {
        return this.get('/admin/users', params);
    }
    
    async getAdminPolls(params = {}) {
        return this.get('/admin/polls', params);
    }
    
    async updateUser(id, data) {
        return this.patch(`/admin/users/${id}`, data);
    }
    
    async deleteUser(id) {
        return this.delete(`/admin/users/${id}`);
    }
    
    async updatePollAdmin(id, data) {
        return this.patch(`/admin/polls/${id}`, data);
    }
    
    async deletePollAdmin(id) {
        return this.delete(`/admin/polls/${id}`);
    }
    
    async getAnalytics(params = {}) {
        return this.get('/admin/analytics', params);
    }
}

// Initialize API manager
window.API = new APIManager();
