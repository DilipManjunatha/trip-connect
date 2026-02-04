import { Response } from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middleware/auth';
import { KanbanStatus } from '@prisma/client';

async function ensureGroupAccess(groupId: string, userId: string): Promise<boolean> {
  const member = await prisma.groupMember.findFirst({
    where: {
      groupId,
      OR: [{ userId }, { contact: { createdById: userId } }],
    },
  });
  return !!member;
}

export const getKanbanCards = async (req: AuthRequest, res: Response) => {
  try {
    const { groupId } = req.params;
    const userId = req.user!.id;

    if (!(await ensureGroupAccess(groupId, userId))) {
      return res.status(403).json({ success: false, message: 'You do not have access to this group' });
    }

    const cards = await prisma.kanbanCard.findMany({
      where: { groupId },
      orderBy: [{ status: 'asc' }, { position: 'asc' }, { createdAt: 'asc' }],
    });

    res.json({ success: true, data: { cards } });
  } catch (error) {
    console.error('Get kanban cards error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch cards' });
  }
};

/** Validation for POST (create): title required */
export const createKanbanCardValidation = [
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 500 }).withMessage('Title must be at most 500 characters'),
  body('description').optional().trim().isLength({ max: 2000 }).withMessage('Description must be at most 2000 characters'),
  body('status').optional().isIn(['TODO', 'IN_PROGRESS', 'DONE']).withMessage('Status must be TODO, IN_PROGRESS, or DONE'),
  body('position').optional().isInt().withMessage('Position must be an integer'),
  body('assigneeId').optional().trim(),
];

/** Validation for PUT (update): all fields optional so moving card (status-only) is allowed */
export const updateKanbanCardValidation = [
  body('title').optional().trim().notEmpty().withMessage('Title must not be empty').isLength({ max: 500 }).withMessage('Title must be at most 500 characters'),
  body('description').optional().trim().isLength({ max: 2000 }).withMessage('Description must be at most 2000 characters'),
  body('status').optional().isIn(['TODO', 'IN_PROGRESS', 'DONE']).withMessage('Status must be TODO, IN_PROGRESS, or DONE'),
  body('position').optional().isInt().withMessage('Position must be an integer'),
  body('assigneeId').optional().trim(),
];

export const createKanbanCard = async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation error', errors: errors.array() });
    }

    const { groupId } = req.params;
    const userId = req.user!.id;
    const { title, description, status, position } = req.body;

    if (!(await ensureGroupAccess(groupId, userId))) {
      return res.status(403).json({ success: false, message: 'You do not have access to this group' });
    }

    const maxPos = await prisma.kanbanCard.findFirst({
      where: { groupId, status: (status as KanbanStatus) || 'TODO' },
      orderBy: { position: 'desc' },
      select: { position: true },
    });
    const nextPosition = position != null ? Number(position) : (maxPos?.position ?? 0) + 1;

    const card = await prisma.kanbanCard.create({
      data: {
        groupId,
        title: title.trim(),
        description: description?.trim() || null,
        status: (status as KanbanStatus) || 'TODO',
        position: nextPosition,
      },
    });

    res.status(201).json({ success: true, data: card });
  } catch (error) {
    console.error('Create kanban card error:', error);
    res.status(500).json({ success: false, message: 'Failed to create card' });
  }
};

export const updateKanbanCard = async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation error', errors: errors.array() });
    }

    const { groupId, cardId } = req.params;
    const userId = req.user!.id;
    const { title, description, status, position } = req.body;

    if (!(await ensureGroupAccess(groupId, userId))) {
      return res.status(403).json({ success: false, message: 'You do not have access to this group' });
    }

    const existing = await prisma.kanbanCard.findFirst({
      where: { id: cardId, groupId },
    });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Card not found' });
    }

    const card = await prisma.kanbanCard.update({
      where: { id: cardId },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(status !== undefined && { status: status as KanbanStatus }),
        ...(position !== undefined && { position: Number(position) }),
      },
    });

    res.json({ success: true, data: card });
  } catch (error) {
    console.error('Update kanban card error:', error);
    res.status(500).json({ success: false, message: 'Failed to update card' });
  }
};

export const deleteKanbanCard = async (req: AuthRequest, res: Response) => {
  try {
    const { groupId, cardId } = req.params;
    const userId = req.user!.id;

    if (!(await ensureGroupAccess(groupId, userId))) {
      return res.status(403).json({ success: false, message: 'You do not have access to this group' });
    }

    const existing = await prisma.kanbanCard.findFirst({
      where: { id: cardId, groupId },
    });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Card not found' });
    }

    await prisma.kanbanCard.delete({ where: { id: cardId } });
    res.json({ success: true, message: 'Card deleted' });
  } catch (error) {
    console.error('Delete kanban card error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete card' });
  }
};
