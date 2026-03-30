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
npm run dev
```

## Environment Variables

```
DATABASE_URL        # SQLite: file:./dev.db
JWT_SECRET
GOOGLE_CLIENT_ID
GOOGLE_BOOKS_API_KEY
SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS
APP_URL, PORT
```

## API

```
Auth
  POST   /auth/register
  POST   /auth/login
  POST   /auth/google
  GET    /auth/me
  POST   /auth/forgot-password
  POST   /auth/verify-reset-token
  PUT    /auth/reset-password

Books
  GET    /books/search?title=foo
  POST   /books/add
  GET    /books
  GET    /books/:id
  PATCH  /books/:id              # status: WANT_TO_READ | READING | COMPLETED
  DELETE /books/:id
  PATCH  /books/:id/review        # rating, review
  GET    /books/:id/pace

Sessions
  POST   /sessions/start         # returns sessionId
  POST   /sessions/stop          # { sessionId, currentPage }
  GET    /sessions/book/:id      # sessions for one book
  GET    /sessions              # all sessions (for pace/heatmap viz)
```

## Project Structure

```
src/
├── controllers/      # Route handlers
├── services/         # Business logic
├── routes/           # Express routers
├── middleware/       # Auth, validation, rate limiting, error handling
├── validations/     # Zod schemas
└── server.js        # Entry point
```

## Roadmap

See [ROADMAP.md](./ROADMAP.md)
