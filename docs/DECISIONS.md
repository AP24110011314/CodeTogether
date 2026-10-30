# Decisions Log
Agent: record any ambiguity you resolved here (date, decision, reason).

- 2026-10-31: Phase 0 setup: Mounted health checks at both `/api/health` and `/health` to support both base API routing and root health checks; locked Vite client server port strictly to 5173.
- 2026-10-31: Phase 1 auth: Stored bcrypt hashes of refresh tokens in MongoDB for defense-in-depth against token replay; skipped IP rate limits in test environments (`NODE_ENV === 'test'`).
- 2026-10-31: Phase 2 rooms: Initialized `Document` record eagerly upon room creation; auto-added authenticated visitors to public room member lists; stored client Monaco preferences in `localStorage` with prefix `codetogether:`.
- 2026-10-31: Phase 3 sockets: Verified JWTs in Socket.IO handshake auth; mapped online presence dynamically via adapter room sockets to preserve in-process simplicity without Redis.
- 2026-10-31: Phase 4 Yjs sync: Registered `Y.Doc` synchronously in `yjsManager` prior to async DB fetch to resolve race conditions; raised Socket.IO `maxHttpBufferSize` to 5 MB to allow application-level 1 MB security validation; configured Vitest with `fileParallelism: false` to ensure test suites sharing local MongoDB do not conflict.
