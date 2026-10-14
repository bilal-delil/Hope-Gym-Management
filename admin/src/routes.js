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
  MdBarChart,
  MdSettings,
  MdSportsGymnastics,
} from 'react-icons/md';

import MainDashboard from 'views/admin/default';
import MembersPage from 'views/admin/members';
import MembershipsPage from 'views/admin/memberships';
import AttendancePage from 'views/admin/attendance';
import PaymentsPage from 'views/admin/payments';
import ContentFeedPage from 'views/admin/contentFeed';
import AnnouncementsPage from 'views/admin/announcements';
import ClassesPage from 'views/admin/classes';
import TrainersPage from 'views/admin/trainers';
import SchedulePage from 'views/admin/schedule';
import ReportsPage from 'views/admin/reports';
import Profile from 'views/admin/profile';
import SettingsPage from 'views/admin/settings';
import SignInCentered from 'views/auth/signIn';

const routes = [
  {
    name: 'Dashboard',
    layout: '/admin',
    path: '/default',
    icon: <Icon as={MdHome} width='20px' height='20px' color='inherit' />,
    component: <MainDashboard />,
  },
  {
    name: 'Members',
    layout: '/admin',
    path: '/members',
    icon: <Icon as={MdPeople} width='20px' height='20px' color='inherit' />,
    component: <MembersPage />,
  },
  {
    name: 'Memberships',
    layout: '/admin',
    path: '/memberships',
    icon: (
      <Icon as={MdCardMembership} width='20px' height='20px' color='inherit' />
    ),
    component: <MembershipsPage />,
  },
  {
    name: 'Attendance',
    layout: '/admin',
    path: '/attendance',
    icon: (
      <Icon as={MdCheckCircle} width='20px' height='20px' color='inherit' />
    ),
    component: <AttendancePage />,
  },
  {
    name: 'Payments',
    layout: '/admin',
    path: '/payments',
    icon: <Icon as={MdPayment} width='20px' height='20px' color='inherit' />,
    component: <PaymentsPage />,
  },
  {
    name: 'Content Feed',
    layout: '/admin',
    path: '/content-feed',
    icon: <Icon as={MdCampaign} width='20px' height='20px' color='inherit' />,
    component: <ContentFeedPage />,
  },
  {
    name: 'Announcements',
    layout: '/admin',
    path: '/announcements',
    icon: <Icon as={MdCampaign} width='20px' height='20px' color='inherit' />,
    component: <AnnouncementsPage />,
  },
  {
    name: 'Classes',
    layout: '/admin',
    path: '/classes',
    icon: (
      <Icon as={MdFitnessCenter} width='20px' height='20px' color='inherit' />
    ),
    component: <ClassesPage />,
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
    component: <TrainersPage />,
  },
  {
    name: 'Schedule',
    layout: '/admin',
    path: '/schedule',
    icon: (
      <Icon as={MdCalendarMonth} width='20px' height='20px' color='inherit' />
    ),
    component: <SchedulePage />,
  },
  {
    name: 'Reports',
    layout: '/admin',
    path: '/reports',
    icon: <Icon as={MdBarChart} width='20px' height='20px' color='inherit' />,
    component: <ReportsPage />,
  },
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
    component: <SettingsPage />,
  },
  {
    name: 'Sign In',
    layout: '/auth',
    path: '/sign-in',
    hideInSidebar: true,
    component: <SignInCentered />,
  },
];

export default routes;
