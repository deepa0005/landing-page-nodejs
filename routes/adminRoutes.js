const express = require('express');
const router = express.Router();
const adminController = require('../Controllers/adminController');
const { verifyToken } = require('../Middlewares/authMiddleware');

// Admin login
router.post('/login', adminController.adminLogin);

// Change password (protected)
router.post('/change-password', verifyToken, adminController.changePassword);

//admin logout 
router.post('/logout', verifyToken, (req, res) => {
  // Invalidate the token on the client side
  res.json({ message: 'Logged out successfully' });
});


// Admin profile
router.get('/profile', verifyToken, adminController.getAdminProfile);
router.put('/profile', verifyToken, adminController.updateAdminProfile);


module.exports = router;
