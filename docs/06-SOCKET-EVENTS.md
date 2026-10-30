# 06 — Socket.IO and Yjs Protocol

Server: `http://localhost:4000`. Client connects with `io(URL, { auth: { token: accessToken } })`. Handshake middleware verifies JWT and sets `socket.data.user`. Reject with `connect_error` on failure.

Binary payloads are sent as `ArrayBuffer`/`Uint8Array`. Every handler first calls `permissions.can(socket, roomId, action)`.

## Room
| Direction | Event | Payload | Notes |
|-----------|-------|---------|-------|
| C→S | `room:join` | `{slug, inviteToken?, viewToken?}` | ack `{ok, room, role, members, messages}` |
| C→S | `room:leave` | `{roomId}` | |
| S→C | `room:members` | `[{userId,name,color,role,online}]` | on any change |
| S→C | `room:error` | `{code,message}` | |
| C→S | `room:language` | `{roomId, language}` | editor+ |
| S→C | `room:language` | `{language}` | broadcast |
| S→C | `room:role-changed` | `{userId, role}` | client updates read-only state |
| S→C | `room:kicked` | `{roomId}` | then server removes socket from room |

## Yjs Sync (custom provider)
| Direction | Event | Payload |
|-----------|-------|---------|
| C→S | `yjs:sync-step1` | `{roomId, stateVector}` |
| S→C | `yjs:sync-step2` | `{roomId, update}` (diff the client lacks) |
| S→C | `yjs:sync-step1` | `{roomId, stateVector}` (server asks client for its diff) |
| C→S | `yjs:sync-step2` | `{roomId, update}` |
| C→S / S→C | `yjs:update` | `{roomId, update}` incremental; server drops it if sender is viewer, otherwise applies and broadcasts to others |

Provider rules:
- Apply remote updates with `Y.applyUpdate(doc, update, 'remote')`; only emit updates whose origin !== 'remote'.
- On socket `connect` (including reconnect) run the full sync handshake again.
- Queue nothing manually; Yjs state vectors make resync idempotent.

## Awareness
| Direction | Event | Payload |
|-----------|-------|---------|
| C→S / S→C | `awareness:update` | `{roomId, update}` (`y-protocols/awareness` encoded) |
| S→C | `awareness:remove` | `{roomId, clientIds}` on disconnect |

Client awareness local state: `{ user: {id, name, color}, typing: boolean }`. Selection/cursor handled by y-monaco.

## Chat
| C→S | `chat:send` | `{roomId, text}` → persisted, then S→C `chat:message` `{id,userId,name,color,text,type,createdAt}` to room |
| C→S | `chat:typing` | optional; use awareness instead |

## Code Execution
| Direction | Event | Payload |
|-----------|-------|---------|
| C→S | `run:start` | `{roomId, language, stdin}` (editor+; source = server Y.Doc text) |
| S→C | `run:queued` | `{runId, position, by}` |
| S→C | `run:started` | `{runId, by}` |
| S→C | `run:result` | `{runId, status, stdout, stderr, exitCode, durationMs, truncated, by}` |
| S→C | `run:rejected` | `{reason: 'rate_limit'|'queue_full'|'forbidden'|'unsupported'}` |

## Server Internals
- Socket rooms named `room:<roomId>`.
- Per-socket joined-room set; on `disconnect` emit awareness removal, update members, system chat message, schedule snapshot flush if room is empty.
