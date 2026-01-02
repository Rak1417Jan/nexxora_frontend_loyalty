import { api } from '../api.js';
import { renderContextVisualizer } from './context_visualizer.js';

/**
 * AI Campaign Generator Component
 * One-click campaign creation with AI
 */
export async function renderAICampaignGenerator(container) {
    const isAdmin = api.role === 'admin';

    if (!isAdmin) {
        container.innerHTML = '<div class="alert alert-error">AI Campaign Generator is only available for admins.</div>';
        return;
    }

    container.innerHTML = `
        <div class="ai-campaign-container">
            <!-- Header -->
            <div class="card">
                <div class="card-header">
                    <h2>🧠 AI Campaign Generator</h2>
                    <p class="subtitle">Powered by Google Gemini - One-click campaign creation</p>
                </div>
            </div>
            
            <!-- Campaign List -->
            <div class="card" style="margin-top: 20px;">
                <div class="card-header">
                    <h3>AI-Generated Campaigns</h3>
                    <button id="new-ai-campaign-btn" class="btn btn-primary">+ Generate New Campaign</button>
                </div>
                <div class="table-container">
                    <table class="data-table" id="ai-campaigns-table">
                        <thead>
                            <tr>
                                <th>Campaign</th>
                                <th>Status</th>
                                <th>Success Prediction</th>
                                <th>Target</th>
                                <th>Generated</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr><td colspan="6" style="text-align: center">Loading...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;

    // Load campaigns
    await loadAICampaigns(container);

    // New campaign button
    container.querySelector('#new-ai-campaign-btn').addEventListener('click', () => {
        showCampaignGeneratorModal(container);
    });
}

async function loadAICampaigns(container) {
    try {
        const campaigns = await api.request('/api/v1/ai-campaigns/');
        const tbody = container.querySelector('#ai-campaigns-table tbody');

        if (campaigns.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center">No AI campaigns yet. Click "Generate New Campaign" to create your first one!</td></tr>';
            return;
        }

        tbody.innerHTML = campaigns.map(campaign => {
            const prediction = campaign.success_prediction || {};
            const statusBadge = getStatusBadge(campaign.status);

            return `
                <tr>
                    <td>
                        <strong>${campaign.campaign_name}</strong><br>
                        <small class="text-muted">${campaign.campaign_id}</small>
                    </td>
                    <td>${statusBadge}</td>
                    <td>
                        <div class="prediction-mini">
                            <div class="prediction-prob">${prediction.probability_percent || 0}%</div>
                            <div class="prediction-details">
                                <small>Cost: ₹${(prediction.projected_cost || 0).toLocaleString()}</small><br>
                                <small>NGR: ₹${(prediction.projected_ngr || 0).toLocaleString()}</small>
                            </div>
                        </div>
                    </td>
                    <td><code>${campaign.target_segment_logic}</code></td>
                    <td>${new Date(campaign.generated_at).toLocaleString()}</td>
                    <td>
                        <div class="btn-group">
                            <button class="btn btn-sm view-campaign" data-id="${campaign.campaign_id}">View</button>
                            ${campaign.status === 'DRAFT' ? `
                                <button class="btn btn-sm btn-success approve-campaign" data-id="${campaign.campaign_id}">Approve</button>
                                <button class="btn btn-sm btn-outline-red delete-campaign" data-id="${campaign.campaign_id}">Delete</button>
                            ` : ''}
                            ${campaign.status === 'ACTIVE' ? `
                                <button class="btn btn-sm btn-analytics" data-id="${campaign.campaign_id}">Analytics</button>
                                <button class="btn btn-sm btn-danger kill-campaign" data-id="${campaign.campaign_id}">Kill</button>
                            ` : ''}
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        // Add event listeners
        tbody.querySelectorAll('.view-campaign').forEach(btn => {
            btn.addEventListener('click', () => viewCampaignDetails(btn.dataset.id, container));
        });

        tbody.querySelectorAll('.approve-campaign').forEach(btn => {
            btn.addEventListener('click', () => approveCampaign(btn.dataset.id, container));
        });

        tbody.querySelectorAll('.delete-campaign').forEach(btn => {
            btn.addEventListener('click', () => deleteCampaign(btn.dataset.id, container));
        });

        tbody.querySelectorAll('.btn-analytics').forEach(btn => {
            btn.addEventListener('click', () => viewCampaignAnalytics(btn.dataset.id, container));
        });

        tbody.querySelectorAll('.kill-campaign').forEach(btn => {
            btn.addEventListener('click', () => killCampaign(btn.dataset.id, container));
        });

    } catch (error) {
        console.error('Failed to load AI campaigns:', error);
        container.querySelector('#ai-campaigns-table tbody').innerHTML =
            `<tr><td colspan="6" class="alert alert-error">Error loading campaigns: ${error.message}</td></tr>`;
    }
}

function showCampaignGeneratorModal(container) {
    const modal = document.createElement('div');
    modal.className = 'modal-backdrop ai-generator-modal';
    modal.innerHTML = `
        <div class="modal-content ai-modal-content">
            <div class="modal-header">
                <h3>🧠 AI Campaign Suggestions</h3>
                <button class="close-modal">&times;</button>
            </div>
            <div class="modal-body">
                <div id="generation-step-1" class="generation-step active">
                    <h4>AI is analyzing your platform...</h4>
                    <div class="ai-thinking">
                        <div class="ai-spinner"></div>
                        <div id="ai-status">Analyzing platform state and player segments...</div>
                    </div>
                </div>
                
                <div id="generation-step-suggestions" class="generation-step" style="display: none;">
                    <button class="btn btn-sm btn-outline context-toggle-btn" id="toggle-context-btn">
                        👁️ View AI Context Data
                    </button>
                    
                    <div id="ai-context-visualizer" class="context-visualizer" style="display: none;">
                        <!-- Context data will be populated here -->
                    </div>

                    <h4>📋 Suggested Campaign Ideas</h4>
                    <p class="help-text">Based on your current platform state, here are AI-recommended campaigns. Select one to proceed.</p>
                    
                    <div id="suggestions-container" class="suggestions-grid">
                        <!-- Suggestions will be populated here -->
                    </div>
                </div>
                
                <div id="generation-step-2" class="generation-step" style="display: none;">
                    <div class="ai-thinking">
                        <div class="ai-spinner"></div>
                        <h4>AI is constructing your campaign...</h4>
                        <div id="ai-status-generating">Finalizing rules and predictive models...</div>
                    </div>
                </div>
                
                <div id="generation-step-3" class="generation-step" style="display: none;">
                    <h4>✨ Campaign Generated Successfully!</h4>
                    <div id="success-card" class="success-card">
                        <!-- Success card will be populated here -->
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary close-modal">Cancel</button>
                <div id="action-buttons">
                    <!-- Buttons will be injected here dynamically -->
                </div>
                <button class="btn btn-success" id="approve-btn" style="display: none;">Approve & Launch</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Close modal handlers
    modal.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', () => modal.remove());
    });

    // Start suggestion process immediately
    fetchSuggestions(modal, container);
}

async function fetchSuggestions(modal, container) {
    const suggestionsContainer = modal.querySelector('#suggestions-container');
    const statusEl = modal.querySelector('#ai-status');
    const step1 = modal.querySelector('#generation-step-1');
    const stepSuggestions = modal.querySelector('#generation-step-suggestions');

    try {
        // Fetch suggestions from API
        const response = await api.request('/api/v1/ai-campaigns/suggest?max_budget=1000000');

        // Setup Context Visualizer
        const contextContainer = modal.querySelector('#ai-context-visualizer');
        const toggleBtn = modal.querySelector('#toggle-context-btn');

        if (toggleBtn && contextContainer) {
            toggleBtn.onclick = () => {
                const isHidden = contextContainer.style.display === 'none';
                contextContainer.style.display = isHidden ? 'grid' : 'none';
                toggleBtn.textContent = isHidden ? '🙈 Hide AI Context Data' : '👁️ View AI Context Data';
            };

            // Render context data
            renderContextVisualizer(contextContainer, response.context_data);
        }

        // Hide loading, show suggestions
        step1.style.display = 'none';
        stepSuggestions.style.display = 'block';

        // Render Suggestions
        suggestionsContainer.innerHTML = response.suggestions.map((idea, index) => `
            <div class="suggestion-card" data-index="${index}">
                <div class="suggestion-header">
                    <h5>${idea.idea_title}</h5>
                    <span class="badge badge-${idea.urgency === 'High' ? 'red' : 'blue'}">${idea.urgency} Priority</span>
                </div>
                <p class="suggestion-desc">${idea.description}</p>
                <div class="suggestion-meta">
                    <span class="meta-item"><small>Target:</small> ${idea.target_audience}</span>
                    <span class="meta-item"><small>Impact:</small> <strong>${idea.estimated_impact}</strong></span>
                </div>
                <div class="suggestion-rationale">
                    <small><em>💡 ${idea.rationale}</em></small>
                </div>
                <button class="btn btn-sm btn-primary btn-block select-idea-btn">Select & Generate</button>
            </div>
        `).join('');

        // Add click handlers for selection
        modal.querySelectorAll('.suggestion-card').forEach((card, index) => {
            card.addEventListener('click', () => {
                const selectedIdea = response.suggestions[index];
                const intent = `Create a campaign: ${selectedIdea.idea_title}. ${selectedIdea.description} Targeting: ${selectedIdea.target_audience}.`;
                generateCampaign(modal, intent, 1000000, container);
            });
        });

    } catch (error) {
        console.error('Failed to fetch suggestions:', error);
        step1.innerHTML = `
            <div class="alert alert-error">
                <strong>Failed to load suggestions:</strong> ${error.message}
                <br><br>
                Please checking your connection and try again.
            </div>
            <button class="btn btn-primary" onclick="this.closest('.modal-backdrop').remove()">Close</button>
        `;
    }
}

async function generateCampaign(modal, intent, maxBudget, container) {
    // Show step 2 (AI thinking)
    modal.querySelector('#generation-step-suggestions').style.display = 'none';
    modal.querySelector('#generation-step-2').style.display = 'block';

    // Hide footer buttons during generation
    modal.querySelector('.modal-footer').style.display = 'none';

    try {
        // Call API
        const response = await api.request('/api/v1/ai-campaigns/generate', {
            method: 'POST',
            body: JSON.stringify({
                intent: intent,
                max_budget: maxBudget,
                auto_approve: false
            })
        });

        // Show step 3 (success card)
        modal.querySelector('#generation-step-2').style.display = 'none';
        modal.querySelector('#generation-step-3').style.display = 'block';

        // Restore footer and show approve button
        modal.querySelector('.modal-footer').style.display = 'flex';
        modal.querySelector('#approve-btn').style.display = 'inline-block';

        // Populate success card
        renderSuccessCard(modal.querySelector('#success-card'), response);

        // Approve button handler
        modal.querySelector('#approve-btn').onclick = async () => {
            await approveCampaign(response.campaign_id, container);
            modal.remove();
        };

    } catch (error) {
        console.error('Campaign generation failed:', error);
        modal.querySelector('#generation-step-2').innerHTML = `
            <div class="alert alert-error">
                <strong>Generation Failed:</strong> ${error.message}
            </div>
        `;
        modal.querySelector('.modal-footer').style.display = 'flex';
    }
}

function renderSuccessCard(container, campaign) {
    const prediction = campaign.success_prediction || {};
    const content = campaign.content_config || {};
    const action = campaign.action_config || {};

    const probability = prediction.probability_percent || 0;
    const probabilityClass = probability >= 80 ? 'high' : probability >= 60 ? 'medium' : 'low';

    container.innerHTML = `
        <div class="success-card-header">
            <h3>${campaign.campaign_name}</h3>
            <span class="badge badge-${campaign.status.toLowerCase()}">${campaign.status}</span>
        </div>
        
        <div class="prediction-metrics">
            <div class="metric-card probability-${probabilityClass}">
                <div class="metric-label">Success Probability</div>
                <div class="metric-value">${probability}%</div>
                <div class="metric-subtitle">${probability >= 80 ? 'Very High' : probability >= 60 ? 'High' : 'Medium'}</div>
            </div>
            
            <div class="metric-card">
                <div class="metric-label">Projected Cost</div>
                <div class="metric-value">₹${(prediction.projected_cost || 0).toLocaleString()}</div>
                <div class="metric-subtitle">${prediction.estimated_eligible_count || 0} eligible players</div>
            </div>
            
            <div class="metric-card">
                <div class="metric-label">Projected NGR</div>
                <div class="metric-value">₹${(prediction.projected_ngr || 0).toLocaleString()}</div>
                <div class="metric-subtitle">ROI: ${((prediction.projected_ngr / prediction.projected_cost) || 0).toFixed(1)}x</div>
            </div>
            
            <div class="metric-card risk-${prediction.risk_level?.toLowerCase() || 'low'}">
                <div class="metric-label">Risk Assessment</div>
                <div class="metric-value">${prediction.risk_level || 'Low'}</div>
                <div class="metric-subtitle">${prediction.risk_factors?.length || 0} risk factors</div>
            </div>
        </div>
        
        <div class="campaign-details">
            <div class="detail-section">
                <h4>🎯 Target Audience</h4>
                <code>${campaign.target_segment_logic}</code>
            </div>
            
            <div class="detail-section">
                <h4>🎁 Reward Action</h4>
                <p><strong>Type:</strong> ${action.type}</p>
                <p><strong>Formula:</strong> ${action.formula || action.amount}</p>
                <p><strong>Cap per Player:</strong> ₹${action.cap_per_player || 'No cap'}</p>
                ${action.wagering_requirement ? `<p><strong>Wagering:</strong> ${action.wagering_requirement}x</p>` : ''}
            </div>
            
            <div class="detail-section">
                <h4>💬 Message Content</h4>
                <p><strong>Tone:</strong> ${content.tone}</p>
                <div class="message-preview">${content.message}</div>
            </div>
            
            <div class="detail-section">
                <h4>📊 AI Rationale</h4>
                <p>${prediction.rationale || 'AI analysis based on current platform state and historical patterns.'}</p>
            </div>
        </div>
    `;
}

async function viewCampaignDetails(campaignId, container) {
    try {
        const campaign = await api.request(`/api/v1/ai-campaigns/${campaignId}`);

        const modal = document.createElement('div');
        modal.className = 'modal-backdrop';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 800px;">
                <div class="modal-header">
                    <h3>Campaign Details</h3>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <div id="campaign-details-content"></div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary close-modal">Close</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        renderSuccessCard(modal.querySelector('#campaign-details-content'), campaign);

        modal.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', () => modal.remove());
        });

    } catch (error) {
        alert(`Failed to load campaign: ${error.message}`);
    }
}

async function approveCampaign(campaignId, container) {
    if (!confirm('Approve and launch this campaign? It will go live immediately.')) {
        return;
    }

    try {
        await api.request(`/api/v1/ai-campaigns/${campaignId}/approve`, {
            method: 'POST'
        });

        alert('Campaign approved and launched successfully!');
        await loadAICampaigns(container);

    } catch (error) {
        alert(`Failed to approve campaign: ${error.message}`);
    }
}

async function deleteCampaign(campaignId, container) {
    if (!confirm('Delete this campaign? This cannot be undone.')) {
        return;
    }

    try {
        await api.request(`/api/v1/ai-campaigns/${campaignId}`, {
            method: 'DELETE'
        });

        await loadAICampaigns(container);

    } catch (error) {
        alert(`Failed to delete campaign: ${error.message}`);
    }
}

async function killCampaign(campaignId, container) {
    const reason = prompt('Enter reason for killing this campaign:');
    if (!reason) return;

    try {
        await api.request(`/api/v1/ai-campaigns/${campaignId}/kill?reason=${encodeURIComponent(reason)}`, {
            method: 'POST'
        });

        alert('Campaign killed successfully!');
        await loadAICampaigns(container);

    } catch (error) {
        alert(`Failed to kill campaign: ${error.message}`);
    }
}

async function viewCampaignAnalytics(campaignId, container) {
    try {
        const analytics = await api.request(`/api/v1/ai-campaigns/${campaignId}/analytics`);

        const modal = document.createElement('div');
        modal.className = 'modal-backdrop';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 900px;">
                <div class="modal-header">
                    <h3>📊 Live Campaign Analytics</h3>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="analytics-dashboard">
                        <div class="funnel-section">
                            <h4>Participation Funnel</h4>
                            <div class="funnel-visual">
                                <div class="funnel-stage">
                                    <div class="funnel-label">Eligible</div>
                                    <div class="funnel-bar" style="width: 100%">${analytics.funnel.eligible}</div>
                                </div>
                                <div class="funnel-stage">
                                    <div class="funnel-label">Viewed</div>
                                    <div class="funnel-bar" style="width: ${(analytics.funnel.viewed / analytics.funnel.eligible * 100)}%">${analytics.funnel.viewed}</div>
                                </div>
                                <div class="funnel-stage">
                                    <div class="funnel-label">Claimed</div>
                                    <div class="funnel-bar" style="width: ${(analytics.funnel.claimed / analytics.funnel.eligible * 100)}%">${analytics.funnel.claimed}</div>
                                </div>
                                <div class="funnel-stage">
                                    <div class="funnel-label">Wagered</div>
                                    <div class="funnel-bar" style="width: ${(analytics.funnel.wagered / analytics.funnel.eligible * 100)}%">${analytics.funnel.wagered}</div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="comparison-section">
                            <h4>Actual vs Predicted</h4>
                            <div class="comparison-grid">
                                <div class="comparison-item">
                                    <div class="comparison-label">Cost</div>
                                    <div class="comparison-values">
                                        <span class="actual">₹${analytics.financial.cost_actual.toLocaleString()}</span>
                                        <span class="vs">/</span>
                                        <span class="predicted">₹${analytics.financial.cost_predicted.toLocaleString()}</span>
                                    </div>
                                    <div class="comparison-accuracy ${analytics.prediction_accuracy.cost_match >= 90 ? 'good' : 'warning'}">
                                        ${analytics.prediction_accuracy.cost_match.toFixed(1)}% match
                                    </div>
                                </div>
                                
                                <div class="comparison-item">
                                    <div class="comparison-label">NGR</div>
                                    <div class="comparison-values">
                                        <span class="actual">₹${analytics.financial.ngr_actual.toLocaleString()}</span>
                                        <span class="vs">/</span>
                                        <span class="predicted">₹${analytics.financial.ngr_predicted.toLocaleString()}</span>
                                    </div>
                                    <div class="comparison-accuracy ${analytics.prediction_accuracy.ngr_match >= 90 ? 'good' : 'warning'}">
                                        ${analytics.prediction_accuracy.ngr_match.toFixed(1)}% match
                                    </div>
                                </div>
                                
                                <div class="comparison-item">
                                    <div class="comparison-label">ROI</div>
                                    <div class="comparison-values">
                                        <span class="actual">${analytics.financial.roi_actual.toFixed(2)}x</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary close-modal">Close</button>
                    <button class="btn btn-danger" id="kill-from-analytics">Kill Campaign</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        modal.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', () => modal.remove());
        });

        modal.querySelector('#kill-from-analytics').addEventListener('click', async () => {
            modal.remove();
            await killCampaign(campaignId, container);
        });

    } catch (error) {
        alert(`Failed to load analytics: ${error.message}`);
    }
}

function getStatusBadge(status) {
    const badges = {
        'DRAFT': '<span class="badge badge-draft">Draft</span>',
        'ACTIVE': '<span class="badge badge-active">Active</span>',
        'COMPLETED': '<span class="badge badge-completed">Completed</span>',
        'CANCELLED': '<span class="badge badge-cancelled">Cancelled</span>'
    };
    return badges[status] || `<span class="badge">${status}</span>`;
}
