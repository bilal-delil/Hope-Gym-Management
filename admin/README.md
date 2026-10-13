# Hope Gym — Admin Dashboard

React admin UI for Hope Gym Management (Chakra UI). Talks to the Express API in `../nodejs-server` and uses **Google Sign-In only**.

## Docs

| Guide | Link |
|---|---|
| Documentation hub | [`../docs/README.md`](../docs/README.md) |
| Quick start | [`../docs/SETUP.md`](../docs/SETUP.md) |
| **Linux install** | [`../docs/setup/linux.md`](../docs/setup/linux.md) |
| **Windows install** | [`../docs/setup/windows.md`](../docs/setup/windows.md) |
| Google OAuth | [`../docs/google-oauth.md`](../docs/google-oauth.md) |
| Environment vars | [`../docs/environment.md`](../docs/environment.md) |
| Troubleshooting | [`../docs/troubleshooting.md`](../docs/troubleshooting.md) |
| API docs | [`../nodejs-server/README.md`](../nodejs-server/README.md) |

## Prerequisites

1. API running on http://localhost:4000 ([API setup](../nodejs-server/README.md))
2. Google Web Client ID configured ([OAuth guide](../docs/google-oauth.md))
3. Node.js 20+

## Install & run

### Linux / macOS

```bash
cd admin
cp .env.example .env
# edit .env
npm install
npm start
```

### Windows (PowerShell)

```powershell
cd admin
copy .env.example .env
# edit .env in Notepad
npm install
npm start
```

Open http://localhost:3000  
Sign-in: http://localhost:3000/auth/sign-in

Full OS steps: [Linux](../docs/setup/linux.md) · [Windows](../docs/setup/windows.md)

## Environment

Copy from [`.env.example`](./.env.example):

```env
REACT_APP_API_URL=http://localhost:4000/api
REACT_APP_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

Details: [docs/environment.md](../docs/environment.md)

Restart `npm start` after any `.env` change.

## Scripts

| Command | Description |
|---|---|
| `npm start` | Dev server (port 3000) |
| `npm run build` | Production build to `build/` |
| `npm test` | CRA test runner |

## What is wired

- Google admin login → API JWT
- Protected `/admin/*` routes
- Sidebar modules: Dashboard, Members, Memberships, Attendance, Payments (approve/decline), Content, Announcements, Classes, Trainers, Schedule, Reports, Profile, Settings
- Sign In is **not** in the sidebar (only `/auth/sign-in`)

## Notes

- UI is based on Horizon UI / Chakra patterns, customized for Hope Gym.
- Admin emails must be listed in the API `ADMIN_GOOGLE_EMAILS` allowlist.
