import { Response } from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middleware/auth';

export const getGroups = async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, limit = 10, search, status } = req.query;
    const userId = req.user!.id;
    
    const skip = (Number(page) - 1) * Number(limit);
    
    const where: any = {
      createdById: userId
    };

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { destination: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    if (status) {
      where.status = status as string;
    }

    const [groups, total] = await Promise.all([
      prisma.tripGroup.findMany({
        where,
        include: {
          members: {
            include: {
              contact: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  avatar: true
                }
              },
              user: {
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
              members: true,
              itineraries: true,
              expenses: true,
              messages: true
            }
          }
        },
        skip,
        take: Number(limit),
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.tripGroup.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        groups,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get groups error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch groups'
    });
  }
};

export const getGroup = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const group = await prisma.tripGroup.findFirst({
      where: {
        id,
        OR: [
          { createdById: userId },
          { members: { some: { userId } } }
        ]
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        members: {
          include: {
            contact: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                avatar: true
              }
            },
            user: {
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
        itineraries: {
          orderBy: {
            startTime: 'asc'
          }
        },
        expenses: {
          orderBy: {
            date: 'desc'
          }
        },
        messages: {
          include: {
            sender: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 20
        }
      }
    });

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    res.json({
      success: true,
      data: { group }
    });
  } catch (error) {
    console.error('Get group error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch group'
    });
  }
};

export const createGroup = async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const {
      name,
      description,
      destination,
      startDate,
      endDate,
      budget,
      contactIds = [],
      userIds = []
    } = req.body;
    const userId = req.user!.id;

    const group = await prisma.tripGroup.create({
      data: {
        name,
        description,
        destination,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        budget,
        createdById: userId,
        members: {
          create: [
            // Add creator as organizer
            {
              userId,
              role: 'ORGANIZER',
              isConfirmed: true
            },
            // Add contacts
            ...contactIds.map((contactId: string) => ({
              contactId,
              role: 'MEMBER'
            })),
            // Add other users
            ...userIds.map((uid: string) => ({
              userId: uid,
              role: 'MEMBER'
            }))
          ]
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
            },
            user: {
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

    res.status(201).json({
      success: true,
      message: 'Group created successfully',
      data: { group }
    });
  } catch (error) {
    console.error('Create group error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create group'
    });
  }
};

export const updateGroup = async (req: AuthRequest, res: Response) => {
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
    const {
      name,
      description,
      destination,
      startDate,
      endDate,
      budget,
      status
    } = req.body;
    const userId = req.user!.id;

    // Check if user has permission to update
    const group = await prisma.tripGroup.findFirst({
      where: {
        id,
        OR: [
          { createdById: userId },
          { 
            members: { 
              some: { 
                userId,
                role: { in: ['ORGANIZER', 'CO_ORGANIZER'] }
              }
            }
          }
        ]
      }
    });

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found or you do not have permission to update it'
      });
    }

    const updatedGroup = await prisma.tripGroup.update({
      where: { id },
      data: {
        name,
        description,
        destination,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        budget,
        status
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
            },
            user: {
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
      message: 'Group updated successfully',
      data: { group: updatedGroup }
    });
  } catch (error) {
    console.error('Update group error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update group'
    });
  }
};

export const deleteGroup = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const group = await prisma.tripGroup.findFirst({
      where: {
        id,
        createdById: userId
      }
    });

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found or you do not have permission to delete it'
      });
    }

    await prisma.tripGroup.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Group deleted successfully'
    });
  } catch (error) {
    console.error('Delete group error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete group'
    });
  }
};

export const addMembersToGroup = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { contactIds = [], userIds = [] } = req.body;
    const userId = req.user!.id;

    // Check permissions
    const group = await prisma.tripGroup.findFirst({
      where: {
        id,
        OR: [
          { createdById: userId },
          { 
            members: { 
              some: { 
                userId,
                role: { in: ['ORGANIZER', 'CO_ORGANIZER'] }
              }
            }
          }
        ]
      }
    });

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found or you do not have permission'
      });
    }

    const newMembers = [
      ...contactIds.map((contactId: string) => ({
        groupId: id,
        contactId,
        role: 'MEMBER' as const
      })),
      ...userIds.map((uid: string) => ({
        groupId: id,
        userId: uid,
        role: 'MEMBER' as const
      }))
    ];

    await prisma.groupMember.createMany({
      data: newMembers,
      skipDuplicates: true
    });

    res.json({
      success: true,
      message: 'Members added successfully'
    });
  } catch (error) {
    console.error('Add members error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add members'
    });
  }
};

export const removeMemberFromGroup = async (req: AuthRequest, res: Response) => {
  try {
    const { id, memberId } = req.params;
    const userId = req.user!.id;

    // Check permissions
    const group = await prisma.tripGroup.findFirst({
      where: {
        id,
        OR: [
          { createdById: userId },
          { 
            members: { 
              some: { 
                userId,
                role: { in: ['ORGANIZER', 'CO_ORGANIZER'] }
              }
            }
          }
        ]
      }
    });

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found or you do not have permission'
      });
    }

    await prisma.groupMember.delete({
      where: { id: memberId }
    });

    res.json({
      success: true,
      message: 'Member removed successfully'
    });
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove member'
    });
  }
};

// Validation rules
export const groupValidation = [
  body('name')
    .isLength({ min: 1, max: 100 })
    .withMessage('Group name must be between 1 and 100 characters'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description must be at most 500 characters'),
  body('destination')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Destination must be at most 100 characters'),
  body('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid date'),
  body('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid date'),
  body('budget')
    .optional()
    .isNumeric()
    .withMessage('Budget must be a number')
];