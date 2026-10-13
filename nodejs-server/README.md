# Hope Gym API (`nodejs-server`)

Express + PostgreSQL backend for the Hope Gym Management admin dashboard.

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

## Stack

- Node.js + Express
- PostgreSQL (`pg`)
- Schema migrations via `node-pg-migrate`
- **Google Auth only** (no passwords) → server JWT
- Roles: `admin`, `staff`, `member`
- `express-validator` request validation

## Setup

1. Create a PostgreSQL database, for example `hope_gym`.
2. Create Google OAuth Web Client ID(s) in Google Cloud Console (one for admin app, one for PWA if needed).
3. Copy env file and edit values:

```bash
cp .env.example .env
```

Set at least:

- `DATABASE_URL`
- `JWT_SECRET`
- `GOOGLE_CLIENT_IDS`
- `ADMIN_GOOGLE_EMAILS` (your Gmail(s) allowed as admin)
- `SEED_ADMIN_EMAIL` (same as one of the admin emails)

4. Install / migrate / seed / run:

```bash
npm install
npm run migrate
npm run seed
npm run dev
```

Default URL: `http://localhost:4000`  
Health check: `GET /api/health`

## Auth (Google only)

There is **no email/password login**.

### Admin / staff

Frontend gets a Google ID token, then:

```http
POST /api/auth/google/admin
Content-Type: application/json

{ "idToken": "<google-id-token>" }
```

Access rules:

- Email must already be an `admin`/`staff` user, **or**
- Email must be listed in `ADMIN_GOOGLE_EMAILS`

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

Use the returned API JWT on all other requests:

```http
Authorization: Bearer <token>
```

## Migrations

```bash
npm run migrate
npm run migrate:down
npm run migrate:create -- add-something
```

## Payments (image proof → approve / decline)

Payments are **screenshot-based**, not gateway-based.

1. Submit a payment with a proof image (`multipart/form-data`):

```http
POST /api/payments
Authorization: Bearer <token>
Content-Type: multipart/form-data

memberId: <uuid>
amount: 49.99
method: bank_transfer
reference: TXN-123
proofImage: <image file>
```

Status starts as `pending`. Admins/staff get a notification.

2. Review queue:

```http
GET /api/payments/pending
```

3. Approve or decline:

```http
POST /api/payments/:id/approve

POST /api/payments/:id/decline
Content-Type: application/json

{ "rejectionReason": "Screenshot is unclear" }
```

- Approve → `completed` (and linked membership set to `active` if present)
- Decline → `declined` with `rejection_reason`
- Proof files are served from `/uploads/payments/...`

## Notes

- Public routes: `/api/health`, `/api/auth/google/admin`, `/api/auth/google/member`
- Admin dashboard APIs require `admin` or `staff`
- Members can use `/api/auth/me`, `/api/profile`, `/api/notifications`, and `/api/member/payments`
- Settings write/delete and payment delete remain admin-restricted where configured
