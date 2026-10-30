# 03 — Implementation Plan

Work through phases in order. Tick every box and pass the acceptance test before moving on. Estimated total: 5–6 weeks part-time.

---
## Phase 0 — Project Setup (0.5 day)
- [x] Create `codetogether/` with `server/` and `client/`; `git init`; root `.gitignore` (node_modules, .env, dist, tmp-runs)
- [x] Server deps: `express socket.io mongoose zod jsonwebtoken bcryptjs cookie-parser cors helmet express-rate-limit dotenv yjs y-protocols lib0 p-queue nanoid pino`
- [x] Server dev deps: `nodemon vitest supertest socket.io-client`
- [x] Client: `npm create vite@latest client -- --template react`; deps: `monaco-editor @monaco-editor/react yjs y-monaco y-protocols socket.io-client react-router-dom zustand axios zod`
- [x] Add `.env.example` files with PORT=4000, CLIENT_URL=http://localhost:5173
- [x] Mongo running locally; `/api/health` returns ok on :4000
- **Accept:** both apps start; no reference to port 5000 anywhere (`grep -rn "5000" .` is empty).

## Phase 1 — Auth (2 days)
- [x] `User` model, register/login/refresh/logout/me endpoints (doc 05)
- [x] bcrypt hashing, JWT access token, refresh token in httpOnly cookie, auth middleware
- [x] Client: Login/Register pages, `authStore`, axios interceptor with silent refresh, `ProtectedRoute`
- [x] Assign random `avatarColor` at registration
- **Accept:** register → login → refresh page stays logged in → logout clears session; bad password rejected.

## Phase 2 — Rooms and Editor Shell (3 days)
- [x] `Room` model; endpoints: create, list mine/joined, get by slug, update, delete, invite regenerate
- [x] Slug via nanoid(10); invite token for private rooms
- [x] Dashboard page: create-room modal (name, language, visibility), room cards
- [x] Room page layout: top bar, Monaco editor (local only), side panel placeholders
- [x] Language, theme, font-size, minimap controls (persist user prefs in localStorage)
- **Accept:** create room, open via link, edit locally, switch language/theme; private room blocks outsiders.

## Phase 3 — Socket Server and Room Sessions (2 days)
- [x] Socket.IO server with JWT handshake auth (`auth: { token }`)
- [x] `room:join` / `room:leave`, membership + visibility check, auto-add member as editor for public rooms (viewer if owner set default viewer)
- [x] `permissions.js` helper: `can(role, action)` used by every handler
- [x] Emit `room:members` and system join/leave events
- [x] `room:language` change broadcast (editor+)
- **Accept:** two browsers join the same room and see each other in the member list; unauthorized join gets `room:error`.

## Phase 4 — Yjs Real-Time Sync (4 days) ★ core
- [x] Server `yjsManager`: `getDoc(roomId)` loads snapshot from `Document`, caches `Y.Doc`, ref-counts connections, destroys after idle
- [x] Client `SocketIOProvider` (doc 06): sync step 1/2, incremental updates, reconnect resync, origin tagging to avoid echo loops
- [x] Bind with `MonacoBinding(yText, model, new Set([editor]), awareness)`
- [x] Server rejects updates from viewers
- [x] Debounced snapshot (5 s) and flush on last disconnect; store `Y.encodeStateAsUpdate`
- [x] Optional compaction: re-encode doc fresh on snapshot to trim history
- **Accept:** (a) two clients type simultaneously → identical text; (b) kill the network on one client, type, reconnect → merged; (c) restart server → text restored from Mongo.

## Phase 5 — Presence and Cursors (2 days)
- [x] Awareness set on client: `{ user: {id, name, color}, cursor/selection (by y-monaco), typing }`
- [x] Relay `awareness:update` through server; remove states on disconnect
- [x] CSS for remote cursor and selection using user color; name label above cursor
- [x] `UserList` with colored avatars, role badge, typing indicator
- **Accept:** colored cursor and label follow the other user; disappears ≤5 s after tab close.

## Phase 6 — Chat (1.5 days)
- [x] `Message` model; REST `GET /rooms/:id/messages?before=&limit=`
- [x] Socket `chat:send` → validate (≤2000 chars), persist, broadcast `chat:message`
- [x] ChatPanel: auto-scroll, infinite scroll upward, system messages, unread badge when collapsed
- [x] Rate limit: 10 messages / 10 s per user
- **Accept:** messages appear live, history persists after refresh.

## Phase 7 — Saved Snippets (2 days)
- [x] `Snippet` model; CRUD endpoints with search (`q`), `language`, `tag` filters, pagination
- [x] "Save as snippet" modal (uses selection if present else whole doc) from the room toolbar
- [x] `/snippets` page: list, search, filter, edit, delete, copy
- [x] "Insert into editor" (applies as a Yjs transaction at cursor) and "Open in new room"
- **Accept:** snippet saved in one session appears after re-login; other users cannot access it.

## Phase 8 — Code Execution Sandbox (5 days) ★ core
Follow doc 07 exactly.
- [ ] `languages.js` config (command, file name, compile step, timeout)
- [ ] `runner.js`: temp dir per run, spawn with stripped env, `timeout`, memory polling, stdout/stderr caps, process-group kill, cleanup in `finally`
- [ ] Language availability probe at startup (`which node python3 gcc ...`); `/api/runs/languages` returns only available ones
- [ ] `runQueue.js`: `p-queue` concurrency 2, max pending 20, per-user rate limit (5 runs / min)
- [ ] `ExecutionRun` model; socket events `run:start`, `run:queued`, `run:started`, `run:result`
- [ ] Client: Run button (Cmd/Ctrl+Enter), stdin textarea, OutputPanel with stdout/stderr tabs, exit code, duration, run-history list, loading and kill states
- [ ] Adversarial tests (doc 09 list)
- **Accept:** infinite loop → "Time limit exceeded"; memory bomb killed; 10 MB print truncated; output visible to all room members.

## Phase 9 — Room Management and Sharing (1.5 days)
- [ ] `MembersModal`: change role (owner), kick (owner), list online status
- [ ] `ShareModal`: invite link copy, read-only share link (viewer-role token), regenerate invalidates old
- [ ] Owner can delete room (cascade Document, Messages, Runs)
- [ ] Kicked user's socket disconnected from the room immediately
- **Accept:** role change takes effect live (viewer's editor becomes read-only with no refresh).

## Phase 10 — Polish and Hardening (3 days)
- [ ] Error boundaries, toasts, loading skeletons, empty states, reconnect banner
- [ ] Keyboard shortcuts (run, toggle chat, save snippet)
- [ ] Responsive layout; light/dark theme
- [ ] Security checklist and full test run (doc 09)
- [ ] Seed script `npm run seed` with demo users and a sample room
- **Accept:** demo script in PRD §7 passes end to end.

## Phase 11 — Deployment (1 day)
- [ ] Follow doc 10: MongoDB Atlas, backend on Render/Railway (WebSocket-capable), frontend on Vercel
- [ ] Note: hosted Linux gets stronger isolation options (see doc 07 §6)
- **Accept:** live URL works with two real devices.

## Feature Coverage Matrix
| PRD feature | Phase |
|-------------|-------|
| F1 Auth | 1 |
| F2 Rooms | 2, 3 |
| F3 Editor | 2 |
| F4 Multi-user editing | 4 |
| F5 Presence | 5 |
| F6 Syntax highlighting | 2 |
| F7 Chat | 6 |
| F8 Snippets | 7 |
| F9 Code execution | 8 |
| F10 Management/sharing | 9 |
