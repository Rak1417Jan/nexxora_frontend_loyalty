import { api } from '../api.js';

export const LoginComponent = {
    render: () => {
        return `
            <div class="login-container">
                <div class="login-card">
                    <div class="login-header">
                        <div class="logo">
                            <span class="logo-icon">✨</span>
                            <span class="logo-text">Loyalty<span class="highlight">Pro</span></span>
                        </div>
                        <h2>Welcome Back</h2>
                        <p>Login to access your dashboard</p>
                    </div>

                    <div class="login-tabs">
                        <button class="tab-btn active" data-type="admin">Operator Login</button>
                        <button class="tab-btn" data-type="player">Player Login</button>
                    </div>

                    <form id="login-form" class="login-form">
                        <div class="form-group">
                            <label for="identifier" id="identifier-label">Username</label>
                            <input type="text" id="identifier" name="identifier" required placeholder="Enter your username">
                        </div>
                        <div class="form-group">
                            <label for="password">Password</label>
                            <input type="password" id="password" name="password" required placeholder="••••••••">
                        </div>
                        <div id="login-error" class="error-message hidden"></div>
                        <button type="submit" class="btn btn-primary btn-block">
                            Login
                            <span class="btn-spinner hidden"></span>
                        </button>
                    </form>

                    <div class="login-footer">
                        <p>Sample Admin: <code>admin</code> / <code>AdminPassword123</code></p>
                        <p>Sample Player: <code>test_player</code> / <code>PlayerPassword123</code></p>
                    </div>
                </div>
            </div>
        `;
    },

    afterRender: () => {
        const form = document.querySelector('#login-form');
        const tabs = document.querySelectorAll('.tab-btn');
        const identifierLabel = document.querySelector('#identifier-label');
        const identifierInput = document.querySelector('#identifier');
        const errorMsg = document.querySelector('#login-error');
        const submitBtn = form.querySelector('button[type="submit"]');
        const spinner = submitBtn.querySelector('.btn-spinner');

        let loginType = 'admin';

        // Tab switching logic
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                loginType = tab.dataset.type;

                if (loginType === 'admin') {
                    identifierLabel.textContent = 'Username';
                    identifierInput.placeholder = 'Enter your username';
                } else {
                    identifierLabel.textContent = 'Player ID';
                    identifierInput.placeholder = 'Enter your player ID';
                }
                errorMsg.classList.add('hidden');
            });
        });

        // Form submission logic
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const identifier = form.identifier.value;
            const password = form.password.value;

            errorMsg.classList.add('hidden');
            submitBtn.disabled = true;
            spinner.classList.remove('hidden');

            try {
                await api.login(identifier, password, loginType);
                localStorage.setItem('user_identifier', identifier);
                // Redirect on success
                window.location.hash = '#/';
                window.location.reload(); // Refresh to update app state
            } catch (error) {
                console.error('Login Failed', error);
                errorMsg.textContent = error.message;
                errorMsg.classList.remove('hidden');
                submitBtn.disabled = false;
                spinner.classList.add('hidden');
            }
        });
    }
};
