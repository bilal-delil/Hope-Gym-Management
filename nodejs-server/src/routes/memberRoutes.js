const express = require('express');
const memberPaymentsController = require('../controllers/memberPaymentsController');
const validate = require('../middleware/validate');
const { handlePaymentProofUpload } = require('../middleware/upload');
const { memberOnly } = require('../middleware/auth');

const router = express.Router();

router.use(memberOnly);

router.get('/payments', memberPaymentsController.listMine);
router.post(
  '/payments',
  handlePaymentProofUpload,
  memberPaymentsController.createValidators,
  validate,
  memberPaymentsController.submitMine
);

module.exports = router;
