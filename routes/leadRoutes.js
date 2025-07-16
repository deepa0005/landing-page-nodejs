const express = require('express');
const router = express.Router();
const leadController = require('../Controllers/leadController');
const { verifyToken } = require('../Middlewares/authMiddleware');

// Public: Save lead
router.post('/', leadController.createLead);
router.post('/zoho/send-lead', leadController.createLead);


// Admin: Get & delete leads
// router.get('/', verifyToken, leadController.getLeads);
router.get('/', leadController.getLeads);

// Admin: Delete lead by ID
// router.delete('/:id', verifyToken, leadController.deleteLead);
router.delete('/:id', leadController.deleteLead);


router.get('/today', leadController.getTodaysLeads);
router.get('/todays-leads-hourly', leadController.getTodaysLeadsByHour);

router.get("/last-7-days", leadController.getLeadsPerDay);

// Get total leads count only
router.get('/today/count', leadController.getTodaysLeadCount);

router.get('/total', leadController.getTotalLeads);
router.get('/weekly', leadController.getWeeklyLeads);
router.get('/top-service', leadController.getTopService);

module.exports = router;
