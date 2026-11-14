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
