import { Prisma, SnackCategory, ActivityAction } from '@prisma/client';
import { prisma } from '../../config/database.js';
import { ApiError } from '../../utils/ApiError.js';
import { getSnackStatus, SnackStatus } from '../../utils/snackStatus.js';
import { SnackQueryInput, CreateSnackInput, UpdateSnackInput } from './snack.schema.js';

export interface FormattedSnack {
  id: string;
  name: string;
  category: SnackCategory;
  quantity: number;
  lowStockThreshold: number;
  calories?: number | null;
  imageUrl?: string | null;
  images: string[];
  status: SnackStatus;
  voteCount: number;
  hasVoted: boolean;
  isFavorite: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class SnackService {
  static async getSnacks(query: SnackQueryInput, currentUserId?: string) {
    const { page, limit, search, category, status, favoritesOnly, sortBy, sortOrder } = query;
    const offset = (page - 1) * limit;

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

    if (favoritesOnly && currentUserId) {
      whereConditions.push(Prisma.sql`EXISTS (SELECT 1 FROM "Favorite" fav WHERE fav."snackId" = s."id" AND fav."userId" = ${currentUserId})`);
    }

    const whereClause = Prisma.sql`WHERE ${Prisma.join(whereConditions, ' AND ')}`;

    const countResult = await prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*) as count
      FROM "Snack" s
      ${whereClause}
    `;
    const totalItems = Number(countResult[0]?.count || 0);
    const totalPages = Math.ceil(totalItems / limit) || 1;

    let orderByColumn = Prisma.sql`s."name"`;
    if (sortBy === 'quantity') {
      orderByColumn = Prisma.sql`s."quantity"`;
    } else if (sortBy === 'createdAt') {
      orderByColumn = Prisma.sql`s."createdAt"`;
    }
    const orderDirection = sortOrder === 'desc' ? Prisma.sql`DESC` : Prisma.sql`ASC`;

    const userIdParam = currentUserId || '00000000-0000-0000-0000-000000000000';

    const rows = await prisma.$queryRaw<
      Array<{
        id: string;
        name: string;
        category: SnackCategory;
        quantity: number;
        lowStockThreshold: number;
        calories: number | null;
        imageUrl: string | null;
        images: string[];
        createdAt: Date;
        updatedAt: Date;
        voteCount: bigint;
        hasVoted: boolean;
        isFavorite: boolean;
      }>
    >`
      SELECT 
        s."id",
        s."name",
        s."category",
        s."quantity",
        s."lowStockThreshold",
        s."calories",
        s."imageUrl",
        s."images",
        s."createdAt",
        s."updatedAt",
        COALESCE(v.vote_count, 0) as "voteCount",
        CASE WHEN uv."id" IS NOT NULL THEN true ELSE false END as "hasVoted",
        CASE WHEN uf."id" IS NOT NULL THEN true ELSE false END as "isFavorite"
      FROM "Snack" s
      LEFT JOIN (
        SELECT "snackId", COUNT(*) as vote_count
        FROM "Vote"
        GROUP BY "snackId"
      ) v ON v."snackId" = s."id"
      LEFT JOIN "Vote" uv ON uv."snackId" = s."id" AND uv."userId" = ${userIdParam}
      LEFT JOIN "Favorite" uf ON uf."snackId" = s."id" AND uf."userId" = ${userIdParam}
      ${whereClause}
      ORDER BY ${orderByColumn} ${orderDirection}
      LIMIT ${limit}
      OFFSET ${offset}
    `;

    const data: FormattedSnack[] = rows.map((r) => {
      const rawImages = Array.isArray(r.images) ? r.images : [];
      const images = rawImages.length > 0 ? rawImages : (r.imageUrl ? [r.imageUrl] : []);
      const imageUrl = r.imageUrl || (images.length > 0 ? images[0] : null);
      return {
        id: r.id,
        name: r.name,
        category: r.category,
        quantity: r.quantity,
        lowStockThreshold: r.lowStockThreshold,
        calories: r.calories,
        imageUrl,
        images,
        status: getSnackStatus(r.quantity, r.lowStockThreshold),
        voteCount: Number(r.voteCount),
        hasVoted: Boolean(r.hasVoted),
        isFavorite: Boolean(r.isFavorite),
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      };
    });

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
        favorites: currentUserId
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

    const rawImages = Array.isArray(snack.images) ? snack.images : [];
    const images = rawImages.length > 0 ? rawImages : (snack.imageUrl ? [snack.imageUrl] : []);
    const imageUrl = snack.imageUrl || (images.length > 0 ? images[0] : null);

    return {
      id: snack.id,
      name: snack.name,
      category: snack.category,
      quantity: snack.quantity,
      lowStockThreshold: snack.lowStockThreshold,
      calories: snack.calories,
      imageUrl,
      images,
      status: getSnackStatus(snack.quantity, snack.lowStockThreshold),
      voteCount: snack._count.votes,
      hasVoted: Boolean(snack.votes && snack.votes.length > 0),
      isFavorite: Boolean(snack.favorites && snack.favorites.length > 0),
      createdAt: snack.createdAt,
      updatedAt: snack.updatedAt,
    };
  }

  static async getSummary() {
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

    const weekStartResult = await prisma.$queryRaw<[{ week_start: Date }]>`
      SELECT date_trunc('week', (timezone('Asia/Kolkata', now()))) as week_start
    `;
    const weekStart = weekStartResult[0]?.week_start;

    const topSnack = await prisma.$queryRaw<
      Array<{
        id: string;
        name: string;
        category: SnackCategory;
        calories: number | null;
        imageUrl: string | null;
        images: string[];
        weeklyVotes: bigint;
      }>
    >`
      SELECT 
        s."id",
        s."name",
        s."category",
        s."calories",
        s."imageUrl",
        s."images",
        COUNT(v."id") FILTER (WHERE v."createdAt" >= ${weekStart}) as "weeklyVotes",
        COUNT(v."id") as "lifetimeVotes"
      FROM "Snack" s
      LEFT JOIN "Vote" v ON v."snackId" = s."id"
      WHERE s."archivedAt" IS NULL
      GROUP BY s."id", s."name", s."category", s."calories", s."imageUrl", s."images"
      HAVING COUNT(v."id") FILTER (WHERE v."createdAt" >= ${weekStart}) > 0
      ORDER BY "weeklyVotes" DESC, "lifetimeVotes" DESC, s."name" ASC
      LIMIT 1
    `;

    let snackOfTheWeek = null;
    if (topSnack.length > 0 && Number(topSnack[0].weeklyVotes) > 0) {
      const rawImages = Array.isArray(topSnack[0].images) ? topSnack[0].images : [];
      const images = rawImages.length > 0 ? rawImages : (topSnack[0].imageUrl ? [topSnack[0].imageUrl] : []);
      const imageUrl = topSnack[0].imageUrl || (images.length > 0 ? images[0] : null);
      snackOfTheWeek = {
        id: topSnack[0].id,
        name: topSnack[0].name,
        category: topSnack[0].category,
        calories: topSnack[0].calories,
        imageUrl,
        images,
        voteCount: Number(topSnack[0].weeklyVotes),
      };
    }

    return {
      counts,
      snackOfTheWeek,
    };
  }

  static async consumeSnack(snackId: string, amount: number, userId: string) {
    return await prisma.$transaction(async (tx) => {
      const updatedRows = await tx.$queryRaw<
        Array<{
          id: string;
          name: string;
          category: SnackCategory;
          quantity: number;
          lowStockThreshold: number;
          calories: number | null;
          imageUrl: string | null;
          images: string[];
        }>
      >`
        UPDATE "Snack"
        SET "quantity" = "quantity" - ${amount},
            "updatedAt" = CURRENT_TIMESTAMP
        WHERE "id" = ${snackId}
          AND "archivedAt" IS NULL
          AND "quantity" >= ${amount}
        RETURNING "id", "name", "category", "quantity", "lowStockThreshold", "calories", "imageUrl", "images"
      `;

      if (!updatedRows || updatedRows.length === 0) {
        const existingSnack = await tx.snack.findFirst({
          where: { id: snackId, archivedAt: null },
          select: { id: true, quantity: true },
        });

        if (!existingSnack) {
          throw new ApiError(404, 'NOT_FOUND', 'Snack not found');
        }

        throw new ApiError(409, 'INSUFFICIENT_STOCK', 'Someone beat you to the last packet!');
      }

      const updatedSnack = updatedRows[0];

      await tx.activity.create({
        data: {
          userId,
          snackId,
          action: ActivityAction.CONSUMED,
          amount,
        },
      });

      const rawImages = Array.isArray(updatedSnack.images) ? updatedSnack.images : [];
      const images = rawImages.length > 0 ? rawImages : (updatedSnack.imageUrl ? [updatedSnack.imageUrl] : []);
      const imageUrl = updatedSnack.imageUrl || (images.length > 0 ? images[0] : null);

      return {
        id: updatedSnack.id,
        name: updatedSnack.name,
        category: updatedSnack.category,
        quantity: updatedSnack.quantity,
        lowStockThreshold: updatedSnack.lowStockThreshold,
        calories: updatedSnack.calories,
        imageUrl,
        images,
        status: getSnackStatus(updatedSnack.quantity, updatedSnack.lowStockThreshold),
      };
    });
  }

  static async restockSnack(snackId: string, amount: number, userId: string) {
    return await prisma.$transaction(async (tx) => {
      const existingSnack = await tx.snack.findFirst({
        where: { id: snackId, archivedAt: null },
      });

      if (!existingSnack) {
        throw new ApiError(404, 'NOT_FOUND', 'Snack not found');
      }

      const updatedRows = await tx.$queryRaw<
        Array<{
          id: string;
          name: string;
          category: SnackCategory;
          quantity: number;
          lowStockThreshold: number;
          calories: number | null;
          imageUrl: string | null;
          images: string[];
        }>
      >`
        UPDATE "Snack"
        SET "quantity" = "quantity" + ${amount},
            "updatedAt" = CURRENT_TIMESTAMP
        WHERE "id" = ${snackId}
          AND "archivedAt" IS NULL
        RETURNING "id", "name", "category", "quantity", "lowStockThreshold", "calories", "imageUrl", "images"
      `;

      const updatedSnack = updatedRows[0];

      await tx.activity.create({
        data: {
          userId,
          snackId,
          action: ActivityAction.RESTOCKED,
          amount,
        },
      });

      const rawImages = Array.isArray(updatedSnack.images) ? updatedSnack.images : [];
      const images = rawImages.length > 0 ? rawImages : (updatedSnack.imageUrl ? [updatedSnack.imageUrl] : []);
      const imageUrl = updatedSnack.imageUrl || (images.length > 0 ? images[0] : null);

      return {
        id: updatedSnack.id,
        name: updatedSnack.name,
        category: updatedSnack.category,
        quantity: updatedSnack.quantity,
        lowStockThreshold: updatedSnack.lowStockThreshold,
        calories: updatedSnack.calories,
        imageUrl,
        images,
        status: getSnackStatus(updatedSnack.quantity, updatedSnack.lowStockThreshold),
      };
    });
  }

  /**
   * Checkout a bag of snacks atomically.
   * If any snack fails stock check, whole transaction aborts and raises 409.
   */
  static async checkoutSnacks(userId: string, items: Array<{ snackId: string; amount: number }>) {
    return await prisma.$transaction(async (tx) => {
      const results = [];

      for (const item of items) {
        const updatedRows = await tx.$queryRaw<
          Array<{
            id: string;
            name: string;
            category: SnackCategory;
            quantity: number;
            lowStockThreshold: number;
            calories: number | null;
            imageUrl: string | null;
            images: string[];
          }>
        >`
          UPDATE "Snack"
          SET "quantity" = "quantity" - ${item.amount},
              "updatedAt" = CURRENT_TIMESTAMP
          WHERE "id" = ${item.snackId}
            AND "archivedAt" IS NULL
            AND "quantity" >= ${item.amount}
          RETURNING "id", "name", "category", "quantity", "lowStockThreshold", "calories", "imageUrl", "images"
        `;

        if (!updatedRows || updatedRows.length === 0) {
          const existing = await tx.snack.findFirst({
            where: { id: item.snackId, archivedAt: null },
            select: { name: true, quantity: true },
          });

          if (!existing) {
            throw new ApiError(404, 'NOT_FOUND', 'Snack not found');
          }

          throw new ApiError(
            409,
            'INSUFFICIENT_STOCK',
            `Someone beat you to ${existing.name}! Only ${existing.quantity} left in stock.`
          );
        }

        const updatedSnack = updatedRows[0];

        await tx.activity.create({
          data: {
            userId,
            snackId: item.snackId,
            action: ActivityAction.CONSUMED,
            amount: item.amount,
          },
        });

        const rawImages = Array.isArray(updatedSnack.images) ? updatedSnack.images : [];
        const images = rawImages.length > 0 ? rawImages : (updatedSnack.imageUrl ? [updatedSnack.imageUrl] : []);
        const imageUrl = updatedSnack.imageUrl || (images.length > 0 ? images[0] : null);

        results.push({
          id: updatedSnack.id,
          name: updatedSnack.name,
          category: updatedSnack.category,
          quantity: updatedSnack.quantity,
          lowStockThreshold: updatedSnack.lowStockThreshold,
          calories: updatedSnack.calories,
          imageUrl,
          images,
          amountConsumed: item.amount,
          status: getSnackStatus(updatedSnack.quantity, updatedSnack.lowStockThreshold),
        });
      }

      return results;
    });
  }

  /**
   * Admin: Create a new snack.
   * If initial quantity > 0, records an initial RESTOCKED activity log.
   */
  static async createSnack(input: CreateSnackInput, adminUserId: string) {
    const rawImages = input.images && input.images.length > 0 ? input.images : (input.imageUrl ? [input.imageUrl] : []);
    const primaryImage = input.imageUrl || (rawImages.length > 0 ? rawImages[0] : null);

    const existing = await prisma.snack.findUnique({
      where: { name: input.name },
    });

    if (existing) {
      if (existing.archivedAt === null) {
        throw new ApiError(409, 'DUPLICATE_NAME', 'A snack with this name already exists');
      }
      // If archived, unarchive and update
      return await prisma.$transaction(async (tx) => {
        const unarchived = await tx.snack.update({
          where: { id: existing.id },
          data: {
            category: input.category,
            quantity: input.quantity,
            lowStockThreshold: input.lowStockThreshold,
            calories: input.calories ?? null,
            imageUrl: primaryImage,
            images: rawImages,
            archivedAt: null,
          },
        });

        if (input.quantity > 0) {
          await tx.activity.create({
            data: {
              userId: adminUserId,
              snackId: unarchived.id,
              action: ActivityAction.RESTOCKED,
              amount: input.quantity,
            },
          });
        }

        return {
          id: unarchived.id,
          name: unarchived.name,
          category: unarchived.category,
          quantity: unarchived.quantity,
          lowStockThreshold: unarchived.lowStockThreshold,
          calories: unarchived.calories,
          imageUrl: unarchived.imageUrl,
          images: unarchived.images,
          status: getSnackStatus(unarchived.quantity, unarchived.lowStockThreshold),
          createdAt: unarchived.createdAt,
          updatedAt: unarchived.updatedAt,
        };
      });
    }

    return await prisma.$transaction(async (tx) => {
      const snack = await tx.snack.create({
        data: {
          name: input.name,
          category: input.category,
          quantity: input.quantity,
          lowStockThreshold: input.lowStockThreshold,
          calories: input.calories ?? null,
          imageUrl: primaryImage,
          images: rawImages,
        },
      });

      if (input.quantity > 0) {
        await tx.activity.create({
          data: {
            userId: adminUserId,
            snackId: snack.id,
            action: ActivityAction.RESTOCKED,
            amount: input.quantity,
          },
        });
      }

      return {
        id: snack.id,
        name: snack.name,
        category: snack.category,
        quantity: snack.quantity,
        lowStockThreshold: snack.lowStockThreshold,
        calories: snack.calories,
        imageUrl: snack.imageUrl,
        images: snack.images,
        status: getSnackStatus(snack.quantity, snack.lowStockThreshold),
        createdAt: snack.createdAt,
        updatedAt: snack.updatedAt,
      };
    });
  }

  /**
   * Admin: Edit snack metadata (name, category, threshold, calories, imageUrl, images).
   */
  static async updateSnack(id: string, input: UpdateSnackInput) {
    const existing = await prisma.snack.findFirst({
      where: { id, archivedAt: null },
    });

    if (!existing) {
      throw new ApiError(404, 'NOT_FOUND', 'Snack not found');
    }

    if (input.name && input.name !== existing.name) {
      const duplicate = await prisma.snack.findFirst({
        where: { name: input.name, id: { not: id }, archivedAt: null },
      });
      if (duplicate) {
        throw new ApiError(409, 'DUPLICATE_NAME', 'Another snack with this name already exists');
      }
    }

    const newImages = input.images !== undefined ? input.images : (input.imageUrl ? [input.imageUrl] : undefined);
    const newImageUrl = input.imageUrl !== undefined ? input.imageUrl : (input.images && input.images.length > 0 ? input.images[0] : undefined);

    const updated = await prisma.snack.update({
      where: { id },
      data: {
        ...(input.name && { name: input.name }),
        ...(input.category && { category: input.category }),
        ...(input.lowStockThreshold !== undefined && { lowStockThreshold: input.lowStockThreshold }),
        ...(input.calories !== undefined && { calories: input.calories }),
        ...(newImageUrl !== undefined && { imageUrl: newImageUrl }),
        ...(newImages !== undefined && { images: newImages }),
      },
    });

    const rawImages = Array.isArray(updated.images) ? updated.images : [];
    const images = rawImages.length > 0 ? rawImages : (updated.imageUrl ? [updated.imageUrl] : []);
    const imageUrl = updated.imageUrl || (images.length > 0 ? images[0] : null);

    return {
      id: updated.id,
      name: updated.name,
      category: updated.category,
      quantity: updated.quantity,
      lowStockThreshold: updated.lowStockThreshold,
      calories: updated.calories,
      imageUrl,
      images,
      status: getSnackStatus(updated.quantity, updated.lowStockThreshold),
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }

  /**
   * Admin: Soft archive snack so audit activities and votes are preserved.
   */
  static async deleteSnack(id: string) {
    const existing = await prisma.snack.findFirst({
      where: { id, archivedAt: null },
    });

    if (!existing) {
      throw new ApiError(404, 'NOT_FOUND', 'Snack not found');
    }

    await prisma.snack.update({
      where: { id },
      data: { archivedAt: new Date() },
    });

    return { success: true };
  }

  /**
   * User Vote: Vote for a snack.
   * Relies on the database composite unique constraint (userId, snackId)
   * to guarantee one-vote-per-user-per-snack even under concurrent requests.
   */
  static async voteSnack(snackId: string, userId: string) {
    // 1. Verify snack exists and is not archived
    const snack = await prisma.snack.findFirst({
      where: { id: snackId, archivedAt: null },
    });

    if (!snack) {
      throw new ApiError(404, 'NOT_FOUND', 'Snack not found');
    }

    try {
      await prisma.vote.create({
        data: {
          userId,
          snackId,
        },
      });
    } catch (err: any) {
      // Prisma P2002 error code is Unique constraint failed
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ApiError(409, 'ALREADY_VOTED', 'You have already voted for this snack');
      }
      throw err;
    }

    const voteCount = await prisma.vote.count({ where: { snackId } });
    return {
      snackId,
      voteCount,
      hasVoted: true,
    };
  }

  /**
   * User Vote: Remove vote for a snack. Idempotent.
   */
  static async unvoteSnack(snackId: string, userId: string) {
    const snack = await prisma.snack.findFirst({
      where: { id: snackId, archivedAt: null },
    });

    if (!snack) {
      throw new ApiError(404, 'NOT_FOUND', 'Snack not found');
    }

    await prisma.vote.deleteMany({
      where: {
        snackId,
        userId,
      },
    });

    const voteCount = await prisma.vote.count({ where: { snackId } });
    return {
      snackId,
      voteCount,
      hasVoted: false,
    };
  }

  /**
   * User Favorite: Bookmark a snack for quick access (personal bookmark).
   * Relies on the database composite unique constraint (userId, snackId) on Favorite.
   */
  static async favoriteSnack(snackId: string, userId: string) {
    const snack = await prisma.snack.findFirst({
      where: { id: snackId, archivedAt: null },
    });

    if (!snack) {
      throw new ApiError(404, 'NOT_FOUND', 'Snack not found');
    }

    try {
      await prisma.favorite.create({
        data: {
          userId,
          snackId,
        },
      });
    } catch (err: any) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        // Idempotent favorite: already saved
        return {
          snackId,
          isFavorite: true,
        };
      }
      throw err;
    }

    return {
      snackId,
      isFavorite: true,
    };
  }

  /**
   * User Favorite: Remove snack from bookmarks. Idempotent.
   */
  static async unfavoriteSnack(snackId: string, userId: string) {
    const snack = await prisma.snack.findFirst({
      where: { id: snackId, archivedAt: null },
    });

    if (!snack) {
      throw new ApiError(404, 'NOT_FOUND', 'Snack not found');
    }

    await prisma.favorite.deleteMany({
      where: {
        snackId,
        userId,
      },
    });

    return {
      snackId,
      isFavorite: false,
    };
  }
}
