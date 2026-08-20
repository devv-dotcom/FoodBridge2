import { fetchProfile, getSession, notifyError, request, uploadImage } from './api.js';
import { $, formDataObject, setLoading, toast, validateImage, wireImagePreview } from './utils.js';

const profileRoutes = { business: '/api/business/profile', ngo: '/api/ngo/profile', volunteer: '/api/volunteer/profile' };
const roleGroup = role => ['restaurant', 'hotel', 'bakery', 'supermarket', 'catering', 'marriage_hall'].includes(role) ? 'business' : role;

export const initProfileIntegration = async () => {
  const form = $('[data-api-form="profile"]'); if (!form) return;
  const { user } = getSession(); const group = roleGroup(user?.role); if (!profileRoutes[group]) return;
  try { const response = await fetchProfile(profileRoutes[group]); [...form.elements].forEach(field => { if (field.name && response.profile[field.name] !== undefined) field.value = response.profile[field.name] ?? ''; }); } catch (error) { notifyError(error); }
  form.addEventListener('submit', async event => {
    event.preventDefault(); const submit = form.querySelector('[type="submit"]');
    try { setLoading(submit, true, 'Saving…'); await request(profileRoutes[group], { method: 'PUT', body: formDataObject(form) }); toast('Profile updated successfully.'); }
    catch (error) { notifyError(error); } finally { setLoading(submit, false); }
  });
  const input = $('[data-profile-image]'); wireImagePreview(input, $('[data-profile-preview]'));
  $('[data-action="upload-profile-image"]')?.addEventListener('click', async event => {
    const problem = validateImage(input?.files?.[0]); if (problem) return toast(problem, 'error');
    const routes = { volunteer: '/api/volunteer/profile/photo', business: '/api/business/logo' }; if (!routes[group]) return toast('Profile image upload is not available for this account type.', 'warning');
    const data = new FormData(); data.append('image', input.files[0]);
    try { setLoading(event.currentTarget, true, 'Uploading…'); await uploadImage(routes[group], data); toast('Profile image uploaded successfully.'); }
    catch (error) { notifyError(error); } finally { setLoading(event.currentTarget, false); }
  });
};
