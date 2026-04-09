const mongoose = require("mongoose");

const listingSchema = new mongoose.Schema({
  title: String,
  description: String,
  price: Number,
  image: String,
  condition: {
    type: String,
    required: true,
    enum: ['Brand new', 'Like new', 'Lightly used', 'Used', 'Heavily used']
  },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  category: String,
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Listing", listingSchema);