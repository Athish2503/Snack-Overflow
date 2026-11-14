import { z } from 'zod';
import { SnackCategory } from '@prisma/client';

export const snackQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .default('1')
    .transform((val) => parseInt(val, 10))
    .refine((val) => !isNaN(val) && val > 0, { message: 'page must be a positive integer' }),
  limit: z
    .string()
    .optional()
    .default('20')
    .transform((val) => parseInt(val, 10))
    .refine((val) => !isNaN(val) && val > 0 && val <= 100, {
      message: 'limit must be a positive integer between 1 and 100',
    }),
  search: z.string().optional(),
  category: z.nativeEnum(SnackCategory).optional(),
  status: z.enum(['stocked', 'running_low', 'gone']).optional(),
  sortBy: z.enum(['name', 'quantity', 'createdAt']).optional().default('name'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
});

export type SnackQueryInput = z.infer<typeof snackQuerySchema>;


export const inventoryMutationSchema = z.object({
  amount: z
    .number({ required_error: 'amount is required' })
    .int('amount must be an integer')
    .positive('amount must be a positive integer'),
});

export type InventoryMutationInput = z.infer<typeof inventoryMutationSchema>;


export const createSnackSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100, 'Name cannot exceed 100 characters'),
  category: z.nativeEnum(SnackCategory, { errorMap: () => ({ message: 'Valid category is required' }) }),
  quantity: z
    .number({ required_error: 'Quantity is required' })
    .int('Quantity must be an integer')
    .min(0, 'Quantity cannot be negative'),
  lowStockThreshold: z
    .number()
    .int('Threshold must be an integer')
    .min(0, 'Threshold cannot be negative')
    .optional()
    .default(5),
});

export type CreateSnackInput = z.infer<typeof createSnackSchema>;

export const updateSnackSchema = z.object({
  name: z.string().trim().min(1, 'Name cannot be empty').max(100, 'Name cannot exceed 100 characters').optional(),
  category: z.nativeEnum(SnackCategory).optional(),
  lowStockThreshold: z.number().int().min(0, 'Threshold cannot be negative').optional(),
});

export type UpdateSnackInput = z.infer<typeof updateSnackSchema>;
