import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { io as Client } from 'socket.io-client';
import app from '../src/app.js';
import { server } from '../src/index.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { User } from '../src/models/User.js';
import { Room } from '../src/models/Room.js';
import { Document } from '../src/models/Document.js';
import { Message } from '../src/models/Message.js';
import { ExecutionRun } from '../src/models/ExecutionRun.js';

describe('Phase 9 — Room Management and Sharing', () => {
  let userOwner, tokenOwner;
  let userEditor, tokenEditor;
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
      email: {
        $in: [
          'mgmt_owner@test.com',
          'mgmt_editor@test.com',
          'mgmt_viewer@test.com',
          'mgmt_out@test.com',
        ],
      },
    });
    await Room.deleteMany({});
    await Document.deleteMany({});
    await Message.deleteMany({});
    await ExecutionRun.deleteMany({});
    await new Promise((resolve) => server.close(resolve));
    await disconnectDB();
  });

  beforeEach(async () => {
    for (const s of activeSockets) {
      if (s.connected) s.disconnect();
    }
    activeSockets = [];

    await User.deleteMany({
      email: {
        $in: [
          'mgmt_owner@test.com',
          'mgmt_editor@test.com',
          'mgmt_viewer@test.com',
          'mgmt_out@test.com',
        ],
      },
    });
    await Room.deleteMany({});
    await Document.deleteMany({});
    await Message.deleteMany({});
    await ExecutionRun.deleteMany({});

    // Register Users
    const resOwner = await request(app).post('/api/auth/register').send({
      name: 'Owner User',
      email: 'mgmt_owner@test.com',
      password: 'password123',
    });
    userOwner = resOwner.body.user;
    tokenOwner = resOwner.body.accessToken;

    const resEditor = await request(app).post('/api/auth/register').send({
      name: 'Editor User',
      email: 'mgmt_editor@test.com',
      password: 'password123',
    });
    userEditor = resEditor.body.user;
    tokenEditor = resEditor.body.accessToken;

    const resViewer = await request(app).post('/api/auth/register').send({
      name: 'Viewer User',
      email: 'mgmt_viewer@test.com',
      password: 'password123',
    });
    userViewer = resViewer.body.user;
    tokenViewer = resViewer.body.accessToken;

    const resOut = await request(app).post('/api/auth/register').send({
      name: 'Outsider User',
      email: 'mgmt_out@test.com',
      password: 'password123',
    });
    userOutsider = resOut.body.user;
    tokenOutsider = resOut.body.accessToken;

    // Create Private Room owned by userOwner
    const resRoom = await request(app)
      .post('/api/rooms')
      .set('Authorization', `Bearer ${tokenOwner}`)
      .send({
        name: 'Management Test Room',
        language: 'javascript',
        visibility: 'private',
        defaultRole: 'editor',
      });
    testRoom = resRoom.body.room;

    // Add userEditor (role: editor) and userViewer (role: viewer) to room
    await Room.findByIdAndUpdate(testRoom.id, {
      $push: {
        members: [
          { userId: userEditor.id, role: 'editor', joinedAt: new Date() },
          { userId: userViewer.id, role: 'viewer', joinedAt: new Date() },
        ],
      },
    });
  });

  describe('1. Member Role Management & Live Role Changes', () => {
    it('allows room owner to change member role and broadcasts room:role-changed', async () => {
      const clientOwner = await connectClient(tokenOwner);
      const clientEditor = await connectClient(tokenEditor);

      await new Promise((resolve) => clientOwner.emit('room:join', { slug: testRoom.slug }, resolve));
      await new Promise((resolve) => clientEditor.emit('room:join', { slug: testRoom.slug }, resolve));

      const roleChangedPromise = new Promise((resolve) => {
        clientEditor.on('room:role-changed', resolve);
      });
      const membersUpdatedPromise = new Promise((resolve) => {
        clientEditor.on('room:members', (m) => {
          const updated = m.find((u) => u.userId === userEditor.id);
          if (updated && updated.role === 'viewer') resolve(updated);
        });
      });

      // Owner changes editor to viewer
      const res = await request(app)
        .patch(`/api/rooms/${testRoom.id}/members/${userEditor.id}`)
        .set('Authorization', `Bearer ${tokenOwner}`)
        .send({ role: 'viewer' });

      expect(res.status).toBe(200);
      expect(res.body.role).toBe('viewer');

      const roleEvent = await roleChangedPromise;
      expect(roleEvent.userId).toBe(userEditor.id);
      expect(roleEvent.role).toBe('viewer');

      const memberItem = await membersUpdatedPromise;
      expect(memberItem.role).toBe('viewer');

      // Verify in DB
      const updatedRoom = await Room.findById(testRoom.id);
      const editorMember = updatedRoom.members.find((m) => m.userId.toString() === userEditor.id);
      expect(editorMember.role).toBe('viewer');
    });

    it('rejects role changes initiated by non-owners with 403 FORBIDDEN', async () => {
      const res = await request(app)
        .patch(`/api/rooms/${testRoom.id}/members/${userViewer.id}`)
        .set('Authorization', `Bearer ${tokenEditor}`)
        .send({ role: 'editor' });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('prevents changing the role of the room owner with 400 INVALID_OPERATION', async () => {
      const res = await request(app)
        .patch(`/api/rooms/${testRoom.id}/members/${userOwner.id}`)
        .set('Authorization', `Bearer ${tokenOwner}`)
        .send({ role: 'viewer' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_OPERATION');
    });
  });

  describe('2. Kicking & Leaving Members', () => {
    it('allows owner to kick member, emitting room:kicked and disconnecting them', async () => {
      const clientOwner = await connectClient(tokenOwner);
      const clientEditor = await connectClient(tokenEditor);

      await new Promise((resolve) => clientOwner.emit('room:join', { slug: testRoom.slug }, resolve));
      await new Promise((resolve) => clientEditor.emit('room:join', { slug: testRoom.slug }, resolve));

      const kickedPromise = new Promise((resolve) => {
        clientEditor.on('room:kicked', resolve);
      });
      const membersPromise = new Promise((resolve) => {
        clientOwner.on('room:members', (members) => {
          if (!members.some((m) => m.userId === userEditor.id)) {
            resolve(members);
          }
        });
      });

      // Owner kicks userEditor
      const res = await request(app)
        .delete(`/api/rooms/${testRoom.id}/members/${userEditor.id}`)
        .set('Authorization', `Bearer ${tokenOwner}`);

      expect(res.status).toBe(200);

      const kickedEvent = await kickedPromise;
      expect(kickedEvent.roomId).toBe(testRoom.id);

      const remainingMembers = await membersPromise;
      expect(remainingMembers.some((m) => m.userId === userEditor.id)).toBe(false);

      // Verify DB removal
      const updatedRoom = await Room.findById(testRoom.id);
      expect(updatedRoom.members.some((m) => m.userId.toString() === userEditor.id)).toBe(false);
    });

    it('allows member to leave room voluntarily', async () => {
      const res = await request(app)
        .delete(`/api/rooms/${testRoom.id}/members/${userViewer.id}`)
        .set('Authorization', `Bearer ${tokenViewer}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/left room successfully/i);

      const updatedRoom = await Room.findById(testRoom.id);
      expect(updatedRoom.members.some((m) => m.userId.toString() === userViewer.id)).toBe(false);
    });

    it('prevents owner from leaving the room with 400 INVALID_OPERATION', async () => {
      const res = await request(app)
        .delete(`/api/rooms/${testRoom.id}/members/${userOwner.id}`)
        .set('Authorization', `Bearer ${tokenOwner}`);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_OPERATION');
    });

    it('rejects kick attempt by a regular member on another member with 403 FORBIDDEN', async () => {
      const res = await request(app)
        .delete(`/api/rooms/${testRoom.id}/members/${userViewer.id}`)
        .set('Authorization', `Bearer ${tokenEditor}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });
  });

  describe('3. Share Tokens & Token Invalidation', () => {
    it('regenerating invite tokens invalidates the old tokens', async () => {
      const oldInvite = testRoom.inviteToken;
      const oldView = testRoom.viewToken;

      // Regenerate tokens
      const resRegen = await request(app)
        .post(`/api/rooms/${testRoom.id}/invite/regenerate`)
        .set('Authorization', `Bearer ${tokenOwner}`);

      expect(resRegen.status).toBe(200);
      expect(resRegen.body.inviteToken).toBeDefined();
      expect(resRegen.body.inviteToken).not.toBe(oldInvite);
      expect(resRegen.body.viewToken).not.toBe(oldView);

      const newInvite = resRegen.body.inviteToken;

      // Attempting to join private room with old invite token should fail with 403
      const resOldJoin = await request(app)
        .post('/api/rooms/join')
        .set('Authorization', `Bearer ${tokenOutsider}`)
        .send({
          slug: testRoom.slug,
          inviteToken: oldInvite,
        });
      expect(resOldJoin.status).toBe(403);
      expect(resOldJoin.body.error.code).toBe('FORBIDDEN');

      // Joining with newly generated token succeeds
      const resNewJoin = await request(app)
        .post('/api/rooms/join')
        .set('Authorization', `Bearer ${tokenOutsider}`)
        .send({
          slug: testRoom.slug,
          inviteToken: newInvite,
        });
      expect(resNewJoin.status).toBe(200);
      expect(resNewJoin.body.role).toBe('editor');
    });

    it('rejects token regeneration by non-owners with 403 FORBIDDEN', async () => {
      const res = await request(app)
        .post(`/api/rooms/${testRoom.id}/invite/regenerate`)
        .set('Authorization', `Bearer ${tokenEditor}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });
  });

  describe('4. Room Deletion & Cascade', () => {
    it('deletes room and cascades to Document, Messages, and ExecutionRuns', async () => {
      // Ensure Document exists and create associated Messages and Runs
      await Document.findOneAndUpdate(
        { roomId: testRoom.id },
        { yjsState: Buffer.alloc(10) },
        { upsert: true }
      );

      await Message.create({
        roomId: testRoom.id,
        userId: userOwner.id,
        text: 'Hello cascade message',
      });

      await ExecutionRun.create({
        roomId: testRoom.id,
        userId: userOwner.id,
        language: 'javascript',
        code: 'console.log(1);',
        status: 'success',
      });

      const clientEditor = await connectClient(tokenEditor);
      await new Promise((resolve) => clientEditor.emit('room:join', { slug: testRoom.slug }, resolve));

      const roomDeletedPromise = new Promise((resolve) => {
        clientEditor.on('room:deleted', resolve);
      });

      // Owner deletes room
      const res = await request(app)
        .delete(`/api/rooms/${testRoom.id}`)
        .set('Authorization', `Bearer ${tokenOwner}`);

      expect(res.status).toBe(200);

      const deletedEvent = await roomDeletedPromise;
      expect(deletedEvent.roomId).toBe(testRoom.id);

      // Verify cascade deletion in DB
      expect(await Room.findById(testRoom.id)).toBeNull();
      expect(await Document.findOne({ roomId: testRoom.id })).toBeNull();
      expect(await Message.countDocuments({ roomId: testRoom.id })).toBe(0);
      expect(await ExecutionRun.countDocuments({ roomId: testRoom.id })).toBe(0);
    });

    it('rejects deletion attempt by non-owner with 403 FORBIDDEN', async () => {
      const res = await request(app)
        .delete(`/api/rooms/${testRoom.id}`)
        .set('Authorization', `Bearer ${tokenEditor}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');

      // Room still exists
      expect(await Room.findById(testRoom.id)).not.toBeNull();
    });
  });
});
