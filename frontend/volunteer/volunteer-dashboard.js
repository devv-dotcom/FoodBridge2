import { acceptPickup, getSession, notifyError, request, uploadImage } from '../js/api.js';
import { escapeHtml, toast, validateImage } from '../js/utils.js';
import { initAuth, protectRoute } from '../js/auth.js';

if (!protectRoute()) throw new Error('Volunteer session required.');
initAuth();

const $ = selector => document.querySelector(selector);
const byId = id => document.getElementById(id);
const state = { available: [], active: [], history: [], selected: null, proofPickup: null };
const statusIndex = { volunteer_assigned: 0, pickup_started: 1, food_collected: 3, delivered: 4, completed: 5 };
const statusLabel = value => String(value || 'pending').replaceAll('_', ' ');
const imageEmoji = item => /bak|bread|cake/i.test(item.food_name || '') ? '🥐' : /fruit|veg|salad/i.test(item.food_name || '') ? '🥗' : /rice|meal|biryani|food/i.test(item.food_name || '') ? '🍲' : '🍱';
const time = value => value ? new Date(`1970-01-01T${value}`).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : 'Time to confirm';
const date = value => value ? new Date(value).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'Today';
const mapsUrl = item => `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(item.pickup_address || '')}&destination=${encodeURIComponent(item.delivery_address || item.ngo_address || '')}`;

function actionFor(item) {
  const actions = {
    volunteer_assigned: { label: 'START PICKUP', endpoint: `/api/pickups/start/${item.id}`, method: 'PUT', next: 'Navigate to the donor pickup point.' },
    pickup_started: { label: 'CONFIRM COLLECTION', endpoint: `/api/pickups/collect/${item.id}`, method: 'PUT', next: 'Confirm the food quantity, then keep it moving.' },
    food_collected: { label: 'MARK DELIVERED', endpoint: `/api/pickups/deliver/${item.id}`, method: 'PUT', next: 'Hand food over safely at the receiver location.' },
    delivered: { label: 'COMPLETE DELIVERY', endpoint: `/api/pickups/complete/${item.id}`, method: 'PUT', next: 'Add proof, then close this rescue.' }
  };
  return actions[item.status] || null;
}

function setRoute(item) {
  const hasTask = Boolean(item);
  byId('task-status').textContent = hasTask ? statusLabel(item.status) : 'Ready to help';
  byId('task-time').textContent = hasTask ? `${date(item.pickup_date)} · ${time(item.pickup_time)}` : '—';
  byId('task-title').textContent = hasTask ? `Next: ${item.food_name || 'Food rescue'} from ${item.business_name || 'a local donor'}` : 'No active pickup yet.';
  const action = hasTask && actionFor(item);
  byId('task-description').textContent = hasTask ? (action?.next || 'This rescue is complete. Thank you for keeping food in motion.') : 'Accept a nearby rescue below to begin your FoodBridge route.';
  byId('hero-pickup').textContent = hasTask ? item.business_name || 'Donor pickup' : 'Choose your next pickup';
  byId('hero-pickup-sub').textContent = hasTask ? item.pickup_address || 'Pickup address available' : 'Nearby requests appear below';
  byId('hero-drop').textContent = hasTask ? item.ngo_name || 'Community receiver' : 'Deliver safely';
  byId('hero-drop-sub').textContent = hasTask ? item.delivery_address || item.ngo_address || 'Delivery address available' : 'The receiver is ready when you are';
  byId('route-title').textContent = hasTask ? `${item.food_name || 'Food rescue'} route` : 'Your next route';
  byId('route-pickup').textContent = hasTask ? item.business_name || 'Donor pickup' : 'Choose a mission';
  byId('route-delivery').textContent = hasTask ? item.ngo_name || 'Community receiver' : 'Receiver location';
  byId('route-distance').textContent = hasTask && item.distance_km ? `${item.distance_km} km` : hasTask ? 'Open maps' : '—';
  const navigate = byId('navigate-link');
  navigate.href = hasTask ? mapsUrl(item) : '#pickups';
  if (hasTask) navigate.target = '_blank'; else navigate.removeAttribute('target');
  const actions = byId('task-actions');
  if (!hasTask) actions.innerHTML = '<a class="primary" href="#pickups">FIND A PICKUP</a>';
  else if (item.status === 'delivered' && !item.delivery_proof_id) actions.innerHTML = '<button class="primary" type="button" data-proof="true">ADD DELIVERY PROOF</button><a class="secondary" target="_blank" href="' + mapsUrl(item) + '">OPEN MAP</a>';
  else if (action) actions.innerHTML = '<button class="primary" type="button" data-update="' + item.id + '">' + action.label + '</button><a class="secondary" target="_blank" href="' + mapsUrl(item) + '">OPEN MAP</a>';
  else actions.innerHTML = '<span class="chip live">Impact complete</span>';
  document.querySelectorAll('.timeline-step').forEach((step, index) => {
    step.classList.toggle('done', hasTask && index < (statusIndex[item.status] ?? 0));
    step.classList.toggle('current', hasTask && index === (statusIndex[item.status] ?? 0));
  });
}

function renderAvailable() {
  const rail = byId('pickup-rail');
  if (!state.available.length) { rail.innerHTML = '<p class="empty">No open pickups right now. Check back shortly—new rescues appear here as soon as they are accepted by a receiver.</p>'; return; }
  rail.innerHTML = state.available.map(item => `<article class="pickup"><div class="food-icon">${imageEmoji(item)}</div><span class="chip" style="position:absolute;right:14px;top:14px">${escapeHtml(date(item.pickup_date))}</span><h3>${escapeHtml(item.food_name || 'Food rescue')}</h3><p>${escapeHtml(item.quantity || 'Quantity to confirm')} · ${escapeHtml(item.business_name || 'Local donor')}</p><div class="meta"><span>📍 ${escapeHtml(item.pickup_address || 'Pickup location')}</span><span>◷ ${escapeHtml(time(item.pickup_time))}</span></div><button type="button" data-open-pickup="${item.id}">VIEW & ACCEPT</button></article>`).join('');
}

function renderHistory() {
  const target = byId('history-list');
  if (!state.history.length) { target.innerHTML = '<p class="empty">Your completed rescues will appear here. Your first delivery can make a real local impact.</p>'; return; }
  target.innerHTML = state.history.slice(0, 12).map(item => `<article class="history-item"><div class="history-thumb">${imageEmoji(item)}</div><div><h3>${escapeHtml(item.food_name || 'Food rescue')} delivered</h3><p>${escapeHtml(item.business_name || 'Donor')} → ${escapeHtml(item.ngo_name || 'Receiver')} · ${escapeHtml(date(item.delivery_time || item.updated_at || item.pickup_date))}</p></div><span class="history-status">${escapeHtml(statusLabel(item.status))}</span></article>`).join('');
}

function updateStats(profile) {
  const completed = state.history.filter(item => item.status === 'completed').length || Number(profile?.completedDeliveries || profile?.completed_deliveries || 0);
  const meals = [...state.history, ...state.active].reduce((total, item) => total + (Number(item.number_of_meals) || 0), 0);
  byId('stat-completed').textContent = completed;
  byId('stat-active').textContent = state.active.length;
  byId('stat-meals').textContent = meals;
  byId('stat-hours').textContent = `${Math.max(0, Math.round(completed * 1.25))}h`;
  const availability = profile?.availability || 'online';
  byId('availability').textContent = availability === 'online' ? 'Online' : availability === 'busy' ? 'On a rescue' : 'Offline';
}

async function load() {
  try {
    const [profileResponse, availableResponse, activeResponse, historyResponse] = await Promise.all([
      request('/api/volunteer/profile'), request('/api/pickups'), request('/api/volunteer/pickups'), request('/api/volunteer/history')
    ]);
    state.available = availableResponse.pickups || [];
    state.active = activeResponse.pickups || [];
    state.history = historyResponse.pickups || [];
    renderAvailable(); renderHistory(); updateStats(profileResponse.profile || {}); setRoute(state.active[0]);
  } catch (error) { notifyError(error); byId('pickup-rail').innerHTML = '<p class="empty">We could not load pickup requests. Please refresh and try again.</p>'; }
}

function openPickup(item) {
  state.selected = item;
  byId('modal-title').textContent = `Take ${item.food_name || 'this food rescue'}?`;
  byId('modal-details').innerHTML = `<div><span>Food</span><b>${escapeHtml(item.food_name || 'Food rescue')} · ${escapeHtml(item.quantity || 'Quantity to confirm')}</b></div><div><span>Pickup</span><b>${escapeHtml(item.pickup_address || 'Location available')}</b></div><div><span>When</span><b>${escapeHtml(date(item.pickup_date))} · ${escapeHtml(time(item.pickup_time))}</b></div><div><span>Deliver to</span><b>${escapeHtml(item.ngo_name || 'Community receiver')}</b></div>`;
  byId('pickup-modal').classList.add('open'); byId('pickup-modal').setAttribute('aria-hidden', 'false');
}
function closeModal() { byId('pickup-modal').classList.remove('open'); byId('pickup-modal').setAttribute('aria-hidden', 'true'); }
function openProof() { state.proofPickup = state.active[0]; if (!state.proofPickup) return; byId('proof-modal').classList.add('open'); byId('proof-modal').setAttribute('aria-hidden', 'false'); }
function closeProof() { byId('proof-modal').classList.remove('open'); byId('proof-modal').setAttribute('aria-hidden', 'true'); }

document.addEventListener('click', async event => {
  const open = event.target.closest('[data-open-pickup]');
  if (open) return openPickup(state.available.find(item => String(item.id) === open.dataset.openPickup));
  if (event.target.closest('[data-close-modal]')) return closeModal();
  if (event.target.closest('[data-close-proof]')) return closeProof();
  if (event.target.closest('[data-proof]')) return openProof();
  const update = event.target.closest('[data-update]');
  if (update) {
    const item = state.active.find(row => String(row.id) === update.dataset.update); const action = item && actionFor(item); if (!action) return;
    update.disabled = true; update.textContent = 'UPDATING…';
    try { const response = await request(action.endpoint, { method: action.method }); toast(response.message || 'Pickup updated.'); await load(); } catch (error) { notifyError(error); } finally { update.disabled = false; }
  }
});
byId('refresh-pickups').addEventListener('click', load);
byId('accept-pickup').addEventListener('click', async event => {
  if (!state.selected) return;
  event.currentTarget.disabled = true; event.currentTarget.textContent = 'ACCEPTING…';
  try { const response = await acceptPickup(state.selected.id); toast(response.message || 'Pickup accepted.'); closeModal(); await load(); } catch (error) { notifyError(error); } finally { event.currentTarget.disabled = false; event.currentTarget.textContent = 'ACCEPT PICKUP'; }
});
byId('proof-image').addEventListener('change', event => {
  const file = event.target.files?.[0]; const issue = file && validateImage(file); if (issue) { toast(issue, 'error'); event.target.value = ''; return; }
  if (!file) return; const preview = byId('proof-preview'); preview.src = URL.createObjectURL(file); preview.hidden = false;
});
byId('proof-form').addEventListener('submit', async event => {
  event.preventDefault(); const file = byId('proof-image').files?.[0]; const issue = validateImage(file); if (issue) return toast(issue, 'error'); if (!state.proofPickup) return;
  const data = new FormData(); data.set('image', file); data.set('notes', byId('proof-notes').value.trim()); const submit = event.currentTarget.querySelector('[type="submit"]'); submit.disabled = true; submit.textContent = 'UPLOADING…';
  try { const response = await uploadImage(`/api/pickups/proof/${state.proofPickup.id}`, data); toast(response.message || 'Pickup proof verified.'); closeProof(); event.currentTarget.reset(); byId('proof-preview').hidden = true; await load(); } catch (error) { notifyError(error); } finally { submit.disabled = false; submit.textContent = 'UPLOAD PROOF'; }
});
byId('pickup-modal').addEventListener('click', event => { if (event.target === byId('pickup-modal')) closeModal(); });
byId('proof-modal').addEventListener('click', event => { if (event.target === byId('proof-modal')) closeProof(); });

const { user } = getSession();
if (user?.fullName || user?.name) byId('hero-copy').textContent = `Hi ${user.fullName || user.name}. Your route turns generous surplus into a meal where it is needed most.`;
load();
window.setInterval(load, 60_000);
