import { createDonation, getDonations, notifyError, request } from './api.js';
import { $, formDataObject, renderList, setLoading, toast, validateImage, wireImagePreview, escapeHtml } from './utils.js';

const donationItem = donation => {
  const row = document.createElement('article');
  row.style.cssText = 'display:flex; justify-content:space-between; align-items:center; padding:14px 18px; border:1px solid #e2e8f0; border-radius:12px; background:#fff; margin-bottom:10px; font-size:14px;';
  row.innerHTML = `<div><strong style="display:block; color:#1e293b;">${escapeHtml(donation.food_name || donation.foodName || 'Food Item')}</strong><span style="font-size:12px; color:#64748b;">${escapeHtml(donation.status || 'available')} · ${escapeHtml(donation.quantity || '')}</span></div>`;
  
  if (donation.status === 'available' || !donation.status) {
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.dataset.action = 'delete-donation';
    remove.dataset.id = donation.id;
    remove.textContent = 'Remove';
    remove.style.cssText = 'border:1px solid #fca5a5; background:#fff5f5; color:#dc2626; border-radius:8px; padding:6px 12px; font:700 12px Manrope, sans-serif; cursor:pointer;';
    row.append(remove);
  }
  return row;
};

export const initDonationIntegration = () => {
  const imageInput = $('[data-donation-image]');
  const previewContainer = $('[data-donation-preview]');
  if (imageInput && previewContainer) {
    wireImagePreview(imageInput, previewContainer);
  }

  const form = $('[data-api-form="donation"]');
  form?.addEventListener('submit', async event => {
    event.preventDefault();
    const submit = form.querySelector('[type="submit"]');
    const images = imageInput?.files ? [...imageInput.files] : [];
    const invalid = images.map(validateImage).find(Boolean);
    if (!images.length) return toast('Please add at least one food photo.', 'error');
    if (invalid) return toast(invalid, 'error');

    const formDetails = formDataObject(form);
    const data = new FormData();
    Object.entries(formDetails).forEach(([key, value]) => {
      if (!(value instanceof File)) data.append(key, value);
    });
    images.forEach(image => data.append('images', image));

    try {
      setLoading(submit, true, 'Submitting donation…');
      const response = await createDonation(data);
      toast('Donation submitted successfully!', 'success');

      // Clear local storage draft
      localStorage.removeItem('foodbridge_donation_draft');

      // Populate & Display Success View Screen
      const successView = $('#donation-success-view');
      const formContainer = $('#donate-form-container');
      const successId = $('#success-donation-id');
      const successName = $('#success-food-name');

      const refId = response.donation?.id ? `#FB-${10000 + response.donation.id}` : `#FB-${Math.floor(10000 + Math.random() * 90000)}`;
      if (successId) successId.textContent = refId;
      if (successName) successName.textContent = formDetails.foodName || 'Surplus Food';

      if (formContainer) formContainer.hidden = true;
      if (successView) {
        successView.hidden = false;
        successView.scrollIntoView({ behavior: 'smooth' });
      }

      form.reset();

      // Trigger automatic reload of recent donations
      try {
        const res = await getDonations();
        if ($('#donation-results')) {
          renderList($('#donation-results'), res.donations, donationItem, 'No donations found.');
        }
      } catch (e) {
        console.warn('Could not reload recent donations list automatically:', e);
      }
    } catch (error) {
      notifyError(error);
    } finally {
      setLoading(submit, false);
    }
  });

  $('[data-action="load-donations"]')?.addEventListener('click', async () => {
    try {
      const response = await getDonations();
      renderList($('#donation-results'), response.donations, donationItem, 'No donations found.');
    } catch (error) {
      notifyError(error);
    }
  });

  document.addEventListener('click', async event => {
    const button = event.target.closest('[data-action="delete-donation"], [data-action="edit-donation"]');
    if (!button) return;
    const id = button.dataset.id;
    if (!id) return;

    try {
      if (button.dataset.action === 'delete-donation') {
        if (confirm('Are you sure you want to remove this donation?')) {
          await request(`/api/donations/${id}`, { method: 'DELETE' });
          toast('Donation deleted successfully.');
          button.closest('article')?.remove();
        }
      } else {
        toast('Load the donation data into your edit form, then submit it as PUT /api/donations/' + id, 'warning');
      }
    } catch (error) {
      notifyError(error);
    }
  });
};
