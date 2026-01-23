import { Response } from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middleware/auth';

export const getItineraries = async (req: AuthRequest, res: Response) => {
  try {
    const { groupId } = req.params;
    const userId = req.user!.id;

    // Verify user has access to this group
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

    const itineraries = await prisma.itinerary.findMany({
      where: { groupId },
      orderBy: {
        startTime: 'asc'
      }
    });

    res.json({
      success: true,
      data: { itineraries }
    });
  } catch (error) {
    console.error('Get itineraries error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch itineraries'
    });
  }
};

export const createItinerary = async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const { groupId } = req.params;
    const { title, description, location, startTime, endTime, cost, notes } = req.body;
    const userId = req.user!.id;

    // Verify user has access to this group
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

    const itinerary = await prisma.itinerary.create({
      data: {
        groupId,
        title,
        description,
        location,
        startTime: new Date(startTime),
        endTime: endTime ? new Date(endTime) : null,
        cost: cost ? parseFloat(cost) : null,
        notes
      }
    });

    res.status(201).json({
      success: true,
      message: 'Itinerary item created successfully',
      data: { itinerary }
    });
  } catch (error) {
    console.error('Create itinerary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create itinerary item'
    });
  }
};

export const updateItinerary = async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const { groupId, itineraryId } = req.params;
    const { title, description, location, startTime, endTime, cost, notes } = req.body;
    const userId = req.user!.id;

    // Verify user has access to this group
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

    // Verify itinerary exists and belongs to group
    const existingItinerary = await prisma.itinerary.findFirst({
      where: {
        id: itineraryId,
        groupId
      }
    });

    if (!existingItinerary) {
      return res.status(404).json({
        success: false,
        message: 'Itinerary item not found'
      });
    }

    const itinerary = await prisma.itinerary.update({
      where: { id: itineraryId },
      data: {
        title,
        description,
        location,
        startTime: startTime ? new Date(startTime) : undefined,
        endTime: endTime ? new Date(endTime) : null,
        cost: cost ? parseFloat(cost) : null,
        notes
      }
    });

    res.json({
      success: true,
      message: 'Itinerary item updated successfully',
      data: { itinerary }
    });
  } catch (error) {
    console.error('Update itinerary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update itinerary item'
    });
  }
};

export const deleteItinerary = async (req: AuthRequest, res: Response) => {
  try {
    const { groupId, itineraryId } = req.params;
    const userId = req.user!.id;

    // Verify user has access to this group
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

    // Verify itinerary exists and belongs to group
    const itinerary = await prisma.itinerary.findFirst({
      where: {
        id: itineraryId,
        groupId
      }
    });

    if (!itinerary) {
      return res.status(404).json({
        success: false,
        message: 'Itinerary item not found'
      });
    }

    await prisma.itinerary.delete({
      where: { id: itineraryId }
    });

    res.json({
      success: true,
      message: 'Itinerary item deleted successfully'
    });
  } catch (error) {
    console.error('Delete itinerary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete itinerary item'
    });
  }
};

// Validation rules
export const itineraryValidation = [
  body('title')
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters'),
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Description must be at most 1000 characters'),
  body('location')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Location must be at most 200 characters'),
  body('startTime')
    .isISO8601()
    .withMessage('Start time must be a valid ISO 8601 date'),
  body('endTime')
    .optional()
    .isISO8601()
    .withMessage('End time must be a valid ISO 8601 date'),
  body('cost')
    .optional()
    .isNumeric()
    .withMessage('Cost must be a number'),
  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Notes must be at most 1000 characters')
];
