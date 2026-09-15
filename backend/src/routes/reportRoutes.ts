import { Router } from 'express';
import { getSalesReport, exportSalesReportCSV } from '../controllers/reportController';
import { authenticate } from '../middleware/authMiddleware';
import { requireRoles } from '../middleware/roleMiddleware';

const router = Router();

router.use(authenticate);

router.get('/sales', requireRoles('ADMINISTRATOR'), getSalesReport);
router.get('/export/csv', requireRoles('ADMINISTRATOR'), exportSalesReportCSV);

export default router;
