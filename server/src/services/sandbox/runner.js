import fs from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import os from 'os';
import { spawn, execSync } from 'child_process';
import { LANGUAGES, validateCode } from './languages.js';
import { env } from '../../config/env.js';
import logger from '../../utils/logger.js';

const MAX_OUTPUT_BYTES = 64 * 1024; // 64 KB cap from doc 07 §3
const MAX_MEMORY_KB = 256 * 1024; // 256 MB RSS cap from doc 07 §3
const COMPILE_TIMEOUT_MS = 10000; // 10 s compile timeout from doc 07 §3

function killProcessGroup(pid) {
  if (!pid) return;
  try {
    process.kill(-pid, 'SIGKILL');
  } catch {
    try {
      process.kill(pid, 'SIGKILL');
    } catch {
      // Process already terminated
    }
  }
}

export async function runLocal({ language, code, stdin = '' }) {
  const langKey = language?.toLowerCase().trim();
  const config = LANGUAGES[langKey];

  if (!config) {
    return {
      status: 'rejected',
      stdout: '',
      stderr: `Unsupported language: ${language}`,
      exitCode: null,
      durationMs: 0,
      truncated: false,
    };
  }

  // Pre-execution static validation
  const validation = validateCode(code);
  if (!validation.valid) {
    return {
      status: 'rejected',
      stdout: '',
      stderr: validation.error,
      exitCode: null,
      durationMs: 0,
      truncated: false,
    };
  }

  // 1. Create unique temp directory with strict mode 0700
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ct-run-'));
  await fs.chmod(tempDir, 0o700);

  // Minimal stripped environment (no app secrets)
  const strippedEnv = {
    PATH: process.env.PATH || '/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin',
    HOME: tempDir,
    LANG: 'en_US.UTF-8',
    LC_ALL: 'en_US.UTF-8',
  };

  const startTime = Date.now();
  let timedOut = false;
  let memoryExceeded = false;
  let outputTruncated = false;

  try {
    // 2. Write source code file
    const sourceFilePath = path.join(tempDir, config.file);
    await fs.writeFile(sourceFilePath, code, 'utf8');

    // 3. Optional compilation step (C, C++, Java, etc.)
    if (config.compile) {
      const compileResult = await new Promise((resolve) => {
        const compileProc = spawn(config.compile[0], config.compile.slice(1), {
          cwd: tempDir,
          env: strippedEnv,
          shell: false,
        });

        let compileStderr = '';
        let compileDone = false;

        const compileTimer = setTimeout(() => {
          if (!compileDone) {
            compileDone = true;
            try {
              compileProc.kill('SIGKILL');
            } catch {}
            resolve({
              success: false,
              stderr: 'Compilation timed out (limit: 10s)',
              exitCode: 1,
            });
          }
        }, COMPILE_TIMEOUT_MS);

        compileProc.stderr.on('data', (chunk) => {
          if (compileStderr.length < MAX_OUTPUT_BYTES) {
            compileStderr += chunk.toString();
          }
        });

        compileProc.on('error', (err) => {
          if (!compileDone) {
            compileDone = true;
            clearTimeout(compileTimer);
            resolve({
              success: false,
              stderr: `Compilation error: ${err.message}`,
              exitCode: 1,
            });
          }
        });

        compileProc.on('close', (exitCode) => {
          if (!compileDone) {
            compileDone = true;
            clearTimeout(compileTimer);
            resolve({
              success: exitCode === 0,
              stderr: compileStderr,
              exitCode,
            });
          }
        });
      });

      if (!compileResult.success) {
        return {
          status: 'error',
          stdout: '',
          stderr: compileResult.stderr || 'Compilation failed',
          exitCode: compileResult.exitCode,
          durationMs: Date.now() - startTime,
          truncated: false,
        };
      }
    }

    // 4. Create wrapper script with ulimit guards
    const wrapperPath = path.join(tempDir, 'run_wrapper.sh');
    const wrapperContent = `#!/bin/sh\nulimit -f 65536 -n 64 2>/dev/null\nexec "$@"\n`;
    await fs.writeFile(wrapperPath, wrapperContent, { mode: 0o755 });

    // 5. Spawn execution process group
    const timeoutMs = env.RUN_TIMEOUT_MS || 5000;
    const runArgs = ['sh', wrapperPath, ...config.run];

    const runResult = await new Promise((resolve) => {
      let stdout = '';
      let stderr = '';
      let executionDone = false;

      const child = spawn(runArgs[0], runArgs.slice(1), {
        cwd: tempDir,
        env: strippedEnv,
        detached: true,
        shell: false,
      });

      // Wall-clock timeout watchdog (5s default)
      const timeoutTimer = setTimeout(() => {
        if (!executionDone) {
          timedOut = true;
          killProcessGroup(child.pid);
        }
      }, timeoutMs);

      // Memory watchdog polling process group RSS every 100ms
      const memoryInterval = setInterval(() => {
        if (!child.pid || executionDone) return;
        try {
          const out = execSync(`ps -o rss= -g ${child.pid}`, {
            stdio: ['pipe', 'pipe', 'ignore'],
          }).toString();

          const totalRssKb = out
            .trim()
            .split('\n')
            .map((line) => parseInt(line.trim(), 10) || 0)
            .reduce((sum, val) => sum + val, 0);

          if (totalRssKb > MAX_MEMORY_KB) {
            memoryExceeded = true;
            killProcessGroup(child.pid);
            clearInterval(memoryInterval);
          }
        } catch {
          // Process likely exited
        }
      }, 100);

      // Supply standard input
      if (typeof stdin === 'string' && stdin.length > 0) {
        try {
          child.stdin.write(stdin);
        } catch {
          // Ignore write error if child already closed stdin
        }
      }
      try {
        child.stdin.end();
      } catch {}

      // Collect stdout with 64 KB cap
      child.stdout.on('data', (chunk) => {
        const text = chunk.toString();
        if (stdout.length + text.length > MAX_OUTPUT_BYTES) {
          stdout += text.slice(0, MAX_OUTPUT_BYTES - stdout.length);
          outputTruncated = true;
          killProcessGroup(child.pid);
        } else {
          stdout += text;
        }
      });

      // Collect stderr with 64 KB cap
      child.stderr.on('data', (chunk) => {
        const text = chunk.toString();
        if (stderr.length + text.length > MAX_OUTPUT_BYTES) {
          stderr += text.slice(0, MAX_OUTPUT_BYTES - stderr.length);
          outputTruncated = true;
          killProcessGroup(child.pid);
        } else {
          stderr += text;
        }
      });

      child.on('error', (err) => {
        if (!executionDone) {
          executionDone = true;
          clearTimeout(timeoutTimer);
          clearInterval(memoryInterval);
          resolve({
            status: 'error',
            stdout,
            stderr: `Execution error: ${err.message}`,
            exitCode: null,
          });
        }
      });

      child.on('close', (exitCode) => {
        if (!executionDone) {
          executionDone = true;
          clearTimeout(timeoutTimer);
          clearInterval(memoryInterval);

          let status = 'success';
          if (timedOut) {
            status = 'timeout';
          } else if (memoryExceeded) {
            status = 'memory';
          } else if (exitCode !== 0) {
            status = 'error';
          }

          resolve({
            status,
            stdout,
            stderr,
            exitCode: timedOut || memoryExceeded ? null : exitCode,
          });
        }
      });
    });

    return {
      status: runResult.status,
      stdout: runResult.stdout,
      stderr: runResult.stderr,
      exitCode: runResult.exitCode,
      durationMs: Date.now() - startTime,
      truncated: outputTruncated,
    };
  } catch (err) {
    logger.error({ err }, 'Unexpected error in sandbox runner');
    return {
      status: 'error',
      stdout: '',
      stderr: `Runner failure: ${err.message}`,
      exitCode: null,
      durationMs: Date.now() - startTime,
      truncated: false,
    };
  } finally {
    // 9. Always remove temp directory
    try {
      if (existsSync(tempDir)) {
        await fs.rm(tempDir, { recursive: true, force: true });
      }
    } catch (cleanupErr) {
      logger.warn({ err: cleanupErr, tempDir }, 'Failed to remove temp runner dir');
    }
  }
}

