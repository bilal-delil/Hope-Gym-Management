const express = require('express');
const reportsController = require('../controllers/reportsController');

const router = express.Router();

router.get('/summary', reportsController.summary);
router.get('/members', reportsController.membersReport);
router.get('/payments', reportsController.paymentsReport);
router.get('/attendance', reportsController.attendanceReport);

module.exports = router;
