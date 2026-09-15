import { Router } from 'express';
import {
  getTables,
  getTableById,
  createTable,
  updateTable,
  updateTableStatus,
  deleteTable,
} from '../controllers/tableController';
import { authenticate } from '../middleware/authMiddleware';
import { requireRoles } from '../middleware/roleMiddleware';

const router = Router();

router.use(authenticate);

// Tables can be viewed by all staff
router.get('/', getTables);
router.get('/:id', getTableById);

// Status can be updated by admin, waiter, cashier
router.patch('/:id/status', requireRoles('ADMINISTRATOR', 'OFITSIANT', 'KASSIR'), updateTableStatus);

// Management: Admin only
router.post('/', requireRoles('ADMINISTRATOR'), createTable);
router.put('/:id', requireRoles('ADMINISTRATOR'), updateTable);
router.delete('/:id', requireRoles('ADMINISTRATOR'), deleteTable);

export default router;
