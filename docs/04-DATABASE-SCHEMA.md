# 04 — Database Schema (Mongoose)

## User
```js
{ name: String(req, 2-50), email: String(req, unique, lowercase),
  passwordHash: String(req, select:false), avatarColor: String(hex),
  refreshTokenHash: String(select:false), createdAt, updatedAt }
// index: email unique
```

## Room
```js
{ name: String(req), slug: String(unique), ownerId: ObjectId(User),
  language: String(default 'javascript'), visibility: 'public'|'private',
  defaultRole: 'editor'|'viewer' (default 'editor'),
  members: [{ userId: ObjectId, role: 'owner'|'editor'|'viewer', joinedAt }],
  inviteToken: String, viewToken: String,   // viewToken grants viewer role
  createdAt, updatedAt }
// indexes: slug unique; ownerId; 'members.userId'
```

## Document
```js
{ roomId: ObjectId(unique), yjsState: Buffer, updatedAt: Date }
// one doc per room (single-file v1)
```

## Snippet
```js
{ userId: ObjectId, title: String(req, ≤100), language: String, code: String(≤100KB),
  tags: [String](≤10), createdAt, updatedAt }
// indexes: {userId, updatedAt:-1}; text index on title+tags
```

## Message
```js
{ roomId: ObjectId, userId: ObjectId|null, type: 'user'|'system',
  text: String(≤2000), createdAt }
// index: {roomId, createdAt:-1}
```

## ExecutionRun
```js
{ roomId: ObjectId, userId: ObjectId, language: String, code: String,
  stdin: String(≤10KB), stdout: String, stderr: String,
  status: 'queued'|'running'|'success'|'error'|'timeout'|'memory'|'rejected',
  exitCode: Number, durationMs: Number, createdAt }
// index: {roomId, createdAt:-1}; TTL optional: 30 days
```

## Cascade Rules
Deleting a Room deletes its Document, Messages, and ExecutionRuns. Deleting a User removes them from `members` and deletes their Snippets.
