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

const router = Router();

// All routes require authentication
router.use(authenticate);

router.get('/', getLists);
router.get('/:id', getList);
router.post('/', listValidation, createList);
router.put('/:id', listValidation, updateList);
router.delete('/:id', deleteList);
router.post('/:id/contacts', addContactToList);
router.delete('/:id/contacts/:contactId', removeContactFromList);

export default router;