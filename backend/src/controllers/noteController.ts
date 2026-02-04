import { Response } from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middleware/auth';
import { FollowUpStatus } from '@prisma/client';

export const getNotes = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { search } = req.query;

    const where: { createdById: string; OR?: Array<{ title?: { contains: string; mode: 'insensitive' }; content?: { contains: string; mode: 'insensitive' } }> } = {
      createdById: userId,
    };

    if (search && typeof search === 'string') {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
      ];
    }

    const notes = await prisma.note.findMany({
      where,
      orderBy: [{ reminderAt: 'asc' }, { updatedAt: 'desc' }],
    });

    res.json({
      success: true,
      data: { notes },
    });
  } catch (error) {
    console.error('Get notes error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notes',
    });
  }
};

export const getNote = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const note = await prisma.note.findFirst({
      where: { id, createdById: userId },
    });

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found',
      });
    }

    res.json({
      success: true,
      data: note,
    });
  } catch (error) {
    console.error('Get note error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch note',
    });
  }
};

export const noteValidation = [
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 500 }).withMessage('Title must be at most 500 characters'),
  body('content').optional().trim().isLength({ max: 10000 }).withMessage('Content must be at most 10000 characters'),
  body('reminderAt').optional({ values: 'null' }).isISO8601().withMessage('reminderAt must be a valid ISO date').toDate(),
  body('followUp').optional().isIn(['NONE', 'PENDING', 'DONE']).withMessage('followUp must be NONE, PENDING, or DONE'),
];

export const createNote = async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array(),
      });
    }

    const { title, content, reminderAt, followUp } = req.body;
    const userId = req.user!.id;

    const note = await prisma.note.create({
      data: {
        title: title.trim(),
        content: content?.trim() || null,
        reminderAt: reminderAt || null,
        followUp: (followUp as FollowUpStatus) || FollowUpStatus.NONE,
        createdById: userId,
      },
    });

    res.status(201).json({
      success: true,
      data: note,
    });
  } catch (error) {
    console.error('Create note error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create note',
    });
  }
};

export const updateNote = async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array(),
      });
    }

    const { id } = req.params;
    const userId = req.user!.id;
    const { title, content, reminderAt, followUp } = req.body;

    const existing = await prisma.note.findFirst({
      where: { id, createdById: userId },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Note not found',
      });
    }

    const note = await prisma.note.update({
      where: { id },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(content !== undefined && { content: content?.trim() || null }),
        ...(reminderAt !== undefined && { reminderAt: reminderAt || null }),
        ...(followUp !== undefined && { followUp: followUp as FollowUpStatus }),
      },
    });

    res.json({
      success: true,
      data: note,
    });
  } catch (error) {
    console.error('Update note error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update note',
    });
  }
};

export const deleteNote = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const existing = await prisma.note.findFirst({
      where: { id, createdById: userId },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Note not found',
      });
    }

    await prisma.note.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Note deleted',
    });
  } catch (error) {
    console.error('Delete note error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete note',
    });
  }
};
