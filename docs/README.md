# CodeTogether — Collaborative Coding Workspace

Real-time coding rooms: shared Monaco editor, live cursors, chat, saved snippets, and sandboxed code execution.

**Stack:** MongoDB, Express, React (Vite), Node.js, Socket.IO, Monaco Editor, Yjs (CRDT).
**Constraints:** No Docker. Never use port 5000 (macOS AirPlay Receiver occupies it).

## Document Index (read in this order)

| # | File | Purpose |
|---|------|---------|
| 0 | `AGENTS.md` | Rules for the coding agent (OpenCode / Claude Code). Read first. |
| 1 | `docs/01-PRD.md` | Features, user stories, acceptance criteria |
| 2 | `docs/02-ARCHITECTURE.md` | System design, folder structure, data flow |
| 3 | `docs/03-IMPLEMENTATION-PLAN.md` | Phase-by-phase build plan with checklists |
| 4 | `docs/04-DATABASE-SCHEMA.md` | Mongoose models and indexes |
| 5 | `docs/05-API-SPEC.md` | REST endpoints |
| 6 | `docs/06-SOCKET-EVENTS.md` | Socket.IO + Yjs protocol |
| 7 | `docs/07-CODE-EXECUTION.md` | Sandbox design without Docker |
| 8 | `docs/08-FRONTEND-SPEC.md` | Pages, components, state |
| 9 | `docs/09-SECURITY-TESTING.md` | Security checklist and test plan |
| 10 | `docs/10-SETUP-DEPLOYMENT.md` | macOS setup, env vars, deployment |

## Port Map (no 5000)

| Service | Port |
|---------|------|
| Backend (Express + Socket.IO) | **4000** |
| Frontend (Vite dev) | **5173** |
| MongoDB (local via Homebrew) | 27017 |

Also avoid 7000 (AirPlay on newer macOS). Check any port with `lsof -i :4000`.

## Quick Start

```bash
brew tap mongodb/brew && brew install mongodb-community node
brew services start mongodb-community
cd server && cp .env.example .env && npm install && npm run dev   # :4000
cd client && cp .env.example .env && npm install && npm run dev   # :5173
```

Details in `docs/10-SETUP-DEPLOYMENT.md`.
