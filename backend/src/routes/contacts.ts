import { Router } from 'express';
import {
  getContacts,
  getContact,
  createContact,
  updateContact,
  deleteContact,
  contactValidation
} from '../controllers/contactController';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/authorize';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Contact management is admin-only
router.get('/', requireAdmin, getContacts);
router.get('/:id', requireAdmin, getContact);
router.post('/', requireAdmin, contactValidation, createContact);
router.put('/:id', requireAdmin, contactValidation, updateContact);
router.delete('/:id', requireAdmin, deleteContact);

export default router;