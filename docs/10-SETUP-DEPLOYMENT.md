# 10 — Setup (macOS, no Docker) and Deployment

## 1. Prerequisites
```bash
brew install node            # Node 20+
brew tap mongodb/brew && brew install mongodb-community
brew services start mongodb-community
# optional language toolchains for the sandbox
brew install python gcc go openjdk
```
If `mongosh` or `node` is not found on Apple Silicon, add `eval "$(/opt/homebrew/bin/brew shellenv)"` to `~/.zshrc`.
Alternative to local Mongo: a free MongoDB Atlas cluster (set `MONGODB_URI`).

## 2. Ports
Backend **4000**, frontend **5173**, Mongo 27017. Do not use 5000 or 7000 (AirPlay Receiver). If a port is busy: `lsof -i :4000` and change `PORT`.

## 3. Environment Variables
`server/.env.example`
```
PORT=4000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/codetogether
CLIENT_URL=http://localhost:5173
JWT_ACCESS_SECRET=change-me-long-random
JWT_REFRESH_SECRET=change-me-another-long-random
EXECUTOR=local
RUN_TIMEOUT_MS=5000
RUN_MEMORY_MB=256
RUN_OUTPUT_LIMIT_KB=64
RUN_CONCURRENCY=2
# JUDGE0_URL=
# JUDGE0_KEY=
```
`client/.env.example` as in doc 08.

## 4. Scripts
Server: `dev` (nodemon src/index.js), `start`, `test`, `seed`. Client: `dev`, `build`, `preview`.
Optional root script: `npm run dev` using `concurrently` to start both.

## 5. Common macOS Issues
| Problem | Fix |
|---------|-----|
| `EADDRINUSE :5000` | You should not be on 5000; use 4000 |
| Mongo connection refused | `brew services restart mongodb-community` |
| Monaco workers not loading in Vite | use `@monaco-editor/react` loader, or configure `vite-plugin-monaco-editor` |
| CORS/cookie not set | `credentials: true` on cors and axios; same `CLIENT_URL` |

## 6. Production (no Docker)
| Part | Host | Notes |
|------|------|-------|
| Frontend | Vercel / Netlify | set `VITE_API_URL`, `VITE_SOCKET_URL` |
| Backend | Render / Railway / a VPS with PM2 | needs persistent WebSocket support; one instance for v1 (Yjs docs live in memory) |
| Database | MongoDB Atlas | whitelist backend IP |
| Execution | `EXECUTOR=judge0` or Linux hardening from doc 07 §6 | do not expose the macOS-style local runner publicly |

Cookies in production: `Secure`, `SameSite=None` if frontend and backend are on different domains.

## 7. Scaling Later
Multiple instances need sticky sessions plus a Socket.IO Redis adapter and a shared Yjs strategy; out of scope for v1.
