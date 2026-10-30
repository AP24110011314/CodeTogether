import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { registerRoomHandlers, getRoomOnlineMembers } from './roomHandlers.js';
import { registerYjsHandlers } from './yjsHandlers.js';
import { registerAwarenessHandlers, removeSocketAwareness } from './awarenessHandlers.js';
import { registerChatHandlers, broadcastSystemMessage } from './chatHandlers.js';
import { yjsManager } from '../services/yjsManager.js';
import logger from '../utils/logger.js';

export function setupSockets(io) {
  // Authentication handshake middleware
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        (socket.handshake.headers?.authorization?.startsWith('Bearer ')
          ? socket.handshake.headers.authorization.split(' ')[1]
          : null);

      if (!token) {
        return next(new Error('Authentication token required'));
      }

      let decoded;
      try {
        decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
      } catch (err) {
        return next(new Error('Invalid or expired authentication token'));
      }

      const user = await User.findById(decoded.sub);
      if (!user) {
        return next(new Error('User not found'));
      }

      socket.data.user = {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        color: user.avatarColor,
      };
      socket.data.rooms = new Set();

      next();
    } catch (error) {
      logger.error({ err: error }, 'Socket authentication error');
      next(new Error('Internal socket authentication error'));
    }
  });

  io.on('connection', (socket) => {
    const user = socket.data.user;
    logger.info({ userId: user.id, socketId: socket.id }, 'User connected to socket');

    // Register handlers
    registerRoomHandlers(io, socket);
    registerYjsHandlers(io, socket);
    registerAwarenessHandlers(io, socket);
    registerChatHandlers(io, socket);

    socket.on('disconnect', async (reason) => {
      logger.info({ userId: user.id, socketId: socket.id, reason }, 'User disconnected from socket');

      // Clean up rooms this socket had joined
      const joinedRooms = Array.from(socket.data.rooms || []);
      for (const roomId of joinedRooms) {
        try {
          // Remove awareness states and notify room
          removeSocketAwareness(io, socket, roomId);

          // Broadcast system leave message
          await broadcastSystemMessage(io, roomId, `${user.name} left the room`);

          yjsManager.releaseDoc(roomId);
          const members = await getRoomOnlineMembers(io, roomId);
          io.to(`room:${roomId}`).emit('room:members', members);
        } catch (err) {
          logger.error({ err, roomId }, 'Error updating members/chat on socket disconnect');
        }
      }
    });
  });
}

