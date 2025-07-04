const express = require('express');
const router = express.Router();
const { verifyToken } = require('../Middlewares/authMiddleware');
const dashboardController = require('../Controllers/dashboardController');

// router.get('/summary', verifyToken, dashboardController.getDashboardSummary);

 router.get('/summary',  dashboardController.getDashboardSummary);
 
module.exports = router;
