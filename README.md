# ReadFlow

A reading tracker that logs your sessions and calculates your pace. Session data is exposed for habit visualization (like a reading heatmap).

## Features

- **Session tracking** - Timer-based reading sessions with page counts
- **Pace calculation** - Pages/hour per book or across all books
- **Bookshelf** - Search Google Books, track Want to Read / Reading / Completed
- **Ratings & reviews** - Leave thoughts on books you've finished
- **Auth** - Local registration + Google OAuth

## Tech Stack

Node.js · Express · Prisma · SQLite · Zod · JWT

## Setup

```bash
npm install
cp .env.example .env   # add your values
npx prisma migrate dev
npm test
npm run dev
```

## Environment Variables

All env vars are centralized in `src/config/index.js` with fail-fast validation on startup.

```
DATABASE_URL        # SQLite: file:./dev.db (required)
JWT_SECRET          # required
GOOGLE_CLIENT_ID    # required
GOOGLE_CLIENT_SECRET # required
GOOGLE_BOOKS_API_KEY
SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS
APP_URL             # used for password reset links
FRONTEND_URL        # optional
PORT
NODE_ENV            # development | production | test
```

## API

```
Auth
  POST   /api/auth/register
  POST   /api/auth/login
  POST   /api/auth/google
  GET    /api/auth/me
  PUT    /api/auth/profile      # update username and/or password
  POST   /api/auth/forgot-password
  POST   /api/auth/verify-reset-token
  PUT    /api/auth/reset-password

Books
  GET    /api/books/search?title=foo
  POST   /api/books/add
  GET    /api/books
  GET    /api/books/:id
  PATCH  /api/books/:id              # status: WANT_TO_READ | READING | COMPLETED
  DELETE /api/books/:id
  PATCH  /api/books/:id/review       # rating, review
  GET    /api/books/:id/pace

Sessions
  POST   /api/sessions/start        # returns sessionId
  POST   /api/sessions/stop         # { sessionId, currentPage }
  GET    /api/sessions/book/:id     # sessions for one book
  GET    /api/sessions              # all sessions (for pace/heatmap viz)
```

## Testing

`npm test` runs an integration suite against the real Express app and an isolated SQLite database.

External integrations are mocked only at the service boundary:

- Google Books HTTP responses
- Google OAuth token verification
- SMTP email delivery

## Project Structure

```
src/
├── config/           # Centralized env var config with validation
├── controllers/      # Route handlers
├── services/         # Business logic
├── routes/           # Express routers
├── middleware/       # Auth, validation, rate limiting, error handling
├── validations/      # Zod schemas
└── server.js        # Entry point
```

## Roadmap

See [ROADMAP.md](./ROADMAP.md)
