import { Response } from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middleware/auth';

export const getContacts = async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, limit = 10, search, tagId } = req.query;
    const userId = req.user!.id;

    const skip = (Number(page) - 1) * Number(limit);
    
    const where: any = {
      createdById: userId
    };

    // Add search filter
    if (search) {
      where.OR = [
        { firstName: { contains: search as string, mode: 'insensitive' } },
        { lastName: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    // Add tag filter
    if (tagId) {
      where.tags = {
        some: {
          tagId: tagId as string
        }
      };
    }

    const [contacts, total] = await Promise.all([
      prisma.contact.findMany({
        where,
        include: {
          tags: {
            include: {
              tag: true
            }
          },
          _count: {
            select: {
              groupMembers: true,
              lists: true
            }
          }
        },
        skip,
        take: Number(limit),
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.contact.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        contacts,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get contacts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch contacts'
    });
  }
};

export const getContact = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const contact = await prisma.contact.findFirst({
      where: {
        id,
        createdById: userId
      },
      include: {
        tags: {
          include: {
            tag: true
          }
        },
        groupMembers: {
          include: {
            group: {
              select: {
                id: true,
                name: true,
                destination: true,
                status: true
              }
            }
          }
        },
        lists: {
          include: {
            list: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }

    res.json({
      success: true,
      data: { contact }
    });
  } catch (error) {
    console.error('Get contact error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch contact'
    });
  }
};

export const createContact = async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const { firstName, lastName, email, phone, address, notes, tagIds = [] } = req.body;
    const userId = req.user!.id;

    // Create contact with tags
    const contact = await prisma.contact.create({
      data: {
        firstName,
        lastName,
        email,
        phone,
        address,
        notes,
        createdById: userId,
        tags: {
          create: tagIds.map((tagId: string) => ({
            tagId
          }))
        }
      },
      include: {
        tags: {
          include: {
            tag: true
          }
        }
      }
    });

    // Auto-add to lists based on tags
    if (tagIds.length > 0) {
      const autoLists = await prisma.list.findMany({
        where: {
          tagId: { in: tagIds },
          isAutomatic: true
        }
      });

      await Promise.all(
        autoLists.map(list =>
          prisma.listMember.create({
            data: {
              listId: list.id,
              contactId: contact.id
            }
          }).catch(() => {}) // Ignore duplicates
        )
      );
    }

    res.status(201).json({
      success: true,
      message: 'Contact created successfully',
      data: { contact }
    });
  } catch (error) {
    console.error('Create contact error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create contact'
    });
  }
};

export const updateContact = async (req: AuthRequest, res: Response) => {
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
    const { firstName, lastName, email, phone, address, notes, tagIds = [] } = req.body;
    const userId = req.user!.id;

    // Check if contact exists and belongs to user
    const existingContact = await prisma.contact.findFirst({
      where: {
        id,
        createdById: userId
      }
    });

    if (!existingContact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }

    // Update contact and tags
    const contact = await prisma.contact.update({
      where: { id },
      data: {
        firstName,
        lastName,
        email,
        phone,
        address,
        notes,
        tags: {
          deleteMany: {},
          create: tagIds.map((tagId: string) => ({
            tagId
          }))
        }
      },
      include: {
        tags: {
          include: {
            tag: true
          }
        }
      }
    });

    // Update list memberships based on new tags
    await prisma.listMember.deleteMany({
      where: { contactId: id }
    });

    if (tagIds.length > 0) {
      const autoLists = await prisma.list.findMany({
        where: {
          tagId: { in: tagIds },
          isAutomatic: true
        }
      });

      await Promise.all(
        autoLists.map(list =>
          prisma.listMember.create({
            data: {
              listId: list.id,
              contactId: id
            }
          }).catch(() => {}) // Ignore duplicates
        )
      );
    }

    res.json({
      success: true,
      message: 'Contact updated successfully',
      data: { contact }
    });
  } catch (error) {
    console.error('Update contact error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update contact'
    });
  }
};

export const deleteContact = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    // Check if contact exists and belongs to user
    const contact = await prisma.contact.findFirst({
      where: {
        id,
        createdById: userId
      }
    });

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }

    await prisma.contact.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Contact deleted successfully'
    });
  } catch (error) {
    console.error('Delete contact error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete contact'
    });
  }
};

// Validation rules
export const contactValidation = [
  body('firstName')
    .isLength({ min: 1 })
    .withMessage('First name is required'),
  body('lastName')
    .isLength({ min: 1 })
    .withMessage('Last name is required'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email'),
  body('phone')
    .optional()
    .isLength({ min: 10 })
    .withMessage('Phone number must be at least 10 characters'),
  body('tagIds')
    .optional()
    .isArray()
    .withMessage('Tag IDs must be an array')
];