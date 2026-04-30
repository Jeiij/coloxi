import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { QueryInventoryDto } from './dto/query-inventory.dto';
import { CreateInventoryItemDto, UpdateInventoryItemDto } from './dto/inventory-item.dto';
import { PaginatedResult } from '../../common/interfaces/paginated-result.interface';
import { Prisma } from '@prisma/client';

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Listar ítems del inventario interno con datos del producto asociado.
   */
  async findAll(query: QueryInventoryDto): Promise<PaginatedResult<any>> {
    const {
      page = 1,
      limit = 20,
      search,
      stock_bajo,
      orderBy = 'producto_nombre',
      orderDir = 'asc',
      activo = true,
    } = query;

    const skip = (page - 1) * limit;

    const where: Prisma.InventoryItemWhereInput = {};
    if (activo !== 'all') {
      where.activo = activo as boolean;
    }

    if (search) {
      where.producto = {
        OR: [
          { codigo: { contains: search, mode: 'insensitive' } },
          { nombre: { contains: search, mode: 'insensitive' } },
        ],
      };
    }

    // Filtrar stock bajo: stock_actual < stock_minimo
    if (stock_bajo === true) {
      where.AND = [
        {
          stock_actual: {
            lt: Prisma.raw('stock_minimo') as any,
          },
        },
      ];
    }

    // Determinar ordenamiento
    let prismaOrderBy: any = {};
    if (orderBy === 'producto_nombre') {
      prismaOrderBy = { producto: { nombre: orderDir } };
    } else {
      prismaOrderBy = { [orderBy]: orderDir };
    }

    const [total, items] = await Promise.all([
      this.prisma.inventoryItem.count({ where }),
      this.prisma.inventoryItem.findMany({
        where,
        skip,
        take: limit,
        orderBy: prismaOrderBy,
        include: {
          producto: {
            select: {
              id: true,
              codigo: true,
              nombre: true,
              nombre_corto: true,
              presentacion: true,
              capacidad_gal: true,
              equivalencia_kg: true,
              costo_unitario_sin_iva: true,
              pvp_colombia: true,
              activo: true,
              categoria: true,
              linea: true,
              marca: true,
              imagenes: {
                where: { es_principal: true },
                take: 1,
              },
            },
          },
        },
      }),
    ]);

    // Aplanar para el front
    const data = items.map((item) => {
      const { producto, ...inv } = item;
      const { imagenes, ...prod } = producto;
      return {
        ...inv,
        producto: {
          ...prod,
          imagen_principal: imagenes[0]?.url_imagen || null,
        },
      };
    });

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Agregar un producto del maestro al inventario interno.
   */
  async create(dto: CreateInventoryItemDto) {
    // Verificar que el producto existe
    const product = await this.prisma.product.findUnique({ where: { id: dto.producto_id } });
    if (!product) {
      throw new NotFoundException(`Producto ${dto.producto_id} no encontrado en el maestro`);
    }

    // Verificar que no esté ya en el inventario
    const existing = await this.prisma.inventoryItem.findUnique({
      where: { producto_id: dto.producto_id },
    });
    if (existing) {
      throw new ConflictException('Este producto ya está en el inventario interno');
    }

    const item = await this.prisma.inventoryItem.create({
      data: {
        producto_id: dto.producto_id,
        stock_actual: dto.stock_actual ?? 0,
        stock_minimo: dto.stock_minimo ?? 0,
      },
      include: {
        producto: {
          select: { id: true, codigo: true, nombre: true, presentacion: true },
        },
      },
    });

    this.logger.log(`Producto ${product.codigo} añadido al inventario interno`);
    return item;
  }

  /**
   * Actualizar stock de un ítem del inventario.
   */
  async update(id: string, dto: UpdateInventoryItemDto) {
    const item = await this.prisma.inventoryItem.findUnique({ where: { id } });
    if (!item) {
      throw new NotFoundException(`Ítem de inventario ${id} no encontrado`);
    }

    return this.prisma.inventoryItem.update({
      where: { id },
      data: {
        ...(dto.stock_actual !== undefined && { stock_actual: dto.stock_actual }),
        ...(dto.stock_minimo !== undefined && { stock_minimo: dto.stock_minimo }),
        ...(dto.activo !== undefined && { activo: dto.activo }),
      },
      include: {
        producto: {
          select: { id: true, codigo: true, nombre: true, presentacion: true },
        },
      },
    });
  }

  /**
   * Inhabilitar/Habilitar un producto del inventario interno.
   * Esto funciona como un soft-delete local.
   */
  async toggleActive(id: string) {
    const item = await this.prisma.inventoryItem.findUnique({ where: { id } });
    if (!item) {
      throw new NotFoundException(`Ítem de inventario ${id} no encontrado`);
    }

    const updated = await this.prisma.inventoryItem.update({
      where: { id },
      data: { activo: !item.activo },
    });
    this.logger.log(`Ítem ${id} ahora está ${updated.activo ? 'activo' : 'inactivo'} en el inventario interno`);
    return { message: `Producto ${updated.activo ? 'rehabilitado' : 'inhabilitado'} en el inventario` };
  }

  /**
   * Obtener estadísticas del inventario interno (para KPIs del dashboard).
   */
  async getStats() {
    // Optimización: usar consultas a nivel de base de datos en vez de cargar todo en memoria.
    const [totalResult, agotadosResult, stockBajoResult] = await Promise.all([
      this.prisma.inventoryItem.count({ where: { activo: true } }),
      this.prisma.inventoryItem.count({ where: { activo: true, stock_actual: { lte: 0 } } }),
      this.prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*)::bigint as count 
        FROM inventario_interno 
        WHERE activo = true AND stock_actual > 0 AND stock_actual < stock_minimo
      `
    ]);

    const total = totalResult;
    const agotados = agotadosResult;
    const stockBajo = Number(stockBajoResult[0]?.count || 0);

    return {
      total_items: total,
      stock_bajo: stockBajo,
      agotados,
      ok: total - stockBajo - agotados,
    };
  }

  /**
   * Procesar entrada de inventario desde una orden aprobada.
   * Recibe un cliente de transacción para mantener atomicidad con el cambio de estado.
   */
  async processOrderItems(
    tx: Parameters<Parameters<typeof this.prisma.$transaction>[0]>[0],
    items: Array<{ producto_id: number; producto_codigo: string; cantidad: any }>,
  ) {
    for (const item of items) {
      const qtyToSum = Number(item.cantidad);

      const inventoryItem = await tx.inventoryItem.findUnique({
        where: { producto_id: item.producto_id },
      });

      if (inventoryItem) {
        await tx.inventoryItem.update({
          where: { id: inventoryItem.id },
          data: {
            stock_actual: { increment: qtyToSum },
            activo: true, // Auto-reactivar si estaba inhabilitado
            updated_at: new Date(),
          },
        });
        this.logger.log(`Stock actualizado para ${item.producto_codigo}: +${qtyToSum}`);
      } else {
        await tx.inventoryItem.create({
          data: {
            producto_id: item.producto_id,
            stock_actual: qtyToSum,
            stock_minimo: 0,
          },
        });
        this.logger.log(`Nuevo ítem creado en inventario para ${item.producto_codigo} con stock: ${qtyToSum}`);
      }
    }
  }
}
