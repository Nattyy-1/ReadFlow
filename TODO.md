[ ] Refactor: Validation Layer – Implement Zod schemas for all POST/PUT routes to replace manual if checks.

[ ] Refactor: Global Error Handler – Create an Express middleware to catch all errors and remove try/catch blocks from every controller.

[ ] Security: Rate Limiting – Add express-rate-limit to the /auth routes to prevent brute-force attacks.

[ ] Observability: Logging – Integrate Morgan (for HTTP requests) and Winston (for system errors).

[ ] Security: Environment Audit – Ensure JWT_SECRET and DATABASE_URL are strictly loaded via .env.
