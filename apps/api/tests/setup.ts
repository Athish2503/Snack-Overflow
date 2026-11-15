import { afterAll } from 'vitest';
import { prisma } from '../src/config/database.js';

export const SEEDED_SNACK_NAMES = [
  'Artisanal Sea Salt Dark Chocolate',
  'Rosemary & Sea Salt Marcona Almonds',
  'Cold-Pressed Ginger & Green Apple',
  'Smoked Paprika Plantain Chips',
  'Cold Brew Oat Latte',
  'Blueberry Acai Protein Bar',
  'White Cheddar Truffle Popcorn',
  'Matcha Ceremonial Sparkling Iced Tea',
  'Salted Caramel Peanuts',
  'Baked Beetroot & Sweet Potato Crisps',
  'Sparkling Blood Orange Soda',
  'Roasted Garlic Pretzel Thins',
];

export async function cleanupTestSnacks() {
  try {
    const testSnacks = await prisma.snack.findMany({
      where: { name: { notIn: SEEDED_SNACK_NAMES } },
      select: { id: true },
    });

    if (testSnacks.length > 0) {
      const ids = testSnacks.map((s) => s.id);
      await prisma.vote.deleteMany({ where: { snackId: { in: ids } } });
      await prisma.activity.deleteMany({ where: { snackId: { in: ids } } });
      await prisma.snack.deleteMany({ where: { id: { in: ids } } });
    }
  } catch (err) {
    console.error('Failed to clean up test snacks:', err);
  }
}

afterAll(async () => {
  await cleanupTestSnacks();
  await prisma.$disconnect();
});
