import { Router } from 'express';
import {
  getKanbanCards,
  createKanbanCard,
  updateKanbanCard,
  deleteKanbanCard,
  createKanbanCardValidation,
  updateKanbanCardValidation,
} from '../controllers/kanbanController';
import { authenticate } from '../middleware/auth';

const router = Router({ mergeParams: true });

router.use(authenticate);

router.get('/', getKanbanCards);
router.post('/', createKanbanCardValidation, createKanbanCard);
router.put('/:cardId', updateKanbanCardValidation, updateKanbanCard);
router.delete('/:cardId', deleteKanbanCard);

export default router;
