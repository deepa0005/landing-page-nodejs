// File: routes/exportRoutes.js
const express = require('express');
const router = express.Router();
const exportController = require('../Controllers/exportController');
const { verifyToken } = require('../Middlewares/authMiddleware');

// router.get('/leads/excel', verifyToken, exportController.exportLeadsToExcel);
// router.get('/leads/pdf', verifyToken, exportController.exportLeadsToPDF);

router.get('/leads/excel', exportController.exportLeadsToExcel);
router.get('/leads/pdf', exportController.exportLeadsToPDF);

module.exports = router;
