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

module.exports = router;
