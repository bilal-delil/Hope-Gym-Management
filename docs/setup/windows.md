# Windows setup (Windows 10 / 11)

Detailed install for Hope Gym Management on Windows.

Related docs:

- [Quick start](../SETUP.md)
- [Linux setup](./linux.md)
- [Google OAuth](../google-oauth.md)
- [Environment variables](../environment.md)
- [Troubleshooting](../troubleshooting.md)
- [API README](../../nodejs-server/README.md)
- [Admin README](../../admin/README.md)

---

## 1. Install required tools

### Option A — installers (simplest)

1. **Git for Windows**  
   https://git-scm.com/download/win  
   During setup, keep “Git from the command line” enabled.

2. **Node.js LTS**  
   https://nodejs.org/  
   Choose the **LTS** Windows installer (`.msi`).  
   Ensure “Add to PATH” is checked.

3. **PostgreSQL**  
   https://www.postgresql.org/download/windows/  
   Use the EnterpriseDB installer.  
   Remember the password you set for the `postgres` superuser.  
   Default port: `5432`.  
   Install **Command Line Tools** / Stack Builder is optional.

4. Open **PowerShell** or **Windows Terminal** and verify:

```powershell
node -v
npm -v
git --version
psql --version
```

If `psql` is not found, add PostgreSQL `bin` to PATH, typically:

```text
C:\Program Files\PostgreSQL\16\bin
```

(Replace `16` with your installed version.)

### Option B — winget

```powershell
winget install Git.Git
winget install OpenJS.NodeJS.LTS
winget install PostgreSQL.PostgreSQL
```

Restart the terminal after installs.

---

## 2. Confirm PostgreSQL is running

1. Open **Services** (`Win + R` → `services.msc`).
2. Find a service named like `postgresql-x64-16`.
3. Status should be **Running**. If not, Start it.

Or in PowerShell (as Admin if needed):

```powershell
Get-Service -Name postgresql*
```

---

## 3. Create the database

Open **SQL Shell (psql)** from the Start Menu, or:

```powershell
psql -U postgres
```

Enter the postgres password you set during install.

```sql
CREATE USER hope_gym WITH PASSWORD 'your_strong_password' CREATEDB;
CREATE DATABASE hope_gym OWNER hope_gym;
GRANT ALL PRIVILEGES ON DATABASE hope_gym TO hope_gym;
\q
```

Test:

```powershell
psql -h 127.0.0.1 -U hope_gym -d hope_gym -c "select 1"
```

---

## 4. Clone the project

```powershell
cd $HOME\Projects
# or: cd C:\Users\<you>\Documents
git clone <your-repo-url> Hope-Gym-Management
cd Hope-Gym-Management
```

---

## 5. Configure and start the API

```powershell
cd nodejs-server
copy .env.example .env
notepad .env
```

Minimum values (see [environment.md](../environment.md)):

```env
DATABASE_URL=postgres://hope_gym:your_strong_password@127.0.0.1:5432/hope_gym
JWT_SECRET=paste_a_long_random_hex_string
GOOGLE_CLIENT_IDS=your-client-id.apps.googleusercontent.com
ADMIN_GOOGLE_EMAILS=you@gmail.com,other-admin@gmail.com
SEED_ADMIN_EMAIL=you@gmail.com
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
PORT=4000
```

Generate a JWT secret in PowerShell:

```powershell
# PowerShell
-join ((1..32) | ForEach-Object { '{0:x2}' -f (Get-Random -Maximum 256) })
```

Or if OpenSSL is available (Git Bash / some installs):

```bash
openssl rand -hex 32
```

Create Google Client ID: [google-oauth.md](../google-oauth.md)

Install, migrate, seed, run:

```powershell
npm install
npm run migrate
npm run seed
npm run dev
```

Expected:

```text
Hope Gym API listening on port 4000
```

Check in another PowerShell window:

```powershell
Invoke-RestMethod http://localhost:4000/api/health
```

Leave the API terminal running.

### Windows path / password tip

If your DB password contains `@`, `#`, or other special characters, prefer URL-encoding them in `DATABASE_URL`, or use the keyword form:

```env
DB_URL=host=127.0.0.1 user=hope_gym password=your_strong_password dbname=hope_gym port=5432
```

The server accepts both `DATABASE_URL` and `DB_URL`.

---

## 6. Configure and start the admin dashboard

Open a **second** terminal:

```powershell
cd C:\Users\<you>\Projects\Hope-Gym-Management\admin
copy .env.example .env
notepad .env
```

```env
REACT_APP_API_URL=http://localhost:4000/api
REACT_APP_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

Use the **same** Client ID as on the server.

```powershell
npm install
npm start
```

Browser: http://localhost:3000  
Sign-in: http://localhost:3000/auth/sign-in  

Sign in with a Gmail listed in `ADMIN_GOOGLE_EMAILS`.

---

## 7. Member PWA

```powershell
cd ..\pwa
copy .env.example .env
# Set VITE_API_URL and VITE_GOOGLE_CLIENT_ID (same Google client as the API)
npm install
npm run dev
```

Usually http://localhost:5173

Add `http://localhost:5173` to Google OAuth **Authorized JavaScript origins**. Member Google sign-in is open to any account (`POST /api/auth/google/member`).

---

## 8. Useful Windows commands

| Task | Command |
|---|---|
| List Node | `node -v` |
| Start API | `cd nodejs-server; npm run dev` |
| Start admin | `cd admin; npm start` |
| Reseed | `cd nodejs-server; npm run seed` |
| Check port 4000 | `netstat -ano \| findstr :4000` |
| Check port 5432 | `netstat -ano \| findstr :5432` |
| Postgres services | `Get-Service postgresql*` |

---

## 9. Common Windows issues

### `psql` / `npm` not recognized

Close and reopen the terminal after install. If still missing, add the install folders to **System Environment Variables → Path**.

### ECONNREFUSED 5432

PostgreSQL service is not running. Start it from Services.

### Google sign-in popup blocked / origin error

Add `http://localhost:3000` under **Authorized JavaScript origins** in Google Cloud Console. See [google-oauth.md](../google-oauth.md).

### Execution policy blocks npm scripts

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

---

## Next

- [Environment variables](../environment.md)
- [Troubleshooting](../troubleshooting.md)
- [API package docs](../../nodejs-server/README.md)
- [Admin package docs](../../admin/README.md)
