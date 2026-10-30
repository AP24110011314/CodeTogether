import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import * as Y from 'yjs';
import { io as Client } from 'socket.io-client';
import app from '../src/app.js';
import { server } from '../src/index.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { User } from '../src/models/User.js';
import { Room } from '../src/models/Room.js';
import { Document } from '../src/models/Document.js';
import { yjsManager } from '../src/services/yjsManager.js';

describe('Phase 4 — Yjs Real-Time Sync & Security', () => {
  let userA, tokenA;
  let userB, tokenB;
  let userViewer, tokenViewer;
  let testRoom;
  let serverPort;
  let socketUrl;

  const connectClient = (token) => {
    return new Promise((resolve, reject) => {
      const client = Client(socketUrl, {
        auth: token ? { token } : undefined,
        reconnection: false,
      });
      client.on('connect', () => resolve(client));
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
    await User.deleteMany({
      email: { $in: ['yjs_a@test.com', 'yjs_b@test.com', 'yjs_v@test.com'] },
    });
    await Room.deleteMany({});
    await Document.deleteMany({});
    await new Promise((resolve) => server.close(resolve));
    await disconnectDB();
  });

  beforeEach(async () => {
    await User.deleteMany({
      email: { $in: ['yjs_a@test.com', 'yjs_b@test.com', 'yjs_v@test.com'] },
    });
    await Room.deleteMany({});
    await Document.deleteMany({});
    yjsManager.docs.clear();

    // Register User A (Owner)
    const resA = await request(app).post('/api/auth/register').send({
      name: 'Yjs User A',
      email: 'yjs_a@test.com',
      password: 'password123',
    });
    userA = resA.body.user;
    tokenA = resA.body.accessToken;

    // Register User B (Editor)
    const resB = await request(app).post('/api/auth/register').send({
      name: 'Yjs User B',
      email: 'yjs_b@test.com',
      password: 'password123',
    });
    userB = resB.body.user;
    tokenB = resB.body.accessToken;

    // Register User Viewer
    const resV = await request(app).post('/api/auth/register').send({
      name: 'Yjs Viewer',
      email: 'yjs_v@test.com',
      password: 'password123',
    });
    userViewer = resV.body.user;
    tokenViewer = resV.body.accessToken;

    // Create room owned by User A
    const resRoom = await request(app)
      .post('/api/rooms')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ name: 'Yjs Room', language: 'javascript', visibility: 'public' });
    testRoom = resRoom.body.room;
  });

  it('converges concurrent edits from two clients to identical text without data loss', async () => {
    const clientA = await connectClient(tokenA);
    const clientB = await connectClient(tokenB);

    const docA = new Y.Doc();
    const docB = new Y.Doc();
    const textA = docA.getText('monaco');
    const textB = docB.getText('monaco');

    try {
      // Both clients join the room
      await new Promise((resolve) => clientA.emit('room:join', { slug: testRoom.slug }, resolve));
      await new Promise((resolve) => clientB.emit('room:join', { slug: testRoom.slug }, resolve));

      // Hook up doc update listener on clients to emit yjs:update
      docA.on('update', (update, origin) => {
        if (origin !== 'remote') clientA.emit('yjs:update', { roomId: testRoom.id, update });
      });
      docB.on('update', (update, origin) => {
        if (origin !== 'remote') clientB.emit('yjs:update', { roomId: testRoom.id, update });
      });

      // Hook up incoming yjs:update on clients
      clientA.on('yjs:update', (data) => {
        Y.applyUpdate(docA, new Uint8Array(data.update), 'remote');
      });
      clientB.on('yjs:update', (data) => {
        Y.applyUpdate(docB, new Uint8Array(data.update), 'remote');
      });

      // Both clients perform simultaneous insertions at position 0
      textA.insert(0, 'console.log("Hello from A");\n');
      textB.insert(0, 'console.log("Hello from B");\n');

      // Wait a moment for network exchange
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Both local texts must be identical and non-empty
      expect(textA.toString().length).toBeGreaterThan(0);
      expect(textA.toString()).toBe(textB.toString());

      // Server doc in memory must also match
      const serverText = yjsManager.getText(testRoom.id);
      expect(serverText).toBe(textA.toString());
    } finally {
      clientA.disconnect();
      clientB.disconnect();
      docA.destroy();
      docB.destroy();
    }
  });

  it('rejects and drops yjs:update edits from viewer role', async () => {
    // Demote userViewer to viewer role in room
    const privRoomRes = await request(app)
      .post('/api/rooms')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ name: 'Private For Viewer', visibility: 'private' });
    const privRoom = privRoomRes.body.room;

    const clientViewer = await connectClient(tokenViewer);
    const clientOwner = await connectClient(tokenA);

    const docViewer = new Y.Doc();
    const docOwner = new Y.Doc();
    const textViewer = docViewer.getText('monaco');
    const textOwner = docOwner.getText('monaco');

    try {
      // Owner joins
      await new Promise((resolve) => clientOwner.emit('room:join', { slug: privRoom.slug }, resolve));
      // Viewer joins using viewToken (viewer role)
      await new Promise((resolve) =>
        clientViewer.emit('room:join', { slug: privRoom.slug, viewToken: privRoom.viewToken }, resolve)
      );

      // Listeners
      clientOwner.on('yjs:update', (data) => {
        Y.applyUpdate(docOwner, new Uint8Array(data.update), 'remote');
      });

      const errorPromise = new Promise((resolve) => {
        clientViewer.on('room:error', resolve);
      });

      // Viewer attempts to emit an update
      textViewer.insert(0, 'hacked content by viewer');
      const viewerUpdate = Y.encodeStateAsUpdate(docViewer);
      clientViewer.emit('yjs:update', { roomId: privRoom.id, update: viewerUpdate });

      const error = await errorPromise;
      expect(error.code).toBe('FORBIDDEN');

      // Allow any processing time
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Owner should have received nothing
      expect(textOwner.toString()).toBe('');
      // Server doc should have received nothing
      expect(yjsManager.getText(privRoom.id)).toBe('');
    } finally {
      clientViewer.disconnect();
      clientOwner.disconnect();
      docViewer.destroy();
      docOwner.destroy();
    }
  });

  it('rejects yjs updates exceeding 1 MB limit (security guard)', async () => {
    const clientA = await connectClient(tokenA);

    try {
      await new Promise((resolve) => clientA.emit('room:join', { slug: testRoom.slug }, resolve));

      const errorPromise = new Promise((resolve) => {
        clientA.on('room:error', resolve);
      });

      // Oversized payload (1.2 MB)
      const oversizedPayload = new Uint8Array(1.2 * 1024 * 1024);
      clientA.emit('yjs:update', { roomId: testRoom.id, update: oversizedPayload });

      const error = await errorPromise;
      expect(error.code).toBe('PAYLOAD_TOO_LARGE');
    } finally {
      clientA.disconnect();
    }
  });

  it('merges offline edits when a disconnected client reconnects', async () => {
    const clientA = await connectClient(tokenA);
    const clientB = await connectClient(tokenB);

    const docA = new Y.Doc();
    const docB = new Y.Doc();
    const textA = docA.getText('monaco');
    const textB = docB.getText('monaco');

    try {
      await new Promise((resolve) => clientA.emit('room:join', { slug: testRoom.slug }, resolve));
      await new Promise((resolve) => clientB.emit('room:join', { slug: testRoom.slug }, resolve));

      // Initial text sync
      textA.insert(0, 'Initial code\n');
      const initUpdate = Y.encodeStateAsUpdate(docA);
      clientA.emit('yjs:update', { roomId: testRoom.id, update: initUpdate });
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Client B simulates disconnect
      clientB.disconnect();

      // Client A types while B is offline
      textA.insert(textA.length, 'Online edit from A\n');
      const updateA = Y.encodeStateAsUpdate(docA);
      clientA.emit('yjs:update', { roomId: testRoom.id, update: updateA });

      // Client B types offline locally
      textB.insert(0, 'Offline edit from B\n');

      // Client B reconnects
      const clientBReconnect = await connectClient(tokenB);
      await new Promise((resolve) =>
        clientBReconnect.emit('room:join', { slug: testRoom.slug }, resolve)
      );

      // Perform Step 1/2 sync
      const serverSyncPromise = new Promise((resolve) => {
        clientBReconnect.on('yjs:sync-step2', (data) => {
          Y.applyUpdate(docB, new Uint8Array(data.update), 'remote');
          resolve();
        });
      });

      // B sends sync-step1 to server
      clientBReconnect.emit('yjs:sync-step1', {
        roomId: testRoom.id,
        stateVector: Y.encodeStateVector(docB),
      });

      await serverSyncPromise;

      // Both texts should contain both edits
      expect(textB.toString()).toContain('Initial code');
      expect(textB.toString()).toContain('Offline edit from B');

      clientBReconnect.disconnect();
    } finally {
      clientA.disconnect();
      clientB.disconnect();
      docA.destroy();
      docB.destroy();
    }
  });

  it('persists document state to MongoDB and restores after server restart / cache eviction', async () => {
    const doc = await yjsManager.getDoc(testRoom.id);
    const yText = doc.getText('monaco');
    yText.insert(0, 'const secretAlgorithm = () => 42;');

    // Save snapshot to MongoDB
    await yjsManager.saveSnapshot(testRoom.id);

    // Verify snapshot in MongoDB
    const docRecord = await Document.findOne({ roomId: testRoom.id });
    expect(docRecord).toBeDefined();
    expect(docRecord.yjsState.length).toBeGreaterThan(0);

    // Evict from in-memory cache to simulate server restart
    doc.destroy();
    yjsManager.docs.delete(testRoom.id);

    // Load doc anew from DB
    const restoredDoc = await yjsManager.getDoc(testRoom.id);
    const restoredText = restoredDoc.getText('monaco').toString();

    expect(restoredText).toBe('const secretAlgorithm = () => 42;');
    restoredDoc.destroy();
    yjsManager.docs.delete(testRoom.id);
  });
});

