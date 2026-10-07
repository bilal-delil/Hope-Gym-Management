import React from 'react';

import { Icon } from '@chakra-ui/react';
import {
  MdHome,
  MdPeople,
  MdCardMembership,
  MdCheckCircle,
  MdPayment,
  MdCampaign,
  MdFitnessCenter,
  MdCalendarMonth,
  MdPerson,
  MdLock,
  MdBarChart,
  MdSettings,
  MdSportsGymnastics,
} from 'react-icons/md';

// Admin Imports
import MainDashboard from 'views/admin/default';
import Profile from 'views/admin/profile';
import DataTables from 'views/admin/dataTables';
import ComingSoon from 'views/admin/comingSoon';

// Auth Imports
import SignInCentered from 'views/auth/signIn';

const routes = [
  // ── MAIN ──────────────────────────────────────────────
  {
    name: 'Dashboard',
    layout: '/admin',
    path: '/default',
    icon: <Icon as={MdHome} width='20px' height='20px' color='inherit' />,
    component: <MainDashboard />,
  },

  // ── MEMBERS ───────────────────────────────────────────
  {
    name: 'Members',
    layout: '/admin',
    path: '/members',
    icon: <Icon as={MdPeople} width='20px' height='20px' color='inherit' />,
    component: <ComingSoon pageName='Members' />,
  },

  // ── MEMBERSHIPS ───────────────────────────────────────
  {
    name: 'Memberships',
    layout: '/admin',
    path: '/memberships',
    icon: (
      <Icon as={MdCardMembership} width='20px' height='20px' color='inherit' />
    ),
    component: <ComingSoon pageName='Memberships' />,
  },

  // ── ATTENDANCE ────────────────────────────────────────
  {
    name: 'Attendance',
    layout: '/admin',
    path: '/attendance',
    icon: (
      <Icon as={MdCheckCircle} width='20px' height='20px' color='inherit' />
    ),
    component: <ComingSoon pageName='Attendance' />,
  },

  // ── PAYMENTS ──────────────────────────────────────────
  {
    name: 'Payments',
    layout: '/admin',
    path: '/payments',
    icon: <Icon as={MdPayment} width='20px' height='20px' color='inherit' />,
    component: <ComingSoon pageName='Payments' />,
  },

  // ── CONTENT & ANNOUNCEMENTS ───────────────────────────
  {
    name: 'Content Feed',
    layout: '/admin',
    path: '/content-feed',
    icon: <Icon as={MdCampaign} width='20px' height='20px' color='inherit' />,
    component: <ComingSoon pageName='Content Feed' />,
  },
  {
    name: 'Announcements',
    layout: '/admin',
    path: '/announcements',
    icon: <Icon as={MdCampaign} width='20px' height='20px' color='inherit' />,
    component: <ComingSoon pageName='Announcements' />,
  },

  // ── CLASSES & TRAINERS ────────────────────────────────
  {
    name: 'Classes',
    layout: '/admin',
    path: '/classes',
    icon: (
      <Icon as={MdFitnessCenter} width='20px' height='20px' color='inherit' />
    ),
    component: <ComingSoon pageName='Classes' />,
  },
  {
    name: 'Trainers',
    layout: '/admin',
    path: '/trainers',
    icon: (
      <Icon
        as={MdSportsGymnastics}
        width='20px'
        height='20px'
        color='inherit'
      />
    ),
    component: <ComingSoon pageName='Trainers' />,
  },

  // ── SCHEDULE ──────────────────────────────────────────
  {
    name: 'Schedule',
    layout: '/admin',
    path: '/schedule',
    icon: (
      <Icon as={MdCalendarMonth} width='20px' height='20px' color='inherit' />
    ),
    component: <ComingSoon pageName='Schedule' />,
  },

  // ── REPORTS ───────────────────────────────────────────
  {
    name: 'Reports',
    layout: '/admin',
    path: '/reports',
    icon: <Icon as={MdBarChart} width='20px' height='20px' color='inherit' />,
    component: <DataTables />,
  },

  // ── ACCOUNT ───────────────────────────────────────────
  {
    name: 'Profile',
    layout: '/admin',
    path: '/profile',
    icon: <Icon as={MdPerson} width='20px' height='20px' color='inherit' />,
    component: <Profile />,
  },
  {
    name: 'Settings',
    layout: '/admin',
    path: '/settings',
    icon: <Icon as={MdSettings} width='20px' height='20px' color='inherit' />,
    component: <ComingSoon pageName='Settings' />,
  },

  // ── AUTH ──────────────────────────────────────────────
  {
    name: 'Sign In',
    layout: '/auth',
    path: '/sign-in',
    icon: <Icon as={MdLock} width='20px' height='20px' color='inherit' />,
    component: <SignInCentered />,
  },
];

export default routes;
