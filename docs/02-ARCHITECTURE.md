# 02 — Architecture

## 1. High-Level Diagram
```
React (Vite :5173)
 ├─ Monaco + y-monaco ── Yjs Doc + Awareness
 └─ socket.io-client ──────────────┐
                                   ▼
Node/Express + Socket.IO (:4000)
 ├─ REST  /api/*  (auth, rooms, snippets, messages, runs)
 ├─ Socket namespaces/events: room, yjs, awareness, chat, run
 ├─ YjsManager   (in-memory Y.Doc per active room, debounced persistence)
 ├─ RunQueue     (p-queue, concurrency-limited, in-process)
 └─ Sandbox runner (child processes, temp dirs, limits)
                                   ▼
                              MongoDB (:27017)
```

## 2. Key Design Decisions
| Topic | Decision | Reason |
|-------|----------|--------|
| Sync | Yjs CRDT, custom Socket.IO provider | Concurrent edits converge; no OT server logic |
| Presence | Yjs Awareness protocol | Cursors/selections/colors free |
| Persistence | Y.encodeStateAsUpdate snapshot to Mongo (Buffer) | Compact, fast load |
| Queue | `p-queue` in-process (no Redis) | No extra service on macOS dev |
| Execution | Hardened child-process runner (no Docker) | See doc 07 |
| Auth | JWT access (15 min) + refresh cookie (7 d) | Standard, socket handshake auth |
| Validation | zod | Single source of truth |
| Ports | Server 4000, client 5173 | Avoid macOS 5000/7000 |

## 3. Folder Structure
```
codetogether/
├─ server/
│  ├─ package.json  .env.example
│  └─ src/
│     ├─ index.js            # http server + socket bootstrap
│     ├─ app.js              # express app, middleware, routes
│     ├─ config/ env.js db.js
│     ├─ models/ User.js Room.js Document.js Snippet.js Message.js ExecutionRun.js
│     ├─ middleware/ auth.js validate.js rateLimit.js error.js
│     ├─ routes/ auth.js rooms.js snippets.js messages.js runs.js
│     ├─ controllers/ (one per route file)
│     ├─ sockets/
│     │  ├─ index.js         # io setup, auth middleware
│     │  ├─ roomHandlers.js  # join/leave/role/kick/language
│     │  ├─ yjsHandlers.js   # sync + updates
│     │  ├─ awarenessHandlers.js
│     │  ├─ chatHandlers.js
│     │  └─ runHandlers.js
│     ├─ services/
│     │  ├─ yjsManager.js    # doc cache, persistence, compaction
│     │  ├─ permissions.js   # role checks
│     │  ├─ runQueue.js
│     │  └─ sandbox/ index.js languages.js runner.js
│     └─ utils/ slug.js logger.js
├─ client/
│  ├─ package.json  .env.example  vite.config.js
│  └─ src/
│     ├─ main.jsx App.jsx router.jsx
│     ├─ api/ http.js auth.js rooms.js snippets.js
│     ├─ lib/ socket.js SocketIOProvider.js
│     ├─ store/ authStore.js roomStore.js   (zustand)
│     ├─ pages/ Login Register Dashboard Room Snippets NotFound
│     ├─ components/
│     │  ├─ editor/ CodeEditor.jsx Toolbar.jsx LanguageSelect.jsx
│     │  ├─ presence/ UserList.jsx TypingIndicator.jsx
│     │  ├─ chat/ ChatPanel.jsx MessageItem.jsx
│     │  ├─ run/ OutputPanel.jsx StdinInput.jsx RunHistory.jsx
│     │  ├─ snippets/ SnippetList.jsx SaveSnippetModal.jsx
│     │  └─ room/ MembersModal.jsx ShareModal.jsx
│     └─ styles/
└─ docs/
```

## 4. Data Flow: Typing
1. Monaco change → y-monaco updates `Y.Text` → Yjs emits `update` (Uint8Array).
2. Provider emits `yjs:update {roomId, update}` over Socket.IO.
3. Server checks role (editor/owner), applies to the server `Y.Doc`, broadcasts to the room (excluding sender), schedules debounced snapshot.
4. Other clients apply the update; y-monaco renders it.

## 5. Data Flow: Join
1. Client calls `room:join` with slug (+ invite token if private).
2. Server verifies membership/visibility, joins socket to room, loads/creates `Y.Doc` from Mongo.
3. Client and server exchange state vectors (`yjs:sync-step1/2`); awareness states exchanged.
4. Server sends recent chat, member list, room metadata.

## 6. Data Flow: Run Code
1. Client emits `run:start {roomId, language, stdin}` (source = server's current Y.Doc text; never trust client code).
2. Server checks role + rate limit, enqueues; emits `run:queued`, `run:started`.
3. Runner executes in sandbox; result saved as `ExecutionRun`.
4. Server emits `run:result` to the whole room.
