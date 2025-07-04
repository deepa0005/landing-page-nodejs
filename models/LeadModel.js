const db = require('../Configs/db.config');

// Save a new lead
exports.saveLead = (name, email, phone, message) => {
  return db.execute(
    'INSERT INTO leads (name, email, phone, message) VALUES (?, ?, ?, ?)',
    [name, email, phone, message]
  );
};

// Get all leads
exports.getAllLeads = () => {
  return db.execute('SELECT * FROM leads ORDER BY submited_at DESC');
};

// Delete lead by ID
exports.deleteLeadById = (id) => {
  return db.execute('DELETE FROM leads WHERE id = ?', [id]);
};
