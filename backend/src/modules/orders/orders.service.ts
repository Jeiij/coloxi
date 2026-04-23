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

  constructor(private prisma: PrismaService) {}

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

    // Código único basado en timestamp
    const codigo = `OC-${Date.now()}`;

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

    // 3. Resolver color: opcional si el producto no tiene colores configurados
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

    // 4. Extraer parámetros (IVA de la orden, Factor del producto maestro)
    const iva_pct = Number(order.iva_porcentaje);
    const factorVzla = Number(product.factor_venezuela);
    const cantidad = Number(dto.cantidad);

    // 5. Cálculos financieros según fórmulas de Excel proporcionadas
    const G_costoSinIva = Number(product.costo_unitario_sin_iva);
    const H_costoTotalSinIva = G_costoSinIva * cantidad;
    
    // I = G * (1 + IVA/100)
    const I_costoUnitConIva = G_costoSinIva * (1 + iva_pct / 100);
    const J_costoTotalConIva = I_costoUnitConIva * cantidad;

    const L_pvpCol = Number(product.pvp_colombia);
    const M_pvpColTotal = L_pvpCol * cantidad;

    // O = L - G (Ganancia Bruta)
    const O_gananciaBrutaUnit = L_pvpCol - G_costoSinIva;
    const P_gananciaBrutaTotal = O_gananciaBrutaUnit * cantidad;

    // Q = L - I (Ganancia Neta)
    const Q_gananciaNetaUnit = L_pvpCol - I_costoUnitConIva;
    const R_gananciaNetaTotal = Q_gananciaNetaUnit * cantidad;

    // S = O / L (% Ganancia)
    const S_margenPct = L_pvpCol > 0 ? (O_gananciaBrutaUnit / L_pvpCol) * 100 : 0;

    // U = L * Factor (Costo Ajustado Vzla)
    const U_costoAjustadoVzla = L_pvpCol * factorVzla;

    // V = PVP Venezuela (Manual en item, o del producto, o calculado)
    const productPvpVzla = Number(product.pvp_venezuela) > 0 ? Number(product.pvp_venezuela) : U_costoAjustadoVzla;
    const V_pvpVzlaManual = dto.pvp_venezuela ? Number(dto.pvp_venezuela) : productPvpVzla;
    const pvpVzlaTotal = V_pvpVzlaManual * cantidad;

    // W = V - U (Ganancia Venezuela)
    const W_gananciaVzlaUnit = V_pvpVzlaManual - U_costoAjustadoVzla;
    const X_gananciaVzlaTotal = W_gananciaVzlaUnit * cantidad;

    const capGal = Number(product.capacidad_gal);
    const eqKg = Number(product.equivalencia_kg);
    const totalGalones = capGal * cantidad;
    const totalKgs = eqKg * cantidad;

    // 6. Guardar snapshot completo incluyendo color y nuevos campos de ganancia neta
    const detail = await this.prisma.orderDetail.create({
      data: {
        orden_compra_id: orderId,
        producto_id: product.id,
        producto_codigo: product.codigo,
        producto_nombre: product.nombre,
        presentacion: product.presentacion,
        color_nombre: colorNombre,
        capacidad_gal: capGal,
        equivalencia_kg: eqKg,
        cantidad: cantidad,
        total_galones: totalGalones,
        total_kgs: totalKgs,
        costo_unitario_sin_iva: G_costoSinIva,
        costo_total_sin_iva: H_costoTotalSinIva,
        costo_unitario_con_iva: I_costoUnitConIva,
        costo_total_con_iva: J_costoTotalConIva,
        pvp_colombia_unitario: L_pvpCol,
        pvp_colombia_total: M_pvpColTotal,
        ganancia_colombia_unitaria: O_gananciaBrutaUnit,
        ganancia_colombia_total: P_gananciaBrutaTotal,
        ganancia_colombia_neta_unitaria: Q_gananciaNetaUnit,
        ganancia_colombia_neta_total: R_gananciaNetaTotal,
        margen_colombia_porcentaje: S_margenPct,
        costo_ajustado_venezuela: U_costoAjustadoVzla,
        pvp_venezuela_unitario: V_pvpVzlaManual,
        pvp_venezuela_total: pvpVzlaTotal,
        ganancia_venezuela_unitaria: W_gananciaVzlaUnit,
        ganancia_venezuela_total: X_gananciaVzlaTotal,
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

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: { estado: dto.estado },
      include: {
        creator: { select: { id: true, nombre_completo: true } },
        detalles: true,
      },
    });

    // ✅ Si la orden se finaliza, actualizamos el inventario interno
    if (dto.estado === 'FINALIZADA') {
      this.logger.log(`Procesando entrada de inventario para orden ${orderId}...`);
      
      for (const item of updated.detalles) {
        const qtyToSum = Number(item.cantidad);
        
        // Buscar o crear el registro en el inventario interno
        const inventoryItem = await this.prisma.inventoryItem.findUnique({
          where: { producto_id: item.producto_id }
        });

        if (inventoryItem) {
          // Actualizar stock existente
          await this.prisma.inventoryItem.update({
            where: { id: inventoryItem.id },
            data: { 
              stock_actual: { increment: qtyToSum },
              updated_at: new Date()
            }
          });
          this.logger.log(`Stock actualizado para ${item.producto_codigo}: +${qtyToSum}`);
        } else {
          // Crear nuevo registro en inventario (Auto-Match sugerido)
          await this.prisma.inventoryItem.create({
            data: {
              producto_id: item.producto_id,
              stock_actual: qtyToSum,
              stock_minimo: 0, // Por defecto 0, el jefe de compra lo ajustará luego
            }
          });
          this.logger.log(`Nuevo ítem creado en inventario para ${item.producto_codigo} con stock: ${qtyToSum}`);
        }
      }
    }

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

    await this.prisma.orderDetail.deleteMany({ where: { orden_compra_id: orderId } });
    await this.prisma.order.delete({ where: { id: orderId } });
    this.logger.log(`Orden ${orderId} eliminada correctamente`);
    return { message: 'Orden eliminada exitosamente' };
  }
}
