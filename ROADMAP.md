# ReadFlow ROADMAP

## Completed

- [x] Zod validation schemas for POST/PUT routes
- [x] Global error handler middleware
- [x] Rate limiting on /auth routes
- [x] P2002 → 409 "already taken" translation
- [x] P2025 → 404 "not found" translation
- [x] JWT error handling (invalid/expired)

---

## Auth Overhaul

- [ ] Extract JWT_SECRET to shared config
- [ ] Add logout endpoint
- [ ] Implement Redis connection
- [ ] Token blacklisting on logout
- [ ] Access/Refresh token split (15-min access, 7-day refresh)
- [ ] Session model for device tracking
- [ ] Update authMiddleware to check blacklisted tokens

---

## Core Infrastructure

- [ ] Create config.js with all env vars (fail-fast validation)
- [ ] Remove scattered process.env calls, use config
- [ ] Add Morgan (HTTP logs) + Winston (error logs)
- [ ] Graceful shutdown handler

---

## Edge Cases & Bug Fixes

- [ ] timingSafeEqual length check (authService:188)
- [ ] Google Books API try/catch (bookService:16)
- [ ] Google Books response optional chaining (bookService:20-25)
- [ ] GetPace returns null when no sessions (bookService:189)
- [ ] Reset URL uses APP_URL env var (authService:148)
- [ ] Pace recalculation on re-read (bookService)
- [ ] Express.json limit + compression (server.js)
- [ ] Session duration loses sub-second precision (sessionService:77)

---

## Code Quality

- [ ] Extract token generation to private method (authService)
- [ ] Combine DB queries in sessionService:startSession
- [ ] Add Prisma transaction for status changes (sessionService)
- [ ] Email failure should be silent or caught (authService:125-127)

---

## Security

- [ ] Restrict CORS to known domains
- [ ] Email verification flow (OTP or link)

---

## Features

- [ ] Profile update endpoint
- [ ] OAuth testing + polish
- [ ] Pagination on getBooks
- [ ] AI Recommendations (Gemini)
- [ ] Z-Library microservice

---

## Testing

- [ ] Unit tests for services (auth, books, sessions)
- [ ] Integration tests with Supertest
- [ ] 80%+ coverage on critical paths

---

## Docker + Deployment

- [ ] Switch schema to PostgreSQL
- [ ] Dockerfile (multi-stage)
- [ ] docker-compose.yml (app + postgres + redis)
- [ ] Health check endpoint
- [ ] Update README with Docker instructions
- [ ] OpenAPI/Swagger spec

---

## CI/CD

- [ ] GitHub Actions: lint + test + build
- [ ] Auto-deploy on merge to main
