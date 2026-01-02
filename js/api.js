import { CONFIG } from './config.js';

class ApiClient {
    constructor() {
        this.baseUrl = CONFIG.API_BASE_URL;
        this.token = localStorage.getItem('auth_token');
        this.role = localStorage.getItem('user_role');
    }

    setAuth(token, role) {
        this.token = token;
        this.role = role;
        localStorage.setItem('auth_token', token);
        localStorage.setItem('user_role', role);
    }

    clearAuth() {
        this.token = null;
        this.role = null;
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_role');
    }

    isAuthenticated() {
        return !!this.token;
    }

    async login(identifier, password, type = 'admin') {
        const endpoint = type === 'admin' ? '/api/auth/login/admin' : '/api/auth/login/user';
        const body = type === 'admin'
            ? { username: identifier, password }
            : { player_id: identifier, password };

        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Login failed');
        }

        const data = await response.json();
        this.setAuth(data.access_token, data.role);
        return data;
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        try {
            const response = await fetch(url, { ...options, headers });

            if (response.status === 401) {
                this.clearAuth();
                window.location.hash = '#/login';
                throw new Error('Session expired. Please login again.');
            }

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || `API Error: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`API Request Failed: ${endpoint}`, error);
            throw error;
        }
    }

    // Players (Admin)
    async getPlayers(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.request(`/api/admin/players?${queryString}`);
    }

    async getPlayer(playerId) {
        return this.request(`/api/admin/players/${playerId}`);
    }

    async createPlayer(playerData) {
        return this.request('/api/admin/players', {
            method: 'POST',
            body: JSON.stringify(playerData)
        });
    }

    async updatePlayer(playerId, updateData) {
        return this.request(`/api/admin/players/${playerId}`, {
            method: 'PUT',
            body: JSON.stringify(updateData)
        });
    }

    async importPlayers(file) {
        const formData = new FormData();
        formData.append('file', file);

        const url = `${this.baseUrl}/api/admin/import/excel`;
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                },
                body: formData
            });

            if (response.status === 401) {
                this.clearAuth();
                window.location.hash = '#/login';
                throw new Error('Session expired');
            }

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || `Import failed: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Import Failed:', error);
            throw error;
        }
    }

    // Rules (Admin)
    async getRules(activeOnly = false) {
        const queryString = activeOnly ? '?is_active=true' : '';
        return this.request(`/api/admin/rules${queryString}`);
    }

    async getRule(ruleId) {
        return this.request(`/api/admin/rules/${ruleId}`);
    }

    async createRule(ruleData) {
        return this.request('/api/admin/rules', {
            method: 'POST',
            body: JSON.stringify(ruleData)
        });
    }

    async updateRule(ruleId, updateData) {
        return this.request(`/api/admin/rules/${ruleId}`, {
            method: 'PUT',
            body: JSON.stringify(updateData)
        });
    }

    // Tiers (Admin)
    async getTiers() {
        return this.request('/api/admin/tiers');
    }

    async createTier(tierData) {
        return this.request('/api/admin/tiers', {
            method: 'POST',
            body: JSON.stringify(tierData)
        });
    }

    // Wallet Operations (Admin)
    async addLoyaltyPoints(data) {
        return this.request('/api/admin/wallet/add-lp', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async addBonus(data) {
        return this.request('/api/admin/wallet/add-bonus', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async getTransactions(playerId) {
        return this.request(`/api/admin/analytics/transactions?player_id=${playerId}`);
    }

    // Analytics (Admin)
    async getDashboardMetrics() {
        return this.request('/api/admin/analytics/dashboard');
    }

    async getRewardHistory(status = '') {
        const queryString = status ? `?status=${status}` : '';
        return this.request(`/api/admin/analytics/rewards${queryString}`);
    }

    // Player Actions & Redemption (Admin levels)
    async completeKYC(playerId) {
        return this.request('/api/admin/actions/kyc', {
            method: 'POST',
            body: JSON.stringify({ player_id: playerId })
        });
    }

    async updateProfileDepth(playerId, depth) {
        return this.request('/api/admin/actions/profile-depth', {
            method: 'POST',
            body: JSON.stringify({ player_id: playerId, depth_percentage: depth })
        });
    }

    async getRedemptionRules() {
        return this.request('/api/admin/redemption/rules');
    }

    async createRedemptionRule(ruleData) {
        return this.request('/api/admin/redemption/rules', {
            method: 'POST',
            body: JSON.stringify(ruleData)
        });
    }

    async redeemPoints(data) {
        // Use user endpoint if role is player
        const endpoint = this.role === 'player' ? '/api/v1/user/redeem' : '/api/admin/redemption/redeem';
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async runExpiryJob() {
        return this.request('/api/admin/cron/expire-points', {
            method: 'POST'
        });
    }

    // User/Player specific endpoints
    async getUserProfile() {
        return this.request('/api/v1/user/profile');
    }

    async getUserBalances() {
        return this.request('/api/v1/user/balances');
    }

    async getUserTransactions(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.request(`/api/v1/user/transactions?${queryString}`);
    }
}

export const api = new ApiClient();
