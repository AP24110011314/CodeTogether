# 09 — Security Checklist and Test Plan

## Security Checklist
- [ ] bcrypt cost ≥ 10; JWT secrets from env; access 15 min, refresh 7 d httpOnly + SameSite cookie
- [ ] `helmet`, strict CORS (`CLIENT_URL` only), JSON body limit 1 MB
- [ ] zod validation on every REST body/query and every socket payload
- [ ] Permission check on **every** socket event (`can(role, action)`); re-read role from DB or cached members on role change
- [ ] Rate limits: auth routes (10/15 min/IP), chat, runs, snippet creation
- [ ] Snippet/room queries always scoped by `userId`/membership (no IDOR)
- [ ] Limit Yjs update size (≤ 1 MB) and document size (≤ 1 MB text) per room
- [ ] Sanitize chat text on render (React escapes by default; never use `dangerouslySetInnerHTML`)
- [ ] Runner env stripped of secrets; temp dirs 0700 and always removed
- [ ] No `eval`/`vm`/`Function` with user code in server process
- [ ] `.env` gitignored; no secrets in client bundle
- [ ] No Docker files, no port 5000 (`grep -rn "5000\|docker" -i .`)

## Test Plan
**Unit (vitest):** permissions matrix, slug/token generation, zod schemas, runner output-cap and timeout logic, rate-limit window.
**API (supertest):** auth flow, room CRUD and private-room access, snippet ownership (user B gets 403/404 on user A's snippet), message pagination.
**Socket (socket.io-client):**
- unauthenticated connect rejected
- viewer `yjs:update` ignored; editor update reaches other client
- two clients apply concurrent edits → equal `Y.Text` strings
- kicked user stops receiving events
**Sandbox adversarial cases:**
| Case | Expected |
|------|----------|
| `while(true){}` / `while True: pass` | `timeout` in ≤ ~5 s, server responsive |
| allocate arrays in a loop | `memory` kill |
| print 50 MB | truncated at 64 KB, process killed |
| fork bomb attempt | blocked by `ulimit -u`/timeout, server alive |
| read `process.env` | no secrets visible |
| compile error (C) | `error` with compiler stderr |
| 10 rapid runs from one user | rate-limited after 5 |
**Manual E2E:** PRD §7 demo script with two browsers; network throttle/offline test for reconnect merging.

## Definition of Done
All checklist boxes ticked, all tests green, demo script passes.
