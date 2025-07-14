const express = require('express');
const router = express.Router();
const adminController = require('../Controllers/adminController');
const { verifyToken } = require('../Middlewares/authMiddleware');
const multer = require('multer');



// Admin login
router.get('/', (req, res) => {
  res.send('✅ Admin base route working');
});
// adminRoutes.js
router.post('/login', adminController.adminLogin);


// Change password (protected)
router.post('/change-password', verifyToken, adminController.changePassword);

router.post('/forgot-password', adminController.forgotPassword);
router.post('/reset-password/:token', adminController.resetPassword);


//admin logout 
router.post('/logout', verifyToken, (req, res) => {
  // Invalidate the token on the client side
  res.json({ message: 'Logged out successfully' });
});


// Admin profile
router.get('/profile', 
  // verifyToken,
   adminController.getAdminProfile);



// Multer setup for profile photo
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // ✅ Ensure this folder exists
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  }
});
const upload = multer({ storage });
router.put(
  '/update-profile',
  //  verifyToken, 
  upload.single('profile_pic'), // ✅ Accept single file
  adminController.updateAdminProfile
);


module.exports = router;
