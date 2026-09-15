import { Router } from 'express';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  toggleProductAvailability,
  deleteProduct,
} from '../controllers/productController';
import { authenticate } from '../middleware/authMiddleware';
import { requireRoles } from '../middleware/roleMiddleware';

const router = Router();

router.use(authenticate);

// View menu: All authenticated users
router.get('/', getProducts);
router.get('/:id', getProductById);

// Manage products: Admin only
router.post('/', requireRoles('ADMINISTRATOR'), createProduct);
router.put('/:id', requireRoles('ADMINISTRATOR'), updateProduct);
router.patch('/:id/toggle-availability', requireRoles('ADMINISTRATOR'), toggleProductAvailability);
router.delete('/:id', requireRoles('ADMINISTRATOR'), deleteProduct);

export default router;
