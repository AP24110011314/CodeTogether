import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { User } from '../src/models/User.js';
import { Room } from '../src/models/Room.js';
import { Document } from '../src/models/Document.js';

describe('Rooms API', () => {
  let userA, tokenA;
  let userB, tokenB;

  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await User.deleteMany({ email: { $in: ['usera@test.com', 'userb@test.com'] } });
    await Room.deleteMany({});
    await Document.deleteMany({});
    await disconnectDB();
  });

  beforeEach(async () => {
    await User.deleteMany({ email: { $in: ['usera@test.com', 'userb@test.com'] } });
    await Room.deleteMany({});
    await Document.deleteMany({});

    // Register User A
    const resA = await request(app).post('/api/auth/register').send({
      name: 'User Alpha',
      email: 'usera@test.com',
      password: 'password123',
    });
    userA = resA.body.user;
    tokenA = resA.body.accessToken;

    // Register User B
    const resB = await request(app).post('/api/auth/register').send({
      name: 'User Beta',
      email: 'userb@test.com',
      password: 'password123',
    });
    userB = resB.body.user;
    tokenB = resB.body.accessToken;
  });

  describe('POST /api/rooms', () => {
    it('creates a room with unique slug, owner role, and Document entry', async () => {
      const res = await request(app)
        .post('/api/rooms')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          name: 'Algorithm Practice',
          language: 'python',
          visibility: 'public',
        });

      expect(res.status).toBe(201);
      expect(res.body.room).toBeDefined();
      expect(res.body.room.name).toBe('Algorithm Practice');
      expect(res.body.room.slug).toHaveLength(10);
      expect(res.body.room.language).toBe('python');
      expect(res.body.role).toBe('owner');

      // Verify Document was created
      const doc = await Document.findOne({ roomId: res.body.room.id });
      expect(doc).toBeDefined();
    });

    it('rejects room creation if not authenticated', async () => {
      const res = await request(app)
        .post('/api/rooms')
        .send({ name: 'Secret Room' });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/rooms', () => {
    it('lists created and joined rooms', async () => {
      // User A creates room
      const resRoom = await request(app)
        .post('/api/rooms')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ name: 'Alpha Room' });

      const slug = resRoom.body.room.slug;

      // User B joins Alpha Room
      await request(app)
        .get(`/api/rooms/${slug}`)
        .set('Authorization', `Bearer ${tokenB}`);

      // User A list mine
      const resMine = await request(app)
        .get('/api/rooms?scope=mine')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(resMine.status).toBe(200);
      expect(resMine.body.rooms).toHaveLength(1);
      expect(resMine.body.rooms[0].name).toBe('Alpha Room');

      // User B list joined
      const resJoined = await request(app)
        .get('/api/rooms?scope=joined')
        .set('Authorization', `Bearer ${tokenB}`);

      expect(resJoined.status).toBe(200);
      expect(resJoined.body.rooms).toHaveLength(1);
      expect(resJoined.body.rooms[0].name).toBe('Alpha Room');
    });
  });

  describe('Private Room Access & Tokens', () => {
    it('blocks outsider from accessing private room without token with 403', async () => {
      const resRoom = await request(app)
        .post('/api/rooms')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ name: 'Private Alpha', visibility: 'private' });

      const slug = resRoom.body.room.slug;

      const resJoin = await request(app)
        .get(`/api/rooms/${slug}`)
        .set('Authorization', `Bearer ${tokenB}`);

      expect(resJoin.status).toBe(403);
      expect(resJoin.body.error.code).toBe('FORBIDDEN');
    });

    it('allows outsider to join private room with invite token as editor', async () => {
      const resRoom = await request(app)
        .post('/api/rooms')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ name: 'Private Alpha', visibility: 'private' });

      const { slug, inviteToken } = resRoom.body.room;

      const resJoin = await request(app)
        .get(`/api/rooms/${slug}?invite=${inviteToken}`)
        .set('Authorization', `Bearer ${tokenB}`);

      expect(resJoin.status).toBe(200);
      expect(resJoin.body.role).toBe('editor');
    });

    it('allows outsider to join private room with view token as viewer', async () => {
      const resRoom = await request(app)
        .post('/api/rooms')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ name: 'Private Alpha', visibility: 'private' });

      const { slug, viewToken } = resRoom.body.room;

      const resJoin = await request(app)
        .get(`/api/rooms/${slug}?view=${viewToken}`)
        .set('Authorization', `Bearer ${tokenB}`);

      expect(resJoin.status).toBe(200);
      expect(resJoin.body.role).toBe('viewer');
    });
  });

  describe('Room Modification & Deletion', () => {
    it('allows owner to update room settings, forbids non-owner', async () => {
      const resRoom = await request(app)
        .post('/api/rooms')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ name: 'Room To Edit' });

      const roomId = resRoom.body.room.id;

      // User B tries to update
      const resForbidden = await request(app)
        .patch(`/api/rooms/${roomId}`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ name: 'Hacked Name' });

      expect(resForbidden.status).toBe(403);

      // User A updates
      const resSuccess = await request(app)
        .patch(`/api/rooms/${roomId}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ name: 'Updated Name', language: 'typescript' });

      expect(resSuccess.status).toBe(200);
      expect(resSuccess.body.room.name).toBe('Updated Name');
      expect(resSuccess.body.room.language).toBe('typescript');
    });

    it('allows owner to regenerate invite tokens', async () => {
      const resRoom = await request(app)
        .post('/api/rooms')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ name: 'Invite Test', visibility: 'private' });

      const roomId = resRoom.body.room.id;
      const oldInvite = resRoom.body.room.inviteToken;

      const resRegen = await request(app)
        .post(`/api/rooms/${roomId}/invite/regenerate`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(resRegen.status).toBe(200);
      expect(resRegen.body.inviteToken).toBeDefined();
      expect(resRegen.body.inviteToken).not.toBe(oldInvite);
    });

    it('allows owner to delete room and cascades document deletion', async () => {
      const resRoom = await request(app)
        .post('/api/rooms')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ name: 'Room To Delete' });

      const roomId = resRoom.body.room.id;

      const resDel = await request(app)
        .delete(`/api/rooms/${roomId}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(resDel.status).toBe(200);

      // Verify room and document no longer exist
      const checkRoom = await Room.findById(roomId);
      expect(checkRoom).toBeNull();
      const checkDoc = await Document.findOne({ roomId });
      expect(checkDoc).toBeNull();
    });
  });

  describe('Member Management', () => {
    it('allows owner to change member role and remove members', async () => {
      const resRoom = await request(app)
        .post('/api/rooms')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ name: 'Team Room' });

      const roomId = resRoom.body.room.id;
      const slug = resRoom.body.room.slug;

      // User B joins
      await request(app)
        .get(`/api/rooms/${slug}`)
        .set('Authorization', `Bearer ${tokenB}`);

      // Change User B to viewer
      const resRole = await request(app)
        .patch(`/api/rooms/${roomId}/members/${userB.id}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ role: 'viewer' });

      expect(resRole.status).toBe(200);
      expect(resRole.body.role).toBe('viewer');

      // Kick User B
      const resKick = await request(app)
        .delete(`/api/rooms/${roomId}/members/${userB.id}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(resKick.status).toBe(200);

      const checkRoom = await Room.findById(roomId);
      const isMember = checkRoom.members.some((m) => m.userId.toString() === userB.id);
      expect(isMember).toBe(false);
    });
  });
});
