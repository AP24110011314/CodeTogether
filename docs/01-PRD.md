# 01 — Product Requirements Document

## 1. Overview
CodeTogether lets developers create coding rooms, share code, and collaborate in real time with live cursors, chat, saved snippets, and one-click sandboxed code execution.

## 2. Goals
- Multiple users edit one document simultaneously with guaranteed convergence.
- See who is online, where their cursor is, and what they selected.
- Run code safely and show output to everyone in the room.
- Persist rooms, documents, snippets, chat, and run history.

## 3. Non-Goals (v1)
Multi-file projects, video/voice, a full terminal, mobile-native apps.

## 4. Users and Roles
| Role | Permissions |
|------|-------------|
| Owner | Everything, plus change roles, kick, delete room, change visibility |
| Editor | Edit code, chat, run code, save snippets |
| Viewer | Read code, see cursors, chat (configurable), cannot edit or run |

## 5. Features and Acceptance Criteria

### F1 Authentication
- Register, login, logout, JWT access token + refresh token (httpOnly cookie).
- **AC:** Wrong credentials rejected; protected routes return 401 without a token; passwords hashed with bcrypt.

### F2 Rooms
- Create a room (name, language, visibility public/private). Join via link `/room/:slug`.
- Dashboard lists "my rooms" and "joined rooms". Owner can rename, delete, regenerate invite link.
- **AC:** Private rooms reject non-members unless they hold a valid invite token; slug is unique.

### F3 Shared Editor (Monaco)
- Monaco with language switching, theme switching, font size, minimap toggle.
- **AC:** Language change in one client updates for all clients in the room.

### F4 Multi-User Real-Time Editing
- Yjs CRDT over Socket.IO; reconnect resyncs without data loss; offline edits merge on reconnect.
- **AC:** Two clients typing at the same position at the same time converge to identical text; 5 clients over 60 seconds with no divergence.

### F5 Presence Indicators
- Online user list with avatar colors, live remote cursors and selections with name labels, "typing" indicator.
- **AC:** Join/leave appears within 1 second; a disconnected user's cursor disappears within 5 seconds.

### F6 Syntax Highlighting
- Monaco built-in highlighting for at least: JavaScript, TypeScript, Python, Java, C, C++, Go, Rust, HTML, CSS, JSON, Markdown, SQL.

### F7 Room Chat
- Real-time messages, persisted, history loaded on join (last 50, paginate older), system messages for join/leave.
- **AC:** Messages appear for all members in under 500 ms on localhost; refresh keeps history.

### F8 Saved Snippets
- Save current editor content (or selection) as a snippet with title, language, tags. Personal library with search, filter by language/tag, edit, delete, and "insert into editor" or "open as new room".
- **AC:** Snippets survive logout/login; only the owner can read or modify private snippets.

### F9 Integrated Code Execution (Sandbox)
- Run button, stdin input, output panel (stdout, stderr, exit code, duration), run history per room, results broadcast to all members.
- Supported languages v1: JavaScript (Node), Python, plus C/C++/Java/Go if the toolchain is installed.
- Limits: timeout, memory cap, output cap, per-user rate limit, queue.
- **AC:** Infinite loop killed at timeout; `while True: pass` and huge output do not crash the server; network and file access to the host are blocked as far as design allows (see doc 07).

### F10 Room Management and Sharing
- Invite link, read-only share link, member list with role changes, kick, owner-only delete.

## 6. Non-Functional Requirements
- Edit propagation under 200 ms on localhost; handles 10 concurrent users per room.
- Snapshots saved debounced (every 5 s of activity) and on last-user-leave.
- Accessible keyboard navigation; responsive layout down to tablet width.

## 7. Demo Script
1. Register two users in two browser windows (one incognito).
2. User A creates a Python room, shares the link; user B joins.
3. Both type at once; show live cursors and names.
4. Chat; save a snippet; load it back.
5. Run code with stdin; output appears for both.
6. Close and reopen the room: code is still there.
