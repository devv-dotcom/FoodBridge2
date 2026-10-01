import { request } from './api.js';

const targets = [...document.querySelectorAll('[data-public-impact]')];
const status = document.querySelector('#public-impact-status');
const setState = (state, message) => {
  if (status) { status.dataset.state = state; status.textContent = message; }
};

if (targets.length) {
  setState('loading', 'Loading platform impact…');
  request('/api/impact/public', { auth: false })
    .then(({ impact }) => {
      const completed = Number(impact?.completedDonations);
      const required = ['foodRescuedKg', 'mealsServed', 'peopleServed', 'activeRescues'];
      if (!Number.isFinite(completed) || required.some(key => !Number.isFinite(Number(impact?.[key])))) throw new Error('Invalid public impact response.');
      if (completed === 0) {
        targets.forEach(target => { target.textContent = '—'; });
        setState('empty', 'No completed rescues yet');
        return;
      }
      targets.forEach(target => { target.textContent = Number(impact[target.dataset.publicImpact]).toLocaleString(); });
      setState('success', 'Platform impact updated.');
    })
    .catch(error => {
      console.warn('Public impact could not be loaded.', error?.message || error);
      targets.forEach(target => { target.textContent = '—'; });
      setState('error', 'Impact data is temporarily unavailable');
    });
}
