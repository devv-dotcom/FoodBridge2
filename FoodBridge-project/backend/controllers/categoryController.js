const Category = require('../models/Category');
const ActivityLog = require('../models/ActivityLog');

exports.list = async (req, res, next) => { try { return res.json({ success: true, categories: await Category.list(Boolean(req.admin)) }); } catch (error) { next(error); } };
exports.create = async (req, res, next) => {
  try {
    const id = await Category.create(req.body.name);
    await ActivityLog.create({ actorUserId: req.user.id, action: 'category_created', entityType: 'category', entityId: id, details: { name: req.body.name }, ipAddress: req.ip });
    return res.status(201).json({ success: true, message: 'Category created successfully.', category: await Category.findById(id) });
  } catch (error) { if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ success: false, message: 'A category with this name already exists.' }); next(error); }
};
exports.update = async (req, res, next) => {
  try {
    if (!(await Category.update(req.params.id, req.body))) return res.status(404).json({ success: false, message: 'Category not found.' });
    await ActivityLog.create({ actorUserId: req.user.id, action: 'category_updated', entityType: 'category', entityId: Number(req.params.id), details: req.body, ipAddress: req.ip });
    return res.json({ success: true, message: 'Category updated successfully.', category: await Category.findById(req.params.id) });
  } catch (error) { if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ success: false, message: 'A category with this name already exists.' }); next(error); }
};
exports.remove = async (req, res, next) => {
  try {
    if (!(await Category.remove(req.params.id))) return res.status(404).json({ success: false, message: 'Category not found.' });
    await ActivityLog.create({ actorUserId: req.user.id, action: 'category_deleted', entityType: 'category', entityId: Number(req.params.id), ipAddress: req.ip });
    return res.json({ success: true, message: 'Category deleted successfully.' });
  } catch (error) { if (error.code === 'ER_ROW_IS_REFERENCED_2') return res.status(409).json({ success: false, message: 'This category is used by donations and cannot be deleted.' }); next(error); }
};
