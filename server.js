const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const bodyParser = require("body-parser"); 
const User = require("./models/user");  
const Listing = require("./models/listing");
const webRoutes = require('./routes/webRoutes');
const listingRoutes = require('./routes/listingRoutes');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const passport = require('passport');
const session = require('express-session');
const connectDB = require('./config/db');
const moment = require('moment');
const flash = require('connect-flash');
const Profile = require('./models/profile');
const { logEvent } = require('./utils/logger');
require("dotenv").config();
require('./config/passport');
const exphbs = require('express-handlebars');
const Handlebars = require('handlebars');
const { allowInsecurePrototypeAccess } = require('@handlebars/allow-prototype-access');
const app = express();
const PORT = 3000;


// Connect to MongoDB
connectDB();

app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false,
    maxAge: 24 * 60 * 60 * 1000 // 1 day
  }
}));


app.use(flash()); //so we can use flash
app.use(passport.initialize());
app.use(passport.session());
 
// Configure Handlebars as your view engine
app.engine('hbs', exphbs.engine({
  extname: '.hbs',
  defaultLayout: 'main',
  handlebars: allowInsecurePrototypeAccess(Handlebars),
  helpers: {
    block: function(name) {
      var blocks = this._blocks || (this._blocks = {});
      var content = blocks[name] || [];
      return content.join('\n');
    },
    contentFor: function(name, options) {
      var blocks = this._blocks || (this._blocks = {});
      var block = blocks[name] || (blocks[name] = []);
      block.push(options.fn(this));
    },
    formatDate: function(date, format) {
      if (!date) return '';
      const momentDate = moment(date);
      if (!momentDate.isValid()) return '';
      return momentDate.format(format);
    },
    capitalize: function(text) {
      if (!text) return "";
      return text.charAt(0).toUpperCase() + text.slice(1);
    },
    eq: (a, b) => String(a) === String(b)
  }
}));

app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

app.use(async (req, res, next) => {
  res.locals.user = null;

  if (req.isAuthenticated && req.isAuthenticated()) {
    try {
      const profile = await Profile.findOne({ dlsuEmail: req.user.dlsuEmail });

      res.locals.user = {
        _id: req.user._id,
        fullName: req.user.fullName,
        dlsuEmail: req.user.dlsuEmail,
        profileImage: profile?.profileImage?.trim() || '/images/default.png'
      };
    } catch (err) {
      console.error('Profile fetch error:', err);
    }
  }

  next();
});

// 6. Routes (AFTER all middleware)
app.use('/', webRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);

// 7. Error Handling (Required Controls)

// Handle 404 - Page Not Found
app.use((req, res, next) => {
  res.status(404).render('404', { 
    title: '404 - Not Found',
    message: 'The resource you are looking for could not be found or you do not have access to it.'
  });
});

// Secure Global Error Handler (Requirement 2.4.1 & 2.4.2)
app.use(async (err, req, res, next) => {
  // Log the actual stack trace and error message internally to your database
  // This allows administrators to debug without exposing the vulnerability to the user
  await logEvent(
    'SYSTEM_ERROR', 
    `Application Error: ${err.message} | Route: ${req.originalUrl}`, 
    req, 
    req.user ? req.user._id : null
  );

  // Serve a generic response to the user
  // STRICT RULE: Never pass 'err', 'err.message', or 'err.stack' to the view engine
  res.status(500).render('error', {
    title: 'Internal Server Error',
    message: 'An unexpected system error occurred. Please try again later.'
  });
});

// 8. Server Start
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

