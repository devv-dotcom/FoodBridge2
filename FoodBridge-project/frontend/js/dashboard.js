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
  item.className = 'api-list-item';
  item.innerHTML = `<div><strong>${escapeHtml(donation.food_name || 'Food Item')}</strong><span style="font-size:.82rem; color:#657166;">${escapeHtml(donation.quantity || '')} &bull; ${escapeHtml(donation.pickup_address || donation.city || '')}</span></div><div>${formatStatus(donation.status)}</div>`;
  return item;
};

const ngoAvailableRow = donation => {
  const card = document.createElement('article');
  card.className = 'donation-card';
  card.innerHTML = `<div style="display:flex; justify-content:space-between; align-items:flex-start;"><h3>${escapeHtml(donation.food_name)}</h3><span style="background:#dcfce7; color:#15803d; font-size:.72rem; font-weight:800; padding:4px 8px; border-radius:12px;">🛡️ Safety Verified</span></div><p>${escapeHtml(donation.quantity)} &bull; Type: ${escapeHtml(donation.food_type || 'Veg')} &bull; ${escapeHtml(donation.pickup_address || '')}</p><button type="button" class="btn-accept" data-action="accept-donation" data-id="${donation.id}">Accept Donation</button>`;
  return card;
};

const ngoHistoryRow = donation => {
  const card = document.createElement('article');
  card.className = 'donation-card';
  const showConfirm = donation.status === 'delivered' || donation.status === 'picked_up' || donation.status === 'accepted';
  const actionBtn = showConfirm && donation.status !== 'completed'
    ? `<button type="button" class="btn-confirm" data-action="confirm-delivery" data-id="${donation.id}">Confirm Delivery</button>`
    : formatStatus(donation.status);
  card.innerHTML = `<h3>${escapeHtml(donation.food_name)}</h3><p>${escapeHtml(donation.quantity)} &bull; ${escapeHtml(donation.pickup_address || '')}</p><div style="display:flex; justify-content:space-between; align-items:center;">${formatStatus(donation.status)} ${actionBtn}</div>`;
  return card;
};

export const initBusinessDashboard = async () => {
  if (!document.body.matches('[data-dashboard="business"]')) return;
  try {
    const [dashboard, donations] = await Promise.all([request('/api/business/dashboard'), request('/api/donations')]);
    setValues(dashboard.dashboard); renderList($('#donation-history'), donations.donations, donationRow, 'No donations listed yet.');
  } catch (error) { notifyError(error); }
};

export const initNgoDashboard = async () => {
  if (!document.body.matches('[data-dashboard="ngo"]')) return;
  try {
    const [profile, donations, history] = await Promise.all([fetchProfile('/api/ngo/profile'), request('/api/ngo/donations'), request('/api/ngo/history')]);
    setValues(profile.profile); renderList($('#available-donations'), donations.donations, ngoAvailableRow, 'No donations are currently available.'); renderList($('#ngo-history'), history.donations, ngoHistoryRow, 'No donation history yet.');
  } catch (error) { notifyError(error); }
};

export const initVolunteerDashboard = async () => {
  if (!document.body.matches('[data-dashboard="volunteer"]')) return;
  try {
    const [profile, assigned, history] = await Promise.all([fetchProfile('/api/volunteer/profile'), request('/api/volunteer/pickups'), request('/api/volunteer/history')]);
    setValues(profile.profile); renderList($('#assigned-pickups'), assigned.pickups, donationRow, 'No pickups assigned.'); renderList($('#pickup-history'), history.pickups, donationRow, 'No pickup history yet.');
  } catch (error) { notifyError(error); }
};

export const initAdminDashboard = async () => {
  if (!document.body.matches('[data-dashboard="admin"]')) return;
  try {
    const dashboard = await request('/api/admin/dashboard');
    setValues(dashboard.dashboard);
  } catch (error) { notifyError(error); }
};
