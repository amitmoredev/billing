# Billing — bill upload & parameter capture

Upload electricity bills (PDF/image) to Cloudflare R2, then open each bill in a
split view: document on the left, parameter form on the right.

## Architecture

Bytes live in R2, metadata lives in MongoDB. The API server never streams file
content — the browser talks to R2 directly through presigned URLs.

**Upload (3 steps, so no orphan rows or orphan objects):**

1. `POST /api/bills/uploads/presign` — creates a `PENDING_UPLOAD` row, returns `{ billId, uploadUrl }`
2. browser `PUT`s the file straight to R2
3. `POST /api/bills/:id/uploads/confirm` — HeadObject verifies the bytes landed, row becomes `UPLOADED`

**Parameters:** `PATCH …/parameters` saves a partial draft; `POST …/parameters/submit`
validates the identifying fields and moves the row to `SUBMITTED`.

### Access

Sign-up is closed. A number can sign in (WhatsApp OTP) only if an admin has
created an account for it; anyone else is told to contact their administrator.

- **Roles** — `admin` and `client` (`backend/models/user.model.js`).
- **Permissions** — `backend/policies/permissions.js` is the only place a role
  becomes a permission. Routes call `authorize(action, subject)`; the UI calls
  `useSession().can(action, subject)` over rules the API sends with the session.
  Rules are CASL-shaped, so moving to `@casl/ability` later is a one-file swap.
- **Admin console** — `/admin/login` (not linked anywhere in the app). Admins
  add, edit, disable and delete client accounts at `/admin/users`. Admin
  accounts are created from the CLI, so the console can't lock an admin out.
- Disabling or deleting an account takes effect on the user's next request —
  every request re-reads the account behind the session cookie.

```bash
cd backend
npm run admin:add -- 9876543210 "Your Name" you@example.com   # first admin
npm run user:add  -- 9876543210 "Client Name"                  # client, from the CLI
```

### Layers

```
backend/
  routes/      *.route.js       paths + validation wiring
  controllers/ *.controller.js  read validated input, call service, respond
  services/    *.service.js     business rules, R2 + Mongo orchestration
  data/        *.data.js        Mongo queries only
  models/      *.model.js       schemas & indexes
  policies/    permissions.js   who may do what (CASL-shaped rules)
  validators/  *.validator.js   zod schemas
frontend/src/
  api/         endpoints.js     every URL declared once
               http.js          fetch wrapper + R2 PUT with progress
  services/    *.service.js     one function per API operation
  queries/     *.query.js       TanStack Query hooks + cache keys
  hooks/                        form/upload state
  components/  ui/ auth/ bills/ users/ layout/
  pages/       admin/           admin console pages
```

## Setup

```bash
# backend
cd backend
cp .env.example .env      # fill MONGO_URI + R2 credentials
npm install
npm run dev               # http://localhost:5000

# frontend
cd frontend
npm install
npm run dev               # http://localhost:5173
```

### R2 bucket CORS (required — the browser PUTs directly)

Bucket → Settings → CORS policy:

```json
[
  {
    "AllowedOrigins": ["http://localhost:5173"],
    "AllowedMethods": ["PUT", "GET"],
    "AllowedHeaders": ["content-type"],
    "ExposeHeaders": ["etag"],
    "MaxAgeSeconds": 3600
  }
]
```

Keep the bucket private — view URLs are presigned for one hour. Set
`R2_PUBLIC_BASE_URL` only if you attach a public domain to the bucket.

## Deploy (Render)

`render.yaml` defines both services — Render → New → Blueprint → this repo.

- **billing-api** — Node web service from `backend/`.
- **billing-web** — static site from `frontend/`. It proxies `/api/*` to the
  API, so the app and its session cookie live on one origin.

After the first deploy:

1. Set `CORS_ORIGINS` on billing-api to the web app's URL.
2. Allow the web app to upload to R2: locally set
   `CORS_ORIGINS=http://localhost:5173,https://<web-app>.onrender.com` and run
   `npm run r2:cors` in `backend/`.
3. Create the first admin against the production database:
   `$env:MONGO_URI="<atlas uri>"; npm run admin:add -- <phone> "<name>"`

## API

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/api/auth/send-otp` | WhatsApp code (`scope: 'admin'` from the admin screen) |
| POST | `/api/auth/verify-otp` | code -> session cookie; returns `{ user, permissions }` |
| GET | `/api/auth/me` | current `{ user, permissions }` |
| POST | `/api/auth/logout` | clear the session cookie |
| GET | `/api/admin/users` | admin: list clients (`search`, `page`, `limit`) |
| POST | `/api/admin/users` | admin: add a client |
| PATCH | `/api/admin/users/:id` | admin: edit / enable / disable |
| DELETE | `/api/admin/users/:id` | admin: delete |
| POST | `/api/bills/uploads/presign` | reserve row + upload URL |
| POST | `/api/bills/:id/uploads/confirm` | confirm upload |
| GET | `/api/bills` | list (`status`, `search`, `page`, `limit`) |
| GET | `/api/bills/:id` | detail + signed `fileUrl` |
| GET | `/api/bills/stats` | counts by status |
| PATCH | `/api/bills/:id/parameters` | save draft |
| POST | `/api/bills/:id/parameters/submit` | validate + submit |
| DELETE | `/api/bills/:id` | delete object + row |

Responses use one envelope: `{ success, data }` or `{ success, error: { message, details } }`.

## Adding a parameter

1. `backend/models/bill.model.js` — add the field to `parametersSchema`
2. `backend/validators/bill.validator.js` — add it to `parametersDraftSchema`
3. `frontend/src/constants/bill.constants.js` — add an entry to `PARAMETER_GROUPS`

No migration; the form renders from the constants list.
