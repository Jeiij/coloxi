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
    } = query;

    const skip = (page - 1) * limit;

    const where: Prisma.InventoryItemWhereInput = {};

    if (search) {
      where.producto = {
        OR: [
          { codigo: { contains: search, mode: 'insensitive' } },
          { nombre: { contains: search, mode: 'insensitive' } },
        ],
      };
    }

    // Filtrar stock bajo: stock_actual < stock_minimo usando raw SQL para comparar columnas
    if (stock_bajo === true) {
      const ids = await this.prisma.$queryRaw<{ id: string }[]>`
        SELECT id FROM inventario_interno
        WHERE stock_actual > 0 AND stock_actual < stock_minimo
      `;
      where.id = { in: ids.map((r) => r.id) };
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
      },
      include: {
        producto: {
          select: { id: true, codigo: true, nombre: true, presentacion: true },
        },
      },
    });
  }

  /**
   * Eliminar un producto del inventario interno (no borra del maestro).
   */
  async remove(id: string) {
    const item = await this.prisma.inventoryItem.findUnique({ where: { id } });
    if (!item) {
      throw new NotFoundException(`Ítem de inventario ${id} no encontrado`);
    }

    await this.prisma.inventoryItem.delete({ where: { id } });
    this.logger.log(`Ítem ${id} eliminado del inventario interno`);
    return { message: 'Producto removido del inventario interno' };
  }

  /**
   * Obtener estadísticas del inventario interno usando agregaciones SQL.
   */
  async getStats() {
    const result = await this.prisma.$queryRaw<
      { total_items: bigint; stock_bajo: bigint; agotados: bigint }[]
    >`
      SELECT
        COUNT(*)                                                          AS total_items,
        COUNT(*) FILTER (WHERE stock_actual > 0 AND stock_actual < stock_minimo) AS stock_bajo,
        COUNT(*) FILTER (WHERE stock_actual <= 0)                        AS agotados
      FROM inventario_interno
    `;

    const row = result[0];
    const total = Number(row.total_items);
    const stockBajo = Number(row.stock_bajo);
    const agotados = Number(row.agotados);

    return {
      total_items: total,
      stock_bajo: stockBajo,
      agotados,
      ok: total - stockBajo - agotados,
    };
  }
}
