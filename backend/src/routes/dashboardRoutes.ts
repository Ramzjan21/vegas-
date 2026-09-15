import { Router } from 'express';
import { getDashboardStats, getDashboardCharts } from '../controllers/dashboardController';
import { authenticate } from '../middleware/authMiddleware';
import { requireRoles } from '../middleware/roleMiddleware';

const router = Router();

router.use(authenticate);
router.get('/stats', requireRoles('ADMINISTRATOR'), getDashboardStats);
router.get('/charts', requireRoles('ADMINISTRATOR'), getDashboardCharts);

export default router;
