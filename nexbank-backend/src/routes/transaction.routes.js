import express from 'express';
import { downloadStatement, listTransactions, transferFunds } from '../controllers/transaction.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/', authenticate, listTransactions);
router.post('/statement', authenticate, downloadStatement);
router.post('/transfer', authenticate, transferFunds);

export default router;
