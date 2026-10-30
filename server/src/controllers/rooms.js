import mongoose from 'mongoose';
import { Room } from '../models/Room.js';
import { Document } from '../models/Document.js';
import { generateSlug, generateToken } from '../utils/slug.js';
import { getUserRoleInRoom } from '../services/permissions.js';

export async function createRoom(req, res, next) {
  try {
    const { name, language = 'javascript', visibility = 'public', defaultRole = 'editor' } = req.body;
    const userId = req.user.id;

    let slug = generateSlug();
    // Ensure slug uniqueness
    while (await Room.findOne({ slug })) {
      slug = generateSlug();
    }

    const inviteToken = generateToken();
    const viewToken = generateToken();

    const room = new Room({
      name,
      slug,
      ownerId: userId,
      language,
      visibility,
      defaultRole,
      inviteToken,
      viewToken,
      members: [
        {
          userId,
          role: 'owner',
          joinedAt: new Date(),
        },
      ],
    });

    await room.save();

    // Initialize document for room
    await Document.create({
      roomId: room._id,
      yjsState: Buffer.alloc(0),
    });

    return res.status(201).json({
      room,
      role: 'owner',
    });
  } catch (error) {
    next(error);
  }
}

export async function getRooms(req, res, next) {
  try {
    const { scope } = req.query;
    const userId = req.user.id;

    let query = {};
    if (scope === 'mine') {
      query = { ownerId: userId };
    } else if (scope === 'joined') {
      query = { 'members.userId': userId, ownerId: { $ne: userId } };
    } else {
      query = { 'members.userId': userId };
    }

    const rooms = await Room.find(query)
      .populate('ownerId', 'name email avatarColor')
      .populate('members.userId', 'name email avatarColor')
      .sort({ updatedAt: -1 });

    return res.status(200).json({ rooms });
  } catch (error) {
    next(error);
  }
}

export async function getRoomBySlug(req, res, next) {
  try {
    const { slug } = req.params;
    const { invite, view } = req.query;
    const userId = req.user.id;

    const room = await Room.findOne({ slug })
      .populate('ownerId', 'name email avatarColor')
      .populate('members.userId', 'name email avatarColor');

    if (!room) {
      return res.status(404).json({
        error: {
          code: 'ROOM_NOT_FOUND',
          message: 'Room not found',
        },
      });
    }

    let role = getUserRoleInRoom(room, userId);

    if (room.visibility === 'private') {
      if (!role) {
        if (invite && invite === room.inviteToken) {
          role = 'editor';
          room.members.push({ userId, role, joinedAt: new Date() });
          await room.save();
        } else if (view && view === room.viewToken) {
          role = 'viewer';
          room.members.push({ userId, role, joinedAt: new Date() });
          await room.save();
        } else {
          return res.status(403).json({
            error: {
              code: 'FORBIDDEN',
              message: 'This room is private. A valid invite or view token is required.',
            },
          });
        }
      }
    } else {
      // Public room: auto-join if not already a member
      if (!role) {
        role = room.defaultRole || 'editor';
        room.members.push({ userId, role, joinedAt: new Date() });
        await room.save();
      }
    }

    return res.status(200).json({
      room,
      role,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateRoom(req, res, next) {
  try {
    const { id } = req.params;
    const { name, language, visibility, defaultRole } = req.body;
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

    if (room.ownerId.toString() !== userId.toString()) {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'Only the room owner can update room settings',
        },
      });
    }

    if (name !== undefined) room.name = name;
    if (language !== undefined) room.language = language;
    if (visibility !== undefined) room.visibility = visibility;
    if (defaultRole !== undefined) room.defaultRole = defaultRole;

    await room.save();

    return res.status(200).json({ room });
  } catch (error) {
    next(error);
  }
}

export async function deleteRoom(req, res, next) {
  try {
    const { id } = req.params;
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

    if (room.ownerId.toString() !== userId.toString()) {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'Only the room owner can delete this room',
        },
      });
    }

    // Cascade delete Document and future models (Messages, Runs)
    await Document.deleteOne({ roomId: room._id });
    if (mongoose.models.Message) {
      await mongoose.models.Message.deleteMany({ roomId: room._id });
    }
    if (mongoose.models.ExecutionRun) {
      await mongoose.models.ExecutionRun.deleteMany({ roomId: room._id });
    }

    await Room.findByIdAndDelete(id);

    return res.status(200).json({ message: 'Room deleted successfully' });
  } catch (error) {
    next(error);
  }
}

export async function regenerateInvite(req, res, next) {
  try {
    const { id } = req.params;
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

    if (room.ownerId.toString() !== userId.toString()) {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'Only the room owner can regenerate invite tokens',
        },
      });
    }

    room.inviteToken = generateToken();
    room.viewToken = generateToken();
    await room.save();

    return res.status(200).json({
      inviteToken: room.inviteToken,
      viewToken: room.viewToken,
    });
  } catch (error) {
    next(error);
  }
}

export async function joinRoom(req, res, next) {
  try {
    const { slug, inviteToken, viewToken } = req.body;
    const userId = req.user.id;

    const room = await Room.findOne({ slug });
    if (!room) {
      return res.status(404).json({
        error: {
          code: 'ROOM_NOT_FOUND',
          message: 'Room not found',
        },
      });
    }

    let role = getUserRoleInRoom(room, userId);

    if (room.visibility === 'private') {
      if (!role) {
        if (inviteToken && inviteToken === room.inviteToken) {
          role = 'editor';
          room.members.push({ userId, role, joinedAt: new Date() });
          await room.save();
        } else if (viewToken && viewToken === room.viewToken) {
          role = 'viewer';
          room.members.push({ userId, role, joinedAt: new Date() });
          await room.save();
        } else {
          return res.status(403).json({
            error: {
              code: 'FORBIDDEN',
              message: 'Invalid invite or view token for this private room',
            },
          });
        }
      }
    } else {
      if (!role) {
        role = room.defaultRole || 'editor';
        room.members.push({ userId, role, joinedAt: new Date() });
        await room.save();
      }
    }

    return res.status(200).json({
      ok: true,
      room,
      role,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateMemberRole(req, res, next) {
  try {
    const { id, userId: targetUserId } = req.params;
    const { role } = req.body;
    const currentUserId = req.user.id;

    const room = await Room.findById(id);
    if (!room) {
      return res.status(404).json({
        error: {
          code: 'ROOM_NOT_FOUND',
          message: 'Room not found',
        },
      });
    }

    if (room.ownerId.toString() !== currentUserId.toString()) {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'Only the room owner can change member roles',
        },
      });
    }

    if (room.ownerId.toString() === targetUserId.toString()) {
      return res.status(400).json({
        error: {
          code: 'INVALID_OPERATION',
          message: 'Cannot change the role of the room owner',
        },
      });
    }

    const member = room.members.find((m) => m.userId.toString() === targetUserId.toString());
    if (!member) {
      return res.status(404).json({
        error: {
          code: 'MEMBER_NOT_FOUND',
          message: 'User is not a member of this room',
        },
      });
    }

    member.role = role;
    await room.save();

    return res.status(200).json({
      userId: targetUserId,
      role,
    });
  } catch (error) {
    next(error);
  }
}

export async function removeMember(req, res, next) {
  try {
    const { id, userId: targetUserId } = req.params;
    const currentUserId = req.user.id;

    const room = await Room.findById(id);
    if (!room) {
      return res.status(404).json({
        error: {
          code: 'ROOM_NOT_FOUND',
          message: 'Room not found',
        },
      });
    }

    const isOwner = room.ownerId.toString() === currentUserId.toString();
    const isSelf = targetUserId.toString() === currentUserId.toString();

    if (!isOwner && !isSelf) {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'You are not authorized to remove this member',
        },
      });
    }

    if (room.ownerId.toString() === targetUserId.toString()) {
      return res.status(400).json({
        error: {
          code: 'INVALID_OPERATION',
          message: 'Owner cannot leave or be removed from room. Delete the room instead.',
        },
      });
    }

    room.members = room.members.filter((m) => m.userId.toString() !== targetUserId.toString());
    await room.save();

    return res.status(200).json({
      message: isSelf ? 'Left room successfully' : 'Member removed successfully',
      userId: targetUserId,
    });
  } catch (error) {
    next(error);
  }
}

