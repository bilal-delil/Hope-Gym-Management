# Linux setup (Fedora, Ubuntu, Debian)

Detailed install for Hope Gym Management on Linux.

Related docs:

- [Quick start](../SETUP.md)
- [Windows setup](./windows.md)
- [Google OAuth](../google-oauth.md)
- [Environment variables](../environment.md)
- [Troubleshooting](../troubleshooting.md)
- [API README](../../nodejs-server/README.md)
- [Admin README](../../admin/README.md)

---

## 1. Install system packages

### Fedora / RHEL

```bash
sudo dnf update -y
sudo dnf install -y git curl wget

# Node.js 22 (or 20 LTS)
sudo dnf install -y nodejs npm

# PostgreSQL server
sudo dnf install -y postgresql postgresql-server postgresql-contrib

# Initialize DB cluster (first time only)
sudo postgresql-setup --initdb

# Start and enable
sudo systemctl enable --now postgresql
```

Verify:

```bash
node -v
npm -v
sudo systemctl status postgresql
pg_isready
```

### Ubuntu / Debian

```bash
sudo apt update
sudo apt install -y git curl ca-certificates gnupg

# Node.js 20 LTS via NodeSource (recommended)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# PostgreSQL
sudo apt install -y postgresql postgresql-contrib
sudo systemctl enable --now postgresql
```

Verify:

```bash
node -v   # v20+
npm -v
sudo systemctl status postgresql
pg_isready
```

---

## 2. Create the database and user

Switch to the `postgres` system user and open `psql`:

```bash
sudo -u postgres psql
```

Inside `psql`:

```sql
CREATE USER hope_gym WITH PASSWORD 'your_strong_password' CREATEDB;
CREATE DATABASE hope_gym OWNER hope_gym;
GRANT ALL PRIVILEGES ON DATABASE hope_gym TO hope_gym;
\q
```

### Fedora auth note

Fedora often uses `scram-sha-256` / `peer` auth. For local password login on `127.0.0.1`, you may need to edit:

`/var/lib/pgsql/data/pg_hba.conf`

Ensure a line like:

```text
host    all    all    127.0.0.1/32    scram-sha-256
```

Then:

```bash
sudo systemctl restart postgresql
```

Test:

```bash
psql "host=127.0.0.1 port=5432 dbname=hope_gym user=hope_gym password=your_strong_password" -c 'select 1'
```

Alternatively keep the default `postgres` OS user / DB role if that matches your local workflow (as used in many local `.env` examples).

---

## 3. Clone the project

```bash
cd ~/Projects   # or any folder you prefer
git clone <your-repo-url> Hope-Gym-Management
cd Hope-Gym-Management
```

---

## 4. Configure and start the API

```bash
cd nodejs-server
cp .env.example .env
nano .env   # or use code / vim
```

Minimum values (see [environment.md](../environment.md)):

```env
DB_URL=host=127.0.0.1 user=hope_gym password=your_strong_password dbname=hope_gym port=5432
# or:
# DATABASE_URL=postgres://hope_gym:your_strong_password@127.0.0.1:5432/hope_gym

JWT_SECRET=paste_output_of_openssl_rand_hex_32
GOOGLE_CLIENT_IDS=your-client-id.apps.googleusercontent.com
ADMIN_GOOGLE_EMAILS=you@gmail.com,other-admin@gmail.com
SEED_ADMIN_EMAIL=you@gmail.com
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
PORT=4000
```

Generate a JWT secret:

```bash
openssl rand -hex 32
```

Create Google Client ID: [google-oauth.md](../google-oauth.md)

Install, migrate, seed, run:

```bash
npm install
npm run migrate
npm run seed
npm run dev
```

Expected:

```text
Hope Gym API listening on port 4000
```

Check:

```bash
curl http://localhost:4000/api/health
```

Leave this terminal running.

---

## 5. Configure and start the admin dashboard

Open a **second** terminal:

```bash
cd ~/Projects/Hope-Gym-Management/admin
cp .env.example .env
nano .env
```

```env
REACT_APP_API_URL=http://localhost:4000/api
REACT_APP_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

Use the **same** Google Client ID as `GOOGLE_CLIENT_IDS` on the server.

```bash
npm install
npm start
```

Browser opens http://localhost:3000 (or open it manually).

Sign in: http://localhost:3000/auth/sign-in  
Use a Gmail listed in `ADMIN_GOOGLE_EMAILS`.

---

## 6. Optional: PWA

```bash
cd ~/Projects/Hope-Gym-Management/pwa
npm install
npm run dev
```

Usually http://localhost:5173

---

## 7. Useful Linux commands

| Task | Command |
|---|---|
| Start Postgres | `sudo systemctl start postgresql` |
| Stop Postgres | `sudo systemctl stop postgresql` |
| Postgres status | `sudo systemctl status postgresql` |
| Is port 5432 open? | `ss -ltn \| grep 5432` |
| Is API up? | `curl -s http://localhost:4000/api/health` |
| Reseed DB | `cd nodejs-server && npm run seed` |
| New migration | `cd nodejs-server && npm run migrate:create -- name` |

---

## 8. Firewall (if accessing from another machine)

Usually not needed for localhost-only development.

```bash
# Fedora
sudo firewall-cmd --add-port=3000/tcp --add-port=4000/tcp
# Ubuntu ufw
# sudo ufw allow 3000 && sudo ufw allow 4000
```

Also add that machine’s origin to Google OAuth and `CORS_ORIGINS`.

---

## Next

- [Environment variables](../environment.md)
- [Troubleshooting](../troubleshooting.md)
- [API package docs](../../nodejs-server/README.md)
- [Admin package docs](../../admin/README.md)
