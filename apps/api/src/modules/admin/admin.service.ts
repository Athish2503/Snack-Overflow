import { prisma } from '../../config/database.js';
import { SnackService } from '../snacks/snack.service.js';
import { SnackCategory } from '@prisma/client';

export class AdminDashboardService {
  static async getDashboard(currentUserId?: string) {
    // Generate dates for the last 7 calendar days up to today (UTC)
    const dates: string[] = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      dates.push(d.toISOString().slice(0, 10));
    }
    const startDate = new Date(`${dates[0]}T00:00:00.000Z`);

    const [
      countRows,
      needsRestockRows,
      recentActivityRows,
      consumptionRows,
      mostConsumedRows,
      snackSummary,
    ] = await Promise.all([
      // 1. Counts: total, stocked, low, gone
      prisma.$queryRaw<
        Array<{
          total: number;
          stocked: number;
          low: number;
          gone: number;
        }>
      >`
        SELECT
          COUNT(*)::int as "total",
          COUNT(*) FILTER (WHERE "quantity" > "lowStockThreshold")::int as "stocked",
          COUNT(*) FILTER (WHERE "quantity" > 0 AND "quantity" <= "lowStockThreshold")::int as "low",
          COUNT(*) FILTER (WHERE "quantity" = 0)::int as "gone"
        FROM "Snack"
        WHERE "archivedAt" IS NULL
      `,

      // 2. Needs restock: up to 8 snacks ordered by urgency
      prisma.$queryRaw<
        Array<{
          id: string;
          name: string;
          imageUrl: string | null;
          category: SnackCategory;
          quantity: number;
          lowStockThreshold: number;
        }>
      >`
        SELECT
          "id",
          "name",
          "imageUrl",
          "category",
          "quantity",
          "lowStockThreshold"
        FROM "Snack"
        WHERE "archivedAt" IS NULL
          AND "quantity" <= "lowStockThreshold"
        ORDER BY
          CASE WHEN "quantity" = 0 THEN 0 ELSE 1 END ASC,
          (CAST("quantity" AS FLOAT) / NULLIF("lowStockThreshold", 0)) ASC,
          "name" ASC
        LIMIT 8
      `,

      // 3. Recent activity: last 10 activities (user name, snack name, action, amount, createdAt)
      prisma.$queryRaw<
        Array<{
          id: string;
          userName: string;
          snackName: string;
          action: 'CONSUMED' | 'RESTOCKED';
          amount: number;
          createdAt: Date;
        }>
      >`
        SELECT
          a."id",
          u."name" as "userName",
          s."name" as "snackName",
          a."action"::text as "action",
          a."amount"::int as "amount",
          a."createdAt"
        FROM "Activity" a
        JOIN "User" u ON a."userId" = u."id"
        JOIN "Snack" s ON a."snackId" = s."id"
        WHERE s."archivedAt" IS NULL
        ORDER BY a."createdAt" DESC
        LIMIT 10
      `,

      // 4. Consumption last 7 days: CONSUMED only, aggregate by date
      prisma.$queryRaw<
        Array<{
          date: string;
          units: number;
        }>
      >`
        SELECT
          TO_CHAR(a."createdAt" AT TIME ZONE 'UTC', 'YYYY-MM-DD') as "date",
          SUM(a."amount")::int as "units"
        FROM "Activity" a
        JOIN "Snack" s ON a."snackId" = s."id"
        WHERE a."action" = 'CONSUMED'
          AND a."createdAt" >= ${startDate}
          AND s."archivedAt" IS NULL
        GROUP BY TO_CHAR(a."createdAt" AT TIME ZONE 'UTC', 'YYYY-MM-DD')
      `,

      // 5. Most consumed this week: top 3 snacks in last 7 days
      prisma.$queryRaw<
        Array<{
          id: string;
          name: string;
          imageUrl: string | null;
          units: number;
        }>
      >`
        SELECT
          s."id",
          s."name",
          s."imageUrl",
          SUM(a."amount")::int as "units"
        FROM "Activity" a
        JOIN "Snack" s ON a."snackId" = s."id"
        WHERE a."action" = 'CONSUMED'
          AND a."createdAt" >= ${startDate}
          AND s."archivedAt" IS NULL
        GROUP BY s."id", s."name", s."imageUrl"
        ORDER BY "units" DESC, s."name" ASC
        LIMIT 3
      `,

      // 6. Snack of the week: reuse existing weekly voting logic
      SnackService.getSummary(currentUserId),
    ]);

    // Parse counts
    const counts = {
      total: countRows[0]?.total ?? 0,
      stocked: countRows[0]?.stocked ?? 0,
      low: countRows[0]?.low ?? 0,
      gone: countRows[0]?.gone ?? 0,
    };

    // Format needsRestock with derived status and smart suggestedRestock math:
    // X = max(1, 2*lowStockThreshold - quantity), Y = quantity + X
    const needsRestock = needsRestockRows.map((snack) => {
      const amount = Math.max(1, 2 * snack.lowStockThreshold - snack.quantity);
      const target = snack.quantity + amount;
      return {
        id: snack.id,
        name: snack.name,
        imageUrl: snack.imageUrl,
        category: snack.category,
        quantity: snack.quantity,
        lowStockThreshold: snack.lowStockThreshold,
        status: (snack.quantity === 0 ? 'gone' : 'low') as 'gone' | 'low',
        suggestedRestock: {
          amount,
          target,
        },
      };
    });

    // Format recentActivity
    const recentActivity = recentActivityRows.map((act) => ({
      id: act.id,
      userName: act.userName,
      snackName: act.snackName,
      action: act.action,
      amount: act.amount,
      createdAt: act.createdAt,
    }));

    // Map 7 days with 0s for missing days
    const consumptionMap = new Map<string, number>();
    for (const row of consumptionRows) {
      consumptionMap.set(row.date, row.units);
    }
    const consumptionLast7Days = dates.map((date) => ({
      date,
      units: consumptionMap.get(date) ?? 0,
    }));

    // Calculate consumptionAverage (daily average across 7 days)
    const totalConsumptionUnits = consumptionLast7Days.reduce((acc, curr) => acc + curr.units, 0);
    const consumptionAverage = Math.round((totalConsumptionUnits / 7) * 10) / 10;

    // Format mostConsumedThisWeek
    const mostConsumedThisWeek = mostConsumedRows.map((snack) => ({
      id: snack.id,
      name: snack.name,
      imageUrl: snack.imageUrl,
      units: snack.units,
    }));

    // Query unitsConsumedThisWeek for snackOfTheWeek if present
    let unitsConsumedThisWeek = 0;
    const rawSotw = snackSummary.snackOfTheWeek;
    if (rawSotw?.id) {
      const unitsRow = await prisma.$queryRaw<Array<{ units: number }>>`
        SELECT COALESCE(SUM(a."amount"), 0)::int as "units"
        FROM "Activity" a
        WHERE a."snackId" = ${rawSotw.id}
          AND a."action" = 'CONSUMED'
          AND a."createdAt" >= ${startDate}
      `;
      unitsConsumedThisWeek = unitsRow[0]?.units ?? 0;
    }

    const snackOfTheWeek = rawSotw
      ? {
          ...rawSotw,
          quantity: rawSotw.quantity,
          lowStockThreshold: rawSotw.lowStockThreshold,
          status: rawSotw.status || (rawSotw.quantity === 0 ? 'gone' : rawSotw.quantity <= rawSotw.lowStockThreshold ? 'low' : 'stocked'),
          unitsConsumedThisWeek,
        }
      : null;

    return {
      counts,
      needsRestock,
      recentActivity,
      consumptionLast7Days,
      consumptionAverage,
      mostConsumedThisWeek,
      snackOfTheWeek,
    };
  }
}
