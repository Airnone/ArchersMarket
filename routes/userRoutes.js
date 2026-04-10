const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const multer = require('multer');
const path = require('path');
const authController = require('../controllers/authController');

// Multer setup for profile picture upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'public/uploads/profile-pictures'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1e9) + ext;
    cb(null, uniqueName);
  }
});
const upload = multer({ storage });

// Routes (Protected)
router.get(
  '/data', 
  authController.authorizeRoles('Administrator', 'Manager', 'Customer'), 
  userController.getUserProfileData
);

router.post(
  '/update', 
  authController.authorizeRoles('Administrator', 'Manager', 'Customer'), 
  upload.single('profileImage'), 
  userController.updateUserProfile
);

module.exports = router;