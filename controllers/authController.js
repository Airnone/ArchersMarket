// controllers/authController.js
const User = require('../models/user');
const Profile = require('../models/profile');
const bcrypt = require('bcryptjs');
const { logEvent } = require('../utils/logger');

// Validation Regular Expressions
const emailRegex = /^[a-zA-Z0-9._%+-]+@dlsu\.edu\.ph$/;
const studentIdRegex = /^\d{8}$/;
// Password must be 8-64 characters, with at least one uppercase, one lowercase, one number, and one special character
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,64}$/;

exports.requireAuth = (req, res, next) => {
    if (req.isAuthenticated()) return next();
    req.session.returnTo = req.originalUrl;
    res.redirect('/login');
};

// New RBAC Middleware
exports.authorizeRoles = (...allowedRoles) => {
  return async (req, res, next) => {
    // 1. Ensure the user is actually logged in first
    if (!req.isAuthenticated()) {
      if (req.xhr || req.headers.accept.indexOf('json') > -1) {
        return res.status(401).json({ message: 'Authentication required.' });
      }
      return res.redirect('/login');
    }

    // 2. Check if the user's role is in the list of allowed roles
    if (!allowedRoles.includes(req.user.role)) {
      
      // 3. Log the access control failure (Requirement 2.4.7)
      await logEvent(
        'ACCESS_DENIED',
        `User ${req.user.dlsuEmail} (Role: ${req.user.role}) attempted to access restricted route: ${req.originalUrl}`,
        req,
        req.user._id
      );

      // 4. Fail securely (Requirement 2.2.2)
      // Check if it's an API request (expects JSON) or a web request (expects HTML)
      if (req.xhr || req.headers.accept.indexOf('json') > -1) {
        return res.status(403).json({ message: 'Forbidden: You do not have permission to perform this action.' });
      } else {
        // You can render your 'error.hbs' page here
        return res.status(403).render('error', { 
          title: 'Access Denied',
          message: 'You do not have the required permissions to view this page.' 
        });
      }
    }

    // User has the correct role, allow them to proceed
    next();
  };
};

exports.register = async (req, res, next) => {
  try {
    const { fullName, dlsuEmail, studentId, password, securityQuestion, securityAnswer } = req.body;

    // 1. Check if all fields exist
    if (!fullName || !dlsuEmail || !studentId || !password) {
      // Trigger the Audit Logger
      await logEvent(
        'VALIDATION_ERROR', 
        `Registration failed: Missing required fields. Email attempted: ${dlsuEmail || 'None'}`, 
        req
      );
      return res.status(400).json({ message: 'All fields are required.' });
    }

    // 2. Strict Input Validation (Length and Range/Format)
    if (!fullName || !dlsuEmail || !studentId || !password || !securityQuestion || !securityAnswer) {
      await logEvent('VALIDATION_ERROR', `Registration failed: Missing fields.`, req);
      return res.status(400).json({ message: 'All fields, including security questions, are required.' });
    }

    if (!emailRegex.test(dlsuEmail)) {
      return res.status(400).json({ message: 'Invalid email format. Must be a valid @dlsu.edu.ph email.' });
    }

    if (!studentIdRegex.test(studentId)) {
      return res.status(400).json({ message: 'Student ID must be exactly 8 digits.' });
    }

    // 3. Enforce Password Complexity and Length
    if (!passwordRegex.test(password)) {
      return res.status(400).json({ 
        message: 'Password must be between 8 and 64 characters and include at least one uppercase letter, one lowercase letter, one number, and one special character.' 
      });
    }

    // 4. Check for existing users
    const existingUser = await User.findOne({ $or: [{ dlsuEmail }, { studentId }] });
    if (existingUser) {
      return res.status(409).json({ message: 'Email or Student ID already exists in the system.' });
    }

    // 5. Create the new user
    // Note: The password will be automatically hashed by the Mongoose pre('save') hook we set up earlier
    const newUser = new User({ 
      fullName, 
      dlsuEmail, 
      studentId, 
      password,
      securityQuestion,
      securityAnswer,
      role: 'Customer' 
    });
    
    await newUser.save();
    
    // Create an empty profile for the user
    const existingProfile = await Profile.findOne({ dlsuEmail });
    if (!existingProfile) {
      await Profile.create({ dlsuEmail });
    }

    // Automatically log the user in after successful registration
    req.login(newUser, (err) => {
      if (err) return res.status(500).json({ message: 'Registration successful, but automatic login failed.' });

      return res.status(200).json({ 
        user: {
          _id: newUser._id,
          fullName: newUser.fullName,
          dlsuEmail: newUser.dlsuEmail,
          role: newUser.role
        }
      });
    });

  } catch (err) {
    res.status(500).json({ message: 'Registration failed due to a server error.' });
  }
};

exports.login = async (req, res, next) => {
  try {
    const { dlsuEmail, password } = req.body;

    // 1. Basic validation
    if (!dlsuEmail || !password) {
      await logEvent('VALIDATION_ERROR', 'Login failed: Missing email or password.', req);
      // REQUIREMENT 2.1.4: Generic error message
      return res.status(400).json({ message: 'Invalid email and/or password.' }); 
    }

    // 2. Find the user
    const user = await User.findOne({ dlsuEmail });

    if (!user) {
      await logEvent('AUTH_FAILURE', `Login failed: Non-existent email attempted (${dlsuEmail}).`, req);
      return res.status(401).json({ message: 'Invalid email and/or password.' }); 
    }

    // 3. Check if account is currently locked (REQUIREMENT 2.1.8)
    if (user.isLocked) {
      await logEvent('AUTH_FAILURE', `Login blocked: Account is currently locked.`, req, user._id);
      return res.status(403).json({ 
        message: 'Account is temporarily locked due to too many failed login attempts. Please try again later.' 
      });
    }

    // 4. Verify password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      // Increment failed login attempts
      user.loginAttempts += 1;
      user.lastFailedLogin = Date.now();

      // Lock account if attempts reach 5
      if (user.loginAttempts >= 5) {
        // Lock for 15 minutes (15 * 60 * 1000 ms)
        user.lockUntil = Date.now() + 15 * 60 * 1000;
        await logEvent('AUTH_FAILURE', `Account locked after 5 failed attempts.`, req, user._id);
      } else {
        await logEvent('AUTH_FAILURE', `Login failed: Incorrect password. Attempt ${user.loginAttempts}/5.`, req, user._id);
      }

      await user.save();
      return res.status(401).json({ message: 'Invalid email and/or password.' }); 
    }

    // 5. Successful Login - Reset attempts and update trackers
    
    // REQUIREMENT 2.1.12: Store previous login times in the session BEFORE we overwrite them
    // This allows the frontend to access these dates and display them to the user
    req.session.previousSuccessfulLogin = user.lastSuccessfulLogin || null;
    req.session.previousFailedLogin = user.lastFailedLogin || null;

    // Reset lockouts and update successful login time
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    user.lastSuccessfulLogin = Date.now();
    await user.save();

    // 6. Establish Passport Session
    req.login(user, async (err) => {
      if (err) {
         await logEvent('SYSTEM_ERROR', `Passport login error: ${err.message}`, req, user._id);
         return next(err);
      }
      
      await logEvent('AUTH_SUCCESS', `User logged in successfully.`, req, user._id);
      return res.status(200).json({ 
        message: 'Login successful.',
        redirectUrl: '/' // Or redirect to '/profile' or '/browse'
      });
    });

  } catch (err) {
    await logEvent('SYSTEM_ERROR', `Server error during login: ${err.message}`, req);
    res.status(500).json({ message: 'An internal server error occurred.' }); // Avoid sending err.message to user
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    // Always fetch a fresh copy of the user to ensure we have the latest password and history
    const user = await User.findById(req.user._id);

    if (!currentPassword || !newPassword) {
      await logEvent('VALIDATION_ERROR', 'Password change failed: Missing fields.', req, user._id);
      return res.status(400).json({ message: 'Both current and new passwords are required.' });
    }

    // 1. Re-authenticate the User (Requirement 2.1.13)
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      await logEvent('AUTH_FAILURE', 'Password change failed: Incorrect current password provided.', req, user._id);
      return res.status(401).json({ message: 'Incorrect current password.' });
    }

    // 2. Enforce Password Age (Requirement 2.1.11)
    const ONE_DAY_MS = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    const timeSinceLastChange = Date.now() - (user.passwordChangedAt ? user.passwordChangedAt.getTime() : 0);
    
    if (timeSinceLastChange < ONE_DAY_MS) {
      await logEvent('ACCESS_DENIED', 'Password change blocked: Password is less than 1 day old.', req, user._id);
      return res.status(403).json({ 
        message: 'You must wait at least 24 hours after your last change before updating your password again.' 
      });
    }

    // 3. Validate New Password Complexity
    if (!passwordRegex.test(newPassword)) {
      await logEvent('VALIDATION_ERROR', 'Password change failed: New password lacks complexity.', req, user._id);
      return res.status(400).json({ 
        message: 'New password must be 8-64 characters and include at least one uppercase, lowercase, number, and special character.' 
      });
    }

    // 4. Prevent Password Re-use (Requirement 2.1.10)
    // We loop through the saved history array and compare the newly submitted password against old hashes
    for (let oldHash of user.passwordHistory) {
      const isReused = await bcrypt.compare(newPassword, oldHash);
      if (isReused) {
        await logEvent('VALIDATION_ERROR', 'Password change blocked: Attempted to reuse a previous password.', req, user._id);
        return res.status(400).json({ message: 'You cannot reuse a previously used password. Please choose a new one.' });
      }
    }

    // 5. Save the New Password
    // We only set the raw string here; Mongoose handles the bcrypt hashing via the pre('save') hook
    user.password = newPassword;
    await user.save();

    await logEvent('AUTH_SUCCESS', 'User successfully changed their password.', req, user._id);
    
    return res.status(200).json({ message: 'Password updated successfully.' });

  } catch (err) {
    await logEvent('SYSTEM_ERROR', `Error during password change: ${err.message}`, req, req.user._id);
    return res.status(500).json({ message: 'An internal server error occurred.' });
  }
};

exports.resetPasswordWithQuestion = async (req, res) => {
  try {
    const { dlsuEmail, securityAnswer, newPassword } = req.body;

    if (!dlsuEmail || !securityAnswer || !newPassword) {
      return res.status(400).json({ message: 'Email, security answer, and new password are required.' });
    }

    const user = await User.findOne({ dlsuEmail });
    if (!user) {
      // Fail securely without revealing if the email exists
      await logEvent('AUTH_FAILURE', `Password reset failed: Invalid email attempted (${dlsuEmail}).`, req);
      return res.status(400).json({ message: 'Invalid request details provided.' });
    }

    // Verify the security answer (comparing the raw input to the hashed database value)
    const isAnswerCorrect = await bcrypt.compare(securityAnswer.toLowerCase().trim(), user.securityAnswer);
    if (!isAnswerCorrect) {
      await logEvent('AUTH_FAILURE', 'Password reset failed: Incorrect security answer.', req, user._id);
      return res.status(400).json({ message: 'Invalid request details provided.' });
    }

    // Validate New Password Complexity
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,64}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({ 
        message: 'New password must be 8-64 characters and include at least one uppercase, lowercase, number, and special character.' 
      });
    }

    // Prevent Password Re-use (Requirement 2.1.10)
    for (let oldHash of user.passwordHistory) {
      const isReused = await bcrypt.compare(newPassword, oldHash);
      if (isReused) {
        return res.status(400).json({ message: 'You cannot reuse a previously used password.' });
      }
    }

    // Save the new password (Mongoose pre-save hook handles the hashing)
    user.password = newPassword;
    await user.save();

    await logEvent('AUTH_SUCCESS', 'User reset password via security question.', req, user._id);
    return res.status(200).json({ message: 'Password has been successfully reset. You may now log in.' });

  } catch (err) {
    await logEvent('SYSTEM_ERROR', `Error during password reset: ${err.message}`, req);
    return res.status(500).json({ message: 'An internal server error occurred.' });
  }
};