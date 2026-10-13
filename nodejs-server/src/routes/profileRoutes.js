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

router.put(
  '/password',
  profileController.passwordValidators,
  validate,
  profileController.changePassword
);

module.exports = router;
