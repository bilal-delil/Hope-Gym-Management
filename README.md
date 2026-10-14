# Hope Gym Management

Full-stack gym administration platform: **React admin dashboard**, **Express + PostgreSQL API**, and a **member PWA** starter.

Authentication is **Google-only**. Admin access is restricted to an allowlisted set of Gmail addresses (multiple admins supported).

## Documentation

| Doc | Description |
|---|---|
| **[docs/README.md](./docs/README.md)** | Documentation hub |
| **[docs/SETUP.md](./docs/SETUP.md)** | Quick start (all platforms) |
| **[docs/setup/linux.md](./docs/setup/linux.md)** | Detailed Linux install |
| **[docs/setup/windows.md](./docs/setup/windows.md)** | Detailed Windows install |
| **[docs/google-oauth.md](./docs/google-oauth.md)** | Google Client ID + admin allowlist |
| **[docs/environment.md](./docs/environment.md)** | Environment variable reference |
| **[docs/troubleshooting.md](./docs/troubleshooting.md)** | Common errors |

Package docs:

- [`nodejs-server/README.md`](./nodejs-server/README.md) — API, migrations, auth, payments
- [`admin/README.md`](./admin/README.md) — Admin dashboard

## Apps

| App | Folder | Dev URL |
|---|---|---|
| API | `nodejs-server/` | http://localhost:4000 |
| Admin dashboard | `admin/` | http://localhost:3000 |
| Member PWA | `pwa/` | http://localhost:5173 |

## Features (admin)

- Dashboard KPIs and membership breakdowns
- Members, membership plans & assignments
- Attendance check-in / check-out
- Payments with **screenshot proof → approve / decline**
- Content feed & announcements
- Classes, trainers, schedule (+ bookings)
- Reports, settings, profile, notifications, global search

## Stack

- **Admin:** React 19, Chakra UI, React Router, `@react-oauth/google`
- **API:** Node.js, Express, PostgreSQL, `node-pg-migrate`, Google ID token verify, JWT
- **PWA:** React + Vite (starter)

## Quick start

> Prefer OS-specific steps? Use **[Linux](./docs/setup/linux.md)** or **[Windows](./docs/setup/windows.md)**.

### Prerequisites

- Node.js 20+ and npm
- PostgreSQL 14+
- Google OAuth Web Client ID ([guide](./docs/google-oauth.md))

### 1. API

```bash
cd nodejs-server
cp .env.example .env
# configure DB, JWT_SECRET, GOOGLE_CLIENT_IDS, ADMIN_GOOGLE_EMAILS
npm install
npm run migrate
npm run seed
npm run dev
```

### 2. Admin

```bash
cd admin
cp .env.example .env
# REACT_APP_API_URL + REACT_APP_GOOGLE_CLIENT_ID
npm install
npm start
```

Sign in at http://localhost:3000/auth/sign-in with an allowlisted Gmail.

## Repository structure

```text
Hope-Gym-Management/
├── admin/                 # React admin dashboard
├── nodejs-server/         # Express API + PostgreSQL migrations
├── pwa/                   # Member PWA starter
├── docs/                  # Setup & operations documentation
│   ├── SETUP.md
│   ├── setup/linux.md
│   ├── setup/windows.md
│   ├── google-oauth.md
│   ├── environment.md
│   └── troubleshooting.md
└── README.md
```

## Admin allowlist (multiple admins)

```env
ADMIN_GOOGLE_EMAILS=owner@gmail.com,manager@gmail.com
```

Only those Google accounts can use admin sign-in. Any other account is rejected.

See [docs/google-oauth.md](./docs/google-oauth.md).

## License

See [LICENSE](./LICENSE).
