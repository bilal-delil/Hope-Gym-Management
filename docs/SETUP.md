# Quick start

This guide is the shared overview. For OS-specific install commands, use:

- [Linux setup](./setup/linux.md)
- [Windows setup](./setup/windows.md)

## What you will run

| App | Folder | Dev URL |
|---|---|---|
| API (Express + PostgreSQL) | `nodejs-server/` | http://localhost:4000 |
| Admin dashboard (React) | `admin/` | http://localhost:3000 |
| Member PWA (optional) | `pwa/` | http://localhost:5173 |

Auth is **Google only**. Admin access is limited to emails listed in `ADMIN_GOOGLE_EMAILS`.

## Prerequisites (all OS)

- Git
- Node.js **20 LTS** or newer (Node 22/24 also fine)
- npm (comes with Node)
- PostgreSQL **14+** (local or hosted, e.g. Supabase)
- A Google Cloud project with an OAuth **Web Client ID**

## Setup flow

```text
1. Install Node + PostgreSQL          → OS guides
2. Clone repo
3. Create DB + configure API .env     → environment.md
4. Create Google Client ID            → google-oauth.md
5. Migrate + seed API
6. Configure admin .env
7. Start API, then admin
8. Sign in with an allowlisted Gmail
```

## Clone

```bash
git clone <your-repo-url> Hope-Gym-Management
cd Hope-Gym-Management
```

## API (short form)

```bash
cd nodejs-server
cp .env.example .env
# edit .env  → see docs/environment.md and your OS guide

npm install
npm run migrate
npm run seed
npm run dev
```

Health check: http://localhost:4000/api/health

Details: [`nodejs-server/README.md`](../nodejs-server/README.md)

## Admin dashboard (short form)

```bash
cd admin
cp .env.example .env
# set REACT_APP_API_URL and REACT_APP_GOOGLE_CLIENT_ID

npm install
npm start
```

Open: http://localhost:3000  
Sign-in page: http://localhost:3000/auth/sign-in

Details: [`admin/README.md`](../admin/README.md)

## Typical local ports

| Service | Port |
|---|---|
| Admin CRA | 3000 |
| API | 4000 |
| PWA Vite | 5173 |
| PostgreSQL | 5432 |

Make sure Google OAuth **Authorized JavaScript origins** include `http://localhost:3000` (and `http://localhost:5173` if using the PWA). See [Google OAuth](./google-oauth.md).

## Next steps

- Full OS install: [Linux](./setup/linux.md) · [Windows](./setup/windows.md)
- Env reference: [environment.md](./environment.md)
- Stuck? [troubleshooting.md](./troubleshooting.md)
