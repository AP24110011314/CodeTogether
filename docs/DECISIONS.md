# Decisions Log
Agent: record any ambiguity you resolved here (date, decision, reason).

- 2026-10-31: Phase 0 setup: Mounted health checks at both `/api/health` and `/health` to support both base API routing and root health checks; locked Vite client server port strictly to 5173.
- 2026-10-31: Phase 1 auth: Stored bcrypt hashes of refresh tokens in MongoDB for defense-in-depth against token replay; skipped IP rate limits in test environments (`NODE_ENV === 'test'`).
