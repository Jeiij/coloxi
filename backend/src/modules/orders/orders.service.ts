import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { AddOrderItemDto } from './dto/add-order-item.dto';
import { QueryOrdersDto } from './dto/query-orders.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { FinancialCalculatorService } from './financial-calculator.service';
import { InventoryService } from '../inventory/inventory.service';
import { PaginatedResult } from '../../common/interfaces/paginated-result.interface';
import { Prisma } from '@prisma/client';

/** Campos financieros que se ocultan al rol JEFE_COMPRA */
const SENSITIVE_FIELDS = [
  'ganancia_colombia_unitaria',
  'ganancia_colombia_total',
  'margen_colombia_porcentaje',
  'ganancia_venezuela_unitaria',
  'ganancia_venezuela_total',
] as const;

const VALID_TRANSITIONS: Record<string, string[]> = {
  BORRADOR: ['ENVIADA'],
  ENVIADA: ['FINALIZADA', 'RECHAZADA'],
  FINALIZADA: [], // Estado terminal
  RECHAZADA: [],
};

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private prisma: PrismaService,
    private financialCalculator: FinancialCalculatorService,
    private inventoryService: InventoryService,
  ) {}

  /**
   * Crear una nueva orden de compra en estado BORRADOR.
   * Toma IVA y Factor Venezuela de `parametros_sistema`.
   */
  async create(dto: CreateOrderDto, userId: string) {
    // Obtener parámetros vigentes del sistema
    const [ivaParam, factorParam] = await Promise.all([
      this.prisma.systemParameter.findUnique({ where: { clave: 'IVA_PORCENTAJE' } }),
      this.prisma.systemParameter.findUnique({ where: { clave: 'FACTOR_VENEZUELA' } }),
    ]);

    const iva = ivaParam ? parseFloat(ivaParam.valor) : 19.0;
    const factor = factorParam ? parseFloat(factorParam.valor) : 1.4;

    // Código profesional secuencial: OC-AA-NNNN (ej: OC-26-0001)
    const year = new Date().getFullYear().toString().slice(-2);
    const prefix = `OC-${year}-`;

    const lastOrder = await this.prisma.order.findFirst({
      where: { codigo: { startsWith: prefix } },
      orderBy: { codigo: 'desc' },
      select: { codigo: true }
    });

    let nextNum = 1;
    if (lastOrder) {
      const parts = lastOrder.codigo.split('-');
      const lastNum = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(lastNum)) {
        nextNum = lastNum + 1;
      }
    }

    const codigo = `${prefix}${nextNum.toString().padStart(4, '0')}`;

    const order = await this.prisma.order.create({
      data: {
        codigo,
        mercado: dto.mercado,
        observaciones: dto.observaciones,
        iva_porcentaje: iva,
        factor_venezuela: factor,
        created_by: userId,
      },
      include: {
        creator: { select: { id: true, nombre_completo: true } },
      },
    });

    this.logger.log(`Orden ${codigo} creada por usuario ${userId}`);
    return order;
  }

  async findAll(query: QueryOrdersDto, userId: string): Promise<PaginatedResult<any>> {
    const { page = 1, limit = 20, estado, mercado, search } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.OrderWhereInput = {};
    if (mercado) where.mercado = mercado;
    if (search) {
      where.codigo = { contains: search, mode: 'insensitive' };
    }

    // Lógica de privacidad:
    // 1. Si se pide explícitamente BORRADOR, mostrar solo los del usuario.
    // 2. Si no hay filtro de estado, mostrar (Borradores Propios) OR (Cualquiera que no sea Borrador).
    if (estado === 'BORRADOR') {
      where.estado = 'BORRADOR';
      where.created_by = userId;
    } else if (estado) {
      where.estado = estado;
    } else {
      // Mostrar borradores propios O cualquier orden enviada/finalizada/etc
      where.OR = [
        { estado: { not: 'BORRADOR' } },
        { AND: [{ estado: 'BORRADOR' }, { created_by: userId }] },
      ];
    }

    const [total, orders] = await Promise.all([
      this.prisma.order.count({ where }),
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          creator: { select: { id: true, nombre_completo: true } },
          _count: { select: { detalles: true } },
        },
      }),
    ]);

    return {
      data: orders,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Detalle completo de una orden con todos sus ítems.
   * Aplica ocultación de campos sensibles si el usuario es JEFE_COMPRA.
   * Restringe el acceso a borradores ajenos.
   */
  async findOne(id: string, userRole: string, userId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        creator: { select: { id: true, nombre_completo: true } },
        detalles: {
          include: {
            producto: {
              select: {
                id: true,
                imagenes: { where: { es_principal: true }, take: 1 },
              },
            },
          },
          orderBy: { created_at: 'asc' },
        },
      },
    });

    if (!order) {
      throw new NotFoundException(`Orden con ID ${id} no encontrada`);
    }

    // Seguridad: Si es borrador, solo el creador puede verlo
    if (order.estado === 'BORRADOR' && order.created_by !== userId) {
      throw new ForbiddenException('No tienes permiso para ver este borrador ajeno');
    }

    // Ocultar campos financieros sensibles para JEFE_COMPRA
    if (userRole === 'JEFE_COMPRA') {
      order.detalles = order.detalles.map((d) => {
        const filtered = { ...d } as any;
        for (const field of SENSITIVE_FIELDS) {
          delete filtered[field];
        }
        return filtered;
      });
    }

    return order;
  }

  async update(id: string, observaciones: string, userId: string) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException(`Orden ${id} no encontrada`);
    
    if (order.estado === 'BORRADOR' && order.created_by !== userId) {
      throw new ForbiddenException('No tienes permiso para modificar este borrador');
    }

    return this.prisma.order.update({
      where: { id },
      data: { observaciones }
    });
  }

  async getPendingCount() {
    const count = await this.prisma.order.count({
      where: { estado: 'ENVIADA' }
    });
    return { count };
  }

  /**
   * Agregar un ítem a una orden en estado BORRADOR.
   * Realiza el SNAPSHOT completo del producto y calcula todos los totales financieros.
   */
  async addItem(orderId: string, dto: AddOrderItemDto, userId: string) {
    // 1. Verificar que la orden existe y está en BORRADOR
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException(`Orden ${orderId} no encontrada`);
    
    if (order.estado !== 'BORRADOR') {
      throw new BadRequestException('Solo se pueden agregar ítems a órdenes en estado BORRADOR');
    }

    if (order.created_by !== userId) {
      throw new ForbiddenException('Solo el creador puede agregar ítems a este borrador');
    }

    // 2. Buscar el producto con sus colores disponibles
    const product = await this.prisma.product.findUnique({
      where: { id: dto.producto_id },
      include: {
        imagenes: { where: { es_principal: true }, take: 1 },
        colores: { include: { color: true } },
      },
    });
    if (!product) throw new NotFoundException(`Producto ${dto.producto_id} no encontrado`);

    // 3. Resolver color
    let colorNombre = 'Sin color';
    if (product.colores.length > 0) {
      const resolvedColorId = dto.color_id || product.colores[0].color_id;
      const colorMatch = product.colores.find((c) => c.color_id === resolvedColorId);
      if (!colorMatch) {
        const available = product.colores.map((c) => `${c.color.nombre} (id: ${c.color_id})`).join(', ');
        throw new BadRequestException(
          `El color con ID ${resolvedColorId} no está disponible para este producto. Colores válidos: ${available}`,
        );
      }
      colorNombre = colorMatch.color.nombre;
    }

    // 4. Calcular financieros usando el servicio dedicado
    const calc = this.financialCalculator.calculate({
      costo_unitario_sin_iva: Number(product.costo_unitario_sin_iva),
      pvp_colombia: Number(product.pvp_colombia),
      pvp_venezuela: Number(product.pvp_venezuela),
      factor_venezuela: Number(product.factor_venezuela),
      capacidad_gal: Number(product.capacidad_gal),
      equivalencia_kg: Number(product.equivalencia_kg),
      cantidad: Number(dto.cantidad),
      iva_porcentaje: Number(order.iva_porcentaje),
      pvp_venezuela_manual: dto.pvp_venezuela ? Number(dto.pvp_venezuela) : undefined,
    });

    // 5. Guardar snapshot completo
    const detail = await this.prisma.orderDetail.create({
      data: {
        orden_compra_id: orderId,
        producto_id: product.id,
        producto_codigo: product.codigo ?? '',
        producto_nombre: product.nombre,
        presentacion: product.presentacion,
        color_nombre: colorNombre,
        capacidad_gal: Number(product.capacidad_gal),
        equivalencia_kg: Number(product.equivalencia_kg),
        ...calc,
        foto_url: product.imagenes[0]?.url_imagen || null,
      },
    });

    this.logger.log(`Ítem ${detail.id} agregado a orden ${orderId} (Producto: ${product.codigo}, Color: ${colorNombre})`);
    return detail;
  }

  /**
   * Eliminar un ítem de una orden. Solo permitido si la orden está en BORRADOR.
   */
  async removeItem(orderId: string, itemId: string, userId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException(`Orden ${orderId} no encontrada`);
    if (order.estado !== 'BORRADOR') {
      throw new BadRequestException('Solo se pueden eliminar ítems de órdenes en estado BORRADOR');
    }

    if (order.created_by !== userId) {
      throw new ForbiddenException('Solo el creador puede eliminar ítems de este borrador');
    }

    const detail = await this.prisma.orderDetail.findFirst({
      where: { id: itemId, orden_compra_id: orderId },
    });
    if (!detail) throw new NotFoundException(`Ítem ${itemId} no encontrado en esta orden`);

    await this.prisma.orderDetail.delete({ where: { id: itemId } });
    this.logger.log(`Ítem ${itemId} eliminado de orden ${orderId}`);
    return { message: 'Ítem eliminado exitosamente' };
  }

  /**
   * Cambiar el estado de una orden.
   * Transiciones válidas: BORRADOR → ENVIADA → FINALIZADA
   */
  async updateStatus(orderId: string, dto: UpdateOrderStatusDto, userId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException(`Orden ${orderId} no encontrada`);

    const allowed = VALID_TRANSITIONS[order.estado] || [];
    if (!allowed.includes(dto.estado)) {
      throw new BadRequestException(
        `No se puede cambiar de ${order.estado} a ${dto.estado}. Transiciones válidas: ${allowed.join(', ') || 'ninguna (estado terminal)'}`,
      );
    }

    // Ejecutar todo en una transacción atómica
    const updated = await this.prisma.$transaction(async (tx) => {
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: { estado: dto.estado },
        include: {
          creator: { select: { id: true, nombre_completo: true } },
          detalles: true,
        },
      });

      // Delegar actualización de inventario al servicio especializado
      if (dto.estado === 'FINALIZADA') {
        this.logger.log(`Procesando entrada de inventario para orden ${orderId}...`);
        await this.inventoryService.processOrderItems(tx, updatedOrder.detalles);
      }

      return updatedOrder;
    });

    return updated;
  }

  /**
   * Eliminar una orden por completo. Solo permitido si está en BORRADOR.
   */
  async remove(orderId: string, userId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException(`Orden ${orderId} no encontrada`);
    if (order.estado !== 'BORRADOR') {
      throw new BadRequestException('Solo se pueden eliminar órdenes en estado BORRADOR');
    }

    if (order.created_by !== userId) {
      throw new ForbiddenException('Solo el creador puede eliminar este borrador');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.orderDetail.deleteMany({ where: { orden_compra_id: orderId } });
      await tx.order.delete({ where: { id: orderId } });
    });

    this.logger.log(`Orden ${orderId} eliminada correctamente`);
    return { message: 'Orden eliminada exitosamente' };
  }
}
