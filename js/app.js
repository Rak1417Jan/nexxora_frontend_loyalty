import { ROUTES } from './config.js';
import { api } from './api.js';

// View Imports
import { renderDashboard } from './components/dashboard.js';
import { renderPlayers } from './components/players.js';
import { renderRules } from './components/rules.js';
import { renderTiers } from './components/tiers.js';
import { renderWallet } from './components/wallet.js';
import { renderAnalytics } from './components/analytics.js';
import { renderRedemption } from './components/redemption.js';
import { renderPromotions } from './components/promotions.js';
import { renderAICampaignGenerator } from './components/ai_campaigns.js';
import { LoginComponent } from './components/login.js';

class App {
    constructor() {
        this.currentView = null;
        this.appContainer = document.getElementById('app-view');
        this.pageTitle = document.getElementById('page-title');
        this.pageSubtitle = document.getElementById('page-subtitle');
        this.navLinks = document.querySelectorAll('.nav-item');

        this.routes = {
            [ROUTES.DASHBOARD]: {
                render: renderDashboard,
                title: 'Dashboard',
                subtitle: 'Overview of program performance'
            },
            [ROUTES.PLAYERS]: {
                render: renderPlayers,
                title: 'Player Management',
                subtitle: 'View and manage player profiles'
            },
            [ROUTES.RULES]: {
                render: renderRules,
                title: 'Reward Rules',
                subtitle: 'Configure loyalty logic and conditions'
            },
            [ROUTES.TIERS]: {
                render: renderTiers,
                title: 'Tiers & Benefits',
                subtitle: 'Manage loyalty levels and perks'
            },
            [ROUTES.WALLET]: {
                render: renderWallet,
                title: 'Wallet Simulator',
                subtitle: 'Test transactions and balance updates'
            },
            [ROUTES.ANALYTICS]: {
                render: renderAnalytics,
                title: 'Analytics',
                subtitle: 'Deep dive into program data'
            },
            [ROUTES.REDEMPTION]: {
                render: renderRedemption,
                title: 'Redemption Rules',
                subtitle: 'Manage point-to-value conversion'
            },
            [ROUTES.PROMOTIONS]: {
                render: renderPromotions,
                title: 'Promotional Engine',
                subtitle: 'Manage time-bound, targeted campaigns'
            },
            'ai-campaigns': {
                render: renderAICampaignGenerator,
                title: '🧠 AI Campaign Generator',
                subtitle: 'One-click campaign creation powered by Google Gemini'
            }
        };

        this.init();
    }

    init() {
        // Handle Logout
        const logoutBtn = document.createElement('li');
        logoutBtn.innerHTML = `
            <a href="#" class="nav-item logout-item" style="color: var(--accent-red)">
                <span class="icon">🚪</span>
                Logout
            </a>
        `;
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.logout();
        });
        document.querySelector('.sidebar-nav ul').appendChild(logoutBtn);

        // Handle Navigation
        window.addEventListener('hashchange', () => this.handleRoute());

        // Initial Route
        this.handleRoute();

        // Check Backend Health
        this.checkHealth();

        // Update User Info in Sidebar
        this.updateSidebarUser();
    }

    updateSidebarUser() {
        const nameEl = document.querySelector('.user-info .name');
        const roleEl = document.querySelector('.user-info .role');
        const avatarEl = document.querySelector('.user-info .avatar');

        if (api.isAuthenticated()) {
            const role = api.role === 'admin' ? 'Super Admin' : 'Player';
            nameEl.textContent = localStorage.getItem('user_identifier') || (api.role === 'admin' ? 'Admin User' : 'Player User');
            roleEl.textContent = role;
            avatarEl.textContent = api.role === 'admin' ? 'A' : 'P';
        }
    }

    logout() {
        api.clearAuth();
        window.location.hash = '#/login';
        window.location.reload();
    }

    async checkHealth() {
        try {
            await api.request('/health');
            const indicator = document.querySelector('.status-indicator');
            if (indicator) {
                indicator.classList.remove('offline');
                indicator.classList.add('online');
                indicator.innerHTML = '<span class="dot"></span> Backend Online';
            }
        } catch (error) {
            const indicator = document.querySelector('.status-indicator');
            if (indicator) {
                indicator.classList.remove('online');
                indicator.classList.add('offline');
                indicator.innerHTML = '<span class="dot"></span> Backend Offline';
            }
        }
    }

    handleRoute() {
        const hash = window.location.hash.slice(1) || '/';

        // Auth Guard
        if (!api.isAuthenticated() && hash !== '/login') {
            window.location.hash = '#/login';
            return;
        }

        if (hash === '/login') {
            document.body.innerHTML = LoginComponent.render();
            LoginComponent.afterRender();
            return;
        }

        // Ensure app shell is present (if we were on login page)
        if (!document.querySelector('.app-container')) {
            window.location.reload();
            return;
        }

        const routeName = hash === '/' ? ROUTES.DASHBOARD : hash.substring(1);
        const routeKey = Object.keys(this.routes).find(key => routeName.startsWith(key));
        const activeRoute = this.routes[routeKey] || this.routes[ROUTES.DASHBOARD];

        this.updateUI(routeKey || ROUTES.DASHBOARD, activeRoute);
        this.renderView(activeRoute);
    }

    updateUI(activeKey, routeConfig) {
        // Update Sidebar
        this.navLinks = document.querySelectorAll('.nav-item');
        this.navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('data-view') === activeKey) {
                link.classList.add('active');
            }
        });

        // Update Header
        if (this.pageTitle) this.pageTitle.textContent = routeConfig.title;
        if (this.pageSubtitle) this.pageSubtitle.textContent = routeConfig.subtitle;
    }

    async renderView(routeConfig) {
        this.appContainer.innerHTML = `
            <div class="loading-state">
                <div class="spinner"></div>
                <p>Loading view...</p>
            </div>
        `;

        try {
            await routeConfig.render(this.appContainer);
        } catch (error) {
            console.error('Render Error:', error);
            this.appContainer.innerHTML = `
                <div class="card" style="border-color: var(--accent-red); color: var(--accent-red);">
                    <h3>Error Loading View</h3>
                    <p>${error.message}</p>
                </div>
            `;
        }
    }
}

// Initialize App
const app = new App();
