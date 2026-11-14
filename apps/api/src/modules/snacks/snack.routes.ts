import { Router } from 'express';
import { SnackController } from './snack.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { validateQuery } from '../../middleware/validate.js';
import { snackQuerySchema } from './snack.schema.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

const router = Router();

// /snacks/summary must come before /snacks/:id
router.get('/summary', authenticate, asyncHandler(SnackController.getSummary));
router.get('/', authenticate, validateQuery(snackQuerySchema), asyncHandler(SnackController.getSnacks));
router.get('/:id', authenticate, asyncHandler(SnackController.getSnackById));

export default router;
