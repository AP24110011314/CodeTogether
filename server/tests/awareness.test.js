import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import * as Y from 'yjs';
import * as awarenessProtocol from 'y-protocols/awareness';
import { io as Client } from 'socket.io-client';
import app from '../src/app.js';
import { server } from '../src/index.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { User } from '../src/models/User.js';
import { Room } from '../src/models/Room.js';
import { Document } from '../src/models/Document.js';
import { yjsManager } from '../src/services/yjsManager.js';

describe('Phase 5 — Presence and Cursors (Awareness)', () => {
  let userA, tokenA;
  let userB, tokenB;
  let userViewer, tokenViewer;
  let userOutsider, tokenOutsider;
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
      email: { $in: ['aware_a@test.com', 'aware_b@test.com', 'aware_v@test.com', 'aware_out@test.com'] },
    });
    await Room.deleteMany({});
    await Document.deleteMany({});
    await new Promise((resolve) => server.close(resolve));
    await disconnectDB();
  });

  beforeEach(async () => {
    await User.deleteMany({
      email: { $in: ['aware_a@test.com', 'aware_b@test.com', 'aware_v@test.com', 'aware_out@test.com'] },
    });
    await Room.deleteMany({});
    await Document.deleteMany({});
    yjsManager.docs.clear();

    // Register User A (Owner)
    const resA = await request(app).post('/api/auth/register').send({
      name: 'Awareness User A',
      email: 'aware_a@test.com',
      password: 'password123',
    });
    userA = resA.body.user;
    tokenA = resA.body.accessToken;

    // Register User B (Editor)
    const resB = await request(app).post('/api/auth/register').send({
      name: 'Awareness User B',
      email: 'aware_b@test.com',
      password: 'password123',
    });
    userB = resB.body.user;
    tokenB = resB.body.accessToken;

    // Register User Viewer
    const resV = await request(app).post('/api/auth/register').send({
      name: 'Awareness Viewer',
      email: 'aware_v@test.com',
      password: 'password123',
    });
    userViewer = resV.body.user;
    tokenViewer = resV.body.accessToken;

    // Register User Outsider
    const resOut = await request(app).post('/api/auth/register').send({
      name: 'Awareness Outsider',
      email: 'aware_out@test.com',
      password: 'password123',
    });
    userOutsider = resOut.body.user;
    tokenOutsider = resOut.body.accessToken;

    // Create room owned by User A
    const resRoom = await request(app)
      .post('/api/rooms')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ name: 'Awareness Room', language: 'javascript', visibility: 'public' });
    testRoom = resRoom.body.room;
  });

  it('relays awareness updates between two clients in the same room', async () => {
    const clientA = await connectClient(tokenA);
    const clientB = await connectClient(tokenB);

    // Both join the room
    await new Promise((resolve) => clientA.emit('room:join', { slug: testRoom.slug }, resolve));
    await new Promise((resolve) => clientB.emit('room:join', { slug: testRoom.slug }, resolve));

    const docA = new Y.Doc();
    const docB = new Y.Doc();
    const awarenessA = new awarenessProtocol.Awareness(docA);
    const awarenessB = new awarenessProtocol.Awareness(docB);

    const receivedAwarenessPromise = new Promise((resolve) => {
      clientB.on('awareness:update', ({ roomId, update }) => {
        if (roomId === testRoom.id) {
          awarenessProtocol.applyAwarenessUpdate(awarenessB, new Uint8Array(update), 'remote');
          const states = Array.from(awarenessB.getStates().values());
          const remoteState = states.find((s) => s?.user?.id === userA.id);
          if (remoteState) {
            resolve(remoteState);
          }
        }
      });
    });

    // Client A sets local awareness
    awarenessA.setLocalState({
      user: {
        id: userA.id,
        name: userA.name,
        color: userA.avatarColor,
      },
      typing: true,
    });

    const updateA = awarenessProtocol.encodeAwarenessUpdate(awarenessA, [docA.clientID]);
    clientA.emit('awareness:update', {
      roomId: testRoom.id,
      update: updateA,
    });

    const receivedState = await receivedAwarenessPromise;
    expect(receivedState.user.name).toBe('Awareness User A');
    expect(receivedState.typing).toBe(true);

    awarenessA.destroy();
    awarenessB.destroy();
    docA.destroy();
    docB.destroy();
    clientA.disconnect();
    clientB.disconnect();
  });

  it('sends existing awareness state to a newly joined client', async () => {
    const clientA = await connectClient(tokenA);
    await new Promise((resolve) => clientA.emit('room:join', { slug: testRoom.slug }, resolve));

    const docA = new Y.Doc();
    const awarenessA = new awarenessProtocol.Awareness(docA);

    awarenessA.setLocalState({
      user: {
        id: userA.id,
        name: userA.name,
        color: userA.avatarColor,
      },
      typing: false,
    });

    // Send awareness update to server
    const updateA = awarenessProtocol.encodeAwarenessUpdate(awarenessA, [docA.clientID]);
    clientA.emit('awareness:update', {
      roomId: testRoom.id,
      update: updateA,
    });

    // Give server a tick to apply update
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Now Client B connects and joins the room
    const clientB = await connectClient(tokenB);
    const docB = new Y.Doc();
    const awarenessB = new awarenessProtocol.Awareness(docB);

    const initialAwarenessPromise = new Promise((resolve) => {
      clientB.on('awareness:update', ({ roomId, update }) => {
        if (roomId === testRoom.id) {
          awarenessProtocol.applyAwarenessUpdate(awarenessB, new Uint8Array(update), 'remote');
          const states = Array.from(awarenessB.getStates().values());
          const remoteState = states.find((s) => s?.user?.id === userA.id);
          if (remoteState) {
            resolve(remoteState);
          }
        }
      });
    });

    await new Promise((resolve) => clientB.emit('room:join', { slug: testRoom.slug }, resolve));

    const existingState = await initialAwarenessPromise;
    expect(existingState.user.id).toBe(userA.id);
    expect(existingState.user.name).toBe('Awareness User A');

    awarenessA.destroy();
    awarenessB.destroy();
    docA.destroy();
    docB.destroy();
    clientA.disconnect();
    clientB.disconnect();
  });

  it('emits awareness:remove and clears server awareness when a client disconnects', async () => {
    const clientA = await connectClient(tokenA);
    const clientB = await connectClient(tokenB);

    await new Promise((resolve) => clientA.emit('room:join', { slug: testRoom.slug }, resolve));
    await new Promise((resolve) => clientB.emit('room:join', { slug: testRoom.slug }, resolve));

    const docA = new Y.Doc();
    const docB = new Y.Doc();
    const awarenessA = new awarenessProtocol.Awareness(docA);
    const awarenessB = new awarenessProtocol.Awareness(docB);

    awarenessA.setLocalState({
      user: {
        id: userA.id,
        name: userA.name,
        color: userA.avatarColor,
      },
      typing: false,
    });

    const updateA = awarenessProtocol.encodeAwarenessUpdate(awarenessA, [docA.clientID]);
    clientA.emit('awareness:update', {
      roomId: testRoom.id,
      update: updateA,
    });

    // Wait for Client B to register Client A's awareness
    await new Promise((resolve) => {
      clientB.on('awareness:update', ({ roomId, update }) => {
        if (roomId === testRoom.id) {
          awarenessProtocol.applyAwarenessUpdate(awarenessB, new Uint8Array(update), 'remote');
          if (awarenessB.getStates().has(docA.clientID)) {
            resolve();
          }
        }
      });
    });

    expect(awarenessB.getStates().has(docA.clientID)).toBe(true);

    // Client B waits for awareness:remove when Client A disconnects
    const removePromise = new Promise((resolve) => {
      clientB.on('awareness:remove', ({ roomId, clientIds }) => {
        if (roomId === testRoom.id && clientIds.includes(docA.clientID)) {
          awarenessProtocol.removeAwarenessStates(awarenessB, clientIds, 'remote');
          resolve(clientIds);
        }
      });
    });

    // Client A closes socket (simulates tab close / disconnect)
    clientA.disconnect();

    const removedClientIds = await removePromise;
    expect(removedClientIds).toContain(docA.clientID);
    expect(awarenessB.getStates().has(docA.clientID)).toBe(false);

    // Verify server awareness also no longer has docA.clientID
    const serverAwareness = yjsManager.getAwareness(testRoom.id);
    expect(serverAwareness.getStates().has(docA.clientID)).toBe(false);

    awarenessA.destroy();
    awarenessB.destroy();
    docA.destroy();
    docB.destroy();
    clientB.disconnect();
  });

  it('allows viewer to send and receive awareness (all roles have read access)', async () => {
    // Add viewer to room
    await Room.findByIdAndUpdate(testRoom.id, {
      $push: { members: { userId: userViewer.id, role: 'viewer', joinedAt: new Date() } },
    });

    const clientViewer = await connectClient(tokenViewer);
    const clientOwner = await connectClient(tokenA);

    await new Promise((resolve) => clientViewer.emit('room:join', { slug: testRoom.slug }, resolve));
    await new Promise((resolve) => clientOwner.emit('room:join', { slug: testRoom.slug }, resolve));

    const docV = new Y.Doc();
    const awarenessV = new awarenessProtocol.Awareness(docV);

    const receivedByOwner = new Promise((resolve) => {
      clientOwner.on('awareness:update', ({ roomId, update }) => {
        if (roomId === testRoom.id) {
          resolve(update);
        }
      });
    });

    awarenessV.setLocalState({
      user: { id: userViewer.id, name: userViewer.name, color: userViewer.avatarColor },
      typing: false,
    });

    const updateV = awarenessProtocol.encodeAwarenessUpdate(awarenessV, [docV.clientID]);
    clientViewer.emit('awareness:update', {
      roomId: testRoom.id,
      update: updateV,
    });

    const updateReceived = await receivedByOwner;
    expect(updateReceived).toBeDefined();

    awarenessV.destroy();
    docV.destroy();
    clientViewer.disconnect();
    clientOwner.disconnect();
  });

  it('rejects awareness:update for unauthorized private rooms with FORBIDDEN error', async () => {
    // Create private room owned by User A
    const resPrivate = await request(app)
      .post('/api/rooms')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ name: 'Private Room', language: 'javascript', visibility: 'private' });
    const privateRoom = resPrivate.body.room;

    // Outsider connects
    const clientOutsider = await connectClient(tokenOutsider);

    const docOut = new Y.Doc();
    const awarenessOut = new awarenessProtocol.Awareness(docOut);
    awarenessOut.setLocalState({
      user: { id: userOutsider.id, name: userOutsider.name, color: '#ff0000' },
    });
    const updateOut = awarenessProtocol.encodeAwarenessUpdate(awarenessOut, [docOut.clientID]);

    const errorPromise = new Promise((resolve) => {
      clientOutsider.on('room:error', (err) => {
        resolve(err);
      });
    });

    clientOutsider.emit('awareness:update', {
      roomId: privateRoom.id,
      update: updateOut,
    });

    const error = await errorPromise;
    expect(error.code).toBe('FORBIDDEN');

    awarenessOut.destroy();
    docOut.destroy();
    clientOutsider.disconnect();
  });

  it('rejects awareness:update payloads exceeding 64 KB limit', async () => {
    const clientA = await connectClient(tokenA);
    await new Promise((resolve) => clientA.emit('room:join', { slug: testRoom.slug }, resolve));

    // Create oversized payload (> 64 KB)
    const largeUpdate = new Uint8Array(65 * 1024);

    const errorPromise = new Promise((resolve) => {
      clientA.on('room:error', (err) => {
        resolve(err);
      });
    });

    clientA.emit('awareness:update', {
      roomId: testRoom.id,
      update: largeUpdate,
    });

    const error = await errorPromise;
    expect(error.code).toBe('PAYLOAD_TOO_LARGE');

    clientA.disconnect();
  });
});
