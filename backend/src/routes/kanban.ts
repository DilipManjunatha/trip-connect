import { Router } from 'express';
import {
  getKanbanCards,
  createKanbanCard,
  updateKanbanCard,
  deleteKanbanCard,
  kanbanCardValidation,
} from '../controllers/kanbanController';
import { authenticate } from '../middleware/auth';

const router = Router({ mergeParams: true });

router.use(authenticate);

router.get('/', getKanbanCards);
router.post('/', kanbanCardValidation, createKanbanCard);
router.put('/:cardId', kanbanCardValidation, updateKanbanCard);
router.delete('/:cardId', deleteKanbanCard);

export default router;
