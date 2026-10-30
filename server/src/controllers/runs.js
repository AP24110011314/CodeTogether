import { ExecutionRun } from '../models/ExecutionRun.js';
import { Room } from '../models/Room.js';
import { getAvailableLanguages } from '../services/sandbox/languages.js';
import { can, getUserRoleInRoom } from '../services/permissions.js';

export async function getLanguages(req, res, next) {
  try {
    const languages = getAvailableLanguages();
    return res.status(200).json({ languages });
  } catch (error) {
    next(error);
  }
}

export async function getRoomRuns(req, res, next) {
  try {
    const { id } = req.params;
    const { limit = 20 } = req.query;
    const userId = req.user.id;

    const room = await Room.findById(id);
    if (!room) {
      return res.status(404).json({
        error: {
          code: 'ROOM_NOT_FOUND',
          message: 'Room not found',
        },
      });
    }

    const role = getUserRoleInRoom(room, userId);
    if (!can(role, 'read')) {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to view runs in this room',
        },
      });
    }

    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 50);

    const rawRuns = await ExecutionRun.find({ roomId: room._id })
      .sort({ createdAt: -1 })
      .limit(limitNum)
      .populate('userId', 'name avatarColor')
      .lean();

    const runs = rawRuns.map((r) => ({
      id: r._id.toString(),
      roomId: r.roomId.toString(),
      userId: r.userId?._id ? r.userId._id.toString() : r.userId?.toString(),
      user: r.userId
        ? {
            id: r.userId._id ? r.userId._id.toString() : r.userId.toString(),
            name: r.userId.name,
            color: r.userId.avatarColor,
          }
        : null,
      language: r.language,
      code: r.code,
      stdin: r.stdin,
      stdout: r.stdout,
      stderr: r.stderr,
      status: r.status,
      exitCode: r.exitCode,
      durationMs: r.durationMs,
      truncated: r.truncated,
      createdAt: r.createdAt ? r.createdAt.toISOString() : new Date().toISOString(),
    }));

    return res.status(200).json({ runs });
  } catch (error) {
    next(error);
  }
}

export async function getRunById(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const run = await ExecutionRun.findById(id).populate('userId', 'name avatarColor');
    if (!run) {
      return res.status(404).json({
        error: {
          code: 'RUN_NOT_FOUND',
          message: 'Execution run not found',
        },
      });
    }

    const room = await Room.findById(run.roomId);
    if (!room) {
      return res.status(404).json({
        error: {
          code: 'ROOM_NOT_FOUND',
          message: 'Room associated with run not found',
        },
      });
    }

    const role = getUserRoleInRoom(room, userId);
    if (!can(role, 'read')) {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to view this run',
        },
      });
    }

    return res.status(200).json({
      run: {
        id: run._id.toString(),
        roomId: run.roomId.toString(),
        userId: run.userId?._id ? run.userId._id.toString() : run.userId?.toString(),
        user: run.userId
          ? {
              id: run.userId._id ? run.userId._id.toString() : run.userId.toString(),
              name: run.userId.name,
              color: run.userId.avatarColor,
            }
          : null,
        language: run.language,
        code: run.code,
        stdin: run.stdin,
        stdout: run.stdout,
        stderr: run.stderr,
        status: run.status,
        exitCode: run.exitCode,
        durationMs: run.durationMs,
        truncated: run.truncated,
        createdAt: run.createdAt ? run.createdAt.toISOString() : new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
}

