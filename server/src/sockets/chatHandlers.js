import { Message } from '../models/Message.js';
import { Room } from '../models/Room.js';
import { can, getUserRoleInRoom } from '../services/permissions.js';
import logger from '../utils/logger.js';

const RATE_LIMIT_WINDOW_MS = 10 * 1000; // 10 seconds
const MAX_MESSAGES_PER_WINDOW = 10;
const MAX_MESSAGE_LENGTH = 2000;

// Track message timestamps per user: userId -> Array<number>
const userMessageTimes = new Map();

export function checkChatRateLimit(userId) {
  const now = Date.now();
  const times = userMessageTimes.get(userId) || [];
  const windowStart = now - RATE_LIMIT_WINDOW_MS;

  const recent = times.filter((t) => t > windowStart);
  if (recent.length >= MAX_MESSAGES_PER_WINDOW) {
    userMessageTimes.set(userId, recent);
    return false;
  }

  recent.push(now);
  userMessageTimes.set(userId, recent);
  return true;
}

export function clearChatRateLimits() {
  userMessageTimes.clear();
}

export async function broadcastSystemMessage(io, roomId, text) {
  try {
    const message = await Message.create({
      roomId,
      userId: null,
      type: 'system',
      text,
    });

    const payload = {
      id: message._id.toString(),
      roomId: roomId.toString(),
      userId: null,
      name: 'System',
      color: '#64748b',
      type: 'system',
      text,
      createdAt: message.createdAt.toISOString(),
    };

    io.to(`room:${roomId}`).emit('chat:message', payload);
    return payload;
  } catch (err) {
    logger.error({ err, roomId }, 'Failed to broadcast system message');
  }
}

export function registerChatHandlers(io, socket) {
  const user = socket.data.user;

  socket.on('chat:send', async (payload, callback) => {
    try {
      const { roomId, text } = payload || {};

      if (!roomId) {
        const error = { code: 'INVALID_PAYLOAD', message: 'Room ID is required' };
        socket.emit('room:error', error);
        if (typeof callback === 'function') callback({ ok: false, error });
        return;
      }

      if (typeof text !== 'string' || text.trim().length === 0) {
        const error = { code: 'INVALID_MESSAGE', message: 'Message cannot be empty' };
        socket.emit('room:error', error);
        if (typeof callback === 'function') callback({ ok: false, error });
        return;
      }

      if (text.length > MAX_MESSAGE_LENGTH) {
        const error = {
          code: 'MESSAGE_TOO_LONG',
          message: `Message exceeds maximum limit of ${MAX_MESSAGE_LENGTH} characters`,
        };
        socket.emit('room:error', error);
        if (typeof callback === 'function') callback({ ok: false, error });
        return;
      }

      const room = await Room.findById(roomId);
      if (!room) {
        const error = { code: 'ROOM_NOT_FOUND', message: 'Room not found' };
        socket.emit('room:error', error);
        if (typeof callback === 'function') callback({ ok: false, error });
        return;
      }

      const role = getUserRoleInRoom(room, user.id);
      if (!can(role, 'chat')) {
        const error = {
          code: 'FORBIDDEN',
          message: 'You do not have permission to chat in this room',
        };
        socket.emit('room:error', error);
        if (typeof callback === 'function') callback({ ok: false, error });
        return;
      }

      // Rate limit check: 10 messages / 10s per user
      if (!checkChatRateLimit(user.id)) {
        const error = {
          code: 'RATE_LIMITED',
          message: 'You are sending messages too quickly (max 10 messages per 10s)',
        };
        socket.emit('room:error', error);
        if (typeof callback === 'function') callback({ ok: false, error });
        return;
      }

      const savedMessage = await Message.create({
        roomId: room._id,
        userId: user.id,
        type: 'user',
        text: text.trim(),
      });

      const messagePayload = {
        id: savedMessage._id.toString(),
        roomId: roomId.toString(),
        userId: user.id,
        name: user.name,
        color: user.color || '#38bdf8',
        type: 'user',
        text: savedMessage.text,
        createdAt: savedMessage.createdAt.toISOString(),
      };

      io.to(`room:${roomId}`).emit('chat:message', messagePayload);

      if (typeof callback === 'function') {
        callback({ ok: true, message: messagePayload });
      }
    } catch (err) {
      logger.error({ err }, 'Error in chat:send');
      const error = { code: 'SERVER_ERROR', message: 'Failed to send message' };
      socket.emit('room:error', error);
      if (typeof callback === 'function') callback({ ok: false, error });
    }
  });
}

