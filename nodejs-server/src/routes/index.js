const express = require('express');
const { authenticate, adminOnly } = require('../middleware/auth');

const authRoutes = require('./authRoutes');
const profileRoutes = require('./profileRoutes');
const memberRoutes = require('./memberRoutes');
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
const bookingsRoutes = require('./bookingsRoutes');
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
router.use('/notifications', notificationsRoutes);
router.use('/member', memberRoutes);

router.use('/members', adminOnly, membersRoutes);
router.use('/membership-plans', adminOnly, membershipPlansRoutes);
router.use('/memberships', adminOnly, membershipsRoutes);
router.use('/attendance', adminOnly, attendanceRoutes);
router.use('/payments', adminOnly, paymentsRoutes);
router.use('/content', adminOnly, contentRoutes);
router.use('/announcements', adminOnly, announcementsRoutes);
router.use('/trainers', adminOnly, trainersRoutes);
router.use('/classes', adminOnly, classesRoutes);
router.use('/schedules', adminOnly, schedulesRoutes);
router.use('/bookings', adminOnly, bookingsRoutes);
router.use('/dashboard', adminOnly, dashboardRoutes);
router.use('/reports', adminOnly, reportsRoutes);
router.use('/settings', adminOnly, settingsRoutes);
router.use('/search', adminOnly, searchRoutes);

module.exports = router;
