import { Response } from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middleware/auth';
import { SmartListManager } from '../utils/smartListManager';

export const getTags = async (req: AuthRequest, res: Response) => {
  try {
    const { search } = req.query;
    
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { value: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    const tags = await prisma.tag.findMany({
      where,
      include: {
        _count: {
          select: {
            contacts: true,
            lists: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    res.json({
      success: true,
      data: { tags }
    });
  } catch (error) {
    console.error('Get tags error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tags'
    });
  }
};

export const getTag = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const tag = await prisma.tag.findUnique({
      where: { id },
      include: {
        contacts: {
          include: {
            contact: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        },
        lists: {
          select: {
            id: true,
            name: true,
            description: true,
            _count: {
              select: {
                members: true
              }
            }
          }
        },
        _count: {
          select: {
            contacts: true,
            lists: true
          }
        }
      }
    });

    if (!tag) {
      return res.status(404).json({
        success: false,
        message: 'Tag not found'
      });
    }

    res.json({
      success: true,
      data: { tag }
    });
  } catch (error) {
    console.error('Get tag error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tag'
    });
  }
};

export const createTag = async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const { name, value, color = '#3B82F6', description } = req.body;

    // Check if tag with same name and value already exists
    const existingTag = await prisma.tag.findFirst({
      where: {
        name,
        value: value || null
      }
    });

    if (existingTag) {
      return res.status(400).json({
        success: false,
        message: 'Tag with this name and value already exists'
      });
    }

    const tag = await prisma.tag.create({
      data: {
        name,
        value,
        color,
        description
      }
    });

    // Note: Smart lists are created automatically when contacts are tagged
    // No list is created here - it will be created when first contact gets this tag

    // Emit real-time event to all connected users
    const io = req.app.get('socketio');
    if (io) {
      io.emit('newTag', {
        id: tag.id,
        name: tag.name,
        value: tag.value,
        color: tag.color,
        description: tag.description
      });
    }

    res.status(201).json({
      success: true,
      message: 'Tag created successfully',
      data: { tag }
    });
  } catch (error) {
    console.error('Create tag error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create tag'
    });
  }
};

export const updateTag = async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { name, value, color, description } = req.body;

    const existingTag = await prisma.tag.findUnique({
      where: { id }
    });

    if (!existingTag) {
      return res.status(404).json({
        success: false,
        message: 'Tag not found'
      });
    }

    // Check for duplicate name/value combination (excluding current tag)
    const duplicateTag = await prisma.tag.findFirst({
      where: {
        name,
        value: value || null,
        id: { not: id }
      }
    });

    if (duplicateTag) {
      return res.status(400).json({
        success: false,
        message: 'Tag with this name and value already exists'
      });
    }

    const tag = await prisma.tag.update({
      where: { id },
      data: {
        name,
        value,
        color,
        description
      }
    });

    // Update smart list name if it exists
    await SmartListManager.updateTagList(id);

    res.json({
      success: true,
      message: 'Tag updated successfully',
      data: { tag }
    });
  } catch (error) {
    console.error('Update tag error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update tag'
    });
  }
};

export const deleteTag = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const tag = await prisma.tag.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            contacts: true
          }
        }
      }
    });

    if (!tag) {
      return res.status(404).json({
        success: false,
        message: 'Tag not found'
      });
    }

    // Delete the smart list for this tag (if it exists)
    await SmartListManager.deleteTagList(id);

    // Delete the tag (this will cascade delete ContactTag relationships)
    await prisma.tag.delete({
      where: { id }
    });

    // Emit real-time event to all connected users
    const io = req.app.get('socketio');
    if (io) {
      io.emit('tagDeleted', {
        id: tag.id,
        name: tag.name
      });
    }

    res.json({
      success: true,
      message: 'Tag deleted successfully'
    });
  } catch (error) {
    console.error('Delete tag error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete tag'
    });
  }
};

// Validation rules
export const tagValidation = [
  body('name')
    .isLength({ min: 1, max: 50 })
    .withMessage('Tag name must be between 1 and 50 characters'),
  body('value')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Tag value must be at most 100 characters'),
  body('color')
    .optional()
    .matches(/^#[0-9A-F]{6}$/i)
    .withMessage('Color must be a valid hex color code'),
  body('description')
    .optional()
    .isLength({ max: 255 })
    .withMessage('Description must be at most 255 characters')
];