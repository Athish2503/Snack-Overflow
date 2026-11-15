import { Response } from 'express';
import { SnackService } from './snack.service.js';
import { AuthRequest } from '../../types/express.js';
import {
  SnackQueryInput,
  InventoryMutationInput,
  CreateSnackInput,
  UpdateSnackInput,
  CheckoutInput,
} from './snack.schema.js';

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

  static async consumeSnack(req: AuthRequest, res: Response) {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { amount } = req.body as InventoryMutationInput;
    const userId = req.user!.id;

    const updatedSnack = await SnackService.consumeSnack(id, amount, userId);
    res.status(200).json({
      data: updatedSnack,
    });
  }

  static async checkout(req: AuthRequest, res: Response) {
    const { items } = req.body as CheckoutInput;
    const userId = req.user!.id;

    const results = await SnackService.checkoutSnacks(userId, items);
    res.status(200).json({
      data: results,
      message: 'Checkout successful! Enjoy your snacks.',
    });
  }

  static async restockSnack(req: AuthRequest, res: Response) {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { amount } = req.body as InventoryMutationInput;
    const userId = req.user!.id;

    const updatedSnack = await SnackService.restockSnack(id, amount, userId);
    res.status(200).json({
      data: updatedSnack,
    });
  }

  static async createSnack(req: AuthRequest, res: Response) {
    const input = req.body as CreateSnackInput;
    const adminUserId = req.user!.id;

    const snack = await SnackService.createSnack(input, adminUserId);
    res.status(201).json({
      data: snack,
    });
  }

  static async updateSnack(req: AuthRequest, res: Response) {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const input = req.body as UpdateSnackInput;

    const updated = await SnackService.updateSnack(id, input);
    res.status(200).json({
      data: updated,
    });
  }

  static async deleteSnack(req: AuthRequest, res: Response) {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await SnackService.deleteSnack(id);
    res.status(204).send();
  }

  static async voteSnack(req: AuthRequest, res: Response) {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const userId = req.user!.id;

    const result = await SnackService.voteSnack(id, userId);
    res.status(200).json({
      data: result,
    });
  }

  static async unvoteSnack(req: AuthRequest, res: Response) {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const userId = req.user!.id;

    const result = await SnackService.unvoteSnack(id, userId);
    res.status(200).json({
      data: result,
    });
  }

  static async favoriteSnack(req: AuthRequest, res: Response) {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const userId = req.user!.id;

    const result = await SnackService.favoriteSnack(id, userId);
    res.status(200).json({
      data: result,
    });
  }

  static async unfavoriteSnack(req: AuthRequest, res: Response) {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const userId = req.user!.id;

    const result = await SnackService.unfavoriteSnack(id, userId);
    res.status(200).json({
      data: result,
    });
  }
}
