import { $, formDataObject } from './utils.js';

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

export const predictFreshness = ({ preparationTime, expiryTime, foodType = 'veg', storage = 'ambient' }) => {
  const now = Date.now(); const prepared = new Date(preparationTime).getTime(); const expiry = new Date(expiryTime).getTime();
  if (!Number.isFinite(prepared) || !Number.isFinite(expiry) || expiry <= prepared) return null;
  const total = expiry - prepared; const remaining = expiry - now;
  const storageFactor = { chilled: 1, insulated: .88, ambient: .72 }[storage] ?? .72;
  const foodFactor = foodType === 'non_veg' ? .82 : 1;
  const score = clamp(Math.round((remaining / total) * 100 * storageFactor * foodFactor), 0, 100);
  const remainingHours = Math.max(0, remaining / 3600000);
  const status = remaining <= 0 ? 'Expired — do not donate' : score < 30 || remainingHours < 1 ? 'Urgent pickup needed' : score < 60 || remainingHours < 3 ? 'Donate soon' : 'Suitable for donation';
  return { score, remainingHours: Number(remainingHours.toFixed(1)), status, expiry: new Date(expiry).toLocaleString(), warning: 'This is a planning estimate only. Follow local food-safety rules and do not donate food that is unsafe, spoiled, or temperature-abused.' };
};

export const initFreshnessPredictor = () => {
  const form = $('[data-freshness-predictor]'); const output = $('[data-freshness-result]'); if (!form || !output) return;
  const render = () => { const result = predictFreshness(formDataObject(form)); if (!result) { output.hidden = true; return; } output.hidden = false; output.innerHTML = `<strong>${result.status}</strong><span>Freshness score: ${result.score}/100 · about ${result.remainingHours} hours remaining</span><small>Estimated expiry: ${result.expiry}. ${result.warning}</small>`; output.dataset.status = result.score < 30 ? 'urgent' : result.score < 60 ? 'soon' : 'good'; };
  form.addEventListener('input', render); form.addEventListener('change', render); render();
};
