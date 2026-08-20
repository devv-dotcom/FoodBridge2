const pool = require('../config/database');

module.exports = {
  async list(includeInactive = false) {
    const [rows] = await pool.execute(`SELECT id, name, is_active, created_at, updated_at FROM food_categories ${includeInactive ? '' : 'WHERE is_active = TRUE'} ORDER BY name ASC`);
    return rows;
  },
  async create(name) {
    const [result] = await pool.execute('INSERT INTO food_categories (name) VALUES (?)', [name]);
    return result.insertId;
  },
  async update(id, data) {
    const fields = []; const values = [];
    if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
    if (data.isActive !== undefined) { fields.push('is_active = ?'); values.push(data.isActive); }
    if (!fields.length) return 0;
    const [result] = await pool.execute(`UPDATE food_categories SET ${fields.join(', ')} WHERE id = ?`, [...values, id]);
    return result.affectedRows;
  },
  async remove(id) {
    const [result] = await pool.execute('DELETE FROM food_categories WHERE id = ?', [id]);
    return result.affectedRows;
  },
  async findById(id) {
    const [rows] = await pool.execute('SELECT id, name, is_active, created_at, updated_at FROM food_categories WHERE id = ? LIMIT 1', [id]);
    return rows[0] || null;
  }
};
