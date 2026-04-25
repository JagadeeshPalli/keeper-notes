# Keeper Notes — Build Progress

## Project Overview
A Google Keep-inspired full-stack note-taking app built as a portfolio project.
Designed to impress technical recruiters by showing depth across frontend, backend, database, real-time features, and AI integration.

**Live goal:** Deployed at a public URL with a demo account, API docs, and a polished UI.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, TypeScript, Tailwind CSS, Zustand, Framer Motion, Tiptap, SWR |
| Backend | Spring Boot 3, Java 21, Spring Security, JWT, Spring WebSocket, Spring AI |
| Database | PostgreSQL 16 with pgvector extension |
| Cache | Redis 7 |
| Migrations | Flyway |
| API Docs | SpringDoc OpenAPI (Swagger UI) |
| Storage | Cloudflare R2 (image uploads) |
| Hosting | Vercel (frontend) + Render (backend) + Supabase (DB) + Upstash (Redis) |

---

## Environment

| Tool | Version / Notes |
|---|---|
| Java | 21.0.3 (Oracle HotSpot) |
| Maven | 3.9.5 (+ wrapper in /backend) |
| Node.js | 20 LTS |
| Docker Desktop | 27.4.0 |
| IntelliJ IDEA | Licensed (expires 05/07/2026) — used for backend |
| VS Code | Used for frontend |
| OS | Windows 11 |

### Local ports
| Service | Port |
|---|---|
| Spring Boot backend | 8081 (port 8080 was taken by Tomcat9 Windows service) |
| Next.js frontend | 3000 |
| PostgreSQL | 5432 |
| Redis | 6379 |
| pgAdmin | 5050 |

### Key files
- `backend/.env` — secrets, never committed (copy from `.env.example`)
- `frontend/.env.local` — frontend env vars, never committed
- `docker-compose.yml` — starts all local services

---

## Phase Progress

---

### ✅ Phase 1 — Project Setup
**Status:** Complete  
**Date:** 2026-04-24

#### What was built
- Monorepo structure: `/frontend`, `/backend`, `/docker`
- `docker-compose.yml` with PostgreSQL 16 (pgvector), Redis 7, pgAdmin
- Spring Boot 3 project scaffolded with full `pom.xml`:
  - Spring Web, Security, OAuth2, Data JPA, Validation, WebSocket, Redis, Flyway, Lombok, MapStruct, SpringDoc OpenAPI, JJWT
- Next.js 14 scaffolded with TypeScript, Tailwind CSS, App Router, ESLint
- `application.yml` — all config reads from environment variables, zero hardcoding
- First Flyway migration `V1__create_initial_schema.sql` — full schema created:
  - `users`, `notes`, `labels`, `note_labels`, `note_images`, `note_versions`, `note_collaborators`
  - pgvector `embedding VECTOR(768)` column on notes (for Phase 7 AI semantic search)
  - All indexes: user_id, created_at, is_archived, is_pinned
- Maven wrapper (`mvnw`) added for CI compatibility
- `.gitignore` covering `.env`, `node_modules`, `target/`, `.next/`
- GitHub Actions CI workflow (`.github/workflows/ci.yml`):
  - On push to `main` or `dev`: runs `./mvnw test` for backend, `npm run build` for frontend
- Git initialized, `main` and `dev` branches pushed to GitHub
- `.env.example` and `.env.local.example` committed as templates

#### Issues encountered & resolved
| Issue | Fix |
|---|---|
| `flyway-database-postgresql` missing version in pom.xml | Added explicit version `10.12.0` |
| Spring AI dependency caused Maven resolution failure | Removed for now, will add back in Phase 7 |
| `docker-compose.yml` had deprecated `version:` field | Removed the field |
| Port 8080 in use by Tomcat9 Windows service | Changed Spring Boot to port 8081 via `SERVER_PORT` env var |

#### Deliverable verified
```
docker compose up -d       → 3 containers healthy (db, redis, pgadmin)
pgAdmin at :5050           → keepernotes database visible with all tables
```

---

### ✅ Phase 2 — Authentication
**Status:** Complete  
**Date:** 2026-04-24

#### What was built

**Backend — 19 new files across 8 packages:**

| Package | Files | Purpose |
|---|---|---|
| `config` | `AppProperties.java`, `SecurityConfig.java`, `RedisConfig.java` | App config, Spring Security setup, Redis beans |
| `entity` | `User.java` | JPA entity mapped to `users` table |
| `repository` | `UserRepository.java` | JPA repo: findByEmail, findByGoogleId, existsByEmail |
| `dto/request` | `RegisterRequest.java`, `LoginRequest.java`, `RefreshTokenRequest.java` | Validated request bodies |
| `dto/response` | `ApiResponse.java`, `AuthResponse.java`, `UserResponse.java` | Standardized response wrappers |
| `service` | `JwtService.java`, `TokenService.java`, `AuthService.java` | JWT signing, Redis refresh tokens, auth logic |
| `security` | `UserDetailsServiceImpl.java` | Spring Security user loading |
| `filter` | `JwtAuthFilter.java` | Validates Bearer token on every request |
| `controller` | `AuthController.java` | REST endpoints |
| `exception` | `AppException.java`, `GlobalExceptionHandler.java` | Structured error handling |

**API endpoints built:**

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Create account, returns JWT pair |
| POST | `/api/auth/login` | Public | Login, returns JWT pair |
| POST | `/api/auth/refresh` | Public | Exchange refresh token for new access token |
| POST | `/api/auth/logout` | Public | Invalidate refresh token in Redis |
| GET | `/api/auth/me` | 🔒 JWT | Returns current user profile |

**How JWT auth works:**
1. Login/register → backend signs a JWT with HMAC-SHA512 using `JWT_SECRET`
2. Access token lives 24h, stored in browser `localStorage`
3. Refresh token lives 7 days, stored in Redis (`refresh:{token}` → userId)
4. Every API request: `Authorization: Bearer <token>` header → `JwtAuthFilter` validates
5. If 401: axios interceptor clears tokens and redirects to `/login`

**API response format (all endpoints):**
```json
// Success
{ "data": { ... }, "message": "optional" }

// Error
{ "error": { "code": "EMAIL_TAKEN", "message": "..." } }

// Validation error (422)
{ "error": { "code": "VALIDATION_ERROR", "fields": { "email": "..." } } }
```

**Frontend — auth flow:**

| File | Purpose |
|---|---|
| `lib/api.ts` | Axios instance with auto Bearer header + 401 interceptor |
| `store/authStore.ts` | Zustand store: user state, login(), register(), logout(), loadUser() |
| `app/login/page.tsx` | Dark-themed login form with error display |
| `app/register/page.tsx` | Register form with validation error handling |
| `app/dashboard/page.tsx` | Protected page — redirects to login if no valid token |

#### Issues encountered & resolved
| Issue | Fix |
|---|---|
| `curl` in PowerShell doesn't support JSON escaping | Switched to `Invoke-RestMethod` |
| Swagger UI returned 403 | Added `/swagger-ui/**`, `/v3/api-docs/**`, `/webjars/**` to security permit list |
| `/api/auth/me` returned INTERNAL_ERROR when called without token | Spring Security was passing anonymous users through `authenticated()` — changed to `hasRole("USER")` + added null check in controller |
| JWT_SECRET too short | Required min 32 chars for HMAC-SHA512 — updated `.env` |
| `AuthenticationEntryPoint` not configured | Added inline JSON 401/403 handlers to `SecurityConfig` |

#### Deliverable verified
```powershell
# Register
Invoke-RestMethod -Method POST -Uri "http://localhost:8081/api/auth/register" `
  -ContentType "application/json" `
  -Body '{"email":"test@example.com","password":"password123","displayName":"Test User"}'
# → returns accessToken, refreshToken, user object ✅

# Login
$response = Invoke-RestMethod -Method POST -Uri "http://localhost:8081/api/auth/login" `
  -ContentType "application/json" `
  -Body '{"email":"test@example.com","password":"password123"}'

# Protected endpoint
$token = $response.data.accessToken
Invoke-RestMethod -Method GET -Uri "http://localhost:8081/api/auth/me" `
  -Headers @{Authorization="Bearer $token"}
# → returns user profile ✅

# Frontend
# http://localhost:3000/register → fill form → redirects to dashboard ✅
# http://localhost:3000/login    → fill form → redirects to dashboard ✅
# Sign out → back to login ✅
```

---

---

### ✅ Phase 3 — Core Notes CRUD
**Status:** Complete  
**Date:** 2026-04-24

#### What was built

**Backend — Notes & Labels system:**

| File | Purpose |
|---|---|
| `entity/Note.java` | JPA entity: title, content (text), color, pinned, archived, soft-delete, ManyToMany labels |
| `entity/Label.java` | JPA entity: id, name, user (ManyToOne) |
| `repository/NoteRepository.java` | JPQL queries: findActive (with search), findArchived, findByLabel |
| `repository/LabelRepository.java` | findByUserIdOrderByName, existsByUserIdAndName |
| `dto/request/NoteRequest.java` | title?, content?, color?, labelIds? |
| `dto/response/NoteResponse.java` | Full note DTO with embedded LabelResponse list |
| `dto/response/LabelResponse.java` | id + name |
| `service/NoteService.java` | Full CRUD: getActive, getArchived, getById, create, update, delete (soft), togglePin, toggleArchive, setLabels |
| `service/LabelService.java` | list, create, delete — enforces uniqueness per user |
| `controller/NoteController.java` | 10 REST endpoints |
| `controller/LabelController.java` | 3 REST endpoints |

**API endpoints built:**

| Method | Path | Description |
|---|---|---|
| GET | `/api/notes` | List active notes (optional `?search=` and `?labelId=`) |
| POST | `/api/notes` | Create a note |
| GET | `/api/notes/:id` | Get a single note |
| PUT | `/api/notes/:id` | Update a note |
| DELETE | `/api/notes/:id` | Soft-delete a note |
| POST | `/api/notes/:id/pin` | Toggle pin |
| POST | `/api/notes/:id/archive` | Toggle archive |
| PUT | `/api/notes/:id/labels` | Set labels on a note |
| GET | `/api/notes/archived` | List archived notes |
| GET | `/api/labels` | List all labels for current user |
| POST | `/api/labels` | Create a label |
| DELETE | `/api/labels/:id` | Delete a label |

**Frontend — Notes UI:**

| File | Purpose |
|---|---|
| `lib/notesApi.ts` | Note / Label types, NOTE_COLORS (10 colors), `notesApi` and `labelsApi` wrappers, `colorStyle()` helper |
| `components/ColorPicker.tsx` | Swatch grid — 10 circular color buttons |
| `components/NoteCard.tsx` | Framer Motion card: title, plain-text preview (line-clamp-6), label chips, hover action bar (pin / color / archive / delete) |
| `components/NoteEditor.tsx` | Tiptap modal: title input, rich text body, color picker, Bold / Italic / Bullet toolbar, Close saves |
| `app/dashboard/page.tsx` | Full dashboard: sticky header + search, left sidebar (Notes / Archive / Labels), CSS masonry grid, pinned section, AnimatePresence modal |
| `app/globals.css` | Tiptap placeholder + prose styles |

**How the notes flow works:**
1. Dashboard loads → `GET /api/notes` fetches active notes
2. Click "Take a note…" → `NoteEditor` modal opens (Tiptap rich text)
3. Click Close / Escape → saves via `POST /api/notes` or `PUT /api/notes/:id`
4. Card appears in masonry grid with Framer Motion entrance animation
5. Hover card → action bar fades in (pin / color picker / archive / delete)
6. Search bar debounced 300 ms → `GET /api/notes?search=` refetches live
7. Sidebar "Archive" → `GET /api/notes/archived` swaps the grid
8. Labels sidebar: click "+" → inline input → `POST /api/labels` → click label → `GET /api/notes?labelId=`

#### Issues encountered & resolved
| Issue | Fix |
|---|---|
| `function lower(bytea) does not exist` | When `:search` param is null, Hibernate passes it as `bytea` to PostgreSQL. Fixed with `CAST(:search AS string)` in JPQL so Hibernate emits `CAST(? AS varchar)` |
| Tiptap SSR hydration mismatch in Next.js | Added `immediatelyRender: false` to `useEditor({...})` config in `NoteEditor.tsx` |

#### Deliverable verified
```
- Notes create, display in masonry grid ✅
- Rich text (bold, italic, bullet list) in editor ✅
- Pin / archive / delete from card hover ✅
- Color picker on both card and editor ✅
- Real-time debounced search ✅
- Label creation and label-filtered view ✅
- Pinned section shown above "Other" section ✅
- Empty state shown when no notes ✅
- Animations: card entrance, hover lift, exit fade ✅
```

---

## 🔲 Phases Yet to Come

### ✅ Phase 4 — Image Attachments
**Status:** Complete
**Date:** 2026-04-24

#### What was built

**Backend:**

| File | Purpose |
|---|---|
| `entity/NoteImage.java` | JPA entity mapped to `note_images` table (url, r2Key, fileSize as Integer) |
| `repository/NoteImageRepository.java` | findByIdAndNoteId lookup |
| `dto/response/NoteImageResponse.java` | id, url, fileSize, createdAt |
| `service/R2Service.java` | S3Client pointed at R2 endpoint, upload() and delete() |
| `service/ImageService.java` | Validates file type (image/*) and size (≤5 MB), orchestrates upload/delete |
| `controller/ImageController.java` | POST `/api/notes/{id}/images`, DELETE `/api/notes/{id}/images/{imageId}` |
| `entity/Note.java` | Added `@OneToMany images` with `@BatchSize(size=20)` for lazy loading |
| `dto/response/NoteResponse.java` | Added `images: List<NoteImageResponse>` |
| `service/NoteService.java` | Read methods annotated `@Transactional(readOnly=true)` for lazy image loading |
| `application.yml` | `spring.servlet.multipart.max-file-size: 10MB` |

**Frontend:**

| File | Purpose |
|---|---|
| `lib/notesApi.ts` | `NoteImage` type, `uploadImage()`, `deleteImage()` |
| `components/ImageLightbox.tsx` | React portal on `document.body` (fixes transform stacking context), `AnimatePresence mode="wait"` crossfade, keyboard nav (capture phase), z-index 500 |
| `components/NoteEditor.tsx` | Drag-and-drop zone, file input button, 80×80 thumbnail grid with ✕ delete, lightbox trigger |
| `components/NoteCard.tsx` | Up to 3 image thumbnails with +N overflow badge, lightbox trigger |

#### Issues encountered & resolved
| Issue | Fix |
|---|---|
| `file_size` type mismatch: `Long` vs DB `int4` | Changed entity and DTO to `Integer`, cast `file.getSize()` |
| Duplicate `AppProperties` bean (2 found) | Removed `@Component` — `@EnableConfigurationProperties` in main class is sufficient |
| Lightbox wrong position/behind navbar from card view | `NoteCard` uses Framer Motion `layout` (CSS transform) which breaks `position:fixed` children — fixed with `createPortal` to `document.body` |
| Lightbox flickering on open/close | Moved `AnimatePresence` ownership to parent; `mode="wait"` on image crossfade |
| Escape key closed lightbox AND triggered editor save | Lightbox registers keydown in capture phase, intercepts before editor sees it |

#### Deliverable verified
```
- Drop or select image in editor → uploads to R2, thumbnail appears ✅
- Up to 3 thumbnails shown on note card, +N badge if more ✅
- Click thumbnail from card → lightbox opens centered on viewport ✅
- Click thumbnail in editor → lightbox opens ✅
- ← → arrow keys / prev-next buttons navigate images ✅
- Esc / backdrop click closes cleanly with fade animation ✅
- ✕ button on thumbnail in editor → deletes from R2 + DB ✅
- No flicker, no navbar overlap, correct centering ✅
```

---

### ✅ Phase 5 — Checklist Notes
**Status:** Complete  
**Date:** 2026-04-24

#### What was built

**Backend:**
- Added `noteType` column (`text` | `checklist`) to `notes` table (Flyway migration)
- `NoteRequest` / `NoteResponse` updated to carry `noteType`

**Frontend:**

| File | Purpose |
|---|---|
| `components/NoteEditor.tsx` | Toggle button switches between text and checklist mode; inserts Tiptap `taskList` / `taskItem` nodes; "✓ Checklist" badge floats above modal |
| `components/NoteCard.tsx` | Parses `data-checked` attributes from saved HTML to render mini checklist preview; animated progress bar showing X/Y done + percentage |

#### Deliverable verified
```
- Toggle text ↔ checklist in editor ✅
- Checklist items render with native Tiptap checkboxes ✅
- Card preview shows up to 6 items with checked/unchecked state ✅
- Progress bar animates on card ✅
- "+N more" shown when > 6 items ✅
```

---

---

---

### Phase 6 — Version History
- Every save snapshots the note
- Side panel with version timeline
- Diff view: additions in green, deletions in red
- One-click restore

---

### Phase 7 — AI Note Assistant
- Summarize, suggest tags, expand, fix grammar
- Semantic search using pgvector + Gemini embeddings
- Rate limiting: 10 AI requests/user/hour via Redis counter
- Demo mode for unauthenticated visitors (mock responses)
- Requires: `GEMINI_API_KEY` from https://aistudio.google.com/app/apikey

---

### Phase 8 — Live Collaboration
- Share note with another user by email
- WebSocket (STOMP) — edits broadcast in real time
- Colored cursors showing where each user is typing
- Presence avatars in editor header

---

### Phase 9 — Canvas Mode
- Infinite whiteboard using tldraw or custom pan/zoom
- Notes as draggable sticky cards
- Positions persist in DB
- Minimap, zoom, fit-all button

---

### Phase 10 — Mood-Aware Colors
- Sentiment analysis via Gemini (async, doesn't block save)
- Card color shifts based on mood: positive=warm yellow, excited=orange, anxious=blue-purple, negative=cool gray
- User toggle in settings (off by default)
- Manual color override always wins

---

### 🔲 Phase 11.5 — UI Polish (Obsidian Violet Theme)
**Status:** In Progress  
**Goal:** Transform the app from a functional prototype into a portfolio-worthy product.

#### Completed
- Full CSS custom-property design system — `:root` (light) + `.dark` (dark), 10 note color pairs, card shadows
- `next-themes` integration — `ThemeProvider`, `ThemeToggle` component, `suppressHydrationWarning` on `<html>`
- Custom SVG `Logo` component with gradient note + pen motif
- **Auth pages** (login / register): CSS-variable backgrounds, animated ambient blobs, grid overlay, real ThemeToggle + Logo, themed glass card
- **Dashboard**: Logo + ThemeToggle in header, all hardcoded colors replaced with CSS vars, FAB (floating `+` button) replaces old "Take a note" bar, `react-masonry-css` for true Pinterest-style column alignment
- **NoteCard**: CSS-variable card backgrounds (10 colors × light/dark), hover lift with `whileHover`, checklist mini preview + animated progress bar, image thumbnails, label chips
- **NoteEditor**: CSS-variable modal, themed toolbar buttons, `btn-accent` CTA
- **ColorPicker**: swatch dots from `NOTE_COLORS.swatch` — unchanged, still works
- `::placeholder` global CSS rule using `var(--text-muted)` for both themes
- Axios 401 interceptor fix — no longer redirects on failed login/register (only on expired session)

#### Still To Do
- Animations / micro-interactions polish pass
- Input placeholder color on Firefox (`::-moz-placeholder`)
- Possible mobile responsive sidebar (hamburger drawer)

---

### Phase 11 — Landing Page + Public API
- Recruiter-facing landing page at `/`
- Demo account with pre-loaded sample notes
- Full Swagger UI at `/swagger-ui/index.html`
- `/api/health` and `/api/stats` public endpoints
- Tech stack section, GitHub link, feature highlights

---

### Phase 12 — Deployment
- Dockerfiles for both frontend and backend
- **Vercel** → Next.js frontend (free, auto-deploys from `main`)
- **Render** → Spring Boot backend (free 750h/month, cold starts after 15min idle)
- **Supabase** → PostgreSQL with pgvector enabled
- **Upstash** → Redis (10k commands/day free)
- **Cloudflare R2** → image storage (10GB free, no egress fees)
- GitHub Actions: test on PR, deploy on merge to `main`
- Full README with architecture diagram, setup steps, live demo link

---

## Git Branch Strategy
```
main    ← production, protected
dev     ← integration (current working branch)
feat/*  ← feature branches, PR into dev
```

## Commits so far
```
initial project structure
add auth system: JWT, register, login, refresh, logout
fix security config and me endpoint null principal handling
add login, register, and dashboard pages with auth store
add notes and labels CRUD with masonry grid and Tiptap editor
fix lower(bytea) JPQL bug and Tiptap SSR hydration error
```
