import { fetchProfile, notifyError, request } from './api.js';
import { $, $$, escapeHtml, renderList } from './utils.js';

const setValues = (data, root = document) => $$('[data-api-value]', root).forEach(element => {
  const value = element.dataset.apiValue.split('.').reduce((current, key) => current?.[key], data);
  element.textContent = value ?? '—';
});

const formatStatus = status => {
  const formatted = (status || 'available').replace('_', ' ');
  return `<span class="status-pill status-${status}">${escapeHtml(formatted)}</span>`;
};

const donationRow = donation => {
  const item = document.createElement('article');
  item.className = 'donation-card';
  item.innerHTML = `<div><div style="display:flex; justify-content:space-between; align-items:flex-start;"><h3>${escapeHtml(donation.food_name || 'Food Item')}</h3>${formatStatus(donation.status)}</div><p><strong>Quantity:</strong> ${escapeHtml(donation.quantity || '—')} &bull; <strong>Address:</strong> ${escapeHtml(donation.pickup_address || donation.city || '')}</p></div>`;
  return item;
};

const ngoAvailableRow = donation => {
  const card = document.createElement('article');
  card.className = 'donation-card';
  card.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:flex-start;">
      <h3>${escapeHtml(donation.food_name || 'Surplus Food')}</h3>
      <span class="card-badge">🛡️ Safety Verified</span>
    </div>
    <p>
      <strong>Quantity:</strong> ${escapeHtml(donation.quantity || '—')} &bull; 
      <strong>Type:</strong> ${escapeHtml(donation.food_type === 'non_veg' ? 'Non-Veg' : 'Veg')}
      ${donation.number_of_meals ? ` &bull; <strong>Serves:</strong> ~${escapeHtml(donation.number_of_meals)} people` : ''}
    </p>
    <p><strong>Donor / Location:</strong> ${escapeHtml(donation.business_name || '')} &bull; ${escapeHtml(donation.pickup_address || donation.city || '')}</p>
    <button type="button" class="btn-accept" data-action="accept-donation" data-id="${donation.id}">Accept Donation</button>
  `;
  return card;
};

const ngoHistoryRow = donation => {
  const card = document.createElement('article');
  card.className = 'donation-card';
  const showConfirm = donation.status === 'delivered' || donation.status === 'picked_up' || donation.status === 'accepted';
  const actionBtn = showConfirm && donation.status !== 'completed'
    ? `<button type="button" class="btn-confirm" data-action="confirm-delivery" data-id="${donation.id}">Confirm Delivery</button>`
    : formatStatus(donation.status);
  
  card.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:flex-start;">
      <h3>${escapeHtml(donation.food_name || 'Rescued Food')}</h3>
      ${formatStatus(donation.status)}
    </div>
    <p><strong>Quantity:</strong> ${escapeHtml(donation.quantity || '—')} &bull; <strong>Address:</strong> ${escapeHtml(donation.pickup_address || donation.city || '')}</p>
    <div style="display:flex; justify-content:space-between; align-items:center; margin-top:8px;">
      ${actionBtn}
    </div>
  `;
  return card;
};

export const initBusinessDashboard = async () => {
  if (!document.body.matches('[data-dashboard="business"]')) return;
  try {
    const [dashboard, donations] = await Promise.all([request('/api/business/dashboard'), request('/api/donations')]);
    setValues(dashboard.dashboard);
    renderList($('#donation-history'), donations.donations, donationRow, '<div class="dash-empty-state"><div class="dash-empty-icon">🍲</div><strong>No donations listed yet.</strong><p>Your published food donations will appear here.</p></div>');
  } catch (error) { notifyError(error); }
};

export const initNgoDashboard = async () => {
  if (!document.body.matches('[data-dashboard="ngo"]')) return;
  try {
    const [profile, donations, history] = await Promise.all([fetchProfile('/api/ngo/profile'), request('/api/ngo/donations'), request('/api/ngo/history')]);
    setValues(profile.profile);

    const availableList = donations.donations || [];
    const historyList = history.donations || [];

    // Compute NGO metrics
    const countAvailable = availableList.length;
    const countActive = historyList.filter(d => ['accepted', 'pending_pickup', 'volunteer_assigned', 'pickup_started', 'food_collected'].includes(d.status)).length;
    const countCompleted = historyList.filter(d => d.status === 'completed' || d.status === 'delivered').length;
    const countImpact = historyList.reduce((acc, curr) => acc + Number(curr.number_of_meals || 25), 0);

    const elAvail = $('#count-ngo-available');
    const elAct = $('#count-ngo-active');
    const elComp = $('#count-ngo-completed');
    const elImp = $('#count-ngo-impact');
    const elHeroCount = $('#hero-ngo-count');

    if (elAvail) elAvail.textContent = countAvailable;
    if (elAct) elAct.textContent = countActive;
    if (elComp) elComp.textContent = countCompleted;
    if (elImp) elImp.textContent = countImpact > 0 ? `${countImpact}+` : '0';
    if (elHeroCount) elHeroCount.textContent = countAvailable;

    const ngoEmptyAvailable = '<div class="dash-empty-state"><div class="dash-empty-icon">🍲</div><strong>No Food Donations Right Now</strong><p>New donation opportunities will appear here when food becomes available.</p></div>';
    const ngoEmptyHistory = '<div class="dash-empty-state"><div class="dash-empty-icon">📦</div><strong>No donation history yet.</strong><p>Accepted food rescues will appear here.</p></div>';

    renderList($('#available-donations'), availableList, ngoAvailableRow, ngoEmptyAvailable);
    renderList($('#ngo-history'), historyList, ngoHistoryRow, ngoEmptyHistory);
  } catch (error) { notifyError(error); }
};

export const initVolunteerDashboard = async () => {
  if (!document.body.matches('[data-dashboard="volunteer"]')) return;
  try {
    const [profile, assigned, history] = await Promise.all([fetchProfile('/api/volunteer/profile'), request('/api/volunteer/pickups'), request('/api/volunteer/history')]);
    setValues(profile.profile);

    const assignedList = assigned.pickups || [];
    const historyList = history.pickups || [];

    // Compute Volunteer metrics
    const countAvailable = assignedList.filter(p => p.status === 'pending' || p.status === 'available').length;
    const countActive = assignedList.filter(p => ['volunteer_assigned', 'pickup_started', 'food_collected'].includes(p.status)).length;
    const countCompleted = historyList.length;
    const countImpact = countCompleted * 35;

    const elAvail = $('#count-vol-available');
    const elAct = $('#count-vol-active');
    const elComp = $('#count-vol-completed');
    const elImp = $('#count-vol-impact');
    const elHeroCount = $('#hero-vol-count');

    if (elAvail) elAvail.textContent = countAvailable;
    if (elAct) elAct.textContent = countActive;
    if (elComp) elComp.textContent = countCompleted;
    if (elImp) elImp.textContent = countImpact > 0 ? `${countImpact}+` : '0';
    if (elHeroCount) elHeroCount.textContent = countAvailable;

    const volEmptyAssigned = '<div class="dash-empty-state"><div class="dash-empty-icon">🤝</div><strong>No Rescue Opportunities Right Now</strong><p>Take a break — we’ll show new opportunities here when food donations become available.</p></div>';
    const volEmptyHistory = '<div class="dash-empty-state"><div class="dash-empty-icon">🏆</div><strong>No pickup history yet.</strong><p>Completed food rescue tasks will be recorded here.</p></div>';

    renderList($('#assigned-pickups'), assignedList, donationRow, volEmptyAssigned);
    renderList($('#pickup-history'), historyList, donationRow, volEmptyHistory);
  } catch (error) { notifyError(error); }
};

export const initAdminDashboard = async () => {
  if (!document.body.matches('[data-dashboard="admin"]')) return;
  try {
    const dashboard = await request('/api/admin/dashboard');
    setValues(dashboard.dashboard);
  } catch (error) { notifyError(error); }
};
