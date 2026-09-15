import { Router } from 'express';
import {
  getOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  updateOrder,
} from '../controllers/orderController';
import { authenticate } from '../middleware/authMiddleware';
import { requireRoles } from '../middleware/roleMiddleware';

const router = Router();

router.use(authenticate);

router.get('/', getOrders);
router.get('/:id', getOrderById);

// Create order: Waiters and Admin
router.post('/', requireRoles('ADMINISTRATOR', 'OFITSIANT'), createOrder);

// Update order details: Waiters and Admin
router.put('/:id', requireRoles('ADMINISTRATOR', 'OFITSIANT'), updateOrder);

// Update status: Waiters, Cashier, Admin
router.patch('/:id/status', requireRoles('ADMINISTRATOR', 'OFITSIANT', 'KASSIR'), updateOrderStatus);

export default router;
