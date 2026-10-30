import { ExecutionRun } from '../models/ExecutionRun.js';
import { Room } from '../models/Room.js';
import { can, getUserRoleInRoom } from '../services/permissions.js';
import { yjsManager } from '../services/yjsManager.js';
import { execute, isLanguageAvailable } from '../services/sandbox/index.js';
import { enqueueRun, checkEligibility } from '../services/sandbox/runQueue.js';
import logger from '../utils/logger.js';

export function registerRunHandlers(io, socket) {
  const user = socket.data.user;

  socket.on('run:start', async (payload, callback) => {
    try {
      const { roomId, language, stdin = '' } = payload || {};

      if (!roomId) {
        socket.emit('run:rejected', {
          reason: 'unsupported',
          message: 'Room ID is required',
        });
        if (typeof callback === 'function') callback({ ok: false, error: 'Room ID is required' });
        return;
      }

      const room = await Room.findById(roomId);
      if (!room) {
        socket.emit('run:rejected', {
          reason: 'unsupported',
          message: 'Room not found',
        });
        if (typeof callback === 'function') callback({ ok: false, error: 'Room not found' });
        return;
      }

      // Role check: editor or owner required
      const role = getUserRoleInRoom(room, user.id);
      if (!can(role, 'run')) {
        socket.emit('run:rejected', {
          reason: 'forbidden',
          message: 'You do not have permission to execute code in this room',
        });
        if (typeof callback === 'function') callback({ ok: false, error: 'Forbidden' });
        return;
      }

      // Determine language
      const targetLang = (language || room.language || 'javascript').toLowerCase().trim();
      if (!isLanguageAvailable(targetLang)) {
        socket.emit('run:rejected', {
          reason: 'unsupported',
          message: `Language '${targetLang}' is not available on this server`,
        });
        if (typeof callback === 'function') callback({ ok: false, error: 'Unsupported language' });
        return;
      }

      // Check eligibility (rate limit + queue capacity + single concurrent run per user)
      const eligibility = checkEligibility(user.id);
      if (!eligibility.allowed) {
        socket.emit('run:rejected', {
          reason: eligibility.reason,
          message: eligibility.message,
        });
        if (typeof callback === 'function') callback({ ok: false, error: eligibility.message });
        return;
      }

      // Source code is ALWAYS read from the server-side Y.Doc
      let code = yjsManager.getText(roomId);
      if (!code) {
        const doc = await yjsManager.getDoc(roomId);
        code = doc.getText('monaco').toString();
      }

      if (code.length > 100 * 1024) {
        socket.emit('run:rejected', {
          reason: 'unsupported',
          message: 'Code exceeds 100 KB limit',
        });
        if (typeof callback === 'function') callback({ ok: false, error: 'Code exceeds 100 KB limit' });
        return;
      }

      const by = {
        id: user.id,
        name: user.name,
        color: user.color,
      };

      // Create queued record in DB
      const cleanStdin = typeof stdin === 'string' ? stdin.slice(0, 10240) : '';
      const runDoc = await ExecutionRun.create({
        roomId: room._id,
        userId: user.id,
        language: targetLang,
        code,
        stdin: cleanStdin,
        status: 'queued',
      });
      const runId = runDoc._id.toString();

      // Emit run:queued to the entire room
      io.to(`room:${roomId}`).emit('run:queued', {
        runId,
        position: eligibility.position,
        by,
      });

      if (typeof callback === 'function') {
        callback({ ok: true, runId, position: eligibility.position });
      }

      // Queue and execute task
      enqueueRun({
        userId: user.id,
        onStarted: async () => {
          try {
            await ExecutionRun.findByIdAndUpdate(runId, { status: 'running' });
            io.to(`room:${roomId}`).emit('run:started', { runId, by });
          } catch (err) {
            logger.error({ err, runId }, 'Failed to emit or update run:started');
          }
        },
        task: async () => {
          let result;
          try {
            result = await execute({
              language: targetLang,
              code,
              stdin: cleanStdin,
            });
          } catch (execErr) {
            logger.error({ err: execErr, runId }, 'Unexpected runner error during execution');
            result = {
              status: 'error',
              stdout: '',
              stderr: `Execution failed: ${execErr.message}`,
              exitCode: 1,
              durationMs: 0,
              truncated: false,
            };
          }

          try {
            await ExecutionRun.findByIdAndUpdate(runId, {
              status: result.status,
              stdout: result.stdout,
              stderr: result.stderr,
              exitCode: result.exitCode,
              durationMs: result.durationMs,
              truncated: result.truncated,
            });

            io.to(`room:${roomId}`).emit('run:result', {
              runId,
              status: result.status,
              stdout: result.stdout,
              stderr: result.stderr,
              exitCode: result.exitCode,
              durationMs: result.durationMs,
              truncated: result.truncated,
              by,
            });
          } catch (dbErr) {
            logger.error({ err: dbErr, runId }, 'Failed to persist run results to DB');
          }

          return result;
        },
      });
    } catch (err) {
      logger.error({ err }, 'Error in run:start handler');
      socket.emit('run:rejected', {
        reason: err.reason || 'unsupported',
        message: err.message || 'Execution request failed',
      });
      if (typeof callback === 'function') {
        callback({ ok: false, error: err.message });
      }
    }
  });
}
