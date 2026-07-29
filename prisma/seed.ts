/**
 * Product 시드. 가격/이용권 정의(src/config/products.ts)를 DB Product 로 반영한다.
 * 실행: DATABASE_URL 설정 후 `npm run seed` (PostgreSQL 필요)
 */
import { PrismaClient } from "@prisma/client";
import { products } from "../src/config/products";

const prisma = new PrismaClient();

async function main() {
  for (const p of products) {
    await prisma.product.upsert({
      where: { id: p.id },
      update: {
        name: p.name,
        amount: p.amount,
        credits: p.credits,
        active: p.active,
        description: p.description,
      },
      create: {
        id: p.id,
        name: p.name,
        amount: p.amount,
        credits: p.credits,
        active: p.active,
        description: p.description,
      },
    });
    console.log(`seeded product ${p.id} (${p.amount}원, active=${p.active})`);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
