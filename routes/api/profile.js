const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const { check, validationResult } = require('express-validator/check');
const ProfileModel = require('../../models/Profile.model');
const UserModel = require('../../models/User.model');

// @route     Get api/profile/me
// @desc      Get current user Route
// @access    private
router.get('/me', auth, async (req, res) => {
 try {
  const profile = await ProfileModel.findOne({ user: req.user.id }).populate(
   'user',
   ['name', 'avatar']
  );
  if (!profile) {
   return res.status(400).json({ msg: 'There is no profile for this user' });
  }
  res.json(profile);
 } catch (error) {
  console.error(error.message);
  res.status(500).send('Server Error');
 }
});

// @route     GET api/profile
// @desc      GET all profiles
// @access    public

router.get('/', async (req, res) => {
 try {
  const profiles = await ProfileModel.find().populate('user', [
   'name',
   'avatar',
  ]);
  res.json(profiles);
 } catch (error) {
  console.error(error.message);
  res.status(500).send('Server Error');
 }
});

// @route     GET api/profile/user/:id
// @desc      GET profile by user id
// @access    public

router.get('/user/:id', async (req, res) => {
 try {
  const profile = await ProfileModel.findOne({ user: req.params.id }).populate(
   'user',
   ['name', 'avatar']
  );
  if (!profile) {
   return res.status(400).json({ msg: 'User Profile Not Found' });
  }
  res.json(profile);
 } catch (error) {
  console.error(error.message);
  if (error.kind === 'ObjectId') {
   return res.status(400).json({ msg: 'User Profile Not Found' });
  }
  res.status(500).send('Server Error');
 }
});

// @route     POST api/profile
// @desc      Create or update a user profile
// @access    private
router.post(
 '/',
 [
  auth,
  [
   check('status', 'Status is required').not().isEmpty(),
   check('skills', 'Skills are required').not().isEmpty(),
  ],
 ],
 async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
   return res.status(400).json({ errors: errors.array() });
  }
  const {
   company,
   website,
   location,
   bio,
   status,
   githubusername,
   skills,
   youtube,
   facebook,
   twitter,
   instagram,
   linkedin,
  } = req.body;

  // Build profile Object

  const profileFields = {};
  profileFields.user = req.user.id;
  if (company) profileFields.company = company;
  if (website) profileFields.website = website;
  if (location) profileFields.location = location;
  if (bio) profileFields.bio = bio;
  if (status) profileFields.status = status;
  if (githubusername) profileFields.githubusername = githubusername;
  if (skills) {
   profileFields.skills = skills.split(',').map((skill) => skill.trim());
  }

  //build social object

  profileFields.social = {};
  if (youtube) profileFields.social.youtube = youtube;
  if (facebook) profileFields.social.facebook = facebook;
  if (twitter) profileFields.social.twitter = twitter;
  if (instagram) profileFields.social.instagram = instagram;
  if (linkedin) profileFields.social.linkedin = linkedin;
  try {
   let profile = await ProfileModel.findOne({ user: req.user.id });
   if (profile) {
    //update
    profile = await ProfileModel.findOneAndUpdate(
     { user: req.user.id },
     { $set: profileFields },
     { new: true }
    );
    return res.json(profile);
   }
   //create
   profile = new ProfileModel(profileFields);
   await profile.save();
   res.json(profile);
  } catch (error) {
   console.error(error.message);
   res.status(500).send('Server Error');
  }
 }
);

// @route     PUT api/profile/experiene
// @desc      Add profile experience
// @access    private

router.put(
 '/experience',
 [
  auth,
  [
   check('title', 'Title is required').not().isEmpty(),
   check('company', 'Company is required').not().isEmpty(),
   check('from', 'From date is required').not().isEmpty(),
  ],
 ],
 async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
   return res.status(400).json({ errors: errors.array() });
  }

  const { title, company, location, from, to, current, description } = req.body;

  const newExperience = {
   title: title,
   company: company,
   location: location,
   from: from,
   to: to,
   current: current,
   description: description,
  };

  try {
   const profile = await ProfileModel.findOne({ user: req.user.id });
   profile.experience.unshift(newExperience);
   await profile.save();
   res.json(profile);
  } catch (error) {
   console.error(error.message);
   res.status(500).send('Server Error');
  }
 }
);

// @route     DELETE api/profile
// @desc      DELETE profile, user & posts
// @access    private

router.delete('/', auth, async (req, res) => {
 try {
  // @todo - remove users Posts
  //Remove profile from the database

  const profile = await ProfileModel.findOneAndRemove({ user: req.user.id });
  const user = await UserModel.findOneAndRemove({ _id: req.user.id });

  if (!(profile && user)) {
   return res.status(400).json({ msg: 'Invalid Request' });
  }
  res.json({ msg: 'Profile/User deleted', user: user, profile: profile });
 } catch (error) {
  console.error(error.message);
  res.status(500).send('Server Error');
 }
});

module.exports = router;
