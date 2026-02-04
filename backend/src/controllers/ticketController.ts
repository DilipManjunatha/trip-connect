import { Response } from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middleware/auth';
import { processTicketOcr } from '../services/ocrService';
import path from 'path';
import fs from 'fs';

const TICKET_TYPES = ['TICKET', 'HOTEL', 'BILL', 'BOOKING', 'DOCUMENT'] as const;
const OCR_STATUSES = ['NONE', 'PENDING', 'COMPLETED', 'FAILED'] as const;

function ensureGroupAccess(groupId: string, userId: string) {
  return prisma.groupMember.findFirst({
    where: {
      groupId,
      OR: [{ userId }, { contact: { createdById: userId } }],
    },
  });
}

export const getTickets = async (req: AuthRequest, res: Response) => {
  try {
    const { groupId } = req.params;
    const userId = req.user!.id;
    const member = await ensureGroupAccess(groupId, userId);
    if (!member) {
      return res.status(403).json({ success: false, message: 'You do not have access to this group' });
    }
    const tickets = await prisma.ticket.findMany({
      where: { groupId },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: { tickets } });
  } catch (error) {
    console.error('Get tickets error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch tickets' });
  }
};

export const getTicket = async (req: AuthRequest, res: Response) => {
  try {
    const { groupId, ticketId } = req.params;
    const userId = req.user!.id;
    const member = await ensureGroupAccess(groupId, userId);
    if (!member) {
      return res.status(403).json({ success: false, message: 'You do not have access to this group' });
    }
    const ticket = await prisma.ticket.findFirst({
      where: { id: ticketId, groupId },
    });
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }
    res.json({ success: true, data: { ticket } });
  } catch (error) {
    console.error('Get ticket error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch ticket' });
  }
};

export const createTicket = async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation error', errors: errors.array() });
    }
    const { groupId } = req.params;
    const userId = req.user!.id;
    const member = await ensureGroupAccess(groupId, userId);
    if (!member) {
      return res.status(403).json({ success: false, message: 'You do not have access to this group' });
    }
    const { title, category, type } = req.body;
    const file = req.file as Express.Multer.File | undefined;
    // Store path relative to uploads dir so URL is /uploads/tickets/xxx.pdf (no double "uploads")
    const uploadsDir = path.join(process.cwd(), 'uploads');
    const filePath = file ? path.relative(uploadsDir, file.path).replace(/\\/g, '/') : null;
    const fileName = file ? file.originalname : null;
    const ticketType = (TICKET_TYPES.includes(type as any) ? type : 'TICKET') as
      | 'TICKET'
      | 'HOTEL'
      | 'BILL'
      | 'BOOKING'
      | 'DOCUMENT';
    const ticket = await prisma.ticket.create({
      data: {
        groupId,
        title: title || 'Untitled ticket',
        category: category || null,
        type: ticketType,
        filePath,
        fileName,
        ocrStatus: 'NONE',
      },
    });
    res.status(201).json({ success: true, message: 'Ticket created', data: { ticket } });
  } catch (error) {
    console.error('Create ticket error:', error);
    res.status(500).json({ success: false, message: 'Failed to create ticket' });
  }
};

export const updateTicket = async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation error', errors: errors.array() });
    }
    const { groupId, ticketId } = req.params;
    const userId = req.user!.id;
    const member = await ensureGroupAccess(groupId, userId);
    if (!member) {
      return res.status(403).json({ success: false, message: 'You do not have access to this group' });
    }
    const existing = await prisma.ticket.findFirst({ where: { id: ticketId, groupId } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }
    const { title, category, type, ocrData } = req.body;
    const ticketType = type && TICKET_TYPES.includes(type as any) ? (type as typeof TICKET_TYPES[number]) : undefined;
    const ticket = await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        ...(title !== undefined && { title }),
        ...(category !== undefined && { category }),
        ...(ticketType && { type: ticketType }),
        ...(ocrData !== undefined && { ocrData }),
      },
    });
    res.json({ success: true, message: 'Ticket updated', data: { ticket } });
  } catch (error) {
    console.error('Update ticket error:', error);
    res.status(500).json({ success: false, message: 'Failed to update ticket' });
  }
};

export const deleteTicket = async (req: AuthRequest, res: Response) => {
  try {
    const { groupId, ticketId } = req.params;
    const userId = req.user!.id;
    const member = await ensureGroupAccess(groupId, userId);
    if (!member) {
      return res.status(403).json({ success: false, message: 'You do not have access to this group' });
    }
    const ticket = await prisma.ticket.findFirst({ where: { id: ticketId, groupId } });
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }
    if (ticket.filePath) {
      try {
        // Support both legacy (uploads/tickets/x) and new (tickets/x) stored paths
        const fullPath = ticket.filePath.startsWith('uploads')
          ? path.join(process.cwd(), ticket.filePath)
          : path.join(process.cwd(), 'uploads', ticket.filePath);
        if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
      } catch (_) {
        // ignore file delete errors
      }
    }
    await prisma.ticket.delete({ where: { id: ticketId } });
    res.json({ success: true, message: 'Ticket deleted' });
  } catch (error) {
    console.error('Delete ticket error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete ticket' });
  }
};

/** Optional OCR pipeline: process file and store extracted data (spec §6.6, §12). */
export const processOcr = async (req: AuthRequest, res: Response) => {
  try {
    const { groupId, ticketId } = req.params;
    const userId = req.user!.id;
    const member = await ensureGroupAccess(groupId, userId);
    if (!member) {
      return res.status(403).json({ success: false, message: 'You do not have access to this group' });
    }
    const ticket = await prisma.ticket.findFirst({ where: { id: ticketId, groupId } });
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }
    await prisma.ticket.update({
      where: { id: ticketId },
      data: { ocrStatus: 'PENDING' },
    });
    const ocrResult = await processTicketOcr(ticket.filePath, ticket.fileName || undefined);
    const updated = await prisma.ticket.update({
      where: { id: ticketId },
      data: { ocrData: ocrResult as object, ocrStatus: 'COMPLETED' },
    });
    res.json({ success: true, message: 'OCR completed', data: { ticket: updated } });
  } catch (error) {
    console.error('Process OCR error:', error);
    const { ticketId } = req.params;
    try {
      await prisma.ticket.update({
        where: { id: ticketId },
        data: { ocrStatus: 'FAILED' },
      });
    } catch (_) {}
    res.status(500).json({ success: false, message: 'OCR processing failed' });
  }
};

export const ticketValidation = [
  body('title').optional().isLength({ max: 200 }).withMessage('Title max 200 characters'),
  body('category').optional().isLength({ max: 100 }).withMessage('Category max 100 characters'),
  body('type').optional().isIn(TICKET_TYPES).withMessage('Type must be one of ' + TICKET_TYPES.join(', ')),
  body('ocrData').optional().isObject().withMessage('ocrData must be an object'),
];
