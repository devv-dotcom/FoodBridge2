import { createDonation, getDonations, notifyError, request } from './api.js';
import { $, formDataObject, renderList, setLoading, toast, validateImage, wireImagePreview, escapeHtml } from './utils.js';

const donationItem = donation => {
  const row = document.createElement('article');
  row.innerHTML = `<strong>${escapeHtml(donation.food_name)}</strong><span>${escapeHtml(donation.status)} · ${escapeHtml(donation.quantity)}</span>`;
  if (donation.status === 'available') {
    const remove = document.createElement('button');
    remove.type = 'button'; remove.dataset.action = 'delete-donation'; remove.dataset.id = donation.id; remove.textContent = 'Remove';
    row.append(remove);
  }
  return row;
};

export const initDonationIntegration = () => {
  const imageInput = $('[data-donation-image]');
  wireImagePreview(imageInput, $('[data-donation-preview]'));
  const form = $('[data-api-form="donation"]');
  form?.addEventListener('submit', async event => {
    event.preventDefault(); const submit = form.querySelector('[type="submit"]');
    const images = imageInput?.files ? [...imageInput.files] : [];
    const invalid = images.map(validateImage).find(Boolean);
    if (!images.length) return toast('Please add at least one food image.', 'error');
    if (invalid) return toast(invalid, 'error');
    const data = new FormData();
    Object.entries(formDataObject(form)).forEach(([key, value]) => { if (!(value instanceof File)) data.append(key, value); });
    images.forEach(image => data.append('images', image));
    try { setLoading(submit, true, 'Adding donation…'); await createDonation(data); toast('Donation added successfully.'); form.reset(); }
    catch (error) { notifyError(error); } finally { setLoading(submit, false); }
  });

  $('[data-action="load-donations"]')?.addEventListener('click', async () => {
    try { const response = await getDonations(); renderList($('#donation-results'), response.donations, donationItem, 'No donations found.'); }
    catch (error) { notifyError(error); }
  });

  document.addEventListener('click', async event => {
    const button = event.target.closest('[data-action="delete-donation"], [data-action="edit-donation"]');
    if (!button) return;
    const id = button.dataset.id; if (!id) return;
    try {
      if (button.dataset.action === 'delete-donation') { await request(`/api/donations/${id}`, { method: 'DELETE' }); toast('Donation deleted successfully.'); button.closest('article')?.remove(); }
      else toast('Load the donation data into your edit form, then submit it as PUT /api/donations/' + id, 'warning');
    } catch (error) { notifyError(error); }
  });
};
