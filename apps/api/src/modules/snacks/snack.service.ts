import { Prisma, SnackCategory } from '@prisma/client';
import { prisma } from '../../config/database.js';
import { ApiError } from '../../utils/ApiError.js';
import { getSnackStatus, SnackStatus } from '../../utils/snackStatus.js';
import { SnackQueryInput } from './snack.schema.js';

export interface FormattedSnack {
  id: string;
  name: string;
  category: SnackCategory;
  quantity: number;
  lowStockThreshold: number;
  status: SnackStatus;
  voteCount: number;
  hasVoted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class SnackService {
  static async getSnacks(query: SnackQueryInput, currentUserId?: string) {
    const { page, limit, search, category, status, sortBy, sortOrder } = query;
    const offset = (page - 1) * limit;

    // Build raw SQL WHERE clauses to filter accurately and performantly on server-side
    const whereConditions: Prisma.Sql[] = [Prisma.sql`s."archivedAt" IS NULL`];

    if (category) {
      whereConditions.push(Prisma.sql`s."category"::text = ${category}`);
    }

    if (search && search.trim().length > 0) {
      const searchPattern = `%${search.trim()}%`;
      whereConditions.push(Prisma.sql`s."name" ILIKE ${searchPattern}`);
    }

    if (status) {
      if (status === 'gone') {
        whereConditions.push(Prisma.sql`s."quantity" = 0`);
      } else if (status === 'running_low') {
        whereConditions.push(Prisma.sql`s."quantity" > 0 AND s."quantity" <= s."lowStockThreshold"`);
      } else if (status === 'stocked') {
        whereConditions.push(Prisma.sql`s."quantity" > s."lowStockThreshold"`);
      }
    }

    const whereClause = Prisma.sql`WHERE ${Prisma.join(whereConditions, ' AND ')}`;

    // Total count query for pagination
    const countResult = await prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*) as count
      FROM "Snack" s
      ${whereClause}
    `;
    const totalItems = Number(countResult[0]?.count || 0);
    const totalPages = Math.ceil(totalItems / limit) || 1;

    // Determine sorting
    let orderByColumn = Prisma.sql`s."name"`;
    if (sortBy === 'quantity') {
      orderByColumn = Prisma.sql`s."quantity"`;
    } else if (sortBy === 'createdAt') {
      orderByColumn = Prisma.sql`s."createdAt"`;
    }
    const orderDirection = sortOrder === 'desc' ? Prisma.sql`DESC` : Prisma.sql`ASC`;

    const userIdParam = currentUserId || '00000000-0000-0000-0000-000000000000';

    // Execute paginated fetch with vote counts and user vote flag
    const rows = await prisma.$queryRaw<
      Array<{
        id: string;
        name: string;
        category: SnackCategory;
        quantity: number;
        lowStockThreshold: number;
        createdAt: Date;
        updatedAt: Date;
        voteCount: bigint;
        hasVoted: boolean;
      }>
    >`
      SELECT 
        s."id",
        s."name",
        s."category",
        s."quantity",
        s."lowStockThreshold",
        s."createdAt",
        s."updatedAt",
        COALESCE(v.vote_count, 0) as "voteCount",
        CASE WHEN uv."id" IS NOT NULL THEN true ELSE false END as "hasVoted"
      FROM "Snack" s
      LEFT JOIN (
        SELECT "snackId", COUNT(*) as vote_count
        FROM "Vote"
        GROUP BY "snackId"
      ) v ON v."snackId" = s."id"
      LEFT JOIN "Vote" uv ON uv."snackId" = s."id" AND uv."userId" = ${userIdParam}
      ${whereClause}
      ORDER BY ${orderByColumn} ${orderDirection}
      LIMIT ${limit}
      OFFSET ${offset}
    `;

    const data: FormattedSnack[] = rows.map((r) => ({
      id: r.id,
      name: r.name,
      category: r.category,
      quantity: r.quantity,
      lowStockThreshold: r.lowStockThreshold,
      status: getSnackStatus(r.quantity, r.lowStockThreshold),
      voteCount: Number(r.voteCount),
      hasVoted: Boolean(r.hasVoted),
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));

    return {
      data,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages,
      },
    };
  }

  static async getSnackById(id: string, currentUserId?: string): Promise<FormattedSnack> {
    const snack = await prisma.snack.findFirst({
      where: { id, archivedAt: null },
      include: {
        votes: currentUserId
          ? {
              where: { userId: currentUserId },
              select: { id: true },
            }
          : false,
        _count: {
          select: { votes: true },
        },
      },
    });

    if (!snack) {
      throw new ApiError(404, 'NOT_FOUND', 'Snack not found');
    }

    return {
      id: snack.id,
      name: snack.name,
      category: snack.category,
      quantity: snack.quantity,
      lowStockThreshold: snack.lowStockThreshold,
      status: getSnackStatus(snack.quantity, snack.lowStockThreshold),
      voteCount: snack._count.votes,
      hasVoted: snack.votes && snack.votes.length > 0,
      createdAt: snack.createdAt,
      updatedAt: snack.updatedAt,
    };
  }

  static async getSummary() {
    // 1. Status counts using conditional aggregation
    const countRows = await prisma.$queryRaw<
      Array<{
        stocked: bigint;
        running_low: bigint;
        gone: bigint;
      }>
    >`
      SELECT
        COUNT(*) FILTER (WHERE "quantity" > "lowStockThreshold") as stocked,
        COUNT(*) FILTER (WHERE "quantity" > 0 AND "quantity" <= "lowStockThreshold") as running_low,
        COUNT(*) FILTER (WHERE "quantity" = 0) as gone
      FROM "Snack"
      WHERE "archivedAt" IS NULL
    `;

    const counts = {
      stocked: Number(countRows[0]?.stocked || 0),
      running_low: Number(countRows[0]?.running_low || 0),
      gone: Number(countRows[0]?.gone || 0),
    };

    // 2. Snack of the Week calculation
    // Time window: Current week (Monday to Sunday) in Asia/Kolkata timezone (UTC+5:30)
    // Deterministic tie-breaker: most weekly votes -> most lifetime votes -> snack name ASC
    const weekStartResult = await prisma.$queryRaw<[{ week_start: Date }]>`
      SELECT date_trunc('week', (timezone('Asia/Kolkata', now()))) as week_start
    `;
    const weekStart = weekStartResult[0]?.week_start;

    const topSnack = await prisma.$queryRaw<
      Array<{
        id: string;
        name: string;
        weeklyVotes: bigint;
      }>
    >`
      SELECT 
        s."id",
        s."name",
        COUNT(v."id") FILTER (WHERE v."createdAt" >= ${weekStart}) as "weeklyVotes",
        COUNT(v."id") as "lifetimeVotes"
      FROM "Snack" s
      LEFT JOIN "Vote" v ON v."snackId" = s."id"
      WHERE s."archivedAt" IS NULL
      GROUP BY s."id", s."name"
      HAVING COUNT(v."id") FILTER (WHERE v."createdAt" >= ${weekStart}) > 0
      ORDER BY "weeklyVotes" DESC, "lifetimeVotes" DESC, s."name" ASC
      LIMIT 1
    `;

    let snackOfTheWeek = null;
    if (topSnack.length > 0 && Number(topSnack[0].weeklyVotes) > 0) {
      snackOfTheWeek = {
        id: topSnack[0].id,
        name: topSnack[0].name,
        voteCount: Number(topSnack[0].weeklyVotes),
      };
    }

    return {
      counts,
      snackOfTheWeek,
    };
  }
}
