import { clearSession, getSession, login, notifyError, register, saveSession } from './api.js';
import { $, formDataObject, setLoading, toast } from './utils.js';

const dashboards = { admin: '/admin/dashboard.html', ngo: '/ngo/dashboard.html', volunteer: '/volunteer/dashboard.html', restaurant: '/business/dashboard.html', hotel: '/business/dashboard.html', bakery: '/business/dashboard.html', supermarket: '/business/dashboard.html', catering: '/business/dashboard.html', marriage_hall: '/business/dashboard.html', hostel: '/business/dashboard.html' };
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

  $('[data-api-form="login"]')?.addEventListener('submit', async event => {
    event.preventDefault();
    const form = event.currentTarget; const submit = form.querySelector('[type="submit"]');
    try {
      setLoading(submit, true, 'Signing in…');
      const details = formDataObject(form); const response = await login(details, loginEndpoint(details.role));
      saveSession(response); toast('Login successful.'); location.assign(dashboardFor(response.user.role));
    } catch (error) { notifyError(error); } finally { setLoading(submit, false); }
  });

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
  if (guestOnly && token && user) { location.replace(dashboardFor(user.role)); return false; }
  if (requiredRole && (!token || !user || (requiredRole !== 'business' && user.role !== requiredRole) || (requiredRole === 'business' && !dashboards[user.role]?.includes('/business/')))) { location.replace('/login.html'); return false; }
  return true;
};
