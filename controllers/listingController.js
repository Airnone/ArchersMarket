const Listing = require('../models/listing');
const { logEvent } = require('../utils/logger'); // Import the audit logger

// Define approved categories matching your frontend
const VALID_CATEGORIES = ['textbooks', 'clothes', 'supplies', 'electronics', 'others'];

// Strict Validation Helper (No Sanitization)
const validateListingInput = (data) => {
  const { title, description, price, category, condition } = data;

  // Validate Title Length (5 to 100 characters)
  if (!title || typeof title !== 'string' || title.length < 5 || title.length > 100) {
    return 'Title must be between 5 and 100 characters.';
  }

  // Validate Description Length (10 to 2000 characters)
  if (!description || typeof description !== 'string' || description.length < 10 || description.length > 2000) {
    return 'Description must be between 10 and 2000 characters.';
  }

  // Validate Price Range (Must be a positive number under 1,000,000)
  const numPrice = Number(price);
  if (isNaN(numPrice) || numPrice <= 0 || numPrice > 1000000) {
    return 'Price must be a valid number between 1 and 1,000,000.';
  }

  // Validate Category (Must strictly match our predefined list)
  if (!VALID_CATEGORIES.includes(category)) {
    return 'Invalid category selected.';
  }

  // Validate Condition Length (2 to 50 characters)
  if (!condition || typeof condition !== 'string' || condition.length < 2 || condition.length > 50) {
    return 'Condition must be between 2 and 50 characters.';
  }

  return null; // Passes all validation
};

const getListings = async (req, res) => {
  try {
    const listings = await Listing.find().sort({ createdAt: -1 });
    res.render("browse", { listings });
  } catch (error) {
    res.status(500).send("Server error");
  }
};

const getListingById = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id).populate('seller');
    if (!listing) {
      return res.status(404).render("error", { message: "Listing not found" });
    }
    res.render("product-details", { listing });
  } catch (error) {
    res.status(500).send("Server error");
  }
};

const createListing = async (req, res) => {
  try {
    // 1. Strict Input Validation
    const validationError = validateListingInput(req.body);
    
    if (validationError) {
      // 2. Log the validation failure
      await logEvent(
        'VALIDATION_ERROR', 
        `Listing creation failed: ${validationError}. Category attempted: ${req.body.category || 'None'}`, 
        req, 
        req.user._id
      );
      // 3. Reject completely (no sanitization)
      return res.status(400).send(`Error: ${validationError}`);
    }

    const { title, description, price, category, condition } = req.body;
    
    // Default image fallback if no file is uploaded
    const image = req.file ? `/uploads/listings/${req.file.filename}` : '/uploads/listings/default.png';

    const listing = new Listing({
      title,
      description,
      price,
      category,
      condition,
      image,
      seller: req.user._id
    });

    await listing.save();
    res.redirect("/sell?success=true");
  } catch (err) {
    await logEvent('SYSTEM_ERROR', `Error creating listing: ${err.message}`, req, req.user._id);
    res.status(500).send('An internal server error occurred.');
  }
};

const deleteListing = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    
    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    // Role-Based Logic: Only the seller OR an Administrator/Manager can delete
    const isSeller = String(listing.seller) === String(req.user._id);
    const isModerator = req.user.role === 'Administrator' || req.user.role === 'Manager';

    if (!isSeller && !isModerator) {
      await logEvent('ACCESS_DENIED', `User attempted to delete a listing they do not own. Listing ID: ${listing._id}`, req, req.user._id);
      return res.status(403).json({ message: "Unauthorized to delete this listing" });
    }

    await Listing.findByIdAndDelete(req.params.id);
    await logEvent('ACCESS_SUCCESS', `Listing deleted successfully. Listing ID: ${req.params.id}`, req, req.user._id);
    res.status(200).redirect("/browse");
  } catch (error) {
    res.status(500).send("Server error");
  }
};

const editListing = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }

    // Ensure the user is the actual seller before editing
    if (String(listing.seller) !== String(req.user._id)) {
      await logEvent('ACCESS_DENIED', `User attempted to edit a listing they do not own. Listing ID: ${listing._id}`, req, req.user._id);
      return res.status(403).json({ message: "Unauthorized to edit this listing" });
    }

    // 1. Strict Input Validation
    const validationError = validateListingInput(req.body);
    
    if (validationError) {
      await logEvent(
        'VALIDATION_ERROR', 
        `Listing edit failed: ${validationError}. Listing ID: ${listing._id}`, 
        req, 
        req.user._id
      );
      return res.status(400).json({ message: validationError });
    }

    const { title, description, price, category, condition } = req.body;

    listing.title = title;
    listing.description = description;
    listing.price = price;
    listing.category = category;
    listing.condition = condition;

    if (req.file) {
      listing.image = `/uploads/listings/${req.file.filename}`;
    }

    await listing.save();
    res.status(200).send(listing._id); 
  } catch (err) {
    await logEvent('SYSTEM_ERROR', `Error editing listing: ${err.message}`, req, req.user._id);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getListings,
  getListingById,
  createListing,
  deleteListing,
  editListing
};