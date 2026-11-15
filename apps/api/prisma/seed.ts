import { PrismaClient, Role, SnackCategory, ActivityAction } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('[Seed] Starting database revamp & seed...');

  // 1. Clean existing snacks, activities, and votes
  console.log('[Seed] Clearing old snacks, activities, and votes...');
  await prisma.vote.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.snack.deleteMany();

  // 2. Hash passwords for demo accounts
  const saltRounds = 10;
  const adminPasswordHash = await bcrypt.hash('admin123', saltRounds);
  const memberPasswordHash = await bcrypt.hash('member123', saltRounds);

  // 3. Upsert Admin User
  const admin = await prisma.user.upsert({
    where: { email: 'admin@snackoverflow.local' },
    update: { password: adminPasswordHash, role: Role.ADMIN },
    create: {
      name: 'Pantry Admin',
      email: 'admin@snackoverflow.local',
      password: adminPasswordHash,
      role: Role.ADMIN,
    },
  });
  console.log(`[Seed] Upserted Admin: ${admin.email}`);

  // 4. Upsert Member User
  const member = await prisma.user.upsert({
    where: { email: 'member@snackoverflow.local' },
    update: { password: memberPasswordHash, role: Role.MEMBER },
    create: {
      name: 'Snack Dev',
      email: 'member@snackoverflow.local',
      password: memberPasswordHash,
      role: Role.MEMBER,
    },
  });
  console.log(`[Seed] Upserted Member: ${member.email}`);

  // 5. Seed revamped snacks with calories, images, and multi-image carousels
  const snacksData = [
    {
      name: 'Artisanal Sea Salt Dark Chocolate',
      category: SnackCategory.SWEET,
      quantity: 16,
      lowStockThreshold: 5,
      calories: 210,
      imageUrl: 'https://images.unsplash.com/photo-1548907040-4baa42d10919?auto=format&fit=crop&w=600&q=80',
      images: [
        'https://images.unsplash.com/photo-1548907040-4baa42d10919?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1606312619070-d48b4c652a52?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1511381939415-e44015466834?auto=format&fit=crop&w=600&q=80',
      ],
    },
    {
      name: 'Rosemary & Sea Salt Marcona Almonds',
      category: SnackCategory.HEALTHY_ISH,
      quantity: 12,
      lowStockThreshold: 4,
      calories: 170,
      imageUrl: 'https://images.unsplash.com/photo-1508061252445-5350f37dfc3b?auto=format&fit=crop&w=600&q=80',
      images: [
        'https://images.unsplash.com/photo-1508061252445-5350f37dfc3b?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1536591375315-1b83683e321c?auto=format&fit=crop&w=600&q=80',
      ],
    },
    {
      name: 'Cold-Pressed Ginger & Green Apple',
      category: SnackCategory.DRINK,
      quantity: 8,
      lowStockThreshold: 4,
      calories: 95,
      imageUrl: 'https://images.unsplash.com/photo-1622597467836-f3285f2131b8?auto=format&fit=crop&w=600&q=80',
      images: [
        'https://images.unsplash.com/photo-1622597467836-f3285f2131b8?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1589733955941-5eeaf752f6dd?auto=format&fit=crop&w=600&q=80',
      ],
    },
    {
      name: 'Smoked Paprika Plantain Chips',
      category: SnackCategory.SAVOURY,
      quantity: 3,
      lowStockThreshold: 5,
      calories: 140,
      imageUrl: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=600&q=80',
      images: [
        'https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1621447504864-d8686e12698c?auto=format&fit=crop&w=600&q=80',
      ],
    },
    {
      name: 'Cold Brew Oat Latte',
      category: SnackCategory.DRINK,
      quantity: 0,
      lowStockThreshold: 4,
      calories: 110,
      imageUrl: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=600&q=80',
      images: [
        'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=600&q=80',
      ],
    },
    {
      name: 'Blueberry Acai Protein Bar',
      category: SnackCategory.HEALTHY_ISH,
      quantity: 15,
      lowStockThreshold: 5,
      calories: 190,
      imageUrl: 'https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?auto=format&fit=crop&w=600&q=80',
      images: [
        'https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1606149059549-6042addafc58?auto=format&fit=crop&w=600&q=80',
      ],
    },
    {
      name: 'White Cheddar Truffle Popcorn',
      category: SnackCategory.SAVOURY,
      quantity: 2,
      lowStockThreshold: 4,
      calories: 130,
      imageUrl: 'https://images.unsplash.com/photo-1578849278619-e73505e9610f?auto=format&fit=crop&w=600&q=80',
      images: [
        'https://images.unsplash.com/photo-1578849278619-e73505e9610f?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1585647347483-22b66260dfff?auto=format&fit=crop&w=600&q=80',
      ],
    },
    {
      name: 'Matcha Ceremonial Sparkling Iced Tea',
      category: SnackCategory.DRINK,
      quantity: 14,
      lowStockThreshold: 4,
      calories: 20,
      imageUrl: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=600&q=80',
      images: [
        'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&q=80',
      ],
    },
    {
      name: 'Salted Caramel Peanuts',
      category: SnackCategory.SWEET,
      quantity: 7,
      lowStockThreshold: 5,
      calories: 230,
      imageUrl: 'https://images.unsplash.com/photo-1582293041079-7814c2f12063?auto=format&fit=crop&w=600&q=80',
      images: [
        'https://images.unsplash.com/photo-1582293041079-7814c2f12063?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1534483509719-3feaee7c30da?auto=format&fit=crop&w=600&q=80',
      ],
    },
    {
      name: 'Baked Beetroot & Sweet Potato Crisps',
      category: SnackCategory.HEALTHY_ISH,
      quantity: 18,
      lowStockThreshold: 5,
      calories: 120,
      imageUrl: 'https://images.unsplash.com/photo-1528750997573-59b89d56f4f7?auto=format&fit=crop&w=600&q=80',
      images: [
        'https://images.unsplash.com/photo-1528750997573-59b89d56f4f7?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1600952841320-db92ec4047ca?auto=format&fit=crop&w=600&q=80',
      ],
    },
    {
      name: 'Sparkling Blood Orange Soda',
      category: SnackCategory.DRINK,
      quantity: 4,
      lowStockThreshold: 4,
      calories: 80,
      imageUrl: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80',
      images: [
        'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80',
      ],
    },
    {
      name: 'Roasted Garlic Pretzel Thins',
      category: SnackCategory.SAVOURY,
      quantity: 0,
      lowStockThreshold: 4,
      calories: 110,
      imageUrl: 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?auto=format&fit=crop&w=600&q=80',
      images: [
        'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1584847802528-0a0684d5dfd9?auto=format&fit=crop&w=600&q=80',
      ],
    },
  ];

  const createdSnacks = [];
  for (const snackData of snacksData) {
    const snack = await prisma.snack.create({
      data: snackData,
    });
    createdSnacks.push(snack);

    // Initial restock activity
    if (snackData.quantity > 0) {
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
  console.log(`[Seed] Seeded ${createdSnacks.length} revamped snacks with calories and uniform images.`);

  // 6. Cast votes to give a prominent Snack of the Week
  const seaSaltChoc = createdSnacks.find((s) => s.name === 'Artisanal Sea Salt Dark Chocolate');
  if (seaSaltChoc) {
    await prisma.vote.create({
      data: {
        userId: member.id,
        snackId: seaSaltChoc.id,
      },
    });
    await prisma.vote.create({
      data: {
        userId: admin.id,
        snackId: seaSaltChoc.id,
      },
    });
    console.log(`[Seed] Seeded 2 votes for "${seaSaltChoc.name}" (Snack of the Week).`);
  }

  const greenJuice = createdSnacks.find((s) => s.name === 'Cold-Pressed Ginger & Green Apple');
  if (greenJuice) {
    await prisma.vote.create({
      data: {
        userId: member.id,
        snackId: greenJuice.id,
      },
    });
    console.log(`[Seed] Seeded 1 vote for "${greenJuice.name}".`);
  }

  console.log('[Seed] Revamp database seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error('[Seed] Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
