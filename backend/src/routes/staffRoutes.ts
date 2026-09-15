import { Router } from 'express';
import {
  getStaff,
  createStaff,
  updateStaff,
  toggleStaffStatus,
} from '../controllers/staffController';
import { authenticate } from '../middleware/authMiddleware';
import { requireRoles } from '../middleware/roleMiddleware';

const router = Router();

router.use(authenticate);

// Staff management is strictly for ADMINISTRATOR
router.get('/', requireRoles('ADMINISTRATOR'), getStaff);
router.post('/', requireRoles('ADMINISTRATOR'), createStaff);
router.put('/:id', requireRoles('ADMINISTRATOR'), updateStaff);
router.patch('/:id/toggle-status', requireRoles('ADMINISTRATOR'), toggleStaffStatus);

export default router;
