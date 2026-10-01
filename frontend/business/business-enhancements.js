import { getSession, request } from '../js/api.js';
import { escapeHtml, toast } from '../js/utils.js';

const form = document.getElementById('donation-form');
const $ = selector => document.querySelector(selector);
const session = getSession();
const draftKey = `foodbridge.business.drafts.${session.user?.id || session.user?.email || 'local'}`;
const locationKey = `foodbridge.business.locations.${session.user?.id || session.user?.email || 'local'}`;
let pendingDelete = null;
const read = key => { try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; } };
const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));
const fmt = value => new Intl.NumberFormat().format(Number(value) || 0);
const escape = value => escapeHtml(value || '');

const insights = document.createElement('section');
insights.className = 'business-insights';
insights.innerHTML = `<div class="page"><div class="business-insights__head"><div><p class="eyebrow">A clearer donation desk</p><h2>YOUR RESCUE<br>AT A GLANCE.</h2></div><p>Everything that matters today—from your active handoffs to the meals your kitchen has kept in the community.</p></div><div class="business-kpis"><article class="business-kpi"><i>↗</i><strong id="enhance-total">0</strong><span>Total donations</span></article><article class="business-kpi"><i>◌</i><strong id="enhance-active">0</strong><span>Active donations</span></article><article class="business-kpi"><i>✦</i><strong id="enhance-drafts">0</strong><span>Saved drafts</span></article><article class="business-kpi"><i>♧</i><strong id="enhance-carbon">0 kg</strong><span>Estimated CO₂ avoided</span></article></div></div>`;
document.querySelector('.hero')?.insertAdjacentElement('afterend', insights);

const tools = document.createElement('section');
tools.className = 'page business-tools';
tools.id = 'business-tools';
tools.innerHTML = `<div class="business-tools-grid"><article class="tool-panel"><p class="eyebrow">Work in progress</p><h2>DONATION<br>DRAFTS.</h2><p>Save a listing before it is ready. Return to the exact details when the food is packed and pickup is confirmed.</p><div class="draft-list" id="draft-list"></div></article><article class="tool-panel"><p class="eyebrow">Pickup made easy</p><h2>SAVED<br>LOCATIONS.</h2><p>Keep your most used collection points ready for the next rescue.</p><div class="location-list" id="location-list"></div></article></div></section>`;
document.getElementById('create')?.insertAdjacentElement('afterend', tools);

const insight = document.createElement('section');
insight.className = 'page section';
insight.innerHTML = `<div class="impact-insight"><div><p class="eyebrow">Impact insight</p><h2 id="insight-copy">THIS MONTH,<br>YOU HELPED<br>CREATE <em>0 MEALS.</em></h2><p>Every listing creates a more resilient local food system. Your monthly movement is shown here as donations reach their next destination.</p></div><div class="trend-chart" id="trend-chart" aria-label="Monthly donation activity"></div></div>`;
document.querySelector('.impact-panel')?.insertAdjacentElement('afterend', insight);

const modal = document.createElement('div');
modal.className = 'enhance-modal';
modal.innerHTML = `<section class="enhance-modal-card" role="dialog" aria-modal="true" aria-labelledby="delete-title"><h3 id="delete-title">Delete this draft?</h3><p>This removes the saved information from this device. Published Food Rescue donations are not affected.</p><div class="enhance-modal-actions"><button class="cancel" type="button" data-cancel-delete>Keep draft</button><button class="danger" type="button" data-confirm-delete>Delete draft</button></div></section>`;
document.body.append(modal);

function drafts() { return read(draftKey); }
function locations() { return read(locationKey); }
function renderDrafts() {
  const list = $('#draft-list'); const rows = drafts(); $('#enhance-drafts').textContent = fmt(rows.length);
  list.innerHTML = rows.length ? rows.map(row => `<article class="draft-item"><div class="draft-thumb">🍱</div><div><strong>${escape(row.foodName || 'Untitled donation')}</strong><span>${escape(row.quantity || 'Quantity to confirm')} · Last edited ${escape(new Date(row.updatedAt).toLocaleDateString())}</span></div><div class="tool-actions"><button type="button" data-resume-draft="${row.id}">Continue</button><button type="button" data-delete-draft="${row.id}">Delete</button></div></article>`).join('') : '<p class="empty">No drafts yet. Start a donation, then save it for later.</p>';
}
function renderLocations() {
  const list = $('#location-list'); const rows = locations();
  list.innerHTML = `<div class="location-quick"><select id="location-select"><option value="">Use a saved location…</option>${rows.map(row => `<option value="${escape(row.id)}">${escape(row.name)}</option>`).join('')}</select><button class="location-save" type="button" id="save-location">Save current</button></div>${rows.length ? rows.map(row => `<article class="location-item"><div class="location-mark">⌖</div><div><strong>${escape(row.name)}${row.default ? ' · Default' : ''}</strong><span>${escape(row.address)}</span></div><div class="tool-actions"><button type="button" data-default-location="${row.id}">Default</button><button type="button" data-delete-location="${row.id}">Delete</button></div></article>`).join('') : '<p class="empty">Save a collection point for faster donation setup.</p>'}`;
  $('#location-select')?.addEventListener('change', event => { const chosen = rows.find(row => row.id === event.target.value); if (chosen) { $('#pickup-address').value = chosen.address; $('#pickup-address').dispatchEvent(new Event('input')); } });
  $('#save-location')?.addEventListener('click', () => { const address = $('#pickup-address').value.trim(); if (!address) return toast('Add a collection address before saving it.', 'warning'); const name = window.prompt('Name this location (for example: Main kitchen):', 'Main kitchen'); if (!name?.trim()) return; const current = locations(); current.push({ id: crypto.randomUUID(), name: name.trim(), address, default: !current.length }); write(locationKey, current); renderLocations(); toast('Pickup location saved.'); });
}
function applyDraft(row) {
  Object.entries(row.fields || {}).forEach(([name, value]) => { const field = form.elements.namedItem(name); if (field && typeof value === 'string') field.value = value; });
  $('#category-id').value = row.categoryId || ''; $('#form-details').classList.add('visible'); $('#food-name').dispatchEvent(new Event('input')); $('#quantity').dispatchEvent(new Event('input')); $('#pickup-address').dispatchEvent(new Event('input')); window.location.hash = 'create'; toast('Draft restored. Add a current food photo before publishing.', 'success');
}
function saveDraft() {
  const fd = new FormData(form); const fields = Object.fromEntries([...fd.entries()].filter(([, value]) => typeof value === 'string'));
  if (!fields.foodName && !fields.quantity && !fields.pickupAddress) return toast('Add a few donation details before saving a draft.', 'warning');
  const rows = drafts(); const existing = rows.find(row => row.id === form.dataset.draftId); const next = { id: existing?.id || crypto.randomUUID(), foodName: fields.foodName || 'Untitled donation', quantity: fields.quantity || '', categoryId: $('#category-id').value, fields, updatedAt: new Date().toISOString() };
  write(draftKey, existing ? rows.map(row => row.id === existing.id ? next : row) : [next, ...rows]); form.dataset.draftId = next.id; renderDrafts(); toast('Draft saved. You can safely finish it later.');
}
function chart(rows) {
  const months = Array.from({ length: 6 }, (_, i) => { const date = new Date(); date.setMonth(date.getMonth() - (5 - i)); return date; });
  const values = months.map(month => rows.filter(row => { const created = new Date(row.created_at || row.pickup_date || 0); return created.getMonth() === month.getMonth() && created.getFullYear() === month.getFullYear(); }).length);
  const max = Math.max(1, ...values); $('#trend-chart').innerHTML = values.map((value, index) => `<div class="trend-bar" style="height:${Math.max(10, value / max * 100)}%"><span>${months[index].toLocaleDateString([], { month: 'short' })}</span></div>`).join('');
  const thisMonth = rows.filter(row => { const created = new Date(row.created_at || row.pickup_date || 0), now = new Date(); return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear(); }).reduce((total, row) => total + (Number(row.number_of_meals) || 0), 0);
  $('#insight-copy').innerHTML = `THIS MONTH,<br>YOU HELPED<br>CREATE <em>${fmt(thisMonth)} MEALS.</em>`;
}
async function loadInsights() {
  try { const response = await request('/api/donations'); const rows = response.donations || []; const active = rows.filter(row => !['completed', 'cancelled'].includes(String(row.status || '').toLowerCase())); const meals = rows.reduce((total, row) => total + (Number(row.number_of_meals) || 0), 0); $('#enhance-total').textContent = fmt(rows.length); $('#enhance-active').textContent = fmt(active.length); $('#enhance-carbon').textContent = `${fmt(Math.round(meals * .42))} kg`; chart(rows); } catch { /* The existing dashboard handles API feedback; these insights remain quietly empty if unavailable. */ }
}

const save = document.createElement('button'); save.type = 'button'; save.className = 'save-draft'; save.textContent = 'SAVE AS DRAFT'; document.getElementById('publish-button')?.insertAdjacentElement('afterend', save); save.addEventListener('click', saveDraft);
document.addEventListener('click', event => {
  const resume = event.target.closest('[data-resume-draft]'); if (resume) { const row = drafts().find(item => item.id === resume.dataset.resumeDraft); if (row) applyDraft(row); return; }
  const remove = event.target.closest('[data-delete-draft]'); if (remove) { pendingDelete = remove.dataset.deleteDraft; modal.classList.add('open'); return; }
  const deleteLocation = event.target.closest('[data-delete-location]'); if (deleteLocation) { write(locationKey, locations().filter(row => row.id !== deleteLocation.dataset.deleteLocation)); renderLocations(); return; }
  const setDefault = event.target.closest('[data-default-location]'); if (setDefault) { write(locationKey, locations().map(row => ({ ...row, default: row.id === setDefault.dataset.defaultLocation }))); renderLocations(); }
});
modal.addEventListener('click', event => { if (event.target === modal || event.target.closest('[data-cancel-delete]')) { modal.classList.remove('open'); pendingDelete = null; } });
modal.querySelector('[data-confirm-delete]').addEventListener('click', () => { if (pendingDelete) { write(draftKey, drafts().filter(row => row.id !== pendingDelete)); if (form.dataset.draftId === pendingDelete) delete form.dataset.draftId; renderDrafts(); toast('Draft deleted.'); } pendingDelete = null; modal.classList.remove('open'); });

renderDrafts(); renderLocations(); loadInsights();
