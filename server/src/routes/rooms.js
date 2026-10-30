import { Router } from 'express';
import { z } from 'zod';
import {
  createRoom,
  getRooms,
  getRoomBySlug,
  updateRoom,
  deleteRoom,
  regenerateInvite,
  joinRoom,
  updateMemberRole,
  removeMember,
} from '../controllers/rooms.js';
import { getRoomMessages } from '../controllers/messages.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

// All room routes require authentication
router.use(authenticate);

const createRoomSchema = z.object({
  name: z.string().trim().min(1, 'Room name is required').max(100, 'Room name too long'),
  language: z.string().trim().default('javascript'),
  visibility: z.enum(['public', 'private']).default('public'),
  defaultRole: z.enum(['editor', 'viewer']).default('editor'),
});

const updateRoomSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  language: z.string().trim().optional(),
  visibility: z.enum(['public', 'private']).optional(),
  defaultRole: z.enum(['editor', 'viewer']).optional(),
});

const joinRoomSchema = z.object({
  slug: z.string().trim().min(1, 'Slug is required'),
  inviteToken: z.string().optional(),
  viewToken: z.string().optional(),
});

const updateRoleSchema = z.object({
  role: z.enum(['editor', 'viewer']),
});

router.post('/', validate(createRoomSchema), createRoom);
router.get('/', getRooms);
router.post('/join', validate(joinRoomSchema), joinRoom);
router.get('/:id/messages', getRoomMessages);
router.get('/:slug', getRoomBySlug);
router.patch('/:id', validate(updateRoomSchema), updateRoom);
router.delete('/:id', deleteRoom);
router.post('/:id/invite/regenerate', regenerateInvite);
router.patch('/:id/members/:userId', validate(updateRoleSchema), updateMemberRole);
router.delete('/:id/members/:userId', removeMember);

export default router;

