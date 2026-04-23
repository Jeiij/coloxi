import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { QueryProductsDto } from './dto/query-products.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
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
    const where: Prisma.ProductWhereInput = {
      activo: activo,
    };

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

  async findOne(id: string): Promise<any> {
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
    return this.prisma.product.create({
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
  }

  async update(id: string, dto: UpdateProductDto, userId: string) {
    const { colores_ids, ...productData } = dto;
    
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
        })
      },
    });
  }

  async toggleActive(id: string, userId: string) {
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
}
