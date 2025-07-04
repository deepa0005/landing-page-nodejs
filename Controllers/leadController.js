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




// Get today's leads data
exports.getTodaysLeads = async (req, res) => {
  try {
    const [leads] = await db.execute(
      `SELECT id, name, email, phone, city, message, submitted_at 
       FROM leads 
       WHERE DATE(submitted_at) = CURDATE() 
       ORDER BY submitted_at DESC`
    );

    res.status(200).json(leads);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getTodaysLeadsByHour = async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT 
        HOUR(submitted_at) AS hour,
        COUNT(*) AS count
      FROM leads
      WHERE DATE(submitted_at) = CURDATE()
      GROUP BY HOUR(submitted_at)
      ORDER BY hour
    `);

    // Fill missing hours with 0
    const fullDay = Array.from({ length: 24 }, (_, i) => i);
    const result = fullDay.map(hour => {
      const found = rows.find(row => row.hour === hour);
      return { hour, count: found ? found.count : 0 };
    });

    res.json(result);
  } catch (err) {
    console.error("📉 Lead graph error:", err);
    res.status(500).json({ error: err.message });
  }
};
