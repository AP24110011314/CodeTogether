# 08 — Frontend Spec (React + Vite)

## Routes
| Path | Page | Access |
|------|------|--------|
| /login, /register | Auth pages | public |
| / | Dashboard (my rooms, joined rooms, create room) | auth |
| /room/:slug | Room workspace | auth (+ invite/view token via query) |
| /snippets | Snippet library | auth |
| * | NotFound | public |

## Room Page Layout
```
┌ Top bar: room name · language select · theme · font size · Run ▶ · Save snippet · Share · Members ┐
├──────────────────────────────┬───────────────────────┤
│ Monaco editor (Yjs bound)    │ Tabs: Chat | Users    │
│                              │                       │
├──────────────────────────────┴───────────────────────┤
│ Bottom panel: Output | Stdin | Run history           │
└──────────────────────────────────────────────────────┘
```

## State (zustand)
- `authStore`: user, accessToken, login/logout/refresh.
- `roomStore`: room, role, members, language, connectionStatus, messages, runs, activeRun.

## Key Components
- **CodeEditor**: creates `Y.Doc`, `SocketIOProvider`, `MonacoBinding` on mount; destroys on unmount; `readOnly` option from role (updates live on `room:role-changed`).
- **SocketIOProvider** (`lib/SocketIOProvider.js`): implements doc 06 sync + awareness; exposes `status` (`connecting|connected|disconnected`) and `synced` flag. Show a banner while disconnected.
- **UserList / TypingIndicator**: from awareness states; avatar = first letter on `color` background.
- **ChatPanel**: virtualized/auto-scroll list, send on Enter, Shift+Enter newline, unread badge.
- **OutputPanel / StdinInput / RunHistory**: per doc 07 §8; Run disabled for viewers and while the user's run is active.
- **SaveSnippetModal / SnippetList**: title, tags input, language prefilled.
- **MembersModal / ShareModal**: owner-only controls hidden for others.

## Remote Cursor Styling
Generate CSS per client id at runtime:
```css
.yRemoteSelection-<id> { background: <color>33; }
.yRemoteSelectionHead-<id> { border-left: 2px solid <color>; }
.yRemoteSelectionHead-<id>::after { content: "<name>"; background: <color>; color:#fff; font-size:11px; padding:0 4px; position:absolute; top:-1.4em; }
```

## UX Requirements
Loading skeletons, toasts for errors, empty states, responsive (collapse side panel under 900 px), light/dark theme, keyboard shortcuts: `Cmd/Ctrl+Enter` run, `Cmd/Ctrl+S` save snippet, `Cmd/Ctrl+B` toggle side panel.

## Env (`client/.env.example`)
```
VITE_API_URL=http://localhost:4000/api
VITE_SOCKET_URL=http://localhost:4000
```
