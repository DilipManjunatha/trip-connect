import { Response } from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middleware/auth';

export const getLists = async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, limit = 10, search, isAutomatic } = req.query;
    const userId = req.user!.id;
    
    const skip = (Number(page) - 1) * Number(limit);
    
    const where: any = {};

    if (search) {
      where.name = { contains: search as string, mode: 'insensitive' };
    }

    if (isAutomatic !== undefined) {
      where.isAutomatic = isAutomatic === 'true';
    }

    // Filter lists to only show those with contacts belonging to the user
    // or automatic lists (which are global but only show contacts user owns)
    const [lists, total] = await Promise.all([
      prisma.list.findMany({
        where,
        include: {
          tag: true,
          members: {
            where: {
              contact: {
                createdById: userId
              }
            },
            include: {
              contact: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  avatar: true
                }
              }
            }
          },
          _count: {
            select: {
              members: {
                where: {
                  contact: {
                    createdById: userId
                  }
                }
              }
            }
          }
        },
        skip,
        take: Number(limit),
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.list.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        lists,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get lists error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch lists'
    });
  }
};

export const getList = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const list = await prisma.list.findUnique({
      where: { id },
      include: {
        tag: true,
        members: {
          include: {
            contact: {
              include: {
                tags: {
                  include: {
                    tag: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!list) {
      return res.status(404).json({
        success: false,
        message: 'List not found'
      });
    }

    res.json({
      success: true,
      data: { list }
    });
  } catch (error) {
    console.error('Get list error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch list'
    });
  }
};

export const createList = async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const { name, description, contactIds = [] } = req.body;

    const list = await prisma.list.create({
      data: {
        name,
        description,
        isAutomatic: false,
        members: {
          create: contactIds.map((contactId: string) => ({
            contactId
          }))
        }
      },
      include: {
        members: {
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
        }
      }
    });

    // Emit real-time event to all connected users
    const io = req.app.get('socketio');
    if (io) {
      io.emit('newList', {
        id: list.id,
        name: list.name,
        description: list.description,
        isAutomatic: list.isAutomatic,
        memberCount: list.members?.length || 0
      });
    }

    res.status(201).json({
      success: true,
      message: 'List created successfully',
      data: { list }
    });
  } catch (error) {
    console.error('Create list error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create list'
    });
  }
};

export const updateList = async (req: AuthRequest, res: Response) => {
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
    const { name, description, contactIds = [] } = req.body;

    const existingList = await prisma.list.findUnique({
      where: { id }
    });

    if (!existingList) {
      return res.status(404).json({
        success: false,
        message: 'List not found'
      });
    }

    if (existingList.isAutomatic) {
      return res.status(400).json({
        success: false,
        message: 'Cannot update automatic lists'
      });
    }

    const list = await prisma.list.update({
      where: { id },
      data: {
        name,
        description,
        members: {
          deleteMany: {},
          create: contactIds.map((contactId: string) => ({
            contactId
          }))
        }
      },
      include: {
        members: {
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
        }
      }
    });

    res.json({
      success: true,
      message: 'List updated successfully',
      data: { list }
    });
  } catch (error) {
    console.error('Update list error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update list'
    });
  }
};

export const deleteList = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const list = await prisma.list.findUnique({
      where: { id }
    });

    if (!list) {
      return res.status(404).json({
        success: false,
        message: 'List not found'
      });
    }

    if (list.isAutomatic) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete automatic lists. These are managed by their associated tags.',
        details: 'Automatic lists are created when tags are created and can only be deleted by deleting the associated tag.'
      });
    }

    await prisma.list.delete({
      where: { id }
    });

    // Emit real-time event to all connected users
    const io = req.app.get('socketio');
    if (io) {
      io.emit('listDeleted', {
        id: list.id,
        name: list.name
      });
    }

    res.json({
      success: true,
      message: 'List deleted successfully'
    });
  } catch (error) {
    console.error('Delete list error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete list'
    });
  }
};

export const addContactToList = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { contactId } = req.body;

    const list = await prisma.list.findUnique({
      where: { id }
    });

    if (!list) {
      return res.status(404).json({
        success: false,
        message: 'List not found'
      });
    }

    if (list.isAutomatic) {
      return res.status(400).json({
        success: false,
        message: 'Cannot manually add contacts to automatic lists'
      });
    }

    await prisma.listMember.create({
      data: {
        listId: id,
        contactId
      }
    });

    res.json({
      success: true,
      message: 'Contact added to list successfully'
    });
  } catch (error) {
    if (error instanceof Error && 'code' in error) {
      if ((error as any).code === 'P2002') {
        return res.status(400).json({
          success: false,
          message: 'Contact is already in this list'
        });
      }
    }

    console.error('Add contact to list error:', error);
    res.status(500).json({
      success: false,
      message: 'An unexpected error occurred'
    });
  }
};

export const removeContactFromList = async (req: AuthRequest, res: Response) => {
  try {
    const { id, contactId } = req.params;

    const list = await prisma.list.findUnique({
      where: { id }
    });

    if (!list) {
      return res.status(404).json({
        success: false,
        message: 'List not found'
      });
    }

    if (list.isAutomatic) {
      return res.status(400).json({
        success: false,
        message: 'Cannot manually remove contacts from automatic lists'
      });
    }

    await prisma.listMember.deleteMany({
      where: {
        listId: id,
        contactId
      }
    });

    res.json({
      success: true,
      message: 'Contact removed from list successfully'
    });
  } catch (error) {
    console.error('Remove contact from list error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove contact from list'
    });
  }
};

// Validation rules
export const listValidation = [
  body('name')
    .isLength({ min: 1, max: 100 })
    .withMessage('List name must be between 1 and 100 characters'),
  body('description')
    .optional()
    .isLength({ max: 255 })
    .withMessage('Description must be at most 255 characters'),
  body('contactIds')
    .optional()
    .isArray()
    .withMessage('Contact IDs must be an array')
];