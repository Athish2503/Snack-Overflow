import { z } from 'zod';
import { ActivityAction } from '@prisma/client';

export const activityQuerySchema = z.object({
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
  action: z.nativeEnum(ActivityAction).optional(),
  snackId: z.string().uuid().optional(),
});

export type ActivityQueryInput = z.infer<typeof activityQuerySchema>;
