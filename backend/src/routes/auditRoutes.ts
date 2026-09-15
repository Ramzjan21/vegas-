import { Router } from 'express';
import { getAuditLogs } from '../controllers/auditLogController';
import { authenticate } from '../middleware/authMiddleware';
import { requireRoles } from '../middleware/roleMiddleware';

const router = Router();

router.use(authenticate);

router.get('/', requireRoles('ADMINISTRATOR'), getAuditLogs);

export default router;
