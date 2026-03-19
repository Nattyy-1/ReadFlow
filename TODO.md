[ ] Refactor: Validation Layer – Implement Zod schemas for all POST/PUT routes to replace manual if checks.

[ ] Refactor: Global Error Handler – Create an Express middleware to catch all errors and remove try/catch blocks from every controller.

[ ] Security: Rate Limiting – Add express-rate-limit to the /auth routes to prevent brute-force attacks.

[ ] Observability: Logging – Integrate Morgan (for HTTP requests) and Winston (for system errors).

[ ] Security: Environment Audit – Ensure JWT_SECRET and DATABASE_URL are strictly loaded via .env.

[ ] Refactor: Token Blacklisting – Add a /logout endpoint and Redis middleware to check a "No-Fly List" on every request.

[ ] Feature: Access/Refresh Split – Issue 15-min Access Tokens and 7-day Refresh Tokens to minimize the window of risk for stolen keys.

[ ] Database: Session Tracking – Add a Session model to schema.prisma to track and revoke specific device logins.
[ ] Refactor: Config Layer – Move all process.env calls into a single config.js with "fail-fast" validation.
