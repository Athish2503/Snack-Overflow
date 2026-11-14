import { Router } from 'express';
import { AuthController } from './auth.controller.js';
import { validate } from '../../middleware/validate.js';
import { loginSchema } from './auth.schema.js';
import { authenticate } from '../../middleware/authenticate.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

const router = Router();

router.post('/login', validate(loginSchema), asyncHandler(AuthController.login));
router.get('/me', authenticate, asyncHandler(AuthController.getMe));
router.post('/logout', asyncHandler(AuthController.logout));

export default router;
