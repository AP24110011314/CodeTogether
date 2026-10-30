import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { io as Client } from 'socket.io-client';
import app from '../src/app.js';
import { server } from '../src/index.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { User } from '../src/models/User.js';
import { Room } from '../src/models/Room.js';
import { Message } from '../src/models/Message.js';
import { Document } from '../src/models/Document.js';
import { clearChatRateLimits } from '../src/sockets/chatHandlers.js';

describe('Phase 6 — Real-Time Chat & History API', () => {
  let userA, tokenA;
  let userB, tokenB;
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
      email: { $in: ['chat_a@test.com', 'chat_b@test.com', 'chat_out@test.com'] },
    });
    await Room.deleteMany({});
    await Message.deleteMany({});
    await Document.deleteMany({});
    await new Promise((resolve) => server.close(resolve));
    await disconnectDB();
  });

  beforeEach(async () => {
    await User.deleteMany({
      email: { $in: ['chat_a@test.com', 'chat_b@test.com', 'chat_out@test.com'] },
    });
    await Room.deleteMany({});
    await Message.deleteMany({});
    await Document.deleteMany({});
    clearChatRateLimits();

    // Register User A (Owner)
    const resA = await request(app).post('/api/auth/register').send({
      name: 'Chat User A',
      email: 'chat_a@test.com',
      password: 'password123',
    });
    userA = resA.body.user;
    tokenA = resA.body.accessToken;

    // Register User B (Member)
    const resB = await request(app).post('/api/auth/register').send({
      name: 'Chat User B',
      email: 'chat_b@test.com',
      password: 'password123',
    });
    userB = resB.body.user;
    tokenB = resB.body.accessToken;

    // Register User Outsider
    const resOut = await request(app).post('/api/auth/register').send({
      name: 'Chat Outsider',
      email: 'chat_out@test.com',
      password: 'password123',
    });
    userOutsider = resOut.body.user;
    tokenOutsider = resOut.body.accessToken;

    // Create room owned by User A
    const resRoom = await request(app)
      .post('/api/rooms')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ name: 'Chat Room', language: 'javascript', visibility: 'public' });
    testRoom = resRoom.body.room;
  });

  describe('REST GET /api/rooms/:id/messages', () => {
    it('returns 401 unauthenticated without JWT token', async () => {
      const res = await request(app).get(`/api/rooms/${testRoom.id}/messages`);
      expect(res.status).toBe(401);
    });

    it('returns 403 forbidden for an outsider accessing a private room', async () => {
      // Create private room owned by User A
      const resPriv = await request(app)
        .post('/api/rooms')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ name: 'Private Secret Room', language: 'javascript', visibility: 'private' });
      const privRoom = resPriv.body.room;

      const res = await request(app)
        .get(`/api/rooms/${privRoom.id}/messages`)
        .set('Authorization', `Bearer ${tokenOutsider}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('returns paginated messages newest-first with before cursor', async () => {
      // Insert 5 test messages with spaced timestamps
      const baseTime = Date.now();
      for (let i = 1; i <= 5; i++) {
        await Message.create({
          roomId: testRoom.id,
          userId: userA.id,
          type: 'user',
          text: `Message ${i}`,
          createdAt: new Date(baseTime + i * 1000),
        });
      }

      // Page 1: limit 2
      const res1 = await request(app)
        .get(`/api/rooms/${testRoom.id}/messages?limit=2`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res1.status).toBe(200);
      expect(res1.body.messages).toHaveLength(2);
      expect(res1.body.messages[0].text).toBe('Message 5');
      expect(res1.body.messages[1].text).toBe('Message 4');
      expect(res1.body.hasMore).toBe(true);

      // Page 2: before Message 4
      const cursor = res1.body.messages[1].createdAt;
      const res2 = await request(app)
        .get(`/api/rooms/${testRoom.id}/messages?before=${cursor}&limit=2`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res2.status).toBe(200);
      expect(res2.body.messages).toHaveLength(2);
      expect(res2.body.messages[0].text).toBe('Message 3');
      expect(res2.body.messages[1].text).toBe('Message 2');
      expect(res2.body.hasMore).toBe(true);
    });
  });

  describe('Socket Chat Events', () => {
    it('persists message and broadcasts chat:message to room participants', async () => {
      const clientA = await connectClient(tokenA);
      const clientB = await connectClient(tokenB);

      await new Promise((resolve) => clientA.emit('room:join', { slug: testRoom.slug }, resolve));
      await new Promise((resolve) => clientB.emit('room:join', { slug: testRoom.slug }, resolve));

      const messagePromise = new Promise((resolve) => {
        clientB.on('chat:message', (msg) => {
          if (msg.type === 'user' && msg.text === 'Hello room!') {
            resolve(msg);
          }
        });
      });

      // User A sends message
      const ack = await new Promise((resolve) => {
        clientA.emit('chat:send', { roomId: testRoom.id, text: 'Hello room!' }, resolve);
      });

      expect(ack.ok).toBe(true);
      expect(ack.message.text).toBe('Hello room!');

      const receivedMsg = await messagePromise;
      expect(receivedMsg.text).toBe('Hello room!');
      expect(receivedMsg.name).toBe('Chat User A');
      expect(receivedMsg.userId).toBe(userA.id);

      // Verify persisted in DB
      const dbMessage = await Message.findById(receivedMsg.id);
      expect(dbMessage).not.toBeNull();
      expect(dbMessage.text).toBe('Hello room!');

      clientA.disconnect();
      clientB.disconnect();
    });

    it('rejects empty messages and messages exceeding 2000 characters limit', async () => {
      const clientA = await connectClient(tokenA);
      await new Promise((resolve) => clientA.emit('room:join', { slug: testRoom.slug }, resolve));

      // Test empty message
      const ackEmpty = await new Promise((resolve) => {
        clientA.emit('chat:send', { roomId: testRoom.id, text: '   ' }, resolve);
      });
      expect(ackEmpty.ok).toBe(false);
      expect(ackEmpty.error.code).toBe('INVALID_MESSAGE');

      // Test message exceeding 2000 characters
      const longText = 'a'.repeat(2001);
      const ackLong = await new Promise((resolve) => {
        clientA.emit('chat:send', { roomId: testRoom.id, text: longText }, resolve);
      });
      expect(ackLong.ok).toBe(false);
      expect(ackLong.error.code).toBe('MESSAGE_TOO_LONG');

      clientA.disconnect();
    });

    it('enforces rate limit of 10 messages per 10 seconds per user', async () => {
      const clientA = await connectClient(tokenA);
      await new Promise((resolve) => clientA.emit('room:join', { slug: testRoom.slug }, resolve));

      // Send 10 rapid messages - all should succeed
      for (let i = 1; i <= 10; i++) {
        const ack = await new Promise((resolve) => {
          clientA.emit('chat:send', { roomId: testRoom.id, text: `Spam ${i}` }, resolve);
        });
        expect(ack.ok).toBe(true);
      }

      // The 11th message within 10s must be rejected with RATE_LIMITED
      const ack11 = await new Promise((resolve) => {
        clientA.emit('chat:send', { roomId: testRoom.id, text: 'Spam 11' }, resolve);
      });
      expect(ack11.ok).toBe(false);
      expect(ack11.error.code).toBe('RATE_LIMITED');

      clientA.disconnect();
    });

    it('broadcasts system messages on room join and leave', async () => {
      const clientA = await connectClient(tokenA);
      await new Promise((resolve) => clientA.emit('room:join', { slug: testRoom.slug }, resolve));

      // Client A listens for system messages
      const systemJoinPromise = new Promise((resolve) => {
        clientA.on('chat:message', (msg) => {
          if (msg.type === 'system' && msg.text.includes('Chat User B joined')) {
            resolve(msg);
          }
        });
      });

      const clientB = await connectClient(tokenB);
      await new Promise((resolve) => clientB.emit('room:join', { slug: testRoom.slug }, resolve));

      const joinMsg = await systemJoinPromise;
      expect(joinMsg.type).toBe('system');
      expect(joinMsg.text).toContain('Chat User B joined');

      const systemLeavePromise = new Promise((resolve) => {
        clientA.on('chat:message', (msg) => {
          if (msg.type === 'system' && msg.text.includes('Chat User B left')) {
            resolve(msg);
          }
        });
      });

      // Client B leaves
      await new Promise((resolve) => clientB.emit('room:leave', { roomId: testRoom.id }, resolve));

      const leaveMsg = await systemLeavePromise;
      expect(leaveMsg.type).toBe('system');
      expect(leaveMsg.text).toContain('Chat User B left');

      clientA.disconnect();
      clientB.disconnect();
    });

    it('returns recent message history in room:join ack callback', async () => {
      // Pre-populate 3 messages in the room
      for (let i = 1; i <= 3; i++) {
        await Message.create({
          roomId: testRoom.id,
          userId: userA.id,
          type: 'user',
          text: `Pre-existing message ${i}`,
        });
      }

      const clientB = await connectClient(tokenB);
      const ack = await new Promise((resolve) => {
        clientB.emit('room:join', { slug: testRoom.slug }, resolve);
      });

      expect(ack.ok).toBe(true);
      expect(ack.messages.length).toBeGreaterThanOrEqual(3);
      const texts = ack.messages.map((m) => m.text);
      expect(texts).toContain('Pre-existing message 1');
      expect(texts).toContain('Pre-existing message 2');
      expect(texts).toContain('Pre-existing message 3');

      clientB.disconnect();
    });
  });
});

