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

const router = Router();

// All routes require authentication
router.use(authenticate);

router.get('/', getGroups);
router.get('/:id', getGroup);
router.post('/', groupValidation, createGroup);
router.put('/:id', groupValidation, updateGroup);
router.delete('/:id', deleteGroup);
router.post('/:id/members', addMembersToGroup);
router.delete('/:id/members/:memberId', removeMemberFromGroup);

export default router;