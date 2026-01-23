import { Router } from 'express';
import {
  getLists,
  getList,
  createList,
  updateList,
  deleteList,
  addContactToList,
  removeContactFromList,
  listValidation
} from '../controllers/listController';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/authorize';

const router = Router();

// All routes require authentication
router.use(authenticate);

// List management is admin-only
router.get('/', requireAdmin, getLists);
router.get('/:id', requireAdmin, getList);
router.post('/', requireAdmin, listValidation, createList);
router.put('/:id', requireAdmin, listValidation, updateList);
router.delete('/:id', requireAdmin, deleteList);
router.post('/:id/contacts', requireAdmin, addContactToList);
router.delete('/:id/contacts/:contactId', requireAdmin, removeContactFromList);

export default router;