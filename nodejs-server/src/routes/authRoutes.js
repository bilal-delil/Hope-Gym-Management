const express = require('express');
const authController = require('../controllers/authController');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.post(
  '/login',
  authController.loginValidators,
  validate,
  authController.login
);

router.get('/me', authenticate, authController.me);

module.exports = router;
