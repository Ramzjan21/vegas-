import { Router } from 'express';
import { getPayments, processPayment, getReceipt } from '../controllers/paymentController';
import { authenticate } from '../middleware/authMiddleware';
import { requireRoles } from '../middleware/roleMiddleware';

const router = Router();

router.use(authenticate);

router.get('/', requireRoles('ADMINISTRATOR', 'KASSIR'), getPayments);
router.post('/', requireRoles('ADMINISTRATOR', 'KASSIR'), processPayment);
router.get('/receipt/:orderId', requireRoles('ADMINISTRATOR', 'KASSIR', 'OFITSIANT'), getReceipt);

export default router;
