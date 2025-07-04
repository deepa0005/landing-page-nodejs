const db = require('../Configs/db.config');

// Get admin by username
exports.getAdminByUsername = (username) => {
  return db.execute('SELECT * FROM admin_auth WHERE username = ?', [username]);
};

// Get admin by ID
exports.getAdminById = (id) => {
  return db.execute('SELECT * FROM admin_auth WHERE id = ?', [id]);
};

// Update password
exports.updatePassword = (hashedPassword, id) => {
  return db.execute('UPDATE admin_auth SET password = ? WHERE id = ?', [hashedPassword, id]);
};
