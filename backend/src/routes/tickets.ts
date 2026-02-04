import { Router, Request, Response, NextFunction } from 'express';
import {
  getTickets,
  getTicket,
  createTicket,
  updateTicket,
  deleteTicket,
  processOcr,
  ticketValidation,
} from '../controllers/ticketController';
import { authenticate } from '../middleware/auth';
import { uploadTicketFile } from '../utils/upload';

const router = Router({ mergeParams: true });

router.use(authenticate);

router.get('/', getTickets);
router.get('/:ticketId', getTicket);
router.post('/', (req: Request, res: Response, next: NextFunction) => {
  uploadTicketFile(req, res, (err: unknown) => {
    if (err) {
      const message = err instanceof Error ? err.message : 'File upload failed';
      return res.status(400).json({ success: false, message });
    }
    next();
  });
}, ticketValidation, createTicket);
router.put('/:ticketId', ticketValidation, updateTicket);
router.delete('/:ticketId', deleteTicket);
router.post('/:ticketId/process-ocr', processOcr);

export default router;
