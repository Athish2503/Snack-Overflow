import { Response } from 'express';
import { AuthRequest } from '../../types/express.js';
import { AdminDashboardService } from './admin.service.js';

export class AdminDashboardController {
  static async getDashboard(req: AuthRequest, res: Response) {
    const data = await AdminDashboardService.getDashboard(req.user?.id);
    res.status(200).json(data);
  }
}
