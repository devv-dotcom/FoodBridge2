import { clearSession, getSession, login, notifyError, register, request, saveSession } from './api.js';
import { $, formDataObject, setLoading, toast } from './utils.js';

const dashboards = { admin: '/admin/dashboard.html', ngo: '/ngo/dashboard.html', volunteer: '/volunteer/dashboard.html', restaurant: '/donate.html', hotel: '/donate.html', bakery: '/donate.html', supermarket: '/donate.html', catering: '/donate.html', marriage_hall: '/donate.html', hostel: '/donate.html', business: '/donate.html' };
export const dashboardFor = role => dashboards[role] || '/index.html';

export const logout = ({ redirect = true } = {}) => {
  clearSession();
  if (redirect) location.assign('/login.html');
};

const registerEndpoint = role => role === 'ngo' ? '/api/ngo/register' : role === 'volunteer' ? '/api/volunteer/register' : '/api/auth/register';
const loginEndpoint = role => role === 'admin' ? '/api/admin/login' : '/api/auth/login';

export const initAuth = () => {
  window.addEventListener('foodbridge:unauthorized', () => { toast('Your session has expired. Please sign in again.', 'warning'); logout(); });
  $('[data-action="logout"]')?.addEventListener('click', event => { event.preventDefault(); logout(); });

  // ── Step 1: Email + Password ─────────────────────────────────────────────
  $('[data-api-form="login"]')?.addEventListener('submit', async event => {
    event.preventDefault();
    const form = event.currentTarget;
    const submit = form.querySelector('[type="submit"]');
    try {
      setLoading(submit, true, 'Signing in…');
      const details = formDataObject(form);
      const response = await login(details, loginEndpoint(details.role));

      if (response.requiresOtp) {
        // Show OTP panel and pre-fill hidden email field
        const email = response.email || details.email;
        const otpEmailField = $('#otp-email-field');
        const otpHint = $('#otp-hint');
        const otpInput = $('#otp-input');
        if (otpEmailField) otpEmailField.value = email;
        if (otpHint) otpHint.textContent = `We sent a 6-digit sign-in code to ${email}. Enter it below.`;
        if (response.devOtp && otpInput) {
          otpInput.value = response.devOtp;
        }
        $('#step-credentials')?.setAttribute('hidden', '');
        const stepOtp = $('#step-otp');
        if (stepOtp) { stepOtp.removeAttribute('hidden'); $('#otp-input')?.focus(); }
        toast(response.devOtp ? `Sign-in code: ${response.devOtp}` : (response.message || 'Check your email for a sign-in code.'));
      } else {
        // Admin login returns token directly (no OTP step)
        saveSession(response);
        toast('Login successful.');
        location.assign(dashboardFor(response.user.role));
      }
    } catch (error) { notifyError(error); } finally { setLoading(submit, false); }
  });

  // ── Step 2: OTP verification ─────────────────────────────────────────────
  $('[data-api-form="verify-login-otp"]')?.addEventListener('submit', async event => {
    event.preventDefault();
    const form = event.currentTarget;
    const submit = form.querySelector('[type="submit"]');
    try {
      setLoading(submit, true, 'Verifying…');
      const details = formDataObject(form);
      const response = await request('/api/auth/verify-login-otp', { method: 'POST', body: details, auth: false });
      saveSession(response);
      toast('Login successful.');
      location.assign(dashboardFor(response.user.role));
    } catch (error) { notifyError(error); } finally { setLoading(submit, false); }
  });

  // ── Resend OTP ────────────────────────────────────────────────────────────
  $('#resend-otp-link')?.addEventListener('click', async event => {
    event.preventDefault();
    const email = $('#otp-email-field')?.value;
    if (!email) return;
    try {
      await request('/api/auth/resend-login-otp', { method: 'POST', body: { email }, auth: false });
      toast('A new sign-in code has been sent to your email.');
    } catch (error) { notifyError(error); }
  });

  // ── Back to step 1 ────────────────────────────────────────────────────────
  $('#back-to-login')?.addEventListener('click', event => {
    event.preventDefault();
    $('#step-otp')?.setAttribute('hidden', '');
    $('#step-credentials')?.removeAttribute('hidden');
  });

  // ── Register form ─────────────────────────────────────────────────────────
  $('[data-api-form="register"]')?.addEventListener('submit', async event => {
    event.preventDefault();
    const form = event.currentTarget; const submit = form.querySelector('[type="submit"]'); const details = formDataObject(form);
    if (details.password !== details.confirmPassword) return toast('Passwords do not match.', 'error');
    try {
      setLoading(submit, true, 'Creating account…');
      const response = await register(details, registerEndpoint(details.role));
      saveSession(response); toast('Registration successful.'); location.assign(dashboardFor(response.user.role));
    } catch (error) { notifyError(error); } finally { setLoading(submit, false); }
  });
};

export const protectRoute = () => {
  const requiredRole = document.body.dataset.requiredRole;
  const guestOnly = document.body.dataset.guestOnly === 'true';
  const { token, user } = getSession();
  const isBusinessRole = ['restaurant', 'hotel', 'bakery', 'supermarket', 'catering', 'marriage_hall', 'hostel', 'business'].includes(user?.role);
  if (requiredRole && (!token || !user || (requiredRole !== 'business' && user.role !== requiredRole) || (requiredRole === 'business' && !isBusinessRole))) { location.replace('/login.html'); return false; }
  return true;
};
