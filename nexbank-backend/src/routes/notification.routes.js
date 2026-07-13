import express from 'express';
import {
  listNotifications,
  markNotificationsRead,
} from '../controllers/notification.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/', authenticate, listNotifications);
router.patch('/read', authenticate, markNotificationsRead);

export default router;
