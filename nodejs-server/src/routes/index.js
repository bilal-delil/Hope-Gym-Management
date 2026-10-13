const express = require('express');
const { authenticate } = require('../middleware/auth');

const authRoutes = require('./authRoutes');
const profileRoutes = require('./profileRoutes');
const membersRoutes = require('./membersRoutes');
const membershipPlansRoutes = require('./membershipPlansRoutes');
const membershipsRoutes = require('./membershipsRoutes');
const attendanceRoutes = require('./attendanceRoutes');
const paymentsRoutes = require('./paymentsRoutes');
const contentRoutes = require('./contentRoutes');
const announcementsRoutes = require('./announcementsRoutes');
const trainersRoutes = require('./trainersRoutes');
const classesRoutes = require('./classesRoutes');
const schedulesRoutes = require('./schedulesRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const reportsRoutes = require('./reportsRoutes');
const settingsRoutes = require('./settingsRoutes');
const notificationsRoutes = require('./notificationsRoutes');
const searchRoutes = require('./searchRoutes');

const router = express.Router();

router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Hope Gym API is running',
    timestamp: new Date().toISOString(),
  });
});

router.use('/auth', authRoutes);

router.use(authenticate);

router.use('/profile', profileRoutes);
router.use('/members', membersRoutes);
router.use('/membership-plans', membershipPlansRoutes);
router.use('/memberships', membershipsRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/payments', paymentsRoutes);
router.use('/content', contentRoutes);
router.use('/announcements', announcementsRoutes);
router.use('/trainers', trainersRoutes);
router.use('/classes', classesRoutes);
router.use('/schedules', schedulesRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/reports', reportsRoutes);
router.use('/settings', settingsRoutes);
router.use('/notifications', notificationsRoutes);
router.use('/search', searchRoutes);

module.exports = router;
