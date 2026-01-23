import { Router } from 'express';
import {
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  expenseValidation
} from '../controllers/expenseController';
import { authenticate } from '../middleware/auth';

const router = Router({ mergeParams: true });

// All routes require authentication
router.use(authenticate);

router.get('/', getExpenses);
router.post('/', expenseValidation, createExpense);
router.put('/:expenseId', expenseValidation, updateExpense);
router.delete('/:expenseId', deleteExpense);

export default router;
