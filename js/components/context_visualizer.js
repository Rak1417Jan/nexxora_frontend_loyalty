export function renderContextVisualizer(container, ctx) {
    if (!ctx) return;

    container.innerHTML = `
        <!-- Global Context -->
        <div class="context-section">
            <h5 class="context-title">🌍 Global Context</h5>
            <div class="context-metrics">
                <div class="c-metric">
                    <span class="c-label">Time</span>
                    <span class="c-value">${new Date(ctx.global_context.server_time_ist).toLocaleTimeString()}</span>
                </div>
                <div class="c-metric">
                    <span class="c-label">Festivals</span>
                    <span class="c-value">${ctx.global_context.detected_festivals.length > 0 ? ctx.global_context.detected_festivals.join(', ') : 'None'}</span>
                </div>
                <div class="c-metric">
                    <span class="c-label">Seasonality</span>
                    <span class="c-value">${Number(ctx.global_context.seasonality_index || 1.0).toFixed(2)}x</span>
                </div>
            </div>
        </div>

        <!-- Platform Pulse -->
        <div class="context-section">
            <h5 class="context-title">💹 Platform Pulse (24h)</h5>
            <div class="context-metrics">
                <div class="c-metric">
                    <span class="c-label">Active Users</span>
                    <span class="c-value">${ctx.platform_pulse.active_users_now}</span>
                </div>
                <div class="c-metric">
                    <span class="c-label">Wagered</span>
                    <span class="c-value">₹${(ctx.platform_pulse.total_wagered_24h || 0).toLocaleString()}</span>
                </div>
                <div class="c-metric">
                    <span class="c-label">Deposited</span>
                    <span class="c-value">₹${(ctx.platform_pulse.total_deposited_24h || 0).toLocaleString()}</span>
                </div>
                <div class="c-metric">
                    <span class="c-label">Liquidity</span>
                    <span class="c-value">${ctx.platform_pulse.current_liquidity_ratio || 'Healthy'}</span>
                </div>
            </div>
        </div>

        <!-- Player Segments -->
        <div class="context-section full-width">
            <h5 class="context-title">👥 Player Segments</h5>
            <div class="segment-grid">
                <div class="segment-card">
                    <div class="seg-name">Whales (VIP)</div>
                    <div class="seg-stat count">${ctx.player_segments.whales?.count || 0} players</div>
                    <div class="seg-stat">Avg Loss: ₹${(ctx.player_segments.whales?.avg_loss_last_hour || 0).toLocaleString()}</div>
                    <div class="seg-stat alert">${ctx.player_segments.whales?.churn_risk || 'Low'} Risk</div>
                </div>
                <div class="segment-card">
                    <div class="seg-name">Churn Risk</div>
                    <div class="seg-stat count">${ctx.player_segments.churn_risk_high?.count || 0} players</div>
                    <div class="seg-stat">Avg Inactive: ${ctx.player_segments.churn_risk_high?.avg_days_inactive || 0} days</div>
                </div>
                <div class="segment-card">
                    <div class="seg-name">Festival Spenders</div>
                    <div class="seg-stat count">${ctx.player_segments.festival_spenders?.count || 0} players</div>
                    <div class="seg-stat">Recent Depositors</div>
                </div>
            </div>
        </div>
    `;
}
