# ReadFlow ROADMAP

## Completed

- [x] Zod validation schemas for POST/PUT routes
- [x] Global error handler middleware
- [x] Rate limiting on /auth routes
- [x] P2002 → 409 "already taken" translation
- [x] P2025 → 404 "not found" translation
- [x] JWT error handling (invalid/expired)
- [x] Reset URL uses APP_URL env var
- [x] Runnable integration tests for auth, books, and sessions
- [x] OAuth flow test coverage

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

- [x] timingSafeEqual length check (authService:188)
- [x] Google Books API try/catch (bookService:16)
- [x] Google Books response optional chaining (bookService:20-25)
- [ ] Review getPace behavior for no-session books and decide between 404 vs 0/null
- [ ] Pace recalculation on re-read (bookService)
- [ ] Express.json limit + compression (server.js)
- [ ] Session duration loses sub-second precision (sessionService:77)

---

## Code Quality

- [ ] Extract token generation to private method (authService)
- [ ] Combine DB queries in sessionService:startSession
- [ ] Add Prisma transaction for status changes (sessionService)
- [x] Email failure should be silent or caught (authService:125-127)

---

## Security

- [ ] Restrict CORS to known domains
- [ ] Email verification flow (OTP or link)

---

## Features

- [ ] Profile update endpoint
- [x] OAuth testing + polish
- [ ] Pagination on getBooks
- [ ] AI Recommendations (Gemini)
- [ ] Z-Library microservice

---

## Testing

- [ ] Unit tests for services (auth, books, sessions)
- [x] Integration tests for API-critical paths
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
