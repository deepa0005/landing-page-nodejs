const leadModel = require('../models/LeadModel');

// Save a new lead (without phone and city)
exports.createLead = async (req, res) => {
  try {
    const { name, email, company, services, message } = req.body;
    await leadModel.saveLead(name, email, company, services, message);
    console.log("📥 Lead saved:", { name, email, company, services, message });
    res.status(201).json({ message: 'Lead saved successfully.' });
  } catch (err) {
    console.error("📥 Lead save error:", err);
    res.status(500).json({ error: err.message });
  }
};

// Get all leads
exports.getLeads = async (req, res) => {
  try {
    const [leads] = await leadModel.getAllLeads();
    res.status(200).json(leads);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete lead by ID
exports.deleteLead = async (req, res) => {
  try {
    const leadId = req.params.id;
    await leadModel.deleteLeadById(leadId);
    res.json({ message: 'Lead deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get today's leads (without phone and city)
exports.getTodaysLeads = async (req, res) => {
  try {
    const [leads] = await db.execute(
      `SELECT id, name, email, company, services, message, submitted_at 
       FROM leads 
       WHERE DATE(submitted_at) = CURDATE() 
       ORDER BY submitted_at DESC`
    );
    res.status(200).json(leads);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get hourly breakdown (unchanged)
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
