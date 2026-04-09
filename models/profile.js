const mongoose = require('mongoose');

const ProfileSchema = new mongoose.Schema({
  dlsuEmail: { 
    type: String, 
    required: true, 
    unique: true },
  contactNumber: { type: String, default: '' },
  facebook: { type: String, default: '' },
  profileImage: { type: String, default: '' },
  bio: { type: String, default: '' }
});

module.exports = mongoose.model('Profile', ProfileSchema);