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



// 7. Error Handling (Optional)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error');
});

// 8. Server Start
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

