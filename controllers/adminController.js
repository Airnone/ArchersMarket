// controllers/adminController.js
const Log = require('../models/log');

exports.getLogs = async (req, res) => {
  try {
    // 1. Setup the filter based on frontend query parameters
    const filter = {};
    if (req.query.eventType && req.query.eventType !== 'ALL') {
      filter.eventType = req.query.eventType;
    }

    // 2. Fetch the logs from the database
    // We sort by timestamp descending (-1) so the newest logs appear first
    // We populate the 'user' field to show who triggered the event
    const logs = await Log.find(filter)
      .populate('user', 'dlsuEmail fullName role')
      .sort({ timestamp: -1 })
      .lean(); // .lean() converts Mongoose documents to plain JS objects for Handlebars

    // 3. Render the page and pass the data
    res.render('admin-logs', {
      title: 'System Audit Logs',
      logs,
      currentFilter: req.query.eventType || 'ALL'
    });
  } catch (err) {
    // Secure failure: render the generic error page
    res.status(500).render('error', { 
      title: 'Internal Server Error',
      message: 'Failed to load system logs.' 
    });
  }
};