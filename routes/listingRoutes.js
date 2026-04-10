const express = require('express');
const router = express.Router();
const Listing = require('../models/listing');
const path = require('path');
const multer = require('multer');
const authController = require('../controllers/authController');
const listingController = require('../controllers/listingController');

// Set storage location and filename
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/listings');
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueName + ext);
  }
});

const upload = multer({ storage });

// GET all listings (API endpoint - Public)
router.get('/', async (req, res) => {
  try {
    const listings = await Listing.find().populate('seller', 'fullName');
    res.json(listings);
  } catch (error) {
    console.error("❌ Error fetching listings:", error);
    res.status(500).json({ message: "❌ Server error" });
  }
});

// POST create new listing (Protected)
router.post(
  '/',
  authController.authorizeRoles('Administrator', 'Manager', 'Customer'),
  upload.single('image'),
  listingController.createListing // We now point this directly to our secure controller
);

// POST update listing (Protected)
router.post(
  '/:id/edit',
  authController.authorizeRoles('Administrator', 'Manager', 'Customer'),
  upload.single('image'),
  listingController.editListing
);

// DELETE listing (Protected)
router.post(
  '/:id/delete',
  authController.authorizeRoles('Administrator', 'Manager', 'Customer'),
  listingController.deleteListing
);

module.exports = router;