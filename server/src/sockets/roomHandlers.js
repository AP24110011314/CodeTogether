import { Room } from '../models/Room.js';
import { can, getUserRoleInRoom } from '../services/permissions.js';
import { yjsManager } from '../services/yjsManager.js';
import logger from '../utils/logger.js';

export async function getRoomOnlineMembers(io, roomId) {
  const room = await Room.findById(roomId)
    .populate('members.userId', 'name email avatarColor');

  if (!room) return [];

  const roomSocketSet = io.sockets.adapter.rooms.get(`room:${roomId}`);
  const connectedUserIds = new Set();

  if (roomSocketSet) {
    for (const socketId of roomSocketSet) {
      const clientSocket = io.sockets.sockets.get(socketId);
      if (clientSocket?.data?.user?.id) {
        connectedUserIds.add(clientSocket.data.user.id.toString());
      }
    }
  }

  return room.members.map((m) => {
    const userObj = m.userId && typeof m.userId === 'object' ? m.userId : null;
    const userId = userObj?._id ? userObj._id.toString() : m.userId?.toString();
    return {
      userId,
      name: userObj?.name || 'Member',
      email: userObj?.email || '',
      color: userObj?.avatarColor || '#38bdf8',
      role: m.role,
      online: connectedUserIds.has(userId),
    };
  });
}

export function registerRoomHandlers(io, socket) {
  const user = socket.data.user;

  // room:join
  socket.on('room:join', async (payload, callback) => {
    try {
      const { slug, inviteToken, viewToken } = payload || {};
      if (!slug) {
        const error = { code: 'INVALID_REQUEST', message: 'Room slug is required' };
        socket.emit('room:error', error);
        if (typeof callback === 'function') callback({ ok: false, error });
        return;
      }

      const room = await Room.findOne({ slug })
        .populate('ownerId', 'name email avatarColor')
        .populate('members.userId', 'name email avatarColor');

      if (!room) {
        const error = { code: 'ROOM_NOT_FOUND', message: 'Room not found' };
        socket.emit('room:error', error);
        if (typeof callback === 'function') callback({ ok: false, error });
        return;
      }

      let role = getUserRoleInRoom(room, user.id);

      if (room.visibility === 'private') {
        if (!role) {
          if (inviteToken && inviteToken === room.inviteToken) {
            role = 'editor';
            room.members.push({ userId: user.id, role, joinedAt: new Date() });
            await room.save();
          } else if (viewToken && viewToken === room.viewToken) {
            role = 'viewer';
            room.members.push({ userId: user.id, role, joinedAt: new Date() });
            await room.save();
          } else {
            const error = {
              code: 'FORBIDDEN',
              message: 'This room is private. Valid invite or view token required.',
            };
            socket.emit('room:error', error);
            if (typeof callback === 'function') callback({ ok: false, error });
            return;
          }
        }
      } else {
        if (!role) {
          role = room.defaultRole || 'editor';
          room.members.push({ userId: user.id, role, joinedAt: new Date() });
          await room.save();
        }
      }

      const roomId = room._id.toString();
      socket.join(`room:${roomId}`);
      socket.data.rooms.add(roomId);

      const members = await getRoomOnlineMembers(io, roomId);

      // Broadcast updated member list to room
      io.to(`room:${roomId}`).emit('room:members', members);

      if (typeof callback === 'function') {
        callback({
          ok: true,
          room: {
            id: roomId,
            name: room.name,
            slug: room.slug,
            language: room.language,
            visibility: room.visibility,
            defaultRole: room.defaultRole,
            ownerId: room.ownerId,
          },
          role,
          members,
          messages: [],
        });
      }
    } catch (err) {
      logger.error({ err }, 'Error in room:join');
      const error = { code: 'SERVER_ERROR', message: 'Failed to join room' };
      socket.emit('room:error', error);
      if (typeof callback === 'function') callback({ ok: false, error });
    }
  });

  // room:leave
  socket.on('room:leave', async (payload, callback) => {
    try {
      const { roomId } = payload || {};
      if (!roomId) return;

      socket.leave(`room:${roomId}`);
      socket.data.rooms.delete(roomId);
      yjsManager.releaseDoc(roomId);

      const members = await getRoomOnlineMembers(io, roomId);
      io.to(`room:${roomId}`).emit('room:members', members);

      if (typeof callback === 'function') {
        callback({ ok: true });
      }
    } catch (err) {
      logger.error({ err }, 'Error in room:leave');
    }
  });

  // room:language
  socket.on('room:language', async (payload) => {
    try {
      const { roomId, language } = payload || {};
      if (!roomId || !language) return;

      const room = await Room.findById(roomId);
      if (!room) {
        return socket.emit('room:error', { code: 'ROOM_NOT_FOUND', message: 'Room not found' });
      }

      const role = getUserRoleInRoom(room, user.id);
      if (!can(role, 'change_language')) {
        return socket.emit('room:error', {
          code: 'FORBIDDEN',
          message: 'You do not have permission to change the language in this room',
        });
      }

      room.language = language;
      await room.save();

      io.to(`room:${roomId}`).emit('room:language', { language });
    } catch (err) {
      logger.error({ err }, 'Error in room:language');
    }
  });
}

