import { notifyError, request } from './api.js';
import { $, formDataObject, setLoading, toast } from './utils.js';

export const initContactIntegration = () => {
  const form = $('[data-api-form="contact"]');
  form?.addEventListener('submit', async event => {
    event.preventDefault(); const submit = form.querySelector('[type="submit"]');
    try { setLoading(submit, true, 'Sending…'); const response = await request('/api/contact', { method: 'POST', body: formDataObject(form), auth: false }); toast(response.message || 'Thanks! Your message has been sent.'); form.reset(); }
    catch (error) { notifyError(error); } finally { setLoading(submit, false); }
  });
};
