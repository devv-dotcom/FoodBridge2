import { notifyError, request } from './api.js';
import { setLoading, toast } from './utils.js';

const requestForm = document.getElementById('request-form');
const verifyForm = document.getElementById('verify-form');
const resetForm = document.getElementById('reset-form');
const copy = document.getElementById('recovery-copy');
let email = ''; let resetToken = '';

requestForm.addEventListener('submit', async event => {
  event.preventDefault(); const submit = requestForm.querySelector('[type="submit"]'); email = requestForm.elements.email.value.trim();
  try { setLoading(submit, true, 'Sending…'); const response = await request('/api/auth/forgot-password', { method: 'POST', body: { email }, auth: false }); toast(response.message); requestForm.hidden = true; verifyForm.hidden = false; copy.textContent = `Enter the 6-digit code sent to ${email}. It expires in 10 minutes.`; verifyForm.elements.otp.focus(); }
  catch (error) { notifyError(error); } finally { setLoading(submit, false); }
});
verifyForm.addEventListener('submit', async event => {
  event.preventDefault(); const submit = verifyForm.querySelector('[type="submit"]');
  try { setLoading(submit, true, 'Verifying…'); const response = await request('/api/auth/verify-otp', { method: 'POST', body: { email, otp: verifyForm.elements.otp.value.trim() }, auth: false }); resetToken = response.resetToken; verifyForm.hidden = true; resetForm.hidden = false; copy.textContent = 'Choose a strong new password for your FoodBridge account.'; resetForm.elements.newPassword.focus(); }
  catch (error) { notifyError(error); } finally { setLoading(submit, false); }
});
resetForm.addEventListener('submit', async event => {
  event.preventDefault(); const submit = resetForm.querySelector('[type="submit"]'); const newPassword = resetForm.elements.newPassword.value; const confirmPassword = resetForm.elements.confirmPassword.value;
  if (newPassword !== confirmPassword) return toast('Passwords do not match.', 'error');
  try { setLoading(submit, true, 'Updating…'); const response = await request('/api/auth/reset-password', { method: 'POST', body: { resetToken, newPassword, confirmPassword }, auth: false }); toast(response.message); location.assign('login.html'); }
  catch (error) { notifyError(error); } finally { setLoading(submit, false); }
});
