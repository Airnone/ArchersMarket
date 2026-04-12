// models/log.js
const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
  timestamp: { 
    type: Date, 
    default: Date.now 
  },
  eventType: { 
    type: String, 
    required: true,
    enum: [
      'AUTH_SUCCESS', 
      'AUTH_FAILURE', 
      'AUTH_LOGOUT',
      'ACCESS_DENIED', 
      'VALIDATION_ERROR', 
      'ACCESS_SUCCESS',
      'LISTING_CREATE', 
      'LISTING_UPDATE',  
      'LISTING_DELETE',
      'SYSTEM_ERROR'
    ]
  },
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    default: null // Can be null if the user is unauthenticated or guessing a fake email
  },
  ipAddress: { 
    type: String 
  },
  description: { 
    type: String, 
    required: true 
  }
});

module.exports = mongoose.model('Log', logSchema);
