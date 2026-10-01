import { request } from './api.js';
import { escapeHtml, notifyError } from './utils.js';

export const openLeaderboardModal = async () => {
  try {
    let modal = document.getElementById('leaderboard-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'leaderboard-modal';
      modal.className = 'fb-modal-backdrop';
      modal.innerHTML = `
        <div class="fb-modal-window fb-leaderboard-window">
          <header class="fb-modal-header">
            <h3>🏆 Community Rescue Leaderboard</h3>
            <button type="button" class="fb-modal-close" data-action="close-leaderboard">&times;</button>
          </header>
          <div class="fb-modal-body">
            <div class="leaderboard-tabs">
              <button type="button" class="tab-btn active" data-tab="donors">Top Donors 🏢</button>
              <button type="button" class="tab-btn" data-tab="volunteers">Top Volunteers 🚚</button>
              <button type="button" class="tab-btn" data-tab="ngos">Top NGOs 🤝</button>
            </div>
            <div id="leaderboard-content" class="leaderboard-content">
              Loading rankings…
            </div>
          </div>
        </div>
      `;
      document.body.append(modal);

      modal.querySelector('[data-action="close-leaderboard"]').addEventListener('click', () => {
        modal.classList.remove('active');
      });
    }

    modal.classList.add('active');
    const container = document.getElementById('leaderboard-content');

    const data = await request('/api/leaderboard', { auth: false });

    const renderTab = (tabName) => {
      let items = [];
      let metricLabel = '';
      if (tabName === 'donors') {
        items = data.topDonors || [];
        metricLabel = 'Meals Donated';
      } else if (tabName === 'volunteers') {
        items = data.topVolunteers || [];
        metricLabel = 'Deliveries Completed';
      } else {
        items = data.topNgos || [];
        metricLabel = 'Rescues Completed';
      }

      if (!items.length) {
        container.innerHTML = '<p class="notice">No rankings available yet. Be the first to rescue food!</p>';
        return;
      }

      // Top 3 Podium
      const top3 = items.slice(0, 3);
      const rest = items.slice(3);

      let podiumHtml = '<div class="podium-grid">';
      top3.forEach((item, idx) => {
        const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉';
        const rankClass = idx === 0 ? 'first' : idx === 1 ? 'second' : 'third';
        const metricVal = item.total_meals || item.completed_deliveries || item.rescues_completed || 0;
        podiumHtml += `
          <div class="podium-card ${rankClass}">
            <div class="podium-medal">${medal}</div>
            <div class="podium-name">${escapeHtml(item.name)}</div>
            <div class="podium-badge">${escapeHtml(item.badge_level || 'Bronze Hero')}</div>
            <div class="podium-stat"><strong>${metricVal}</strong> <span>${metricLabel}</span></div>
            <div class="podium-points">${item.impact_points || 0} pts</div>
          </div>
        `;
      });
      podiumHtml += '</div>';

      // Table for rest
      let tableHtml = '<div class="leaderboard-table">';
      rest.forEach(item => {
        const metricVal = item.total_meals || item.completed_deliveries || item.rescues_completed || 0;
        tableHtml += `
          <div class="leaderboard-row">
            <span class="rank-col">${item.medal}</span>
            <div class="name-col">
              <strong>${escapeHtml(item.name)}</strong>
              <small>${escapeHtml(item.city || '')} &bull; ${escapeHtml(item.badge_level || 'Hero')}</small>
            </div>
            <span class="metric-col">${metricVal} ${metricLabel.split(' ')[0]}</span>
            <span class="points-col">${item.impact_points || 0} pts</span>
          </div>
        `;
      });
      tableHtml += '</div>';

      container.innerHTML = podiumHtml + tableHtml;
    };

    modal.querySelectorAll('.tab-btn').forEach(btn => {
      btn.onclick = () => {
        modal.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderTab(btn.dataset.tab);
      };
    });

    renderTab('donors');
  } catch (error) {
    notifyError(error);
  }
};
