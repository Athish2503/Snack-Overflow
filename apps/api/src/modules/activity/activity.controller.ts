import { Response } from 'express';
import { AuthRequest } from '../../types/express.js';
import { ActivityService } from './activity.service.js';
import { ActivityQueryInput } from './activity.schema.js';

export class ActivityController {
  static async getActivities(req: AuthRequest, res: Response) {
    const query = req.query as unknown as ActivityQueryInput;
    const result = await ActivityService.getActivities(query);
    res.status(200).json(result);
  }
}
