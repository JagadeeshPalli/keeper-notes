# Keeper Notes — Build Progress

## Project Overview
A Google Keep-inspired full-stack note-taking app built as a portfolio project.
Designed to impress technical recruiters by showing depth across frontend, backend, database, AI integration, and production-grade security.

**Live goal:** Deployed at a public URL with a demo account, API docs, and a polished UI.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router), TypeScript, Tailwind CSS v4, Zustand, Framer Motion, Tiptap v3, SWR |
| Backend | Spring Boot 3.2, Java 21, Spring Security, JWT (HMAC-SHA512), Spring Data JPA |
| Database | PostgreSQL 16 with pgvector extension |
| Cache | Redis 7 (refresh token store) |
| Migrations | Flyway |
| API Docs | SpringDoc OpenAPI (Swagger UI) — dev only |
| Storage | Cloudflare R2 (image uploads, S3-compatible) |
| AI | Google Gemini 2.5 Flash (direct REST, no Spring AI) |
| Hosting | Vercel (frontend) + Render (backend) + Neon (DB) + Upstash (Redis) |

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
- Next.js 16 scaffolded with TypeScript, Tailwind CSS v4, App Router, ESLint
- `application.yml` — all config reads from environment variables, zero hardcoding
- First Flyway migration `V1__create_initial_schema.sql` — full schema created:
  - `users`, `notes`, `labels`, `note_labels`, `note_images`, `note_versions`, `note_collaborators`
  - pgvector `embedding VECTOR(768)` column on notes (for future AI semantic search)
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
| Spring AI dependency caused Maven resolution failure | Removed, using direct Gemini REST API instead |
| `docker-compose.yml` had deprecated `version:` field | Removed the field |
| Port 8080 in use by Tomcat9 Windows service | Changed Spring Boot to port 8081 via `SERVER_PORT` env var |

---

### ✅ Phase 2 — Authentication
**Status:** Complete
**Date:** 2026-04-24

#### What was built

**Backend — JWT auth system:**

| Package | Files | Purpose |
|---|---|---|
| `config` | `AppProperties.java`, `SecurityConfig.java`, `RedisConfig.java` | App config, Spring Security setup, Redis beans |
| `entity` | `User.java` | JPA entity mapped to `users` table |
| `repository` | `UserRepository.java` | JPA repo: findByEmail, existsByEmail |
| `dto/request` | `RegisterRequest.java`, `LoginRequest.java`, `RefreshTokenRequest.java` | Validated request bodies |
| `dto/response` | `ApiResponse.java`, `AuthResponse.java`, `UserResponse.java` | Standardized response wrappers |
| `service` | `JwtService.java`, `TokenService.java`, `AuthService.java` | JWT signing (HMAC-SHA512), Redis refresh tokens, auth logic |
| `filter` | `JwtAuthFilter.java` | OncePerRequestFilter — validates Bearer token on every request |
| `controller` | `AuthController.java` | REST endpoints |
| `exception` | `AppException.java`, `GlobalExceptionHandler.java` | Structured error handling |

**API endpoints:**

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Create account, returns JWT pair |
| POST | `/api/auth/login` | Public | Login, returns JWT pair |
| POST | `/api/auth/refresh` | Public | Exchange refresh token for new access token (rotates token) |
| POST | `/api/auth/logout` | Public | Invalidate refresh token in Redis |
| GET | `/api/auth/me` | 🔒 JWT | Returns current user profile |

**How JWT auth works:**
1. Login/register → backend signs access token (24h) + refresh token (7d) with HMAC-SHA512
2. Refresh token stored in Redis: `refresh:{token}` → userId
3. Every API request: `Authorization: Bearer <token>` header → `JwtAuthFilter` validates
4. On 401: axios interceptor attempts silent token refresh, then replays the request
5. If refresh also fails: clears tokens, redirects to `/login`
6. Logout: deletes refresh token from Redis (server-side invalidation)

**Frontend:**

| File | Purpose |
|---|---|
| `lib/api.ts` | Axios instance with auto Bearer header, refresh-on-401 interceptor |
| `store/authStore.ts` | Zustand store: user state, login(), register(), logout(), loadUser() |
| `app/login/page.tsx` | Themed login form with error display |
| `app/register/page.tsx` | Register form with validation error handling |

#### Issues encountered & resolved
| Issue | Fix |
|---|---|
| Swagger UI returned 403 | Added `/swagger-ui/**`, `/v3/api-docs/**` to security permit list |
| JWT_SECRET too short | Required min 32 chars for HMAC-SHA512 |
| `AuthenticationEntryPoint` not configured | Added inline JSON 401/403 handlers to `SecurityConfig` |

---

### ✅ Phase 3 — Core Notes CRUD
**Status:** Complete
**Date:** 2026-04-24

#### What was built

**Backend:**

| File | Purpose |
|---|---|
| `entity/Note.java` | JPA entity: title, content (TEXT), color, pinned, archived, soft-delete, ManyToMany labels |
| `entity/Label.java` | JPA entity: id, name, user (ManyToOne) |
| `repository/NoteRepository.java` | JPQL queries: findActive (with search), findArchived, findByLabel |
| `repository/LabelRepository.java` | findByUserIdOrderByName, existsByUserIdAndName |
| `service/NoteService.java` | Full CRUD with ownership verification on every operation |
| `service/LabelService.java` | list, create, delete — enforces uniqueness per user |
| `controller/NoteController.java` | 10 REST endpoints |
| `controller/LabelController.java` | 3 REST endpoints |

**API endpoints:**

| Method | Path | Description |
|---|---|---|
| GET | `/api/notes` | List active notes (`?search=` and `?labelId=` supported) |
| POST | `/api/notes` | Create a note |
| GET | `/api/notes/:id` | Get a single note |
| PUT | `/api/notes/:id` | Update a note |
| DELETE | `/api/notes/:id` | Soft-delete (sets `deleted_at`) |
| PUT | `/api/notes/:id/pin` | Toggle pin |
| PUT | `/api/notes/:id/archive` | Toggle archive |
| PUT | `/api/notes/:id/labels` | Set labels on a note |
| GET | `/api/notes/archived` | List archived notes |
| GET | `/api/labels` | List all labels for current user |
| POST | `/api/labels` | Create a label |
| DELETE | `/api/labels/:id` | Delete a label |

**Frontend:**

| File | Purpose |
|---|---|
| `lib/notesApi.ts` | Note / Label types, NOTE_COLORS (10 colors), `notesApi` and `labelsApi` wrappers, `colorStyle()` helper |
| `components/ColorPicker.tsx` | Swatch grid — 10 circular color buttons |
| `components/NoteCard.tsx` | Framer Motion card: title, plain-text preview (line-clamp-6), label chips, hover action bar |
| `components/NoteEditor.tsx` | Tiptap modal: title input, rich text body, color picker, Bold/Italic/Bullet toolbar |
| `app/dashboard/page.tsx` | Full dashboard: sticky header + search, left sidebar, react-masonry-css grid, pinned section |

#### Issues encountered & resolved
| Issue | Fix |
|---|---|
| `function lower(bytea) does not exist` | Null `:search` param passed as `bytea` by Hibernate — fixed with `CAST(:search AS string)` |
| Tiptap SSR hydration mismatch | Added `immediatelyRender: false` to `useEditor()` |

---

### ✅ Phase 4 — Image Attachments
**Status:** Complete
**Date:** 2026-04-24

#### What was built

**Backend:**

| File | Purpose |
|---|---|
| `entity/NoteImage.java` | JPA entity mapped to `note_images` table (url, r2Key, fileSize as Integer) |
| `service/R2Service.java` | S3Client pointed at R2 endpoint, upload() and delete() |
| `service/ImageService.java` | Validates file type (image/*) and size (≤5 MB), orchestrates upload/delete |
| `controller/ImageController.java` | POST `/api/notes/{id}/images`, DELETE `/api/notes/{id}/images/{imageId}` |

**Frontend:**

| File | Purpose |
|---|---|
| `components/ImageLightbox.tsx` | React portal on `document.body` (fixes transform stacking), keyboard nav, z-index 500 |
| `components/NoteEditor.tsx` | Drag-and-drop zone, file input, thumbnail grid with delete, lightbox trigger |
| `components/NoteCard.tsx` | Up to 3 image thumbnails with +N overflow badge, lightbox trigger |

#### Issues encountered & resolved
| Issue | Fix |
|---|---|
| `file_size` type mismatch: `Long` vs DB `int4` | Changed to `Integer`, cast `file.getSize()` |
| Duplicate `AppProperties` bean | Removed `@Component` — `@EnableConfigurationProperties` in main class is sufficient |
| Lightbox wrong position from card view | Framer Motion `layout` (CSS transform) breaks `position:fixed` — fixed with `createPortal` |
| Escape key closed lightbox AND editor | Lightbox registers keydown in capture phase, intercepts before editor sees it |

---

### ✅ Phase 5 — Checklist Notes
**Status:** Complete
**Date:** 2026-04-24

#### What was built

**Backend:**
- Added `noteType` column (`text` | `checklist`) to `notes` table

**Frontend:**

| File | Purpose |
|---|---|
| `components/NoteEditor.tsx` | Toggle button switches text ↔ checklist; inserts Tiptap `taskList` nodes; "✓ Checklist" badge |
| `components/NoteCard.tsx` | Parses `data-checked` HTML attributes; mini checklist preview; animated progress bar |

---

### ✅ Phase 6 — UI Polish (Obsidian Violet Theme)
**Status:** Complete
**Date:** 2026-04-25

#### What was built

- Full CSS custom-property design system: `:root` (light) + `.dark` (dark), 10 note color pairs, card shadows, scrollbar styles
- `next-themes` ThemeProvider — `ThemeToggle` component, `suppressHydrationWarning` on `<html>`
- Custom SVG `Logo` component with gradient note + pen motif
- **Auth pages** (login / register): ambient blobs, glass card, ThemeToggle, Logo
- **Dashboard**: FAB (floating `+` button), `react-masonry-css` for Pinterest layout, all hardcoded colors → CSS vars
- **NoteCard**: 10 color themes × light/dark, hover lift, label chips, image thumbnails
- **NoteEditor**: scrollable modal (max 90vh), content area scrolls, toolbar + AI panel pinned to bottom
- **Landing page** (`/`): hero, features (6 cards), "how it works" steps, CTA banner, footer; floating mock note cards; fully themed light/dark
- `::placeholder` global CSS rule, `scroll-behavior: smooth`, `--nav-glass` CSS var for navbar blur

---

### ✅ Phase 7 — AI Assistant
**Status:** Complete
**Date:** 2026-04-25

#### What was built

**Backend:**

| File | Purpose |
|---|---|
| `service/GeminiService.java` | Direct REST to Gemini 2.5 Flash; per-action `maxOutputTokens`; `thinkingBudget: 0` |
| `service/AiService.java` | 3 free credits enforced by DB counter; own-key bypass; 4 prompts; per-action token budgets |
| `controller/AiController.java` | GET `/api/ai/usage`, POST `/api/ai/assist`, POST `/api/ai/key`, DELETE `/api/ai/key` |
| `V2__add_ai_fields_to_users.sql` | Added `ai_requests_count` and `ai_api_key` to `users` table |

**Token budgets per action:**
| Action | Tokens | Reason |
|---|---|---|
| summarize | 200 | 2-3 sentences |
| grammar | 1024 | must match full note |
| labels | 64 | comma-separated words only |
| expand | 800 | meaningful but not a novel |

**Frontend:**

| File | Purpose |
|---|---|
| `components/AiAssistPanel.tsx` | Collapsible panel inside NoteEditor; 4 action buttons; credit counter; scrollable result box (max-h-44); API key input when limit reached |
| `lib/aiApi.ts` | Typed wrappers for all AI endpoints |

#### Issues encountered & resolved
| Issue | Fix |
|---|---|
| `LocalDateTime` serialization broken (CRITICAL) | `WebConfig.java` had custom `@Bean ObjectMapper` overriding Spring Boot's auto-config which includes JavaTimeModule. Removed it entirely. |
| Gemini model 404 (gemini-1.5-flash, gemini-2.0-flash) | Both deprecated. Switched to `gemini-2.5-flash` (confirmed via ListModels API) |
| `ApiResponse.success()` not found | Method is `ApiResponse.ok()`. Fixed in AiController. |
| NoteEditor result overflows modal | Added `max-h-44 overflow-y-auto` to result box; made modal `flex-col` with `max-h-[90vh]` |

---

### ✅ Phase 8 — Landing Page
**Status:** Complete
**Date:** 2026-04-25

#### What was built

`app/page.tsx` — full public landing page:
- **Navbar**: glass blur, Logo, ThemeToggle, Login + Get Started links
- **Hero**: animated headline, subtext, dual CTA, floating mock note cards (themed for dark mode)
- **Features**: 6 cards with hover lift (AI, Rich Text, Color Themes, Images, Dark Mode, Labels)
- **How it works**: 3 numbered steps with gradient squares + connector line
- **CTA banner**: full-width gradient card with "Create free account" button
- **Footer**: Logo, links, copyright

Routes after landing page added:
```
/           ← Landing page (public)
/login      ← Auth
/register   ← Auth
/dashboard  ← Protected (client-side auth check)
```

---

### ✅ Phase 9 — Production Security Hardening
**Status:** Complete
**Date:** 2026-04-25

#### Critical issues found & fixed

| Issue | Severity | Fix |
|---|---|---|
| Axios 401 interceptor hard-logged out users instead of attempting refresh | 🔴 Critical | Added full token refresh queue with retry logic in `api.ts` |
| `alert()` used for label copy notification | 🔴 Critical | Replaced with animated inline toast in `NoteEditor` |
| `NoteRequest.content` had no size limit | 🔴 Critical | Added `@Size(max = 150_000)` |
| `AiAssistRequest.content` had no size limit | 🔴 Critical | Added `@Size(max = 20_000)` |
| `noteType` and `color` accepted any string | 🔴 Critical | Added `@Pattern` whitelists on both fields |
| `AiAssistRequest.action` accepted any string | 🔴 Critical | Added `@Pattern` whitelist |
| Swagger publicly accessible in production | 🔴 Critical | Defaulted to `SWAGGER_ENABLED=false`; opt-in via env var |
| No HTTP security headers | 🟡 High | Added `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` in `next.config.ts` |

---

## Known Limitations (Acceptable for Portfolio)

| Limitation | Reason / Mitigation |
|---|---|
| Tokens stored in `localStorage` (not HttpOnly cookies) | Would require full cookie-based auth rewrite. Risk mitigated by no `dangerouslySetInnerHTML` in NoteCard (content is stripped to plain text). |
| No server-side route protection (Next.js middleware) | Middleware can't read `localStorage`. Dashboard does client-side auth check immediately. |
| AI API keys stored unencrypted in DB | Acceptable for portfolio. Production-grade: encrypt with AES-256 using a server-side key. |
| No general API rate limiting | Acceptable for portfolio. Production: add Bucket4j or a reverse proxy (nginx/Cloudflare). |
| No pagination on `GET /api/notes` | Acceptable for portfolio. Production: add cursor-based pagination. |
| Render free tier cold start (~30s) | Expected behaviour on free hosting. First request after idle is slow. |

---

## Deployment Stack (All Free Tier)

| Service | What | Free Limits |
|---|---|---|
| **Vercel** | Next.js frontend | Unlimited deployments |
| **Render** | Spring Boot backend | 750h/month, sleeps after 15min idle |
| **Neon** | PostgreSQL + pgvector | 0.5 GB, never pauses |
| **Upstash** | Redis | 10k requests/day |
| **Cloudflare R2** | Image storage | 10 GB, no egress fees |

---

## Git Branch Strategy
```
main    ← production, protected
dev     ← integration (current working branch)
feat/*  ← feature branches, PR into dev
```

## Commits log
```
initial project structure
add auth system: JWT, register, login, refresh, logout
fix security config and me endpoint null principal handling
add login, register, and dashboard pages with auth store
add notes and labels CRUD with masonry grid and Tiptap editor
fix lower(bytea) JPQL bug and Tiptap SSR hydration error
add image attachments with R2 storage and lightbox
add checklist note type with Tiptap TaskList
add UI polish: Obsidian Violet theme, dark mode, landing page
add AI assistant: Gemini 2.5 Flash, 3 free credits, own-key bypass
fix production security: input validation, swagger gate, token refresh, security headers
```
