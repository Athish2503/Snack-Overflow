import { Router } from 'express';
import { SnackController } from './snack.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { requireAdmin } from '../../middleware/authorize.js';
import { validate, validateQuery } from '../../middleware/validate.js';
import { idempotency } from '../../middleware/idempotency.js';
import {
  snackQuerySchema,
  inventoryMutationSchema,
  createSnackSchema,
  updateSnackSchema,
  checkoutSchema,
} from './snack.schema.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

const router = Router();

// Summary
router.get('/summary', authenticate, asyncHandler(SnackController.getSummary));

// Multi-item cart checkout
router.post(
  '/checkout',
  authenticate,
  idempotency(),
  validate(checkoutSchema),
  asyncHandler(SnackController.checkout)
);

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
  idempotency(),
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

// Voting (Public popularity signal -> Snack of the week & popularity count)
router.post('/:id/vote', authenticate, asyncHandler(SnackController.voteSnack));
router.delete('/:id/vote', authenticate, asyncHandler(SnackController.unvoteSnack));

// Favorites (Personal bookmark -> Quick access for the user)
router.post('/:id/favorite', authenticate, asyncHandler(SnackController.favoriteSnack));
router.delete('/:id/favorite', authenticate, asyncHandler(SnackController.unfavoriteSnack));

export default router;
