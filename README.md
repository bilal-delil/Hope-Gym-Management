# Hope Gym Management

Hope Gym Management is a web-based gym administration project designed to provide a modern foundation for managing gym operations through a centralized dashboard. The repository contains an administrator interface and a separate Progressive Web App (PWA) starter, making it possible to develop both internal management tools and a future member-facing experience within the same project.

## Project Overview

The project is organized into two main applications:

- **Admin Dashboard** — a React-based management interface for gym administrators and staff.
- **PWA** — a lightweight React and Vite application prepared for a progressive web experience.

The admin dashboard uses a responsive layout, reusable components, data tables, charts, profile management screens, authentication views, configurable navigation, and a theme system. It is structured to support the gradual implementation of gym-specific workflows such as member management, memberships, attendance, payments, classes, trainers, scheduling, announcements, and reports.

## Admin Dashboard

The administrative application is located in the `admin` directory. It is built with React and uses Chakra UI as its primary component and styling framework. React Router provides navigation between authentication pages and the administrative area, while ApexCharts and React Table support data visualization and tabular reporting.

The application includes:

- A main administrative dashboard.
- A responsive sidebar and navigation system.
- Authentication and sign-in screens.
- Member management navigation.
- Membership management navigation.
- Attendance navigation.
- Payment management navigation.
- Content feed and announcement navigation.
- Class and trainer navigation.
- Schedule navigation.
- Reports and data table views.
- User profile management.
- Settings navigation.
- Reusable cards, fields, charts, calendars, tables, menus, footers, scrollbars, and layout components.
- Light and dark theme support through Chakra UI theming.
- Right-to-left layout support.
- Responsive dashboard layouts for different screen sizes.

Several navigation sections are currently represented by coming-soon screens. These sections establish the planned information architecture for the gym management platform and provide clear extension points for implementing full business functionality in future development.

## PWA Application

The `pwa` directory contains a separate React application powered by Vite. It currently serves as an initialized starting point for a progressive web application that can later be expanded into a member or staff-facing interface.

The PWA currently includes:

- A Vite development setup.
- React and React DOM integration.
- A basic application shell.
- Responsive foundational styling.
- A dark visual theme with a radial background.
- A structure suitable for adding offline support, installability, mobile-first screens, member features, notifications, and other progressive web capabilities.

## Planned Functional Areas

The project navigation and dashboard structure are organized around the core operational areas of a gym management system:

### Member Management

The member area is intended to support the organization of gym member records, profiles, contact information, membership status, and related activity.

### Memberships

The membership area is intended to support membership plans, subscription periods, active and expired memberships, renewals, and membership-related administration.

### Attendance

The attendance area is intended to provide a way to record and review member visits, monitor attendance activity, and support gym usage reporting.

### Payments

The payments area is intended to support payment records, transaction tracking, membership payments, financial status, and payment-related reporting.

### Classes and Trainers

The classes and trainers areas are intended to support gym programs, class organization, trainer information, and the relationship between scheduled activities and staff members.

### Scheduling

The schedule area is intended to provide a centralized view of classes, appointments, training sessions, and other gym activities.

### Content and Announcements

The content feed and announcements areas are intended to provide communication tools for publishing updates, notices, promotions, and other information for gym members or staff.

### Reports

The reports area provides data table views and is intended to serve as the foundation for operational and management reporting.

## Technology Stack

### Admin Dashboard

- React 19
- React Router DOM
- Chakra UI
- Emotion
- React Icons
- ApexCharts
- React ApexCharts
- TanStack React Table
- React Calendar
- React Dropzone
- Framer Motion
- Create React App and React Scripts
- JavaScript and CSS

### PWA

- React 19
- React DOM
- Vite
- Vite React plugin
- JavaScript and CSS

## Repository Structure

```text
Hope-Gym-Management/
├── admin/
│   ├── public/              # Static files and application metadata
│   ├── src/
│   │   ├── assets/          # Styles, images, and visual resources
│   │   ├── components/      # Reusable UI components
│   │   ├── contexts/        # Shared React contexts
│   │   ├── layouts/         # Authentication, admin, and RTL layouts
│   │   ├── theme/           # Chakra UI theme configuration
│   │   ├── variables/       # Chart and interface data definitions
│   │   ├── views/           # Dashboard, profile, reports, and auth screens
│   │   ├── App.js           # Main application routing and provider setup
│   │   ├── index.js         # Application entry point
│   │   └── routes.js        # Navigation and route definitions
│   ├── package.json         # Admin application dependencies and scripts
│   └── README.md            # Admin application documentation
├── pwa/
│   ├── src/                 # PWA source files
│   ├── design.jpg           # PWA design reference
│   ├── index.html           # PWA HTML entry point
│   ├── package.json         # PWA dependencies and scripts
│   └── vite.config.js       # Vite configuration
└── README.md                # Project documentation
```

## Getting Started

### Prerequisites

Install the following before running the applications:

- Node.js LTS
- npm
- Git

### Running the Admin Dashboard

From the repository root, move into the admin application:

```bash
cd admin
npm install
npm start
```

The development server will start using the Create React App development environment.

To create a production build:

```bash
cd admin
npm run build
```

To run the test command:

```bash
cd admin
npm test
```

### Running the PWA

From the repository root, move into the PWA application:

```bash
cd pwa
npm install
npm run dev
```

To create a production build:

```bash
cd pwa
npm run build
```

To preview the production build locally:

```bash
cd pwa
npm run preview
```

## Development Approach

The project follows a modular React architecture. Shared interface elements are separated into reusable components, page-level screens are grouped under views, and application-wide visual behavior is managed through theme and layout modules. This structure makes it easier to extend individual gym management features without placing all functionality inside a single component.

The admin application uses route-based organization so each major business area can receive its own page, data model, validation rules, and user interactions as development progresses. The existing dashboard, reports, profile, authentication, and layout foundations can be extended with API integration and persistent storage when the backend services are introduced.

## Current Project Status

Hope Gym Management currently provides the frontend foundation for a gym management platform. The admin dashboard includes the core visual structure, navigation, layouts, reusable UI elements, dashboard widgets, reports, profile screens, and authentication views. The PWA is initialized as a separate application shell.

The main gym-specific workflows, including persistent member records, live attendance tracking, payment processing, membership operations, class scheduling, trainer management, announcements, and backend connectivity, are prepared as future implementation areas. At the current stage, some sections are represented by coming-soon pages and sample dashboard data rather than complete production workflows.

## Future Enhancements

Potential future improvements include:

- Backend API integration.
- Database-backed member and staff records.
- Secure authentication and role-based authorization.
- Complete member and membership management workflows.
- Attendance check-in and visit history.
- Payment processing and financial reports.
- Class scheduling and trainer assignments.
- Member notifications and announcement delivery.
- Advanced analytics and customizable reports.
- PWA installation and offline functionality.
- Push notifications.
- Automated testing and continuous integration.
- Deployment configuration for production environments.
