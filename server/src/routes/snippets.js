import { Router } from 'express';
import { z } from 'zod';
import {
  createSnippet,
  getSnippets,
  getSnippetById,
  updateSnippet,
  deleteSnippet,
} from '../controllers/snippets.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

// All snippet routes require authentication
router.use(authenticate);

const createSnippetSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Title is required')
    .max(100, 'Title cannot exceed 100 characters'),
  language: z.string().trim().default('javascript'),
  code: z.string().max(102400, 'Code exceeds 100 KB limit'),
  tags: z
    .array(z.string().trim())
    .max(10, 'Cannot exceed 10 tags')
    .optional()
    .default([]),
});

const updateSnippetSchema = z.object({
  title: z.string().trim().min(1).max(100).optional(),
  language: z.string().trim().optional(),
  code: z.string().max(102400).optional(),
  tags: z.array(z.string().trim()).max(10).optional(),
});

router.post('/', validate(createSnippetSchema), createSnippet);
router.get('/', getSnippets);
router.get('/:id', getSnippetById);
router.patch('/:id', validate(updateSnippetSchema), updateSnippet);
router.delete('/:id', deleteSnippet);

export default router;

