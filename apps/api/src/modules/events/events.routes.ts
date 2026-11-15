import { Router } from 'express';
import { EventsController } from './events.controller.js';
import { optionalAuthenticate } from '../../middleware/authenticate.js';

const router = Router();

router.get('/', optionalAuthenticate, EventsController.subscribe);
router.get('/stats', EventsController.getStats);

export default router;
