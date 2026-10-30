# 07 — Code Execution Without Docker

## 1. Honest Threat Model
Docker/gVisor are out. On macOS there are no cgroups or Linux namespaces, so a child process **cannot** be fully isolated. The design therefore uses defense in depth for development/demo, plus a pluggable executor so production can use a stronger backend.

**Rule:** the main server process never evaluates user code. All code runs in short-lived child processes.

## 2. Executor Interface
```js
// services/sandbox/index.js
export async function execute({ language, code, stdin }) -> {
  status, stdout, stderr, exitCode, durationMs, truncated
}
```
Selected by `EXECUTOR` env var:
| Value | Backend | Use |
|-------|---------|-----|
| `local` (default) | Hardened child-process runner (this doc) | macOS dev/demo |
| `judge0` | Hosted Judge0 CE API (`JUDGE0_URL`, `JUDGE0_KEY`) | Production without Docker on your side |

Implement both behind the same interface; the rest of the app never knows which is active.

## 3. Local Runner Algorithm (`runner.js`)
1. Make temp dir: `fs.mkdtemp(os.tmpdir()/ct-run-)` with mode 0700.
2. Write source to a file named per `languages.js`.
3. If the language compiles (C, C++, Java, Go, Rust), run compile step first with its own 10 s timeout; compile errors → `status:'error'`, stderr = compiler output.
4. Spawn with `child_process.spawn`:
   - `cwd` = temp dir, `detached: true` (own process group), `shell: false`
   - `env` = minimal `{ PATH, HOME: tempDir, LANG }` (no secrets; never pass `process.env`)
   - stdin: write the given stdin then `end()`
5. Wrap command with limits through a tiny shell wrapper script: `ulimit -t <cpuSec> -f <fileKB> -n 64 -u 64` (note: `ulimit -v` is unreliable on macOS, so memory is enforced in step 7).
6. Wall-clock timeout (default 5 s): on expiry `process.kill(-child.pid, 'SIGKILL')` (kills the whole group) → `status:'timeout'`.
7. Memory watchdog: every 100 ms run `ps -o rss= -p <pid>` (and children via process group); if RSS > 256 MB kill → `status:'memory'`.
8. Output caps: accumulate stdout/stderr up to 64 KB each; beyond that stop reading, kill the process, set `truncated:true`.
9. `finally`: remove temp dir with `fs.rm(dir,{recursive:true,force:true})`; always clear timers.

## 4. Language Config (`languages.js`)
```js
javascript: { file:'main.js',   run:['node','main.js'] }
python:     { file:'main.py',   run:['python3','main.py'] }
typescript: { file:'main.ts',   run:['npx','--no-install','tsx','main.ts'] } // optional
c:          { file:'main.c',    compile:['gcc','main.c','-o','main'], run:['./main'] }
cpp:        { file:'main.cpp',  compile:['g++','main.cpp','-o','main'], run:['./main'] }
java:       { file:'Main.java', compile:['javac','Main.java'], run:['java','Main'] }
go:         { file:'main.go',   run:['go','run','main.go'] }
```
Probe at startup with `which`; expose only available ones. Install via Homebrew if wanted (`brew install gcc go openjdk`).

## 4b. Pre-execution Static Guards (cheap extra layer)
Reject (status `rejected`) code over 100 KB. Optionally block obvious dangerous patterns per language (e.g. Node `child_process`, Python `subprocess`/`os.system`, `socket`) with a clear message. This is a speed bump, not a security boundary — say so in the UI.

## 5. Queue and Rate Limits (`runQueue.js`)
- `p-queue` concurrency **2**, max pending **20** (else `run:rejected queue_full`).
- Per-user: 5 runs/minute (in-memory sliding window), 1 concurrent run per user.
- Only editor/owner roles may run. Source always taken from the server-side Y.Doc.
- Persist every result as `ExecutionRun` and broadcast `run:result`.

## 6. Hardening Upgrades (when deploying to Linux, still no Docker)
- Run executor as an unprivileged OS user with no access to app files.
- `firejail` or `bubblewrap (bwrap)` wrapper: `--net=none --private --rlimit-as=268435456 --read-only=/`
- cgroups via `systemd-run --user --scope -p MemoryMax=256M -p CPUQuota=50%`
- Or use `EXECUTOR=judge0` against a hosted instance.

## 7. Known Limitations (document in README)
On macOS the local runner cannot block network access or reading world-readable files. Use it only with trusted users in development; use the Linux hardening or Judge0 for public deployment.

## 8. Output Panel Contract
Show: status badge, stdout, stderr (red), exit code, duration, "output truncated" notice, who ran it, timestamp.
