# 05 — REST API Spec

Base URL: `http://localhost:4000/api` · JSON · errors: `{ "error": { "code": "STRING", "message": "..." } }`
Auth: `Authorization: Bearer <accessToken>` unless marked public.

## Auth
| Method | Path | Body | Response |
|--------|------|------|----------|
| POST | /auth/register (public) | name, email, password(≥8) | 201 `{user, accessToken}` + refresh cookie |
| POST | /auth/login (public) | email, password | 200 `{user, accessToken}` + refresh cookie |
| POST | /auth/refresh (cookie) | — | 200 `{accessToken}` (rotates refresh) |
| POST | /auth/logout | — | 204, clears cookie |
| GET | /auth/me | — | 200 `{user}` |

## Rooms
| Method | Path | Notes |
|--------|------|-------|
| POST | /rooms | `{name, language, visibility}` → 201 room (creator = owner) |
| GET | /rooms?scope=mine\|joined | list |
| GET | /rooms/:slug | metadata; private rooms need membership or `?invite=` / `?view=` token |
| PATCH | /rooms/:id | owner: name, language, visibility, defaultRole |
| DELETE | /rooms/:id | owner; cascades |
| POST | /rooms/:id/invite/regenerate | owner → new inviteToken and viewToken |
| POST | /rooms/join | `{slug, inviteToken?, viewToken?}` → adds membership |
| PATCH | /rooms/:id/members/:userId | owner: `{role}` |
| DELETE | /rooms/:id/members/:userId | owner kick (or self leave) |

## Messages
| GET | /rooms/:id/messages?before=<iso>&limit=50 | members only; newest-first page |

## Snippets
| Method | Path | Notes |
|--------|------|-------|
| POST | /snippets | `{title, language, code, tags[]}` |
| GET | /snippets?q=&language=&tag=&page=&limit= | own snippets only |
| GET | /snippets/:id | owner only |
| PATCH | /snippets/:id | owner |
| DELETE | /snippets/:id | owner |

## Runs
| GET | /runs/languages | available languages on this machine |
| GET | /rooms/:id/runs?limit=20 | run history (members) |
| GET | /runs/:id | single run (room members) |
Execution itself is triggered by socket event `run:start` (doc 06).

## Misc
`GET /health` → `{status:"ok"}` (public)

## Status Codes
400 validation, 401 unauthenticated, 403 forbidden role, 404 not found, 409 duplicate email, 429 rate limited.
