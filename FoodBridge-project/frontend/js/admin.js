import { notifyError, request } from './api.js';
import { $, escapeHtml, renderList, setLoading, toast } from './utils.js';

const businessApprovalRow = row => {
  const item = document.createElement('article');
  item.className = 'api-list-item';
  const businessName = row.business_name || row.full_name || 'Business Partner';
  const businessType = row.business_type || row.role || 'Business';
  item.innerHTML = `<div><strong>${escapeHtml(businessName)}</strong><span style="font-size:.82rem; color:#657166;">Type: ${escapeHtml(businessType)} &bull; ${escapeHtml(row.email || '')} &bull; ${escapeHtml(row.city || '')}</span></div><div style="display:flex; gap:8px;"><button type="button" class="btn-accept" data-admin-endpoint="/api/admin/business/approve/${row.id}" data-method="PUT">Approve</button><button type="button" style="background:#dc2626; color:#fff; border:0; border-radius:8px; padding:6px 12px; font-weight:700; font-size:.8rem; cursor:pointer;" data-admin-endpoint="/api/admin/business/reject/${row.id}" data-method="PUT">Reject</button></div>`;
  return item;
};

export const initAdminIntegration = () => {
  document.addEventListener('click', async event => {
    const button = event.target.closest('[data-admin-endpoint]'); if (!button) return;
    try {
      setLoading(button, true, 'Processing…');
      const response = await request(button.dataset.adminEndpoint, { method: button.dataset.method || 'PUT', body: button.dataset.status ? { status: button.dataset.status } : undefined });
      toast(response.message || 'Admin action completed successfully.');
      button.closest('article')?.remove();
    } catch (error) { notifyError(error); } finally { setLoading(button, false); }
  });

  document.addEventListener('click', async event => {
    const button = event.target.closest('[data-admin-list]'); if (!button) return;
    try {
      setLoading(button, true, 'Loading…');
      const response = await request(button.dataset.adminList);
      const items = response.businesses || response.users || response.donations || [];
      renderList($(button.dataset.target), items, businessApprovalRow, 'No pending approvals.');
    } catch (error) { notifyError(error); } finally { setLoading(button, false); }
  });

  document.addEventListener('click', async event => {
    const reportBtn = event.target.closest('[data-action="generate-report"]'); if (!reportBtn) return;
    const type = reportBtn.dataset.type || 'daily';
    try {
      setLoading(reportBtn, true, 'Generating…');
      const response = await request(`/api/admin/reports?type=${type}`);
      const summary = response.report?.summary || {};
      const target = $('#report-results');
      if (target) {
        target.innerHTML = `<div style="background:#e5f2df; padding:16px; border-radius:12px; margin-top:10px;"><strong>${type.toUpperCase()} Summary Report</strong><ul style="margin:8px 0 0; padding-left:20px; line-height:1.6;"><li>Total Donations: <strong>${summary.total_donations || 0}</strong></li><li>Total Meals Rescued: <strong>${summary.total_meals || 0}</strong></li><li>Completed Deliveries: <strong>${summary.completed_donations || 0}</strong></li><li>Cancelled: <strong>${summary.cancelled_donations || 0}</strong></li></ul></div>`;
      }
      toast(`${type.toUpperCase()} report generated successfully.`);
    } catch (error) { notifyError(error); } finally { setLoading(reportBtn, false); }
  });
};
