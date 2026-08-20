const Admin = require('../models/Admin');
const ActivityLog = require('../models/ActivityLog');

exports.getDashboard = async (req, res, next) => {
  try {
    const dashboard = await Admin.dashboard();
    await ActivityLog.create({ actorUserId: req.user.id, action: 'dashboard_viewed', entityType: 'dashboard', ipAddress: req.ip });
    return res.json({ success: true, dashboard });
  } catch (error) { next(error); }
};
