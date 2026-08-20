import { initAuth, protectRoute } from './auth.js';
import { initAdminIntegration } from './admin.js';
import { initContactIntegration } from './contact.js';
import { initBusinessDashboard, initNgoDashboard, initVolunteerDashboard, initAdminDashboard } from './dashboard.js';
import { initDonationIntegration } from './donation.js';
import { initNgoIntegration } from './ngo.js';
import { initProfileIntegration } from './profile.js';
import { initVolunteerIntegration } from './volunteer.js';
import { initCharts, initDonationFilters, initNotifications, initPdfReports, initTheme } from './features.js';
import { initFreshnessPredictor } from './freshness.js';

const boot = async () => {
  if (!protectRoute()) return;
  initTheme(); initAuth(); initDonationIntegration(); initNgoIntegration(); initVolunteerIntegration(); initAdminIntegration(); initContactIntegration(); initDonationFilters(); initPdfReports(); initFreshnessPredictor();
  await Promise.all([initBusinessDashboard(), initNgoDashboard(), initVolunteerDashboard(), initAdminDashboard(), initProfileIntegration(), initNotifications(), initCharts()]);
};
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true }); else boot();
