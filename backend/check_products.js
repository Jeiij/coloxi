const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const count = await prisma.product.count();
  const sample = await prisma.product.findMany({ take: 2, select: { codigo: true, en_catalogo_empresa: true, stock_actual: true } });
  console.log(`Total products in db: ${count}`);
  console.log(`Sample:`, sample);
}

main().finally(() => prisma.$disconnect());
