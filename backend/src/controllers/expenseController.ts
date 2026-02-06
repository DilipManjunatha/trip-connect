import { Response } from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middleware/auth';

export const getExpenses = async (req: AuthRequest, res: Response) => {
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

    const expenses = await prisma.expense.findMany({
      where: { groupId },
      orderBy: {
        date: 'desc'
      }
    });

    res.json({
      success: true,
      data: { expenses }
    });
  } catch (error) {
    console.error('Get expenses error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch expenses'
    });
  }
};

export const getExpense = async (req: AuthRequest, res: Response) => {
  try {
    const { groupId, expenseId } = req.params;
    const userId = req.user!.id;

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

    const expense = await prisma.expense.findFirst({
      where: {
        id: expenseId,
        groupId
      }
    });

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    res.json({
      success: true,
      data: { expense }
    });
  } catch (error) {
    console.error('Get expense error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch expense'
    });
  }
};

export const createExpense = async (req: AuthRequest, res: Response) => {
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
    const { title, description, amount, category, paidBy, splitType, date } = req.body;
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

    // Validate and cast split type
    const validSplitTypes = ['EQUAL', 'CUSTOM', 'PERCENTAGE'] as const;
    const expenseSplitType = (validSplitTypes.includes(splitType as any) ? splitType : 'EQUAL') as 'EQUAL' | 'CUSTOM' | 'PERCENTAGE';

    const expense = await prisma.expense.create({
      data: {
        groupId,
        title,
        description,
        amount: parseFloat(amount),
        category: category || 'Other',
        paidBy,
        splitType: expenseSplitType,
        date: date ? new Date(date) : new Date()
      }
    });

    res.status(201).json({
      success: true,
      message: 'Expense created successfully',
      data: { expense }
    });
  } catch (error) {
    console.error('Create expense error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create expense'
    });
  }
};

export const updateExpense = async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const { groupId, expenseId } = req.params;
    const { title, description, amount, category, paidBy, splitType, date } = req.body;
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

    // Verify expense exists and belongs to group
    const existingExpense = await prisma.expense.findFirst({
      where: {
        id: expenseId,
        groupId
      }
    });

    if (!existingExpense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    // Validate and cast split type if provided
    let expenseSplitType: 'EQUAL' | 'CUSTOM' | 'PERCENTAGE' | undefined = undefined;
    if (splitType) {
      const validSplitTypes = ['EQUAL', 'CUSTOM', 'PERCENTAGE'] as const;
      expenseSplitType = (validSplitTypes.includes(splitType as any) ? splitType : 'EQUAL') as 'EQUAL' | 'CUSTOM' | 'PERCENTAGE';
    }

    const expense = await prisma.expense.update({
      where: { id: expenseId },
      data: {
        title,
        description,
        amount: amount ? parseFloat(amount) : undefined,
        category,
        paidBy,
        splitType: expenseSplitType,
        date: date ? new Date(date) : undefined
      }
    });

    res.json({
      success: true,
      message: 'Expense updated successfully',
      data: { expense }
    });
  } catch (error) {
    console.error('Update expense error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update expense'
    });
  }
};

export const deleteExpense = async (req: AuthRequest, res: Response) => {
  try {
    const { groupId, expenseId } = req.params;
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

    // Verify expense exists and belongs to group
    const expense = await prisma.expense.findFirst({
      where: {
        id: expenseId,
        groupId
      }
    });

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    await prisma.expense.delete({
      where: { id: expenseId }
    });

    res.json({
      success: true,
      message: 'Expense deleted successfully'
    });
  } catch (error) {
    console.error('Delete expense error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete expense'
    });
  }
};

// Validation rules
export const expenseValidation = [
  body('title')
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters'),
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Description must be at most 1000 characters'),
  body('amount')
    .isFloat({ min: 0 })
    .withMessage('Amount must be a positive number'),
  body('category')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Category must be at most 100 characters'),
  body('paidBy')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Paid by must be at most 100 characters'),
  body('splitType')
    .optional()
    .isIn(['EQUAL', 'CUSTOM', 'PERCENTAGE'])
    .withMessage('Split type must be EQUAL, CUSTOM, or PERCENTAGE'),
  body('date')
    .optional()
    .isISO8601()
    .withMessage('Date must be a valid ISO 8601 date')
];
