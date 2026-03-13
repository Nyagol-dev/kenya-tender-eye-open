# Kenya Tender Eye

A full-stack web application for browsing, tracking, and managing Kenyan government procurement tenders. It provides role-based access for **suppliers** and **government entities**, built on a React/TypeScript frontend and an Express/PostgreSQL backend with JWT authentication.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Installation](#installation)
- [Running the App](#running-the-app)
- [API Reference](#api-reference)
- [Authentication Flow](#authentication-flow)
- [Frontend Configuration](#frontend-configuration)

---

## Tech Stack

| Layer      | Technology                                      |
|------------|-------------------------------------------------|
| Frontend   | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui |
| State/Auth | React Context, JWT (in-memory)                  |
| Backend    | Node.js, Express 5                              |
| Database   | PostgreSQL (via `pg` connection pool)           |
| Auth       | `jsonwebtoken`, `bcrypt`                        |
| Other      | `cors`, `dotenv`, React Hook Form, Zod          |

---

## Project Structure

```
kenya-tender-eye-open/
│
├── src/                            # React frontend
│   ├── components/
│   │   ├── auth/                   # LoginForm, SignUpForm, schemas
│   │   ├── dashboard/              # Charts and stat cards
│   │   ├── layout/                 # Navbar, MainLayout
│   │   ├── tenders/                # TenderCard, TenderList, TenderDetail
│   │   └── ui/                     # shadcn/ui primitives
│   ├── contexts/
│   │   └── AuthContext.tsx         # JWT auth state, signUp/signIn/signOut
│   ├── hooks/                      # use-mobile, use-toast
│   ├── lib/
│   │   ├── api.ts                  # Fetch wrapper (attaches Bearer token)
│   │   └── utils.ts
│   ├── pages/                      # Route-level page components
│   ├── types/
│   │   ├── auth.ts                 # User, AuthContextType, SignUpParams
│   │   └── database.ts             # Shared DB entity types
│   ├── mock/                       # Static tender data for development
│   ├── App.tsx                     # Router and AuthProvider setup
│   └── main.tsx
│
├── server/                         # Express backend (independent Node project)
│   ├── controllers/
│   │   ├── authController.js       # signup, login, logout, me
│   │   ├── profileController.js    # getProfile (joins service_categories)
│   │   └── serviceCategoryController.js
│   ├── db/
│   │   └── pool.js                 # pg Pool instance
│   ├── middleware/
│   │   └── authenticate.js         # JWT Bearer verification → req.user
│   ├── routes/
│   │   ├── auth.js                 # /api/auth/*
│   │   ├── profiles.js             # /api/profiles/:id
│   │   └── serviceCategories.js    # /api/service-categories
│   ├── index.js                    # Entry point; wires cors, routes, port
│   ├── .env.example                # Template for required env vars
│   └── package.json
│
├── public/
├── .gitignore
├── vite.config.ts
└── package.json
```

---

## Prerequisites

- **Node.js** v20 or later
- **npm** v9 or later
- **PostgreSQL** 14 or later running locally

---

## Environment Variables

The backend reads from `server/.env`. Copy the example file and fill in your values:

```bash
cp server/.env.example server/.env
```

| Variable       | Default                          | Description                               |
|----------------|----------------------------------|-------------------------------------------|
| `PORT`         | `5000`                           | Port the Express server listens on        |
| `CLIENT_URL`   | `http://localhost:8080`          | Frontend origin allowed by CORS           |
| `DB_HOST`      | `localhost`                      | PostgreSQL host                           |
| `DB_PORT`      | `5432`                           | PostgreSQL port                           |
| `DB_NAME`      | `kenya_tender_eye`               | Database name                             |
| `DB_USER`      | `postgres`                       | Database user                             |
| `DB_PASSWORD`  | *(empty)*                        | Database password                         |
| `JWT_SECRET`   | —                                | **Required.** Long random string for signing tokens |
| `JWT_EXPIRES_IN` | `7d`                           | Token expiry (e.g. `1d`, `7d`, `2h`)     |

Generate a secure `JWT_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

The frontend reads from a `.env` file in the project root (optional):

| Variable        | Default  | Description                              |
|-----------------|----------|------------------------------------------|
| `VITE_API_URL`  | `/api`   | Base URL of the backend API              |

---

## Database Setup

1. Create the database:

```sql
CREATE DATABASE kenya_tender_eye;
```

2. Connect and run the schema. At minimum the backend expects these tables:

```sql
CREATE TABLE users (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email               TEXT UNIQUE NOT NULL,
  password_hash       TEXT NOT NULL,
  full_name           TEXT,
  user_type           TEXT CHECK (user_type IN ('supplier', 'government_entity')),
  service_category_id UUID REFERENCES service_categories(id),
  entity_name         TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE service_categories (
  id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name  TEXT UNIQUE NOT NULL
);

CREATE TABLE profiles (
  id                  UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  is_admin            BOOLEAN NOT NULL DEFAULT FALSE,
  service_category_id UUID REFERENCES service_categories(id),
  created_at          TIMESTAMPTZ DEFAULT NOW()
);
```

> A profile row for a new user can be inserted via a database trigger on `INSERT INTO users`, or explicitly in `authController.js` after the user is created.

---

## Installation

Install dependencies for both the frontend and backend separately.

**Frontend:**

```bash
npm install
```

**Backend:**

```bash
cd server
npm install
```

---

## Running the App

Both processes must run concurrently during development.

**Start the backend** (from `server/`):

```bash
cd server
npm run dev        # node --watch index.js  →  http://localhost:5000
```

**Start the frontend** (from the project root):

```bash
npm run dev        # vite dev server  →  http://localhost:8080
```

Open [http://localhost:8080](http://localhost:8080) in your browser.

**Production build:**

```bash
# Build the frontend
npm run build

# Start the backend in production
cd server
npm start
```

---

## API Reference

All routes are prefixed with `/api`. The backend runs on port `5000` by default.

### Health

| Method | Path          | Auth | Description     |
|--------|---------------|------|-----------------|
| GET    | `/api/health` | No   | Liveness check  |

### Auth — `/api/auth`

| Method | Path              | Auth | Body                                                                 | Response              |
|--------|-------------------|------|----------------------------------------------------------------------|-----------------------|
| POST   | `/auth/signup`    | No   | `{ email, password, full_name, user_type, service_category_id?, entity_name? }` | `{ token, user }` |
| POST   | `/auth/login`     | No   | `{ email, password }`                                                | `{ token, user }`     |
| POST   | `/auth/logout`    | No   | —                                                                    | `204 No Content`      |
| GET    | `/auth/me`        | Yes  | —                                                                    | `{ token, user }`     |

### Profiles — `/api/profiles`

| Method | Path           | Auth | Description                                          |
|--------|----------------|------|------------------------------------------------------|
| GET    | `/:id`         | Yes  | Returns profile row joined with `service_categories` |

### Service Categories — `/api/service-categories`

| Method | Path | Auth | Description                  |
|--------|------|------|------------------------------|
| GET    | `/`  | No   | Returns all service categories |

**Protected routes** require an `Authorization` header:

```
Authorization: Bearer <token>
```

**Error responses** are always JSON:

```json
{ "message": "Token expired or invalid" }
```

---

## Authentication Flow

```
1. User submits login form
        │
        ▼
2. POST /api/auth/login
   Server verifies password with bcrypt
   Returns { token, user }
        │
        ▼
3. AuthContext stores token in memory
   (setAccessToken in src/lib/api.ts)
        │
        ▼
4. All subsequent API calls add:
   Authorization: Bearer <token>
        │
        ▼
5. authenticate middleware (server/middleware/authenticate.js)
   verifies signature → attaches req.user = { id, email }
        │
        ▼
6. On page refresh → GET /api/auth/me is called
   (if server issues refresh cookies, session is restored)
   Otherwise user is redirected to /auth
```

Tokens are held **in memory only** — never written to `localStorage` — to minimise XSS exposure. The `credentials: "include"` flag is set on all requests so HttpOnly refresh cookies work when the backend issues them.

---

## Frontend Configuration

**Path alias** — `@/` maps to `src/`:

```ts
// vite.config.ts
resolve: { alias: { "@": path.resolve(__dirname, "./src") } }
```

**API base URL** — configurable via `VITE_API_URL` (defaults to `/api`):

```ts
// src/lib/api.ts
const API_URL = import.meta.env.VITE_API_URL ?? "/api";
```

During development the frontend runs on `:8080` and the backend on `:5000`. For production, proxy `/api` through your web server (nginx, Caddy, etc.) to avoid CORS issues.

Example nginx snippet:

```nginx
location /api/ {
    proxy_pass http://localhost:5000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```
