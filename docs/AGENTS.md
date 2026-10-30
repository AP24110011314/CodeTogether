# AGENTS.md — Instructions for the Coding Agent

You are building **CodeTogether**. Read `README.md`, then the docs in `docs/` in order. Implement phase by phase from `docs/03-IMPLEMENTATION-PLAN.md`.

## Hard Rules
1. **No Docker.** No Dockerfile, docker-compose, or container-based tooling anywhere.
2. **Never use port 5000.** Backend = `4000`, frontend = `5173`. Read ports from env vars (`PORT`, `CLIENT_URL`).
3. Use **Yjs** for document sync. Do NOT broadcast raw text diffs.
4. **Never run user code in the main server process** (no `eval`, `vm`, `Function`). Use the sandbox runner in `docs/07-CODE-EXECUTION.md`.
5. Validate room membership/role on **every** socket event, not only on connect.
6. Never commit `.env`. Keep `.env.example` current.
7. Use ES modules (`"type": "module"`) in both server and client. JavaScript (no TypeScript) unless told otherwise.
8. Validate all request bodies with `zod`.

## Working Style
- Finish one phase fully (all checklist items and acceptance tests) before starting the next.
- After each phase, run the app, run tests, and tick the checklist in `docs/03-IMPLEMENTATION-PLAN.md`.
- If a doc is ambiguous, choose the simplest option consistent with the docs and note it in `docs/DECISIONS.md`.
- Keep files small and single-purpose; follow the folder structure in `docs/02-ARCHITECTURE.md`.

## Definition of Done (whole project)
Every feature in `docs/01-PRD.md` works, all acceptance criteria pass, and the demo script in the PRD runs end to end.
