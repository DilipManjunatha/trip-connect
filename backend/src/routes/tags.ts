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

const router = Router();

// All routes require authentication
router.use(authenticate);

router.get('/', getTags);
router.get('/:id', getTag);
router.post('/', tagValidation, createTag);
router.put('/:id', tagValidation, updateTag);
router.delete('/:id', deleteTag);

export default router;