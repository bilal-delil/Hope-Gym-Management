const express = require('express');
const profileController = require('../controllers/profileController');
const validate = require('../middleware/validate');

const router = express.Router();

router.put(
  '/',
  profileController.updateValidators,
  validate,
  profileController.updateProfile
);

module.exports = router;
