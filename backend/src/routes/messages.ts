import { Router } from 'express';
import {
  getMessages,
  sendMessage,
  deleteMessage,
  messageValidation
} from '../controllers/messageController';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.get('/', getMessages);
router.post('/', messageValidation, sendMessage);
router.delete('/:id', deleteMessage);

export default router;