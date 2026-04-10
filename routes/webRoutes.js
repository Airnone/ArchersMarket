const express = require('express');
const router = express.Router();
const Listing = require('../models/listing');
const authController = require('../controllers/authController');
const adminController = require('../controllers/adminController');
const Profile = require('../models/profile');

// --- PUBLIC ROUTES ---

router.get('/', async (req, res) => {
  try {
    const listings = await Listing.find().sort({ createdAt: -1 }).limit(8);
    res.render('index', {
      title: 'Home',
      categories: [
        { slug: 'textbooks', name: 'Textbooks', icon: '📚', description: 'New and used course materials' },
        { slug: 'clothes', name: 'Clothes', icon: '👕', description: 'Clothes and other school merchandise' },
        { slug: 'supplies', name: 'School Supplies', icon: '🎒', description: 'Calculators, drawing sets & more' },
        { slug: 'electronics', name: 'Electronics', icon: '💻', description: 'Laptops, tablets & accessories' },
        { slug: 'others', name: 'Miscellaneous', icon: '📦', description: 'Everything else you need' }
      ],
      listings,
    });
  } catch (err) {
    console.error(err);
    res.render('index', { title: 'Home', categories: [], listings: [] });
  }
});

router.get('/browse', async (req, res) => {
  try {
    const category = req.query.category;
    let listings = category ? await Listing.find({ category: category }) : await Listing.find();
    res.render('browse', { title: 'Browse Listings', listings });
  } catch (err) {
    console.error(err);
    res.render('browse', { title: 'Browse Listings', listings: [] });
  }
});

router.get('/product/:id', async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id).populate('seller');
    if (!listing) throw new Error('Listing not found');

    const sellerProfile = await Profile.findOne({ dlsuEmail: listing.seller.dlsuEmail });
    
    if (sellerProfile) {
      listing.seller.profileImage = sellerProfile.profileImage?.trim() || '';
      listing.seller.contactNumber = sellerProfile.contactNumber || '';
      listing.seller.facebook = sellerProfile.facebook || '';
    }

    res.render('product-details', {
      title: listing.title || 'Product Details',
      listing
    });
  } catch (err) {
    console.error(err);
    res.status(404).render('404', { title: 'Product Not Found' });
  }
});

router.get('/login', (req, res) => {
  if (req.user) return res.redirect('/');
  res.render('login', { title: 'Login', error: req.flash('error') });
});

router.get('/register', (req, res) => {
  if (req.user) return res.redirect('/');
  res.render('register', { title: 'Register', error: req.flash('error') });
});

router.get('/forgot-password', (req, res) => {
  // If the user is already logged in, they don't need this page
  if (req.user) return res.redirect('/');
  res.render('forgot-password', { title: 'Recover Account' });
});

// Static pages
router.get('/about', (req, res) => res.render('about', { title: 'About Us' }));
router.get('/privacy-policy', (req, res) => res.render('privacy-policy', { title: 'Privacy Policy' }));
router.get('/safety-guidelines', (req, res) => res.render('safety-guidelines', { title: 'Safety Guidelines' }));
router.get('/terms-of-service', (req, res) => res.render('terms-of-service', { title: 'Terms of Service' }));

// --- PROTECTED ROUTES ---

router.get(
  '/profile', 
  authController.authorizeRoles('Administrator', 'Manager', 'Customer'), 
  async (req, res) => {
    const profile = await Profile.findOne({ dlsuEmail: req.user.dlsuEmail });
    const listings = await Listing.find({ seller: req.user._id });

    if (profile?.profileImage) {
      req.user.profileImage = profile.profileImage.trim();
    }

    res.render('profile', { 
      user: req.user, 
      profile, 
      listings,
      // Pass the session variables we set during the login controller
      lastSuccess: req.session.previousSuccessfulLogin,
      lastFailed: req.session.previousFailedLogin
    });
  }
);

router.get(
  '/sell', 
  authController.authorizeRoles('Administrator', 'Manager', 'Customer'), 
  (req, res) => {
    res.render('sell', {
      title: 'Sell an Item',
      success: req.query.success === 'true'
    });
  }
);

// --- ADMINISTRATOR ONLY ROUTES ---

router.get(
  '/admin/logs', 
  authController.authorizeRoles('Administrator'), 
  adminController.getLogs
);

module.exports = router;