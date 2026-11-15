import { z } from 'zod';
import { SnackCategory } from '@prisma/client';

export const dashboardCountsSchema = z.object({
  total: z.number().int().nonnegative(),
  stocked: z.number().int().nonnegative(),
  low: z.number().int().nonnegative(),
  gone: z.number().int().nonnegative(),
});

export const dashboardNeedsRestockItemSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  imageUrl: z.string().nullable(),
  category: z.nativeEnum(SnackCategory),
  quantity: z.number().int().nonnegative(),
  lowStockThreshold: z.number().int().nonnegative(),
  status: z.enum(['gone', 'low', 'stocked']),
  suggestedRestock: z.object({
    amount: z.number().int().positive(),
    target: z.number().int().positive(),
  }),
});

export const dashboardRecentActivityItemSchema = z.object({
  id: z.string().uuid(),
  userName: z.string(),
  snackName: z.string(),
  action: z.enum(['CONSUMED', 'RESTOCKED']),
  amount: z.number().int().positive(),
  createdAt: z.date().or(z.string()),
});

export const dashboardConsumptionDaySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  units: z.number().int().nonnegative(),
});

export const dashboardMostConsumedItemSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  imageUrl: z.string().nullable(),
  units: z.number().int().nonnegative(),
});

export const dashboardSnackOfTheWeekSchema = z
  .object({
    id: z.string().uuid(),
    name: z.string(),
    category: z.nativeEnum(SnackCategory).optional(),
    quantity: z.number().int().nonnegative(),
    lowStockThreshold: z.number().int().nonnegative(),
    status: z.enum(['stocked', 'running_low', 'gone', 'low']),
    calories: z.number().nullable().optional(),
    imageUrl: z.string().nullable().optional(),
    images: z.array(z.string()).optional(),
    voteCount: z.number().int().nonnegative().optional(),
    hasVoted: z.boolean().optional(),
    unitsConsumedThisWeek: z.number().int().nonnegative(),
  })
  .passthrough()
  .nullable();

export const dashboardResponseSchema = z.object({
  counts: dashboardCountsSchema,
  needsRestock: z.array(dashboardNeedsRestockItemSchema),
  recentActivity: z.array(dashboardRecentActivityItemSchema),
  consumptionLast7Days: z.array(dashboardConsumptionDaySchema).length(7),
  consumptionAverage: z.number().nonnegative(),
  mostConsumedThisWeek: z.array(dashboardMostConsumedItemSchema).max(3),
  snackOfTheWeek: dashboardSnackOfTheWeekSchema,
});

export type DashboardResponse = z.infer<typeof dashboardResponseSchema>;
