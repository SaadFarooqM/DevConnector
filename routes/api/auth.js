const auth = require('../../middleware/auth');
const bcrypt = require('bcryptjs');
const express = require('express');
const { check, validationResult } = require('express-validator');
const config = require('config');
const jwt = require('jsonwebtoken');
const router = express.Router();
const UserModel = require('../../models/User.model');

// @route     Get api/auth
// @desc      User Auth Route
// @access    Public
router.get('/', auth, async (req, res) => {
 try {
  const user = await UserModel.findById(req.user.id).select('-password');
  res.json(user);
 } catch (error) {
  console.error(error.message);
  res.status(500).send('Server Error');
 }
});

// @route     POST api/auth
// @desc      Authenticate User & get token
// @access    Public
router.post(
 '/',
 [
  check('email', 'Please include a valid email address').isEmail(),
  check('password', 'Password is required!').exists(),
 ],
 async (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
   return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
   let user = await UserModel.findOne({ email });
   if (!user) {
    return res.status(400).json({ errors: [{ msg: 'Invalid Credentials' }] });
   }

   const isMatch = await bcrypt.compare(password, user.password);

   if (!isMatch) {
    return res.status(400).json({ errors: [{ msg: 'Invalid Credentials' }] });
   }
   const payload = {
    user: {
     id: user.id,
    },
   };

   jwt.sign(
    payload,
    config.get('jwtSecret'),
    { expiresIn: 3600 },
    async (err, token) => {
     if (err) throw err;
     res.json({ token });
    }
   );
  } catch (error) {
   console.error(error.message);
   res.status(500).send('Server Error');
  }
 }
);

module.exports = router;
