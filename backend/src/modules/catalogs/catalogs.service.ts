import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CatalogsService {
  constructor(private prisma: PrismaService) {}

  // ===== CATEGORÍAS =====
  async findAllCategories(activo?: string) {
    const where: any = {};
    if (activo !== 'all') {
      where.activo = true;
    }
    return this.prisma.category.findMany({ 
      where,
      orderBy: { nombre: 'asc' } 
    });
  }
  async createCategory(nombre: string) {
    return this.prisma.category.create({ data: { nombre } });
  }
  async updateCategory(id: number, nombre: string) {
    return this.prisma.category.update({ where: { id }, data: { nombre } });
  }
  async deleteCategory(id: number) {
    return this.prisma.category.update({ where: { id }, data: { activo: false } });
  }

  // ===== LÍNEAS =====
  async findAllLines(activo?: string) {
    const where: any = {};
    if (activo !== 'all') {
      where.activo = true;
    }
    return this.prisma.line.findMany({ 
      where,
      orderBy: { nombre: 'asc' } 
    });
  }
  async createLine(nombre: string) {
    return this.prisma.line.create({ data: { nombre } });
  }
  async updateLine(id: number, nombre: string) {
    return this.prisma.line.update({ where: { id }, data: { nombre } });
  }
  async deleteLine(id: number) {
    return this.prisma.line.update({ where: { id }, data: { activo: false } });
  }

  // ===== MARCAS =====
  async findAllBrands(activo?: string) {
    const where: any = {};
    if (activo !== 'all') {
      where.activo = true;
    }
    return this.prisma.brand.findMany({ 
      where,
      orderBy: { nombre: 'asc' } 
    });
  }
  async createBrand(nombre: string) {
    return this.prisma.brand.create({ data: { nombre } });
  }
  async updateBrand(id: number, nombre: string) {
    return this.prisma.brand.update({ where: { id }, data: { nombre } });
  }
  async deleteBrand(id: number) {
    return this.prisma.brand.update({ where: { id }, data: { activo: false } });
  }

  // ===== COLORES =====
  async findAllColors() {
    return this.prisma.color.findMany({ 
      orderBy: { nombre: 'asc' } 
    });
  }
  async createColor(nombre: string, codigo_hex: string) {
    return this.prisma.color.create({ data: { nombre, codigo_hex } });
  }
  async updateColor(id: number, nombre: string, codigo_hex: string) {
    return this.prisma.color.update({ where: { id }, data: { nombre, codigo_hex } });
  }
  async deleteColor(id: number) {
    console.log(`Intentando eliminar color ID: ${id}`);
    try {
      return await this.prisma.$transaction(async (tx) => {
        // Limpiamos las relaciones en la tabla intermedia primero por seguridad
        await tx.colorOnProduct.deleteMany({
          where: { color_id: id }
        });
        
        // Ahora eliminamos el color base
        return await tx.color.delete({
          where: { id }
        });
      });
    } catch (error) {
      console.error('Error en deleteColor:', error);
      throw error;
    }
  }
}
