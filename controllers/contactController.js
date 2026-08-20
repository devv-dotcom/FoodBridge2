const pool = require('../config/database');

exports.createMessage = async (req, res, next) => {
  try {
    const [result] = await pool.execute('INSERT INTO contact_messages (name, email, subject, message) VALUES (?, ?, ?, ?)', [req.body.name, req.body.email.toLowerCase(), req.body.subject, req.body.message]);
    return res.status(201).json({ success: true, message: 'Your message has been received. We will get back to you soon.', contactMessageId: result.insertId });
  } catch (error) { next(error); }
};
