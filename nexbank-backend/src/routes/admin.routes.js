import express from 'express';
import { getAdminOverview } from '../controllers/admin.controller.js';
import { requireAdmin } from '../middlewares/admin.middleware.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = express.Router();
router.get('/overview', authenticate, requireAdmin, getAdminOverview);
export default router;
