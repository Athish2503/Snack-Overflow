import { Router } from 'express';
import { AdminDashboardController } from './admin.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { requireAdmin } from '../../middleware/authorize.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

const router = Router();

router.get(
  '/dashboard',
  authenticate,
  requireAdmin,
  asyncHandler(AdminDashboardController.getDashboard)
);

export default router;
