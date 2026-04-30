/**
 * CLI Seed Script para COLOXI
 * 
 * Uso: npx ts-node src/seed.ts
 * 
 * Crea los datos iniciales del sistema:
 * - Roles (ADMIN, GERENTE, JEFE_COMPRA)
 * - Usuarios de prueba
 * - Parámetros del sistema (IVA, Factor Venezuela)
 * - Catálogos (categorías, líneas, marcas, colores)
 * - Producto de ejemplo
 */
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Ejecutando seed de COLOXI...\n');

  // 1. Roles
  const rolesDefaults = [
    { nombre: 'ADMIN', descripcion: 'Acceso total al sistema' },
    { nombre: 'GERENTE', descripcion: 'Gestión completa, ve márgenes y ganancias' },
    { nombre: 'JEFE_COMPRA', descripcion: 'Gestión de órdenes de compra. Sin acceso a márgenes de ganancia.' },
  ];

  for (const rol of rolesDefaults) {
    await prisma.role.upsert({
      where: { nombre: rol.nombre },
      update: { descripcion: rol.descripcion },
      create: rol,
    });
  }
  console.log('✅ Roles creados');

  const adminRole = await prisma.role.findUnique({ where: { nombre: 'ADMIN' } });
  const gerenteRole = await prisma.role.findUnique({ where: { nombre: 'GERENTE' } });
  const comprasRole = await prisma.role.findUnique({ where: { nombre: 'JEFE_COMPRA' } });

  // 2. Parámetros del Sistema
  const paramsDefaults = [
    { clave: 'IVA_PORCENTAJE', valor: '19.00', descripcion: 'Porcentaje de IVA aplicado en Colombia' },
    { clave: 'FACTOR_VENEZUELA', valor: '1.40', descripcion: 'Factor dinámico para calcular PVP Venezuela' },
  ];

  for (const param of paramsDefaults) {
    await prisma.systemParameter.upsert({
      where: { clave: param.clave },
      update: { valor: param.valor },
      create: param,
    });
  }
  console.log('✅ Parámetros del sistema creados');

  // 3. Usuarios de Prueba
  const users = [
    { email: 'admin@coloxi.com', pass: 'Admin123!', nombre: 'Admin COLOXI', rolId: adminRole!.id },
    { email: 'gerente@coloxi.com', pass: 'Gerente123!', nombre: 'Gerente COLOXI', rolId: gerenteRole!.id },
    { email: 'compras@coloxi.com', pass: 'Compras123!', nombre: 'Jefe Compras COLOXI', rolId: comprasRole!.id },
  ];

  for (const u of users) {
    const exists = await prisma.user.findUnique({ where: { email: u.email } });
    if (!exists) {
      await prisma.user.create({
        data: {
          email: u.email,
          password_hash: bcrypt.hashSync(u.pass, 10),
          nombre_completo: u.nombre,
          rol_id: u.rolId,
        },
      });
      console.log(`  → Usuario ${u.email} creado`);
    } else {
      console.log(`  → Usuario ${u.email} ya existe, omitido`);
    }
  }
  console.log('✅ Usuarios creados');

  // 4. Catálogos
  const categorias = ['Pinturas', 'Esmaltes', 'Barnices'];
  const lineas = ['Arquitectónica', 'Industrial', 'Decorativa'];
  const marcas = ['Pintuco', 'Sherwin-Williams', 'Internacional'];

  for (const cat of categorias) {
    await prisma.category.upsert({ where: { nombre: cat }, update: {}, create: { nombre: cat } });
  }
  for (const lin of lineas) {
    await prisma.line.upsert({ where: { nombre: lin }, update: {}, create: { nombre: lin } });
  }
  for (const mar of marcas) {
    await prisma.brand.upsert({ where: { nombre: mar }, update: {}, create: { nombre: mar } });
  }

  const colores = [
    { nombre: 'Blanco', codigo_hex: '#FFFFFF' },
    { nombre: 'Negro', codigo_hex: '#000000' },
    { nombre: 'Gris', codigo_hex: '#808080' },
    { nombre: 'Beige', codigo_hex: '#F5F5DC' },
    { nombre: 'Azul', codigo_hex: '#0000FF' },
  ];
  for (const c of colores) {
    await prisma.color.upsert({
      where: { nombre: c.nombre },
      update: { codigo_hex: c.codigo_hex },
      create: c,
    });
  }
  console.log('✅ Catálogos creados');

  // 5. Producto de Ejemplo
  const catPinturas = await prisma.category.findUnique({ where: { nombre: 'Pinturas' } });
  const linArq = await prisma.line.findUnique({ where: { nombre: 'Arquitectónica' } });
  const marPintuco = await prisma.brand.findUnique({ where: { nombre: 'Pintuco' } });
  const colorBlanco = await prisma.color.findUnique({ where: { nombre: 'Blanco' } });

  const prodCode = 'SUPER5-GAL-BL';
  const existingProd = await prisma.product.findUnique({ where: { codigo: prodCode } });

  if (!existingProd) {
    const adminUser = await prisma.user.findUnique({ where: { email: 'admin@coloxi.com' } });
    const product = await prisma.product.create({
      data: {
        codigo: prodCode,
        nombre: 'Pintura Super5 Galón Blanco',
        nombre_corto: 'Super5 1G Blanco',
        categoria_id: catPinturas!.id,
        linea_id: linArq!.id,
        marca_id: marPintuco!.id,
        presentacion: 'Galón',
        capacidad_gal: 1.00,
        equivalencia_kg: 4.50,
        costo_unitario_sin_iva: 25000.0000,
        pvp_colombia: 45000.0000,
        factor_venezuela: 1.4000,
        created_by: adminUser!.id,
        colores: {
          create: { color_id: colorBlanco!.id },
        },
      },
    });

    await prisma.productImage.create({
      data: {
        producto_id: product.id,
        url_imagen: '/uploads/products/placeholder.jpg',
        es_principal: true,
        orden_visual: 1,
      },
    });
    console.log('✅ Producto de ejemplo creado');
  } else {
    console.log('✅ Producto de ejemplo ya existe, omitido');
  }

  console.log('\n🎉 Seed completado exitosamente');
}

main()
  .catch((e) => {
    console.error('❌ Error ejecutando seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
