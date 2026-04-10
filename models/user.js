const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  dlsuEmail: { 
    type: String, 
    required: true, 
    unique: true,
    match: [/^[a-zA-Z0-9._%+-]+@dlsu\.edu\.ph$/, 'Please use a valid DLSU email']
  },
  studentId: { 
    type: String, 
    required: true, 
    unique: true,
    match: [/^\d{8}$/, 'Student ID must be 8 digits']
  },
  password: { type: String, required: true },
  
  // --- NEW SECURITY FIELDS ---

  // 1. Role-Based Access Control
  role: { 
    type: String, 
    enum: ['Administrator', 'Manager', 'Customer'], 
    default: 'Customer' 
  },

  // 2. Brute Force Protection (Account Lockout)
  loginAttempts: { type: Number, required: true, default: 0 },
  lockUntil: { type: Date },

  // 3. Password Management (Age & Re-use prevention)
  passwordChangedAt: { type: Date, default: Date.now },
  passwordHistory: [{ type: String }], // Stores previous hashes

  // 4. Login Tracking
  lastSuccessfulLogin: { type: Date },
  lastFailedLogin: { type: Date },

  createdAt: { type: Date, default: Date.now },

  // 5. Password Reset Security Question (Requirement 2.1.9)
  securityQuestion: { 
    type: String, 
    required: true,
    enum: [
      'What is the exact make, model, and year of your first car?',
      'What is the full name of the hospital where your youngest sibling was born?',
      'What were the exact cross streets of the neighborhood you lived in during third grade?',
      'What was the specific serial number or tag of your first childhood stuffed animal?'
    ] // These enforce "sufficiently random answers" compared to "Favorite color"
  },
  securityAnswer: { type: String, required: true }, // This will be hashed
});

// Virtual property to check if account is currently locked
userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Hash password before saving
// Hash password AND security answer before saving
userSchema.pre('save', async function(next) {
  // Hash the password if modified
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 12);
    this.passwordHistory.push(this.password);
    if (this.passwordHistory.length > 5) {
      this.passwordHistory.shift();
    }
    this.passwordChangedAt = Date.now();
  }

  // Hash the security answer if modified
  if (this.isModified('securityAnswer')) {
    this.securityAnswer = await bcrypt.hash(this.securityAnswer, 12);
  }
  
  next();
});

module.exports = mongoose.model('User', userSchema);