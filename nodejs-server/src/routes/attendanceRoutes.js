const express = require('express');
const attendanceController = require('../controllers/attendanceController');
const validate = require('../middleware/validate');

const router = express.Router();

router.get('/', attendanceController.list);
router.get('/:id', attendanceController.getById);
router.post(
  '/check-in',
  attendanceController.checkInValidators,
  validate,
  attendanceController.checkIn
);
router.post('/:id/check-out', attendanceController.checkOut);
router.delete('/:id', attendanceController.remove);

module.exports = router;
