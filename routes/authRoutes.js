const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Register (Public)
router.post('/register', authController.register);

// Login (Public)
router.post('/login', authController.login);

// POST Change Password (Protected)
router.post(
  '/change-password',
  authController.authorizeRoles('Administrator', 'Manager', 'Customer'),
  authController.changePassword
);

// POST Reset Password via Security Question (Public)
router.post('/reset-password', authController.resetPasswordWithQuestion);

// Logout (Protected - Any logged-in user)
router.get(
  '/logout', 
  authController.authorizeRoles('Administrator', 'Manager', 'Customer'), 
  (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      req.flash('success_msg', 'Logged out successfully');
      res.redirect('/');
    });
  }
);

// Check auth status (Public/Utility)
router.get('/status', (req, res) => {
  res.json({ user: req.user || null });
});

module.exports = router;