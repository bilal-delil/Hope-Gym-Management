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
- JWT auth (`admin` / `staff` roles)
- `express-validator` request validation

## Setup

1. Create a PostgreSQL database, for example `hope_gym`.
2. Copy env file and edit values:

```bash
cp .env.example .env
```

3. Install dependencies:

```bash
npm install
```

4. Run migrations:

```bash
npm run migrate
```

5. Seed demo admin + sample data:

```bash
npm run seed
```

6. Start the API:

```bash
npm run dev
# or
npm start
```

Default URL: `http://localhost:4000`

Health check: `GET /api/health`

## Auth

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@hopegym.local",
  "password": "Admin123!"
}
```

Use the returned token:

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

- All authenticated routes require a valid JWT except `/api/auth/login` and `/api/health`.
- Settings write/delete endpoints are admin-only.
- Payment delete is admin-only.
