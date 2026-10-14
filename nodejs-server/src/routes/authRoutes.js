const express = require('express');
const authController = require('../controllers/authController');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.post(
  '/google/admin',
  authController.googleValidators,
  validate,
  authController.googleAdmin
);

router.post(
  '/google/member',
  authController.googleValidators,
  validate,
  authController.googleMember
);

router.get('/me', authenticate, authController.me);

module.exports = router;
