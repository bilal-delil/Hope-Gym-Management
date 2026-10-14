const express = require('express');
const memberPaymentsController = require('../controllers/memberPaymentsController');
const memberAppController = require('../controllers/memberAppController');
const validate = require('../middleware/validate');
const { handlePaymentProofUpload } = require('../middleware/upload');
const { memberOnly } = require('../middleware/auth');

const router = express.Router();

router.use(memberOnly);

router.get('/me', memberAppController.me);
router.put(
  '/me',
  memberAppController.updateProfileValidators,
  validate,
  memberAppController.updateMe
);
router.get('/overview', memberAppController.overview);
router.get('/plans', memberAppController.listPlans);

router.get('/schedules', memberAppController.listSchedules);
router.post('/schedules/:id/book', memberAppController.bookSchedule);
router.get('/bookings', memberAppController.listBookings);

router.get('/attendance', memberAppController.listAttendance);
router.post('/attendance/check-in', memberAppController.checkIn);
router.post('/attendance/check-out', memberAppController.checkOut);

router.get('/announcements', memberAppController.listAnnouncements);
router.get('/trainers', memberAppController.listTrainers);
router.get('/content', memberAppController.listContent);
router.get('/content/:id', memberAppController.getContent);

router.get('/payments', memberPaymentsController.listMine);
router.post(
  '/payments',
  handlePaymentProofUpload,
  memberPaymentsController.createValidators,
  validate,
  memberPaymentsController.submitMine
);

module.exports = router;
