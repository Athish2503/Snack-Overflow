import { prisma } from '../../config/database.js';
import { ActivityQueryInput } from './activity.schema.js';
import { Prisma } from '@prisma/client';

export class ActivityService {
  static async getActivities(query: ActivityQueryInput) {
    const { page, limit, action, snackId } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ActivityWhereInput = {};
    if (action) {
      where.action = action;
    }
    if (snackId) {
      where.snackId = snackId;
    }

    const [totalItems, activities] = await Promise.all([
      prisma.activity.count({ where }),
      prisma.activity.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
          snack: {
            select: {
              id: true,
              name: true,
              category: true,
            },
          },
        },
      }),
    ]);

    const totalPages = Math.ceil(totalItems / limit) || 1;

    return {
      data: activities,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages,
      },
    };
  }
}
