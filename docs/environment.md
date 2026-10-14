# Environment variables

Complete reference for Hope Gym Management `.env` files.

Related:

- [Quick start](./SETUP.md)
- [Linux](./setup/linux.md) · [Windows](./setup/windows.md)
- [Google OAuth](./google-oauth.md)

Never commit real `.env` files. Templates:

- [`nodejs-server/.env.example`](../nodejs-server/.env.example)
- [`admin/.env.example`](../admin/.env.example)

---

## API — `nodejs-server/.env`

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes* | Postgres URI, e.g. `postgres://user:pass@127.0.0.1:5432/hope_gym` |
| `DB_URL` | Yes* | Alternative keyword form: `host=... user=... password=... dbname=...` |
| `JWT_SECRET` | Yes | Long random secret used to sign API JWTs |
| `JWT_EXPIRES_IN` | No | Default `7d` |
| `GOOGLE_CLIENT_IDS` | Yes | Comma-separated Google OAuth Web Client IDs |
| `ADMIN_GOOGLE_EMAILS` | Yes | Comma-separated Gmails allowed for admin sign-in |
| `SEED_ADMIN_EMAIL` | No | Also merged into admin allowlist; used by seed |
| `SEED_ADMIN_NAME` | No | Display name for seeded admin rows |
| `CORS_ORIGINS` | No | Default includes `http://localhost:3000` |
| `PORT` | No | Default `4000` |
| `NODE_ENV` | No | `development` / `production` |

\* Provide **either** `DATABASE_URL` **or** `DB_URL`.

### Examples

URI form:

```env
DATABASE_URL=postgres://hope_gym:secret@127.0.0.1:5432/hope_gym
```

Keyword form (handy on Linux / special passwords):

```env
DB_URL=host=127.0.0.1 user=hope_gym password=secret dbname=hope_gym port=5432
```

Multiple admins:

```env
ADMIN_GOOGLE_EMAILS=owner@gmail.com,manager@gmail.com,desk@gmail.com
```

Generate `JWT_SECRET`:

```bash
# Linux / macOS / Git Bash
openssl rand -hex 32
```

```powershell
# Windows PowerShell
-join ((1..32) | ForEach-Object { '{0:x2}' -f (Get-Random -Maximum 256) })
```

---

## Admin — `admin/.env`

| Variable | Required | Description |
|---|---|---|
| `REACT_APP_API_URL` | Yes | API base including `/api`, e.g. `http://localhost:4000/api` |
| `REACT_APP_GOOGLE_CLIENT_ID` | Yes | Same Google Web Client ID used by the API |

```env
REACT_APP_API_URL=http://localhost:4000/api
REACT_APP_GOOGLE_CLIENT_ID=1234567890-abcdef.apps.googleusercontent.com
```

Create React App only exposes variables prefixed with `REACT_APP_`.  
Restart `npm start` after changing `.env`.

---

## Checklist before first run

- [ ] Postgres reachable
- [ ] `hope_gym` database exists
- [ ] API `.env` filled (`DB` + `JWT_SECRET` + Google + admin emails)
- [ ] Admin `.env` filled (API URL + Google Client ID)
- [ ] Google Console origins include `http://localhost:3000`
- [ ] Test users / allowlist include your Gmail
