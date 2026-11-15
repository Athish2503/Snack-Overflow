import { PrismaClient, SnackCategory, ActivityAction, Role } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('[Demo History Seed] Seeding backdated realistic 7-day activity & votes...');

  // 1. Ensure demo users exist
  const passwordHash = await bcrypt.hash('member123', 10);
  const adminPasswordHash = await bcrypt.hash('admin123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@snackoverflow.local' },
    update: {},
    create: {
      email: 'admin@snackoverflow.local',
      name: 'Pantry Lead (Admin)',
      password: adminPasswordHash,
      role: Role.ADMIN,
    },
  });

  const member = await prisma.user.upsert({
    where: { email: 'member@snackoverflow.local' },
    update: {},
    create: {
      email: 'member@snackoverflow.local',
      name: 'Maya Lin',
      password: passwordHash,
      role: Role.MEMBER,
    },
  });

  const alex = await prisma.user.upsert({
    where: { email: 'alex@snackoverflow.local' },
    update: {},
    create: {
      email: 'alex@snackoverflow.local',
      name: 'Alex Rivera',
      password: passwordHash,
      role: Role.MEMBER,
    },
  });

  const sam = await prisma.user.upsert({
    where: { email: 'sam@snackoverflow.local' },
    update: {},
    create: {
      email: 'sam@snackoverflow.local',
      name: 'Sam Thorne',
      password: passwordHash,
      role: Role.MEMBER,
    },
  });

  const users = [member, alex, sam];

  // 2. Fetch snacks from inventory
  const snacks = await prisma.snack.findMany({
    where: { archivedAt: null },
    orderBy: { name: 'asc' },
  });

  if (snacks.length === 0) {
    console.error('[Demo History Seed] No snacks found. Please run npm run prisma:seed first.');
    return;
  }

  const chocolate = snacks.find((s) => s.name.includes('Chocolate')) || snacks[0];
  const almonds = snacks.find((s) => s.name.includes('Almonds')) || snacks[1 % snacks.length];
  const juice = snacks.find((s) => s.name.includes('Ginger') || s.name.includes('Apple')) || snacks[2 % snacks.length];
  const popcorn = snacks.find((s) => s.name.includes('Popcorn')) || snacks[3 % snacks.length];
  const soda = snacks.find((s) => s.name.includes('Soda') || s.name.includes('Yuzu')) || snacks[4 % snacks.length];

  // 3. Clear existing activity to ensure clean idempotency
  await prisma.activity.deleteMany({});
  await prisma.vote.deleteMany({});

  // 4. Seed votes (Chocolate is undisputed Snack of the Week with 4 votes)
  const now = new Date();
  await prisma.vote.createMany({
    data: [
      { userId: member.id, snackId: chocolate.id, createdAt: new Date(now.getTime() - 2 * 86400000) },
      { userId: alex.id, snackId: chocolate.id, createdAt: new Date(now.getTime() - 3 * 86400000) },
      { userId: sam.id, snackId: chocolate.id, createdAt: new Date(now.getTime() - 4 * 86400000) },
      { userId: admin.id, snackId: chocolate.id, createdAt: new Date(now.getTime() - 1 * 86400000) },
      // Other votes
      { userId: member.id, snackId: almonds.id, createdAt: new Date(now.getTime() - 2 * 86400000) },
      { userId: alex.id, snackId: juice.id, createdAt: new Date(now.getTime() - 1 * 86400000) },
    ],
  });

  // 5. Generate backdated activities across the last 7 calendar days
  const activityData: Array<{
    userId: string;
    snackId: string;
    action: ActivityAction;
    amount: number;
    createdAt: Date;
  }> = [];

  // Distribution of units across the last 7 days (day 6 down to day 0 = today)
  const dailyPlans = [
    { dayOffset: 6, items: [{ snack: chocolate, amount: 4 }, { snack: almonds, amount: 2 }] },
    { dayOffset: 5, items: [{ snack: soda, amount: 5 }, { snack: chocolate, amount: 3 }, { snack: popcorn, amount: 2 }] },
    { dayOffset: 4, items: [{ snack: juice, amount: 4 }, { snack: chocolate, amount: 5 }] },
    { dayOffset: 3, items: [{ snack: almonds, amount: 6 }, { snack: chocolate, amount: 6 }, { snack: soda, amount: 4 }] },
    { dayOffset: 2, items: [{ snack: chocolate, amount: 4 }, { snack: popcorn, amount: 3 }, { snack: juice, amount: 3 }] },
    { dayOffset: 1, items: [{ snack: chocolate, amount: 5 }, { snack: almonds, amount: 4 }, { snack: soda, amount: 3 }] },
    { dayOffset: 0, items: [{ snack: chocolate, amount: 3 }, { snack: almonds, amount: 2 }, { snack: juice, amount: 2 }] },
  ];

  let userIdx = 0;
  for (const plan of dailyPlans) {
    const baseDate = new Date(now.getTime() - plan.dayOffset * 86400000);

    for (let i = 0; i < plan.items.length; i++) {
      const item = plan.items[i];
      const activityTime = new Date(baseDate.getTime() + (i * 3600000 + 43200000)); // offset through the day
      const u = users[userIdx % users.length];
      userIdx++;

      activityData.push({
        userId: u.id,
        snackId: item.snack.id,
        action: ActivityAction.CONSUMED,
        amount: item.amount,
        createdAt: activityTime,
      });
    }
  }

  // Add 2 Restock activities so feed has natural restock representation
  activityData.push({
    userId: admin.id,
    snackId: popcorn.id,
    action: ActivityAction.RESTOCKED,
    amount: 15,
    createdAt: new Date(now.getTime() - 2 * 86400000 + 14400000),
  });

  activityData.push({
    userId: admin.id,
    snackId: almonds.id,
    action: ActivityAction.RESTOCKED,
    amount: 10,
    createdAt: new Date(now.getTime() - 1 * 86400000 + 18000000),
  });

  // Bulk insert activities
  await prisma.activity.createMany({
    data: activityData,
  });

  console.log(`[Demo History Seed] Created ${activityData.length} backdated activity records and 6 votes successfully.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
