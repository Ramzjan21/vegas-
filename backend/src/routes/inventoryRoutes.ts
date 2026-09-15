import { Router } from 'express';
import {
  getInventory,
  getInventoryTransactions,
  createInventoryItem,
  updateInventoryItem,
  recordTransaction,
  deleteInventoryItem,
} from '../controllers/inventoryController';
import { authenticate } from '../middleware/authMiddleware';
import { requireRoles } from '../middleware/roleMiddleware';

const router = Router();

router.use(authenticate);

// View inventory: Admin, Omborchi
router.get('/', requireRoles('ADMINISTRATOR', 'OMBORCHI'), getInventory);
router.get('/transactions', requireRoles('ADMINISTRATOR', 'OMBORCHI'), getInventoryTransactions);

// Manage inventory & transactions: Admin, Omborchi
router.post('/', requireRoles('ADMINISTRATOR', 'OMBORCHI'), createInventoryItem);
router.put('/:id', requireRoles('ADMINISTRATOR', 'OMBORCHI'), updateInventoryItem);
router.post('/transaction', requireRoles('ADMINISTRATOR', 'OMBORCHI'), recordTransaction);
router.delete('/:id', requireRoles('ADMINISTRATOR', 'OMBORCHI'), deleteInventoryItem);

export default router;
