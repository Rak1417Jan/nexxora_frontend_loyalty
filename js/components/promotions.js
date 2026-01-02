import { api } from '../api.js';

export async function renderPromotions(container) {
    const isPlayer = api.role === 'player';

    if (isPlayer) {
        await renderPlayerPromotions(container);
    } else {
        await renderAdminPromotions(container);
    }
}

async function renderAdminPromotions(container) {
    container.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h3>Active Promotions</h3>
                <button id="add-promo-btn" class="btn btn-primary">+ Create Promotion</button>
            </div>
            <div class="table-container">
                <table class="data-table" id="promotions-table">
                    <thead>
                        <tr>
                            <th>Promotion</th>
                            <th>Status</th>
                            <th>Rules (Trigger → Reward)</th>
                            <th>Audience</th>
                            <th>Budget / Performance</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr><td colspan="6" style="text-align: center">Loading promotions...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;

    try {
        const promotions = await api.request('/api/v1/promotions/admin/all');
        const tbody = container.querySelector('#promotions-table tbody');

        if (promotions.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center">No promotions found. Create your first campaign!</td></tr>';
        } else {
            tbody.innerHTML = promotions.map(promo => {
                const trigger = promo.trigger_config;
                const reward = promo.reward_config;
                const audience = promo.audience_filters;

                return `
                    <tr>
                        <td>
                            <strong>${promo.name}</strong><br>
                            <small class="text-muted">${promo.promo_id}</small>
                        </td>
                        <td>
                            <span class="badge badge-${promo.status.toLowerCase()}">${promo.status}</span>
                        </td>
                        <td>
                            <div class="rule-summary">
                                <div><small><strong>Trigger:</strong> ${trigger.type} (${trigger.min_amount ? 'min $' + trigger.min_amount : 'any'})</small></div>
                                <div><small><strong>Reward:</strong> ${reward.type} (${reward.formula || reward.amount})</small></div>
                            </div>
                        </td>
                        <td>
                            ${Object.entries(audience).map(([k, v]) => `<span class="tag">${k}: ${v}</span>`).join(' ')}
                        </td>
                        <td>
                            <div class="budget-info">
                                <div class="progress-bar-container" style="height: 6px; margin-bottom: 4px;">
                                    <div class="progress-bar" style="width: ${promo.total_budget ? (promo.spent_budget / promo.total_budget * 100) : 0}%"></div>
                                </div>
                                <small>${promo.spent_budget.toFixed(2)} / ${promo.total_budget || '∞'}</small>
                            </div>
                        </td>
                        <td>
                            <div class="btn-group">
                                <button class="btn btn-sm btn-icon edit-promo" data-id="${promo.promo_id}" title="Edit">edit</button>
                                <button class="btn btn-sm btn-icon btn-outline-red delete-promo" data-id="${promo.promo_id}" title="Delete">delete</button>
                            </div>
                        </td>
                    </tr>
                `;
            }).join('');

            // Add Delete Events
            tbody.querySelectorAll('.delete-promo').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const id = btn.getAttribute('data-id');
                    if (confirm(`Are you sure you want to delete promotion ${id}?`)) {
                        await api.request(`/api/v1/promotions/${id}`, { method: 'DELETE' });
                        renderAdminPromotions(container);
                    }
                });
            });
        }
    } catch (error) {
        container.innerHTML += `<div class="alert alert-error">Error loading promotions: ${error.message}</div>`;
    }


    // Wizard Modal Logic
    const wizardModal = document.createElement('div');
    wizardModal.className = 'modal-backdrop';
    wizardModal.style.display = 'none';
    wizardModal.innerHTML = `
        <div class="modal-content" style="max-width: 600px;">
            <div class="modal-header">
                <h3>Create New Promotion</h3>
                <button class="close-modal">&times;</button>
            </div>
            <div class="modal-body">
                <form id="promo-wizard-form">
                    <div class="form-section">
                        <h4>1. Basic Information</h4>
                        <div class="form-group">
                            <label>Promotion ID</label>
                            <input type="text" name="promo_id" required placeholder="e.g. SUMMER_2024">
                        </div>
                        <div class="form-group">
                            <label>Name</label>
                            <input type="text" name="name" required placeholder="Summer Deposit Bonus">
                        </div>
                        <div class="form-group">
                            <label>Description</label>
                            <textarea name="description" rows="2"></textarea>
                        </div>
                    </div>

                    <div class="form-section">
                        <h4>2. Targeting & Timing</h4>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Target Segment</label>
                                <select name="segment">
                                    <option value="NEW">New Players</option>
                                    <option value="ACTIVE">Active</option>
                                    <option value="CHURNED">Churned</option>
                                    <option value="VIP">VIP</option>
                                    <option value="ALL">All Players</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Total Budget</label>
                                <input type="number" name="total_budget" placeholder="10000">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Start Date</label>
                                <input type="datetime-local" name="start_at" required>
                            </div>
                            <div class="form-group">
                                <label>End Date</label>
                                <input type="datetime-local" name="end_at" required>
                            </div>
                        </div>
                    </div>

                    <div class="form-section">
                        <h4>3. Rules</h4>
                        <div class="form-group">
                            <label>Trigger Event</label>
                            <select name="trigger_type" id="trigger-type-select">
                                <option value="DEPOSIT">Deposit</option>
                                <option value="WAGER">Wager</option>
                                <option value="LOGIN">Login</option>
                            </select>
                        </div>
                        <div class="form-group" id="trigger-condition-group">
                            <label>Min Amount</label>
                            <input type="number" name="trigger_min_amount" value="50">
                        </div>
                        <div class="form-group">
                            <label>Reward Type</label>
                            <select name="reward_type">
                                <option value="BONUS_BALANCE">Bonus Balance</option>
                                <option value="LOYALTY_POINTS">Loyalty Points</option>
                                <option value="CASH">Cash</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Reward Amount/Formula</label>
                            <div class="input-group">
                                <select name="reward_calc_type" style="width: 120px;">
                                    <option value="FIXED">Fixed Amount</option>
                                    <option value="PERCENTAGE">% of Trigger</option>
                                </select>
                                <input type="number" name="reward_value" required placeholder="Value (e.g. 10)">
                            </div>
                        </div>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary close-modal">Cancel</button>
                <button class="btn btn-primary" id="save-promo-btn">Create Promotion</button>
            </div>
        </div>
    `;
    container.appendChild(wizardModal);

    const closeModal = () => {
        wizardModal.style.display = 'none';
        wizardModal.querySelector('form').reset();
    };

    container.querySelectorAll('.close-modal').forEach(btn => btn.addEventListener('click', closeModal));

    container.querySelector('#add-promo-btn').addEventListener('click', () => {
        // Set default dates
        const now = new Date();
        const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        const form = wizardModal.querySelector('form');
        form.elements['start_at'].value = now.toISOString().slice(0, 16);
        form.elements['end_at'].value = nextWeek.toISOString().slice(0, 16);
        wizardModal.style.display = 'flex';
    });

    container.querySelector('#save-promo-btn').addEventListener('click', async () => {
        const form = document.getElementById('promo-wizard-form');
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        // Construct payload
        const payload = {
            promo_id: data.promo_id,
            name: data.name,
            description: data.description,
            status: "ACTIVE",
            start_at: new Date(data.start_at).toISOString(),
            end_at: new Date(data.end_at).toISOString(),
            audience_filters: data.segment === 'ALL' ? {} : { segment: data.segment },
            trigger_config: {
                type: data.trigger_type,
                min_amount: parseFloat(data.trigger_min_amount || 0)
            },
            reward_config: {
                type: data.reward_type,
                // If percentage, construct formula
                formula: data.reward_calc_type === 'PERCENTAGE'
                    ? `trigger_value * ${parseFloat(data.reward_value) / 100}`
                    : null,
                amount: data.reward_calc_type === 'FIXED' ? parseFloat(data.reward_value) : null
            },
            total_budget: data.total_budget ? parseFloat(data.total_budget) : null,
            max_rewards_per_player: 1
        };

        if (payload.reward_config.formula) delete payload.reward_config.amount;
        if (payload.reward_config.amount) delete payload.reward_config.formula;

        try {
            await api.request('/api/v1/promotions/', {
                method: 'POST',
                body: JSON.stringify(payload)
            });
            closeModal();
            renderAdminPromotions(container); // Refresh table
        } catch (error) {
            alert(`Error creating promotion: ${error.message}`);
        }
    });
}

async function renderPlayerPromotions(container) {
    container.innerHTML = `
        <div class="player-promo-section">
            <h2 class="section-title">Exclusive Offers</h2>
            <div class="promotions-grid" id="available-promos">
                <!-- Cards loaded here -->
            </div>
            
            <h2 class="section-title" style="margin-top: 40px;">Active Campaigns Enrollment</h2>
            <div class="table-container card">
                <table class="data-table" id="my-promotions-table">
                    <thead>
                        <tr>
                            <th>Promotion</th>
                            <th>Status</th>
                            <th>Joined On</th>
                            <th>Progress</th>
                            <th>Total Earned</th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                </table>
            </div>
        </div>
    `;

    try {
        const available = await api.request('/api/v1/promotions/available');
        const availableContainer = container.querySelector('#available-promos');

        if (available.length === 0) {
            availableContainer.innerHTML = '<div class="card" style="grid-column: 1/-1; text-align: center; padding: 40px;">No custom offers available right now. Keep playing to unlock new ones!</div>';
        } else {
            availableContainer.innerHTML = available.map(promo => `
                <div class="card promo-card">
                    <div class="badge badge-active" style="position: absolute; top: 15px; right: 15px;">Eligible</div>
                    <div class="promo-icon" style="font-size: 2rem; margin-bottom: 15px;">🎁</div>
                    <h3>${promo.name}</h3>
                    <p style="margin: 10px 0; color: #666; flex-grow: 1;">${promo.description || 'Boost your gameplay with this special promotion built just for you.'}</p>
                    <div class="promo-meta" style="font-size: 0.85rem; border-top: 1px solid #eee; padding-top: 15px; margin-top: 10px;">
                        <div><strong>Trigger:</strong> ${promo.trigger_config.type}</div>
                        <div><strong>Expires:</strong> ${new Date(promo.end_at).toLocaleDateString()}</div>
                    </div>
                </div>
            `).join('');
        }

        const myStatus = await api.request('/api/v1/promotions/my-status');
        const myTbody = container.querySelector('#my-promotions-table tbody');

        if (myStatus.length === 0) {
            myTbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px;">You haven\'t triggered any promotions yet. Your activity will track here automatically!</td></tr>';
        } else {
            myTbody.innerHTML = myStatus.map(stat => `
                <tr>
                    <td><strong>${stat.promo_id}</strong></td>
                    <td><span class="badge badge-active">${stat.status}</span></td>
                    <td>${new Date(stat.joined_at).toLocaleDateString()}</td>
                    <td>${stat.rewards_received_count} rewards issued</td>
                    <td><strong style="color: var(--success-green)">${stat.total_reward_amount.toFixed(2)} tokens</strong></td>
                </tr>
            `).join('');
        }
    } catch (error) {
        container.innerHTML += `<div class="alert alert-error">Error loading player view: ${error.message}</div>`;
    }
}
