import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { getLanguages, getRunById } from '../controllers/runs.js';

const router = express.Router();

// GET /api/runs/languages - available languages on this machine
router.get('/languages', getLanguages);

// GET /api/runs/:id - details of single run
router.get('/:id', authenticate, getRunById);

export default router;
