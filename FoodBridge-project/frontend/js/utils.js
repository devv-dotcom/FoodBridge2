export const $ = (selector, root = document) => root.querySelector(selector);
export const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

export const escapeHtml = value => String(value ?? '')
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;').replaceAll("'", '&#039;');

export const sanitizeText = value => String(value ?? '').trim().replace(/[<>]/g, '');

export const setLoading = (button, loading, label = 'Please wait…') => {
  if (!button) return;
  if (loading) {
    button.dataset.originalLabel = button.textContent;
    button.disabled = true;
    button.setAttribute('aria-busy', 'true');
    button.textContent = label;
  } else {
    button.disabled = false;
    button.removeAttribute('aria-busy');
    if (button.dataset.originalLabel) button.textContent = button.dataset.originalLabel;
  }
};

export const toast = (message, type = 'success') => {
  let container = $('#foodbridge-toasts');
  if (!container) {
    container = document.createElement('div');
    container.id = 'foodbridge-toasts';
    container.setAttribute('aria-live', 'polite');
    Object.assign(container.style, { position: 'fixed', top: '1rem', right: '1rem', zIndex: '9999', display: 'grid', gap: '.65rem', maxWidth: 'min(24rem, calc(100vw - 2rem))' });
    document.body.append(container);
  }
  const item = document.createElement('div');
  item.textContent = message;
  Object.assign(item.style, {
    background: type === 'error' ? '#9f1239' : type === 'warning' ? '#a16207' : '#166534', color: '#fff',
    padding: '.85rem 1rem', borderRadius: '.7rem', boxShadow: '0 12px 30px rgba(0,0,0,.18)', font: '600 14px system-ui'
  });
  container.append(item);
  window.setTimeout(() => item.remove(), 5000);
};

export const validateImage = file => {
  if (!file) return 'Please select an image.';
  const types = ['image/png', 'image/jpeg', 'image/webp'];
  if (!types.includes(file.type)) return 'Use a PNG, JPG, JPEG, or WEBP image.';
  if (file.size > 5 * 1024 * 1024) return 'Image size must not exceed 5MB.';
  return null;
};

export const wireImagePreview = (input, preview) => {
  if (!input || !preview) return;
  input.addEventListener('change', () => {
    const file = input.files?.[0];
    const problem = file && validateImage(file);
    if (problem) { toast(problem, 'error'); input.value = ''; return; }
    if (!file) return;
    const reader = new FileReader();
    reader.addEventListener('load', () => { preview.src = reader.result; preview.hidden = false; });
    reader.readAsDataURL(file);
  });
};

export const formDataObject = form => Object.fromEntries([...new FormData(form).entries()]
  .filter(([, value]) => typeof value !== 'string' || value.trim() !== '')
  .map(([key, value]) => [key, typeof value === 'string' ? sanitizeText(value) : value]));

export const renderList = (element, rows, renderRow, emptyMessage = 'No records found.') => {
  if (!element) return;
  element.replaceChildren();
  if (!rows?.length) { element.textContent = emptyMessage; return; }
  rows.forEach(row => element.append(renderRow(row)));
};
