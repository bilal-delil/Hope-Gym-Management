# Hope Gym API (`nodejs-server`)

Express + PostgreSQL backend for the Hope Gym Management admin dashboard (and member Google auth / payment submit).

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
| Admin dashboard | [`../admin/README.md`](../admin/README.md) |

## Features covered

| Sidebar area | API namespace |
|---|---|
| Sign In / Profile | `/api/auth`, `/api/profile` |
| Dashboard | `/api/dashboard/overview` |
| Members | `/api/members` |
| Memberships | `/api/membership-plans`, `/api/memberships` |
| Attendance | `/api/attendance` |
| Payments | `/api/payments` |
| Content Feed | `/api/content` |
| Announcements | `/api/announcements` |
| Classes | `/api/classes` |
| Trainers | `/api/trainers` |
| Schedule | `/api/schedules` (+ bookings) |
| Reports | `/api/reports` |
| Settings | `/api/settings` |
| Global search / notifications | `/api/search`, `/api/notifications` |
| Member self-service | `/api/member/payments` |

## Stack

- Node.js + Express
- PostgreSQL (`pg`)
- Schema migrations via `node-pg-migrate`
- **Google Auth only** (no passwords) → server JWT
- Roles: `admin`, `staff`, `member`
- Image payment proofs (multer) → approve / decline

## Setup

Prefer the OS guides for first-time machine setup:

- [Linux](../docs/setup/linux.md)
- [Windows](../docs/setup/windows.md)

### Short form (after Node + Postgres exist)

**Linux / macOS**

```bash
cd nodejs-server
cp .env.example .env
# edit .env — see ../docs/environment.md
npm install
npm run migrate
npm run seed
npm run dev
```

**Windows (PowerShell)**

```powershell
cd nodejs-server
copy .env.example .env
# edit .env
npm install
npm run migrate
npm run seed
npm run dev
```

Default URL: http://localhost:4000  
Health check: `GET /api/health`

### Required env (minimum)

| Variable | Purpose |
|---|---|
| `DATABASE_URL` or `DB_URL` | Postgres connection |
| `JWT_SECRET` | Sign API tokens |
| `GOOGLE_CLIENT_IDS` | Google Web Client ID(s) |
| `ADMIN_GOOGLE_EMAILS` | Comma-separated admin Gmails |

Full list: [docs/environment.md](../docs/environment.md)  
Google console steps: [docs/google-oauth.md](../docs/google-oauth.md)

## Auth (Google only)

There is **no email/password login**.

### Admin / staff

```http
POST /api/auth/google/admin
Content-Type: application/json

{ "idToken": "<google-id-token>" }
```

Rules:

- Email **must** be listed in `ADMIN_GOOGLE_EMAILS` (comma-separated for multiple admins)
- Any other Google account is rejected with `403`
- `SEED_ADMIN_EMAIL` is also merged into that allowlist

### Members (PWA / users)

```http
POST /api/auth/google/member
Content-Type: application/json

{ "idToken": "<google-id-token>" }
```

Creates/links a `users` row (`role=member`) and a `members` profile.

### Current user

```http
GET /api/auth/me
Authorization: Bearer <api-jwt>
```

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Nodemon API on `PORT` (default 4000) |
| `npm start` | Production-style start |
| `npm run migrate` | Apply migrations |
| `npm run migrate:down` | Roll back one migration |
| `npm run migrate:create -- name` | Create a new migration file |
| `npm run seed` | Seed plans, sample data, allowlisted admins |

## Migrations

```bash
npm run migrate
npm run migrate:down
npm run migrate:create -- add-something
```

## Payments (image proof → approve / decline)

Payments are **screenshot-based**, not gateway-based.

1. Submit with proof image (`multipart/form-data` field `proofImage`) → `pending`
2. Queue: `GET /api/payments/pending`
3. `POST /api/payments/:id/approve` or `POST /api/payments/:id/decline` with `{ "rejectionReason": "..." }`

Proof files are served from `/uploads/payments/...`.

Members can also submit via `POST /api/member/payments`.

## Notes

- Public routes: `/api/health`, `/api/auth/google/admin`, `/api/auth/google/member`
- Admin dashboard APIs require `admin` or `staff`
- Members can use `/api/auth/me`, `/api/profile`, `/api/notifications`, `/api/member/payments`
- Stuck? [docs/troubleshooting.md](../docs/troubleshooting.md)
