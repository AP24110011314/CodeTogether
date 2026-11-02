import { Router } from 'express';
import { z } from 'zod';
import { handleAiTutorChat } from '../controllers/aiTutor.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { aiTutorLimiter } from '../middleware/rateLimit.js';

const router = Router();

const chatHistoryItemSchema = z.object({
  role: z.enum(['user', 'model', 'assistant', 'ai']),
  text: z.string().max(8000),
});

const chatSchema = z.object({
  message: z.string().trim().min(1, 'Message cannot be empty').max(8000, 'Message is too long'),
  history: z.array(chatHistoryItemSchema).max(30).optional(),
  context: z
    .object({
      code: z.string().max(50000).optional(),
      language: z.string().max(50).optional(),
      topic: z.string().max(200).optional(),
    })
    .optional(),
});

router.post('/chat', authenticate, aiTutorLimiter, validate(chatSchema), handleAiTutorChat);

export default router;
