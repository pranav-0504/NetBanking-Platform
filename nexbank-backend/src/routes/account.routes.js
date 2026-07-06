import express from 'express';
import { getMyAccount } from '../controllers/account.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/me', authenticate, getMyAccount);

export default router;
