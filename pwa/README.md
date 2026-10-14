# Hope Gym Member PWA

Member-facing Progressive Web App for Hope Fitness Center.

- Google sign-in (open to any Google account)
- Bottom navigation: Home, Classes, Check-in, Payments, Profile
- Dark purple UI aligned with `design.jpg`, Hope branding/logo
- Talks to `nodejs-server` member APIs under `/api/member/*`

## Setup

1. Copy env:

```bash
cp .env.example .env
```

2. Set:

- `VITE_API_URL` — usually `http://localhost:4000/api`
- `VITE_GOOGLE_CLIENT_ID` — same Google OAuth Web client used by the API (`GOOGLE_CLIENT_IDS`)

3. In Google Cloud Console, add authorized JavaScript origins:

- `http://localhost:5173`

4. Start the API (`nodejs-server`) first, then:

```bash
npm install
npm run dev
```

App runs at [http://localhost:5173](http://localhost:5173).

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Vite dev server |
| `npm run build` | Production build + service worker |
| `npm run preview` | Preview production build |

## Auth

Uses `POST /api/auth/google/member` with a Google ID token. New users are created as members automatically (no allowlist). Admin/staff accounts must use the admin app instead.

## Features wired

| Tab | API |
| --- | --- |
| Home | `GET /member/overview` |
| Classes | `GET /member/schedules`, `POST /member/schedules/:id/book`, `GET /member/bookings` |
| Check-in | `GET /member/attendance`, `POST /member/attendance/check-in\|check-out` |
| Payments | `GET /member/payments`, `POST /member/payments` (multipart proof), `GET /member/plans` |
| Profile | `GET /member/me`, `GET /member/announcements` |
