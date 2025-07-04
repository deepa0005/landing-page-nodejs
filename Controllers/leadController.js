const db = require('../Configs/db.config');

// Save a new lead
exports.createLead = async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;
    const [result] = await db.execute(
      'INSERT INTO leads (name, email, phone, message) VALUES (?, ?, ?, ?)',
      [name, email, phone, message]
    );
    res.status(201).json({ message: 'Lead saved successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all leads
exports.getLeads = async (req, res) => {
  try {
const [leads] = await db.execute('SELECT * FROM leads ORDER BY submitted_at DESC');
console.log('Fetched leads:', leads);
    res.json(leads);
    
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete lead by ID
exports.deleteLead = async (req, res) => {
  try {
    const leadId = req.params.id;
    const [result] = await db.execute('DELETE FROM leads WHERE id = ?', [leadId]);
    res.json({ message: 'Lead deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
