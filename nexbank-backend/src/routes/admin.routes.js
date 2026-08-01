import express from 'express';
import { clearPendingTransaction, deleteUser, getAdminOperations, getAdminOverview } from '../controllers/admin.controller.js';
import { requireAdmin } from '../middlewares/admin.middleware.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = express.Router();
router.get('/overview', authenticate, requireAdmin, getAdminOverview);
router.get('/operations', authenticate, requireAdmin, getAdminOperations);
router.post('/transactions/:transactionId/clear', authenticate, requireAdmin, clearPendingTransaction);
router.delete('/users/:userId', authenticate, requireAdmin, deleteUser);
export default router;
