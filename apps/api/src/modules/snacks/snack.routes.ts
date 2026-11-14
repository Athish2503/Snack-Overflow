import { Router } from 'express';
import { SnackController } from './snack.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { requireAdmin } from '../../middleware/authorize.js';
import { validate, validateQuery } from '../../middleware/validate.js';
import {
  snackQuerySchema,
  inventoryMutationSchema,
  createSnackSchema,
  updateSnackSchema,
} from './snack.schema.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

const router = Router();

// Summary
router.get('/summary', authenticate, asyncHandler(SnackController.getSummary));

// List and Create
router.get('/', authenticate, validateQuery(snackQuerySchema), asyncHandler(SnackController.getSnacks));
router.post('/', authenticate, requireAdmin, validate(createSnackSchema), asyncHandler(SnackController.createSnack));

// Single Snack Details, Update, Delete
router.get('/:id', authenticate, asyncHandler(SnackController.getSnackById));
router.patch('/:id', authenticate, requireAdmin, validate(updateSnackSchema), asyncHandler(SnackController.updateSnack));
router.delete('/:id', authenticate, requireAdmin, asyncHandler(SnackController.deleteSnack));

// Inventory mutations
router.post(
  '/:id/consume',
  authenticate,
  validate(inventoryMutationSchema),
  asyncHandler(SnackController.consumeSnack)
);

router.post(
  '/:id/restock',
  authenticate,
  requireAdmin,
  validate(inventoryMutationSchema),
  asyncHandler(SnackController.restockSnack)
);

// Voting
router.post('/:id/vote', authenticate, asyncHandler(SnackController.voteSnack));
router.delete('/:id/vote', authenticate, asyncHandler(SnackController.unvoteSnack));

export default router;
