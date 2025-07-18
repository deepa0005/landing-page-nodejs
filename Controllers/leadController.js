const leadModel = require('../models/LeadModel');
const db = require('../Configs/db.config');
const axios = require('axios');
const getZohoAccessToken = require('../Middlewares/zohoAuth');

// Save a new lead (without phone and city)
exports.createLead = async (req, res) => {
  try {
    const { name, email, phone, location, type, company, services } = req.body;

    console.log("📨 Incoming Lead:", req.body);

    await leadModel.saveLead(name, email, phone, location, type, company, services);

    res.status(201).json({
      message: 'Lead saved successfully.'
    });

  } catch (err) {
    console.error("❌ Failed to save lead:", err.message);
    res.status(500).json({
      message: "Internal server error",
      error: err.message
    });
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

exports.getTodaysLeads = async (req, res) => {
  try {
    const [leads] = await db.execute(`
      SELECT id, name, email, company, services, message, submitted_at
      FROM leads
      WHERE CONVERT_TZ(submitted_at, '+00:00', '+05:30') >= CURDATE()
        AND CONVERT_TZ(submitted_at, '+00:00', '+05:30') < CURDATE() + INTERVAL 1 DAY
      ORDER BY submitted_at DESC
    `);
    res.status(200).json(leads);
  } catch (err) {
    console.error("❌ Failed to fetch today's leads:", err);
    res.status(500).json({ error: err.message });
  }
};

// Get hourly breakdown (unchanged)
exports.getTodaysLeadsByHour = async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT 
        HOUR(CONVERT_TZ(submitted_at, '+00:00', '+05:30')) AS hour,
        COUNT(*) AS count
      FROM leads
      WHERE DATE(CONVERT_TZ(submitted_at, '+00:00', '+05:30')) = CURDATE()
      GROUP BY hour
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


exports.getLeadsPerDay = async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT 
        DATE(CONVERT_TZ(submitted_at, '+00:00', '+05:30')) AS date,
        COUNT(*) AS count
      FROM leads
      WHERE submitted_at >= CURDATE() - INTERVAL 6 DAY
      GROUP BY date
      ORDER BY date
    `);

    const today = new Date();
    const labels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const past7Days = [...Array(7)].map((_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - (6 - i)); // 6 to 0
      const isoDate = d.toISOString().split('T')[0];
      const dayLabel = labels[d.getDay()];
      const found = rows.find(row => row.date === isoDate);
      return {
        day: dayLabel,
        count: found ? found.count : 0
      };
    });

    res.json(past7Days);
  } catch (err) {
    console.error("❌ Error in getLeadsPerDay:", err);
    res.status(500).json({ error: err.message });
  }
};


// ✅ 1. Total Leads
exports.getTotalLeads = async (req, res) => {
  try {
    const [rows] = await db.execute(`SELECT COUNT(*) AS total FROM leads`);
    res.json({ total: rows[0].total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ 2. Today's Lead Count
exports.getTodaysLeadCount = async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT COUNT(*) AS total
      FROM leads
      WHERE DATE(CONVERT_TZ(submitted_at, '+00:00', '+05:30')) = CURDATE()
    `);
    res.json({ total: rows[0].total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ 3. Weekly Leads (Last 7 Days)
exports.getWeeklyLeads = async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT COUNT(*) AS total
      FROM leads
      WHERE submitted_at >= CURDATE() - INTERVAL 7 DAY
    `);
    res.json({ total: rows[0].total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ 4. Top Requested Service
// File: controllers/leadController.js
exports.getTopService = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 3; // ✅ Set default to 3 if not provided

    const [rows] = await db.execute(`
      SELECT services, COUNT(*) AS count
      FROM leads
      GROUP BY services
      ORDER BY count DESC
      LIMIT ?
    `, [limit]);

    res.json(rows); // ✅ send full result
  } catch (err) {
    console.error("❌ Error in getTopService:", err);
    res.status(500).json({ error: err.message });
  }
};

// View all leads (admin + subadmin)
exports.viewLeads = async (req, res) => {
  try {
    const [leads] = await leadModel.getAllLeads(); // uses your existing DB model
    res.status(200).json(leads);
  } catch (err) {
    console.error("❌ Error fetching leads:", err);
    res.status(500).json({ error: err.message });
  }
};

// Edit a lead by ID (admin + subadmin)
exports.editLead = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedData = req.body;

    const result = await leadModel.updateLeadById(id, updatedData); // You need to define this function in leadModel

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Lead not found." });
    }

    res.status(200).json({ message: `Lead ${id} updated successfully.` });
  } catch (err) {
    console.error("❌ Error updating lead:", err);
    res.status(500).json({ error: err.message });
  }
};

