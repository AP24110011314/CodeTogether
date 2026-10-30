import { Message } from '../models/Message.js';
import { Room } from '../models/Room.js';
import { can, getUserRoleInRoom } from '../services/permissions.js';

export async function getRoomMessages(req, res, next) {
  try {
    const { id } = req.params;
    const { before, limit } = req.query;
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
          message: 'You do not have permission to view messages in this room',
        },
      });
    }

    const filter = { roomId: room._id };
    if (before) {
      const beforeDate = new Date(before);
      if (!isNaN(beforeDate.getTime())) {
        filter.createdAt = { $lt: beforeDate };
      }
    }

    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 100);

    const rawMessages = await Message.find(filter)
      .sort({ createdAt: -1 })
      .limit(limitNum + 1)
      .populate('userId', 'name avatarColor')
      .lean();

    const hasMore = rawMessages.length > limitNum;
    const page = hasMore ? rawMessages.slice(0, limitNum) : rawMessages;

    const formatted = page.map((m) => ({
      id: m._id.toString(),
      roomId: m.roomId.toString(),
      userId: m.userId?._id ? m.userId._id.toString() : (m.userId?.toString() || null),
      name: m.userId?.name || (m.type === 'system' ? 'System' : 'Unknown'),
      color: m.userId?.avatarColor || '#64748b',
      type: m.type,
      text: m.text,
      createdAt: m.createdAt.toISOString(),
    }));

    return res.status(200).json({
      messages: formatted,
      hasMore,
    });
  } catch (error) {
    next(error);
  }
}

