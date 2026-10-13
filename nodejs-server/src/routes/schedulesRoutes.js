const express = require('express');
const schedulesController = require('../controllers/schedulesController');
const validate = require('../middleware/validate');

const router = express.Router();

router.get('/', schedulesController.list);
router.get('/:id', schedulesController.getById);
router.post(
  '/',
  schedulesController.createValidators,
  validate,
  schedulesController.create
);
router.put(
  '/:id',
  schedulesController.updateValidators,
  validate,
  schedulesController.update
);
router.delete('/:id', schedulesController.remove);

router.post(
  '/:id/bookings',
  schedulesController.bookingValidators,
  validate,
  schedulesController.addBooking
);
router.put('/:id/bookings/:bookingId', schedulesController.updateBooking);
router.delete('/:id/bookings/:bookingId', schedulesController.removeBooking);

module.exports = router;
