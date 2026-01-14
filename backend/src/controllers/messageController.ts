import { Response } from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middleware/auth';

export const getMessages = async (req: AuthRequest, res: Response) => {
  try {
    const { groupId } = req.query;
    const { page = 1, limit = 20 } = req.query;
    const userId = req.user!.id;

    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};

    if (groupId) {
      // Check if user has access to this group
      const groupMember = await prisma.groupMember.findFirst({
        where: {
          groupId: groupId as string,
          OR: [
            { userId },
            { contact: { createdById: userId } }
          ]
        }
      });

      if (!groupMember) {
        return res.status(403).json({
          success: false,
          message: 'You do not have access to this group'
        });
      }

      where.groupId = groupId;
    }

    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where,
        include: {
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true
            }
          },
          group: {
            select: {
              id: true,
              name: true
            }
          }
        },
        skip,
        take: Number(limit),
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.message.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        messages,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch messages'
    });
  }
};

export const sendMessage = async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const { content, type = 'TEXT', groupId } = req.body;
    const userId = req.user!.id;

    // Check if user has access to the group
    if (groupId) {
      const groupMember = await prisma.groupMember.findFirst({
        where: {
          groupId,
          OR: [
            { userId },
            { contact: { createdById: userId } }
          ]
        }
      });

      if (!groupMember) {
        return res.status(403).json({
          success: false,
          message: 'You do not have access to this group'
        });
      }
    }

    const message = await prisma.message.create({
      data: {
        content,
        type,
        groupId: groupId || null,
        senderId: userId
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true
          }
        },
        group: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // Emit message via Socket.io
    const io = req.app.get('socketio');
    if (groupId) {
      io.to(groupId).emit('new-message', message);
    }

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: { message }
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message'
    });
  }
};

export const deleteMessage = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const message = await prisma.message.findFirst({
      where: {
        id,
        senderId: userId
      }
    });

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found or you do not have permission to delete it'
      });
    }

    await prisma.message.delete({
      where: { id }
    });

    // Emit deletion via Socket.io
    const io = req.app.get('socketio');
    if (message.groupId) {
      io.to(message.groupId).emit('message-deleted', { messageId: id });
    }

    res.json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete message'
    });
  }
};

// Validation rules
export const messageValidation = [
  body('content')
    .isLength({ min: 1, max: 1000 })
    .withMessage('Message content must be between 1 and 1000 characters'),
  body('type')
    .optional()
    .isIn(['TEXT', 'IMAGE', 'FILE', 'ANNOUNCEMENT'])
    .withMessage('Invalid message type'),
  body('groupId')
    .optional()
    .isString()
    .withMessage('Group ID must be a string')
];