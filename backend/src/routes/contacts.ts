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

const router = Router();

// All routes require authentication
router.use(authenticate);

router.get('/', getContacts);
router.get('/:id', getContact);
router.post('/', contactValidation, createContact);
router.put('/:id', contactValidation, updateContact);
router.delete('/:id', deleteContact);

export default router;