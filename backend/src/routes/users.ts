import express from 'express';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/authorize';
import {
  getUsers,
  getUser,
  updateUserRole,
  updateUser,
  deleteUser,
  getUserStats,
} from '../controllers/userController';

const router = express.Router();

// All routes require authentication and admin role
router.use(authenticate);
router.use(requireAdmin);

// User management routes
router.get('/', getUsers);
router.get('/stats', getUserStats);
router.get('/:id', getUser);
router.put('/:id/role', updateUserRole);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

export default router;
