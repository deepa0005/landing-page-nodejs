const db = require('../Configs/db.config');

exports.saveLead = (name, email, company, services, message) => {
  return db.execute(
    `INSERT INTO leads (name, email, company, services, message, submitted_at)
     VALUES (?, ?, ?, ?, ?, NOW())`,
    [name, email, company, services, message]
  );
};

exports.getAllLeads = () => {
  return db.execute('SELECT * FROM leads ORDER BY submitted_at DESC');
};

exports.deleteLeadById = (id) => {
  return db.execute('DELETE FROM leads WHERE id = ?', [id]);
};
