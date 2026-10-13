# Google OAuth setup

Hope Gym uses **Google Sign-In only** (no passwords). The admin app and API need a Google OAuth **Web Client ID**.

Related:

- [Quick start](./SETUP.md)
- [Linux setup](./setup/linux.md)
- [Windows setup](./setup/windows.md)
- [Environment variables](./environment.md)

---

## 1. Create / select a Google Cloud project

1. Open [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project (e.g. `Hope Gym`) or select an existing one

---

## 2. Configure the OAuth consent screen

1. **APIs & Services → OAuth consent screen**
2. User type: **External** (typical for Gmail accounts)
3. Fill:
   - App name: `Hope Gym`
   - User support email: your email
   - Developer contact: your email
4. Save
5. While the app is in **Testing**, add **Test users**:
   - Every admin Gmail that must sign in (same list as `ADMIN_GOOGLE_EMAILS`)

---

## 3. Create an OAuth Client ID

1. **APIs & Services → Credentials**
2. **+ Create credentials → OAuth client ID**
3. Application type: **Web application**
4. Name: `Hope Gym Admin` (or similar)

### Authorized JavaScript origins

Required for the Google button:

```text
http://localhost:3000
http://localhost:5173
```

- `3000` = admin (Create React App)
- `5173` = PWA (Vite), if used

No path. No trailing slash.

### Authorized redirect URIs

For the Google Identity Services / ID-token flow used by this project, redirect URIs are often optional.  
If the console requires at least one, add:

```text
http://localhost:3000
http://localhost:5173
```

### Create and copy

Click **Create**. Copy the **Client ID** only:

```text
1234567890-abcdefg.apps.googleusercontent.com
```

You do **not** need the Client Secret for this stack.

---

## 4. Put the Client ID in both apps

### API — `nodejs-server/.env`

```env
GOOGLE_CLIENT_IDS=1234567890-abcdefg.apps.googleusercontent.com
```

Multiple clients (admin + PWA) are supported:

```env
GOOGLE_CLIENT_IDS=admin-id.apps.googleusercontent.com,pwa-id.apps.googleusercontent.com
```

### Admin — `admin/.env`

```env
REACT_APP_GOOGLE_CLIENT_ID=1234567890-abcdefg.apps.googleusercontent.com
```

Must match one of the IDs in `GOOGLE_CLIENT_IDS`.

---

## 5. Admin allowlist (multiple admins)

Only these Google emails can use admin login:

```env
ADMIN_GOOGLE_EMAILS=owner@gmail.com,manager@gmail.com
SEED_ADMIN_EMAIL=owner@gmail.com
```

- Comma-separated = multiple admins
- Any other Gmail gets `403` on `POST /api/auth/google/admin`
- `SEED_ADMIN_EMAIL` is also merged into the allowlist

After changing the list:

```bash
cd nodejs-server
npm run seed
```

Restart the API if it is already running.

---

## 6. Production origins (later)

When you deploy, add real HTTPS origins, for example:

```text
https://admin.yourdomain.com
https://app.yourdomain.com
```

Update:

- Google Console origins / redirects
- `CORS_ORIGINS` in `nodejs-server/.env`
- `REACT_APP_API_URL` in `admin/.env`

---

## How auth works (short)

```text
Browser Google button
  → Google returns idToken
  → Admin app POST /api/auth/google/admin { idToken }
  → API verifies token with Google
  → API checks ADMIN_GOOGLE_EMAILS
  → API returns its own JWT
  → Admin app stores JWT for API calls
```

Details: [`nodejs-server/README.md`](../nodejs-server/README.md)
