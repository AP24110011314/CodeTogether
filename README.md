# CodeTogether 🚀

> **Real-time collaborative coding workspace and educational platform** featuring multi-user Monaco editor synchronization (CRDT), live cursor awareness, multi-language code execution, room chat, an integrated **AI Tutor (Google Gemini)**, and a **macOS "Liquid Glass"** UI.

---

## 🌟 Overview

**CodeTogether** is a modern, real-time web application designed for developer interviews, pair programming, algorithmic classrooms, and code mentoring. Built with performance and user experience in mind, it combines conflict-free distributed editing with real-time audio/visual presence, instant code execution, and pedagogical AI assistance.

### Key Highlights
- **Zero Conflict Editing**: Powered by [Yjs](https://github.com/yjs/yjs) CRDTs over WebSockets with live cursor and selection tracking.
- **Pedagogical AI Tutor**: Powered by **Google Gemini** (`gemini-3.5-flash` via `@google/genai`), offering step-by-step guidance, Big-O analysis, and hints rather than raw answers.
- **Multi-Language Sandboxed Execution**: Run JavaScript, Python 3, TypeScript, C, C++, and Java safely without requiring Docker.
- **Instant Join**: Join any classroom directly using full URLs, relative paths, or room codes. Unauthenticated users are redirected to login and returned seamlessly to their destination without losing invite tokens.
- **macOS Liquid Glass UI**: Clean typography, frosted glass blur surfaces (`backdrop-filter`), animated gradient mesh backgrounds, light/dark themes, and full mobile responsiveness down to 360px.
- **AirPlay Safe**: Strict port governance (Backend: `4000`, Frontend: `5173`) avoiding macOS port `5000` conflicts.

---

## 🛠️ Architecture & Tech Stack

```
                     ┌────────────────────────────────────────┐
                     │          React 18 + Vite (5173)         │
                     │  - Monaco Editor + y-monaco            │
                     │  - macOS Liquid Glass Design Tokens    │
                     │  - Socket.IO Client / Zustand          │
                     └───────┬────────────────────────┬───────┘
                             │ REST API               │ WebSockets (Yjs + Chat + Presence)
                             ▼                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          Express + Socket.IO Server (4000)                  │
│                                                                             │
│  ┌───────────────────────┐ ┌───────────────────────┐ ┌────────────────────┐ │
│  │   Auth / JWT Module   │ │   Room & Chat Manager │ │   Yjs Sync Server  │ │
│  └───────────────────────┘ └───────────────────────┘ └────────────────────┘ │
│  ┌───────────────────────┐ ┌───────────────────────┐ ┌────────────────────┐ │
│  │  AI Tutor (Gemini)    │ │ Local Sandbox Runner  │ │ Snippet Repository │ │
│  │  @google/genai SDK    │ │ Child Process Queue   │ │ Mongoose Models    │ │
│  └───────────────────────┘ └───────────────────────┘ └────────────────────┘ │
└──────────────────────┬────────────────────────────────────────┬─────────────┘
                       │                                        │
                       ▼                                        ▼
           ┌──────────────────────┐                 ┌──────────────────────┐
           │     MongoDB Atlas    │                 │   Google Gemini API  │
           │  (Users, Rooms, Yjs) │                 │  (gemini-3.5-flash)  │
           └──────────────────────┘                 └──────────────────────┘
```

### Frontend (`client/`)
- **Core**: React 18, Vite 5, React Router v7
- **Editor**: Monaco Editor (`@monaco-editor/react`), `y-monaco`, `yjs`, `y-protocols`
- **Design Tokens**: Pure CSS variables (`tokens.css`), glassmorphism, responsive navigation drawer
- **Icons & State**: `lucide-react`, `zustand`, `axios`

### Backend (`server/`)
- **Runtime**: Node.js (ES Modules), Express 4, Socket.IO 4
- **Database**: MongoDB (Mongoose 8) with binary Yjs snapshot storage
- **Security**: Helmet, CORS, Express Rate Limit, bcryptjs, HTTP-only JWTs, Zod schema validation
- **AI Integration**: Google Gen AI SDK (`@google/genai`)
- **Execution Sandbox**: Concurrent child-process execution with timeouts, memory constraints, and buffer output limits (`p-queue`)

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **MongoDB**: Local instance running on port `27017` or a MongoDB Atlas connection URI

### 1. Clone & Install Dependencies

```bash
# Clone the repository
git clone https://github.com/your-username/CodeTogether.git
cd CodeTogether

# Install root, server, and client dependencies
npm install
npm --prefix server install
npm --prefix client install
```

### 2. Configure Environment Variables

#### Backend Configuration (`server/.env`)
Create or edit `server/.env`:
```env
PORT=4000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/codetogether
CLIENT_URL=http://localhost:5173
JWT_ACCESS_SECRET=your-super-secret-access-key-32-chars-minimum
JWT_REFRESH_SECRET=your-super-secret-refresh-key-32-chars-minimum

# Code Execution Engine (local child processes, no Docker required)
EXECUTOR=local
RUN_TIMEOUT_MS=5000
RUN_MEMORY_MB=256
RUN_OUTPUT_LIMIT_KB=64
RUN_CONCURRENCY=2

# AI Tutor (Google Gemini)
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-3.5-flash
```

#### Frontend Configuration (`client/.env`)
Create or edit `client/.env`:
```env
VITE_API_URL=http://localhost:4000/api
VITE_SOCKET_URL=http://localhost:4000
```

> **Note on macOS Ports**: Never change backend to port `5000` or `7000` because macOS AirPlay Receiver reserves those ports.

---

### 3. Seed Demo Data

Populate the database with pre-configured users, collaborative workspaces, snippets, and chat messages:

```bash
npm run seed
```

This creates **4 demo accounts** (Password: `password123` for all):
| Name | Email | Role |
| :--- | :--- | :--- |
| **Alice Developer** | `alice@codetogether.dev` | Owner / Lead Engineer |
| **Bob Engineer** | `bob@codetogether.dev` | Editor / Systems Developer |
| **Charlie Student** | `charlie@codetogether.dev` | Student / Learner |
| **Dr. Alan Turing** | `turing@codetogether.dev` | Mentor / Instructor |

---

### 4. Run the Application

Start both the backend server and frontend client concurrently:

```bash
npm run dev
```

- **Frontend Client**: [http://localhost:5173](http://localhost:5173)
- **Backend API Server**: [http://localhost:4000](http://localhost:4000)
- **API Health Check**: [http://localhost:4000/api/health](http://localhost:4000/api/health)

Alternatively, run each service independently:
```bash
# Terminal 1 - Backend (port 4000)
npm run dev:server

# Terminal 2 - Frontend (port 5173)
npm run dev:client
```

---

## 🤖 AI Tutor Setup & Verification

The built-in AI Tutor acts as a patient computer science educator:
- Explains concepts step by step.
- Provides directional hints and algorithmic questions before giving away full solutions.
- Performs Big-O time and space complexity evaluations.
- Renders Markdown code blocks with syntax highlighting and one-click copy buttons.

### Verifying Your Gemini API Key
To verify that your Gemini API key and model connectivity work properly, run the included diagnostics CLI:

```bash
npm run test:ai
```

Expected diagnostic output:
```text
--- CodeTogether AI Tutor Diagnostics ---
Environment: development
Model target: gemini-3.5-flash
API Key detected (length: 53 chars)
Connecting to Google Gemini API via official @google/genai SDK...
✅ Success! Response received in ~4000ms:
AI Tutor is operational and ready to assist learners.
```

---

## 🔗 "Join Class by Link or Code" Feature

Learners can join classrooms seamlessly in multiple ways:
1. **Direct Room Code / Slug**: Enter `dsa-bootcamp` or `algorithms-101`.
2. **Relative Path**: Enter `/room/distributed-systems`.
3. **Full URL with Invite Token**: Enter `http://localhost:5173/room/competitive-cpp?invite=tok_abc123`.
4. **Unauthenticated Preservation**: If a user opens a link while logged out, the system redirects them to `/login`, preserving the target URL and token in state, and routes them directly into the classroom after login or signup.

---

## 🧪 Testing & Verification

The project includes unit and integration tests covering REST APIs, WebSocket protocol handlers, Yjs CRDT synchronization, rate limiting, and Gemini AI interactions.

```bash
# Run all automated tests (13 suites, 118 tests)
npm test

# Run tests in watch mode
npm --prefix server run test:watch

# Verify frontend production build
npm run build
```

---

## 📡 API Reference

### Authentication (`/api/auth`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/auth/register` | Register new user account | No |
| `POST` | `/api/auth/login` | Authenticate and obtain JWT access cookie | No |
| `POST` | `/api/auth/refresh` | Rotate and issue fresh access token | No |
| `POST` | `/api/auth/logout` | Clear auth cookies and invalidate session | Yes |
| `GET` | `/api/auth/me` | Retrieve authenticated user profile | Yes |

### Classrooms / Rooms (`/api/rooms`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `GET` | `/api/rooms` | List accessible rooms & search by query | Yes |
| `POST` | `/api/rooms` | Create a new classroom workspace | Yes |
| `GET` | `/api/rooms/:slug` | Get room metadata, permissions, & language | Yes |
| `POST` | `/api/rooms/:slug/join` | Join room via invite token or public access | Yes |
| `PATCH` | `/api/rooms/:slug/members/:userId` | Update member role (`viewer` / `editor`) | Yes (Owner) |
| `DELETE` | `/api/rooms/:slug/members/:userId` | Kick member from classroom | Yes (Owner) |

### AI Tutor (`/api/ai-tutor`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/ai-tutor/chat` | Send prompt with conversation history & code context | Yes (Rate limited) |

### Code Execution (`/api/run`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/run` | Execute code payload (JS, Python, TS, C, C++, Java) | Yes |

### Snippets (`/api/snippets`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `GET` | `/api/snippets` | List saved snippets | Yes |
| `POST` | `/api/snippets` | Save current editor code as snippet | Yes |
| `DELETE` | `/api/snippets/:id` | Delete snippet | Yes |

### Health Check (`/api/health`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `GET` | `/api/health` | Service and database heartbeat check | No |

---

## ⚡ WebSocket Events (`Socket.IO`)

- **Yjs CRDT Synchronization**:
  - `yjs:sync-step-1` / `yjs:sync-step-2`: Initial state vector exchange.
  - `yjs:update`: Binary delta broadcasts between clients.
  - `yjs:awareness`: Real-time cursor coordinates and user selections.
- **Presence & Room Operations**:
  - `room:join` / `room:leave`: Room membership broadcast.
  - `room:users`: Current active participant roster.
  - `room:role-change`: Instant privilege elevation/demotion notifications.
- **Chat**:
  - `chat:message`: Instant room-scoped messaging with author metadata.

---

## 📂 Project Structure

```
CodeTogether/
├── client/                      # React 18 + Vite frontend
│   ├── src/
│   │   ├── api/                 # Axios clients (auth, rooms, snippets, aiTutor)
│   │   ├── components/
│   │   │   ├── layout/          # Navbar, ThemeToggle, MobileDrawer
│   │   │   ├── room/            # Editor, OutputPanel, ChatPanel, AiMentorPanel, JoinClassInput
│   │   │   └── ui/              # GlassModal, Button, Input, Toast
│   │   ├── context/             # AuthContext, SocketContext
│   │   ├── hooks/               # useCollab, useTheme, useExecution
│   │   ├── lib/                 # linkParser, formatting utilities
│   │   ├── pages/               # Dashboard, Login, Register, RoomPage, Snippets
│   │   └── styles/              # tokens.css (macOS Liquid Glass design system)
│   ├── package.json
│   └── vite.config.js
│
├── server/                      # Express + Socket.IO backend
│   ├── scripts/                 # Diagnostics (testAi.js)
│   ├── src/
│   │   ├── config/              # Environment schema (env.js), DB connector
│   │   ├── controllers/         # auth, rooms, aiTutor, execution, snippets
│   │   ├── middleware/          # auth, rateLimit, errorHandler
│   │   ├── models/              # User, Room, Document (Yjs), Message, Snippet
│   │   ├── routes/              # Express API routers
│   │   ├── services/            # aiTutor (Gemini), codeExecution (sandbox)
│   │   ├── sockets/             # yjsHandler, presenceHandler, chatHandler
│   │   ├── utils/               # token generators, slugifiers
│   │   ├── index.js             # Server entry point
│   │   └── seed.js              # Comprehensive demo dataset seeder
│   ├── tests/                   # 13 Vitest suites (118 tests)
│   ├── package.json
│   └── vitest.config.js
│
├── docs/                        # Specifications, PRD, & Architecture docs
├── package.json                 # Root script runner (concurrently)
└── README.md                    # Project documentation
```

---

## 🔒 Security Best Practices

- **Sandboxed Execution**: Child processes run in isolated temporary workspaces with timeout limits (10s max), memory constraints (256MB max), and buffered stream truncations.
- **Secure Authentication**: Passwords hashed with `bcryptjs` (salt rounds: 10), short-lived access JWTs with rotation.
- **Credential Protection**: API keys (including `GEMINI_API_KEY`) reside strictly on the server and are scrubbed from all client responses and log statements.
- **Rate Limiting**: AI Tutor endpoints are rate-limited per IP (20 requests/minute) to prevent quota exhaustion.

---

## 📄 License

This project is open-source under the [MIT License](LICENSE).

