import { Router } from 'express';
import { getSettings, updateSettings } from '../controllers/settingsController';
import { authenticate } from '../middleware/authMiddleware';
import { requireRoles } from '../middleware/roleMiddleware';

const router = Router();

// Everyone can get basic settings (for receipt/name/fees)
router.get('/', getSettings);

// Only admin can update settings
router.put('/', authenticate, requireRoles('ADMINISTRATOR'), updateSettings);

export default router;
