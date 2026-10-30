import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { io as Client } from 'socket.io-client';
import app from '../src/app.js';
import { server } from '../src/index.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { User } from '../src/models/User.js';
import { Room } from '../src/models/Room.js';
import { Document } from '../src/models/Document.js';

describe('Socket.IO Room Sessions & Permissions', () => {
  let userA, tokenA;
  let userB, tokenB;
  let publicRoom;
  let privateRoom;
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
    await User.deleteMany({ email: { $in: ['socket_a@test.com', 'socket_b@test.com'] } });
    await Room.deleteMany({});
    await Document.deleteMany({});
    await new Promise((resolve) => server.close(resolve));
    await disconnectDB();
  });

  beforeEach(async () => {
    await User.deleteMany({ email: { $in: ['socket_a@test.com', 'socket_b@test.com'] } });
    await Room.deleteMany({});
    await Document.deleteMany({});

    // Register User A
    const resA = await request(app).post('/api/auth/register').send({
      name: 'Socket User A',
      email: 'socket_a@test.com',
      password: 'password123',
    });
    userA = resA.body.user;
    tokenA = resA.body.accessToken;

    // Register User B
    const resB = await request(app).post('/api/auth/register').send({
      name: 'Socket User B',
      email: 'socket_b@test.com',
      password: 'password123',
    });
    userB = resB.body.user;
    tokenB = resB.body.accessToken;

    // Create public room owned by User A
    const resPub = await request(app)
      .post('/api/rooms')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ name: 'Public Room', language: 'javascript', visibility: 'public' });
    publicRoom = resPub.body.room;

    // Create private room owned by User A
    const resPriv = await request(app)
      .post('/api/rooms')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ name: 'Private Room', language: 'python', visibility: 'private' });
    privateRoom = resPriv.body.room;
  });

  it('rejects connection without authentication token', async () => {
    await expect(connectClient(null)).rejects.toThrow('Authentication token required');
  });

  it('rejects connection with invalid token', async () => {
    await expect(connectClient('invalid.jwt.token')).rejects.toThrow(
      'Invalid or expired authentication token'
    );
  });

  it('connects successfully with valid JWT token', async () => {
    const client = await connectClient(tokenA);
    expect(client.connected).toBe(true);
    client.disconnect();
  });

  it('allows two clients to join a public room and see each other online', async () => {
    const clientA = await connectClient(tokenA);
    const clientB = await connectClient(tokenB);

    try {
      // Client A joins
      const ackA = await new Promise((resolve) => {
        clientA.emit('room:join', { slug: publicRoom.slug }, resolve);
      });
      expect(ackA.ok).toBe(true);
      expect(ackA.role).toBe('owner');
      expect(ackA.members[0].online).toBe(true);

      // Client A listens for member update when B joins
      const membersPromise = new Promise((resolve) => {
        clientA.on('room:members', (members) => {
          if (members.length === 2 && members.every((m) => m.online)) {
            resolve(members);
          }
        });
      });

      // Client B joins
      const ackB = await new Promise((resolve) => {
        clientB.emit('room:join', { slug: publicRoom.slug }, resolve);
      });
      expect(ackB.ok).toBe(true);
      expect(ackB.role).toBe('editor');

      const members = await membersPromise;
      expect(members).toHaveLength(2);
      expect(members.some((m) => m.userId === userA.id && m.online)).toBe(true);
      expect(members.some((m) => m.userId === userB.id && m.online)).toBe(true);
    } finally {
      clientA.disconnect();
      clientB.disconnect();
    }
  });

  it('blocks unauthorized client from joining a private room', async () => {
    const clientB = await connectClient(tokenB);

    try {
      const errorPromise = new Promise((resolve) => {
        clientB.on('room:error', resolve);
      });

      const ack = await new Promise((resolve) => {
        clientB.emit('room:join', { slug: privateRoom.slug }, resolve);
      });

      expect(ack.ok).toBe(false);
      expect(ack.error.code).toBe('FORBIDDEN');

      const errorEvent = await errorPromise;
      expect(errorEvent.code).toBe('FORBIDDEN');
    } finally {
      clientB.disconnect();
    }
  });

  it('allows client to join private room with inviteToken', async () => {
    const clientB = await connectClient(tokenB);

    try {
      const ack = await new Promise((resolve) => {
        clientB.emit(
          'room:join',
          { slug: privateRoom.slug, inviteToken: privateRoom.inviteToken },
          resolve
        );
      });

      expect(ack.ok).toBe(true);
      expect(ack.role).toBe('editor');
    } finally {
      clientB.disconnect();
    }
  });

  it('broadcasts room:language to other members when changed by editor', async () => {
    const clientA = await connectClient(tokenA);
    const clientB = await connectClient(tokenB);

    try {
      await new Promise((resolve) => clientA.emit('room:join', { slug: publicRoom.slug }, resolve));
      await new Promise((resolve) => clientB.emit('room:join', { slug: publicRoom.slug }, resolve));

      const languagePromise = new Promise((resolve) => {
        clientB.on('room:language', resolve);
      });

      clientA.emit('room:language', {
        roomId: publicRoom.id,
        language: 'typescript',
      });

      const data = await languagePromise;
      expect(data.language).toBe('typescript');
    } finally {
      clientA.disconnect();
      clientB.disconnect();
    }
  });

  it('rejects room:language when attempted by viewer', async () => {
    const clientB = await connectClient(tokenB);

    try {
      // User B joins private room as viewer using viewToken
      const ack = await new Promise((resolve) => {
        clientB.emit(
          'room:join',
          { slug: privateRoom.slug, viewToken: privateRoom.viewToken },
          resolve
        );
      });
      expect(ack.ok).toBe(true);
      expect(ack.role).toBe('viewer');

      const errorPromise = new Promise((resolve) => {
        clientB.on('room:error', resolve);
      });

      clientB.emit('room:language', {
        roomId: privateRoom.id,
        language: 'go',
      });

      const error = await errorPromise;
      expect(error.code).toBe('FORBIDDEN');
    } finally {
      clientB.disconnect();
    }
  });

  it('updates member online status when a client disconnects', async () => {
    const clientA = await connectClient(tokenA);
    const clientB = await connectClient(tokenB);

    try {
      await new Promise((resolve) => clientA.emit('room:join', { slug: publicRoom.slug }, resolve));
      await new Promise((resolve) => clientB.emit('room:join', { slug: publicRoom.slug }, resolve));

      const memberOfflinePromise = new Promise((resolve) => {
        clientA.on('room:members', (members) => {
          const b = members.find((m) => m.userId === userB.id);
          if (b && b.online === false) {
            resolve(b);
          }
        });
      });

      clientB.disconnect();

      const memberB = await memberOfflinePromise;
      expect(memberB.online).toBe(false);
    } finally {
      clientA.disconnect();
    }
  });
});
