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
  status: z
    .enum(['stocked', 'running_low', 'gone', 'low', 'archived'])
    .optional()
    .transform((val) => (val === 'low' ? 'running_low' : val)),
  favoritesOnly: z
    .string()
    .optional()
    .transform((val) => val === 'true' || val === '1'),
  votedOnly: z
    .string()
    .optional()
    .transform((val) => val === 'true' || val === '1'),
  sortBy: z.enum(['name', 'quantity', 'createdAt', 'votes']).optional().default('name'),
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


const imageItemSchema = z.string().trim().refine(
  (val) => val.startsWith('http://') || val.startsWith('https://') || val.startsWith('/') || val.startsWith('data:image/'),
  { message: 'Image must be a valid URL, path, or data URI' }
);

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
  calories: z
    .number()
    .int('Calories must be an integer')
    .min(0, 'Calories cannot be negative')
    .optional()
    .nullable(),
  imageUrl: z
    .string()
    .trim()
    .refine(
      (val) => !val || val.startsWith('http://') || val.startsWith('https://') || val.startsWith('/') || val.startsWith('data:image/'),
      { message: 'Image URL must be a valid URL, path, or data URI' }
    )
    .or(z.literal(''))
    .optional()
    .nullable()
    .transform((val) => (val === '' ? null : val)),
  images: z.array(imageItemSchema).optional().default([]),
});

export type CreateSnackInput = z.infer<typeof createSnackSchema>;

export const updateSnackSchema = z.object({
  name: z.string().trim().min(1, 'Name cannot be empty').max(100, 'Name cannot exceed 100 characters').optional(),
  category: z.nativeEnum(SnackCategory).optional(),
  lowStockThreshold: z.number().int().min(0, 'Threshold cannot be negative').optional(),
  calories: z
    .number()
    .int('Calories must be an integer')
    .min(0, 'Calories cannot be negative')
    .optional()
    .nullable(),
  imageUrl: z
    .string()
    .trim()
    .refine(
      (val) => !val || val.startsWith('http://') || val.startsWith('https://') || val.startsWith('/') || val.startsWith('data:image/'),
      { message: 'Image URL must be a valid URL, path, or data URI' }
    )
    .or(z.literal(''))
    .optional()
    .nullable()
    .transform((val) => (val === '' ? null : val)),
  images: z.array(imageItemSchema).optional(),
});

export type UpdateSnackInput = z.infer<typeof updateSnackSchema>;

export const checkoutItemSchema = z.object({
  snackId: z.string().uuid('Invalid snack ID'),
  amount: z
    .number({ required_error: 'Amount is required' })
    .int('Amount must be an integer')
    .positive('Amount must be a positive integer'),
});

export const checkoutSchema = z.object({
  items: z.array(checkoutItemSchema).min(1, 'At least one item is required for checkout'),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
