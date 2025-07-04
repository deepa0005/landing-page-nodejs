const db = require('../Configs/db.config');

exports.getDashboardSummary = async (req, res) => {
  try {
    // Total leads
    const [[{ totalLeads }]] = await db.execute('SELECT COUNT(*) AS totalLeads FROM leads');

    // Total uploads
    const [[{ totalUploads }]] = await db.execute('SELECT COUNT(*) AS totalUploads FROM uploads');

    // Leads submitted today
    const [[{ todayLeads }]] = await db.execute(
      `SELECT COUNT(*) AS todayLeads FROM leads WHERE DATE(submitted_at) = CURDATE()`
    );

    // Uploads done today
    const [[{ todayUploads }]] = await db.execute(
      `SELECT COUNT(*) AS todayUploads FROM uploads WHERE DATE(uploaded_at) = CURDATE()`
    );

    res.json({
      totalLeads,
      totalUploads,
      todayLeads,
      todayUploads
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
