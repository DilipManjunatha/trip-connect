import { Router } from 'express';
import {
  getGroups,
  getGroup,
  createGroup,
  updateGroup,
  deleteGroup,
  addMembersToGroup,
  removeMemberFromGroup,
  groupValidation
} from '../controllers/groupController';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/authorize';

const router = Router();

// All routes require authentication
router.use(authenticate);

// All users can view groups they're members of (handled in controller)
router.get('/', getGroups);
router.get('/:id', getGroup);

// Group management (create/update/delete) is admin-only
router.post('/', requireAdmin, groupValidation, createGroup);
router.put('/:id', requireAdmin, groupValidation, updateGroup);
router.delete('/:id', requireAdmin, deleteGroup);
router.post('/:id/members', requireAdmin, addMembersToGroup);
router.delete('/:id/members/:memberId', requireAdmin, removeMemberFromGroup);

export default router;