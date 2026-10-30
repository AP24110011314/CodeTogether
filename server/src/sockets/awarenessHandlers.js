import * as awarenessProtocol from 'y-protocols/awareness';
import { yjsManager } from '../services/yjsManager.js';
import { Room } from '../models/Room.js';
import { can, getUserRoleInRoom } from '../services/permissions.js';
import logger from '../utils/logger.js';

export const MAX_AWARENESS_BYTES = 64 * 1024; // 64 KB cap per update

export function sendInitialAwareness(socket, roomId) {
  const awareness = yjsManager.getAwareness(roomId);
  if (!awareness) return;

  const states = Array.from(awareness.getStates().keys());
  if (states.length > 0) {
    const update = awarenessProtocol.encodeAwarenessUpdate(awareness, states);
    socket.emit('awareness:update', {
      roomId,
      update,
    });
  }
}

export function removeSocketAwareness(io, socket, roomId) {
  const clientIds = socket.data?.awarenessClientIds?.get(roomId);
  if (!clientIds || clientIds.size === 0) return;

  const idArray = Array.from(clientIds);
  const awareness = yjsManager.getAwareness(roomId);
  if (awareness) {
    awarenessProtocol.removeAwarenessStates(awareness, idArray, 'disconnect');
  }

  io.to(`room:${roomId}`).emit('awareness:remove', {
    roomId,
    clientIds: idArray,
  });

  socket.data.awarenessClientIds.delete(roomId);
}

export function registerAwarenessHandlers(io, socket) {
  const user = socket.data.user;

  if (!socket.data.awarenessClientIds) {
    socket.data.awarenessClientIds = new Map();
  }

  socket.on('awareness:update', async (payload) => {
    try {
      const { roomId, update } = payload || {};
      if (!roomId || !update) return;

      const updateBytes = new Uint8Array(update);
      if (updateBytes.byteLength > MAX_AWARENESS_BYTES) {
        logger.warn({ userId: user.id, size: updateBytes.byteLength }, 'Awareness update payload exceeded 64 KB');
        return socket.emit('room:error', {
          code: 'PAYLOAD_TOO_LARGE',
          message: 'Awareness payload exceeds 64 KB limit',
        });
      }

      const room = await Room.findById(roomId);
      if (!room) return;

      const role = getUserRoleInRoom(room, user.id);
      if (!can(role, 'read')) {
        return socket.emit('room:error', {
          code: 'FORBIDDEN',
          message: 'You do not have permission to access awareness in this room',
        });
      }

      // Ensure doc and awareness are initialized
      await yjsManager.getDoc(roomId);
      const awareness = yjsManager.getAwareness(roomId);

      if (awareness) {
        const onUpdate = ({ added, updated, removed }, origin) => {
          if (origin === socket.id) {
            if (!socket.data.awarenessClientIds.has(roomId)) {
              socket.data.awarenessClientIds.set(roomId, new Set());
            }
            const clientSet = socket.data.awarenessClientIds.get(roomId);
            added.forEach((id) => clientSet.add(id));
            updated.forEach((id) => clientSet.add(id));
            removed.forEach((id) => clientSet.delete(id));
          }
        };

        awareness.on('update', onUpdate);
        try {
          awarenessProtocol.applyAwarenessUpdate(awareness, updateBytes, socket.id);
        } finally {
          awareness.off('update', onUpdate);
        }
      }

      // Relay to other room members
      socket.to(`room:${roomId}`).emit('awareness:update', {
        roomId,
        update: updateBytes,
      });
    } catch (err) {
      logger.error({ err }, 'Error in awareness:update');
    }
  });
}

