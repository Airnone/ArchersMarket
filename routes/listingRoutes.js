const express = require('express');
const router = express.Router();
const Listing = require('../models/listing');
const path = require('path');
const multer = require('multer');
const authController = require('../controllers/authController');
const listingController = require('../controllers/listingController'); // ✅ add this

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

// GET all listings (API endpoint)
router.get('/', async (req, res) => {
  try {
    const listings = await Listing.find().populate('seller', 'fullName');
    res.json(listings);
  } catch (error) {
    console.error("❌ Error fetching listings:", error);
    res.status(500).json({ message: "❌ Server error" });
  }
});

// POST create new listing
router.post(
  '/',
  authController.requireAuth,
  upload.single('image'),
  async (req, res) => {
    try {
      const { title, description, price, category, condition } = req.body;

      const newListing = new Listing({
        title,
        description,
        price,
        category,
        condition,
        image: req.file ? `/uploads/listings/${req.file.filename}` : '/uploads/listings/default.png',
        seller: req.user._id,
        date: new Date().toISOString()
      });

      await newListing.save();
      res.redirect('/sell?success=true');  
    } catch (err) {
      console.error("❌ Error creating listing:", err);
      res.status(400).send('Error creating listing');
    }
  }
);

// POST update listing
router.post('/:id/edit',
  authController.requireAuth,
  upload.single('image'),
  listingController.editListing
);


// DELETE listing
router.post(
  '/:id/delete',
  authController.requireAuth,
  listingController.deleteListing
);


module.exports = router;
