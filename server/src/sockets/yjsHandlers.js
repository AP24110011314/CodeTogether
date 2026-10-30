import * as Y from 'yjs';
import { yjsManager } from '../services/yjsManager.js';
import { Room } from '../models/Room.js';
import { can, getUserRoleInRoom } from '../services/permissions.js';
import logger from '../utils/logger.js';

const MAX_UPDATE_BYTES = 1024 * 1024; // 1 MB limit from doc 09
const MAX_DOC_LENGTH = 1000000; // 1 MB text limit from doc 09

export function registerYjsHandlers(io, socket) {
  const user = socket.data.user;

  // yjs:sync-step1
  socket.on('yjs:sync-step1', async (payload) => {
    try {
      const { roomId, stateVector } = payload || {};
      if (!roomId || !stateVector) return;

      const room = await Room.findById(roomId);
      if (!room) return;

      const role = getUserRoleInRoom(room, user.id);
      if (!can(role, 'read')) {
        return socket.emit('room:error', {
          code: 'FORBIDDEN',
          message: 'You do not have access to read this document',
        });
      }

      const doc = await yjsManager.getDoc(roomId);
      const clientVector = new Uint8Array(stateVector);

      // 1. Send client the diff it lacks (step 2)
      const missingUpdate = Y.encodeStateAsUpdate(doc, clientVector);
      socket.emit('yjs:sync-step2', {
        roomId,
        update: missingUpdate,
      });

      // 2. Ask client for what the server lacks (server step 1)
      const serverVector = Y.encodeStateVector(doc);
      socket.emit('yjs:sync-step1', {
        roomId,
        stateVector: serverVector,
      });
    } catch (err) {
      logger.error({ err }, 'Error in yjs:sync-step1');
    }
  });

  // yjs:sync-step2 (client responds with diff the server lacks)
  socket.on('yjs:sync-step2', async (payload) => {
    try {
      const { roomId, update } = payload || {};
      if (!roomId || !update) return;

      const room = await Room.findById(roomId);
      if (!room) return;

      const role = getUserRoleInRoom(room, user.id);
      if (!can(role, 'edit')) {
        // Drop updates from viewers
        logger.warn({ userId: user.id, roomId, role }, 'Dropped yjs:sync-step2 from non-editor');
        return;
      }

      const updateBytes = new Uint8Array(update);
      if (updateBytes.byteLength > MAX_UPDATE_BYTES) {
        return socket.emit('room:error', {
          code: 'PAYLOAD_TOO_LARGE',
          message: 'Update exceeds maximum allowed size of 1 MB',
        });
      }

      const doc = await yjsManager.getDoc(roomId);
      Y.applyUpdate(doc, updateBytes, socket.id);

      // Broadcast update to others in room
      socket.to(`room:${roomId}`).emit('yjs:update', {
        roomId,
        update: updateBytes,
      });

      yjsManager.scheduleSave(roomId);
    } catch (err) {
      logger.error({ err }, 'Error in yjs:sync-step2');
    }
  });

  // yjs:update (incremental user edits)
  socket.on('yjs:update', async (payload) => {
    try {
      const { roomId, update } = payload || {};
      if (!roomId || !update) return;

      const room = await Room.findById(roomId);
      if (!room) return;

      const role = getUserRoleInRoom(room, user.id);
      if (!can(role, 'edit')) {
        // Drop update and alert client
        logger.warn({ userId: user.id, roomId, role }, 'Dropped yjs:update from non-editor');
        return socket.emit('room:error', {
          code: 'FORBIDDEN',
          message: 'Viewers have read-only permissions and cannot edit the document',
        });
      }

      const updateBytes = new Uint8Array(update);
      if (updateBytes.byteLength > MAX_UPDATE_BYTES) {
        return socket.emit('room:error', {
          code: 'PAYLOAD_TOO_LARGE',
          message: 'Update exceeds maximum allowed size of 1 MB',
        });
      }

      const doc = await yjsManager.getDoc(roomId);
      Y.applyUpdate(doc, updateBytes, socket.id);

      // Enforce document length limit
      const currentText = doc.getText('monaco').toString();
      if (currentText.length > MAX_DOC_LENGTH) {
        return socket.emit('room:error', {
          code: 'DOCUMENT_TOO_LARGE',
          message: 'Document exceeds maximum size limit of 1 MB',
        });
      }

      // Broadcast to all other clients in the room
      socket.to(`room:${roomId}`).emit('yjs:update', {
        roomId,
        update: updateBytes,
      });

      yjsManager.scheduleSave(roomId);
    } catch (err) {
      logger.error({ err }, 'Error in yjs:update');
    }
  });
}
