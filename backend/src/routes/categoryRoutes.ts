import { Router } from 'express';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/categoryController';
import { authenticate } from '../middleware/authMiddleware';
import { requireRoles } from '../middleware/roleMiddleware';

const router = Router();

router.use(authenticate);

router.get('/', getCategories);
router.post('/', requireRoles('ADMINISTRATOR'), createCategory);
router.put('/:id', requireRoles('ADMINISTRATOR'), updateCategory);
router.delete('/:id', requireRoles('ADMINISTRATOR'), deleteCategory);

export default router;
