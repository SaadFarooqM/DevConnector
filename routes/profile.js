const express = require('express');
const router = express.Router();

// @route     Get api/profile
// @desc      Test Route
// @access    Public
router.get('/', (req, res) => {
 res.send('profile Routes');
});

module.exports = router;