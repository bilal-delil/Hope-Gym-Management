const express = require('express');
const paymentsController = require('../controllers/paymentsController');
const validate = require('../middleware/validate');
const { handlePaymentProofUpload } = require('../middleware/upload');
const { authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/pending', paymentsController.listPending);
router.get('/', paymentsController.list);
router.get('/:id', paymentsController.getById);

router.post(
  '/',
  handlePaymentProofUpload,
  paymentsController.createValidators,
  validate,
  paymentsController.create
);

router.post(
  '/:id/approve',
  authorize('admin', 'staff'),
  paymentsController.approve
);

router.post(
  '/:id/decline',
  authorize('admin', 'staff'),
  paymentsController.declineValidators,
  validate,
  paymentsController.decline
);

router.delete('/:id', authorize('admin'), paymentsController.remove);

module.exports = router;
