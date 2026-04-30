import { Injectable, NotFoundException } from '@nestjs/common';
import { unlink } from 'fs/promises';
import { join } from 'path';
import { PrismaService } from '../../prisma/prisma.service';
import { QueryProductsDto } from './dto/query-products.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryGlobalHistoryDto } from './dto/query-global-history.dto';
import { PaginatedResult } from '../../common/interfaces/paginated-result.interface';
import { Prisma } from '@prisma/client';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: QueryProductsDto): Promise<PaginatedResult<any>> {
    const { 
      page = 1, 
      limit = 20, 
      search, 
      categoria_id, 
      linea_id, 
      marca_id, 
      activo = true,
      orderBy = 'nombre', 
      orderDir = 'asc' 
    } = query;

    const skip = (page - 1) * limit;

    // Filtro dinámico
    const where: Prisma.ProductWhereInput = {};
    if (activo !== 'all') {
      where.activo = activo as boolean;
    }

    if (search) {
      where.OR = [
        { codigo: { contains: search, mode: 'insensitive' } },
        { nombre: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (categoria_id) where.categoria_id = categoria_id;
    if (linea_id) where.linea_id = linea_id;
    if (marca_id) where.marca_id = marca_id;

    // Ejecutar consultas
    const [total, products] = await Promise.all([
      this.prisma.product.count({ where }),
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [orderBy]: orderDir },
        include: {
          categoria: true,
          linea: true,
          marca: true,
          imagenes: {
            where: { es_principal: true },
            take: 1,
          },
        },
      }),
    ]);

    // Transformar para el listado (imagen principal)
    const data = products.map((p) => {
      const { imagenes, ...rest } = p;
      return {
        ...rest,
        imagen_principal: imagenes[0]?.url_imagen || null,
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

  async findOne(id: number): Promise<any> {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        categoria: true,
        linea: true,
        marca: true,
        colores: {
          include: { color: true },
        },
        imagenes: {
          orderBy: { orden_visual: 'asc' },
        },
        creator: {
          select: { id: true, nombre_completo: true },
        },
        updater: {
          select: { id: true, nombre_completo: true },
        },
      },
    });

    if (!product) {
      throw new NotFoundException(`Producto con ID ${id} no encontrado`);
    }

    // Aplanar colores y transformar respuesta
    const { colores, ...rest } = product;
    return {
      ...rest,
      colores: colores.map((c) => c.color),
    };
  }

  async create(dto: CreateProductDto, userId: string) {
    const { colores_ids, ...productData } = dto;
    const product = await this.prisma.product.create({
      data: {
        ...productData,
        created_by: userId,
        ...(colores_ids?.length && {
          colores: {
            create: colores_ids.map(id => ({ color_id: id }))
          }
        })
      },
    });

    // Autogenerar código secuencial basado en el ID y registrar historial inicial de precios
    const autoCode = `COL-${String(product.id).padStart(3, '0')}`;
    return this.prisma.product.update({
      where: { id: product.id },
      data: { 
        codigo: autoCode,
        historial_precios: {
          create: {
            costo_unitario_sin_iva: product.costo_unitario_sin_iva,
            pvp_colombia: product.pvp_colombia,
            pvp_venezuela: product.pvp_venezuela,
            changed_by: userId
          }
        }
      }
    });
  }

  async update(id: number, dto: UpdateProductDto, userId: string) {
    const { colores_ids, ...productData } = dto;
    
    const oldProduct = await this.prisma.product.findUnique({ where: { id } });
    if (!oldProduct) throw new NotFoundException(`Producto ${id} no encontrado`);

    const priceChanged = 
      (productData.costo_unitario_sin_iva !== undefined && Number(productData.costo_unitario_sin_iva) !== Number(oldProduct.costo_unitario_sin_iva)) ||
      (productData.pvp_colombia !== undefined && Number(productData.pvp_colombia) !== Number(oldProduct.pvp_colombia)) ||
      (productData.pvp_venezuela !== undefined && Number(productData.pvp_venezuela) !== Number(oldProduct.pvp_venezuela));

    // Si envían array de colores, primero borramos los anteriores y luego insertamos los nuevos
    if (colores_ids !== undefined) {
      await this.prisma.colorOnProduct.deleteMany({
        where: { producto_id: id }
      });
    }

    return this.prisma.product.update({
      where: { id },
      data: {
        ...productData,
        updated_by: userId,
        updated_at: new Date(),
        ...(colores_ids?.length && {
          colores: {
            create: colores_ids.map(colorId => ({ color_id: colorId }))
          }
        }),
        ...(priceChanged && {
          historial_precios: {
            create: {
              costo_unitario_sin_iva: productData.costo_unitario_sin_iva ?? oldProduct.costo_unitario_sin_iva,
              pvp_colombia: productData.pvp_colombia ?? oldProduct.pvp_colombia,
              pvp_venezuela: productData.pvp_venezuela ?? oldProduct.pvp_venezuela,
              changed_by: userId
            }
          }
        })
      },
    });
  }

  async getGlobalPriceHistory(query: QueryGlobalHistoryDto) {
    const { mes, anio, usuarioId, productoId, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    let where: any = {};

    if (usuarioId) {
      where.changed_by = usuarioId;
    }

    if (productoId) {
      where.producto_id = productoId;
    }

    // Filtro por fecha (mes/año)
    if (mes || anio) {
      const yearToUse = anio || new Date().getFullYear();
      if (mes) {
        // Rango de un mes específico
        const startDate = new Date(yearToUse, mes - 1, 1);
        const endDate = new Date(yearToUse, mes, 1);
        where.created_at = {
          gte: startDate,
          lt: endDate,
        };
      } else {
        // Todo el año
        const startDate = new Date(yearToUse, 0, 1);
        const endDate = new Date(yearToUse + 1, 0, 1);
        where.created_at = {
          gte: startDate,
          lt: endDate,
        };
      }
    }

    const [data, total] = await Promise.all([
      this.prisma.productPriceHistory.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          user: { select: { id: true, nombre_completo: true } },
          producto: { select: { id: true, nombre: true, codigo: true, presentacion: true } }
        }
      }),
      this.prisma.productPriceHistory.count({ where })
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      }
    };
  }

  async getPriceHistory(id: number) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException(`Producto ${id} no encontrado`);
    
    return this.prisma.productPriceHistory.findMany({
      where: { producto_id: id },
      orderBy: { created_at: 'desc' },
      include: {
        user: { select: { id: true, nombre_completo: true } }
      }
    });
  }

  async toggleActive(id: number, userId: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException(`Producto ${id} no encontrado`);
    
    return this.prisma.product.update({
      where: { id },
      data: { 
        activo: !product.activo,
        updated_by: userId,
        updated_at: new Date()
      }
    });
  }

  async remove(id: number, userId: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException(`Producto ${id} no encontrado`);
    
    // Soft delete: desactivar en vez de eliminar para preservar historial
    return this.prisma.product.update({
      where: { id },
      data: { 
        activo: false,
        updated_by: userId,
        updated_at: new Date()
      }
    });
  }

  // ─── Gestión de Imágenes ──────────────────────────────────────────────────

  async uploadImage(productId: number, file: Express.Multer.File) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException(`Producto ${productId} no encontrado`);

    // Verificar si ya hay una imagen principal para reemplazarla
    const existing = await this.prisma.productImage.findFirst({
      where: { producto_id: productId, es_principal: true },
    });

    if (existing) {
      // Eliminar el archivo físico anterior
      await this.deleteFileFromDisk(existing.url_imagen);
      // Eliminar el registro antiguo
      await this.prisma.productImage.delete({ where: { id: existing.id } });
    }

    // URL pública para acceder al archivo
    const url = `/static/products/${file.filename}`;

    const imagen = await this.prisma.productImage.create({
      data: {
        producto_id: productId,
        url_imagen: url,
        es_principal: true,
        orden_visual: 1,
        file_size: file.size,
        mime_type: file.mimetype,
      },
    });

    return imagen;
  }

  async deleteImage(productId: number, imagenId: string) {
    const imagen = await this.prisma.productImage.findFirst({
      where: { id: imagenId, producto_id: productId },
    });

    if (!imagen) throw new NotFoundException(`Imagen ${imagenId} no encontrada para el producto ${productId}`);

    // Eliminar archivo físico del disco
    await this.deleteFileFromDisk(imagen.url_imagen);

    // Eliminar registro de la BD
    await this.prisma.productImage.delete({ where: { id: imagenId } });

    return { message: 'Imagen eliminada correctamente' };
  }

  // ─── Helpers Privados ─────────────────────────────────────────────────────

  private async deleteFileFromDisk(urlImagen: string) {
    try {
      // La url_imagen viene como "/static/products/filename.ext"
      const filename = urlImagen.split('/').pop();
      if (filename) {
        const filepath = join(process.cwd(), 'uploads', 'products', filename);
        await unlink(filepath);
      }
    } catch {
      // Si el archivo ya no existe en disco, ignoramos el error
    }
  }
}
