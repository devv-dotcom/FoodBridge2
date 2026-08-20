import { acceptPickup, notifyError, request, uploadImage } from './api.js';
import { $, escapeHtml, renderList, setLoading, toast, validateImage, wireImagePreview } from './utils.js';

const pickupCard = pickup => {
  const card = document.createElement('article');
  card.className = 'pickup-card';
  let actionHtml = '';
  if (pickup.status === 'pending') {
    actionHtml = `<button type="button" class="btn-action" data-action="accept-pickup" data-id="${pickup.id}">Accept Pickup</button>`;
  } else if (pickup.status === 'volunteer_assigned') {
    actionHtml = `<button type="button" class="btn-action" data-action="start-pickup" data-id="${pickup.id}">Start Pickup</button>`;
  } else if (pickup.status === 'pickup_started') {
    actionHtml = `<button type="button" class="btn-action" data-action="collect-pickup" data-id="${pickup.id}">Collect Food</button>`;
  } else if (pickup.status === 'food_collected') {
    actionHtml = `<button type="button" class="btn-action" data-action="deliver-pickup" data-id="${pickup.id}">Mark Delivered</button>`;
  } else {
    actionHtml = `<span class="status-pill status-${pickup.status}">${escapeHtml((pickup.status || '').replace('_', ' '))}</span>`;
  }
  card.innerHTML = `<h3>${escapeHtml(pickup.food_name || 'Food Pickup')}</h3><p><strong>Address:</strong> ${escapeHtml(pickup.pickup_address || '')} &bull; <strong>Delivery:</strong> ${escapeHtml(pickup.delivery_address || '')}</p><div class="pickup-actions">${actionHtml}</div>`;
  return card;
};

export const initVolunteerIntegration = () => {
  $('[data-action="load-pickups"]')?.addEventListener('click', async () => {
    try { const response = await request('/api/pickups'); renderList($('#pickup-requests'), response.pickups, pickupCard, 'No pickups available.'); }
    catch (error) { notifyError(error); }
  });
  document.addEventListener('click', async event => {
    const button = event.target.closest('[data-action="accept-pickup"], [data-action="start-pickup"], [data-action="collect-pickup"], [data-action="deliver-pickup"], [data-action="complete-pickup"]');
    if (!button) return;
    const paths = { 'accept-pickup': id => acceptPickup(id), 'start-pickup': id => request(`/api/pickups/start/${id}`, { method: 'PUT' }), 'collect-pickup': id => request(`/api/pickups/collect/${id}`, { method: 'PUT' }), 'deliver-pickup': id => request(`/api/pickups/deliver/${id}`, { method: 'PUT' }), 'complete-pickup': id => request(`/api/pickups/complete/${id}`, { method: 'PUT' }) };
    try { setLoading(button, true); const response = await paths[button.dataset.action](button.dataset.id); toast(response.message || 'Pickup updated successfully.'); }
    catch (error) { notifyError(error); } finally { setLoading(button, false); }
  });
  const proofForm = $('[data-api-form="delivery-proof"]'); const proofInput = proofForm?.querySelector('[type="file"]');
  wireImagePreview(proofInput, $('[data-proof-preview]'));
  proofForm?.addEventListener('submit', async event => {
    event.preventDefault(); const submit = proofForm.querySelector('[type="submit"]'); const id = proofForm.dataset.pickupId;
    const issue = validateImage(proofInput?.files?.[0]); if (issue) return toast(issue, 'error');
    const data = new FormData(proofForm); data.set('image', proofInput.files[0]);
    try { setLoading(submit, true, 'Uploading proof…'); await uploadImage(`/api/pickups/proof/${id}`, data); toast('Delivery proof uploaded.'); }
    catch (error) { notifyError(error); } finally { setLoading(submit, false); }
  });
};
