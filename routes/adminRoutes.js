const express = require('express');
const router = express.Router();
const adminController = require('../Controllers/adminController');
const leadController = require('../Controllers/leadController');
const isAuthenticated = require('../Middlewares/isAuthenticated');
const multer = require('multer');
const authorizeRoles = require('../Middlewares/authorizeRoles');
// const isAuthenticated = require('../Middlewares/isAuthenticated');

  // Multer setup for profile photo
// ✅ Multer setup must come BEFORE any routes that use it
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  }
});
const upload = multer({ storage });


// Admin login
router.get('/', (req, res) => {
  res.send('✅ Admin base route working');
});
// adminRoutes.js
router.post('/login', adminController.adminLogin);

// Admin-only: Create Subadmin
router.post("/create-subadmin", isAuthenticated, authorizeRoles("admin"), adminController.createSubadmin);

// Admin-only: Get All Subadmins
router.get("/get-subadmins", isAuthenticated, authorizeRoles("admin"), adminController.getAllSubadmins);


// Subadmin Access with Fine-Grained Permissions (example)
router.get("/leads", isAuthenticated, authorizeRoles("admin", "subadmin"), leadController.viewLeads);
router.put("/leads/:id", isAuthenticated, authorizeRoles("admin", "subadmin"), leadController.editLead);


// Admin-only: Update Subadmin
router.put(
  '/update-subadmin/:id',
  isAuthenticated,
  authorizeRoles("admin"),
  upload.single('profile_pic'),
  adminController.updateSubadmin
);

// Admin-only: Delete Subadmin
router.delete(
  '/delete-subadmin/:id',
  isAuthenticated,
  authorizeRoles("admin"),
  adminController.deleteSubadmin
);

// Change password (protected)
router.post('/change-password', 
  // verifyToken,
   adminController.changePassword);

router.post('/forgot-password', adminController.forgotPassword);
router.post('/reset-password/:token', adminController.resetPassword);


//admin logout 
router.post('/logout', 
  // verifyToken, 
  (req, res) => {
  // Invalidate the token on the client side
  res.json({ message: 'Logged out successfully' });
});


// // Admin profile
// router.get('/profile', 
//   // verifyToken,
//    adminController.getAdminProfile);


// Admin profile
router.get('/profile', 
  isAuthenticated,
   adminController.getAdminProfile);




router.put(
  '/update-profile',
  //  verifyToken, 
  upload.single('profile_pic'), // ✅ Accept single file
  adminController.updateAdminProfile
);





module.exports = router;
