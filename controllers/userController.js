const User = require('../models/user');
const Profile = require('../models/profile');

// GET /api/user/data
const getUserProfileData = async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'Not logged in' });
  }

  try {
    const profile = await Profile.findOne({ dlsuEmail: req.user.dlsuEmail });

    res.json({
      fullName: req.user.fullName,
      studentId: req.user.studentId,
      dlsuEmail: req.user.dlsuEmail,
      profileImage: profile?.profileImage || '',
      contactNumber: profile?.contactNumber || '',
      facebook: profile?.facebook || '',
      bio: profile?.bio || ' ',
      listings: [] // you can populate this later
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/user/update
const updateUserProfile = async (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ message: 'Not logged in' });

  try {
    const update = {};

    // Update full name
    if (req.body.fullName && req.body.fullName.trim() !== '') {
      await User.findByIdAndUpdate(req.user._id, { fullName: req.body.fullName.trim() });
    }

    // Optional fields
    if (req.body.contactNumber) update.contactNumber = req.body.contactNumber;
    if (req.body.facebook) update.facebook = req.body.facebook;

    if (req.body.bio !== undefined) {
      const existingProfile = await Profile.findOne({ dlsuEmail: req.user.dlsuEmail });
      update.bio = req.body.bio.trim() === '' ? existingProfile?.bio || '' : req.body.bio;
    }

    // Profile image upload
    if (req.file) {
      update.profileImage = '/uploads/profile-pictures/' + req.file.filename;
    }

    // Update or create Profile document
    await Profile.findOneAndUpdate(
      { dlsuEmail: req.user.dlsuEmail },
      update,
      { new: true, upsert: true }
    );

    res.json({ message: 'Profile updated!' });
  } catch (err) {
    console.error('Update failed:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getUserProfileData,
  updateUserProfile
};
