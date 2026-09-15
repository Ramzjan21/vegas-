import { Router } from 'express';
import {
  getReservations,
  createReservation,
  updateReservationStatus,
} from '../controllers/reservationController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticate);

router.get('/', getReservations);
router.post('/', createReservation);
router.patch('/:id/status', updateReservationStatus);

export default router;
