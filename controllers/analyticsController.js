const Analytics = require('../models/Analytics');
const ActivityLog = require('../models/ActivityLog');

exports.getAnalytics = async (req, res, next) => {
  try {
    const analytics = await Analytics.overview();
    await ActivityLog.create({ actorUserId: req.user.id, action: 'analytics_viewed', entityType: 'analytics', ipAddress: req.ip });
    return res.json({ success: true, analytics });
  } catch (error) { next(error); }
};
