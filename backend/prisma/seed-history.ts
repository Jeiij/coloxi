import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Obteniendo productos...');
  const products = await prisma.product.findMany();
  
  console.log(`Se encontraron ${products.length} productos.`);
  
  let count = 0;
  for (const prod of products) {
    // Check if it already has a history record
    const hasHistory = await prisma.productPriceHistory.findFirst({
      where: { producto_id: prod.id }
    });

    if (!hasHistory) {
      await prisma.productPriceHistory.create({
        data: {
          producto_id: prod.id,
          costo_unitario_sin_iva: prod.costo_unitario_sin_iva,
          pvp_colombia: prod.pvp_colombia,
          pvp_venezuela: prod.pvp_venezuela,
          // Since it's an initial backfill, we leave changed_by as null, or we could use created_by.
          changed_by: prod.created_by,
          created_at: prod.created_at, // Use the product creation date as the initial snapshot date
        }
      });
      count++;
    }
  }

  console.log(`Se migraron ${count} historiales de precios exitosamente.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
