# DevWhoCode Backend

Backend API for **DevWhoCode**, built with **NestJS**, **PostgreSQL**, and **Drizzle ORM**.

It supports:
- Student and lab assistant authentication
- Lab and assignment management
- Problem and testcase management
- Code run/submit execution flows
- User submissions, runs, stats, and leaderboard APIs

---

## Tech Stack

- **Runtime:** Node.js + TypeScript
- **Framework:** NestJS
- **Database:** PostgreSQL
- **ORM / Migrations:** Drizzle ORM + Drizzle Kit
- **Validation:** class-validator + Joi (env validation)
- **Auth:** JWT (access token via ****** + refresh token via cookie)
- **Package manager:** pnpm

---

## Project Structure

```text
src/
  auth/            # Auth flows for students and assistants
  users/           # User listing, runs, submits, stats
  lab_assistant/   # Lab + assistant management
  problems/        # Problems, testcases, assignments
  execute/         # Run/submit execution and analytics
  common/          # Guards, interceptor, filter, decorators
  database/        # Database provider (Drizzle + pg)
```

---

## Environment Variables

Create a `.env` file at project root:

```env
NODE_ENV=development
PORT=3000
DATABASE_URL=******DB_HOST:5432/DB_NAME
JWT_SECRET_KEY=replace-with-secure-secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
EXECUTOR_BASE_URL=http://localhost:8080
```

### Variable Purpose

- `NODE_ENV`: `development | production | test`
- `PORT`: API port
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET_KEY`: JWT signing secret
- `JWT_EXPIRES_IN`: Access token TTL
- `JWT_REFRESH_EXPIRES_IN`: Refresh token TTL
- `EXECUTOR_BASE_URL`: External code-executor service base URL

---

## Setup & Run (Full Process)

### 1) Install dependencies

```bash
pnpm install
```

### 2) Generate migrations (when schema changes)

```bash
pnpm run generate
```

### 3) Run migrations

```bash
pnpm run migrate
```

### 4) Start server

```bash
# watch mode (recommended for development)
pnpm run start:dev

# normal mode
pnpm run start

# production (after build)
pnpm run build
pnpm run start:prod
```

API base prefix is:

```text
/api/v1
```

So root health route becomes:

```text
GET /api/v1/
```

---

## Available Scripts

- `pnpm run start` - Start app
- `pnpm run start:dev` - Start with watch mode
- `pnpm run start:debug` - Debug + watch
- `pnpm run build` - Build to `dist/`
- `pnpm run start:prod` - Run production build
- `pnpm run lint` - ESLint with auto-fix
- `pnpm run format` - Prettier on source files
- `pnpm run test` - Unit tests
- `pnpm run test:e2e` - E2E tests
- `pnpm run test:cov` - Coverage
- `pnpm run generate` - Generate Drizzle migration
- `pnpm run migrate` - Apply migrations
- `pnpm run studio` - Open Drizzle Studio

---

## Authentication & Authorization

### Login flow

1. Login/register endpoint returns access token data.
2. Server sets `refresh_token` cookie.
3. Client sends `Authorization: ****** for protected routes.
4. Use refresh endpoint to rotate tokens when access token expires.

### Guards used

- `JwtAuthGuard` - Requires valid access token
- `StudentGuard` - Student-only routes
- `AssistantGuard` - Lab-assistant-only routes

---

## API Response Format

Most endpoints return a standard response wrapper:

```json
{
  "success": true,
  "statusCode": 200,
  "message": "...",
  "data": {}
}
```

---

## Core API Modules

> All routes below are under `/api/v1`.

### Auth (`/auth`)

- `POST /auth/student/register`
- `POST /auth/student/login`
- `POST /auth/student/resetPassword` (student)
- `POST /auth/student/forgetPassword` (assistant)
- `POST /auth/assistant/register` (assistant)
- `POST /auth/assistant/login`
- `POST /auth/assistant/resetPassword` (assistant)
- `POST /auth/assistant/forgetPassword` (assistant)
- `GET /auth/refresh`
- `POST /auth/logout`
- `GET /auth/me`
- `DELETE /auth/students` (assistant)

### Users (`/user`)

- `GET /user/all` (assistant)
- `GET /user/runs`
- `GET /user/:id/submits`
- `GET /user/:id/stats`

### Labs (`/lab`)

- `POST /lab` (assistant)
- `PATCH /lab/:labId` (assistant)
- `DELETE /lab/:labId` (assistant)
- `GET /lab/all`
- `DELETE /lab/assistant/:assistantId` (assistant)

### Problems (`/problems`)

- `POST /problems` (assistant)
- `PATCH /problems/:id` (assistant)
- `GET /problems` (assistant)
- `GET /problems/:id`
- `PATCH /problems/testcase/:testcaseId` (assistant)
- `DELETE /problems/testcases` (assistant)
- `DELETE /problems/:id` (assistant)
- `POST /problems/assign/:assignmentId` (assistant)
- `POST /problems/revoke/:assignmentId` (assistant)
- `POST /problems/reorder/:assignmentId` (assistant)
- `GET /problems/:assignmentId/all`

### Assignments (`/assignment`)

- `POST /assignment` (assistant)
- `PATCH /assignment/:assignmentId` (assistant)
- `DELETE /assignment/:assignmentId` (assistant)
- `POST /assignment/assign/:labId` (assistant)
- `POST /assignment/revoke/:labId` (assistant)
- `GET /assignment/all` (assistant)
- `GET /assignment/:labId`
- `POST /assignment/activate/:assignmentId` (assistant)

### Execution (root routes)

- `POST /run`
- `POST /submit`
- `DELETE /files/delete`
- `GET /leaderboard`
- `GET /stats`

---

## Database Notes

- PostgreSQL is required.
- Drizzle schema is split across modules (`src/**/schema.ts`).
- SQL migration files are generated into `drizzle/`.

---

## Validation & Error Handling

- Request DTO validation is enforced globally (`ValidationPipe`).
- Unknown env variables are rejected by Joi env schema.
- Global exception filter formats API errors consistently.

---

## Development Notes

- CORS is currently enabled with `origin: '*'`.
- Global API prefix and versioning are enabled (`/api/v1`).
- Cookies are enabled via `cookie-parser`.

---

## License

UNLICENSED
