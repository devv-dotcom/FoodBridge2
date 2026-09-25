import { clearSession, getSession, login, notifyError, register, request, saveSession } from './api.js';
import { $, formDataObject, setLoading, toast } from './utils.js';
import { BUSINESS_ROLES, dashboardForRole } from './roles.js';

export const dashboardFor = dashboardForRole;

export const logout = ({ redirect = true } = {}) => {
  clearSession();
  if (redirect) location.assign('/login.html');
};

const registerEndpoint = role => role === 'ngo' ? '/api/ngo/register' : '/api/auth/register';
const loginEndpoint = () => '/api/auth/login';

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
        const devOtpBox = $('#dev-otp-box');
        const devOtpCode = $('#dev-otp-code');

        if (otpEmailField) otpEmailField.value = email;
        if (otpHint) otpHint.textContent = `We sent a 6-digit code to ${email}.`;

        if (response.devOtp) {
          // Dev mode — show the autofill box and pre-fill the input
          if (devOtpCode) devOtpCode.textContent = response.devOtp;
          if (devOtpBox) devOtpBox.style.display = 'flex';
          if (otpInput) otpInput.value = response.devOtp;
          // Wire autofill button
          $('#btn-autofill-otp')?.addEventListener('click', () => {
            if (otpInput && devOtpCode) otpInput.value = devOtpCode.textContent;
          }, { once: true });
        }

        $('#step-credentials')?.setAttribute('hidden', '');
        const stepOtp = $('#step-otp');
        if (stepOtp) { stepOtp.removeAttribute('hidden'); otpInput?.focus(); }
        toast(response.devOtp ? `Dev mode: OTP ${response.devOtp} auto-filled below.` : (response.message || 'Check your email for a sign-in code.'));
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
  const isBusinessRole = BUSINESS_ROLES.includes(user?.role);
  const isNgoRole = ['ngo', 'partner'].includes(user?.role);

  // Guest-only pages (login, register): always render the form cleanly
  if (guestOnly) {
    return true;
  }

  // Protected pages: redirect unauthenticated users to login page
  if (requiredRole && (!token || !user)) {
    location.replace(location.pathname.includes('/frontend/') ? '/frontend/login.html' : '/login.html');
    return false;
  }

  // Role checks for authenticated users
  if (requiredRole && token && user) {
    const userDashboard = dashboardFor(user.role);
    if ((requiredRole === 'partner' || requiredRole === 'ngo') && !isNgoRole && user?.role !== 'admin') {
      location.replace(userDashboard);
      return false;
    }
    if (requiredRole === 'business' && !isBusinessRole) {
      location.replace(userDashboard);
      return false;
    }
    if (requiredRole === 'admin' && user?.role !== 'admin') {
      location.replace(userDashboard);
      return false;
    }
  }

  return true;
};
