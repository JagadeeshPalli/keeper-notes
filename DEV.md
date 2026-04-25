# Keeper Notes — Local Dev Startup Guide

Run these in order every time you restart your laptop.

---

## 1. Docker (databases)

```bash
docker compose up -d
```

Verify all containers are healthy:

```bash
docker compose ps
```

Expected: `db`, `redis`, `pgadmin` all showing **Up**.

---

## 2. claude-mem viewer (localhost:37777)

After a reboot, the claude-mem worker has stale PID files and won't auto-start.
Clear them and restart the worker with this single command:

```bash
echo '{"processes":{}}' > ~/.claude-mem/supervisor.json && echo '{}' > ~/.claude-mem/worker.pid && CLAUDE_PLUGIN_ROOT="$HOME/.claude/plugins/cache/thedotmack/claude-mem/12.3.9" node "$HOME/.claude/plugins/cache/thedotmack/claude-mem/12.3.9/scripts/bun-runner.js" "$HOME/.claude/plugins/cache/thedotmack/claude-mem/12.3.9/scripts/worker-service.cjs" start
```

Check it worked:

```bash
curl http://127.0.0.1:37777/health
# Expected: {"status":"ok",...}
```

Then open **http://localhost:37777** in your browser.

> **Why this is needed:** Windows kills all processes on shutdown. The worker
> leaves behind stale PID files (`~/.claude-mem/supervisor.json` and
> `~/.claude-mem/worker.pid`) that make it think it's already running.
> Clearing those files lets it start fresh.

---

## 3. Backend (IntelliJ IDEA)

1. Open IntelliJ → it reopens the `backend` project automatically
2. Wait for Maven indexing to finish (bottom status bar)
3. Click the **▶ Run** button next to `KeeperNotesApplication`
4. Wait for the console to show:
   ```
   Started KeeperNotesApplication in X.XXX seconds
   ```
5. Sanity check: http://localhost:8081/swagger-ui/index.html

> ⚠️ Must start **after Docker** — Spring Boot crashes if PostgreSQL isn't ready.

> ⚠️ **Swagger** is enabled locally via `SWAGGER_ENABLED=true` in `backend/.env`.
> It is **off by default** in production. Never set this to `true` on Render.

---

## 4. Frontend (VS Code)

```bash
cd frontend
npm run dev
```

Wait for:
```
▲ Next.js ready on http://localhost:3000
```

Open **http://localhost:3000** in your browser.

---

## Quick Reference

| Service       | URL                                    | Start command / tool          |
|---------------|----------------------------------------|-------------------------------|
| Landing page  | http://localhost:3000                  | `npm run dev` (in /frontend)  |
| Dashboard     | http://localhost:3000/dashboard        | (login first)                 |
| Backend       | http://localhost:8081                  | IntelliJ ▶ Run                |
| Swagger UI    | http://localhost:8081/swagger-ui       | (backend must be running)     |
| pgAdmin       | http://localhost:5050                  | Docker                        |
| claude-mem    | http://localhost:37777                 | Step 2 command above          |

### pgAdmin credentials
- **Email:** `admin@keepernotes.com`
- **Password:** see `docker-compose.yml` → `PGADMIN_DEFAULT_PASSWORD`

### DB connection (inside pgAdmin)
- **Host:** `db`
- **Port:** `5432`
- **Database:** `keepernotes`
- **Username/Password:** see `backend/.env`

---

## Common errors

| Error | Cause | Fix |
|---|---|---|
| IntelliJ: `Connection refused` (PostgreSQL) | Docker not started yet | Run `docker compose up -d` first |
| IntelliJ: `Port 8081 already in use` | Previous run didn't stop cleanly | Stop old process or restart IntelliJ |
| Frontend: `ECONNREFUSED localhost:8081` | Backend not running | Start IntelliJ backend first |
| Frontend: `Module not found` | `node_modules` was cleaned | Run `npm install` then `npm run dev` |
| claude-mem: `Failed to start worker` | Stale PID files from last shutdown | Run the Step 2 command above |
| Docker containers not starting | Docker daemon still loading | Wait 30s after Docker Desktop opens |
| Swagger 404 in production | `SWAGGER_ENABLED` not set to `true` | Only enable locally — never in prod |

---

## Before deploying — pre-flight checklist

Run through this before every production deployment:

- [ ] `SWAGGER_ENABLED` is **not** set (or set to `false`) in the hosting env vars
- [ ] `JWT_SECRET` is a random 32+ char string (not the dev placeholder)
- [ ] `FRONTEND_URL` points to the real Vercel URL (for CORS)
- [ ] `GEMINI_API_KEY` is set (for the system-level free AI credits)
- [ ] `R2_*` vars are set (for image uploads)
- [ ] `DATABASE_URL` points to Neon (not localhost)
- [ ] `REDIS_URL` points to Upstash (not localhost)
- [ ] `NEXT_PUBLIC_API_URL` in Vercel env vars points to the Render backend URL
- [ ] Run `npm run build` locally — zero errors before pushing
