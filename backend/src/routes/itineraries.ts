import { Router } from 'express';
import {
  getItineraries,
  createItinerary,
  updateItinerary,
  deleteItinerary,
  itineraryValidation
} from '../controllers/itineraryController';
import { authenticate } from '../middleware/auth';

const router = Router({ mergeParams: true });

// All routes require authentication
router.use(authenticate);

router.get('/', getItineraries);
router.post('/', itineraryValidation, createItinerary);
router.put('/:itineraryId', itineraryValidation, updateItinerary);
router.delete('/:itineraryId', deleteItinerary);

export default router;
