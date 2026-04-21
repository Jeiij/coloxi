const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const data = [
  {
    "codigo": "SUPERPASTA-5GL",
    "nombre": "SUOERPASTA 5 GL",
    "presentacion": "Cuñete 5 galones",
    "capacidad_galones": 5,
    "equivalencia_kg": 30,
    "costo_unitario_sin_iva": 8.03,
    "pvp_colombia": 10.00,
    "stock_actual": 124,
    "stock_minimo": 0,
    "observaciones": "Pasta super 5 (según Hoja1)"
  },
  {
    "codigo": "SUPERPASTA-025GL",
    "nombre": "SUOERPASTA 1/4 GL",
    "presentacion": "1/4 Galón",
    "capacidad_galones": 0.25,
    "equivalencia_kg": 1.5,
    "costo_unitario_sin_iva": 0.5138,
    "pvp_colombia": 1.25,
    "stock_actual": null,
    "stock_minimo": 0,
    "observaciones": "Costo calculado como 2098.75/4085"
  },
  {
    "codigo": "SUPER-1GL",
    "nombre": "SUPER 1GL",
    "presentacion": "Galón",
    "capacidad_galones": 1,
    "equivalencia_kg": 6,
    "costo_unitario_sin_iva": 2.05,
    "pvp_colombia": 2.75,
    "stock_actual": 644,
    "stock_minimo": 0,
    "observaciones": "Pasta super 1"
  },
  {
    "codigo": "SUPER-2CUN",
    "nombre": "SUPER 2 CUÑETE",
    "presentacion": "Cuñete 2.5 galones",
    "capacidad_galones": 2.5,
    "equivalencia_kg": 15,
    "costo_unitario_sin_iva": 3.88,
    "pvp_colombia": 5.12,
    "stock_actual": 124,
    "stock_minimo": 0,
    "observaciones": "Pasta super 2"
  },
  {
    "codigo": "AQUPROTEC-1500-CUN",
    "nombre": "AQUPROTEC 1500 CUNETE",
    "presentacion": "Cuñete 5 galones",
    "capacidad_galones": 5,
    "equivalencia_kg": 27,
    "costo_unitario_sin_iva": 25.52,
    "pvp_colombia": 37.00,
    "stock_actual": 0,
    "stock_minimo": 0,
    "observaciones": "Costo = 114309.28/4480"
  },
  {
    "codigo": "AQUPROTEC-1000-CUN",
    "nombre": "AQUPROTEC 1000 CUNETE",
    "presentacion": "Cuñete 5 galones",
    "capacidad_galones": 5,
    "equivalencia_kg": 27,
    "costo_unitario_sin_iva": 24.14,
    "pvp_colombia": 35.00,
    "stock_actual": 0,
    "stock_minimo": 0,
    "observaciones": "Costo = 108152.58/4480"
  },
  {
    "codigo": "AQUPROTEC-1000-1GL",
    "nombre": "AQUPROTEC 1000 1 GALON",
    "presentacion": "Galón",
    "capacidad_galones": 1,
    "equivalencia_kg": 5.4,
    "costo_unitario_sin_iva": 5.00,
    "pvp_colombia": 7.75,
    "stock_actual": 0,
    "stock_minimo": 0,
    "observaciones": "Costo = 22420.54/4480"
  },
  {
    "codigo": "AQUPROTEC-1500-1GL",
    "nombre": "AQUPROTEC 1500 galon",
    "presentacion": "Galón",
    "capacidad_galones": 1,
    "equivalencia_kg": 5.4,
    "costo_unitario_sin_iva": 5.28,
    "pvp_colombia": 7.40,
    "stock_actual": 0,
    "stock_minimo": 0,
    "observaciones": "PVP = L24/5"
  },
  {
    "codigo": "AQUPROTEC-800-1GL",
    "nombre": "AQUPROTEC 800 1 GALON",
    "presentacion": "Galón",
    "capacidad_galones": 1,
    "equivalencia_kg": 5.45,
    "costo_unitario_sin_iva": 4.5822,
    "pvp_colombia": 6.50,
    "stock_actual": 0,
    "stock_minimo": 0,
    "observaciones": "Stock según Hoja1: 150 unds pedidas"
  },
  {
    "codigo": "AQUPROTEC-800-5GL",
    "nombre": "AQUPROTEC 800 5 GALON",
    "presentacion": "Cuñete 5 galones",
    "capacidad_galones": 5,
    "equivalencia_kg": 27,
    "costo_unitario_sin_iva": 20.62,
    "pvp_colombia": 28.00,
    "stock_actual": 0,
    "stock_minimo": 0,
    "observaciones": "Costo = 80030/3880"
  },
  {
    "codigo": "AQUPROTEC-1800-1GL",
    "nombre": "AQUPROTEC 1800 1 GALON",
    "presentacion": "Galón",
    "capacidad_galones": 1,
    "equivalencia_kg": 5.4,
    "costo_unitario_sin_iva": null,
    "pvp_colombia": 7.75,
    "stock_actual": 0,
    "stock_minimo": 0,
    "observaciones": "Costo no especificado en tabla"
  },
  {
    "codigo": "AQUPROTEC-1800-5GL",
    "nombre": "AQUPROTEC 1800 5 GALON",
    "presentacion": "Cuñete 5 galones",
    "capacidad_galones": 5,
    "equivalencia_kg": 27,
    "costo_unitario_sin_iva": null,
    "pvp_colombia": 7.75,
    "stock_actual": 0,
    "stock_minimo": 0,
    "observaciones": "Parece error en PVP (debería ser ~38.75)"
  },
  {
    "codigo": "AQUPROTEC-2000-1GL",
    "nombre": "AQUPROTEC 2000 1 GALON",
    "presentacion": "Galón",
    "capacidad_galones": 1,
    "equivalencia_kg": 5.4,
    "costo_unitario_sin_iva": null,
    "pvp_colombia": 7.75,
    "stock_actual": 0,
    "stock_minimo": 0,
    "observaciones": "Costo no especificado"
  },
  {
    "codigo": "AQUPROTEC-1800-VR-5GL",
    "nombre": "AQUPROTEC 1800 5 GALON VERDE Y ROJO",
    "presentacion": "Cuñete 5 galones",
    "capacidad_galones": 5,
    "equivalencia_kg": 27,
    "costo_unitario_sin_iva": 4.1796,
    "pvp_colombia": 75.00,
    "stock_actual": 0,
    "stock_minimo": 0,
    "observaciones": "Costo muy bajo, revisar"
  },
  {
    "codigo": "AQUPROTEC-2000-5GL",
    "nombre": "AQUPROTEC 2000 5 GALON",
    "presentacion": "Cuñete 5 galones",
    "capacidad_galones": 5,
    "equivalencia_kg": 26,
    "costo_unitario_sin_iva": 46.57,
    "pvp_colombia": 77.00,
    "stock_actual": 0,
    "stock_minimo": 0,
    "observaciones": "Costo = 180693/3880"
  },
  {
    "codigo": "SAFE-PRIMER-1GL-BCO",
    "nombre": "SAFE (PRIMER) GL BLANCO",
    "presentacion": "Galón",
    "capacidad_galones": 1,
    "equivalencia_kg": 3.65,
    "costo_unitario_sin_iva": 3.2325,
    "pvp_colombia": 6.00,
    "stock_actual": 0,
    "stock_minimo": 0,
    "observaciones": "Stock agotado"
  },
  {
    "codigo": "SAFE-PRIMER-5GL-BCO",
    "nombre": "SAFE (PRIMER) 5 GL BLANCO",
    "presentacion": "Cuñete 5 galones",
    "capacidad_galones": 5,
    "equivalencia_kg": 18,
    "costo_unitario_sin_iva": 13.88,
    "pvp_colombia": 26.00,
    "stock_actual": 0,
    "stock_minimo": 0,
    "observaciones": "Costo = 53847/3880"
  },
  {
    "codigo": "SILICON-5GL",
    "nombre": "SILICON 5 GL",
    "presentacion": "Cuñete 5 galones",
    "capacidad_galones": 5,
    "equivalencia_kg": 16,
    "costo_unitario_sin_iva": 61.51,
    "pvp_colombia": 120.00,
    "stock_actual": 0,
    "stock_minimo": 0,
    "observaciones": "Costo = 238654/3880"
  },
  {
    "codigo": "ANDEZ-1GL-BCO",
    "nombre": "ANDEZ GL BLANCO",
    "presentacion": "Galón",
    "capacidad_galones": 1,
    "equivalencia_kg": 7,
    "costo_unitario_sin_iva": 4.56,
    "pvp_colombia": 4.97,
    "stock_actual": 1506,
    "stock_minimo": 0,
    "observaciones": "Cloud 1 GL"
  },
  {
    "codigo": "ANDEZ-5GL-BCO",
    "nombre": "ANDEZ 5 GL BLANCO",
    "presentacion": "Cuñete 5 galones",
    "capacidad_galones": 5,
    "equivalencia_kg": 7,
    "costo_unitario_sin_iva": 19.78,
    "pvp_colombia": 24.66,
    "stock_actual": 77,
    "stock_minimo": 0,
    "observaciones": "Cloud 5 GL"
  },
  {
    "codigo": "ANDEZ-1GL-COLOR",
    "nombre": "ANDEZGL COLOR",
    "presentacion": "Galón",
    "capacidad_galones": 1,
    "equivalencia_kg": 7,
    "costo_unitario_sin_iva": 4.56,
    "pvp_colombia": 5.70,
    "stock_actual": null,
    "stock_minimo": 0,
    "observaciones": ""
  },
  {
    "codigo": "PARTY-1GL-CLBG",
    "nombre": "PARTY GL CLARO BLANCO y beige",
    "presentacion": "Galón",
    "capacidad_galones": 1,
    "equivalencia_kg": 6,
    "costo_unitario_sin_iva": 3.35,
    "pvp_colombia": 4.50,
    "stock_actual": 509,
    "stock_minimo": 0,
    "observaciones": "Party 1 galón"
  },
  {
    "codigo": "PARTY-1GL-OSC",
    "nombre": "PARTYGL OSCUROS",
    "presentacion": "Galón",
    "capacidad_galones": 1,
    "equivalencia_kg": 6,
    "costo_unitario_sin_iva": 3.35,
    "pvp_colombia": 4.50,
    "stock_actual": null,
    "stock_minimo": 0,
    "observaciones": ""
  },
  {
    "codigo": "PARTY-5GL-CLBG",
    "nombre": "PARTY 5 GL balnco y beige",
    "presentacion": "Cuñete 5 galones",
    "capacidad_galones": 5,
    "equivalencia_kg": 30,
    "costo_unitario_sin_iva": 14.76,
    "pvp_colombia": 16.36,
    "stock_actual": 229,
    "stock_minimo": 0,
    "observaciones": "Party cuñete"
  },
  {
    "codigo": "GLAM-1GL-CLARO",
    "nombre": "GLAM GL CLARO",
    "presentacion": "Galón",
    "capacidad_galones": 1,
    "equivalencia_kg": 6,
    "costo_unitario_sin_iva": 8.26,
    "pvp_colombia": 8.54,
    "stock_actual": null,
    "stock_minimo": 0,
    "observaciones": "Costo = 33762.9/4085"
  },
  {
    "codigo": "GLAM-5GL-CLARO",
    "nombre": "GLAM 5GL CLARO",
    "presentacion": "Cuñete 5 galones",
    "capacidad_galones": 5,
    "equivalencia_kg": 30,
    "costo_unitario_sin_iva": null,
    "pvp_colombia": 32.15,
    "stock_actual": null,
    "stock_minimo": 0,
    "observaciones": "Costo no especificado"
  },
  {
    "codigo": "GLAM-1GL-OSCURO",
    "nombre": "GLAM GL OSCURO",
    "presentacion": "Galón",
    "capacidad_galones": 1,
    "equivalencia_kg": 6,
    "costo_unitario_sin_iva": null,
    "pvp_colombia": 10.99,
    "stock_actual": null,
    "stock_minimo": 0,
    "observaciones": ""
  },
  {
    "codigo": "LUX-1GL-CLARO",
    "nombre": "LUX GLCLARO",
    "presentacion": "Galón",
    "capacidad_galones": 1,
    "equivalencia_kg": 6,
    "costo_unitario_sin_iva": 9.38,
    "pvp_colombia": 11.65,
    "stock_actual": null,
    "stock_minimo": 0,
    "observaciones": "Costo = 38334.1/4085"
  },
  {
    "codigo": "LUX-5GL-CLARO",
    "nombre": "LUX 5 GL CLARO",
    "presentacion": "Cuñete 5 galones",
    "capacidad_galones": 5,
    "equivalencia_kg": 30,
    "costo_unitario_sin_iva": 34.82,
    "pvp_colombia": 39.00,
    "stock_actual": null,
    "stock_minimo": 0,
    "observaciones": "Costo = 142277/4085"
  },
  {
    "codigo": "LUX-1GL-OSCURO",
    "nombre": "LUX GL OSCURO",
    "presentacion": "Galón",
    "capacidad_galones": 1,
    "equivalencia_kg": 6,
    "costo_unitario_sin_iva": 12.14,
    "pvp_colombia": 16.25,
    "stock_actual": null,
    "stock_minimo": 0,
    "observaciones": "Costo = 49611.5/4085"
  },
  {
    "codigo": "LUX-5GL-OSCURO",
    "nombre": "LUX 5 GL OSCURO",
    "presentacion": "Cuñete 5 galones",
    "capacidad_galones": 5,
    "equivalencia_kg": 30,
    "costo_unitario_sin_iva": 48.63,
    "pvp_colombia": null,
    "stock_actual": null,
    "stock_minimo": 0,
    "observaciones": "Costo = 198664/4085; PVP no definido"
  },
  {
    "codigo": "ULTRA-WHITE-1GL-SAT",
    "nombre": "ULTRA WHITE GL SATINADO",
    "presentacion": "Galón",
    "capacidad_galones": 1,
    "equivalencia_kg": 6,
    "costo_unitario_sin_iva": 10.69,
    "pvp_colombia": 14.00,
    "stock_actual": null,
    "stock_minimo": 0,
    "observaciones": ""
  },
  {
    "codigo": "ULTRA-WHITE-5GL-SAT",
    "nombre": "ULTRA WHITE 5 GL SATINADO",
    "presentacion": "Cuñete 5 galones",
    "capacidad_galones": 5,
    "equivalencia_kg": 30,
    "costo_unitario_sin_iva": 43.36,
    "pvp_colombia": 60.00,
    "stock_actual": null,
    "stock_minimo": 0,
    "observaciones": ""
  },
  {
    "codigo": "ULTRA-WHITE-1GL-MATE",
    "nombre": "ULTRA WHITE GL MATE",
    "presentacion": "Galón",
    "capacidad_galones": 1,
    "equivalencia_kg": 6,
    "costo_unitario_sin_iva": 10.69,
    "pvp_colombia": 14.00,
    "stock_actual": null,
    "stock_minimo": 0,
    "observaciones": "Costo = 43673.5/4085.02"
  },
  {
    "codigo": "ULTRA-WHITE-5GL-MATE",
    "nombre": "ULTRA WHITE 5 GL MATE",
    "presentacion": "Cuñete 5 galones",
    "capacidad_galones": 5,
    "equivalencia_kg": 30,
    "costo_unitario_sin_iva": 43.36,
    "pvp_colombia": 60.00,
    "stock_actual": null,
    "stock_minimo": 0,
    "observaciones": ""
  },
  {
    "codigo": "YESO-POLVO-20KG",
    "nombre": "YESO EN POLVO",
    "presentacion": "Saco 20 kg",
    "capacidad_galones": 0.25,
    "equivalencia_kg": 20,
    "costo_unitario_sin_iva": 3.00,
    "pvp_colombia": 3.65,
    "stock_actual": null,
    "stock_minimo": 0,
    "observaciones": "No es líquido, medida en kg"
  },
  {
    "codigo": "IMAF-GRIS-5GL",
    "nombre": "IMAF GRIS",
    "presentacion": "Cuñete 5 galones",
    "capacidad_galones": 5,
    "equivalencia_kg": 27,
    "costo_unitario_sin_iva": 25.52,
    "pvp_colombia": 37.00,
    "stock_actual": null,
    "stock_minimo": 0,
    "observaciones": ""
  },
  {
    "codigo": "QUICK-PRO-025-CL",
    "nombre": "quick PRO esmalte 1/4 claros",
    "presentacion": "1/4 Galón",
    "capacidad_galones": 0.25,
    "equivalencia_kg": 1.5,
    "costo_unitario_sin_iva": null,
    "pvp_colombia": 3.20,
    "stock_actual": null,
    "stock_minimo": 0,
    "observaciones": "Costo no disponible"
  },
  {
    "codigo": "QUICK-PRO-025-OS",
    "nombre": "quick PRO esmalte 1/4 oscuros",
    "presentacion": "1/4 Galón",
    "capacidad_galones": 0.25,
    "equivalencia_kg": 1.5,
    "costo_unitario_sin_iva": null,
    "pvp_colombia": 3.20,
    "stock_actual": null,
    "stock_minimo": 0,
    "observaciones": "Costo no disponible"
  },
  {
    "codigo": "QUICK-PRO-1GL-CL",
    "nombre": "quick PRO esmalte 1 gl claros",
    "presentacion": "Galón",
    "capacidad_galones": 1,
    "equivalencia_kg": 6,
    "costo_unitario_sin_iva": null,
    "pvp_colombia": 9.74,
    "stock_actual": null,
    "stock_minimo": 0,
    "observaciones": ""
  },
  {
    "codigo": "QUICK-PRO-1GL-OS",
    "nombre": "quick PRO esmalte 1 gl oscuros",
    "presentacion": "Galón",
    "capacidad_galones": 1,
    "equivalencia_kg": 6,
    "costo_unitario_sin_iva": null,
    "pvp_colombia": 9.74,
    "stock_actual": null,
    "stock_minimo": 0,
    "observaciones": ""
  },
  {
    "codigo": "FONDEX-PRO-025-CL",
    "nombre": "fondex pro 1/4 claro",
    "presentacion": "1/4 Galón",
    "capacidad_galones": 0.25,
    "equivalencia_kg": 1.5,
    "costo_unitario_sin_iva": 2.93,
    "pvp_colombia": 3.11,
    "stock_actual": null,
    "stock_minimo": 0,
    "observaciones": "Costo = 11987.1/4085.03"
  },
  {
    "codigo": "FONDEX-PRO-1GL",
    "nombre": "fondex pro 1 gl",
    "presentacion": "Galón",
    "capacidad_galones": 1,
    "equivalencia_kg": 6,
    "costo_unitario_sin_iva": 8.23,
    "pvp_colombia": 9.25,
    "stock_actual": null,
    "stock_minimo": 0,
    "observaciones": "Costo = 33613/4085.02"
  },
  {
    "codigo": "ALKYD-025-CL",
    "nombre": "alkyd 1/4 claros",
    "presentacion": "1/4 Galón",
    "capacidad_galones": 0.25,
    "equivalencia_kg": 1.5,
    "costo_unitario_sin_iva": 3.02,
    "pvp_colombia": 3.21,
    "stock_actual": null,
    "stock_minimo": 0,
    "observaciones": "Costo = 12323.3/4085.03"
  },
  {
    "codigo": "ALKYD-025-OS",
    "nombre": "alkyd 1/4 oscuros",
    "presentacion": "1/4 Galón",
    "capacidad_galones": 0.25,
    "equivalencia_kg": 1.5,
    "costo_unitario_sin_iva": 3.02,
    "pvp_colombia": 3.21,
    "stock_actual": null,
    "stock_minimo": 0,
    "observaciones": "Costo = 12323.3/4085.03"
  },
  {
    "codigo": "ALKYD-1GL-CL",
    "nombre": "alkyd 1 gl claros",
    "presentacion": "Galón",
    "capacidad_galones": 1,
    "equivalencia_kg": 6,
    "costo_unitario_sin_iva": 9.25,
    "pvp_colombia": 10.17,
    "stock_actual": null,
    "stock_minimo": 0,
    "observaciones": "Costo = 37815/4085.02"
  },
  {
    "codigo": "ALKYD-1GL-OS",
    "nombre": "alkyd 1 gl oscuros",
    "presentacion": "Galón",
    "capacidad_galones": 1,
    "equivalencia_kg": 6,
    "costo_unitario_sin_iva": 9.25,
    "pvp_colombia": 10.17,
    "stock_actual": null,
    "stock_minimo": 0,
    "observaciones": "Costo = 37815/4085.02"
  },
  {
    "codigo": "ALKYD-3X1-025-CL",
    "nombre": "alkyd 3*1 1/4 claro",
    "presentacion": "1/4 Galón",
    "capacidad_galones": 0.25,
    "equivalencia_kg": 1.5,
    "costo_unitario_sin_iva": null,
    "pvp_colombia": 4.70,
    "stock_actual": null,
    "stock_minimo": 0,
    "observaciones": ""
  },
  {
    "codigo": "ALKYD-3X1-025-OS",
    "nombre": "alkyd 3*1 1/4 oscuro",
    "presentacion": "1/4 Galón",
    "capacidad_galones": 0.25,
    "equivalencia_kg": 1.5,
    "costo_unitario_sin_iva": null,
    "pvp_colombia": 4.70,
    "stock_actual": null,
    "stock_minimo": 0,
    "observaciones": ""
  },
  {
    "codigo": "ALKYD-3X1-1GL-CL",
    "nombre": "alkyd 3*1 gl claros",
    "presentacion": "Galón",
    "capacidad_galones": 1,
    "equivalencia_kg": 6,
    "costo_unitario_sin_iva": null,
    "pvp_colombia": 14.57,
    "stock_actual": null,
    "stock_minimo": 0,
    "observaciones": ""
  },
  {
    "codigo": "ALKYD-3X1-1GL-OS",
    "nombre": "alkyd 3*1 gl oscuros",
    "presentacion": "Galón",
    "capacidad_galones": 1,
    "equivalencia_kg": 6,
    "costo_unitario_sin_iva": null,
    "pvp_colombia": 14.57,
    "stock_actual": null,
    "stock_minimo": 0,
    "observaciones": ""
  }
];

async function main() {
  const users = await prisma.user.findMany({ take: 1, select: { id: true } });
  if (!users.length) {
    console.error("No users found to set as creator");
    return;
  }
  const creatorId = users[0].id;

  let insertedCount = 0;
  let skippedCount = 0;

  for (const item of data) {
    const exists = await prisma.product.findFirst({
      where: { codigo: item.codigo }
    });

    if (exists) {
      console.log(`Skipping existing product: ${item.codigo}`);
      skippedCount++;
      continue;
    }

    await prisma.product.create({
      data: {
        codigo: item.codigo,
        nombre: item.nombre,
        nombre_corto: item.nombre.substring(0, 50),
        presentacion: item.presentacion,
        capacidad_gal: String(item.capacidad_galones || 0),
        equivalencia_kg: String(item.equivalencia_kg || 0),
        costo_unitario_sin_iva: String(item.costo_unitario_sin_iva || 0),
        pvp_colombia: String(item.pvp_colombia || 0),
        factor_venezuela: "1.4", // Default as per schema? Or just "1"
        stock_actual: String(item.stock_actual || 0),
        stock_minimo: String(item.stock_minimo || 0),
        activo: true,
        observaciones: "", // USER REQUEST: djalos todos vacias
        created_by: creatorId,
      }
    });

    console.log(`Inserted product: ${item.codigo}`);
    insertedCount++;
  }

  console.log(`\nImport completed:`);
  console.log(`Inserted: ${insertedCount}`);
  console.log(`Skipped: ${skippedCount}`);
  console.log(`Total processed: ${data.length}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
