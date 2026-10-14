# Troubleshooting

Related: [Linux](./setup/linux.md) · [Windows](./setup/windows.md) · [Google OAuth](./google-oauth.md) · [Environment](./environment.md)

---

## Database

### `ECONNREFUSED 127.0.0.1:5432`

PostgreSQL is not running or not listening on 5432.

- **Linux:** `sudo systemctl start postgresql` then `pg_isready`
- **Windows:** Start the `postgresql-x64-*` service in Services

### `password authentication failed`

Wrong user/password in `DATABASE_URL` / `DB_URL`. Reset the role password in `psql` or recreate the user.

### `database "hope_gym" does not exist`

```sql
CREATE DATABASE hope_gym;
```

### `extension "pgcrypto" is not available`

Not required on PostgreSQL 13+. Current migrations use built-in `gen_random_uuid()`. Pull latest migrations if you still see this.

### Migrations fail with invalid URL / hostname `base`

You used keyword `DB_URL` but an older migrate script expected a URI. Current scripts convert keyword form automatically — update to the latest `scripts/load-env.js` and retry `npm run migrate`.

---

## API

### `Missing required environment variable`

Fill all required keys in `nodejs-server/.env`. See [environment.md](./environment.md).

### Health check works but admin gets CORS errors

Add the admin origin to `CORS_ORIGINS`:

```env
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```

Restart the API.

### `403 This Google account is not authorized for admin access`

The Gmail is not in `ADMIN_GOOGLE_EMAILS` (or `SEED_ADMIN_EMAIL`). Add it, restart API, optionally `npm run seed`.

### Token invalid after restart / env change

You changed `JWT_SECRET`. Sign out and sign in again with Google.

---

## Admin frontend

### `Module not found` / blank page after env change

Restart CRA (`Ctrl+C`, then `npm start`). CRA reads `.env` only at startup.

### Google button: origin not allowed

In Google Cloud Console → Credentials → your Web client → **Authorized JavaScript origins** add:

```text
http://localhost:3000
```

### Google button: app is in testing

Add your Gmail under OAuth consent screen → **Test users**.

### Admin `.env` looks empty / one line

Ensure both lines exist:

```env
REACT_APP_API_URL=http://localhost:4000/api
REACT_APP_GOOGLE_CLIENT_ID=....apps.googleusercontent.com
```

Copy from [`admin/.env.example`](../admin/.env.example).

### Sign In still shows in sidebar

Update to latest `admin` code. Sign In is `hideInSidebar: true` and only available at `/auth/sign-in`.

---

## Ports already in use

| Port | Typical owner |
|---|---|
| 3000 | Admin CRA |
| 4000 | API |
| 5173 | PWA |
| 5432 | PostgreSQL |

**Linux:** `ss -ltnp | grep -E '3000|4000|5432'`  
**Windows:** `netstat -ano | findstr :4000`

Stop the old process or change `PORT` / CRA port.

---

## Still stuck?

1. Confirm API: `curl http://localhost:4000/api/health`
2. Confirm DB with `psql` / `pg_isready`
3. Confirm allowlisted email and Google Client ID match on both apps
4. Check the terminal logs for the API and admin
