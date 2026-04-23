const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.product.updateMany({
    data: {
      stock_actual: "0",
      en_catalogo_empresa: false
    }
  });
  console.log(`Updated ${result.count} products to 0 stock and en_catalogo_empresa = false.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
