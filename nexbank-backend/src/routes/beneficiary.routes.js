import express from 'express';
import {
  addBeneficiary,
  listBeneficiaries,
  removeBeneficiary,
} from '../controllers/beneficiary.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/', authenticate, listBeneficiaries);
router.post('/', authenticate, addBeneficiary);
router.delete('/:id', authenticate, removeBeneficiary);

export default router;
