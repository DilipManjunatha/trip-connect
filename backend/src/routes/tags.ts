import { Router } from 'express';
import {
  getTags,
  getTag,
  createTag,
  updateTag,
  deleteTag,
  tagValidation
} from '../controllers/tagController';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/authorize';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Tag management is admin-only
router.get('/', requireAdmin, getTags);
router.get('/:id', requireAdmin, getTag);
router.post('/', requireAdmin, tagValidation, createTag);
router.put('/:id', requireAdmin, tagValidation, updateTag);
router.delete('/:id', requireAdmin, deleteTag);

export default router;