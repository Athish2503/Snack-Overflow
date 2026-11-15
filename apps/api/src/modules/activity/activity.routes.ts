import { Router } from 'express';
import { ActivityController } from './activity.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { requireAdmin } from '../../middleware/authorize.js';
import { validateQuery } from '../../middleware/validate.js';
import { activityQuerySchema } from './activity.schema.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

const router = Router();

router.get(
  '/',
  authenticate,
  requireAdmin,
  validateQuery(activityQuerySchema),
  asyncHandler(ActivityController.getActivities)
);

export default router;
