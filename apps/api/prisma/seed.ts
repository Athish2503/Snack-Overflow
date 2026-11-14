import { PrismaClient, Role, SnackCategory, ActivityAction } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('[Seed] Starting database seed...');

  // Hash password for demo users
  const saltRounds = 10;
  const adminPasswordHash = await bcrypt.hash('admin123', saltRounds);
  const memberPasswordHash = await bcrypt.hash('member123', saltRounds);

  // 1. Upsert Admin User
  const admin = await prisma.user.upsert({
    where: { email: 'admin@snackoverflow.local' },
    update: {},
    create: {
      name: 'Pantry Admin',
      email: 'admin@snackoverflow.local',
      password: adminPasswordHash,
      role: Role.ADMIN,
    },
  });
  console.log(`[Seed] Upserted Admin: ${admin.email}`);

  // 2. Upsert Member User
  const member = await prisma.user.upsert({
    where: { email: 'member@snackoverflow.local' },
    update: {},
    create: {
      name: 'Snack Dev',
      email: 'member@snackoverflow.local',
      password: memberPasswordHash,
      role: Role.MEMBER,
    },
  });
  console.log(`[Seed] Upserted Member: ${member.email}`);

  // 3. Seed sample snacks
  const snacksData = [
    {
      name: 'Dark Chocolate Almonds',
      category: SnackCategory.SWEET,
      quantity: 12,
      lowStockThreshold: 5,
    },
    {
      name: 'Masala Peanuts',
      category: SnackCategory.SAVOURY,
      quantity: 3,
      lowStockThreshold: 5,
    },
    {
      name: 'Sparkling Lemon Water',
      category: SnackCategory.DRINK,
      quantity: 0,
      lowStockThreshold: 4,
    },
    {
      name: 'Greek Yogurt Crunch',
      category: SnackCategory.HEALTHY_ISH,
      quantity: 8,
      lowStockThreshold: 3,
    },
    {
      name: 'Roasted Makhana',
      category: SnackCategory.SAVOURY,
      quantity: 15,
      lowStockThreshold: 5,
    },
    {
      name: 'Cold Brew Coffee',
      category: SnackCategory.DRINK,
      quantity: 6,
      lowStockThreshold: 4,
    },
  ];

  for (const snackData of snacksData) {
    const snack = await prisma.snack.upsert({
      where: { name: snackData.name },
      update: {},
      create: snackData,
    });

    // Seed initial restock activity for items with initial stock
    if (snackData.quantity > 0) {
      const existingActivity = await prisma.activity.findFirst({
        where: { snackId: snack.id, action: ActivityAction.RESTOCKED },
      });

      if (!existingActivity) {
        await prisma.activity.create({
          data: {
            userId: admin.id,
            snackId: snack.id,
            action: ActivityAction.RESTOCKED,
            amount: snackData.quantity,
          },
        });
      }
    }
  }
  console.log(`[Seed] Seeded ${snacksData.length} snacks and initial activity logs.`);

  // 4. Seed initial votes
  const darkChoc = await prisma.snack.findUnique({ where: { name: 'Dark Chocolate Almonds' } });
  if (darkChoc) {
    await prisma.vote.upsert({
      where: {
        userId_snackId: {
          userId: member.id,
          snackId: darkChoc.id,
        },
      },
      update: {},
      create: {
        userId: member.id,
        snackId: darkChoc.id,
      },
    });
    console.log(`[Seed] Seeded initial vote on ${darkChoc.name}`);
  }

  console.log('[Seed] Database seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error('[Seed] Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
