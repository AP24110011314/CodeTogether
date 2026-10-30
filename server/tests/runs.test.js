import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { io as Client } from 'socket.io-client';
import app from '../src/app.js';
import { server } from '../src/index.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { User } from '../src/models/User.js';
import { Room } from '../src/models/Room.js';
import { ExecutionRun } from '../src/models/ExecutionRun.js';
import { Document } from '../src/models/Document.js';
import {
  getAvailableLanguages,
  isLanguageAvailable,
  validateCode,
} from '../src/services/sandbox/languages.js';
import { runLocal } from '../src/services/sandbox/runner.js';
import {
  enqueueRun,
  checkEligibility,
  clearQueueRateLimits,
} from '../src/services/sandbox/runQueue.js';
import { yjsManager } from '../src/services/yjsManager.js';

describe('Phase 8 — Code Execution Sandbox & Security Testing', () => {
  let userOwner, tokenOwner;
  let userViewer, tokenViewer;
  let userOutsider, tokenOutsider;
  let testRoom;
  let serverPort;
  let socketUrl;

  let activeSockets = [];

  const connectClient = (token) => {
    return new Promise((resolve, reject) => {
      const client = Client(socketUrl, {
        auth: token ? { token } : undefined,
        reconnection: false,
      });
      client.on('connect', () => {
        activeSockets.push(client);
        resolve(client);
      });
      client.on('connect_error', (err) => reject(err));
    });
  };

  beforeAll(async () => {
    await connectDB();
    await new Promise((resolve) => {
      server.listen(0, () => {
        serverPort = server.address().port;
        socketUrl = `http://localhost:${serverPort}`;
        resolve();
      });
    });
  });

  afterAll(async () => {
    for (const s of activeSockets) {
      if (s.connected) s.disconnect();
    }
    activeSockets = [];
    await new Promise((r) => setTimeout(r, 150));

    await User.deleteMany({
      email: { $in: ['run_owner@test.com', 'run_viewer@test.com', 'run_out@test.com'] },
    });
    await Room.deleteMany({});
    await ExecutionRun.deleteMany({});
    await Document.deleteMany({});
    await new Promise((resolve) => server.close(resolve));
    await disconnectDB();
  });

  beforeEach(async () => {
    for (const s of activeSockets) {
      if (s.connected) s.disconnect();
    }
    activeSockets = [];
    await User.deleteMany({
      email: { $in: ['run_owner@test.com', 'run_viewer@test.com', 'run_out@test.com'] },
    });
    await Room.deleteMany({});
    await ExecutionRun.deleteMany({});
    await Document.deleteMany({});
    clearQueueRateLimits();

    // Register User Owner
    const resOwner = await request(app).post('/api/auth/register').send({
      name: 'Run Owner',
      email: 'run_owner@test.com',
      password: 'password123',
    });
    userOwner = resOwner.body.user;
    tokenOwner = resOwner.body.accessToken;

    // Register User Viewer
    const resViewer = await request(app).post('/api/auth/register').send({
      name: 'Run Viewer',
      email: 'run_viewer@test.com',
      password: 'password123',
    });
    userViewer = resViewer.body.user;
    tokenViewer = resViewer.body.accessToken;

    // Register User Outsider
    const resOut = await request(app).post('/api/auth/register').send({
      name: 'Run Outsider',
      email: 'run_out@test.com',
      password: 'password123',
    });
    userOutsider = resOut.body.user;
    tokenOutsider = resOut.body.accessToken;

    // Create public room owned by userOwner
    const resRoom = await request(app)
      .post('/api/rooms')
      .set('Authorization', `Bearer ${tokenOwner}`)
      .send({
        name: 'Execution Test Room',
        language: 'javascript',
        visibility: 'public',
        defaultRole: 'editor',
      });
    testRoom = resRoom.body.room;

    // Add userViewer with viewer role
    await Room.findByIdAndUpdate(testRoom.id, {
      $push: {
        members: {
          userId: userViewer.id,
          role: 'viewer',
          joinedAt: new Date(),
        },
      },
    });
  });

  describe('1. Language Config and Availability Probe', () => {
    it('probes available runtimes on the host machine', () => {
      const languages = getAvailableLanguages();
      expect(Array.isArray(languages)).toBe(true);
      expect(languages.length).toBeGreaterThan(0);

      // Node.js is running this test, so javascript must be available
      expect(isLanguageAvailable('javascript')).toBe(true);
      expect(isLanguageAvailable('non_existent_lang')).toBe(false);
    });

    it('validates code size limit (<= 100 KB)', () => {
      const normalCode = 'console.log("hello");';
      expect(validateCode(normalCode).valid).toBe(true);

      const hugeCode = 'x'.repeat(101 * 1024);
      const res = validateCode(hugeCode);
      expect(res.valid).toBe(false);
      expect(res.error).toMatch(/100 KB limit/i);
    });
  });

  describe('2. Queue and Rate Limiting (`runQueue.js`)', () => {
    it('enforces 1 concurrent run per user', async () => {
      const userId = 'user_concurrent_test';

      const task1 = enqueueRun({
        userId,
        task: async () => {
          await new Promise((r) => setTimeout(r, 200));
          return 'done';
        },
      });

      // Second run immediately for same user should throw rate_limit
      expect(() => {
        enqueueRun({
          userId,
          task: async () => 'not allowed',
        });
      }).toThrow();

      await task1.promise;
    });

    it('enforces sliding window rate limit (5 runs / minute)', async () => {
      const userId = 'user_rate_limit_test';

      // Run 5 rapid sequential runs
      for (let i = 0; i < 5; i++) {
        const { promise } = enqueueRun({
          userId,
          task: async () => i,
        });
        await promise;
      }

      // 6th run in same window should be rejected
      const eligibility = checkEligibility(userId);
      expect(eligibility.allowed).toBe(false);
      expect(eligibility.reason).toBe('rate_limit');

      expect(() => {
        enqueueRun({
          userId,
          task: async () => 6,
        });
      }).toThrow();
    });
  });

  describe('3. Sandbox Adversarial & Security Tests (`runner.js`)', () => {
    it('executes valid JavaScript and returns stdout', async () => {
      const res = await runLocal({
        language: 'javascript',
        code: 'console.log("CodeTogether Sandbox OK");',
      });

      expect(res.status).toBe('success');
      expect(res.stdout.trim()).toBe('CodeTogether Sandbox OK');
      expect(res.exitCode).toBe(0);
      expect(res.durationMs).toBeGreaterThan(0);
    });

    it('handles standard input (stdin)', async () => {
      const code = `
        const readline = require('readline');
        const rl = readline.createInterface({ input: process.stdin });
        rl.on('line', (line) => {
          console.log('Received: ' + line);
          process.exit(0);
        });
      `;

      const res = await runLocal({
        language: 'javascript',
        code,
        stdin: 'Testing Stdin Input',
      });

      expect(res.status).toBe('success');
      expect(res.stdout).toContain('Received: Testing Stdin Input');
    });

    it('adversarial: while(true){} times out in <= ~5s with status "timeout"', async () => {
      const res = await runLocal({
        language: 'javascript',
        code: 'while (true) {}',
      });

      expect(res.status).toBe('timeout');
      expect(res.durationMs).toBeGreaterThanOrEqual(4800);
      expect(res.durationMs).toBeLessThan(7000);
    }, 10000);

    it('adversarial: large output print is truncated at 64 KB with process killed', async () => {
      const res = await runLocal({
        language: 'javascript',
        code: 'console.log("X".repeat(200000));',
      });

      expect(res.truncated).toBe(true);
      expect(Buffer.byteLength(res.stdout)).toBeLessThanOrEqual(64 * 1024 + 10);
    });

    it('adversarial: stripped environment hides server secrets (no JWT/Mongo secrets)', async () => {
      const res = await runLocal({
        language: 'javascript',
        code: 'console.log(JSON.stringify(process.env));',
      });

      expect(res.status).toBe('success');
      const childEnv = JSON.parse(res.stdout);

      // Verify no sensitive app secrets were leaked
      expect(childEnv.JWT_ACCESS_SECRET).toBeUndefined();
      expect(childEnv.JWT_REFRESH_SECRET).toBeUndefined();
      expect(childEnv.MONGODB_URI).toBeUndefined();
      expect(childEnv.PORT).toBeUndefined();

      // Only basic env vars exist
      expect(childEnv.PATH).toBeDefined();
      expect(childEnv.HOME).toBeDefined();
    });

    it('adversarial: syntax/runtime error sets status "error" with stderr', async () => {
      const res = await runLocal({
        language: 'javascript',
        code: 'throw new Error("Deliberate user crash");',
      });

      expect(res.status).toBe('error');
      expect(res.exitCode).not.toBe(0);
      expect(res.stderr).toContain('Deliberate user crash');
    });

    if (isLanguageAvailable('c')) {
      it('adversarial: C compilation error sets status "error" with compiler stderr', async () => {
        const res = await runLocal({
          language: 'c',
          code: 'int main() { invalid_c_syntax_error(); return 0; }',
        });

        expect(res.status).toBe('error');
        expect(res.stderr).toContain('error:');
      });
    }
  });

  describe('4. REST API Endpoints', () => {
    it('GET /api/runs/languages returns available languages', async () => {
      const res = await request(app).get('/api/runs/languages');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.languages)).toBe(true);
      expect(res.body.languages.some((l) => l.id === 'javascript')).toBe(true);
    });

    it('GET /api/rooms/:id/runs returns runs history for members', async () => {
      // Create a mock run
      await ExecutionRun.create({
        roomId: testRoom.id,
        userId: userOwner.id,
        language: 'javascript',
        code: 'console.log(123);',
        stdout: '123\n',
        status: 'success',
        exitCode: 0,
        durationMs: 45,
      });

      const res = await request(app)
        .get(`/api/rooms/${testRoom.id}/runs`)
        .set('Authorization', `Bearer ${tokenOwner}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.runs)).toBe(true);
      expect(res.body.runs.length).toBe(1);
      expect(res.body.runs[0].stdout).toBe('123\n');
      expect(res.body.runs[0].user.name).toBe(userOwner.name);
    });

    it('GET /api/rooms/:id/runs rejects outsider for private room', async () => {
      const resPriv = await request(app)
        .post('/api/rooms')
        .set('Authorization', `Bearer ${tokenOwner}`)
        .send({
          name: 'Private Room',
          language: 'javascript',
          visibility: 'private',
        });
      const privRoom = resPriv.body.room;

      const res = await request(app)
        .get(`/api/rooms/${privRoom.id}/runs`)
        .set('Authorization', `Bearer ${tokenOutsider}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('GET /api/runs/:id returns run details for room member', async () => {
      const run = await ExecutionRun.create({
        roomId: testRoom.id,
        userId: userOwner.id,
        language: 'javascript',
        code: 'console.log("test single");',
        stdout: 'test single\n',
        status: 'success',
      });

      const res = await request(app)
        .get(`/api/runs/${run._id}`)
        .set('Authorization', `Bearer ${tokenOwner}`);

      expect(res.status).toBe(200);
      expect(res.body.run.id).toBe(run._id.toString());
      expect(res.body.run.stdout).toBe('test single\n');
    });
  });

  describe('5. Real-Time Socket Execution Flow', () => {
    it('rejects execution attempt by a viewer with "forbidden"', async () => {
      const clientViewer = await connectClient(tokenViewer);

      // Join room
      await new Promise((resolve) => {
        clientViewer.emit('room:join', { slug: testRoom.slug }, resolve);
      });

      const rejectedPromise = new Promise((resolve) => {
        clientViewer.on('run:rejected', resolve);
      });

      clientViewer.emit('run:start', {
        roomId: testRoom.id,
        language: 'javascript',
      });

      const rejection = await rejectedPromise;
      expect(rejection.reason).toBe('forbidden');

      clientViewer.disconnect();
    });

    it('rejects unsupported language with "unsupported"', async () => {
      const clientOwner = await connectClient(tokenOwner);

      await new Promise((resolve) => {
        clientOwner.emit('room:join', { slug: testRoom.slug }, resolve);
      });

      const rejectedPromise = new Promise((resolve) => {
        clientOwner.on('run:rejected', resolve);
      });

      clientOwner.emit('run:start', {
        roomId: testRoom.id,
        language: 'cobol_or_unsupported',
      });

      const rejection = await rejectedPromise;
      expect(rejection.reason).toBe('unsupported');

      clientOwner.disconnect();
    });

    it('executes code from Y.Doc and broadcasts queued, started, and result to room', async () => {
      const clientOwner = await connectClient(tokenOwner);
      const clientViewer = await connectClient(tokenViewer);

      await new Promise((resolve) => {
        clientOwner.emit('room:join', { slug: testRoom.slug }, resolve);
      });
      await new Promise((resolve) => {
        clientViewer.emit('room:join', { slug: testRoom.slug }, resolve);
      });

      // Populate Y.Doc with executable code
      const doc = await yjsManager.getDoc(testRoom.id);
      doc.getText('monaco').delete(0, doc.getText('monaco').length);
      doc.getText('monaco').insert(0, 'console.log("Broadcasted Output 999");');

      const queuedPromise = new Promise((resolve) => {
        clientViewer.on('run:queued', resolve);
      });
      const startedPromise = new Promise((resolve) => {
        clientViewer.on('run:started', resolve);
      });
      const resultPromise = new Promise((resolve) => {
        clientViewer.on('run:result', resolve);
      });

      clientOwner.emit('run:start', {
        roomId: testRoom.id,
        language: 'javascript',
      });

      const queuedEvent = await queuedPromise;
      expect(queuedEvent.runId).toBeDefined();
      expect(queuedEvent.by.id).toBe(userOwner.id);

      const startedEvent = await startedPromise;
      expect(startedEvent.runId).toBe(queuedEvent.runId);

      const resultEvent = await resultPromise;
      expect(resultEvent.runId).toBe(queuedEvent.runId);
      expect(resultEvent.status).toBe('success');
      expect(resultEvent.stdout.trim()).toBe('Broadcasted Output 999');

      // Verify DB persistence
      const savedRun = await ExecutionRun.findById(resultEvent.runId);
      expect(savedRun).toBeDefined();
      expect(savedRun.status).toBe('success');
      expect(savedRun.stdout.trim()).toBe('Broadcasted Output 999');

      clientOwner.disconnect();
      clientViewer.disconnect();
    });
  });
});
