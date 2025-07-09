const express = require('express');
const router = express.Router();
const leadController = require('../Controllers/leadController');
const { verifyToken } = require('../Middlewares/authMiddleware');

// Public: Save lead
router.post('/', leadController.createLead);

// Admin: Get & delete leads
// router.get('/', verifyToken, leadController.getLeads);
router.get('/', leadController.getLeads);

// Admin: Delete lead by ID
// router.delete('/:id', verifyToken, leadController.deleteLead);
router.delete('/:id', leadController.deleteLead);


router.get('/today', leadController.getTodaysLeads);
router.get('/todays-leads-hourly', leadController.getTodaysLeadsByHour);


// Get total leads count only
router.get('/count', async (req, res) => {
  try {
    const db = require('../Configs/db.config');
    const [[{ total }]] = await db.execute('SELECT COUNT(*) as total FROM leads');
    res.json({ total });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
