import { Response } from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middleware/auth';
import { SmartListManager } from '../utils/smartListManager';

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

    const [contactsData, total] = await Promise.all([
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

    // Flatten tags structure for easier frontend consumption
    const contacts = contactsData.map(contact => ({
      ...contact,
      tags: contact.tags.map(ct => ct.tag)
    }));

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

    const contactData = await prisma.contact.findFirst({
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

    if (!contactData) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }

    // Flatten tags structure
    const contact = {
      ...contactData,
      tags: contactData.tags.map(ct => ct.tag)
    };

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
    const contactData = await prisma.contact.create({
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

    // Flatten tags structure
    const contact = {
      ...contactData,
      tags: contactData.tags.map(ct => ct.tag)
    };

    // Add contact to smart lists for each tag
    // This will create lists if they don't exist and at least one contact has the tag
    console.log(`📌 Adding contact ${contact.id} to ${tagIds.length} tag smart lists`);
    await Promise.all(
      tagIds.map((tagId: string) => 
        SmartListManager.addContactToTagList(tagId, contact.id)
      )
    );

    // Emit real-time event to all connected users
    const io = req.app.get('socketio');
    if (io) {
      io.emit('newContact', {
        id: contact.id,
        firstName: contact.firstName,
        lastName: contact.lastName,
        email: contact.email,
        phone: contact.phone,
        address: contact.address,
        notes: contact.notes,
        tags: contact.tags,
        createdById: userId
      });
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
      },
      include: {
        tags: {
          select: { tagId: true }
        }
      }
    });

    if (!existingContact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }

    // Get old tags BEFORE updating
    const oldTagIds = existingContact.tags.map(ct => ct.tagId);

    // Update contact and tags
    const contactData = await prisma.contact.update({
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

    // Flatten tags structure
    const contact = {
      ...contactData,
      tags: contactData.tags.map(ct => ct.tag)
    };

    // Find tags that were removed
    const removedTagIds = oldTagIds.filter((tagId: string) => !tagIds.includes(tagId));
    // Find tags that were added
    const addedTagIds = tagIds.filter((tagId: string) => !oldTagIds.includes(tagId));

    console.log(`🔄 Contact ${id} tag changes - Added: ${addedTagIds.length}, Removed: ${removedTagIds.length}`);

    // Remove contact from smart lists for removed tags
    await Promise.all(
      removedTagIds.map((tagId: string) => 
        SmartListManager.removeContactFromTagList(tagId, id)
      )
    );

    // Add contact to smart lists for added tags
    await Promise.all(
      addedTagIds.map((tagId: string) => 
        SmartListManager.addContactToTagList(tagId, id)
      )
    );

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
      },
      include: {
        tags: {
          select: { tagId: true }
        }
      }
    });

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }

    // Get tag IDs before deletion
    const tagIds = contact.tags.map(ct => ct.tagId);

    // Delete contact (this will cascade delete ContactTag and ListMember relationships)
    await prisma.contact.delete({
      where: { id }
    });

    // Sync smart lists for all tags this contact had
    // This will remove the contact from lists and delete empty lists
    await Promise.all(
      tagIds.map((tagId: string) => SmartListManager.syncTagList(tagId))
    );

    // Emit real-time event to all connected users
    const io = req.app.get('socketio');
    if (io) {
      io.emit('contactDeleted', {
        id: contact.id,
        firstName: contact.firstName,
        lastName: contact.lastName
      });
    }

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