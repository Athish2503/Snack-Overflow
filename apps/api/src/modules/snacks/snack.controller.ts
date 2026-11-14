import { Response } from 'express';
import { SnackService } from './snack.service.js';
import { AuthRequest } from '../../types/express.js';
import { SnackQueryInput } from './snack.schema.js';

export class SnackController {
  static async getSnacks(req: AuthRequest, res: Response) {
    const query = req.query as unknown as SnackQueryInput;
    const currentUserId = req.user?.id;
    const result = await SnackService.getSnacks(query, currentUserId);
    res.status(200).json(result);
  }

  static async getSnackById(req: AuthRequest, res: Response) {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const currentUserId = req.user?.id;
    const snack = await SnackService.getSnackById(id, currentUserId);
    res.status(200).json(snack);
  }

  static async getSummary(_req: AuthRequest, res: Response) {
    const summary = await SnackService.getSummary();
    res.status(200).json(summary);
  }
}
