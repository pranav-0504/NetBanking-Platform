import express from 'express';
import { listTransactions, transferFunds } from '../controllers/transaction.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/', authenticate, listTransactions);
router.post('/transfer', authenticate, transferFunds);

export default router;
