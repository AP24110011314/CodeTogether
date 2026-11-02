import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { User } from '../src/models/User.js';
import { Room } from '../src/models/Room.js';

describe('Join Class by Link & Code API (POST /api/rooms/join)', () => {
  let tokenOwner, tokenStudent;
  let publicRoom, privateRoom;

  beforeAll(async () => {
    await connectDB();
    await User.deleteMany({ email: { $in: ['join_owner@test.com', 'join_student@test.com'] } });
    await Room.deleteMany({ slug: { $in: ['join-public-class', 'join-private-class'] } });

    // Register owner
    const resOwner = await request(app).post('/api/auth/register').send({
      name: 'Professor Owner',
      email: 'join_owner@test.com',
      password: 'password123',
    });
    tokenOwner = resOwner.body.accessToken;

    // Register student
    const resStudent = await request(app).post('/api/auth/register').send({
      name: 'Student Learner',
      email: 'join_student@test.com',
      password: 'password123',
    });
    tokenStudent = resStudent.body.accessToken;

    // Create public room
    const resPub = await request(app)
      .post('/api/rooms')
      .set('Authorization', `Bearer ${tokenOwner}`)
      .send({
        name: 'Public Algorithms 101',
        language: 'javascript',
        visibility: 'public',
        defaultRole: 'editor',
      });
    publicRoom = resPub.body.room;

    // Create private room
    const resPriv = await request(app)
      .post('/api/rooms')
      .set('Authorization', `Bearer ${tokenOwner}`)
      .send({
        name: 'Private Systems Lab',
        language: 'python',
        visibility: 'private',
        defaultRole: 'editor',
      });
    privateRoom = resPriv.body.room;
  });

  afterAll(async () => {
    await User.deleteMany({ email: { $in: ['join_owner@test.com', 'join_student@test.com'] } });
    if (publicRoom) await Room.findByIdAndDelete(publicRoom.id || publicRoom._id);
    if (privateRoom) await Room.findByIdAndDelete(privateRoom.id || privateRoom._id);
    await disconnectDB();
  });

  it('rejects unauthenticated join requests with 401 UNAUTHORIZED', async () => {
    const res = await request(app).post('/api/rooms/join').send({
      slug: publicRoom.slug,
    });
    expect(res.status).toBe(401);
  });

  it('rejects non-existent room slug with 404 ROOM_NOT_FOUND', async () => {
    const res = await request(app)
      .post('/api/rooms/join')
      .set('Authorization', `Bearer ${tokenStudent}`)
      .send({
        slug: 'non-existent-class-slug-12345',
      });
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('ROOM_NOT_FOUND');
  });

  it('allows student to join public room without invite token', async () => {
    const res = await request(app)
      .post('/api/rooms/join')
      .set('Authorization', `Bearer ${tokenStudent}`)
      .send({
        slug: publicRoom.slug,
      });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.role).toBe('editor');
  });

  it('blocks student from joining private room without invite or view token with 403 FORBIDDEN', async () => {
    const res = await request(app)
      .post('/api/rooms/join')
      .set('Authorization', `Bearer ${tokenStudent}`)
      .send({
        slug: privateRoom.slug,
      });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('allows student to join private room with valid inviteToken', async () => {
    const res = await request(app)
      .post('/api/rooms/join')
      .set('Authorization', `Bearer ${tokenStudent}`)
      .send({
        slug: privateRoom.slug,
        inviteToken: privateRoom.inviteToken,
      });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.role).toBe('editor');
  });

  it('returns ok for user who is already a member', async () => {
    const res = await request(app)
      .post('/api/rooms/join')
      .set('Authorization', `Bearer ${tokenStudent}`)
      .send({
        slug: privateRoom.slug,
      });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.role).toBe('editor');
  });
});

